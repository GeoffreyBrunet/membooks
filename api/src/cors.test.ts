import { describe, test, expect } from "bun:test";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

const createAppWithCors = (corsOrigins?: string) => {
  const allowedOrigins = corsOrigins
    ? corsOrigins.split(",").map((o) => o.trim())
    : [];

  return new Elysia()
    .use(
      cors({
        origin: allowedOrigins.length > 0 ? allowedOrigins : true,
        credentials: true,
      })
    )
    .get("/health", () => ({ status: "ok" }));
};

describe("CORS Configuration", () => {
  test("should allow all origins when CORS_ORIGINS is not set", async () => {
    const app = createAppWithCors(undefined);

    const response = await app.handle(
      new Request("http://localhost/health", {
        headers: { Origin: "https://any-origin.com" },
      })
    );

    expect(response.status).toBe(200);
    const acao = response.headers.get("access-control-allow-origin");
    expect(acao).toBe("https://any-origin.com");
    expect(response.headers.get("access-control-allow-credentials")).toBe("true");
  });

  test("should allow all origins when CORS_ORIGINS is empty string", async () => {
    const app = createAppWithCors("");

    const response = await app.handle(
      new Request("http://localhost/health", {
        headers: { Origin: "https://random-site.org" },
      })
    );

    expect(response.status).toBe(200);
    const acao = response.headers.get("access-control-allow-origin");
    expect(acao).toBe("https://random-site.org");
  });

  test("should allow a listed origin when CORS_ORIGINS is set", async () => {
    const app = createAppWithCors("https://app.membooks.com");

    const response = await app.handle(
      new Request("http://localhost/health", {
        headers: { Origin: "https://app.membooks.com" },
      })
    );

    expect(response.status).toBe(200);
    const acao = response.headers.get("access-control-allow-origin");
    expect(acao).toBe("https://app.membooks.com");
    expect(response.headers.get("access-control-allow-credentials")).toBe("true");
  });

  test("should reject an unlisted origin when CORS_ORIGINS is set", async () => {
    const app = createAppWithCors("https://app.membooks.com");

    const response = await app.handle(
      new Request("http://localhost/health", {
        headers: { Origin: "https://evil-site.com" },
      })
    );

    const acao = response.headers.get("access-control-allow-origin");
    expect(acao).not.toBe("https://evil-site.com");
  });

  test("should support multiple origins separated by commas", async () => {
    const app = createAppWithCors(
      "https://app.membooks.com, https://membooks.com, https://staging.membooks.com"
    );

    const r1 = await app.handle(
      new Request("http://localhost/health", {
        headers: { Origin: "https://app.membooks.com" },
      })
    );
    expect(r1.headers.get("access-control-allow-origin")).toBe("https://app.membooks.com");

    const r2 = await app.handle(
      new Request("http://localhost/health", {
        headers: { Origin: "https://staging.membooks.com" },
      })
    );
    expect(r2.headers.get("access-control-allow-origin")).toBe("https://staging.membooks.com");

    const r3 = await app.handle(
      new Request("http://localhost/health", {
        headers: { Origin: "https://unauthorized.com" },
      })
    );
    expect(r3.headers.get("access-control-allow-origin")).not.toBe("https://unauthorized.com");
  });

  test("should handle preflight OPTIONS requests with allowed origin", async () => {
    const app = createAppWithCors("https://app.membooks.com");

    const response = await app.handle(
      new Request("http://localhost/health", {
        method: "OPTIONS",
        headers: {
          Origin: "https://app.membooks.com",
          "Access-Control-Request-Method": "GET",
        },
      })
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("https://app.membooks.com");
    expect(response.headers.get("access-control-allow-credentials")).toBe("true");
  });

  test("should handle preflight OPTIONS requests with rejected origin", async () => {
    const app = createAppWithCors("https://app.membooks.com");

    const response = await app.handle(
      new Request("http://localhost/health", {
        method: "OPTIONS",
        headers: {
          Origin: "https://evil-site.com",
          "Access-Control-Request-Method": "GET",
        },
      })
    );

    expect(response.headers.get("access-control-allow-origin")).not.toBe("https://evil-site.com");
  });
});
