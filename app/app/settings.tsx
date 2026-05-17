import Constants from "expo-constants";
import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GradientBackground from "@/components/GradientBackground";
import { resetDatabase } from "@/lib/db";
import {
  ThemePreference,
  useThemePreference,
} from "@/contexts/ThemeContext";
import { palette } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

const THEME_OPTIONS: ThemePreference[] = ["system", "light", "dark"];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const C = useTheme();
  const version = Constants.expoConfig?.version ?? "1.0.0";
  const { preference, setPreference } = useThemePreference();

  const handleReset = () => {
    Alert.alert(
      "Reset all data",
      "This will permanently delete your profile, habits, and notes.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await resetDatabase();
            router.replace("/onboarding");
          },
        },
      ],
    );
  };

  const s = makeStyles(C);

  return (
    <View style={s.container}>
      <GradientBackground />
      <Stack.Screen options={{ title: "Settings", headerShown: true }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 20,
          gap: 18,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.section}>
          <Text selectable style={s.sectionLabel}>
            Appearance
          </Text>
          <View style={s.card}>
            <Text selectable style={s.cardTitle}>
              Theme
            </Text>
            <Text selectable style={s.cardCopy}>
              Choose whether Kado follows the system or stays fixed.
            </Text>

            <View style={s.segmentRow}>
              {THEME_OPTIONS.map((option) => {
                const active = preference === option;
                return (
                  <Pressable
                    key={option}
                    style={[s.segmentButton, active && s.segmentButtonActive]}
                    onPress={() => setPreference(option)}
                  >
                    <Text
                      selectable
                      style={[s.segmentLabel, active && s.segmentLabelActive]}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text selectable style={s.sectionLabel}>
            App
          </Text>
          <View style={s.listCard}>
            <View style={s.listRow}>
              <Text selectable style={s.rowLabel}>
                Version
              </Text>
              <Text selectable style={s.rowValue}>
                {version}
              </Text>
            </View>
            <View style={s.divider} />
            <View style={s.listRow}>
              <Text selectable style={s.rowLabel}>
                Navigation
              </Text>
              <Text selectable style={s.rowValue}>
                Native tabs
              </Text>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text selectable style={s.sectionLabel}>
            Data
          </Text>
          <View style={s.listCard}>
            <Pressable style={s.actionRow} onPress={handleReset}>
              <View style={s.actionTextBlock}>
                <Text selectable style={s.dangerLabel}>
                  Reset all data
                </Text>
                <Text selectable style={s.dangerCopy}>
                  Start over from onboarding and clear the local database.
                </Text>
              </View>
              <Text selectable style={s.chevron}>
                ›
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof import("@/hooks/useTheme").useTheme>) {
  return StyleSheet.create({
    container: { flex: 1 },
    section: { gap: 10 },
    sectionLabel: {
      color: C.textTertiary,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1.5,
      textTransform: "uppercase",
    },
    card: {
      borderRadius: 24,
      borderCurve: "continuous",
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 18,
      gap: 14,
    },
    cardTitle: {
      color: C.textPrimary,
      fontSize: 18,
      fontWeight: "700",
    },
    cardCopy: {
      color: C.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    segmentRow: {
      flexDirection: "row",
      gap: 10,
    },
    segmentButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 16,
      borderCurve: "continuous",
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    segmentButtonActive: {
      backgroundColor: C.accentBg,
      borderColor: C.accentBorder,
    },
    segmentLabel: {
      color: C.textSecondary,
      fontSize: 14,
      fontWeight: "700",
    },
    segmentLabelActive: {
      color: palette.orange,
    },
    listCard: {
      borderRadius: 24,
      borderCurve: "continuous",
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.cardBorder,
      overflow: "hidden",
    },
    listRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    rowLabel: {
      color: C.textPrimary,
      fontSize: 15,
      fontWeight: "500",
    },
    rowValue: {
      color: C.textSecondary,
      fontSize: 14,
      fontWeight: "700",
    },
    divider: {
      height: 1,
      backgroundColor: C.divider,
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    actionTextBlock: {
      flex: 1,
      gap: 4,
    },
    dangerLabel: {
      color: "#FF7B7B",
      fontSize: 15,
      fontWeight: "700",
    },
    dangerCopy: {
      color: C.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    chevron: {
      color: C.textTertiary,
      fontSize: 22,
    },
  });
}
