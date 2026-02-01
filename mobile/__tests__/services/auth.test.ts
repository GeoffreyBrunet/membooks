import { describe, it, expect, beforeEach, mock } from 'bun:test';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ensure we use the real auth service (not a mock from other test files)
// No module override needed - service tests import the real module directly

import {
  register,
  login,
  socialLogin,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getSession,
  isAuthenticated,
} from '@/services/auth';

const mockFetch = global.fetch as ReturnType<typeof mock>;

const mockUser = {
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  language: 'en',
  isPremium: false,
  createdAt: '2024-01-01T00:00:00Z',
};

const SESSION_KEY = '@membooks_session';

beforeEach(() => {
  mockFetch.mockReset();
  (AsyncStorage.getItem as ReturnType<typeof mock>).mockReset();
  (AsyncStorage.setItem as ReturnType<typeof mock>).mockReset();
  (AsyncStorage.removeItem as ReturnType<typeof mock>).mockReset();
});

describe('register', () => {
  it('returns success and saves session on successful registration', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: mockUser, token: 'jwt-token' }),
    });

    const result = await register({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
    expect(result.user).toEqual(mockUser);
    expect(result.token).toBe('jwt-token');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      SESSION_KEY,
      JSON.stringify({ token: 'jwt-token', user: mockUser })
    );
  });

  it('returns error on failed registration', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'email_taken' }),
    });

    const result = await register({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('email_taken');
  });

  it('returns network_error on exception', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await register({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('network_error');
  });
});

describe('login', () => {
  it('returns success and saves session', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: mockUser, token: 'jwt-token' }),
    });

    const result = await login({ email: 'test@example.com', password: 'pass' });

    expect(result.success).toBe(true);
    expect(result.user).toEqual(mockUser);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('returns error on invalid credentials', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'invalid_credentials' }),
    });

    const result = await login({ email: 'test@example.com', password: 'wrong' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('invalid_credentials');
  });

  it('returns network_error on exception', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fail'));

    const result = await login({ email: 'a@b.com', password: 'x' });
    expect(result.error).toBe('network_error');
  });
});

describe('socialLogin', () => {
  it('returns success and saves session', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: mockUser, token: 'jwt-token' }),
    });

    const result = await socialLogin({
      provider: 'apple',
      idToken: 'apple-token',
    });

    expect(result.success).toBe(true);
    expect(result.user).toEqual(mockUser);
  });

  it('returns error on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'social_auth_failed' }),
    });

    const result = await socialLogin({
      provider: 'google',
      idToken: 'bad-token',
    });

    expect(result.success).toBe(false);
  });
});

describe('logout', () => {
  it('removes session from storage', async () => {
    await logout();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(SESSION_KEY);
  });
});

describe('getProfile', () => {
  it('returns not_authenticated when no session', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(null);

    const result = await getProfile();

    expect(result.success).toBe(false);
    expect(result.error).toBe('not_authenticated');
  });

  it('returns user profile and updates session', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(
      JSON.stringify({ token: 'jwt-token', user: mockUser })
    );
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: { ...mockUser, username: 'updated' } }),
    });

    const result = await getProfile();

    expect(result.success).toBe(true);
    expect(result.user?.username).toBe('updated');
  });

  it('clears session on 401', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(
      JSON.stringify({ token: 'expired-token', user: mockUser })
    );
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    });

    const result = await getProfile();

    expect(result.success).toBe(false);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(SESSION_KEY);
  });
});

describe('updateProfile', () => {
  it('returns not_authenticated when no session', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(null);

    const result = await updateProfile({ username: 'new' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('not_authenticated');
  });

  it('updates profile and saves session', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(
      JSON.stringify({ token: 'jwt-token', user: mockUser })
    );
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ user: { ...mockUser, username: 'newname' } }),
    });

    const result = await updateProfile({ username: 'newname' });

    expect(result.success).toBe(true);
    expect(result.user?.username).toBe('newname');
  });
});

describe('changePassword', () => {
  it('returns not_authenticated when no session', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(null);

    const result = await changePassword({
      currentPassword: 'old',
      newPassword: 'new12345',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('not_authenticated');
  });

  it('returns success on valid password change', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(
      JSON.stringify({ token: 'jwt-token', user: mockUser })
    );
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const result = await changePassword({
      currentPassword: 'old',
      newPassword: 'new12345',
    });

    expect(result.success).toBe(true);
  });

  it('returns error on wrong current password', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(
      JSON.stringify({ token: 'jwt-token', user: mockUser })
    );
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'wrong_password' }),
    });

    const result = await changePassword({
      currentPassword: 'wrong',
      newPassword: 'new12345',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('wrong_password');
  });
});

describe('deleteAccount', () => {
  it('returns not_authenticated when no session', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(null);

    const result = await deleteAccount();

    expect(result.success).toBe(false);
    expect(result.error).toBe('not_authenticated');
  });

  it('deletes account and clears session', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(
      JSON.stringify({ token: 'jwt-token', user: mockUser })
    );
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const result = await deleteAccount();

    expect(result.success).toBe(true);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(SESSION_KEY);
  });
});

describe('getSession', () => {
  it('returns null when no session stored', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(null);

    const session = await getSession();
    expect(session).toBeNull();
  });

  it('returns parsed session data', async () => {
    const sessionData = { token: 'jwt-token', user: mockUser };
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(
      JSON.stringify(sessionData)
    );

    const session = await getSession();
    expect(session).toEqual(sessionData);
  });

  it('returns null on parse error', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce('invalid-json');

    const session = await getSession();
    expect(session).toBeNull();
  });
});

describe('isAuthenticated', () => {
  it('returns false when no session', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(null);

    const result = await isAuthenticated();
    expect(result).toBe(false);
  });

  it('returns true when session exists', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(
      JSON.stringify({ token: 'jwt-token', user: mockUser })
    );

    const result = await isAuthenticated();
    expect(result).toBe(true);
  });
});
