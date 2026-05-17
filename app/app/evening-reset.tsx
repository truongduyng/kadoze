import GradientBackground from "@/components/GradientBackground";
import { palette } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { dailyFocus, db, todoOps } from "@/lib/db";
import { getLocalDateString } from "@/lib/timezone";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

const RESET_DURATION_SECONDS = 10 * 60;
const RING_SIZE = 248;
const STROKE_WIDTH = 11;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const RESET_STEPS = [
  {
    title: "Clean your space",
    hint: "Put obvious things back, clear one surface, and remove visual noise.",
  },
  {
    title: "Clean your mind",
    hint: "Drop unfinished thoughts, worries, or reminders before you go to sleep.",
  },
  {
    title: "Plan for tomorrow",
    hint: "Set one main goal and one first to-do so tomorrow starts with direction.",
  },
] as const;

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getTomorrowKey() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getLocalDateString(tomorrow);
}

export default function EveningResetScreen() {
  const tomorrowKey = useMemo(() => getTomorrowKey(), []);
  const C = useTheme();
  const [remainingSeconds, setRemainingSeconds] = useState(RESET_DURATION_SECONDS);
  const [isRunning, setIsRunning] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [goalDraft, setGoalDraft] = useState("");
  const [todoDraft, setTodoDraft] = useState("");
  const [plannedTodos, setPlannedTodos] = useState<string[]>([]);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  useEffect(() => {
    if (!isRunning || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          clearInterval(interval);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, remainingSeconds]);

  useEffect(() => {
    let isActive = true;

    const loadTomorrowPlan = async () => {
      const [focusRow] = await db
        .select()
        .from(dailyFocus)
        .where(eq(dailyFocus.date, tomorrowKey))
        .limit(1);
      const todoRows = await todoOps.getByDate(tomorrowKey);

      if (!isActive) return;

      setGoalDraft(focusRow?.goal ?? "");
      setPlannedTodos(todoRows.map((todo) => todo.title.trim()).filter(Boolean));
    };

    void loadTomorrowPlan();

    return () => {
      isActive = false;
    };
  }, [tomorrowKey]);

  const progress = remainingSeconds / RESET_DURATION_SECONDS;
  const progressOffset = -CIRCUMFERENCE * (1 - progress);
  const countdownText = formatCountdown(remainingSeconds);
  const activeStepIndex = useMemo(
    () => RESET_STEPS.findIndex((_, index) => !completedSteps[index]),
    [completedSteps]
  );
  const isCompleted = activeStepIndex === -1;
  const currentStepIndex = activeStepIndex === -1 ? RESET_STEPS.length - 1 : activeStepIndex;
  const currentStep = RESET_STEPS[currentStepIndex];

  const saveTomorrowPlan = async () => {
    const normalizedGoal = goalDraft.trim();
    const normalizedTodos = plannedTodos
      .map((todo) => todo.trim())
      .filter(Boolean);

    if (!normalizedGoal || normalizedTodos.length === 0) return false;

    setIsSavingPlan(true);
    try {
      await db
        .insert(dailyFocus)
        .values({ date: tomorrowKey, goal: normalizedGoal, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: [dailyFocus.date],
          set: { goal: normalizedGoal, updatedAt: new Date() },
        });

      const existingTodos = await todoOps.getByDate(tomorrowKey);
      const existingTitles = new Set(existingTodos.map((todo) => todo.title.trim()));
      for (const todoTitle of normalizedTodos) {
        if (!existingTitles.has(todoTitle)) {
          await todoOps.add(tomorrowKey, todoTitle);
        }
      }

      return true;
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleStepPress = async (index: number) => {
    if (index > currentStepIndex) return;

    if (completedSteps[index]) {
      setCompletedSteps((current) => {
        const next = { ...current };
        delete next[index];
        for (let i = index + 1; i < RESET_STEPS.length; i += 1) {
          delete next[i];
        }
        return next;
      });
      return;
    }

    if (index === 2) {
      const saved = await saveTomorrowPlan();
      if (!saved) return;
    }

    setCompletedSteps((current) => {
      const next = { ...current, [index]: true };
      if (index === RESET_STEPS.length - 1) {
        setIsRunning(false);
      }
      return next;
    });
  };

  const addPlannedTodo = () => {
    const normalized = todoDraft.trim();
    if (!normalized) return;

    setPlannedTodos((current) => [...current, normalized]);
    setTodoDraft("");
  };

  const removePlannedTodo = (index: number) => {
    setPlannedTodos((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const s = makeStyles(C);

  return (
    <View style={s.container}>
      <GradientBackground />
      <SafeAreaView style={s.safeArea}>
        <KeyboardAvoidingView
          style={s.keyboard}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
        >
          <ScrollView
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
              <View style={s.header}>
                <Pressable onPress={() => router.back()} hitSlop={10} style={s.headerButton}>
                  <Ionicons name="chevron-back" size={24} color={C.iconSecondary} />
                </Pressable>
                <Text style={s.headerTitle}>Evening Reset</Text>
                <View style={s.headerSpacer} />
              </View>

              <View style={s.timerContent}>
                <View style={s.ringWrap}>
                  <Svg width={RING_SIZE} height={RING_SIZE} style={s.ringSvg}>
                    <Circle
                      cx={RING_SIZE / 2}
                      cy={RING_SIZE / 2}
                      r={RADIUS}
                      stroke={C.cardBorder}
                      strokeWidth={STROKE_WIDTH}
                      fill="none"
                    />
                    <Circle
                      cx={RING_SIZE / 2}
                      cy={RING_SIZE / 2}
                      r={RADIUS}
                      stroke={palette.orange}
                      strokeWidth={STROKE_WIDTH}
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                      strokeDashoffset={progressOffset}
                      transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                    />
                  </Svg>

                  <View style={s.ringCenter}>
                    <Text style={s.timerText}>{countdownText}</Text>
                    <Text style={s.timerMode}>Reset</Text>
                  </View>
                </View>

                {!isCompleted ? (
                  <Pressable
                    style={s.pauseControl}
                    onPress={() => setIsRunning((current) => !current)}
                  >
                    <Ionicons
                      name={isRunning ? "pause" : "play"}
                      size={22}
                      color={palette.white}
                    />
                  </Pressable>
                ) : null}

                <View style={s.stepsCard}>
                  <Text style={s.stepsLabel}>RESET STEPS</Text>

                  <View style={s.stepsList}>
                    {RESET_STEPS.map((item, index) => {
                      const isDone = Boolean(completedSteps[index]);
                      const isCurrent = index === currentStepIndex;
                      const isLocked = index > currentStepIndex;

                      return (
                        <Pressable
                          key={item.title}
                          style={[
                            s.stepRow,
                            isCurrent && s.stepRowCurrent,
                            isLocked && s.stepRowLocked,
                          ]}
                          onPress={() => handleStepPress(index)}
                        >
                          <View style={s.stepCopy}>
                            <Text style={s.stepKicker}>{index + 1}</Text>
                            <View style={s.stepTextWrap}>
                              <Text style={[s.stepText, isDone && s.stepTextActive]}>
                                {item.title}
                              </Text>
                              {isCurrent && !isCompleted ? (
                                <Text style={s.stepHint}>{currentStep.hint}</Text>
                              ) : null}
                            </View>
                          </View>
                          <View style={[s.stepIcon, isDone && s.stepIconActive]}>
                            {isDone ? (
                              <Ionicons name="checkmark" size={14} color={palette.white} />
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  {currentStepIndex === 2 && !isCompleted ? (
                    <View style={s.planCard}>
                      <Text style={s.planSectionLabel}>MAIN GOAL</Text>
                      <TextInput
                        style={s.planInput}
                        value={goalDraft}
                        onChangeText={setGoalDraft}
                        placeholder="Tomorrow's main goal"
                        placeholderTextColor={C.textPlaceholder}
                        returnKeyType="next"
                      />

                      <Text style={s.planSectionLabel}>TO-DO</Text>
                      <View style={s.todoCard}>
                        {plannedTodos.map((todo, index) => (
                          <View key={`${todo}-${index}`}>
                            {index > 0 ? <View style={s.todoDivider} /> : null}
                            <View style={s.todoRow}>
                              <View style={s.todoBullet} />
                              <Text style={s.todoText}>{todo}</Text>
                              <Pressable
                                style={s.todoDeleteButton}
                                onPress={() => removePlannedTodo(index)}
                                hitSlop={8}
                              >
                                <Text style={s.todoDeleteText}>×</Text>
                              </Pressable>
                            </View>
                          </View>
                        ))}
                        {plannedTodos.length > 0 ? <View style={s.todoDivider} /> : null}
                        <View style={s.todoInputRow}>
                          <TextInput
                            style={s.todoInput}
                            value={todoDraft}
                            onChangeText={setTodoDraft}
                            placeholder="Add a task..."
                            placeholderTextColor={C.textPlaceholder}
                            returnKeyType="done"
                            submitBehavior="submit"
                            onSubmitEditing={addPlannedTodo}
                          />
                          {todoDraft.trim().length > 0 ? (
                            <Pressable style={s.todoAddButton} onPress={addPlannedTodo}>
                              <Ionicons name="add" size={18} color={palette.white} />
                            </Pressable>
                          ) : null}
                        </View>
                      </View>
                      {isSavingPlan ? <Text style={s.planSaving}>Saving...</Text> : null}
                    </View>
                  ) : null}

                  {isCompleted ? (
                    <View style={s.doneInlineCard}>
                      <Text style={s.doneInlineTitle}>Great job.</Text>
                      <Text style={s.doneInlineBody}>
                        You&apos;ve reset your space and lined up tomorrow&apos;s first move.
                      </Text>
                      <Pressable
                        style={s.doneInlineButton}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.replace("/" as any);
                        }}
                      >
                        <Text style={s.doneInlineButtonText}>Done</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof import("@/hooks/useTheme").useTheme>) {
  return StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, paddingHorizontal: 24 },
    keyboard: { flex: 1 },
    scrollContent: { paddingBottom: 28 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 8,
    },
    headerButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    headerSpacer: { width: 36 },
    headerTitle: {
      color: C.textPrimary,
      fontSize: 18,
      fontWeight: "700",
    },
    timerContent: {
      alignItems: "center",
      paddingTop: 20,
      paddingBottom: 12,
    },
    ringWrap: {
      width: RING_SIZE,
      height: RING_SIZE,
      alignItems: "center",
      justifyContent: "center",
    },
    ringSvg: { position: "absolute" },
    ringCenter: {
      width: 184,
      height: 184,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: C.inputBg,
    },
    timerText: {
      color: C.textPrimary,
      fontSize: 58,
      fontWeight: "300",
      letterSpacing: -2,
    },
    timerMode: {
      marginTop: 4,
      color: C.textSecondary,
      fontSize: 24,
      fontWeight: "500",
    },
    pauseControl: {
      width: 66,
      height: 66,
      borderRadius: 33,
      backgroundColor: palette.orange,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 14,
    },
    stepsCard: {
      width: "100%",
      borderRadius: 18,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.cardBorder,
      paddingHorizontal: 18,
      paddingVertical: 18,
      marginTop: 28,
    },
    stepsLabel: {
      color: C.textTertiary,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.4,
      marginBottom: 16,
    },
    stepsList: { gap: 10 },
    stepRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    stepRowCurrent: { backgroundColor: C.inputBg },
    stepRowLocked: { opacity: 0.5 },
    stepCopy: {
      flex: 1,
      flexDirection: "row",
      gap: 10,
    },
    stepKicker: {
      color: C.textTertiary,
      fontSize: 13,
      fontWeight: "700",
      minWidth: 10,
      marginTop: 1,
    },
    stepTextWrap: { flex: 1, gap: 4 },
    stepText: {
      color: C.textSecondary,
      fontSize: 16,
      fontWeight: "600",
    },
    stepTextActive: { color: C.textPrimary },
    stepHint: {
      color: C.textQuaternary,
      fontSize: 13,
      lineHeight: 19,
    },
    stepIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.inputBg,
      alignItems: "center",
      justifyContent: "center",
    },
    stepIconActive: {
      borderColor: palette.orangeStrong,
      backgroundColor: palette.orangeStrong,
    },
    planCard: {
      marginTop: 16,
      gap: 10,
      paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: C.divider,
    },
    planSectionLabel: {
      color: C.textTertiary,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1.2,
      marginTop: 4,
    },
    planInput: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.inputBorder,
      backgroundColor: C.inputBg,
      color: C.textPrimary,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
    },
    todoCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.inputBg,
      overflow: "hidden",
    },
    todoDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: C.divider,
      marginHorizontal: 14,
    },
    todoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 13,
    },
    todoBullet: {
      width: 7,
      height: 7,
      borderRadius: 999,
      backgroundColor: palette.orange,
    },
    todoText: {
      flex: 1,
      color: C.textPrimary,
      fontSize: 15,
    },
    todoDeleteButton: { paddingHorizontal: 4 },
    todoDeleteText: {
      color: C.textTertiary,
      fontSize: 22,
      lineHeight: 24,
    },
    todoInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    todoInput: {
      flex: 1,
      color: C.textPrimary,
      fontSize: 15,
      paddingVertical: 4,
    },
    todoAddButton: {
      width: 32,
      height: 32,
      backgroundColor: palette.orange,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    planSaving: {
      color: palette.orange,
      fontSize: 12,
      fontWeight: "600",
    },
    doneInlineCard: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: C.divider,
      alignItems: "center",
    },
    doneInlineTitle: {
      color: C.textPrimary,
      fontSize: 22,
      fontWeight: "700",
      textAlign: "center",
    },
    doneInlineBody: {
      marginTop: 8,
      color: C.textTertiary,
      fontSize: 14,
      lineHeight: 21,
      textAlign: "center",
      maxWidth: 280,
    },
    doneInlineButton: {
      marginTop: 16,
      backgroundColor: palette.orange,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 28,
      alignItems: "center",
    },
    doneInlineButtonText: {
      color: palette.white,
      fontSize: 16,
      fontWeight: "700",
    },
  });
}
