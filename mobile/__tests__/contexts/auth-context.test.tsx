import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as authService from '@/services/auth';
import { AuthProvider, useAuth } from '@/contexts/auth-context';

// Use spyOn on the auth module namespace instead of mock.module
// This avoids CJS/ESM module instance issues on Linux Bun
const spyLogin = spyOn(authService, 'login');
const spyRegister = spyOn(authService, 'register');
const spySocialLogin = spyOn(authService, 'socialLogin');
const spyLogout = spyOn(authService, 'logout');
const spyDeleteAccount = spyOn(authService, 'deleteAccount');
const spyGetSession = spyOn(authService, 'getSession');
const spyGetProfile = spyOn(authService, 'getProfile');

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
  spyGetSession.mockReset().mockImplementation(() => Promise.resolve(null) as any);
  spyGetProfile.mockReset().mockImplementation(() => Promise.resolve({ success: false }) as any);
  spyLogin.mockReset();
  spyRegister.mockReset();
  spySocialLogin.mockReset();
  spyLogout.mockReset().mockImplementation(() => Promise.resolve(undefined) as any);
  spyDeleteAccount.mockReset();
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
    spyGetSession.mockImplementation(() =>
      Promise.resolve({ token: 'jwt-token', user: mockUser }) as any
    );
    spyGetProfile.mockImplementation(() =>
      Promise.resolve({ success: true, user: { ...mockUser, username: 'refreshed' } }) as any
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitForLoaded(result);

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.username).toBe('refreshed');
  });

  it('clears user when token is expired (Unauthorized)', async () => {
    spyGetSession.mockImplementation(() =>
      Promise.resolve({ token: 'expired-token', user: mockUser }) as any
    );
    spyGetProfile.mockImplementation(() =>
      Promise.resolve({ success: false, error: 'Unauthorized' }) as any
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitForLoaded(result);

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('login sets user on success', async () => {
    spyLogin.mockImplementation(() =>
      Promise.resolve({ success: true, user: mockUser, token: 'jwt-token' }) as any
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
    spyLogin.mockImplementation(() =>
      Promise.resolve({ success: false, error: 'invalid_credentials' }) as any
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
    spyRegister.mockImplementation(() =>
      Promise.resolve({ success: true, user: mockUser, token: 'jwt-token' }) as any
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
    spySocialLogin.mockImplementation(() =>
      Promise.resolve({ success: true, user: mockUser, token: 'jwt-token' }) as any
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
    spyGetSession.mockImplementation(() =>
      Promise.resolve({ token: 'jwt-token', user: mockUser }) as any
    );
    spyGetProfile.mockImplementation(() =>
      Promise.resolve({ success: true, user: mockUser }) as any
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitForLoaded(result);
    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(spyLogout).toHaveBeenCalled();
  });

  it('deleteAccount clears user on success', async () => {
    spyGetSession.mockImplementation(() =>
      Promise.resolve({ token: 'jwt-token', user: mockUser }) as any
    );
    spyGetProfile.mockImplementation(() =>
      Promise.resolve({ success: true, user: mockUser }) as any
    );
    spyDeleteAccount.mockImplementation(() =>
      Promise.resolve({ success: true }) as any
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
    spyGetSession.mockImplementation(() =>
      Promise.resolve({ token: 'jwt-token', user: mockUser }) as any
    );
    spyGetProfile.mockImplementation(() =>
      Promise.resolve({ success: true, user: mockUser }) as any
    );
    spyDeleteAccount.mockImplementation(() =>
      Promise.resolve({ success: false, error: 'server_error' }) as any
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
    spyGetSession.mockImplementation(() =>
      Promise.resolve({ token: 'jwt-token', user: mockUser }) as any
    );
    spyGetProfile.mockImplementation(() => {
      profileCallCount++;
      if (profileCallCount === 1) {
        return Promise.resolve({ success: true, user: mockUser }) as any;
      }
      return Promise.resolve({
        success: true,
        user: { ...mockUser, username: 'refreshed' },
      }) as any;
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
