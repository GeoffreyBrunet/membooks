/**
 * useThemeColors Hook
 * Returns the appropriate color palette based on the current theme setting
 */

import { useContext } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, type Colors } from '@/constants';
import { ThemeContext } from '@/contexts/theme-context';

export function useThemeColors(): Colors {
  const themeContext = useContext(ThemeContext);
  const systemColorScheme = useColorScheme();

  // If ThemeContext is not available (e.g., during initial load), fall back to system
  if (!themeContext) {
    return systemColorScheme === 'dark' ? darkColors : lightColors;
  }

  return themeContext.effectiveTheme === 'dark' ? darkColors : lightColors;
}
