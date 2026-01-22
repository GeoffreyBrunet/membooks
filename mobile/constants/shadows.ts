/**
 * Shadow Styles
 * Neo-Memphis: hard shadows, bottom only (no horizontal offset)
 * No blur, visible borders
 */

import type { ViewStyle } from 'react-native';

// Shadow offset values (vertical only, no horizontal)
export const shadowOffsets = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 6,
  xl: 8,
} as const;

// Type for shadow style (platform-agnostic base)
type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

// Shadow factory - creates platform-compatible shadow styles
// Note: Color should be applied from theme (lightColors.shadow or darkColors.shadow)
function createShadow(offsetY: number): ShadowStyle {
  return {
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: 1,
    shadowRadius: 0, // No blur
    elevation: offsetY, // Android approximation
  };
}

// Pre-composed shadow styles
// Usage: Apply shadowColor from theme colors
export const shadows = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } satisfies ShadowStyle,

  sm: createShadow(shadowOffsets.sm),
  md: createShadow(shadowOffsets.md),
  lg: createShadow(shadowOffsets.lg),
  xl: createShadow(shadowOffsets.xl),
} as const;

export type ShadowToken = keyof typeof shadows;
