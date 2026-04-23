import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreateExpenseDialog } from "./CreateExpenseDialog";

vi.mock("@/hooks/useExpenses", () => ({
  useExpenses: () => ({
    createExpense: vi.fn(),
    isCreating: false,
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

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Alice", email: "alice@test.com" },
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe("CreateExpenseDialog", () => {
  it("renders add expense button", () => {
    render(<CreateExpenseDialog />, { wrapper: createWrapper() });

    expect(screen.getByRole("button", { name: /add expense/i })).toBeInTheDocument();
  });
});
