import React, { useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
} from "react-native";

interface GoalStepProps {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}

const ORANGE = "#FB923C";
const MAX = 80;

export default function GoalStep({ value, onChange, onNext }: GoalStepProps) {
  const inputRef = useRef<TextInput>(null);

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding" keyboardVerticalOffset={0}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <View style={styles.iconRing}>
            <View style={styles.iconDot} />
          </View>
        </View>

        <Text style={styles.question}>
          What is the single most{"\n"}important thing you need{"\n"}to accomplish today?
        </Text>
        <Text style={styles.subtitle}>Ignore the noise. Just pick one.</Text>

        <TouchableOpacity
          style={styles.inputWrap}
          onPress={() => inputRef.current?.focus()}
          activeOpacity={1}
        >
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={value}
            onChangeText={(t) => onChange(t.slice(0, MAX))}
            placeholder="e.g. Finish investor pitch deck"
            placeholderTextColor="rgba(255,255,255,0.25)"
            multiline
            maxLength={MAX}
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={() => value.trim() && onNext()}
          />
          <Text style={styles.counter}>{value.length}/{MAX}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, !value.trim() && styles.btnDisabled]}
          onPress={value.trim() ? onNext : undefined}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Next</Text>
        </TouchableOpacity>
      </View>
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
    gap: 16,
  },
  iconWrap: {
    alignItems: "center",
    marginBottom: 8,
  },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  iconDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ORANGE,
  },
  question: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 34,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    marginBottom: 8,
  },
  inputWrap: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    padding: 16,
    minHeight: 100,
  },
  input: {
    fontSize: 15,
    color: "#fff",
    lineHeight: 22,
    flex: 1,
  },
  counter: {
    alignSelf: "flex-end",
    fontSize: 11,
    color: "rgba(255,255,255,0.25)",
    marginTop: 8,
  },
  footer: {},
  btn: {
    backgroundColor: ORANGE,
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
