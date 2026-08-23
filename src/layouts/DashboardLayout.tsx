import { Outlet } from "react-router-dom";
import { X } from "lucide-react";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import Sidebar from "@/layouts/components/Sidebar";
import Topbar from "@/layouts/components/Topbar";
import { cn } from "@/lib/utils";

function Shell() {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <aside
        className={cn(
          "hidden shrink-0 transition-[width] duration-200 lg:block",
          collapsed ? "w-[76px]" : "w-72",
        )}
      >
        <Sidebar />
      </aside>

      <div className="lg:hidden">
        <div
          className={cn(
            "fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-[2px] transition-opacity",
            mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 shadow-2xl transition-transform duration-300 lg:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-3 z-10 grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl animate-fade-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <Shell />
    </SidebarProvider>
  );
}
