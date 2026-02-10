import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { pushTokens, users } from "../db/schema";
import { logger } from "../utils/logger";

const COOKIE_NAME = "membooks_auth";

export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  const message = {
    to: pushToken,
    sound: "default" as const,
    title,
    body,
    data,
  };

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  const result = await response.json();

  if (!response.ok) {
    logger.error("push notification failed", { pushToken, result });
  }

  return result;
}

export const notificationRoutes = new Elysia({ prefix: "/notifications" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
      exp: "7d",
    })
  )
  .post(
    "/register-token",
    async ({ body, headers, cookie, jwt, set }) => {
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

      const userId = payload.sub as string;

      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        set.status = 404;
        return { error: "User not found" };
      }

      const { token: pushToken, platform } = body;

      // Upsert: check if token already exists for this user
      const existing = await db.query.pushTokens.findFirst({
        where: and(
          eq(pushTokens.userId, userId),
          eq(pushTokens.token, pushToken)
        ),
      });

      if (existing) {
        return { success: true, message: "Token already registered" };
      }

      await db.insert(pushTokens).values({
        userId,
        token: pushToken,
        platform,
      });

      return { success: true };
    },
    {
      body: t.Object({
        token: t.String(),
        platform: t.String(),
      }),
      detail: {
        tags: ["Notifications"],
        summary: "Register push token",
        description: "Register an Expo push token for the authenticated user.",
        security: [{ bearerAuth: [] }],
      },
    }
  )
  .delete(
    "/token",
    async ({ body, headers, cookie, jwt, set }) => {
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

      const userId = payload.sub as string;
      const { token: pushToken } = body;

      await db
        .delete(pushTokens)
        .where(
          and(
            eq(pushTokens.userId, userId),
            eq(pushTokens.token, pushToken)
          )
        );

      return { success: true };
    },
    {
      body: t.Object({
        token: t.String(),
      }),
      detail: {
        tags: ["Notifications"],
        summary: "Remove push token",
        description: "Remove an Expo push token for the authenticated user (e.g. on logout).",
        security: [{ bearerAuth: [] }],
      },
    }
  );
