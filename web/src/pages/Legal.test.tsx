import { describe, test, expect, afterEach } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from "@tanstack/react-router";
import { PrivacyPolicyPage } from "./PrivacyPolicy";
import { TermsPage } from "./Terms";
import { LoginPage } from "./Login";
import { RegisterPage } from "./Register";

afterEach(cleanup);

// Router that mirrors the real app: /privacy and /terms have NO auth guard
async function renderAtPath(initialPath: string) {
  const rootRoute = createRootRoute();

  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/login",
    component: LoginPage,
  });

  const registerRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/register",
    component: RegisterPage,
  });

  const privacyRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/privacy",
    component: PrivacyPolicyPage,
  });

  const termsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/terms",
    component: TermsPage,
  });

  const routeTree = rootRoute.addChildren([
    loginRoute,
    registerRoute,
    privacyRoute,
    termsRoute,
  ]);

  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  await router.load();
  return render(<RouterProvider router={router} />);
}

// --- /privacy accessible without auth ---

describe("Privacy Policy Page", () => {
  test("should be accessible without authentication", async () => {
    await renderAtPath("/privacy");
    expect(screen.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeDefined();
  });

  test("should contain all required sections", async () => {
    await renderAtPath("/privacy");
    expect(screen.getByText("1. Introduction")).toBeDefined();
    expect(screen.getByText("2. Data We Collect")).toBeDefined();
    expect(screen.getByText("3. How We Use Your Data")).toBeDefined();
    expect(screen.getByText("4. Third-Party Services")).toBeDefined();
    expect(screen.getByText("5. Data Storage and Security")).toBeDefined();
    expect(screen.getByText("6. Your Rights (GDPR)")).toBeDefined();
    expect(screen.getByText("7. Data Retention")).toBeDefined();
    expect(screen.getByText("8. Children's Privacy")).toBeDefined();
    expect(screen.getByText("9. Changes to This Policy")).toBeDefined();
    expect(screen.getByText("10. Contact")).toBeDefined();
  });

  test("should list collected account data accurately", async () => {
    await renderAtPath("/privacy");
    expect(screen.getByText("Email address")).toBeDefined();
    expect(screen.getByText("Username")).toBeDefined();
    expect(screen.getByText("Language preference")).toBeDefined();
    expect(screen.getByText(/stored as a secure bcrypt hash/)).toBeDefined();
  });

  test("should state book data is stored locally", async () => {
    await renderAtPath("/privacy");
    expect(screen.getByText(/stored.*locally on your device/)).toBeDefined();
  });

  test("should state no credit card data is stored", async () => {
    await renderAtPath("/privacy");
    expect(screen.getByText(/do not store your credit card/)).toBeDefined();
  });

  test("should list data not collected", async () => {
    await renderAtPath("/privacy");
    expect(screen.getByText("Usage analytics or activity tracking")).toBeDefined();
    expect(screen.getByText("Location data")).toBeDefined();
    expect(screen.getByText("Device identifiers or advertising IDs")).toBeDefined();
  });

  test("should mention GDPR rights", async () => {
    await renderAtPath("/privacy");
    expect(screen.getByText(/Access/)).toBeDefined();
    expect(screen.getByText(/Rectify/)).toBeDefined();
    expect(screen.getByText(/Delete/)).toBeDefined();
    expect(screen.getByText(/Export/)).toBeDefined();
    expect(screen.getByText(/Object/)).toBeDefined();
  });

  test("should mention third-party services Stripe and Open Library", async () => {
    await renderAtPath("/privacy");
    expect(screen.getByText("4.1 Stripe")).toBeDefined();
    expect(screen.getByText("4.2 Open Library")).toBeDefined();
  });

  test("should have a contact email", async () => {
    await renderAtPath("/privacy");
    const mailto = screen.getByText("contact@membooks.app");
    expect(mailto.closest("a")?.getAttribute("href")).toBe("mailto:contact@membooks.app");
  });
});

// --- /terms accessible without auth ---

describe("Terms of Service Page", () => {
  test("should be accessible without authentication", async () => {
    await renderAtPath("/terms");
    expect(screen.getByText("Terms of Service")).toBeDefined();
  });

  test("should contain all required sections", async () => {
    await renderAtPath("/terms");
    expect(screen.getByText("1. Acceptance of Terms")).toBeDefined();
    expect(screen.getByText("2. Description of the Service")).toBeDefined();
    expect(screen.getByText("3. Account Registration")).toBeDefined();
    expect(screen.getByText("4. Premium Subscription")).toBeDefined();
    expect(screen.getByText("5. User Content")).toBeDefined();
    expect(screen.getByText("6. Acceptable Use")).toBeDefined();
    expect(screen.getByText("7. Third-Party Services")).toBeDefined();
    expect(screen.getByText("8. Account Deletion")).toBeDefined();
    expect(screen.getByText("9. Limitation of Liability")).toBeDefined();
    expect(screen.getByText("10. Changes to These Terms")).toBeDefined();
    expect(screen.getByText("11. Governing Law")).toBeDefined();
    expect(screen.getByText("12. Contact")).toBeDefined();
  });

  test("should describe registration requirements accurately", async () => {
    await renderAtPath("/terms");
    expect(screen.getByText("A valid email address")).toBeDefined();
    expect(screen.getByText(/unique username.*3-30 characters/)).toBeDefined();
    expect(screen.getByText(/password.*minimum 8 characters/)).toBeDefined();
  });

  test("should cover subscription cancellation and reactivation", async () => {
    await renderAtPath("/terms");
    expect(screen.getByText("4.2 Cancellation")).toBeDefined();
    expect(screen.getByText("4.3 Reactivation")).toBeDefined();
    expect(screen.getByText(/No prorated refunds/)).toBeDefined();
  });

  test("should state user content ownership", async () => {
    await renderAtPath("/terms");
    expect(screen.getByText(/retain full ownership/)).toBeDefined();
  });

  test("should mention governing law is France", async () => {
    await renderAtPath("/terms");
    expect(screen.getByText(/governed by the laws of France/)).toBeDefined();
  });

  test("should link to Stripe and Open Library terms", async () => {
    await renderAtPath("/terms");
    const stripeLink = screen.getByText("Stripe Terms");
    expect(stripeLink.closest("a")?.getAttribute("href")).toBe("https://stripe.com/legal");
    const olLink = screen.getByText("Open Library Terms");
    expect(olLink.closest("a")?.getAttribute("href")).toBe("https://openlibrary.org/terms");
  });

  test("should have a contact email", async () => {
    await renderAtPath("/terms");
    const mailto = screen.getByText("contact@membooks.app");
    expect(mailto.closest("a")?.getAttribute("href")).toBe("mailto:contact@membooks.app");
  });
});

// --- Links from Login and Register pages ---

describe("Legal links on Login page", () => {
  test("should have a link to Privacy Policy", async () => {
    await renderAtPath("/login");
    const link = screen.getByText("Privacy Policy");
    expect(link.closest("a")?.getAttribute("href")).toBe("/privacy");
  });

  test("should have a link to Terms of Service", async () => {
    await renderAtPath("/login");
    const link = screen.getByText("Terms of Service");
    expect(link.closest("a")?.getAttribute("href")).toBe("/terms");
  });
});

describe("Legal links on Register page", () => {
  test("should have a link to Privacy Policy", async () => {
    await renderAtPath("/register");
    const link = screen.getByText("Privacy Policy");
    expect(link.closest("a")?.getAttribute("href")).toBe("/privacy");
  });

  test("should have a link to Terms of Service", async () => {
    await renderAtPath("/register");
    const link = screen.getByText("Terms of Service");
    expect(link.closest("a")?.getAttribute("href")).toBe("/terms");
  });
});
