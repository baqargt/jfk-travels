import { Link } from "react-router-dom";
import {
  ArrowRight,
  Car,
  CreditCard,
  FileText,
  Hotel,
  Plane,
  ShieldCheck,
} from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable/DataTable";
import Badge, { StatusBadge } from "@/components/ui/Badge";
import PageHeader, { Card } from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { limitsOverview, transactions } from "@/lib/mockData";
import { topAgents, topAirlines, topSuppliers } from "@/lib/mockCharts";
import { fmtDate, fmtMoney, pct } from "@/lib/utils";
import { PATHS } from "@/routes/paths";
import type { Transaction } from "@/types";
import SalesExpensesChart from "@/features/dashboard/components/SalesExpensesChart";
import QueriesFlowChart from "@/features/dashboard/components/QueriesFlowChart";
import DestinationsChart from "@/features/dashboard/components/DestinationsChart";
import QueryFunnel from "@/features/dashboard/components/QueryFunnel";
import QuerySourcePie from "@/features/dashboard/components/QuerySourcePie";
import TopRankingChart from "@/features/dashboard/components/TopRankingChart";

const quickLinks = [
  { label: "Flights", icon: Plane, path: PATHS.booking.flights },
  { label: "Hotels", icon: Hotel, path: PATHS.booking.hotels },
  { label: "Insurance", icon: ShieldCheck, path: PATHS.booking.insurance },
  { label: "Transfers", icon: Car, path: PATHS.booking.transfers },
];

const txnColumns: Column<Transaction>[] = [
  { key: "id", header: "Transaction", render: (t) => <span className="font-mono text-xs font-medium text-slate-800">{t.id}</span> },
  { key: "customer", header: "Customer", render: (t) => <span className="font-medium text-slate-900">{t.customer}</span> },
  { key: "service", header: "Service", render: (t) => <span className="text-xs text-slate-500">{t.service}</span> },
  { key: "amount", header: "Amount", sortValue: (t) => t.amount, className: "text-right", render: (t) => <span className="font-semibold tabular-nums">{fmtMoney(t.amount)}</span> },
  { key: "status", header: "Status", render: (t) => <StatusBadge status={t.status} /> },
  { key: "date", header: "Date", sortValue: (t) => t.date, render: (t) => fmtDate(t.date) },
];

export default function DashboardPage() {
  const { cash, credit, temp } = limitsOverview;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Saturday, August 22 2026 · Here's what's happening across your agency today."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Bookings" value="1,248" change="+12.4%" up note="vs last month" icon={FileText} tone="blue" />
        <StatCard label="Revenue (MTD)" value={fmtMoney(486320)} change="+8.1%" up note="vs last month" icon={ArrowRight} tone="emerald" />
        <StatCard label="Active Credit Lines" value="23" change="+3" up note="sub companies" icon={CreditCard} tone="violet" />
        <StatCard label="Pending Refunds" value="7" change="-18%" up={false} note={fmtMoney(4057) + " at risk"} icon={ShieldCheck} tone="amber" />
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <SalesExpensesChart />
          <QueriesFlowChart />
          <DestinationsChart />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <TopRankingChart title="Top 10 Agents" data={topAgents} description="Agents by bookings" color="#2563eb" />
            <TopRankingChart title="Top 10 Suppliers" data={topSuppliers} description="Suppliers by bookings" color="#10b981" />
          </div>

          <div>
            <DataTable
              columns={txnColumns}
              data={transactions}
              rowKey={(t) => t.id}
              searchable={false}
              initialPageSize={6}
              pageSizeOptions={[6]}
              compact
              emptyTitle="No transactions yet"
              toolbarActions={
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              }
            />
            <p className="mt-3 px-1 text-xs text-slate-400">
              Latest bookings across all sub companies and service verticals.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <QuerySourcePie />
          <QueryFunnel />
          <TopRankingChart title="Top 10 Airlines" data={topAirlines} description="Airlines by bookings" color="#8b5cf6" />

          <Card title="Quick Booking" description="Jump straight into the travel engine">
            <Input type="search" placeholder="Destination, airline, hotel..." className="!py-2.5" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              {quickLinks.map(({ label, icon: Icon, path }) => (
                <Link
                  key={path}
                  to={path}
                  className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                >
                  <Icon className="h-4 w-4 text-brand-600" />
                  {label}
                </Link>
              ))}
            </div>
          </Card>

          <Card title="Limit Utilization" description="Financial headroom snapshot">
            <div className="space-y-4">
              {[
                { label: "Cash", used: cash.used, total: cash.allocated, bar: "bg-emerald-500", link: PATHS.limits.cash },
                { label: "Credit", used: credit.utilized, total: credit.limit, bar: "bg-brand-500", link: PATHS.limits.credit },
                { label: "Temp Limits", used: temp.totalAmount - 36_150, total: temp.totalAmount, bar: "bg-amber-500", link: PATHS.limits.temp },
              ].map(({ label, used, total, bar, link }) => (
                <Link key={label} to={link} className="block group">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 group-hover:text-brand-700">{label}</span>
                    <span className="text-slate-400 tabular-nums">{pct(used, total)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct(used, total)}%` }} />
                  </div>
                </Link>
              ))}
            </div>
            <Link
              to={PATHS.limits.credit}
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
            >
              Manage limits <ArrowRight className="h-3 w-3" />
            </Link>
          </Card>

          <Card bodyClassName="p-0">
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-slate-900 to-brand-900 p-5 text-white">
              <div>
                <Badge variant="blue" className="!bg-white/15 !text-brand-100 !ring-white/20">
                  Settlement due
                </Badge>
                <p className="mt-2.5 text-xl font-bold tabular-nums">{fmtMoney(credit.dueAmount)}</p>
                <p className="text-xs text-slate-300">Next settlement · Aug 30, 2026</p>
              </div>
              <CreditCard className="h-10 w-10 opacity-30" />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
