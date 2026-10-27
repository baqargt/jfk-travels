import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CircleCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Input";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import { PATHS } from "@/routes/paths";
import { apiRequest } from "@/api/client";

const STATUS = ["Active", "Inactive"] as const;

export default function CreateDepartmentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    head: "",
    users: "0",
    status: "Active" as (typeof STATUS)[number],
  });

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest("/departments", {
        method: "POST",
        body: { name: form.name.trim(), headName: form.head.trim() },
      });
      await queryClient.invalidateQueries({ queryKey: ["departments"] });
      navigate(PATHS.departments.list, { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Department could not be created.");
      setSaving(false);
    }
  };

  const valid = form.name.trim().length > 0;

  return (
    <>
      <PageHeader
        title="Create Department"
        description="Add a new department under the JFK Travel umbrella."
      />

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
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !valid}>
              {saving ? "Creating..." : (
                <>
                  <CircleCheck className="h-4 w-4" />
                  Create Department
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
    </>
  );
}
