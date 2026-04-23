import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useExpenses } from "./useExpenses";

vi.mock("@/features/expenses/api", () => ({
  expensesApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    getBalance: vi.fn(),
    getSettlements: vi.fn(),
    getMySettlements: vi.fn(),
  },
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useExpenses", () => {
  it("provides createExpense mutation", () => {
    const { result } = renderHook(() => useExpenses(), {
      wrapper: createWrapper(),
    });
    expect(result.current.createExpense).toBeDefined();
    expect(result.current.isCreating).toBeDefined();
  });
});
