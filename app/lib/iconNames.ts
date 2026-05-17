import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type IoniconName = ComponentProps<typeof Ionicons>["name"];

const LEGACY_ICON_MAP: Record<string, IoniconName> = {
  "\u{1F642}": "happy-outline",
  "\u{1F60E}": "glasses-outline",
  "\u{1F33F}": "leaf-outline",
  "\u{1F525}": "flame-outline",
  "\u{26A1}": "flash-outline",
  "\u{1F319}": "moon-outline",
  "\u{1F9E0}": "bulb-outline",
  "\u{1F98A}": "person-circle-outline",
  "\u{1F6B6}": "walk-outline",
  "\u{1F4A7}": "water-outline",
  "\u{1F634}": "bed-outline",
  "\u{1F9D8}": "body-outline",
  "\u{1F4D3}": "journal-outline",
  "\u{1F64F}": "heart-outline",
  "\u{1F4D6}": "book-outline",
  "\u{1F3AF}": "radio-button-on-outline",
  "\u{1F4F5}": "phone-portrait-outline",
  "\u{1F4CB}": "clipboard-outline",
  "\u{23F1}\u{FE0F}": "timer-outline",
  "\u{1F4AC}": "chatbubble-ellipses-outline",
  "\u{1F442}": "ear-outline",
  "\u{270F}\u{FE0F}": "pencil-outline",
  "\u{1F4F8}": "camera-outline",
  "\u{1F30D}": "earth-outline",
  "\u{1F4CA}": "stats-chart-outline",
  "\u{1F4B0}": "cash-outline",
  "\u{1F389}": "sparkles-outline",
  "\u{2B50}": "star-outline",
  "•": "ellipse-outline",
};

export function resolveIoniconName(
  value: string | null | undefined,
  fallback: IoniconName = "ellipse-outline",
): IoniconName {
  if (!value) return fallback;
  return LEGACY_ICON_MAP[value] ?? (value as IoniconName);
}
