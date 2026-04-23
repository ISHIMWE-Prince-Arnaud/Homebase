import { api } from "@/api/client";

export interface Notification {
  id: number;
  message: string;
  type?: string;
  isRead: boolean;
  householdId: number;
  userId?: number;
  actorId?: number;
  actor?: {
    id: number;
    name: string;
  };
  entityType?: string;
  entityId?: number;
  action?: string;
  createdAt: string;
}

export const notificationsApi = {
  getAll: async () => {
    const response = await api.get<Notification[]>("/notifications");
    return response.data;
  },
  markRead: async (id: number) => {
    const response = await api.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  },
  markAllRead: async () => {
    await api.patch("/notifications/read-all");
  },
  delete: async (id: number) => {
    await api.delete(`/notifications/${id}`);
  },
};
