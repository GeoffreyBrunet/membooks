import { describe, test, expect } from "bun:test";
import { getCacheControlHeader } from "./server";

describe("getCacheControlHeader", () => {
  // Hashed assets should get long-lived immutable cache
  test("should return immutable cache for hashed JS files", () => {
    expect(getCacheControlHeader("/chunk-5s9y0wt7.js")).toBe(
      "public, max-age=31536000, immutable"
    );
  });

  test("should return immutable cache for hashed CSS files", () => {
    expect(getCacheControlHeader("/chunk-r3e4zd8t.css")).toBe(
      "public, max-age=31536000, immutable"
    );
  });

  test("should return immutable cache for entry files with hash", () => {
    expect(getCacheControlHeader("/main-a1b2c3d4.js")).toBe(
      "public, max-age=31536000, immutable"
    );
  });

  test("should return immutable cache for hashed image assets", () => {
    expect(getCacheControlHeader("/assets/logo-abcd1234.png")).toBe(
      "public, max-age=31536000, immutable"
    );
    expect(getCacheControlHeader("/assets/photo-12345678.jpg")).toBe(
      "public, max-age=31536000, immutable"
    );
    expect(getCacheControlHeader("/assets/icon-aabbccdd.svg")).toBe(
      "public, max-age=31536000, immutable"
    );
    expect(getCacheControlHeader("/assets/hero-11223344.webp")).toBe(
      "public, max-age=31536000, immutable"
    );
  });

  test("should return immutable cache for hashed font assets", () => {
    expect(getCacheControlHeader("/assets/font-abcd1234.woff2")).toBe(
      "public, max-age=31536000, immutable"
    );
    expect(getCacheControlHeader("/assets/font-abcd1234.woff")).toBe(
      "public, max-age=31536000, immutable"
    );
  });

  // HTML and non-hashed routes should not be cached
  test("should return no-cache for HTML pages", () => {
    expect(getCacheControlHeader("/")).toBe("no-cache");
    expect(getCacheControlHeader("/login")).toBe("no-cache");
    expect(getCacheControlHeader("/library")).toBe("no-cache");
  });

  test("should return no-cache for index.html", () => {
    expect(getCacheControlHeader("/index.html")).toBe("no-cache");
  });

  test("should return no-cache for API proxy paths", () => {
    expect(getCacheControlHeader("/api/auth/login")).toBe("no-cache");
    expect(getCacheControlHeader("/api/subscription/status")).toBe("no-cache");
  });

  test("should return no-cache for non-hashed static files", () => {
    expect(getCacheControlHeader("/styles.css")).toBe("no-cache");
    expect(getCacheControlHeader("/main.js")).toBe("no-cache");
  });
});

describe("Content hashing in build", () => {
  test("build.ts should configure naming with hash pattern", async () => {
    const buildConfig = await Bun.file("build.ts").text();
    expect(buildConfig).toContain("chunk-[hash].[ext]");
    expect(buildConfig).toContain("[name]-[hash].[ext]");
  });
});
