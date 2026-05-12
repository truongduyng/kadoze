import GradientBackground from "@/components/GradientBackground";
import { Collapsible } from "@/components/ui/collapsible";
import { palette } from "@/constants/theme";
import {
  db,
  habits,
  habitCompletions,
  completionOps,
  habitOps,
} from "@/lib/db";
import { KEYSTONE_HABITS_BY_FOCUS, type KeystoneHabit } from "@/hooks/useOnboarding";
import { getTodayInLocalTimezone, getLocalDateString } from "@/lib/timezone";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
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

const FOCUS_LABELS: Record<string, string> = {
  health: "Health & Vitality",
  mindset: "Mindset & Growth",
  work: "Work & Business",
  relations: "Relationships",
  creative: "Creativity",
  finance: "Financial Freedom",
};
const FOCUS_ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  health: "star-outline",
  mindset: "person-outline",
  work: "briefcase-outline",
  relations: "heart-outline",
  creative: "sparkles-outline",
  finance: "cash-outline",
};
const UNLOCK_STREAK_DAYS = 14;

function habitKey(title: string, subtitle?: string | null) {
  return `${title}::${subtitle ?? ""}`;
}

export default function RoutinesScreen() {
  const insets = useSafeAreaInsets();
  const today = useMemo(() => getTodayInLocalTimezone(), []);
  const todayKey = getLocalDateString(today);
  const todayName = DAY_NAMES[today.getDay()];

  const { data: allHabits } = useLiveQuery(db.select().from(habits));
  const { data: allCompletions } = useLiveQuery(db.select().from(habitCompletions));
  const focusEntries = useMemo(
    () => Object.entries(KEYSTONE_HABITS_BY_FOCUS),
    [],
  );
  const existingHabitMap = useMemo(() => {
    const map = new Map<string, NonNullable<typeof allHabits>[number]>();
    for (const habit of allHabits ?? []) {
      map.set(habitKey(habit.title, habit.subtitle), habit);
    }
    return map;
  }, [allHabits]);

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

  const currentFocus = useMemo(() => {
    let best: { key: string; count: number } | null = null;
    for (const [focusKey, keystones] of focusEntries) {
      const count = keystones.filter((keystone) =>
        existingHabitMap.has(habitKey(keystone.title, keystone.subtitle)),
      ).length;
      if (count > 0 && (!best || count > best.count)) {
        best = { key: focusKey, count };
      }
    }
    return best?.key ?? null;
  }, [existingHabitMap, focusEntries]);

  const currentFocusHabits = useMemo(() => {
    if (!currentFocus) return [];
    return KEYSTONE_HABITS_BY_FOCUS[currentFocus] ?? [];
  }, [currentFocus]);

  const currentFocusStages = useMemo(() => {
    return currentFocusHabits.map((keystone, index) => {
      const existing = existingHabitMap.get(habitKey(keystone.title, keystone.subtitle));
      const previousKeystone = index > 0 ? currentFocusHabits[index - 1] : null;
      const previousHabit = previousKeystone
        ? existingHabitMap.get(habitKey(previousKeystone.title, previousKeystone.subtitle))
        : null;
      const previousStreak = previousHabit ? (streakMap[previousHabit.id] ?? 0) : 0;
      const isAvailable =
        !!existing ||
        index === 0 ||
        (!!previousHabit && previousStreak >= UNLOCK_STREAK_DAYS);

      return {
        keystone,
        existing,
        streak: existing ? (streakMap[existing.id] ?? 0) : 0,
        isAvailable,
        previousStreak,
      };
    });
  }, [currentFocusHabits, existingHabitMap, streakMap]);

  const toggle = async (habitId: number, isDone: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isDone) {
      await completionOps.markUndone(habitId, today);
    } else {
      await completionOps.markDone(habitId, today);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const addFocusHabit = async (keystone: KeystoneHabit) => {
    if (existingHabitMap.has(habitKey(keystone.title, keystone.subtitle))) return;
    await habitOps.create({
      title: keystone.title,
      subtitle: keystone.subtitle,
      icon: keystone.icon,
      daysOfWeek: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      isLocked: false,
      sortOrder: (allHabits?.length ?? 0) + 1,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        {/* Active habits */}
        {todayHabits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ACTIVE HABITS</Text>
            <View style={styles.habitList}>
              {todayHabits.map((habit) => {
                const streak = streakMap[habit.id] ?? 0;
                const streakDots = Math.min(streak, 10);
                return (
                  <Pressable
                    key={habit.id}
                    style={styles.habitCard}
                    onPress={() => toggle(habit.id, doneIds.has(habit.id))}
                  >
                    <View style={styles.habitIconWrap}>
                      <Text style={styles.habitIcon}>{habit.icon ?? "⭐"}</Text>
                    </View>
                    <View style={styles.habitInfo}>
                      <Text style={styles.habitTitle} numberOfLines={1}>
                        {habit.title}
                      </Text>
                      {habit.subtitle ? (
                        <Text style={styles.habitDuration} numberOfLines={1}>
                          {habit.subtitle}
                        </Text>
                      ) : null}
                      <View style={styles.streakDotsRow}>
                        {Array.from({ length: 10 }).map((_, index) => (
                          <View
                            key={`${habit.id}-dot-${index}`}
                            style={[
                              styles.streakDot,
                              index < streakDots && styles.streakDotActive,
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                    <View style={styles.streakBadge}>
                      <Text style={styles.streakText}>{streak}</Text>
                      <Text style={styles.streakLabel}>day streak</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CURRENT FOCUS</Text>
          <View style={styles.card}>
            <View style={styles.focusHeader}>
              <View style={styles.focusBadge}>
                <Ionicons name="flag-outline" size={12} color={palette.orange} />
                <Text style={styles.focusBadgeText}>
                  {currentFocus ? FOCUS_LABELS[currentFocus] : "Focus not set"}
                </Text>
              </View>
              <Text style={styles.focusRule}>Unlock next after 14 days</Text>
            </View>
            {currentFocus ? (
              <>
                <Text style={styles.focusText}>
                  Stay with one keystone long enough for it to become automatic. Each next habit
                  in this focus path unlocks after the previous one reaches a 14-day streak.
                </Text>
                <View style={styles.focusTrackList}>
                  {currentFocusStages.map((stage, index) => {
                    const status = stage.existing
                      ? "active"
                      : stage.isAvailable
                        ? "available"
                        : "locked";
                    return (
                      <Pressable
                        key={`${stage.keystone.title}-${index}`}
                        style={[
                          styles.focusHabitCard,
                          status === "available" && styles.focusHabitCardAvailable,
                          status === "locked" && styles.focusHabitCardLocked,
                        ]}
                        disabled={status !== "available"}
                        onPress={() => addFocusHabit(stage.keystone)}
                      >
                        <View style={styles.focusHabitLeft}>
                          <View
                            style={[
                              styles.focusHabitIconWrap,
                              status === "available" && styles.focusHabitIconWrapAvailable,
                            ]}
                          >
                            <Text style={styles.focusHabitIcon}>{stage.keystone.icon}</Text>
                          </View>
                          <View style={styles.focusHabitInfo}>
                            <Text style={styles.focusHabitTitle}>{stage.keystone.title}</Text>
                            <Text style={styles.focusHabitSubtitle}>{stage.keystone.subtitle}</Text>
                          </View>
                        </View>
                        {status === "active" ? (
                          <View style={styles.focusHabitRight}>
                            <Text style={styles.focusHabitMetric}>{stage.streak}</Text>
                            <Text style={styles.focusHabitStatus}>day streak</Text>
                          </View>
                        ) : status === "available" ? (
                          <View style={styles.focusHabitRight}>
                            <Ionicons name="add-circle" size={22} color={palette.orange} />
                            <Text style={styles.focusHabitAvailable}>Add</Text>
                          </View>
                        ) : (
                          <View style={styles.focusHabitRight}>
                            <Ionicons name="lock-closed" size={16} color={palette.white32} />
                            <Text style={styles.focusHabitLockedText}>
                              {Math.max(UNLOCK_STREAK_DAYS - stage.previousStreak, 0)} days left
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : (
              <Text style={styles.focusText}>
                Complete onboarding and choose a keystone habit to start a focus path.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ALL PATHS</Text>
          <View style={styles.focusGroupsList}>
            {focusEntries.map(([focusKey, focusHabits]) => (
              <View key={focusKey} style={styles.focusGroupCard}>
                <Collapsible
                  title={FOCUS_LABELS[focusKey] ?? focusKey}
                  headerContent={
                    <View style={styles.focusGroupHeaderContent}>
                      <View style={styles.focusGroupHeaderIconWrap}>
                        <Ionicons
                          name={FOCUS_ICONS[focusKey] ?? "ellipse-outline"}
                          size={20}
                          color={palette.white55}
                        />
                      </View>
                      <Text style={styles.focusGroupTitle}>{FOCUS_LABELS[focusKey] ?? focusKey}</Text>
                    </View>
                  }
                  contentStyle={styles.focusGroupContent}
                >
                  <View style={styles.focusGroupItems}>
                    {focusHabits.map((habit) => {
                      const isOwned = existingHabitMap.has(habitKey(habit.title, habit.subtitle));
                      return (
                        <View key={`${focusKey}-${habit.title}`} style={styles.focusGroupItem}>
                          <Text style={styles.focusGroupIcon}>{habit.icon}</Text>
                          <Text style={styles.focusGroupItemText} numberOfLines={1}>
                            {habit.title}
                          </Text>
                          {isOwned && (
                            <Ionicons name="checkmark-circle" size={14} color={palette.orange} />
                          )}
                        </View>
                      );
                    })}
                  </View>
                </Collapsible>
              </View>
            ))}
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
    color: palette.white,
    marginBottom: 12,
  },
  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: palette.white35,
    marginBottom: 10,
  },
  card: {
    backgroundColor: palette.white06,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.white08,
    padding: 16,
  },
  habitList: { gap: 10 },
  habitCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: palette.white06,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.white08,
  },
  habitIconWrap: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  habitIcon: { fontSize: 22, textAlign: "center" },
  habitInfo: { flex: 1 },
  habitTitle: { fontSize: 15, fontWeight: "600", color: palette.white },
  habitDuration: {
    fontSize: 13,
    fontWeight: "500",
    color: palette.white42,
    marginTop: 3,
  },
  streakDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  streakDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: palette.white14,
    backgroundColor: palette.white04,
  },
  streakDotActive: {
    borderColor: palette.orange35,
    backgroundColor: palette.orange,
  },
  streakBadge: { alignItems: "flex-end" },
  streakText: { fontSize: 19, fontWeight: "800", color: palette.orange, lineHeight: 20 },
  streakLabel: { fontSize: 11, color: palette.white35, marginTop: 6 },
  focusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  focusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: palette.orange12,
    borderWidth: 1,
    borderColor: palette.orange30,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  focusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.orange,
  },
  focusRule: {
    fontSize: 11,
    color: palette.white38,
  },
  focusText: {
    fontSize: 13,
    color: palette.white50,
    lineHeight: 19,
    marginTop: 12,
  },
  focusTrackList: {
    gap: 10,
    marginTop: 16,
  },
  focusHabitCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: palette.white05,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.white08,
    padding: 14,
    gap: 12,
  },
  focusHabitCardAvailable: {
    borderColor: palette.orange35,
    backgroundColor: palette.orange08,
  },
  focusHabitCardLocked: {
    opacity: 0.6,
  },
  focusHabitLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  focusHabitIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: palette.white08,
    alignItems: "center",
    justifyContent: "center",
  },
  focusHabitIconWrapAvailable: {
    backgroundColor: palette.orange16,
  },
  focusHabitIcon: { fontSize: 18 },
  focusHabitInfo: { flex: 1 },
  focusHabitTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: palette.white,
  },
  focusHabitSubtitle: {
    fontSize: 12,
    color: palette.white38,
    marginTop: 2,
  },
  focusHabitRight: {
    alignItems: "flex-end",
    minWidth: 62,
  },
  focusHabitMetric: {
    fontSize: 18,
    fontWeight: "800",
    color: palette.orange,
  },
  focusHabitStatus: {
    fontSize: 10,
    color: palette.white35,
    marginTop: 2,
  },
  focusHabitAvailable: {
    fontSize: 11,
    color: palette.orange,
    fontWeight: "700",
    marginTop: 2,
  },
  focusHabitLockedText: {
    fontSize: 10,
    color: palette.white35,
    marginTop: 4,
  },
  focusGroupsList: {
    gap: 10,
  },
  focusGroupCard: {
    backgroundColor: palette.white06,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.white08,
    padding: 14,
  },
  focusGroupHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  focusGroupHeaderIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: palette.white08,
    alignItems: "center",
    justifyContent: "center",
  },
  focusGroupHeaderIcon: {
    fontSize: 20,
  },
  focusGroupTitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    color: palette.white,
  },
  focusGroupContent: {
    marginLeft: 0,
  },
  focusGroupItems: {
    gap: 8,
  },
  focusGroupItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  focusGroupIcon: {
    width: 18,
    fontSize: 15,
    textAlign: "center",
  },
  focusGroupItemText: {
    flex: 1,
    fontSize: 13,
    color: palette.white62,
  },
});
