import type { Role } from "@/types";
import { NAV_GROUPS, type NavChild, type NavGroup, type NavItem } from "@/constants/navigation";

export type AreaKey =
  | "dashboard"
  | "booking"
  | "company"
  | "departments"
  | "users"
  | "travellerProfiles"
  | "pricing"
  | "reports"
  | "limits";

export const ROLE_AREAS: Record<Role, AreaKey[]> = {
  Administrator: ["dashboard", "booking", "company", "departments", "users", "travellerProfiles", "pricing", "reports", "limits"],
  Manager: ["dashboard", "booking", "company", "departments", "travellerProfiles", "pricing", "reports", "limits"],
  Agent: ["dashboard", "booking", "travellerProfiles", "reports"],
  Accounts: ["dashboard", "reports", "limits"],
  "Sub Agent": ["dashboard", "booking", "travellerProfiles"],
};

export function areaForPath(path: string): AreaKey {
  if (path.startsWith("/booking")) return "booking";
  if (path.startsWith("/company")) return "company";
  if (path.startsWith("/departments")) return "departments";
  if (path.startsWith("/users")) return "users";
  if (path.startsWith("/traveller-profiles")) return "travellerProfiles";
  if (path.startsWith("/pricing")) return "pricing";
  if (path.startsWith("/reports")) return "reports";
  if (path.startsWith("/limits")) return "limits";
  return "dashboard";
}

export function hasArea(role: Role, area: AreaKey): boolean {
  return ROLE_AREAS[role]?.includes(area) ?? false;
}

export function canAccess(role: Role, path: string): boolean {
  return hasArea(role, areaForPath(path));
}

function pruneItem(item: NavItem, role: Role): NavItem | null {
  if (item.children) {
    const children: NavChild[] = item.children.filter((c) => canAccess(role, c.path));
    return children.length > 0 ? { ...item, children } : null;
  }
  return item.path && canAccess(role, item.path) ? item : null;
}

export function filterNavigation(groups: NavGroup[], role: Role): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .map((item) => pruneItem(item, role))
        .filter((item): item is NavItem => item !== null),
    }))
    .filter((group) => group.items.length > 0);
}
