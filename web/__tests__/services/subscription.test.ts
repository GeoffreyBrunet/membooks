import { describe, it, expect, beforeEach, mock } from "bun:test";
import {
  getSubscriptionStatus,
  createCheckoutSession,
  cancelSubscription,
  reactivateSubscription,
} from "../../src/services/subscription";

function setAuth(token = "tok") {
  localStorage.setItem("membooks_session", JSON.stringify({ token, email: "a@b.c" }));
}

function mockFetch(response: Partial<Response>) {
  globalThis.fetch = mock(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      headers: new Headers({ "content-type": "application/json" }),
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

// --- getSubscriptionStatus ---

describe("getSubscriptionStatus", () => {
  it("returns not authenticated when no session", async () => {
    mockFetch({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Not authenticated" }),
      headers: new Headers({ "content-type": "application/json" }),
    });
    const res = await getSubscriptionStatus();
    expect(res).toEqual({ success: false, error: "Not authenticated" });
  });

  it("returns data on success", async () => {
    setAuth();
    const data = { isPremium: true, subscription: null };
    mockFetch({
      ok: true,
      json: () => Promise.resolve(data),
      headers: new Headers({ "content-type": "application/json" }),
    });
    const res = await getSubscriptionStatus();
    expect(res).toEqual({ success: true, data });
  });

  it("returns error on non-JSON response", async () => {
    setAuth();
    mockFetch({
      ok: true,
      headers: new Headers({ "content-type": "text/html" }),
    });
    const res = await getSubscriptionStatus();
    expect(res).toEqual({ success: false, error: "Invalid response" });
  });

  it("returns error on API failure", async () => {
    setAuth();
    mockFetch({
      ok: false,
      json: () => Promise.resolve({ error: "expired" }),
      headers: new Headers({ "content-type": "application/json" }),
    });
    const res = await getSubscriptionStatus();
    expect(res).toEqual({ success: false, error: "expired" });
  });

  it("handles network error", async () => {
    setAuth();
    mockFetchNetworkError();
    const res = await getSubscriptionStatus();
    expect(res).toEqual({ success: false, error: "Network error" });
  });
});

// --- createCheckoutSession ---

describe("createCheckoutSession", () => {
  it("returns not authenticated when no session", async () => {
    mockFetch({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Not authenticated" }),
    });
    const res = await createCheckoutSession();
    expect(res).toEqual({ success: false, error: "Not authenticated" });
  });

  it("returns URL on success", async () => {
    setAuth();
    mockFetch({ ok: true, json: () => Promise.resolve({ url: "https://checkout.stripe.com/x" }) });
    const res = await createCheckoutSession();
    expect(res).toEqual({ success: true, url: "https://checkout.stripe.com/x" });
  });

  it("returns error on API failure", async () => {
    setAuth();
    mockFetch({ ok: false, json: () => Promise.resolve({ error: "fail" }) });
    const res = await createCheckoutSession();
    expect(res).toEqual({ success: false, error: "fail" });
  });

  it("handles network error", async () => {
    setAuth();
    mockFetchNetworkError();
    const res = await createCheckoutSession();
    expect(res).toEqual({ success: false, error: "Network error" });
  });
});

// --- cancelSubscription ---

describe("cancelSubscription", () => {
  it("returns not authenticated when no session", async () => {
    mockFetch({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Not authenticated" }),
    });
    const res = await cancelSubscription();
    expect(res).toEqual({ success: false, error: "Not authenticated" });
  });

  it("succeeds", async () => {
    setAuth();
    mockFetch({ ok: true, json: () => Promise.resolve({}) });
    const res = await cancelSubscription();
    expect(res).toEqual({ success: true });
  });

  it("returns error on API failure", async () => {
    setAuth();
    mockFetch({ ok: false, json: () => Promise.resolve({ error: "fail" }) });
    const res = await cancelSubscription();
    expect(res).toEqual({ success: false, error: "fail" });
  });

  it("handles network error", async () => {
    setAuth();
    mockFetchNetworkError();
    const res = await cancelSubscription();
    expect(res).toEqual({ success: false, error: "Network error" });
  });
});

// --- reactivateSubscription ---

describe("reactivateSubscription", () => {
  it("returns not authenticated when no session", async () => {
    mockFetch({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Not authenticated" }),
    });
    const res = await reactivateSubscription();
    expect(res).toEqual({ success: false, error: "Not authenticated" });
  });

  it("succeeds", async () => {
    setAuth();
    mockFetch({ ok: true, json: () => Promise.resolve({}) });
    const res = await reactivateSubscription();
    expect(res).toEqual({ success: true });
  });

  it("returns error on API failure", async () => {
    setAuth();
    mockFetch({ ok: false, json: () => Promise.resolve({ error: "fail" }) });
    const res = await reactivateSubscription();
    expect(res).toEqual({ success: false, error: "fail" });
  });

  it("handles network error", async () => {
    setAuth();
    mockFetchNetworkError();
    const res = await reactivateSubscription();
    expect(res).toEqual({ success: false, error: "Network error" });
  });
});
