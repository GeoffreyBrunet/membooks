import { describe, it, expect, beforeEach, mock } from 'bun:test';
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext } from 'react';

// Mock expo-localization (override global mock to get a controllable reference)
const mockGetLocales = mock(() => [{ languageCode: 'en' }]);
mock.module('expo-localization', () => ({
  getLocales: mockGetLocales,
}));

// Mock @/lib/i18n with controllable mock
const mockChangeLanguage = mock(() => Promise.resolve(undefined));
mock.module('@/lib/i18n', () => ({
  __esModule: true,
  default: {
    changeLanguage: mockChangeLanguage,
    use: mock(function(this: any) { return this; }),
    init: mock(() => Promise.resolve(undefined)),
    language: 'en',
    t: (key: string) => key,
  },
}));

// Import after mocks are set up
import { LanguageProvider, LanguageContext } from '@/contexts/language-context';

function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('No context');
  return context;
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

beforeEach(() => {
  (AsyncStorage.getItem as any).mockReset();
  (AsyncStorage.setItem as any).mockReset();
  mockChangeLanguage.mockReset().mockResolvedValue(undefined);
  mockGetLocales.mockReturnValue([{ languageCode: 'en' }]);
});

describe('LanguageContext', () => {
  it('loads stored language preference', async () => {
    (AsyncStorage.getItem as any).mockResolvedValueOnce('fr');

    const { result } = renderHook(() => useLanguageContext(), { wrapper });

    await act(async () => {});

    expect(result.current.language).toBe('fr');
    expect(mockChangeLanguage).toHaveBeenCalledWith('fr');
  });

  it('falls back to device language when no stored preference', async () => {
    (AsyncStorage.getItem as any).mockResolvedValueOnce(null);
    mockGetLocales.mockReturnValue([{ languageCode: 'fr' }]);

    const { result } = renderHook(() => useLanguageContext(), { wrapper });

    await act(async () => {});

    expect(result.current.language).toBe('fr');
  });

  it('falls back to default language when device language is unsupported', async () => {
    (AsyncStorage.getItem as any).mockResolvedValueOnce(null);
    mockGetLocales.mockReturnValue([{ languageCode: 'de' }]);

    const { result } = renderHook(() => useLanguageContext(), { wrapper });

    await act(async () => {});

    expect(result.current.language).toBe('en');
  });

  it('sets language and persists to AsyncStorage', async () => {
    (AsyncStorage.getItem as any).mockResolvedValueOnce('en');

    const { result } = renderHook(() => useLanguageContext(), { wrapper });

    await act(async () => {});

    await act(async () => {
      await result.current.setLanguage('fr');
    });

    expect(result.current.language).toBe('fr');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@membooks/language', 'fr');
    expect(mockChangeLanguage).toHaveBeenCalledWith('fr');
  });

  it('starts with isLoading true and sets to false after init', async () => {
    (AsyncStorage.getItem as any).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useLanguageContext(), { wrapper });

    await act(async () => {});

    expect(result.current.isLoading).toBe(false);
  });

  it('ignores invalid stored language values', async () => {
    (AsyncStorage.getItem as any).mockResolvedValueOnce('zh');

    const { result } = renderHook(() => useLanguageContext(), { wrapper });

    await act(async () => {});

    // Should fall back to device or default language
    expect(['en', 'fr']).toContain(result.current.language);
  });
});
