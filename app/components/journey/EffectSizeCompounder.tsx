import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop, Circle, Line, Text as SvgText } from "react-native-svg";
import AdaptiveBlurView from "@/components/ui/AdaptiveBlurView";
import { CompoundPoint } from "@/lib/performance";

interface EffectSizeCompounderProps {
  curve: CompoundPoint[]; // {x, y} points where y = 1.01^x
  activeDays: number;
}

export const EffectSizeCompounder = React.memo(({ curve, activeDays }: EffectSizeCompounderProps) => {
  const { width } = useWindowDimensions();
  const chartWidth = width - 12 * 2 - 18 * 2;
  const chartHeight = 90;

  const currentMultiplier = activeDays > 0 ? Math.pow(1.01, activeDays) : 1;
  const effectSize = ((currentMultiplier - 1) * 100).toFixed(1);

  if (curve.length < 2) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Effect Size Compounder</Text>
        <AdaptiveBlurView style={styles.card}>
          <Text style={styles.empty}>Start completing habits to see the power of compounding.</Text>
        </AdaptiveBlurView>
      </View>
    );
  }

  const maxY = curve[curve.length - 1].y;
  const minY = 1;

  const toSvgX = (x: number) => (x / curve[curve.length - 1].x) * chartWidth;
  const toSvgY = (y: number) =>
    chartHeight - ((y - minY) / (maxY - minY)) * chartHeight;

  // Build path
  let pathD = "";
  let areaD = "";
  curve.forEach((pt, i) => {
    const sx = toSvgX(pt.x);
    const sy = toSvgY(pt.y);
    if (i === 0) {
      pathD += `M ${sx} ${sy}`;
      areaD += `M ${sx} ${chartHeight} L ${sx} ${sy}`;
    } else {
      pathD += ` L ${sx} ${sy}`;
      areaD += ` L ${sx} ${sy}`;
    }
  });
  areaD += ` L ${toSvgX(curve[curve.length - 1].x)} ${chartHeight} Z`;

  // Current point
  const curX = toSvgX(activeDays);
  const curY = toSvgY(currentMultiplier);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Effect Compounder</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>+{effectSize}%</Text>
        </View>
      </View>

      <AdaptiveBlurView style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.multiplier}>{currentMultiplier.toFixed(3)}x</Text>
        </View>

        <Svg width={chartWidth} height={chartHeight + 16}>
          <Defs>
            <LinearGradient id="compoundGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#fb923c" stopOpacity={0.35} />
              <Stop offset="100%" stopColor="#fb923c" stopOpacity={0.02} />
            </LinearGradient>
          </Defs>

          {/* Y axis reference lines */}
          {[1, maxY * 0.5 + 0.5, maxY].map((val, i) => {
            const y = toSvgY(val);
            return (
              <Line
                key={i}
                x1={0}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
            );
          })}

          {/* Area fill */}
          <Path d={areaD} fill="url(#compoundGrad)" />

          {/* Curve line */}
          <Path d={pathD} fill="none" stroke="#fb923c" strokeWidth={2} />

          {/* Current position dot */}
          {activeDays > 0 && (
            <Circle cx={curX} cy={curY} r={5} fill="#fb923c" />
          )}

          {/* X axis labels */}
          <SvgText x={0} y={chartHeight + 14} fontSize={9} fill="rgba(255,255,255,0.3)">
            Day 0
          </SvgText>
          <SvgText
            x={chartWidth - 2}
            y={chartHeight + 14}
            fontSize={9}
            fill="rgba(255,255,255,0.3)"
            textAnchor="end"
          >
            {`Day ${Math.round(curve[curve.length - 1].x)}`}
          </SvgText>
        </Svg>

        <Text style={styles.caption}>
          1.01^{activeDays} · 1% better every single day
        </Text>
      </AdaptiveBlurView>
    </View>
  );
});
EffectSizeCompounder.displayName = "EffectSizeCompounder";

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
    backgroundColor: "rgba(34,197,94,0.15)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    color: "#22c55e",
    fontWeight: "600",
  },
  card: {
    borderRadius: 18,
    padding: 18,
    gap: 12,
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  multiplier: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fb923c",
    letterSpacing: -1,
    minWidth: 80,
  },
  desc: {
    flex: 1,
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 19,
  },
  highlight: {
    color: "#fb923c",
    fontWeight: "600",
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
    color: "rgba(255,255,255,0.35)",
  },
});
