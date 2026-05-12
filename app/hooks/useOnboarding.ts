import { useCallback, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { router } from "expo-router";
import { profileOps, habitOps, dailyFocusOps } from "@/lib/db";

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

export type StepType =
  | "hook"
  | "empathy"
  | "promise"
  | "goal"
  | "keystone"
  | "conversion";

export interface StepConfig {
  type: StepType;
}

export const STEPS: StepConfig[] = [
  { type: "hook" },
  { type: "empathy" },
  { type: "promise" },
  { type: "goal" },
  { type: "keystone" },
  { type: "conversion" },
];

export const TOTAL = STEPS.length;

// ---------------------------------------------------------------------------
// Keystone habits
// ---------------------------------------------------------------------------

export interface KeystoneHabit {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  locked: boolean;
}

export const KEYSTONE_HABITS: KeystoneHabit[] = [
  { id: "walk", icon: "🚶", title: "10-minute walk", subtitle: "Move your body", locked: false },
  { id: "water", icon: "💧", title: "Drink 2L of water", subtitle: "Stay hydrated", locked: true },
  { id: "quiet", icon: "🧘", title: "5 minutes of quiet", subtitle: "Meditate or reflect", locked: true },
  { id: "sleep", icon: "😴", title: "7–8 hours of sleep", subtitle: "Sleep with intention", locked: true },
  { id: "gratitude", icon: "🙏", title: "Gratitude practice", subtitle: "3 things you're grateful for", locked: true },
];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [coreProblem, setCoreProblem] = useState<string | null>(null);
  const [mainGoal, setMainGoal] = useState("");
  const [keystoneHabit, setKeystoneHabit] = useState<string>("walk");

  const [showPaywall, setShowPaywall] = useState(false);

  const goToStep = useCallback((next: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 140,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(next);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  const goNext = useCallback(() => {
    const next = currentStep + 1;
    if (next >= TOTAL) return;
    goToStep(next);
  }, [currentStep, goToStep]);

  const goBack = useCallback(() => {
    if (currentStep > 0) goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  const completeOnboarding = useCallback(async () => {
    try {
      const profile = await profileOps.getFirst();
      if (profile) {
        await profileOps.update(profile.id, {
          name: "User",
          onboardingCompleted: true,
        });
      }

      // Save keystone habit
      const selected = KEYSTONE_HABITS.find(h => h.id === keystoneHabit);
      await habitOps.create({
        title: selected?.title ?? "10-minute walk",
        subtitle: selected?.subtitle,
        icon: selected?.icon,
        daysOfWeek: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
        isLocked: false,
        sortOrder: 0,
      });

      // Save today's main goal
      if (mainGoal.trim()) {
        await dailyFocusOps.upsertGoal(mainGoal.trim());
      }
    } catch (e) {
      console.error("Error completing onboarding:", e);
    }
    router.replace("/(tabs)");
  }, [mainGoal, keystoneHabit]);

  const step = STEPS[currentStep];
  const showBack =
    currentStep > 0 &&
    step.type !== "empathy" &&
    step.type !== "promise" &&
    step.type !== "conversion";

  return {
    currentStep,
    fadeAnim,
    coreProblem,
    setCoreProblem,
    mainGoal,
    setMainGoal,
    keystoneHabit,
    setKeystoneHabit,
    showPaywall,
    setShowPaywall,
    goNext,
    goBack,
    goToStep,
    showBack,
    completeOnboarding,
  };
}
