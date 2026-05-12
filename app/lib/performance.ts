import {
  startOfWeek,
  addWeeks,
  addDays,
  isAfter,
  startOfDay,
  startOfYear,
  endOfYear,
} from "date-fns";
import { getLocalDateString, getStartOfDay } from "./timezone";
import {
  GRID_CONSTANTS,
  COLOR_THRESHOLDS,
  MONTHS,
} from "@/constants/performance";

// Types
export interface HeatmapDay {
  date: Date;
  count: number;
  isCurrentYear: boolean;
  isPastOrToday: boolean;
}

export interface MonthLabel {
  label: string;
  weekIndex: number;
}

export interface ColorConfig {
  backgroundColor: string;
  borderColor?: string;
  borderWidth?: number;
}

// Utility Functions
export function getDateKey(date: Date): string {
  return getLocalDateString(date);
}

export function getColorForCount(
  count: number,
  isPastOrToday: boolean,
): ColorConfig {
  if (!isPastOrToday) {
    return {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderColor: "rgba(255, 255, 255, 0.2)",
      borderWidth: 1,
    };
  }

  if (count === COLOR_THRESHOLDS.NONE) {
    return {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderColor: "rgba(255, 255, 255, 0.1)",
      borderWidth: 1,
    };
  }
  if (count <= COLOR_THRESHOLDS.LOW) return { backgroundColor: "#fed7aa" };
  if (count <= COLOR_THRESHOLDS.MEDIUM) return { backgroundColor: "#fb923c" };
  if (count <= COLOR_THRESHOLDS.HIGH) return { backgroundColor: "#ea580c" };
  return { backgroundColor: "#c2410c" };
}

export function generateMonthLabels(weeks: HeatmapDay[][]): MonthLabel[] {
  const monthLabels: MonthLabel[] = [];
  let lastMonth = -1;
  let lastYear = -1;

  weeks.forEach((week, weekIndex) => {
    // Use the first day that's within the grid (isCurrentYear) for label placement
    const firstInGridDay = week.find((d) => d.isCurrentYear);
    if (!firstInGridDay) return;
    const currentMonth = firstInGridDay.date.getMonth();
    const currentYear = firstInGridDay.date.getFullYear();

    if (currentMonth !== lastMonth || currentYear !== lastYear) {
      const includeYear =
        currentYear !== lastYear && (lastYear !== -1 || currentMonth === 0);
      const label = includeYear
        ? `${MONTHS[currentMonth]} ${currentYear.toString().slice(-2)}`
        : MONTHS[currentMonth];

      monthLabels.push({ label, weekIndex });
      lastMonth = currentMonth;
      lastYear = currentYear;
    }
  });

  return monthLabels;
}

function createWeekDays(
  weekStart: Date,
  gridStart: Date,
  gridEnd: Date,
): HeatmapDay[] {
  const today = new Date();
  const weekDays: HeatmapDay[] = [];

  for (let day = 0; day < 7; day++) {
    const dateForDay = addDays(weekStart, day);
    weekDays.push({
      date: dateForDay,
      count: 0,
      isCurrentYear: dateForDay >= gridStart && dateForDay <= gridEnd,
      isPastOrToday: !isAfter(dateForDay, today),
    });
  }

  return weekDays;
}

export function generateUserGrid(_userCreationDate: Date): HeatmapDay[][] {
  const now = new Date();
  const gridStart = startOfYear(now);
  const gridEnd = endOfYear(now);
  const weekGridStart = startOfWeek(gridStart, {
    weekStartsOn: GRID_CONSTANTS.WEEK_START_DAY,
  });

  const weeks: HeatmapDay[][] = [];
  let currentWeekStart = weekGridStart;

  while (
    currentWeekStart <= gridEnd ||
    weeks.length < GRID_CONSTANTS.MIN_WEEKS
  ) {
    weeks.push(createWeekDays(currentWeekStart, gridStart, gridEnd));
    currentWeekStart = addWeeks(currentWeekStart, 1);

    if (
      currentWeekStart > addWeeks(gridEnd, GRID_CONSTANTS.SAFETY_BUFFER_WEEKS)
    )
      break;
  }

  return weeks;
}




