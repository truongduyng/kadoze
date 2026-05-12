import { eq, desc, asc, and, count } from 'drizzle-orm';
import {
  db,
  profiles, notes, habits, habitCompletions, dailyFocus,
  type NewProfile, type NewNote, type NewHabit, type NewHabitCompletion, type NewDailyFocus,
} from './database';
import { getLocalDateString } from '../timezone';

// ── profileOps ────────────────────────────────────────────────────────────────
export const profileOps = {
  async create(data: NewProfile) {
    return await db.insert(profiles).values(data).returning();
  },
  async getFirst() {
    const result = await db.select().from(profiles).limit(1);
    return result[0] ?? null;
  },
  async update(id: number, data: Partial<NewProfile>) {
    return await db.update(profiles).set(data).where(eq(profiles.id, id)).returning();
  },
  async deleteAll() {
    return await db.delete(profiles);
  },
};

// ── noteOps ───────────────────────────────────────────────────────────────────
export const noteOps = {
  async create(data: NewNote) {
    return await db.insert(notes).values(data).returning();
  },
  async getAll() {
    return await db.select().from(notes).orderBy(asc(notes.createdAt));
  },
  async getFirst() {
    const result = await db.select().from(notes).limit(1);
    return result[0] ?? null;
  },
  async countByRole(role: string): Promise<number> {
    const result = await db.select({ count: count() }).from(notes).where(eq(notes.role, role));
    return result[0]?.count ?? 0;
  },
  async existsByContentAndRole(content: string, role: string): Promise<boolean> {
    const result = await db.select({ count: count() }).from(notes)
      .where(and(eq(notes.content, content), eq(notes.role, role))).limit(1);
    return (result[0]?.count ?? 0) > 0;
  },
  async update(id: number, data: Partial<NewNote>) {
    return await db.update(notes).set({ ...data, updatedAt: new Date() }).where(eq(notes.id, id)).returning();
  },
  async delete(id: number) {
    return await db.delete(notes).where(eq(notes.id, id));
  },
  async deleteAll() {
    return await db.delete(notes);
  },
};

// ── habitOps ──────────────────────────────────────────────────────────────────
export const habitOps = {
  async create(data: NewHabit) {
    return await db.insert(habits).values(data).returning();
  },
  async getAll() {
    return await db.select().from(habits).orderBy(asc(habits.sortOrder), asc(habits.createdAt));
  },
  async update(id: number, data: Partial<NewHabit>) {
    return await db.update(habits).set(data).where(eq(habits.id, id)).returning();
  },
  async delete(id: number) {
    return await db.delete(habits).where(eq(habits.id, id));
  },
  async deleteAll() {
    return await db.delete(habits);
  },
};

// ── completionOps ─────────────────────────────────────────────────────────────
export const completionOps = {
  dateKey(date: Date): string {
    return getLocalDateString(date);
  },

  async markDone(habitId: number, date: Date) {
    const key = this.dateKey(date);
    return await db.insert(habitCompletions)
      .values({ habitId, date: key, status: 'done' })
      .onConflictDoUpdate({
        target: [habitCompletions.habitId, habitCompletions.date],
        set: { status: 'done' },
      })
      .returning();
  },

  async markUndone(habitId: number, date: Date) {
    const key = this.dateKey(date);
    return await db.delete(habitCompletions).where(
      and(eq(habitCompletions.habitId, habitId), eq(habitCompletions.date, key))
    );
  },

  async markSkipped(habitId: number, date: Date) {
    const key = this.dateKey(date);
    return await db.insert(habitCompletions)
      .values({ habitId, date: key, status: 'skipped' })
      .onConflictDoNothing()
      .returning();
  },

  async markSkippedBulk(habitIds: number[], date: Date) {
    if (habitIds.length === 0) return;
    const key = this.dateKey(date);
    await db.insert(habitCompletions)
      .values(habitIds.map(habitId => ({ habitId, date: key, status: 'skipped' })))
      .onConflictDoNothing();
  },

  async getAll() {
    return await db.select().from(habitCompletions).orderBy(desc(habitCompletions.createdAt));
  },

  async deleteByHabitId(habitId: number) {
    return await db.delete(habitCompletions).where(eq(habitCompletions.habitId, habitId));
  },

  async deleteAll() {
    return await db.delete(habitCompletions);
  },
};

// ── dailyFocusOps ─────────────────────────────────────────────────────────────
export const dailyFocusOps = {
  async getToday(): Promise<typeof dailyFocus.$inferSelect | null> {
    const key = getLocalDateString(new Date());
    const result = await db.select().from(dailyFocus).where(eq(dailyFocus.date, key)).limit(1);
    return result[0] ?? null;
  },

  async upsertGoal(goal: string) {
    const key = getLocalDateString(new Date());
    return await db.insert(dailyFocus)
      .values({ date: key, goal, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [dailyFocus.date],
        set: { goal, updatedAt: new Date() },
      })
      .returning();
  },

  async markComplete() {
    const key = getLocalDateString(new Date());
    return await db.update(dailyFocus)
      .set({ completedAt: new Date(), updatedAt: new Date() })
      .where(eq(dailyFocus.date, key))
      .returning();
  },

  async markIncomplete() {
    const key = getLocalDateString(new Date());
    return await db.update(dailyFocus)
      .set({ completedAt: null, updatedAt: new Date() })
      .where(eq(dailyFocus.date, key))
      .returning();
  },
};
