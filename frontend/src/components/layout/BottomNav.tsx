import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
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
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { bottomNavPrimary } from "@/config/navigation";
import { MobileSheet } from "./MobileSheet";

export function BottomNav() {
  const location = useLocation();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {bottomNavPrimary.map((tab) => {
            const isActive = location.pathname === tab.href;
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors hover:text-primary relative micro-bounce",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                <span className={cn(
                  "absolute inset-0 rounded-lg bg-primary/10 scale-90 opacity-0 transition-all duration-150",
                  isActive && "scale-100 opacity-100"
                )} />
                <tab.icon 
                  className={cn("h-5 w-5 relative z-10", isActive && "fill-current")} 
                  fill={isActive ? "currentColor" : "none"}
                />
                <span className="relative z-10">{tab.name}</span>
              </Link>
            );
          })}

          <MobileSheet 
            open={open} 
            onOpenChange={setOpen}
            onLogoutClick={() => {
              setOpen(false);
              setShowLogoutDialog(true);
            }}
          />
        </div>
      </div>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You'll need to sign in again to
              access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/50" onClick={() => logout()}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
