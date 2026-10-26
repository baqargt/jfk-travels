import { NavLink, useLocation } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, Plane } from "lucide-react";
import { useState } from "react";
import { NAV_GROUPS } from "@/constants/navigation";
import { filterNavigation } from "@/constants/permissions";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const { collapsed, toggleCollapsed } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();
  const groups = user ? filterNavigation(NAV_GROUPS, user.role) : NAV_GROUPS;
  const [openItem, setOpenItem] = useState<string | null>(() => {
    const match = groups.flatMap((g) => g.items).find(
      (item) => item.children?.some((c) => location.pathname.startsWith(c.path)),
    );
    return match?.label ?? null;
  });

  const rail = collapsed;

  const handleParentClick = (label: string, hasChildren: boolean) => {
    if (rail) {
      if (collapsed) toggleCollapsed();
      setOpenItem(label);
      return;
    }
    setOpenItem((cur) => (cur === label ? null : label));
    if (!hasChildren) onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-400">
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-3 border-b border-slate-800 px-4",
          rail && "justify-center px-2",
        )}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-600 text-white shadow-lg shadow-brand-600/30">
          <Plane className="h-5 w-5" />
        </span>
        {!rail && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-white">JFK Travel</p>
            <p className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
              ERP Suite
            </p>
          </div>
        )}
      </div>

      <nav className={cn("flex-1 overflow-y-auto overflow-x-hidden py-4", rail ? "px-2" : "px-3")}>
        {groups.map((group) => (
          <div key={group.title} className="mb-1 last:mb-0">
            <p
              className={cn(
                "px-3 pt-3 pb-1.5 text-[10px] font-semibold tracking-widest text-slate-600 uppercase",
                rail && "sr-only",
              )}
            >
              {group.title}
            </p>
            {rail && <div className="mx-2 mb-2 mt-3 border-t border-slate-800" />}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const childActive = item.children?.some((c) =>
                  c.path === location.pathname || (c.path !== "/" && location.pathname.startsWith(c.path + "/")),
                );
                const selfActive = item.path === location.pathname;
                const expanded = !rail && openItem === item.label;

                if (item.children) {
                  return (
                    <li key={item.label}>
                      <button
                        type="button"
                        onClick={() => handleParentClick(item.label, true)}
                        title={item.label}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          rail && "justify-center px-0",
                          childActive ? "bg-slate-800 text-white" : "hover:bg-slate-800/60 hover:text-white",
                        )}
                      >
                        <item.icon className={cn("h-[18px] w-[18px] shrink-0", childActive && "text-brand-400")} />
                        {!rail && (
                          <>
                            <span className="flex-1 truncate text-left">{item.label}</span>
                            <svg
                              viewBox="0 0 20 20"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              className={cn("h-4 w-4 text-slate-500 transition-transform", expanded && "rotate-180")}
                            >
                              <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </>
                        )}
                      </button>
                      {expanded && item.children && (
                        <ul className="mt-0.5 mb-1 ml-[22px] space-y-0.5 border-l border-slate-800 pl-3">
                          {item.children.map((child) => (
                            <li key={child.path}>
                              <NavLink
                                to={child.path}
                                end
                                onClick={onNavigate}
                                title={child.label}
                                className={({ isActive }) =>
                                  cn(
                                    "relative flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors",
                                    isActive
                                      ? "bg-brand-600/15 font-medium text-white before:absolute before:top-1/2 before:-left-[13px] before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-brand-400"
                                      : "text-slate-400 hover:bg-slate-800/60 hover:text-white",
                                  )
                                }
                              >
                                <child.icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                <span className="truncate">{child.label}</span>
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                }

                return (
                  <li key={item.path ?? item.label}>
                    <NavLink
                      to={item.path!}
                      end
                      onClick={onNavigate}
                      title={item.label}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          rail && "justify-center px-0",
                          isActive
                            ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25"
                            : "hover:bg-slate-800/60 hover:text-white",
                        )
                      }
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!rail && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div
        className={cn(
          "shrink-0 border-t border-slate-800 p-3",
          rail && "flex justify-center p-2",
        )}
      >
        {!rail ? (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-800/60 hover:text-white"
          >
            <ChevronsLeft className="h-[18px] w-[18px]" />
            Collapse menu
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleCollapsed}
            title="Expand menu"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-800/60 hover:text-white"
          >
            <ChevronsRight className="h-[18px] w-[18px]" />
          </button>
        )}
        {!rail && (
          <p className="px-3 pt-2 pb-1 text-[10px] text-slate-600">v1.0.1 · © JFK Travel Group</p>
        )}
      </div>
    </div>
  );
}
