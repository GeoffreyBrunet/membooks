import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { hashPassword, verifyPassword } from "../utils/password";

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
    }
  );
