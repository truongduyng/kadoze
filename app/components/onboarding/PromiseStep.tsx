import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { palette } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

interface PromiseStepProps {
  onNext: () => void;
}

const LIST_ITEMS = [
  "Track your mood daily",
  "Log every meal",
  "Journal for 30 minutes",
  "Review your goals weekly",
];

const FOCUS_ITEM = "One small daily habit of your choice";

const { width: SW, height: SH } = Dimensions.get("window");

const DOT_COUNT = 28;
const DOTS = Array.from({ length: DOT_COUNT }, (_, i) => {
  const seed = i * 137.508;
  return {
    x: (Math.sin(seed) * 0.5 + 0.5) * SW,
    y: (Math.cos(seed * 1.3) * 0.5 + 0.5) * SH * 0.65,
    size: 3 + ((i * 7) % 5),
    delay: (i * 60) % 600,
    opacity: 0.15 + ((i * 13) % 10) / 30,
  };
});

function ParticleDots({
  collapseProgress,
  burstProgress,
}: {
  collapseProgress: Animated.Value;
  burstProgress: Animated.Value;
}) {
  const dotOpacity = useRef(DOTS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      40,
      dotOpacity.map((a, i) =>
        Animated.timing(a, {
          toValue: 1,
          duration: 400,
          delay: DOTS[i].delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      )
    ).start();
  }, [dotOpacity]);

  const CX = SW / 2;
  const CY = SH * 0.28;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {DOTS.map((dot, i) => {
        const dx = CX - dot.x;
        const dy = CY - dot.y;

        const translateX = collapseProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, dx * 0.85],
        });
        const translateY = collapseProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, dy * 0.85],
        });
        const scale = collapseProgress.interpolate({
          inputRange: [0, 0.6, 1],
          outputRange: [1, 1.3, 0.3],
        });
        const collapseOpacity = collapseProgress.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [1, 0.9, 0],
        });
        const burstOpacity = burstProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0],
        });

        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              left: dot.x - dot.size / 2,
              top: dot.y - dot.size / 2,
              width: dot.size,
              height: dot.size,
              borderRadius: dot.size / 2,
              backgroundColor: palette.orange,
              opacity: Animated.multiply(
                Animated.multiply(dotOpacity[i], collapseOpacity),
                burstOpacity
              ),
              transform: [{ translateX }, { translateY }, { scale }],
            }}
          />
        );
      })}
    </View>
  );
}

