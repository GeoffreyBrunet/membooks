import { describe, test, expect, beforeAll } from "bun:test";
import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";

// In-memory stores
interface TestUser {
  id: string;
  email: string;
  username: string;
  isPremium: boolean;
  stripeCustomerId: string | null;
}

interface TestSubscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

let usersDb: TestUser[];
let subsDb: TestSubscription[];

function seedData() {
  usersDb = [
    { id: "u1", email: "free@example.com", username: "freeuser", isPremium: false, stripeCustomerId: null },
    { id: "u2", email: "premium@example.com", username: "premuser", isPremium: true, stripeCustomerId: "cus_2" },
    { id: "u3", email: "canceled@example.com", username: "canceluser", isPremium: true, stripeCustomerId: "cus_3" },
    { id: "u4", email: "nosub@example.com", username: "nosubuser", isPremium: false, stripeCustomerId: "cus_4" },
  ];
  subsDb = [
    { id: "s1", userId: "u2", stripeSubscriptionId: "sub_active", status: "active", currentPeriodEnd: new Date("2026-06-01"), cancelAtPeriodEnd: false },
    { id: "s2", userId: "u3", stripeSubscriptionId: "sub_canceling", status: "active", currentPeriodEnd: new Date("2026-06-01"), cancelAtPeriodEnd: true },
  ];
}

function createSubscriptionTestApp() {
  seedData();

  return new Elysia({ prefix: "/subscription" })
    .use(jwt({ name: "jwt", secret: "test-secret", exp: "7d" }))
    .onBeforeHandle(({ set }) => {
      set.headers["content-type"] = "application/json";
    })
    .post("/checkout", async ({ headers, jwt, set }) => {
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
      if (user.isPremium) {
        set.status = 400;
        return { error: "Already premium" };
      }
      return { url: "https://checkout.stripe.com/test_session" };
    })
    .get("/status", async ({ headers, jwt, set }) => {
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
      const subscription = subsDb.find((s) => s.userId === user.id) || null;
      return {
        isPremium: user.isPremium,
        subscription: subscription
          ? { status: subscription.status, currentPeriodEnd: subscription.currentPeriodEnd, cancelAtPeriodEnd: subscription.cancelAtPeriodEnd }
          : null,
      };
    })
    .post("/cancel", async ({ headers, jwt, set }) => {
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
      const subscription = subsDb.find((s) => s.userId === user.id);
      if (!subscription) {
        set.status = 400;
        return { error: "No active subscription" };
      }
      subscription.cancelAtPeriodEnd = true;
      return { success: true };
    })
    .post("/reactivate", async ({ headers, jwt, set }) => {
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
      const subscription = subsDb.find((s) => s.userId === user.id);
      if (!subscription || !subscription.cancelAtPeriodEnd) {
        set.status = 400;
        return { error: "No subscription to reactivate" };
      }
      subscription.cancelAtPeriodEnd = false;
      return { success: true };
    });
}

// --- Helpers ---

async function getToken(sub: string): Promise<string> {
  const tokenApp = new Elysia().use(jwt({ name: "jwt", secret: "test-secret", exp: "7d" }));
  return await tokenApp.decorator.jwt.sign({ sub });
}

function req(path: string, opts: RequestInit = {}) {
  const { headers: extraHeaders, ...rest } = opts;
  return new Request(`http://localhost${path}`, {
    ...rest,
    headers: { "Content-Type": "application/json", ...(extraHeaders as Record<string, string>) },
  });
}

// --- Tests ---

