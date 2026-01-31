import { describe, test, expect, beforeAll } from "bun:test";
import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";

// In-memory user store for tests
interface TestUser {
  id: string;
  email: string;
  username: string;
  password: string;
  language: string;
  isPremium: boolean;
  createdAt: Date;
}

let usersDb: TestUser[] = [];

async function hashPw(pw: string): Promise<string> {
  return await Bun.password.hash(pw, { algorithm: "argon2id", memoryCost: 65536, timeCost: 3 });
}

async function verifyPw(pw: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(pw, hash);
}

function createAuthTestApp() {
  usersDb = [];

  return new Elysia({ prefix: "/auth" })
    .use(jwt({ name: "jwt", secret: "test-secret", exp: "7d" }))
    .post(
      "/register",
      async ({ body, jwt, set }) => {
        const { email, username, password, language } = body;

        if (usersDb.find((u) => u.email === email)) {
          set.status = 400;
          return { error: "Email already exists" };
        }
        if (usersDb.find((u) => u.username === username)) {
          set.status = 400;
          return { error: "Username already exists" };
        }

        const hashed = await hashPw(password);
        const newUser: TestUser = {
          id: crypto.randomUUID(),
          email,
          username,
          password: hashed,
          language: language || "en",
          isPremium: false,
          createdAt: new Date(),
        };
        usersDb.push(newUser);

        const token = await jwt.sign({ sub: newUser.id, email: newUser.email });
        return {
          user: { id: newUser.id, email: newUser.email, username: newUser.username, language: newUser.language, isPremium: newUser.isPremium, createdAt: newUser.createdAt },
          token,
        };
      },
      {
        body: t.Object({
          email: t.String({ format: "email" }),
          username: t.String({ minLength: 3, maxLength: 30 }),
          password: t.String({ minLength: 8 }),
          language: t.Optional(t.String()),
        }),
      }
    )
    .post(
      "/login",
      async ({ body, jwt, set }) => {
        const { email, password } = body;
        const user = usersDb.find((u) => u.email === email);

        if (!user) {
          set.status = 401;
          return { error: "Invalid credentials" };
        }

        const valid = await verifyPw(password, user.password);
        if (!valid) {
          set.status = 401;
          return { error: "Invalid credentials" };
        }

        const token = await jwt.sign({ sub: user.id, email: user.email });
        return {
          user: { id: user.id, email: user.email, username: user.username, language: user.language, isPremium: user.isPremium, createdAt: user.createdAt },
          token,
        };
      },
      {
        body: t.Object({
          email: t.String({ format: "email" }),
          password: t.String(),
        }),
      }
    )
    .get("/me", async ({ headers, jwt, set }) => {
      const authHeader = headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      const payload = await jwt.verify(authHeader.slice(7));
      if (!payload) {
        set.status = 401;
        return { error: "Invalid token" };
      }
      const user = usersDb.find((u) => u.id === payload.sub);
      if (!user) {
        set.status = 404;
        return { error: "User not found" };
      }
      return { user: { id: user.id, email: user.email, username: user.username, language: user.language, isPremium: user.isPremium, createdAt: user.createdAt } };
    })
    .put(
      "/me",
      async ({ headers, body, jwt, set }) => {
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { error: "Unauthorized" };
        }
        const payload = await jwt.verify(authHeader.slice(7));
        if (!payload) {
          set.status = 401;
          return { error: "Invalid token" };
        }
        const { username, language } = body;
        if (username) {
          const existing = usersDb.find((u) => u.username === username);
          if (existing && existing.id !== payload.sub) {
            set.status = 400;
            return { error: "Username already exists" };
          }
        }
        const user = usersDb.find((u) => u.id === payload.sub);
        if (!user) {
          set.status = 404;
          return { error: "User not found" };
        }
        if (username) user.username = username;
        if (language) user.language = language;
        return { user: { id: user.id, email: user.email, username: user.username, language: user.language, isPremium: user.isPremium, createdAt: user.createdAt } };
      },
      {
        body: t.Object({
          username: t.Optional(t.String({ minLength: 3, maxLength: 30 })),
          language: t.Optional(t.String()),
        }),
      }
    )
    .delete("/me", async ({ headers, jwt, set }) => {
      const authHeader = headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
      const payload = await jwt.verify(authHeader.slice(7));
      if (!payload) {
        set.status = 401;
        return { error: "Invalid token" };
      }
      const idx = usersDb.findIndex((u) => u.id === payload.sub);
      if (idx === -1) {
        set.status = 404;
        return { error: "User not found" };
      }
      usersDb.splice(idx, 1);
      return { success: true };
    })
    .put(
      "/password",
      async ({ headers, body, jwt, set }) => {
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          set.status = 401;
          return { error: "Unauthorized" };
        }
        const payload = await jwt.verify(authHeader.slice(7));
        if (!payload) {
          set.status = 401;
          return { error: "Invalid token" };
        }
        const user = usersDb.find((u) => u.id === payload.sub);
        if (!user) {
          set.status = 404;
          return { error: "User not found" };
        }
        const valid = await verifyPw(body.currentPassword, user.password);
        if (!valid) {
          set.status = 400;
          return { error: "Invalid current password" };
        }
        user.password = await hashPw(body.newPassword);
        return { success: true };
      },
      {
        body: t.Object({
          currentPassword: t.String(),
          newPassword: t.String({ minLength: 8 }),
        }),
      }
    );
}

