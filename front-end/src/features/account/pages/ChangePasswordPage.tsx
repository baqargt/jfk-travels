import { useState, type FormEvent } from "react";
import { Check, CircleCheck, KeyRound, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/api/client";
import Button from "@/components/ui/Button";
import { FormField, PasswordInput } from "@/components/ui/Input";
import PageHeader, { Card } from "@/components/ui/PageHeader";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const longEnough = newPassword.length >= 10;
  const isDifferent = Boolean(currentPassword) && newPassword !== currentPassword;
  const matches = Boolean(confirmPassword) && newPassword === confirmPassword;
  const valid = Boolean(currentPassword) && longEnough && isDifferent && matches;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await apiRequest<void>("/auth/password", {
        method: "PUT",
        body: { currentPassword, newPassword },
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Your password has been changed. Other active sessions were signed out.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your password could not be changed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Change Password"
        description="Update your sign-in password and protect your account."
      />

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="lg:col-span-2">
          <Card title="Set a new password" description="Confirm your current password before making this change.">
            {error && <p role="alert" className="mb-5 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            {success && (
              <p role="status" className="mb-5 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
                {success}
              </p>
            )}
            <div className="space-y-5">
              <FormField label="Current password" required>
                <PasswordInput
                  value={currentPassword}
                  onChange={(event) => { setCurrentPassword(event.target.value); setSuccess(""); }}
                  autoComplete="current-password"
                />
              </FormField>
              <FormField
                label="New password"
                required
                error={newPassword && !longEnough ? "Use at least 10 characters." : undefined}
              >
                <PasswordInput
                  value={newPassword}
                  onChange={(event) => { setNewPassword(event.target.value); setSuccess(""); }}
                  autoComplete="new-password"
                />
              </FormField>
              <FormField
                label="Confirm new password"
                required
                error={confirmPassword && !matches ? "Passwords do not match." : undefined}
              >
                <PasswordInput
                  value={confirmPassword}
                  onChange={(event) => { setConfirmPassword(event.target.value); setSuccess(""); }}
                  autoComplete="new-password"
                />
              </FormField>
            </div>
            <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
              <Button type="submit" disabled={saving || !valid}>
                <KeyRound className="h-4 w-4" />
                {saving ? "Updating..." : "Update password"}
              </Button>
            </div>
          </Card>
        </form>

        <Card title="Password security" className="h-fit">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Choose a password that is unique to this account and difficult to guess.
          </p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              At least 10 characters
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              Different from your current password
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              Other browser sessions are signed out
            </li>
          </ul>
        </Card>
      </div>
    </>
  );
}
