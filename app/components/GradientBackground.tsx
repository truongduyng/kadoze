import { View, StyleSheet } from "react-native";

export default function GradientBackground() {
  return <View style={[StyleSheet.absoluteFill, styles.bg]} />;
}

const styles = StyleSheet.create({
  bg: {
    backgroundColor: "#0D0D0D",
  },
});
