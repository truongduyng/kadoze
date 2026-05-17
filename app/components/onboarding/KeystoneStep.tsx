import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  KEYSTONE_HABITS_BY_FOCUS,
  DEFAULT_KEYSTONE_HABITS,
  type KeystoneHabit,
} from "@/hooks/useOnboarding";
import { palette } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

interface KeystoneStepProps {
  focus: string;
  selected: string;
  onSelect: (id: string) => void;
  onNext: () => void;
}

const FOCUS_LABEL: Record<string, string> = {
  health:    "Health & Vitality",
  mindset:   "Mindset & Growth",
  work:      "Work & Business",
  relations: "Relationships",
  creative:  "Creativity",
  finance:   "Financial Freedom",
};

export default function KeystoneStep({ focus, selected, onSelect, onNext }: KeystoneStepProps) {
  const C = useTheme();
  const s = makeStyles(C);
  const habits: KeystoneHabit[] =
    KEYSTONE_HABITS_BY_FOCUS[focus] ?? DEFAULT_KEYSTONE_HABITS;

  const focusLabel = FOCUS_LABEL[focus];

  return (
    <View style={s.container}>
      <View style={s.content}>
        <View>
          <Text style={s.headline}>Pick your keystone habit.</Text>
          {focusLabel ? (
            <View style={s.focusBadge}>
              <Ionicons name="flag-outline" size={12} color={palette.orange} />
              <Text style={s.focusBadgeText}>{focusLabel}</Text>
            </View>
          ) : null}
          <Text style={s.subtitle}>
            One habit done consistently beats ten done randomly.
          </Text>
        </View>

        <View style={s.list}>
          {habits.map((habit) => {
            const isSelected = selected === habit.id;
            return (
              <TouchableOpacity
                key={habit.id}
                style={[s.row, isSelected && s.rowSelected]}
                onPress={() => onSelect(habit.id)}
                activeOpacity={0.75}
              >
                <View style={[s.iconWrap, isSelected && s.iconWrapSelected]}>
                  <Ionicons
                    name={habit.icon}
                    size={22}
                    color={isSelected ? palette.orange : C.iconSecondary}
                  />
                </View>
                <View style={s.habitInfo}>
                  <Text style={[s.habitTitle, isSelected && s.habitTitleSelected]}>
                    {habit.title}
                  </Text>
                  <Text style={s.habitSubtitle}>{habit.subtitle}</Text>
                </View>
                <Ionicons
                  name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={isSelected ? palette.orange : C.textQuaternary}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity style={s.btn} onPress={onNext} activeOpacity={0.85}>
        <Text style={s.btnText}>Next</Text>
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
    content: { flex: 1, justifyContent: "center", gap: 24 },
    headline: {
      fontSize: 30,
      fontWeight: "800",
      color: C.textPrimary,
      lineHeight: 38,
      marginBottom: 8,
    },
    focusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      alignSelf: "flex-start",
      backgroundColor: C.accentBg,
      borderWidth: 1,
      borderColor: C.accentBorder,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginBottom: 10,
    },
    focusBadgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: palette.orange,
    },
    subtitle: {
      fontSize: 14,
      color: C.textTertiary,
      lineHeight: 20,
    },
    list: { gap: 10 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.cardBg,
      borderWidth: 1.5,
      borderColor: C.cardBorder,
      borderRadius: 16,
      paddingVertical: 20,
      paddingHorizontal: 20,
      gap: 14,
    },
    rowSelected: {
      borderColor: palette.orange,
      backgroundColor: C.accentBgSubtle,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: C.inputBg,
      alignItems: "center",
      justifyContent: "center",
    },
    iconWrapSelected: { backgroundColor: C.accentBg },
    habitInfo: { flex: 1 },
    habitTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: C.textSecondary,
    },
    habitTitleSelected: { color: C.textPrimary },
    habitSubtitle: {
      fontSize: 12,
      color: C.textTertiary,
      marginTop: 2,
    },
    btn: {
      backgroundColor: palette.orange,
      borderRadius: 14,
      paddingVertical: 18,
      alignItems: "center",
    },
    btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  });
}
