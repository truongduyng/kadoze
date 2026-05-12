// Voice recording disabled — re-enable by restoring expo-audio and the original implementation
import { useCallback } from "react";

export const useVoiceRecording = (_onTranscriptionComplete: (text: string) => void) => {
  const handleVoiceInput = useCallback(() => {}, []);

  return {
    isRecording: false,
    isTranscribing: false,
    handleVoiceInput,
  };
};
