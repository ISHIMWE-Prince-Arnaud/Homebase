import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useChores } from "./useChores";

vi.mock("@/features/chores/api", () => ({
  choresApi: {
    getAll: vi.fn(),
    getOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    complete: vi.fn(),
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

describe("useChores", () => {
  it("provides createChore mutation", () => {
    const { result } = renderHook(() => useChores(), {
      wrapper: createWrapper(),
    });
    expect(result.current.createChore).toBeDefined();
    expect(result.current.isCreating).toBeDefined();
  });

  it("provides updateChore mutation", () => {
    const { result } = renderHook(() => useChores(), {
      wrapper: createWrapper(),
    });
    expect(result.current.updateChore).toBeDefined();
    expect(result.current.isUpdating).toBeDefined();
  });

  it("provides completeChore mutation", () => {
    const { result } = renderHook(() => useChores(), {
      wrapper: createWrapper(),
    });
    expect(result.current.completeChore).toBeDefined();
    expect(result.current.isCompleting).toBeDefined();
  });

  it("provides deleteChore mutation", () => {
    const { result } = renderHook(() => useChores(), {
      wrapper: createWrapper(),
    });
    expect(result.current.deleteChore).toBeDefined();
    expect(result.current.isDeleting).toBeDefined();
  });
});
