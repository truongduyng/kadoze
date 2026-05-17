import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { palette } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

interface HookStepProps {
  selected: string | null;
  onSelect: (value: string) => void;
}

const OPTIONS: {
  value: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}[] = [
  { value: "too_many_ideas", label: "I have too many ideas\nand lose track of them.", icon: "bulb-outline" },
  { value: "daily_habits", label: "I struggle to stick\nto daily habits.", icon: "checkmark-circle-outline" },
  { value: "scattered", label: "I feel scattered across\ntoo many apps.", icon: "apps" },
];

export default function HookStep({ selected, onSelect }: HookStepProps) {
  const C = useTheme();
  const s = makeStyles(C);

  return (
    <View style={s.container}>
      <View style={s.content}>
        <Text style={s.question}>What brought{"\n"}you here today?</Text>
        <Text style={s.subtitle}>Pick the one that feels most true.</Text>

        <View style={s.options}>
          {OPTIONS.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[s.option, isSelected && s.optionSelected]}
                onPress={() => onSelect(opt.value)}
                activeOpacity={0.75}
              >
                <View style={[s.iconContainer, isSelected && s.iconContainerSelected]}>
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={isSelected ? palette.orange : C.textSecondary}
                  />
                </View>
                <Text style={[s.optionText, isSelected && s.optionTextSelected]}>
                  {opt.label}
                </Text>
                {isSelected ? (
                  <Ionicons name="checkmark-circle" size={22} color={palette.orange} />
                ) : (
                  <Ionicons name="ellipse-outline" size={22} color={C.textQuaternary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof import("@/hooks/useTheme").useTheme>) {
  return StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 24 },
    content: { flex: 1, justifyContent: "center", paddingBottom: 40 },
    question: {
      fontSize: 32,
      fontWeight: "800",
      color: C.textPrimary,
      lineHeight: 40,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 15,
      color: C.textTertiary,
      marginBottom: 36,
    },
    options: { gap: 12 },
    option: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.cardBg,
      borderWidth: 1.5,
      borderColor: C.cardBorder,
      borderRadius: 14,
      paddingVertical: 18,
      paddingHorizontal: 18,
      justifyContent: "space-between",
    },
    optionSelected: {
      borderColor: palette.orange,
      backgroundColor: C.accentBgSubtle,
    },
    optionText: {
      flex: 1,
      fontSize: 15,
      color: C.textSecondary,
      fontWeight: "500",
      lineHeight: 21,
    },
    optionTextSelected: { color: C.textPrimary },
    iconContainer: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: C.inputBg,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    iconContainerSelected: { backgroundColor: C.accentBg },
  });
}
