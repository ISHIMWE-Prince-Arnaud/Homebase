import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useNeeds } from "./useNeeds";

vi.mock("@/features/needs/api", () => ({
  needsApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    markPurchased: vi.fn(),
    delete: vi.fn(),
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

describe("useNeeds", () => {
  it("provides createNeed mutation", () => {
    const { result } = renderHook(() => useNeeds(), {
      wrapper: createWrapper(),
    });
    expect(result.current.createNeed).toBeDefined();
    expect(result.current.isCreating).toBeDefined();
  });

  it("provides updateNeed mutation", () => {
    const { result } = renderHook(() => useNeeds(), {
      wrapper: createWrapper(),
    });
    expect(result.current.updateNeed).toBeDefined();
    expect(result.current.isUpdating).toBeDefined();
  });

  it("provides markPurchased mutation", () => {
    const { result } = renderHook(() => useNeeds(), {
      wrapper: createWrapper(),
    });
    expect(result.current.markPurchased).toBeDefined();
    expect(result.current.isMarkingPurchased).toBeDefined();
  });

  it("provides deleteNeed mutation", () => {
    const { result } = renderHook(() => useNeeds(), {
      wrapper: createWrapper(),
    });
    expect(result.current.deleteNeed).toBeDefined();
    expect(result.current.isDeleting).toBeDefined();
  });
});
