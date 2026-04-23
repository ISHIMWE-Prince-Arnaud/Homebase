import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/features/notifications/api";
import { showToast } from "@/lib/toast";

export const useNotifications = () => {
  const queryClient = useQueryClient();

  const {
    data: notifications,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.getAll,
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      showToast.success(
        "All caught up! ✓",
        "All notifications marked as read."
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: notificationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      showToast.success("Deleted", "Notification deleted successfully.");
    },
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  return {
    notifications,
    isLoading,
    error,
    unreadCount,
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
    delete: deleteMutation.mutate,
    isMarkingRead: markReadMutation.isPending || markAllReadMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
