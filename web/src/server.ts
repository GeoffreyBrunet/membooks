import { Elysia } from "elysia";
import index from "./index.html";

const API_URL = process.env.API_URL || "http://localhost:3000";

// Match content-hashed static assets (e.g. chunk-5s9y0wt7.js, main-a1b2c3d4.css)
const HASHED_ASSET_RE = /[.-][a-z0-9]{7,12}\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ttf|eot)$/;

export function getCacheControlHeader(pathname: string): string {
  if (HASHED_ASSET_RE.test(pathname)) {
    return "public, max-age=31536000, immutable";
  }
  return "no-cache";
}

const app = new Elysia()
  // Set Cache-Control headers based on asset type
  .onAfterHandle(({ request, set }) => {
    const pathname = new URL(request.url).pathname;
    set.headers["cache-control"] = getCacheControlHeader(pathname);
  })
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
  .get("/privacy", index)
  .get("/terms", index)
  .get("/admin/*", index)
  .get("/book/*", index)
  .get("/series/*", index)
  // Catch-all: serve SPA for unknown routes (client handles 404)
  .get("/*", index)
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
