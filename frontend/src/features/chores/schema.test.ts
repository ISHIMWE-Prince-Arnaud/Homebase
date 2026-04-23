import { createChoreSchema, updateChoreSchema } from "./schema";
import { describe, expect, it } from "vitest";

describe("createChoreSchema", () => {
  it("passes with valid title only", () => {
    const result = createChoreSchema.safeParse({ title: "Clean kitchen" });
    expect(result.success).toBe(true);
  });

  it("passes with all fields", () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const result = createChoreSchema.safeParse({
      title: "Clean kitchen",
      description: "Scrub the counters",
      dueDate: futureDate,
      assignedToId: 1,
    });
    expect(result.success).toBe(true);
  });

  it("fails with title too short", () => {
    const result = createChoreSchema.safeParse({ title: "A" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "title");
      expect(issue).toBeDefined();
    }
  });

  it("fails with title too long", () => {
    const result = createChoreSchema.safeParse({
      title: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("fails with past dueDate", () => {
    const result = createChoreSchema.safeParse({
      title: "Clean kitchen",
      dueDate: "2020-01-01T00:00:00Z",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "dueDate");
      expect(issue).toBeDefined();
      expect(issue?.message).toContain("future");
    }
  });

  it("passes with empty string dueDate (treated as undefined)", () => {
    const result = createChoreSchema.safeParse({
      title: "Clean kitchen",
      dueDate: "",
    });
    expect(result.success).toBe(true);
  });

  it("passes with empty string description (treated as undefined)", () => {
    const result = createChoreSchema.safeParse({
      title: "Clean kitchen",
      description: "  ",
    });
    expect(result.success).toBe(true);
  });

  it("coerces assignedToId from string to number", () => {
    const result = createChoreSchema.safeParse({
      title: "Clean kitchen",
      assignedToId: "5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assignedToId).toBe(5);
    }
  });
});

describe("updateChoreSchema", () => {
  it("passes with partial update (title only)", () => {
    const result = updateChoreSchema.safeParse({ title: "New title" });
    expect(result.success).toBe(true);
  });

  it("passes with isComplete boolean", () => {
    const result = updateChoreSchema.safeParse({ isComplete: true });
    expect(result.success).toBe(true);
  });

  it("passes with assignedToId nullable", () => {
    const result = updateChoreSchema.safeParse({ assignedToId: null });
    expect(result.success).toBe(true);
  });

  it("passes with empty object", () => {
    const result = updateChoreSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("fails with title too short", () => {
    const result = updateChoreSchema.safeParse({ title: "A" });
    expect(result.success).toBe(false);
  });
});
