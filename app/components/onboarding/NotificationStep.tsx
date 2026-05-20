import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { registerForPushNotificationsAsync } from "@/lib/notifications";

interface NotificationStepProps {
  onNext: () => void;
}

const BENEFITS = [
  { icon: "sunny-outline" as const,    text: "Morning habit check-in" },
  { icon: "moon-outline" as const,     text: "Evening reset reminder" },
  { icon: "flame-outline" as const,    text: "Streak protection nudges" },
];

export default function NotificationStep({ onNext }: NotificationStepProps) {
  const C = useTheme();
  const s = makeStyles(C);

  const iconScale   = useRef(new Animated.Value(0.6)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const rowOpacity = useRef(BENEFITS.map(() => new Animated.Value(0))).current;
  const rowTranslateY = useRef(BENEFITS.map(() => new Animated.Value(16))).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const iconIn = Animated.parallel([
      Animated.spring(iconScale, { toValue: 1, tension: 100, friction: 7, useNativeDriver: true }),
      Animated.timing(iconOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]);

    const textIn = Animated.parallel([
      Animated.timing(textOpacity, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(textTranslateY, { toValue: 0, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);

    const rowsIn = Animated.stagger(
      120,
      BENEFITS.map((_, i) =>
        Animated.parallel([
          Animated.timing(rowOpacity[i], { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(rowTranslateY[i], { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ])
      )
    );

    const btnIn = Animated.timing(btnOpacity, { toValue: 1, duration: 360, useNativeDriver: true });

    Animated.sequence([
      Animated.delay(200),
      iconIn,
      Animated.delay(100),
      textIn,
      Animated.delay(80),
      rowsIn,
      Animated.delay(60),
      btnIn,
    ]).start();
  }, [btnOpacity, iconOpacity, iconScale, rowOpacity, rowTranslateY, textOpacity, textTranslateY]);

  const handleEnable = async () => {
    await registerForPushNotificationsAsync();
    onNext();
  };

  return (
    <View style={s.container}>
      <View style={s.content}>
        <Animated.View style={[s.iconWrap, { opacity: iconOpacity, transform: [{ scale: iconScale }] }]}>
          <View style={s.iconCircle}>
            <Ionicons name="notifications-outline" size={44} color={palette.orange} />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textTranslateY }] }}>
          <Text style={s.headline}>Stay on track,{"\n"}every day.</Text>
          <Text style={s.body}>
            Short, well-timed reminders help you build the habit of showing up — without overwhelming your phone.
          </Text>
        </Animated.View>

        <View style={s.benefitList}>
          {BENEFITS.map((item, i) => (
            <Animated.View
              key={item.text}
              style={[s.benefitRow, { opacity: rowOpacity[i], transform: [{ translateY: rowTranslateY[i] }] }]}
            >
              <View style={s.benefitIcon}>
                <Ionicons name={item.icon} size={18} color={palette.orange} />
              </View>
              <Text style={s.benefitText}>{item.text}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      <Animated.View style={[s.footer, { opacity: btnOpacity }]}>
        <TouchableOpacity style={s.btn} onPress={handleEnable} activeOpacity={0.85}>
          <Text style={s.btnText}>Enable notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext} activeOpacity={0.7} hitSlop={12}>
          <Text style={s.skipText}>Maybe later</Text>
        </TouchableOpacity>
      </Animated.View>
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
      gap: 28,
      paddingBottom: 20,
    },
    iconWrap: {
      alignItems: "center",
    },
    iconCircle: {
      width: 96,
      height: 96,
      borderRadius: 32,
      borderCurve: "continuous",
      backgroundColor: C.accentBg,
      borderWidth: 1.5,
      borderColor: C.accentBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    headline: {
      fontSize: 30,
      fontWeight: "800",
      color: C.textPrimary,
      textAlign: "center",
      lineHeight: 38,
    },
    body: {
      fontSize: 16,
      color: C.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      paddingHorizontal: 8,
      marginTop: 8,
    },
    benefitList: {
      gap: 12,
    },
    benefitRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.cardBorder,
      borderRadius: 14,
      borderCurve: "continuous",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    benefitIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderCurve: "continuous",
      backgroundColor: C.accentBg,
      alignItems: "center",
      justifyContent: "center",
    },
    benefitText: {
      color: C.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    footer: {
      gap: 14,
      alignItems: "center",
    },
    btn: {
      backgroundColor: palette.orange,
      borderRadius: 14,
      paddingVertical: 18,
      alignItems: "center",
      width: "100%",
    },
    btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    skipText: {
      color: C.textTertiary,
      fontSize: 14,
      fontWeight: "600",
    },
  });
}
