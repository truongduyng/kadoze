import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AdaptiveBlurView from "@/components/ui/AdaptiveBlurView";

interface Props {
  moodScoreThisWeek: number | null;
  moodScoreAvg: number | null;
  todosThisWeek: number;
  todosWeeklyAvg: number;
  currentStreak: number;
}

type TrendDirection = "up" | "down" | "neutral";

function getTrend(thisWeek: number | null, avg: number | null): TrendDirection {
  if (thisWeek === null || avg === null || avg === 0) return "neutral";
  if (thisWeek > avg + 0.2) return "up";
  if (thisWeek < avg - 0.2) return "down";
  return "neutral";
}

function trendArrow(dir: TrendDirection): string {
  if (dir === "up") return "↑";
  if (dir === "down") return "↓";
  return "→";
}

function trendColor(dir: TrendDirection): string {
  if (dir === "up") return "#22c55e";
  if (dir === "down") return "#ef4444";
  return "rgba(255,255,255,0.4)";
}

interface StatBoxProps {
  label: string;
  value: string;
  comparison: string;
  trend?: TrendDirection;
  fullWidth?: boolean;
  iconName?: React.ComponentProps<typeof Ionicons>["name"];
  iconColor?: string;
}

function StatBox({ label, value, comparison, trend = "neutral", fullWidth, iconName, iconColor }: StatBoxProps) {
  return (
    <AdaptiveBlurView style={StyleSheet.flatten([styles.statBox, fullWidth ? styles.statBoxFull : null])}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.valueRow}>
        {iconName ? <Ionicons name={iconName} size={22} color={iconColor ?? "rgba(255,255,255,0.7)"} /> : null}
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <View style={styles.statComparisonRow}>
        {trend !== "neutral" ? (
          <Text style={[styles.trendArrow, { color: trendColor(trend) }]}>
            {trendArrow(trend)}
          </Text>
        ) : null}
        <Text style={styles.statComparison}>{comparison}</Text>
      </View>
    </AdaptiveBlurView>
  );
}

export function PerformanceCard({
  moodScoreThisWeek,
  moodScoreAvg,
  todosThisWeek,
  todosWeeklyAvg,
  currentStreak,
}: Props) {
  const moodTrend = getTrend(moodScoreThisWeek, moodScoreAvg);
  const todosTrend = getTrend(todosThisWeek, todosWeeklyAvg);

  const moodValue = moodScoreThisWeek !== null ? moodScoreThisWeek.toFixed(1) : "—";
  const moodComparison = moodScoreAvg !== null ? `vs ${moodScoreAvg.toFixed(1)} avg` : "no data yet";
  const todosValue = String(todosThisWeek);
  const todosComparison = todosWeeklyAvg > 0 ? `vs ${todosWeeklyAvg.toFixed(1)} avg/wk` : "no data yet";
  const streakValue = currentStreak > 0 ? String(currentStreak) : "0";
  const streakComparison = "day streak";

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>Performance</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>This Week</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>Last 7 days vs your average</Text>
      <View style={styles.statsRow}>
        <StatBox label="MOOD" value={moodValue} comparison={moodComparison} trend={moodTrend} />
        <StatBox label="HABITS" value={todosValue} comparison={todosComparison} trend={todosTrend} />
      </View>
      <StatBox label="STREAK" value={streakValue} comparison={streakComparison} iconName="flame" iconColor="#fb923c" fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingVertical: 4,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    marginTop: -4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  statBoxFull: {
    flex: 0,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 34,
  },
  statComparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trendArrow: {
    fontSize: 13,
    fontWeight: "600",
  },
  statComparison: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
});
