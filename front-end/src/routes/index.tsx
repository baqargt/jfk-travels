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
      { path: "platform/companies", lazy: page(() => import("@/features/platform/pages/PlatformCompaniesPage")) },
      { path: "platform/companies/new", lazy: page(() => import("@/features/platform/pages/CreatePlatformCompanyPage")) },
      { path: "platform/companies/:companyId/edit", lazy: page(() => import("@/features/platform/pages/EditPlatformCompanyPage")) },
      { path: "platform/companies/:companyId", lazy: page(() => import("@/features/platform/pages/PlatformCompanyDetailPage")) },
      { path: "account/profile", lazy: page(() => import("@/features/account/pages/ProfileSettingsPage")) },
      { path: "account/password", lazy: page(() => import("@/features/account/pages/ChangePasswordPage")) },
      { path: "booking", element: <Navigate to={PATHS.booking.flights} replace /> },
      { path: "booking/bookings", lazy: page(() => import("@/features/booking/pages/BookingsPage")) },
      { path: "booking/flights/:resultId/passengers", lazy: page(() => import("@/features/booking/pages/PassengerDetailsPage")) },
      { path: "booking/:service", lazy: page(() => import("@/features/booking/pages/BookingEnginePage")) },
      { path: "company/profile", lazy: page(() => import("@/features/company/pages/CompanyProfilePage")) },
      { path: "company/profile/edit", lazy: page(() => import("@/features/company/pages/EditCompanyProfilePage")) },
      { path: "company/sub-companies", lazy: page(() => import("@/features/company/pages/SubCompaniesPage")) },
      { path: "company/sub-companies/new", lazy: page(() => import("@/features/company/pages/CreateSubCompanyPage")) },
      { path: "company/sub-companies/:branchId/edit", lazy: page(() => import("@/features/company/pages/CreateSubCompanyPage")) },
      { path: "departments", lazy: page(() => import("@/features/departments/pages/DepartmentsPage")) },
      { path: "departments/new", lazy: page(() => import("@/features/departments/pages/CreateDepartmentPage")) },
      { path: "departments/:departmentId/edit", lazy: page(() => import("@/features/departments/pages/CreateDepartmentPage")) },
      { path: "customers", lazy: page(() => import("@/features/customers/pages/CustomersPage")) },
      { path: "customers/matrix", lazy: page(() => import("@/features/customers/pages/CustomersMatrixPage")) },
      { path: "customers/new", lazy: page(() => import("@/features/customers/pages/CreateCustomerPage")) },
      { path: "customers/:customerId/edit", lazy: page(() => import("@/features/customers/pages/CreateCustomerPage")) },
      { path: "users", lazy: page(() => import("@/features/users/pages/UsersPage")) },
      { path: "users/matrix", lazy: page(() => import("@/features/users/pages/UsersMatrixPage")) },
      { path: "users/new", lazy: page(() => import("@/features/users/pages/CreateUserPage")) },
      { path: "users/:userId/edit", lazy: page(() => import("@/features/users/pages/CreateUserPage")) },
      { path: "users/:userId", lazy: page(() => import("@/features/users/pages/UserProfilePage")) },
      { path: "job-titles", lazy: page(() => import("@/features/job-titles/pages/JobTitlesPage")) },
      { path: "job-titles/new", lazy: page(() => import("@/features/job-titles/pages/CreateJobTitlePage")) },
      { path: "job-titles/:jobTitleId/edit", lazy: page(() => import("@/features/job-titles/pages/CreateJobTitlePage")) },
      { path: "access-profiles", lazy: page(() => import("@/features/access-profiles/pages/AccessProfilesPage")) },
      { path: "access-profiles/new", lazy: page(() => import("@/features/access-profiles/pages/CreateAccessProfilePage")) },
      { path: "access-profiles/:accessProfileId/edit", lazy: page(() => import("@/features/access-profiles/pages/CreateAccessProfilePage")) },
      { path: "traveller-profiles", lazy: page(() => import("@/features/traveller-profiles/pages/TravellerProfilesPage")) },
      { path: "traveller-profiles/new", lazy: page(() => import("@/features/traveller-profiles/pages/CreateTravellerProfilePage")) },
      { path: "traveller-profiles/:travellerId/edit", lazy: page(() => import("@/features/traveller-profiles/pages/CreateTravellerProfilePage")) },
      { path: "pricing", lazy: page(() => import("@/features/pricing/pages/PricingModelsPage")) },
      { path: "pricing/new", lazy: page(() => import("@/features/pricing/pages/CreatePricingModelPage")) },
      { path: "pricing/:modelId/edit", lazy: page(() => import("@/features/pricing/pages/CreatePricingModelPage")) },
      { path: "pricing/templates", lazy: page(() => import("@/features/pricing/pages/TemplatesPage")) },
      { path: "reports/dsr", lazy: page(() => import("@/features/reports/pages/DsrReportPage")) },
      { path: "reports/air", lazy: page(() => import("@/features/reports/pages/AirReportsPage")) },
      { path: "reports/hotel", lazy: page(() => import("@/features/reports/pages/HotelReportsPage")) },
      { path: "reports/misc", lazy: page(() => import("@/features/reports/pages/MiscReportsPage")) },
      { path: "reports/refunds", lazy: page(() => import("@/features/reports/pages/RefundReportsPage")) },
      { path: "limits/cash", lazy: page(() => import("@/features/limits/pages/CashLimitPage")) },
      { path: "limits/cash/:accountId/edit", lazy: page(() => import("@/features/limits/pages/EditFinancialAccountPage")) },
      { path: "limits/credit", lazy: page(() => import("@/features/limits/pages/CreditLimitPage")) },
      { path: "limits/credit/:accountId/edit", lazy: page(() => import("@/features/limits/pages/EditFinancialAccountPage")) },
      { path: "limits/temp", lazy: page(() => import("@/features/limits/pages/TempLimitPage")) },
      { path: "limits/temp/:limitId/edit", lazy: page(() => import("@/features/limits/pages/EditTempLimitPage")) },
      { path: "limits/approvals", lazy: page(() => import("@/features/limits/pages/ApprovalRequestsPage")) },
      { path: "limits/exchange-rates", lazy: page(() => import("@/features/limits/pages/ExchangeRatesPage")) },
    ],
  },
  {
    path: "*",
    lazy: page(() => import("@/features/misc/pages/NotFoundPage")),
  },
]);

export default router;
