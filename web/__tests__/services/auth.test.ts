import { describe, it, expect, beforeEach, mock } from "bun:test";
import {
  login,
  register,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  isAuthenticated,
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

beforeEach(() => {
  window.location.href = "http://localhost/";
});

// --- login ---

describe("login", () => {
  it("succeeds when API returns ok", async () => {
    mockFetch({ ok: true, json: () => Promise.resolve({ user: { id: "1" } }) });
    const res = await login("a@b.c", "pw");
    expect(res).toEqual({ success: true });
  });

  it("sends credentials include", async () => {
    let capturedOptions: RequestInit | undefined;
    globalThis.fetch = mock((url: string, options?: RequestInit) => {
      capturedOptions = options;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        headers: new Headers(),
      } as Response);
    }) as unknown as typeof fetch;

    await login("a@b.c", "pw");
    expect(capturedOptions?.credentials).toBe("include");
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
  it("succeeds when API returns ok", async () => {
    mockFetch({ ok: true, json: () => Promise.resolve({ user: { id: "1" } }) });
    const res = await register("a@b.c", "user", "pw");
    expect(res).toEqual({ success: true });
  });

  it("sends credentials include", async () => {
    let capturedOptions: RequestInit | undefined;
    globalThis.fetch = mock((url: string, options?: RequestInit) => {
      capturedOptions = options;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        headers: new Headers(),
      } as Response);
    }) as unknown as typeof fetch;

    await register("a@b.c", "user", "pw");
    expect(capturedOptions?.credentials).toBe("include");
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
  it("calls logout API and redirects", async () => {
    let capturedUrl: string | undefined;
    globalThis.fetch = mock((url: string) => {
      capturedUrl = url;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        headers: new Headers(),
      } as Response);
    }) as unknown as typeof fetch;

    await logout();
    expect(capturedUrl).toContain("/auth/logout");
    expect(window.location.pathname).toBe("/login");
  });

  it("redirects even on API error", async () => {
    mockFetchNetworkError();
    await logout();
    expect(window.location.pathname).toBe("/login");
  });
});

// --- getProfile ---

describe("getProfile", () => {
  it("returns user on success", async () => {
    const user = { id: "1", email: "a@b.c", username: "u", language: "en", isPremium: false, createdAt: "2024-01-01" };
    mockFetch({ ok: true, json: () => Promise.resolve({ user }) });
    const res = await getProfile();
    expect(res).toEqual({ success: true, user });
  });

  it("sends credentials include", async () => {
    let capturedOptions: RequestInit | undefined;
    globalThis.fetch = mock((url: string, options?: RequestInit) => {
      capturedOptions = options;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ user: {} }),
        headers: new Headers(),
      } as Response);
    }) as unknown as typeof fetch;

    await getProfile();
    expect(capturedOptions?.credentials).toBe("include");
  });

  it("returns error on 401", async () => {
    mockFetch({ ok: false, status: 401, json: () => Promise.resolve({ error: "Unauthorized" }) });
    const res = await getProfile();
    expect(res.success).toBe(false);
  });

  it("handles network error", async () => {
    mockFetchNetworkError();
    const res = await getProfile();
    expect(res).toEqual({ success: false, error: "Network error" });
  });
});

// --- updateProfile ---

describe("updateProfile", () => {
  it("succeeds", async () => {
    mockFetch({ ok: true, json: () => Promise.resolve({}) });
    const res = await updateProfile({ username: "new" });
    expect(res).toEqual({ success: true });
  });

  it("sends credentials include", async () => {
    let capturedOptions: RequestInit | undefined;
    globalThis.fetch = mock((url: string, options?: RequestInit) => {
      capturedOptions = options;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        headers: new Headers(),
      } as Response);
    }) as unknown as typeof fetch;

    await updateProfile({ username: "new" });
    expect(capturedOptions?.credentials).toBe("include");
  });

  it("returns error on failure", async () => {
    mockFetch({ ok: false, json: () => Promise.resolve({ error: "fail" }) });
    const res = await updateProfile({ username: "new" });
    expect(res).toEqual({ success: false, error: "fail" });
  });

  it("handles network error", async () => {
    mockFetchNetworkError();
    const res = await updateProfile({ username: "new" });
    expect(res).toEqual({ success: false, error: "Network error" });
  });
});

// --- changePassword ---

describe("changePassword", () => {
  it("succeeds", async () => {
    mockFetch({ ok: true, json: () => Promise.resolve({}) });
    const res = await changePassword("old", "new");
    expect(res).toEqual({ success: true });
  });

  it("returns error on failure", async () => {
    mockFetch({ ok: false, json: () => Promise.resolve({ error: "wrong" }) });
    const res = await changePassword("old", "new");
    expect(res).toEqual({ success: false, error: "wrong" });
  });

  it("handles network error", async () => {
    mockFetchNetworkError();
    const res = await changePassword("old", "new");
    expect(res).toEqual({ success: false, error: "Network error" });
  });
});

// --- deleteAccount ---

describe("deleteAccount", () => {
  it("succeeds", async () => {
    mockFetch({ ok: true, json: () => Promise.resolve({}) });
    const res = await deleteAccount();
    expect(res).toEqual({ success: true });
  });

  it("returns error on failure", async () => {
    mockFetch({ ok: false, json: () => Promise.resolve({ error: "nope" }) });
    const res = await deleteAccount();
    expect(res).toEqual({ success: false, error: "nope" });
  });

  it("handles network error", async () => {
    mockFetchNetworkError();
    const res = await deleteAccount();
    expect(res).toEqual({ success: false, error: "Network error" });
  });
});

// --- isAuthenticated ---

describe("isAuthenticated", () => {
  it("returns true when getProfile succeeds", async () => {
    mockFetch({ ok: true, json: () => Promise.resolve({ user: { id: "1" } }) });
    const result = await isAuthenticated();
    expect(result).toBe(true);
  });

  it("returns false when getProfile fails", async () => {
    mockFetch({ ok: false, status: 401, json: () => Promise.resolve({ error: "Unauthorized" }) });
    const result = await isAuthenticated();
    expect(result).toBe(false);
  });
});
