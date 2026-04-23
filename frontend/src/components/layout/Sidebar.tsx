import { Link, useLocation } from "react-router-dom";
import { cn } from "../../../src/lib/utils";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/stores/uiStore";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { primaryNav, secondaryNav } from "@/config/navigation";

type SidebarProps = React.HTMLAttributes<HTMLDivElement>;

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const { logout } = useAuth();
  const { isSidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  const NavItem = ({ item }: { item: typeof primaryNav[number] }) => {
    const isActive = location.pathname === item.href;
    const content = (
      <div className="relative">
        {isActive && (
          <span className="absolute inset-0 rounded-lg bg-primary/10 scale-100 opacity-100 transition-all duration-150" />
        )}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start relative z-10 nav-item-transition",
            isSidebarCollapsed && "justify-center px-2",
            isActive && "text-primary"
          )}
          asChild>
          <Link to={item.href}>
            <item.icon 
              className={cn("h-4 w-4", !isSidebarCollapsed && "mr-2", isActive && "fill-current")} 
              fill={isActive ? "currentColor" : "none"}
            />
            {!isSidebarCollapsed && item.name}
          </Link>
        </Button>
      </div>
    );

    if (isSidebarCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right">{item.name}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  };

  return (
    <div
      className={cn(
        "hidden border-r bg-background md:flex md:flex-col md:h-screen md:sticky md:top-0 transition-all duration-200 ease-in-out",
        isSidebarCollapsed ? "md:w-[72px]" : "md:w-[280px]",
        className
      )}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className={cn("mb-6 flex items-center", isSidebarCollapsed ? "justify-center px-2" : "px-4")}>
            <img src="/logo.svg" alt="HomeBase Logo" className="h-7 w-7" />
            {!isSidebarCollapsed && (
              <h2 className="ml-2 text-2xl font-bold tracking-tight text-primary">
                HomeBase
              </h2>
            )}
          </div>
          <div className="space-y-1">
            {!isSidebarCollapsed && (
              <h3 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                Menu
              </h3>
            )}
            {primaryNav.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>
        </div>
        <div className="px-3 py-2">
          {!isSidebarCollapsed && (
            <h3 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
              Settings
            </h3>
          )}
          <div className="space-y-1">
            {secondaryNav.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10",
                isSidebarCollapsed && "justify-center px-2"
              )}
              onClick={toggleSidebarCollapsed}>
              {isSidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Collapse
                </>
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10",
                    isSidebarCollapsed && "justify-center px-2"
                  )}>
                  <LogOut className={cn("h-4 w-4", !isSidebarCollapsed && "mr-2")} />
                  {!isSidebarCollapsed && "Log Out"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Logout?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to log out? You'll need to sign in
                    again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/50"
                    onClick={() => logout()}>
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
