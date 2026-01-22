import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources, defaultLanguage } from '@/locales';
import type en from '@/locales/en.json';

// Type-safe translations
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof en;
    };
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: defaultLanguage,
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  react: {
    useSuspense: false, // Disable suspense for React Native compatibility
  },
});

export default i18n;
