import { describe, it, expect, beforeEach, mock } from "bun:test";
import {
  getAdminStats,
  getAdminUsers,
  getAdminUser,
  toggleUserPremium,
  getAdminSubscriptions,
} from "../../src/services/admin";

function setAuth(token = "tok") {
  localStorage.setItem("membooks_session", JSON.stringify({ token, email: "a@b.c" }));
}

function mockFetch(response: Partial<Response>) {
  globalThis.fetch = mock(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      headers: new Headers(),
      ...response,
    } as Response)
  ) as unknown as typeof fetch;
}

function mockFetchNetworkError() {
  globalThis.fetch = mock(() => Promise.reject(new Error("network"))) as unknown as typeof fetch;
}

beforeEach(() => {
  localStorage.clear();
});

// --- adminFetch (tested indirectly through all functions) ---

describe("adminFetch – auth and error handling", () => {
  it("throws when not authenticated", async () => {
    await expect(getAdminStats()).rejects.toThrow("Not authenticated");
  });

  it("throws Unauthorized on 401", async () => {
    setAuth();
    mockFetch({ ok: false, status: 401, json: () => Promise.resolve({}) });
    await expect(getAdminStats()).rejects.toThrow("Unauthorized");
  });

  it("throws Unauthorized on 403", async () => {
    setAuth();
    mockFetch({ ok: false, status: 403, json: () => Promise.resolve({}) });
    await expect(getAdminStats()).rejects.toThrow("Unauthorized");
  });

  it("throws server error message", async () => {
    setAuth();
    mockFetch({ ok: false, status: 500, json: () => Promise.resolve({ error: "db down" }) });
    await expect(getAdminStats()).rejects.toThrow("db down");
  });

  it("throws fallback error when JSON parse fails", async () => {
    setAuth();
    mockFetch({ ok: false, status: 500, json: () => Promise.reject(new Error("bad json")) });
    await expect(getAdminStats()).rejects.toThrow("Request failed");
  });
});

// --- getAdminStats ---

describe("getAdminStats", () => {
  it("returns stats on success", async () => {
    setAuth();
    const stats = { totalUsers: 10, premiumUsers: 2, activeSubscriptions: 2, conversionRate: "20%" };
    mockFetch({ ok: true, json: () => Promise.resolve(stats) });
    expect(await getAdminStats()).toEqual(stats);
  });
});

// --- getAdminUsers ---

describe("getAdminUsers", () => {
  it("returns users with pagination", async () => {
    setAuth();
    const payload = { users: [{ id: "1", email: "a@b.c", username: "u", language: "en", isPremium: false, stripeCustomerId: null, createdAt: "2024-01-01" }], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } };
    mockFetch({ ok: true, json: () => Promise.resolve(payload) });
    expect(await getAdminUsers(1, 10)).toEqual(payload);
  });
});

// --- getAdminUser ---

describe("getAdminUser", () => {
  it("returns user details", async () => {
    setAuth();
    const payload = { user: { id: "1", email: "a@b.c", username: "u", language: "en", isPremium: false, stripeCustomerId: null, createdAt: "2024-01-01" } };
    mockFetch({ ok: true, json: () => Promise.resolve(payload) });
    expect(await getAdminUser("1")).toEqual(payload);
  });
});

// --- toggleUserPremium ---

describe("toggleUserPremium", () => {
  it("returns success", async () => {
    setAuth();
    mockFetch({ ok: true, json: () => Promise.resolve({ success: true }) });
    expect(await toggleUserPremium("1", true)).toEqual({ success: true });
  });
});

// --- getAdminSubscriptions ---

describe("getAdminSubscriptions", () => {
  it("returns subscriptions with pagination", async () => {
    setAuth();
    const payload = { subscriptions: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    mockFetch({ ok: true, json: () => Promise.resolve(payload) });
    expect(await getAdminSubscriptions(1, 10)).toEqual(payload);
  });

  it("throws on network error", async () => {
    setAuth();
    mockFetchNetworkError();
    await expect(getAdminSubscriptions()).rejects.toThrow();
  });
});
