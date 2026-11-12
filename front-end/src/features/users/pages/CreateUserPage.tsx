import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { FormField, Input, PasswordInput, Select } from "@/components/ui/Input";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import { apiRequest } from "@/api/client";
import type {
  ApiAccessProfile,
  ApiBranch,
  ApiDepartment,
  ApiJobTitle,
  ApiPage,
  ApiUser,
} from "@/api/types";
import { PATHS } from "@/routes/paths";

const MODULES = [
  "Dashboard",
  "Booking Engine",
  "Company",
  "Users",
  "Traveller Profiles",
  "Pricing",
  "Reports",
  "Limits",
] as const;

type Perm = "view" | "create" | "edit" | "delete";
const PERMS: Perm[] = ["view", "create", "edit", "delete"];

const PERMISSION_TO_CELL: Record<string, { module: (typeof MODULES)[number]; perm: Perm }> = {
  "dashboard.read": { module: "Dashboard", perm: "view" },
  "booking.read": { module: "Booking Engine", perm: "view" },
  "booking.write": { module: "Booking Engine", perm: "create" },
  "company.read": { module: "Company", perm: "view" },
  "company.write": { module: "Company", perm: "edit" },
  "user.manage": { module: "Users", perm: "edit" },
  "traveller.read": { module: "Traveller Profiles", perm: "view" },
  "traveller.write": { module: "Traveller Profiles", perm: "create" },
  "pricing.read": { module: "Pricing", perm: "view" },
  "pricing.write": { module: "Pricing", perm: "edit" },
  "report.read": { module: "Reports", perm: "view" },
  "finance.read": { module: "Limits", perm: "view" },
  "finance.write": { module: "Limits", perm: "edit" },
};

function matrixFromKeys(keys: string[]) {
  const matrix = Object.fromEntries(
    MODULES.map((m) => [m, Object.fromEntries(PERMS.map((p) => [p, false]))]),
  ) as Record<string, Record<Perm, boolean>>;
  for (const key of keys) {
    const cell = PERMISSION_TO_CELL[key];
    if (!cell) continue;
    matrix[cell.module][cell.perm] = true;
    if (cell.perm === "create" || cell.perm === "edit") matrix[cell.module].view = true;
  }
  return matrix;
}

