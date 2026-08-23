import { useLocation } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import { getBreadcrumb } from "@/constants/navigation";
import { useSidebar } from "@/context/SidebarContext";
import LimitsWidget from "@/layouts/components/LimitsWidget";
import NotificationsDropdown from "@/layouts/components/NotificationsDropdown";
import ProfileDropdown from "@/layouts/components/ProfileDropdown";

export default function Topbar() {
  const { setMobileOpen } = useSidebar();
  const location = useLocation();
  const crumb = getBreadcrumb(location.pathname);

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 md:px-6">
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0">
        <p className="hidden text-[11px] font-medium tracking-wide text-slate-400 uppercase sm:block">
          {crumb.group} / {crumb.item}
          {crumb.child ? ` / ${crumb.child}` : ""}
        </p>
        <h2 className="truncate text-sm font-bold text-slate-900">{crumb.child ?? crumb.item}</h2>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search PNR, booking, customer..."
            className="h-9 w-56 rounded-lg border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:w-72 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/15 xl:w-72 xl:focus:w-80"
          />
        </div>

        <LimitsWidget />
        <NotificationsDropdown />

        <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

        <ProfileDropdown />
      </div>
    </header>
  );
}
