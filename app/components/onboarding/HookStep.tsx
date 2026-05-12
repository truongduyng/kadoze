import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface HookStepProps {
  selected: string | null;
  onSelect: (value: string) => void;
}

const OPTIONS = [
  { value: "too_many_ideas", label: "I have too many ideas and lose track of them." },
  { value: "daily_habits", label: "I struggle to stick to daily habits." },
  { value: "scattered", label: "I feel scattered across too many apps." },
];

const ORANGE = "#FB923C";

export default function HookStep({ selected, onSelect }: HookStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.question}>What brought{"\n"}you here today?</Text>
        <Text style={styles.subtitle}>Pick the one that feels most true.</Text>

        <View style={styles.options}>
          {OPTIONS.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => onSelect(opt.value)}
                activeOpacity={0.75}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {opt.label}
                </Text>
                {isSelected && <View style={styles.checkDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 40,
  },
  question: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.45)",
    marginBottom: 36,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    justifyContent: "space-between",
  },
  optionSelected: {
    borderColor: "#FB923C",
    backgroundColor: "rgba(251,146,60,0.1)",
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
    lineHeight: 21,
  },
  optionTextSelected: {
    color: "#fff",
  },
  checkDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FB923C",
    marginLeft: 12,
  },
});
