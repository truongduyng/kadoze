import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { palette } from "@/constants/theme";

interface GoalStepProps {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}

const GOALS: {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}[] = [
  { id: "health",    label: "Health & Vitality",   icon: "star-outline" },
  { id: "mindset",   label: "Mindset & Growth",    icon: "person-outline" },
  { id: "work",      label: "Work & Business",     icon: "briefcase-outline" },
  { id: "relations", label: "Relationships",       icon: "heart-outline" },
  { id: "creative",  label: "Creativity",          icon: "sparkles-outline" },
  { id: "finance",   label: "Financial Freedom",   icon: "cash-outline" },
];

export default function GoalStep({ value, onChange, onNext }: GoalStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.question}>What is your{"\n"}primary life focus?</Text>
        <Text style={styles.subtitle}>Choose the area you want to grow first.</Text>

        <View style={styles.grid}>
          {GOALS.map((goal) => {
            const isSelected = value === goal.id;
            return (
              <TouchableOpacity
                key={goal.id}
                style={[styles.cell, isSelected && styles.cellSelected]}
                onPress={() => onChange(goal.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                  <Ionicons
                    name={goal.icon}
                    size={28}
                    color={isSelected ? palette.orange : "rgba(255,255,255,0.55)"}
                  />
                </View>
                <Text style={[styles.cellLabel, isSelected && styles.cellLabelSelected]}>
                  {goal.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.btn, !value && styles.btnDisabled]}
        onPress={value ? onNext : undefined}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>Continue</Text>
      </TouchableOpacity>
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
  },
  question: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.45)",
    marginTop: -8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  cell: {
    flexBasis: "47%",
    flexGrow: 1,
    aspectRatio: 1.35,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  cellSelected: {
    borderColor: palette.orange,
    backgroundColor: "rgba(251,146,60,0.12)",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapSelected: {
    backgroundColor: "rgba(251,146,60,0.18)",
  },
  cellLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 19,
  },
  cellLabelSelected: {
    color: "#fff",
  },
  btn: {
    backgroundColor: palette.orange,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
