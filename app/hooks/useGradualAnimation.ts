import { useEffect } from "react";
import { useKeyboardHandler } from "react-native-keyboard-controller";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BASE_MARGIN = 16;

export const useGradualAnimation = () => {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  const baseOffset = useSharedValue(BASE_MARGIN + bottomInset);
  const marginBottom = useSharedValue(BASE_MARGIN + bottomInset);

  useEffect(() => {
    baseOffset.value = BASE_MARGIN + bottomInset;
    marginBottom.value = BASE_MARGIN + bottomInset;
  }, [baseOffset, marginBottom, bottomInset]);

  useKeyboardHandler({
    onMove: (e) => {
      "worklet";
      marginBottom.value = e.height > 0 ? 8 : baseOffset.value;
    },
    onEnd: (e) => {
      "worklet";
      marginBottom.value = e.height > 0 ? 8 : baseOffset.value;
    },
  });

  return { marginBottom };
};
