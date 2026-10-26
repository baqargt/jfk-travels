import Modal from "@/components/ui/Modal";
import { type PricingTemplate } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  template: PricingTemplate | null;
}

function FieldRow({ label, value }: { label: string; value: string | string[] }) {
  const display = Array.isArray(value) ? (value.length > 0 ? value.join(", ") : "-") : (value || "-");
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-medium text-slate-900">{display}</span>
    </div>
  );
}

export default function TemplateDetailModal({ open, onClose, template }: Props) {
  if (!template) return null;

  return (
    <Modal open={open} onClose={onClose} title={`${template.category} Template`} subtitle="Template field details" size="lg">
      <div className="space-y-1">
        {template.category === "Air" && (
          <>
            <FieldRow label="Supplier Name" value={template.supplierName} />
            <FieldRow label="Travel Date From" value={template.travelDateFrom} />
            <FieldRow label="Travel Date To" value={template.travelDateTo} />
            <FieldRow label="Trip Type" value={template.tripType} />
            <FieldRow label="From Country" value={template.fromCountry} />
            <FieldRow label="To Country" value={template.toCountry} />
            <FieldRow label="From Airport" value={template.fromAirport} />
            <FieldRow label="To Airport" value={template.toAirport} />
            <FieldRow label="Airline Code Include" value={template.airlineCodeInclude} />
            <FieldRow label="Airline Code Exclude" value={template.airlineCodeExclude} />
            <FieldRow label="Fare Category" value={template.fareCategory} />
            <FieldRow label="Class Type" value={template.classType} />
            <FieldRow label="Passenger Type" value={template.passengerType} />
            <FieldRow label="Form Of Payment" value={template.formOfPayment} />
            <FieldRow label="Markup Applied On" value={template.markupAppliedOn} />
            <FieldRow label="Markup %" value={template.markupPercentage} />
            <FieldRow label="Markup Amount" value={template.markupAmount} />
            <FieldRow label="Transaction Applied On" value={template.transactionAppliedOn} />
            <FieldRow label="Transaction %" value={template.transactionPercentage} />
            <FieldRow label="Transaction Fee" value={template.transactionFeeAmount} />
            <FieldRow label="Rebate Applied On" value={template.rebateAppliedOn} />
            <FieldRow label="Rebate %" value={template.rebatePercentage} />
            <FieldRow label="Rebate Amount" value={template.rebateAmount} />
            <FieldRow label="Outbound RBD" value={template.outboundRbd} />
            <FieldRow label="Inbound RBD" value={template.inboundRbd} />
            <FieldRow label="Description" value={template.description} />
          </>
        )}

        {template.category === "Hotel" && (
          <>
            <FieldRow label="Supplier Name" value={template.supplierName} />
            <FieldRow label="Hotel Star Rating" value={template.hotelStarRating} />
            <FieldRow label="Country" value={template.country} />
            <FieldRow label="City Name" value={template.cityName} />
            <FieldRow label="Hotel City Name Include" value={template.hotelCityNameInclude} />
            <FieldRow label="Hotel City Name Exclude" value={template.hotelCityNameExclude} />
            <FieldRow label="Form of Payment" value={template.formOfPayment} />
            <FieldRow label="Guest Type" value={template.guestType} />
            <FieldRow label="Markup/Transaction/Rebate Basis" value={template.markupBasis} />
            <FieldRow label="Markup Applied On" value={template.markupAppliedOn} />
            <FieldRow label="Markup %" value={template.markupPercentage} />
            <FieldRow label="Markup Amount" value={template.markupAmount} />
            <FieldRow label="Transaction Applied On" value={template.transactionAppliedOn} />
            <FieldRow label="Transaction %" value={template.transactionPercentage} />
            <FieldRow label="Transaction Fee" value={template.transactionFeeAmount} />
            <FieldRow label="Rebate Applied On" value={template.rebateAppliedOn} />
            <FieldRow label="Rebate %" value={template.rebatePercentage} />
            <FieldRow label="Rebate Amount" value={template.rebateAmount} />
            <FieldRow label="Description" value={template.description} />
          </>
        )}

        {template.category === "Tour" && (
          <>
            <FieldRow label="Rule Name" value={template.ruleName} />
            <FieldRow label="Supplier Name" value={template.supplierName} />
            <FieldRow label="Hotel Star Rating" value={template.hotelStarRating} />
            <FieldRow label="Country" value={template.country} />
            <FieldRow label="City Name" value={template.cityName} />
            <FieldRow label="Tours Package Include" value={template.toursPackageInclude} />
            <FieldRow label="Tours Package Exclude" value={template.toursPackageExclude} />
            <FieldRow label="Form of Payment" value={template.formOfPayment} />
            <FieldRow label="Package Type" value={template.packageType} />
            <FieldRow label="Markup/Transaction/Rebate Basis" value={template.markupBasis} />
            <FieldRow label="Markup Applied On" value={template.markupAppliedOn} />
            <FieldRow label="Markup %" value={template.markupPercentage} />
            <FieldRow label="Markup Amount" value={template.markupAmount} />
            <FieldRow label="Transaction Applied On" value={template.transactionAppliedOn} />
            <FieldRow label="Transaction %" value={template.transactionPercentage} />
            <FieldRow label="Transaction Fee" value={template.transactionFeeAmount} />
            <FieldRow label="Rebate Applied On" value={template.rebateAppliedOn} />
            <FieldRow label="Rebate %" value={template.rebatePercentage} />
            <FieldRow label="Rebate Amount" value={template.rebateAmount} />
            <FieldRow label="Description" value={template.description} />
          </>
        )}
      </div>
    </Modal>
  );
}