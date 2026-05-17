import { useTheme } from "@/hooks/useTheme";
import { StyleSheet, View } from "react-native";

export default function GradientBackground() {
  const C = useTheme();
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: C.screenBg }]} />;
}
