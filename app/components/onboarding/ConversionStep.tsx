import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

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
  const C = useTheme();
  const s = makeStyles(C);

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.iconWrap}>
        <Ionicons name="sparkles-outline" size={40} color={palette.orange} />
      </View>

      <Text style={s.headline}>Your dashboard is ready.</Text>
      <Text style={s.subtext}>
        You&apos;re set up for the Free Tier, giving you the core focus tools.
      </Text>
      <Text style={s.upsell}>
        If you&apos;re serious about building lasting momentum, upgrade now for unlimited clarity.
      </Text>

      <View style={s.plans}>
        <View style={s.planCard}>
          <Text style={s.planName}>Free</Text>
          <Text style={s.planDesc}>Core tools to build daily momentum.</Text>
          <Text style={s.planPrice}>$0<Text style={s.planPeriod}> /forever</Text></Text>
          <View style={s.featureList}>
            {FREE_FEATURES.map((f) => (
              <View key={f} style={s.featureRow}>
                <Ionicons name="checkmark" size={14} color={C.textTertiary} />
                <Text style={s.featureText}>{f}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={s.freeBtn} onPress={onStartFree} activeOpacity={0.8}>
            <Text style={s.freeBtnText}>Start Free</Text>
          </TouchableOpacity>
        </View>

        <View style={[s.planCard, s.planCardPro]}>
          <View style={s.popularBadge}>
            <Text style={s.popularText}>Most Popular</Text>
          </View>
          <Text style={[s.planName, s.planNamePro]}>Pro</Text>
          <Text style={s.planDesc}>Everything unlocked.</Text>
          <Text style={[s.planPrice, s.planPricePro]}>
            $4.99<Text style={s.planPeriod}> /month</Text>
          </Text>
          <View style={s.featureList}>
            {PRO_FEATURES.map((f) => (
              <View key={f} style={s.featureRow}>
                <Ionicons name="checkmark" size={14} color={palette.orange} />
                <Text style={[s.featureText, s.featureTextPro]}>{f}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={s.proBtn} onPress={onUpgrade} activeOpacity={0.85}>
            <Text style={s.proBtnText}>Claim Early Adopter LTD</Text>
          </TouchableOpacity>
          <Text style={s.ltdNote}>One-time payment. Lifetime access.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function makeStyles(C: ReturnType<typeof import("@/hooks/useTheme").useTheme>) {
  return StyleSheet.create({
    scroll: { flex: 1 },
    container: {
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 40,
      gap: 16,
    },
    iconWrap: { alignItems: "center", marginBottom: 4 },
    headline: {
      fontSize: 26,
      fontWeight: "800",
      color: C.textPrimary,
      textAlign: "center",
      lineHeight: 32,
    },
    subtext: {
      fontSize: 14,
      color: C.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    upsell: {
      fontSize: 13,
      color: palette.orange,
      textAlign: "center",
      lineHeight: 19,
    },
    plans: { flexDirection: "row", gap: 12, marginTop: 4 },
    planCard: {
      flex: 1,
      backgroundColor: C.cardBg,
      borderWidth: 1.5,
      borderColor: C.cardBorder,
      borderRadius: 16,
      padding: 16,
      gap: 8,
    },
    planCardPro: {
      borderColor: palette.orange,
      backgroundColor: C.accentBgSubtle,
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
      color: C.textSecondary,
    },
    planNamePro: { color: C.textPrimary },
    planDesc: {
      fontSize: 11,
      color: C.textTertiary,
      lineHeight: 16,
    },
    planPrice: {
      fontSize: 22,
      fontWeight: "800",
      color: C.textSecondary,
    },
    planPricePro: { color: C.textPrimary },
    planPeriod: {
      fontSize: 12,
      fontWeight: "400",
      color: C.textTertiary,
    },
    featureList: { gap: 6, flex: 1 },
    featureRow: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
    featureText: {
      fontSize: 12,
      color: C.textSecondary,
      lineHeight: 17,
      flex: 1,
    },
    featureTextPro: { color: C.textPrimary },
    freeBtn: {
      marginTop: 8,
      backgroundColor: C.inputBg,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    freeBtnText: {
      color: C.textSecondary,
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
      color: C.textTertiary,
      textAlign: "center",
    },
  });
}
