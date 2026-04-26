import { api } from "@/api/client";
import type { CreateExpenseInput } from "./schema";

export interface ExpenseParticipantUser {
  id: number;
  name: string;
  email: string;
}

export interface ExpenseParticipant {
  id: number;
  expenseId: number;
  userId: number;
  shareAmount: number;
  createdAt: string;
  updatedAt: string;
  user?: ExpenseParticipantUser;
}

export interface ExpensePaidByUser {
  id: number;
  name: string;
  email: string;
}

export interface Expense {
  id: number;
  description: string;
  totalAmount: number;
  date: string | null;
  paidById: number;
  householdId: number;
  createdAt: string;
  updatedAt: string;
  participants: ExpenseParticipant[];
  paidBy?: ExpensePaidByUser;
}

export interface BalanceItem {
  userId: number;
  name: string | null;
  email: string | null;
  net: number; // Positive means they are owed, negative means they owe
}

export interface Settlement {
  fromUserId: number;
  toUserId: number;
  amount: number; // In scaled units (divide by scale to get display amount)
  fromName: string | null;
  toName: string | null;
  fromEmail: string | null;
  toEmail: string | null;
}

export interface SettlementsResponse {
  scale: number;
  currencyUnitNote?: string;
  settlements: Settlement[];
}

export const expensesApi = {
  getAll: async (): Promise<Expense[]> => {
    const response = await api.get<Expense[]>("/expenses");
    return response.data;
  },
  create: async (data: CreateExpenseInput): Promise<Expense> => {
    const response = await api.post<Expense>("/expenses", data);
    return response.data;
  },
  getBalance: async (): Promise<BalanceItem[]> => {
    const response = await api.get<BalanceItem[]>("/expenses/balance");
    return response.data;
  },
  getSettlements: async (): Promise<SettlementsResponse> => {
    const response = await api.get<SettlementsResponse>(
      "/expenses/settlements"
    );
    return response.data;
  },
  getMySettlements: async (): Promise<SettlementsResponse> => {
    const response = await api.get<SettlementsResponse>(
      "/expenses/settlements/me"
    );
    return response.data;
  },
};
