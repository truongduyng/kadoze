import GradientBackground from "@/components/GradientBackground";
import { db, habits, habitCompletions, dailyFocus, todos, completionOps, todoOps } from "@/lib/db";
import { getTodayInLocalTimezone, getLocalDateString, formatDateInLocalTimezone } from "@/lib/timezone";
import { useProfile } from "@/hooks/useProfile";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState, useRef } from "react";
import {
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
  const { data: focusRows } = useLiveQuery(db.select().from(dailyFocus).limit(1));
  const { data: todayTodos } = useLiveQuery(
    db.select().from(todos).where(eq(todos.date, todayKey))
  );

  const todayFocus = focusRows?.find((f) => f.date === todayKey) ?? null;

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

  // Todo input state
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

  const sortedTodos = useMemo(() => {
    const list = [...(todayTodos ?? [])];
    return list.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0);
    });
  }, [todayTodos]);

  const firstName = userProfile?.name?.split(" ")[0] ?? "there";

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
              <Text style={styles.goalText} numberOfLines={3}>
                {todayFocus?.goal || "Set your main goal for today"}
              </Text>
              <Pressable
                style={styles.focusButton}
                onPress={() => router.push("/chat" as any)}
              >
                <Text style={styles.focusButtonIcon}>▶</Text>
                <Text style={styles.focusButtonLabel}>Start Focus</Text>
              </Pressable>
            </View>
            <View style={styles.goalRing}>
              <View style={styles.ringOuter}>
                <View style={styles.ringInner} />
              </View>
            </View>
          </View>
        </View>

        {/* Today's Habits */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{"TODAY'S HABITS"}</Text>
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
          <Text style={styles.sectionLabel}>{"TODAY'S TO-DO"}</Text>
          <View style={styles.card}>
            {sortedTodos.map((todo, i) => (
              <View key={todo.id}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.row}>
                  <Pressable
                    style={[styles.checkbox, todo.done && styles.checkboxDone]}
                    onPress={() => toggleTodo(todo.id, todo.done)}
                  >
                    {todo.done && <Text style={styles.checkmark}>✓</Text>}
                  </Pressable>
                  <Text
                    style={[styles.rowTitle, styles.todoTitle, todo.done && styles.rowTitleDone]}
                    onPress={() => toggleTodo(todo.id, todo.done)}
                  >
                    {todo.title}
                  </Text>
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => deleteTodo(todo.id)}
                    hitSlop={8}
                  >
                    <Text style={styles.deleteBtnText}>×</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            {/* Add input */}
            {sortedTodos.length > 0 && <View style={styles.divider} />}
            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Add a task..."
                placeholderTextColor={palette.white25}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={addTodo}
                returnKeyType="done"
                submitBehavior="submit"
              />
              {inputText.trim().length > 0 && (
                <Pressable style={styles.addBtn} onPress={addTodo}>
                  <Text style={styles.addBtnText}>Add</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },

  // Header
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

  // Sections
  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: palette.white35,
    marginBottom: 10,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  editLink: {
    fontSize: 13,
    color: palette.orange,
    fontWeight: "600",
  },

  // Goal card
  goalCard: {
    backgroundColor: palette.white06,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.white08,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  goalContent: { flex: 1 },
  goalText: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.white,
    lineHeight: 24,
    marginBottom: 16,
  },
  focusButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: palette.orange,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  focusButtonIcon: { fontSize: 11, color: palette.white, fontWeight: "700" },
  focusButtonLabel: { fontSize: 15, fontWeight: "700", color: palette.white },

  // Ring indicator
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

  // Shared card
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
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: palette.white30,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: { backgroundColor: palette.orange, borderColor: palette.orange },
  checkmark: { fontSize: 13, color: palette.white, fontWeight: "700" },
  emptyRow: { paddingVertical: 20, paddingHorizontal: 16 },
  emptyText: { fontSize: 14, color: palette.white40, textAlign: "center" },

  // Todo-specific
  todoTitle: { flex: 1 },
  deleteBtn: { paddingHorizontal: 4 },
  deleteBtnText: { fontSize: 22, color: palette.white30, lineHeight: 26 },

  // Add input
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: palette.white,
    paddingVertical: 4,
  },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: palette.orange,
    borderRadius: 8,
  },
  addBtnText: { fontSize: 13, fontWeight: "700", color: palette.white },
});
