import { useTheme } from "@/hooks/useTheme";
import { getLocalDateString } from "@/lib/timezone";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

const WEEKS = 12;
const CELL = 10;
const GAP = 3;

interface Props {
  habitId: number;
  daysOfWeek: string[]; // ['mon','tue',...]
  completions: { habitId: number; date: string; status: string }[];
  today: Date;
  bestStreak: number;
  totalDone: number;
}

const DOW_MAP: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

export function HabitHeatmap({ habitId, daysOfWeek, completions, today, bestStreak, totalDone }: Props) {
  const C = useTheme();

  const { grid, completionRate } = useMemo(() => {
    const scheduledDowSet = new Set(daysOfWeek.map((d) => DOW_MAP[d] ?? -1));
    const doneSet = new Set(
      completions
        .filter((c) => c.habitId === habitId && c.status === "done")
        .map((c) => c.date),
    );
    const skippedSet = new Set(
      completions
        .filter((c) => c.habitId === habitId && c.status === "skipped")
        .map((c) => c.date),
    );

    const totalDays = WEEKS * 7;
    // last cell = today, go back totalDays-1 days for first cell
    const firstDate = new Date(today);
    firstDate.setDate(firstDate.getDate() - (totalDays - 1));

    const columns: { date: string; dow: number; status: "done" | "skipped" | "missed" | "future" | "not_scheduled" }[][] = [];
    let scheduledCount = 0;
    let doneCount = 0;
    const todayStr = getLocalDateString(today);

    for (let week = 0; week < WEEKS; week++) {
      const col: typeof columns[number] = [];
      for (let dow = 0; dow < 7; dow++) {
        const d = new Date(firstDate);
        d.setDate(d.getDate() + week * 7 + dow);
        const dateStr = getLocalDateString(d);
        const isFuture = dateStr > todayStr;
        const isScheduled = scheduledDowSet.has(d.getDay());

        let status: typeof col[number]["status"];
        if (isFuture) {
          status = "future";
        } else if (!isScheduled) {
          status = "not_scheduled";
        } else if (doneSet.has(dateStr)) {
          status = "done";
          scheduledCount++;
          doneCount++;
        } else if (skippedSet.has(dateStr)) {
          status = "skipped";
          scheduledCount++;
        } else {
          status = "missed";
          scheduledCount++;
        }

        col.push({ date: dateStr, dow: d.getDay(), status });
      }
      columns.push(col);
    }

    const rate = scheduledCount > 0 ? Math.round((doneCount / scheduledCount) * 100) : 0;
    return { grid: columns, completionRate: rate };
  }, [habitId, daysOfWeek, completions, today]);

  const s = makeStyles(C);

  const cellColor = (status: string) => {
    if (status === "done") return C.accent;
    if (status === "skipped") return C.accentBorder;
    if (status === "missed") return C.inputBg;
    return "transparent"; // future or not_scheduled
  };

  const cellBorder = (status: string) => {
    if (status === "future" || status === "not_scheduled") return "transparent";
    return C.cardBorder;
  };

  return (
    <View style={s.wrap}>
      <View style={s.heatmap}>
        {grid.map((col, wi) => (
          <View key={wi} style={s.col}>
            {col.map((cell, di) => (
              <View
                key={di}
                style={[
                  s.cell,
                  {
                    backgroundColor: cellColor(cell.status),
                    borderColor: cellBorder(cell.status),
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={s.statValue}>{completionRate}%</Text>
          <Text style={s.statLabel}>Completion</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statValue}>{bestStreak}</Text>
          <Text style={s.statLabel}>Best streak</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statValue}>{totalDone}</Text>
          <Text style={s.statLabel}>Total done</Text>
        </View>
      </View>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof import("@/hooks/useTheme").useTheme>) {
  return StyleSheet.create({
    wrap: { marginTop: 14, gap: 10 },
    heatmap: {
      flexDirection: "row",
      gap: GAP,
    },
    col: { flexDirection: "column", gap: GAP },
    cell: {
      width: CELL,
      height: CELL,
      borderRadius: 2,
      borderWidth: 1,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: C.cardBorder,
    },
    statItem: { alignItems: "center", flex: 1 },
    statValue: {
      fontSize: 15,
      fontWeight: "700",
      color: C.accentText,
    },
    statLabel: {
      fontSize: 10,
      color: C.textTertiary,
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      height: 28,
      backgroundColor: C.cardBorder,
    },
  });
}
