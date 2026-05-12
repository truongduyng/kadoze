import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface TimeCapsuleWriteProps {
  visible: boolean;
  durationDays: number;
  onSave: (letter: string) => void;
  onDismiss: () => void;
}

export default function TimeCapsuleWrite({
  visible,
  durationDays,
  onSave,
  onDismiss,
}: TimeCapsuleWriteProps) {
  const [letter, setLetter] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSave = () => {
    if (letter.trim()) {
      onSave(letter.trim());
      setLetter("");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="mail-outline" size={20} color="#fb923c" />
              <Text style={styles.title}>
                New {durationDays}-Day Letter
              </Text>
            </View>
            <Pressable onPress={onDismiss} hitSlop={12}>
              <Ionicons
                name="close"
                size={22}
                color="rgba(255,255,255,0.5)"
              />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            What do you want to tell yourself in {durationDays} days?
          </Text>

          <View
            style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}
          >
            <TextInput
              style={styles.input}
              value={letter}
              onChangeText={setLetter}
              placeholder="Dear future me..."
              placeholderTextColor="rgba(255, 255, 255, 0.18)"
              multiline
              textAlignVertical="top"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              maxLength={500}
              autoFocus
            />
            <Text style={styles.charCount}>{letter.length}/500</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && styles.saveBtnPressed,
              !letter.trim() && styles.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={!letter.trim()}
          >
            <Ionicons name="lock-closed-outline" size={18} color="#000" />
            <Text style={styles.saveBtnText}>Seal for {durationDays} Days</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#111111",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.45)",
    lineHeight: 20,
  },
  inputWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    minHeight: 140,
  },
  inputWrapperFocused: {
    borderColor: "rgba(251, 146, 60, 0.35)",
  },
  input: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 22,
    padding: 16,
    paddingBottom: 28,
    minHeight: 120,
  },
  charCount: {
    position: "absolute",
    bottom: 8,
    right: 12,
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.2)",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fb923c",
    borderRadius: 14,
    paddingVertical: 16,
  },
  saveBtnPressed: {
    opacity: 0.8,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
});
