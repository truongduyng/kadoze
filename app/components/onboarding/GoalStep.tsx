import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { palette } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

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
  const C = useTheme();
  const s = makeStyles(C);

  return (
    <View style={s.container}>
      <View style={s.content}>
        <Text style={s.question}>What is your{"\n"}primary life focus?</Text>
        <Text style={s.subtitle}>Choose the area you want to grow first.</Text>

        <View style={s.grid}>
          {GOALS.map((goal) => {
            const isSelected = value === goal.id;
            return (
              <TouchableOpacity
                key={goal.id}
                style={[s.cell, isSelected && s.cellSelected]}
                onPress={() => onChange(goal.id)}
                activeOpacity={0.75}
              >
                <View style={[s.iconWrap, isSelected && s.iconWrapSelected]}>
                  <Ionicons
                    name={goal.icon}
                    size={28}
                    color={isSelected ? palette.orange : C.textSecondary}
                  />
                </View>
                <Text style={[s.cellLabel, isSelected && s.cellLabelSelected]}>
                  {goal.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        style={[s.btn, !value && s.btnDisabled]}
        onPress={value ? onNext : undefined}
        activeOpacity={0.85}
      >
        <Text style={s.btnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof import("@/hooks/useTheme").useTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: "space-between",
      paddingBottom: 32,
    },
    content: { flex: 1, justifyContent: "center", gap: 20 },
    question: {
      fontSize: 30,
      fontWeight: "800",
      color: C.textPrimary,
      lineHeight: 38,
    },
    subtitle: {
      fontSize: 14,
      color: C.textTertiary,
      marginTop: -8,
    },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
    cell: {
      flexBasis: "47%",
      flexGrow: 1,
      aspectRatio: 1.35,
      backgroundColor: C.cardBg,
      borderWidth: 1.5,
      borderColor: C.cardBorder,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingHorizontal: 12,
      paddingVertical: 16,
    },
    cellSelected: {
      borderColor: palette.orange,
      backgroundColor: C.accentBgSubtle,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: C.inputBg,
      alignItems: "center",
      justifyContent: "center",
    },
    iconWrapSelected: { backgroundColor: C.accentBg },
    cellLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: C.textSecondary,
      textAlign: "center",
      lineHeight: 19,
    },
    cellLabelSelected: { color: C.textPrimary },
    btn: {
      backgroundColor: palette.orange,
      borderRadius: 14,
      paddingVertical: 18,
      alignItems: "center",
    },
    btnDisabled: { opacity: 0.35 },
    btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  });
}
