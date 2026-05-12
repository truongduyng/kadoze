import GradientBackground from "@/components/GradientBackground";
import { db, habits, habitCompletions, dailyFocus, todos, completionOps, todoOps, dailyFocusOps } from "@/lib/db";
import { getTodayInLocalTimezone, getLocalDateString, formatDateInLocalTimezone } from "@/lib/timezone";
import { useProfile } from "@/hooks/useProfile";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { eq, desc } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState, useRef } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DAY_NAMES } from "@/lib/performance";
import { palette } from "@/constants/theme";
import { SymbolView } from "expo-symbols";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SwipeableRow } from "@/components/todo/SwipeableRow";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile } = useProfile();
  const today = useMemo(() => getTodayInLocalTimezone(), []);
  const todayKey = getLocalDateString(today);
  const todayName = DAY_NAMES[today.getDay()];

  const dateLabel = formatDateInLocalTimezone(today, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const { data: allHabits } = useLiveQuery(db.select().from(habits));
  const { data: allCompletions } = useLiveQuery(db.select().from(habitCompletions));
  const { data: focusRows } = useLiveQuery(
    db.select().from(dailyFocus).orderBy(desc(dailyFocus.date)).limit(5)
  );
  const { data: todayTodos } = useLiveQuery(
    db.select().from(todos).where(eq(todos.date, todayKey))
  );

  const todayFocus = useMemo(
    () => focusRows?.find((f) => f.date === todayKey) ?? null,
    [focusRows, todayKey]
  );

  // Goal editing
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState("");
  const goalInputRef = useRef<TextInput>(null);

  const openGoalEditor = () => {
    setGoalDraft(todayFocus?.goal ?? "");
    setEditingGoal(true);
    setTimeout(() => goalInputRef.current?.focus(), 50);
  };

  const saveGoal = async () => {
    setEditingGoal(false);
    Keyboard.dismiss();
    await dailyFocusOps.upsertGoal(goalDraft);
  };

  // Habits
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

  const toggleHabit = async (habitId: number, isDone: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isDone) {
      await completionOps.markUndone(habitId, today);
    } else {
      await completionOps.markDone(habitId, today);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // Todos
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const addTodo = async () => {
    const title = inputText.trim();
    if (!title) return;
    setInputText("");
    Keyboard.dismiss();
    await todoOps.add(todayKey, title);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleTodo = async (id: number, done: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await todoOps.toggle(id, !done);
    if (!done) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const deleteTodo = async (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await todoOps.delete(id);
  };

  const sortedTodos = todayTodos ?? [];

  const firstName = userProfile?.name?.split(" ")[0] ?? "there";
  const goalText = (todayFocus?.goal ?? "").trim();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <GradientBackground />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 96 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.greetingRow}>
              <Text style={styles.greeting}>
                {getGreeting()}, {firstName}
              </Text>
              <SymbolView
                name="hand.wave"
                size={22}
                tintColor={palette.orange}
                style={styles.waveIcon}
              />
            </View>
            <Text style={styles.date}>{dateLabel}</Text>
          </View>
        </View>

        {/* One Main Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ONE MAIN GOAL</Text>
          <View style={styles.goalCard}>
            <View style={styles.goalContent}>
              {editingGoal ? (
                <>
                  <TextInput
                    ref={goalInputRef}
                    style={styles.goalInput}
                    value={goalDraft}
                    onChangeText={setGoalDraft}
                    onBlur={saveGoal}
                    placeholder="What's your main goal these days?"
                    placeholderTextColor={palette.white25}
                    multiline
                  />
                </>
              ) : (
                <Pressable onPress={openGoalEditor}>
                  {goalText ? (
                    <Text style={styles.goalText}>{goalText}</Text>
                  ) : (
                    <View style={styles.goalPlaceholderCard}>
                      <Text style={styles.goalPlaceholderTitle}>Set one clear target</Text>
                      <Text style={styles.goalPlaceholderBody}>
                        Choose the main outcome you want this day to revolve around.
                      </Text>
                    </View>
                  )}
                </Pressable>
              )}
            </View>
            {!editingGoal && (
              <View style={styles.goalRing}>
                <View style={styles.ringOuter}>
                  {goalText ? (
                    <Pressable
                      style={styles.focusRingButton}
                      onPress={() => router.push("/focus" as any)}
                    >
                      <Text style={styles.focusRingIcon}>▶</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.ringInner} />
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Today's Habits */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{"HABITS"}</Text>
          <View style={styles.card}>
            {todayHabits.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No habits scheduled for today</Text>
              </View>
            ) : (
              todayHabits.map((habit, i) => {
                const done = doneIds.has(habit.id);
                return (
                  <View key={habit.id}>
                    {i > 0 && <View style={styles.divider} />}
                    <Pressable
                      style={styles.row}
                      onPress={() => toggleHabit(habit.id, done)}
                    >
                      <Text style={styles.habitIcon}>{habit.icon ?? "⭐"}</Text>
                      <View style={styles.rowInfo}>
                        <Text style={[styles.rowTitle, done && styles.rowTitleDone]}>
                          {habit.title}
                        </Text>
                        {habit.subtitle && (
                          <Text style={styles.rowSubtitle}>{habit.subtitle}</Text>
                        )}
                      </View>
                      <View style={[styles.checkbox, done && styles.checkboxDone]}>
                        {done && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </Pressable>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Today's To-Do */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{"TO-DO"}</Text>
          <View style={styles.card}>
            {sortedTodos.map((todo, i) => (
              <View key={todo.id}>
                {i > 0 && <View style={styles.divider} />}
                <SwipeableRow onDelete={() => deleteTodo(todo.id)}>
                  <View style={styles.row}>
                    <Pressable
                      style={[styles.checkbox, styles.todoCheckbox, todo.done && styles.checkboxDone]}
                      onPress={() => toggleTodo(todo.id, todo.done)}
                    >
                      {todo.done && <Text style={styles.checkmark}>✓</Text>}
                    </Pressable>
                    <Text
                      style={[styles.rowTitle, styles.todoTitle, todo.done && styles.rowTitleDone]}
                      onPress={() => toggleTodo(todo.id, todo.done)}
                      numberOfLines={3}
                    >
                      {todo.title}
                    </Text>
                  </View>
                </SwipeableRow>
              </View>
            ))}
            {sortedTodos.length > 0 && <View style={styles.divider} />}
            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Add a task..."
                placeholderTextColor={palette.white25}
                value={inputText}
                onChangeText={setInputText}
                multiline
                numberOfLines={3}
                maxLength={240}
                textAlignVertical="top"
              />
              {inputText.trim().length > 0 && (
                <Pressable style={styles.addBtn} onPress={addTodo}>
                  <Text style={styles.addBtnText}>+</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>EVENING RESET</Text>
          <Pressable style={styles.resetCard} onPress={() => router.push("/evening-reset" as any)}>
            <View style={styles.resetDecor}>
              <Image
                source={require("../../assets/evening.jpeg")}
                style={styles.resetDecorImage}
                resizeMode="cover"
              />
              <View style={styles.resetDecorOverlay} />
              <View style={styles.resetCopy}>
                <View style={styles.resetBadge}>
                  <Text style={styles.resetBadgeText}>10 MIN RESET</Text>
                </View>
                <Text style={styles.resetTitle}>Declutter before tomorrow</Text>
                <Text style={styles.resetBody}>
                  Clear your space, close the loop on today, and set up tomorrow.
                </Text>
              </View>
              <View style={styles.resetAction}>
                <Ionicons name="chevron-forward" size={18} color={palette.white} />
              </View>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  headerLeft: { flex: 1 },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: palette.white,
  },
  waveIcon: { marginTop: 1 },
  date: {
    fontSize: 13,
    color: palette.white40,
    fontWeight: "500",
  },

  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: palette.white35,
    marginBottom: 10,
  },

  goalCard: {
    backgroundColor: palette.white06,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.white08,
    padding: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  goalContent: { flex: 1 },
  goalText: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.white,
    lineHeight: 26,
    marginBottom: 14,
  },
  goalInput: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.white,
    lineHeight: 26,
    marginBottom: 14,
    minHeight: 52,
  },
  goalPlaceholderCard: {
    marginBottom: 14,
    gap: 8,
  },
  goalPlaceholderBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(251,146,60,0.12)",
    borderWidth: 1,
    borderColor: palette.orange25,
  },
  goalPlaceholderBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: palette.orange,
  },
  goalPlaceholderTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: palette.white70,
    lineHeight: 23,
  },
  goalPlaceholderBody: {
    fontSize: 14,
    color: palette.white40,
    lineHeight: 21,
    maxWidth: 240,
  },
  goalRing: { alignItems: "center", justifyContent: "center" },
  ringOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 5,
    borderColor: palette.orange25,
    borderTopColor: palette.orange,
    borderRightColor: palette.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(251,146,60,0.08)",
  },
  focusRingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  focusRingIcon: {
    fontSize: 14,
    color: palette.white,
    fontWeight: "800",
    marginLeft: 2,
  },

  card: {
    backgroundColor: palette.white06,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.white08,
    overflow: "hidden",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.white08,
    marginHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  habitIcon: { fontSize: 22, width: 28, textAlign: "center" },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: "600", color: palette.white },
  rowTitleDone: { color: palette.white45, textDecorationLine: "line-through" },
  rowSubtitle: { fontSize: 12, color: palette.white40, marginTop: 2 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: palette.white30,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: { backgroundColor: palette.orange, borderColor: palette.orange },
  checkmark: { fontSize: 11, color: palette.white, fontWeight: "700" },
  emptyRow: { paddingVertical: 20, paddingHorizontal: 16 },
  emptyText: { fontSize: 14, color: palette.white40, textAlign: "center" },

  todoCheckbox: { alignSelf: "flex-start", marginTop: 2 },
  todoTitle: { flex: 1, lineHeight: 21 },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: palette.white,
    paddingVertical: 6,
    minHeight: 34,
    maxHeight: 78,
  },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: palette.orange,
    borderRadius: 8,
  },
  addBtnText: { fontSize: 18, fontWeight: "800", color: palette.white },
  resetCard: {
    backgroundColor: "#0d1015",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.14)",
    overflow: "hidden",
  },
  resetCopy: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
  },
  resetDecor: {
    height: 190,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  resetDecorImage: {
    width: "100%",
    height: "100%",
  },
  resetDecorOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(5,7,10,0.34)",
  },
  resetBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(8,10,14,0.5)",
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.26)",
    marginBottom: 12,
  },
  resetBadgeText: {
    color: palette.orange,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  resetTitle: {
    color: palette.white,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
    marginBottom: 10,
  },
  resetBody: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 260,
  },
  resetAction: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.orange,
    alignItems: "center",
    justifyContent: "center",
  },
});
