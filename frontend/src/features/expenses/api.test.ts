import { describe, it, expect, vi, beforeEach } from "vitest";
import { expensesApi } from "./api";
import type { Expense, BalanceItem, SettlementsResponse } from "./api";

vi.mock("@/api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { api } from "@/api/client";

const mockExpense: Expense = {
  id: 1,
  description: "Groceries",
  totalAmount: 100,
  date: "2025-06-15",
  paidById: 1,
  householdId: 1,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  participants: [],
};

const mockBalance: BalanceItem[] = [
  { userId: 1, name: "Alice", email: "a@b.com", net: 50 },
  { userId: 2, name: "Bob", email: "b@b.com", net: -50 },
];

const mockSettlements: SettlementsResponse = {
  scale: 1,
  settlements: [
    { fromUserId: 2, toUserId: 1, amount: 50, fromName: "Bob", toName: "Alice", fromEmail: "b@b.com", toEmail: "a@b.com" },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("expensesApi.getAll", () => {
  it("GETs /expenses", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [mockExpense] });

    const result = await expensesApi.getAll();
    expect(api.get).toHaveBeenCalledWith("/expenses");
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe("Groceries");
  });
});

describe("expensesApi.create", () => {
  it("POSTs to /expenses", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: mockExpense });

    const result = await expensesApi.create({
      description: "Groceries",
      totalAmount: 100,
      paidById: 1,
      participants: [1, 2],
    });
    expect(api.post).toHaveBeenCalledWith("/expenses", {
      description: "Groceries",
      totalAmount: 100,
      paidById: 1,
      participants: [1, 2],
    });
    expect(result.description).toBe("Groceries");
  });
});

describe("expensesApi.getBalance", () => {
  it("GETs /expenses/balance", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockBalance });

    const result = await expensesApi.getBalance();
    expect(api.get).toHaveBeenCalledWith("/expenses/balance");
    expect(result).toHaveLength(2);
    expect(result[0].net).toBe(50);
  });
});

describe("expensesApi.getSettlements", () => {
  it("GETs /expenses/settlements", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockSettlements });

    const result = await expensesApi.getSettlements();
    expect(api.get).toHaveBeenCalledWith("/expenses/settlements");
    expect(result.settlements).toHaveLength(1);
    expect(result.settlements[0].amount).toBe(50);
  });
});

describe("expensesApi.getMySettlements", () => {
  it("GETs /expenses/settlements/me", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockSettlements });

    const result = await expensesApi.getMySettlements();
    expect(api.get).toHaveBeenCalledWith("/expenses/settlements/me");
    expect(result.settlements).toHaveLength(1);
  });
});
