import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { palette } from "@/constants/theme";

interface EmpathyStepProps {
  onNext: () => void;
}

export default function EmpathyStep({ onNext }: EmpathyStepProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconWrap, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.icon}>✦</Text>
        </Animated.View>

        <Text style={styles.headline}>You aren&apos;t broken;{"\n"}your system is.</Text>
        <Text style={styles.body}>
          Jumping between a note app, a habit tracker, and a calendar burns through your focus before the day even begins.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.btnText}>There is a quieter way.</Text>
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
    alignItems: "center",
    paddingBottom: 20,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: palette.orange,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },
  icon: {
    fontSize: 32,
    color: palette.orange,
  },
  headline: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    lineHeight: 38,
    marginBottom: 20,
  },
  body: {
    fontSize: 16,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  footer: {
    gap: 20,
    alignItems: "center",
  },
  btn: {
    backgroundColor: palette.orange,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    width: "100%",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dotActive: {
    backgroundColor: "rgba(255,255,255,0.7)",
    width: 18,
  },
});
