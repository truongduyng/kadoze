import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Confetti } from "./Confetti";

// ─── Sheet ────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  todoTitle: string;
  iterationNumber: number;
  onClose: () => void;
  onSubmit: (message: string) => void;
}

export function CompletionReflectionSheet({
  visible,
  todoTitle,
  iterationNumber,
  onClose,
  onSubmit,
}: Props) {
  const [note, setNote] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      const delay = Platform.OS === "android" ? 300 : 100;
      const showTimer = setTimeout(() => setShowConfetti(true), delay);
      const hideTimer = setTimeout(() => setShowConfetti(false), delay + 3000);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [visible]);

  const handleSubmit = () => {
    const message = note.trim()
      ? `Just completed: ${todoTitle}. ${note.trim()}`
      : `Just completed: ${todoTitle}.`;
    onSubmit(message);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={StyleSheet.absoluteFill}>
        <KeyboardAvoidingView style={styles.overlay} behavior="padding">
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <SafeAreaView style={[styles.sheet]}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={styles.titleRow}>
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={22}
                  color={Colors.light.tint}
                />
                <Text style={styles.todoName}>{todoTitle}</Text>
                <View style={styles.iterationBadge}>
                  <Ionicons name="speedometer" size={13} color="#fb923c" />
                  <Text style={styles.iterationText}>
                    {iterationNumber.toLocaleString()}
                    <Text style={styles.iterationTarget}>/10k</Text>
                  </Text>
                </View>
              </View>
            </View>

            <TextInput
              ref={inputRef}
              cursorColor="#F5A623"
              style={styles.input}
              placeholder="How did it go? Any reflections…"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={400}
              autoFocus={false}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.submitText}>Log it</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </KeyboardAvoidingView>
        {showConfetti && <Confetti visible={showConfetti} />}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: "#1c1c1e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  todoName: {
    fontSize: 20,
    color: "#ffffff",
    flex: 1,
  },
  iterationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(251,146,60,0.12)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(251,146,60,0.3)",
    overflow: "hidden",
  },
  iterationText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fb923c",
  },
  iterationTarget: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(251,146,60,0.5)",
  },
  iterationNumberSlot: {
    overflow: "hidden",
    justifyContent: "center",
  },
  iterationAbsolute: {
    position: "absolute",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: 14,
    color: "#ffffff",
    fontSize: 15,
    minHeight: 90,
    textAlignVertical: "top",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
  },
  submitText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
