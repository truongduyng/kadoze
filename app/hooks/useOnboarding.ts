import { useCallback, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { router } from "expo-router";
import { profileOps, habitOps } from "@/lib/db";

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

export type StepType = "hook" | "empathy" | "promise" | "goal" | "keystone";

export interface StepConfig {
  type: StepType;
}

export const STEPS: StepConfig[] = [
  { type: "hook" },
  { type: "empathy" },
  { type: "promise" },
  { type: "goal" },
  { type: "keystone" },
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
}

export const KEYSTONE_HABITS_BY_FOCUS: Record<string, KeystoneHabit[]> = {
  health: [
    {
      id: "walk",
      icon: "🚶",
      title: "10-minute walk",
      subtitle: "Move your body every day",
    },
    {
      id: "water",
      icon: "💧",
      title: "Drink 2L of water",
      subtitle: "Stay consistently hydrated",
    },
    {
      id: "sleep",
      icon: "😴",
      title: "7–8 hours of sleep",
      subtitle: "Sleep with intention",
    },
    {
      id: "stretch",
      icon: "🧘",
      title: "5-min morning stretch",
      subtitle: "Wake up your body gently",
    },
  ],
  mindset: [
    {
      id: "journal",
      icon: "📓",
      title: "5-min journaling",
      subtitle: "Reflect on your thoughts",
    },
    {
      id: "quiet",
      icon: "🧘",
      title: "5 minutes of quiet",
      subtitle: "Meditate or breathe deeply",
    },
    {
      id: "gratitude",
      icon: "🙏",
      title: "Gratitude practice",
      subtitle: "3 things you're grateful for",
    },
    {
      id: "read",
      icon: "📖",
      title: "Read 10 pages",
      subtitle: "Feed your mind daily",
    },
  ],
  work: [
    {
      id: "mit",
      icon: "🎯",
      title: "Pick your MIT",
      subtitle: "One task that moves the needle",
    },
    {
      id: "nophone",
      icon: "📵",
      title: "No phone first hour",
      subtitle: "Start deep, not reactive",
    },
    {
      id: "plan",
      icon: "📋",
      title: "Plan tomorrow tonight",
      subtitle: "Wake up with clarity",
    },
    {
      id: "pomodoro",
      icon: "⏱️",
      title: "One focused sprint",
      subtitle: "25 min of pure deep work",
    },
  ],
  relations: [
    {
      id: "connect",
      icon: "💬",
      title: "Reach out to someone",
      subtitle: "One genuine message a day",
    },
    {
      id: "listen",
      icon: "👂",
      title: "Practice listening",
      subtitle: "Be fully present in conversations",
    },
    {
      id: "gratitude",
      icon: "🙏",
      title: "Express gratitude",
      subtitle: "Tell someone you appreciate them",
    },
    {
      id: "offline",
      icon: "📵",
      title: "Phone-free meals",
      subtitle: "Be present with people around you",
    },
  ],
  creative: [
    {
      id: "create",
      icon: "✏️",
      title: "Create something",
      subtitle: "Even 10 min of making",
    },
    {
      id: "capture",
      icon: "📸",
      title: "Capture one idea",
      subtitle: "Write, draw, or record it",
    },
    {
      id: "explore",
      icon: "🌍",
      title: "Learn something new",
      subtitle: "Fuel curiosity daily",
    },
    {
      id: "noscreen",
      icon: "🌿",
      title: "Nature break",
      subtitle: "Step outside for fresh air",
    },
  ],
  finance: [
    {
      id: "review",
      icon: "📊",
      title: "Review your spending",
      subtitle: "Know where your money goes",
    },
    {
      id: "save",
      icon: "💰",
      title: "Save before spending",
      subtitle: "Pay yourself first",
    },
    {
      id: "learn",
      icon: "📖",
      title: "Read about money",
      subtitle: "10 min of financial learning",
    },
    {
      id: "track",
      icon: "🎯",
      title: "Track one financial goal",
      subtitle: "Progress compounds daily",
    },
  ],
};

// Fallback for unknown focus
export const DEFAULT_KEYSTONE_HABITS: KeystoneHabit[] = [
  {
    id: "walk",
    icon: "🚶",
    title: "10-minute walk",
    subtitle: "Move your body every day",
  },
  {
    id: "quiet",
    icon: "🧘",
    title: "5 minutes of quiet",
    subtitle: "Meditate or reflect",
  },
  {
    id: "gratitude",
    icon: "🙏",
    title: "Gratitude practice",
    subtitle: "3 things you're grateful for",
  },
  {
    id: "journal",
    icon: "📓",
    title: "5-min journaling",
    subtitle: "Reflect on your thoughts",
  },
];

// Keep for backward compat with completeOnboarding
export const KEYSTONE_HABITS: KeystoneHabit[] = [
  ...DEFAULT_KEYSTONE_HABITS,
  ...Object.values(KEYSTONE_HABITS_BY_FOCUS).flat(),
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

  const goToStep = useCallback(
    (next: number) => {
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
    },
    [fadeAnim],
  );

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
      const selected = KEYSTONE_HABITS.find((h) => h.id === keystoneHabit);
      await habitOps.create({
        title: selected?.title ?? "10-minute walk",
        subtitle: selected?.subtitle,
        icon: selected?.icon,
        daysOfWeek: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
        isLocked: false,
        sortOrder: 0,
      });

    } catch (e) {
      console.error("Error completing onboarding:", e);
    }
    router.replace("/(tabs)");
  }, [keystoneHabit]);

  const showBack = currentStep > 0;

  return {
    currentStep,
    fadeAnim,
    coreProblem,
    setCoreProblem,
    mainGoal,
    setMainGoal,
    keystoneHabit,
    setKeystoneHabit,
    goNext,
    goBack,
    goToStep,
    showBack,
    completeOnboarding,
  };
}
