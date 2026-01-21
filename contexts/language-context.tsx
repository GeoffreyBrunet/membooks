import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from '@/lib/i18n';
import {
  type Language,
  supportedLanguages,
  defaultLanguage,
} from '@/locales';

const LANGUAGE_STORAGE_KEY = '@membooks/language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  isLoading: boolean;
}

export const LanguageContext = createContext<LanguageContextType | null>(null);

interface LanguageProviderProps {
  children: ReactNode;
}

function getDeviceLanguage(): Language {
  const locale = Localization.getLocales()[0]?.languageCode;
  if (locale && supportedLanguages.includes(locale as Language)) {
    return locale as Language;
  }
  return defaultLanguage;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLanguage() {
      try {
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (
          storedLanguage &&
          supportedLanguages.includes(storedLanguage as Language)
        ) {
          setLanguageState(storedLanguage as Language);
          await i18n.changeLanguage(storedLanguage);
        } else {
          const deviceLang = getDeviceLanguage();
          setLanguageState(deviceLang);
          await i18n.changeLanguage(deviceLang);
        }
      } catch (error) {
        console.error('Failed to load language preference:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadLanguage();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      await i18n.changeLanguage(lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Failed to save language preference:', error);
      throw error;
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}
