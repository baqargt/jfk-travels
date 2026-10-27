import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import Button from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Input";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import { apiRequest } from "@/api/client";
import type { ApiExchangeRate, ApiPage } from "@/api/types";
import { fmtDate } from "@/lib/utils";

export default function ExchangeRatesPage() {
  const queryClient = useQueryClient();
  const [currency, setCurrency] = useState("");
  const [rate, setRate] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const { data } = useQuery({ queryKey: ["exchange-rates"], queryFn: () => apiRequest<ApiPage<ApiExchangeRate>>("/exchange-rates?page_size=100") });
  const mutation = useMutation({
    mutationFn: () => apiRequest("/exchange-rates", { method: "POST", body: { quoteCurrency: currency.toUpperCase(), rate: Number(rate), effectiveDate: date } }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["exchange-rates"] }); setCurrency(""); setRate(""); },
  });
  const submit = (event: FormEvent) => { event.preventDefault(); if (currency.length === 3 && Number(rate) > 0) mutation.mutate(); };
  const columns: Column<ApiExchangeRate>[] = [
    { key: "pair", header: "Pair", render: (row) => <span className="font-mono font-semibold">{row.quoteCurrency}/{row.baseCurrency}</span> },
    { key: "rate", header: "Rate", className: "!text-right tabular-nums" },
    { key: "effectiveDate", header: "Effective", render: (row) => fmtDate(row.effectiveDate) },
  ];
  return <>
    <PageHeader title="Exchange Rates" description="Manually maintained quote-to-base currency conversion rates." />
    <Card title="Add exchange rate" className="mb-6"><form onSubmit={submit} className="grid grid-cols-1 items-end gap-4 md:grid-cols-4">
      <FormField label="Quote currency" required><Input value={currency} onChange={(event) => setCurrency(event.target.value.slice(0, 3).toUpperCase())} placeholder="AED" /></FormField>
      <FormField label="Rate to base" required><Input type="number" min="0.000001" step="0.000001" value={rate} onChange={(event) => setRate(event.target.value)} /></FormField>
      <FormField label="Effective date" required><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></FormField>
      <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save rate"}</Button>
    </form>{mutation.error && <p className="mt-3 text-sm text-rose-700">{mutation.error.message}</p>}</Card>
    <DataTable columns={columns} data={data?.items ?? []} rowKey={(row) => row.id} searchPlaceholder="Search currencies..." searchKeys={["quoteCurrency", "baseCurrency"]} emptyTitle="No exchange rates" />
  </>;
}
