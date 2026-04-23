import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChoreItem } from "./ChoreItem";
import type { Chore } from "../api";

vi.mock("@/hooks/useChores", () => ({
  useChores: () => ({
    completeChore: vi.fn(),
    deleteChore: vi.fn(),
    isCompleting: false,
    isDeleting: false,
  }),
}));

vi.mock("@/hooks/useHousehold", () => ({
  useHousehold: () => ({
    household: {
      id: 1,
      members: [
        { id: 1, name: "Alice", email: "alice@test.com" },
        { id: 2, name: "Bob", email: "bob@test.com" },
      ],
    },
    isLoading: false,
  }),
}));

const mockChore: Chore = {
  id: 1,
  title: "Clean kitchen",
  description: "Scrub counters",
  dueDate: new Date(Date.now() + 86400000).toISOString(),
  isComplete: false,
  householdId: 1,
  assignedToId: 2,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(BrowserRouter, null, children)
    );
  };
};

describe("ChoreItem", () => {
  it("renders chore title and description", () => {
    render(<ChoreItem chore={mockChore} />, { wrapper: createWrapper() });

    expect(screen.getByText("Clean kitchen")).toBeInTheDocument();
    expect(screen.getByText("Scrub counters")).toBeInTheDocument();
  });

  it("shows complete button when chore is not complete", () => {
    render(<ChoreItem chore={mockChore} />, { wrapper: createWrapper() });

    expect(screen.getByRole("button", { name: /complete/i })).toBeInTheDocument();
  });

  it("shows done badge when chore is complete", () => {
    const completedChore = { ...mockChore, isComplete: true };
    render(<ChoreItem chore={completedChore} />, { wrapper: createWrapper() });

    expect(screen.getByText(/done/i)).toBeInTheDocument();
  });

  it("shows assigned user when assignedToId is set", () => {
    const choreWithAssignee = {
      ...mockChore,
      assignedTo: { id: 2, name: "Alice", email: "alice@test.com" },
    };
    render(<ChoreItem chore={choreWithAssignee} />, { wrapper: createWrapper() });

    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("shows unassigned when no assignee", () => {
    render(<ChoreItem chore={mockChore} />, { wrapper: createWrapper() });

    expect(screen.getByText(/unassigned/i)).toBeInTheDocument();
  });
});