describe("POST /subscription/checkout", () => {
  let app: ReturnType<typeof createSubscriptionTestApp>;

  beforeAll(() => {
    app = createSubscriptionTestApp();
  });

  test("should return 401 without auth header", async () => {
    const res = await app.handle(req("/subscription/checkout", { method: "POST" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  test("should return 401 with invalid token", async () => {
    const res = await app.handle(req("/subscription/checkout", {
      method: "POST",
      headers: { Authorization: "Bearer bad-token" },
    }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid token");
  });

  test("should return checkout URL for free user", async () => {
    const token = await getToken("u1");
    const res = await app.handle(req("/subscription/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBeTruthy();
    expect(body.url).toContain("stripe.com");
  });

  test("should return 400 when user is already premium", async () => {
    const token = await getToken("u2");
    const res = await app.handle(req("/subscription/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Already premium");
  });

  test("should return 404 when user does not exist", async () => {
    const token = await getToken("nonexistent");
    const res = await app.handle(req("/subscription/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("User not found");
  });
});

describe("GET /subscription/status", () => {
  let app: ReturnType<typeof createSubscriptionTestApp>;

  beforeAll(() => {
    app = createSubscriptionTestApp();
  });

  test("should return 401 without auth header", async () => {
    const res = await app.handle(req("/subscription/status"));
    expect(res.status).toBe(401);
  });

  test("should return non-premium status for free user", async () => {
    const token = await getToken("u1");
    const res = await app.handle(req("/subscription/status", {
      headers: { Authorization: `Bearer ${token}` },
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isPremium).toBe(false);
    expect(body.subscription).toBeNull();
  });

  test("should return premium status with active subscription", async () => {
    const token = await getToken("u2");
    const res = await app.handle(req("/subscription/status", {
      headers: { Authorization: `Bearer ${token}` },
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isPremium).toBe(true);
    expect(body.subscription).not.toBeNull();
    expect(body.subscription.status).toBe("active");
    expect(body.subscription.cancelAtPeriodEnd).toBe(false);
  });

  test("should return subscription with cancelAtPeriodEnd flag", async () => {
    const token = await getToken("u3");
    const res = await app.handle(req("/subscription/status", {
      headers: { Authorization: `Bearer ${token}` },
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isPremium).toBe(true);
    expect(body.subscription.cancelAtPeriodEnd).toBe(true);
  });

  test("should return 404 for deleted user", async () => {
    const token = await getToken("nonexistent");
    const res = await app.handle(req("/subscription/status", {
      headers: { Authorization: `Bearer ${token}` },
    }));
    expect(res.status).toBe(404);
  });

  test("should return JSON content-type", async () => {
    const res = await app.handle(req("/subscription/status"));
    const contentType = res.headers.get("content-type");
    expect(contentType).toContain("application/json");
  });
});

describe("POST /subscription/cancel", () => {
  test("should return 401 without auth header", async () => {
    const app = createSubscriptionTestApp();
    const res = await app.handle(req("/subscription/cancel", { method: "POST" }));
    expect(res.status).toBe(401);
  });

  test("should cancel an active subscription", async () => {
    const app = createSubscriptionTestApp();
    const token = await getToken("u2");
    const res = await app.handle(req("/subscription/cancel", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify cancelAtPeriodEnd is set
    expect(subsDb.find((s) => s.userId === "u2")!.cancelAtPeriodEnd).toBe(true);
  });

  test("should return 400 when user has no subscription", async () => {
    const app = createSubscriptionTestApp();
    const token = await getToken("u4");
    const res = await app.handle(req("/subscription/cancel", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("No active subscription");
  });

  test("should return 404 for nonexistent user", async () => {
    const app = createSubscriptionTestApp();
    const token = await getToken("nonexistent");
    const res = await app.handle(req("/subscription/cancel", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }));
    expect(res.status).toBe(404);
  });
});

describe("POST /subscription/reactivate", () => {
  test("should return 401 without auth header", async () => {
    const app = createSubscriptionTestApp();
    const res = await app.handle(req("/subscription/reactivate", { method: "POST" }));
    expect(res.status).toBe(401);
  });

  test("should reactivate a canceled subscription", async () => {
    const app = createSubscriptionTestApp();
    const token = await getToken("u3");
    const res = await app.handle(req("/subscription/reactivate", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify cancelAtPeriodEnd is unset
    expect(subsDb.find((s) => s.userId === "u3")!.cancelAtPeriodEnd).toBe(false);
  });

  test("should return 400 when subscription is not pending cancellation", async () => {
    const app = createSubscriptionTestApp();
    const token = await getToken("u2");
    const res = await app.handle(req("/subscription/reactivate", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("No subscription to reactivate");
  });

  test("should return 400 when user has no subscription at all", async () => {
    const app = createSubscriptionTestApp();
    const token = await getToken("u4");
    const res = await app.handle(req("/subscription/reactivate", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("No subscription to reactivate");
  });

  test("should return 404 for nonexistent user", async () => {
    const app = createSubscriptionTestApp();
    const token = await getToken("nonexistent");
    const res = await app.handle(req("/subscription/reactivate", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }));
    expect(res.status).toBe(404);
  });
});
