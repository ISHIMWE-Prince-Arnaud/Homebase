import type { Notification } from "../api";
import { cn } from "@/lib/utils";
import {
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
  ExternalLink,
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
import { formatRelativeTime, formatFullDate } from "@/lib/display";

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
  isDeleting?: boolean;
  isNew?: boolean;
  currentUserId?: number;
  isExpanded?: boolean;
}

const getNotificationPath = (type?: string, entityType?: string, entityId?: number): string => {
  if (entityId && entityType) {
    switch (entityType) {
      case "chore":
        return `/chores/${entityId}`;
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

const getNotificationIconStyle = (type?: string): string => {
  switch (type) {
    case "chore_assigned":
      return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
    case "expense_added":
    case "payment_received":
      return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
    case "need_added":
    case "need_purchased":
      return "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
    case "household_invite":
      return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
    case "system":
      return "bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400";
    default:
      return "bg-primary/10 text-primary";
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
          "group flex items-start gap-3 rounded-lg border transition-all cursor-pointer select-none touch-pan-x",
          notification.isRead
            ? "bg-background/50 border-border/30 opacity-80 p-2 sm:p-3"
            : "bg-card border-l-4 border-l-primary border-y-border border-r-border shadow-sm p-3 sm:p-4"
        )}>
        <div
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            notification.isRead
              ? "bg-muted text-muted-foreground"
              : getNotificationIconStyle(notification.type)
          )}>
          {notification.type === "chore_assigned" && <CheckSquare className="h-4 w-4" />}
          {notification.type === "expense_added" && <Receipt className="h-4 w-4" />}
          {notification.type === "payment_received" && <CreditCard className="h-4 w-4" />}
          {notification.type === "need_added" && <ShoppingBag className="h-4 w-4" />}
          {notification.type === "need_purchased" && <ShoppingBag className="h-4 w-4" />}
          {notification.type === "household_member_joined" && <UserPlus className="h-4 w-4" />}
          {notification.type === "household_member_left" && <UserPlus className="h-4 w-4" />}
          {notification.type === "household_deleted" && <Trash2 className="h-4 w-4" />}
          {notification.type === "chore_completed" && <CheckCircle className="h-4 w-4" />}
          {(!notification.type || !["chore_assigned", "expense_added", "payment_received", "need_added", "need_purchased", "household_member_joined", "household_member_left", "household_deleted", "chore_completed"].includes(notification.type)) && <Info className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <p
              className={cn(
                "text-sm font-medium leading-tight",
                !notification.isRead && "font-semibold"
              )}>
              {notification.actor?.name ? `${notification.actor.name} ${notification.message}` : notification.message}
            </p>
            <div className="flex items-center gap-1 mt-0.5 sm:mt-0">
              {isHouseholdWide && (
                <Badge variant="secondary" className="text-[10px] sm:text-xs h-5 px-1.5">
                  <Users className="h-3 w-3 mr-0.5" />
                  <span className="hidden sm:inline">Everyone</span>
                  <span className="sm:hidden">All</span>
                </Badge>
              )}
              {!isHouseholdWide && isForCurrentUser && (
                <Badge variant="outline" className="text-[10px] sm:text-xs h-5 px-1.5">
                  <User className="h-3 w-3 mr-0.5" />
                  <span className="hidden sm:inline">For you</span>
                  <span className="sm:hidden">You</span>
                </Badge>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1" title={formatFullDate(notification.createdAt)}>
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1">
          {actionLabel && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 sm:w-auto sm:px-2 p-0 text-muted-foreground hover:text-foreground"
              onClick={handleAction}
              aria-label={actionLabel}
              title={actionLabel}>
              <ExternalLink className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline text-xs">{actionLabel}</span>
            </Button>
          )}
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(notification.id);
              }}
              aria-label="Mark as read"
              title="Mark as read">
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
            aria-label="Delete notification"
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
