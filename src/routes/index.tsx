import type { ComponentType } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { PATHS } from "@/routes/paths";
import ProtectedRoute from "@/routes/ProtectedRoute";

const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await load()).default,
});

const router = createBrowserRouter([
  {
    path: PATHS.login,
    lazy: page(() => import("@/features/auth/pages/LoginPage")),
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to={PATHS.dashboard} replace /> },
      { path: "dashboard", lazy: page(() => import("@/features/dashboard/pages/DashboardPage")) },
      { path: "booking", element: <Navigate to={PATHS.booking.flights} replace /> },
      { path: "booking/:service", lazy: page(() => import("@/features/booking/pages/BookingEnginePage")) },
      { path: "company/profile", lazy: page(() => import("@/features/company/pages/CompanyProfilePage")) },
      { path: "company/sub-companies", lazy: page(() => import("@/features/company/pages/SubCompaniesPage")) },
      { path: "company/sub-companies/new", lazy: page(() => import("@/features/company/pages/CreateSubCompanyPage")) },
      { path: "users", lazy: page(() => import("@/features/users/pages/UsersPage")) },
      { path: "users/new", lazy: page(() => import("@/features/users/pages/CreateUserPage")) },
      { path: "customers", lazy: page(() => import("@/features/customers/pages/CustomersPage")) },
      { path: "customers/new", lazy: page(() => import("@/features/customers/pages/CreateCustomerPage")) },
      { path: "pricing", lazy: page(() => import("@/features/pricing/pages/PricingModelsPage")) },
      { path: "pricing/new", lazy: page(() => import("@/features/pricing/pages/CreatePricingModelPage")) },
      { path: "reports/dsr", lazy: page(() => import("@/features/reports/pages/DsrReportPage")) },
      { path: "reports/air", lazy: page(() => import("@/features/reports/pages/AirReportsPage")) },
      { path: "reports/hotel", lazy: page(() => import("@/features/reports/pages/HotelReportsPage")) },
      { path: "reports/misc", lazy: page(() => import("@/features/reports/pages/MiscReportsPage")) },
      { path: "reports/refunds", lazy: page(() => import("@/features/reports/pages/RefundReportsPage")) },
      { path: "limits/cash", lazy: page(() => import("@/features/limits/pages/CashLimitPage")) },
      { path: "limits/credit", lazy: page(() => import("@/features/limits/pages/CreditLimitPage")) },
      { path: "limits/temp", lazy: page(() => import("@/features/limits/pages/TempLimitPage")) },
    ],
  },
  {
    path: "*",
    lazy: page(() => import("@/features/misc/pages/NotFoundPage")),
  },
]);

export default router;
