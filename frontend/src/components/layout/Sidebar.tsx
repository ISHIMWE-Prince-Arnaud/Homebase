import { Link, useLocation } from "react-router-dom";
import { cn } from "../../../src/lib/utils";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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
import { primaryNav, secondaryNav } from "@/config/navigation";
import { Separator } from "@/components/ui/separator";

type SidebarProps = React.HTMLAttributes<HTMLDivElement>;

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const { logout } = useAuth();

  const NavItem = ({ item }: { item: typeof primaryNav[number] }) => {
    const isActive = location.pathname === item.href;
    const Icon = isActive ? item.filledIcon : item.icon;
    return (
      <div className="relative">
        {isActive && (
          <span className="absolute inset-0 rounded-lg bg-primary/10 scale-100 opacity-100 transition-all duration-150" />
        )}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start relative z-10 nav-item-transition",
            isActive && "text-primary"
          )}
          asChild>
          <Link to={item.href}>
            <Icon className="h-4 w-4 mr-2" />
            {item.name}
          </Link>
        </Button>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "hidden border-r bg-background md:flex md:flex-col md:h-screen md:sticky md:top-0 md:w-[260px] lg:w-[280px]",
        className
      )}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="mb-6 flex items-center px-4">
            <img src="/logo.svg" alt="Homebase Logo" className="h-7 w-7" />
            <h2 className="ml-2 text-2xl font-bold tracking-tight text-primary">
              Homebase
            </h2>
          </div>
          <div className="space-y-1">
            <h3 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
              Menu
            </h3>
            {primaryNav.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>
        </div>
        <div className="px-3 py-2">
          <h3 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
            Settings
          </h3>
          <div className="space-y-1">
            {secondaryNav.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
            <Separator className="my-4" />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Log Out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to log out? You'll need to sign in
                    again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={() => logout()}>
                    Log Out
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
