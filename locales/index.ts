import en from './en.json';
import fr from './fr.json';

export const resources = {
  en: { translation: en },
  fr: { translation: fr },
} as const;

export type Language = keyof typeof resources;
export const supportedLanguages: Language[] = ['en', 'fr'];
export const defaultLanguage: Language = 'en';
