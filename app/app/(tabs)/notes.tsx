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
        await Haptics.selectionAsync();
        player.seekTo(0);
        player.play();
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
  const [draft, setDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const { data: liveNotes } = useLiveQuery(
    db.select().from(notes).orderBy(desc(notes.createdAt)),
  );

  const closeSheet = () => setIsSheetVisible(false);
  const selectedNoteContent = selectedNote ? getPreview(selectedNote.content) : "";

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
    setIsVoiceComposerVisible(true);
  };

  const handleStartRecording = async () => {
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setHasVoiceRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      Alert.alert("Recording unavailable", "Unable to start a voice note right now.");
    }
  };

  const handleCancelRecording = async () => {
    if (recorderState.isRecording) {
      await audioRecorder.stop();
    }
    setIsVoiceComposerVisible(false);
  };

  const handleSaveRecording = async () => {
    if (isSavingVoiceNote) return;
    setIsSavingVoiceNote(true);

    try {
      if (recorderState.isRecording) {
        await audioRecorder.stop();
      }

      const uri = audioRecorder.uri;
      if (!hasVoiceRecording || !uri) {
        Alert.alert("No recording", "Record something before saving a voice note.");
        return;
      }

      await createNote(VOICE_NOTE_CONTENT, uri);
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
              <Text style={s.emptyTitle}>No notes yet</Text>
              <Text style={s.emptyBody}>
                Start writing and your notes will appear here, grouped by day.
              </Text>
            </AdaptiveBlurView>
          }
          renderSectionHeader={({ section }) => (
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>{section.title}</Text>
              <Text style={s.sectionMeta}>{section.data.length} items</Text>
            </View>
          )}
          renderItem={({ item, index, section }) => {
            const preview = getPreview(item.content);
            const trimmed = isTrimmed(item.content);
            const audioNote = isAudioNote(item);
            const shouldOpenDetail = Boolean(item.mediaUrl) || trimmed;
            const cardStyle = {
              ...s.card,
              ...(index === 0 ? s.cardFirst : {}),
              ...(index === section.data.length - 1 ? s.cardLast : {}),
            };
            return (
              <SwipeableRow
                onEdit={() => handleEditNote(item)}
                onDelete={() => handleDeleteNote(item)}
              >
                <Pressable
                  disabled={!shouldOpenDetail}
                  onPress={() => {
                    if (shouldOpenDetail) setSelectedNote(item);
                  }}
                >
                  <AdaptiveBlurView style={cardStyle}>
                    <View style={s.cardTopRow}>
                      <Text style={s.timeLabel}>{formatTime(item.createdAt ?? null)}</Text>
                    </View>
                    {audioNote && item.mediaUrl ? (
                      <AudioNotePlayer uri={item.mediaUrl} compact />
                    ) : item.mediaUrl ? (
                      <Image
                        source={{ uri: item.mediaUrl }}
                        style={s.noteImage}
                        resizeMode="cover"
                      />
                    ) : null}
                    {preview && !audioNote ? (
                      <View>
                        <Text style={s.noteBody} numberOfLines={6}>
                          {preview}
                        </Text>
                        {trimmed ? (
                          <Text style={s.trimmedHint}>... more</Text>
                        ) : null}
                      </View>
                    ) : null}
                    <View style={s.noteActions}>
                      <TouchableOpacity
                        style={s.noteActionButton}
                        onPress={() => copyNote(item)}
                      >
                        <Ionicons name="copy-outline" size={14} color={C.iconSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.noteActionButton}
                        onPress={() => shareNote(item)}
                      >
                        <Ionicons name="share-outline" size={14} color={C.iconSecondary} />
                      </TouchableOpacity>
                    </View>
                  </AdaptiveBlurView>
                </Pressable>
              </SwipeableRow>
            );
          }}
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

      <Modal
        animationType="slide"
        transparent
        visible={isSheetVisible}
        onRequestClose={closeSheet}
      >
        <Pressable style={s.sheetOverlay} onPress={closeSheet}>
          <Pressable
            style={[s.sheetWrap, { paddingBottom: insets.bottom + 20 }]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Add a note</Text>
            <Text style={s.sheetSubtitle}>Choose how you want to capture it.</Text>

            <TouchableOpacity style={s.sheetRow} onPress={handleOpenTextComposer}>
              <Ionicons name="create-outline" size={20} color={C.textPrimary} />
              <Text style={s.sheetRowLabel}>Text input</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.sheetRow} onPress={handlePasteNote}>
              <Ionicons name="clipboard-outline" size={20} color={C.textPrimary} />
              <Text style={s.sheetRowLabel}>Pasted input</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.sheetRow} onPress={handleVoiceNote}>
              <Ionicons name="mic-outline" size={20} color={C.textPrimary} />
              <Text style={s.sheetRowLabel}>Voice</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.sheetRow} onPress={handlePickImage}>
              <Ionicons name="image-outline" size={20} color={C.textPrimary} />
              <Text style={s.sheetRowLabel}>Image</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.sheetRow} onPress={handleOpenCamera}>
              <Ionicons name="camera-outline" size={20} color={C.textPrimary} />
              <Text style={s.sheetRowLabel}>Camera</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={isTextComposerVisible}
        onRequestClose={() => setIsTextComposerVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={s.keyboardAvoider}
        >
          <Pressable
            style={s.sheetOverlay}
            onPress={() => setIsTextComposerVisible(false)}
          >
            <Pressable
              style={[s.sheetWrap, { paddingBottom: 10 }]}
              onPress={(event) => event.stopPropagation()}
            >
              <View style={s.sheetHandle} />
              <Text style={s.sheetTitle}>
                {editingNoteId != null ? "Edit note" : "New note"}
              </Text>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Capture a thought, plan, or reminder..."
                placeholderTextColor={C.textPlaceholder}
                multiline
                autoFocus
                style={s.composerInput}
              />
              <TouchableOpacity style={s.primaryButton} onPress={handleSubmitTextNote}>
                <Text style={s.primaryButtonLabel}>
                  {editingNoteId != null ? "Update note" : "Save note"}
                </Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={isVoiceComposerVisible}
        onRequestClose={handleCancelRecording}
      >
        <Pressable style={s.sheetOverlay} onPress={handleCancelRecording}>
          <Pressable
            style={[s.sheetWrap, { paddingBottom: insets.bottom + 20 }]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Voice note</Text>
            <Text style={s.recordingTimer}>
              {formatDuration(recorderState.durationMillis)}
            </Text>
            <TouchableOpacity
              style={[
                s.recordButton,
                recorderState.isRecording ? s.recordButtonActive : null,
              ]}
              onPress={
                recorderState.isRecording
                  ? async () => {
                      await audioRecorder.stop();
                      await Haptics.selectionAsync();
                    }
                  : handleStartRecording
              }
            >
              <Ionicons
                name={recorderState.isRecording ? "stop" : "mic"}
                size={28}
                color={palette.white}
              />
            </TouchableOpacity>
            <View style={s.voiceActions}>
              <TouchableOpacity style={s.secondaryButton} onPress={handleCancelRecording}>
                <Text style={s.secondaryButtonLabel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  s.primaryButton,
                  !hasVoiceRecording ? s.primaryButtonDisabled : null,
                ]}
                disabled={!hasVoiceRecording || isSavingVoiceNote}
                onPress={handleSaveRecording}
              >
                <Text style={s.primaryButtonLabel}>
                  {isSavingVoiceNote ? "Saving..." : "Save note"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={selectedNote != null}
        onRequestClose={() => setSelectedNote(null)}
      >
        <View style={s.viewerOverlay}>
          <View style={[s.viewerCard, { marginBottom: insets.bottom + 24 }]}>
            <View style={s.viewerHeader}>
              <Text style={s.viewerTime}>
                {formatTime(selectedNote?.createdAt ?? null)}
              </Text>
              <TouchableOpacity onPress={() => setSelectedNote(null)}>
                <Ionicons name="close" size={20} color={C.iconSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={s.viewerScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.viewerScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {selectedNote && isAudioNote(selectedNote) && selectedNote.mediaUrl ? (
                <AudioNotePlayer uri={selectedNote.mediaUrl} />
              ) : selectedNote?.mediaUrl ? (
                <Image
                  source={{ uri: selectedNote.mediaUrl }}
                  style={s.viewerImage}
                  resizeMode="contain"
                />
              ) : null}
              {selectedNoteContent && !isAudioNote(selectedNote) ? (
                <Text style={s.viewerBody}>{selectedNoteContent}</Text>
              ) : null}
            </ScrollView>
            {selectedNote ? (
              <View style={s.viewerFooter}>
                <TouchableOpacity
                  style={s.viewerFooterButton}
                  onPress={() => copyNote(selectedNote)}
                >
                  <Ionicons name="copy-outline" size={16} color={C.iconSecondary} />
                  <Text style={s.viewerFooterLabel}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.viewerFooterButton}
                  onPress={() => shareNote(selectedNote)}
                >
                  <Ionicons name="share-outline" size={16} color={C.iconSecondary} />
                  <Text style={s.viewerFooterLabel}>Share</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
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
      marginTop: 12,
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
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    emptyCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 20,
      backgroundColor: C.cardBg,
    },
    emptyTitle: {
      color: C.textPrimary,
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 8,
    },
    emptyBody: {
      color: C.textSecondary,
      fontSize: 14,
      lineHeight: 21,
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
      color: C.textInverse,
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
      marginBottom: 22,
    },
    recordButtonActive: { backgroundColor: "#D94A38" },
    voiceActions: {
      flexDirection: "row",
      gap: 10,
    },
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
