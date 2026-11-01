import { useEffect, useState, type FormEvent } from "react";
import { CircleCheck, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import Button from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Input";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { initials } from "@/lib/utils";

export default function ProfileSettingsPage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
  }, [user?.name, user?.email]);

  if (!user) return null;

  const nameError = name.trim().length < 2 ? "Enter at least 2 characters." : "";
  const emailError = !/^\S+@\S+\.\S+$/.test(email.trim()) ? "Enter a valid email address." : "";
  const unchanged = name.trim() === user.name && email.trim().toLowerCase() === user.email.toLowerCase();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (nameError || emailError || unchanged) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateProfile(name, email);
      setSuccess("Your profile has been updated.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your profile could not be updated.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Profile Settings"
        description="Manage the personal details shown across your account."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1" title="Account overview">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
              {initials(user.name)}
            </div>
            <p className="mt-4 text-base font-semibold text-slate-900">{user.name}</p>
            <p className="mt-1 text-sm text-slate-500">{user.email}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              {user.role}
            </span>
          </div>
          <dl className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Roles</dt>
              <dd className="text-right font-medium text-slate-800">{user.roles.join(", ")}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">Branch access</dt>
              <dd className="font-medium text-slate-800">{user.branchId ? "Assigned branch" : "Head office"}</dd>
            </div>
          </dl>
        </Card>

        <form onSubmit={handleSubmit} className="lg:col-span-2">
          <Card
            title="Personal information"
            description="Changes appear immediately in the profile menu."
          >
            {error && <p role="alert" className="mb-5 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            {success && (
              <p role="status" className="mb-5 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <CircleCheck className="h-4 w-4" />
                {success}
              </p>
            )}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField label="Full name" required error={name && nameError ? nameError : undefined}>
                <div className="relative">
                  <UserRound className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={name}
                    onChange={(event) => { setName(event.target.value); setSuccess(""); }}
                    autoComplete="name"
                    className="pl-9"
                  />
                </div>
              </FormField>
              <FormField label="Email address" required error={email && emailError ? emailError : undefined}>
                <div className="relative">
                  <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => { setEmail(event.target.value); setSuccess(""); }}
                    autoComplete="email"
                    className="pl-9"
                  />
                </div>
              </FormField>
            </div>
            <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
              <Button type="submit" disabled={saving || Boolean(nameError) || Boolean(emailError) || unchanged}>
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </>
  );
}
