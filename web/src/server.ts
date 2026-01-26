import { Elysia } from "elysia";
import index from "./index.html";

const API_URL = process.env.API_URL || "http://localhost:3000";

const app = new Elysia()
  // Serve the frontend
  .get("/", index)
  .get("/login", index)
  .get("/register", index)
  .get("/library", index)
  .get("/search", index)
  .get("/statistics", index)
  .get("/profile", index)
  .get("/subscription", index)
  .get("/admin", index)
  .get("/admin/*", index)
  // Proxy API requests
  .all("/api/*", async ({ request }) => {
    const url = new URL(request.url);
    const apiPath = url.pathname.replace("/api", "");
    const apiUrl = `${API_URL}${apiPath}${url.search}`;

    const response = await fetch(apiUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" && request.method !== "HEAD"
        ? await request.text()
        : undefined,
    });

    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  })
  .listen(process.env.PORT || 3001);

console.log(
  `Membooks Web is running at http://localhost:${app.server?.port}`
);
