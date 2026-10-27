import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CircleCheck, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import FileUpload from "@/components/ui/FileUpload";
import { FormField, Input, PasswordInput, Select } from "@/components/ui/Input";
import MultiSelect from "@/components/ui/MultiSelect";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import Stepper from "@/components/ui/Stepper";
import {
  asOptions,
  BUSINESS_TYPES,
  CURRENCIES,
  CUSTOMER_CHANNELS,
  CUSTOMER_TYPES,
  DATE_TIME_FORMATS,
  DYNAMIC_PRICING_FIELDS,
  exclusiveAllSelection,
  NOTIFICATION_EMAILS,
  PAYMENT_CHANNELS,
} from "@/features/customers/customerData";
import { createCustomer } from "@/features/customers/customerRepository";
import { apiRequest } from "@/api/client";
import type { ApiBranch, ApiDepartment, ApiPage, ApiPricingModel, ApiUser } from "@/api/types";
import { PATHS } from "@/routes/paths";
import type { Customer, CustomerAddress, CustomerContact, CustomerDocument } from "@/types";

const STEPS = ["Customer Details", "Contact & Documents", "Workflow & Ownership", "Commercial Settings", "Customer Users", "Review"];
const EMPTY_ADDRESS: CustomerAddress = { address: "", city: "", country: "", postalCode: "" };
const EMPTY_CONTACT: CustomerContact = { firstName: "", lastName: "", designation: "", email: "" };

type CustomerInput = Omit<Customer, "id" | "agentCode" | "status" | "createdAt">;
interface CustomerDraft extends CustomerInput {
  adminPassword: string;
  accountsEnabled: boolean;
}

const initial: CustomerDraft = {
  name: "",
  accountCode: "",
  customerTypes: [],
  customerChannels: [],
  branches: [],
  paymentChannels: [],
  groupCompany: "",
  locationType: "Local",
  businessTypes: [],
  companyAddress: { ...EMPTY_ADDRESS },
  billingAddress: { ...EMPTY_ADDRESS },
  billingSameAsCompany: true,
  telephone: "",
  mobile: "",
  email: "",
  website: "",
  logo: null,
  tradeLicence: null,
  tradeLicenceExpiry: "",
  ownerIdentity: null,
  quotationFlow: "Yes",
  bookingOnHold: "No",
  notificationEmails: ["Company Email"],
  profileSelection: "Mandatory",
  accountManager: "",
  revenueExecutive: "",
  controlDepartment: "",
  b2b2b: "Disabled",
  whiteLabel: "No",
  allowReissue: "No",
  dateTimeFormat: DATE_TIME_FORMATS[0],
  defaultCurrency: "AED",
  multiCurrencies: [],
  pricingModel: "",
  adhocMarkup: "No",
  dynamicPricingFields: [],
  admin: { ...EMPTY_CONTACT },
  accountsContact: null,
  adminPassword: "",
  accountsEnabled: false,
};

const emailIsValid = (value: string) => /^\S+@\S+\.\S+$/.test(value);
const toDocument = (file: File | null, fileId?: string): CustomerDocument | null => file ? {
  fileId,
  name: file.name,
  type: file.type,
  size: file.size,
  lastModified: file.lastModified,
} : null;

function SelectField({ label, value, values, onChange, required = false }: {
  label: string;
  value: string;
  values: readonly string[];
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <FormField label={label} required={required}>
      <Select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select...</option>
        {values.map((item) => <option key={item} value={item}>{item}</option>)}
      </Select>
    </FormField>
  );
}

