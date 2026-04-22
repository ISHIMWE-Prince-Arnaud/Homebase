import { Link, useLocation } from "react-router-dom";
import { cn } from "../../../src/lib/utils";
import {
  LayoutDashboard,
  CheckSquare,
  ShoppingBag,
  Receipt,
  CreditCard,
  Bell,
  Home,
  User,
  LogOut,
} from "lucide-react";
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

type SidebarProps = React.HTMLAttributes<HTMLDivElement>;

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const { logout } = useAuth();

  const primaryNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Chores", href: "/chores", icon: CheckSquare },
    { name: "Needs", href: "/needs", icon: ShoppingBag },
    { name: "Expenses", href: "/expenses", icon: Receipt },
    { name: "Payments", href: "/payments", icon: CreditCard },
  ];

  const secondaryNav = [
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Household", href: "/household", icon: Home },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div
      className={cn(
        "hidden border-r bg-background md:flex md:flex-col md:h-screen md:sticky md:top-0",
        className
      )}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="mb-6 flex items-center px-4">
              <img src="/logo.svg" alt="HomeBase Logo" className="h-7 w-7 mr-2 mb-1" />
            <h2 className="text-2xl font-bold tracking-tight text-primary">
              HomeBase
            </h2>
          </div>
          <div className="space-y-1">
            <h3 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
              Menu
            </h3>
            {primaryNav.map((item) => (
              <Button
                key={item.href}
                variant={
                  location.pathname === item.href ? "secondary" : "ghost"
                }
                className="w-full justify-start"
                asChild>
                <Link to={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            ))}
          </div>
        </div>
        <div className="px-3 py-2">
          <h3 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
            Settings
          </h3>
          <div className="space-y-1">
            {secondaryNav.map((item) => (
              <Button
                key={item.href}
                variant={
                  location.pathname === item.href ? "secondary" : "ghost"
                }
                className="w-full justify-start"
                asChild>
                <Link to={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            ))}
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
