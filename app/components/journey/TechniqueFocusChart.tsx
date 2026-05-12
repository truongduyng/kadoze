import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";
import AdaptiveBlurView from "@/components/ui/AdaptiveBlurView";
import { WeeklyQuality } from "@/lib/performance";

interface TechniqueFocusChartProps {
  weeklyQuality: WeeklyQuality[];
}

const BAR_COLOR_MAP = (score: number) => {
  if (score >= 4.5) return "#22c55e";
  if (score >= 3.5) return "#86efac";
  if (score >= 2.5) return "#fb923c";
  if (score >= 1.5) return "#f97316";
  return "#ef4444";
};

export const TechniqueFocusChart = React.memo(({ weeklyQuality }: TechniqueFocusChartProps) => {
  const { width } = useWindowDimensions();
  const cardPadding = 18;
  const chartWidth = width - 24 * 2 - cardPadding * 2; // screen - cardArea padding - card padding
  const chartHeight = 80;

  const activeWeeks = weeklyQuality.filter((w) => w.count > 0);
  const overallAvg = activeWeeks.length > 0
    ? activeWeeks.reduce((s, w) => s + w.avgScore, 0) / activeWeeks.length
    : 0;
  const pctFocused = overallAvg > 0 ? Math.round(((overallAvg - 1) / 4) * 100) : 0;

  const n = weeklyQuality.length;
  const barWidth = Math.max((chartWidth / n) * 0.6, 8);
  const gap = chartWidth / n;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Technique Quality</Text>
        {overallAvg > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pctFocused}% focused</Text>
          </View>
        )}
      </View>

      <AdaptiveBlurView style={styles.card}>
        {activeWeeks.length === 0 ? (
          <Text style={styles.empty}>
            Complete tasks and log reflections to see your technique quality over time.
          </Text>
        ) : (
          <>
            <Svg width={chartWidth} height={chartHeight + 20}>
              {/* Score axis labels */}
              {[1, 3, 5].map((score) => {
                const y = chartHeight - ((score - 1) / 4) * chartHeight;
                return (
                  <React.Fragment key={score}>
                    <Line
                      x1={0}
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth={1}
                    />
                    <SvgText
                      x={-2}
                      y={y + 4}
                      fontSize={9}
                      fill="rgba(255,255,255,0.3)"
                      textAnchor="end"
                    >
                      {score}
                    </SvgText>
                  </React.Fragment>
                );
              })}

              {weeklyQuality.map((week, i) => {
                const x = i * gap + gap / 2 - barWidth / 2;
                const barH = week.count > 0 ? ((week.avgScore - 1) / 4) * chartHeight : 0;
                const y = chartHeight - barH;
                const color = week.count > 0 ? BAR_COLOR_MAP(week.avgScore) : "rgba(255,255,255,0.08)";
                return (
                  <React.Fragment key={i}>
                    <Rect
                      x={x}
                      y={barH > 0 ? y : chartHeight - 4}
                      width={barWidth}
                      height={Math.max(barH, 4)}
                      rx={4}
                      fill={color}
                    />
                    <SvgText
                      x={x + barWidth / 2}
                      y={chartHeight + 14}
                      fontSize={9}
                      fill="rgba(255,255,255,0.35)"
                      textAnchor="middle"
                    >
                      {week.weekLabel.split(" ")[1]}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>

            <Text style={styles.caption}>
              Avg {overallAvg.toFixed(1)}/5 · {activeWeeks.length} weeks with data
            </Text>
          </>
        )}
      </AdaptiveBlurView>
    </View>
  );
});
TechniqueFocusChart.displayName = "TechniqueFocusChart";

const styles = StyleSheet.create({
  section: {},
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
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
    gap: 10,
    overflow: "hidden",
  },
  empty: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    lineHeight: 20,
    textAlign: "center",
    paddingVertical: 16,
  },
  caption: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },
});
