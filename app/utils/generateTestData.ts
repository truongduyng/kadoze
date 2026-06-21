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
      createdAt: atToday(8, 10),
    },
    {
      date: dateKey(0),
      title: "Record 25 minutes of uninterrupted focus",
      done: true,
      sortOrder: 1,
      createdAt: atToday(8, 15),
    },
    {
      date: dateKey(0),
      title: "Review launch checklist with a fresh pass",
      done: false,
      sortOrder: 2,
      createdAt: atToday(8, 20),
    },
    {
      date: dateKey(0),
      title: "Plan tomorrow before 9 PM",
      done: false,
      sortOrder: 3,
      createdAt: atToday(8, 25),
    },
  ]);
};

export const insertAllScreenshotData = async () => {
  await resetDatabase();

  await db.insert(profiles).values({
    name: "Maya",
    avatar: "game:star-bard",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    onboardingCompleted: true,
    createdAt: daysAgo(34),
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
        createdAt: daysAgo(30),
      },
      {
        title: "Deep work block",
        subtitle: "25 focused min",
        icon: "timer-outline",
        daysOfWeek: EVERY_DAY,
        sortOrder: 1,
        createdAt: daysAgo(28),
      },
      {
        title: "5-min journaling",
        subtitle: "One honest note",
        icon: "journal-outline",
        daysOfWeek: EVERY_DAY,
        sortOrder: 2,
        createdAt: daysAgo(24),
      },
      {
        title: "Evening reset",
        subtitle: "Close the loops",
        icon: "moon-outline",
        daysOfWeek: EVERY_DAY,
        sortOrder: 3,
        createdAt: daysAgo(18),
      },
    ])
    .returning();

  const completionRows: (typeof habitCompletions.$inferInsert)[] = [];
  for (let offset = 27; offset >= 0; offset -= 1) {
    insertedHabits.forEach((habit, habitIndex) => {
      const skipped =
        (habitIndex === 1 && [19, 12].includes(offset)) ||
        (habitIndex === 2 && [22, 9, 3].includes(offset)) ||
        (habitIndex === 3 && [25, 16, 8].includes(offset));

      completionRows.push({
        habitId: habit.id,
        date: dateKey(offset),
        status: skipped ? "skipped" : "done",
        createdAt: daysAgo(offset),
      });
    });
  }
  await db.insert(habitCompletions).values(completionRows);

  const focusRows = Array.from({ length: 14 }, (_, index) => {
    const offset = 13 - index;
    const minutes = [18, 24, 30, 22, 36, 42, 28, 35, 45, 40, 48, 52, 44, 38][
      index
    ];
    return {
      date: dateKey(offset),
      goal:
        offset === 0
          ? "Finish the launch review and capture clean App Store screenshots"
          : "Protect one meaningful deep work block",
      focusMinutes: minutes,
      completedAt: offset === 0 ? null : daysAgo(offset),
      createdAt: daysAgo(offset),
      updatedAt: daysAgo(offset),
    };
  });
  await db.insert(dailyFocus).values(focusRows);

  await insertSampleTodos();
};
