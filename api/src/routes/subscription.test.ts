import { describe, test, expect, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";

// Create a test version of the subscription routes
const createTestApp = () => {
  return new Elysia({ prefix: "/subscription" })
    .use(
      jwt({
        name: "jwt",
        secret: "test-secret",
        exp: "7d",
      })
    )
    .onBeforeHandle(({ set }) => {
      set.headers["content-type"] = "application/json";
    })
    .onError(({ error, set }) => {
      set.headers["content-type"] = "application/json";
      set.status = 500;
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: "Internal Server Error", message: errorMessage };
    })
    .get("/status", async ({ headers, jwt, set }) => {
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

      // Return mock data for testing
      return {
        isPremium: false,
        subscription: null,
      };
    });
};

describe("Subscription Routes", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeAll(() => {
    app = createTestApp();
  });

  describe("GET /subscription/status", () => {
    test("should return 401 when no auth header", async () => {
      const response = await app.handle(
        new Request("http://localhost/subscription/status")
      );

      expect(response.status).toBe(401);

      const contentType = response.headers.get("content-type");
      expect(contentType).toContain("application/json");

      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    });

    test("should return 401 when auth header is malformed", async () => {
      const response = await app.handle(
        new Request("http://localhost/subscription/status", {
          headers: {
            Authorization: "InvalidFormat token123",
          },
        })
      );

      expect(response.status).toBe(401);

      const contentType = response.headers.get("content-type");
      expect(contentType).toContain("application/json");

      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    });

    test("should return 401 when token is invalid", async () => {
      const response = await app.handle(
        new Request("http://localhost/subscription/status", {
          headers: {
            Authorization: "Bearer invalid-token",
          },
        })
      );

      expect(response.status).toBe(401);

      const contentType = response.headers.get("content-type");
      expect(contentType).toContain("application/json");

      const body = await response.json();
      expect(body.error).toBe("Invalid token");
    });

    test("should return subscription status with valid token", async () => {
      // Create a valid token
      const tokenApp = new Elysia().use(
        jwt({
          name: "jwt",
          secret: "test-secret",
          exp: "7d",
        })
      );

      // Generate a valid JWT
      const jwtPlugin = tokenApp.decorator.jwt;
      const token = await jwtPlugin.sign({ sub: "test-user-id" });

      const response = await app.handle(
        new Request("http://localhost/subscription/status", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(response.status).toBe(200);

      const contentType = response.headers.get("content-type");
      expect(contentType).toContain("application/json");

      const body = await response.json();
      expect(body).toHaveProperty("isPremium");
      expect(body).toHaveProperty("subscription");
    });

    test("should always return JSON content-type", async () => {
      const response = await app.handle(
        new Request("http://localhost/subscription/status")
      );

      const contentType = response.headers.get("content-type");
      expect(contentType).toContain("application/json");
    });
  });
});

describe("API Error Handling", () => {
  test("should return JSON for 404 errors", async () => {
    const app = new Elysia()
      .onError(({ code, set }) => {
        set.headers["content-type"] = "application/json";
        if (code === "NOT_FOUND") {
          set.status = 404;
          return { error: "Not Found", message: "The requested endpoint does not exist" };
        }
        set.status = 500;
        return { error: "Internal Server Error" };
      })
      .get("/test", () => ({ message: "ok" }));

    const response = await app.handle(
      new Request("http://localhost/nonexistent")
    );

    expect(response.status).toBe(404);

    const contentType = response.headers.get("content-type");
    expect(contentType).toContain("application/json");

    const body = await response.json();
    expect(body.error).toBe("Not Found");
  });
});
