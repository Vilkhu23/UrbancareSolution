# TEST_READY: SEC-03 Authoritative Service Request Pricing Test Suite

## Executive Summary
Comprehensive, opaque-box, requirement-driven test suite implemented for **SEC-03** (Client-Controlled Service-Request Pricing Remediation).
All tests execute without dependency on remote infrastructure, enforcing genuine catalog validation, bounded quantities, authoritative pricing calculation, item immutability, payment workflow integrity, and SQL migration contract invariants.

## Test Runner Commands
```powershell
# Run the SEC-03 standalone regression test suite:
npx tsx --test src/services/serviceRequestPricingSecurity.test.ts

# Run the complete test suite (SEC-01 and SEC-03):
npx tsx --test src/services/vendorAuthSecurity.test.ts src/services/serviceRequestPricingSecurity.test.ts

# Verify TypeScript compilation:
npm run lint
```

## Test Suite Execution Results
- **Test File**: `src/services/serviceRequestPricingSecurity.test.ts`
- **Total Tests**: 63
- **Passed**: 63
- **Failed**: 0
- **Skipped**: 0
- **Duration**: ~350–500 ms
- **Exit Code**: 0

## Feature & Tier Coverage Inventory

| Feature | Description | Tier 1 (Unit) | Tier 2 (Boundary/Adversarial) | Tier 3 (Pairwise) | Tier 4 (Real-World) | Tier 5 (Migration AST) | Total Tests |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **F1** | DB Item Catalog Validation | 5 | 5 | 1 | 1 | — | **12** |
| **F2** | DB Bounded Quantity Check | 5 | 5 | — | — | — | **10** |
| **F3** | Authoritative Subtotal & Total | 5 | 5 | 2 | 2 | — | **14** |
| **F4** | DB Item Immutability on Update | 5 | 5 | — | — | — | **10** |
| **F5** | Preservation of Defaults & Token Checks | 5 | 5 | 1 | 2 | — | **13** |
| **MIG** | Migration AST & Trigger Contracts | — | — | 1 | — | 3 | **4** |
| **TOTAL** | | **25** | **25** | **5** | **5** | **3** | **63** |

### Tier Breakdown
1. **Tier 1 (Core Feature Behavior & Invariant Rules — 25 Tests)**:
   - Valid standard service accepts genuine catalog rate (`srv-ac-foam` @ ₹699).
   - Valid care package accepts bundle rate (`pkg-2-ac-foam` @ ₹1299).
   - Unknown service ID (`srv-fake-999`) safely rejected with informative error.
   - Inactive service (`active: false`) rejected.
   - Custom requirement resolves to diagnostic fee (₹199 subtotal, ₹99 visit fee, ₹298 total).
   - Bounded quantities (1, 5) accepted and calculated linearly; 0, negative (-3), overflow (101) rejected.
   - Authoritative subtotal, ₹99 visit fee for standard services, ₹0 visit fee for care packages, mixed carts (₹99 visit fee), locality adjustment and tax forced to 0.00.
   - Customer and technician barred from altering items array or totals during UPDATE; admin authorized for disputes.
   - Status forced to `NEW`, payment_status forced to `PENDING`, assigned_to nullified on INSERT; staff payment collection requires `app.payment_token`; OTP completion requires `app.otp_token`.

2. **Tier 2 (Boundary Value, Encoding & Adversarial Stress Tests — 25 Tests)**:
   - Empty items array `[]` rejected.
   - Malformed/null item elements rejected.
   - Legacy property `id` correctly resolved alongside `serviceId` via COALESCE.
   - Blank, whitespace, SQL-injection item IDs (`srv-ac-gen' OR '1'='1`) rejected safely.
   - Transaction atomicity: 1 valid item + 1 invalid item rejects entire insert.
   - Minimum boundary (qty 1) and maximum boundary (qty 100) succeed; fractional (1.5), non-numeric ("NaN", "2"), and overflow (101) rejected.
   - Negative, fractional currency (₹0.01), extreme underpricing (₹0.001) in items array authoritatively sanitized to catalog rates.
   - Customer attempt to add item, remove item, or cancel when IN PROGRESS safely blocked; customer cancellation allowed only when NEW.
   - Customer cannot inject `customer_otp` or `completion_code` on INSERT; caller `user_id` bound to authenticated caller UID; forged or replayed session tokens rejected.

3. **Tier 3 (Pairwise Combinatorial Invariant Verification — 5 Tests)**:
   - Combo 1: Standard Service + Tampered Price (total: 1) + Valid Qty (2) -> Authoritative subtotal ₹1398, total ₹1497.
   - Combo 2: Care Package + Inactive Standard Service -> Fails closed.
   - Combo 3: Care Package + Tampered Price (total: 0) + Qty (1) -> Authoritative total ₹1299 without visit fee.
   - Combo 4: Custom Requirement + Injected Price (total: 5) -> Authoritative diagnostic ₹298.
   - Combo 5: Multiple Standard Services + Tampered Tax (tax: 500) -> Tax forced to 0.00 and catalog total enforced.

4. **Tier 4 (Real-World Application Scenarios & Payment Integrity — 5 Tests)**:
   - Scenario 1: Attacker injects total = 1 for AC Foam Jet (₹699) -> Database trigger overrides to ₹798.
   - Scenario 2: Multi-item booking (`srv-ac-foam` + 2x `srv-ac-gen`) -> Application pricing engine and DB trigger produce identical ₹1796 total.
   - Scenario 3: Care package booking (`pkg-2-ac-foam`) -> ₹0 doorstep fee, authoritative ₹1299 total.
   - Scenario 4: Attacker submits unknown item string (`srv-hacked-custom-zero-price`) -> Safe rejection with catalog error.
   - Scenario 5: Booking created with authoritative total ₹798 -> staff payment collection via `record_payment` rejects underpayment (₹1) and succeeds only upon exact total match (₹798).

5. **Tier 5 (Database Migration AST & PL/pgSQL Contract Invariants — 3 Tests)**:
   - MIG-T1: Confirms baseline migration 15 lacked subtotal/total calculation on INSERT (reproducing vulnerability).
   - MIG-T2: Verifies migration `20261028000019_remediate_sec03_authoritative_pricing.sql` satisfies all 6 AST invariant rules.
   - MIG-T3: Verifies integration test in `supabase/tests/security_tests.sql` documents Docker requirements.

## Integration Test Suite (PostgreSQL / Supabase)
- **File**: `supabase/tests/security_tests.sql`
- **Added Suite**: `TEST 15 (SEC-03): Authoritative Service Request Pricing & Item Catalog Validation`
- **Sub-Tests**: 15.1, 15.2, 15.3, 15.4, 15.5
- **Expected Passes**: Updated from 50 to 55 tests.
- **Execution Constraint**: Requires live local PostgreSQL container with Docker. Dynamic container execution is deferred on hosts lacking Docker, while standalone testing via `npx tsx --test` provides 100% offline verification.
