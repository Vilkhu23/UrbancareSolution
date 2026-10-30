# Project: Remediation of SEC-03 (Client-Controlled Service-Request Pricing)

## Architecture
- **Database Engine (PostgreSQL/Supabase)**:
  - Table `public.service_requests`: stores booking records with `items` JSONB, `subtotal`, `locality_adjustment`, `tax`, `total`, `status`, `payment_status`.
  - Catalog Tables: `public.services` (29 standard services with prices) and `public.service_packages` (4 bundles with prices).
  - Trigger Function `public.enforce_service_requests_rules()` in `supabase/migrations/20261028000019_remediate_sec03_authoritative_pricing.sql`:
    - Attached `BEFORE INSERT OR UPDATE ON public.service_requests`.
    - On `INSERT`: Validates all item IDs, positive integer quantities (1..100), active status against catalog. Authoritatively calculates subtotal, doorstep visit fee (₹99 for standard services, ₹0 for packages), tax, and total. Overwrites any client-submitted pricing numbers.
    - On `UPDATE`: Blocks modification of `items`, `total`, `subtotal`, `tax`, and payment status by customers/technicians without authorized verification tokens.
  - Payment Function `public.record_payment()`: Requires `p_amount == v_req.total` and issues payment session tokens.
- **Application Layer (TypeScript/React)**:
  - `src/utils/pricingEngine.ts`: Source of truth for client-side pricing calculations (`calculateOrderPricing`).
  - `src/services/supabaseService.ts`: `mapServiceRequestToDb` formats database rows. `syncServiceRequestToSupabase` writes to PostgREST and captures errors.
  - `src/context/AppContext.tsx`: `createBookingFromCart` coordinates order creation, error handling, cart snapshot/rollback, and SEC-09 anonymous visitor compatibility.
- **Testing Architecture**:
  - Node.js native test runner (`node:test`, `node:assert/strict`) via `npx tsx --test`.
  - Standalone regression test suite `src/services/serviceRequestPricingSecurity.test.ts` (63 tests) validating pricing invariants, tampered inputs, malformed payloads, payment compatibility, and migration AST rules.

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | DB Item Catalog Validation | Validate every item ID exists and is active in `public.services` or `public.service_packages` on INSERT | M1 | ORIGINAL_REQUEST §R2 | VERIFIED |
| 2 | DB Bounded Quantity Check | Ensure item quantity is a positive integer between 1 and 100; reject non-positive or non-integers | M1 | ORIGINAL_REQUEST §R2 | VERIFIED |
| 3 | DB Authoritative Subtotal & Total | Server-side calculation of subtotal, visit fee (₹99 standard / ₹0 package), tax, and total overriding client values | M1 | ORIGINAL_REQUEST §R1 | VERIFIED |
| 4 | DB Item Immutability on Update | Prevent customers and staff from altering `items` JSONB array during UPDATE | M1 | ORIGINAL_REQUEST §R1 | VERIFIED |
| 5 | Preservation of Workflow Defaults & Tokens | Maintain `status = 'NEW'`, `payment_status = 'PENDING'`, OTP tokens, payment tokens, and admin bypass | M1 | ORIGINAL_REQUEST §R3 | VERIFIED |
| 6 | Custom Requirement & Diagnostic Compatibility | Support custom requirement booking type with diagnostic visit fee without breaking catalog validation | M1, M2 | survey (Explorer 1 & 2) | VERIFIED |
| 7 | Application Service Sync & Error Handling | Update `syncServiceRequestToSupabase` to handle DB rejection cleanly and preserve cart on error | M2 | ORIGINAL_REQUEST §R3 | VERIFIED |
| 8 | Tier 1-4 Security Regression Test Suite | Implement `src/services/serviceRequestPricingSecurity.test.ts` covering tampered prices, valid bookings, malformed items, payment workflow | Test Track / M3 | ORIGINAL_REQUEST §R4 | VERIFIED |
| 9 | PostgreSQL Integration Test Suite (Test 15) | Add SEC-03 test cases to `supabase/tests/security_tests.sql` with documented Docker requirements | Test Track / M3 | ORIGINAL_REQUEST §R4 | VERIFIED |
| 10 | Security Audit Script Compatibility | Maintain compatibility with `scripts/run-security-audit.cjs` and keep audit status INCOMPLETE | M3 | ORIGINAL_REQUEST §R4 | VERIFIED |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| Test Track | E2E & Regression Test Suite Design | Create `TEST_INFRA.md`, author `src/services/serviceRequestPricingSecurity.test.ts`, update `supabase/tests/security_tests.sql`, publish `TEST_READY.md` | none | DONE |
| M1 | Database Authoritative Pricing Migration | Implement migration `20261028000019_remediate_sec03_authoritative_pricing.sql` updating `enforce_service_requests_rules()` | none | DONE |
| M2 | Application Layer Mapping & Error Handling | Align `supabaseService.ts` and `AppContext.tsx` with authoritative DB pricing and safe error handling | M1 | DONE |
| M3 | Final Verification, Adversarial Hardening & Audit | Run 100% of test suites via `npx tsx --test`, review, adversarial verification, forensic audit | M1, M2, Test Track | DONE |

