import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import type { IoniconName } from "@/lib/iconNames";

interface IdentityStepProps {
  name: string;
  avatar: IoniconName;
  onChangeName: (value: string) => void;
  onChangeAvatar: (value: IoniconName) => void;
  onNext: () => void;
}

const AVATARS: IoniconName[] = [
  "happy-outline",
  "glasses-outline",
  "leaf-outline",
  "flame-outline",
  "flash-outline",
  "moon-outline",
  "bulb-outline",
  "person-circle-outline",
];

export default function IdentityStep({
  name,
  avatar,
  onChangeName,
  onChangeAvatar,
  onNext,
}: IdentityStepProps) {
  const C = useTheme();
  const s = makeStyles(C);
  const trimmedName = name.trim();

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.content}>
        <View style={s.header}>
          <Text style={s.headline}>What should we call you?</Text>
          <Text style={s.body}>
            Pick a name and an avatar so Kadoze feels a little more like yours.
          </Text>
        </View>

        <View style={s.card}>
          <Text style={s.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={onChangeName}
            placeholder="Enter your name"
            placeholderTextColor={C.textPlaceholder}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            style={s.input}
            maxLength={32}
          />

          <Text style={s.label}>Choose an avatar</Text>
          <View style={s.avatarGrid}>
            {AVATARS.map((option) => {
              const isSelected = avatar === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[s.avatarButton, isSelected && s.avatarButtonSelected]}
                  onPress={() => onChangeAvatar(option)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={option}
                    size={28}
                    color={isSelected ? palette.orange : C.textSecondary}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[s.btn, !trimmedName && s.btnDisabled]}
        onPress={trimmedName ? onNext : undefined}
        activeOpacity={0.85}
      >
        <Text style={s.btnText}>Continue</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
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
    header: { gap: 12 },
    headline: {
      fontSize: 30,
      fontWeight: "800",
      color: C.textPrimary,
      lineHeight: 38,
    },
    body: {
      fontSize: 15,
      color: C.textSecondary,
      lineHeight: 22,
      maxWidth: 320,
    },
    card: {
      gap: 16,
      padding: 20,
      borderRadius: 24,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    label: {
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: C.textSecondary,
    },
    input: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.inputBorder,
      backgroundColor: C.inputBg,
      paddingHorizontal: 16,
      paddingVertical: 16,
      color: C.textPrimary,
      fontSize: 17,
      fontWeight: "600",
    },
    avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    avatarButton: {
      width: 62,
      height: 62,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: C.inputBg,
      borderWidth: 1.5,
      borderColor: C.inputBorder,
    },
    avatarButtonSelected: {
      backgroundColor: C.accentBg,
      borderColor: palette.orange,
    },
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
