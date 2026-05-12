import React from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";

import GradientBackground from "@/components/GradientBackground";
import ProgressBar from "@/components/onboarding/ProgressBar";
import HookStep from "@/components/onboarding/HookStep";
import EmpathyStep from "@/components/onboarding/EmpathyStep";
import PromiseStep from "@/components/onboarding/PromiseStep";
import GoalStep from "@/components/onboarding/GoalStep";
import KeystoneStep from "@/components/onboarding/KeystoneStep";
import ConversionStep from "@/components/onboarding/ConversionStep";
import PaywallModal from "@/components/chat/PaywallModal";
import { STEPS, TOTAL, useOnboarding } from "@/hooks/useOnboarding";
import { PAYWALL_RESULT } from "react-native-purchases-ui";

export default function OnboardingScreen() {
  const {
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
            selected={keystoneHabit}
            onSelect={setKeystoneHabit}
            onNext={goNext}
          />
        );

      case "conversion":
        return (
          <ConversionStep
            onStartFree={completeOnboarding}
            onUpgrade={() => setShowPaywall(true)}
          />
        );
    }
  };

  const handlePaywallResult = (result: typeof PAYWALL_RESULT[keyof typeof PAYWALL_RESULT]) => {
    setShowPaywall(false);
    if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
      completeOnboarding();
    }
  };

  return (
    <View style={styles.container}>
      <GradientBackground />

      <SafeAreaView style={styles.safeArea}>
        <ProgressBar step={currentStep + 1} total={TOTAL} />

        <View style={styles.topBar}>
          {showBack ? (
            <TouchableOpacity onPress={goBack} hitSlop={12} style={styles.backBtn}>
              <Text style={styles.backChevron}>‹</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtn} />
          )}
          {__DEV__ && (
            <View style={styles.devBadge}>
              <Text style={styles.devText}>DEV · {currentStep + 1}/{TOTAL}</Text>
            </View>
          )}
        </View>

        <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
          {renderStep()}
        </Animated.View>
      </SafeAreaView>

      <PaywallModal
        visible={showPaywall}
        onResult={handlePaywallResult}
        allowDismiss
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: "rgba(255,255,255,0.6)",
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
