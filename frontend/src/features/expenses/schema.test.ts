import { describe, expect, it } from "vitest";
import { createExpenseSchema } from "./schema";

describe("createExpenseSchema", () => {
  it("passes with valid input", () => {
    const result = createExpenseSchema.safeParse({
      description: "Groceries",
      totalAmount: 100,
      paidById: 1,
      participants: [1, 2, 3],
    });
    expect(result.success).toBe(true);
  });

  it("fails with empty description", () => {
    const result = createExpenseSchema.safeParse({
      description: "",
      totalAmount: 100,
      paidById: 1,
      participants: [1],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "description"
      );
      expect(issue).toBeDefined();
    }
  });

  it("fails with totalAmount of 0", () => {
    const result = createExpenseSchema.safeParse({
      description: "Groceries",
      totalAmount: 0,
      paidById: 1,
      participants: [1],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "totalAmount"
      );
      expect(issue).toBeDefined();
      expect(issue?.message).toContain("greater than 0");
    }
  });

  it("fails with negative totalAmount", () => {
    const result = createExpenseSchema.safeParse({
      description: "Groceries",
      totalAmount: -50,
      paidById: 1,
      participants: [1],
    });
    expect(result.success).toBe(false);
  });

  it("fails with empty participants array", () => {
    const result = createExpenseSchema.safeParse({
      description: "Groceries",
      totalAmount: 100,
      paidById: 1,
      participants: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "participants"
      );
      expect(issue).toBeDefined();
      expect(issue?.message).toContain("At least one participant");
    }
  });

  it("fails with paidById of 0", () => {
    const result = createExpenseSchema.safeParse({
      description: "Groceries",
      totalAmount: 100,
      paidById: 0,
      participants: [1],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "paidById"
      );
      expect(issue).toBeDefined();
    }
  });

  it("coerces totalAmount from string to number", () => {
    const result = createExpenseSchema.safeParse({
      description: "Groceries",
      totalAmount: "100",
      paidById: 1,
      participants: [1],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalAmount).toBe(100);
    }
  });

  it("coerces paidById from string to number", () => {
    const result = createExpenseSchema.safeParse({
      description: "Groceries",
      totalAmount: 100,
      paidById: "1",
      participants: [1],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.paidById).toBe(1);
    }
  });

  it("passes with optional date field", () => {
    const result = createExpenseSchema.safeParse({
      description: "Groceries",
      totalAmount: 100,
      paidById: 1,
      participants: [1],
      date: "2025-06-15",
    });
    expect(result.success).toBe(true);
  });
});
