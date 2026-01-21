/**
 * Border Styles
 * Neo-Memphis: visible, bold borders
 */

export const borderWidths = {
  none: 0,
  thin: 1,
  medium: 2,
  thick: 3,
  heavy: 4,
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// Pre-composed border styles for common use cases
export const borders = {
  // Standard visible border (Neo-Memphis default)
  default: {
    borderWidth: borderWidths.medium,
    borderRadius: borderRadius.md,
  },

  // Thin border for subtle elements
  subtle: {
    borderWidth: borderWidths.thin,
    borderRadius: borderRadius.md,
  },

  // Heavy border for emphasis
  heavy: {
    borderWidth: borderWidths.thick,
    borderRadius: borderRadius.md,
  },

  // Card style
  card: {
    borderWidth: borderWidths.medium,
    borderRadius: borderRadius.lg,
  },

  // Button style
  button: {
    borderWidth: borderWidths.medium,
    borderRadius: borderRadius.md,
  },

  // Input style
  input: {
    borderWidth: borderWidths.medium,
    borderRadius: borderRadius.md,
  },

  // Pill/tag style
  pill: {
    borderWidth: borderWidths.medium,
    borderRadius: borderRadius.full,
  },
} as const;

export type BorderWidthToken = keyof typeof borderWidths;
export type BorderRadiusToken = keyof typeof borderRadius;
