import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { resolve } from "path";

const html = readFileSync(resolve(import.meta.dir, "index.html"), "utf-8");

describe("SEO Meta Tags", () => {
  test("should have a descriptive title", () => {
    expect(html).toContain("<title>Membooks — Track your reading</title>");
  });

  test("should have a meta description", () => {
    expect(html).toContain('name="description"');
    expect(html).toContain("book tracking app");
  });

  test("should have a theme-color meta tag", () => {
    expect(html).toContain('name="theme-color"');
    expect(html).toContain("#FF6B6B");
  });
});

describe("Open Graph Tags", () => {
  test("should have og:type", () => {
    expect(html).toContain('property="og:type" content="website"');
  });

  test("should have og:title", () => {
    expect(html).toContain('property="og:title" content="Membooks');
  });

  test("should have og:description", () => {
    expect(html).toContain('property="og:description"');
  });

  test("should have og:site_name", () => {
    expect(html).toContain('property="og:site_name" content="Membooks"');
  });

  test("should have og:url", () => {
    expect(html).toContain('property="og:url" content="https://membooks.app"');
  });

  test("should have og:image", () => {
    expect(html).toContain('property="og:image"');
    expect(html).toContain("og-image.png");
  });
});

describe("Twitter Card Tags", () => {
  test("should have twitter:card", () => {
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
  });

  test("should have twitter:title", () => {
    expect(html).toContain('name="twitter:title" content="Membooks');
  });

  test("should have twitter:description", () => {
    expect(html).toContain('name="twitter:description"');
  });

  test("should have twitter:image", () => {
    expect(html).toContain('name="twitter:image"');
  });
});

describe("Favicon", () => {
  test("should have a favicon link", () => {
    expect(html).toContain('rel="icon"');
  });

  test("should have an apple-touch-icon link", () => {
    expect(html).toContain('rel="apple-touch-icon"');
  });
});

describe("HTML attributes", () => {
  test("should have lang attribute set to en", () => {
    expect(html).toContain('<html lang="en">');
  });

  test("should have charset meta tag", () => {
    expect(html).toContain('charset="UTF-8"');
  });

  test("should have viewport meta tag", () => {
    expect(html).toContain('name="viewport"');
  });
});
