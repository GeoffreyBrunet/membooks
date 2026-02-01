import { describe, it, expect, mock } from 'bun:test';
import { renderHook } from '@testing-library/react-native';
import React from 'react';
import { lightColors, darkColors } from '@/constants';
import { ThemeContext } from '@/contexts/theme-context';

// Re-mock the hook to use the real implementation (override any mocks from other test files)
mock.module('@/hooks/use-theme-colors', () => {
  const { useContext } = require('react');
  const { useColorScheme } = require('react-native');
  const constants = require('@/constants');
  const themeContext = require('@/contexts/theme-context');

  return {
    useThemeColors: () => {
      const ctx = useContext(themeContext.ThemeContext);
      const systemColorScheme = useColorScheme();
      if (!ctx) {
        return systemColorScheme === 'dark' ? constants.darkColors : constants.lightColors;
      }
      return ctx.effectiveTheme === 'dark' ? constants.darkColors : constants.lightColors;
    },
  };
});

import { useThemeColors } from '@/hooks/use-theme-colors';

// Get the mocked useColorScheme from react-native
const RN = require('react-native');

describe('useThemeColors', () => {
  it('returns lightColors when effective theme is light', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        ThemeContext.Provider,
        {
          value: {
            themeMode: 'light' as const,
            setThemeMode: mock(),
            effectiveTheme: 'light' as const,
            isLoading: false,
          },
        },
        children
      );

    const { result } = renderHook(() => useThemeColors(), { wrapper });
    expect(result.current).toEqual(lightColors);
  });

  it('returns darkColors when effective theme is dark', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        ThemeContext.Provider,
        {
          value: {
            themeMode: 'dark' as const,
            setThemeMode: mock(),
            effectiveTheme: 'dark' as const,
            isLoading: false,
          },
        },
        children
      );

    const { result } = renderHook(() => useThemeColors(), { wrapper });
    expect(result.current).toEqual(darkColors);
  });

  it('falls back to system color scheme when ThemeContext is not available', () => {
    RN.useColorScheme.mockReturnValue('light');

    const { result } = renderHook(() => useThemeColors());
    expect(result.current).toEqual(lightColors);
  });

  it('falls back to darkColors when system is dark and no context', () => {
    RN.useColorScheme.mockReturnValue('dark');

    const { result } = renderHook(() => useThemeColors());
    expect(result.current).toEqual(darkColors);
  });

  it('falls back to lightColors when system is null and no context', () => {
    RN.useColorScheme.mockReturnValue(null);

    const { result } = renderHook(() => useThemeColors());
    expect(result.current).toEqual(lightColors);
  });
});
