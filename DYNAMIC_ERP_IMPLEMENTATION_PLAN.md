# JFK Travel ERP - Dynamic Implementation Plan

## 1. Objective

Convert the existing React/Vite prototype into a production-ready, database-driven ERP with:

- PostgreSQL running in Docker for local development.
- A Python FastAPI backend as the single source of business logic and data access.
- Real authentication, server-side role-based authorization, validation, audit history, and reporting.
- Existing mock data and simulated form submissions replaced by API calls.
- A clean integration layer for GDS, hotel, insurance, transfer, and other suppliers.

This plan separates the internal ERP implementation from live travel-supplier integrations. The ERP can become fully dynamic without supplier credentials; live search, PNR creation, ticketing, cancellation, and refunds require commercial accounts, credentials, and provider certification.

## 2. Current-State Audit

The repository currently contains:

- A working React 18 + TypeScript + Vite frontend.
- Modules for authentication, dashboard, bookings, company, sub-companies, departments, customers, users, travellers, pricing, reports, and financial limits.
- An empty `back-end` directory.
- Mock datasets in `front-end/src/lib/mock*.ts`, `bookingData.ts`, `templateData.ts`, and customer seed data.
- Prototype authentication with a shared password and user information stored in `localStorage`.
- Only customer creation persists locally; most other create/edit actions simulate a delay and discard the submitted data.
- Role checks are performed only in the browser, so they are not a security boundary.
- Dashboard charts and all reports are static.
- Supplier connections and credentials shown on the company page are placeholders.

Baseline: the current frontend production build passes successfully.

## 3. Recommended Architecture

```text
React/Vite frontend
        |
        | HTTPS JSON API (/api/v1)
        v
FastAPI application
  |-- Auth and RBAC
  |-- ERP domain services
  |-- Reporting queries
  |-- Supplier adapter interface
  |-- Background jobs
        |
        +------ PostgreSQL (Docker, persistent volume)
        +------ Redis (later, jobs/cache/rate limits)
        +------ S3/MinIO (documents; later or when uploads go live)
        +------ External supplier APIs
```

### Backend stack

- FastAPI for REST endpoints and OpenAPI documentation.
- SQLAlchemy 2 for ORM/data access.
- Alembic for versioned schema migrations.
- Pydantic settings and request/response validation.
- PostgreSQL for transactional data.
- `pytest` plus integration tests against a temporary/test database.
- Structured logging and request IDs.
- A background-job worker only when email, report export, supplier polling, or reconciliation needs it.

### Frontend additions

- A typed API client generated from OpenAPI or maintained in one `src/api` layer.
- TanStack Query for server state, caching, invalidation, loading, and error states.
- React Hook Form with Zod for complex form validation.
- No domain records in `localStorage`; only non-sensitive UI preferences may remain there.

### Architecture rules

- Use UUID primary keys internally; retain human-facing codes such as `AGT-000001` as unique generated columns.
- Store money as `numeric(18,2)` with an ISO currency code, never floating point.
- Store timestamps as UTC `timestamptz`; localize them in the frontend.
- Add `created_at`, `updated_at`, `created_by`, and optional `deleted_at` where auditability matters.
- Every business table carries `company_id` (and `sub_company_id` where relevant) to enforce data ownership.
- Transactions, pricing, limits, and booking status changes go through service-layer rules, not direct controller updates.
- Never store raw supplier secrets in frontend code or API responses. Encrypt credentials at rest and return masked values only.
- Store uploaded documents in object storage; PostgreSQL stores metadata and object keys, not file blobs.

## 4. PostgreSQL in Docker

Create a root `compose.yaml` containing a PostgreSQL service with:

- A pinned PostgreSQL image version.
- A named persistent volume.
- A health check using `pg_isready`.
- Credentials loaded from an uncommitted `.env` file.
- Port publishing for local development only.
- An optional Adminer/pgAdmin profile, disabled by default.

Expected developer flow:

