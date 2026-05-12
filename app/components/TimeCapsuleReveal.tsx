import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { TimeCapsule, TimeCapsuleSnapshot } from "@/lib/timeCapsule";

interface TimeCapsuleRevealProps {
  visible: boolean;
  capsule: TimeCapsule;
  currentStats: TimeCapsuleSnapshot;
  onDismiss: () => void;
  onWriteNext: () => void;
}

function StatComparison({
  label,
  before,
  after,
  suffix,
  icon,
  iconColor,
}: {
  label: string;
  before: string;
  after: string;
  suffix?: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
}) {
  const changed = before !== after;
  return (
    <View style={styles.statRow}>
      <Ionicons name={icon} size={18} color={iconColor} />
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={styles.statValues}>
          <Text style={styles.statBefore}>
            {before}
            {suffix}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={12}
            color="rgba(255,255,255,0.3)"
          />
          <Text style={[styles.statAfter, changed && styles.statAfterGreen]}>
            {after}
            {suffix}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function TimeCapsuleReveal({
  visible,
  capsule,
  currentStats,
  onDismiss,
  onWriteNext,
}: TimeCapsuleRevealProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      slideAnim.setValue(40);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const daysAgo = useMemo(() => {
    const created = new Date(capsule.createdAt);
    const diff = Date.now() - created.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [capsule.createdAt]);

  const dateLabel = useMemo(() => {
    return new Date(capsule.createdAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [capsule.createdAt]);

  const snap = capsule.snapshot;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Close button */}
          <Pressable style={styles.closeBtn} onPress={onDismiss} hitSlop={16}>
            <Ionicons
              name="close"
              size={22}
              color="rgba(255,255,255,0.5)"
            />
          </Pressable>

          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconBg}>
                <Ionicons name="mail-open-outline" size={32} color="#fb923c" />
              </View>
              <Text style={styles.title}>Time Capsule Opened</Text>
              <Text style={styles.subtitle}>
                Written {daysAgo} days ago on {dateLabel}
              </Text>
            </View>

            {/* The letter */}
            <View style={styles.letterCard}>
              <Text style={styles.letterText}>{capsule.letter}</Text>
              <View style={styles.letterSeal}>
                <Ionicons
                  name="lock-open-outline"
                  size={12}
                  color="rgba(251, 146, 60, 0.5)"
                />
                <Text style={styles.letterSealText}>Unsealed</Text>
              </View>
            </View>

            {/* Progress comparison */}
            <View style={styles.progressSection}>
              <Text style={styles.progressTitle}>
                Your growth since then
              </Text>
              <View style={styles.statsCard}>
                <StatComparison
                  label="Streak"
                  before={String(snap.currentStreak)}
                  after={String(currentStats.currentStreak)}
                  suffix=" days"
                  icon="flame"
                  iconColor="#fb923c"
                />
                <View style={styles.statDivider} />
                <StatComparison
                  label="Completed"
                  before={String(snap.totalCompleted)}
                  after={String(currentStats.totalCompleted)}
                  icon="checkmark-circle"
                  iconColor="#22c55e"
                />
                <View style={styles.statDivider} />
                <StatComparison
                  label="Bounce Back"
                  before={`${Math.round(snap.bounceBackRate * 100)}`}
                  after={`${Math.round(currentStats.bounceBackRate * 100)}`}
                  suffix="%"
                  icon="refresh"
                  iconColor="#3b82f6"
                />
              </View>
            </View>

            {/* CTA to write next capsule */}
            <Pressable
              style={({ pressed }) => [
                styles.nextCapsuleBtn,
                pressed && styles.nextCapsuleBtnPressed,
              ]}
              onPress={onWriteNext}
            >
              <Ionicons name="mail-outline" size={20} color="#000" />
              <Text style={styles.nextCapsuleBtnText}>
                Write a 90-Day Letter
              </Text>
            </Pressable>

            <Pressable onPress={onDismiss}>
              <Text style={styles.skipText}>Maybe later</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  container: {
    flex: 1,
    backgroundColor: "#111111",
    borderRadius: 24,
    overflow: "hidden",
    maxHeight: "100%",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    padding: 28,
    paddingTop: 24,
    gap: 24,
  },

  // Header
  header: {
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
  },
  iconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(251, 146, 60, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: "500",
    textAlign: "center",
  },

  // Letter
  letterCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(251, 146, 60, 0.15)",
    padding: 20,
    gap: 16,
  },
  letterText: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 24,
    fontStyle: "italic",
  },
  letterSeal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-end",
  },
  letterSealText: {
    fontSize: 11,
    color: "rgba(251, 146, 60, 0.5)",
    fontWeight: "500",
  },

  // Progress
  progressSection: {
    gap: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  },
  statsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
  },
  statValues: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statBefore: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.35)",
    fontWeight: "600",
  },
  statAfter: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "700",
  },
  statAfterGreen: {
    color: "#22c55e",
  },
  statDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },

  // CTA
  nextCapsuleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fb923c",
    borderRadius: 14,
    paddingVertical: 16,
  },
  nextCapsuleBtnPressed: {
    opacity: 0.8,
  },
  nextCapsuleBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  skipText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.35)",
    textAlign: "center",
    fontWeight: "500",
    paddingBottom: 8,
  },
});
