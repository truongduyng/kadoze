import React from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";

import GradientBackground from "@/components/GradientBackground";
import { useTheme } from "@/hooks/useTheme";
import { palette } from "@/constants/theme";
import ProgressBar from "@/components/onboarding/ProgressBar";
import HookStep from "@/components/onboarding/HookStep";
import EmpathyStep from "@/components/onboarding/EmpathyStep";
import IdentityStep from "@/components/onboarding/IdentityStep";
import PromiseStep from "@/components/onboarding/PromiseStep";
import GoalStep from "@/components/onboarding/GoalStep";
import KeystoneStep from "@/components/onboarding/KeystoneStep";
import { STEPS, TOTAL, useOnboarding } from "@/hooks/useOnboarding";

const STEP_META: Record<
  string,
  {
    label: string;
    icon: React.ComponentProps<typeof Ionicons>["name"];
  }
> = {
  hook: { label: "Find your starting point", icon: "compass-outline" },
  empathy: { label: "Lower the noise", icon: "sparkles-outline" },
  identity: { label: "Make it yours", icon: "person-circle-outline" },
  promise: { label: "Choose focus", icon: "radio-button-on-outline" },
  goal: { label: "Set direction", icon: "flag-outline" },
  keystone: { label: "Build the anchor", icon: "flame-outline" },
};

export default function OnboardingScreen() {
  const C = useTheme();
  const s = makeStyles(C);
  const {
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
    showBack,
    completeOnboarding,
  } = useOnboarding();

  const step = STEPS[currentStep];
  const meta = STEP_META[step.type];

  const renderStep = () => {
    switch (step.type) {
      case "hook":
        return (
          <HookStep
            selected={coreProblem}
            onSelect={(v) => {
              setCoreProblem(v);
              setTimeout(() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                goNext();
              }, 220);
            }}
          />
        );

      case "empathy":
        return <EmpathyStep onNext={goNext} />;

      case "identity":
        return (
          <IdentityStep
            name={name}
            avatar={avatar}
            onChangeName={setName}
            onChangeAvatar={setAvatar}
            onNext={goNext}
          />
        );

      case "promise":
        return <PromiseStep onNext={goNext} />;

      case "goal":
        return (
          <GoalStep
            value={mainGoal}
            onChange={setMainGoal}
            onNext={goNext}
          />
        );

      case "keystone":
        return (
          <KeystoneStep
            focus={mainGoal}
            selected={keystoneHabit}
            onSelect={setKeystoneHabit}
            onNext={completeOnboarding}
          />
        );
    }
  };

  return (
    <View style={s.container}>
      <GradientBackground variant="onboarding" />

      <SafeAreaView style={s.safeArea}>
        <ProgressBar step={currentStep + 1} total={TOTAL} />

        <View style={s.topBar}>
          {showBack ? (
            <TouchableOpacity onPress={goBack} hitSlop={12} style={s.backBtn}>
              <Text style={s.backChevron}>‹</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.backBtn} />
          )}
          <View style={s.stepPill}>
            <Ionicons name={meta.icon} size={13} color={palette.orange} />
            <Text style={s.stepPillText}>{meta.label}</Text>
          </View>
          <View style={s.backBtn} />
        </View>

        <Animated.View style={[s.flex, { opacity: fadeAnim }]}>
          {renderStep()}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      zIndex: 10,
    },
    flex: {
      flex: 1,
    },
    topBar: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    backBtn: {
      width: 36,
      height: 36,
      justifyContent: "center",
    },
    backChevron: {
      fontSize: 32,
      color: C.textSecondary,
      lineHeight: 36,
    },
    stepPill: {
      minHeight: 34,
      maxWidth: 240,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      paddingHorizontal: 13,
      borderRadius: 17,
      backgroundColor: "rgba(0,0,0,0.28)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
    },
    stepPillText: {
      color: C.textSecondary,
      fontSize: 12,
      fontWeight: "700",
    },
    devBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: "rgba(255,80,80,0.2)",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "rgba(255,80,80,0.4)",
    },
    devText: {
      color: "#ff6060",
      fontSize: 10,
      fontWeight: "600",
    },
  });
}
