import React, { useCallback, useRef } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThreeDotsLoader from "@/components/ui/ThreeDotsLoader";

function EmptyState() {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.headline}>{"What's on your mind?"}</Text>
      <Text style={emptyStyles.subtext}>
        Start sharing your thoughts and let's work on them together.
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  headline: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  subtext: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});

type Props = {
  listRef: React.RefObject<any>;
  messages: any[];
  renderMessage: (info: { item: any }) => React.ReactElement;
  isLoading: boolean;
  paddingTop: number;
  extraData?: any;
};

export default function MessageList({ listRef, messages, renderMessage, isLoading, paddingTop, extraData }: Props) {
  const isNearBottom = useRef(true);
  const [showScrollButton, setShowScrollButton] = React.useState(false);

  // Track content & layout sizes for reliable scroll-to-bottom
  const contentHeight = useRef(0);
  const layoutHeight = useRef(0);

  const scrollToBottom = useCallback((animated = true) => {
    const offset = contentHeight.current - layoutHeight.current;
    if (offset > 0) {
      listRef.current?.scrollToOffset({ offset, animated });
    }
  }, [listRef]);

  const onScroll = useCallback(
    (event: any) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
      const nearBottom = distanceFromBottom < 60;
      isNearBottom.current = nearBottom;
      setShowScrollButton(!nearBottom);
    },
    []
  );

  const onContentSizeChange = useCallback((_w: number, h: number) => {
    contentHeight.current = h;
    // Auto-scroll when near bottom (new message arrived)
    if (isNearBottom.current) {
      const offset = h - layoutHeight.current;
      if (offset > 0) {
        listRef.current?.scrollToOffset({ offset, animated: true });
      }
    }
  }, [listRef]);

  const onLayout = useCallback((e: any) => {
    const prevHeight = layoutHeight.current;
    layoutHeight.current = e.nativeEvent.layout.height;
    // When layout grows (keyboard dismiss) or shrinks (keyboard show), keep pinned to bottom
    if (isNearBottom.current && prevHeight > 0 && prevHeight !== layoutHeight.current) {
      const offset = contentHeight.current - layoutHeight.current;
      if (offset > 0) {
        listRef.current?.scrollToOffset({ offset, animated: true });
      }
    }
  }, [listRef]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop }]}>
        <ThreeDotsLoader />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => {
          const base = item?.id?.toString();
          if (item?.confirmed !== undefined) return `${base}-${item.confirmed}`;
          return base;
        }}
        style={styles.list}
        contentContainerStyle={[styles.content, { paddingTop }]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        extraData={extraData}
        ListEmptyComponent={<EmptyState />}
        maxToRenderPerBatch={10}
        windowSize={10}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onContentSizeChange={onContentSizeChange}
        onLayout={onLayout}
        automaticallyAdjustKeyboardInsets={false}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
      />
      {showScrollButton && (
        <TouchableOpacity style={styles.fab} onPress={() => scrollToBottom()} activeOpacity={0.8}>
          <Ionicons name="chevron-down" size={20} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
    paddingHorizontal: 16,
    gap: 12,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    backgroundColor: "rgba(40, 40, 40, 0.85)",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
});
