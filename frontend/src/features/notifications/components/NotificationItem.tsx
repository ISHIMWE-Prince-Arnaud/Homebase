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
  Users,
  User,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
  isDeleting?: boolean;
  isNew?: boolean;
  currentUserId?: number;
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

const getNotificationPath = (type?: string, entityType?: string, entityId?: number): string => {
  if (entityId && entityType) {
    switch (entityType) {
      case "chore":
        return `/chores`;
      case "expense":
        return `/expenses`;
      case "payment":
        return `/payments`;
      case "need":
        return `/needs`;
      default:
        return "/notifications";
    }
  }
  switch (type) {
    case "chore_assigned":
      return "/chores";
    case "expense_added":
      return "/expenses";
    case "payment_received":
      return "/payments";
    case "household_invite":
      return "/household";
    case "need_added":
    case "need_purchased":
      return "/needs";
    case "system":
      return "/dashboard";
    default:
      return "/notifications";
  }
};

const getActionLabel = (type?: string): string | null => {
  switch (type) {
    case "chore_assigned":
      return "View Chore";
    case "expense_added":
      return "View Expense";
    case "payment_received":
      return "View Payment";
    case "need_added":
    case "need_purchased":
      return "View Need";
    default:
      return null;
  }
};

export function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  isDeleting,
  isNew = false,
  currentUserId,
}: NotificationItemProps) {
  const NotificationIcon = getNotificationIcon(notification.type);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const navigate = useNavigate();

  const isHouseholdWide = notification.userId === null;
  const isForCurrentUser = notification.userId === currentUserId;
  const notificationPath = getNotificationPath(notification.type, notification.entityType, notification.entityId);
  const actionLabel = getActionLabel(notification.type);

  const handleClick = () => {
    navigate(notificationPath);
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
  };

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(notificationPath);
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
  };

  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <>
      <motion.div
        initial={isNew ? { scale: 0.95, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0, x: 20 }}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        drag="x"
        dragConstraints={{ left: -100, right: 100 }}
        dragElastic={0.2}
        onDragEnd={(_, { offset, velocity }) => {
          const swipe = swipePower(offset.x, velocity.x);
          if (swipe < -15000) {
            // Swipe left - delete
            setShowDeleteDialog(true);
          } else if (swipe > 15000) {
            // Swipe right - navigate/action
            handleClick();
          }
        }}
        transition={{ duration: 0.2 }}
        onClick={handleClick}
        className={cn(
          "group flex items-start gap-4 rounded-lg border p-4 transition-colors cursor-pointer select-none touch-pan-x",
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
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "text-sm font-medium leading-none",
                !notification.isRead && "font-semibold"
              )}>
              {notification.actor?.name ? `${notification.actor.name} ${notification.message}` : notification.message}
            </p>
            {isHouseholdWide && (
              <Badge variant="secondary" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                Everyone
              </Badge>
            )}
            {!isHouseholdWide && isForCurrentUser && (
              <Badge variant="outline" className="text-xs">
                <User className="h-3 w-3 mr-1" />
                For you
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {actionLabel && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleAction}>
              {actionLabel}
            </Button>
          )}
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(notification.id);
              }}
              title="Mark as read">
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
            title="Delete notification"
            disabled={isDeleting}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

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
