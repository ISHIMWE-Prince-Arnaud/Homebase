import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useHousehold } from "./useHousehold";

vi.mock("@/features/household/api", () => ({
  householdApi: {
    getMy: vi.fn(),
    create: vi.fn(),
    join: vi.fn(),
    leave: vi.fn(),
  },
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
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

describe("useHousehold", () => {
  it("provides createHousehold mutation", () => {
    const { result } = renderHook(() => useHousehold(), {
      wrapper: createWrapper(),
    });
    expect(result.current.createHousehold).toBeDefined();
    expect(result.current.isCreating).toBeDefined();
  });

  it("provides joinHousehold mutation", () => {
    const { result } = renderHook(() => useHousehold(), {
      wrapper: createWrapper(),
    });
    expect(result.current.joinHousehold).toBeDefined();
    expect(result.current.isJoining).toBeDefined();
  });

  it("provides leaveHousehold mutation", () => {
    const { result } = renderHook(() => useHousehold(), {
      wrapper: createWrapper(),
    });
    expect(result.current.leaveHousehold).toBeDefined();
    expect(result.current.isLeaving).toBeDefined();
  });
});
