import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/theme";
import AdaptiveBlurView from "@/components/ui/AdaptiveBlurView";

interface Todo {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  goalId?: number | null;
}

interface GoalInfo {
  id: number;
  title: string;
  outcomeGoal?: string | null;
  status: string; // 'active' | 'completed' | 'archived'
}

interface ScheduleDayProps {
  todos: Todo[];
  isPast?: boolean;
  isFuture?: boolean;
  onToggleCompletion: (todoId: string, isCurrentlyCompleted: boolean) => void;
  goalsMap?: Record<number, GoalInfo>;
}

interface TodoGroup {
  goalId: number | null;
  todos: Todo[];
}

function groupTodos(todos: Todo[]): TodoGroup[] {
  const groupMap = new Map<number | "other", TodoGroup>();

  for (const todo of todos) {
    const key = todo.goalId ?? "other";
    if (!groupMap.has(key)) {
      groupMap.set(key, { goalId: todo.goalId ?? null, todos: [] });
    }
    groupMap.get(key)!.todos.push(todo);
  }

  // Goal groups first, then ungrouped "other"
  return Array.from(groupMap.values()).sort((a, b) => {
    if (a.goalId === null && b.goalId !== null) return 1;
    if (a.goalId !== null && b.goalId === null) return -1;
    return 0;
  });
}

export const ScheduleDay: React.FC<ScheduleDayProps> = ({
  todos,
  isPast = false,
  isFuture = false,
  onToggleCompletion,
  goalsMap = {},
}) => {
  if (todos.length === 0) {
    return (
      <View style={styles.scheduleDay}>
        <View style={styles.noTodosContainer}>
          <Text style={styles.noTodosText}>No planning yet</Text>
          {!isPast && (
            <Text style={styles.noTodosHint}>
              💡 Talk to your smart notebook to turn your ideas into a plan
            </Text>
          )}
        </View>
      </View>
    );
  }

  const groups = groupTodos(todos);

  return (
    <View style={styles.scheduleDay}>
      {groups.map((group, groupIndex) => {
        const isGoalGroup = group.goalId !== null;

        return (
          <View
            key={group.goalId ?? "other"}
            style={[
              styles.group,
              ...(groupIndex > 0 ? [styles.groupSpacing] : []),
              ...(isGoalGroup ? [styles.goalGroup] : []),
            ]}
          >
            <View style={isGoalGroup ? styles.groupTodos : styles.ungroupedTodos}>
            {group.todos.map((todo) => {
              const checkboxColor = Colors.light.tint;
              const isFailed = isPast && !todo.isCompleted;

              return (
                <AdaptiveBlurView key={todo.id} style={styles.todoItem}>
                  <Pressable
                    style={styles.checkboxContainer}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    onPress={() => {
                      if (isFuture || isFailed) return;
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onToggleCompletion(todo.id, !!todo.isCompleted);
                    }}
                    disabled={isFuture || isFailed}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        todo.isCompleted && [
                          styles.checkboxCompleted,
                          { backgroundColor: checkboxColor, borderColor: checkboxColor },
                        ],
                        isFailed && styles.checkboxFailed,
                      ]}
                    >
                      {todo.isCompleted && <Text style={styles.checkboxText}>✓</Text>}
                      {isFailed && <Text style={styles.checkboxText}>✗</Text>}
                    </View>
                  </Pressable>

                  <View style={styles.todoMainContent}>
                    <Text
                      style={[
                        styles.todoTitle,
                        (todo.isCompleted || isFailed) && styles.completedTodo,
                      ]}
                    >
                      {todo.title}
                    </Text>
                    {todo.description && (
                      <Text
                        style={[
                          styles.todoLocation,
                          (todo.isCompleted || isFailed) && styles.completedTodo,
                        ]}
                      >
                        {todo.description}
                      </Text>
                    )}
                  </View>
                </AdaptiveBlurView>
              );
            })}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  scheduleDay: {
    marginBottom: 16,
  },
  group: {},
  groupSpacing: {
    marginTop: 12,
  },
  /** Subtle grouped card for goal-linked todos */
  goalGroup: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 6,
  },
  /** Container for todos inside a goal group — gap handles spacing */
  groupTodos: {
    gap: 6,
  },
  /** Container for ungrouped todos */
  ungroupedTodos: {
    gap: 8,
  },
  todoItem: {
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  noTodosContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  noTodosText: {
    fontSize: 16,
    color: "#888888",
    fontStyle: "italic",
    marginBottom: 8,
  },
  noTodosHint: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.5)",
    lineHeight: 18,
  },
  checkboxContainer: {
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxCompleted: {},
  checkboxFailed: {
    borderColor: "rgba(255, 100, 100, 0.5)",
    backgroundColor: "rgba(255, 100, 100, 0.1)",
  },
  checkboxText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  todoMainContent: { flex: 1 },
  todoTexts: { flex: 1 },
  todoTitle: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "600",
  },
  todoLocation: {
    fontSize: 14,
    color: "#e0e0e0",
    fontWeight: "400",
    marginTop: 2,
  },
  completedTodo: {
    color: "#aaa",
  },
});
