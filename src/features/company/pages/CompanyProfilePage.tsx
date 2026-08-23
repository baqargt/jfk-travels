import { useState } from "react";
import { Building2, Globe, Mail, MapPin, Phone } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import StatusToggle from "@/components/ui/StatusToggle";

const org = {
  legalName: "JFK Travel Group LLC",
  tradingAs: "JFK Travel & Tours",
  iata: "336-4 2048 5",
  uic: "JFK4211",
  license: "NY-DOS 41-JFK-88231",
  established: "2009",
  email: "operations@jfktravel.com",
  phone: "+1 (212) 555-0199",
  hq: "747 Travel Plaza, Suite 1200, Queens Blvd, New York, NY 11365",
  currencies: ["USD", "EUR", "GBP", "AED", "PKR"],
};

const apiProviders = [
  { name: "Amadeus GDS", detail: "Flights · PNR & ticketing · Fares", key: "AMA-****-8841" },
  { name: "Sabre GDS", detail: "Flights · Low fare search", key: "SBR-****-1173" },
  { name: "Travelport uAPI", detail: "Flights · Booking & EMD", key: "TVP-****-9066" },
  { name: "Expedia TAAP", detail: "Hotels · Dynamic rates", key: "EXP-****-4418" },
  { name: "Hotelbeds", detail: "Hotels · Contracted inventory", key: "HTB-****-7729" },
  { name: "TBO Holidays", detail: "Holidays · Packages & transfers", key: "TBO-****-5514" },
];

export default function CompanyProfilePage() {
  const [connections, setConnections] = useState<Record<string, boolean>>(
    Object.fromEntries(apiProviders.map((p, i) => [p.name, i !== 3])),
  );

  return (
    <>
      <PageHeader
        title="Company Profile"
        description="Organization identity, licensing and supplier API configurations."
        actions={
          <Button variant="secondary">
            <Building2 className="h-4 w-4" />
            Edit Profile
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Organization Details"
          actions={<Badge variant="green">Verified IATA Agent</Badge>}
        >
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {[
              ["Legal Name", org.legalName],
              ["Trading As", org.tradingAs],
              ["IATA Number", org.iata],
              ["UIC Code", org.uic],
              ["Business License", org.license],
              ["Established", org.established],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium tracking-wide text-slate-400 uppercase">{label}</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
            <p className="flex items-start gap-2.5 text-sm text-slate-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              {org.hq}
            </p>
            <p className="flex items-center gap-2.5 text-sm text-slate-600">
              <Mail className="h-4 w-4 shrink-0 text-brand-600" />
              {org.email}
            </p>
            <p className="flex items-center gap-2.5 text-sm text-slate-600">
              <Phone className="h-4 w-4 shrink-0 text-brand-600" />
              {org.phone}
            </p>
            <p className="flex items-center gap-2.5 text-sm text-slate-600">
              <Globe className="h-4 w-4 shrink-0 text-brand-600" />
              Settlement currencies:
              <span className="flex flex-wrap gap-1">
                {org.currencies.map((c) => (
                  <Badge key={c} variant="blue">
                    {c}
                  </Badge>
                ))}
              </span>
            </p>
          </div>
        </Card>

        <div className="space-y-6">
          <Card
            title="Supplier APIs"
            description="GDS & consolidator integrations"
            bodyClassName="p-0"
          >
            <ul className="divide-y divide-slate-100">
              {apiProviders.map((p) => (
                <li key={p.name} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                    <p className="truncate text-xs text-slate-500">{p.detail}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-slate-400">{p.key}</p>
                  </div>
                  <StatusToggle
                    label={false}
                    checked={connections[p.name]}
                    onChange={(v) => setConnections((c) => ({ ...c, [p.name]: v }))}
                  />
                </li>
              ))}
            </ul>
          </Card>

          <Card bodyClassName="p-4">
            <p className="rounded-lg bg-brand-50 px-3.5 py-3 text-xs leading-relaxed text-brand-800 ring-1 ring-brand-100 ring-inset">
              API credential changes propagate to all booking engines within 5 minutes.
              Disabled providers are hidden from search but existing PNRs remain manageable.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
