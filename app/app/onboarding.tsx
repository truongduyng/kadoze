import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect } from "react";
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import GradientBackground from "@/components/GradientBackground";
import {
  FastWinsScreen,
  FutureScreen,
  GoalInputScreen,
  HookScreen,
  IdentityScreen,
  KeystoneScreen,
  PAIN_POINT_SET,
  PainScreen,
  PersonalizationScreen,
  PreviewScreen,
  SystemScreen,
  TrustScreen,
} from "@/components/onboarding/OnboardingFlowSteps";
import NotificationStep from "@/components/onboarding/NotificationStep";
import PaywallStep from "@/components/onboarding/PaywallStep";
import ProgressBar from "@/components/onboarding/ProgressBar";
import ReferralSourceStep from "@/components/onboarding/ReferralSourceStep";
import { palette } from "@/constants/theme";
import {
  STEPS,
  TOTAL,
  trackOnboardingEvent,
  useOnboarding,
  type KeystoneHabit,
} from "@/hooks/useOnboarding";

export default function OnboardingScreen() {
  const s = makeStyles();
  const {
    currentStep,
    fadeAnim,
    painPoints,
    setPainPoints,
    mainGoal,
    setMainGoal,
    keystoneHabit,
    setKeystoneHabit,
    referralSource,
    setReferralSource,
    goNext,
    goBack,
    showBack,
    completeOnboarding,
  } = useOnboarding();

  const step = STEPS[currentStep];

  useEffect(() => {
    const validPainPoints = painPoints.filter((pain) => PAIN_POINT_SET.has(pain));
    if (validPainPoints.length !== painPoints.length) {
      setPainPoints(validPainPoints);
    }
  }, [painPoints, setPainPoints]);

  const advance = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goNext();
  };

  const togglePain = (pain: string) => {
    setPainPoints((current) => {
      const validCurrent = current.filter((item) => PAIN_POINT_SET.has(item));
      const exists = validCurrent.includes(pain);
      const next = exists
        ? validCurrent.filter((item) => item !== pain)
        : validCurrent.length < 3
          ? [...validCurrent, pain]
          : validCurrent;
      if (!exists && next.includes(pain)) {
        trackOnboardingEvent("pain_selected", { pain, count: next.length });
      }
      return next;
    });
  };

  const selectHabit = (habit: KeystoneHabit) => {
    setKeystoneHabit(habit.id);
    trackOnboardingEvent("habit_selected", { habit: habit.id });
    void Haptics.selectionAsync();
  };

  const selectReferralSource = (source: string) => {
    setReferralSource(source);
    trackOnboardingEvent("referral_source_selected", { source });
  };

  const renderStep = () => {
    switch (step.type) {
      case "hook":
        return <HookScreen onNext={advance} />;
      case "pain":
        return (
          <PainScreen
            selected={painPoints}
            onToggle={togglePain}
            onNext={advance}
          />
        );
      case "future":
        return <FutureScreen onNext={advance} />;
      case "identity":
        return <IdentityScreen onNext={advance} />;
      case "wins":
        return <FastWinsScreen onNext={advance} />;
      case "system":
        return <SystemScreen onNext={advance} />;
      case "trust":
        return <TrustScreen onNext={advance} />;
      case "goal":
        return (
          <GoalInputScreen
            value={mainGoal}
            onChange={(value) => {
              setMainGoal(value);
              if (value.trim().length >= 10) {
                trackOnboardingEvent("goal_created", { length: value.trim().length });
              }
            }}
            onNext={advance}
          />
        );
      case "keystone":
        return (
          <KeystoneScreen
            selected={keystoneHabit}
            onSelect={selectHabit}
            onNext={advance}
            painPoints={painPoints}
          />
        );
      case "preview":
        return <PreviewScreen onNext={advance} />;
      case "personalization":
        return (
          <PersonalizationScreen
            goal={mainGoal}
            habitId={keystoneHabit}
            painPoints={painPoints}
            onNext={advance}
          />
        );
      case "notification":
        return <NotificationStep onNext={advance} />;
      case "referral":
        return (
          <ReferralSourceStep
            selected={referralSource}
            onSelect={selectReferralSource}
            onNext={advance}
          />
        );
      case "paywall":
        return <PaywallStep onComplete={completeOnboarding} />;
    }
  };

  return (
    <View style={s.container}>
      <GradientBackground variant="onboarding" />

      <SafeAreaView style={s.safeArea}>
        <View style={s.progressRow}>
          {showBack ? (
            <TouchableOpacity onPress={goBack} hitSlop={12} style={s.backBtn}>
              <Ionicons name="chevron-back" size={22} color={palette.white70} />
            </TouchableOpacity>
          ) : (
            <View style={s.backBtn} />
          )}
          <View style={s.progressTrack}>
            <ProgressBar step={currentStep + 1} total={TOTAL} compact />
          </View>
        </View>

        <Animated.View style={[s.flex, { opacity: fadeAnim }]}>
          {renderStep()}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

function makeStyles() {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#050505",
    },
    safeArea: {
      flex: 1,
      zIndex: 10,
    },
    flex: {
      flex: 1,
    },
    progressRow: {
      paddingHorizontal: 22,
      paddingTop: 8,
      paddingBottom: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    backBtn: {
      width: 24,
      height: 24,
      alignItems: "flex-start",
      justifyContent: "center",
    },
    progressTrack: {
      flex: 1,
    },
  });
}
