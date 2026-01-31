import { describe, it, expect, beforeEach, mock } from 'bun:test';
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/contexts/auth-context';

// Mock auth service
mock.module('@/services/auth', () => ({
  login: mock(),
  register: mock(),
  socialLogin: mock(),
  logout: mock(() => Promise.resolve(undefined)),
  deleteAccount: mock(),
  getSession: mock(),
  getProfile: mock(),
}));

const authService = require('@/services/auth');

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

beforeEach(() => {
  authService.getSession.mockReset().mockResolvedValue(null);
  authService.getProfile.mockReset().mockResolvedValue({ success: false });
  authService.login.mockReset();
  authService.register.mockReset();
  authService.socialLogin.mockReset();
  authService.logout.mockReset().mockResolvedValue(undefined);
  authService.deleteAccount.mockReset();
});

describe('AuthContext', () => {
  it('starts not authenticated with no session', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {});

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('loads existing session and refreshes profile', async () => {
    authService.getSession.mockResolvedValueOnce({
      token: 'jwt-token',
      user: mockUser,
    });
    authService.getProfile.mockResolvedValueOnce({
      success: true,
      user: { ...mockUser, username: 'refreshed' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {});

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.username).toBe('refreshed');
  });

  it('clears user when token is expired (Unauthorized)', async () => {
    authService.getSession.mockResolvedValueOnce({
      token: 'expired-token',
      user: mockUser,
    });
    authService.getProfile.mockResolvedValueOnce({
      success: false,
      error: 'Unauthorized',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {});

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('login sets user on success', async () => {
    authService.login.mockResolvedValueOnce({
      success: true,
      user: mockUser,
      token: 'jwt-token',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {});

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
    authService.login.mockResolvedValueOnce({
      success: false,
      error: 'invalid_credentials',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {});

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
    authService.register.mockResolvedValueOnce({
      success: true,
      user: mockUser,
      token: 'jwt-token',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {});

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
    authService.socialLogin.mockResolvedValueOnce({
      success: true,
      user: mockUser,
      token: 'jwt-token',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {});

    await act(async () => {
      await result.current.socialLogin({
        provider: 'apple',
        idToken: 'apple-token',
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('logout clears user', async () => {
    authService.getSession.mockResolvedValueOnce({
      token: 'jwt-token',
      user: mockUser,
    });
    authService.getProfile.mockResolvedValueOnce({
      success: true,
      user: mockUser,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {});
    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(authService.logout).toHaveBeenCalled();
  });

  it('deleteAccount clears user on success', async () => {
    authService.getSession.mockResolvedValueOnce({
      token: 'jwt-token',
      user: mockUser,
    });
    authService.getProfile.mockResolvedValueOnce({
      success: true,
      user: mockUser,
    });
    authService.deleteAccount.mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {});

    await act(async () => {
      const response = await result.current.deleteAccount();
      expect(response.success).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('deleteAccount does not clear user on failure', async () => {
    authService.getSession.mockResolvedValueOnce({
      token: 'jwt-token',
      user: mockUser,
    });
    authService.getProfile.mockResolvedValueOnce({
      success: true,
      user: mockUser,
    });
    authService.deleteAccount.mockResolvedValueOnce({
      success: false,
      error: 'server_error',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {});

    await act(async () => {
      await result.current.deleteAccount();
    });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('refreshProfile updates user', async () => {
    authService.getSession.mockResolvedValueOnce({
      token: 'jwt-token',
      user: mockUser,
    });
    authService.getProfile
      .mockResolvedValueOnce({ success: true, user: mockUser })
      .mockResolvedValueOnce({
        success: true,
        user: { ...mockUser, username: 'refreshed' },
      });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {});

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
