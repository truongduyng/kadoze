import { Text } from "react-native";

import type { Note } from "@/lib/db";

export const VOICE_NOTE_CONTENT = "Voice note";

export type NoteSection = {
  title: string;
  dateKey: string;
  data: Note[];
};

export type NoteKindFilter = "all" | "text" | "image" | "voice";

function getLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatSectionTitle(dateKey: string): string {
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
    weekday: "long",
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export function formatTime(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDuration(milliseconds = 0): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function getPreview(content: string): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  return normalized === "Image note" ? "" : normalized;
}

export function renderFormattedText(content: string) {
  const parts: React.ReactNode[] = [];
  const markerPattern = /(\*\*[^*\n]+\*\*|_[^_\n]+_)/g;
  const displayContent = content.replace(/^-\s+/gm, "\u2022 ");
  let lastIndex = 0;

  for (const match of displayContent.matchAll(markerPattern)) {
    const value = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      parts.push(displayContent.slice(lastIndex, index));
    }

    if (value.startsWith("**")) {
      parts.push(
        <Text key={`${index}-bold`} style={{ fontWeight: "800" }}>
          {value.slice(2, -2)}
        </Text>,
      );
    } else {
      parts.push(
        <Text key={`${index}-italic`} style={{ fontStyle: "italic" }}>
          {value.slice(1, -1)}
        </Text>,
      );
    }

    lastIndex = index + value.length;
  }

  if (lastIndex < displayContent.length) {
    parts.push(displayContent.slice(lastIndex));
  }

  return parts.length ? parts : displayContent;
}

export function isTrimmed(content: string, maxLength = 220): boolean {
  return getPreview(content).length > maxLength;
}

export function isAudioNote(note: Pick<Note, "content" | "mediaUrl"> | null): boolean {
  if (!note?.mediaUrl) return false;
  return (
    note.content === VOICE_NOTE_CONTENT ||
    /\.(aac|caf|m4a|mp3|wav)(\?|#|$)/i.test(note.mediaUrl)
  );
}

function getNoteKind(note: Pick<Note, "content" | "mediaUrl">): Exclude<NoteKindFilter, "all"> {
  if (isAudioNote(note)) return "voice";
  if (note.mediaUrl) return "image";
  return "text";
}

export function getNoteSections(
  allNotes: Note[],
  kindFilter: NoteKindFilter,
  searchQuery: string,
): NoteSection[] {
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const grouped = new Map<string, Note[]>();

  for (const note of allNotes) {
    const preview = getPreview(note.content);
    const kind = getNoteKind(note);
    const hiddenPlaceholder = preview === "...";
    const filteredByKind = kindFilter !== "all" && kind !== kindFilter;
    const filteredBySearch =
      normalizedSearchQuery &&
      !preview.toLowerCase().includes(normalizedSearchQuery) &&
      !kind.includes(normalizedSearchQuery);

    if (hiddenPlaceholder || filteredByKind || filteredBySearch) {
      continue;
    }

    const dateKey = getLocalDateKey(new Date(note.createdAt));
    const sectionNotes = grouped.get(dateKey);

    if (sectionNotes) {
      sectionNotes.push(note);
    } else {
      grouped.set(dateKey, [note]);
    }
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, data]) => ({
      title: formatSectionTitle(dateKey),
      dateKey,
      data,
    }));
}
