import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/Input";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import { PATHS } from "@/routes/paths";
import { apiRequest } from "@/api/client";
import {
  apiStatus,
  type ApiAccessProfile,
  type ApiBranch,
  type ApiPage,
} from "@/api/types";

const ALL_PERMISSIONS = [
  "dashboard.read",
  "booking.read",
  "booking.write",
  "company.read",
  "company.write",
  "customer.read",
  "customer.write",
  "traveller.read",
  "traveller.write",
  "pricing.read",
  "pricing.write",
  "approval.decide",
  "finance.read",
  "finance.write",
  "report.read",
  "user.manage",
];

type Preset = { name: string; permissions: string[] };

export default function CreateAccessProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accessProfileId } = useParams<{ accessProfileId?: string }>();
  const isEdit = Boolean(accessProfileId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    branchId: "",
    fromPreset: "",
    status: "Active",
    permissionKeys: [] as string[],
  });

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: () => apiRequest<ApiPage<ApiBranch>>("/branches?page_size=100"),
  });
  const { data: presets } = useQuery({
    queryKey: ["access-profile-presets"],
    queryFn: () => apiRequest<Preset[]>("/access-profile-presets"),
  });
  const { data: profile, isLoading, error: loadError } = useQuery({
    queryKey: ["access-profiles", accessProfileId],
    queryFn: () => apiRequest<ApiAccessProfile>(`/access-profiles/${accessProfileId}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name,
      description: profile.description,
      branchId: profile.branchId ?? "",
      fromPreset: profile.presetKey ?? "",
      status: apiStatus(profile.status) === "Active" ? "Active" : "Inactive",
      permissionKeys: profile.permissionKeys,
    });
  }, [profile]);

  const toggleKey = (key: string) => {
    setForm((prev) => ({
      ...prev,
      permissionKeys: prev.permissionKeys.includes(key)
        ? prev.permissionKeys.filter((item) => item !== key)
        : [...prev.permissionKeys, key],
    }));
  };

  const applyPreset = (name: string) => {
    const preset = (presets ?? []).find((item) => item.name === name);
    setForm((prev) => ({
      ...prev,
      fromPreset: name,
      name: prev.name || name,
      permissionKeys: preset?.permissions ?? prev.permissionKeys,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        branchId: form.branchId || null,
        permissionKeys: form.permissionKeys,
        ...(form.fromPreset && !isEdit ? { fromPreset: form.fromPreset } : {}),
      };
      if (isEdit && accessProfileId) {
        await apiRequest(`/access-profiles/${accessProfileId}`, {
          method: "PATCH",
          body: { ...body, status: form.status.toLowerCase() },
        });
      } else {
        await apiRequest("/access-profiles", { method: "POST", body });
      }
      await queryClient.invalidateQueries({ queryKey: ["access-profiles"] });
      navigate(PATHS.accessProfiles.list, { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Access profile could not be saved.");
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={isEdit ? "Edit Access Profile" : "Create Access Profile"}
        description="Assign a rights matrix that users inherit when linked to this profile."
      />
      {isEdit && isLoading && <p className="mb-4 text-sm text-slate-500">Loading...</p>}
      {isEdit && loadError && (
        <p className="mb-4 text-sm text-rose-600">
          {loadError instanceof Error ? loadError.message : "Could not load access profile."}
        </p>
      )}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Profile details">
          {error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="grid grid-cols-1 gap-5">
            {!isEdit && (
              <FormField label="Start from preset">
                <Select value={form.fromPreset} onChange={(e) => applyPreset(e.target.value)}>
                  <option value="">Custom</option>
                  {(presets ?? []).map((preset) => (
                    <option key={preset.name} value={preset.name}>
                      {preset.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            )}
            <FormField label="Name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Sales Manager"
              />
            </FormField>
            <FormField label="Description">
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </FormField>
            <FormField label="Branch scope" hint="Leave blank for company-wide">
              <Select
                value={form.branchId}
                onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
              >
                <option value="">Company-wide</option>
                {(branches?.items ?? []).map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </Select>
            </FormField>
            {isEdit && (
              <FormField label="Status">
                <Select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </Select>
              </FormField>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!form.name.trim() || saving}>
              {saving ? "Saving..." : (
                <>
                  <CircleCheck className="h-4 w-4" />
                  {isEdit ? "Update" : "Create"}
                </>
              )}
            </Button>
          </div>
        </Card>
        <Card title="Rights matrix" description="Select permission keys granted by this profile.">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ALL_PERMISSIONS.map((key) => (
              <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.permissionKeys.includes(key)}
                  onChange={() => toggleKey(key)}
                  className="h-4 w-4 rounded border-slate-300 accent-brand-600"
                />
                <span className="font-mono text-xs">{key}</span>
              </label>
            ))}
          </div>
        </Card>
      </form>
    </>
  );
}
