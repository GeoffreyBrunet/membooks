import { describe, it, expect, beforeEach, mock } from 'bun:test';
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

// Create controllable mock functions BEFORE mock.module
const mockLogin = mock();
const mockRegister = mock();
const mockSocialLogin = mock();
const mockLogout = mock(() => Promise.resolve(undefined));
const mockDeleteAccount = mock();
const mockGetSession = mock(() => Promise.resolve(null));
const mockGetProfile = mock(() => Promise.resolve({ success: false }));
const mockChangePassword = mock();
const mockUpdateProfile = mock();
const mockIsAuthenticated = mock();

mock.module('@/services/auth', () => ({
  login: mockLogin,
  register: mockRegister,
  socialLogin: mockSocialLogin,
  logout: mockLogout,
  deleteAccount: mockDeleteAccount,
  getSession: mockGetSession,
  getProfile: mockGetProfile,
  changePassword: mockChangePassword,
  updateProfile: mockUpdateProfile,
  isAuthenticated: mockIsAuthenticated,
}));

// Use require (not import) to ensure auth-context loads AFTER mock.module takes effect
const { AuthProvider, useAuth } = require('@/contexts/auth-context');

const mockUser = {
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  language: 'en',
  isPremium: false,
  createdAt: '2024-01-01T00:00:00Z',
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

async function waitForLoaded(result: { current: { isLoading: boolean } }) {
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  }, { timeout: 5000 });
}

beforeEach(() => {
  mockGetSession.mockClear().mockImplementation(() => Promise.resolve(null));
  mockGetProfile.mockClear().mockImplementation(() => Promise.resolve({ success: false }));
  mockLogin.mockClear();
  mockRegister.mockClear();
  mockSocialLogin.mockClear();
  mockLogout.mockClear().mockImplementation(() => Promise.resolve(undefined));
  mockDeleteAccount.mockClear();
});

describe('AuthContext', () => {
  it('starts not authenticated with no session', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitForLoaded(result);

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('loads existing session and refreshes profile', async () => {
    mockGetSession.mockImplementation(() =>
      Promise.resolve({ token: 'jwt-token', user: mockUser })
    );
    mockGetProfile.mockImplementation(() =>
      Promise.resolve({ success: true, user: { ...mockUser, username: 'refreshed' } })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitForLoaded(result);

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.username).toBe('refreshed');
  });

  it('clears user when token is expired (Unauthorized)', async () => {
    mockGetSession.mockImplementation(() =>
      Promise.resolve({ token: 'expired-token', user: mockUser })
    );
    mockGetProfile.mockImplementation(() =>
      Promise.resolve({ success: false, error: 'Unauthorized' })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitForLoaded(result);

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('login sets user on success', async () => {
    mockLogin.mockImplementation(() =>
      Promise.resolve({ success: true, user: mockUser, token: 'jwt-token' })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitForLoaded(result);

    await act(async () => {
      const response = await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(response.success).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('login does not set user on failure', async () => {
    mockLogin.mockImplementation(() =>
      Promise.resolve({ success: false, error: 'invalid_credentials' })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitForLoaded(result);

    await act(async () => {
      const response = await result.current.login({
        email: 'test@example.com',
        password: 'wrong',
      });
      expect(response.success).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('register sets user on success', async () => {
    mockRegister.mockImplementation(() =>
      Promise.resolve({ success: true, user: mockUser, token: 'jwt-token' })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitForLoaded(result);

    await act(async () => {
      const response = await result.current.register({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(response.success).toBe(true);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it('socialLogin sets user on success', async () => {
    mockSocialLogin.mockImplementation(() =>
      Promise.resolve({ success: true, user: mockUser, token: 'jwt-token' })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitForLoaded(result);

    await act(async () => {
      await result.current.socialLogin({
        provider: 'apple',
        idToken: 'apple-token',
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('logout clears user', async () => {
    mockGetSession.mockImplementation(() =>
      Promise.resolve({ token: 'jwt-token', user: mockUser })
    );
    mockGetProfile.mockImplementation(() =>
      Promise.resolve({ success: true, user: mockUser })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitForLoaded(result);
    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(mockLogout).toHaveBeenCalled();
  });

  it('deleteAccount clears user on success', async () => {
    mockGetSession.mockImplementation(() =>
      Promise.resolve({ token: 'jwt-token', user: mockUser })
    );
    mockGetProfile.mockImplementation(() =>
      Promise.resolve({ success: true, user: mockUser })
    );
    mockDeleteAccount.mockImplementation(() =>
      Promise.resolve({ success: true })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitForLoaded(result);

    await act(async () => {
      const response = await result.current.deleteAccount();
      expect(response.success).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('deleteAccount does not clear user on failure', async () => {
    mockGetSession.mockImplementation(() =>
      Promise.resolve({ token: 'jwt-token', user: mockUser })
    );
    mockGetProfile.mockImplementation(() =>
      Promise.resolve({ success: true, user: mockUser })
    );
    mockDeleteAccount.mockImplementation(() =>
      Promise.resolve({ success: false, error: 'server_error' })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitForLoaded(result);

    await act(async () => {
      await result.current.deleteAccount();
    });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('refreshProfile updates user', async () => {
    let profileCallCount = 0;
    mockGetSession.mockImplementation(() =>
      Promise.resolve({ token: 'jwt-token', user: mockUser })
    );
    mockGetProfile.mockImplementation(() => {
      profileCallCount++;
      if (profileCallCount === 1) {
        return Promise.resolve({ success: true, user: mockUser });
      }
      return Promise.resolve({
        success: true,
        user: { ...mockUser, username: 'refreshed' },
      });
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitForLoaded(result);

    await act(async () => {
      await result.current.refreshProfile();
    });

    expect(result.current.user?.username).toBe('refreshed');
  });

  it('useAuth throws when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });
});
