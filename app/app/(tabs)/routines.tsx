import GradientBackground from "@/components/GradientBackground";
import { Collapsible } from "@/components/ui/collapsible";
import { useTheme } from "@/hooks/useTheme";
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
import Svg, { Circle } from "react-native-svg";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DAY_NAMES } from "@/lib/performance";
import { resolveIoniconName } from "@/lib/iconNames";

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
const PROGRESS_RING_SIZE = 148;
const PROGRESS_RING_STROKE = 12;
const PROGRESS_RING_RADIUS = (PROGRESS_RING_SIZE - PROGRESS_RING_STROKE) / 2;
const PROGRESS_RING_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RING_RADIUS;

function habitKey(title: string, subtitle?: string | null) {
  return `${title}::${subtitle ?? ""}`;
}

export default function RoutinesScreen() {
  const insets = useSafeAreaInsets();
  const C = useTheme();
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

  const skippedIds = useMemo(() => {
    const set = new Set<number>();
    for (const c of allCompletions ?? []) {
      if (c.date === todayKey && c.status === "skipped") set.add(c.habitId);
    }
    return set;
  }, [allCompletions, todayKey]);

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
      cursor.setDate(cursor.getDate() - 1);

      for (let i = 0; i < 365; i++) {
        const key = getLocalDateString(cursor);
        if (dates.includes(key)) {
          streak++;
          cursor.setDate(cursor.getDate() - 1);
        } else break;
      }
      if (doneIds.has(h.id)) streak++;
      map[h.id] = streak;
    }
    return map;
  }, [allHabits, allCompletions, doneIds, today]);

  const todayProgress = useMemo(() => {
    const completed = todayHabits.filter((habit) => doneIds.has(habit.id)).length;
    const skipped = todayHabits.filter((habit) => skippedIds.has(habit.id)).length;
    const total = todayHabits.length;
    const ratio = total > 0 ? completed / total : 0;
    const doneByDate = new Set(
      (allCompletions ?? [])
        .filter((item) => item.status === "done")
        .map((item) => item.date),
    );

    let dayStreak = 0;
    const cursor = new Date(today);
    while (doneByDate.has(getLocalDateString(cursor))) {
      dayStreak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return { completed, skipped, total, ratio, dayStreak };
  }, [allCompletions, doneIds, skippedIds, today, todayHabits]);

  const progressOffset = PROGRESS_RING_CIRCUMFERENCE * (1 - todayProgress.ratio);

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
    const currentFocusOwnedHabits = currentFocusHabits
      .map((keystone) => existingHabitMap.get(habitKey(keystone.title, keystone.subtitle)))
      .filter((habit): habit is NonNullable<typeof habit> => !!habit);
    const unlockedHabitSlots =
      1 +
      currentFocusOwnedHabits.filter(
        (habit) => (streakMap[habit.id] ?? 0) >= UNLOCK_STREAK_DAYS,
      ).length;
    const hasOpenHabitSlot = currentFocusOwnedHabits.length < unlockedHabitSlots;
    const nextUnlockStreak = hasOpenHabitSlot
      ? UNLOCK_STREAK_DAYS
      : currentFocusOwnedHabits.reduce((best, habit) => {
          const streak = streakMap[habit.id] ?? 0;
          return streak < UNLOCK_STREAK_DAYS ? Math.max(best, streak) : best;
        }, 0);

    return currentFocusHabits.map((keystone, index) => {
      const existing = existingHabitMap.get(habitKey(keystone.title, keystone.subtitle));
      const isAvailable =
        !!existing ||
        (currentFocusOwnedHabits.length === 0 && index === 0) ||
        hasOpenHabitSlot;

      return {
        keystone,
        existing,
        streak: existing ? (streakMap[existing.id] ?? 0) : 0,
        isAvailable,
        nextUnlockStreak,
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
    const key = habitKey(keystone.title, keystone.subtitle);
    const stage = currentFocusStages.find((item) => habitKey(item.keystone.title, item.keystone.subtitle) === key);
    if (!stage || stage.existing || !stage.isAvailable) return;

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

  const s = makeStyles(C);

  return (
    <View style={s.container}>
      <GradientBackground />
      <ScrollView
        contentContainerStyle={[
          s.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 96 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.section}>
          <Text style={s.sectionLabel}>TODAY&apos;S PROGRESS</Text>
          <View style={s.progressCard}>
            <View style={s.progressRingWrap}>
              <Svg width={PROGRESS_RING_SIZE} height={PROGRESS_RING_SIZE}>
                <Circle
                  cx={PROGRESS_RING_SIZE / 2}
                  cy={PROGRESS_RING_SIZE / 2}
                  r={PROGRESS_RING_RADIUS}
                  stroke={C.cardBorder}
                  strokeWidth={PROGRESS_RING_STROKE}
                  fill="none"
                />
                <Circle
                  cx={PROGRESS_RING_SIZE / 2}
                  cy={PROGRESS_RING_SIZE / 2}
                  r={PROGRESS_RING_RADIUS}
                  stroke={C.accent}
                  strokeWidth={PROGRESS_RING_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={PROGRESS_RING_CIRCUMFERENCE}
                  strokeDashoffset={progressOffset}
                  fill="none"
                  rotation="-90"
                  originX={PROGRESS_RING_SIZE / 2}
                  originY={PROGRESS_RING_SIZE / 2}
                />
              </Svg>
              <View style={s.progressRingCenter}>
                <Text style={s.progressValue}>
                  {todayProgress.completed}/{todayProgress.total}
                </Text>
                <Text style={s.progressValueLabel}>Completed</Text>
              </View>
            </View>

            <View style={s.progressStats}>
              <View style={s.progressStatRow}>
                <View style={s.progressStatIconWrap}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={C.iconSecondary} />
                </View>
                <View>
                  <Text style={s.progressStatValue}>{todayProgress.completed}</Text>
                  <Text style={s.progressStatLabel}>Completed</Text>
                </View>
              </View>

              <View style={s.progressStatRow}>
                <View style={s.progressStatIconWrap}>
                  <Ionicons name="play-skip-forward-outline" size={18} color={C.iconSecondary} />
                </View>
                <View>
                  <Text style={s.progressStatValue}>{todayProgress.skipped}</Text>
                  <Text style={s.progressStatLabel}>Skipped</Text>
                </View>
              </View>

              <View style={s.progressStatRow}>
                <View style={s.progressStatIconWrap}>
                  <Ionicons name="flame-outline" size={18} color={C.iconSecondary} />
                </View>
                <View>
                  <Text style={s.progressStatValue}>{todayProgress.dayStreak}</Text>
                  <Text style={s.progressStatLabel}>Day Streak</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {todayHabits.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>ACTIVE HABITS</Text>
            <View style={s.habitList}>
              {todayHabits.map((habit) => {
                const streak = streakMap[habit.id] ?? 0;
                const streakDots = Math.min(streak, 10);
                return (
                  <Pressable
                    key={habit.id}
                    style={s.habitCard}
                    onPress={() => toggle(habit.id, doneIds.has(habit.id))}
                  >
                    <View style={s.habitIconWrap}>
                      <Ionicons
                        name={resolveIoniconName(habit.icon, "star-outline")}
                        size={22}
                        color={C.iconSecondary}
                      />
                    </View>
                    <View style={s.habitInfo}>
                      <Text style={s.habitTitle} numberOfLines={1}>
                        {habit.title}
                      </Text>
                      {habit.subtitle ? (
                        <Text style={s.habitDuration} numberOfLines={1}>
                          {habit.subtitle}
                        </Text>
                      ) : null}
                      <View style={s.streakDotsRow}>
                        {Array.from({ length: 10 }).map((_, index) => (
                          <View
                            key={`${habit.id}-dot-${index}`}
                            style={[
                              s.streakDot,
                              index < streakDots && s.streakDotActive,
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                    <View style={s.streakBadge}>
                      <Text style={s.streakText}>{streak}</Text>
                      <Text style={s.streakLabel}>day streak</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={s.section}>
          <Text style={s.sectionLabel}>CURRENT FOCUS</Text>
          <View style={s.card}>
            <View style={s.focusHeader}>
              <View style={s.focusBadge}>
                <Ionicons name="flag-outline" size={12} color={C.accentText} />
                <Text style={s.focusBadgeText}>
                  {currentFocus ? FOCUS_LABELS[currentFocus] : "Focus not set"}
                </Text>
              </View>
              <Text style={s.focusRule}>Unlock next after 14 days</Text>
            </View>
            {currentFocus ? (
              <>
                <Text style={s.focusText}>
                  Stay with one keystone long enough for it to become automatic. Each next habit
                  in this focus path unlocks after the previous one reaches a 14-day streak.
                </Text>
                <View style={s.focusTrackList}>
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
                          s.focusHabitCard,
                          status === "available" && s.focusHabitCardAvailable,
                          status === "locked" && s.focusHabitCardLocked,
                        ]}
                        disabled={status !== "available"}
                        onPress={() => addFocusHabit(stage.keystone)}
                      >
                        <View style={s.focusHabitLeft}>
                          <View
                            style={[
                              s.focusHabitIconWrap,
                              status === "available" && s.focusHabitIconWrapAvailable,
                            ]}
                          >
                            <Ionicons
                              name={resolveIoniconName(stage.keystone.icon, "star-outline")}
                              size={18}
                              color={status === "available" ? C.accentText : C.iconSecondary}
                            />
                          </View>
                          <View style={s.focusHabitInfo}>
                            <Text style={s.focusHabitTitle}>{stage.keystone.title}</Text>
                            <Text style={s.focusHabitSubtitle}>{stage.keystone.subtitle}</Text>
                          </View>
                        </View>
                        {status === "active" ? (
                          <View style={s.focusHabitRight}>
                            <Text style={s.focusHabitMetric}>{stage.streak}</Text>
                            <Text style={s.focusHabitStatus}>day streak</Text>
                          </View>
                        ) : status === "available" ? (
                          <View style={s.focusHabitRight}>
                            <Ionicons name="add-circle" size={22} color={C.accentText} />
                            <Text style={s.focusHabitAvailable}>Add</Text>
                          </View>
                        ) : (
                          <View style={s.focusHabitRight}>
                            <Ionicons name="lock-closed" size={16} color={C.textQuaternary} />
                            <Text style={s.focusHabitLockedText}>
                              {Math.max(UNLOCK_STREAK_DAYS - stage.nextUnlockStreak, 0)} days left
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : (
              <Text style={s.focusText}>
                Complete onboarding and choose a keystone habit to start a focus path.
              </Text>
            )}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>ALL PATHS</Text>
          <View style={s.focusGroupsList}>
            {focusEntries.map(([focusKey, focusHabits]) => (
              <View key={focusKey} style={s.focusGroupCard}>
                <Collapsible
                  title={FOCUS_LABELS[focusKey] ?? focusKey}
                  headerContent={
                    <View style={s.focusGroupHeaderContent}>
                      <View style={s.focusGroupHeaderIconWrap}>
                        <Ionicons
                          name={FOCUS_ICONS[focusKey] ?? "ellipse-outline"}
                          size={20}
                          color={C.iconSecondary}
                        />
                      </View>
                      <Text style={s.focusGroupTitle}>{FOCUS_LABELS[focusKey] ?? focusKey}</Text>
                    </View>
                  }
                  contentStyle={s.focusGroupContent}
                >
                  <View style={s.focusGroupItems}>
                    {focusHabits.map((habit) => {
                      const isOwned = existingHabitMap.has(habitKey(habit.title, habit.subtitle));
                      return (
                        <View key={`${focusKey}-${habit.title}`} style={s.focusGroupItem}>
                          <Ionicons
                            name={resolveIoniconName(habit.icon, "star-outline")}
                            size={16}
                            color={C.iconSecondary}
                            style={s.focusGroupIcon}
                          />
                          <Text style={s.focusGroupItemText} numberOfLines={1}>
                            {habit.title}
                          </Text>
                          {isOwned && (
                            <Ionicons name="checkmark-circle" size={14} color={C.accentText} />
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

function makeStyles(C: ReturnType<typeof import("@/hooks/useTheme").useTheme>) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: 20 },
    section: { marginBottom: 24 },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.5,
      color: C.textTertiary,
      marginBottom: 10,
    },
    card: {
      backgroundColor: C.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 16,
    },
    progressCard: {
      backgroundColor: C.cardBg,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingHorizontal: 18,
      paddingVertical: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 18,
    },
    progressRingWrap: {
      width: PROGRESS_RING_SIZE,
      height: PROGRESS_RING_SIZE,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    progressRingCenter: {
      position: "absolute",
      alignItems: "center",
      justifyContent: "center",
    },
    progressValue: {
      fontSize: 23,
      fontWeight: "700",
      color: C.textPrimary,
      letterSpacing: -0.4,
    },
    progressValueLabel: {
      marginTop: 4,
      fontSize: 13,
      color: C.textSecondary,
      fontWeight: "500",
    },
    progressStats: {
      flex: 1,
      minWidth: 116,
      gap: 18,
    },
    progressStatRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    progressStatIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.inputBg,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    progressStatValue: {
      fontSize: 18,
      fontWeight: "700",
      color: C.textPrimary,
      lineHeight: 20,
    },
    progressStatLabel: {
      marginTop: 2,
      fontSize: 14,
      color: C.textSecondary,
      lineHeight: 18,
    },
    habitList: { gap: 10 },
    habitCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 16,
      gap: 12,
      backgroundColor: C.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    habitIconWrap: {
      width: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    habitInfo: { flex: 1 },
    habitTitle: { fontSize: 15, fontWeight: "600", color: C.textPrimary },
    habitDuration: {
      fontSize: 13,
      fontWeight: "500",
      color: C.textQuaternary,
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
      borderColor: C.cardBorder,
      backgroundColor: C.inputBg,
    },
    streakDotActive: {
      borderColor: C.accentBorder,
      backgroundColor: C.accentText,
    },
    streakBadge: { alignItems: "flex-end" },
    streakText: { fontSize: 19, fontWeight: "800", color: C.accentText, lineHeight: 20 },
    streakLabel: { fontSize: 11, color: C.textTertiary, marginTop: 6 },
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
      backgroundColor: C.accentBg,
      borderWidth: 1,
      borderColor: C.accentBorder,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    focusBadgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: C.accentText,
    },
    focusRule: {
      fontSize: 11,
      color: C.textQuaternary,
    },
    focusText: {
      fontSize: 13,
      color: C.textSecondary,
      lineHeight: 19,
      marginTop: 12,
    },
    focusTrackList: { gap: 10, marginTop: 16 },
    focusHabitCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: C.inputBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 14,
      gap: 12,
    },
    focusHabitCardAvailable: {
      borderColor: C.accentBorder,
      backgroundColor: C.accentBgSubtle,
    },
    focusHabitCardLocked: { opacity: 0.6 },
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
      backgroundColor: C.cardBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    focusHabitIconWrapAvailable: { backgroundColor: C.accentBg },
    focusHabitInfo: { flex: 1 },
    focusHabitTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: C.textPrimary,
    },
    focusHabitSubtitle: {
      fontSize: 12,
      color: C.textQuaternary,
      marginTop: 2,
    },
    focusHabitRight: { alignItems: "flex-end", minWidth: 62 },
    focusHabitMetric: {
      fontSize: 18,
      fontWeight: "800",
      color: C.accentText,
    },
    focusHabitStatus: {
      fontSize: 10,
      color: C.textTertiary,
      marginTop: 2,
    },
    focusHabitAvailable: {
      fontSize: 11,
      color: C.accentText,
      fontWeight: "700",
      marginTop: 2,
    },
    focusHabitLockedText: {
      fontSize: 10,
      color: C.textTertiary,
      marginTop: 4,
    },
    focusGroupsList: { gap: 10 },
    focusGroupCard: {
      backgroundColor: C.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
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
      backgroundColor: C.cardBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    focusGroupTitle: {
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 20,
      color: C.textPrimary,
    },
    focusGroupContent: { marginLeft: 0 },
    focusGroupItems: { gap: 8 },
    focusGroupItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    focusGroupIcon: { width: 18, textAlign: "center" },
    focusGroupItemText: {
      flex: 1,
      fontSize: 13,
      color: C.textSecondary,
    },
  });
}
