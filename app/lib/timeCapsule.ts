import { storage } from "./storage";

// ── Storage keys ─────────────────────────────────────────────────────────────

const CAPSULE_KEY = "time_capsule";
const CAPSULE_REVEALED_KEY = "time_capsule_revealed";

// ── Types ────────────────────────────────────────────────────────────────────

export interface TimeCapsuleSnapshot {
  currentStreak: number;
  totalCompleted: number;
  bounceBackRate: number; // 0–1
  latestMood: string | null;
}

export interface TimeCapsule {
  letter: string;
  createdAt: string; // ISO date
  revealAt: string; // ISO date (createdAt + durationDays)
  durationDays: number; // 30, 90, etc.
  snapshot: TimeCapsuleSnapshot;
}

// ��─ Save / Read / Clear ──────────────────────────────────────────────────────

export function saveTimeCapsule(capsule: TimeCapsule): void {
  storage.set(CAPSULE_KEY, JSON.stringify(capsule));
  storage.set(CAPSULE_REVEALED_KEY, "");
}

export function getTimeCapsule(): TimeCapsule | null {
  const raw = storage.getString(CAPSULE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TimeCapsule;
  } catch {
    return null;
  }
}

export function markCapsuleRevealed(): void {
  storage.set(CAPSULE_REVEALED_KEY, "true");
}

export function isCapsuleRevealed(): boolean {
  return storage.getString(CAPSULE_REVEALED_KEY) === "true";
}

export function clearTimeCapsule(): void {
  storage.set(CAPSULE_KEY, "");
  storage.set(CAPSULE_REVEALED_KEY, "");
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function isCapsuleReady(capsule: TimeCapsule): boolean {
  return new Date() >= new Date(capsule.revealAt);
}

export function createTimeCapsule(
  letter: string,
  durationDays: number,
  snapshot: TimeCapsuleSnapshot,
): TimeCapsule {
  const now = new Date();
  const revealAt = new Date(now);
  revealAt.setDate(revealAt.getDate() + durationDays);

  return {
    letter,
    createdAt: now.toISOString(),
    revealAt: revealAt.toISOString(),
    durationDays,
    snapshot,
  };
}
