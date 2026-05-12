import React from "react";
import { ViewStyle } from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { BlurView } from "expo-blur";

interface AdaptiveBlurViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  glassEffectStyle?: "clear" | "regular";
  tintColor?: string;
  blurIntensity?: number;
  blurTint?: "light" | "dark" | "default";
}

const AdaptiveBlurView: React.FC<AdaptiveBlurViewProps> = ({
  children,
  style,
  glassEffectStyle = "clear",
  tintColor = "rgba(255, 255, 255, 0.01)",
  blurIntensity = 20,
  blurTint = "light",
}) => {
  const useGlassView = isLiquidGlassAvailable();

  if (useGlassView) {
    return (
      <GlassView
        glassEffectStyle={glassEffectStyle}
        style={style}
        tintColor={tintColor}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <BlurView
      intensity={blurIntensity}
      style={style}
      tint={blurTint}
    >
      {children}
    </BlurView>
  );
};

export default AdaptiveBlurView;
