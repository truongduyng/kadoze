import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { BlurView } from "expo-blur";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface AdaptiveBlurViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glassEffectStyle?: "clear" | "regular";
  tintColor?: string;
  blurIntensity?: number;
  blurTint?: "light" | "dark" | "default";
}

const AdaptiveBlurView: React.FC<AdaptiveBlurViewProps> = ({
  children,
  style,
  glassEffectStyle = "clear",
  tintColor,
  blurIntensity = 20,
  blurTint,
}) => {
  const colorScheme = useColorScheme();
  const resolvedTint = blurTint ?? (colorScheme === "light" ? "light" : "dark");
  const resolvedTintColor = tintColor ?? (colorScheme === "light"
    ? "rgba(0, 0, 0, 0.01)"
    : "rgba(255, 255, 255, 0.01)");

  const useGlassView = isLiquidGlassAvailable();

  if (useGlassView) {
    return (
      <GlassView
        glassEffectStyle={glassEffectStyle}
        style={style}
        tintColor={resolvedTintColor}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <BlurView
      intensity={blurIntensity}
      style={style}
      tint={resolvedTint}
    >
      {children}
    </BlurView>
  );
};

export default AdaptiveBlurView;
