import { useState } from "react";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
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

const mockTemplates: PricingTemplate[] = [
  {
    category: "Air", supplierName: "Amadeus", travelDateFrom: "2026-09-01", travelDateTo: "2026-12-31",
    tripType: "RT", fromCountry: "UAE", toCountry: "United Kingdom", fromAirport: "DXB - Dubai International",
    toAirport: "LHR - Heathrow", airlineCodeInclude: ["Emirates (EK)"], airlineCodeExclude: [],
    fareCategory: "Published", classType: "Economy", passengerType: "Adult",
    formOfPayment: "Credit Card", markupAppliedOn: "Total Fare", markupPercentage: "4.5",
    markupAmount: "", transactionAppliedOn: "Base Fare", transactionPercentage: "1.5",
    transactionFeeAmount: "", rebateAppliedOn: "", rebatePercentage: "", rebateAmount: "",
    outboundRbd: "Y", inboundRbd: "B", description: "Standard Emirates RT markup",
  },
  {
    category: "Hotel", supplierName: "Hotelbeds", hotelStarRating: "5 Star", country: "UAE",
    cityName: "Dubai", hotelCityNameInclude: ["Dubai"], hotelCityNameExclude: [],
    formOfPayment: "Credit Card", guestType: "Double", markupBasis: "Per Night",
    markupAppliedOn: "Total Fare", markupPercentage: "12", markupAmount: "",
    transactionBasis: "Per Night", transactionAppliedOn: "Base Fare", transactionPercentage: "3", transactionFeeAmount: "",
    rebateBasis: "Per Night", rebateAppliedOn: "Net Fare", rebatePercentage: "2", rebateAmount: "", description: "5-star Dubai hotel markup",
  },
  {
    category: "Tour", ruleName: "Summer Tour Package", supplierName: "Tourico",
    hotelStarRating: "4 Star", country: "Turkey", cityName: "Istanbul",
    toursPackageInclude: ["City Tour", "Desert Safari"], toursPackageExclude: [],
    formOfPayment: "Cash", packageType: "Premium", markupBasis: "Per Person",
    markupAppliedOn: "Total Fare", markupPercentage: "8", markupAmount: "",
    transactionBasis: "Per Person", transactionAppliedOn: "Base Fare", transactionPercentage: "2", transactionFeeAmount: "",
    rebateBasis: "Per Person", rebateAppliedOn: "Net Fare", rebatePercentage: "1", rebateAmount: "",
    description: "Turkey summer tour markup",
  },
];

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
        data={mockTemplates}
        rowKey={(t) => `${t.category}-${t.supplierName}`}
        searchPlaceholder="Search templates..."
        searchKeys={["supplierName", "description"]}
      />

      <TemplateDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        template={detailTemplate}
      />
    </>
  );
}