import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const COLORS = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#C77DFF", "#FF9F1C"];
const PARTICLE_COUNT = 50;
const GRAVITY = 560;

interface Particle {
  progress: Animated.Value;
  color: string;
  size: number;
  launchX: number;
  velX: number;
  velY: number;
  rotateSpeed: number;
}

function useConfettiParticles(visible: boolean) {
  const particles = useRef<Particle[]>(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      progress: new Animated.Value(0),
      color: COLORS[i % COLORS.length],
      size: 7 + Math.random() * 7,
      launchX: 0.5,
      velX: (Math.random() - 0.5) * 260,
      velY: -(380 + Math.random() * 260),
      rotateSpeed: (Math.random() - 0.5) * 8,
    }))
  ).current;

  useEffect(() => {
    if (!visible) return;
    particles.forEach((p) => p.progress.setValue(0));
    const animations = particles.map((p, i) =>
      Animated.timing(p.progress, {
        toValue: 1,
        duration: 1400 + Math.random() * 600,
        delay: i * 18,
        useNativeDriver: true,
      })
    );
    Animated.stagger(12, animations).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return particles;
}

export function Confetti({ visible }: { visible: boolean }) {
  const particles = useConfettiParticles(visible);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => {
        const originX = p.launchX * SCREEN_W;
        const originY = SCREEN_H;
        const translateX = p.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [originX, originX + p.velX],
        });
        const translateY = p.progress.interpolate({
          inputRange: [0, 0.25, 0.5, 0.75, 1],
          outputRange: [
            originY,
            originY + p.velY * 0.25 + 0.5 * GRAVITY * 0.0625,
            originY + p.velY * 0.5 + 0.5 * GRAVITY * 0.25,
            originY + p.velY * 0.75 + 0.5 * GRAVITY * 0.5625,
            originY + p.velY * 1 + 0.5 * GRAVITY * 1,
          ],
        });
        const rotate = p.progress.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", `${p.rotateSpeed * 360}deg`],
        });
        const opacity = p.progress.interpolate({
          inputRange: [0, 0.6, 1],
          outputRange: [1, 1, 0],
        });
        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: p.size,
              height: p.size * 0.5,
              borderRadius: 2,
              backgroundColor: p.color,
              opacity,
              transform: [{ translateX }, { translateY }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}
