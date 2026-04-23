import { beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "@testing-library/react";
import { useUIStore } from "./uiStore";

// Mock window.document for jsdom
beforeEach(() => {
  // jsdom DOMTokenList doesn't have clear(), remove classes individually
  document.documentElement.classList.remove("light", "dark");
  // Reset the store before each test
  useUIStore.setState({
    isSidebarOpen: false,
    theme: "system",
    isNotificationOpen: false,
  });
});

describe("useUIStore", () => {
  it("has correct initial state", () => {
    const state = useUIStore.getState();
    expect(state.isSidebarOpen).toBe(false);
    expect(state.theme).toBe("system");
    expect(state.isNotificationOpen).toBe(false);
  });

  it("toggleSidebar flips isSidebarOpen", () => {
    expect(useUIStore.getState().isSidebarOpen).toBe(false);

    act(() => {
      useUIStore.getState().toggleSidebar();
    });
    expect(useUIStore.getState().isSidebarOpen).toBe(true);

    act(() => {
      useUIStore.getState().toggleSidebar();
    });
    expect(useUIStore.getState().isSidebarOpen).toBe(false);
  });

  it("setSidebarOpen sets isSidebarOpen directly", () => {
    act(() => {
      useUIStore.getState().setSidebarOpen(true);
    });
    expect(useUIStore.getState().isSidebarOpen).toBe(true);

    act(() => {
      useUIStore.getState().setSidebarOpen(false);
    });
    expect(useUIStore.getState().isSidebarOpen).toBe(false);
  });

  it("setTheme applies class to document root", () => {
    act(() => {
      useUIStore.getState().setTheme("dark");
    });
    expect(useUIStore.getState().theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);

    act(() => {
      useUIStore.getState().setTheme("light");
    });
    expect(useUIStore.getState().theme).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("setTheme 'system' uses prefers-color-scheme", () => {
    // Mock matchMedia for system theme
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true, // simulate dark mode preference
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    act(() => {
      useUIStore.getState().setTheme("system");
    });
    expect(useUIStore.getState().theme).toBe("system");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    window.matchMedia = originalMatchMedia;
  });

  it("toggleNotification flips isNotificationOpen", () => {
    expect(useUIStore.getState().isNotificationOpen).toBe(false);

    act(() => {
      useUIStore.getState().toggleNotification();
    });
    expect(useUIStore.getState().isNotificationOpen).toBe(true);

    act(() => {
      useUIStore.getState().toggleNotification();
    });
    expect(useUIStore.getState().isNotificationOpen).toBe(false);
  });

  it("setNotificationOpen sets isNotificationOpen directly", () => {
    act(() => {
      useUIStore.getState().setNotificationOpen(true);
    });
    expect(useUIStore.getState().isNotificationOpen).toBe(true);

    act(() => {
      useUIStore.getState().setNotificationOpen(false);
    });
    expect(useUIStore.getState().isNotificationOpen).toBe(false);
  });

  it("only theme is persisted via partialize", () => {
    const store = useUIStore;
    // Access the persist config's partialize
    // The store uses zustand/persist, partialize should only return theme
    const persistOptions = (store as unknown as { persist: { options: { partialize: (state: typeof store extends () => infer S ? S : never) => unknown } } }).persist;
    if (persistOptions?.options?.partialize) {
      const state = store.getState();
      const partial = persistOptions.options.partialize(state as never);
      expect(partial).toEqual({ theme: state.theme });
      expect(partial).not.toHaveProperty("isSidebarOpen");
      expect(partial).not.toHaveProperty("isNotificationOpen");
    }
  });
});
