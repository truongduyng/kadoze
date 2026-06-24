import {
  db,
  dailyFocus,
  habitCompletions,
  habits,
  profiles,
  todos,
} from "@/lib/db";
import { resetDatabase } from "@/lib/db/init";
import { getLocalDateString } from "@/lib/timezone";

const EVERY_DAY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function daysAgo(count: number) {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  date.setDate(date.getDate() - count);
  return date;
}

function atToday(hour: number, minute = 0) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

function dateKey(count: number) {
  return getLocalDateString(daysAgo(count));
}

export const insertSampleTodos = async () => {
  await db.insert(todos).values([
    {
      date: dateKey(0),
      title: "Draft App Store screenshot captions",
      done: true,
      sortOrder: 0,
      createdAt: atToday(7, 40),
    },
    {
      date: dateKey(0),
      title: "Record 25 minutes of uninterrupted focus",
      done: true,
      sortOrder: 1,
      createdAt: atToday(7, 45),
    },
    {
      date: dateKey(0),
      title: "Review launch checklist with a fresh pass",
      done: true,
      sortOrder: 2,
      createdAt: atToday(7, 50),
    },
    {
      date: dateKey(0),
      title: "Plan tomorrow before 9 PM",
      done: false,
      sortOrder: 3,
      createdAt: atToday(7, 55),
    },
  ]);
};

export const insertAllScreenshotData = async () => {
  await resetDatabase();

  // Habits go back ~5 months so the year-to-date consistency grids
  // (profile screen, heatmap) read as an established, lived-in habit
  // practice rather than a sparse new account.
  const habitAgeDays = [148, 134, 119, 96];

  await db.insert(profiles).values({
    name: "Maya",
    avatar: "game:star-bard",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    onboardingCompleted: true,
    createdAt: daysAgo(habitAgeDays[0] + 4),
  });

  const insertedHabits = await db
    .insert(habits)
    .values([
      {
        title: "Morning sunlight",
        subtitle: "10 min outside",
        icon: "sunny-outline",
        daysOfWeek: EVERY_DAY,
        sortOrder: 0,
        createdAt: daysAgo(habitAgeDays[0]),
      },
      {
        title: "Deep work block",
        subtitle: "25 focused min",
        icon: "timer-outline",
        daysOfWeek: EVERY_DAY,
        sortOrder: 1,
        createdAt: daysAgo(habitAgeDays[1]),
      },
      {
        title: "5-min journaling",
        subtitle: "One honest note",
        icon: "journal-outline",
        daysOfWeek: EVERY_DAY,
        sortOrder: 2,
        createdAt: daysAgo(habitAgeDays[2]),
      },
      {
        title: "Evening reset",
        subtitle: "Close the loops",
        icon: "moon-outline",
        daysOfWeek: EVERY_DAY,
        sortOrder: 3,
        createdAt: daysAgo(habitAgeDays[3]),
      },
    ])
    .returning();

  // A small, sparse set of early skips (only in the first half of each
  // habit's life) keeps the long-range consistency grid from looking
  // perfectly uniform, while the last 3 weeks are a clean unbroken run
  // so "current streak" and "today" both look strong.
  const earlySkipOffsets = [
    new Set([91, 77, 63, 50]),
    new Set([88, 70, 55]),
    new Set([60, 41]),
    new Set([45]),
  ];

  const completionRows: (typeof habitCompletions.$inferInsert)[] = [];
  insertedHabits.forEach((habit, habitIndex) => {
    for (let offset = habitAgeDays[habitIndex]; offset >= 0; offset -= 1) {
      const skipped = offset > 21 && earlySkipOffsets[habitIndex].has(offset);

      completionRows.push({
        habitId: habit.id,
        date: dateKey(offset),
        status: skipped ? "skipped" : "done",
        createdAt: daysAgo(offset),
      });
    }
  });
  await db.insert(habitCompletions).values(completionRows);

  // Daily focus: a full month of history with a gentle upward trend,
  // landing on a strong, completed "today" goal.
  const focusGoals = [
    "Protect one meaningful deep work block",
    "Ship the thing before checking messages",
    "Single-task the hardest item first",
    "Close every open loop before evening",
  ];
  const focusRows = Array.from({ length: 30 }, (_, index) => {
    const offset = 29 - index;
    const base = 28 + index * 1.1;
    const wobble = [0, 6, -4, 9, -3, 5, 2][index % 7];
    const minutes = Math.max(15, Math.round(base + wobble));
    const goal =
      offset === 0
        ? "Finish the launch review and capture clean App Store screenshots"
        : focusGoals[index % focusGoals.length];

    return {
      date: dateKey(offset),
      goal,
      focusMinutes: minutes,
      completedAt: daysAgo(offset),
      createdAt: daysAgo(offset),
      updatedAt: daysAgo(offset),
    };
  });
  await db.insert(dailyFocus).values(focusRows);

  await insertSampleTodos();
};