```text
docker compose up -d db
backend migration upgrade
backend seed demo
backend dev server
frontend dev server
```

Required supporting files:

- `.env.example` with safe placeholders.
- Backend `Dockerfile` and optional full-stack Compose profile.
- Migration and seed commands that are repeatable.
- Database health endpoint and startup dependency checks.
- Backup/restore scripts using `pg_dump` and `pg_restore`.

Production must use a separate secret set, private database networking, automated backups, retention rules, and periodic restore tests. The development volume is not a backup.

## 5. Database Domain Model

The first schema should be organized into these domains.

### Identity and access

- `companies`
- `sub_companies`
- `departments`
- `users`
- `roles`
- `permissions`
- `user_roles` / `role_permissions`
- `refresh_sessions`
- `password_reset_tokens`
- `audit_logs`

Seed the five current roles (Administrator, Manager, Agent, Accounts, Sub Agent), but model permissions as records so access can evolve without frontend releases.

### Company and configuration

- `company_addresses`
- `company_currencies`
- `supplier_connections`
- `system_settings`
- Reference tables for currencies, countries, cities, airports, airlines, suppliers, service types, and statuses where administration is required.

### Customers

- `customers`
- `customer_addresses`
- `customer_contacts`
- `customer_documents`
- Join tables for customer types, channels, branches, payment channels, business types, currencies, notification recipients, and enabled pricing fields.

The backend must generate agent codes atomically and enforce unique account code/admin email constraints in PostgreSQL.

### Travellers

- `travellers`
- `traveller_documents` (passport and future IDs/visas)
- `traveller_preferences`
- `traveller_loyalty_accounts`
- Booking relationships derived from `booking_passengers` instead of a duplicated booking count/history field.

### Pricing

- `pricing_models`
- `pricing_rules`
- `pricing_rule_scopes`
- `pricing_templates`
- Service-specific condition/action data, initially as validated `jsonb`, with frequently queried fields normalized and indexed.
- `pricing_rule_versions` to preserve the exact pricing configuration used for a quotation/booking.

### Booking and fulfilment

- `booking_searches` (optional short-retention diagnostics)
- `quotes`
- `quote_items`
- `bookings`
- `booking_items`
- `booking_passengers`
- `flight_segments`
- `hotel_stays`
- `service_details` for insurance, transfers, tours, fixed departures, and A-to-A until each domain needs dedicated tables.
- `payments`
- `tickets`
- `refunds`
- `booking_status_history`
- `supplier_payloads` for redacted diagnostic request/response metadata with retention limits.

### Finance and limits

- `financial_accounts`
- `limit_allocations` (cash, credit, temporary)
- `temporary_limits`
- `ledger_entries`
- `payment_allocations`
- `reconciliation_runs`

Ledger rows should be append-only. Corrections use reversal entries. Limit consumption and booking confirmation must share one database transaction to prevent overspending under concurrent requests.

### Communication and operations

- `notifications`
- `notification_reads`
- `outbox_events` for reliable email/webhook/background processing.
- `file_assets` for uploaded-document metadata.

## 6. API Surface

Use `/api/v1` and consistent pagination, filters, sorting, validation errors, and idempotency handling.

### Foundation endpoints

