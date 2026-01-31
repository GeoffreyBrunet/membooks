import { describe, test, expect } from "bun:test";
import { hashPassword, verifyPassword } from "./password";

describe("hashPassword", () => {
  test("returns a hash string", async () => {
    const hash = await hashPassword("mysecretpw");
    expect(typeof hash).toBe("string");
    expect(hash.length).toBeGreaterThan(0);
  });

  test("produces different hashes for the same password", async () => {
    const h1 = await hashPassword("password");
    const h2 = await hashPassword("password");
    expect(h1).not.toBe(h2);
  });

  test("hash contains argon2id identifier", async () => {
    const hash = await hashPassword("test");
    expect(hash).toContain("argon2id");
  });
});

describe("verifyPassword", () => {
  test("returns true for correct password", async () => {
    const hash = await hashPassword("correct");
    expect(await verifyPassword("correct", hash)).toBe(true);
  });

  test("returns false for wrong password", async () => {
    const hash = await hashPassword("correct");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});
