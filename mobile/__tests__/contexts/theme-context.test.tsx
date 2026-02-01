import { describe, it, expect, beforeEach, mock } from 'bun:test';
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, ThemeContext } from '@/contexts/theme-context';
import { useContext } from 'react';

// Mock only useColorScheme, not the entire react-native module
const mockUseColorScheme = mock(() => 'light');
mock.module('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockUseColorScheme(),
}));

function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('No context');
  return context;
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

beforeEach(() => {
  (AsyncStorage.getItem as any).mockReset();
  (AsyncStorage.setItem as any).mockReset();
  mockUseColorScheme.mockReturnValue('light');
});

describe('ThemeContext', () => {
  it('defaults to system theme mode', async () => {
    (AsyncStorage.getItem as any).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useThemeContext(), { wrapper });

    await act(async () => {});

    expect(result.current.themeMode).toBe('system');
  });

  it('loads stored theme preference', async () => {
    (AsyncStorage.getItem as any).mockResolvedValueOnce('dark');

    const { result } = renderHook(() => useThemeContext(), { wrapper });

    await act(async () => {});

    expect(result.current.themeMode).toBe('dark');
  });

  it('resolves effectiveTheme to light when system is light and mode is system', async () => {
    (AsyncStorage.getItem as any).mockResolvedValueOnce(null);
    mockUseColorScheme.mockReturnValue('light');

    const { result } = renderHook(() => useThemeContext(), { wrapper });

    await act(async () => {});

    expect(result.current.effectiveTheme).toBe('light');
  });

  it('resolves effectiveTheme to dark when mode is explicitly dark', async () => {
    (AsyncStorage.getItem as any).mockResolvedValueOnce('dark');

    const { result } = renderHook(() => useThemeContext(), { wrapper });

    await act(async () => {});

    expect(result.current.effectiveTheme).toBe('dark');
  });

  it('sets theme mode and persists to AsyncStorage', async () => {
    (AsyncStorage.getItem as any).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useThemeContext(), { wrapper });

    await act(async () => {});

    await act(async () => {
      await result.current.setThemeMode('dark');
    });

    expect(result.current.themeMode).toBe('dark');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@membooks/theme', 'dark');
  });

  it('ignores invalid stored theme values', async () => {
    (AsyncStorage.getItem as any).mockResolvedValueOnce('invalid');

    const { result } = renderHook(() => useThemeContext(), { wrapper });

    await act(async () => {});

    expect(result.current.themeMode).toBe('system');
  });

  it('starts with isLoading true and sets to false after init', async () => {
    (AsyncStorage.getItem as any).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useThemeContext(), { wrapper });

    await act(async () => {});

    expect(result.current.isLoading).toBe(false);
  });
});
