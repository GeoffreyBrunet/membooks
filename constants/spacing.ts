/**
 * Spacing Scale
 * Consistent spacing values for margins, paddings, and gaps
 * Base unit: 4px
 */

export const spacing = {
  // Base scale (multiples of 4)
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
  '5xl': 96,

  // Component-specific spacing
  screenPadding: 16,
  cardPadding: 16,
  inputPadding: 12,
  buttonPaddingVertical: 12,
  buttonPaddingHorizontal: 24,
} as const;

export type SpacingToken = keyof typeof spacing;