// Accepts todo_completions rows — counts only 'done' records per date
export function countTodosByDate(completions: { completedDate: string; status?: string | null }[]): Record<string, number> {
  const todoCounts: Record<string, number> = {};

  completions.forEach((c) => {
    if (c.status && c.status !== 'done') return;
    const key = c.completedDate;
    todoCounts[key] = (todoCounts[key] || 0) + 1;
  });

  return todoCounts;
}

export function applyTodoCountsToGrid(
  grid: HeatmapDay[][],
  todoCounts: Record<string, number>,
): HeatmapDay[][] {
  return grid.map((week) =>
    week.map((day) => ({
      ...day,
      count: todoCounts[getDateKey(day.date)] || 0,
    })),
  );
}

export interface GoalProgress {
  goalId: number;
  completed: number;
  totalScheduled: number;
  rate: number; // 0–1
}

export const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function computeGoalProgress(
  goalIds: number[],
  goalCreatedAts: Map<number, Date>,
  goalTargetDates: Map<number, Date | null>,
  allTodos: { id: number; goalId: number | null; daysOfWeek: string[]; createdAt: Date }[],
  allCompletions: { todoId: number; completedDate: string; status: string }[],
  today: Date = new Date(),
): GoalProgress[] {
  // Build a set of "todoId|completedDate" for done completions
  const completionSet = new Set<string>();
  for (const c of allCompletions) {
    if (c.status === 'done') {
      completionSet.add(`${c.todoId}|${c.completedDate}`);
    }
  }

  const todayStart = getStartOfDay(today);

  // Pre-index todos by goalId and precompute daysOfWeek Sets
  const todosByGoal = new Map<number, { id: number; daysSet: Set<string>; createdKey: string }[]>();
  for (const t of allTodos) {
    if (t.goalId === null) continue;
    if (!todosByGoal.has(t.goalId)) todosByGoal.set(t.goalId, []);
    todosByGoal.get(t.goalId)!.push({
      id: t.id,
      daysSet: new Set(t.daysOfWeek),
      createdKey: getLocalDateString(t.createdAt),
    });
  }

  return goalIds.map((goalId) => {
    const startDate = goalCreatedAts.get(goalId) ?? today;
    const targetDate = goalTargetDates.get(goalId) ?? null;
    const goalTodos = todosByGoal.get(goalId) ?? [];

    let completed = 0;
    let totalScheduled = 0;

    // totalScheduled = all occurrences from start to targetDate (or today if no deadline)
    // completed = occurrences actually done up to today
    const scheduleEnd = targetDate ? getStartOfDay(targetDate) : todayStart;

    const cursor = getStartOfDay(startDate);

    while (cursor <= scheduleEnd) {
      const dateKey = getLocalDateString(cursor);
      const dayName = DAY_NAMES[cursor.getDay()];
      const isFuture = cursor > todayStart;

      for (const todo of goalTodos) {
        // Skip if this todo didn't exist yet on this date
        if (todo.createdKey > dateKey) continue;
        if (todo.daysSet.has(dayName)) {
          totalScheduled++;
          // Only count completions for past/today dates
          if (!isFuture && completionSet.has(`${todo.id}|${dateKey}`)) {
            completed++;
          }
        }
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    return {
      goalId,
      completed,
      totalScheduled,
      rate: totalScheduled > 0 ? completed / totalScheduled : 0,
    };
  });
}

// ── Bounce-back Rate ─────────────────────────────────────────────────────────
// After a 'failed' day, how quickly does the user return to 'done'?
// Returns rate (0–1) and last recovery days.

export interface BouncebackResult {
  rate: number;             // % of recovery events where user bounced back within 3 days (0–1)
  lastRecoveryDays: number; // days it took to recover after the most recent gap (-1 if no gap)
  totalFalls: number;       // total number of "fall" events (days with only failed records)
  totalRecovered: number;   // how many falls led to a comeback within 3 days
}

export function computeBouncebackRate(
  completions: { completedDate: string; status: string }[],
): BouncebackResult {
  if (completions.length === 0) {
    return { rate: 1, lastRecoveryDays: -1, totalFalls: 0, totalRecovered: 0 };
  }

  // Group by date: determine if a date is 'done' (at least one done) or 'failed-only'
  const doneSet = new Set<string>();
  const failedOnlySet = new Set<string>();
  const allDatesSet = new Set<string>();

  for (const c of completions) {
    allDatesSet.add(c.completedDate);
    if (c.status === 'done') doneSet.add(c.completedDate);
  }
  for (const date of allDatesSet) {
    if (!doneSet.has(date)) failedOnlySet.add(date);
  }

  // Sort all unique dates that have any record
  const allDates = Array.from(allDatesSet).sort();
  if (allDates.length === 0) {
    return { rate: 1, lastRecoveryDays: -1, totalFalls: 0, totalRecovered: 0 };
  }

  let totalFalls = 0;
  let totalRecovered = 0;
  let lastRecoveryDays = -1;

  // Find gaps: consecutive dates where user had failed records but no done records
  // then measure how long until the next done date
  for (let i = 0; i < allDates.length; i++) {
    const date = allDates[i];
    if (!doneSet.has(date) && failedOnlySet.has(date)) {
      // This is a fall day — find next done date
      totalFalls++;
      let recoveryDays = -1;
      for (let j = i + 1; j < allDates.length && j <= i + 5; j++) {
        if (doneSet.has(allDates[j])) {
          const fallDate = new Date(date + 'T00:00:00');
          const comebackDate = new Date(allDates[j] + 'T00:00:00');
          const diffMs = comebackDate.getTime() - fallDate.getTime();
          recoveryDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
          break;
        }
      }
      if (recoveryDays >= 1 && recoveryDays <= 3) {
        totalRecovered++;
        lastRecoveryDays = recoveryDays;
      }
    }
  }

  const rate = totalFalls === 0 ? 1 : totalRecovered / totalFalls;
  return { rate, lastRecoveryDays, totalFalls, totalRecovered };
}

// ── Shared week boundary helper ───────────────────────────────────────────────
// Returns { weekStart, weekEnd, label } for a given week index (0 = current week).

function getWeekBounds(today: Date, weeksBack: number): { weekStart: Date; weekEnd: Date; label: string } {
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1 - weeksBack * 7);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { weekStart, weekEnd, label };
}

// ── Weekly Completion Rates ───────────────────────────────────────────────────





// ── Effect Size Compounder ────────────────────────────────────────────────────
// Visualize 1.01^N compound growth where N = active days

export interface CompoundPoint {
  x: number; // day index (0–N)
  y: number; // 1.01^x
}

const EFFECT_CURVE_HORIZON = 365;

export function computeEffectSizeCurve(
  activeDays: number,
  points: number = 120,
): CompoundPoint[] {
  const N = Math.max(activeDays, EFFECT_CURVE_HORIZON);
  const result: CompoundPoint[] = [];
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * N;
    result.push({ x, y: Math.pow(1.01, x) });
  }
  return result;
}



