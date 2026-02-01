import { describe, it, expect, beforeEach, mock } from "bun:test";
import {
  getSession,
  setSession,
  clearSession,
  login,
  register,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} from "../../src/services/auth";

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

function setAuth(token = "tok") {
  localStorage.setItem("membooks_session", JSON.stringify({ token, email: "a@b.c" }));
}

beforeEach(() => {
  localStorage.clear();
  window.location.href = "http://localhost/";
});

// --- getSession / setSession / clearSession ---

describe("getSession", () => {
  it("returns null when empty", () => {
    expect(getSession()).toBeNull();
  });

  it("parses stored session", () => {
    const s = { token: "t", email: "a@b.c" };
    localStorage.setItem("membooks_session", JSON.stringify(s));
    expect(getSession()).toEqual(s);
  });

  it("returns null on invalid JSON", () => {
    localStorage.setItem("membooks_session", "bad{json");
    expect(getSession()).toBeNull();
  });
});

describe("setSession", () => {
  it("stores session in localStorage", () => {
    setSession({ token: "t", email: "a@b.c" });
    expect(JSON.parse(localStorage.getItem("membooks_session")!)).toEqual({
      token: "t",
      email: "a@b.c",
    });
  });
});

describe("clearSession", () => {
  it("removes session from localStorage", () => {
    setAuth();
    clearSession();
    expect(localStorage.getItem("membooks_session")).toBeNull();
  });
});

// --- login ---

describe("login", () => {
  it("succeeds and stores session", async () => {
    mockFetch({ ok: true, json: () => Promise.resolve({ token: "abc" }) });
    const res = await login("a@b.c", "pw");
    expect(res).toEqual({ success: true });
    expect(getSession()?.token).toBe("abc");
  });

  it("returns error on API failure", async () => {
    mockFetch({ ok: false, json: () => Promise.resolve({ error: "bad creds" }) });
    const res = await login("a@b.c", "pw");
    expect(res).toEqual({ success: false, error: "bad creds" });
  });

  it("returns fallback error when API error is empty", async () => {
    mockFetch({ ok: false, json: () => Promise.resolve({}) });
    const res = await login("a@b.c", "pw");
    expect(res.error).toBe("Login failed");
  });

  it("handles network error", async () => {
    mockFetchNetworkError();
    const res = await login("a@b.c", "pw");
    expect(res).toEqual({ success: false, error: "Network error" });
  });
});

// --- register ---

describe("register", () => {
  it("succeeds and stores session", async () => {
    mockFetch({ ok: true, json: () => Promise.resolve({ token: "abc" }) });
    const res = await register("a@b.c", "user", "pw");
    expect(res).toEqual({ success: true });
    expect(getSession()?.token).toBe("abc");
  });

  it("returns error on API failure", async () => {
    mockFetch({ ok: false, json: () => Promise.resolve({ error: "exists" }) });
    const res = await register("a@b.c", "user", "pw");
    expect(res).toEqual({ success: false, error: "exists" });
  });

  it("returns fallback error when API error is empty", async () => {
    mockFetch({ ok: false, json: () => Promise.resolve({}) });
    const res = await register("a@b.c", "user", "pw");
    expect(res.error).toBe("Registration failed");
  });

  it("handles network error", async () => {
    mockFetchNetworkError();
    const res = await register("a@b.c", "user", "pw");
    expect(res).toEqual({ success: false, error: "Network error" });
  });
});

// --- logout ---

describe("logout", () => {
  it("clears session and redirects", () => {
    setAuth();
    logout();
    expect(getSession()).toBeNull();
    expect(window.location.pathname).toBe("/login");
  });
});

// --- getProfile ---

describe("getProfile", () => {
  it("returns not authenticated when no session", async () => {
    const res = await getProfile();
    expect(res).toEqual({ success: false, error: "Not authenticated" });
  });

  it("returns user on success", async () => {
    setAuth();
    const user = { id: "1", email: "a@b.c", username: "u", language: "en", isPremium: false, createdAt: "2024-01-01" };
    mockFetch({ ok: true, json: () => Promise.resolve({ user }) });
    const res = await getProfile();
    expect(res).toEqual({ success: true, user });
  });

  it("clears session on 401", async () => {
    setAuth();
    mockFetch({ ok: false, status: 401, json: () => Promise.resolve({ error: "expired" }) });
    const res = await getProfile();
    expect(res.success).toBe(false);
    expect(getSession()).toBeNull();
  });

  it("handles network error", async () => {
    setAuth();
    mockFetchNetworkError();
    const res = await getProfile();
    expect(res).toEqual({ success: false, error: "Network error" });
  });
});

// --- updateProfile ---

describe("updateProfile", () => {
  it("returns not authenticated when no session", async () => {
    const res = await updateProfile({ username: "new" });
    expect(res).toEqual({ success: false, error: "Not authenticated" });
  });

  it("succeeds", async () => {
    setAuth();
    mockFetch({ ok: true, json: () => Promise.resolve({}) });
    const res = await updateProfile({ username: "new" });
    expect(res).toEqual({ success: true });
  });

  it("returns error on failure", async () => {
    setAuth();
    mockFetch({ ok: false, json: () => Promise.resolve({ error: "fail" }) });
    const res = await updateProfile({ username: "new" });
    expect(res).toEqual({ success: false, error: "fail" });
  });

  it("handles network error", async () => {
    setAuth();
    mockFetchNetworkError();
    const res = await updateProfile({ username: "new" });
    expect(res).toEqual({ success: false, error: "Network error" });
  });
});

// --- changePassword ---

describe("changePassword", () => {
  it("returns not authenticated when no session", async () => {
    const res = await changePassword("old", "new");
    expect(res).toEqual({ success: false, error: "Not authenticated" });
  });

  it("succeeds", async () => {
    setAuth();
    mockFetch({ ok: true, json: () => Promise.resolve({}) });
    const res = await changePassword("old", "new");
    expect(res).toEqual({ success: true });
  });

  it("returns error on failure", async () => {
    setAuth();
    mockFetch({ ok: false, json: () => Promise.resolve({ error: "wrong" }) });
    const res = await changePassword("old", "new");
    expect(res).toEqual({ success: false, error: "wrong" });
  });

  it("handles network error", async () => {
    setAuth();
    mockFetchNetworkError();
    const res = await changePassword("old", "new");
    expect(res).toEqual({ success: false, error: "Network error" });
  });
});

// --- deleteAccount ---

describe("deleteAccount", () => {
  it("returns not authenticated when no session", async () => {
    const res = await deleteAccount();
    expect(res).toEqual({ success: false, error: "Not authenticated" });
  });

  it("succeeds and clears session", async () => {
    setAuth();
    mockFetch({ ok: true, json: () => Promise.resolve({}) });
    const res = await deleteAccount();
    expect(res).toEqual({ success: true });
    expect(getSession()).toBeNull();
  });

  it("returns error on failure", async () => {
    setAuth();
    mockFetch({ ok: false, json: () => Promise.resolve({ error: "nope" }) });
    const res = await deleteAccount();
    expect(res).toEqual({ success: false, error: "nope" });
  });

  it("handles network error", async () => {
    setAuth();
    mockFetchNetworkError();
    const res = await deleteAccount();
    expect(res).toEqual({ success: false, error: "Network error" });
  });
});
