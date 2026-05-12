import React from "react";
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { EnrichedMarkdownText } from "react-native-enriched-markdown";
import { Colors } from "@/constants/theme";
import AdaptiveBlurView from "@/components/ui/AdaptiveBlurView";
import ThreeDotsLoader from "@/components/ui/ThreeDotsLoader";

interface MessageItemProps {
  message: {
    role: string;
    content: string;
    createdAt: string | Date;
    mediaUrl?: string | null;
  };
  isStreaming?: boolean;
  streamingWords?: string;
  onRetry?: () => void;
  isOffline?: boolean;
}

const markdownStyle = {
  paragraph: {
    fontSize: 16,
    color: "white",
    lineHeight: 23,
    marginBottom: 2,
    marginTop: 2,
  },
  h1: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    marginTop: 8,
    marginBottom: 4,
  },
  h2: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginTop: 6,
    marginBottom: 3,
  },
  h3: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginTop: 4,
    marginBottom: 2,
  },
  h4: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
    marginTop: 4,
    marginBottom: 2,
  },
  h5: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    marginTop: 3,
    marginBottom: 2,
  },
  h6: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    marginTop: 3,
    marginBottom: 2,
  },
  list: {
    fontSize: 16,
    color: "white",
    lineHeight: 23,
    bulletColor: "rgba(255,255,255,0.5)",
    bulletSize: 6,
    markerColor: "rgba(255,255,255,0.5)",
    gapWidth: 8,
    marginBottom: 2,
    marginTop: 2,
  },
  blockquote: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 23,
    borderColor: "#F5A623",
    borderWidth: 3,
    gapWidth: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginTop: 4,
    marginBottom: 4,
  },
  codeBlock: {
    fontSize: 13,
    color: "#F5A623",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    marginBottom: 6,
  },
  inlineCode: {
    fontSize: 14,
    color: "#F5A623",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  link: {
    color: "#F5A623",
    underline: true,
  },
  strong: {
    color: "white",
  },
  emphasis: {
    color: "rgba(255,255,255,0.85)",
  },
  thematicBreak: {
    color: "rgba(255,255,255,0.15)",
    height: 1,
    marginTop: 8,
    marginBottom: 8,
  },
};

const MessageItem = ({ message, isStreaming, streamingWords, onRetry, isOffline }: MessageItemProps) => {
  const isBot = message.role === "assistant";
  const isProcessing = message.content === "Processing...";
  const displayContent = isStreaming ? (streamingWords || message.content) : message.content;

  return (
    <View
      style={[
        styles.messageWrapper,
        isBot ? styles.botMessageWrapper : styles.userMessageWrapper,
      ]}
    >
      {isBot && (
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.botLogo}
        />
      )}
      <AdaptiveBlurView
        style={[
          styles.messageCard,
          isBot ? styles.botMessageCard : styles.userMessageCard,
        ]}
        tintColor={
          isBot ? "rgba(255, 255, 255, 0.01)" : `${Colors.light.tint}10`
        }
      >
          {message.mediaUrl && (
            <Image
              source={{ uri: message.mediaUrl }}
              style={styles.messageImage}
              resizeMode="contain"
            />
          )}
          {isProcessing ? (
            <ThreeDotsLoader />
          ) : displayContent ? (
            isBot ? (
              <EnrichedMarkdownText
                markdown={displayContent}
                markdownStyle={markdownStyle}
                flavor="github"
                onLinkPress={({ url }) => Linking.openURL(url)}
              />
            ) : (
              <Text style={styles.messageText}>{displayContent}</Text>
            )
          ) : null}
          {!isProcessing && (
            <Text style={styles.messageTime}>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          )}
        </AdaptiveBlurView>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} activeOpacity={0.7} style={styles.retryButton}>
          <Text style={styles.retryText}>
            {isOffline ? "You're offline. Your message is saved. Tap to retry" : "Not sent \u00b7 Tap to retry"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

MessageItem.displayName = "MessageItem";

const styles = StyleSheet.create({
  messageWrapper: {
    width: "100%",
  },
  botMessageWrapper: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  userMessageWrapper: {
    alignItems: "flex-start",
  },
  messageCard: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: "hidden",
    maxWidth: "85%",
  },
  botMessageCard: {
    alignSelf: "flex-start",
  },
  userMessageCard: {
    alignSelf: "flex-end",
    backgroundColor: `${Colors.light.tint}10`,
  },
  messageImage: {
    width: 250,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  messageText: {
    color: "white",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  messageTime: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    textAlign: "right",
  },
  botLogo: {
    width: 22,
    height: 22,
    borderRadius: 6,
    margin: -8,
    marginTop: 2,
    marginRight: -2,
  },
  errorText: {
    color: "rgba(255, 100, 100, 0.85)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  retryButton: {
    marginTop: 4,
    paddingVertical: 4,
    alignSelf: "flex-end" as const,
  },
  retryText: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 12,
  },
});

export default MessageItem;
