import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

vi.mock("@/features/auth/api", () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
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

describe("useAuth", () => {
  it("provides login mutation", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });
    expect(result.current.login).toBeDefined();
    expect(result.current.isLoggingIn).toBeDefined();
  });

  it("provides register mutation", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });
    expect(result.current.register).toBeDefined();
    expect(result.current.isRegistering).toBeDefined();
  });

  it("provides logout mutation", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });
    expect(result.current.logout).toBeDefined();
  });

  it("provides updateProfile mutation", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });
    expect(result.current.updateProfile).toBeDefined();
    expect(result.current.isUpdatingProfile).toBeDefined();
  });

  it("provides profile query", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });
    expect(result.current.isLoading).toBeDefined();
    expect(result.current.isAuthenticated).toBeDefined();
  });
});
