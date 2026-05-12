import { useProfile } from "@/hooks/useProfile";
import { useMessageLimit } from "@/hooks/useMessageLimit";
import { usePaywall } from "@/hooks/usePaywall";
import GradientBackground from "@/components/GradientBackground";
import React, { useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useVoiceRecording } from "@/hooks/chat/useVoiceRecording";
import { useMessages } from "@/hooks/chat/useMessages";
import { useImagePicker } from "@/hooks/chat/useImagePicker";
import InputSection from "@/components/chat/InputSection";
import PaywallModal from "@/components/chat/PaywallModal";
import MessageList from "@/components/chat/MessageList";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AdaptiveBlurView from "@/components/ui/AdaptiveBlurView";
import { Colors } from "@/constants/theme";

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
    year:
      date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const todayKey = getLocalDateKey(new Date());
  const filterDate = params.date ?? todayKey;
  const isReadOnly = filterDate !== todayKey;

  const insets = useSafeAreaInsets();
  const listRef = useRef<any>(null);

  const [transcribedText, setTranscribedText] = useState("");

  const { isLoading } = useProfile();

  const {
    hasActiveSubscription,
    isPaywallVisible,
    showPaywall,
    handlePaywallResult,
  } = usePaywall();
  const { checkLimit, refreshAndCheckSoftLimit } = useMessageLimit(
    hasActiveSubscription,
  );

  const softPromptShownRef = useRef(false);

  const { isRecording, isTranscribing, handleVoiceInput } = useVoiceRecording(
    (text: string) => setTranscribedText(text),
  );

  const { selectedImage, pickImage, clearImage } = useImagePicker();

  const {
    addMessage: originalAddMessage,
    renderMessage,
    messages,
    isUploadingImage,
    isApiLoading,
    streamingWords,
  } = useMessages(listRef, filterDate);

  const addMessage = async (content: string, image?: string | null) => {
    if (!checkLimit()) {
      showPaywall();
      return;
    }

    await originalAddMessage(content, image);

    const hitSoftLimit = await refreshAndCheckSoftLimit();
    if (hitSoftLimit && !softPromptShownRef.current) {
      softPromptShownRef.current = true;
      showPaywall();
    }
  };

  const headerTitle = formatDisplayDate(filterDate);

  return (
    <View style={styles.container}>
      {isReadOnly && (
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
        </View>
      )}

      <GradientBackground />
      <PaywallModal
        visible={isPaywallVisible}
        onResult={handlePaywallResult}
        offeringIdentifier="feature"
      />
      <SafeAreaView style={styles.keyboard} edges={['bottom']}>
        <KeyboardAvoidingView style={styles.keyboard} behavior="padding" keyboardVerticalOffset={0}>
          <MessageList
            listRef={listRef}
            messages={messages}
            renderMessage={renderMessage}
            isLoading={isLoading}
            paddingTop={insets.top + (isReadOnly ? 64 : 16)}
            extraData={streamingWords}
          />

          {isReadOnly ? (
            <TouchableOpacity
              onPress={() => router.replace("/chat" as any)}
              activeOpacity={0.85}
              style={[styles.readOnlyBanner, { marginBottom: 16 }]}
            >
              <AdaptiveBlurView style={styles.readOnlyBannerInner}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={Colors.light.tint}
                />
                <Text style={styles.readOnlyText}>
                  Viewing {headerTitle} — tap to open Today
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color="rgba(255,255,255,0.5)"
                />
              </AdaptiveBlurView>
            </TouchableOpacity>
          ) : (
            <InputSection
              onSendMessage={addMessage}
              onVoiceInput={handleVoiceInput}
              isRecording={isRecording}
              isTranscribing={isTranscribing}
              isUploading={isUploadingImage}
              isApiLoading={isApiLoading}
              transcribedText={transcribedText}
              onTranscribedTextChange={setTranscribedText}
              selectedImage={selectedImage}
              onPickImage={pickImage}
              onClearImage={clearImage}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  headerTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },
  keyboard: {
    flex: 1,
  },
  readOnlyBanner: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: "hidden",
  },
  readOnlyBannerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.15)",
  },
  readOnlyText: {
    flex: 1,
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
});
