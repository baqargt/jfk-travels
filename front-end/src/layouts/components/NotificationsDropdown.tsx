import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bell, CircleCheck, Info } from "lucide-react";
import Dropdown from "@/components/ui/Dropdown";
import { apiRequest } from "@/api/client";
import type { ApiNotification, ApiPage } from "@/api/types";
import { cn } from "@/lib/utils";

const icons = {
  info: { Icon: Info, cls: "bg-brand-50 text-brand-600" },
  warning: { Icon: AlertTriangle, cls: "bg-amber-50 text-amber-600" },
  success: { Icon: CircleCheck, cls: "bg-emerald-50 text-emerald-600" },
};

export default function NotificationsDropdown() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiRequest<ApiPage<ApiNotification>>("/notifications?page_size=50"),
    refetchInterval: 60_000,
  });
  const items = data?.items ?? [];
  const markRead = useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const unread = items.filter((n) => n.unread).length;

  return (
    <Dropdown
      panelClassName="w-[22rem]"
      trigger={
        <span className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
              {unread}
            </span>
          )}
        </span>
      }
    >
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">Notifications</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              items.filter((item) => item.unread).forEach((item) => markRead.mutate(item.id));
            }}
            className="text-xs font-medium text-brand-600 hover:underline"
          >
            Mark all read
          </button>
        </div>
        <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
          {items.map((n) => {
            const { Icon, cls } = icons[n.type];
            return (
              <li key={n.id} onClick={() => n.unread && markRead.mutate(n.id)} className={cn("flex cursor-pointer gap-3 px-4 py-3", n.unread && "bg-brand-50/40")}>
                <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg", cls)}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] leading-snug font-semibold text-slate-800">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">{n.message}</p>
                  <p className="mt-1 text-[10px] font-medium tracking-wide text-slate-400 uppercase">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {n.unread && <span className="ml-auto mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
              </li>
            );
          })}
        </ul>
      </div>
    </Dropdown>
  );
}
