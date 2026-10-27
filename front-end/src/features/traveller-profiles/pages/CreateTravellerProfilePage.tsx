import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CircleCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/Input";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import { countries } from "@/lib/bookingData";
import { PATHS } from "@/routes/paths";
import { apiRequest } from "@/api/client";

export default function CreateTravellerProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
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
  });

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest("/travellers", {
        method: "POST",
        body: {
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
            gender: form.gender,
            nationality: form.nationality,
            address: form.address,
            visaNotes: form.visaNotes,
            seat: form.seatPref,
            meal: form.mealPref,
            notes: form.notes,
          },
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["travellers"] });
      navigate(PATHS.travellerProfiles, { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Traveller could not be created.");
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Create Traveller Profile"
        description="Onboard a new traveller with contact and travel document details."
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 xl:col-span-2">{error}</p>}
        <div className="space-y-6">
          <Card title="Personal Information">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
              <FormField label="Passport number">
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
              <Button type="submit" disabled={saving || !form.firstName.trim() || !form.lastName.trim() || !form.email.includes("@")}>
                {saving ? "Saving..." : (
                  <>
                    <CircleCheck className="h-4 w-4" />
                    Save Traveller Profile
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
