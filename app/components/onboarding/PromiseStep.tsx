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

// Dot config — all values are deterministic so no re-render jitter
const DOT_COUNT = 28;
const DOTS = Array.from({ length: DOT_COUNT }, (_, i) => {
  const seed = i * 137.508; // golden-angle spread
  return {
    x: (Math.sin(seed) * 0.5 + 0.5) * SW,
    y: (Math.cos(seed * 1.3) * 0.5 + 0.5) * SH * 0.65,
    size: 3 + ((i * 7) % 5),           // 3–7 px
    delay: (i * 60) % 600,
    opacity: 0.15 + ((i * 13) % 10) / 30, // 0.15–0.48
  };
});

function ParticleDots({
  collapseProgress, // Animated.Value 0→1 drives converge
  burstProgress,    // Animated.Value 0→1 drives fade-out after focus appears
}: {
  collapseProgress: Animated.Value;
  burstProgress: Animated.Value;
}) {
  // Each dot has its own native-driven opacity for the stagger-in
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

  // Center of the listArea (approximate)
  const CX = SW / 2;
  const CY = SH * 0.28;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {DOTS.map((dot, i) => {
        const dx = CX - dot.x;
        const dy = CY - dot.y;

        // translateX/Y driven by collapseProgress (native)
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

        // burstProgress fades dots out after focus item appears
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
  // JS-driver only: color interpolations
  const itemOpacity = useRef(LIST_ITEMS.map(() => new Animated.Value(0))).current;
  // Native-driver only: transforms
  const itemTranslateY = useRef(LIST_ITEMS.map(() => new Animated.Value(0))).current;
  const itemScaleX = useRef(LIST_ITEMS.map(() => new Animated.Value(1))).current;

  // Particle dot drivers (native)
  const collapseProgress = useRef(new Animated.Value(0)).current;
  const burstProgress = useRef(new Animated.Value(0)).current;

  // Focus item (native)
  const focusOpacity = useRef(new Animated.Value(0)).current;
  const focusScale = useRef(new Animated.Value(0.7)).current;

  // Text block (native)
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

    // Dots converge in sync with list collapse
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
      // dots fade out as focus item pops in
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
    <View style={styles.container}>
      <ParticleDots
        collapseProgress={collapseProgress}
        burstProgress={burstProgress}
      />

      <View style={styles.content}>
        <View style={styles.listArea}>
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
                  styles.listRow,
                  {
                    transform: [
                      { translateY: itemTranslateY[i] },
                      { scaleX: itemScaleX[i] },
                    ],
                  },
                ]}
              >
                <Animated.View style={[styles.rowInner, { backgroundColor: bgColor, borderColor }]}>
                  <Animated.Text style={[styles.listText, { color: textColor }]}>
                    {item}
                  </Animated.Text>
                </Animated.View>
              </Animated.View>
            );
          })}

          <Animated.View
            style={[
              styles.focusRow,
              {
                opacity: focusOpacity,
                transform: [{ scale: focusScale }],
              },
            ]}
          >
            <View style={styles.focusCheck}>
              <Text style={styles.focusCheckMark}>✓</Text>
            </View>
            <Text style={styles.focusText}>{FOCUS_ITEM}</Text>
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.textBlock,
            { opacity: textOpacity, transform: [{ translateY: textTranslateY }] },
          ]}
        >
          <Text style={styles.headline}>
            Most apps want you to{"\n"}track everything.
          </Text>
          <Text style={styles.highlight}>
            We want you to focus on{"\n"}almost nothing.
          </Text>
          <Text style={styles.body}>
            True momentum comes from doing one small thing, consistently.
          </Text>
        </Animated.View>
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
    paddingBottom: 40,
  },
  listArea: {
    height: 240,
    justifyContent: "center",
    overflow: "visible",
  },
  listRow: {
    marginBottom: 8,
  },
  rowInner: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  listText: {
    fontSize: 14,
  },
  focusRow: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    marginTop: -26,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(251,146,60,0.15)",
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
  focusCheckMark: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  focusText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  textBlock: {
    gap: 12,
  },
  headline: {
    fontSize: 26,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
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
    color: "rgba(255,255,255,0.45)",
    lineHeight: 24,
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
