/**
 * Shadow Styles
 * Minimalist: soft, blurred shadows with low opacity
 */

import type { ViewStyle } from 'react-native';

// Shadow offset values
export const shadowOffsets = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
} as const;

// Type for shadow style (platform-agnostic base)
type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

// Shadow factory - creates soft, blurred shadows
// Note: Color should be applied from theme (lightColors.shadow or darkColors.shadow)
function createShadow(offsetY: number, blur: number, opacity: number): ShadowStyle {
  return {
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blur,
    elevation: Math.round(offsetY * 0.5), // Android approximation
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

  sm: createShadow(1, 3, 0.08),
  md: createShadow(2, 8, 0.1),
  lg: createShadow(4, 16, 0.12),
  xl: createShadow(6, 24, 0.14),
} as const;

export type ShadowToken = keyof typeof shadows;
