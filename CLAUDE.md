# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Membooks is a React Native application built with Expo Router and the new React Native architecture. The app uses file-based routing and supports iOS, Android, and web platforms with automatic light/dark theme support.

## Key Technologies

- **Expo SDK 54** with React Native 0.81.5 and React 19.1.0
- **Expo Router 6.0** for file-based navigation
- **New Architecture**: `newArchEnabled: true` in app.json
- **React Compiler**: Enabled via experimental flag
- **TypeScript**: Strict mode enabled
- **expo-camera**: Configured with camera and microphone permissions

## Development Commands

```bash
# Install dependencies
bun install

# Start development server (choose platform from menu)
bunx expo start

# Start on specific platform
bun run android
bun run ios
bun run web

# Linting
bun run lint

# Reset project (moves current app to app-example)
bun run reset-project
```

## Project Structure

```
app/
├── (tabs)/           # Tab-based navigation group
│   ├── _layout.tsx   # Tab navigator configuration
│   ├── index.tsx     # Home screen
│   └── explore.tsx   # Explore screen
├── _layout.tsx       # Root layout with Stack navigator
└── modal.tsx         # Modal screen

components/
├── ui/               # Reusable UI components
│   ├── icon-symbol.tsx     # Cross-platform icons
│   ├── icon-symbol.ios.tsx # iOS-specific SF Symbols
│   └── collapsible.tsx
├── themed-text.tsx   # Text with automatic theme colors
├── themed-view.tsx   # View with automatic theme colors
└── haptic-tab.tsx    # Tab button with haptic feedback

constants/
└── theme.ts          # Colors and Fonts for light/dark modes

hooks/
├── use-color-scheme.ts      # Platform-aware theme detection
├── use-color-scheme.web.ts  # Web-specific theme
└── use-theme-color.ts       # Hook for themed colors
```

## Architecture Patterns

### File-Based Routing

Expo Router uses the file system for navigation. Routes are defined by the file structure in `app/`:
- `(tabs)` is a layout group (parentheses hide the segment from the URL)
- `_layout.tsx` files define nested navigators
- `index.tsx` is the default route for a directory

### Theming System

The app uses a custom theming system with automatic light/dark mode:
- **Theme constants**: `constants/theme.ts` exports `Colors` and `Fonts` objects
- **Theme detection**: `use-color-scheme` hook detects system theme
- **Themed components**: `ThemedText` and `ThemedView` automatically apply theme colors
- **Theme consumer**: `use-theme-color` hook resolves colors based on current theme

Components accept `lightColor` and `darkColor` props to override theme defaults.

### Typography

Custom fonts are loaded via expo-font in the root layout:
- **Bakbak One**: Used for titles, subtitles, and important/bold text (`defaultSemiBold` type)
- **Roboto**: Used for standard body text and links

Font usage in `ThemedText` component:
- `type="title"` and `type="subtitle"`: Bakbak One
- `type="defaultSemiBold"`: Bakbak One (for bold/important inline text)
- `type="default"` and `type="link"`: Roboto

Font files are located in `assets/fonts/` and loaded synchronously at app startup. The splash screen remains visible until fonts are loaded.

### Path Aliases

TypeScript is configured with `@/*` alias mapping to the project root. Use this for all imports:
```typescript
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
```

### Platform-Specific Code

Use platform-specific file extensions for platform-specific implementations:
- `file.ios.tsx` for iOS-specific code
- `file.android.tsx` for Android-specific code
- `file.web.ts` for web-specific code
- `file.tsx` as the fallback for all platforms

Example: `icon-symbol.ios.tsx` uses SF Symbols on iOS, while `icon-symbol.tsx` is the fallback.

### Camera Integration

expo-camera is configured in app.json with permissions. Camera and microphone access requires user permission on first use. Audio recording is enabled for Android.

## React Native New Architecture

This project uses the new React Native architecture (Fabric renderer and TurboModules). Be aware that:
- Some legacy libraries may not be compatible
- Use `react-native-reanimated` 4.1+ and `react-native-gesture-handler` 2.28+ which support the new architecture
- The React Compiler experimental feature is enabled for automatic optimization

## Navigation Configuration

Root layout uses Stack navigator with:
- `(tabs)` route: Hidden header, contains tab navigation
- `modal` route: Modal presentation style

Tab layout uses Tabs navigator with:
- Custom haptic feedback on tab press
- SF Symbols icons (iOS) with fallbacks
- Theme-aware tint colors from `Colors` constant

## Typed Routes

The project uses `typedRoutes: true` experiment, which generates TypeScript types for routes at `.expo/types/router.d.ts`. This provides type-safe navigation with autocomplete for route names.
