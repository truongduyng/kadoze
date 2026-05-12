import { Platform } from 'react-native';

export const palette = {
  orange: '#FB923C',
  white: '#FFFFFF',
  black: '#000000',

  // Orange alpha variants
  orange06: 'rgba(251,146,60,0.06)',
  orange10: 'rgba(251,146,60,0.1)',
  orange15: 'rgba(251,146,60,0.15)',
  orange25: 'rgba(251,146,60,0.25)',

  // White alpha variants
  white05: 'rgba(255,255,255,0.05)',
  white06: 'rgba(255,255,255,0.06)',
  white08: 'rgba(255,255,255,0.08)',
  white10: 'rgba(255,255,255,0.1)',
  white12: 'rgba(255,255,255,0.12)',
  white15: 'rgba(255,255,255,0.15)',
  white20: 'rgba(255,255,255,0.2)',
  white25: 'rgba(255,255,255,0.25)',
  white30: 'rgba(255,255,255,0.3)',
  white35: 'rgba(255,255,255,0.35)',
  white40: 'rgba(255,255,255,0.4)',
  white45: 'rgba(255,255,255,0.45)',
  white50: 'rgba(255,255,255,0.5)',
  white55: 'rgba(255,255,255,0.55)',
  white60: 'rgba(255,255,255,0.6)',
  white70: 'rgba(255,255,255,0.7)',
  white75: 'rgba(255,255,255,0.75)',
  white80: 'rgba(255,255,255,0.8)',
  white85: 'rgba(255,255,255,0.85)',
} as const;

const tintColorLight = palette.orange;
const tintColorDark = palette.orange;

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
