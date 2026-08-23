import {
  Building2,
  CalendarDays,
  Camera,
  Car,
  ClipboardList,
  CreditCard,
  FileText,
  Hotel,
  Layers,
  LayoutDashboard,
  Percent,
  Plane,
  Repeat,
  ShieldCheck,
  Sun,
  Timer,
  Undo2,
  User,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { PATHS } from "@/routes/paths";

export interface NavChild {
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path?: string;
  children?: NavChild[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: PATHS.dashboard },
    ],
  },
  {
    title: "Travel Engine",
    items: [
      {
        label: "Booking Engine",
        icon: Plane,
        children: [
          { label: "Flights", icon: Plane, path: PATHS.booking.flights },
          { label: "Hotels", icon: Hotel, path: PATHS.booking.hotels },
          { label: "Insurance", icon: ShieldCheck, path: PATHS.booking.insurance },
          { label: "Transfers", icon: Car, path: PATHS.booking.transfers },
          { label: "Holidays", icon: Sun, path: PATHS.booking.holidays },
          { label: "Sightseeing", icon: Camera, path: PATHS.booking.sightseeing },
          { label: "Fix Departure", icon: CalendarDays, path: PATHS.booking.fixDeparture },
          { label: "A to A", icon: Repeat, path: PATHS.booking.a2a },
        ],
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        label: "Company",
        icon: Building2,
        children: [
          { label: "Company Profile", icon: Building2, path: PATHS.company.profile },
          { label: "Sub Companies", icon: Users, path: PATHS.company.subCompanies },
          { label: "Create Sub Company", icon: UserPlus, path: PATHS.company.createSubCompany },
        ],
      },
      {
        label: "Users",
        icon: Users,
        children: [
          { label: "View Users", icon: Users, path: PATHS.users },
          { label: "Create User", icon: UserPlus, path: PATHS.createUser },
        ],
      },
      {
        label: "Customers",
        icon: User,
        children: [
          { label: "View Customers", icon: Users, path: PATHS.customers },
          { label: "Create Customer", icon: UserPlus, path: PATHS.createCustomer },
        ],
      },
      {
        label: "Pricing Model",
        icon: Percent,
        children: [
          { label: "View Models", icon: Percent, path: PATHS.pricing },
          { label: "Create Model", icon: FileText, path: PATHS.createPricing },
        ],
      },
    ],
  },
  {
    title: "Reports",
    items: [
      {
        label: "Reports",
        icon: FileText,
        children: [
          { label: "DSR", icon: ClipboardList, path: PATHS.reports.dsr },
          { label: "Air Reports", icon: Plane, path: PATHS.reports.air },
          { label: "Hotel Reports", icon: Hotel, path: PATHS.reports.hotel },
          { label: "MISC Reports", icon: Layers, path: PATHS.reports.misc },
          { label: "Refund Reports", icon: Undo2, path: PATHS.reports.refunds },
        ],
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        label: "JFK Travel Limits",
        icon: Wallet,
        children: [
          { label: "Cash Limit", icon: Wallet, path: PATHS.limits.cash },
          { label: "Credit Limit", icon: CreditCard, path: PATHS.limits.credit },
          { label: "Temp Limit", icon: Timer, path: PATHS.limits.temp },
        ],
      },
    ],
  },
];

export interface Breadcrumb {
  group: string;
  item: string;
  child?: string;
}

function findMatch(pathname: string): Breadcrumb | null {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.path === pathname) return { group: group.title, item: item.label };
      if (item.children) {
        for (const child of item.children) {
          if (
            child.path === pathname ||
            (pathname.startsWith(child.path + "/") && child.path !== "/")
          ) {
            return { group: group.title, item: item.label, child: child.label };
          }
        }
      }
      if (item.path && pathname.startsWith(item.path + "/")) {
        return { group: group.title, item: item.label };
      }
    }
  }
  return null;
}

export function getBreadcrumb(pathname: string): Breadcrumb {
  return findMatch(pathname) ?? { group: "Overview", item: "Dashboard" };
}
