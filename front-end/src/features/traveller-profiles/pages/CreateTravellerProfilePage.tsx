import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/Input";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import { countries } from "@/lib/bookingData";
import { PATHS } from "@/routes/paths";
import { apiRequest } from "@/api/client";
import type { ApiTraveller } from "@/api/types";

const TITLE_OPTIONS = ["Mr", "Mrs", "Ms", "Miss", "Master", "Dr"] as const;

const emptyForm = {
  title: "",
  firstName: "",
  lastName: "",
  dob: "",
  gender: "Prefer not to say",
  nationality: countries[0],
  email: "",
  phone: "",
  address: "",
  city: "",
  country: countries[0],
  passportNo: "",
  passportExpiry: "",
  visaNotes: "",
  seatPref: "Window",
  mealPref: "Standard",
  notes: "",
};

function prefString(preferences: Record<string, unknown>, key: string, fallback: string) {
  const value = preferences[key];
  return typeof value === "string" && value ? value : fallback;
}

export default function CreateTravellerProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { travellerId } = useParams<{ travellerId?: string }>();
  const isEdit = Boolean(travellerId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  const { data: traveller, isLoading, error: loadError } = useQuery({
    queryKey: ["travellers", travellerId],
    queryFn: () => apiRequest<ApiTraveller>(`/travellers/${travellerId}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!traveller) return;
    const preferences = traveller.preferences ?? {};
    setForm({
      title: prefString(preferences, "title", ""),
      firstName: traveller.firstName,
      lastName: traveller.lastName,
      dob: traveller.dateOfBirth ?? "",
      gender: prefString(preferences, "gender", "Prefer not to say"),
      nationality: prefString(preferences, "nationality", countries[0]),
      email: traveller.email,
      phone: traveller.phone,
      address: prefString(preferences, "address", ""),
      city: traveller.city,
      country: traveller.country || countries[0],
      passportNo: "",
      passportExpiry: traveller.passportExpiry ?? "",
      visaNotes: prefString(preferences, "visaNotes", ""),
      seatPref: prefString(preferences, "seat", "Window"),
      mealPref: prefString(preferences, "meal", "Standard"),
      notes: prefString(preferences, "notes", ""),
    });
  }, [traveller]);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone,
      city: form.city,
      country: form.country,
      dateOfBirth: form.dob || null,
      passportNumber: form.passportNo,
      passportExpiry: form.passportExpiry || null,
      preferences: {
        title: form.title,
        gender: form.gender,
        nationality: form.nationality,
        address: form.address,
        visaNotes: form.visaNotes,
        seat: form.seatPref,
        meal: form.mealPref,
        notes: form.notes,
      },
    };
    try {
      if (isEdit && travellerId) {
        await apiRequest(`/travellers/${travellerId}`, { method: "PUT", body });
      } else {
        await apiRequest("/travellers", { method: "POST", body });
      }
      await queryClient.invalidateQueries({ queryKey: ["travellers"] });
      await queryClient.invalidateQueries({ queryKey: ["company"] });
      navigate(PATHS.travellerProfiles, { replace: true });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : isEdit
            ? "Traveller could not be updated."
            : "Traveller could not be created.",
      );
      setSaving(false);
    }
  };

  const displayName = [form.title, form.firstName.trim()].filter(Boolean).join(" ") || "…";
  const pageTitle = isEdit
    ? `Edit Traveller Profile — ${displayName}`
    : form.firstName.trim()
      ? `Create Traveller Profile — ${displayName}`
      : "Create Traveller Profile";

  return (
    <>
      <PageHeader
        title={pageTitle}
        description={
          isEdit
            ? "Update traveller contact and travel document details."
            : "Onboard a new traveller with contact and travel document details."
        }
      />

      {isEdit && isLoading && <p className="mb-4 text-sm text-slate-500">Loading traveller...</p>}
      {isEdit && loadError && (
        <p className="mb-4 text-sm text-rose-600">
          {loadError instanceof Error ? loadError.message : "Traveller could not be loaded."}
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 xl:col-span-2">{error}</p>}
        <div className="space-y-6">
          <Card title="Personal Information">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField label="Title" required>
                <Select value={form.title} onChange={set("title")}>
                  <option value="">Select</option>
                  {TITLE_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="First name" required>
                <Input value={form.firstName} onChange={set("firstName")} placeholder="Jane" />
              </FormField>
              <FormField label="Last name" required>
                <Input value={form.lastName} onChange={set("lastName")} placeholder="Doe" />
              </FormField>
              <FormField label="Date of birth">
                <Input type="date" value={form.dob} onChange={set("dob")} />
              </FormField>
              <FormField label="Gender">
                <Select value={form.gender} onChange={set("gender")}>
                  {["Prefer not to say", "Female", "Male", "Other"].map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </Select>
              </FormField>
            </div>
          </Card>

          <Card title="Contact Details">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField label="Email address" required>
                <Input type="email" value={form.email} onChange={set("email")} placeholder="jane@example.com" />
              </FormField>
              <FormField label="Phone number">
                <Input value={form.phone} onChange={set("phone")} placeholder="+1 ..." />
              </FormField>
              <FormField label="Address" className="sm:col-span-2">
                <Textarea rows={2} value={form.address} onChange={set("address")} />
              </FormField>
              <FormField label="City">
                <Input value={form.city} onChange={set("city")} />
              </FormField>
              <FormField label="Country">
                <Select value={form.country} onChange={set("country")}>
                  {countries.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </FormField>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Travel Documents">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField label="Nationality">
                <Select value={form.nationality} onChange={set("nationality")}>
                  {countries.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </FormField>
              <FormField
                label="Passport number"
                hint={isEdit && traveller?.passportMasked ? `Current: ${traveller.passportMasked}. Leave blank to keep.` : undefined}
              >
                <Input value={form.passportNo} onChange={set("passportNo")} placeholder="X1234567" className="font-mono" />
              </FormField>
              <FormField label="Passport expiry" className="sm:col-span-2">
                <Input type="date" value={form.passportExpiry} onChange={set("passportExpiry")} />
              </FormField>
              <FormField
                label="Visa / document notes"
                className="sm:col-span-2"
                hint="Existing visas, restrictions or prior refusals"
              >
                <Textarea value={form.visaNotes} onChange={set("visaNotes")} />
              </FormField>
            </div>
          </Card>

          <Card title="Preferences">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField label="Seat preference">
                <Select value={form.seatPref} onChange={set("seatPref")}>
                  {["Window", "Aisle", "No preference"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Meal preference">
                <Select value={form.mealPref} onChange={set("mealPref")}>
                  {["Standard", "Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free"].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </Select>
              </FormField>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-5">
              <Button variant="ghost" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  saving ||
                  (isEdit && isLoading) ||
                  !form.title ||
                  !form.firstName.trim() ||
                  !form.lastName.trim() ||
                  !form.email.includes("@")
                }
              >
                {saving ? "Saving..." : (
                  <>
                    <CircleCheck className="h-4 w-4" />
                    {isEdit ? "Update Traveller Profile" : "Save Traveller Profile"}
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </>
  );
}
