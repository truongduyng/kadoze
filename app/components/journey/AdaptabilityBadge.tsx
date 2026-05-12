import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AdaptiveBlurView from "@/components/ui/AdaptiveBlurView";
import { AdaptabilityResult } from "@/lib/performance";

interface AdaptabilityBadgeProps {
  result: AdaptabilityResult;
}

const LEVEL_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  Master: { icon: "diamond", color: "#a855f7", label: "Adaptability Master" },
  Expert: { icon: "star", color: "#fb923c", label: "Adaptability Expert" },
  Practitioner: { icon: "shield-checkmark", color: "#3b82f6", label: "Brave Practitioner" },
  Beginner: { icon: "leaf", color: "#22c55e", label: "Learning to Adapt" },
};

export const AdaptabilityBadge = React.memo(({ result }: AdaptabilityBadgeProps) => {
  const config = LEVEL_CONFIG[result.level] ?? LEVEL_CONFIG.Beginner;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Adaptability Score</Text>
        <View style={[styles.levelBadge, { backgroundColor: `${config.color}22` }]}>
          <Ionicons name={config.icon as any} size={12} color={config.color} />
          <Text style={[styles.levelText, { color: config.color }]}>{result.level}</Text>
        </View>
      </View>

      <AdaptiveBlurView style={styles.card}>
        <View style={styles.iconRow}>
          <View style={[styles.iconCircle, { backgroundColor: `${config.color}18`, borderColor: `${config.color}30` }]}>
            <Ionicons name={config.icon as any} size={32} color={config.color} />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.levelLabel}>{config.label}</Text>
            {result.weeksConsecutive > 0 ? (
              <Text style={styles.streak}>
                {result.weeksConsecutive} consecutive weeks boldly adjusting your process
              </Text>
            ) : (
              <Text style={styles.streak}>
                Adjust your plan through journaling to build your adaptability score
              </Text>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{result.totalTweaks}</Text>
            <Text style={styles.statLabel}>Tweaks made</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{result.weeksConsecutive}</Text>
            <Text style={styles.statLabel}>Consecutive weeks</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: config.color }]}>{result.level}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
        </View>

        <View style={styles.tip}>
          <Ionicons name="bulb" size={14} color="rgba(251,146,60,0.8)" />
          <Text style={styles.tipText}>
            Adjusting your plan when overwhelmed is an act of courage, not failure.
          </Text>
        </View>
      </AdaptiveBlurView>
    </View>
  );
});
AdaptabilityBadge.displayName = "AdaptabilityBadge";

const styles = StyleSheet.create({
  section: {},
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  levelText: {
    fontSize: 12,
    fontWeight: "700",
  },
  card: {
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  levelLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  streak: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  tip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(251,146,60,0.07)",
    borderRadius: 12,
    padding: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 18,
  },
});
