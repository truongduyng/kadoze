import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { KEYSTONE_HABITS, type KeystoneHabit } from "@/hooks/useOnboarding";
import { palette } from "@/constants/theme";

interface KeystoneStepProps {
  selected: string;
  onSelect: (id: string) => void;
  onNext: () => void;
}

export default function KeystoneStep({ selected, onSelect, onNext }: KeystoneStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.headline}>Select your foundation.</Text>
        <Text style={styles.subtitle}>
          You may only choose one.{"\n"}We will unlock more when you are ready.
        </Text>

        <View style={styles.list}>
          {KEYSTONE_HABITS.map((habit: KeystoneHabit) => {
            const isSelected = selected === habit.id;
            return (
              <TouchableOpacity
                key={habit.id}
                style={[
                  styles.row,
                  isSelected && styles.rowSelected,
                  habit.locked && styles.rowLocked,
                ]}
                onPress={habit.locked ? undefined : () => onSelect(habit.id)}
                activeOpacity={habit.locked ? 1 : 0.75}
              >
                <Text style={styles.habitIcon}>{habit.icon}</Text>
                <View style={styles.habitInfo}>
                  <Text style={[styles.habitTitle, isSelected && styles.habitTitleSelected]}>
                    {habit.title}
                  </Text>
                  <Text style={styles.habitSubtitle}>{habit.subtitle}</Text>
                </View>
                {habit.locked ? (
                  <Text style={styles.lockIcon}>🔒</Text>
                ) : isSelected ? (
                  <View style={styles.checkCircle}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.btnText}>Next</Text>
        </TouchableOpacity>
      </View>
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
  headline: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 34,
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
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  rowSelected: {
    borderColor: palette.orange,
    backgroundColor: "rgba(251,146,60,0.1)",
  },
  rowLocked: {
    opacity: 0.45,
  },
  habitIcon: {
    fontSize: 22,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  habitTitleSelected: {
    color: "#fff",
  },
  habitSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    marginTop: 2,
  },
  lockIcon: {
    fontSize: 14,
    opacity: 0.6,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "700",
  },
  footer: {},
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
