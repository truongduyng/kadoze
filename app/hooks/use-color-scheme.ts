import { useThemePreference } from '@/contexts/ThemeContext';

export function useColorScheme() {
  const { colorScheme } = useThemePreference();
  return colorScheme;
}
