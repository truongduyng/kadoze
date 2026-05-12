import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  KEYSTONE_HABITS_BY_FOCUS,
  DEFAULT_KEYSTONE_HABITS,
  type KeystoneHabit,
} from "@/hooks/useOnboarding";
import { palette } from "@/constants/theme";

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
  const habits: KeystoneHabit[] =
    KEYSTONE_HABITS_BY_FOCUS[focus] ?? DEFAULT_KEYSTONE_HABITS;

  const focusLabel = FOCUS_LABEL[focus];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View>
          <Text style={styles.headline}>Pick your keystone habit.</Text>
          {focusLabel ? (
            <View style={styles.focusBadge}>
              <Ionicons name="flag-outline" size={12} color={palette.orange} />
              <Text style={styles.focusBadgeText}>{focusLabel}</Text>
            </View>
          ) : null}
          <Text style={styles.subtitle}>
            One habit done consistently beats ten done randomly.
          </Text>
        </View>

        <View style={styles.list}>
          {habits.map((habit) => {
            const isSelected = selected === habit.id;
            return (
              <TouchableOpacity
                key={habit.id}
                style={[styles.row, isSelected && styles.rowSelected]}
                onPress={() => onSelect(habit.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                  <Text style={styles.habitIcon}>{habit.icon}</Text>
                </View>
                <View style={styles.habitInfo}>
                  <Text style={[styles.habitTitle, isSelected && styles.habitTitleSelected]}>
                    {habit.title}
                  </Text>
                  <Text style={styles.habitSubtitle}>{habit.subtitle}</Text>
                </View>
                <Ionicons
                  name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={isSelected ? palette.orange : "rgba(255,255,255,0.25)"}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity style={styles.btn} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.btnText}>Next</Text>
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
    gap: 24,
  },
  headline: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 38,
    marginBottom: 8,
  },
  focusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(251,146,60,0.12)",
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.3)",
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
    color: "rgba(255,255,255,0.45)",
    lineHeight: 20,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 14,
  },
  rowSelected: {
    borderColor: palette.orange,
    backgroundColor: "rgba(251,146,60,0.1)",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapSelected: {
    backgroundColor: "rgba(251,146,60,0.18)",
  },
  habitIcon: {
    fontSize: 20,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
  },
  habitTitleSelected: {
    color: "#fff",
  },
  habitSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    marginTop: 2,
  },
  btn: {
    backgroundColor: palette.orange,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
