import { describe, test, expect, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";

// Test app with the same JWT auth pattern used across all protected routes
function createJwtTestApp() {
  return new Elysia()
    .use(jwt({ name: "jwt", secret: "test-secret", exp: "7d" }))
    .get("/protected", async ({ headers, jwt, set }) => {
      const authHeader = headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const token = authHeader.slice(7);
      const payload = await jwt.verify(token);

      if (!payload) {
        set.status = 401;
        return { error: "Invalid token" };
      }

      return { sub: payload.sub, email: payload.email };
    });
}

async function signToken(payload: Record<string, any>, secret = "test-secret", exp = "7d"): Promise<string> {
  const app = new Elysia().use(jwt({ name: "jwt", secret, exp }));
  return await app.decorator.jwt.sign(payload);
}

// --- Tests ---

describe("JWT Middleware", () => {
  let app: ReturnType<typeof createJwtTestApp>;

  beforeAll(() => {
    app = createJwtTestApp();
  });

  describe("Missing or malformed Authorization header", () => {
    test("should return 401 when Authorization header is missing", async () => {
      const res = await app.handle(new Request("http://localhost/protected"));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    test("should return 401 when Authorization header is empty", async () => {
      const res = await app.handle(
        new Request("http://localhost/protected", {
          headers: { Authorization: "" },
        })
      );
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    test("should return 401 when Authorization uses Basic scheme", async () => {
      const res = await app.handle(
        new Request("http://localhost/protected", {
          headers: { Authorization: "Basic dXNlcjpwYXNz" },
        })
      );
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    test("should return 401 when Bearer keyword is missing", async () => {
      const token = await signToken({ sub: "u1" });
      const res = await app.handle(
        new Request("http://localhost/protected", {
          headers: { Authorization: token },
        })
      );
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    test("should return 401 when bearer is lowercase", async () => {
      const token = await signToken({ sub: "u1" });
      const res = await app.handle(
        new Request("http://localhost/protected", {
          headers: { Authorization: `bearer ${token}` },
        })
      );
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });
  });

  describe("Invalid tokens", () => {
    test("should return 401 for a random string token", async () => {
      const res = await app.handle(
        new Request("http://localhost/protected", {
          headers: { Authorization: "Bearer random-garbage-string" },
        })
      );
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Invalid token");
    });

    test("should return 401 for a token signed with a different secret", async () => {
      const token = await signToken({ sub: "u1" }, "wrong-secret");
      const res = await app.handle(
        new Request("http://localhost/protected", {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Invalid token");
    });

    test("should return 401 for an expired token", async () => {
      // Sign a token that expires immediately
      const expiredApp = new Elysia().use(jwt({ name: "jwt", secret: "test-secret", exp: "0s" }));
      const token = await expiredApp.decorator.jwt.sign({ sub: "u1" });

      // Small delay to ensure expiration
      await new Promise((r) => setTimeout(r, 50));

      const res = await app.handle(
        new Request("http://localhost/protected", {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Invalid token");
    });

    test("should return 401 for an empty Bearer value", async () => {
      const res = await app.handle(
        new Request("http://localhost/protected", {
          headers: { Authorization: "Bearer " },
        })
      );
      expect(res.status).toBe(401);
    });
  });

  describe("Valid tokens", () => {
    test("should return 200 with valid token payload", async () => {
      const token = await signToken({ sub: "user-123", email: "test@example.com" });
      const res = await app.handle(
        new Request("http://localhost/protected", {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.sub).toBe("user-123");
      expect(body.email).toBe("test@example.com");
    });

    test("should decode sub field from token", async () => {
      const token = await signToken({ sub: "abc-def-ghi" });
      const res = await app.handle(
        new Request("http://localhost/protected", {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.sub).toBe("abc-def-ghi");
    });

    test("should handle token with extra whitespace in header", async () => {
      const token = await signToken({ sub: "u1" });
      // "Bearer  <token>" with double space — the slice(7) will include leading space
      const res = await app.handle(
        new Request("http://localhost/protected", {
          headers: { Authorization: `Bearer  ${token}` },
        })
      );
      // This will fail verification because token starts with a space
      expect(res.status).toBe(401);
    });
  });
});