// ── Adaptability Score ────────────────────────────────────────────────────────
// Count of weeks where user tweaked their plan (intentTag = 'tweak_goal')



export function computeStreaks(todoCounts: Record<string, number>): {
  currentStreak: number;
  bestStreak: number;
} {
  const today = new Date();
  const todayKey = getLocalDateString(today);

  // Current streak: walk backward from today
  let currentStreak = 0;
  const cursor = new Date(today);
  while (true) {
    const key = getLocalDateString(cursor);
    if (todoCounts[key] > 0) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      // If today has no data yet, don't break the streak — check yesterday
      if (key === todayKey && currentStreak === 0) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }
  }

  // Best streak: iterate all dates with done records in sorted order
  const doneDates = Object.keys(todoCounts)
    .filter((k) => todoCounts[k] > 0)
    .sort();

  let bestStreak = currentStreak;
  let runLength = 0;
  let prevDate: string | null = null;

  for (const dateKey of doneDates) {
    if (prevDate === null) {
      runLength = 1;
    } else {
      // Check if consecutive day
      const prev = new Date(prevDate + 'T00:00:00');
      prev.setDate(prev.getDate() + 1);
      const expectedNext = getLocalDateString(prev);
      runLength = expectedNext === dateKey ? runLength + 1 : 1;
    }
    if (runLength > bestStreak) bestStreak = runLength;
    prevDate = dateKey;
  }

  return { currentStreak, bestStreak };
}
