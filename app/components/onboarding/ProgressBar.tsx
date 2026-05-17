import React from "react";
import { View, StyleSheet } from "react-native";
import { palette } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

interface ProgressBarProps {
  step: number;
  total: number;
}

export default function ProgressBar({ step, total }: ProgressBarProps) {
  const C = useTheme();
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < step;
        return (
          <View
            key={i}
            style={[
              styles.segment,
              { flex: 1 },
              filled ? styles.filled : { backgroundColor: C.cardBorder },
              i < total - 1 && styles.gap,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  segment: {
    height: 3,
    borderRadius: 2,
  },
  filled: {
    backgroundColor: palette.orange,
  },
  gap: {
    marginRight: 4,
  },
});
