import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { palette } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

const PRIVACY_URL = "https://kado.app/privacy";
const TERMS_URL = "https://kado.app/terms";

const FEATURES = [
  { icon: "flame-outline" as const, text: "Unlimited habits & routines" },
  { icon: "flag-outline" as const, text: "Daily focus & goal tracking" },
  { icon: "moon-outline" as const, text: "Evening reset & reflection" },
  { icon: "timer-outline" as const, text: "Deep work focus timer" },
  { icon: "stats-chart-outline" as const, text: "Progress analytics" },
  { icon: "lock-open-outline" as const, text: "All future features" },
];

interface PaywallStepProps {
  onComplete: () => void;
}

function isAnnualPackage(pkg: PurchasesPackage) {
  return (
    pkg.packageType === "ANNUAL" ||
    pkg.product.identifier.toLowerCase().includes("annual") ||
    pkg.product.identifier.toLowerCase().includes("yearly")
  );
}

export default function PaywallStep({ onComplete }: PaywallStepProps) {
  const C = useTheme();
  const s = makeStyles(C);
  const { currentOffering, isLoading, refreshCustomerInfo } = useRevenueCat();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const packages = currentOffering?.availablePackages ?? [];

  const annualPkg = packages.find(isAnnualPackage);
  const [selectedPkg, setSelectedPkg] = useState<PurchasesPackage | null>(null);

  const effectiveSelected = selectedPkg ?? annualPkg ?? packages[0] ?? null;
  const selectedIsAnnual = effectiveSelected ? isAnnualPackage(effectiveSelected) : false;

  const handlePurchase = async () => {
    if (!effectiveSelected) return;
    setError(null);
    setPurchasing(true);
    try {
      await Purchases.purchasePackage(effectiveSelected);
      await refreshCustomerInfo();
      onComplete();
    } catch (e: any) {
      if (!e.userCancelled) {
        setError("Purchase failed. Please try again.");
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setError(null);
    setRestoring(true);
    try {
      const info = await Purchases.restorePurchases();
      const hasAccess =
        typeof info.entitlements.active["Full Access"] !== "undefined";
      if (hasAccess) {
        await refreshCustomerInfo();
        onComplete();
      } else {
        setError("No previous purchase found.");
      }
    } catch {
      setError("Restore failed. Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  const busy = purchasing || restoring;
  const ctaLabel = selectedIsAnnual ? "Start 3-day free trial" : "Subscribe now";

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.header}>
        <Text style={s.headline}>Build your best self.</Text>
        <Text style={s.sub}>
          Everything you need to stay focused, consistent, and on track.
        </Text>
      </View>

      <View style={s.featureList}>
        {FEATURES.map((f) => (
          <View key={f.text} style={s.featureRow}>
            <View style={s.featureIcon}>
              <Ionicons name={f.icon} size={18} color={palette.orange} />
            </View>
            <Text style={s.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      {error ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <ActivityIndicator color={palette.orange} style={s.loader} />
      ) : packages.length === 0 ? (
        <View style={s.noOfferingBox}>
          <Text style={s.noOfferingText}>
            Pricing unavailable. Continue to the app and subscribe from
            Settings.
          </Text>
        </View>
      ) : (
        <>
          <View style={s.packages}>
            {packages.map((pkg) => {
              const { product } = pkg;
              const isAnnual = isAnnualPackage(pkg);
              const isSelected = effectiveSelected?.identifier === pkg.identifier;
              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[s.pkgCard, isSelected && s.pkgCardSelected]}
                  onPress={() => setSelectedPkg(pkg)}
                  disabled={busy}
                  activeOpacity={0.8}
                >
                  <View style={s.pkgRow}>
                    <View style={s.pkgInfo}>
                      {isAnnual ? (
                        <View style={s.bestValueBadge}>
                          <Text style={s.bestValueText}>Best value</Text>
                        </View>
                      ) : null}
                      <Text style={[s.pkgTitle, isSelected && s.pkgTitleSelected]}>
                        {product.title || pkg.packageType}
                      </Text>
                      {isAnnual ? (
                        <Text style={s.pkgTrial}>3-day free trial, then</Text>
                      ) : null}
                    </View>
                    <View style={s.pkgPriceWrap}>
                      <Text style={[s.pkgPrice, isSelected && s.pkgPriceSelected]}>
                        {product.priceString}
                      </Text>
                      <Ionicons
                        name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                        size={22}
                        color={isSelected ? palette.orange : C.textQuaternary}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[s.ctaBtn, busy && s.ctaBtnDisabled]}
            onPress={handlePurchase}
            disabled={busy}
            activeOpacity={0.85}
          >
            {purchasing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.ctaBtnText}>{ctaLabel}</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={s.restoreBtn}
        onPress={handleRestore}
        disabled={busy}
      >
        {restoring ? (
          <ActivityIndicator color={palette.orange} size="small" />
        ) : (
          <Text style={s.restoreText}>Restore purchase</Text>
        )}
      </TouchableOpacity>

      <View style={s.legalRow}>
        <Text style={s.legal}>Auto-renews unless cancelled. </Text>
        <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
          <Text style={s.legalLink}>Terms</Text>
        </TouchableOpacity>
        <Text style={s.legal}> & </Text>
        <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
          <Text style={s.legalLink}>Privacy</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function makeStyles(C: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    scroll: { flex: 1 },
    container: {
      paddingHorizontal: 24,
      paddingBottom: 40,
      gap: 20,
    },
    header: { gap: 10, paddingTop: 8 },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      alignSelf: "flex-start",
      backgroundColor: C.accentBg,
      borderWidth: 1,
      borderColor: C.accentBorder,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: palette.orange,
    },
    headline: {
      fontSize: 30,
      fontWeight: "800",
      color: C.textPrimary,
      lineHeight: 36,
    },
    sub: {
      fontSize: 15,
      color: C.textTertiary,
      lineHeight: 22,
    },
    featureList: {
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.cardBorder,
      borderRadius: 16,
      padding: 16,
      gap: 12,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    featureIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: C.accentBg,
      alignItems: "center",
      justifyContent: "center",
    },
    featureText: {
      fontSize: 14,
      fontWeight: "500",
      color: C.textSecondary,
    },
    packages: { gap: 10 },
    pkgCard: {
      backgroundColor: C.cardBg,
      borderWidth: 1.5,
      borderColor: C.cardBorder,
      borderRadius: 16,
      padding: 18,
    },
    pkgCardSelected: {
      borderColor: palette.orange,
      backgroundColor: C.accentBgSubtle,
    },
    pkgRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    pkgInfo: { flex: 1, gap: 2 },
    pkgPriceWrap: {
      alignItems: "flex-end",
      gap: 4,
    },
    pkgTitleSelected: { color: C.textPrimary },
    pkgPriceSelected: { color: palette.orange },
    ctaBtn: {
      backgroundColor: palette.orange,
      borderRadius: 14,
      paddingVertical: 18,
      alignItems: "center",
    },
    ctaBtnDisabled: { opacity: 0.6 },
    ctaBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    bestValueBadge: {
      alignSelf: "flex-start",
      backgroundColor: palette.orange,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginBottom: 6,
    },
    bestValueText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#fff",
    },
    pkgTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: C.textSecondary,
    },
    pkgPrice: {
      fontSize: 20,
      fontWeight: "800",
      color: C.textPrimary,
    },
    pkgTrial: {
      fontSize: 12,
      color: C.textTertiary,
      marginTop: 2,
    },
    errorBox: {
      backgroundColor: "rgba(255,60,60,0.1)",
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: "rgba(255,60,60,0.25)",
    },
    errorText: {
      color: "#ff6060",
      fontSize: 13,
      textAlign: "center",
    },
    noOfferingBox: {
      backgroundColor: C.cardBg,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    noOfferingText: {
      color: C.textTertiary,
      fontSize: 13,
      textAlign: "center",
      lineHeight: 19,
    },
    loader: { alignSelf: "center" },
    restoreBtn: {
      alignSelf: "center",
      paddingVertical: 8,
    },
    restoreText: {
      fontSize: 14,
      color: C.textTertiary,
      textDecorationLine: "underline",
    },
    legalRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
    },
    legal: {
      fontSize: 11,
      color: C.textQuaternary,
      lineHeight: 16,
    },
    legalLink: {
      fontSize: 11,
      color: C.textTertiary,
      lineHeight: 16,
      textDecorationLine: "underline",
    },
  });
}
