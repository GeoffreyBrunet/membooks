/**
 * Border Styles
 * Minimalist: subtle, thin borders with soft radius
 */

export const borderWidths = {
  none: 0,
  thin: 0.5,
  medium: 1,
  thick: 1.5,
  heavy: 2,
} as const;

export const borderRadius = {
  none: 0,
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

// Pre-composed border styles for common use cases
export const borders = {
  // Standard border
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
