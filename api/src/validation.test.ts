import { describe, test, expect, beforeAll } from "bun:test";
import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";

// Test app that mirrors all validated endpoints
function createValidationTestApp() {
  return new Elysia({ prefix: "/auth" })
    .use(jwt({ name: "jwt", secret: "test-secret", exp: "7d" }))
    .post(
      "/register",
      async ({ body }) => ({ success: true }),
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
      async ({ body }) => ({ success: true }),
      {
        body: t.Object({
          email: t.String({ format: "email" }),
          password: t.String(),
        }),
      }
    )
    .put(
      "/me",
      async ({ body }) => ({ success: true }),
      {
        body: t.Object({
          username: t.Optional(t.String({ minLength: 3, maxLength: 30 })),
          language: t.Optional(t.String()),
        }),
      }
    )
    .put(
      "/password",
      async ({ body }) => ({ success: true }),
      {
        body: t.Object({
          currentPassword: t.String(),
          newPassword: t.String({ minLength: 8 }),
        }),
      }
    );
}

function createAdminValidationApp() {
  return new Elysia({ prefix: "/admin" }).post(
    "/users/:id/premium",
    async ({ body }) => ({ success: true }),
    { body: t.Object({ isPremium: t.Boolean() }) }
  );
}

function req(path: string, body: object) {
  return new Request(`http://localhost${path}`, {
    method: path.includes("/login") || path.includes("/register") || path.includes("/premium") ? "POST" : "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// --- Registration validation ---

describe("Input Validation — POST /auth/register", () => {
  let app: ReturnType<typeof createValidationTestApp>;

  beforeAll(() => {
    app = createValidationTestApp();
  });

  test("should reject missing email", async () => {
    const res = await app.handle(req("/auth/register", { username: "abc", password: "password123" }));
    expect(res.status).toBe(422);
  });

  test("should reject invalid email format", async () => {
    const res = await app.handle(req("/auth/register", { email: "not-email", username: "abc", password: "password123" }));
    expect(res.status).toBe(422);
  });

  test("should reject email without domain", async () => {
    const res = await app.handle(req("/auth/register", { email: "user@", username: "abc", password: "password123" }));
    expect(res.status).toBe(422);
  });

  test("should reject missing username", async () => {
    const res = await app.handle(req("/auth/register", { email: "a@b.com", password: "password123" }));
    expect(res.status).toBe(422);
  });

  test("should reject username shorter than 3 characters", async () => {
    const res = await app.handle(req("/auth/register", { email: "a@b.com", username: "ab", password: "password123" }));
    expect(res.status).toBe(422);
  });

  test("should reject username longer than 30 characters", async () => {
    const res = await app.handle(req("/auth/register", { email: "a@b.com", username: "a".repeat(31), password: "password123" }));
    expect(res.status).toBe(422);
  });

  test("should reject missing password", async () => {
    const res = await app.handle(req("/auth/register", { email: "a@b.com", username: "abc" }));
    expect(res.status).toBe(422);
  });

  test("should reject password shorter than 8 characters", async () => {
    const res = await app.handle(req("/auth/register", { email: "a@b.com", username: "abc", password: "1234567" }));
    expect(res.status).toBe(422);
  });

  test("should accept exactly 8 character password", async () => {
    const res = await app.handle(req("/auth/register", { email: "a@b.com", username: "abc", password: "12345678" }));
    expect(res.status).toBe(200);
  });

  test("should accept exactly 3 character username", async () => {
    const res = await app.handle(req("/auth/register", { email: "a@b.com", username: "abc", password: "12345678" }));
    expect(res.status).toBe(200);
  });

  test("should accept exactly 30 character username", async () => {
    const res = await app.handle(req("/auth/register", { email: "a@b.com", username: "a".repeat(30), password: "12345678" }));
    expect(res.status).toBe(200);
  });

  test("should accept optional language field", async () => {
    const res = await app.handle(req("/auth/register", { email: "a@b.com", username: "abc", password: "12345678", language: "fr" }));
    expect(res.status).toBe(200);
  });

  test("should accept missing language field", async () => {
    const res = await app.handle(req("/auth/register", { email: "a@b.com", username: "abc", password: "12345678" }));
    expect(res.status).toBe(200);
  });

  test("should reject empty body", async () => {
    const res = await app.handle(req("/auth/register", {}));
    expect(res.status).toBe(422);
  });

  test("should reject non-object body", async () => {
    const res = await app.handle(
      new Request("http://localhost/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify("just a string"),
      })
    );
    expect(res.status).toBe(422);
  });
});

// --- Login validation ---

describe("Input Validation — POST /auth/login", () => {
  let app: ReturnType<typeof createValidationTestApp>;

  beforeAll(() => {
    app = createValidationTestApp();
  });

  test("should reject missing email", async () => {
    const res = await app.handle(req("/auth/login", { password: "password123" }));
    expect(res.status).toBe(422);
  });

  test("should reject invalid email format", async () => {
    const res = await app.handle(req("/auth/login", { email: "bademail", password: "password123" }));
    expect(res.status).toBe(422);
  });

  test("should reject missing password", async () => {
    const res = await app.handle(req("/auth/login", { email: "a@b.com" }));
    expect(res.status).toBe(422);
  });

  test("should accept any length password (no minLength on login)", async () => {
    const res = await app.handle(req("/auth/login", { email: "a@b.com", password: "x" }));
    expect(res.status).toBe(200);
  });

  test("should reject empty body", async () => {
    const res = await app.handle(req("/auth/login", {}));
    expect(res.status).toBe(422);
  });
});

// --- Update profile validation ---

describe("Input Validation — PUT /auth/me", () => {
  let app: ReturnType<typeof createValidationTestApp>;

  beforeAll(() => {
    app = createValidationTestApp();
  });

  test("should accept empty object (both fields optional)", async () => {
    const res = await app.handle(
      new Request("http://localhost/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(200);
  });

  test("should reject username shorter than 3 characters", async () => {
    const res = await app.handle(
      new Request("http://localhost/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "ab" }),
      })
    );
    expect(res.status).toBe(422);
  });

  test("should reject username longer than 30 characters", async () => {
    const res = await app.handle(
      new Request("http://localhost/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "a".repeat(31) }),
      })
    );
    expect(res.status).toBe(422);
  });

  test("should accept valid username only", async () => {
    const res = await app.handle(
      new Request("http://localhost/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "validname" }),
      })
    );
    expect(res.status).toBe(200);
  });

  test("should accept language only", async () => {
    const res = await app.handle(
      new Request("http://localhost/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: "fr" }),
      })
    );
    expect(res.status).toBe(200);
  });
});

