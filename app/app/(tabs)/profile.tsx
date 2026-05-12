import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import GradientBackground from "@/components/GradientBackground";
import {
  db,
  dailyFocus,
  habitCompletions,
  habits,
  notes,
  profiles,
} from "@/lib/db";
import { DAY_NAMES } from "@/lib/performance";
import { getTodayInLocalTimezone } from "@/lib/timezone";
import { palette } from "@/constants/theme";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const CONSISTENCY_DAYS = 28;
const TREND_DAYS = 14;

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getIdentityTitle(score: number) {
  if (score >= 85) return "Unshakeable";
  if (score >= 70) return "Dialed In";
  if (score >= 55) return "Building Heat";
  if (score >= 35) return "Finding Rhythm";
  return "Getting Started";
}

function formatFocusHours(minutes: number) {
  return `${(minutes / 60).toFixed(1)}h`;
}

function buildLinePath(
  values: number[],
  width: number,
  height: number,
  padding = 8,
) {
  if (values.length === 0) {
    return { path: "", points: [] as { x: number; y: number }[] };
  }

  const maxValue = Math.max(...values, 1);
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const points = values.map((value, index) => {
    const x =
      values.length === 1
        ? width / 2
        : padding + (index / (values.length - 1)) * innerWidth;
    const y = padding + innerHeight - (value / maxValue) * innerHeight;
    return { x, y };
  });

  const path = points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ");

  return { path, points };
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const today = useMemo(() => getTodayInLocalTimezone(), []);

  const { data: profileData } = useLiveQuery(
    db.select().from(profiles).limit(1),
  );
  const { data: allCompletions } = useLiveQuery(
    db.select().from(habitCompletions),
  );
  const { data: allHabits } = useLiveQuery(db.select().from(habits));
  const { data: allNotes } = useLiveQuery(db.select().from(notes));
  const { data: allFocusRows } = useLiveQuery(db.select().from(dailyFocus));

  const profile = profileData?.[0];

  const analytics = useMemo(() => {
    const completions = allCompletions ?? [];
    const habitsData = allHabits ?? [];
    const notesData = allNotes ?? [];
    const focusData = allFocusRows ?? [];

    const doneCompletions = completions.filter(
      (item) => item.status === "done",
    );
    const trackedCompletions = completions.filter(
      (item) => item.status === "done" || item.status === "skipped",
    );

    const doneByDate = new Map<string, number>();
    const trackedByDate = new Map<string, number>();
    for (const item of doneCompletions) {
      doneByDate.set(item.date, (doneByDate.get(item.date) ?? 0) + 1);
    }
    for (const item of trackedCompletions) {
      trackedByDate.set(item.date, (trackedByDate.get(item.date) ?? 0) + 1);
    }

    let currentStreak = 0;
    const streakCursor = new Date(today);
    while ((doneByDate.get(formatDateKey(streakCursor)) ?? 0) > 0) {
      currentStreak += 1;
      streakCursor.setDate(streakCursor.getDate() - 1);
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

    const consistencyGrid = Array.from(
      { length: CONSISTENCY_DAYS },
      (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (CONSISTENCY_DAYS - 1 - index));
        const dateKey = formatDateKey(date);
        const doneCount = doneByDate.get(dateKey) ?? 0;
        const trackedCount = trackedByDate.get(dateKey) ?? 0;
        const intensity =
          trackedCount === 0 ? 0 : clamp(doneCount / trackedCount, 0, 1);

        return {
          dateKey,
          label: WEEKDAY_LABELS[date.getDay()],
          doneCount,
          trackedCount,
          intensity,
        };
      },
    );

    const consistentDays = consistencyGrid.filter(
      (item) => item.doneCount > 0,
    ).length;
    const focusMinutesTotal = focusData.reduce(
      (sum, item) => sum + (item.focusMinutes ?? 0),
      0,
    );
    const focusHours = focusMinutesTotal / 60;
    const focusByDate = new Map(focusData.map((item) => [item.date, item]));
    const focusTrendSeries = Array.from({ length: TREND_DAYS }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (TREND_DAYS - 1 - index));
      const dateKey = formatDateKey(date);
      const focusEntry = focusByDate.get(dateKey);
      const minutes = focusEntry?.focusMinutes ?? 0;

      return {
        dateKey,
        label: WEEKDAY_LABELS[date.getDay()],
        minutes,
      };
    });

    const previousFocusWindow = focusTrendSeries.slice(0, 7);
    const currentFocusWindow = focusTrendSeries.slice(7);
    const previousFocusTotal = previousFocusWindow.reduce(
      (sum, item) => sum + item.minutes,
      0,
    );
    const currentFocusTotal = currentFocusWindow.reduce(
      (sum, item) => sum + item.minutes,
      0,
    );
    const focusTrend = currentFocusTotal - previousFocusTotal;
    const activeFocusDays = focusTrendSeries.filter(
      (item) => item.minutes > 0,
    ).length;
    const averageFocusMinutes = Math.round(
      currentFocusTotal / currentFocusWindow.length,
    );
    const focusPeak = Math.max(
      ...focusTrendSeries.map((item) => item.minutes),
      0,
    );

    const momentumScore = clamp(
      Math.round(
        completionRate * 0.55 +
          Math.min(currentStreak, 14) * 3 +
          consistentDays * 0.35,
      ),
      0,
      100,
    );

    const perHabit = habitsData
      .map((habit) => {
        let streak = 0;
        const cursor = new Date(today);
        while (true) {
          const dateKey = formatDateKey(cursor);
          const match = completions.find(
            (item) =>
              item.habitId === habit.id &&
              item.date === dateKey &&
              item.status === "done",
          );
          if (!match) break;
          streak += 1;
          cursor.setDate(cursor.getDate() - 1);
        }

        const tracked = trackedCompletions.filter(
          (item) => item.habitId === habit.id,
        );
        const done = doneCompletions.filter(
          (item) => item.habitId === habit.id,
        );
        const rate = tracked.length
          ? Math.round((done.length / tracked.length) * 100)
          : 0;

        return {
          id: habit.id,
          title: habit.title,
          icon: habit.icon ?? "•",
          streak,
          rate,
          done: done.length,
        };
      })
      .sort((a, b) => {
        if (b.rate !== a.rate) return b.rate - a.rate;
        if (b.streak !== a.streak) return b.streak - a.streak;
        return b.done - a.done;
      });

    const longestHabitStreak = perHabit.length
      ? Math.max(...perHabit.map((item) => item.streak))
      : 0;

    return {
      currentStreak,
      totalDone: doneCompletions.length,
      activeToday,
      completionRate,
      notesCount: notesData.length,
      habitsCount: habitsData.length,
      weekActivity,
      bestDayCount,
      consistencyGrid,
      consistentDays,
      focusHours,
      focusTrend,
      focusTrendSeries,
      activeFocusDays,
      averageFocusMinutes,
      focusPeak,
      momentumScore,
      identityTitle: getIdentityTitle(momentumScore),
      topHabits: perHabit.slice(0, 3),
      longestHabitStreak,
    };
  }, [allCompletions, allFocusRows, allHabits, allNotes, today]);

  const initials = useMemo(() => {
    const name = profile?.name?.trim();
    if (!name) return "U";
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [profile?.name]);

  const trendChart = useMemo(
    () =>
      buildLinePath(
        analytics.focusTrendSeries.map((item) => item.minutes),
        320,
        140,
        12,
      ),
    [analytics.focusTrendSeries],
  );
  const trendAreaPath = useMemo(() => {
    if (trendChart.points.length === 0) return "";
    const firstPoint = trendChart.points[0];
    const lastPoint = trendChart.points[trendChart.points.length - 1];
    return `${trendChart.path} L ${lastPoint.x.toFixed(2)} 128 L ${firstPoint.x.toFixed(2)} 128 Z`;
  }, [trendChart]);
  const focusTrendLabel =
    analytics.focusTrend > 0
      ? `+${formatFocusHours(analytics.focusTrend)}`
      : analytics.focusTrend < 0
        ? `-${formatFocusHours(Math.abs(analytics.focusTrend))}`
        : "Flat";

  return (
    <View style={styles.container}>
      <GradientBackground />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: insets.bottom + 96,
          paddingHorizontal: 20,
          gap: 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.identityTop}>
            <View style={styles.identityPrimary}>
              <View style={styles.avatar}>
                <Text selectable style={styles.avatarText}>
                  {initials}
                </Text>
              </View>
              <View style={styles.identityMeta}>
                <Text selectable style={styles.name}>
                  {profile?.name?.trim() || "User"}
                </Text>
                <Text selectable style={styles.identityTitle}>
                  {analytics.identityTitle}
                </Text>
              </View>
            </View>
            <Pressable
              style={styles.settingsButton}
              onPress={() => router.push("/settings")}
              hitSlop={10}
            >
              <Ionicons
                name="settings-outline"
                size={18}
                color={palette.white80}
              />
            </Pressable>
          </View>

          <View style={styles.identityStats}>
            <View style={styles.identityMetricLarge}>
              <Text selectable style={styles.metricEyebrow}>
                Momentum Score
              </Text>
              <Text selectable style={styles.identityMetricValue}>
                {analytics.momentumScore}
              </Text>
            </View>
            <View style={styles.identityMetricSmall}>
              <Text selectable style={styles.metricEyebrow}>
                Current streak
              </Text>
              <Text selectable style={styles.identityMetricSmallValue}>
                {analytics.currentStreak} days
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.heroCard}>
            <Text selectable style={styles.metricEyebrow}>
              Heat map
            </Text>

            <View style={styles.gridWrap}>
              {analytics.consistencyGrid.map((item) => (
                <View key={item.dateKey} style={styles.gridCellWrap}>
                  <View
                    style={[
                      styles.gridCell,
                      item.intensity === 0 && styles.gridCellIdle,
                      item.intensity > 0 &&
                        item.intensity < 0.5 &&
                        styles.gridCellLow,
                      item.intensity >= 0.5 &&
                        item.intensity < 1 &&
                        styles.gridCellMid,
                      item.intensity === 1 && styles.gridCellHigh,
                    ]}
                  />
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={[styles.analyticsCard, styles.trendCard]}>
            <View style={styles.trendHeader}>
              <View style={styles.trendHeaderCopy}>
                <Text selectable style={styles.metricEyebrow}>
                  Focus trend
                </Text>
                <Text selectable style={styles.trendHeadline}>
                  {analytics.focusHours.toFixed(1)}h
                </Text>
                <Text selectable style={styles.trendSubhead}>
                  Last 14 days of deep work
                </Text>
              </View>
              <View
                style={[
                  styles.trendDeltaPill,
                  analytics.focusTrend > 0 && styles.trendDeltaPillUp,
                  analytics.focusTrend < 0 && styles.trendDeltaPillDown,
                ]}
              >
                <Text selectable style={styles.trendDeltaValue}>
                  {focusTrendLabel}
                </Text>
                <Text selectable style={styles.trendDeltaLabel}>
                  vs prior week
                </Text>
              </View>
            </View>
            <View style={styles.trendStatsRow}>
              <View style={styles.trendStat}>
                <Text selectable style={styles.trendStatValue}>
                  {analytics.activeFocusDays}
                </Text>
                <Text selectable style={styles.trendStatLabel}>
                  active days
                </Text>
              </View>
              <View style={styles.trendStat}>
                <Text selectable style={styles.trendStatValue}>
                  {analytics.averageFocusMinutes}m
                </Text>
                <Text selectable style={styles.trendStatLabel}>
                  7-day avg
                </Text>
              </View>
              <View style={styles.trendStat}>
                <Text selectable style={styles.trendStatValue}>
                  {analytics.focusPeak}m
                </Text>
                <Text selectable style={styles.trendStatLabel}>
                  peak day
                </Text>
              </View>
            </View>
            <View style={styles.trendChartWrap}>
              <Svg width="100%" height="140" viewBox="0 0 320 140">
                <Defs>
                  <LinearGradient
                    id="focusTrendFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <Stop offset="0%" stopColor={palette.orange} stopOpacity={0.34} />
                    <Stop offset="100%" stopColor={palette.orange} stopOpacity={0.02} />
                  </LinearGradient>
                </Defs>
                <Path
                  d="M 12 128 L 308 128"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={1}
                  strokeLinecap="round"
                />
                <Path
                  d="M 12 88 L 308 88"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth={1}
                  strokeDasharray="3 5"
                  strokeLinecap="round"
                />
                {trendAreaPath ? (
                  <Path d={trendAreaPath} fill="url(#focusTrendFill)" />
                ) : null}
                <Path
                  d={trendChart.path}
                  fill="none"
                  stroke={palette.orange}
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {trendChart.points.map((point, index) => (
                  <Circle
                    key={`trend-point-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={index === trendChart.points.length - 1 ? 5 : 3.5}
                    fill={palette.orange}
                    opacity={index === trendChart.points.length - 1 ? 1 : 0.75}
                  />
                ))}
              </Svg>
            </View>
            <View style={styles.trendLabelsRow}>
              {analytics.focusTrendSeries.map((item) => (
                <Text
                  key={item.dateKey}
                  selectable
                  style={styles.trendLabel}
                >
                  {item.label}
                </Text>
              ))}
            </View>
          </View>

          <View style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <View>
                <Text selectable style={styles.metricEyebrow}>
                  Weekly rhythm
                </Text>
              </View>
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

        <View style={styles.section}>
          <View style={styles.analyticsRow}>
            <View style={styles.analyticsCard}>
              <Text selectable style={styles.metricEyebrow}>
                Completion
              </Text>
              <Text selectable style={styles.analyticsValueSmall}>
                {analytics.completionRate}%
              </Text>
            </View>
            <View style={styles.analyticsCard}>
              <Text selectable style={styles.metricEyebrow}>
                Best streak
              </Text>
              <Text selectable style={styles.analyticsValueSmall}>
                {analytics.longestHabitStreak}d
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: palette.white08,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    gap: 14,
  },
  identityTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  identityPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingRight: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderCurve: "continuous",
    backgroundColor: palette.orange15,
    borderWidth: 1,
    borderColor: palette.orange35,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: palette.orange,
    fontSize: 26,
    fontWeight: "800",
  },
  identityMeta: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: palette.white,
    fontSize: 28,
    fontWeight: "800",
  },
  identityTitle: {
    color: palette.orange,
    fontSize: 15,
    fontWeight: "700",
  },
  identityCaption: {
    color: palette.white55,
    fontSize: 13,
  },
  identityStats: {
    flexDirection: "row",
    gap: 12,
  },
  identityMetricLarge: {
    flex: 1.1,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: palette.white08,
    padding: 16,
    gap: 10,
  },
  identityMetricSmall: {
    flex: 0.9,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: palette.white08,
    padding: 16,
    justifyContent: "space-between",
  },
  metricEyebrow: {
    color: palette.white45,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  identityMetricValue: {
    color: palette.white,
    fontSize: 52,
    lineHeight: 56,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  identityMetricSmallValue: {
    color: palette.white,
    fontSize: 24,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
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
  heroCard: {
    borderRadius: 28,
    borderCurve: "continuous",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: palette.white08,
    padding: 18,
    gap: 16,
  },
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  gridCellWrap: {
    width: "12.5%",
    alignItems: "center",
    gap: 2,
  },
  gridCell: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  gridCellIdle: {
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  gridCellLow: {
    backgroundColor: "rgba(240,136,60,0.28)",
  },
  gridCellMid: {
    backgroundColor: "rgba(240,136,60,0.55)",
  },
  gridCellHigh: {
    backgroundColor: palette.orange,
  },
  gridDayLabel: {
    color: palette.white35,
    fontSize: 10,
    fontWeight: "700",
  },
  analyticsRow: {
    flexDirection: "row",
    gap: 12,
  },
  analyticsCard: {
    flex: 1,
    minHeight: 130,
    borderRadius: 24,
    borderCurve: "continuous",
    backgroundColor: palette.white06,
    borderWidth: 1,
    borderColor: palette.white08,
    padding: 16,
    gap: 12,
  },
  analyticsCardPrimary: {
    backgroundColor: "rgba(240,136,60,0.12)",
    borderColor: "rgba(240,136,60,0.25)",
  },
  analyticsValue: {
    color: palette.white,
    fontSize: 38,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  analyticsValueSmall: {
    color: palette.white,
    fontSize: 30,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  trendCard: {
    minHeight: 0,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 18,
  },
  trendHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  trendHeaderCopy: {
    flex: 1,
    gap: 6,
  },
  trendHeadline: {
    color: palette.white,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  trendSubhead: {
    color: palette.white50,
    fontSize: 13,
    fontWeight: "600",
  },
  trendDeltaPill: {
    minWidth: 96,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.white08,
    backgroundColor: palette.white04,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  trendDeltaPillUp: {
    backgroundColor: palette.orange10,
    borderColor: palette.orange25,
  },
  trendDeltaPillDown: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  trendDeltaValue: {
    color: palette.white,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  trendDeltaLabel: {
    color: palette.white50,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
    textTransform: "uppercase",
  },
  trendStatsRow: {
    flexDirection: "row",
    gap: 10,
  },
  trendStat: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.white08,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  trendStatValue: {
    color: palette.white,
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  trendStatLabel: {
    color: palette.white45,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  trendChartWrap: {
    marginTop: 2,
    marginHorizontal: -2,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  trendLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 2,
    paddingTop: 2,
  },
  trendLabel: {
    flex: 1,
    color: palette.white35,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  trendSummary: {
    color: palette.white60,
    fontSize: 13,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  activityCard: {
    borderRadius: 28,
    borderCurve: "continuous",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: palette.white08,
    padding: 18,
    gap: 16,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
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
  habitListCard: {
    borderRadius: 24,
    borderCurve: "continuous",
    backgroundColor: palette.white06,
    borderWidth: 1,
    borderColor: palette.white08,
    overflow: "hidden",
  },
  habitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  habitRowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  habitIcon: {
    fontSize: 20,
  },
  habitRowCopy: {
    flex: 1,
    gap: 2,
  },
  habitTitle: {
    color: palette.white,
    fontSize: 15,
    fontWeight: "700",
  },
  habitMeta: {
    color: palette.white50,
    fontSize: 12,
    fontWeight: "600",
  },
  habitStreak: {
    color: palette.orange,
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  divider: {
    height: 1,
    backgroundColor: palette.white08,
  },
  emptyCopy: {
    color: palette.white50,
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
});
