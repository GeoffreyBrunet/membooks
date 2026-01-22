import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth";

const app = new Elysia()
  .use(
    cors({
      origin: true,
      credentials: true,
    })
  )
  .get("/", () => ({ message: "Membooks API is running" }))
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .use(authRoutes)
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
