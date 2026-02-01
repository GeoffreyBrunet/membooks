import { describe, test, expect, beforeEach } from "bun:test";
import { Elysia, t } from "elysia";
import { RateLimiter } from "./utils/rateLimiter";

// Create a test app that mirrors auth rate limiting
function createRateLimitedApp(loginLimit: number, registerLimit: number) {
  const loginLimiter = new RateLimiter({ maxRequests: loginLimit, windowMs: 60_000 });
  const registerLimiter = new RateLimiter({ maxRequests: registerLimit, windowMs: 60_000 });

  return new Elysia({ prefix: "/auth" })
    .post("/login", () => ({ success: true }), {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
      beforeHandle: ({ request, set }) => {
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        const result = loginLimiter.check(ip);
        set.headers["x-ratelimit-limit"] = String(loginLimit);
        set.headers["x-ratelimit-remaining"] = String(result.remaining);
        set.headers["x-ratelimit-reset"] = String(Math.ceil(result.resetAt / 1000));
        if (result.limited) {
          set.status = 429;
          return { error: "Too many requests", message: "Too many login attempts. Please try again later." };
        }
      },
    })
    .post("/register", () => ({ success: true }), {
      body: t.Object({
        email: t.String(),
        username: t.String(),
        password: t.String(),
      }),
      beforeHandle: ({ request, set }) => {
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        const result = registerLimiter.check(ip);
        set.headers["x-ratelimit-limit"] = String(registerLimit);
        set.headers["x-ratelimit-remaining"] = String(result.remaining);
        set.headers["x-ratelimit-reset"] = String(Math.ceil(result.resetAt / 1000));
        if (result.limited) {
          set.status = 429;
          return { error: "Too many requests", message: "Too many registration attempts. Please try again later." };
        }
      },
    });
}

function loginRequest(ip: string) {
  return new Request("http://localhost/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": ip,
    },
    body: JSON.stringify({ email: "test@example.com", password: "password123" }),
  });
}

function registerRequest(ip: string) {
  return new Request("http://localhost/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": ip,
    },
    body: JSON.stringify({ email: "test@example.com", username: "testuser", password: "password123" }),
  });
}

describe("Login Rate Limiting", () => {
  test("should allow requests under the limit", async () => {
    const app = createRateLimitedApp(3, 10);
    const response = await app.handle(loginRequest("192.168.1.1"));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-ratelimit-limit")).toBe("3");
    expect(response.headers.get("x-ratelimit-remaining")).toBe("2");
    expect(response.headers.get("x-ratelimit-reset")).toBeDefined();
  });

  test("should return 429 when limit is exceeded", async () => {
    const app = createRateLimitedApp(2, 10);

    await app.handle(loginRequest("10.0.0.1"));
    await app.handle(loginRequest("10.0.0.1"));

    const response = await app.handle(loginRequest("10.0.0.1"));
    expect(response.status).toBe(429);

    const body = await response.json();
    expect(body.error).toBe("Too many requests");
    expect(body.message).toContain("login");
  });

  test("should return rate limit headers on 429 response", async () => {
    const app = createRateLimitedApp(1, 10);

    await app.handle(loginRequest("10.0.0.2"));
    const response = await app.handle(loginRequest("10.0.0.2"));

    expect(response.status).toBe(429);
    expect(response.headers.get("x-ratelimit-remaining")).toBe("0");
    expect(response.headers.get("x-ratelimit-limit")).toBe("1");
  });

  test("should track different IPs independently", async () => {
    const app = createRateLimitedApp(1, 10);

    await app.handle(loginRequest("10.0.0.3"));
    const blocked = await app.handle(loginRequest("10.0.0.3"));
    expect(blocked.status).toBe(429);

    const allowed = await app.handle(loginRequest("10.0.0.4"));
    expect(allowed.status).toBe(200);
  });

  test("should decrement remaining count on each request", async () => {
    const app = createRateLimitedApp(3, 10);

    const r1 = await app.handle(loginRequest("10.0.0.5"));
    expect(r1.headers.get("x-ratelimit-remaining")).toBe("2");

    const r2 = await app.handle(loginRequest("10.0.0.5"));
    expect(r2.headers.get("x-ratelimit-remaining")).toBe("1");

    const r3 = await app.handle(loginRequest("10.0.0.5"));
    expect(r3.headers.get("x-ratelimit-remaining")).toBe("0");
  });
});

describe("Register Rate Limiting", () => {
  test("should allow requests under the limit", async () => {
    const app = createRateLimitedApp(5, 2);
    const response = await app.handle(registerRequest("192.168.2.1"));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-ratelimit-limit")).toBe("2");
    expect(response.headers.get("x-ratelimit-remaining")).toBe("1");
  });

  test("should return 429 when limit is exceeded", async () => {
    const app = createRateLimitedApp(5, 2);

    await app.handle(registerRequest("10.0.1.1"));
    await app.handle(registerRequest("10.0.1.1"));

    const response = await app.handle(registerRequest("10.0.1.1"));
    expect(response.status).toBe(429);

    const body = await response.json();
    expect(body.error).toBe("Too many requests");
    expect(body.message).toContain("registration");
  });

  test("should use separate limiter from login", async () => {
    const app = createRateLimitedApp(1, 1);

    // Exhaust login limit
    await app.handle(loginRequest("10.0.1.2"));
    const loginBlocked = await app.handle(loginRequest("10.0.1.2"));
    expect(loginBlocked.status).toBe(429);

    // Register should still work (different limiter)
    const registerOk = await app.handle(registerRequest("10.0.1.2"));
    expect(registerOk.status).toBe(200);
  });
});
