import { describe, it, expect, vi, beforeEach } from "vitest";
import { choresApi } from "./api";
import type { Chore } from "./api";

vi.mock("@/api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from "@/api/client";

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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("choresApi.getAll", () => {
  it("GETs /chores", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [mockChore] });

    const result = await choresApi.getAll();
    expect(api.get).toHaveBeenCalledWith("/chores");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Clean kitchen");
  });
});

describe("choresApi.getOne", () => {
  it("GETs /chores/:id", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockChore });

    const result = await choresApi.getOne(1);
    expect(api.get).toHaveBeenCalledWith("/chores/1");
    expect(result.id).toBe(1);
    expect(result.title).toBe("Clean kitchen");
  });
});

describe("choresApi.create", () => {
  it("POSTs to /chores", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: mockChore });

    const result = await choresApi.create({
      title: "Clean kitchen",
      description: "Scrub counters",
    });
    expect(api.post).toHaveBeenCalledWith("/chores", {
      title: "Clean kitchen",
      description: "Scrub counters",
    });
    expect(result.title).toBe("Clean kitchen");
  });
});

describe("choresApi.update", () => {
  it("PATCHes /chores/:id", async () => {
    const updated = { ...mockChore, title: "Updated" };
    vi.mocked(api.patch).mockResolvedValue({ data: updated });

    const result = await choresApi.update(1, { title: "Updated" });
    expect(api.patch).toHaveBeenCalledWith("/chores/1", { title: "Updated" });
    expect(result.title).toBe("Updated");
  });
});

describe("choresApi.complete", () => {
  it("PATCHes /chores/:id/complete", async () => {
    const completed = { ...mockChore, isComplete: true };
    vi.mocked(api.patch).mockResolvedValue({ data: completed });

    const result = await choresApi.complete(1);
    expect(api.patch).toHaveBeenCalledWith("/chores/1/complete");
    expect(result.isComplete).toBe(true);
  });
});

describe("choresApi.delete", () => {
  it("DELETEs /chores/:id", async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 200 });

    await choresApi.delete(1);
    expect(api.delete).toHaveBeenCalledWith("/chores/1");
  });
});
