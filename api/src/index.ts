import "./utils/env";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { authRoutes } from "./routes/auth";
import { subscriptionRoutes, webhookRoutes } from "./routes/subscription";
import { adminRoutes } from "./routes/admin";
import { logger } from "./utils/logger";

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : [];

const requestTimings = new WeakMap<Request, number>();

const app = new Elysia()
  .use(
    cors({
      origin: allowedOrigins.length > 0 ? allowedOrigins : true,
      credentials: true,
    })
  )
  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: {
          title: "Membooks API",
          version: "1.0.0",
          description:
            "API for Membooks — a book tracking application. Manage user accounts, premium subscriptions via Stripe, and admin operations.",
        },
        tags: [
          { name: "General", description: "Health check and root endpoints" },
          { name: "Auth", description: "User authentication and account management" },
          { name: "Subscription", description: "Premium subscription management via Stripe" },
          { name: "Webhook", description: "Stripe webhook handler" },
          { name: "Admin", description: "Admin dashboard and user management" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
      },
    })
  )
  .onAfterHandle(({ set }) => {
    set.headers["strict-transport-security"] = "max-age=63072000; includeSubDomains; preload";
    set.headers["x-content-type-options"] = "nosniff";
    set.headers["x-frame-options"] = "DENY";
    set.headers["x-xss-protection"] = "0";
    set.headers["referrer-policy"] = "strict-origin-when-cross-origin";
    set.headers["permissions-policy"] = "camera=(), microphone=(), geolocation=()";
  })
  .onRequest(({ request }) => {
    requestTimings.set(request, performance.now());
  })
  .onAfterResponse(({ request, set }) => {
    const start = requestTimings.get(request);
    requestTimings.delete(request);
    const url = new URL(request.url);
    if (url.pathname === "/health") return;
    logger.info("request completed", {
      method: request.method,
      path: url.pathname,
      status: set.status ?? 200,
      duration_ms: start ? Math.round(performance.now() - start) : undefined,
    });
  })
  // Global error handler to ensure JSON responses
  .onError(({ code, error, set, request }) => {
    set.headers["content-type"] = "application/json";

    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "Not Found", message: "The requested endpoint does not exist" };
    }

    if (code === "VALIDATION") {
      set.status = 400;
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { error: "Validation Error", message: errorMessage };
    }

    const url = new URL(request.url);
    logger.error("server error", {
      method: request.method,
      path: url.pathname,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    set.status = 500;
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: "Internal Server Error", message: errorMessage };
  })
  .get("/", () => ({ message: "Membooks API is running" }), {
    detail: { tags: ["General"], summary: "Root", description: "Returns a simple message confirming the API is running." },
  })
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }), {
    detail: { tags: ["General"], summary: "Health check", description: "Returns the current health status and server timestamp." },
  })
  .use(authRoutes)
  .use(subscriptionRoutes)
  .use(webhookRoutes)
  .use(adminRoutes)
  .listen(process.env.PORT || 3000);

logger.info("server started", {
  hostname: app.server?.hostname,
  port: app.server?.port,
});

export type App = typeof app;
