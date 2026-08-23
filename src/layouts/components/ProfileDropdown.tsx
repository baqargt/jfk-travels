import { useNavigate } from "react-router-dom";
import { ChevronDown, LifeBuoy, Lock, LogOut, Settings } from "lucide-react";
import Dropdown from "@/components/ui/Dropdown";
import { useAuth } from "@/context/AuthContext";
import { initials } from "@/lib/utils";
import { PATHS } from "@/routes/paths";

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate(PATHS.login, { replace: true });
  };

  return (
    <Dropdown
      panelClassName="w-60"
      trigger={
        <span className="flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-slate-100">
          <span className="grid h-8.5 w-8.5 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
            {initials(user.name)}
          </span>
          <span className="hidden leading-tight md:block">
            <span className="block max-w-32 truncate text-xs font-semibold text-slate-800">{user.name}</span>
            <span className="block text-[10px] text-slate-400">{user.role}</span>
          </span>
          <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 md:block" />
        </span>
      }
    >
      <div>
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">{user.name}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{user.email}</p>
        </div>
        <ul className="p-1.5">
          {[
            { label: "Profile Settings", icon: Settings },
            { label: "Change Password", icon: Lock },
            { label: "Help & Support", icon: LifeBuoy },
          ].map(({ label, icon: Icon }) => (
            <li key={label}>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <Icon className="h-4 w-4 text-slate-400" />
                {label}
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-slate-100 p-1.5">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </Dropdown>
  );
}
