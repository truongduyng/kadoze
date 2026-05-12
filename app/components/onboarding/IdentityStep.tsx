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

import { palette } from "@/constants/theme";

interface IdentityStepProps {
  name: string;
  avatar: string;
  onChangeName: (value: string) => void;
  onChangeAvatar: (value: string) => void;
  onNext: () => void;
}

const AVATARS = ["🙂", "😎", "🌿", "🔥", "⚡", "🌙", "🧠", "🦊"];

export default function IdentityStep({
  name,
  avatar,
  onChangeName,
  onChangeAvatar,
  onNext,
}: IdentityStepProps) {
  const trimmedName = name.trim();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headline}>What should we call you?</Text>
          <Text style={styles.body}>
            Pick a name and an avatar so Kado feels a little more like yours.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={onChangeName}
            placeholder="Enter your name"
            placeholderTextColor={palette.white40}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            style={styles.input}
            maxLength={32}
          />

          <Text style={styles.label}>Choose an avatar</Text>
          <View style={styles.avatarGrid}>
            {AVATARS.map((option) => {
              const isSelected = avatar === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.avatarButton, isSelected && styles.avatarButtonSelected]}
                  onPress={() => onChangeAvatar(option)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.avatarText}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.btn, !trimmedName && styles.btnDisabled]}
        onPress={trimmedName ? onNext : undefined}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>Continue</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
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
  header: {
    gap: 12,
  },
  headline: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 38,
  },
  body: {
    fontSize: 15,
    color: palette.white55,
    lineHeight: 22,
    maxWidth: 320,
  },
  card: {
    gap: 16,
    padding: 20,
    borderRadius: 24,
    backgroundColor: palette.white06,
    borderWidth: 1,
    borderColor: palette.white10,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: palette.white55,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.white12,
    backgroundColor: palette.white08,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: palette.white,
    fontSize: 17,
    fontWeight: "600",
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  avatarButton: {
    width: 62,
    height: 62,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.white08,
    borderWidth: 1.5,
    borderColor: palette.white10,
  },
  avatarButtonSelected: {
    backgroundColor: palette.orange12,
    borderColor: palette.orange,
  },
  avatarText: {
    fontSize: 28,
  },
  btn: {
    backgroundColor: palette.orange,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
