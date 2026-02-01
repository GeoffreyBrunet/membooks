import { describe, test, expect } from "bun:test";
import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";

const createAppWithSwagger = () => {
  return new Elysia()
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
    .get("/", () => ({ message: "Membooks API is running" }), {
      detail: { tags: ["General"], summary: "Root" },
    })
    .get("/health", () => ({ status: "ok" }), {
      detail: { tags: ["General"], summary: "Health check" },
    });
};

describe("Swagger Documentation", () => {
  test("should serve Swagger UI at /swagger", async () => {
    const app = createAppWithSwagger();
    const response = await app.handle(new Request("http://localhost/swagger"));
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("html");
  });

  test("should serve OpenAPI JSON spec", async () => {
    const app = createAppWithSwagger();
    const response = await app.handle(new Request("http://localhost/swagger/json"));
    expect(response.status).toBe(200);
    const spec = await response.json();
    expect(spec.openapi).toBeDefined();
    expect(spec.info.title).toBe("Membooks API");
    expect(spec.info.version).toBe("1.0.0");
    expect(spec.info.description).toContain("Membooks");
  });

  test("should include all defined tags in spec", async () => {
    const app = createAppWithSwagger();
    const response = await app.handle(new Request("http://localhost/swagger/json"));
    const spec = await response.json();
    const tagNames = spec.tags.map((t: { name: string }) => t.name);
    expect(tagNames).toContain("General");
    expect(tagNames).toContain("Auth");
    expect(tagNames).toContain("Subscription");
    expect(tagNames).toContain("Webhook");
    expect(tagNames).toContain("Admin");
  });

  test("should include bearer auth security scheme", async () => {
    const app = createAppWithSwagger();
    const response = await app.handle(new Request("http://localhost/swagger/json"));
    const spec = await response.json();
    const bearerAuth = spec.components?.securitySchemes?.bearerAuth;
    expect(bearerAuth).toBeDefined();
    expect(bearerAuth.type).toBe("http");
    expect(bearerAuth.scheme).toBe("bearer");
    expect(bearerAuth.bearerFormat).toBe("JWT");
  });

  test("should document registered endpoints with tags", async () => {
    const app = createAppWithSwagger();
    const response = await app.handle(new Request("http://localhost/swagger/json"));
    const spec = await response.json();
    expect(spec.paths["/"]).toBeDefined();
    expect(spec.paths["/"].get.tags).toContain("General");
    expect(spec.paths["/health"]).toBeDefined();
    expect(spec.paths["/health"].get.tags).toContain("General");
  });

  test("should include endpoint summaries", async () => {
    const app = createAppWithSwagger();
    const response = await app.handle(new Request("http://localhost/swagger/json"));
    const spec = await response.json();
    expect(spec.paths["/"].get.summary).toBe("Root");
    expect(spec.paths["/health"].get.summary).toBe("Health check");
  });
});
