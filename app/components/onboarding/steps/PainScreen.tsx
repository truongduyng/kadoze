import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { palette } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { PAIN_SECTIONS } from "./data";
import { ScreenShell } from "./shared";
import { ORANGE, SOFT_ORANGE, makeStyles } from "./theme";

export function PainScreen({
  selected,
  onToggle,
  onNext,
  focusAreas,
}: {
  selected: string[];
  onToggle: (pain: string) => void;
  onNext: () => void;
  focusAreas?: string[];
}) {
  const C = useTheme();
  const s = makeStyles(C);

  const visibleSections = focusAreas && focusAreas.length > 0
    ? PAIN_SECTIONS.filter((section) => focusAreas.includes(section.focus))
    : PAIN_SECTIONS;

  return (
    <ScreenShell onNext={onNext} disabled={selected.length === 0} scroll>
      <View style={s.painIntro}>
        <View style={s.painIntroCopy}>
          <Text style={s.headline}>What feels hardest right now?</Text>
          <Text style={s.body}>Choose up to three. We&apos;ll turn them into a small starting system.</Text>
        </View>
      </View>
      <View style={s.painSectionList}>
        {visibleSections.map((section) => (
          <View key={section.focus} style={s.painSection}>
            <View style={s.painSectionHeader}>
              <View style={s.painSectionTitleWrap}>
                <Ionicons name={section.icon} size={14} color={SOFT_ORANGE} />
                <Text style={s.painSectionTitle}>{section.label}</Text>
              </View>
            </View>
            <View style={s.painChoiceList}>
              {section.items.map(({ pain }) => {
                const active = selected.includes(pain);
                const locked = selected.length >= 3 && !active;
                return (
                  <Pressable
                    key={pain}
                    onPress={() => onToggle(pain)}
                    disabled={locked}
                    style={[s.painChoice, active && s.painChoiceActive, locked && s.dimmed]}
                  >
                    <Text style={[s.painChoiceText, active && s.painChoiceTextActive]}>
                      {pain}
                    </Text>
                    <Ionicons
                      name={active ? "checkmark-circle" : "ellipse-outline"}
                      size={20}
                      color={active ? ORANGE : palette.white25}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </ScreenShell>
  );
}
