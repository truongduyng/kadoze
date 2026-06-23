import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { ScreenShell } from "./shared";
import { ORANGE, makeStyles } from "./theme";

const APP_TOUR_ITEMS = [
  {
    icon: "home-outline" as const,
    tab: "Home",
    title: "Set your daily focus",
    description: "Each morning, pick one goal that makes the day worth it, then capture any quick task or idea before it disappears.",
  },
  {
    icon: "repeat-outline" as const,
    tab: "Routines",
    title: "Track your habit streak",
    description: "Your keystone habit lives here. One check-in a day builds the chain.",
  },
  {
    icon: "person-outline" as const,
    tab: "Profile",
    title: "See your progress",
    description: "Review your stats, manage blocked apps, and tune your settings.",
  },
] as const;

export function AppTourScreen({ onNext }: { onNext: () => void }) {
  const C = useTheme();
  const s = makeStyles(C);
  return (
    <ScreenShell onNext={onNext} cta="Got it - let's go">
      <View style={s.copyBlock}>
        <Text style={s.headline}>Here&apos;s how 1Per works.</Text>
        <Text style={s.body}>Three tabs. One clear purpose each.</Text>
      </View>
      <View style={s.cardList}>
        {APP_TOUR_ITEMS.map((item) => (
          <View key={item.tab} style={s.tourCard}>
            <View style={s.tourIconWrap}>
              <Ionicons name={item.icon} size={24} color={ORANGE} />
            </View>
            <View style={s.flex}>
              <View style={s.tourTitleRow}>
                <Text style={s.tourTab}>{item.tab}</Text>
              </View>
              <Text style={s.tourTitle}>{item.title}</Text>
              <Text style={s.tourDescription}>{item.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScreenShell>
  );
}
