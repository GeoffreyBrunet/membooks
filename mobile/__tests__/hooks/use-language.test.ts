import { describe, it, expect, mock } from 'bun:test';
import { renderHook } from '@testing-library/react-native';
import React from 'react';
import { useLanguage } from '@/hooks/use-language';
import { LanguageContext } from '@/contexts/language-context';

// Mock expo-localization
mock.module('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));

// Mock i18n
mock.module('@/lib/i18n', () => ({
  __esModule: true,
  default: {
    changeLanguage: mock(),
    use: mock(function(this: any) { return this; }),
    init: mock(),
  },
}));

describe('useLanguage', () => {
  it('returns the context value when inside a LanguageProvider', () => {
    const mockValue = {
      language: 'fr' as any,
      setLanguage: mock(),
      isLoading: false,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(LanguageContext.Provider, { value: mockValue }, children);

    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.language).toBe('fr');
    expect(result.current.isLoading).toBe(false);
  });

  it('throws when used outside LanguageProvider', () => {
    expect(() => {
      renderHook(() => useLanguage());
    }).toThrow('useLanguage must be used within a LanguageProvider');
  });
});
