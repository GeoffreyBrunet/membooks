import { mock } from 'bun:test';

export function useTranslation() {
  return {
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: mock(() => Promise.resolve(undefined)),
    },
  };
}

export function initReactI18next() {
  return {
    type: '3rdParty',
    init: mock(),
  };
}

export function Trans({ children }: { children?: React.ReactNode }) {
  return children;
}
