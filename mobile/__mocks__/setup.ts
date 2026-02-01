// Global test setup
import { mock, spyOn } from 'bun:test';

// Define __DEV__ global for React Native
(globalThis as any).__DEV__ = false;

// Enable React act() environment for @testing-library/react-native
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock global fetch
global.fetch = mock(() => Promise.resolve(new Response())) as any;

// Silence console.error and console.log in tests
spyOn(console, 'error').mockImplementation(() => {});
spyOn(console, 'log').mockImplementation(() => {});

// Mock react-native to avoid parsing issues with flow types
mock.module('react-native', () => {
  const React = require('react');

  return {
    Platform: { OS: 'ios', select: (obj: any) => obj.ios ?? obj.default },
    StyleSheet: {
      create: (styles: any) => styles,
      flatten: (style: any) => style,
      compose: (a: any, b: any) => [a, b],
    },
    View: ({ children, ...props }: any) => React.createElement('View', props, children),
    Text: ({ children, ...props }: any) => React.createElement('Text', props, children),
    Pressable: ({ children, style, ...props }: any) => {
      const resolvedStyle = typeof style === 'function' ? style({ pressed: false }) : style;
      return React.createElement('Pressable', { ...props, style: resolvedStyle },
        typeof children === 'function' ? children({ pressed: false }) : children
      );
    },
    TextInput: (props: any) => React.createElement('TextInput', props),
    ScrollView: ({ children, ...props }: any) => React.createElement('ScrollView', props, children),
    ActivityIndicator: (props: any) => React.createElement('ActivityIndicator', props),
    Alert: {
      alert: mock(),
    },
    useColorScheme: mock(() => 'light'),
    Dimensions: {
      get: () => ({ width: 375, height: 812 }),
      addEventListener: mock(() => ({ remove: () => {} })),
    },
    PixelRatio: {
      get: () => 2,
      getFontScale: () => 1,
      getPixelSizeForLayoutSize: (size: number) => size * 2,
      roundToNearestPixel: (size: number) => size,
    },
    Appearance: {
      getColorScheme: () => 'light',
      addChangeListener: mock(() => ({ remove: () => {} })),
    },
    I18nManager: { isRTL: false },
  };
});

// Mock react-native/Libraries/Utilities/useColorScheme
mock.module('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => 'light',
}));

// Mock @react-native-async-storage/async-storage
mock.module('@react-native-async-storage/async-storage', () => {
  return {
    default: {
      getItem: mock((key: string) => Promise.resolve(null)),
      setItem: mock((key: string, value: string) => Promise.resolve()),
      removeItem: mock((key: string) => Promise.resolve()),
      clear: mock(() => Promise.resolve()),
      getAllKeys: mock(() => Promise.resolve([])),
    },
  };
});

// Mock expo-router
mock.module('expo-router', () => {
  const React = require('react');
  return {
    Link: function Link({ children, ...props }: any) {
      return React.createElement('View', { ...props, testID: 'link' }, children);
    },
    useRouter: () => ({
      push: mock(),
      replace: mock(),
      back: mock(),
      canGoBack: mock(() => false),
    }),
    useLocalSearchParams: () => ({}),
    useSegments: () => [],
  };
});

// Mock react-i18next
mock.module('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: mock(() => Promise.resolve(undefined)),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: mock(),
  },
  Trans: ({ children }: { children?: any }) => children,
}));

// Mock @/lib/i18n to prevent real i18next initialization
mock.module('@/lib/i18n', () => ({
  __esModule: true,
  default: {
    changeLanguage: mock(() => Promise.resolve(undefined)),
    use: mock(function(this: any) { return this; }),
    init: mock(() => Promise.resolve(undefined)),
    language: 'en',
    t: (key: string) => key,
  },
}));

// Mock expo-sqlite
mock.module('expo-sqlite', () => ({
  openDatabaseAsync: mock(() => Promise.resolve({
    execAsync: mock(),
    getAllAsync: mock(() => Promise.resolve([])),
    getFirstAsync: mock(() => Promise.resolve(null)),
    runAsync: mock(),
  })),
}));

// Mock expo-localization
mock.module('expo-localization', () => ({
  getLocales: mock(() => [{ languageCode: 'en', regionCode: 'US' }]),
  getCalendars: () => [{ calendar: 'gregory', timeZone: 'America/New_York' }],
}));

// Mock expo-auth-session
mock.module('expo-auth-session', () => ({
  useAuthRequest: () => [null, null, mock()],
  makeRedirectUri: () => 'https://redirect.test',
  ResponseType: { Code: 'code', Token: 'token', IdToken: 'id_token' },
}));

// Mock expo-apple-authentication
mock.module('expo-apple-authentication', () => ({
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
  AppleAuthenticationButton: () => null,
  AppleAuthenticationButtonType: { SIGN_IN: 0, CONTINUE: 1 },
  AppleAuthenticationButtonStyle: { WHITE: 0, WHITE_OUTLINE: 1, BLACK: 2 },
  signInAsync: () => Promise.resolve({
    identityToken: 'mock-token',
    email: 'test@example.com',
    fullName: { givenName: 'Test', familyName: 'User' },
    user: 'apple-user-id',
  }),
  isAvailableAsync: () => Promise.resolve(true),
}));

// Mock expo-web-browser
mock.module('expo-web-browser', () => ({
  maybeCompleteAuthSession: () => ({ type: 'dismiss' }),
  openBrowserAsync: () => Promise.resolve({ type: 'dismiss' }),
  warmUpAsync: () => Promise.resolve(),
  coolDownAsync: () => Promise.resolve(),
}));

// Mock react-native-safe-area-context
mock.module('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    SafeAreaProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
    SafeAreaView: ({ children, ...props }: any) => React.createElement('View', props, children),
  };
});
