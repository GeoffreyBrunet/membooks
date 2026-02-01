import { describe, test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from "@tanstack/react-router";
import { NotFoundPage } from "./NotFound";

async function renderWithRouter(initialPath: string) {
  const rootRoute = createRootRoute({
    notFoundComponent: NotFoundPage,
  });

  const libraryRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/library",
    component: () => <div>Library Page</div>,
  });

  const routeTree = rootRoute.addChildren([libraryRoute]);

  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  await router.load();

  return render(<RouterProvider router={router} />);
}

describe("NotFoundPage Component", () => {
  test("should display 404 text", async () => {
    await renderWithRouter("/unknown");
    expect(screen.getByText("404")).toBeDefined();
  });

  test("should display 'Page not found' heading", async () => {
    await renderWithRouter("/unknown");
    expect(screen.getByText("Page not found")).toBeDefined();
  });

  test("should display explanatory message", async () => {
    await renderWithRouter("/unknown");
    expect(
      screen.getByText("The page you're looking for doesn't exist or has been moved.")
    ).toBeDefined();
  });

  test("should have a link back to library", async () => {
    await renderWithRouter("/unknown");
    const link = screen.getByText("Back to Library");
    expect(link).toBeDefined();
    expect(link.closest("a")?.getAttribute("href")).toBe("/library");
  });

  test("should apply neo-brutalism styling", async () => {
    await renderWithRouter("/unknown");
    const badge = screen.getByText("404");
    expect(badge.className).toContain("font-title");

    const link = screen.getByText("Back to Library");
    expect(link.className).toContain("neo-shadow-md");
    expect(link.className).toContain("bg-cyan");
  });
});

describe("Router 404 Integration", () => {
  test("should show 404 for unknown routes", async () => {
    await renderWithRouter("/nonexistent");
    expect(screen.getByText("Page not found")).toBeDefined();
  });

  test("should show 404 for deep unknown paths", async () => {
    await renderWithRouter("/this/does/not/exist");
    expect(screen.getByText("404")).toBeDefined();
  });

  test("should show known route normally", async () => {
    await renderWithRouter("/library");
    expect(screen.getByText("Library Page")).toBeDefined();
  });
});
