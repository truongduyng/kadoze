import Constants from "expo-constants";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GradientBackground from "@/components/GradientBackground";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <View style={styles.container}>
      <GradientBackground />
      <Stack.Screen options={{ title: "Settings", headerShown: true }} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: 24, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.version}>Kado v{version}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  version: {
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
    textAlign: "center",
    marginTop: 32,
  },
});
