import { api } from "@/api/client";
import type {
  LoginInput,
  BackendRegisterInput,
  UpdateProfileInput,
} from "./schema";

export interface User {
  id: number;
  email: string;
  name: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
}

export interface BackendUser {
  id: number;
  email: string;
  name?: string;
  displayName?: string;
  createdAt?: string;
}

export const toUser = (raw: BackendUser): User => ({
  id: raw.id,
  email: raw.email,
  name:
    raw.name ||
    raw.displayName ||
    (raw.email ? raw.email.split("@")[0] : "User"),
  createdAt: raw.createdAt,
});

export const authApi = {
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await api.post("/auth/login", data);
    const backend = response.data as { user: BackendUser };
    return { user: toUser(backend.user) };
  },

  register: async (data: BackendRegisterInput): Promise<AuthResponse> => {
    const response = await api.post("/auth/register", data);
    const backend = response.data as { user: BackendUser };
    return { user: toUser(backend.user) };
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  updateProfile: async (data: UpdateProfileInput): Promise<User> => {
    const response = await api.patch("/auth/users/me", data);
    const backend = response.data as BackendUser;
    return toUser(backend);
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get("/auth/users/me");
    const backend = response.data as BackendUser;
    return toUser(backend);
  },
};
