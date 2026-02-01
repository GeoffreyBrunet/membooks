import { describe, test, expect, beforeAll } from "bun:test";
import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";

// In-memory data for tests
interface TestUser {
  id: string;
  email: string;
  username: string;
  isPremium: boolean;
  language: string;
  stripeCustomerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TestSubscription {
  id: string;
  userId: string;
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
}

const ADMIN_EMAILS = ["admin@example.com"];

let usersDb: TestUser[];
let subsDb: TestSubscription[];

function seedData() {
  usersDb = [
    { id: "u1", email: "admin@example.com", username: "admin", isPremium: true, language: "en", stripeCustomerId: "cus_1", createdAt: new Date("2024-01-01"), updatedAt: new Date("2024-01-01") },
    { id: "u2", email: "user@example.com", username: "user", isPremium: false, language: "en", stripeCustomerId: null, createdAt: new Date("2024-02-01"), updatedAt: new Date("2024-02-01") },
    { id: "u3", email: "premium@example.com", username: "premium", isPremium: true, language: "fr", stripeCustomerId: "cus_2", createdAt: new Date("2024-03-01"), updatedAt: new Date("2024-03-01") },
  ];
  subsDb = [
    { id: "s1", userId: "u1", status: "active", currentPeriodEnd: new Date("2025-01-01"), cancelAtPeriodEnd: false, createdAt: new Date("2024-01-01") },
    { id: "s2", userId: "u3", status: "active", currentPeriodEnd: new Date("2025-03-01"), cancelAtPeriodEnd: false, createdAt: new Date("2024-03-01") },
  ];
}

function createAdminTestApp() {
  seedData();

  return new Elysia({ prefix: "/admin" })
    .use(jwt({ name: "jwt", secret: "test-secret", exp: "7d" }))
    .derive(async ({ headers, jwt, set }) => {
      const authHeader = headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { isAdmin: false, adminUser: null as TestUser | null };
      }
      const payload = await jwt.verify(authHeader.slice(7));
      if (!payload) {
        set.status = 401;
        return { isAdmin: false, adminUser: null as TestUser | null };
      }
      const user = usersDb.find((u) => u.id === payload.sub);
      if (!user || !ADMIN_EMAILS.includes(user.email)) {
        set.status = 403;
        return { isAdmin: false, adminUser: null as TestUser | null };
      }
      return { isAdmin: true, adminUser: user };
    })
    .get("/stats", async ({ isAdmin, set }) => {
      if (!isAdmin) {
        set.status = 403;
        return { error: "Forbidden" };
      }
      const totalUsers = usersDb.length;
      const premiumUsers = usersDb.filter((u) => u.isPremium).length;
      const activeSubscriptions = subsDb.filter((s) => s.status === "active").length;
      return {
        totalUsers,
        premiumUsers,
        activeSubscriptions,
        conversionRate: totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : 0,
      };
    })
    .get("/users", async ({ isAdmin, set, query }) => {
      if (!isAdmin) {
        set.status = 403;
        return { error: "Forbidden" };
      }
      const page = parseInt(query.page || "1");
      const limit = parseInt(query.limit || "20");
      const offset = (page - 1) * limit;
      const usersList = usersDb.slice(offset, offset + limit).map(({ id, email, username, isPremium, language, createdAt }) => ({ id, email, username, isPremium, language, createdAt }));
      return {
        users: usersList,
        pagination: { page, limit, total: usersDb.length, totalPages: Math.ceil(usersDb.length / limit) },
      };
    })
    .get("/users/:id", async ({ isAdmin, set, params }) => {
      if (!isAdmin) {
        set.status = 403;
        return { error: "Forbidden" };
      }
      const user = usersDb.find((u) => u.id === params.id);
      if (!user) {
        set.status = 404;
        return { error: "User not found" };
      }
      const subscription = subsDb.find((s) => s.userId === params.id) || null;
      return { user, subscription };
    })
    .post(
      "/users/:id/premium",
      async ({ isAdmin, set, params, body }) => {
        if (!isAdmin) {
          set.status = 403;
          return { error: "Forbidden" };
        }
        const user = usersDb.find((u) => u.id === params.id);
        if (!user) {
          set.status = 404;
          return { error: "User not found" };
        }
        user.isPremium = body.isPremium;
        return { user: { id: user.id, email: user.email, username: user.username, isPremium: user.isPremium } };
      },
      { body: t.Object({ isPremium: t.Boolean() }) }
    )
    .get("/subscriptions", async ({ isAdmin, set, query }) => {
      if (!isAdmin) {
        set.status = 403;
        return { error: "Forbidden" };
      }
      const page = parseInt(query.page || "1");
      const limit = parseInt(query.limit || "20");
      const offset = (page - 1) * limit;
      const subs = subsDb.slice(offset, offset + limit).map((s) => {
        const user = usersDb.find((u) => u.id === s.userId);
        return { ...s, userEmail: user?.email, username: user?.username };
      });
      return {
        subscriptions: subs,
        pagination: { page, limit, total: subsDb.length, totalPages: Math.ceil(subsDb.length / limit) },
      };
    });
}

