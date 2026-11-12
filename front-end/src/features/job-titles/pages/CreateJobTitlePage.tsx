import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Input";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import { PATHS } from "@/routes/paths";
import { apiRequest } from "@/api/client";
import { apiStatus, type ApiBranch, type ApiJobTitle, type ApiPage } from "@/api/types";

export default function CreateJobTitlePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { jobTitleId } = useParams<{ jobTitleId?: string }>();
  const isEdit = Boolean(jobTitleId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", branchId: "", status: "Active" });

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: () => apiRequest<ApiPage<ApiBranch>>("/branches?page_size=100"),
  });
  const { data: jobTitle, isLoading, error: loadError } = useQuery({
    queryKey: ["job-titles", jobTitleId],
    queryFn: () => apiRequest<ApiJobTitle>(`/job-titles/${jobTitleId}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!jobTitle) return;
    setForm({
      name: jobTitle.name,
      branchId: jobTitle.branchId ?? "",
      status: apiStatus(jobTitle.status) === "Active" ? "Active" : "Inactive",
    });
  }, [jobTitle]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = {
        name: form.name.trim(),
        branchId: form.branchId || null,
      };
      if (isEdit && jobTitleId) {
        await apiRequest(`/job-titles/${jobTitleId}`, {
          method: "PATCH",
          body: { ...body, status: form.status.toLowerCase() },
        });
      } else {
        await apiRequest("/job-titles", { method: "POST", body });
      }
      await queryClient.invalidateQueries({ queryKey: ["job-titles"] });
      navigate(PATHS.jobTitles.list, { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Job title could not be saved.");
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={isEdit ? "Edit Job Title" : "Create Job Title"}
        description="Job titles can be company-wide or scoped to a branch/franchise."
      />
      {isEdit && isLoading && <p className="mb-4 text-sm text-slate-500">Loading...</p>}
      {isEdit && loadError && (
        <p className="mb-4 text-sm text-rose-600">
          {loadError instanceof Error ? loadError.message : "Could not load job title."}
        </p>
      )}
      <Card>
        <form onSubmit={handleSubmit} className="grid max-w-2xl grid-cols-1 gap-5 sm:grid-cols-2">
          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2">{error}</p>
          )}
          <FormField label="Name" required className="sm:col-span-2">
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Sales Executive"
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
          <div className="flex justify-end gap-2 sm:col-span-2">
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
        </form>
      </Card>
    </>
  );
}
