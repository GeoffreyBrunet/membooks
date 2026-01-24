import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "../db";
import { users, subscriptions } from "../db/schema";

// Lazy initialization of Stripe to allow server startup without API key
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(apiKey);
  }
  return _stripe;
}

const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID || "";
const APP_URL = process.env.APP_URL || "membooks://";

export const subscriptionRoutes = new Elysia({ prefix: "/subscription" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "fallback-secret-for-development",
      exp: "7d",
    })
  )
  // Ensure all responses are JSON
  .onBeforeHandle(({ set }) => {
    set.headers["content-type"] = "application/json";
  })
  // Handle errors in subscription routes
  .onError(({ error, set }) => {
    set.headers["content-type"] = "application/json";
    console.error("Subscription route error:", error);
    set.status = 500;
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: "Internal Server Error", message: errorMessage };
  })
  // Create checkout session for subscription
  .post(
    "/checkout",
    async ({ headers, jwt, set }) => {
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

      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.sub as string),
      });

      if (!user) {
        set.status = 404;
        return { error: "User not found" };
      }

      // Check if user already has an active subscription
      if (user.isPremium) {
        set.status = 400;
        return { error: "Already premium" };
      }

      // Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;

      if (!customerId) {
        const customer = await getStripe().customers.create({
          email: user.email,
          metadata: {
            userId: user.id,
          },
        });
        customerId = customer.id;

        // Save customer ID
        await db
          .update(users)
          .set({ stripeCustomerId: customerId })
          .where(eq(users.id, user.id));
      }

      // Create checkout session
      const session = await getStripe().checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: PREMIUM_PRICE_ID,
            quantity: 1,
          },
        ],
        success_url: `${APP_URL}subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}subscription/cancel`,
        metadata: {
          userId: user.id,
        },
      });

      return { url: session.url };
    }
  )
  // Get current subscription status
  .get(
    "/status",
    async ({ headers, jwt, set }) => {
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

      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.sub as string),
      });

      if (!user) {
        set.status = 404;
        return { error: "User not found" };
      }

      const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, user.id),
      });

      return {
        isPremium: user.isPremium,
        subscription: subscription
          ? {
              status: subscription.status,
              currentPeriodEnd: subscription.currentPeriodEnd,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            }
          : null,
      };
    }
  )
  // Cancel subscription
  .post(
    "/cancel",
    async ({ headers, jwt, set }) => {
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

      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.sub as string),
      });

      if (!user) {
        set.status = 404;
        return { error: "User not found" };
      }

      const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, user.id),
      });

      if (!subscription) {
        set.status = 400;
        return { error: "No active subscription" };
      }

      // Cancel at period end (user keeps access until end of billing period)
      await getStripe().subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      // Update local subscription
      await db
        .update(subscriptions)
        .set({
          cancelAtPeriodEnd: true,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription.id));

      return { success: true };
    }
  )
  // Reactivate subscription (if canceled but still in period)
  .post(
    "/reactivate",
    async ({ headers, jwt, set }) => {
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

      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.sub as string),
      });

      if (!user) {
        set.status = 404;
        return { error: "User not found" };
      }

      const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, user.id),
      });

      if (!subscription || !subscription.cancelAtPeriodEnd) {
        set.status = 400;
        return { error: "No subscription to reactivate" };
      }

      // Reactivate subscription
      await getStripe().subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      // Update local subscription
      await db
        .update(subscriptions)
        .set({
          cancelAtPeriodEnd: false,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription.id));

      return { success: true };
    }
  );

// Stripe webhook handler (separate from authenticated routes)
export const webhookRoutes = new Elysia({ prefix: "/webhook" }).post(
  "/stripe",
  async ({ request, set }) => {
    const sig = request.headers.get("stripe-signature");
    const body = await request.text();

    if (!sig) {
      set.status = 400;
      return { error: "Missing signature" };
    }

    let event: Stripe.Event;

    try {
      event = getStripe().webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      set.status = 400;
      return { error: `Webhook Error: ${err.message}` };
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId && session.subscription) {
          const stripeSubscription = await getStripe().subscriptions.retrieve(
            session.subscription as string
          );

          // Create local subscription record
          const priceId = stripeSubscription.items.data[0]?.price.id;
          const periodStart = (stripeSubscription as any).current_period_start;
          const periodEnd = (stripeSubscription as any).current_period_end;

          await db.insert(subscriptions).values({
            userId,
            stripeSubscriptionId: stripeSubscription.id,
            stripePriceId: priceId || PREMIUM_PRICE_ID,
            status: stripeSubscription.status,
            currentPeriodStart: new Date(periodStart * 1000),
            currentPeriodEnd: new Date(periodEnd * 1000),
          });

          // Update user to premium
          await db
            .update(users)
            .set({ isPremium: true, updatedAt: new Date() })
            .where(eq(users.id, userId));
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const periodStart = (subscription as any).current_period_start;
        const periodEnd = (subscription as any).current_period_end;

        await db
          .update(subscriptions)
          .set({
            status: subscription.status,
            currentPeriodStart: new Date(periodStart * 1000),
            currentPeriodEnd: new Date(periodEnd * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

        // Update user premium status based on subscription status
        const sub = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeSubscriptionId, subscription.id),
        });

        if (sub) {
          const isPremium = ["active", "trialing"].includes(subscription.status);
          await db
            .update(users)
            .set({ isPremium, updatedAt: new Date() })
            .where(eq(users.id, sub.userId));
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await db
          .update(subscriptions)
          .set({
            status: "canceled",
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

        // Remove premium status
        const sub = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeSubscriptionId, subscription.id),
        });

        if (sub) {
          await db
            .update(users)
            .set({ isPremium: false, updatedAt: new Date() })
            .where(eq(users.id, sub.userId));
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;

        if (subscriptionId) {
          await db
            .update(subscriptions)
            .set({
              status: "past_due",
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
        }
        break;
      }
    }

    return { received: true };
  }
);
