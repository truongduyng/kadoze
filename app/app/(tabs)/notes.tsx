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
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
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

type NoteKindFilter = "all" | "text" | "image" | "voice";

const NOTE_KIND_FILTERS: {
  label: string;
  value: NoteKindFilter;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: "All", value: "all", icon: "albums-outline" },
  { label: "Text", value: "text", icon: "document-text-outline" },
  { label: "Images", value: "image", icon: "image-outline" },
  { label: "Voice", value: "voice", icon: "mic-outline" },
];

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

function renderFormattedText(content: string) {
  const parts: React.ReactNode[] = [];
  const markerPattern = /(\*\*[^*\n]+\*\*|_[^_\n]+_)/g;
  const displayContent = content.replace(/^-\s+/gm, "\u2022 ");
  let lastIndex = 0;

  for (const match of displayContent.matchAll(markerPattern)) {
    const value = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      parts.push(displayContent.slice(lastIndex, index));
    }

    if (value.startsWith("**")) {
      parts.push(
        <Text key={`${index}-bold`} style={{ fontWeight: "800" }}>
          {value.slice(2, -2)}
        </Text>,
      );
    } else {
      parts.push(
        <Text key={`${index}-italic`} style={{ fontStyle: "italic" }}>
          {value.slice(1, -1)}
        </Text>,
      );
    }

    lastIndex = index + value.length;
  }

  if (lastIndex < displayContent.length) {
    parts.push(displayContent.slice(lastIndex));
  }

  return parts.length ? parts : displayContent;
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

