import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useTheme } from "@/hooks/useTheme";
import Animated, {
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  onEdit?: () => void;
  onSwipeStart?: () => void;
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onDelete,
  onEdit,
  onSwipeStart,
}) => {
  const C = useTheme();
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const gesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Only activate when horizontal movement is significant
    .failOffsetY([-10, 10]) // Fail gesture if vertical movement is significant
    .onStart(() => {
      if (onSwipeStart) {
        runOnJS(onSwipeStart)();
      }
    })
    .onUpdate((event) => {
      // Only allow left swipe (negative values)
      translateX.value = Math.min(0, event.translationX);
    })
    .onEnd((event) => {
      const openOffset = onEdit ? -144 : -76;
      const shouldShowButton = event.translationX < -50; // Threshold to show button

      if (shouldShowButton) {
        translateX.value = withSpring(openOffset);
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
    transform: [{ translateX: Math.max(-68, translateX.value + (onEdit ? 144 : 76)) }],
  }));

  const editButtonStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -90 ? 1 : 0,
    transform: [{ translateX: Math.max(-136, translateX.value + 144) }],
  }));

  const handleDeletePress = () => {
    // Delete immediately without animation
    onDelete();
  };

  return (
    <View style={styles.swipeableContainer}>
      {onEdit ? (
        <Animated.View style={[styles.editButton, editButtonStyle]}>
          <TouchableOpacity
            style={styles.editButtonTouchable}
            onPress={onEdit}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Edit"
          >
            <View style={[styles.actionIcon, { backgroundColor: C.cardBg }]}>
              <Ionicons name="pencil" size={18} color={C.iconPrimary} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      ) : null}
      <Animated.View style={[styles.deleteButton, deleteButtonStyle]}>
        <TouchableOpacity
          style={styles.deleteButtonTouchable}
          onPress={handleDeletePress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Delete"
        >
          <View style={styles.deleteIcon}>
            <Ionicons name="trash-outline" size={19} color="#FFFFFF" />
          </View>
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
  editButton: {
    position: "absolute",
    right: 76,
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
  editButtonTouchable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderCurve: "continuous",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderCurve: "continuous",
    backgroundColor: "#E5484D",
    justifyContent: "center",
    alignItems: "center",
  },
});
