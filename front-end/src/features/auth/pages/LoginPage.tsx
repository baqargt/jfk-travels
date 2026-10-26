import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Input, { FormField, PasswordInput } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import AuthLayout, { BrandPanel } from "@/layouts/AuthLayout";
import { PATHS } from "@/routes/paths";

const DEMO_PASSWORD = "+321456";

const QUICK_ACCOUNTS = [
  { label: "Baqar · Admin", email: "baqar@jfktravel.com" },
  { label: "Iqra · Manager", email: "Iqra@jfktravel.com" },
  { label: "Usman · Agent", email: "usman@jfktravel.com" },
  { label: "Nadia · Accounts", email: "nadia@jfktravel.com" },
  { label: "Fahad · Sub Agent", email: "fahad@blueline.com" },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to={from ?? PATHS.dashboard} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from ?? PATHS.dashboard, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="grid min-h-screen lg:grid-cols-2">
        <BrandPanel />

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
              </span>
              <div>
                <p className="text-base font-bold text-slate-900">JFK Travel ERP</p>
                <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">Enterprise Suite</p>
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Sign in to your agency workspace to continue.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              {error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <FormField label="Email address" required>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@agency.com"
                  autoComplete="email"
                  autoFocus
                  required
                />
              </FormField>

              <FormField label="Password" required>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </FormField>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-brand-600"
                  />
                  Remember me
                </label>
                <a href="#" className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline">
                  Forgot password?
                </a>
              </div>

              <Button type="submit" disabled={loading} className="w-full !py-2.5">
                {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 rounded-lg border border-dashed border-brand-300 bg-brand-50/60 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-brand-800">Quick sign-in (demo)</p>
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-brand-700 uppercase">
                  Role-based access
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {QUICK_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword(DEMO_PASSWORD);
                      setError("");
                    }}
                    className="rounded-md border border-brand-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
                    title={acc.email}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-brand-600">
                Password sab users ke liye ek hai — click any chip to autofill.
              </p>
            </div>

            <p className="mt-8 text-center text-xs text-slate-400 lg:hidden">
              © 2026 JFK Travel Group LLC · Enterprise ERP Suite
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
