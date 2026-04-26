import { describe, it, expect, vi, beforeEach } from "vitest";
import { authApi, toUser } from "./api";
import type { BackendUser } from "./api";

vi.mock("@/api/client", () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

import { api } from "@/api/client";

const mockUser: BackendUser = {
  id: 1,
  email: "test@example.com",
  name: "Test User",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("toUser", () => {
  it("normalizes name from name field", () => {
    const result = toUser({ id: 1, email: "a@b.com", name: "Alice" });
    expect(result.name).toBe("Alice");
  });

  it("falls back to displayName", () => {
    const result = toUser({ id: 1, email: "a@b.com", displayName: "Bob" });
    expect(result.name).toBe("Bob");
  });

  it("falls back to email username", () => {
    const result = toUser({ id: 1, email: "alice@example.com" });
    expect(result.name).toBe("alice");
  });
});

describe("authApi.login", () => {
  it("POSTs to /auth/login and transforms response via toUser", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { user: mockUser } });

    const result = await authApi.login({
      email: "test@example.com",
      password: "password123",
    });

    expect(api.post).toHaveBeenCalledWith("/auth/login", {
      email: "test@example.com",
      password: "password123",
    });
    expect(result.user.id).toBe(1);
    expect(result.user.email).toBe("test@example.com");
    expect(result.user.name).toBe("Test User");
  });
});

describe("authApi.register", () => {
  it("POSTs to /auth/register", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { user: mockUser } });

    const result = await authApi.register({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    expect(api.post).toHaveBeenCalledWith("/auth/register", {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });
    expect(result.user.id).toBe(1);
    expect(result.user.name).toBe("Test User");
  });
});

describe("authApi.getProfile", () => {
  it("GETs /auth/users/me", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockUser });

    const result = await authApi.getProfile();
    expect(api.get).toHaveBeenCalledWith("/auth/users/me");
    expect(result.id).toBe(1);
    expect(result.email).toBe("test@example.com");
  });
});

describe("authApi.updateProfile", () => {
  it("PATCHes /auth/users/me", async () => {
    const updatedUser = { ...mockUser, name: "Updated Name" };
    vi.mocked(api.patch).mockResolvedValue({ data: updatedUser });

    const result = await authApi.updateProfile({ name: "Updated Name" });
    expect(api.patch).toHaveBeenCalledWith("/auth/users/me", { name: "Updated Name" });
    expect(result.name).toBe("Updated Name");
  });
});

describe("authApi.logout", () => {
  it("POSTs to /auth/logout", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { message: "Logged out" } });

    await authApi.logout();
    expect(api.post).toHaveBeenCalledWith("/auth/logout");
  });
});
