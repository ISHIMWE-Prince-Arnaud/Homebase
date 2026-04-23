import type { Notification } from "../api";
import { cn } from "@/lib/utils";
import {
  Bell,
  CheckCircle,
  CheckSquare,
  Receipt,
  CreditCard,
  UserPlus,
  Info,
  ShoppingBag,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
  isDeleting?: boolean;
}

const getNotificationIcon = (type?: string): LucideIcon => {
  switch (type) {
    case "chore_assigned":
      return CheckSquare;
    case "expense_added":
      return Receipt;
    case "payment_received":
      return CreditCard;
    case "household_invite":
      return UserPlus;
    case "need_added":
    case "need_purchased":
      return ShoppingBag;
    case "system":
      return Info;
    default:
      return Bell;
  }
};

export function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  isDeleting,
}: NotificationItemProps) {
  const NotificationIcon = getNotificationIcon(notification.type);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <div
        className={cn(
          "group flex items-start gap-4 rounded-lg border p-4 transition-colors",
          notification.isRead ? "bg-background" : "bg-muted/50 border-primary/20"
        )}>
        <div
          className={cn(
            "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            notification.isRead
              ? "bg-muted text-muted-foreground"
              : "bg-primary/10 text-primary"
          )}>
          <NotificationIcon className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-1">
          <p
            className={cn(
              "text-sm font-medium leading-none",
              !notification.isRead && "font-semibold"
            )}>
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
              onClick={() => onMarkRead(notification.id)}
              title="Mark as read">
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
            title="Delete notification"
            disabled={isDeleting}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete notification?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/50"
              disabled={isDeleting}
              onClick={() => {
                onDelete(notification.id);
                setShowDeleteDialog(false);
              }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
