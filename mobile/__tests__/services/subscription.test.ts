import { describe, it, expect, beforeEach, mock } from 'bun:test';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ensure we use the real subscription service (not a mock from other test files)
mock.module('@/services/subscription', () => require('../../services/subscription'));

import {
  createCheckoutSession,
  getSubscriptionStatus,
  cancelSubscription,
  reactivateSubscription,
} from '@/services/subscription';

const mockFetch = global.fetch as ReturnType<typeof mock>;
const SESSION_KEY = '@membooks_session';

const mockSession = JSON.stringify({
  token: 'jwt-token',
  user: { id: 'user-1', username: 'test', email: 'test@example.com', language: 'en', isPremium: false, createdAt: '' },
});

beforeEach(() => {
  mockFetch.mockReset();
  (AsyncStorage.getItem as ReturnType<typeof mock>).mockReset();
  (AsyncStorage.setItem as ReturnType<typeof mock>).mockReset();
  (AsyncStorage.removeItem as ReturnType<typeof mock>).mockReset();
});

describe('createCheckoutSession', () => {
  it('returns not_authenticated when no session', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(null);

    const result = await createCheckoutSession();

    expect(result.success).toBe(false);
    expect(result.error).toBe('not_authenticated');
  });

  it('returns checkout URL on success', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(mockSession);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ url: 'https://checkout.stripe.com/session' }),
    });

    const result = await createCheckoutSession();

    expect(result.success).toBe(true);
    expect(result.url).toBe('https://checkout.stripe.com/session');
  });

  it('returns error on API failure', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(mockSession);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'checkout_failed' }),
    });

    const result = await createCheckoutSession();

    expect(result.success).toBe(false);
    expect(result.error).toBe('checkout_failed');
  });

  it('returns network_error on exception', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(mockSession);
    mockFetch.mockRejectedValueOnce(new Error('fail'));

    const result = await createCheckoutSession();

    expect(result.success).toBe(false);
    expect(result.error).toBe('network_error');
  });
});

describe('getSubscriptionStatus', () => {
  it('returns not_authenticated when no session', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(null);

    const result = await getSubscriptionStatus();

    expect(result.success).toBe(false);
    expect(result.error).toBe('not_authenticated');
  });

  it('returns subscription status on success', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(mockSession);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      text: () =>
        Promise.resolve(
          JSON.stringify({
            isPremium: true,
            subscription: {
              status: 'active',
              currentPeriodEnd: '2025-12-31',
              cancelAtPeriodEnd: false,
            },
          })
        ),
    });

    const result = await getSubscriptionStatus();

    expect(result.success).toBe(true);
    expect(result.data?.isPremium).toBe(true);
    expect(result.data?.subscription?.status).toBe('active');
  });

  it('returns invalid_response for non-JSON response', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(mockSession);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'text/html' },
    });

    const result = await getSubscriptionStatus();

    expect(result.success).toBe(false);
    expect(result.error).toBe('invalid_response');
  });

  it('returns empty_response for empty body', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(mockSession);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      text: () => Promise.resolve(''),
    });

    const result = await getSubscriptionStatus();

    expect(result.success).toBe(false);
    expect(result.error).toBe('empty_response');
  });

  it('returns invalid_json for malformed JSON', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(mockSession);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      text: () => Promise.resolve('not-json'),
    });

    const result = await getSubscriptionStatus();

    expect(result.success).toBe(false);
    expect(result.error).toBe('invalid_json');
  });

  it('returns error on non-ok response', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(mockSession);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      headers: { get: () => 'application/json' },
      text: () => Promise.resolve(JSON.stringify({ error: 'forbidden' })),
    });

    const result = await getSubscriptionStatus();

    expect(result.success).toBe(false);
    expect(result.error).toBe('forbidden');
  });
});

describe('cancelSubscription', () => {
  it('returns not_authenticated when no session', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(null);

    const result = await cancelSubscription();

    expect(result.success).toBe(false);
    expect(result.error).toBe('not_authenticated');
  });

  it('returns success on cancel', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(mockSession);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const result = await cancelSubscription();

    expect(result.success).toBe(true);
  });

  it('returns error on failure', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(mockSession);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'no_subscription' }),
    });

    const result = await cancelSubscription();

    expect(result.success).toBe(false);
    expect(result.error).toBe('no_subscription');
  });
});

describe('reactivateSubscription', () => {
  it('returns not_authenticated when no session', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(null);

    const result = await reactivateSubscription();

    expect(result.success).toBe(false);
    expect(result.error).toBe('not_authenticated');
  });

  it('returns success on reactivation', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(mockSession);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const result = await reactivateSubscription();

    expect(result.success).toBe(true);
  });

  it('returns error on failure', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(mockSession);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'not_canceled' }),
    });

    const result = await reactivateSubscription();

    expect(result.success).toBe(false);
    expect(result.error).toBe('not_canceled');
  });

  it('returns network_error on exception', async () => {
    (AsyncStorage.getItem as ReturnType<typeof mock>).mockResolvedValueOnce(mockSession);
    mockFetch.mockRejectedValueOnce(new Error('fail'));

    const result = await reactivateSubscription();

    expect(result.success).toBe(false);
    expect(result.error).toBe('network_error');
  });
});
