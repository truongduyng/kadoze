import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";

interface ConfirmationCardProps {
  item: {
    id: string;
    type: "confirm-todo" | "confirm-goal";
    message: string;
    payload: any;
    timestamp: number;
    confirmed?: boolean;
  };
  onConfirm: (id: string, payload: any, type: "confirm-todo" | "confirm-goal") => void;
  onCancel: (id: string) => void;
}

export default function ConfirmationCard({ item, onConfirm, onCancel }: ConfirmationCardProps) {
  const isConfirmed = item.confirmed === true;
  const isPending = item.confirmed === undefined;

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel(item.id);
  };

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm(item.id, item.payload, item.type);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{item.message}</Text>
      {isPending ? (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.buttonSecondary} onPress={handleCancel}>
            <Text style={styles.buttonSecondaryText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonPrimary} onPress={handleConfirm}>
            <Text style={styles.buttonPrimaryText}>Add it</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={isConfirmed ? styles.savedLabel : styles.cancelledLabel}>
          {isConfirmed ? "On the list. Get it done." : "Maybe next time."}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: 44,
    gap: 8,
  },
  label: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 13,
  },
  buttonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  buttonPrimary: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },
  buttonPrimaryText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonSecondary: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  buttonSecondaryText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "600",
  },
  savedLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.45)",
    fontStyle: "italic",
  },
  cancelledLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.3)",
    fontStyle: "italic",
  },
});
