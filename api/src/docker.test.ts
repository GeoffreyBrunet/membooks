import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { resolve } from "path";

const dockerfile = readFileSync(resolve(import.meta.dir, "../Dockerfile"), "utf-8");
const dockerignore = readFileSync(resolve(import.meta.dir, "../.dockerignore"), "utf-8");
const composefile = readFileSync(resolve(import.meta.dir, "../../docker-compose.yml"), "utf-8");

describe("Dockerfile", () => {
  test("should use oven/bun as base image", () => {
    expect(dockerfile).toContain("FROM oven/bun");
  });

  test("should use multi-stage build", () => {
    const stages = dockerfile.match(/FROM .+ AS \w+/g);
    expect(stages).toBeDefined();
    expect(stages!.length).toBeGreaterThanOrEqual(3);
  });

  test("should install dependencies with frozen lockfile", () => {
    expect(dockerfile).toContain("bun install --frozen-lockfile");
  });

  test("should install production dependencies separately", () => {
    expect(dockerfile).toContain("--production");
  });

  test("should run tests during build", () => {
    expect(dockerfile).toContain("bun test");
  });

  test("should expose port 3000", () => {
    expect(dockerfile).toContain("EXPOSE 3000/tcp");
  });

  test("should run as non-root bun user", () => {
    expect(dockerfile).toContain("USER bun");
  });

  test("should use bun run to start the app", () => {
    expect(dockerfile).toContain("bun", "run", "src/index.ts");
  });

  test("should copy source code to release stage", () => {
    expect(dockerfile).toContain("COPY --from=prerelease");
    expect(dockerfile).toContain("src");
    expect(dockerfile).toContain("package.json");
  });

  test("should leverage dependency layer caching with temp directory", () => {
    expect(dockerfile).toContain("/temp/dev");
    expect(dockerfile).toContain("/temp/prod");
  });
});

describe(".dockerignore", () => {
  test("should exclude node_modules", () => {
    expect(dockerignore).toContain("node_modules");
  });

  test("should exclude .env files", () => {
    expect(dockerignore).toContain(".env");
  });

  test("should keep .env.example", () => {
    expect(dockerignore).toContain("!.env.example");
  });

  test("should exclude .git directory", () => {
    expect(dockerignore).toContain(".git");
  });
});

describe("docker-compose.yml", () => {
  test("should define api service", () => {
    expect(composefile).toContain("api:");
  });

  test("should define db service with PostgreSQL", () => {
    expect(composefile).toContain("db:");
    expect(composefile).toContain("postgres:");
  });

  test("should map API to port 3000", () => {
    expect(composefile).toContain("3000:3000");
  });

  test("should map PostgreSQL to port 5432", () => {
    expect(composefile).toContain("5432:5432");
  });

  test("should configure DATABASE_URL pointing to db service", () => {
    expect(composefile).toContain("DATABASE_URL:");
    expect(composefile).toContain("@db:");
  });

  test("should use a persistent volume for PostgreSQL data", () => {
    expect(composefile).toContain("pgdata:");
    expect(composefile).toContain("/var/lib/postgresql/data");
  });

  test("should have healthcheck on db service", () => {
    expect(composefile).toContain("healthcheck:");
    expect(composefile).toContain("pg_isready");
  });

  test("should make api depend on db being healthy", () => {
    expect(composefile).toContain("depends_on:");
    expect(composefile).toContain("condition: service_healthy");
  });

  test("should configure all required environment variables", () => {
    expect(composefile).toContain("JWT_SECRET:");
    expect(composefile).toContain("CORS_ORIGINS:");
    expect(composefile).toContain("STRIPE_SECRET_KEY:");
    expect(composefile).toContain("STRIPE_WEBHOOK_SECRET:");
    expect(composefile).toContain("STRIPE_PREMIUM_PRICE_ID:");
    expect(composefile).toContain("APP_URL:");
    expect(composefile).toContain("ADMIN_EMAILS:");
  });

  test("should build API from ./api context", () => {
    expect(composefile).toContain("context: ./api");
  });
});
