import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const ACTION_LABELS: Record<string, string> = {
  complete: "Mark as completed",
  archive: "Archive",
  delete: "Delete",
};

const CONFIRMED_LABELS: Record<string, string> = {
  complete: "Marked as completed.",
  archive: "Archived.",
  delete: "Deleted.",
};

interface GoalActionCardProps {
  item: {
    id: string;
    type: "confirm-goal-action";
    payload: {
      action: "complete" | "archive" | "delete";
      goalId: number;
      goalTitle: string;
    };
    timestamp: number;
    confirmed?: boolean;
  };
  onConfirm: (id: string, payload: any, type: "confirm-goal-action") => void;
  onCancel: (id: string) => void;
}

export default function GoalActionCard({ item, onConfirm, onCancel }: GoalActionCardProps) {
  const { action, goalTitle } = item.payload;
  const isConfirmed = item.confirmed === true;
  const isPending = item.confirmed === undefined;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{ACTION_LABELS[action]}: <Text style={styles.goalTitle}>{goalTitle}</Text></Text>
      {isPending ? (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.buttonSecondary} onPress={() => onCancel(item.id)}>
            <Text style={styles.buttonSecondaryText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonPrimary} onPress={() => onConfirm(item.id, item.payload, item.type)}>
            <Text style={styles.buttonPrimaryText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={isConfirmed ? styles.savedLabel : styles.cancelledLabel}>
          {isConfirmed ? (CONFIRMED_LABELS[action] ?? "Done.") : "Cancelled."}
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
  goalTitle: {
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "600",
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
