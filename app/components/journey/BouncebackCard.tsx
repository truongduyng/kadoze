import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AdaptiveBlurView from "@/components/ui/AdaptiveBlurView";
import { BouncebackResult } from "@/lib/performance";

interface BouncebackCardProps {
  result: BouncebackResult;
}

export const BouncebackCard = React.memo(({ result }: BouncebackCardProps) => {
  const pct = Math.round(result.rate * 100);
  const color = pct >= 80 ? "#22c55e" : pct >= 50 ? "#fb923c" : "#f87171";

  const lastRecoveryText =
    result.lastRecoveryDays === -1
      ? "No missed days yet — keep it up!"
      : result.lastRecoveryDays === 1
      ? "Last time: bounced back in just 1 day"
      : `Last time: bounced back in ${result.lastRecoveryDays} days`;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Bounce-back Rate</Text>
        <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
          <Text style={[styles.badgeText, { color }]}>{pct}%</Text>
        </View>
      </View>

      <AdaptiveBlurView style={styles.card}>
        <View style={styles.row}>
          <View style={styles.circleWrap}>
            <Text style={[styles.pctBig, { color }]}>{pct}%</Text>
            <Text style={styles.pctLabel}>bounce-back</Text>
          </View>
          <View style={styles.stats}>
            <StatRow
              icon="refresh"
              color="#fb923c"
              label="Missed days"
              value={result.totalFalls}
            />
            <StatRow
              icon="checkmark-circle"
              color="#22c55e"
              label="Recovered"
              value={result.totalRecovered}
            />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.bottomRow}>
          <Ionicons name="flash" size={14} color="#fb923c" />
          <Text style={styles.caption}>{lastRecoveryText}</Text>
        </View>
      </AdaptiveBlurView>
    </View>
  );
});
BouncebackCard.displayName = "BouncebackCard";

function StatRow({
  icon,
  color,
  label,
  value,
}: {
  icon: string;
  color: string;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.statRow}>
      <Ionicons name={icon as any} size={14} color={color} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {},
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  circleWrap: {
    alignItems: "center",
    minWidth: 80,
  },
  pctBig: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
  },
  pctLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
    marginTop: 2,
  },
  stats: {
    flex: 1,
    gap: 10,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statLabel: {
    flex: 1,
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
  statValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  caption: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    flex: 1,
  },
});
