import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
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
  .use(staticPlugin({
    assets: "src/admin",
    prefix: "/admin-ui",
  }))
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
