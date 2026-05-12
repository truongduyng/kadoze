import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { HeatmapDay, MonthLabel, getColorForCount } from "@/lib/performance";
import { DAYS_OF_WEEK, GRID_CONSTANTS, COLOR_THRESHOLDS } from "@/constants/performance";

interface ConsistencyHeatmapProps {
  heatmapData: HeatmapDay[][];
  monthLabels: MonthLabel[];
}

const MonthLabelsRow = React.memo(({ monthLabels }: { monthLabels: MonthLabel[] }) => (
  <View style={styles.monthLabels}>
    {monthLabels.map((monthData, index) => (
      <Text
        key={index}
        style={[
          styles.monthLabel,
          {
            left:
              monthData.weekIndex *
              (GRID_CONSTANTS.SQUARE_SIZE + GRID_CONSTANTS.SQUARE_GAP),
          },
        ]}
      >
        {monthData.label}
      </Text>
    ))}
  </View>
));
MonthLabelsRow.displayName = "MonthLabelsRow";

const DayLabelsColumn = React.memo(() => (
  <View style={styles.dayLabels}>
    {DAYS_OF_WEEK.map((day, index) =>
      index % 2 === 0 ? (
        <Text key={index} style={styles.dayLabel}>{day}</Text>
      ) : (
        <View key={index} style={styles.dayLabelSpacer} />
      ),
    )}
  </View>
));
DayLabelsColumn.displayName = "DayLabelsColumn";

const HeatmapGrid = React.memo(({ heatmapData }: { heatmapData: HeatmapDay[][] }) => (
  <View style={styles.weeksContainer}>
    {heatmapData.map((week, weekIndex) => (
      <View key={weekIndex} style={styles.week}>
        {week.map((day, dayIndex) =>
          day.isCurrentYear ? (
            <View
              key={dayIndex}
              style={[styles.daySquare, getColorForCount(day.count, day.isPastOrToday)]}
            />
          ) : (
            <View key={dayIndex} style={styles.emptySquare} />
          ),
        )}
      </View>
    ))}
  </View>
));
HeatmapGrid.displayName = "HeatmapGrid";

const HeatmapLegend = React.memo(() => (
  <View style={styles.legend}>
    <Text style={styles.legendText}>Less</Text>
    <View style={styles.legendSquares}>
      {[
        COLOR_THRESHOLDS.NONE,
        COLOR_THRESHOLDS.LOW,
        COLOR_THRESHOLDS.MEDIUM,
        COLOR_THRESHOLDS.HIGH,
        COLOR_THRESHOLDS.MAX,
      ].map((count, index) => (
        <View key={index} style={[styles.legendSquare, getColorForCount(count, true)]} />
      ))}
    </View>
    <Text style={styles.legendText}>More</Text>
  </View>
));
HeatmapLegend.displayName = "HeatmapLegend";

export const ConsistencyHeatmap = React.memo(
  ({ heatmapData, monthLabels }: ConsistencyHeatmapProps) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Consistency</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollContainer}
      >
        <View style={styles.heatmapContainer}>
          <MonthLabelsRow monthLabels={monthLabels} />
          <View style={styles.heatmapGrid}>
            <DayLabelsColumn />
            <HeatmapGrid heatmapData={heatmapData} />
          </View>
        </View>
      </ScrollView>
      <HeatmapLegend />
    </View>
  ),
);
ConsistencyHeatmap.displayName = "ConsistencyHeatmap";

const styles = StyleSheet.create({
  section: {},
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  scrollContainer: {
    marginBottom: 12,
  },
  heatmapContainer: {
    paddingRight: 20,
  },
  heatmapGrid: {
    flexDirection: "row",
  },
  monthLabels: {
    position: "relative",
    height: 16,
    marginBottom: 8,
    marginLeft: 40,
  },
  monthLabel: {
    position: "absolute",
    fontSize: 12,
    color: "#a1a1aa",
    textAlign: "left",
  },
  dayLabels: {
    width: 32,
    justifyContent: "space-between",
    marginRight: 8,
  },
  dayLabel: {
    fontSize: 11,
    color: "#a1a1aa",
    height: GRID_CONSTANTS.SQUARE_SIZE,
    textAlign: "right",
  },
  dayLabelSpacer: {
    height: GRID_CONSTANTS.SQUARE_SIZE,
  },
  weeksContainer: {
    flexDirection: "row",
    gap: GRID_CONSTANTS.SQUARE_GAP,
  },
  week: {
    gap: GRID_CONSTANTS.SQUARE_GAP,
  },
  daySquare: {
    width: GRID_CONSTANTS.SQUARE_SIZE,
    height: GRID_CONSTANTS.SQUARE_SIZE,
    borderRadius: 2,
  },
  emptySquare: {
    width: GRID_CONSTANTS.SQUARE_SIZE,
    height: GRID_CONSTANTS.SQUARE_SIZE,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  legendText: {
    fontSize: 12,
    color: "#a1a1aa",
  },
  legendSquares: {
    flexDirection: "row",
    gap: GRID_CONSTANTS.SQUARE_GAP,
  },
  legendSquare: {
    width: GRID_CONSTANTS.SQUARE_SIZE,
    height: GRID_CONSTANTS.SQUARE_SIZE,
    borderRadius: 2,
  },
});
