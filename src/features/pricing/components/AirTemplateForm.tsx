import type { AirTemplate } from "@/types";
import { FormField, Input, Select, Textarea } from "@/components/ui/Input";
import MultiSelect from "@/components/ui/MultiSelect";
import {
  suppliers, countries, airports, airlines, fareCategories,
  classTypes, passengerTypes, formOfPaymentOptions, tripTypes,
  markupAppliedOnOptions, transactionAppliedOnOptions, rebateAppliedOnOptions,
} from "@/lib/templateData";

type AirData = Omit<AirTemplate, "category">;

interface Props {
  data: AirData;
  onChange: (data: AirData) => void;
}

export default function AirTemplateForm({ data, onChange }: Props) {
  const patch = <K extends keyof AirData>(key: K, val: AirData[K]) =>
    onChange({ ...data, [key]: val });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <FormField label="Supplier Name" required>
        <Select value={data.supplierName} onChange={(e) => patch("supplierName", e.target.value)}>
          <option value="">Select supplier</option>
          {suppliers.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="Travel Date From">
        <Input type="date" value={data.travelDateFrom} onChange={(e) => patch("travelDateFrom", e.target.value)} />
      </FormField>

      <FormField label="Travel Date To">
        <Input type="date" value={data.travelDateTo} onChange={(e) => patch("travelDateTo", e.target.value)} />
      </FormField>

      <FormField label="Trip Type">
        <Select value={data.tripType} onChange={(e) => patch("tripType", e.target.value)}>
          <option value="">Select trip type</option>
          {tripTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="From Country">
        <Select value={data.fromCountry} onChange={(e) => patch("fromCountry", e.target.value)}>
          <option value="">Select country</option>
          {countries.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="To Country">
        <Select value={data.toCountry} onChange={(e) => patch("toCountry", e.target.value)}>
          <option value="">Select country</option>
          {countries.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="From Airport">
        <Select value={data.fromAirport} onChange={(e) => patch("fromAirport", e.target.value)}>
          <option value="">Select airport</option>
          {airports.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="To Airport">
        <Select value={data.toAirport} onChange={(e) => patch("toAirport", e.target.value)}>
          <option value="">Select airport</option>
          {airports.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="Airline Code Include">
        <MultiSelect
          options={airlines.map((a) => ({ label: a, value: a }))}
          value={data.airlineCodeInclude}
          onChange={(v) => patch("airlineCodeInclude", v)}
          placeholder="All airlines"
        />
      </FormField>

      <FormField label="Airline Code Exclude">
        <MultiSelect
          options={airlines.map((a) => ({ label: a, value: a }))}
          value={data.airlineCodeExclude}
          onChange={(v) => patch("airlineCodeExclude", v)}
          placeholder="None"
        />
      </FormField>

      <FormField label="Fare Category">
        <Select value={data.fareCategory} onChange={(e) => patch("fareCategory", e.target.value)}>
          <option value="">Select</option>
          {fareCategories.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="Class Type">
        <Select value={data.classType} onChange={(e) => patch("classType", e.target.value)}>
          <option value="">Select</option>
          {classTypes.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="Passenger Type">
        <Select value={data.passengerType} onChange={(e) => patch("passengerType", e.target.value)}>
          <option value="">Select</option>
          {passengerTypes.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="Form Of Payment">
        <Select value={data.formOfPayment} onChange={(e) => patch("formOfPayment", e.target.value)}>
          <option value="">Select</option>
          {formOfPaymentOptions.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="Markup Applied On">
        <Select value={data.markupAppliedOn} onChange={(e) => patch("markupAppliedOn", e.target.value)}>
          <option value="">Select</option>
          {markupAppliedOnOptions.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="Markup Percentage">
        <Input type="number" min={0} step="0.25" value={data.markupPercentage} onChange={(e) => patch("markupPercentage", e.target.value)} placeholder="0" />
      </FormField>

      <FormField label="Markup Amount">
        <Input type="number" min={0} step="0.01" value={data.markupAmount} onChange={(e) => patch("markupAmount", e.target.value)} placeholder="0.00" />
      </FormField>

      <FormField label="Transaction Applied On">
        <Select value={data.transactionAppliedOn} onChange={(e) => patch("transactionAppliedOn", e.target.value)}>
          <option value="">Select</option>
          {transactionAppliedOnOptions.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="Transaction Percentage">
        <Input type="number" min={0} step="0.25" value={data.transactionPercentage} onChange={(e) => patch("transactionPercentage", e.target.value)} placeholder="0" />
      </FormField>

      <FormField label="Transaction Fee Amount">
        <Input type="number" min={0} step="0.01" value={data.transactionFeeAmount} onChange={(e) => patch("transactionFeeAmount", e.target.value)} placeholder="0.00" />
      </FormField>

      <FormField label="Rebate Applied On">
        <Select value={data.rebateAppliedOn} onChange={(e) => patch("rebateAppliedOn", e.target.value)}>
          <option value="">Select</option>
          {rebateAppliedOnOptions.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="Rebate Percentage">
        <Input type="number" min={0} step="0.25" value={data.rebatePercentage} onChange={(e) => patch("rebatePercentage", e.target.value)} placeholder="0" />
      </FormField>

      <FormField label="Rebate Amount">
        <Input type="number" min={0} step="0.01" value={data.rebateAmount} onChange={(e) => patch("rebateAmount", e.target.value)} placeholder="0.00" />
      </FormField>

      <FormField label="Outbound RBD">
        <Input value={data.outboundRbd} onChange={(e) => patch("outboundRbd", e.target.value)} placeholder="e.g. Y, B, M" />
      </FormField>

      <FormField label="Inbound RBD">
        <Input value={data.inboundRbd} onChange={(e) => patch("inboundRbd", e.target.value)} placeholder="e.g. Y, B, M" />
      </FormField>

      <FormField label="Description" className="sm:col-span-2 lg:col-span-3">
        <Textarea rows={2} value={data.description} onChange={(e) => patch("description", e.target.value)} placeholder="Template description..." />
      </FormField>
    </div>
  );
}

export const defaultAirTemplate: AirData = {
  supplierName: "", travelDateFrom: "", travelDateTo: "", tripType: "",
  fromCountry: "", toCountry: "", fromAirport: "", toAirport: "",
  airlineCodeInclude: [], airlineCodeExclude: [], fareCategory: "", classType: "",
  passengerType: "", formOfPayment: "", markupAppliedOn: "", markupPercentage: "",
  markupAmount: "", transactionAppliedOn: "", transactionPercentage: "",
  transactionFeeAmount: "", rebateAppliedOn: "", rebatePercentage: "",
  rebateAmount: "", outboundRbd: "", inboundRbd: "", description: "",
};