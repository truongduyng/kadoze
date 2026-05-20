import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { router } from "expo-router";
import { profileOps, habitOps } from "@/lib/db";
import { storage } from "@/lib/storage";
import type { IoniconName } from "@/lib/iconNames";

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

export type StepType = "hook" | "empathy" | "identity" | "promise" | "goal" | "keystone" | "notifications" | "paywall";

export interface StepConfig {
  type: StepType;
}

export const STEPS: StepConfig[] = [
  { type: "hook" },
  { type: "empathy" },
  { type: "identity" },
  { type: "promise" },
  { type: "goal" },
  { type: "keystone" },
  { type: "notifications" },
  { type: "paywall" },
];

export const TOTAL = STEPS.length;

const ONBOARDING_DRAFT_KEY = "onboarding:draft";

interface OnboardingDraft {
  version: 1;
  currentStep: number;
  coreProblem: string | null;
  mainGoal: string;
  keystoneHabit: string;
  name: string;
  avatar: IoniconName;
}

const DEFAULT_ONBOARDING_DRAFT: OnboardingDraft = {
  version: 1,
  currentStep: 0,
  coreProblem: null,
  mainGoal: "",
  keystoneHabit: "",
  name: "",
  avatar: "happy-outline",
};

function readOnboardingDraft(): OnboardingDraft {
  const raw = storage.getString(ONBOARDING_DRAFT_KEY);
  if (!raw) return DEFAULT_ONBOARDING_DRAFT;

  try {
    const draft = JSON.parse(raw) as Partial<OnboardingDraft>;
    return {
      ...DEFAULT_ONBOARDING_DRAFT,
      ...draft,
      currentStep: Math.min(
        Math.max(Math.trunc(draft.currentStep ?? 0), 0),
        TOTAL - 1,
      ),
      coreProblem: draft.coreProblem ?? null,
      mainGoal: draft.mainGoal ?? "",
      keystoneHabit: draft.keystoneHabit ?? "",
      name: draft.name ?? "",
      avatar: draft.avatar ?? DEFAULT_ONBOARDING_DRAFT.avatar,
    };
  } catch {
    return DEFAULT_ONBOARDING_DRAFT;
  }
}

// ---------------------------------------------------------------------------
// Keystone habits
// ---------------------------------------------------------------------------

export interface KeystoneHabit {
  id: string;
  icon: IoniconName;
  title: string;
  subtitle: string;
}

