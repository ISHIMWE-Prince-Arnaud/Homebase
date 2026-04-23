import { useNotifications } from "@/hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";
import { Button } from "@/components/ui/button";
import { CheckCheck, Bell } from "lucide-react";
import { NotificationListSkeleton } from "@/components/ui/skeletons";
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/ui/motion";
import { AnimatePresence } from "framer-motion";

export function NotificationList() {
  const { notifications, isLoading, markRead, markAllRead, delete: deleteNotification, isMarkingRead, isDeleting } =
    useNotifications();

  if (isLoading) {
    return <NotificationListSkeleton />;
  }

  if (!notifications?.length) {
    return (
      <FadeIn className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <Bell className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">No notifications</p>
        <p className="text-sm mt-1">You're all caught up!</p>
      </FadeIn>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead()}
            disabled={isMarkingRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </div>
      )}
      <AnimatePresence mode="popLayout">
        <StaggerContainer className="space-y-2">
          {notifications.map((notification) => (
            <StaggerItem key={notification.id}>
              <NotificationItem
                notification={notification}
                onMarkRead={markRead}
                onDelete={deleteNotification}
                isDeleting={isDeleting}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </AnimatePresence>
    </div>
  );
}