// --- Helpers ---

function json(data: object) {
  return JSON.stringify(data);
}

function req(path: string, opts: RequestInit = {}) {
  const { headers: extraHeaders, ...rest } = opts;
  return new Request(`http://localhost${path}`, {
    ...rest,
    headers: { "Content-Type": "application/json", ...(extraHeaders as Record<string, string>) },
  });
}

// --- Tests ---

describe("Auth Routes", () => {
  let app: ReturnType<typeof createAuthTestApp>;

  beforeAll(() => {
    app = createAuthTestApp();
  });

  describe("POST /auth/register", () => {
    test("registers a new user and returns token", async () => {
      const res = await app.handle(req("/auth/register", {
        method: "POST",
        body: json({ email: "new@example.com", username: "newuser", password: "password123" }),
      }));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.email).toBe("new@example.com");
      expect(body.user.username).toBe("newuser");
      expect(body.user.isPremium).toBe(false);
      expect(body.token).toBeTruthy();
    });

    test("rejects duplicate email", async () => {
      const res = await app.handle(req("/auth/register", {
        method: "POST",
        body: json({ email: "new@example.com", username: "other", password: "password123" }),
      }));

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Email already exists");
    });

    test("rejects duplicate username", async () => {
      const res = await app.handle(req("/auth/register", {
        method: "POST",
        body: json({ email: "other@example.com", username: "newuser", password: "password123" }),
      }));

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Username already exists");
    });

    test("validates email format", async () => {
      const res = await app.handle(req("/auth/register", {
        method: "POST",
        body: json({ email: "notanemail", username: "abc", password: "password123" }),
      }));

      expect(res.status).toBe(422);
    });

    test("validates password minimum length", async () => {
      const res = await app.handle(req("/auth/register", {
        method: "POST",
        body: json({ email: "x@y.com", username: "abc", password: "short" }),
      }));

      expect(res.status).toBe(422);
    });

    test("accepts optional language", async () => {
      const res = await app.handle(req("/auth/register", {
        method: "POST",
        body: json({ email: "fr@example.com", username: "fruser", password: "password123", language: "fr" }),
      }));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.language).toBe("fr");
    });
  });

  describe("POST /auth/login", () => {
    test("logs in with valid credentials", async () => {
      const res = await app.handle(req("/auth/login", {
        method: "POST",
        body: json({ email: "new@example.com", password: "password123" }),
      }));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.email).toBe("new@example.com");
      expect(body.token).toBeTruthy();
    });

    test("rejects unknown email", async () => {
      const res = await app.handle(req("/auth/login", {
        method: "POST",
        body: json({ email: "unknown@example.com", password: "password123" }),
      }));

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Invalid credentials");
    });

    test("rejects wrong password", async () => {
      const res = await app.handle(req("/auth/login", {
        method: "POST",
        body: json({ email: "new@example.com", password: "wrongpassword" }),
      }));

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Invalid credentials");
    });
  });

  describe("GET /auth/me", () => {
    test("returns 401 without auth header", async () => {
      const res = await app.handle(req("/auth/me"));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    test("returns 401 with invalid token", async () => {
      const res = await app.handle(req("/auth/me", {
        headers: { Authorization: "Bearer invalid-token" },
      }));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Invalid token");
    });

    test("returns user profile with valid token", async () => {
      // Login to get token
      const loginRes = await app.handle(req("/auth/login", {
        method: "POST",
        body: json({ email: "new@example.com", password: "password123" }),
      }));
      const { token } = await loginRes.json() as { token: string };

      const res = await app.handle(req("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      }));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.email).toBe("new@example.com");
    });

    test("returns 404 when user deleted after token issued", async () => {
      // Register a temporary user
      const regRes = await app.handle(req("/auth/register", {
        method: "POST",
        body: json({ email: "temp@example.com", username: "tempuser", password: "password123" }),
      }));
      const { token } = await regRes.json() as { token: string };

      // Delete via endpoint
      await app.handle(req("/auth/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }));

      // Try to get profile
      const res = await app.handle(req("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      }));

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("User not found");
    });
  });

  describe("PUT /auth/me", () => {
    test("returns 401 without auth header", async () => {
      const res = await app.handle(req("/auth/me", { method: "PUT", body: json({ username: "validname" }) }));
      expect(res.status).toBe(401);
    });

    test("updates username", async () => {
      const loginRes = await app.handle(req("/auth/login", {
        method: "POST",
        body: json({ email: "new@example.com", password: "password123" }),
      }));
      const { token } = await loginRes.json() as { token: string };

      const res = await app.handle(req("/auth/me", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: json({ username: "updatedname" }),
      }));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.username).toBe("updatedname");
    });

    test("updates language", async () => {
      const loginRes = await app.handle(req("/auth/login", {
        method: "POST",
        body: json({ email: "new@example.com", password: "password123" }),
      }));
      const { token } = await loginRes.json() as { token: string };

      const res = await app.handle(req("/auth/me", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: json({ language: "fr" }),
      }));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.language).toBe("fr");
    });

    test("rejects duplicate username from another user", async () => {
      const loginRes = await app.handle(req("/auth/login", {
        method: "POST",
        body: json({ email: "new@example.com", password: "password123" }),
      }));
      const { token } = await loginRes.json() as { token: string };

      // fruser already exists from register test
      const res = await app.handle(req("/auth/me", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: json({ username: "fruser" }),
      }));

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Username already exists");
    });
  });

  describe("DELETE /auth/me", () => {
    test("returns 401 without auth header", async () => {
      const res = await app.handle(req("/auth/me", { method: "DELETE" }));
      expect(res.status).toBe(401);
    });

    test("deletes user account", async () => {
      // Register a user to delete
      const regRes = await app.handle(req("/auth/register", {
        method: "POST",
        body: json({ email: "delete@example.com", username: "deleteuser", password: "password123" }),
      }));
      const { token } = await regRes.json() as { token: string };

      const res = await app.handle(req("/auth/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);

      // Verify user is gone
      const meRes = await app.handle(req("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      }));
      expect(meRes.status).toBe(404);
    });
  });

  describe("PUT /auth/password", () => {
    test("returns 401 without auth header", async () => {
      const res = await app.handle(req("/auth/password", {
        method: "PUT",
        body: json({ currentPassword: "whatever1", newPassword: "whatever2" }),
      }));
      expect(res.status).toBe(401);
    });

    test("changes password successfully", async () => {
      // Register a fresh user
      const regRes = await app.handle(req("/auth/register", {
        method: "POST",
        body: json({ email: "pwchange@example.com", username: "pwuser", password: "oldpassword1" }),
      }));
      const { token } = await regRes.json() as { token: string };

      const res = await app.handle(req("/auth/password", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: json({ currentPassword: "oldpassword1", newPassword: "newpassword1" }),
      }));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);

      // Login with new password
      const loginRes = await app.handle(req("/auth/login", {
        method: "POST",
        body: json({ email: "pwchange@example.com", password: "newpassword1" }),
      }));
      expect(loginRes.status).toBe(200);
    });

    test("rejects wrong current password", async () => {
      const loginRes = await app.handle(req("/auth/login", {
        method: "POST",
        body: json({ email: "pwchange@example.com", password: "newpassword1" }),
      }));
      const { token } = await loginRes.json() as { token: string };

      const res = await app.handle(req("/auth/password", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: json({ currentPassword: "wrongpassword", newPassword: "whatever123" }),
      }));

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid current password");
    });

    test("validates new password minimum length", async () => {
      const loginRes = await app.handle(req("/auth/login", {
        method: "POST",
        body: json({ email: "pwchange@example.com", password: "newpassword1" }),
      }));
      const { token } = await loginRes.json() as { token: string };

      const res = await app.handle(req("/auth/password", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: json({ currentPassword: "newpassword1", newPassword: "short" }),
      }));

      expect(res.status).toBe(422);
    });
  });
});
