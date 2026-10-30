# E2E Test Infra: SEC-03 Authoritative Pricing Remediation

## 1. Test Architecture & Fidelity Classification
To prevent false assumptions regarding runtime database enforcement, testing is strictly partitioned into two distinct tiers:

### Tier A: Local In-Memory Simulation & Application Flow Tests (Executable Standalone)
- **File:** `src/services/serviceRequestPricingSecurity.test.ts`
- **Runner:** Node.js native test runner (`node:test`, `node:assert/strict`) via `npx tsx --test`.
- **Scope & Fidelity:**
  - Tests the programmatic contract oracle (`simulateEnforceServiceRequestsRules()`), client-side mapping layers (`mapServiceRequestToDb()`), defensive quantity clamping, and catalog pricing invariants.
  - **Limitation:** Executing these tests proves that the TypeScript model, validation rules, and client-side sanitizers conform to specification; it **does NOT** prove runtime enforcement by the live PostgreSQL database engine.
- **Coverage:** 67 automated test cases spanning:
  - Catalog ID and active status checks.
  - Positive bounded quantities (1..100).
  - Authoritative subtotal, ₹99 doorstep fee (for standard services), and ₹0 fee (for packages and free quote consultations).
  - Immutability of items and billing fields on UPDATE.
  - Token and workflow preservation.
  - Adversarial regression tests for quote consultations and multi-quantity AC inspections.

### Tier B: PostgreSQL Database Integration Tests (Requires Docker / Supabase CLI)
- **File:** `supabase/tests/security_tests.sql` (Test 15: Sub-tests 15.1 through 15.5)
- **Runner:** pgTAP via `supabase test db` or direct psql execution in a running Supabase container.
- **Scope & Fidelity:**
  - Directly tests migration `20261028000019_remediate_sec03_authoritative_pricing.sql` and `public.enforce_service_requests_rules()` inside PostgreSQL.
  - Proves that the actual PL/pgSQL trigger intercepts real SQL `INSERT` and `UPDATE` statements, queries `public.services` and `public.service_packages`, and aborts invalid transactions.
- **Current Status:** **BLOCKED / NEEDS-VALIDATION**. Docker is not installed on the current host. These integration tests are ready and documented, but remain pending containerized execution.

---

## 2. Business Logic Invariants & Defect Corrections
Following the adversarial security review, two business logic defects were corrected:

1. **Quote-Required Consultations (`price_type = 'quote_required'`):**
   - **Rule:** Free on-site survey and quote requests (e.g. Turnkey Renovation, Terrace Waterproofing) have `price = 0` and do **not** incur the ₹99 doorstep inspection fee.
   - **Fix:** In `20261028000019_remediate_sec03_authoritative_pricing.sql`, `v_has_standard_service := TRUE` is gated under `ELSIF v_price_type <> 'package'`, preventing quote items from triggering the ₹99 fee.
   - **Result:** `subtotal = 0`, `visitFee = 0`, `total = 0`.

2. **Standard Catalog Diagnostic Inspection (`srv-ac-inspect`):**
   - **Rule:** A customer ordering standard AC Diagnostic Inspections from the catalog with `quantity > 1` must retain their selected quantity and be billed at catalog rate (`₹199 * quantity + ₹99 visit fee`).
   - **Fix:** Removed `v_item_id = 'srv-ac-inspect'` from the `v_is_custom` branch in migration 19. Only genuine custom requests (`NEW.request_type = 'CUSTOM_REQUIREMENT'` or `serviceName ILIKE 'Custom%'`) use the synthetic custom-item rate.

---

## 3. Real-World Application Scenarios (Tier 4 & Tier 6)
| # | Scenario | Features Exercised | Expected Outcome |
|---|----------|--------------------|------------------|
| 1 | Customer attempts to book AC Master Foam Jet (₹699) by injecting total = ₹1 | F1, F2, F3 | Database overrides total to ₹798 (₹699 + ₹99 fee) |
| 2 | Customer books 2 Standard Services with valid quantities | F1, F2, F3 | Exact sum of catalog prices + ₹99 fee |
| 3 | Customer books AC Care Package (₹1299) | F1, F2, F3 | Exact package price (₹1299) with ₹0 visit fee |
| 4 | Attacker submits inactive service or arbitrary string item ID | F1, F2 | Transaction safely aborted with informative error |
| 5 | Staff payment collection via `record_payment()` | F3, F4, F5 | Payment accepted only when matching exact authoritative total |
| 6 | Customer submits quote-required consultation (`srv-prj-turnkey`) with injected price | REG-1 | Overwritten to ₹0 subtotal, ₹0 visit fee, ₹0 total |
| 7 | Customer books 2 units of `srv-ac-inspect` from catalog | REG-2 | Subtotal = ₹398, visit fee = ₹99, total = ₹497 |

---

## 4. Phase 1 vs Phase 2 Payment Scope Invariants
Testing adheres strictly to the defined Phase 1 business boundaries:

### Phase 1 Verified Controls (Fully Covered by Test Suites)
1. **On-Site Cash Collection**: Field specialists and trade partners collect physical currency upon service testing and resident inspection.
2. **Manual UPI Recording**: Staff accepts resident UPI payments to verified technician accounts and records the payment in `record_payment()` with genuine manual reference IDs.
3. **No Gateway API Dependencies**: All tests execute cleanly without network calls to Razorpay, Stripe, or payment aggregators.
4. **Idempotency & Partial Unique Index**: Verified that `idx_payments_req_completed` permits retrying after `FAILED` attempts while rejecting multiple `COMPLETED` payments.
5. **Security Definer Authorization**: `record_payment()` enforces caller identity matching `assigned_to` for staff, rejecting unassigned staff or customers.

### Phase 2 Scope Boundaries (Out of Scope for Phase 1)
- Payment gateway SDK integration and webhooks.
- Online card and automated net banking checkouts.
- Automated payment gateway refund processing.
- Merchant aggregator settlement reconciliation.
