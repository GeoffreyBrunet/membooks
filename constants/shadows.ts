/**
 * Shadow Styles
 * Neo-Memphis: hard, offset shadows (no blur)
 * Shadows are offset to bottom-right for depth effect
 */

import type { ViewStyle } from 'react-native';

// Shadow offset values
export const shadowOffsets = {
  none: { x: 0, y: 0 },
  sm: { x: 2, y: 2 },
  md: { x: 4, y: 4 },
  lg: { x: 6, y: 6 },
  xl: { x: 8, y: 8 },
} as const;

// Type for shadow style (platform-agnostic base)
type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

// Shadow factory - creates platform-compatible shadow styles
// Note: Color should be applied from theme (lightColors.shadow or darkColors.shadow)
function createShadow(offset: { x: number; y: number }): ShadowStyle {
  return {
    shadowOffset: { width: offset.x, height: offset.y },
    shadowOpacity: 1,
    shadowRadius: 0, // Neo-Memphis: no blur
    elevation: Math.max(offset.x, offset.y), // Android approximation
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
