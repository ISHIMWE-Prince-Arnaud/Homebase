import {
  LayoutDashboard,
  CheckSquare,
  ShoppingBag,
  Receipt,
  CreditCard,
  Bell,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  filledIcon: LucideIcon;
  priority: number;
  section: "menu" | "settings";
}

export const primaryNav: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    filledIcon: LayoutDashboard,
    priority: 1,
    section: "menu",
  },
  {
    name: "Chores",
    href: "/chores",
    icon: CheckSquare,
    filledIcon: CheckSquare,
    priority: 2,
    section: "menu",
  },
  {
    name: "Needs",
    href: "/needs",
    icon: ShoppingBag,
    filledIcon: ShoppingBag,
    priority: 3,
    section: "menu",
  },
  {
    name: "Expenses",
    href: "/expenses",
    icon: Receipt,
    filledIcon: Receipt,
    priority: 4,
    section: "menu",
  },
  {
    name: "Payments",
    href: "/payments",
    icon: CreditCard,
    filledIcon: CreditCard,
    priority: 5,
    section: "menu",
  },
  {
    name: "Notifications",
    href: "/notifications",
    icon: Bell,
    filledIcon: Bell,
    priority: 6,
    section: "menu",
  },
];

export const secondaryNav: NavItem[] = [
  {
    name: "Household",
    href: "/household",
    icon: Users,
    filledIcon: Users,
    priority: 1,
    section: "settings",
  },
];

// Bottom nav primary tabs (first 4 items from primaryNav)
export const bottomNavPrimary = primaryNav.slice(0, 4);

// Bottom nav menu items (remaining primaryNav + secondaryNav)
export const bottomNavMenu = [...primaryNav.slice(4), ...secondaryNav];

// All nav items combined
export const allNavItems = [...primaryNav, ...secondaryNav];
