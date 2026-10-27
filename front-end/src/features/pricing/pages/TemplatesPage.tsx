import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { apiRequest } from "@/api/client";
import TemplateDetailModal from "@/features/pricing/components/TemplateDetailModal";
import {
  type PricingTemplate,
  type AirTemplate,
  type HotelTemplate,
  type TourTemplate,
} from "@/types";

const categoryVariant: Record<string, "blue" | "violet" | "amber" | "green" | "red" | "gray"> = {
  Air: "blue",
  Hotel: "amber",
  Tour: "green",
  Car: "red",
  Transfer: "gray",
  Insurance: "violet",
  "Offline MISC": "gray",
};

function getSupplier(t: PricingTemplate) {
  return t.supplierName;
}

function getKeyDetail(t: PricingTemplate) {
  if (t.category === "Air") return `${(t as AirTemplate).fromAirport || "Any"} → ${(t as AirTemplate).toAirport || "Any"}`;
  if (t.category === "Hotel") return `${(t as HotelTemplate).cityName || "Any"} · ${(t as HotelTemplate).hotelStarRating || "Any"}`;
  if (t.category === "Tour") return `${(t as TourTemplate).cityName || "Any"} · ${(t as TourTemplate).packageType || "Any"}`;
  return "-";
}

function getMarkup(t: PricingTemplate) {
  return t.markupPercentage || "-";
}

export default function TemplatesPage() {
  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ["pricing-templates"],
    queryFn: () => apiRequest<PricingTemplate[]>("/pricing-templates"),
  });
  const [detailTemplate, setDetailTemplate] = useState<PricingTemplate | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openDetail = (t: PricingTemplate) => {
    setDetailTemplate(t);
    setDetailOpen(true);
  };

  const columns: Column<PricingTemplate>[] = [
    {
      key: "category",
      header: "Category",
      sortValue: (t) => t.category,
      render: (t) => <Badge variant={categoryVariant[t.category] ?? "gray"}>{t.category}</Badge>,
    },
    {
      key: "supplier",
      header: "Supplier",
      sortValue: (t) => getSupplier(t),
      render: (t) => <span className="font-medium text-slate-900">{getSupplier(t)}</span>,
    },
    {
      key: "detail",
      header: "Key Detail",
      render: (t) => <span className="text-slate-600">{getKeyDetail(t)}</span>,
    },
    {
      key: "markup",
      header: "Markup %",
      sortValue: (t) => Number(t.markupPercentage) || 0,
      className: "!text-right font-semibold tabular-nums",
      render: (t) => <span className="text-emerald-700">{getMarkup(t)}{getMarkup(t) !== "-" ? "%" : ""}</span>,
    },
    {
      key: "description",
      header: "Description",
      render: (t) => <span className="block max-w-[200px] truncate text-slate-500">{t.description || "-"}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (t) => (
        <Button variant="ghost" size="sm" onClick={() => openDetail(t)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Templates"
        description="Manage pricing templates for Air, Hotel, Tour and other categories."
      />

      <DataTable
        columns={columns}
        data={templates}
        rowKey={(t) => `${t.category}-${t.supplierName}`}
        searchPlaceholder="Search templates..."
        searchKeys={["supplierName", "description"]}
      />
      {isLoading && <p className="mt-3 text-sm text-slate-500">Loading templates...</p>}
      {error && <p className="mt-3 text-sm text-rose-600">{error instanceof Error ? error.message : "Templates could not be loaded."}</p>}

      <TemplateDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        template={detailTemplate}
      />
    </>
  );
}
