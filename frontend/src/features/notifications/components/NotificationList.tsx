import { useNotifications } from "@/hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";
import { Button } from "@/components/ui/button";
import { CheckCheck, Bell } from "lucide-react";
import { NotificationListSkeleton } from "@/components/ui/skeletons";
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/ui/motion";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useMemo } from "react";
import { getNotificationGroupKey } from "@/lib/display";
import type { Notification } from "../api";

const groupLabels = {
  today: "Today",
  yesterday: "Yesterday",
  thisWeek: "This Week",
  earlier: "Earlier",
};

const groupNotifications = (notifications: Notification[]) => {
  const groups: Record<string, Notification[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    earlier: [],
  };

  notifications.forEach((n) => {
    const key = getNotificationGroupKey(n.createdAt);
    groups[key].push(n);
  });

  return groups;
};

export function NotificationList() {
  const { notifications, isLoading, markRead, markAllRead, delete: deleteNotification, isMarkingRead, isDeleting } =
    useNotifications();
  const { user } = useAuth();

  const groupedNotifications = useMemo(() => {
    if (!notifications) return null;
    return groupNotifications(notifications);
  }, [notifications]);

  const unreadCount = useMemo(() => {
    return notifications?.filter((n) => !n.isRead).length || 0;
  }, [notifications]);

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

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur py-2 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead()}
            disabled={isMarkingRead}>
            <CheckCheck className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Mark all as read</span>
          </Button>
        </div>
      )}
      <AnimatePresence mode="popLayout">
        <StaggerContainer className="space-y-2">
          {groupedNotifications && Object.entries(groupedNotifications).map(([key, items]) =>
            items.length > 0 ? (
              <div key={key}>
                <h3 className="sticky top-12 z-10 bg-background/95 backdrop-blur px-1 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {groupLabels[key as keyof typeof groupLabels]}
                </h3>
                <div className="space-y-1">
                  {items.map((notification) => (
                    <StaggerItem key={notification.id}>
                      <NotificationItem
                        notification={notification}
                        onMarkRead={markRead}
                        onDelete={deleteNotification}
                        isDeleting={isDeleting}
                        currentUserId={user?.id}
                      />
                    </StaggerItem>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </StaggerContainer>
      </AnimatePresence>
    </div>
  );
}
