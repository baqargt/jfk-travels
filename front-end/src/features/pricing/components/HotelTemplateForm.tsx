import type { HotelTemplate } from "@/types";
import { FormField, Input, Select, Textarea } from "@/components/ui/Input";
import MultiSelect from "@/components/ui/MultiSelect";
import {
  suppliers, countries, cities, hotelStarRatings, guestTypes,
  formOfPaymentOptions, perNightGuestOptions, markupAppliedOnOptions,
  transactionAppliedOnOptions, rebateAppliedOnOptions,
} from "@/lib/templateData";

type HotelData = Omit<HotelTemplate, "category">;

interface Props {
  data: HotelData;
  onChange: (data: HotelData) => void;
}

export default function HotelTemplateForm({ data, onChange }: Props) {
  const patch = <K extends keyof HotelData>(key: K, val: HotelData[K]) =>
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

      <FormField label="Hotel Star Rating">
        <Select value={data.hotelStarRating} onChange={(e) => patch("hotelStarRating", e.target.value)}>
          <option value="">Select</option>
          {hotelStarRatings.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="Country">
        <Select value={data.country} onChange={(e) => patch("country", e.target.value)}>
          <option value="">Select country</option>
          {countries.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="City Name">
        <Select value={data.cityName} onChange={(e) => patch("cityName", e.target.value)}>
          <option value="">Select city</option>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="Hotel City Name Include">
        <MultiSelect
          options={cities.map((c) => ({ label: c, value: c }))}
          value={data.hotelCityNameInclude}
          onChange={(v) => patch("hotelCityNameInclude", v)}
          placeholder="All cities"
        />
      </FormField>

      <FormField label="Hotel City Name Exclude">
        <MultiSelect
          options={cities.map((c) => ({ label: c, value: c }))}
          value={data.hotelCityNameExclude}
          onChange={(v) => patch("hotelCityNameExclude", v)}
          placeholder="None"
        />
      </FormField>

      <FormField label="Form of Payment">
        <Select value={data.formOfPayment} onChange={(e) => patch("formOfPayment", e.target.value)}>
          <option value="">Select</option>
          {formOfPaymentOptions.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="Guest Type">
        <Select value={data.guestType} onChange={(e) => patch("guestType", e.target.value)}>
          <option value="">Select</option>
          {guestTypes.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="Markup / Transaction / Rebate Basis">
        <Select
          value={data.markupBasis}
          onChange={(e) => {
            patch("markupBasis", e.target.value);
            patch("transactionBasis", e.target.value);
            patch("rebateBasis", e.target.value);
          }}
        >
          <option value="">Select basis</option>
          {perNightGuestOptions.map((o) => (
            <option key={o}>{o}</option>
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

      <FormField label="Description" className="sm:col-span-2 lg:col-span-3">
        <Textarea rows={2} value={data.description} onChange={(e) => patch("description", e.target.value)} placeholder="Template description..." />
      </FormField>
    </div>
  );
}

export const defaultHotelTemplate: HotelData = {
  supplierName: "", hotelStarRating: "", country: "", cityName: "",
  hotelCityNameInclude: [], hotelCityNameExclude: [], formOfPayment: "",
  guestType: "", markupBasis: "", markupAppliedOn: "", markupPercentage: "", markupAmount: "",
  transactionBasis: "", transactionAppliedOn: "", transactionPercentage: "", transactionFeeAmount: "",
  rebateBasis: "", rebateAppliedOn: "", rebatePercentage: "", rebateAmount: "", description: "",
};