import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "../db";
import { users, subscriptions, webhookEvents } from "../db/schema";
import { logger } from "../utils/logger";

const COOKIE_NAME = "membooks_auth";

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
const WEB_URL = process.env.WEB_URL || "https://membooks.com";

export const subscriptionRoutes = new Elysia({ prefix: "/subscription" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
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
    logger.error("subscription route error", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    set.status = 500;
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: "Internal Server Error", message: errorMessage };
  })
  // Create checkout session for subscription
  .post(
    "/checkout",
    async ({ headers, cookie, jwt, set, body }) => {
      const cookieToken = cookie[COOKIE_NAME]?.value as string | undefined;
      const authHeader = headers.authorization;
      const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      const token = cookieToken || headerToken;

      if (!token) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

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

      // Determine redirect URLs based on source (web or mobile)
      const source = (body as any)?.source;
      const isWeb = source === "web";
      const successUrl = isWeb
        ? `${WEB_URL}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`
        : `${APP_URL}subscription/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = isWeb
        ? `${WEB_URL}/subscription?canceled=true`
        : `${APP_URL}subscription/cancel`;

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
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: user.id,
        },
      });

      return { url: session.url };
    },
    {
      detail: { tags: ["Subscription"], summary: "Create checkout session", description: "Create a Stripe checkout session for premium subscription. Send source: 'web' or 'mobile' to control redirect URLs. Requires Bearer token.", security: [{ bearerAuth: [] }] },
    }
  )
  // Get current subscription status
  .get(
    "/status",
    async ({ headers, cookie, jwt, set }) => {
      const cookieToken = cookie[COOKIE_NAME]?.value as string | undefined;
      const authHeader = headers.authorization;
      const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      const token = cookieToken || headerToken;

      if (!token) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

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
    },
    {
      detail: { tags: ["Subscription"], summary: "Get subscription status", description: "Return the current user's premium and subscription status. Requires Bearer token.", security: [{ bearerAuth: [] }] },
    }
  )
  // Cancel subscription
  .post(
    "/cancel",
    async ({ headers, cookie, jwt, set }) => {
      const cookieToken = cookie[COOKIE_NAME]?.value as string | undefined;
      const authHeader = headers.authorization;
      const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      const token = cookieToken || headerToken;

      if (!token) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

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
    },
    {
      detail: { tags: ["Subscription"], summary: "Cancel subscription", description: "Cancel the current subscription at period end. Requires Bearer token.", security: [{ bearerAuth: [] }] },
    }
  )
  // Reactivate subscription (if canceled but still in period)
  .post(
    "/reactivate",
    async ({ headers, cookie, jwt, set }) => {
      const cookieToken = cookie[COOKIE_NAME]?.value as string | undefined;
      const authHeader = headers.authorization;
      const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      const token = cookieToken || headerToken;

      if (!token) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

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
    },
    {
      detail: { tags: ["Subscription"], summary: "Reactivate subscription", description: "Reactivate a canceled subscription before the current period ends. Requires Bearer token.", security: [{ bearerAuth: [] }] },
    }
  );

// Events the webhook is configured to handle
const HANDLED_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
  "invoice.payment_succeeded",
] as const;

// Stripe webhook handler (separate from authenticated routes)
export const webhookRoutes = new Elysia({ prefix: "/webhook" }).post(
  "/stripe",
  async ({ request, set }) => {
    const sig = request.headers.get("stripe-signature");
    const body = await request.text();

    if (!sig) {
      logger.warn("webhook received without signature");
      set.status = 400;
      return { error: "Missing signature" };
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error("STRIPE_WEBHOOK_SECRET is not configured");
      set.status = 500;
      return { error: "Webhook not configured" };
    }

    let event: Stripe.Event;

    try {
      event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      logger.warn("webhook signature verification failed", { error: err.message });
      set.status = 400;
      return { error: `Webhook Error: ${err.message}` };
    }

    // Idempotency: skip already-processed events (Stripe may retry)
    const existing = await db.query.webhookEvents.findFirst({
      where: eq(webhookEvents.stripeEventId, event.id),
    });

    if (existing) {
      logger.info("webhook event already processed, skipping", {
        eventId: event.id,
        eventType: event.type,
      });
      return { received: true };
    }

    logger.info("webhook event received", {
      eventId: event.id,
      eventType: event.type,
      livemode: event.livemode,
    });

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;

          if (userId && session.subscription) {
            const stripeSubscription = await getStripe().subscriptions.retrieve(
              session.subscription as string
            );

            const priceId = stripeSubscription.items.data[0]?.price.id;
            const periodStart = (stripeSubscription as any).current_period_start;
            const periodEnd = (stripeSubscription as any).current_period_end;

            // Upsert: handle retries without failing on duplicate
            const existingSub = await db.query.subscriptions.findFirst({
              where: eq(subscriptions.stripeSubscriptionId, stripeSubscription.id),
            });

            if (existingSub) {
              await db
                .update(subscriptions)
                .set({
                  status: stripeSubscription.status,
                  stripePriceId: priceId || PREMIUM_PRICE_ID,
                  currentPeriodStart: new Date(periodStart * 1000),
                  currentPeriodEnd: new Date(periodEnd * 1000),
                  updatedAt: new Date(),
                })
                .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id));
            } else {
              await db.insert(subscriptions).values({
                userId,
                stripeSubscriptionId: stripeSubscription.id,
                stripePriceId: priceId || PREMIUM_PRICE_ID,
                status: stripeSubscription.status,
                currentPeriodStart: new Date(periodStart * 1000),
                currentPeriodEnd: new Date(periodEnd * 1000),
              });
            }

            await db
              .update(users)
              .set({ isPremium: true, updatedAt: new Date() })
              .where(eq(users.id, userId));

            logger.info("checkout completed", {
              userId,
              subscriptionId: stripeSubscription.id,
              status: stripeSubscription.status,
            });
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

          const sub = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.stripeSubscriptionId, subscription.id),
          });

          if (sub) {
            const isPremium = ["active", "trialing"].includes(subscription.status);
            await db
              .update(users)
              .set({ isPremium, updatedAt: new Date() })
              .where(eq(users.id, sub.userId));

            logger.info("subscription updated", {
              userId: sub.userId,
              subscriptionId: subscription.id,
              status: subscription.status,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            });
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

          const sub = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.stripeSubscriptionId, subscription.id),
          });

          if (sub) {
            await db
              .update(users)
              .set({ isPremium: false, updatedAt: new Date() })
              .where(eq(users.id, sub.userId));

            logger.info("subscription deleted", {
              userId: sub.userId,
              subscriptionId: subscription.id,
            });
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

            logger.warn("invoice payment failed", {
              invoiceId: invoice.id,
              subscriptionId,
            });
          }
          break;
        }

        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = (invoice as any).subscription as string;

          if (subscriptionId) {
            // Re-activate premium on successful renewal payment
            const sub = await db.query.subscriptions.findFirst({
              where: eq(subscriptions.stripeSubscriptionId, subscriptionId),
            });

            if (sub) {
              await db
                .update(subscriptions)
                .set({ status: "active", updatedAt: new Date() })
                .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

              await db
                .update(users)
                .set({ isPremium: true, updatedAt: new Date() })
                .where(eq(users.id, sub.userId));

              logger.info("invoice payment succeeded", {
                invoiceId: invoice.id,
                subscriptionId,
                userId: sub.userId,
              });
            }
          }
          break;
        }

        default:
          logger.info("unhandled webhook event type", { eventType: event.type });
      }

      // Record event as processed for idempotency
      await db.insert(webhookEvents).values({
        stripeEventId: event.id,
        eventType: event.type,
      });
    } catch (err) {
      logger.error("webhook event processing failed", {
        eventId: event.id,
        eventType: event.type,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      set.status = 500;
      return { error: "Event processing failed" };
    }

    return { received: true };
  },
  {
    detail: {
      tags: ["Webhook"],
      summary: "Stripe webhook",
      description: `Production webhook endpoint for Stripe events. Configured events: ${HANDLED_EVENTS.join(", ")}. URL: https://membooks-api.fly.dev/webhook/stripe`,
    },
  }
);
