import GradientBackground from "@/components/GradientBackground";
import { SwipeableRow } from "@/components/todo/SwipeableRow";
import AdaptiveBlurView from "@/components/ui/AdaptiveBlurView";
import { palette } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { db, noteOps, notes, type Note } from "@/lib/db";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { desc } from "drizzle-orm";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Share,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const VOICE_NOTE_CONTENT = "Voice note";
const VOICE_NOTES_DIR = `${FileSystem.documentDirectory ?? ""}voice-notes/`;

type NoteSection = {
  title: string;
  dateKey: string;
  data: Note[];
};

function getLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatSectionTitle(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === yesterday.getTime()) return "Yesterday";

  return date.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function formatTime(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getPreview(content: string): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  return normalized === "Image note" ? "" : normalized;
}

function isTrimmed(content: string, maxLength = 220): boolean {
  return getPreview(content).length > maxLength;
}

function formatDuration(milliseconds = 0): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function isAudioNote(note: Pick<Note, "content" | "mediaUrl"> | null): boolean {
  if (!note?.mediaUrl) return false;
  return (
    note.content === VOICE_NOTE_CONTENT ||
    /\.(aac|caf|m4a|mp3|wav)(\?|#|$)/i.test(note.mediaUrl)
  );
}

async function enablePlaybackAudioMode() {
  await setAudioModeAsync({
    allowsRecording: false,
    playsInSilentMode: true,
  });
}

async function persistVoiceNote(sourceUri: string) {
  if (!FileSystem.documentDirectory) {
    throw new Error("Document directory unavailable.");
  }

  await FileSystem.makeDirectoryAsync(VOICE_NOTES_DIR, { intermediates: true });

  const extensionMatch = sourceUri.match(/\.[a-z0-9]+(?=($|\?))/i);
  const extension = extensionMatch?.[0] ?? ".m4a";
  const destinationUri = `${VOICE_NOTES_DIR}voice-note-${Date.now()}${extension}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destinationUri,
  });

  return destinationUri;
}

function AudioNotePlayer({
  uri,
  compact = false,
}: {
  uri: string;
  compact?: boolean;
}) {
  const player = useAudioPlayer({ uri });
  const C = useTheme();
  const s = makeStyles(C);

  return (
    <TouchableOpacity
      style={[s.audioPlayer, compact ? s.audioPlayerCompact : null]}
      onPress={async () => {
        try {
          await enablePlaybackAudioMode();
          await Haptics.selectionAsync();
          await player.seekTo(0);
          player.play();
        } catch {
          Alert.alert("Playback unavailable", "Unable to play this voice note right now.");
        }
      }}
    >
      <View style={s.audioIcon}>
        <Ionicons name="play" size={compact ? 14 : 16} color={palette.white} />
      </View>
      <View style={s.audioTextWrap}>
        <Text style={s.audioTitle}>Voice note</Text>
        <Text style={s.audioSubtitle}>Tap to play</Text>
      </View>
    </TouchableOpacity>
  );
}

type NoteItemProps = {
  note: Note;
  index: number;
  isLast: boolean;
  onCopy: (note: Note) => void;
  onDelete: (note: Note) => void;
  onEdit: (note: Note) => void;
  onOpenDetail: (note: Note) => void;
  onShare: (note: Note) => void;
};

function NoteListItem({
  note,
  index,
  isLast,
  onCopy,
  onDelete,
  onEdit,
  onOpenDetail,
  onShare,
}: NoteItemProps) {
  const C = useTheme();
  const s = makeStyles(C);
  const preview = getPreview(note.content);
  const trimmed = isTrimmed(note.content);
  const audioNote = isAudioNote(note);
  const shouldOpenDetail = !audioNote && (Boolean(note.mediaUrl) || trimmed);

  return (
    <SwipeableRow
      onEdit={() => onEdit(note)}
      onDelete={() => onDelete(note)}
    >
      <Pressable
        disabled={!shouldOpenDetail}
        onPress={() => {
          if (shouldOpenDetail) onOpenDetail(note);
        }}
      >
        <AdaptiveBlurView
          style={[
            s.card,
            index === 0 ? s.cardFirst : null,
            isLast ? s.cardLast : null,
          ]}
        >
          <View style={s.cardTopRow}>
            <Text style={s.timeLabel}>{formatTime(note.createdAt ?? null)}</Text>
            <View style={s.noteActions}>
              <TouchableOpacity
                style={s.noteActionButton}
                onPress={() => onCopy(note)}
              >
                <Ionicons name="copy-outline" size={14} color={C.iconSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={s.noteActionButton}
                onPress={() => onShare(note)}
              >
                <Ionicons name="share-outline" size={14} color={C.iconSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          {audioNote && note.mediaUrl ? (
            <AudioNotePlayer uri={note.mediaUrl} compact />
          ) : note.mediaUrl ? (
            <Image
              source={{ uri: note.mediaUrl }}
              style={s.noteImage}
              resizeMode="contain"
            />
          ) : null}
          {preview && !audioNote ? (
            <View>
              <Text style={s.noteBody} numberOfLines={6}>
                {preview}
              </Text>
              {trimmed ? <Text style={s.trimmedHint}>... more</Text> : null}
            </View>
          ) : null}
        </AdaptiveBlurView>
      </Pressable>
    </SwipeableRow>
  );
}

type AddNoteSheetProps = {
  bottomInset: number;
  visible: boolean;
  onClose: () => void;
  onOpenCamera: () => void;
  onPickImage: () => void;
  onPasteNote: () => void;
  onTextNote: () => void;
  onVoiceNote: () => void;
};

function AddNoteSheet({
  bottomInset,
  visible,
  onClose,
  onOpenCamera,
  onPickImage,
  onPasteNote,
  onTextNote,
  onVoiceNote,
}: AddNoteSheetProps) {
  const C = useTheme();
  const s = makeStyles(C);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={s.sheetOverlay} onPress={onClose}>
        <Pressable
          style={[s.sheetWrap, { paddingBottom: bottomInset + 20 }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Add a note</Text>
          <Text style={s.sheetSubtitle}>Choose how you want to capture it.</Text>

          <TouchableOpacity style={s.sheetRow} onPress={onTextNote}>
            <Ionicons name="create-outline" size={20} color={C.textPrimary} />
            <Text style={s.sheetRowLabel}>Text input</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.sheetRow} onPress={onPasteNote}>
            <Ionicons name="clipboard-outline" size={20} color={C.textPrimary} />
            <Text style={s.sheetRowLabel}>Pasted input</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.sheetRow} onPress={onVoiceNote}>
            <Ionicons name="mic-outline" size={20} color={C.textPrimary} />
            <Text style={s.sheetRowLabel}>Voice</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.sheetRow} onPress={onPickImage}>
            <Ionicons name="image-outline" size={20} color={C.textPrimary} />
            <Text style={s.sheetRowLabel}>Image</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.sheetRow} onPress={onOpenCamera}>
            <Ionicons name="camera-outline" size={20} color={C.textPrimary} />
            <Text style={s.sheetRowLabel}>Camera</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type TextComposerModalProps = {
  draft: string;
  editing: boolean;
  visible: boolean;
  onChangeDraft: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

function TextComposerModal({
  draft,
  editing,
  visible,
  onChangeDraft,
  onClose,
  onSubmit,
}: TextComposerModalProps) {
  const C = useTheme();
  const s = makeStyles(C);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={s.keyboardAvoider}
      >
        <Pressable style={s.sheetOverlay} onPress={onClose}>
          <Pressable
            style={[s.sheetWrap, { paddingBottom: 10 }]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>{editing ? "Edit note" : "New note"}</Text>
            <TextInput
              value={draft}
              onChangeText={onChangeDraft}
              placeholder="Capture a thought, plan, or reminder..."
              placeholderTextColor={C.textPlaceholder}
              multiline
              autoFocus
              style={s.composerInput}
            />
            <TouchableOpacity style={s.primaryButton} onPress={onSubmit}>
              <Text style={s.primaryButtonLabel}>
                {editing ? "Update" : "Save"}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type VoiceComposerModalProps = {
  bottomInset: number;
  durationMillis: number;
  hasRecording: boolean;
  isPaused: boolean;
  isRecording: boolean;
  isSaving: boolean;
  visible: boolean;
  onCancel: () => void;
  onSave: () => void;
  onToggleRecording: () => void;
};

function VoiceComposerModal({
  bottomInset,
  durationMillis,
  hasRecording,
  isPaused,
  isRecording,
  isSaving,
  visible,
  onCancel,
  onSave,
  onToggleRecording,
}: VoiceComposerModalProps) {
  const C = useTheme();
  const s = makeStyles(C);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onCancel}
    >
      <Pressable style={s.sheetOverlay} onPress={onCancel}>
        <Pressable
          style={[s.sheetWrap, { paddingBottom: bottomInset + 20 }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Voice note</Text>
          <Text style={s.recordingTimer}>
            {formatDuration(durationMillis)}
          </Text>
          <View style={s.recordActionWrap}>
            <TouchableOpacity
              style={[
                s.recordButton,
                isRecording ? s.recordButtonActive : null,
                isPaused ? s.recordButtonPaused : null,
              ]}
              onPress={onToggleRecording}
              activeOpacity={0.82}
            >
              <Ionicons
                name={isRecording ? "pause" : isPaused ? "play" : "mic"}
                size={28}
                color={palette.white}
              />
            </TouchableOpacity>
            <Text style={s.recordActionLabel}>
              {isRecording
                ? "Pause recording"
                : isPaused
                  ? "Continue recording"
                  : "Start recording"}
            </Text>
          </View>
          <View style={s.voiceActions}>
            <TouchableOpacity style={s.secondaryButton} onPress={onCancel}>
              <Text style={s.secondaryButtonLabel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                s.primaryButton,
                s.voicePrimaryButton,
                !hasRecording ? s.primaryButtonDisabled : null,
              ]}
              disabled={!hasRecording || isSaving}
              onPress={onSave}
            >
              <Text style={s.primaryButtonLabel}>
                {isSaving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type NoteViewerModalProps = {
  bottomInset: number;
  note: Note | null;
  onClose: () => void;
  onCopy: (note: Note) => void;
  onShare: (note: Note) => void;
};

function NoteViewerModal({
  bottomInset,
  note,
  onClose,
  onCopy,
  onShare,
}: NoteViewerModalProps) {
  const C = useTheme();
  const s = makeStyles(C);
  const content = note ? getPreview(note.content) : "";

  return (
    <Modal
      animationType="fade"
      transparent
      visible={note != null}
      onRequestClose={onClose}
    >
      <View style={s.viewerOverlay}>
        <View style={[s.viewerCard, { marginBottom: bottomInset + 24 }]}>
          <View style={s.viewerHeader}>
            <Text style={s.viewerTime}>
              {formatTime(note?.createdAt ?? null)}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={C.iconSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={s.viewerScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.viewerScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {note && isAudioNote(note) && note.mediaUrl ? (
              <AudioNotePlayer uri={note.mediaUrl} />
            ) : note?.mediaUrl ? (
              <Image
                source={{ uri: note.mediaUrl }}
                style={s.viewerImage}
                resizeMode="contain"
              />
            ) : null}
            {content && !isAudioNote(note) ? (
              <Text style={s.viewerBody}>{content}</Text>
            ) : null}
          </ScrollView>
          {note ? (
            <View style={s.viewerFooter}>
              <TouchableOpacity
                style={s.viewerFooterButton}
                onPress={() => onCopy(note)}
              >
                <Ionicons name="copy-outline" size={16} color={C.iconSecondary} />
                <Text style={s.viewerFooterLabel}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.viewerFooterButton}
                onPress={() => onShare(note)}
              >
                <Ionicons name="share-outline" size={16} color={C.iconSecondary} />
                <Text style={s.viewerFooterLabel}>Share</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const C = useTheme();
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isTextComposerVisible, setIsTextComposerVisible] = useState(false);
  const [isVoiceComposerVisible, setIsVoiceComposerVisible] = useState(false);
  const [isSavingVoiceNote, setIsSavingVoiceNote] = useState(false);
  const [hasVoiceRecording, setHasVoiceRecording] = useState(false);
  const [isVoiceRecordingPaused, setIsVoiceRecordingPaused] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const { data: liveNotes } = useLiveQuery(
    db.select().from(notes).orderBy(desc(notes.createdAt)),
  );

  const closeSheet = () => setIsSheetVisible(false);

  const copyNote = async (note: Note) => {
    const content = getPreview(note.content);
    if (!content) {
      Alert.alert("Nothing to copy", "This note does not contain text.");
      return;
    }
    await Clipboard.setStringAsync(content);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const shareNote = async (note: Note) => {
    if (isAudioNote(note) && note.mediaUrl) {
      await Share.share({ url: note.mediaUrl, message: "Voice note" });
      return;
    }

    const content = getPreview(note.content);
    if (!content) {
      Alert.alert("Nothing to share", "This note does not contain text.");
      return;
    }
    await Share.share({ message: content });
  };

  const createNote = async (content: string, mediaUrl?: string | null) => {
    const normalizedContent = content.trim();
    if (!normalizedContent && !mediaUrl) return;

    await noteOps.create({
      content: normalizedContent,
      mediaUrl: mediaUrl ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubmitTextNote = async () => {
    if (!draft.trim()) return;
    if (editingNoteId != null) {
      await noteOps.update(editingNoteId, {
        content: draft.trim(),
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      await createNote(draft);
    }
    setDraft("");
    setEditingNoteId(null);
    setIsTextComposerVisible(false);
    closeSheet();
  };

  const handleOpenTextComposer = () => {
    closeSheet();
    setEditingNoteId(null);
    setDraft("");
    setIsTextComposerVisible(true);
  };

  const handleEditNote = (note: Note) => {
    setIsSheetVisible(false);
    setEditingNoteId(note.id);
    setDraft(note.content);
    setIsTextComposerVisible(true);
  };

  const handleDeleteNote = (note: Note) => {
    Alert.alert(
      "Delete note",
      "This note will be removed permanently.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await noteOps.delete(note.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ],
    );
  };

  const handlePasteNote = async () => {
    closeSheet();
    const value = await Clipboard.getStringAsync();
    if (!value.trim()) {
      Alert.alert("Clipboard empty", "There is no text in your clipboard right now.");
      return;
    }

    await createNote(value);
  };

  const handleVoiceNote = async () => {
    closeSheet();
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Microphone unavailable", "Microphone access was not granted.");
      return;
    }

    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });
    setHasVoiceRecording(false);
    setIsVoiceRecordingPaused(false);
    setIsVoiceComposerVisible(true);
  };

  const handleToggleRecording = async () => {
    try {
      if (recorderState.isRecording) {
        audioRecorder.pause();
        setIsVoiceRecordingPaused(true);
        await Haptics.selectionAsync();
        return;
      }

      if (!hasVoiceRecording) {
        await audioRecorder.prepareToRecordAsync();
        setHasVoiceRecording(true);
      }

      audioRecorder.record();
      setIsVoiceRecordingPaused(false);
      setHasVoiceRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      Alert.alert("Recording unavailable", "Unable to start a voice note right now.");
    }
  };

  const handleCancelRecording = async () => {
    if (hasVoiceRecording || recorderState.isRecording) {
      try {
        await audioRecorder.stop();
      } catch {
        // The recorder may already be stopped after an interruption.
      }
    }
    await enablePlaybackAudioMode();
    setHasVoiceRecording(false);
    setIsVoiceRecordingPaused(false);
    setIsVoiceComposerVisible(false);
  };

  const handleSaveRecording = async () => {
    if (isSavingVoiceNote) return;
    setIsSavingVoiceNote(true);

    try {
      if (recorderState.isRecording) {
        await audioRecorder.stop();
      } else if (hasVoiceRecording) {
        await audioRecorder.stop();
      }

      const uri = audioRecorder.uri;
      if (!hasVoiceRecording || !uri) {
        Alert.alert("No recording", "Record something before saving a voice note.");
        return;
      }

      const persistedUri = await persistVoiceNote(uri);

      await createNote(VOICE_NOTE_CONTENT, persistedUri);
      await enablePlaybackAudioMode();
      setHasVoiceRecording(false);
      setIsVoiceRecordingPaused(false);
      setIsVoiceComposerVisible(false);
    } catch {
      Alert.alert("Save failed", "Unable to save this voice note right now.");
    } finally {
      setIsSavingVoiceNote(false);
    }
  };

  const handlePickImage = async () => {
    closeSheet();
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Photos unavailable", "Photo library access was not granted.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
      legacy: true,
      presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
    });

    if (!result.canceled && result.assets.length > 0) {
      await createNote("", result.assets[0].uri);
    }
  };

  const handleOpenCamera = async () => {
    closeSheet();
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Camera unavailable",
          "Camera access was not granted.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        await createNote("", result.assets[0].uri);
      }
    } catch (error) {
      const message =
        error instanceof Error && /simulator|camera not available/i.test(error.message)
          ? "Camera is not available on the iOS simulator. Use a real device for this action."
          : "Unable to open the camera right now.";
      Alert.alert("Camera unavailable", message);
    }
  };

  const sections = useMemo<NoteSection[]>(() => {
    const items = (liveNotes ?? []).filter((item) => getPreview(item.content) !== "...");
    const grouped = new Map<string, Note[]>();

    for (const item of items) {
      const key = getLocalDateKey(new Date(item.createdAt));
      const group = grouped.get(key);
      if (group) {
        group.push(item);
      } else {
        grouped.set(key, [item]);
      }
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateKey, data]) => ({
        title: formatSectionTitle(dateKey),
        dateKey,
        data,
      }));
  }, [liveNotes]);

  const s = makeStyles(C);

  return (
    <View style={s.container}>
      <GradientBackground />
      <SafeAreaView style={s.container} edges={["top"]}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            s.content,
            { paddingTop: 16, paddingBottom: insets.bottom + 96 },
          ]}
          ListEmptyComponent={
            <AdaptiveBlurView style={s.emptyCard}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="journal-outline" size={30} color={C.accentText} />
              </View>
              <Text style={s.emptyEyebrow}>NOTES</Text>
              <Text style={s.emptyTitle}>Capture what matters</Text>
              <Text style={s.emptyBody}>
                Save thoughts, images, pasted text, or voice notes. Everything you add here will be
                grouped by day.
              </Text>
              <View style={s.emptyActions}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleOpenTextComposer}
                  style={s.emptyPrimaryButton}
                >
                  <Ionicons name="create-outline" size={18} color={palette.white} />
                  <Text style={s.emptyPrimaryLabel}>Write note</Text>
                </TouchableOpacity>
                <View style={s.emptySecondaryRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handlePasteNote}
                    style={s.emptySecondaryButton}
                  >
                    <Ionicons name="clipboard-outline" size={17} color={C.iconSecondary} />
                    <Text style={s.emptySecondaryLabel}>Paste</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleVoiceNote}
                    style={s.emptySecondaryButton}
                  >
                    <Ionicons name="mic-outline" size={17} color={C.iconSecondary} />
                    <Text style={s.emptySecondaryLabel}>Voice</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </AdaptiveBlurView>
          }
          renderSectionHeader={({ section }) => (
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>{section.title}</Text>
              <Text style={s.sectionMeta}>{section.data.length} items</Text>
            </View>
          )}
          renderItem={({ item, index, section }) => (
            <NoteListItem
              note={item}
              index={index}
              isLast={index === section.data.length - 1}
              onCopy={copyNote}
              onDelete={handleDeleteNote}
              onEdit={handleEditNote}
              onOpenDetail={setSelectedNote}
              onShare={shareNote}
            />
          )}
          SectionSeparatorComponent={() => <View style={s.sectionSpacer} />}
        />
      </SafeAreaView>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setIsSheetVisible(true)}
        style={[s.fab, { bottom: insets.bottom + 28 }]}
      >
        <View style={s.fabInner}>
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      <AddNoteSheet
        bottomInset={insets.bottom}
        visible={isSheetVisible}
        onClose={closeSheet}
        onOpenCamera={handleOpenCamera}
        onPickImage={handlePickImage}
        onPasteNote={handlePasteNote}
        onTextNote={handleOpenTextComposer}
        onVoiceNote={handleVoiceNote}
      />

      <TextComposerModal
        draft={draft}
        editing={editingNoteId != null}
        visible={isTextComposerVisible}
        onChangeDraft={setDraft}
        onClose={() => setIsTextComposerVisible(false)}
        onSubmit={handleSubmitTextNote}
      />

      <VoiceComposerModal
        bottomInset={insets.bottom}
        durationMillis={recorderState.durationMillis}
        hasRecording={hasVoiceRecording}
        isPaused={isVoiceRecordingPaused}
        isRecording={recorderState.isRecording}
        isSaving={isSavingVoiceNote}
        visible={isVoiceComposerVisible}
        onCancel={handleCancelRecording}
        onSave={handleSaveRecording}
        onToggleRecording={handleToggleRecording}
      />

      <NoteViewerModal
        bottomInset={insets.bottom}
        note={selectedNote}
        onClose={() => setSelectedNote(null)}
        onCopy={copyNote}
        onShare={shareNote}
      />
    </View>
  );
}

function makeStyles(C: ReturnType<typeof import("@/hooks/useTheme").useTheme>) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: 20 },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    sectionTitle: {
      color: C.textPrimary,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.5,
      textTransform: "uppercase",
    },
    sectionMeta: {
      color: C.textTertiary,
      fontSize: 11,
      fontWeight: "600",
    },
    sectionSpacer: { height: 20 },
    card: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingHorizontal: 16,
      paddingVertical: 15,
      backgroundColor: C.cardBg,
      marginBottom: 8,
    },
    cardFirst: {
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
    },
    cardLast: { marginBottom: 0 },
    cardTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 12,
    },
    noteImage: {
      width: "100%",
      height: 180,
      borderRadius: 10,
      marginBottom: 12,
    },
    timeLabel: {
      color: C.textTertiary,
      fontSize: 12,
      fontWeight: "600",
    },
    noteBody: {
      color: C.textPrimary,
      fontSize: 15,
      lineHeight: 23,
    },
    trimmedHint: {
      color: palette.orange,
      fontSize: 13,
      fontWeight: "700",
      marginTop: 6,
    },
    noteActions: {
      flexDirection: "row",
      gap: 8,
    },
    audioPlayer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.cardBg,
      padding: 14,
      marginBottom: 12,
    },
    audioPlayerCompact: { marginBottom: 0 },
    audioIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: palette.orange30,
      borderWidth: 1,
      borderColor: palette.orange35,
    },
    audioTextWrap: { flex: 1 },
    audioTitle: {
      color: C.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    audioSubtitle: {
      color: C.textSecondary,
      fontSize: 12,
      fontWeight: "600",
      marginTop: 2,
    },
    noteActionButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      padding: 6,
      borderRadius: 999,
    },
    emptyCard: {
      alignItems: "center",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingHorizontal: 22,
      paddingVertical: 28,
      backgroundColor: C.cardBg,
    },
    emptyIconWrap: {
      width: 62,
      height: 62,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: C.accentBg,
      borderWidth: 1,
      borderColor: C.accentBorder,
      marginBottom: 16,
    },
    emptyEyebrow: {
      color: C.textTertiary,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.4,
      marginBottom: 8,
    },
    emptyTitle: {
      color: C.textPrimary,
      fontSize: 22,
      fontWeight: "800",
      marginBottom: 8,
      textAlign: "center",
    },
    emptyBody: {
      color: C.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      textAlign: "center",
      maxWidth: 310,
    },
    emptyActions: {
      width: "100%",
      gap: 10,
      marginTop: 22,
    },
    emptyPrimaryButton: {
      minHeight: 50,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: palette.orange,
    },
    emptyPrimaryLabel: {
      color: palette.white,
      fontSize: 15,
      fontWeight: "800",
    },
    emptySecondaryRow: {
      flexDirection: "row",
      gap: 10,
    },
    emptySecondaryButton: {
      flex: 1,
      minHeight: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.inputBg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },
    emptySecondaryLabel: {
      color: C.textSecondary,
      fontSize: 14,
      fontWeight: "700",
    },
    fab: {
      position: "absolute",
      right: 20,
      shadowColor: palette.orange,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    fabInner: {
      width: 58,
      height: 58,
      borderRadius: 29,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: palette.orange,
    },
    sheetOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: C.overlayBg,
    },
    keyboardAvoider: { flex: 1 },
    sheetWrap: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: C.sheetBg,
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    sheetHandle: {
      width: 42,
      height: 5,
      borderRadius: 999,
      backgroundColor: C.sheetHandle,
      alignSelf: "center",
      marginBottom: 18,
    },
    sheetTitle: {
      color: C.textPrimary,
      fontSize: 22,
      fontWeight: "800",
      marginBottom: 6,
    },
    sheetSubtitle: {
      color: C.textSecondary,
      fontSize: 14,
      marginBottom: 18,
    },
    sheetRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderRadius: 14,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingHorizontal: 16,
      paddingVertical: 15,
      marginBottom: 10,
    },
    sheetRowLabel: {
      color: C.textPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
    composerInput: {
      minHeight: 140,
      maxHeight: 240,
      borderRadius: 18,
      backgroundColor: C.inputBg,
      borderWidth: 1,
      borderColor: C.inputBorder,
      color: C.textPrimary,
      fontSize: 16,
      lineHeight: 24,
      paddingHorizontal: 16,
      paddingVertical: 16,
      textAlignVertical: "top",
      marginTop: 10,
      marginBottom: 14,
    },
    primaryButton: {
      borderRadius: 14,
      backgroundColor: palette.orange,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 15,
    },
    primaryButtonDisabled: { opacity: 0.45 },
    primaryButtonLabel: {
      color: palette.white,
      fontSize: 15,
      fontWeight: "800",
    },
    secondaryButton: {
      flex: 1,
      borderRadius: 14,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.cardBorder,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 15,
    },
    secondaryButtonLabel: {
      color: C.textSecondary,
      fontSize: 15,
      fontWeight: "700",
    },
    recordingTimer: {
      color: C.textPrimary,
      fontSize: 40,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
      textAlign: "center",
      marginTop: 18,
      marginBottom: 18,
    },
    recordButton: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: palette.orange,
      borderWidth: 1,
      borderColor: palette.orange35,
    },
    recordButtonActive: { backgroundColor: "#D94A38" },
    recordButtonPaused: { backgroundColor: "#2F80ED" },
    recordActionWrap: {
      alignItems: "center",
      gap: 10,
      marginBottom: 22,
    },
    recordActionLabel: {
      color: C.textSecondary,
      fontSize: 13,
      fontWeight: "700",
    },
    voiceActions: {
      flexDirection: "row",
      gap: 10,
    },
    voicePrimaryButton: { flex: 1 },
    viewerOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      paddingHorizontal: 16,
      paddingTop: 40,
      backgroundColor: C.overlayBg,
    },
    viewerCard: {
      maxHeight: "85%",
      borderRadius: 24,
      backgroundColor: C.sheetBg,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 18,
    },
    viewerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    viewerTime: {
      color: C.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },
    viewerImage: {
      width: "100%",
      height: 280,
      borderRadius: 14,
      marginBottom: 14,
    },
    viewerBody: {
      color: C.textPrimary,
      fontSize: 16,
      lineHeight: 25,
    },
    viewerScroll: { flexGrow: 0 },
    viewerScrollContent: { paddingBottom: 8 },
    viewerFooter: {
      flexDirection: "row",
      gap: 10,
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: C.divider,
    },
    viewerFooterButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    viewerFooterLabel: {
      color: C.textSecondary,
      fontSize: 14,
      fontWeight: "700",
    },
  });
}