export default function CreateUserPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId } = useParams<{ userId?: string }>();
  const isEdit = Boolean(userId);
  const { data: branchData } = useQuery({
    queryKey: ["branches"],
    queryFn: () => apiRequest<ApiPage<ApiBranch>>("/branches?page_size=100"),
  });
  const { data: departmentData } = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiRequest<ApiPage<ApiDepartment>>("/departments?page_size=100"),
  });
  const { data: jobTitleData } = useQuery({
    queryKey: ["job-titles"],
    queryFn: () => apiRequest<ApiPage<ApiJobTitle>>("/job-titles?page_size=100"),
  });
  const { data: accessProfileData } = useQuery({
    queryKey: ["access-profiles"],
    queryFn: () => apiRequest<ApiPage<ApiAccessProfile>>("/access-profiles?page_size=100"),
  });
  const { data: existingUser, isLoading: loadingUser, error: loadError } = useQuery({
    queryKey: ["users", userId],
    queryFn: () => apiRequest<ApiUser>(`/users/${userId}`),
    enabled: isEdit,
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [branchId, setBranchId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [jobTitleId, setJobTitleId] = useState("");
  const [accessProfileId, setAccessProfileId] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!existingUser) return;
    const parts = existingUser.name.trim().split(/\s+/);
    setFirstName(parts[0] ?? "");
    setLastName(parts.slice(1).join(" "));
    setEmail(existingUser.email);
    setBranchId(existingUser.branchId ?? "");
    setDepartmentId(existingUser.departmentId ?? "");
    setJobTitleId(existingUser.jobTitleId ?? "");
    setAccessProfileId(existingUser.accessProfileId ?? "");
  }, [existingUser]);

  const selectedProfile = useMemo(
    () => (accessProfileData?.items ?? []).find((item) => item.id === accessProfileId),
    [accessProfileData, accessProfileId],
  );
  const matrix = useMemo(
    () => matrixFromKeys(selectedProfile?.permissionKeys ?? []),
    [selectedProfile],
  );

  const departments = useMemo(() => {
    const items = departmentData?.items ?? [];
    if (!branchId) return items;
    return items.filter((item) => !item.branchId || item.branchId === branchId);
  }, [departmentData, branchId]);

  const jobTitles = useMemo(() => {
    const items = jobTitleData?.items ?? [];
    if (!branchId) return items;
    return items.filter((item) => !item.branchId || item.branchId === branchId);
  }, [jobTitleData, branchId]);

  const accessProfiles = useMemo(() => {
    const items = accessProfileData?.items ?? [];
    if (!branchId) return items;
    return items.filter((item) => !item.branchId || item.branchId === branchId);
  }, [accessProfileData, branchId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSubmitError("");
    try {
      const body = {
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        branchId,
        departmentId,
        jobTitleId,
        accessProfileId,
      };
      if (isEdit && userId) {
        await apiRequest(`/users/${userId}`, { method: "PATCH", body });
      } else {
        await apiRequest("/users", {
          method: "POST",
          body: { ...body, email: email.trim(), password },
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      navigate(PATHS.users, { replace: true });
    } catch (reason) {
      setSubmitError(
        reason instanceof Error
          ? reason.message
          : isEdit
            ? "User could not be updated."
            : "User could not be created.",
      );
      setSaving(false);
    }
  };

  const valid =
    firstName.trim() &&
    lastName.trim() &&
    email.includes("@") &&
    branchId &&
    departmentId &&
    jobTitleId &&
    accessProfileId &&
    (isEdit || password.length >= 10);

  return (
    <>
      <PageHeader
        title={isEdit ? "Edit User" : "Create User"}
        description="Users must be linked to a branch, department, job title, and access profile."
      />

      {isEdit && loadingUser && <p className="mb-4 text-sm text-slate-500">Loading user...</p>}
      {isEdit && loadError && (
        <p className="mb-4 text-sm text-rose-600">
          {loadError instanceof Error ? loadError.message : "User could not be loaded."}
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Account Details">
          {submitError && (
            <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{submitError}</p>
          )}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-6">
            <FormField label="First name" required className="sm:col-span-3">
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" />
            </FormField>
            <FormField label="Last name" required className="sm:col-span-3">
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
            </FormField>
            <FormField label="Email address" required className="sm:col-span-3">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@jfktravel.com"
                disabled={isEdit}
              />
            </FormField>
            {!isEdit && (
              <FormField
                label="Temporary password"
                required
                hint="User will be prompted to change on first login"
                className="sm:col-span-3"
              >
                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
              </FormField>
            )}
            <FormField label="Sub company / Branch" required className="sm:col-span-3">
              <Select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">Select branch</option>
                {(branchData?.items ?? [])
                  .filter((item) => item.status === "active")
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.branchType})
                    </option>
                  ))}
              </Select>
            </FormField>
            <FormField label="Department" required className="sm:col-span-3">
              <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">Select department</option>
                {departments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Job title" required className="sm:col-span-3">
              <Select value={jobTitleId} onChange={(e) => setJobTitleId(e.target.value)}>
                <option value="">Select job title</option>
                {jobTitles.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              label="Access profile"
              required
              hint="Rights come from the selected access profile"
              className="sm:col-span-3"
            >
              <Select value={accessProfileId} onChange={(e) => setAccessProfileId(e.target.value)}>
                <option value="">Select access profile</option>
                {accessProfiles.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-5">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid || saving || (isEdit && loadingUser)}>
              {saving ? (isEdit ? "Saving..." : "Creating...") : (
                <>
                  <CircleCheck className="h-4 w-4" />
                  {isEdit ? "Update User" : "Create User"}
                </>
              )}
            </Button>
          </div>
        </Card>

        <Card
          title="Access Profile Preview"
          description="Read-only rights from the selected access profile. Edit rights on Access Profiles."
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
                        readOnly
                        disabled
                        className="h-4 w-4 rounded border-slate-300 accent-brand-600"
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