## Interface Contracts
### Database `enforce_service_requests_rules()` ↔ `public.service_requests`
- **Input**: `NEW.items` (JSONB array of `{ serviceId: string, quantity: number, price?: number, isPackage?: boolean }`), `NEW.total`, `NEW.subtotal`, `NEW.tax`.
- **Validation**:
  - Reject if `NEW.items` is not a non-empty array.
  - For each item, look up `COALESCE(elem->>'serviceId', elem->>'id')` in `public.services` where `active = true` OR in `public.service_packages` where `active = true` (or check if `NEW.request_type = 'CUSTOM_REQUIREMENT'`).
  - Reject if item not found/inactive: `RAISE EXCEPTION 'Service item % is invalid, inactive, or not found in catalog.'`.
  - Reject if `quantity <= 0` or not integer: `RAISE EXCEPTION 'Booking item quantity must be a positive integer between 1 and 100.'`.
- **Authoritative Output Row**:
  - `NEW.subtotal` = computed sum of catalog prices * quantities.
  - `NEW.locality_adjustment` = `0.00`.
  - `NEW.tax` = computed tax (currently `0.00`).
  - `NEW.total` = `NEW.subtotal + (CASE WHEN v_has_standard_service THEN 99.00 ELSE 0.00 END) + NEW.tax`.
  - `NEW.items` = sanitized array with authoritative `price` per item.
  - `NEW.status` = `'NEW'`.
  - `NEW.payment_status` = `'PENDING'`.

### `src/services/supabaseService.ts` ↔ PostgREST
- `syncServiceRequestToSupabase(request: ServiceRequest): Promise<ServiceRequestSyncOutcome>`
- Chains `.select()` to retrieve authoritative database row.
- Properly catches PostgREST errors, extracts error message, and provides caller with `{ success, error, data }`.

## Business Scope: Phase 1 vs Phase 2 Payment Processing

### Phase 1: Production Core Scope (Active & Fully Enforced)
- **On-site Cash Collection**: Technicians and vendors collect payment in person upon service delivery.
- **Staff-Recorded On-Site UPI**: Technicians and vendors present their QR / UPI ID, resident pays on phone, and staff records verified UTR/reference number.
- **Admin Payment Management**: Operations managers and administrators inspect, record, and reconcile payments in the back-office portal.
- **Server-Side Authoritative Pricing**: DB trigger `enforce_service_requests_rules()` authoritatively calculates and enforces catalog prices, visit fees (₹99 standard / ₹0 package), and total.
- **Payment Status Protection**: Column-level privilege lockdown (`REVOKE UPDATE ON service_requests FROM authenticated`) prevents customers and staff from altering `payment_status` or `payment_method` directly.
- **Relational Ledger Verification**: `enforce_service_requests_rules()` requires an exact-match `COMPLETED` row in `public.payments` before transition to `PAID`.
- **Duplicate Completed-Payment Prevention**: Storage-engine partial unique index `idx_payments_req_completed` prevents multiple `COMPLETED` records per `request_id`.
- **Atomic Concurrency & Idempotency**: `record_payment()` serializes concurrent collection attempts using row-level locking (`SELECT ... FOR UPDATE`) and safely returns existing completed payments without double-charging.
- **Audit Logging**: All lifecycle changes and payment recordings are appended to `public.audit_logs`.

### Phase 2: Deferred Payment Scope (Explicitly Out of Scope for Phase 1)
- **Payment Gateway Integration**: Direct merchant API integrations (e.g., Razorpay, Cashfree, Stripe, Paytm).
- **Online Checkout Intent**: In-app online card, net banking, or auto-triggered UPI intent payments at checkout.
- **Gateway Credentials & Secrets**: Storing or configuring merchant API keys, secret hashes, or payment gateway SDKs.
- **Webhooks & Signature Callbacks**: Inbound webhook handlers verifying payment gateway cryptographic signatures.
- **Automated Refunds**: Gateway refund APIs and automated chargeback reversals.
- **Gateway Reconciliation**: Automated bank settlement sync and merchant fee ledger deductions.

## Code Layout
- `supabase/migrations/20261028000019_remediate_sec03_authoritative_pricing.sql`: Authoritative pricing trigger.
- `supabase/tests/security_tests.sql`: Updated with Test 15 (SEC-03 INSERT price tampering tests).
- `src/services/supabaseService.ts`: Mapping, normalization, and sync functions.
- `src/context/AppContext.tsx`: Booking creation, cart rollback on rejection, and toast alerts.
- `src/services/serviceRequestPricingSecurity.test.ts`: Standalone regression tests runnable with `npx tsx --test`.
- `TEST_INFRA.md`: Test architecture and coverage index.
- `TEST_READY.md`: Signal that test suite is complete.
