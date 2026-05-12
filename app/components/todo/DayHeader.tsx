import React from "react";
import { Text, TouchableOpacity, StyleSheet, View } from "react-native";
import { Colors } from "@/constants/theme";
import { DAYS_OF_WEEK } from "./weekUtils";

interface DayHeaderProps {
  date: Date;
  index: number;
  isSelected: boolean;
  isDisabled?: boolean;
  onSelect: (date: Date) => void;
}

export const DayHeader: React.FC<DayHeaderProps> = ({
  date,
  index,
  isSelected,
  isDisabled = false,
  onSelect,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => !isDisabled && onSelect(date)}
      activeOpacity={isDisabled ? 1 : 0.7}
    >
      <Text style={[styles.dayText, isSelected && styles.selectedDayText, isDisabled && styles.disabledText]}>
        {DAYS_OF_WEEK[index]}
      </Text>
      <View style={[styles.dateCircle, isSelected && styles.dateCircleSelected]}>
        <Text style={[styles.dateText, isSelected && styles.selectedDateText, isDisabled && styles.disabledText]}>
          {date.getDate()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    gap: 4,
  },
  dayText: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.3,
  },
  selectedDayText: {
    color: Colors.light.tint,
  },
  dateCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dateCircleSelected: {
    backgroundColor: Colors.light.tint,
  },
  dateText: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
  },
  selectedDateText: {
    color: "#fff",
    fontWeight: "700",
  },
  disabledText: {
    color: "rgba(255,255,255,0.2)",
  },
});
