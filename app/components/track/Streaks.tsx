import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AdaptiveBlurView from "@/components/ui/AdaptiveBlurView";

interface StreaksProps {
  currentStreak: number;
  bestStreak: number;
}

export const Streaks = React.memo(({ currentStreak, bestStreak }: StreaksProps) => (
  <View style={styles.streaksSection}>
    <Text style={styles.sectionTitle}>Streaks</Text>
    <View style={styles.streaksRow}>
      <AdaptiveBlurView style={styles.streakCard}>
        <Ionicons name="flame" size={28} color="#fb923c" />
        <Text style={styles.streakCount}>{currentStreak}</Text>
        <Text style={styles.streakLabel}>Current</Text>
      </AdaptiveBlurView>
      <AdaptiveBlurView style={styles.streakCard}>
        <Ionicons name="trophy" size={28} color="#facc15" />
        <Text style={styles.streakCount}>{bestStreak}</Text>
        <Text style={styles.streakLabel}>Best</Text>
      </AdaptiveBlurView>
    </View>
  </View>
));
Streaks.displayName = "Streaks";

const styles = StyleSheet.create({
  streaksSection: {},
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  streaksRow: {
    flexDirection: "row",
    gap: 12,
  },
  streakCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  streakCount: {
    fontSize: 36,
    fontWeight: "600",
    color: "#ffffff",
    lineHeight: 40,
  },
  streakLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
  },
});
