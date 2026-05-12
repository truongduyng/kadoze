import React, { useEffect, useRef } from "react";
import { Animated as RNAnimated, StyleSheet, View } from "react-native";

const WaveformAnimation = React.memo(() => {
  const barCount = 40;
  const animatedValues = useRef(
    Array.from({ length: barCount }, () => new RNAnimated.Value(0.1))
  ).current;

  useEffect(() => {
    const animations = animatedValues.map((value, index) => {
      const delay = (barCount - 1 - index) * 80; // Progressive delay for right-to-left effect

      return RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.delay(delay),
          RNAnimated.timing(value, {
            toValue: Math.random() * 0.8 + 0.2, // Random heights for variety
            duration: 400 + Math.random() * 300,
            useNativeDriver: false,
          }),
          RNAnimated.timing(value, {
            toValue: 0.1,
            duration: 400 + Math.random() * 300,
            useNativeDriver: false,
          }),
        ])
      );
    });

    animations.forEach((animation, index) => {
      setTimeout(() => animation.start(), (barCount - 1 - index) * 20); // Staggered start from right
    });

    return () => animations.forEach(animation => animation.stop());
  }, [animatedValues]);

  return (
    <View style={styles.waveformContainer}>
      {animatedValues.map((value, index) => (
        <RNAnimated.View
          key={index}
          style={[
            styles.waveformBar,
            {
              height: value.interpolate({
                inputRange: [0.1, 1],
                outputRange: [2, 16],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
});

WaveformAnimation.displayName = "WaveformAnimation";

const styles = StyleSheet.create({
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
    flex: 1,
    paddingHorizontal: 16,
  },
  waveformBar: {
    width: 2,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 1,
  },
});

export default WaveformAnimation;