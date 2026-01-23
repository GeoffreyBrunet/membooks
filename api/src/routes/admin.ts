import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { eq, desc, count } from "drizzle-orm";
import { db } from "../db";
import { users, subscriptions } from "../db/schema";

// Simple admin auth - in production, use proper admin roles
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim());

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
      exp: "7d",
    })
  )
  // Middleware to check admin access
  .derive(async ({ headers, jwt, set }) => {
    const authHeader = headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      return { isAdmin: false, adminUser: null };
    }

    const token = authHeader.slice(7);
    const payload = await jwt.verify(token);

    if (!payload) {
      set.status = 401;
      return { isAdmin: false, adminUser: null };
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.sub as string),
    });

    if (!user || !ADMIN_EMAILS.includes(user.email)) {
      set.status = 403;
      return { isAdmin: false, adminUser: null };
    }

    return { isAdmin: true, adminUser: user };
  })
  // Dashboard stats
  .get("/stats", async ({ isAdmin, set }) => {
    if (!isAdmin) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [premiumUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isPremium, true));
    const [activeSubscriptions] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active"));

    return {
      totalUsers: totalUsers.count,
      premiumUsers: premiumUsers.count,
      activeSubscriptions: activeSubscriptions.count,
      conversionRate: totalUsers.count > 0
        ? ((premiumUsers.count / totalUsers.count) * 100).toFixed(1)
        : 0,
    };
  })
  // List all users
  .get("/users", async ({ isAdmin, set, query }) => {
    if (!isAdmin) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const offset = (page - 1) * limit;

    const usersList = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        isPremium: users.isPremium,
        language: users.language,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const [total] = await db.select({ count: count() }).from(users);

    return {
      users: usersList,
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.ceil(total.count / limit),
      },
    };
  })
  // Get single user with subscription
  .get("/users/:id", async ({ isAdmin, set, params }) => {
    if (!isAdmin) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, params.id),
      columns: {
        id: true,
        email: true,
        username: true,
        isPremium: true,
        language: true,
        stripeCustomerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      set.status = 404;
      return { error: "User not found" };
    }

    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, params.id),
    });

    return { user, subscription };
  })
  // Toggle premium status manually
  .post(
    "/users/:id/premium",
    async ({ isAdmin, set, params, body }) => {
      if (!isAdmin) {
        set.status = 403;
        return { error: "Forbidden" };
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          isPremium: body.isPremium,
          updatedAt: new Date(),
        })
        .where(eq(users.id, params.id))
        .returning({
          id: users.id,
          email: users.email,
          username: users.username,
          isPremium: users.isPremium,
        });

      if (!updatedUser) {
        set.status = 404;
        return { error: "User not found" };
      }

      return { user: updatedUser };
    },
    {
      body: t.Object({
        isPremium: t.Boolean(),
      }),
    }
  )
  // List all subscriptions
  .get("/subscriptions", async ({ isAdmin, set, query }) => {
    if (!isAdmin) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const offset = (page - 1) * limit;

    const subs = await db
      .select({
        id: subscriptions.id,
        status: subscriptions.status,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
        createdAt: subscriptions.createdAt,
        userId: subscriptions.userId,
        userEmail: users.email,
        username: users.username,
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(limit)
      .offset(offset);

    const [total] = await db.select({ count: count() }).from(subscriptions);

    return {
      subscriptions: subs,
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.ceil(total.count / limit),
      },
    };
  });
