import GradientBackground from "@/components/GradientBackground";
import { palette } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { dailyFocus, dailyFocusOps, db } from "@/lib/db";
import { getLocalDateString } from "@/lib/timezone";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { eq } from "drizzle-orm";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

const RING_SIZE = 220;
const STROKE_WIDTH = 10;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const FOCUS_DURATION_SECONDS = 25 * 60;

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function FocusScreen() {
  const todayKey = getLocalDateString(new Date());
  const C = useTheme();
  const [remainingSeconds, setRemainingSeconds] = useState(FOCUS_DURATION_SECONDS);
  const [isRunning, setIsRunning] = useState(true);
  const unsavedElapsedSecondsRef = useRef(0);
  const didCompleteSessionRef = useRef(false);
  const { data: focusRows } = useLiveQuery(
    db.select().from(dailyFocus).where(eq(dailyFocus.date, todayKey)).limit(1)
  );

  const goalText = useMemo(() => {
    const goal = focusRows?.[0]?.goal?.trim();
    return goal || "Set your main goal first";
  }, [focusRows]);

  useEffect(() => {
    if (!isRunning || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          clearInterval(interval);
          unsavedElapsedSecondsRef.current += current;
          return 0;
        }
        unsavedElapsedSecondsRef.current += 1;
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, remainingSeconds]);

  const persistElapsedFocusTime = async (roundUpPartialMinute = false) => {
    const elapsedSeconds = unsavedElapsedSecondsRef.current;
    const minutesToPersist = roundUpPartialMinute
      ? Math.ceil(elapsedSeconds / 60)
      : Math.floor(elapsedSeconds / 60);

    if (minutesToPersist <= 0) return;

    unsavedElapsedSecondsRef.current = roundUpPartialMinute
      ? 0
      : elapsedSeconds - minutesToPersist * 60;
    await dailyFocusOps.addFocusMinutes(minutesToPersist);
  };

  useEffect(() => {
    if (remainingSeconds <= 0 && !didCompleteSessionRef.current) {
      didCompleteSessionRef.current = true;
      void persistElapsedFocusTime(true);
      void dailyFocusOps.markComplete();
    }
  }, [remainingSeconds]);

  useEffect(() => {
    if (!isRunning) {
      void persistElapsedFocusTime(true);
    }
  }, [isRunning]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        void persistElapsedFocusTime(true);
      }
    });

    return () => {
      subscription.remove();
      void persistElapsedFocusTime(true);
    };
  }, []);

  const progress = remainingSeconds / FOCUS_DURATION_SECONDS;
  const countdownText = formatCountdown(remainingSeconds);
  const progressOffset = -CIRCUMFERENCE * (1 - progress);

  const s = makeStyles(C);

  return (
    <View style={s.container}>
      <GradientBackground />
      <SafeAreaView style={s.safeArea}>
        <View style={s.header}>
          <Pressable
            onPress={() => {
              void persistElapsedFocusTime(true);
              router.back();
            }}
            hitSlop={10}
            style={s.closeButton}
          >
            <Ionicons name="close" size={24} color={C.iconSecondary} />
          </Pressable>
          <View style={s.titleWrap}>
            <View style={s.liveDot} />
            <Text style={s.title}>Focus Room</Text>
          </View>
          <View style={s.headerSpacer} />
        </View>

        <View style={s.content}>
          <Text style={s.goal}>{goalText}</Text>
          <Text style={s.subtitle}>Stay focused. Do one thing.</Text>

          <View style={s.ringWrap}>
            <Svg width={RING_SIZE} height={RING_SIZE} style={s.ringSvg}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke={C.cardBorder}
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke={palette.orange}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                strokeDashoffset={progressOffset}
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              />
            </Svg>

            <View style={s.ringCenter}>
              <Text style={s.timer}>{countdownText}</Text>
            </View>
          </View>

          <Pressable
            style={s.pauseButton}
            onPress={() => {
              if (remainingSeconds === 0) {
                didCompleteSessionRef.current = false;
                void dailyFocusOps.markIncomplete();
                setRemainingSeconds(FOCUS_DURATION_SECONDS);
                setIsRunning(true);
                return;
              }
              if (isRunning) {
                void persistElapsedFocusTime();
              }
              setIsRunning((current) => !current);
            }}
          >
            <Ionicons
              name={remainingSeconds === 0 ? "refresh" : isRunning ? "pause" : "play"}
              size={18}
              color={C.textPrimary}
            />
            <Text style={s.pauseText}>
              {remainingSeconds === 0 ? "Restart" : isRunning ? "Pause" : "Resume"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof import("@/hooks/useTheme").useTheme>) {
  return StyleSheet.create({
    container: { flex: 1 },
    safeArea: {
      flex: 1,
      paddingHorizontal: 24,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 8,
    },
    closeButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    titleWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 999,
      backgroundColor: palette.orange,
    },
    title: {
      color: C.textSecondary,
      fontSize: 16,
      fontWeight: "600",
    },
    headerSpacer: { width: 36 },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingBottom: 24,
    },
    goal: {
      color: C.textPrimary,
      fontSize: 18,
      fontWeight: "700",
      lineHeight: 28,
      textAlign: "center",
      maxWidth: 260,
    },
    subtitle: {
      color: C.textTertiary,
      fontSize: 15,
      fontWeight: "600",
      marginTop: 14,
      textAlign: "center",
    },
    ringWrap: {
      width: RING_SIZE,
      height: RING_SIZE,
      marginTop: 42,
      alignItems: "center",
      justifyContent: "center",
    },
    ringSvg: { position: "absolute" },
    ringCenter: {
      width: 170,
      height: 170,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: C.inputBg,
    },
    timer: {
      color: C.textPrimary,
      fontSize: 56,
      fontWeight: "300",
      letterSpacing: -2,
    },
    pauseButton: {
      marginTop: 38,
      minWidth: 140,
      paddingHorizontal: 24,
      paddingVertical: 15,
      borderRadius: 999,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.cardBorder,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    pauseText: {
      color: C.textPrimary,
      fontSize: 20,
      fontWeight: "600",
    },
  });
}
