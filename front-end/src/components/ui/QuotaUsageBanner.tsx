import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/api/client";
import type { ApiCompany } from "@/api/types";

type QuotaKind = "subCompanies" | "users" | "travellers";

const LABELS: Record<QuotaKind, string> = {
  subCompanies: "Sub companies",
  users: "Users",
  travellers: "Traveller profiles",
};

export default function QuotaUsageBanner({ kind }: { kind: QuotaKind }) {
  const { data } = useQuery({
    queryKey: ["company"],
    queryFn: () => apiRequest<ApiCompany>("/company"),
  });
  if (!data?.usage) return null;

  const used =
    kind === "subCompanies"
      ? data.usage.subCompanies
      : kind === "users"
        ? data.usage.users
        : data.usage.travellers;
  const max =
    kind === "subCompanies"
      ? data.maxSubCompanies
      : kind === "users"
        ? data.maxUsers
        : data.maxTravellers;
  const remaining = Math.max(0, max - used);
  const atLimit = remaining === 0;

  return (
    <div
      className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
        atLimit
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <span className="font-medium">{LABELS[kind]}:</span> {used} of {max} used
      {atLimit ? " — limit reached. Contact your platform administrator to raise the quota." : ` (${remaining} remaining).`}
    </div>
  );
}
