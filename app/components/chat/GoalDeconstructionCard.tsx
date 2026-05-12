import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatTargetDate } from "@/lib/timezone";
import type { GoalDeconstructionData } from "@/types/goal";

interface GoalDeconstructionCardProps {
  item: {
    id: string;
    type: "confirm-goal";
    message: string;
    payload: {
      deconstructionData: GoalDeconstructionData;
      title: string;
      targetDate?: string;
      sourceMessageId?: number;
      goalId?: number;
      isRevision?: boolean;
      isReplaced?: boolean;
    };
    timestamp: number;
    confirmed?: boolean;
  };
  onConfirm: (id: string, payload: any, type: "confirm-todo" | "confirm-goal") => void;
  onCancel: (id: string) => void;
}

export default function GoalDeconstructionCard({
  item,
  onConfirm,
  onCancel,
}: GoalDeconstructionCardProps) {
  const { deconstructionData, targetDate, isRevision, isReplaced } = item.payload;
  const formattedDeadline = formatTargetDate(targetDate ?? null);
  const isConfirmed = item.confirmed === true;
  const isPending = item.confirmed === undefined;

  return (
    <View style={styles.container}>
      {/* Revision badge */}
      {isRevision && (
        <Text style={styles.revisionBadge}>REVISED PLAN</Text>
      )}
      {/* Outcome Goal */}
      <View style={styles.section}>
        <Text style={styles.tierLabel}>OUTCOME GOAL</Text>
        <Text style={styles.outcomeText}>{deconstructionData.outcome_goal}</Text>
        {formattedDeadline ? (
          <Text style={styles.deadline}>by {formattedDeadline}</Text>
        ) : null}
      </View>

      {/* Performance Goals */}
      <View style={styles.section}>
        <Text style={styles.tierLabel}>PERFORMANCE GOALS</Text>
        {deconstructionData.performance_goals.map((pg, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{pg}</Text>
          </View>
        ))}
      </View>

      {/* Process Goals */}
      {deconstructionData.process_goals?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.tierLabel}>YOUR DAILY PLAN</Text>
          {deconstructionData.process_goals.map((pg, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{pg.title}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Encouragement */}
      <Text style={styles.encouragement}>{deconstructionData.encouragement}</Text>

      {/* Action buttons or result state */}
      {isPending ? (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={() => onCancel(item.id)}
          >
            <Text style={styles.buttonSecondaryText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={() => onConfirm(item.id, item.payload, item.type)}
          >
            <Text style={styles.buttonPrimaryText}>Commit to this</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={isConfirmed ? styles.savedLabel : styles.cancelledLabel}>
          {isConfirmed ? "Committed. Now execute." : isReplaced ? "Plan updated." : "Maybe next time."}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: 44,
    paddingRight: 8,
    gap: 12,
  },
  section: {
    gap: 4,
  },
  tierLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.4)",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  outcomeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 22,
  },
  deadline: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.45)",
    marginTop: 2,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 6,
  },
  bullet: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 13,
    lineHeight: 20,
  },
  bulletText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  encouragement: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.45)",
    fontStyle: "italic",
    lineHeight: 17,
  },
  buttonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
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
  revisionBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255, 200, 100, 0.7)",
    letterSpacing: 0.8,
  },
});
