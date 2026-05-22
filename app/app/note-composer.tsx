import { palette } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { db, noteOps, notes } from "@/lib/db";
import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import type {
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from "react-native";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type TextSelection = {
  start: number;
  end: number;
};

type TextFormat = "bold" | "italic";

function getFormattedDraft(
  draft: string,
  selection: TextSelection,
  format: TextFormat,
) {
  const marker = format === "bold" ? "**" : "_";
  const start = Math.min(selection.start, selection.end);
  const end = Math.max(selection.start, selection.end);
  const selectedText = draft.slice(start, end);
  const fallbackText = format === "bold" ? "bold" : "italic";
  const text = selectedText || fallbackText;
  const value = `${draft.slice(0, start)}${marker}${text}${marker}${draft.slice(end)}`;
  const selectedStart = start + marker.length;

  return {
    selection: {
      start: selectedStart,
      end: selectedStart + text.length,
    },
    value,
  };
}

function getBulletedDraft(draft: string, selection: TextSelection) {
  const start = Math.min(selection.start, selection.end);
  const end = Math.max(selection.start, selection.end);
  const lineStart = draft.lastIndexOf("\n", start - 1) + 1;
  const nextLineBreak = draft.indexOf("\n", end);
  const lineEnd = nextLineBreak === -1 ? draft.length : nextLineBreak;
  const selectedLines = draft.slice(lineStart, lineEnd);
  const lines = selectedLines || "";
  const bulletedLines = lines
    .split("\n")
    .map((line) => (line.startsWith("- ") ? line : `- ${line}`))
    .join("\n");
  const value = `${draft.slice(0, lineStart)}${bulletedLines}${draft.slice(lineEnd)}`;
  const addedMarkers = bulletedLines.length - lines.length;

  return {
    selection: {
      start: start + (start === lineStart ? 2 : 0),
      end: end + addedMarkers,
    },
    value,
  };
}

function getListContinuationDraft(
  draft: string,
  nextDraft: string,
  selection: TextSelection,
) {
  const start = Math.min(selection.start, selection.end);
  const end = Math.max(selection.start, selection.end);
  const expectedDraft = `${draft.slice(0, start)}\n${draft.slice(end)}`;

  if (nextDraft !== expectedDraft) return null;

  const lineStart = draft.lastIndexOf("\n", start - 1) + 1;
  const lineBeforeEnter = draft.slice(lineStart, start);

  if (!lineBeforeEnter.startsWith("- ")) return null;

  if (lineBeforeEnter === "- ") {
    const caret = lineStart + 1;

    return {
      selection: { start: caret, end: caret },
      value: `${draft.slice(0, lineStart)}\n${draft.slice(end)}`,
    };
  }

  const marker = "- ";
  const caret = start + 1 + marker.length;

  return {
    selection: { start: caret, end: caret },
    value: `${nextDraft.slice(0, start + 1)}${marker}${nextDraft.slice(start + 1)}`,
  };
}

export default function NoteComposerSheet() {
  const C = useTheme();
  const s = makeStyles(C);
  const params = useLocalSearchParams<{ noteId?: string }>();
  const noteId = useMemo(() => {
    const parsedId = Number(params.noteId);
    return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
  }, [params.noteId]);
  const { data: editingNotes } = useLiveQuery(
    db.select().from(notes).where(eq(notes.id, noteId ?? -1)).limit(1),
  );
  const editingNote = editingNotes?.[0] ?? null;
  const editing = noteId != null;
  const [draft, setDraft] = useState("");
  const [draftSelection, setDraftSelection] = useState<TextSelection>({ start: 0, end: 0 });
  const [loadedNoteId, setLoadedNoteId] = useState<number | null>(null);
  const pendingSelectionRef = useRef<TextSelection | null>(null);

  useEffect(() => {
    if (!editingNote || loadedNoteId === editingNote.id) return;

    setDraft(editingNote.content);
    setDraftSelection({
      start: editingNote.content.length,
      end: editingNote.content.length,
    });
    setLoadedNoteId(editingNote.id);
  }, [editingNote, loadedNoteId]);

  const handleFormat = (format: TextFormat) => {
    const formatted = getFormattedDraft(draft, draftSelection, format);
    setDraft(formatted.value);
    setDraftSelection(formatted.selection);
  };

  const handleBulletList = () => {
    const bulleted = getBulletedDraft(draft, draftSelection);
    setDraft(bulleted.value);
    setDraftSelection(bulleted.selection);
  };

  const handleChangeDraft = (nextDraft: string) => {
    const continuedList = getListContinuationDraft(draft, nextDraft, draftSelection);

    if (continuedList) {
      pendingSelectionRef.current = continuedList.selection;
      setDraft(continuedList.value);
      setDraftSelection(continuedList.selection);
      return;
    }

    setDraft(nextDraft);
  };

  const handleSelectionChange = (
    event: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) => {
    const pendingSelection = pendingSelectionRef.current;
    const nextSelection = event.nativeEvent.selection;

    if (
      pendingSelection &&
      (nextSelection.start !== pendingSelection.start || nextSelection.end !== pendingSelection.end)
    ) {
      pendingSelectionRef.current = null;
      setDraftSelection(pendingSelection);
      return;
    }

    pendingSelectionRef.current = null;
    setDraftSelection(nextSelection);
  };

  const handleSave = async () => {
    const content = draft.trim();
    if (!content) return;

    if (editingNote) {
      await noteOps.update(editingNote.id, { content });
    } else {
      await noteOps.create({
        content,
        mediaUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={s.container}>
      <View style={s.content}>
        <Text style={s.title}>{editing ? "Edit note" : "New note"}</Text>
        <View style={s.toolbar}>
          <TouchableOpacity
            accessibilityLabel="Bold"
            activeOpacity={0.75}
            onPress={() => handleFormat("bold")}
            style={s.formatButton}
          >
            <Text style={[s.formatLabel, s.boldLabel]}>B</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Italic"
            activeOpacity={0.75}
            onPress={() => handleFormat("italic")}
            style={s.formatButton}
          >
            <Text style={[s.formatLabel, s.italicLabel]}>I</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Bullet list"
            activeOpacity={0.75}
            onPress={handleBulletList}
            style={s.formatButton}
          >
            <Ionicons name="list-outline" size={20} color={C.textPrimary} />
          </TouchableOpacity>
        </View>
        <TextInput
          autoFocus
          multiline
          onChangeText={handleChangeDraft}
          onSelectionChange={handleSelectionChange}
          placeholder="Capture a thought, plan, or reminder..."
          placeholderTextColor={C.textPlaceholder}
          selection={draftSelection}
          style={s.input}
          value={draft}
        />
      </View>
      <KeyboardStickyView offset={{ opened: 10 }} style={s.footer}>
        <TouchableOpacity activeOpacity={0.75} onPress={() => router.back()} style={s.cancelButton}>
          <Text style={s.cancelLabel}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.82}
          disabled={!draft.trim()}
          onPress={handleSave}
          style={[s.saveButton, !draft.trim() ? s.saveButtonDisabled : null]}
        >
          <Text style={s.saveLabel}>{editing ? "Update" : "Save"}</Text>
        </TouchableOpacity>
      </KeyboardStickyView>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.sheetBg,
    },
    content: {
      flex: 1,
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 16,
    },
    title: {
      color: C.textPrimary,
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: 0,
    },
    toolbar: {
      flexDirection: "row",
      gap: 8,
    },
    formatButton: {
      width: 38,
      height: 38,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.inputBg,
      alignItems: "center",
      justifyContent: "center",
    },
    formatLabel: {
      color: C.textPrimary,
      fontSize: 16,
      lineHeight: 20,
    },
    boldLabel: {
      fontWeight: "900",
    },
    italicLabel: {
      fontStyle: "italic",
      fontWeight: "700",
    },
    input: {
      flex: 1,
      minHeight: 220,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: C.inputBorder,
      backgroundColor: C.inputBg,
      color: C.textPrimary,
      fontSize: 16,
      lineHeight: 24,
      paddingHorizontal: 16,
      paddingVertical: 16,
      textAlignVertical: "top",
    },
    footer: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 20,
    },
    cancelButton: {
      flex: 1,
      minHeight: 50,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.inputBg,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelLabel: {
      color: C.textSecondary,
      fontSize: 15,
      fontWeight: "700",
    },
    saveButton: {
      flex: 1,
      minHeight: 50,
      borderRadius: 14,
      backgroundColor: palette.orange,
      alignItems: "center",
      justifyContent: "center",
    },
    saveButtonDisabled: {
      opacity: 0.45,
    },
    saveLabel: {
      color: palette.white,
      fontSize: 15,
      fontWeight: "800",
    },
  });
}
