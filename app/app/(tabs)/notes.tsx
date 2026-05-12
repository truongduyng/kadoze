import GradientBackground from "@/components/GradientBackground";
import AdaptiveBlurView from "@/components/ui/AdaptiveBlurView";
import { palette } from "@/constants/theme";
import { db, noteOps, notes, type Note } from "@/lib/db";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { desc } from "drizzle-orm";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

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
  return content.replace(/\s+/g, " ").trim();
}

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isTextComposerVisible, setIsTextComposerVisible] = useState(false);
  const [draft, setDraft] = useState("");
  const { data: liveNotes } = useLiveQuery(
    db.select().from(notes).orderBy(desc(notes.createdAt)),
  );

  const closeSheet = () => setIsSheetVisible(false);

  const createNote = async (content: string, mediaUrl?: string | null) => {
    const normalizedContent = content.trim();
    if (!normalizedContent && !mediaUrl) return;

    await noteOps.create({
      content: normalizedContent || "Image note",
      mediaUrl: mediaUrl ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubmitTextNote = async () => {
    if (!draft.trim()) return;
    await createNote(draft);
    setDraft("");
    setIsTextComposerVisible(false);
    closeSheet();
  };

  const handleOpenTextComposer = () => {
    closeSheet();
    setIsTextComposerVisible(true);
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

  const handleVoiceNote = () => {
    closeSheet();
    Alert.alert(
      "Voice unavailable",
      "Voice capture is currently disabled in this project.",
    );
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

  return (
    <View style={styles.container}>
      <GradientBackground />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingTop: 16, paddingBottom: insets.bottom + 96 },
          ]}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.heading}>Notes</Text>
            </View>
          }
          ListEmptyComponent={
            <AdaptiveBlurView style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No notes yet</Text>
              <Text style={styles.emptyBody}>
                Start writing and your notes will appear here, grouped by day.
              </Text>
            </AdaptiveBlurView>
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionMeta}>{section.data.length} items</Text>
            </View>
          )}
          renderItem={({ item, index, section }) => {
            const preview = getPreview(item.content);
            const cardStyle = {
              ...styles.card,
              ...(index === 0 ? styles.cardFirst : {}),
              ...(index === section.data.length - 1 ? styles.cardLast : {}),
            };
            return (
              <AdaptiveBlurView style={cardStyle}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.timeLabel}>{formatTime(item.createdAt ?? null)}</Text>
                </View>
                {item.mediaUrl ? (
                  <Image
                    source={{ uri: item.mediaUrl }}
                    style={styles.noteImage}
                    resizeMode="cover"
                  />
                ) : null}
                <Text style={styles.noteBody}>{preview || "Untitled note"}</Text>
              </AdaptiveBlurView>
            );
          }}
          SectionSeparatorComponent={() => <View style={styles.sectionSpacer} />}
        />
      </SafeAreaView>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setIsSheetVisible(true)}
        style={[styles.fab, { bottom: insets.bottom + 28 }]}
      >
        <AdaptiveBlurView style={styles.fabInner}>
          <Ionicons name="add" size={24} color={palette.white} />
        </AdaptiveBlurView>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent
        visible={isSheetVisible}
        onRequestClose={closeSheet}
      >
        <Pressable style={styles.sheetOverlay} onPress={closeSheet}>
          <Pressable
            style={[styles.sheetWrap, { paddingBottom: insets.bottom + 20 }]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add a note</Text>
            <Text style={styles.sheetSubtitle}>Choose how you want to capture it.</Text>

            <TouchableOpacity style={styles.sheetRow} onPress={handleOpenTextComposer}>
              <Ionicons name="create-outline" size={20} color={palette.white} />
              <Text style={styles.sheetRowLabel}>Text input</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetRow} onPress={handlePasteNote}>
              <Ionicons name="clipboard-outline" size={20} color={palette.white} />
              <Text style={styles.sheetRowLabel}>Pasted input</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetRow} onPress={handleVoiceNote}>
              <Ionicons name="mic-outline" size={20} color={palette.white} />
              <Text style={styles.sheetRowLabel}>Voice</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetRow} onPress={handlePickImage}>
              <Ionicons name="image-outline" size={20} color={palette.white} />
              <Text style={styles.sheetRowLabel}>Image</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetRow} onPress={handleOpenCamera}>
              <Ionicons name="camera-outline" size={20} color={palette.white} />
              <Text style={styles.sheetRowLabel}>Cam</Text>
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
        <Pressable
          style={styles.sheetOverlay}
          onPress={() => setIsTextComposerVisible(false)}
        >
          <Pressable
            style={[styles.sheetWrap, { paddingBottom: insets.bottom + 20 }]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>New note</Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Capture a thought, plan, or reminder..."
              placeholderTextColor={palette.white45}
              multiline
              autoFocus
              style={styles.composerInput}
            />
            <TouchableOpacity style={styles.primaryButton} onPress={handleSubmitTextNote}>
              <Text style={styles.primaryButtonLabel}>Save note</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  heading: {
    color: palette.white,
    fontSize: 28,
    fontWeight: "800",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    color: palette.white,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
  },
  sectionMeta: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "600",
  },
  sectionSpacer: {
    height: 20,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 8,
  },
  cardFirst: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  cardLast: {
    marginBottom: 0,
  },
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
    color: palette.white45,
    fontSize: 12,
    fontWeight: "600",
  },
  noteBody: {
    color: palette.white,
    fontSize: 15,
    lineHeight: 23,
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  emptyTitle: {
    color: palette.white,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyBody: {
    color: palette.white60,
    fontSize: 14,
    lineHeight: 21,
  },
  fab: {
    position: "absolute",
    right: 20,
  },
  fabInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.orange30,
    borderWidth: 1,
    borderColor: palette.orange35,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheetWrap: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#141414",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginBottom: 18,
  },
  sheetTitle: {
    color: palette.white,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
  },
  sheetSubtitle: {
    color: palette.white55,
    fontSize: 14,
    marginBottom: 18,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 10,
  },
  sheetRowLabel: {
    color: palette.white85,
    fontSize: 16,
    fontWeight: "600",
  },
  composerInput: {
    minHeight: 140,
    maxHeight: 240,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    color: palette.white,
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
  primaryButtonLabel: {
    color: "#121212",
    fontSize: 15,
    fontWeight: "800",
  },
});
