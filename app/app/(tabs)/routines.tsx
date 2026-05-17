import GradientBackground from "@/components/GradientBackground";
import { Collapsible } from "@/components/ui/collapsible";
import { palette } from "@/constants/theme";
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
                <Ionicons name="flag-outline" size={12} color={palette.orange} />
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
                              color={status === "available" ? palette.orange : C.iconSecondary}
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
                            <Ionicons name="add-circle" size={22} color={palette.orange} />
                            <Text style={s.focusHabitAvailable}>Add</Text>
                          </View>
                        ) : (
                          <View style={s.focusHabitRight}>
                            <Ionicons name="lock-closed" size={16} color={C.textQuaternary} />
                            <Text style={s.focusHabitLockedText}>
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
      borderColor: palette.orange35,
      backgroundColor: palette.orange,
    },
    streakBadge: { alignItems: "flex-end" },
    streakText: { fontSize: 19, fontWeight: "800", color: palette.orange, lineHeight: 20 },
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
      color: palette.orange,
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
      color: palette.orange,
    },
    focusHabitStatus: {
      fontSize: 10,
      color: C.textTertiary,
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
