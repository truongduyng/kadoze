import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onDelete,
}) => {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const gesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Only activate when horizontal movement is significant
    .failOffsetY([-10, 10]) // Fail gesture if vertical movement is significant
    .onUpdate((event) => {
      // Only allow left swipe (negative values)
      translateX.value = Math.min(0, event.translationX);
    })
    .onEnd((event) => {
      const shouldShowButton = event.translationX < -50; // Threshold to show button

      if (shouldShowButton) {
        // Show delete button by staying at -76px (60px button + 8px spacing + 8px gap)
        translateX.value = withSpring(-76);
      } else {
        // Snap back
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  const deleteButtonStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -40 ? 1 : 0,
    transform: [{ translateX: Math.max(-68, translateX.value + 76) }],
  }));

  const handleDeletePress = () => {
    // Delete immediately without animation
    onDelete();
  };

  return (
    <View style={styles.swipeableContainer}>
      <Animated.View style={[styles.deleteButton, deleteButtonStyle]}>
        <TouchableOpacity
          style={styles.deleteButtonTouchable}
          onPress={handleDeletePress}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={24} color="#ff4444" />
        </TouchableOpacity>
      </Animated.View>
      <GestureDetector gesture={gesture}>
        <Animated.View style={animatedStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  swipeableContainer: {
    position: "relative",
    overflow: "hidden",
  },
  deleteButton: {
    position: "absolute",
    right: 8,
    top: 0,
    bottom: 0,
    width: 60,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginBottom: 8,
  },
  deleteButtonTouchable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
