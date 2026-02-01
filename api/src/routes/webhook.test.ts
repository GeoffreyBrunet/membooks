import { describe, test, expect, beforeAll } from "bun:test";
import { Elysia } from "elysia";

// In-memory stores simulating the database
interface TestUser {
  id: string;
  email: string;
  username: string;
  isPremium: boolean;
  stripeCustomerId: string | null;
  updatedAt: Date;
}

interface TestSubscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  updatedAt: Date;
}

let usersDb: TestUser[];
let subsDb: TestSubscription[];

function seedData() {
  usersDb = [
    { id: "u1", email: "user@example.com", username: "user", isPremium: false, stripeCustomerId: "cus_1", updatedAt: new Date() },
    { id: "u2", email: "premium@example.com", username: "premium", isPremium: true, stripeCustomerId: "cus_2", updatedAt: new Date() },
  ];
  subsDb = [
    {
      id: "s1",
      userId: "u2",
      stripeSubscriptionId: "sub_existing",
      stripePriceId: "price_premium",
      status: "active",
      currentPeriodStart: new Date("2024-01-01"),
      currentPeriodEnd: new Date("2025-01-01"),
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    },
  ];
}

// Build a test webhook app that mirrors the real webhook handler logic
// but uses in-memory stores instead of the real DB and Stripe SDK
function createWebhookTestApp() {
  seedData();

  return new Elysia({ prefix: "/webhook" }).post("/stripe", async ({ request, set }) => {
    const sig = request.headers.get("stripe-signature");
    const body = await request.text();

    if (!sig) {
      set.status = 400;
      return { error: "Missing signature" };
    }

    // Simulate signature verification
    if (sig === "invalid-signature") {
      set.status = 400;
      return { error: "Webhook Error: No signatures found matching the expected signature for payload." };
    }

    let event: { type: string; data: { object: any } };
    try {
      event = JSON.parse(body);
    } catch {
      set.status = 400;
      return { error: "Webhook Error: Invalid payload" };
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;

        if (userId && session.subscription) {
          // Simulate creating a subscription record
          subsDb.push({
            id: crypto.randomUUID(),
            userId,
            stripeSubscriptionId: session.subscription,
            stripePriceId: session.price_id || "price_premium",
            status: "active",
            currentPeriodStart: new Date(session.current_period_start * 1000),
            currentPeriodEnd: new Date(session.current_period_end * 1000),
            cancelAtPeriodEnd: false,
            updatedAt: new Date(),
          });

          // Update user to premium
          const user = usersDb.find((u) => u.id === userId);
          if (user) {
            user.isPremium = true;
            user.updatedAt = new Date();
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const sub = subsDb.find((s) => s.stripeSubscriptionId === subscription.id);

        if (sub) {
          sub.status = subscription.status;
          sub.currentPeriodStart = new Date(subscription.current_period_start * 1000);
          sub.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
          sub.cancelAtPeriodEnd = subscription.cancel_at_period_end;
          sub.updatedAt = new Date();

          // Update user premium status
          const user = usersDb.find((u) => u.id === sub.userId);
          if (user) {
            user.isPremium = ["active", "trialing"].includes(subscription.status);
            user.updatedAt = new Date();
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const sub = subsDb.find((s) => s.stripeSubscriptionId === subscription.id);

        if (sub) {
          sub.status = "canceled";
          sub.updatedAt = new Date();

          const user = usersDb.find((u) => u.id === sub.userId);
          if (user) {
            user.isPremium = false;
            user.updatedAt = new Date();
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          const sub = subsDb.find((s) => s.stripeSubscriptionId === subscriptionId);
          if (sub) {
            sub.status = "past_due";
            sub.updatedAt = new Date();
          }
        }
        break;
      }
    }

    return { received: true };
  });
}

function webhookRequest(body: object, signature = "valid-sig") {
  return new Request("http://localhost/webhook/stripe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": signature,
    },
    body: JSON.stringify(body),
  });
}

// --- Tests ---

describe("Stripe Webhook — signature validation", () => {
  let app: ReturnType<typeof createWebhookTestApp>;

  beforeAll(() => {
    app = createWebhookTestApp();
  });

  test("should return 400 when stripe-signature header is missing", async () => {
    const res = await app.handle(
      new Request("http://localhost/webhook/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "checkout.session.completed", data: { object: {} } }),
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing signature");
  });

  test("should return 400 when signature is invalid", async () => {
    const res = await app.handle(
      webhookRequest(
        { type: "checkout.session.completed", data: { object: {} } },
        "invalid-signature"
      )
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Webhook Error");
  });

  test("should return 400 for invalid JSON payload", async () => {
    const res = await app.handle(
      new Request("http://localhost/webhook/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "valid-sig",
        },
        body: "not-valid-json",
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Webhook Error");
  });
});

describe("Stripe Webhook — checkout.session.completed", () => {
  test("should create subscription and set user to premium", async () => {
    const app = createWebhookTestApp();

    const res = await app.handle(
      webhookRequest({
        type: "checkout.session.completed",
        data: {
          object: {
            metadata: { userId: "u1" },
            subscription: "sub_new_123",
            price_id: "price_premium",
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
          },
        },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);

    // Verify user is now premium
    expect(usersDb.find((u) => u.id === "u1")!.isPremium).toBe(true);

    // Verify subscription was created
    const sub = subsDb.find((s) => s.stripeSubscriptionId === "sub_new_123");
    expect(sub).toBeDefined();
    expect(sub!.userId).toBe("u1");
    expect(sub!.status).toBe("active");
  });

  test("should ignore event when userId is missing from metadata", async () => {
    const app = createWebhookTestApp();

    const res = await app.handle(
      webhookRequest({
        type: "checkout.session.completed",
        data: {
          object: {
            metadata: {},
            subscription: "sub_orphan",
          },
        },
      })
    );

    expect(res.status).toBe(200);
    // No subscription should be created
    expect(subsDb.find((s) => s.stripeSubscriptionId === "sub_orphan")).toBeUndefined();
  });

  test("should ignore event when subscription is missing", async () => {
    const app = createWebhookTestApp();

    const res = await app.handle(
      webhookRequest({
        type: "checkout.session.completed",
        data: {
          object: {
            metadata: { userId: "u1" },
            subscription: null,
          },
        },
      })
    );

    expect(res.status).toBe(200);
    // User should stay non-premium
    expect(usersDb.find((u) => u.id === "u1")!.isPremium).toBe(false);
  });
});

describe("Stripe Webhook — customer.subscription.updated", () => {
  test("should update subscription status and period dates", async () => {
    const app = createWebhookTestApp();
    const newEnd = Math.floor(Date.now() / 1000) + 60 * 86400;

    const res = await app.handle(
      webhookRequest({
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_existing",
            status: "active",
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: newEnd,
            cancel_at_period_end: false,
          },
        },
      })
    );

    expect(res.status).toBe(200);
    const sub = subsDb.find((s) => s.stripeSubscriptionId === "sub_existing")!;
    expect(sub.currentPeriodEnd.getTime()).toBe(newEnd * 1000);
  });

  test("should set user premium to false when status becomes past_due", async () => {
    const app = createWebhookTestApp();

    const res = await app.handle(
      webhookRequest({
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_existing",
            status: "past_due",
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
            cancel_at_period_end: false,
          },
        },
      })
    );

    expect(res.status).toBe(200);
    expect(usersDb.find((u) => u.id === "u2")!.isPremium).toBe(false);
  });

  test("should keep user premium when status is trialing", async () => {
    const app = createWebhookTestApp();

    const res = await app.handle(
      webhookRequest({
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_existing",
            status: "trialing",
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 14 * 86400,
            cancel_at_period_end: false,
          },
        },
      })
    );

    expect(res.status).toBe(200);
    expect(usersDb.find((u) => u.id === "u2")!.isPremium).toBe(true);
  });

  test("should update cancelAtPeriodEnd flag", async () => {
    const app = createWebhookTestApp();

    await app.handle(
      webhookRequest({
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_existing",
            status: "active",
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
            cancel_at_period_end: true,
          },
        },
      })
    );

    const sub = subsDb.find((s) => s.stripeSubscriptionId === "sub_existing")!;
    expect(sub.cancelAtPeriodEnd).toBe(true);
  });

  test("should ignore update for unknown subscription", async () => {
    const app = createWebhookTestApp();

    const res = await app.handle(
      webhookRequest({
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_nonexistent",
            status: "active",
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
            cancel_at_period_end: false,
          },
        },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
  });
});

describe("Stripe Webhook — customer.subscription.deleted", () => {
  test("should set subscription status to canceled and remove premium", async () => {
    const app = createWebhookTestApp();

    expect(usersDb.find((u) => u.id === "u2")!.isPremium).toBe(true);

    const res = await app.handle(
      webhookRequest({
        type: "customer.subscription.deleted",
        data: {
          object: { id: "sub_existing" },
        },
      })
    );

    expect(res.status).toBe(200);
    const sub = subsDb.find((s) => s.stripeSubscriptionId === "sub_existing")!;
    expect(sub.status).toBe("canceled");
    expect(usersDb.find((u) => u.id === "u2")!.isPremium).toBe(false);
  });

  test("should handle deletion of unknown subscription gracefully", async () => {
    const app = createWebhookTestApp();

    const res = await app.handle(
      webhookRequest({
        type: "customer.subscription.deleted",
        data: {
          object: { id: "sub_ghost" },
        },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
  });
});

describe("Stripe Webhook — invoice.payment_failed", () => {
  test("should set subscription status to past_due", async () => {
    const app = createWebhookTestApp();

    const res = await app.handle(
      webhookRequest({
        type: "invoice.payment_failed",
        data: {
          object: { subscription: "sub_existing" },
        },
      })
    );

    expect(res.status).toBe(200);
    const sub = subsDb.find((s) => s.stripeSubscriptionId === "sub_existing")!;
    expect(sub.status).toBe("past_due");
  });

  test("should ignore payment failure without subscription ID", async () => {
    const app = createWebhookTestApp();

    const res = await app.handle(
      webhookRequest({
        type: "invoice.payment_failed",
        data: {
          object: { subscription: null },
        },
      })
    );

    expect(res.status).toBe(200);
    // Existing subscription should not be affected
    const sub = subsDb.find((s) => s.stripeSubscriptionId === "sub_existing")!;
    expect(sub.status).toBe("active");
  });

  test("should handle unknown subscription gracefully", async () => {
    const app = createWebhookTestApp();

    const res = await app.handle(
      webhookRequest({
        type: "invoice.payment_failed",
        data: {
          object: { subscription: "sub_unknown" },
        },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
  });
});

describe("Stripe Webhook — unknown event type", () => {
  test("should acknowledge unknown event types", async () => {
    const app = createWebhookTestApp();

    const res = await app.handle(
      webhookRequest({
        type: "some.unknown.event",
        data: { object: {} },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
  });
});