export default function PromiseStep({ onNext }: PromiseStepProps) {
  const C = useTheme();
  const s = makeStyles(C);

  const itemOpacity = useRef(LIST_ITEMS.map(() => new Animated.Value(0))).current;
  const itemTranslateY = useRef(LIST_ITEMS.map(() => new Animated.Value(0))).current;
  const itemScaleX = useRef(LIST_ITEMS.map(() => new Animated.Value(1))).current;

  const collapseProgress = useRef(new Animated.Value(0)).current;
  const burstProgress = useRef(new Animated.Value(0)).current;

  const focusOpacity = useRef(new Animated.Value(0)).current;
  const focusScale = useRef(new Animated.Value(0.7)).current;

  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const ROW_HEIGHT = 48;
    const CENTER_IDX = 1.5;

    const staggerIn = Animated.stagger(
      160,
      itemOpacity.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        })
      )
    );

    const collapseItems = Animated.parallel(
      LIST_ITEMS.map((_, i) => {
        const dy = (CENTER_IDX - i) * ROW_HEIGHT;
        return Animated.parallel([
          Animated.timing(itemTranslateY[i], {
            toValue: dy,
            duration: 380,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(itemScaleX[i], {
            toValue: 0,
            duration: 340,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(itemOpacity[i], {
            toValue: 0,
            duration: 260,
            delay: 120,
            useNativeDriver: false,
          }),
        ]);
      })
    );

    const dotsCollapse = Animated.timing(collapseProgress, {
      toValue: 1,
      duration: 420,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });

    const focusBurst = Animated.parallel([
      Animated.timing(focusOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(focusScale, {
        toValue: 1,
        tension: 160,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(burstProgress, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const textIn = Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    Animated.sequence([
      Animated.delay(300),
      staggerIn,
      Animated.delay(500),
      Animated.parallel([collapseItems, dotsCollapse]),
      Animated.delay(80),
      focusBurst,
      Animated.delay(100),
      textIn,
    ]).start();
  }, [
    burstProgress,
    collapseProgress,
    focusOpacity,
    focusScale,
    itemOpacity,
    itemScaleX,
    itemTranslateY,
    textOpacity,
    textTranslateY,
  ]);

  return (
    <View style={s.container}>
      <ParticleDots
        collapseProgress={collapseProgress}
        burstProgress={burstProgress}
      />

      <View style={s.content}>
        <View style={s.listArea}>
          {LIST_ITEMS.map((item, i) => {
            const bgColor = itemOpacity[i].interpolate({
              inputRange: [0, 1],
              outputRange: ["rgba(255,255,255,0.0)", "rgba(255,255,255,0.07)"],
            });
            const borderColor = itemOpacity[i].interpolate({
              inputRange: [0, 1],
              outputRange: ["rgba(255,255,255,0.0)", "rgba(255,255,255,0.18)"],
            });
            const textColor = itemOpacity[i].interpolate({
              inputRange: [0, 1],
              outputRange: ["rgba(255,255,255,0.0)", "rgba(255,255,255,0.45)"],
            });

            return (
              <Animated.View
                key={item}
                style={[
                  s.listRow,
                  {
                    transform: [
                      { translateY: itemTranslateY[i] },
                      { scaleX: itemScaleX[i] },
                    ],
                  },
                ]}
              >
                <Animated.View style={[s.rowInner, { backgroundColor: bgColor, borderColor }]}>
                  <Animated.Text style={[s.listText, { color: textColor }]}>
                    {item}
                  </Animated.Text>
                </Animated.View>
              </Animated.View>
            );
          })}

          <Animated.View
            style={[
              s.focusRow,
              {
                opacity: focusOpacity,
                transform: [{ scale: focusScale }],
              },
            ]}
          >
            <View style={s.focusCheck}>
              <Text style={s.focusCheckMark}>✓</Text>
            </View>
            <Text style={s.focusText}>{FOCUS_ITEM}</Text>
          </Animated.View>
        </View>

        <Animated.View
          style={[
            s.textBlock,
            { opacity: textOpacity, transform: [{ translateY: textTranslateY }] },
          ]}
        >
          <Text style={s.headline}>
            Most apps want you to{"\n"}track everything.
          </Text>
          <Text style={s.highlight}>
            We want you to focus on{"\n"}almost nothing.
          </Text>
          <Text style={s.body}>
            True momentum comes from doing one small thing, consistently.
          </Text>
        </Animated.View>
      </View>

      <View style={s.footer}>
        <TouchableOpacity style={s.btn} onPress={onNext} activeOpacity={0.85}>
          <Text style={s.btnText}>Let&apos;s build your foundation.</Text>
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
      gap: 20,
      paddingBottom: 40,
    },
    listArea: {
      height: 240,
      justifyContent: "center",
      overflow: "visible",
    },
    listRow: { marginBottom: 8 },
    rowInner: {
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },
    listText: { fontSize: 14 },
    focusRow: {
      position: "absolute",
      left: 0,
      right: 0,
      top: "50%",
      marginTop: -26,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: C.accentBg,
      borderWidth: 1.5,
      borderColor: palette.orange,
      borderRadius: 12,
      paddingHorizontal: 20,
      paddingVertical: 13,
    },
    focusCheck: {
      width: 24,
      height: 24,
      borderRadius: 6,
      backgroundColor: palette.orange,
      alignItems: "center",
      justifyContent: "center",
    },
    focusCheckMark: { color: "#fff", fontSize: 13, fontWeight: "800" },
    focusText: {
      color: C.textPrimary,
      fontSize: 15,
      fontWeight: "700",
      flex: 1,
    },
    textBlock: { gap: 12 },
    headline: {
      fontSize: 26,
      fontWeight: "700",
      color: C.textSecondary,
      lineHeight: 34,
    },
    highlight: {
      fontSize: 26,
      fontWeight: "800",
      color: palette.orange,
      lineHeight: 34,
    },
    body: {
      fontSize: 16,
      color: C.textTertiary,
      lineHeight: 24,
    },
    footer: { gap: 12 },
    btn: {
      backgroundColor: palette.orange,
      borderRadius: 14,
      paddingVertical: 18,
      alignItems: "center",
    },
    btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  });
}
