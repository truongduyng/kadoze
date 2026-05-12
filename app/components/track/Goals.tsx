import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AdaptiveBlurView from "@/components/ui/AdaptiveBlurView";
import type { Goal } from "@/lib/db";
import { formatTargetDate } from "@/lib/timezone";
import type { GoalProgress } from "@/lib/performance";
import { storage } from "@/lib/storage";

// ── Weekly reveal tracking via MMKV ──────────────────────────────────────────

export const REVEAL_WARNING_THRESHOLD = 3;
const MMKV_KEY_COUNT = "goals_weekly_reveal_count";
const MMKV_KEY_WEEK = "goals_weekly_reveal_week";

function currentWeekKey(): string {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  return monday.toISOString().slice(0, 10);
}

export function getWeeklyRevealCount(): number {
  const week = storage.getString(MMKV_KEY_WEEK);
  const thisWeek = currentWeekKey();
  if (week !== thisWeek) {
    storage.set(MMKV_KEY_WEEK, thisWeek);
    storage.set(MMKV_KEY_COUNT, 0);
    return 0;
  }
  return storage.getNumber(MMKV_KEY_COUNT) ?? 0;
}

export function incrementWeeklyRevealCount(): number {
  const next = getWeeklyRevealCount() + 1;
  storage.set(MMKV_KEY_COUNT, next);
  return next;
}

// ── Goals component ───────────────────────────────────────────────────────────

interface GoalsProps {
  goalsData: Goal[];
  goalProgressMap: Map<number, GoalProgress>;
}

export const Goals = React.memo(({ goalsData, goalProgressMap }: GoalsProps) => {
  if (goalsData.length === 0) return null;

  return (
    <View style={styles.goalsSection}>
      <View style={styles.sectionHeader}>
        <Ionicons name="star" size={18} color="#FFD700" />
        <Text style={styles.sectionTitle}>Goals</Text>
      </View>

      {/* Cards */}
      <View style={styles.goalsList}>
        {goalsData.map((goal) => {
          const progress = goalProgressMap.get(goal.id);
          const hasData = (progress?.totalScheduled ?? 0) > 0;
          const pct = hasData ? Math.round(progress!.rate * 100) : 0;
          const formatted = formatTargetDate(goal.targetDate);
          const deadlineLabel = formatted ? `by ${formatted}` : null;
          const performanceGoals = goal.performanceGoals as string[] | null;

          const isArchived = goal.status === "archived";
          const isCompleted = goal.status === "completed";
          const statusLabel = isArchived ? "Archived" : isCompleted ? "Completed" : "Active";
          const statusStyle = isArchived
            ? styles.statusArchived
            : isCompleted
            ? styles.statusCompleted
            : styles.statusActive;

          // Archived: compact row, no detail
          if (isArchived) {
            return (
              <View key={goal.id} style={styles.cardWrapper}>
                <AdaptiveBlurView style={[styles.goalCard, styles.goalCardArchived]}>
                  <View style={styles.goalHeader}>
                    <Text style={[styles.goalTitle, styles.goalTitleArchived]} numberOfLines={1}>
                      {goal.outcomeGoal ?? goal.title}
                    </Text>
                    <View style={[styles.statusBadge, statusStyle]}>
                      <Text style={styles.statusText}>{statusLabel}</Text>
                    </View>
                  </View>
                </AdaptiveBlurView>
              </View>
            );
          }

          return (
            <View key={goal.id} style={styles.cardWrapper}>
              <AdaptiveBlurView style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={styles.goalHeaderLeft}>
                    <Text style={styles.goalTitle}>{goal.outcomeGoal ?? goal.title}</Text>
                    {deadlineLabel ? <Text style={styles.goalDeadline}>{deadlineLabel}</Text> : null}
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {goal.status !== "active" && (
                      <View style={[styles.statusBadge, statusStyle]}>
                        <Text style={styles.statusText}>{statusLabel}</Text>
                      </View>
                    )}
                    {hasData && <Text style={styles.goalPercentage}>{pct}%</Text>}
                  </View>
                </View>

                {hasData && (
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                  </View>
                )}

                {performanceGoals && performanceGoals.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.tierLabel}>PERFORMANCE GOALS</Text>
                    {performanceGoals.map((pg, i) => (
                      <View key={i} style={styles.bulletRow}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>{pg}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </AdaptiveBlurView>
            </View>
          );
        })}
      </View>
    </View>
  );
});
Goals.displayName = "Goals";

const styles = StyleSheet.create({
  goalsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "500",
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  goalsList: {
    gap: 10,
  },
  cardWrapper: {
    position: "relative",
  },
  goalCard: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 10,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  goalHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  tierLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.4)",
    letterSpacing: 0.8,
    marginBottom: 2,
    marginTop: 2,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
    lineHeight: 21,
  },
  goalPercentage: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
    marginLeft: 8,
  },
  goalDeadline: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.45)",
    marginVertical: 2,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#fb923c",
  },
  section: {
    gap: 4,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 6,
  },
  bullet: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 13,
    lineHeight: 20,
  },
  bulletText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusActive: {
    backgroundColor: "rgba(251,146,60,0.15)",
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.35)",
  },
  statusCompleted: {
    backgroundColor: "rgba(52,199,89,0.15)",
    borderWidth: 1,
    borderColor: "rgba(52,199,89,0.35)",
  },
  statusArchived: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 0.3,
  },
  goalCardArchived: {
    opacity: 0.6,
    paddingVertical: 12,
  },
  goalTitleArchived: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.5)",
    flex: 1,
    marginRight: 8,
  },
});
