import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CircleCheck, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import { FormField, Input, PasswordInput, Select } from "@/components/ui/Input";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import { subCompanies } from "@/lib/mockData";
import { PATHS } from "@/routes/paths";
import type { Role } from "@/types";

const MODULES = [
  "Dashboard",
  "Booking Engine",
  "Company",
  "Users",
  "Customers",
  "Pricing",
  "Reports",
  "Limits",
] as const;

const BOOKING_ACCESS = ["All", "Air", "Hotel", "Insurance", "Transfer", "Holiday", "Sightseeing", "Fix Departure", "A to A"] as const;
const REPORT_ACCESS = ["All", "DSR", "Air", "Non-Air"] as const;
const TRANSACTION_ACCESS = ["All", "Own", "Users", "Branch", "Head Office", "Sub-Agent"] as const;
const DASHBOARD_ITEMS = [
  "Total Sales & Expenses",
  "Month-wise Query Flow",
  "Top Selling Destinations",
  "Top 10 Agents",
  "Top 10 Suppliers",
  "Top 10 Airlines",
  "Limit Utilization",
  "Settlement due",
  "Query Source",
  "Query-wise Status",
  "Quick Booking",
  "Transaction Table",
] as const;

type Perm = "view" | "create" | "edit" | "delete";
const PERMS: Perm[] = ["view", "create", "edit", "delete"];

type Matrix = Record<string, Record<Perm, boolean>>;

function emptyMatrix(): Matrix {
  return Object.fromEntries(MODULES.map((m) => [m, Object.fromEntries(PERMS.map((p) => [p, false]))])) as Matrix;
}

const ROLE_PRESETS: Record<Role, (m: string, p: Perm) => boolean> = {
  Administrator: () => true,
  Manager: (m, p) => !(p === "delete" && (m === "Users" || m === "Company")),
  Agent: (m, p) =>
    m === "Booking Engine" ? p !== "delete" : m === "Customers" ? p === "view" || p === "create" : m === "Reports" || m === "Dashboard" ? p === "view" : false,
  Accounts: (m) => m === "Reports" || m === "Limits" || m === "Dashboard",
  "Sub Agent": (m, p) => (m === "Booking Engine" || m === "Customers") && p !== "delete",
};

export default function CreateUserPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("Agent");
  const [subCompany, setSubCompany] = useState(subCompanies[0].name);
  const [matrix, setMatrix] = useState<Matrix>(() => {
    const m = emptyMatrix();
    MODULES.forEach((mod) => PERMS.forEach((p) => (m[mod][p] = ROLE_PRESETS.Agent(mod, p))));
    return m;
  });
  const [saving, setSaving] = useState(false);
  const [bookingAccess, setBookingAccess] = useState<string>("All");
  const [reportAccess, setReportAccess] = useState<string>("All");
  const [transactionAccess, setTransactionAccess] = useState<string>("All");
  const [dashboardAccess, setDashboardAccess] = useState<Set<string>>(new Set(DASHBOARD_ITEMS));

  const applyRole = (next: Role) => {
    setRole(next);
    const m = emptyMatrix();
    MODULES.forEach((mod) => PERMS.forEach((p) => (m[mod][p] = ROLE_PRESETS[next](mod, p))));
    setMatrix(m);
  };

  const flip = (mod: string, perm: Perm) =>
    setMatrix((prev) => ({ ...prev, [mod]: { ...prev[mod], [perm]: !prev[mod][perm] } }));

  const toggleDashboardItem = (item: string) =>
    setDashboardAccess((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    navigate(PATHS.users, { replace: true });
  };

  const valid =
    firstName.trim() && lastName.trim() && email.includes("@") && password.length >= 4;

  return (
    <>
      <PageHeader
        title="Create User"
        description="Add a platform account and define granular role-based permissions."
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Account Details">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="First name" required>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" />
            </FormField>
            <FormField label="Last name" required>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
            </FormField>
            <FormField label="Email address" required className="sm:col-span-2">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@jfktravel.com" />
            </FormField>
            <FormField label="Temporary password" required hint="User will be prompted to change on first login">
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
            </FormField>
            <FormField label="Sub company">
              <Select value={subCompany} onChange={(e) => setSubCompany(e.target.value)}>
                {[{ id: "HQ", name: "Head Office" }, ...subCompanies].map((s) => (
                  <option key={s.id}>{s.name}</option>
                ))}
              </Select>
            </FormField>
            <FormField
              label="Role"
              required
              hint={`Presets a sensible permission baseline — refine below`}
            >
              <Select value={role} onChange={(e) => applyRole(e.target.value as Role)}>
                {(Object.keys(ROLE_PRESETS) as Role[]).map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Booking Access" hint="Modules this user can book">
              <Select value={bookingAccess} onChange={(e) => setBookingAccess(e.target.value)}>
                {BOOKING_ACCESS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Report Access" hint="Reports this user can view">
              <Select value={reportAccess} onChange={(e) => setReportAccess(e.target.value)}>
                {REPORT_ACCESS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Transaction" hint="Scope of transactions visible to this user">
              <Select value={transactionAccess} onChange={(e) => setTransactionAccess(e.target.value)}>
                {TRANSACTION_ACCESS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Dashboard Access" hint="Multi-select dashboard widgets" className="sm:col-span-2">
              <div className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-2">
                {DASHBOARD_ITEMS.map((item) => (
                  <label key={item} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={dashboardAccess.has(item)}
                      onChange={() => toggleDashboardItem(item)}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-brand-600"
                    />
                    {item}
                  </label>
                ))}
              </div>
            </FormField>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-5">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid || saving}>
              {saving ? "Creating..." : (
                <>
                  <CircleCheck className="h-4 w-4" />
                  Create User
                </>
              )}
            </Button>
          </div>
        </Card>

        <Card
          title="Access Control (RBAC)"
          description="Toggle module-level permissions for this user"
          actions={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applyRole(role)}
              title="Reapply role preset"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to preset
            </Button>
          }
          bodyClassName="p-0 overflow-x-auto"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                <th className="px-5 py-3 text-left">Module</th>
                {PERMS.map((p) => (
                  <th key={p} className="px-3 py-3 text-center capitalize">
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MODULES.map((mod) => (
                <tr key={mod} className="hover:bg-slate-50/60">
                  <td className="px-5 py-2.5 font-medium text-slate-700">{mod}</td>
                  {PERMS.map((perm) => (
                    <td key={perm} className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={matrix[mod][perm]}
                        onChange={() => flip(mod, perm)}
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-brand-600"
                        aria-label={`${perm} ${mod}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </form>
    </>
  );
}
