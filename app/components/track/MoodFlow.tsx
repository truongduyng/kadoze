import React, { useMemo } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import AdaptiveBlurView from "@/components/ui/AdaptiveBlurView";

export interface MoodDay {
  date: Date;
  mood: string | null;
  dayLabel: string;
}

const CHART_HEIGHT = 110;
const PADDING_X = 16;
const PADDING_Y = 12;

const MOOD_META: Record<string, { score: number; color: string; label: string; iconName: React.ComponentProps<typeof Ionicons>["name"] }> = {
  happy:      { score: 5, color: "#22c55e", label: "Happy",       iconName: "happy-outline" },
  excited:    { score: 5, color: "#22c55e", label: "Excited",     iconName: "rocket-outline" },
  motivated:  { score: 5, color: "#22c55e", label: "Motivated",   iconName: "flash-outline" },
  calm:       { score: 4, color: "#3b82f6", label: "Calm",        iconName: "leaf-outline" },
  neutral:    { score: 3, color: "#f59e0b", label: "Neutral",     iconName: "remove-circle-outline" },
  stressed:   { score: 2, color: "#f97316", label: "Stressed",    iconName: "alert-circle-outline" },
  overwhelmed:{ score: 2, color: "#f97316", label: "Overwhelmed", iconName: "warning-outline" },
  sad:        { score: 1, color: "#6366f1", label: "Sad",         iconName: "sad-outline" },
  tired:      { score: 1, color: "#6366f1", label: "Tired",       iconName: "moon-outline" },
};

const DEFAULT_META = { score: 3, color: "rgba(255,255,255,0.15)", label: "", iconName: "ellipse-outline" as React.ComponentProps<typeof Ionicons>["name"] };

function getMeta(mood: string | null) {
  if (!mood) return DEFAULT_META;
  return MOOD_META[mood.toLowerCase()] ?? { score: 3, color: "#f59e0b", label: mood, iconName: "remove-circle-outline" as React.ComponentProps<typeof Ionicons>["name"] };
}

function scoreToY(score: number, chartH: number): number {
  // score 5 → top (PADDING_Y), score 1 → bottom (chartH - PADDING_Y)
  const range = chartH - PADDING_Y * 2;
  return PADDING_Y + ((5 - score) / 4) * range;
}

function buildCurvePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  return points
    .map((pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = points[i - 1];
      const cpX = (prev.x + pt.x) / 2;
      return `C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`;
    })
    .join(" ");
}

export const MoodFlow = React.memo(({ moodData }: { moodData: MoodDay[] }) => {
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 32 - 32; // account for section padding + card padding

  const points = useMemo(() => {
    const len = moodData.length;
    return moodData.map((day, i) => {
      const meta = getMeta(day.mood);
      return {
        x: PADDING_X + (i / Math.max(len - 1, 1)) * (chartWidth - PADDING_X * 2),
        y: scoreToY(meta.score, CHART_HEIGHT),
        meta,
        day,
      };
    });
  }, [moodData, chartWidth]);

  const linePath = useMemo(() => buildCurvePath(points), [points]);

  // Area fill path: line + close down to bottom
  const areaPath = useMemo(() => {
    if (points.length < 2) return "";
    const last = points[points.length - 1];
    const first = points[0];
    return (
      linePath +
      ` L ${last.x} ${CHART_HEIGHT} L ${first.x} ${CHART_HEIGHT} Z`
    );
  }, [linePath, points]);

  // Latest mood with data
  const latestMoodPoint = useMemo(
    () => [...points].reverse().find((p) => p.day.mood),
    [points],
  );

  const firstLabel = moodData[0]?.dayLabel ?? "";

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Mood Flow</Text>
        {latestMoodPoint && (
          <View style={[styles.moodBadge, { backgroundColor: latestMoodPoint.meta.color + "33" }]}>
            <Ionicons
              name={latestMoodPoint.meta.iconName}
              size={14}
              color={latestMoodPoint.meta.color}
            />
            <Text style={[styles.moodBadgeLabel, { color: latestMoodPoint.meta.color }]}>
              {latestMoodPoint.meta.label}
            </Text>
          </View>
        )}
      </View>

      <AdaptiveBlurView style={styles.card}>
        <Svg height={CHART_HEIGHT} width={chartWidth}>
          <Defs>
            <LinearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#FB923C" stopOpacity="0.6" />
              <Stop offset="50%" stopColor="#FB923C" stopOpacity="1" />
              <Stop offset="100%" stopColor="#FB923C" stopOpacity="0.6" />
            </LinearGradient>
            <LinearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#FB923C" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#FB923C" stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Area fill */}
          <Path d={areaPath} fill="url(#areaGrad)" />

          {/* Line */}
          <Path
            d={linePath}
            stroke="url(#lineGrad)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots — only for days that have mood data */}
          {points.map((pt, i) =>
            pt.day.mood ? (
              <Circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r="5"
                fill={pt.meta.color}
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1.5"
              />
            ) : (
              <Circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r="2.5"
                fill="rgba(255,255,255,0.15)"
              />
            ),
          )}
        </Svg>

        {/* Date range labels */}
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>{firstLabel}</Text>
          <Text style={styles.dateLabel}>Today</Text>
        </View>
      </AdaptiveBlurView>
    </View>
  );
});
MoodFlow.displayName = "MoodFlow";

const styles = StyleSheet.create({
  section: {},
  headerRow: {
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
  moodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  moodBadgeLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    borderRadius: 16,
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 16,
    gap: 4,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  dateLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "500",
  },
});
