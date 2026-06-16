import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { palette } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import {
  APP_BLOCKER_SELECTION_ID,
  AppBlockerSelectionSheet,
  appBlocker,
} from "@/lib/appBlocker";

interface ScreenTimeStepProps {
  onNext: () => void;
}

const BENEFITS = [
  {
    icon: "phone-portrait-outline" as const,
    title: "Block distracting apps",
    subtitle: "Lock social feeds until your tasks are done.",
  },
  {
    icon: "timer-outline" as const,
    title: "Protect your focus time",
    subtitle: "No willpower needed — remove the temptation.",
  },
  {
    icon: "trending-up-outline" as const,
    title: "Build real discipline",
    subtitle: "Habits stick when distractions can't compete.",
  },
];

export default function ScreenTimeStep({ onNext }: ScreenTimeStepProps) {
  const C = useTheme();
  const s = makeStyles(C);
  const [state, setState] = useState<"idle" | "requesting" | "picking">("idle");

  const handleEnable = async () => {
    if (!appBlocker.isSupported) {
      onNext();
      return;
    }
    setState("requesting");
    await appBlocker.requestAuthorization();
    const status = await appBlocker.getAuthorizationStatus();
    if (status === "approved") {
      setState("picking");
    } else {
      onNext();
    }
  };

  if (state === "picking") {
    return (
      <View style={s.pickerRoot}>
        <View style={s.pickerHeader}>
          <Text style={s.pickerTitle}>Choose apps to block</Text>
          <Text style={s.pickerSubtitle}>
            Select the apps you want locked until you finish your daily tasks and habits.
          </Text>
        </View>
        <AppBlockerSelectionSheet
          activitySelectionId={APP_BLOCKER_SELECTION_ID}
          style={s.sheet}
        />
        <View style={s.footer}>
          <TouchableOpacity style={s.btn} onPress={onNext} activeOpacity={0.85}>
            <Text style={s.btnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.content}>
        <View style={s.iconWrap}>
          <View style={s.iconCircle}>
            <Ionicons name="shield-checkmark-outline" size={44} color={palette.orange} />
          </View>
        </View>

        <View>
          <Text style={s.headline}>
            Block the apps that{"\n"}
            <Text style={s.highlight}>steal</Text> your focus.
          </Text>
          <Text style={s.body}>
            Use Screen Time to lock distracting apps until you've finished your
            daily habits and tasks — so your goals come first.
          </Text>
        </View>

        <View style={s.benefitList}>
          {BENEFITS.map((item) => (
            <View key={item.title} style={s.benefitRow}>
              <View style={s.benefitIcon}>
                <Ionicons name={item.icon} size={28} color={palette.orange} />
              </View>
              <View style={s.benefitCopy}>
                <Text style={s.benefitTitle}>{item.title}</Text>
                <Text style={s.benefitSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.btn, state === "requesting" && s.btnDisabled]}
          onPress={handleEnable}
          activeOpacity={0.85}
          disabled={state === "requesting"}
        >
          {state === "requesting" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.btnText}>Set up app blocking</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext} activeOpacity={0.7} hitSlop={12}>
          <Text style={s.skipText}>Maybe later</Text>
        </TouchableOpacity>
      </View>
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
    content: {
      flex: 1,
      justifyContent: "center",
      gap: 28,
      paddingBottom: 20,
    },
    iconWrap: {
      alignItems: "center",
    },
    iconCircle: {
      width: 96,
      height: 96,
      borderRadius: 32,
      borderCurve: "continuous",
      backgroundColor: C.accentBg,
      borderWidth: 1.5,
      borderColor: C.accentBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    headline: {
      fontSize: 30,
      fontWeight: "800",
      color: C.textPrimary,
      lineHeight: 38,
    },
    highlight: {
      color: palette.orange,
    },
    body: {
      fontSize: 16,
      color: C.textSecondary,
      lineHeight: 24,
      marginTop: 8,
    },
    benefitList: {
      gap: 12,
    },
    benefitRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.cardBorder,
      borderRadius: 14,
      borderCurve: "continuous",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    benefitIcon: {
      width: 54,
      height: 54,
      borderRadius: 14,
      borderCurve: "continuous",
      alignItems: "center",
      justifyContent: "center",
    },
    benefitCopy: {
      flex: 1,
      gap: 2,
    },
    benefitTitle: {
      color: C.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    benefitSubtitle: {
      color: C.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    footer: {
      gap: 14,
      alignItems: "center",
    },
    btn: {
      backgroundColor: palette.orange,
      borderRadius: 14,
      paddingVertical: 18,
      alignItems: "center",
      width: "100%",
    },
    btnDisabled: {
      opacity: 0.6,
    },
    btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    skipText: {
      color: C.textTertiary,
      fontSize: 14,
      fontWeight: "600",
    },
    // Picker state
    pickerRoot: {
      flex: 1,
      paddingBottom: 32,
    },
    pickerHeader: {
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 16,
      gap: 8,
    },
    pickerTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: C.textPrimary,
    },
    pickerSubtitle: {
      fontSize: 15,
      color: C.textSecondary,
      lineHeight: 22,
    },
    sheet: {
      flex: 1,
    },
  });
}
