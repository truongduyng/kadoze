import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

type Props = {
  size?: number;
  color?: string;
  gap?: number;
};

export default function ThreeDotsLoader({
  size = 7,
  color = "rgba(255, 255, 255, 0.6)",
  gap = 5,
}: Props) {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      )
    );

    const stagger = Animated.stagger(200, animations);
    stagger.start();

    return () => {
      stagger.stop();
      animations.forEach((a) => a.stop());
    };
  }, []);

  const dotStyle = (dot: Animated.Value) => ({
    opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
  });

  return (
    <View style={[styles.container, { gap }]}>
      {dots.map((dot, i) => (
        <Animated.View key={i} style={dotStyle(dot)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
});
