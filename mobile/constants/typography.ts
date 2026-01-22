/**
 * Typography System
 * Bakbak One: titles, important text
 * Roboto: body text, labels
 */

import type { TextStyle } from 'react-native';

// Font families
export const fontFamilies = {
  title: 'BakbakOne-Regular',
  body: 'Roboto-Regular',
  bodyMedium: 'Roboto-Medium',
  bodyBold: 'Roboto-Bold',
} as const;

// Font sizes
export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

// Line heights (multipliers)
export const lineHeights = {
  tight: 1.1,
  normal: 1.4,
  relaxed: 1.6,
} as const;

// Letter spacing
export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
} as const;

// Pre-composed text styles
// Note: Color should be applied from theme
type TypographyStyle = Pick<
  TextStyle,
  'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing' | 'fontWeight'
>;

export const typography = {
  // Titles - Bakbak One
  titleLarge: {
    fontFamily: fontFamilies.title,
    fontSize: fontSizes['4xl'],
    lineHeight: fontSizes['4xl'] * lineHeights.tight,
    letterSpacing: letterSpacing.tight,
  } satisfies TypographyStyle,

  title: {
    fontFamily: fontFamilies.title,
    fontSize: fontSizes['3xl'],
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
    letterSpacing: letterSpacing.tight,
  } satisfies TypographyStyle,

  titleSmall: {
    fontFamily: fontFamilies.title,
    fontSize: fontSizes['2xl'],
    lineHeight: fontSizes['2xl'] * lineHeights.tight,
    letterSpacing: letterSpacing.tight,
  } satisfies TypographyStyle,

  // Subtitles - Bakbak One
  subtitle: {
    fontFamily: fontFamilies.title,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  } satisfies TypographyStyle,

  // Body text - Roboto
  bodyLarge: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  } satisfies TypographyStyle,

  body: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  } satisfies TypographyStyle,

  bodySmall: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  } satisfies TypographyStyle,

  // Bold body text - Roboto Bold
  bodyBold: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  } satisfies TypographyStyle,

  // Labels - Roboto Medium
  label: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    letterSpacing: letterSpacing.wide,
  } satisfies TypographyStyle,

  labelSmall: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    letterSpacing: letterSpacing.wide,
  } satisfies TypographyStyle,

  // Button text - Bakbak One (important/action)
  button: {
    fontFamily: fontFamilies.title,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.tight,
    letterSpacing: letterSpacing.wide,
  } satisfies TypographyStyle,

  buttonSmall: {
    fontFamily: fontFamilies.title,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.tight,
    letterSpacing: letterSpacing.wide,
  } satisfies TypographyStyle,

  // Caption - Roboto
  caption: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  } satisfies TypographyStyle,
} as const;

export type TypographyToken = keyof typeof typography;
