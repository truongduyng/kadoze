import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { palette } from "@/constants/theme";

interface PromiseStepProps {
  onNext: () => void;
}

const LIST_ITEMS = [
  "Track your mood daily",
  "Log every meal",
  "Journal for 30 minutes",
  "Review your goals weekly",
];

export default function PromiseStep({ onNext }: PromiseStepProps) {
  const itemAnims = useRef(LIST_ITEMS.map(() => new Animated.Value(1))).current;
  const checkAnim = useRef(new Animated.Value(0)).current;
  const highlightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.delay(400),
      Animated.stagger(120, itemAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        })
      )),
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(checkAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(highlightAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
    ]);
    sequence.start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.listCard}>
          {LIST_ITEMS.map((item, i) => {
            const isLast = i === LIST_ITEMS.length - 1;
            return (
              <Animated.View
                key={item}
                style={[styles.listRow, { opacity: isLast ? undefined : itemAnims[i] }]}
              >
                <Animated.View
                  style={[
                    styles.listBullet,
                    isLast && { opacity: highlightAnim },
                    isLast && {
                      backgroundColor: highlightAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["rgba(255,255,255,0.1)", "rgba(251,146,60,0.25)"],
                      }),
                      borderColor: highlightAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["rgba(255,255,255,0.2)", palette.orange],
                      }),
                    },
                  ]}
                >
                  {isLast ? (
                    <Animated.Text style={[styles.check, { opacity: checkAnim }]}>✓</Animated.Text>
                  ) : (
                    <View style={styles.emptyBullet} />
                  )}
                </Animated.View>
                <Animated.Text
                  style={[
                    styles.listText,
                    isLast && {
                      color: highlightAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["rgba(255,255,255,0.5)", "#fff"],
                      }),
                      fontWeight: "600",
                    },
                  ]}
                >
                  {item}
                </Animated.Text>
              </Animated.View>
            );
          })}
        </View>

        <Text style={styles.headline}>
          Most apps want you to{"\n"}track everything.
        </Text>
        <Text style={styles.highlight}>
          We want you to focus on{"\n"}almost nothing.
        </Text>
        <Text style={styles.body}>
          True momentum comes from doing one small thing, consistently.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.btnText}>Let's build your foundation.</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingBottom: 32,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: 20,
  },
  listCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 8,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  listBullet: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  check: {
    fontSize: 13,
    color: palette.orange,
    fontWeight: "700",
  },
  listText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
  },
  headline: {
    fontSize: 22,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    lineHeight: 30,
  },
  highlight: {
    fontSize: 22,
    fontWeight: "800",
    color: palette.orange,
    lineHeight: 30,
  },
  body: {
    fontSize: 15,
    color: "rgba(255,255,255,0.45)",
    lineHeight: 22,
  },
  footer: {
    gap: 12,
  },
  btn: {
    backgroundColor: palette.orange,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