- `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- `GET/PATCH /company`
- CRUD for `/sub-companies`, `/departments`, `/users`, `/roles`, and `/permissions`
- CRUD for `/customers`, `/travellers`, `/pricing-models`, and `/pricing-templates`
- Upload/download endpoints using signed object-storage URLs.

### Transactional endpoints

- `POST /booking-searches/{service}`
- `POST /quotes` and `POST /quotes/{id}/confirm`
- `GET/PATCH /bookings/{id}` with explicit status-transition actions.
- Ticket, void, cancel, and refund commands as dedicated endpoints rather than generic field edits.
- `GET /financial-accounts/{id}/ledger`
- Limit allocate, adjust, approve, expire, and reverse commands.

### Read models

- `GET /dashboard/summary` and chart-specific aggregates.
- Report endpoints for DSR, air, hotel, miscellaneous services, and refunds.
- CSV/XLSX/PDF export should run asynchronously once record volumes become significant.
- `GET /notifications` and mark-read endpoints.

## 7. Authentication and Security

- Hash passwords with Argon2id; never retain or log plaintext passwords.
- Use short-lived access tokens and rotated refresh sessions in secure, HttpOnly, SameSite cookies.
- Add CSRF protection if cookie authentication is used across origins.
- Enforce permissions and company/sub-company ownership on every backend query.
- Rate-limit authentication and supplier-search endpoints.
- Validate MIME type, size, and malware-scan status for uploads.
- Redact passwords, tokens, passport details, payment data, and supplier credentials from logs.
- Record audit events for login, role changes, customer updates, pricing changes, limit adjustments, booking actions, and refunds.
- Add CORS allowlists, security headers, dependency scanning, and secret scanning.
- Do not handle raw card details; integrate a PCI-compliant payment provider using hosted/tokenized flows.

## 8. Delivery Phases

### Phase 0 - Decisions and acceptance criteria (2-3 days)

- Confirm tenant model: one JFK company with branches, or multiple independent companies.
- Confirm approval flows for pricing, limits, refunds, ticketing, and user activation.
- Identify mandatory fields and required document retention rules.
- Decide which supplier is integrated first and obtain its sandbox account/documentation.
- Define MVP acceptance tests per existing screen.

Deliverable: signed-off scope, workflow/state diagrams, and prioritized backlog.

### Phase 1 - Platform foundation (3-5 days)

- Create FastAPI project structure, configuration, logging, health checks, and error format.
- Add PostgreSQL Compose service, migrations, seed framework, and test database.
- Add API client/configuration to the frontend.
- Establish CI checks: backend lint/test/migration check and frontend typecheck/build.

Deliverable: frontend and backend start locally, database persists, and CI is green.

### Phase 2 - Authentication, tenancy, and RBAC (5-7 days)

- Implement users, roles, permissions, password management, sessions, and audit logging.
- Replace prototype login and browser-only access checks.
- Add 401/403 handling and protected API routes.

Deliverable: real login/logout/refresh, server-enforced roles, and seeded admin account.

### Phase 3 - Organization and master data (5-7 days)

- Make company profile, sub-companies, departments, users, supplier configuration, and lookup data dynamic.
- Implement list pagination, filters, create/edit/status/delete flows.
- Remove the corresponding mock imports.

Deliverable: management screens survive refresh and use PostgreSQL exclusively.

### Phase 4 - Customers, travellers, and pricing (8-12 days)

- Normalize and migrate customer fields and documents.
- Implement traveller profiles, documents, preferences, and booking relationships.
- Implement pricing models/templates, versioning, priority/conflict validation, and a pricing evaluation service.

Deliverable: complete CRUD, validation, audit trail, file metadata, and pricing unit tests.

### Phase 5 - Finance and limits (7-10 days)

- Implement accounts, append-only ledger, cash/credit/temporary limits, approvals, expiry jobs, and adjustments.
- Add transactional balance/limit locking and reconciliation checks.
- Connect the limits widget and finance pages to live aggregates.

Deliverable: balances can be reproduced from the ledger and concurrency tests prevent double spending.

### Phase 6 - Booking core and first supplier integration (10-20+ days)

- Implement quotation, booking, passengers, service items, status history, payments, tickets, cancellation, and refunds.
- Create a provider-neutral adapter contract for search, price recheck, book, retrieve, cancel, ticket, and refund.
- Keep a deterministic fake provider for automated tests and local demos.
- Integrate one real provider sandbox end-to-end before adding more providers.
- Apply pricing and reserve limits atomically during confirmation.

Deliverable: one service/provider completes search-to-confirmation in sandbox; internal booking records remain manageable if the provider is unavailable.

### Phase 7 - Reports, dashboard, notifications, and exports (5-8 days)

- Replace all chart/report mocks with indexed aggregate queries.
- Add date, branch, agent, supplier, service, and status filters.
- Add notification persistence and background-generated exports.

Deliverable: every existing dashboard/report screen reads live data and reconciles to bookings/ledger entries.

### Phase 8 - Hardening and release (5-8 days)

- End-to-end tests for critical business journeys.
- Permission matrix tests and security review.
- Load tests for search, booking confirmation, and reports.
- Backup/restore drill, monitoring, alerts, deployment runbook, and rollback rehearsal.
- Remove unused mock repositories and demo credentials.

Deliverable: release candidate with operational and recovery documentation.

## 9. Frontend Migration Order

Migrate one vertical slice at a time, retaining a working build after each slice:

1. Auth and current user.
2. Company, sub-companies, departments, and users.
3. Customers.
4. Traveller profiles.
5. Pricing models and templates.
6. Limits and ledgers.
7. Booking search, passenger capture, quotation, and confirmation.
8. Reports, dashboard, and notifications.

For every list screen, move filtering, sorting, and pagination to the server. For every form, implement loading, validation, API error, success, retry, and unsaved-change states. Remove a mock dataset only after its replacement endpoint and tests are complete.

## 10. Testing Strategy

- Unit tests: pricing calculations, status transitions, permission policies, code generation, limit math, expiry logic.
- Database integration tests: constraints, migrations, service transactions, concurrent limit consumption, ledger reconciliation.
- API contract tests: success and validation/error schemas for every endpoint.
- Frontend component tests: complex forms, permission rendering, loading/error/empty states.
- End-to-end tests: login, user creation, customer creation, traveller creation, pricing assignment, booking confirmation, limit adjustment, refund, and reports.
- Supplier contract tests: recorded/redacted fixtures plus sandbox smoke tests that are separate from normal CI.

No phase is complete until migrations work on an empty database and on the previous schema version.

## 11. Definition of Done

The ERP is considered dynamically complete when:

- No business module imports mock records or relies on browser storage for domain data.
- All create/edit/status actions persist and are visible after refresh and in a second browser session.
- Authentication and authorization are enforced by the backend.
- Company/branch data isolation is covered by automated tests.
- All dashboard values and reports are computed from PostgreSQL.
- Pricing applied to a booking is reproducible from a stored rule version.
- Booking and financial state changes are transactional and auditable.
- Database migrations, backup, restore, seed, and deployment procedures are documented and tested.
- Critical workflows have end-to-end tests and production monitoring.

## 12. Estimate and Suggested Team

For one experienced full-stack developer, the internal ERP scope is approximately 8-12 weeks. A first real supplier integration can add 2-6+ weeks depending on provider APIs, certification, payment/ticketing scope, and access to sandbox credentials. A backend developer plus a frontend developer can run many phases in parallel and usually reduce calendar time, but finance rules and supplier dependencies remain on the critical path.

Suggested ownership:

- Backend/domain: schema, auth, services, finance, integrations, migrations.
- Frontend: API migration, forms, error/loading states, E2E coverage.
- Product/operations: workflow decisions, permissions, pricing rules, report reconciliation, acceptance testing.
- DevOps/security (part-time): secrets, deployment, backups, monitoring, release review.

## 13. First Implementation Milestone

The safest first milestone is an end-to-end management slice:

1. Add PostgreSQL Compose and FastAPI foundation.
2. Implement migrations for company, sub-company, department, user, role, and session tables.
3. Seed an administrator and the current role matrix.
4. Replace login with backend authentication.
5. Replace sub-company, department, and user mock lists/forms with API CRUD.
6. Add backend tests and one browser E2E test covering login and user creation.

This milestone proves the architecture, security model, migration process, and frontend API pattern before the more complex customer, pricing, finance, and booking domains are moved.
