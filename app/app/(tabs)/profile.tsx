import React, { useMemo } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router } from "expo-router";
import GradientBackground from "@/components/GradientBackground";
import { db, profiles, habitCompletions, habits } from "@/lib/db";
import { resetDatabase } from "@/lib/db";
import { getLocalDateString, getTodayInLocalTimezone } from "@/lib/timezone";
import { DAY_NAMES } from "@/lib/performance";
import { countTodosByDate, computeStreaks } from "@/lib/performance";

const ORANGE = "#FB923C";

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const today = useMemo(() => getTodayInLocalTimezone(), []);

  const { data: profileData } = useLiveQuery(db.select().from(profiles).limit(1));
  const { data: allCompletions } = useLiveQuery(db.select().from(habitCompletions));
  const { data: allHabits } = useLiveQuery(db.select().from(habits));

  const profile = profileData?.[0];

  const { currentStreak, totalDone } = useMemo(() => {
    const completions = allCompletions ?? [];
    const todoCounts: Record<string, number> = {};
    for (const c of completions) {
      if (c.status === "done") {
        todoCounts[c.date] = (todoCounts[c.date] ?? 0) + 1;
      }
    }
    const { currentStreak } = computeStreaks(todoCounts);
    const totalDone = completions.filter((c) => c.status === "done").length;
    return { currentStreak, totalDone };
  }, [allCompletions]);

  const activeHabitCount = useMemo(() => {
    const todayName = DAY_NAMES[today.getDay()];
    return (allHabits ?? []).filter((h) => (h.daysOfWeek as string[]).includes(todayName)).length;
  }, [allHabits, today]);

  const handleReset = () => {
    Alert.alert(
      "Reset all data",
      "This will permanently delete everything. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await resetDatabase();
            router.replace("/onboarding");
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <GradientBackground />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 96 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Account</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{totalDone}</Text>
            <Text style={styles.statLabel}>Total Done</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{activeHabitCount}</Text>
            <Text style={styles.statLabel}>Active Habits</Text>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SETTINGS</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push("/settings" as any)}
            >
              <Text style={styles.rowLabel}>App Settings</Text>
              <Text style={styles.rowChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DANGER ZONE</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={handleReset}>
              <Text style={[styles.rowLabel, styles.danger]}>Reset all data</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 16,
    alignItems: "center",
  },
  statNum: {
    fontSize: 26,
    fontWeight: "800",
    color: ORANGE,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    marginTop: 4,
    textAlign: "center",
  },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "rgba(255,255,255,0.35)",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  rowLabel: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  rowChevron: {
    fontSize: 20,
    color: "rgba(255,255,255,0.3)",
  },
  danger: {
    color: "#FF6B6B",
  },
});