// --- Password change validation ---

describe("Input Validation — PUT /auth/password", () => {
  let app: ReturnType<typeof createValidationTestApp>;

  beforeAll(() => {
    app = createValidationTestApp();
  });

  test("should reject missing currentPassword", async () => {
    const res = await app.handle(
      new Request("http://localhost/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: "newpassword123" }),
      })
    );
    expect(res.status).toBe(422);
  });

  test("should reject missing newPassword", async () => {
    const res = await app.handle(
      new Request("http://localhost/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: "oldpassword1" }),
      })
    );
    expect(res.status).toBe(422);
  });

  test("should reject newPassword shorter than 8 characters", async () => {
    const res = await app.handle(
      new Request("http://localhost/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: "oldpassword1", newPassword: "short" }),
      })
    );
    expect(res.status).toBe(422);
  });

  test("should accept valid password change payload", async () => {
    const res = await app.handle(
      new Request("http://localhost/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: "oldpassword1", newPassword: "newpassword1" }),
      })
    );
    expect(res.status).toBe(200);
  });
});

// --- Admin toggle premium validation ---

describe("Input Validation — POST /admin/users/:id/premium", () => {
  let app: ReturnType<typeof createAdminValidationApp>;

  beforeAll(() => {
    app = createAdminValidationApp();
  });

  test("should reject missing isPremium", async () => {
    const res = await app.handle(
      new Request("http://localhost/admin/users/u1/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(422);
  });

  test("should reject non-boolean isPremium", async () => {
    const res = await app.handle(
      new Request("http://localhost/admin/users/u1/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPremium: "yes" }),
      })
    );
    expect(res.status).toBe(422);
  });

  test("should accept boolean true", async () => {
    const res = await app.handle(
      new Request("http://localhost/admin/users/u1/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPremium: true }),
      })
    );
    expect(res.status).toBe(200);
  });

  test("should accept boolean false", async () => {
    const res = await app.handle(
      new Request("http://localhost/admin/users/u1/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPremium: false }),
      })
    );
    expect(res.status).toBe(200);
  });
});
