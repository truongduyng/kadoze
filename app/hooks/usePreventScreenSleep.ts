import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useEffect } from "react";

export function usePreventScreenSleep(isActive: boolean, tag: string) {
  useEffect(() => {
    if (!isActive) return;

    activateKeepAwakeAsync(tag).catch(() => {});

    return () => {
      deactivateKeepAwake(tag).catch(() => {});
    };
  }, [isActive, tag]);
}
