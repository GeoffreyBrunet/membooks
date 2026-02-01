import { describe, test, expect, beforeEach } from "bun:test";
import { RateLimiter } from "./rateLimiter";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({ maxRequests: 3, windowMs: 60_000 });
  });

  test("should allow requests under the limit", () => {
    const r1 = limiter.check("ip-1");
    expect(r1.limited).toBe(false);
    expect(r1.remaining).toBe(2);

    const r2 = limiter.check("ip-1");
    expect(r2.limited).toBe(false);
    expect(r2.remaining).toBe(1);

    const r3 = limiter.check("ip-1");
    expect(r3.limited).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  test("should block requests over the limit", () => {
    limiter.check("ip-1");
    limiter.check("ip-1");
    limiter.check("ip-1");

    const r4 = limiter.check("ip-1");
    expect(r4.limited).toBe(true);
    expect(r4.remaining).toBe(0);
  });

  test("should track different keys independently", () => {
    limiter.check("ip-1");
    limiter.check("ip-1");
    limiter.check("ip-1");

    const blocked = limiter.check("ip-1");
    expect(blocked.limited).toBe(true);

    const allowed = limiter.check("ip-2");
    expect(allowed.limited).toBe(false);
    expect(allowed.remaining).toBe(2);
  });

  test("should reset after window expires", () => {
    const shortLimiter = new RateLimiter({ maxRequests: 1, windowMs: 50 });

    shortLimiter.check("ip-1");
    const blocked = shortLimiter.check("ip-1");
    expect(blocked.limited).toBe(true);

    // Wait for window to expire
    const start = Date.now();
    while (Date.now() - start < 60) {
      // busy wait
    }

    const allowed = shortLimiter.check("ip-1");
    expect(allowed.limited).toBe(false);
    expect(allowed.remaining).toBe(0);
  });

  test("should return resetAt timestamp", () => {
    const before = Date.now();
    const result = limiter.check("ip-1");
    const after = Date.now();

    expect(result.resetAt).toBeGreaterThanOrEqual(before + 60_000);
    expect(result.resetAt).toBeLessThanOrEqual(after + 60_000);
  });

  test("should reset a specific key", () => {
    limiter.check("ip-1");
    limiter.check("ip-1");
    limiter.check("ip-1");

    expect(limiter.check("ip-1").limited).toBe(true);

    limiter.reset("ip-1");

    expect(limiter.check("ip-1").limited).toBe(false);
    expect(limiter.check("ip-1").remaining).toBe(1);
  });

  test("should clear all entries", () => {
    limiter.check("ip-1");
    limiter.check("ip-1");
    limiter.check("ip-1");
    limiter.check("ip-2");
    limiter.check("ip-2");
    limiter.check("ip-2");

    expect(limiter.check("ip-1").limited).toBe(true);
    expect(limiter.check("ip-2").limited).toBe(true);

    limiter.clear();

    expect(limiter.check("ip-1").limited).toBe(false);
    expect(limiter.check("ip-2").limited).toBe(false);
  });
});
