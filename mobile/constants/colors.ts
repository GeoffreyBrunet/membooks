/**
 * Neo-Memphis Color Palette
 * Bold, contrasting colors with visible borders and stylized elements
 */

// Base palette - Neo-Memphis primary colors
const palette = {
  // Core blacks and whites
  black: '#000000',
  white: '#FFFFFF',
  offWhite: '#F5F5F0',

  // Primary Neo-Memphis colors
  coral: '#FF6B6B',
  yellow: '#FFE66D',
  cyan: '#4ECDC4',
  purple: '#9B5DE5',
  pink: '#F15BB5',
  blue: '#00BBF9',

  // Neutral grays
  gray100: '#F7F7F7',
  gray200: '#E5E5E5',
  gray300: '#CCCCCC',
  gray400: '#999999',
  gray500: '#666666',
  gray600: '#444444',
  gray700: '#333333',
  gray800: '#222222',
  gray900: '#111111',

  // Semantic colors
  success: '#00C851',
  warning: '#FFBB33',
  error: '#FF4444',
  info: '#33B5E5',
} as const;

// Light theme
export const lightColors = {
  // Backgrounds
  background: palette.offWhite,
  backgroundSecondary: palette.white,
  backgroundAccent: palette.yellow,

  // Text
  text: palette.black,
  textSecondary: palette.gray600,
  textMuted: palette.gray400,
  textInverse: palette.white,

  // Borders (always visible in Neo-Memphis)
  border: palette.black,
  borderLight: palette.gray300,

  // Primary actions
  primary: palette.coral,
  primaryText: palette.black,

  // Secondary actions
  secondary: palette.cyan,
  secondaryText: palette.black,

  // Accent colors for decorative elements
  accent1: palette.yellow,
  accent2: palette.purple,
  accent3: palette.pink,
  accent4: palette.blue,

  // Shadow color (for offset shadows)
  shadow: palette.black,

  // Semantic
  success: palette.success,
  warning: palette.warning,
  error: palette.error,
  info: palette.info,
} as const;

// Dark theme
export const darkColors = {
  // Backgrounds
  background: palette.gray900,
  backgroundSecondary: palette.gray800,
  backgroundAccent: palette.purple,

  // Text
  text: palette.white,
  textSecondary: palette.gray300,
  textMuted: palette.gray500,
  textInverse: palette.black,

  // Borders (always visible in Neo-Memphis)
  border: palette.white,
  borderLight: palette.gray600,

  // Primary actions
  primary: palette.coral,
  primaryText: palette.black,

  // Secondary actions
  secondary: palette.cyan,
  secondaryText: palette.black,

  // Accent colors for decorative elements
  accent1: palette.yellow,
  accent2: palette.purple,
  accent3: palette.pink,
  accent4: palette.blue,

  // Shadow color (for offset shadows)
  shadow: palette.white,

  // Semantic
  success: palette.success,
  warning: palette.warning,
  error: palette.error,
  info: palette.info,
} as const;

export type ColorToken = keyof typeof lightColors;

// Colors type with string values (compatible with both themes)
export type Colors = {
  [K in ColorToken]: string;
};
