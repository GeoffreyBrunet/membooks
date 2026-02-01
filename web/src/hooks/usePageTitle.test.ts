import { describe, test, expect, afterEach } from "bun:test";
import { renderHook, cleanup } from "@testing-library/react";
import { usePageTitle } from "./usePageTitle";

afterEach(cleanup);

describe("usePageTitle", () => {
  test("should set document title with page name and base title", () => {
    renderHook(() => usePageTitle("Library"));
    expect(document.title).toBe("Library — Membooks");
  });

  test("should set document title to base title when no page name is given", () => {
    renderHook(() => usePageTitle());
    expect(document.title).toBe("Membooks");
  });

  test("should set document title to base title when undefined is passed", () => {
    renderHook(() => usePageTitle(undefined));
    expect(document.title).toBe("Membooks");
  });

  test("should reset document title on unmount", () => {
    const { unmount } = renderHook(() => usePageTitle("Profile"));
    expect(document.title).toBe("Profile — Membooks");
    unmount();
    expect(document.title).toBe("Membooks");
  });

  test("should update document title when page name changes", () => {
    const { rerender } = renderHook(
      ({ title }: { title: string }) => usePageTitle(title),
      { initialProps: { title: "Search" } }
    );
    expect(document.title).toBe("Search — Membooks");

    rerender({ title: "Statistics" });
    expect(document.title).toBe("Statistics — Membooks");
  });
});