function getNoteKind(note: Pick<Note, "content" | "mediaUrl">): Exclude<NoteKindFilter, "all"> {
  if (isAudioNote(note)) return "voice";
  if (note.mediaUrl) return "image";
  return "text";
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
  const playerStatus = useAudioPlayerStatus(player);
  const C = useTheme();
  const s = makeStyles(C);

  return (
    <TouchableOpacity
      style={[s.audioPlayer, compact ? s.audioPlayerCompact : null]}
      onPress={async () => {
        try {
          await enablePlaybackAudioMode();
          await Haptics.selectionAsync();

          if (playerStatus.playing) {
            player.pause();
            return;
          }

          if (playerStatus.isLoaded && playerStatus.currentTime > 0) {
            await player.seekTo(0);
          }

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
        <Text style={s.audioSubtitle}>
          {playerStatus.playing ? "Tap to pause" : "Tap to play"}
        </Text>
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
  const imageNote = !audioNote && Boolean(note.mediaUrl);
  const [expanded, setExpanded] = useState(false);
  const lastSwipeStartedAt = useRef(0);

  return (
    <SwipeableRow
      onEdit={() => onEdit(note)}
      onDelete={() => onDelete(note)}
      onSwipeStart={() => {
        lastSwipeStartedAt.current = Date.now();
      }}
    >
      <Pressable
        disabled={!imageNote}
        onPress={() => {
          if (Date.now() - lastSwipeStartedAt.current < 400) {
            return;
          }

          if (imageNote) onOpenDetail(note);
        }}
      >
        <NoteCardSurface
          audioNote={audioNote}
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
              <Text style={s.noteBody} numberOfLines={trimmed && !expanded ? 6 : undefined}>
                {renderFormattedText(note.content.trim())}
              </Text>
              {trimmed ? (
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => setExpanded((current) => !current)}
                  style={s.trimmedButton}
                >
                  <Text style={s.trimmedHint}>{expanded ? "View less" : "View more"}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </NoteCardSurface>
      </Pressable>
    </SwipeableRow>
  );
}

function NoteCardSurface({
  audioNote,
  children,
  style,
}: {
  audioNote: boolean;
  children: React.ReactNode;
  style: React.ComponentProps<typeof View>["style"];
}) {
  if (audioNote) {
    return <View style={style}>{children}</View>;
  }

  return <AdaptiveBlurView style={style}>{children}</AdaptiveBlurView>;
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

          <View style={s.sheetGrid}>
            <TouchableOpacity style={s.sheetGridItem} onPress={onTextNote} activeOpacity={0.75}>
              <View style={s.sheetGridIcon}>
                <Ionicons name="create-outline" size={26} color={C.textPrimary} />
              </View>
              <Text style={s.sheetGridLabel}>Text</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.sheetGridItem} onPress={onPasteNote} activeOpacity={0.75}>
              <View style={s.sheetGridIcon}>
                <Ionicons name="clipboard-outline" size={26} color={C.textPrimary} />
              </View>
              <Text style={s.sheetGridLabel}>Paste</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.sheetGridItem} onPress={onVoiceNote} activeOpacity={0.75}>
              <View style={s.sheetGridIcon}>
                <Ionicons name="mic-outline" size={26} color={C.textPrimary} />
              </View>
              <Text style={s.sheetGridLabel}>Voice</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.sheetGridItem} onPress={onPickImage} activeOpacity={0.75}>
              <View style={s.sheetGridIcon}>
                <Ionicons name="image-outline" size={26} color={C.textPrimary} />
              </View>
              <Text style={s.sheetGridLabel}>Image</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.sheetGridItem} onPress={onOpenCamera} activeOpacity={0.75}>
              <View style={s.sheetGridIcon}>
                <Ionicons name="camera-outline" size={26} color={C.textPrimary} />
              </View>
              <Text style={s.sheetGridLabel}>Camera</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
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

type ImageViewerModalProps = {
  bottomInset: number;
  topInset: number;
  note: Note | null;
  onClose: () => void;
  onShare: (note: Note) => void;
};

function ImageViewerModal({
  bottomInset,
  topInset,
  note,
  onClose,
  onShare,
}: ImageViewerModalProps) {
  const C = useTheme();
  const s = makeStyles(C);
  const imageNote = note && !isAudioNote(note) && note.mediaUrl ? note : null;
  const caption = imageNote ? getPreview(imageNote.content) : "";

  return (
    <Modal
      animationType="fade"
      transparent
      visible={imageNote != null}
      onRequestClose={onClose}
    >
      <Pressable style={s.imageViewerOverlay} onPress={onClose}>
        <Pressable
          style={[
            s.imageViewerFrame,
            { paddingTop: topInset + 12, paddingBottom: bottomInset + 18 },
          ]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={s.imageViewerTopBar}>
            <Text style={s.imageViewerTime}>
              {formatTime(imageNote?.createdAt ?? null)}
            </Text>
            <View style={s.imageViewerTopActions}>
              {imageNote ? (
                <TouchableOpacity
                  accessibilityLabel="Share image note"
                  activeOpacity={0.78}
                  style={s.imageViewerIconButton}
                  onPress={() => onShare(imageNote)}
                >
                  <Ionicons name="share-outline" size={18} color={palette.white} />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                accessibilityLabel="Close image viewer"
                onPress={onClose}
                style={s.imageViewerIconButton}
              >
                <Ionicons name="close" size={20} color={palette.white} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.imageViewerStage}>
            {imageNote?.mediaUrl ? (
              <Image
                source={{ uri: imageNote.mediaUrl }}
                style={s.imageViewerImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
          <View style={s.imageViewerBottomBar}>
            <View style={s.imageViewerMeta}>
              {caption ? (
                <Text style={s.imageViewerCaption} numberOfLines={2}>
                  {caption}
                </Text>
              ) : null}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const C = useTheme();
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isVoiceComposerVisible, setIsVoiceComposerVisible] = useState(false);
  const [isSavingVoiceNote, setIsSavingVoiceNote] = useState(false);
  const [hasVoiceRecording, setHasVoiceRecording] = useState(false);
  const [isVoiceRecordingPaused, setIsVoiceRecordingPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<NoteKindFilter>("all");
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
    if (note.mediaUrl) {
      await Share.share({
        url: note.mediaUrl,
        message: content || "Image note",
      });
      return;
    }

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

  const handleOpenTextComposer = () => {
    closeSheet();
    router.push("/note-composer");
  };

  const handleEditNote = (note: Note) => {
    setIsSheetVisible(false);
    router.push({
      pathname: "/note-composer",
      params: { noteId: String(note.id) },
    });
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

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const sections = useMemo<NoteSection[]>(() => {
    const items = (liveNotes ?? []).filter((item) => {
      const preview = getPreview(item.content);
      if (preview === "...") return false;
      if (kindFilter !== "all" && getNoteKind(item) !== kindFilter) return false;
      if (!normalizedSearchQuery) return true;

      const searchableKind = getNoteKind(item);
      return (
        preview.toLowerCase().includes(normalizedSearchQuery) ||
        searchableKind.includes(normalizedSearchQuery)
      );
    });
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
  }, [kindFilter, liveNotes, normalizedSearchQuery]);

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
          ListHeaderComponent={
            <View style={s.listHeader}>
              <View style={s.titleRow}>
                <View>
                  <Text style={s.screenTitle}>Notes</Text>
                </View>
              </View>

              <View style={s.searchBox}>
                <Ionicons name="search" size={18} color={C.iconTertiary} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search notes"
                  placeholderTextColor={C.textPlaceholder}
                  style={s.searchInput}
                  returnKeyType="search"
                />
                {searchQuery ? (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => setSearchQuery("")}
                    style={s.searchClearButton}
                  >
                    <Ionicons name="close" size={15} color={C.iconSecondary} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.filterChips}
              >
                {NOTE_KIND_FILTERS.map((filter) => {
                  const selected = filter.value === kindFilter;
                  return (
                    <TouchableOpacity
                      key={filter.value}
                      activeOpacity={0.82}
                      onPress={() => setKindFilter(filter.value)}
                      style={[s.filterChip, selected ? s.filterChipActive : null]}
                    >
                      <Ionicons
                        name={filter.icon}
                        size={15}
                        color={selected ? palette.white : C.iconSecondary}
                      />
                      <Text
                        style={[
                          s.filterChipLabel,
                          selected ? s.filterChipLabelActive : null,
                        ]}
                      >
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
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

      <ImageViewerModal
        bottomInset={insets.bottom}
        topInset={insets.top}
        note={selectedNote}
        onClose={() => setSelectedNote(null)}
        onShare={shareNote}
      />
    </View>
  );
}

function makeStyles(C: ReturnType<typeof import("@/hooks/useTheme").useTheme>) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: 20 },
    listHeader: {
      gap: 14,
      marginBottom: 20,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 14,
    },
    screenEyebrow: {
      color: C.textTertiary,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.4,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    screenTitle: {
      color: C.textPrimary,
      fontSize: 24,
      fontWeight: "700",
      letterSpacing: 0,
    },
    notesCount: {
      color: C.textTertiary,
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 5,
    },
    searchBox: {
      minHeight: 50,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.inputBorder,
      backgroundColor: C.inputBg,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
    },
    searchInput: {
      flex: 1,
      height: "100%",
      color: C.textPrimary,
      fontSize: 15,
      fontWeight: "600",
      paddingVertical: 0,
      textAlignVertical: "center",
    },
    searchClearButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    filterChips: {
      gap: 9,
      paddingRight: 20,
    },
    filterChip: {
      minHeight: 30,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.cardBg,
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 8,
    },
    filterChipActive: {
      backgroundColor: palette.orange,
      borderColor: palette.orange,
    },
    filterChipLabel: {
      color: C.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      paddingRight: 4,
    },
    filterChipLabelActive: {
      color: palette.white,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
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
    sectionSpacer: { height: 12 },
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
    },
    trimmedButton: {
      alignSelf: "flex-start",
      paddingTop: 8,
      paddingBottom: 2,
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
    sheetGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    sheetGridItem: {
      width: "30%",
      flexGrow: 1,
      minHeight: 90,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.cardBg,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 16,
    },
    sheetGridIcon: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: C.inputBg,
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    sheetGridLabel: {
      color: C.textPrimary,
      fontSize: 13,
      fontWeight: "700",
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
    imageViewerOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.94)",
    },
    imageViewerFrame: {
      flex: 1,
      paddingHorizontal: 16,
    },
    imageViewerTopBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      minHeight: 44,
      marginBottom: 10,
    },
    imageViewerTime: {
      color: palette.white70,
      fontSize: 13,
      fontWeight: "700",
    },
    imageViewerIconButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.12)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
    },
    imageViewerTopActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    imageViewerStage: {
      flex: 1,
      minHeight: 240,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    imageViewerImage: {
      width: "100%",
      height: "100%",
    },
    imageViewerBottomBar: {
      minHeight: 76,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingTop: 14,
    },
    imageViewerMeta: {
      flex: 1,
      gap: 3,
    },
    imageViewerTitle: {
      color: palette.white,
      fontSize: 16,
      fontWeight: "800",
    },
    imageViewerCaption: {
      color: palette.white70,
      fontSize: 13,
      lineHeight: 18,
    },
  });
}
