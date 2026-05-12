import { useState, useCallback } from "react";
import { NativeSyntheticEvent, NativeScrollEvent } from "react-native";

export function useScrollToBottom(listRef: React.RefObject<any>) {
  const [isNearBottom, setIsNearBottom] = useState(true);

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    setIsNearBottom(true);
  }, [listRef]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = event.nativeEvent;
      setIsNearBottom(contentOffset.y < 60);
    },
    []
  );

  return { isNearBottom, scrollToBottom, onScroll };
}
