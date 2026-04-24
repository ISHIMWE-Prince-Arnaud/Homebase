import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
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

  // Check if current route is in bottom nav primary tabs
  const isMenuActive = ![...bottomNavPrimary].some(item => location.pathname === item.href);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {bottomNavPrimary.map((tab) => {
            const isActive = location.pathname === tab.href;
            const Icon = isActive ? tab.filledIcon : tab.icon;
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors hover:text-primary relative micro-bounce",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </Link>
            );
          })}

          <button
            onClick={() => setOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors hover:text-primary active:scale-95 transition-transform duration-100",
              isMenuActive ? "text-primary" : "text-muted-foreground"
            )}>
            <Menu className="h-5 w-5" />
            <span>Menu</span>
          </button>

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
