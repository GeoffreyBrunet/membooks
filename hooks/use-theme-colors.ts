/**
 * useThemeColors Hook
 * Returns the appropriate color palette based on the current color scheme
 */

import { useColorScheme } from 'react-native';
import { lightColors, darkColors, type Colors } from '@/constants';

export function useThemeColors(): Colors {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkColors : lightColors;
}
