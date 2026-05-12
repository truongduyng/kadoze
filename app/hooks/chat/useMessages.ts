import React, { useCallback, useState, useMemo, useRef } from "react";
import * as Haptics from "expo-haptics";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db, notes, noteOps } from "@/lib/db";
import MessageItem from "@/components/chat/MessageItem";
import { useImageUpload } from "./useImageUpload";

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && /network|fetch|abort/i.test(error.message)) return true;
  if (error instanceof Error && /network/i.test(error.message)) return true;
  return false;
}

function getLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const useMessages = (
  listRef: any,
  filterDate: string | null = null,
) => {
  const { data: liveNotes } = useLiveQuery(
    db.select().from(notes).orderBy(notes.createdAt),
  );

  const allNotesData = useMemo(() => liveNotes ?? [], [liveNotes]);

  const notesData = useMemo(() => {
    if (!filterDate) return allNotesData;
    return allNotesData.filter(
      (n) => getLocalDateKey(new Date(n.createdAt)) === filterDate,
    );
  }, [allNotesData, filterDate]);

  const [isApiLoading, setIsApiLoading] = useState(false);

  // Streaming word-by-word playback
  const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null);
  const [streamingWords, setStreamingWords] = useState("");
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playStream = useCallback((messageId: number, content: string) => {
    if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    const words = content.split(" ");
    let index = 0;
    setStreamingMessageId(messageId);
    setStreamingWords("");
    streamIntervalRef.current = setInterval(() => {
      index++;
      setStreamingWords(words.slice(0, index).join(" "));
      if (index >= words.length) {
        clearInterval(streamIntervalRef.current!);
        streamIntervalRef.current = null;
        setStreamingMessageId(null);
        setStreamingWords("");
      }
    }, 40);
  }, []);

  React.useEffect(() => {
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, []);

  const { uploadImageToR2, isUploadingImage } = useImageUpload();

  const addMessage = async (inputText: string, imageUri?: string | null) => {
    if (!inputText.trim() && !imageUri) return;

    try {
      let uploadedImageUrl: string | null = null;
      if (imageUri) {
        uploadedImageUrl = await uploadImageToR2(imageUri);
        if (!uploadedImageUrl) uploadedImageUrl = imageUri;
      }

      const userNoteResult = await noteOps.create({
        content: inputText.trim() || "",
        role: "user",
        mediaUrl: uploadedImageUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const userNote = userNoteResult[0];

      if (!inputText.trim()) return;

      setIsApiLoading(true);

      const loadingNote = await noteOps.create({
        content: "...",
        role: "assistant",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      try {
        const context = [...allNotesData, userNote]
          .filter((n) => n.content?.trim())
          .slice(-60)
          .map((n) => ({ role: n.role, content: n.content }));

        const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/process-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: context }),
        });

        if (response.ok) {
          const result = await response.json();
          const reply = result.response ?? result.message ?? "";
          if (reply && loadingNote?.[0]?.id) {
            await noteOps.update(loadingNote[0].id, { content: reply });
            playStream(loadingNote[0].id, reply);
          } else if (loadingNote?.[0]?.id) {
            await noteOps.delete(loadingNote[0].id);
          }
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          if (loadingNote?.[0]?.id) await noteOps.delete(loadingNote[0].id);
        }
      } catch (apiError) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        if (loadingNote?.[0]?.id) await noteOps.delete(loadingNote[0].id);
        console.error("Error calling API:", apiError);
      } finally {
        setIsApiLoading(false);
      }
    } catch (error) {
      console.error("Error adding message:", error);
    }
  };

  const streamingRef = useRef({ messageId: streamingMessageId, words: streamingWords });
  streamingRef.current = { messageId: streamingMessageId, words: streamingWords };

  const renderMessage = useCallback(
    ({ item }: { item: any }) => {
      const isStreaming = item.id === streamingRef.current.messageId;
      return React.createElement(MessageItem, {
        message: item,
        isStreaming,
        streamingWords: isStreaming ? streamingRef.current.words : undefined,
      });
    },
    [],
  );

  return {
    addMessage,
    renderMessage,
    messages: notesData,
    isApiLoading,
    isUploadingImage,
    streamingMessageId,
    streamingWords,
  };
};