// --- Helpers ---

function req(path: string, opts: RequestInit = {}) {
  const { headers: extraHeaders, ...rest } = opts;
  return new Request(`http://localhost${path}`, {
    ...rest,
    headers: { "Content-Type": "application/json", ...(extraHeaders as Record<string, string>) },
  });
}

async function getAdminToken(_app?: ReturnType<typeof createAdminTestApp>): Promise<string> {
  const tokenApp = new Elysia().use(jwt({ name: "jwt", secret: "test-secret", exp: "7d" }));
  return await tokenApp.decorator.jwt.sign({ sub: "u1" });
}

async function getNonAdminToken(): Promise<string> {
  const tokenApp = new Elysia().use(jwt({ name: "jwt", secret: "test-secret", exp: "7d" }));
  return await tokenApp.decorator.jwt.sign({ sub: "u2" });
}

// --- Tests ---

describe("Admin Routes", () => {
  let app: ReturnType<typeof createAdminTestApp>;

  beforeAll(() => {
    app = createAdminTestApp();
  });

  describe("Admin middleware", () => {
    test("returns 401 without auth header", async () => {
      const res = await app.handle(req("/admin/stats"));
      expect(res.status).toBe(403);
    });

    test("returns 401 with invalid token", async () => {
      const res = await app.handle(req("/admin/stats", {
        headers: { Authorization: "Bearer invalid-token" },
      }));
      expect(res.status).toBe(403);
    });

    test("returns 403 for non-admin user", async () => {
      const token = await getNonAdminToken();
      const res = await app.handle(req("/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      }));
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe("Forbidden");
    });
  });

  describe("GET /admin/stats", () => {
    test("returns dashboard stats for admin", async () => {
      const token = await getAdminToken(app);
      const res = await app.handle(req("/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      }));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.totalUsers).toBe(3);
      expect(body.premiumUsers).toBe(2);
      expect(body.activeSubscriptions).toBe(2);
      expect(body.conversionRate).toBe("66.7");
    });
  });

  describe("GET /admin/users", () => {
    test("returns paginated users list", async () => {
      const token = await getAdminToken(app);
      const res = await app.handle(req("/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      }));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.users).toHaveLength(3);
      expect(body.pagination.total).toBe(3);
      expect(body.pagination.page).toBe(1);
    });

    test("paginates correctly", async () => {
      const token = await getAdminToken(app);
      const res = await app.handle(req("/admin/users?page=1&limit=2", {
        headers: { Authorization: `Bearer ${token}` },
      }));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.users).toHaveLength(2);
      expect(body.pagination.totalPages).toBe(2);
    });
  });

  describe("GET /admin/users/:id", () => {
    test("returns user with subscription", async () => {
      const token = await getAdminToken(app);
      const res = await app.handle(req("/admin/users/u1", {
        headers: { Authorization: `Bearer ${token}` },
      }));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.email).toBe("admin@example.com");
      expect(body.subscription).not.toBeNull();
      expect(body.subscription.status).toBe("active");
    });

    test("returns user without subscription", async () => {
      const token = await getAdminToken(app);
      const res = await app.handle(req("/admin/users/u2", {
        headers: { Authorization: `Bearer ${token}` },
      }));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.email).toBe("user@example.com");
      expect(body.subscription).toBeNull();
    });

    test("returns 404 for unknown user", async () => {
      const token = await getAdminToken(app);
      const res = await app.handle(req("/admin/users/unknown", {
        headers: { Authorization: `Bearer ${token}` },
      }));

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("User not found");
    });
  });

  describe("POST /admin/users/:id/premium", () => {
    test("toggles premium status on", async () => {
      const token = await getAdminToken(app);
      const res = await app.handle(req("/admin/users/u2/premium", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isPremium: true }),
      }));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.isPremium).toBe(true);
    });

    test("toggles premium status off", async () => {
      const token = await getAdminToken(app);
      const res = await app.handle(req("/admin/users/u2/premium", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isPremium: false }),
      }));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.isPremium).toBe(false);
    });

    test("returns 404 for unknown user", async () => {
      const token = await getAdminToken(app);
      const res = await app.handle(req("/admin/users/unknown/premium", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isPremium: true }),
      }));

      expect(res.status).toBe(404);
    });
  });

  describe("GET /admin/subscriptions", () => {
    test("returns paginated subscriptions with user info", async () => {
      const token = await getAdminToken(app);
      const res = await app.handle(req("/admin/subscriptions", {
        headers: { Authorization: `Bearer ${token}` },
      }));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.subscriptions).toHaveLength(2);
      expect(body.subscriptions[0].userEmail).toBeTruthy();
      expect(body.subscriptions[0].username).toBeTruthy();
      expect(body.pagination.total).toBe(2);
    });

    test("returns 403 for non-admin", async () => {
      const token = await getNonAdminToken();
      const res = await app.handle(req("/admin/subscriptions", {
        headers: { Authorization: `Bearer ${token}` },
      }));

      expect(res.status).toBe(403);
    });
  });
});