export default function CreateCustomerPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CustomerDraft>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const { data: branchPage } = useQuery({ queryKey: ["branches", "customer-form"], queryFn: () => apiRequest<ApiPage<ApiBranch>>("/branches?page_size=100") });
  const { data: userPage } = useQuery({ queryKey: ["users", "customer-form"], queryFn: () => apiRequest<ApiPage<ApiUser>>("/users?page_size=100") });
  const { data: departmentPage } = useQuery({ queryKey: ["departments", "customer-form"], queryFn: () => apiRequest<ApiPage<ApiDepartment>>("/departments?page_size=100") });
  const { data: pricingPage } = useQuery({ queryKey: ["pricing-models", "customer-form"], queryFn: () => apiRequest<ApiPage<ApiPricingModel>>("/pricing-models?page_size=100") });
  const branches = ["All", ...(branchPage?.items ?? []).filter((item) => item.status === "active").map((item) => item.name)];
  const activeUsers = (userPage?.items ?? []).filter((item) => item.status === "active").map((item) => item.name);
  const departmentNames = (departmentPage?.items ?? []).filter((item) => item.status === "active").map((item) => item.name);
  const pricingModels = (pricingPage?.items ?? []).map((item) => item.name);

  const setValue = <K extends keyof CustomerDraft>(key: K, value: CustomerDraft[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const setMulti = (key: "customerTypes" | "customerChannels" | "branches" | "paymentChannels" | "businessTypes", next: string[]) => {
    setValue(key, exclusiveAllSelection(form[key], next));
  };

  const setAddress = (kind: "companyAddress" | "billingAddress", key: keyof CustomerAddress, value: string) => {
    setForm((current) => {
      const address = { ...current[kind], [key]: value };
      return kind === "companyAddress" && current.billingSameAsCompany
        ? { ...current, companyAddress: address, billingAddress: address }
        : { ...current, [kind]: address };
    });
    setErrors((current) => ({ ...current, [`${kind}.${key}`]: "" }));
  };

  const setContact = (kind: "admin" | "accountsContact", key: keyof CustomerContact, value: string) => {
    setForm((current) => ({
      ...current,
      [kind]: { ...(current[kind] ?? EMPTY_CONTACT), [key]: value },
    }));
    setErrors((current) => ({ ...current, [`${kind}.${key}`]: "" }));
  };

  const validateStep = (index: number) => {
    const next: Record<string, string> = {};
    if (index === 0) {
      if (!form.name.trim()) next.name = "Customer name is required.";
      if (!form.accountCode.trim()) next.accountCode = "Account code is required.";
      if (!form.customerTypes.length) next.customerTypes = "Select at least one customer type.";
      if (!form.customerChannels.length) next.customerChannels = "Select at least one customer channel.";
      if (!form.branches.length) next.branches = "Select at least one branch.";
      if (!form.paymentChannels.length) next.paymentChannels = "Select at least one payment channel.";
      if (!form.businessTypes.length) next.businessTypes = "Select at least one business type.";
    }
    if (index === 1) {
      if (!form.companyAddress.address.trim()) next["companyAddress.address"] = "Address is required.";
      if (!form.companyAddress.city.trim()) next["companyAddress.city"] = "City is required.";
      if (!form.companyAddress.country.trim()) next["companyAddress.country"] = "Country is required.";
      if (!emailIsValid(form.email)) next.email = "Enter a valid company email.";
      if (form.tradeLicence && !form.tradeLicenceExpiry) next.tradeLicenceExpiry = "Expiry is required for an uploaded trade licence.";
      if (!form.billingSameAsCompany) {
        if (!form.billingAddress.address.trim()) next["billingAddress.address"] = "Billing address is required.";
        if (!form.billingAddress.city.trim()) next["billingAddress.city"] = "Billing city is required.";
        if (!form.billingAddress.country.trim()) next["billingAddress.country"] = "Billing country is required.";
      }
    }
    if (index === 2) {
      if (!form.notificationEmails.length) next.notificationEmails = "Select at least one notification recipient.";
      if (!form.accountManager) next.accountManager = "Select an account manager.";
      if (!form.revenueExecutive) next.revenueExecutive = "Select a sales executive.";
      if (!form.controlDepartment) next.controlDepartment = "Select a control department.";
    }
    if (index === 3) {
      if (!form.defaultCurrency) next.defaultCurrency = "Select the default currency.";
      if (!form.pricingModel) next.pricingModel = "Select a pricing model.";
      if (!form.dynamicPricingFields.length) next.dynamicPricingFields = "Select at least one dynamic pricing field.";
    }
    if (index === 4) {
      if (!form.admin.firstName.trim()) next["admin.firstName"] = "First name is required.";
      if (!form.admin.lastName.trim()) next["admin.lastName"] = "Last name is required.";
      if (!form.admin.designation.trim()) next["admin.designation"] = "Designation is required.";
      if (!emailIsValid(form.admin.email)) next["admin.email"] = "Enter a valid admin email.";
      if (form.adminPassword.length < 8) next.adminPassword = "Password must be at least 8 characters.";
      if (form.accountsEnabled) {
        const contact = form.accountsContact ?? EMPTY_CONTACT;
        if (!contact.firstName.trim()) next["accountsContact.firstName"] = "First name is required.";
        if (!contact.lastName.trim()) next["accountsContact.lastName"] = "Last name is required.";
        if (!contact.designation.trim()) next["accountsContact.designation"] = "Designation is required.";
        if (!emailIsValid(contact.email)) next["accountsContact.email"] = "Enter a valid accounts email.";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const continueStep = () => {
    if (validateStep(step)) {
      setStep((current) => Math.min(current + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!agreed) return;
    setSaving(true);
    setSubmitError("");
    try {
      const { adminPassword: _password, accountsEnabled: _accountsEnabled, ...customerInput } = form;
      const customer = await createCustomer({
        ...customerInput,
        accountsContact: form.accountsEnabled ? form.accountsContact : null,
      });
      navigate(PATHS.customers.list, { replace: true, state: { createdAgentCode: customer.agentCode, customerName: customer.name } });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Customer could not be saved.");
      setSaving(false);
    }
  };

  const errorSummary = Object.values(errors).filter(Boolean);

  return (
    <>
      <PageHeader title="Create Customer" description="Onboard a customer organization and configure its operating profile." />
      <Card bodyClassName="p-4 sm:p-6">
        <div className="overflow-x-auto pb-2"><div className="min-w-[760px]"><Stepper steps={STEPS} current={step} /></div></div>
        <form onSubmit={handleSubmit} className="mt-7">
          <div className="mx-auto max-w-5xl">
            {errorSummary.length > 0 && (
              <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Please resolve the highlighted fields before continuing.
              </div>
            )}

            {step === 0 && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <FormField label="Customer Name" required error={errors.name}>
                  <Input value={form.name} onChange={(event) => setValue("name", event.target.value)} placeholder="ABC Travel" />
                </FormField>
                <FormField label="Account Code" required error={errors.accountCode} hint="Must be unique">
                  <Input value={form.accountCode} onChange={(event) => setValue("accountCode", event.target.value)} placeholder="123456789" />
                </FormField>
                <FormField label="Customer Type" required error={errors.customerTypes}>
                  <MultiSelect options={asOptions(CUSTOMER_TYPES)} value={form.customerTypes} onChange={(next) => setMulti("customerTypes", next)} />
                </FormField>
                <FormField label="Customer Channel" required error={errors.customerChannels}>
                  <MultiSelect options={asOptions(CUSTOMER_CHANNELS)} value={form.customerChannels} onChange={(next) => setMulti("customerChannels", next)} />
                </FormField>
                <FormField label="Default Branches" required error={errors.branches} hint="Select All for every branch">
                  <MultiSelect options={asOptions(branches)} value={form.branches} onChange={(next) => setMulti("branches", next)} />
                </FormField>
                <FormField label="Payment Channels" required error={errors.paymentChannels}>
                  <MultiSelect options={asOptions(PAYMENT_CHANNELS)} value={form.paymentChannels} onChange={(next) => setMulti("paymentChannels", next)} />
                </FormField>
                <FormField label="Group Company">
                  <Input value={form.groupCompany} onChange={(event) => setValue("groupCompany", event.target.value)} placeholder="Optional group name" />
                </FormField>
                <SelectField label="Location Type" required value={form.locationType} values={["Local", "Global", "Regional"]} onChange={(value) => setValue("locationType", value as Customer["locationType"])} />
                <FormField label="Business Type" required error={errors.businessTypes} className="md:col-span-2">
                  <MultiSelect options={asOptions(BUSINESS_TYPES)} value={form.businessTypes} onChange={(next) => setMulti("businessTypes", next)} />
                </FormField>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="mb-4 text-sm font-semibold text-slate-900">Company Address</h2>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <FormField label="Address" required error={errors["companyAddress.address"]} className="md:col-span-2">
                      <Input value={form.companyAddress.address} onChange={(event) => setAddress("companyAddress", "address", event.target.value)} />
                    </FormField>
                    <FormField label="City" required error={errors["companyAddress.city"]}><Input value={form.companyAddress.city} onChange={(event) => setAddress("companyAddress", "city", event.target.value)} /></FormField>
                    <FormField label="Country" required error={errors["companyAddress.country"]}><Input value={form.companyAddress.country} onChange={(event) => setAddress("companyAddress", "country", event.target.value)} /></FormField>
                    <FormField label="ZIP / Postal Code"><Input value={form.companyAddress.postalCode} onChange={(event) => setAddress("companyAddress", "postalCode", event.target.value)} /></FormField>
                    <FormField label="Telephone"><Input type="tel" value={form.telephone} onChange={(event) => setValue("telephone", event.target.value)} /></FormField>
                    <FormField label="Mobile"><Input type="tel" value={form.mobile} onChange={(event) => setValue("mobile", event.target.value)} /></FormField>
                    <FormField label="Company Email" required error={errors.email}><Input type="email" value={form.email} onChange={(event) => setValue("email", event.target.value)} /></FormField>
                    <FormField label="Website"><Input type="url" value={form.website} onChange={(event) => setValue("website", event.target.value)} placeholder="https://" /></FormField>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-5">
                  <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                    <input type="checkbox" checked={form.billingSameAsCompany} onChange={(event) => setForm((current) => ({ ...current, billingSameAsCompany: event.target.checked, billingAddress: event.target.checked ? { ...current.companyAddress } : current.billingAddress }))} className="h-4 w-4 accent-brand-600" />
                    Billing address is the same as company address
                  </label>
                  {!form.billingSameAsCompany && (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <FormField label="Billing Address" required error={errors["billingAddress.address"]} className="md:col-span-2"><Input value={form.billingAddress.address} onChange={(event) => setAddress("billingAddress", "address", event.target.value)} /></FormField>
                      <FormField label="Billing City" required error={errors["billingAddress.city"]}><Input value={form.billingAddress.city} onChange={(event) => setAddress("billingAddress", "city", event.target.value)} /></FormField>
                      <FormField label="Billing Country" required error={errors["billingAddress.country"]}><Input value={form.billingAddress.country} onChange={(event) => setAddress("billingAddress", "country", event.target.value)} /></FormField>
                      <FormField label="Billing ZIP / Postal Code"><Input value={form.billingAddress.postalCode} onChange={(event) => setAddress("billingAddress", "postalCode", event.target.value)} /></FormField>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-5 border-t border-slate-100 pt-5 md:grid-cols-3">
                  <FileUpload secure name="logo" label="Logo (optional)" accept="image/jpeg,image/png" onFileChange={(file) => setValue("logo", toDocument(file))} onUploaded={(id, file) => setValue("logo", toDocument(file, id))} />
                  <div>
                    <FileUpload secure name="tradeLicence" label="Trade Licence (optional)" accept="application/pdf,image/jpeg,image/png" onFileChange={(file) => { setValue("tradeLicence", toDocument(file)); if (!file) setValue("tradeLicenceExpiry", ""); }} onUploaded={(id, file) => setValue("tradeLicence", toDocument(file, id))} />
                    {form.tradeLicence && <FormField label="Licence Expiry" required error={errors.tradeLicenceExpiry} className="mt-3"><Input type="date" value={form.tradeLicenceExpiry} onChange={(event) => setValue("tradeLicenceExpiry", event.target.value)} /></FormField>}
                  </div>
                  <FileUpload secure name="ownerIdentity" label="Owner Passport & ID (optional)" accept="application/pdf,image/jpeg,image/png" onFileChange={(file) => setValue("ownerIdentity", toDocument(file))} onUploaded={(id, file) => setValue("ownerIdentity", toDocument(file, id))} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <SelectField label="Quotation Flow" required value={form.quotationFlow} values={["Yes", "No"]} onChange={(value) => setValue("quotationFlow", value as Customer["quotationFlow"])} />
                <SelectField label="Booking on Hold" required value={form.bookingOnHold} values={["Subject to Supplier", "No"]} onChange={(value) => setValue("bookingOnHold", value as Customer["bookingOnHold"])} />
                <FormField label="Notification Email" required error={errors.notificationEmails} className="md:col-span-2">
                  <MultiSelect options={asOptions(NOTIFICATION_EMAILS)} value={form.notificationEmails} onChange={(value) => setValue("notificationEmails", value)} />
                </FormField>
                <SelectField label="Profile Selection" required value={form.profileSelection} values={["Mandatory", "Non-Mandatory", "Skip"]} onChange={(value) => setValue("profileSelection", value as Customer["profileSelection"])} />
                <SelectField label="Account Manager" required value={form.accountManager} values={activeUsers} onChange={(value) => setValue("accountManager", value)} />
                <SelectField label="Revenue / Sales Executive" required value={form.revenueExecutive} values={activeUsers} onChange={(value) => setValue("revenueExecutive", value)} />
                <SelectField label="Control Department" required value={form.controlDepartment} values={departmentNames} onChange={(value) => setValue("controlDepartment", value)} />
                {(errors.accountManager || errors.revenueExecutive || errors.controlDepartment) && <p className="text-sm text-rose-600 md:col-span-2">Complete all ownership assignments.</p>}
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <SelectField label="B2B2B" value={form.b2b2b} values={["Enabled", "Disabled"]} onChange={(value) => setValue("b2b2b", value as Customer["b2b2b"])} />
                <SelectField label="White Label" value={form.whiteLabel} values={["Yes", "No"]} onChange={(value) => setValue("whiteLabel", value as Customer["whiteLabel"])} />
                <SelectField label="Allow Reissue" value={form.allowReissue} values={["Yes", "No"]} onChange={(value) => setValue("allowReissue", value as Customer["allowReissue"])} />
                <SelectField label="Date & Time Format" required value={form.dateTimeFormat} values={DATE_TIME_FORMATS} onChange={(value) => setValue("dateTimeFormat", value)} />
                <SelectField label="Default Currency" required value={form.defaultCurrency} values={CURRENCIES} onChange={(value) => { setValue("defaultCurrency", value); setValue("multiCurrencies", form.multiCurrencies.filter((currency) => currency !== value)); }} />
                <FormField label="Multi Currency" hint="Additional settlement currencies">
                  <MultiSelect options={asOptions(CURRENCIES.filter((currency) => currency !== form.defaultCurrency))} value={form.multiCurrencies} onChange={(value) => setValue("multiCurrencies", value)} />
                </FormField>
                <SelectField label="Pricing Model" required value={form.pricingModel} values={pricingModels} onChange={(value) => setValue("pricingModel", value)} />
                <SelectField label="ADHOC Markup" value={form.adhocMarkup} values={["Yes", "No"]} onChange={(value) => setValue("adhocMarkup", value as Customer["adhocMarkup"])} />
                <FormField label="Dynamic Pricing Fields" required error={errors.dynamicPricingFields} className="md:col-span-2">
                  <MultiSelect options={asOptions(DYNAMIC_PRICING_FIELDS)} value={form.dynamicPricingFields} onChange={(value) => setValue("dynamicPricingFields", value)} />
                </FormField>
                {(errors.defaultCurrency || errors.pricingModel) && <p className="text-sm text-rose-600 md:col-span-2">Select a default currency and pricing model.</p>}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-7">
                <div>
                  <h2 className="mb-4 text-sm font-semibold text-slate-900">Customer Admin</h2>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <FormField label="First Name" required error={errors["admin.firstName"]}><Input value={form.admin.firstName} onChange={(event) => setContact("admin", "firstName", event.target.value)} /></FormField>
                    <FormField label="Last Name" required error={errors["admin.lastName"]}><Input value={form.admin.lastName} onChange={(event) => setContact("admin", "lastName", event.target.value)} /></FormField>
                    <FormField label="Designation" required error={errors["admin.designation"]}><Input value={form.admin.designation} onChange={(event) => setContact("admin", "designation", event.target.value)} /></FormField>
                    <FormField label="Email / User ID" required error={errors["admin.email"]}><Input type="email" value={form.admin.email} onChange={(event) => setContact("admin", "email", event.target.value)} /></FormField>
                    <FormField label="Temporary Password" required error={errors.adminPassword} hint="At least 8 characters; it will not be stored"><PasswordInput value={form.adminPassword} onChange={(event) => setValue("adminPassword", event.target.value)} /></FormField>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-5">
                  <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-900">
                    <input type="checkbox" checked={form.accountsEnabled} onChange={(event) => setForm((current) => ({ ...current, accountsEnabled: event.target.checked, accountsContact: event.target.checked ? (current.accountsContact ?? { ...EMPTY_CONTACT }) : null }))} className="h-4 w-4 accent-brand-600" />
                    Add optional Customer Accounts contact
                  </label>
                  {form.accountsEnabled && (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <FormField label="First Name" required error={errors["accountsContact.firstName"]}><Input value={form.accountsContact?.firstName ?? ""} onChange={(event) => setContact("accountsContact", "firstName", event.target.value)} /></FormField>
                      <FormField label="Last Name" required error={errors["accountsContact.lastName"]}><Input value={form.accountsContact?.lastName ?? ""} onChange={(event) => setContact("accountsContact", "lastName", event.target.value)} /></FormField>
                      <FormField label="Designation" required error={errors["accountsContact.designation"]}><Input value={form.accountsContact?.designation ?? ""} onChange={(event) => setContact("accountsContact", "designation", event.target.value)} /></FormField>
                      <FormField label="Transaction Email" required error={errors["accountsContact.email"]}><Input type="email" value={form.accountsContact?.email ?? ""} onChange={(event) => setContact("accountsContact", "email", event.target.value)} /></FormField>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[
                    ["Customer", [["Name", form.name], ["Account Code", form.accountCode], ["Types", form.customerTypes.join(", ")], ["Branches", form.branches.join(", ")]]],
                    ["Contact", [["Email", form.email], ["Location", `${form.companyAddress.city}, ${form.companyAddress.country}`], ["Telephone", form.telephone || "—"], ["Billing", form.billingSameAsCompany ? "Same as company" : `${form.billingAddress.city}, ${form.billingAddress.country}`]]],
                    ["Workflow", [["Quotation Flow", form.quotationFlow], ["Booking Hold", form.bookingOnHold], ["Account Manager", form.accountManager], ["Sales Executive", form.revenueExecutive]]],
                    ["Commercial", [["Default Currency", form.defaultCurrency], ["Additional Currencies", form.multiCurrencies.join(", ") || "None"], ["Pricing Model", form.pricingModel], ["ADHOC Markup", form.adhocMarkup]]],
                    ["Customer Admin", [["Name", `${form.admin.firstName} ${form.admin.lastName}`], ["Designation", form.admin.designation], ["Email / User ID", form.admin.email], ["Accounts Contact", form.accountsContact?.email || "Not configured"]]],
                    ["Documents", [["Logo", form.logo?.name || "Not uploaded"], ["Trade Licence", form.tradeLicence?.name || "Not uploaded"], ["Owner Passport & ID", form.ownerIdentity?.name || "Not uploaded"], ["Agent Code", "Generated after save"]]],
                  ].map(([title, rows]) => (
                    <section key={title as string} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                      <h2 className="mb-3 text-sm font-semibold text-slate-900">{title as string}</h2>
                      <dl className="space-y-2">
                        {(rows as string[][]).map(([label, value]) => <div key={label} className="flex justify-between gap-4 text-sm"><dt className="text-slate-500">{label}</dt><dd className="text-right font-medium text-slate-800">{value}</dd></div>)}
                      </dl>
                    </section>
                  ))}
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
                  <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-600" />
                  I confirm that the customer information and operating configuration are accurate.
                </label>
                {submitError && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</div>}
                <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-3 text-xs text-brand-700"><ShieldCheck className="h-4 w-4" />The temporary password and uploaded file contents are not stored in this prototype.</div>
              </div>
            )}
          </div>

          <div className="mx-auto mt-8 flex max-w-5xl items-center justify-between border-t border-slate-100 pt-5">
            <Button variant="ghost" onClick={() => navigate(-1)} disabled={saving}>Cancel</Button>
            <div className="flex items-center gap-2">
              {step > 0 && <Button variant="secondary" onClick={() => { setErrors({}); setStep((current) => current - 1); }} disabled={saving}><ArrowLeft className="h-4 w-4" />Back</Button>}
              {step < STEPS.length - 1
                ? <Button onClick={continueStep} disabled={saving}>Continue<ArrowRight className="h-4 w-4" /></Button>
                : <Button type="submit" disabled={!agreed || saving}>{saving ? "Creating..." : <><CircleCheck className="h-4 w-4" />Save & Create</>}</Button>}
            </div>
          </div>
        </form>
      </Card>
    </>
  );
}
