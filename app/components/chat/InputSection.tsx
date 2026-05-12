import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, TextInput, TouchableOpacity, Image, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AdaptiveBlurView from "@/components/ui/AdaptiveBlurView";
import WaveformAnimation from "../WaveformAnimation";

interface InputSectionProps {
  onSendMessage: (text: string, imageUri?: string | null) => void;
  onVoiceInput: () => void;
  isRecording: boolean;
  isTranscribing: boolean;
  isUploading?: boolean;
  isApiLoading?: boolean;
  transcribedText?: string;
  onTranscribedTextChange?: (text: string) => void;
  selectedImage?: string | null;
  onPickImage?: () => void;
  onClearImage?: () => void;
}

const InputSection = ({
  onSendMessage,
  onVoiceInput,
  isRecording,
  isTranscribing,
  isUploading = false,
  isApiLoading = false,
  transcribedText,
  onTranscribedTextChange,
  selectedImage,
  onPickImage,
  onClearImage,
}: InputSectionProps) => {
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (transcribedText) {
      setInputText(transcribedText);
      onTranscribedTextChange?.("");
    }
  }, [transcribedText, onTranscribedTextChange]);

  // Only block typing when truly unusable (recording transcription / image upload)
  const isBusy = isTranscribing || isUploading;
  // Block sending while busy OR while waiting for AI response
  const isSendDisabled = isBusy || isApiLoading;

  const handleSendMessage = () => {
    if (isSendDisabled) return;
    if (inputText.trim() || selectedImage) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSendMessage(inputText, selectedImage);
      setInputText("");
      onClearImage?.();
    }
  };

  return (
    <View style={styles.inputContainer}>
      {selectedImage && (
        <View style={styles.imagePreviewContainer}>
          <Image
            source={{ uri: selectedImage }}
            style={styles.imagePreview}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.removeImageButton} onPress={onClearImage}>
            <Ionicons name="close-circle" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.inputRow}>
        <TouchableOpacity onPress={onPickImage} style={styles.photoButton}>
          <AdaptiveBlurView style={styles.photoButtonBlur}>
            <Ionicons name="image-outline" size={20} color="white" />
          </AdaptiveBlurView>
        </TouchableOpacity>
        <AdaptiveBlurView style={styles.textInputView}>
          {false && isRecording ? (
            <WaveformAnimation />
          ) : (
            <TextInput
              ref={inputRef}
              cursorColor="#F5A623"
              style={[
                styles.textInput,
                isBusy && styles.textInputDisabled
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder={
                isUploading
                  ? "Uploading image..."
                  : isTranscribing
                  ? "Transcribing audio..."
                  : "Capture an idea or note..."
              }
              placeholderTextColor={
                isUploading || isTranscribing
                  ? "rgba(255, 255, 255, 0.8)"
                  : "rgba(255, 255, 255, 0.6)"
              }
              multiline
              blurOnSubmit={false}
              returnKeyType="send"
              editable={!isBusy}
              onSubmitEditing={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            />
          )}
        </AdaptiveBlurView>
        {isTranscribing || isUploading ? (
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="small" color="white" />
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={isSendDisabled}
          >
            <AdaptiveBlurView style={[styles.sendButton, isSendDisabled ? styles.sendButtonDisabled : {}]}>
              <Ionicons
                name="arrow-up"
                size={20}
                color="white"
              />
            </AdaptiveBlurView>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  photoButton: {
    marginBottom: 0,
  },
  photoButtonBlur: {
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  textInputView: {
    flex: 1,
    borderRadius: 20,
    color: "white",
    maxHeight: 120,
    minHeight: 44,
  },
  textInput: {
    color: "white",
    fontSize: 16,
    maxHeight: 120,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlignVertical: "top",
  },
  textInputDisabled: {
    opacity: 0.6,
  },
  sendButton: {
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonRecording: {
    backgroundColor: "rgba(255, 59, 48, 0.4)",
  },
  spinnerContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreviewContainer: {
    marginBottom: 8,
    position: "relative",
    maxWidth: "100%",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
  },
});

export default InputSection;
