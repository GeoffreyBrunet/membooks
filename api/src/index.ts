import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth";
import { subscriptionRoutes, webhookRoutes } from "./routes/subscription";
import { adminRoutes } from "./routes/admin";

const app = new Elysia()
  .use(
    cors({
      origin: true,
      credentials: true,
    })
  )
  // Global error handler to ensure JSON responses
  .onError(({ code, error, set }) => {
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

    console.error("Server error:", error);
    set.status = 500;
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: "Internal Server Error", message: errorMessage };
  })
  .get("/", () => ({ message: "Membooks API is running" }))
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .use(authRoutes)
  .use(subscriptionRoutes)
  .use(webhookRoutes)
  .use(adminRoutes)
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
