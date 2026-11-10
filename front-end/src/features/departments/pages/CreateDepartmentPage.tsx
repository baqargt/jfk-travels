import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Input";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import { PATHS } from "@/routes/paths";
import { apiRequest } from "@/api/client";
import { apiStatus, type ApiDepartment } from "@/api/types";

const STATUS = ["Active", "Inactive"] as const;

export default function CreateDepartmentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { departmentId } = useParams<{ departmentId?: string }>();
  const isEdit = Boolean(departmentId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    head: "",
    users: "0",
    status: "Active" as (typeof STATUS)[number],
  });

  const { data: department, isLoading, error: loadError } = useQuery({
    queryKey: ["departments", departmentId],
    queryFn: () => apiRequest<ApiDepartment>(`/departments/${departmentId}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!department) return;
    setForm({
      name: department.name,
      head: department.headName,
      users: String(department.users ?? 0),
      status: apiStatus(department.status) === "Active" ? "Active" : "Inactive",
    });
  }, [department]);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isEdit && departmentId) {
        await apiRequest(`/departments/${departmentId}`, {
          method: "PATCH",
          body: {
            name: form.name.trim(),
            headName: form.head.trim(),
            status: form.status.toLowerCase(),
          },
        });
      } else {
        await apiRequest("/departments", {
          method: "POST",
          body: { name: form.name.trim(), headName: form.head.trim() },
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["departments"] });
      navigate(PATHS.departments.list, { replace: true });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : isEdit
            ? "Department could not be updated."
            : "Department could not be created.",
      );
      setSaving(false);
    }
  };

  const valid = form.name.trim().length > 0;

  return (
    <>
      <PageHeader
        title={isEdit ? "Edit Department" : "Create Department"}
        description={
          isEdit
            ? "Update department details under the JFK Travel umbrella."
            : "Add a new department under the JFK Travel umbrella."
        }
      />

      {isEdit && isLoading && <p className="mb-4 text-sm text-slate-500">Loading department...</p>}
      {isEdit && loadError && (
        <p className="mb-4 text-sm text-rose-600">
          {loadError instanceof Error ? loadError.message : "Department could not be loaded."}
        </p>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <Card title="Department Details">
          {error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="Department name" required>
              <Input value={form.name} onChange={set("name")} placeholder="e.g. IT" />
            </FormField>
            <FormField label="Department head">
              <Input value={form.head} onChange={set("head")} placeholder="e.g. Usman Tariq" />
            </FormField>
            <FormField label="Users">
              <Input
                type="number"
                min="0"
                value={form.users}
                onChange={set("users")}
                placeholder="0"
                disabled={isEdit}
              />
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onChange={set("status")}>
                {STATUS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-5">
            <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !valid || (isEdit && isLoading)}>
              {saving ? (isEdit ? "Saving..." : "Creating...") : (
                <>
                  <CircleCheck className="h-4 w-4" />
                  {isEdit ? "Update Department" : "Create Department"}
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
    </>
  );
}
