import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  isSidebarOpen: boolean;
  theme: "light" | "dark" | "system";
  isNotificationOpen: boolean;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  setTheme: (theme: "light" | "dark" | "system") => void;

  toggleNotification: () => void;
  setNotificationOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: false, // Mobile sidebar default closed
      theme: "system",
      isNotificationOpen: false,

      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),

      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");

        if (theme === "system") {
          const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
            .matches
            ? "dark"
            : "light";
          root.classList.add(systemTheme);
          return;
        }

        root.classList.add(theme);
      },

      toggleNotification: () =>
        set((state) => ({ isNotificationOpen: !state.isNotificationOpen })),
      setNotificationOpen: (open) => set({ isNotificationOpen: open }),
    }),
    {
      name: "ui-storage", // unique name for localStorage key
      partialize: (state) => ({ theme: state.theme }), // Persist theme only
    }
  )
);
