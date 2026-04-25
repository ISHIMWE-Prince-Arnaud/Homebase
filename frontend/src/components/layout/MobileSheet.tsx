import { Link, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { primaryNav, secondaryNav } from "@/config/navigation";

interface MobileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogoutClick: () => void;
}

export function MobileSheet({ open, onOpenChange, onLogoutClick }: MobileSheetProps) {
  const location = useLocation();

  const menuItems = primaryNav;
  const settingsItems = secondaryNav;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[280px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 flex flex-col space-y-4">
          {/* HomeBase Logo */}
          <div className="flex items-center px-4 mb-4">
            <img src="/logo.svg" alt="HomeBase Logo" className="h-7 w-7 mr-2" />
            <h2 className="text-2xl font-bold tracking-tight text-primary">
              HomeBase
            </h2>
          </div>

          {/* MENU Section */}
          <div className="space-y-1">
            <h3 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
              Menu
            </h3>
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              const Icon = isActive ? item.filledIcon : item.icon;
              return (
                <div key={item.href} className="relative">
                  {isActive && (
                    <span className="absolute inset-0 rounded-lg bg-primary/10 scale-100 opacity-100 transition-all duration-150" />
                  )}
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start relative z-10 nav-item-transition",
                      isActive && "text-primary"
                    )}
                    asChild
                    onClick={() => onOpenChange(false)}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}>
                    <Link to={item.href}>
                      <Icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>

          {/* SETTINGS Section */}
          <div className="space-y-1">
            <h3 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
              Settings
            </h3>
            {settingsItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              const Icon = isActive ? item.filledIcon : item.icon;
              return (
                <div key={item.href} className="relative">
                  {isActive && (
                    <span className="absolute inset-0 rounded-lg bg-primary/10 scale-100 opacity-100 transition-all duration-150" />
                  )}
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start relative z-10 nav-item-transition",
                      isActive && "text-primary"
                    )}
                    asChild
                    onClick={() => onOpenChange(false)}
                    style={{
                      animationDelay: `${(menuItems.length + index) * 50}ms`,
                    }}>
                    <Link to={item.href}>
                      <Icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-2 border-t" />

          {/* Logout */}
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 focus:text-destructive focus:bg-destructive/10"
            onClick={onLogoutClick}>
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
