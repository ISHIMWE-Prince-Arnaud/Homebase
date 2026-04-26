import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import DashboardPage from "./Dashboard";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Alice", email: "alice@test.com" },
  }),
}));

vi.mock("@/hooks/useHousehold", () => ({
  useHousehold: () => ({
    household: {
      id: 1,
      name: "Test Household",
      currency: "USD",
      members: [
        { id: 1, name: "Alice", email: "alice@test.com" },
        { id: 2, name: "Bob", email: "bob@test.com" },
        { id: 3, name: "Charlie", email: "charlie@test.com" },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useChores", () => ({
  useChores: () => ({
    chores: [
      { id: 1, title: "Clean kitchen", isComplete: false, assignedToId: 1 },
      { id: 2, title: "Do laundry", isComplete: true, assignedToId: 2 },
    ],
    isLoading: false,
    createChore: vi.fn(),
  }),
}));

vi.mock("@/hooks/useExpenses", () => ({
  useExpenses: () => ({
    expenses: [
      { id: 1, description: "Groceries", totalAmount: 100 },
      { id: 2, description: "Utilities", totalAmount: 50 },
    ],
    balance: [
      { userId: 1, name: "Alice", net: 25 },
      { userId: 2, name: "Bob", net: -25 },
    ],
    settlements: [],
    mySettlements: [
      { fromUserId: 2, toUserId: 1, amount: 15 },
    ],
    settlementsScale: 1,
    mySettlementsScale: 1,
    isLoading: false,
    createExpense: vi.fn(),
  }),
}));

vi.mock("@/hooks/useNeeds", () => ({
  useNeeds: () => ({
    needs: [
      { id: 1, name: "Milk", isPurchased: false },
      { id: 2, name: "Bread", isPurchased: true },
    ],
    isLoading: false,
    createNeed: vi.fn(),
  }),
}));

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: () => ({
    notifications: [],
    isLoading: false,
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

describe("DashboardPage Integration", () => {
  it("renders dashboard with summary cards and quick actions", () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
      { wrapper: createWrapper() }
    );

    // Check dashboard heading
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();

    // Check summary cards
    expect(screen.getByText(/Pending Chores/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Shopping List/i)).toHaveLength(2);
    expect(screen.getByText(/Your Balance/i)).toBeInTheDocument();
    expect(screen.getByText(/Notifications/i)).toBeInTheDocument();

    // Check quick actions
    expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument();
    expect(screen.getByText(/View Chores/i)).toBeInTheDocument();
    expect(screen.getByText(/Add Expense/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Household/i)).toHaveLength(4);

    // Check household members section
    expect(screen.getByText(/Household Members/i)).toBeInTheDocument();
    expect(screen.getAllByText("Alice")).toHaveLength(2);
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });
});
