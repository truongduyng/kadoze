import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import GradientBackground from "@/components/GradientBackground";
import { db, habitCompletions, habits, notes, profiles } from "@/lib/db";
import { DAY_NAMES } from "@/lib/performance";
import { getTodayInLocalTimezone } from "@/lib/timezone";
import { palette } from "@/constants/theme";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const today = useMemo(() => getTodayInLocalTimezone(), []);

  const { data: profileData } = useLiveQuery(db.select().from(profiles).limit(1));
  const { data: allCompletions } = useLiveQuery(db.select().from(habitCompletions));
  const { data: allHabits } = useLiveQuery(db.select().from(habits));
  const { data: allNotes } = useLiveQuery(db.select().from(notes));

  const profile = profileData?.[0];

  const analytics = useMemo(() => {
    const completions = allCompletions ?? [];
    const habitsData = allHabits ?? [];
    const notesData = allNotes ?? [];

    const doneCompletions = completions.filter((item) => item.status === "done");
    const trackedCompletions = completions.filter(
      (item) => item.status === "done" || item.status === "skipped",
    );

    const doneByDate = new Map<string, number>();
    for (const item of doneCompletions) {
      doneByDate.set(item.date, (doneByDate.get(item.date) ?? 0) + 1);
    }

    let currentStreak = 0;
    const cursor = new Date(today);
    while ((doneByDate.get(formatDateKey(cursor)) ?? 0) > 0) {
      currentStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const todayName = DAY_NAMES[today.getDay()];
    const activeToday = habitsData.filter((habit) =>
      (habit.daysOfWeek as string[]).includes(todayName),
    ).length;

    const completionRate = trackedCompletions.length
      ? Math.round((doneCompletions.length / trackedCompletions.length) * 100)
      : 0;

    const weekActivity = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const dateKey = formatDateKey(date);
      return {
        label: WEEKDAY_LABELS[date.getDay()],
        count: doneByDate.get(dateKey) ?? 0,
      };
    });

    const bestDayCount = Math.max(...weekActivity.map((item) => item.count), 1);

    return {
      currentStreak,
      totalDone: doneCompletions.length,
      activeToday,
      completionRate,
      notesCount: notesData.length,
      habitsCount: habitsData.length,
      weekActivity,
      bestDayCount,
    };
  }, [allCompletions, allHabits, allNotes, today]);

  const initials = useMemo(() => {
    const name = profile?.name?.trim();
    if (!name) return "U";
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [profile?.name]);

  const memberSince = useMemo(() => {
    if (!profile?.createdAt) return "Just joined";
    return new Date(profile.createdAt).toLocaleDateString([], {
      month: "short",
      year: "numeric",
    });
  }, [profile?.createdAt]);

  return (
    <View style={styles.container}>
      <GradientBackground />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 96,
          paddingHorizontal: 20,
          gap: 18,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text selectable style={styles.eyebrow}>
          PROFILE
        </Text>

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.avatar}>
              <Text selectable style={styles.avatarText}>
                {initials}
              </Text>
            </View>
            <Pressable style={styles.settingsChip} onPress={() => router.push("/settings")}>
              <Ionicons name="settings-outline" size={18} color={palette.white80} />
            </Pressable>
          </View>

          <Text selectable style={styles.name}>
            {profile?.name?.trim() || "User"}
          </Text>
          <Text selectable style={styles.subhead}>
            Building consistency one day at a time.
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text selectable style={styles.metaLabel}>
                Member since {memberSince}
              </Text>
            </View>
            <View style={styles.metaPill}>
              <Text selectable style={styles.metaLabel}>
                {profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text selectable style={styles.sectionLabel}>
            Analytics
          </Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text selectable style={styles.metricValue}>
                {analytics.currentStreak}
              </Text>
              <Text selectable style={styles.metricTitle}>
                Current streak
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text selectable style={styles.metricValue}>
                {analytics.totalDone}
              </Text>
              <Text selectable style={styles.metricTitle}>
                Total check-ins
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text selectable style={styles.metricValue}>
                {analytics.completionRate}%
              </Text>
              <Text selectable style={styles.metricTitle}>
                Completion rate
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text selectable style={styles.metricValue}>
                {analytics.activeToday}
              </Text>
              <Text selectable style={styles.metricTitle}>
                Habits today
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text selectable style={styles.sectionLabel}>
            Weekly rhythm
          </Text>
          <View style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <View>
                <Text selectable style={styles.activityTitle}>
                  Last 7 days
                </Text>
                <Text selectable style={styles.activityCaption}>
                  Done habits per day
                </Text>
              </View>
              <Text selectable style={styles.activitySummary}>
                {analytics.notesCount} notes
              </Text>
            </View>

            <View style={styles.chartRow}>
              {analytics.weekActivity.map((item, index) => (
                <View key={`${index}-${item.label}`} style={styles.chartColumn}>
                  <Text selectable style={styles.chartCount}>
                    {item.count}
                  </Text>
                  <View style={styles.chartTrack}>
                    <View
                      style={[
                        styles.chartFill,
                        {
                          height: `${Math.max(
                            12,
                            (item.count / analytics.bestDayCount) * 100,
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text selectable style={styles.chartLabel}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  eyebrow: {
    color: palette.white40,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.8,
  },
  heroCard: {
    backgroundColor: "rgba(12,14,18,0.62)",
    borderRadius: 28,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: palette.white08,
    padding: 20,
    gap: 14,
    boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 22,
    borderCurve: "continuous",
    backgroundColor: palette.orange15,
    borderWidth: 1,
    borderColor: palette.orange35,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: palette.orange,
    fontSize: 24,
    fontWeight: "800",
  },
  settingsChip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.white08,
    borderWidth: 1,
    borderColor: palette.white10,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    color: palette.white,
    fontSize: 28,
    fontWeight: "800",
  },
  subhead: {
    color: palette.white60,
    fontSize: 15,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metaPill: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: palette.white06,
    borderWidth: 1,
    borderColor: palette.white08,
  },
  metaLabel: {
    color: palette.white70,
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    color: palette.white40,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    width: "47%",
    minHeight: 116,
    borderRadius: 24,
    borderCurve: "continuous",
    backgroundColor: palette.white06,
    borderWidth: 1,
    borderColor: palette.white08,
    padding: 16,
    justifyContent: "space-between",
  },
  metricValue: {
    color: palette.white,
    fontSize: 32,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  metricTitle: {
    color: palette.white60,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  activityCard: {
    borderRadius: 28,
    borderCurve: "continuous",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: palette.white08,
    padding: 18,
    gap: 20,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  activityTitle: {
    color: palette.white,
    fontSize: 18,
    fontWeight: "700",
  },
  activityCaption: {
    color: palette.white50,
    fontSize: 13,
    marginTop: 4,
  },
  activitySummary: {
    color: palette.orange,
    fontSize: 13,
    fontWeight: "700",
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
  },
  chartColumn: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  chartCount: {
    color: palette.white60,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  chartTrack: {
    width: "100%",
    height: 128,
    borderRadius: 20,
    borderCurve: "continuous",
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "flex-end",
    overflow: "hidden",
    padding: 6,
  },
  chartFill: {
    width: "100%",
    borderRadius: 14,
    borderCurve: "continuous",
    backgroundColor: palette.orange,
    minHeight: 10,
  },
  chartLabel: {
    color: palette.white50,
    fontSize: 11,
    fontWeight: "700",
  },
  summaryCard: {
    borderRadius: 24,
    borderCurve: "continuous",
    backgroundColor: palette.white06,
    borderWidth: 1,
    borderColor: palette.white08,
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summaryLabel: {
    color: palette.white75,
    fontSize: 15,
    fontWeight: "500",
  },
  summaryValue: {
    color: palette.white,
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  summaryDivider: {
    height: 1,
    backgroundColor: palette.white08,
  },
  summaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summaryActionText: {
    color: palette.orange,
    fontSize: 15,
    fontWeight: "700",
  },
  summaryChevron: {
    color: palette.white40,
    fontSize: 22,
  },
});
