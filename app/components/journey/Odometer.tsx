import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AdaptiveBlurView from "@/components/ui/AdaptiveBlurView";

const TARGET = 10_000;

interface OdometerProps {
  count: number; // total done completions
}

// Animated number that rolls up from previous value
function AnimatedNumber({ value }: { value: number }) {
  const animated = useRef(new Animated.Value(0)).current;
  const displayRef = useRef(0);
  const [display, setDisplay] = React.useState(0);

  useEffect(() => {
    Animated.timing(animated, {
      toValue: value,
      duration: 1200,
      useNativeDriver: false,
    }).start();

    const listener = animated.addListener(({ value: v }) => {
      const rounded = Math.floor(v);
      if (rounded !== displayRef.current) {
        displayRef.current = rounded;
        setDisplay(rounded);
      }
    });

    return () => animated.removeListener(listener);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <Text style={styles.countText}>{display.toLocaleString()}</Text>;
}

export const Odometer = React.memo(({ count }: OdometerProps) => {
  const pct = Math.min((count / TARGET) * 100, 100);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>10k Iterations Protocol</Text>
      </View>

      <AdaptiveBlurView style={styles.card}>
        <View style={styles.topRow}>
          <Ionicons name="speedometer" size={24} color="#fb923c" />
          <View style={styles.countRow}>
            <AnimatedNumber value={count} />
            <Text style={styles.target}>/ {TARGET.toLocaleString()}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${pct}%` as any }]} />
        </View>

        <Text style={styles.caption}>
          {TARGET - count > 0
            ? `${(TARGET - count).toLocaleString()} iterations remaining to reach the peak`
            : "You've conquered 10,000 iterations!"}
        </Text>
      </AdaptiveBlurView>
    </View>
  );
});
Odometer.displayName = "Odometer";

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
    backgroundColor: "rgba(251,146,60,0.15)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    color: "#fb923c",
    fontWeight: "600",
  },
  card: {
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  countText: {
    fontSize: 40,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -1,
  },
  target: {
    fontSize: 16,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fb923c",
  },
  caption: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
  },
});
