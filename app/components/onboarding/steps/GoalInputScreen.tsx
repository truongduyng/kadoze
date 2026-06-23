import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { palette } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { getGoalSuggestions } from "./data";
import { ScreenShell } from "./shared";
import { ORANGE, makeStyles } from "./theme";

export function GoalInputScreen({
  value,
  onChange,
  onNext,
  focusAreas = [],
  painPoints = [],
}: {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  focusAreas?: string[];
  painPoints?: string[];
}) {
  const C = useTheme();
  const s = makeStyles(C);
  const inputRef = useRef<TextInput>(null);
  const canContinue = value.trim().length > 0;
  const suggestions = useMemo(
    () => getGoalSuggestions(focusAreas, painPoints),
    [focusAreas, painPoints],
  );

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={s.keyboard}>
      <ScreenShell onNext={onNext} disabled={!canContinue} stickyFooter dismissesKeyboard>
        <View style={s.copyBlock}>
          <Text style={s.headline}>What would make today feel meaningful?</Text>
          <Text style={s.body}>Your answer becomes your first focus.</Text>
        </View>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          placeholder="Type your answer..."
          placeholderTextColor={palette.white35}
          multiline
          style={s.goalInput}
          selectionColor={ORANGE}
        />
        <View style={s.goalSuggestionList}>
          {suggestions.map((suggestion) => {
            const active = value.trim() === suggestion;
            return (
              <Pressable
                key={suggestion}
                onPress={() => onChange(suggestion)}
                style={[s.goalSuggestion, active && s.goalSuggestionActive]}
              >
                <Text style={[s.goalSuggestionText, active && s.goalSuggestionTextActive]}>
                  {suggestion}
                </Text>
                <Ionicons
                  name={active ? "checkmark-circle" : "add-circle-outline"}
                  size={18}
                  color={active ? ORANGE : palette.white35}
                />
              </Pressable>
            );
          })}
        </View>
      </ScreenShell>
    </View>
  );
}
