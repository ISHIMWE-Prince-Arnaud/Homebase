import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Sidebar } from "./Sidebar";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Alice", email: "alice@test.com" },
    logout: vi.fn(),
  }),
}));

vi.mock("@/hooks/useUIStore", () => ({
  useUIStore: () => ({
    sidebarOpen: true,
    toggleSidebar: vi.fn(),
  }),
}));

describe("Sidebar", () => {
  it("renders navigation links", () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/chores/i)).toBeInTheDocument();
    expect(screen.getByText(/needs/i)).toBeInTheDocument();
  });

  it("renders household link", () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );

    expect(screen.getByText(/household/i)).toBeInTheDocument();
  });
});
