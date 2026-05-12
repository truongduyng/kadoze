import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { type DaySummary } from "@/hooks/chat/useChatHistory";
import { Colors } from "@/constants/theme";

interface DaySummaryCardProps {
  day: DaySummary;
  onPress: () => void;
  isLast: boolean;
}

export default function DaySummaryCard({ day, onPress, isLast }: DaySummaryCardProps) {
  const isGap = !!day.gapDays;
  const isToday = day.displayDate === "Today";

  if (isGap) {
    // Scale dot: 14px base + 1px per day over 4, capped at 28px
    const gapDotSize = Math.min(14 + (day.gapDays! - 4), 28);
    return (
      <View style={styles.row}>
        <View style={styles.spine}>
          <View style={[styles.dot, styles.dotGap, { width: gapDotSize, height: gapDotSize, borderRadius: gapDotSize / 2, marginTop: (14 - gapDotSize) / 2 + 2 }]} />
          {!isLast && <View style={styles.line} />}
        </View>
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.content}>
          <Text style={styles.dateLabel}>{day.displayDate}</Text>
          <Text style={styles.snippet}>{day.gapDays} days without notes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {/* Timeline spine */}
      <View style={styles.spine}>
        <View style={[styles.dot, isToday && styles.dotToday]} />
        {!isLast && <View style={styles.line} />}
      </View>

      {/* Content */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.content}>
        <Text style={styles.dateLabel}>{day.displayDate}</Text>
        <Text
          style={[styles.snippet, day.isWelcome && styles.snippetWelcome]}
          {...(!day.isWelcome && { numberOfLines: 2, ellipsizeMode: 'tail' })}
        >
          {day.snippet || (isToday ? "Tap to start your notebook..." : "No entries")}
        </Text>
        {day.messageCount > 0 && (
          <Text style={styles.count}>{day.messageCount} entries</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingLeft: 24,
    paddingRight: 20,
    marginBottom: 0,
  },
  spine: {
    width: 24,
    alignItems: "center",
    marginRight: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.tint,
    marginTop: 4,
    flexShrink: 0,
  },
  dotToday: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 2,
    shadowColor: Colors.light.tint,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  dotGap: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginTop: 4,
    marginBottom: 0,
    minHeight: 32,
  },
  content: {
    flex: 1,
    paddingBottom: 28,
  },
  dateLabel: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  snippet: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  snippetWelcome: {
    color: "#d3a076ff",
  },
  count: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
  },
});
