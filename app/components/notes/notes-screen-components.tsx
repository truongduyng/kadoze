import { SwipeableRow } from "@/components/todo/SwipeableRow";
import AdaptiveBlurView from "@/components/ui/AdaptiveBlurView";
import { palette } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import type { Note } from "@/lib/db";
import { Ionicons } from "@expo/vector-icons";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  formatDuration,
  formatTime,
  getPreview,
  isAudioNote,
  isTrimmed,
  renderFormattedText,
  type NoteKindFilter,
} from "./note-utils";

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

const SWIPE_IGNORE_MS = 400;

async function enablePlaybackAudioMode() {
  await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
}

function AudioNotePlayer({ compact = false, uri }: { compact?: boolean; uri: string }) {
  const C = useTheme();
  const s = styles(C);
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);

  async function handlePress() {
    try {
      await enablePlaybackAudioMode();
      await Haptics.selectionAsync();

      if (status.playing) {
        player.pause();
        return;
      }

      if (status.isLoaded && status.currentTime > 0) {
        await player.seekTo(0);
      }

      player.play();
    } catch {
      Alert.alert("Playback unavailable", "Unable to play this voice note right now.");
    }
  }

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[s.audioPlayer, compact && s.audioPlayerCompact]}
      onPress={handlePress}
    >
      <View style={s.audioIcon}>
        <Ionicons
          name={status.playing ? "pause" : "play"}
          size={compact ? 14 : 16}
          color={palette.white}
        />
      </View>
      <View style={s.audioTextWrap}>
        <Text style={s.audioTitle}>Voice note</Text>
        <Text style={s.audioSubtitle}>{status.playing ? "Tap to pause" : "Tap to play"}</Text>
      </View>
    </TouchableOpacity>
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
  if (audioNote) return <View style={style}>{children}</View>;
  return <AdaptiveBlurView style={style}>{children}</AdaptiveBlurView>;
}

function NoteSheetAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const C = useTheme();
  const s = styles(C);
  return (
    <TouchableOpacity style={s.sheetGridItem} onPress={onPress} activeOpacity={0.75}>
      <View style={s.sheetGridIcon}>
        <Ionicons name={icon} size={26} color={C.textPrimary} />
      </View>
      <Text style={s.sheetGridLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

type NoteListItemProps = {
  index: number;
  isLast: boolean;
  note: Note;
  onCopy: (note: Note) => void;
  onDelete: (note: Note) => void;
  onEdit: (note: Note) => void;
  onOpenDetail: (note: Note) => void;
  onShare: (note: Note) => void;
};

export function NoteListItem({
  index,
  isLast,
  note,
  onCopy,
  onDelete,
  onEdit,
  onOpenDetail,
  onShare,
}: NoteListItemProps) {
  const C = useTheme();
  const s = styles(C);
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
      onSwipeStart={() => { lastSwipeStartedAt.current = Date.now(); }}
    >
      <Pressable
        disabled={!imageNote}
        onPress={() => {
          if (Date.now() - lastSwipeStartedAt.current < SWIPE_IGNORE_MS) return;
          if (imageNote) onOpenDetail(note);
        }}
      >
        <NoteCardSurface
          audioNote={audioNote}
          style={[s.card, index === 0 && s.cardFirst, isLast && s.cardLast]}
        >
          <View style={s.cardTopRow}>
            <Text style={s.timeLabel}>{formatTime(note.createdAt ?? null)}</Text>
            <View style={s.noteActions}>
              <TouchableOpacity style={s.noteActionButton} onPress={() => onCopy(note)}>
                <Ionicons name="copy-outline" size={14} color={C.iconSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={s.noteActionButton} onPress={() => onShare(note)}>
                <Ionicons name="share-outline" size={14} color={C.iconSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          {audioNote && note.mediaUrl ? (
            <AudioNotePlayer uri={note.mediaUrl} compact />
          ) : note.mediaUrl ? (
            <Image source={{ uri: note.mediaUrl }} style={s.noteImage} resizeMode="contain" />
          ) : null}
          {preview && !audioNote ? (
            <View>
              <Text style={s.noteBody} numberOfLines={trimmed && !expanded ? 6 : undefined}>
                {renderFormattedText(note.content.trim())}
              </Text>
              {trimmed ? (
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => setExpanded((v) => !v)}
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

export function AddNoteSheet({
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
  const s = styles(C);

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={s.sheetOverlay} onPress={onClose}>
        <Pressable
          style={[s.sheetWrap, { paddingBottom: bottomInset + 20 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Add a note</Text>
          <Text style={s.sheetSubtitle}>Choose how you want to capture it.</Text>
          <View style={s.sheetGrid}>
            <NoteSheetAction icon="create-outline" label="Text" onPress={onTextNote} />
            <NoteSheetAction icon="clipboard-outline" label="Paste" onPress={onPasteNote} />
            <NoteSheetAction icon="mic-outline" label="Voice" onPress={onVoiceNote} />
            <NoteSheetAction icon="image-outline" label="Image" onPress={onPickImage} />
            <NoteSheetAction icon="camera-outline" label="Camera" onPress={onOpenCamera} />
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

export function VoiceComposerModal({
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
  const s = styles(C);

  const recordIcon = isRecording ? "pause" : isPaused ? "play" : "mic";
  const recordLabel = isRecording
    ? "Pause recording"
    : isPaused
    ? "Continue recording"
    : "Start recording";

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onCancel}>
      <Pressable style={s.sheetOverlay} onPress={onCancel}>
        <Pressable
          style={[s.sheetWrap, { paddingBottom: bottomInset + 20 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Voice note</Text>
          <Text style={s.recordingTimer}>{formatDuration(durationMillis)}</Text>
          <View style={s.recordActionWrap}>
            <TouchableOpacity
              style={[
                s.recordButton,
                isRecording && s.recordButtonActive,
                isPaused && s.recordButtonPaused,
              ]}
              onPress={onToggleRecording}
              activeOpacity={0.82}
            >
              <Ionicons name={recordIcon} size={28} color={palette.white} />
            </TouchableOpacity>
            <Text style={s.recordActionLabel}>{recordLabel}</Text>
          </View>
          <View style={s.voiceActions}>
            <TouchableOpacity style={s.secondaryButton} onPress={onCancel}>
              <Text style={s.secondaryButtonLabel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.primaryButton, s.voicePrimaryButton, !hasRecording && s.primaryButtonDisabled]}
              disabled={!hasRecording || isSaving}
              onPress={onSave}
            >
              <Text style={s.primaryButtonLabel}>{isSaving ? "Saving..." : "Save"}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type ImageViewerModalProps = {
  bottomInset: number;
  note: Note | null;
  topInset: number;
  onClose: () => void;
  onShare: (note: Note) => void;
};

export function ImageViewerModal({
  bottomInset,
  note,
  topInset,
  onClose,
  onShare,
}: ImageViewerModalProps) {
  const C = useTheme();
  const s = styles(C);
  const imageNote = note && !isAudioNote(note) && note.mediaUrl ? note : null;
  const caption = imageNote ? getPreview(imageNote.content) : "";

  return (
    <Modal animationType="fade" transparent visible={imageNote != null} onRequestClose={onClose}>
      <Pressable style={s.imageViewerOverlay} onPress={onClose}>
        <Pressable
          style={[
            s.imageViewerFrame,
            { paddingTop: topInset + 12, paddingBottom: bottomInset + 18 },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={s.imageViewerTopBar}>
            <Text style={s.imageViewerTime}>{formatTime(imageNote?.createdAt ?? null)}</Text>
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

type NotesEmptyStateProps = {
  onPasteNote: () => void;
  onTextNote: () => void;
  onVoiceNote: () => void;
};

export function NotesEmptyState({ onPasteNote, onTextNote, onVoiceNote }: NotesEmptyStateProps) {
  const C = useTheme();
  const s = styles(C);

  return (
    <AdaptiveBlurView style={s.emptyCard}>
      <View style={s.emptyIconWrap}>
        <Ionicons name="journal-outline" size={30} color={C.accentText} />
      </View>
      <Text style={s.emptyEyebrow}>NOTES</Text>
      <Text style={s.emptyTitle}>Capture what matters</Text>
      <Text style={s.emptyBody}>
        Save thoughts, images, pasted text, or voice notes. Everything you add here will be grouped
        by day.
      </Text>
      <View style={s.emptyActions}>
        <TouchableOpacity activeOpacity={0.85} onPress={onTextNote} style={s.emptyPrimaryButton}>
          <Ionicons name="create-outline" size={18} color={palette.white} />
          <Text style={s.emptyPrimaryLabel}>Write note</Text>
        </TouchableOpacity>
        <View style={s.emptySecondaryRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPasteNote}
            style={s.emptySecondaryButton}
          >
            <Ionicons name="clipboard-outline" size={17} color={C.iconSecondary} />
            <Text style={s.emptySecondaryLabel}>Paste</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onVoiceNote}
            style={s.emptySecondaryButton}
          >
            <Ionicons name="mic-outline" size={17} color={C.iconSecondary} />
            <Text style={s.emptySecondaryLabel}>Voice</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AdaptiveBlurView>
  );
}

type NotesListHeaderProps = {
  kindFilter: NoteKindFilter;
  searchQuery: string;
  onChangeFilter: (filter: NoteKindFilter) => void;
  onChangeSearch: (query: string) => void;
};

export function NotesListHeader({
  kindFilter,
  searchQuery,
  onChangeFilter,
  onChangeSearch,
}: NotesListHeaderProps) {
  const C = useTheme();
  const s = styles(C);

  return (
    <View style={s.listHeader}>
      <View style={s.titleRow}>
        <Text style={s.screenTitle}>Notes</Text>
      </View>
      <View style={s.searchBox}>
        <Ionicons name="search" size={18} color={C.iconTertiary} />
        <TextInput
          value={searchQuery}
          onChangeText={onChangeSearch}
          placeholder="Search notes"
          placeholderTextColor={C.textPlaceholder}
          style={s.searchInput}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => onChangeSearch("")}
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
              onPress={() => onChangeFilter(filter.value)}
              style={[s.filterChip, selected && s.filterChipActive]}
            >
              <Ionicons
                name={filter.icon}
                size={15}
                color={selected ? palette.white : C.iconSecondary}
              />
              <Text style={[s.filterChipLabel, selected && s.filterChipLabelActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function styles(C: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    listHeader: { gap: 14, marginBottom: 20 },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 14,
    },
    screenTitle: { color: C.textPrimary, fontSize: 24, fontWeight: "700", letterSpacing: 0 },
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
    filterChips: { gap: 9, paddingRight: 20 },
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
    filterChipActive: { backgroundColor: palette.orange, borderColor: palette.orange },
    filterChipLabel: { color: C.textSecondary, fontSize: 13, fontWeight: "600", paddingRight: 4 },
    filterChipLabelActive: { color: palette.white },
    card: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingHorizontal: 16,
      paddingVertical: 15,
      backgroundColor: C.cardBg,
      marginBottom: 8,
    },
    cardFirst: { borderTopLeftRadius: 14, borderTopRightRadius: 14 },
    cardLast: { marginBottom: 0 },
    cardTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 12,
    },
    noteImage: { width: "100%", height: 180, borderRadius: 10, marginBottom: 12 },
    timeLabel: { color: C.textTertiary, fontSize: 12, fontWeight: "600" },
    noteBody: { color: C.textPrimary, fontSize: 15, lineHeight: 23 },
    trimmedHint: { color: palette.orange, fontSize: 13, fontWeight: "700" },
    trimmedButton: { alignSelf: "flex-start", paddingTop: 8, paddingBottom: 2 },
    noteActions: { flexDirection: "row", gap: 8 },
    noteActionButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      padding: 6,
      borderRadius: 999,
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
      backgroundColor: C.accent,
      borderWidth: 1,
      borderColor: C.accent,
    },
    audioTextWrap: { flex: 1 },
    audioTitle: { color: C.textPrimary, fontSize: 15, fontWeight: "700" },
    audioSubtitle: { color: C.textSecondary, fontSize: 12, fontWeight: "600", marginTop: 2 },
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
    emptyActions: { width: "100%", gap: 10, marginTop: 22 },
    emptyPrimaryButton: {
      minHeight: 50,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: palette.orange,
    },
    emptyPrimaryLabel: { color: palette.white, fontSize: 15, fontWeight: "800" },
    emptySecondaryRow: { flexDirection: "row", gap: 10 },
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
    emptySecondaryLabel: { color: C.textSecondary, fontSize: 14, fontWeight: "700" },
    sheetOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: C.overlayBg },
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
    sheetTitle: { color: C.textPrimary, fontSize: 22, fontWeight: "800", marginBottom: 6 },
    sheetSubtitle: { color: C.textSecondary, fontSize: 14, marginBottom: 18 },
    sheetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
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
    sheetGridLabel: { color: C.textPrimary, fontSize: 13, fontWeight: "700" },
    primaryButton: {
      borderRadius: 14,
      backgroundColor: palette.orange,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 15,
    },
    primaryButtonDisabled: { opacity: 0.45 },
    primaryButtonLabel: { color: palette.white, fontSize: 15, fontWeight: "800" },
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
    secondaryButtonLabel: { color: C.textSecondary, fontSize: 15, fontWeight: "700" },
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
    recordActionWrap: { alignItems: "center", gap: 10, marginBottom: 22 },
    recordActionLabel: { color: C.textSecondary, fontSize: 13, fontWeight: "700" },
    voiceActions: { flexDirection: "row", gap: 10 },
    voicePrimaryButton: { flex: 1 },
    imageViewerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.94)" },
    imageViewerFrame: { flex: 1, paddingHorizontal: 16 },
    imageViewerTopBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      minHeight: 44,
      marginBottom: 10,
    },
    imageViewerTime: { color: palette.white70, fontSize: 13, fontWeight: "700" },
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
    imageViewerTopActions: { flexDirection: "row", alignItems: "center", gap: 8 },
    imageViewerStage: {
      flex: 1,
      minHeight: 240,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    imageViewerImage: { width: "100%", height: "100%" },
    imageViewerBottomBar: {
      minHeight: 76,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingTop: 14,
    },
    imageViewerMeta: { flex: 1, gap: 3 },
    imageViewerCaption: { color: palette.white70, fontSize: 13, lineHeight: 18 },
  });
}
