import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { hashPassword, verifyPassword } from "../utils/password";
import { RateLimiter } from "../utils/rateLimiter";

// 5 attempts per minute for login, 10 per minute for register
export const loginLimiter = new RateLimiter({ maxRequests: 5, windowMs: 60_000 });
export const registerLimiter = new RateLimiter({ maxRequests: 10, windowMs: 60_000 });

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
      exp: "7d",
    })
  )
  .post(
    "/register",
    async ({ body, jwt, set }) => {
      const { email, username, password, language } = body;

      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser) {
        set.status = 400;
        return { error: "Email already exists" };
      }

      const existingUsername = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (existingUsername) {
        set.status = 400;
        return { error: "Username already exists" };
      }

      const hashedPassword = await hashPassword(password);

      const [newUser] = await db
        .insert(users)
        .values({
          email,
          username,
          password: hashedPassword,
          language: language || "en",
        })
        .returning({
          id: users.id,
          email: users.email,
          username: users.username,
          language: users.language,
          isPremium: users.isPremium,
          createdAt: users.createdAt,
        });

      const token = await jwt.sign({
        sub: newUser.id,
        email: newUser.email,
      });

      return {
        user: newUser,
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
      beforeHandle: ({ request, set }) => {
        const ip = getClientIp(request);
        const result = registerLimiter.check(ip);
        set.headers["x-ratelimit-limit"] = "10";
        set.headers["x-ratelimit-remaining"] = String(result.remaining);
        set.headers["x-ratelimit-reset"] = String(Math.ceil(result.resetAt / 1000));
        if (result.limited) {
          set.status = 429;
          return { error: "Too many requests", message: "Too many registration attempts. Please try again later." };
        }
      },
      detail: { tags: ["Auth"], summary: "Register", description: "Create a new user account and return a JWT token." },
    }
  )
  .post(
    "/login",
    async ({ body, jwt, set }) => {
      const { email, password } = body;

      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      const isValidPassword = await verifyPassword(password, user.password);

      if (!isValidPassword) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      const token = await jwt.sign({
        sub: user.id,
        email: user.email,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          language: user.language,
          isPremium: user.isPremium,
          createdAt: user.createdAt,
        },
        token,
      };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String(),
      }),
      beforeHandle: ({ request, set }) => {
        const ip = getClientIp(request);
        const result = loginLimiter.check(ip);
        set.headers["x-ratelimit-limit"] = "5";
        set.headers["x-ratelimit-remaining"] = String(result.remaining);
        set.headers["x-ratelimit-reset"] = String(Math.ceil(result.resetAt / 1000));
        if (result.limited) {
          set.status = 429;
          return { error: "Too many requests", message: "Too many login attempts. Please try again later." };
        }
      },
      detail: { tags: ["Auth"], summary: "Login", description: "Authenticate with email and password, returns a JWT token." },
    }
  )
  .get(
    "/me",
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
        columns: {
          id: true,
          email: true,
          username: true,
          language: true,
          isPremium: true,
          createdAt: true,
        },
      });

      if (!user) {
        set.status = 404;
        return { error: "User not found" };
      }

      return { user };
    },
    {
      detail: { tags: ["Auth"], summary: "Get current user", description: "Return the authenticated user's profile. Requires Bearer token.", security: [{ bearerAuth: [] }] },
    }
  )
  .put(
    "/me",
    async ({ headers, body, jwt, set }) => {
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

      const { username, language } = body;

      if (username) {
        const existingUsername = await db.query.users.findFirst({
          where: eq(users.username, username),
        });

        if (existingUsername && existingUsername.id !== payload.sub) {
          set.status = 400;
          return { error: "Username already exists" };
        }
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          ...(username && { username }),
          ...(language && { language }),
          updatedAt: new Date(),
        })
        .where(eq(users.id, payload.sub as string))
        .returning({
          id: users.id,
          email: users.email,
          username: users.username,
          language: users.language,
          isPremium: users.isPremium,
          createdAt: users.createdAt,
        });

      return { user: updatedUser };
    },
    {
      body: t.Object({
        username: t.Optional(t.String({ minLength: 3, maxLength: 30 })),
        language: t.Optional(t.String()),
      }),
      detail: { tags: ["Auth"], summary: "Update profile", description: "Update the authenticated user's username or language. Requires Bearer token.", security: [{ bearerAuth: [] }] },
    }
  )
  .delete(
    "/me",
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

      await db.delete(users).where(eq(users.id, payload.sub as string));

      return { success: true };
    },
    {
      detail: { tags: ["Auth"], summary: "Delete account", description: "Permanently delete the authenticated user's account. Requires Bearer token.", security: [{ bearerAuth: [] }] },
    }
  )
  .put(
    "/password",
    async ({ headers, body, jwt, set }) => {
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

      const { currentPassword, newPassword } = body;

      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.sub as string),
      });

      if (!user) {
        set.status = 404;
        return { error: "User not found" };
      }

      const isValidPassword = await verifyPassword(currentPassword, user.password);

      if (!isValidPassword) {
        set.status = 400;
        return { error: "Invalid current password" };
      }

      const hashedPassword = await hashPassword(newPassword);

      await db
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, payload.sub as string));

      return { success: true };
    },
    {
      body: t.Object({
        currentPassword: t.String(),
        newPassword: t.String({ minLength: 8 }),
      }),
      detail: { tags: ["Auth"], summary: "Change password", description: "Change the authenticated user's password. Requires Bearer token.", security: [{ bearerAuth: [] }] },
    }
  );
