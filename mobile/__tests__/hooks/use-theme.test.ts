import { describe, it, expect, mock } from 'bun:test';
import { renderHook } from '@testing-library/react-native';
import React from 'react';
import { useTheme } from '@/hooks/use-theme';
import { ThemeContext } from '@/contexts/theme-context';

// Mock only useColorScheme
mock.module('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => 'light',
}));

describe('useTheme', () => {
  it('returns the context value when inside a ThemeProvider', () => {
    const mockValue = {
      themeMode: 'dark' as const,
      setThemeMode: mock(),
      effectiveTheme: 'dark' as const,
      isLoading: false,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(ThemeContext.Provider, { value: mockValue }, children);

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.themeMode).toBe('dark');
    expect(result.current.effectiveTheme).toBe('dark');
    expect(result.current.isLoading).toBe(false);
  });

  it('throws when used outside ThemeProvider', () => {
    expect(() => {
      renderHook(() => useTheme());
    }).toThrow('useTheme must be used within a ThemeProvider');
  });
});
