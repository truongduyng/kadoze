import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { palette } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

interface EmpathyStepProps {
  onNext: () => void;
}

export default function EmpathyStep({ onNext }: EmpathyStepProps) {
  const C = useTheme();
  const s = makeStyles(C);
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
    <View style={s.container}>
      <View style={s.content}>
        <Animated.View style={[s.iconWrap, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={s.icon}>✦</Text>
        </Animated.View>

        <Text style={s.headline}>You aren&apos;t broken;{"\n"}your system is.</Text>
        <Text style={s.body}>
          Jumping between a note app, a habit tracker, and a calendar burns through your focus before the day even begins.
        </Text>
      </View>

      <View style={s.footer}>
        <TouchableOpacity style={s.btn} onPress={onNext} activeOpacity={0.85}>
          <Text style={s.btnText}>There is a quieter way.</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof import("@/hooks/useTheme").useTheme>) {
  return StyleSheet.create({
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
    icon: { fontSize: 32, color: palette.orange },
    headline: {
      fontSize: 30,
      fontWeight: "800",
      color: C.textPrimary,
      textAlign: "center",
      lineHeight: 38,
      marginBottom: 20,
    },
    body: {
      fontSize: 16,
      color: C.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      paddingHorizontal: 8,
    },
    footer: { gap: 20, alignItems: "center" },
    btn: {
      backgroundColor: palette.orange,
      borderRadius: 14,
      paddingVertical: 18,
      alignItems: "center",
      width: "100%",
    },
    btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  });
}
