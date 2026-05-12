import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { palette } from "@/constants/theme";

interface ConversionStepProps {
  onStartFree: () => void;
  onUpgrade: () => void;
}

const FREE_FEATURES = [
  "1 Goal per day",
  "1 Habit slot",
  "Basic notes",
  "Focus timer",
];

const PRO_FEATURES = [
  "Unlimited goals",
  "Unlimited habits",
  "Advanced notes",
  "Insights & stats",
  "Cloud backup",
];

export default function ConversionStep({ onStartFree, onUpgrade }: ConversionStepProps) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>🎉</Text>
      </View>

      <Text style={styles.headline}>Your dashboard is ready.</Text>
      <Text style={styles.subtext}>
        You&apos;re set up for the Free Tier, giving you the core focus tools.
      </Text>
      <Text style={styles.upsell}>
        If you&apos;re serious about building lasting momentum, upgrade now for unlimited clarity.
      </Text>

      <View style={styles.plans}>
        {/* Free plan */}
        <View style={styles.planCard}>
          <Text style={styles.planName}>Free</Text>
          <Text style={styles.planDesc}>Core tools to build daily momentum.</Text>
          <Text style={styles.planPrice}>$0<Text style={styles.planPeriod}> /forever</Text></Text>
          <View style={styles.featureList}>
            {FREE_FEATURES.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.freeBtn} onPress={onStartFree} activeOpacity={0.8}>
            <Text style={styles.freeBtnText}>Start Free</Text>
          </TouchableOpacity>
        </View>

        {/* Pro plan */}
        <View style={[styles.planCard, styles.planCardPro]}>
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>Most Popular</Text>
          </View>
          <Text style={[styles.planName, styles.planNamePro]}>Pro</Text>
          <Text style={styles.planDesc}>Everything unlocked.</Text>
          <Text style={[styles.planPrice, styles.planPricePro]}>
            $4.99<Text style={styles.planPeriod}> /month</Text>
          </Text>
          <View style={styles.featureList}>
            {PRO_FEATURES.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Text style={[styles.featureCheck, styles.featureCheckPro]}>✓</Text>
                <Text style={[styles.featureText, styles.featureTextPro]}>{f}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.proBtn} onPress={onUpgrade} activeOpacity={0.85}>
            <Text style={styles.proBtnText}>Claim Early Adopter LTD</Text>
          </TouchableOpacity>
          <Text style={styles.ltdNote}>One-time payment. Lifetime access.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },
  iconWrap: {
    alignItems: "center",
    marginBottom: 4,
  },
  icon: {
    fontSize: 40,
  },
  headline: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    lineHeight: 32,
  },
  subtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    lineHeight: 20,
  },
  upsell: {
    fontSize: 13,
    color: palette.orange,
    textAlign: "center",
    lineHeight: 19,
  },
  plans: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  planCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  planCardPro: {
    borderColor: palette.orange,
    backgroundColor: "rgba(251,146,60,0.06)",
    position: "relative",
  },
  popularBadge: {
    position: "absolute",
    top: -1,
    right: -1,
    backgroundColor: palette.orange,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  popularText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
  planName: {
    fontSize: 18,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
  },
  planNamePro: {
    color: "#fff",
  },
  planDesc: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    lineHeight: 16,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
  },
  planPricePro: {
    color: "#fff",
  },
  planPeriod: {
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(255,255,255,0.4)",
  },
  featureList: {
    gap: 6,
    flex: 1,
  },
  featureRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
  },
  featureCheck: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    lineHeight: 17,
  },
  featureCheckPro: {
    color: palette.orange,
  },
  featureText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 17,
    flex: 1,
  },
  featureTextPro: {
    color: "rgba(255,255,255,0.85)",
  },
  freeBtn: {
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  freeBtnText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
  },
  proBtn: {
    marginTop: 8,
    backgroundColor: palette.orange,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  proBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 15,
  },
  ltdNote: {
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
    textAlign: "center",
  },
});