export const KEYSTONE_HABITS_BY_FOCUS: Record<string, KeystoneHabit[]> = {
  health: [
    {
      id: "walk",
      icon: "walk-outline",
      title: "10-minute walk",
      subtitle: "Move your body every day",
    },
    {
      id: "water",
      icon: "water-outline",
      title: "Drink 2L of water",
      subtitle: "Stay consistently hydrated",
    },
    {
      id: "sleep",
      icon: "bed-outline",
      title: "7–8 hours of sleep",
      subtitle: "Sleep with intention",
    },
    {
      id: "stretch",
      icon: "body-outline",
      title: "5-min morning stretch",
      subtitle: "Wake up your body gently",
    },
  ],
  mindset: [
    {
      id: "journal",
      icon: "journal-outline",
      title: "5-min journaling",
      subtitle: "Reflect on your thoughts",
    },
    {
      id: "quiet",
      icon: "body-outline",
      title: "5 minutes of quiet",
      subtitle: "Meditate or breathe deeply",
    },
    {
      id: "gratitude",
      icon: "heart-outline",
      title: "Gratitude practice",
      subtitle: "3 things you're grateful for",
    },
    {
      id: "read",
      icon: "book-outline",
      title: "Read 10 pages",
      subtitle: "Feed your mind daily",
    },
  ],
  work: [
    {
      id: "mit",
      icon: "radio-button-on-outline",
      title: "Pick your MIT",
      subtitle: "One task that moves the needle",
    },
    {
      id: "nophone",
      icon: "phone-portrait-outline",
      title: "No phone first hour",
      subtitle: "Start deep, not reactive",
    },
    {
      id: "plan",
      icon: "clipboard-outline",
      title: "Plan tomorrow tonight",
      subtitle: "Wake up with clarity",
    },
    {
      id: "pomodoro",
      icon: "timer-outline",
      title: "One focused sprint",
      subtitle: "25 min of pure deep work",
    },
  ],
  relations: [
    {
      id: "connect",
      icon: "chatbubble-ellipses-outline",
      title: "Reach out to someone",
      subtitle: "One genuine message a day",
    },
    {
      id: "listen",
      icon: "ear-outline",
      title: "Practice listening",
      subtitle: "Be fully present in conversations",
    },
    {
      id: "gratitude",
      icon: "heart-outline",
      title: "Express gratitude",
      subtitle: "Tell someone you appreciate them",
    },
    {
      id: "offline",
      icon: "phone-portrait-outline",
      title: "Phone-free meals",
      subtitle: "Be present with people around you",
    },
  ],
  creative: [
    {
      id: "create",
      icon: "pencil-outline",
      title: "Create something",
      subtitle: "Even 10 min of making",
    },
    {
      id: "capture",
      icon: "camera-outline",
      title: "Capture one idea",
      subtitle: "Write, draw, or record it",
    },
    {
      id: "explore",
      icon: "earth-outline",
      title: "Learn something new",
      subtitle: "Fuel curiosity daily",
    },
    {
      id: "noscreen",
      icon: "leaf-outline",
      title: "Nature break",
      subtitle: "Step outside for fresh air",
    },
  ],
  finance: [
    {
      id: "review",
      icon: "stats-chart-outline",
      title: "Review your spending",
      subtitle: "Know where your money goes",
    },
    {
      id: "save",
      icon: "cash-outline",
      title: "Save before spending",
      subtitle: "Pay yourself first",
    },
    {
      id: "learn",
      icon: "book-outline",
      title: "Read about money",
      subtitle: "10 min of financial learning",
    },
    {
      id: "track",
      icon: "radio-button-on-outline",
      title: "Track one financial goal",
      subtitle: "Progress compounds daily",
    },
  ],
};

// Fallback for unknown focus
export const DEFAULT_KEYSTONE_HABITS: KeystoneHabit[] = [
  {
    id: "walk",
    icon: "walk-outline",
    title: "10-minute walk",
    subtitle: "Move your body every day",
  },
  {
    id: "quiet",
    icon: "body-outline",
    title: "5 minutes of quiet",
    subtitle: "Meditate or reflect",
  },
  {
    id: "gratitude",
    icon: "heart-outline",
    title: "Gratitude practice",
    subtitle: "3 things you're grateful for",
  },
  {
    id: "journal",
    icon: "journal-outline",
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
  const initialDraft = useRef(readOnboardingDraft()).current;
  const [currentStep, setCurrentStep] = useState(initialDraft.currentStep);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [coreProblem, setCoreProblem] = useState<string | null>(
    initialDraft.coreProblem,
  );
  const [mainGoal, setMainGoal] = useState(initialDraft.mainGoal);
  const [keystoneHabit, setKeystoneHabit] = useState<string>(
    initialDraft.keystoneHabit,
  );
  const [name, setName] = useState(initialDraft.name);
  const [avatar, setAvatar] = useState<IoniconName>(initialDraft.avatar);

  useEffect(() => {
    const draft: OnboardingDraft = {
      version: 1,
      currentStep,
      coreProblem,
      mainGoal,
      keystoneHabit,
      name,
      avatar,
    };
    storage.set(ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
  }, [avatar, coreProblem, currentStep, keystoneHabit, mainGoal, name]);

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
          name: name.trim() || "User",
          avatar,
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
    storage.remove(ONBOARDING_DRAFT_KEY);
    router.replace("/(tabs)");
  }, [avatar, keystoneHabit, name]);

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
    name,
    setName,
    avatar,
    setAvatar,
    goNext,
    goBack,
    goToStep,
    showBack,
    completeOnboarding,
  };
}
