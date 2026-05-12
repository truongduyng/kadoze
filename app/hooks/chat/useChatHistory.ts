import { useMemo } from "react";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db, notes } from "@/lib/db";

export type DaySummary = {
  dateKey: string;       // "YYYY-MM-DD"
  displayDate: string;   // "Today" | "Yesterday" | "Mar 7"
  messageCount: number;
  snippet: string;
  lastCreatedAt: Date;
  // Set when this entry represents a collapsed range of empty days
  gapDays?: number;      // number of consecutive empty days in this gap
  gapEndKey?: string;    // "YYYY-MM-DD" of the last day in the gap
};

function getLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === yesterday.getTime()) return "Yesterday";

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export function useChatHistory(): {
  days: DaySummary[];
  isLoading: boolean;
} {
  const { data: liveNotes } = useLiveQuery(
    db.select().from(notes).orderBy(notes.createdAt),
  );

  const days = useMemo(() => {
    const all = liveNotes || [];

    // Group messages by local date key
    const map = new Map<string, { messages: typeof all; lastCreatedAt: Date }>();
    for (const msg of all) {
      const key = getLocalDateKey(new Date(msg.createdAt));
      if (!map.has(key)) {
        map.set(key, { messages: [], lastCreatedAt: new Date(msg.createdAt) });
      }
      const group = map.get(key)!;
      group.messages.push(msg);
      group.lastCreatedAt = new Date(msg.createdAt);
    }

    const todayKey = getLocalDateKey(new Date());

    // Determine earliest date: oldest message or today
    const allKeys = Array.from(map.keys()).sort();
    const earliestKey = allKeys.length > 0 ? allKeys[0] : todayKey;

    // Collect all days oldest→newest, then collapse consecutive empty runs
    const [ey, em, ed] = earliestKey.split("-").map(Number);
    const cursor = new Date(ey, em - 1, ed);
    cursor.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(0, 0, 0, 0);

    // First pass: flat list oldest→newest
    type RawDay = DaySummary & { isEmpty: boolean };
    const flat: RawDay[] = [];
    while (cursor <= end) {
      const dateKey = getLocalDateKey(cursor);
      const group = map.get(dateKey);
      if (group) {
        const msgs = group.messages;
        const lastMsg = msgs[msgs.length - 1];
        const snippet = (lastMsg?.content ?? "").replace(/[#*`_>]/g, "").trim().slice(0, 120);
        flat.push({ dateKey, displayDate: formatDisplayDate(dateKey), messageCount: msgs.length, snippet, lastCreatedAt: group.lastCreatedAt, isEmpty: false });
      } else {
        flat.push({ dateKey, displayDate: formatDisplayDate(dateKey), messageCount: 0, snippet: "", lastCreatedAt: new Date(cursor), isEmpty: true });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    // Second pass: collapse consecutive empty days (excluding today which is always shown alone)
    const result: DaySummary[] = [];
    let i = 0;
    while (i < flat.length) {
      const day = flat[i];
      if (day.isEmpty && day.dateKey !== todayKey) {
        // Collect the run of consecutive empty days (stop before today)
        let j = i;
        while (j < flat.length && flat[j].isEmpty && flat[j].dateKey !== todayKey) j++;
        const runDays = j - i;
        if (runDays <= 3) {
          // 3 or fewer empty days — show individually
          for (let k = i; k < j; k++) {
            const { isEmpty: _isEmpty, ...rest } = flat[k];
            result.push(rest);
          }
        } else {
          // Collapse into one gap entry using the first day's dateKey
          const startDisplay = formatDisplayDate(flat[i].dateKey);
          const endDisplay = formatDisplayDate(flat[j - 1].dateKey);
          result.push({
            dateKey: flat[i].dateKey,
            displayDate: `${startDisplay} – ${endDisplay}`,
            messageCount: 0,
            snippet: "",
            lastCreatedAt: flat[j - 1].lastCreatedAt,
            gapDays: runDays,
            gapEndKey: flat[j - 1].dateKey,
          });
        }
        i = j;
      } else {
        const { isEmpty: _isEmpty, ...rest } = day;
        result.push(rest);
        i++;
      }
    }

    // Newest first
    result.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    return result;
  }, [liveNotes]);

  return { days, isLoading: liveNotes === undefined };
}
