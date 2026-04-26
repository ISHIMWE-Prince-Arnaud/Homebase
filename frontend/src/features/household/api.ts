import { api } from "@/api/client";
import type { CreateHouseholdInput, JoinHouseholdInput } from "./schema";
import axios from "axios";

export interface HouseholdMember {
  id: number;
  name: string;
  email: string;
}

export interface Household {
  id: number;
  name: string;
  currency: string;
  members: HouseholdMember[];
  ownerId: number;
  createdById: number;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
}

// Backend response types and normalizer
interface BackendUser {
  id: number;
  email: string;
  name?: string;
  displayName?: string;
}

interface BackendHousehold {
  id: number;
  name: string;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  users?: BackendUser[];
  ownerId?: number;
  currency?: string;
}

const toHousehold = (raw: BackendHousehold): Household => {
  const members: HouseholdMember[] = (raw.users || []).map((u) => ({
    id: u.id,
    email: u.email,
    name:
      u.name || u.displayName || (u.email ? u.email.split("@")[0] : "Member"),
  }));
  const ownerId = raw.ownerId ?? members[0]?.id ?? 0;
  return {
    id: raw.id,
    name: raw.name,
    inviteCode: raw.inviteCode,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    members,
    ownerId,
    createdById: raw.ownerId ?? members[0]?.id ?? 0,
    currency: raw.currency ?? "USD",
  };
};

export const householdApi = {
  getMyHousehold: async (): Promise<Household | null> => {
    try {
      const response = await api.get<BackendHousehold>("/households/me");
      return toHousehold(response.data);
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        return null;
      }
      throw e;
    }
  },
  create: async (data: CreateHouseholdInput) => {
    const response = await api.post<BackendHousehold>("/households", data);
    return toHousehold(response.data);
  },
  join: async (data: JoinHouseholdInput) => {
    const response = await api.post<BackendHousehold>("/households/join", data);
    return toHousehold(response.data);
  },
  leave: async () => {
    await api.post("/households/leave");
  },
  update: async (data: Partial<CreateHouseholdInput>) => {
    const response = await api.patch<BackendHousehold>("/households/me", data);
    return toHousehold(response.data);
  },
};
