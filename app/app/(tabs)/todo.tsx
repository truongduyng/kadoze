import GradientBackground from "@/components/GradientBackground";
import { db, habits, habitCompletions, completionOps } from "@/lib/db";
import { getTodayInLocalTimezone, getLocalDateString } from "@/lib/timezone";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import * as Haptics from "expo-haptics";
import React, { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DAY_NAMES } from "@/lib/performance";

const ORANGE = "#FB923C";

export default function RoutinesScreen() {
  const insets = useSafeAreaInsets();
  const today = useMemo(() => getTodayInLocalTimezone(), []);
  const todayKey = getLocalDateString(today);
  const todayName = DAY_NAMES[today.getDay()];

  const { data: allHabits } = useLiveQuery(db.select().from(habits));
  const { data: allCompletions } = useLiveQuery(db.select().from(habitCompletions));

  const todayHabits = useMemo(() => {
    const list = allHabits ?? [];
    return list.filter((h) => (h.daysOfWeek as string[]).includes(todayName));
  }, [allHabits, todayName]);

  const doneIds = useMemo(() => {
    const set = new Set<number>();
    for (const c of allCompletions ?? []) {
      if (c.date === todayKey && c.status === "done") set.add(c.habitId);
    }
    return set;
  }, [allCompletions, todayKey]);

  // Streak per habit
  const streakMap = useMemo(() => {
    const map: Record<number, number> = {};
    for (const h of allHabits ?? []) {
      const dates = (allCompletions ?? [])
        .filter((c) => c.habitId === h.id && c.status === "done")
        .map((c) => c.date)
        .sort()
        .reverse();

      let streak = 0;
      const cursor = new Date(today);
      cursor.setDate(cursor.getDate() - 1); // start from yesterday

      for (let i = 0; i < 365; i++) {
        const key = getLocalDateString(cursor);
        if (dates.includes(key)) {
          streak++;
          cursor.setDate(cursor.getDate() - 1);
        } else break;
      }
      // also count today if done
      if (doneIds.has(h.id)) streak++;
      map[h.id] = streak;
    }
    return map;
  }, [allHabits, allCompletions, doneIds, today]);

  // Unlock progress: done completions in last 30 days across all active habits
  const doneCount30 = useMemo(() => {
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffKey = getLocalDateString(cutoff);
    return (allCompletions ?? []).filter(
      (c) => c.status === "done" && c.date >= cutoffKey,
    ).length;
  }, [allCompletions, today]);

  const UNLOCK_TARGET = 30;
  const unlockProgress = Math.min(doneCount30, UNLOCK_TARGET);

  const toggle = async (habitId: number, isDone: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isDone) {
      await completionOps.markUndone(habitId, today);
    } else {
      await completionOps.markDone(habitId, today);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
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
        <Text style={styles.heading}>Routines</Text>

        {/* Active habits */}
        {todayHabits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ACTIVE HABITS</Text>
            <View style={styles.card}>
              {todayHabits.map((habit, i) => {
                const done = doneIds.has(habit.id);
                const streak = streakMap[habit.id] ?? 0;
                return (
                  <View key={habit.id}>
                    {i > 0 && <View style={styles.divider} />}
                    <Pressable
                      style={styles.habitRow}
                      onPress={() => toggle(habit.id, done)}
                    >
                      <Text style={styles.habitIcon}>{habit.icon ?? "⭐"}</Text>
                      <View style={styles.habitInfo}>
                        <Text style={[styles.habitTitle, done && styles.habitTitleDone]}>
                          {habit.title}
                        </Text>
                        {habit.subtitle && (
                          <Text style={styles.habitSubtitle}>{habit.subtitle}</Text>
                        )}
                      </View>
                      {streak > 0 && (
                        <View style={styles.streakBadge}>
                          <Text style={styles.streakText}>{streak}</Text>
                          <Text style={styles.streakLabel}>day streak</Text>
                        </View>
                      )}
                      <View style={[styles.checkbox, done && styles.checkboxDone]}>
                        {done && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Unlock progress */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>UNLOCK NEXT HABIT SLOT</Text>
          <View style={styles.card}>
            <Text style={styles.unlockText}>
              Complete {UNLOCK_TARGET} more days with all active habits to unlock a new slot.
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(unlockProgress / UNLOCK_TARGET) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressCount}>
              {unlockProgress} / {UNLOCK_TARGET} days
            </Text>
            <View style={[styles.habitRow, styles.lockedRow]}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.lockedLabel}>Next habit slot — Locked</Text>
            </View>
          </View>
        </View>

        {/* Well-being modules */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WELL-BEING MODULES</Text>
          <View style={[styles.card, styles.modulesCard]}>
            <View style={styles.module}>
              <Text style={styles.moduleIcon}>🙏</Text>
              <View style={styles.moduleInfo}>
                <Text style={styles.moduleTitle}>Gratitude</Text>
                <Text style={styles.moduleSubtitle}>3 daily prompts</Text>
              </View>
              <Text style={styles.moduleLock}>🔒</Text>
            </View>
            <View style={styles.moduleDivider} />
            <View style={styles.module}>
              <Text style={styles.moduleIcon}>🧠</Text>
              <View style={styles.moduleInfo}>
                <Text style={styles.moduleTitle}>Cognitive Reframing</Text>
                <Text style={styles.moduleSubtitle}>Shift perspective</Text>
              </View>
              <Text style={styles.moduleLock}>🔒</Text>
            </View>
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
  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "rgba(255,255,255,0.35)",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: 16,
  },
  habitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  habitIcon: { fontSize: 22, width: 28, textAlign: "center" },
  habitInfo: { flex: 1 },
  habitTitle: { fontSize: 15, fontWeight: "600", color: "#fff" },
  habitTitleDone: { color: "rgba(255,255,255,0.45)", textDecorationLine: "line-through" },
  habitSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  streakBadge: { alignItems: "flex-end" },
  streakText: { fontSize: 18, fontWeight: "800", color: ORANGE },
  streakLabel: { fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: -2 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: { backgroundColor: ORANGE, borderColor: ORANGE },
  checkmark: { fontSize: 12, color: "#fff", fontWeight: "700" },
  unlockText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    paddingHorizontal: 16,
    paddingTop: 14,
    lineHeight: 19,
  },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    marginHorizontal: 16,
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: ORANGE,
    borderRadius: 2,
  },
  progressCount: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    textAlign: "right",
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  lockedRow: { opacity: 0.4 },
  lockIcon: { fontSize: 16, width: 28, textAlign: "center" },
  lockedLabel: { fontSize: 15, color: "rgba(255,255,255,0.5)", flex: 1 },
  modulesCard: {},
  module: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  moduleDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: 16,
  },
  moduleIcon: { fontSize: 22, width: 28, textAlign: "center" },
  moduleInfo: { flex: 1 },
  moduleTitle: { fontSize: 15, fontWeight: "600", color: "rgba(255,255,255,0.5)" },
  moduleSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 },
  moduleLock: { fontSize: 14, opacity: 0.5 },
});
