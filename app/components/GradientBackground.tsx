import { useTheme } from "@/hooks/useTheme";
import { Image, StyleSheet, View } from "react-native";

interface GradientBackgroundProps {
  variant?: "default" | "onboarding";
}

export default function GradientBackground({ variant = "default" }: GradientBackgroundProps) {
  const C = useTheme();
  const isOnboarding = variant === "onboarding";

  if (!isOnboarding) {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: C.screenBg }]} />;
  }

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: C.screenBg }]} pointerEvents="none">
      <Image
        source={require("../assets/evening.jpeg")}
        style={styles.image}
        resizeMode="cover"
        blurRadius={18}
      />
      <View style={styles.scrim} />
      <View style={styles.warmWash} />
      <View style={styles.topBand} />
      <View style={styles.middleBand} />
      <View style={styles.bottomBand} />
      <View style={styles.vignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    ...StyleSheet.absoluteFill,
    opacity: 0.34,
    transform: [{ scale: 1.12 }],
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(5,5,5,0.58)",
  },
  warmWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(251,146,60,0.08)",
  },
  topBand: {
    position: "absolute",
    top: -120,
    left: -90,
    width: "145%",
    height: 260,
    backgroundColor: "rgba(251,146,60,0.18)",
    transform: [{ rotate: "-13deg" }],
  },
  middleBand: {
    position: "absolute",
    top: "34%",
    right: -180,
    width: "120%",
    height: 170,
    backgroundColor: "rgba(255,255,255,0.055)",
    transform: [{ rotate: "-18deg" }],
  },
  bottomBand: {
    position: "absolute",
    bottom: -150,
    left: -160,
    width: "150%",
    height: 280,
    backgroundColor: "rgba(251,146,60,0.12)",
    transform: [{ rotate: "11deg" }],
  },
  vignette: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.20)",
  },
});
