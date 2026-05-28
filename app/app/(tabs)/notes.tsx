import GradientBackground from "@/components/GradientBackground";
import {
  AddNoteSheet,
  ImageViewerModal,
  ModelDownloadSheet,
  NoteListItem,
  NotesEmptyState,
  NotesListHeader,
  VoiceComposerModal,
} from "@/components/notes/notes-screen-components";
import {
  getNoteSections,
  getPreview,
  isAudioNote,
  VOICE_NOTE_CONTENT,
  type NoteKindFilter,
} from "@/components/notes/note-utils";
import { palette } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { db, noteOps, notes, type Note } from "@/lib/db";
import { extractTextFromImage } from "@/lib/ocr";
import {
  downloadModel,
  isModelDownloaded,
  transcribeAudio,
  type WhisperDownloadProgress,
} from "@/lib/whisper";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { desc } from "drizzle-orm";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Share,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const VOICE_NOTES_DIR = `${FileSystem.documentDirectory ?? ""}voice-notes/`;
const IMAGE_NOTES_DIR = `${FileSystem.documentDirectory ?? ""}image-notes/`;

async function enablePlaybackAudioMode() {
  await setAudioModeAsync({
    allowsRecording: false,
    playsInSilentMode: true,
  });
}

async function persistImage(sourceUri: string) {
  if (!FileSystem.documentDirectory) {
    throw new Error("Document directory unavailable.");
  }

  await FileSystem.makeDirectoryAsync(IMAGE_NOTES_DIR, { intermediates: true });

  const extensionMatch = sourceUri.match(/\.[a-z0-9]+(?=($|\?))/i);
  const extension = extensionMatch?.[0] ?? ".jpg";
  const destinationUri = `${IMAGE_NOTES_DIR}image-note-${Date.now()}${extension}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destinationUri,
  });

  return destinationUri;
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
  const [isModelSheetVisible, setIsModelSheetVisible] = useState(false);
  const [modelDownloadProgress, setModelDownloadProgress] = useState(0);
  const [isDownloadingModel, setIsDownloadingModel] = useState(false);
  const [pendingVoicePath, setPendingVoicePath] = useState<string | null>(null);
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

  const createNote = async (
    content: string,
    mediaUrl?: string | null,
    extra?: { transcribedText?: string; ocrText?: string }
  ) => {
    const normalizedContent = content.trim();
    if (!normalizedContent && !mediaUrl) return;

    const [created] = await noteOps.create({
      content: normalizedContent,
      mediaUrl: mediaUrl ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    return created;
  };

  const runTranscribeForNote = async (noteId: number, audioPath: string) => {
    try {
      const text = await transcribeAudio(audioPath);
      if (text) {
        await noteOps.update(noteId, { transcribedText: text });
      }
    } catch {
      // Transcription is best-effort; silently skip on failure.
    }
  };

  const runOcrForNote = async (noteId: number, imageUri: string) => {
    try {
      const text = await extractTextFromImage(imageUri);
      if (text) {
        await noteOps.update(noteId, { ocrText: text });
      }
    } catch {
      // OCR is best-effort; silently skip on failure.
    }
  };

  const handleDownloadModel = async () => {
    setIsDownloadingModel(true);
    try {
      await downloadModel((progress: WhisperDownloadProgress) => {
        const pct =
          progress.totalBytesExpectedToWrite > 0
            ? progress.totalBytesWritten / progress.totalBytesExpectedToWrite
            : 0;
        setModelDownloadProgress(pct);
      });
      setIsModelSheetVisible(false);
      setModelDownloadProgress(0);

      if (pendingVoicePath) {
        const path = pendingVoicePath;
        setPendingVoicePath(null);
        const created = await createNote(VOICE_NOTE_CONTENT, path);
        if (created?.id) {
          runTranscribeForNote(created.id, path);
        }
      }
    } catch {
      Alert.alert("Download failed", "Could not download Whisper model. Check your connection.");
    } finally {
      setIsDownloadingModel(false);
    }
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
            if (note.mediaUrl?.startsWith(IMAGE_NOTES_DIR)) {
              await FileSystem.deleteAsync(note.mediaUrl, { idempotent: true });
            }
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

      await enablePlaybackAudioMode();
      setHasVoiceRecording(false);
      setIsVoiceRecordingPaused(false);
      setIsVoiceComposerVisible(false);

      const modelReady = await isModelDownloaded();
      if (!modelReady) {
        setPendingVoicePath(persistedUri);
        setIsModelSheetVisible(true);
        return;
      }

      const created = await createNote(VOICE_NOTE_CONTENT, persistedUri);
      if (created?.id) {
        runTranscribeForNote(created.id, persistedUri);
      }
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
      const persistedUri = await persistImage(result.assets[0].uri);
      const created = await createNote("", persistedUri);
      if (created?.id) {
        runOcrForNote(created.id, persistedUri);
      }
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
        const persistedUri = await persistImage(result.assets[0].uri);
        const created = await createNote("", persistedUri);
        if (created?.id) {
          runOcrForNote(created.id, persistedUri);
        }
      }
    } catch (error) {
      const message =
        error instanceof Error && /simulator|camera not available/i.test(error.message)
          ? "Camera is not available on the iOS simulator. Use a real device for this action."
          : "Unable to open the camera right now.";
      Alert.alert("Camera unavailable", message);
    }
  };

  const sections = useMemo(
    () => getNoteSections(liveNotes ?? [], kindFilter, searchQuery),
    [kindFilter, liveNotes, searchQuery],
  );

  const s = makeScreenStyles(C);

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
            <NotesEmptyState
              onPasteNote={handlePasteNote}
              onTextNote={handleOpenTextComposer}
              onVoiceNote={handleVoiceNote}
            />
          }
          ListHeaderComponent={
            <NotesListHeader
              kindFilter={kindFilter}
              searchQuery={searchQuery}
              onChangeFilter={setKindFilter}
              onChangeSearch={setSearchQuery}
            />
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

      <ModelDownloadSheet
        bottomInset={insets.bottom}
        visible={isModelSheetVisible}
        isDownloading={isDownloadingModel}
        progress={modelDownloadProgress}
        onClose={() => {
          if (!isDownloadingModel) {
            setIsModelSheetVisible(false);
            if (pendingVoicePath) {
              createNote(VOICE_NOTE_CONTENT, pendingVoicePath);
              setPendingVoicePath(null);
            }
          }
        }}
        onDownload={handleDownloadModel}
      />
    </View>
  );
}

function makeScreenStyles(C: ReturnType<typeof import("@/hooks/useTheme").useTheme>) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: 20 },
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
  });
}
