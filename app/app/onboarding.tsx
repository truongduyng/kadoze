import React from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";

import GradientBackground from "@/components/GradientBackground";
import { useTheme } from "@/hooks/useTheme";
import ProgressBar from "@/components/onboarding/ProgressBar";
import HookStep from "@/components/onboarding/HookStep";
import EmpathyStep from "@/components/onboarding/EmpathyStep";
import IdentityStep from "@/components/onboarding/IdentityStep";
import PromiseStep from "@/components/onboarding/PromiseStep";
import GoalStep from "@/components/onboarding/GoalStep";
import KeystoneStep from "@/components/onboarding/KeystoneStep";
import { STEPS, TOTAL, useOnboarding } from "@/hooks/useOnboarding";

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
      <GradientBackground />

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
          {__DEV__ && (
            <View style={s.devBadge}>
              <Text style={s.devText}>DEV · {currentStep + 1}/{TOTAL}</Text>
            </View>
          )}
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
      paddingBottom: 4,
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
