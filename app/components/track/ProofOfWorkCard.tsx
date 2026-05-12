import React, { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ProofOfWorkCardProps {
  name: string;
  currentStreak: number;
  bestStreak: number;
  totalCompleted: number;
  bounceBackRate: number; // 0–1
  moodLabel: string | null; // e.g. "Motivated"
  memberSince: Date;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

const ProofOfWorkCard = forwardRef<View, ProofOfWorkCardProps>(
  ({ name, currentStreak, bestStreak, totalCompleted, bounceBackRate, moodLabel, memberSince }, ref) => {

    return (
      <View ref={ref} style={styles.card} collapsable={false}>
        {/* Background gradient effect via layered views */}
        <View style={styles.bgGlow} />
        <View style={styles.bgGlowSecondary} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Text style={styles.brandName}>hone</Text>
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </Text>
            </View>
          </View>
          <Text style={styles.tagline}>proof of work</Text>
        </View>

        {/* Name + Streak Hero */}
        <View style={styles.hero}>
          <Text style={styles.userName}>{name || "Anonymous"}</Text>
          <View style={styles.streakHero}>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakUnit}>day streak</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={styles.statIconRow}>
              <Ionicons name="trophy" size={16} color="#facc15" />
              <Text style={styles.statValue}>{bestStreak}</Text>
            </View>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={styles.statIconRow}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text style={styles.statValue}>{totalCompleted}</Text>
            </View>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={styles.statIconRow}>
              <Ionicons name="refresh" size={16} color="#3b82f6" />
              <Text style={styles.statValue}>{formatRate(bounceBackRate)}</Text>
            </View>
            <Text style={styles.statLabel}>Bounce Back</Text>
          </View>
        </View>

        {/* Mood Badge */}
        {moodLabel && (
          <View style={styles.moodRow}>
            <Text style={styles.moodPrefix}>Current vibe:</Text>
            <View style={styles.moodBadge}>
              <Text style={styles.moodText}>{moodLabel}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Sharpening since {formatDate(memberSince)}
          </Text>
          <Text style={styles.footerBrand}>thehoneapp.com</Text>
        </View>
      </View>
    );
  },
);

ProofOfWorkCard.displayName = "ProofOfWorkCard";
export { ProofOfWorkCard };
export type { ProofOfWorkCardProps };

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0a0a0a",
    borderRadius: 24,
    padding: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  bgGlow: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(251, 146, 60, 0.12)",
  },
  bgGlowSecondary: {
    position: "absolute",
    bottom: -40,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(99, 102, 241, 0.08)",
  },

  // Header
  header: {
    marginBottom: 24,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fb923c",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  dateBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: "500",
  },
  tagline: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.3)",
    fontWeight: "500",
    letterSpacing: 1,
    marginTop: 2,
  },

  // Hero
  hero: {
    alignItems: "center",
    marginBottom: 28,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  streakHero: {
    alignItems: "center",
    gap: 2,
  },
  streakEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  streakNumber: {
    fontSize: 56,
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: 60,
    letterSpacing: -2,
  },
  streakUnit: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },

  // Mood
  moodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  moodPrefix: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: "500",
  },
  moodBadge: {
    backgroundColor: "rgba(251, 146, 60, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moodText: {
    fontSize: 13,
    color: "#fb923c",
    fontWeight: "600",
  },

  // Footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    paddingTop: 16,
  },
  footerText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.3)",
    fontWeight: "500",
  },
  footerBrand: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.25)",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
