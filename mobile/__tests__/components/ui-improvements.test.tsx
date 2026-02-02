import { describe, it, expect, mock } from 'bun:test';
import React from 'react';
import { render } from '@testing-library/react-native';

// Mock hooks
mock.module('@/hooks/use-theme-colors', () => ({
  useThemeColors: () => ({
    background: '#F5F5F0',
    backgroundSecondary: '#FFFFFF',
    backgroundAccent: '#FFE66D',
    text: '#000000',
    textSecondary: '#444444',
    textMuted: '#999999',
    textInverse: '#FFFFFF',
    border: '#000000',
    borderLight: '#CCCCCC',
    primary: '#FF6B6B',
    primaryText: '#000000',
    secondary: '#4ECDC4',
    secondaryText: '#000000',
    accent1: '#FFE66D',
    accent2: '#9B5DE5',
    accent3: '#F15BB5',
    accent4: '#00BBF9',
    shadow: '#000000',
    success: '#00C851',
    warning: '#FFBB33',
    error: '#FF4444',
    info: '#33B5E5',
  }),
}));

// Mock auth context
mock.module('@/contexts/auth-context', () => ({
  useAuth: () => ({
    login: mock(() => Promise.resolve({ success: true })),
    register: mock(() => Promise.resolve({ success: true })),
    socialLogin: mock(() => Promise.resolve({ success: true })),
    user: { username: 'testuser' },
    isAuthenticated: false,
    logout: mock(),
  }),
}));

const ReactRef = require('react');

// Mock books context
mock.module('@/contexts/books-context', () => ({
  useBooks: () => ({
    ownedBooks: [],
    wishlistBooks: [],
    upcomingBooks: [],
    series: [],
    isLoading: false,
  }),
}));

// Mock social auth buttons
mock.module('@/components/social-auth-buttons', () => ({
  SocialAuthButtons: () => ReactRef.createElement('View', { testID: 'social-auth' }),
}));

// Mock @expo/vector-icons
mock.module('@expo/vector-icons', () => ({
  Ionicons: ({ name, ...props }: any) =>
    ReactRef.createElement('Text', { ...props, testID: `icon-${name}` }, name),
}));

// Import components after mocks
const LoginScreen = require('@/app/(auth)/login').default;
const RegisterScreen = require('@/app/(auth)/register').default;
const Home = require('@/app/(tabs)/index').default;
const ProposalsScreen = require('@/app/(tabs)/proposals').default;

describe('Auth screens theme consistency', () => {
  it('login screen renders with theme colors', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Membooks')).toBeTruthy();
    expect(getByText('auth.login.button')).toBeTruthy();
  });

  it('register screen renders with theme colors', () => {
    const { getByText } = render(<RegisterScreen />);
    expect(getByText('Membooks')).toBeTruthy();
    expect(getByText('auth.register.button')).toBeTruthy();
  });

  it('login screen renders email and password labels', () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText('auth.email')).toBeTruthy();
    expect(getByText('auth.password')).toBeTruthy();
  });

  it('register screen renders all input labels', () => {
    const { getByText } = render(<RegisterScreen />);
    expect(getByText('auth.username')).toBeTruthy();
    expect(getByText('auth.email')).toBeTruthy();
    expect(getByText('auth.password')).toBeTruthy();
    expect(getByText('auth.confirmPassword')).toBeTruthy();
  });
});

describe('Empty states with icons', () => {
  it('home screen renders book icon in empty myBooks state', () => {
    const { getByTestId } = render(<Home />);
    expect(getByTestId('icon-book-outline')).toBeTruthy();
  });

  it('home screen renders empty library text', () => {
    const { getByText } = render(<Home />);
    expect(getByText('home.emptyLibrary')).toBeTruthy();
  });
});

describe('Proposals screen', () => {
  it('renders enhanced placeholder with icon', () => {
    const { getByTestId } = render(<ProposalsScreen />);
    expect(getByTestId('icon-bulb-outline')).toBeTruthy();
  });

  it('renders coming soon title', () => {
    const { getByText } = render(<ProposalsScreen />);
    expect(getByText('home.comingSoon')).toBeTruthy();
  });

  it('renders subtitle text', () => {
    const { getByText } = render(<ProposalsScreen />);
    expect(getByText('proposals.subtitle')).toBeTruthy();
  });
});

describe('Input focus states', () => {
  it('login email input has onFocus and onBlur handlers', () => {
    const { UNSAFE_getAllByType } = render(<LoginScreen />);
    const { TextInput } = require('react-native');
    const inputs = UNSAFE_getAllByType(TextInput);
    const emailInput = inputs[0];
    expect(emailInput.props.onFocus).toBeDefined();
    expect(emailInput.props.onBlur).toBeDefined();
  });

  it('register username input has onFocus and onBlur handlers', () => {
    const { UNSAFE_getAllByType } = render(<RegisterScreen />);
    const { TextInput } = require('react-native');
    const inputs = UNSAFE_getAllByType(TextInput);
    const usernameInput = inputs[0];
    expect(usernameInput.props.onFocus).toBeDefined();
    expect(usernameInput.props.onBlur).toBeDefined();
  });
});
