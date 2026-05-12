import { useEffect, useState } from 'react';
import { useThemePreference } from '@/contexts/ThemeContext';

export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const { colorScheme } = useThemePreference();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light' as const;
}
