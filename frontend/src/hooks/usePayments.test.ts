import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePayments } from "./usePayments";

vi.mock("@/features/payments/api", () => ({
  paymentsApi: {
    getAll: vi.fn(),
    create: vi.fn(),
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

describe("usePayments", () => {
  it("provides createPayment mutation", () => {
    const { result } = renderHook(() => usePayments(), {
      wrapper: createWrapper(),
    });
    expect(result.current.createPayment).toBeDefined();
    expect(result.current.isCreating).toBeDefined();
  });
});
