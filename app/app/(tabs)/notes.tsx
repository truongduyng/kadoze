import GradientBackground from "@/components/GradientBackground";
import AdaptiveBlurView from "@/components/ui/AdaptiveBlurView";
import { palette } from "@/constants/theme";
import { db, notes, type Note } from "@/lib/db";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { desc } from "drizzle-orm";
import React, { useMemo } from "react";
import {
  SectionList,
  StyleSheet,
  Text,
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
  const { data: liveNotes } = useLiveQuery(
    db.select().from(notes).orderBy(desc(notes.createdAt)),
  );

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
              <AdaptiveBlurView
                style={cardStyle}
              >
                <View style={styles.cardTopRow}>
                  <Text style={styles.timeLabel}>{formatTime(item.createdAt ?? null)}</Text>
                </View>
                <Text style={styles.noteBody}>{preview || "Untitled note"}</Text>
              </AdaptiveBlurView>
            );
          }}
          SectionSeparatorComponent={() => <View style={styles.sectionSpacer} />}
        />
      </SafeAreaView>
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
});
