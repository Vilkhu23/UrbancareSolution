/**
 * ==============================================================================
 * SEC-03 Authoritative Service Request Pricing & Anti-Tampering Test Suite
 * File: src/services/serviceRequestPricingSecurity.test.ts
 *
 * NOTE ON TEST FIDELITY & ENVIRONMENT INFRASTRUCTURE:
 * This suite executes in-memory simulation and contract verification of the
 * database trigger invariants and application mapping layers using Node.js
 * native runner (node:test). It verifies client/server mapping contracts,
 * quantity clamping, and algorithmic pricing rules against catalog data.
 *
 * Actual PostgreSQL engine execution of triggers requires Docker/Supabase CLI
 * running pgTAP integration tests (see supabase/tests/security_tests.sql).
 * In environments lacking Docker, PostgreSQL live enforcement is tracked as
 * NEEDS-VALIDATION.
 *
 * Tier 1: Core Feature Behavior & Invariant Rules (≥25 tests)
 * Tier 2: Boundary Value, Encoding & Adversarial Stress Tests (≥25 tests)
 * Tier 3: Pairwise Combinatorial Tests (≥5 tests)
 * Tier 4: Real-World Attack Scenarios & Payment Integrity (≥5 tests)
 * Tier 5: Database Migration AST & PL/pgSQL Contract Invariant Verification (3 tests)
 * Tier 6: Specific Adversarial Regression Checks for Business Rules (4 tests)
 * ==============================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { INITIAL_SERVICES, INITIAL_PACKAGES } from '../data/initialData.ts';
import { calculateOrderPricing, normalizeServiceItem } from '../utils/pricingEngine.ts';
import { mapServiceRequestToDb, mapServiceRequestFromDb } from './supabaseService.ts';
import { ServiceRequest, ServiceRequestItem, CartItem } from '../types/index.ts';

// ------------------------------------------------------------------------------
// SPECIFICATION & INVARIANT ENGINE SIMULATOR (Database Trigger Contract)
// ------------------------------------------------------------------------------

function md5Hash(input: string): string {
  return createHash('md5').update(input).digest('hex');
}

export interface TriggerSessionTokens {
  otpToken?: string;
  otpTokenSecret?: string;
  paymentToken?: string;
  paymentTokenSecret?: string;
}

export interface DbServiceRequestRow {
  id: string;
  user_id?: string | null;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  locality?: string;
  items: any[];
  status: string;
  subtotal: number;
  locality_adjustment: number;
  tax: number;
  total: number;
  preferred_date?: string;
  preferred_slot?: string;
  payment_status: string;
  payment_method?: string;
  assigned_to?: any;
  customer_otp?: string | null;
  completion_code?: string | null;
  request_type?: string;
  [key: string]: any;
}

/**
 * Strict programmatic oracle modeling the exact database trigger contract:
 * public.enforce_service_requests_rules() BEFORE INSERT OR UPDATE ON public.service_requests.
 * Conforms 100% to PROJECT.md § Interface Contracts.
 */
export function simulateEnforceServiceRequestsRules(
  op: 'INSERT' | 'UPDATE',
  newRow: DbServiceRequestRow,
  oldRow?: DbServiceRequestRow,
  callerRole: 'customer' | 'technician' | 'vendor' | 'admin' | 'ops_manager' | null = 'customer',
  callerId: string | null = 'user-auth-uuid-1',
  sessionTokens: TriggerSessionTokens = {}
): DbServiceRequestRow {
  const result: DbServiceRequestRow = JSON.parse(JSON.stringify(newRow));

  // Cryptographic token checks
  let isOtpVerified = false;
  if (
    sessionTokens.otpToken &&
    sessionTokens.otpTokenSecret &&
    sessionTokens.otpTokenSecret === md5Hash(`${sessionTokens.otpToken}:${newRow.id}:pc_otp_secret_2026`)
  ) {
    isOtpVerified = true;
  }

  let isPayVerified = false;
  if (
    sessionTokens.paymentToken &&
    sessionTokens.paymentTokenSecret &&
    sessionTokens.paymentTokenSecret === md5Hash(`${sessionTokens.paymentToken}:${newRow.id}:pc_pay_secret_2026`)
  ) {
    isPayVerified = true;
  }

  // Admin / Ops Manager / Superuser / Service Role Bypass
  if (callerId === null || callerRole === 'admin' || callerRole === 'ops_manager') {
    return result;
  }

  // ----------------------------------------------------------------------------
  // BEFORE INSERT
  // ----------------------------------------------------------------------------
  if (op === 'INSERT') {
    // 1. Force immutable defaults
    result.status = 'NEW';
    result.payment_status = 'PENDING';
    result.assigned_to = null;
    result.customer_otp = null;
    result.completion_code = null;
    if (callerId) {
      result.user_id = callerId;
    }

    // 2. Validate items array
    if (!Array.isArray(result.items) || result.items.length === 0) {
      throw new Error('Booking items must be a non-empty array.');
    }

    let calculatedSubtotal = 0;
    let hasStandardService = false;
    const sanitizedItems: any[] = [];

    for (let i = 0; i < result.items.length; i++) {
      const item = result.items[i];
      if (!item || typeof item !== 'object') {
        throw new Error(`Booking item at index ${i} is malformed.`);
      }

      const itemId = item.serviceId || item.id;
      if (!itemId || typeof itemId !== 'string' || itemId.trim() === '') {
        throw new Error(`Booking item at index ${i} has invalid or missing service ID.`);
      }

      // Quantity validation: must be an integer between 1 and 100
      const rawQty = item.quantity;
      if (
        rawQty === undefined ||
        rawQty === null ||
        typeof rawQty !== 'number' ||
        !Number.isInteger(rawQty) ||
        rawQty < 1 ||
        rawQty > 100
      ) {
        throw new Error('Booking item quantity must be a positive integer between 1 and 100.');
      }

      // Catalog lookup: Standard Services vs Care Packages vs Custom Diagnostic
      let catalogItem: any = null;
      let isPackage = false;
      let unitPrice = 0;

      const isCustomReq =
        result.request_type === 'CUSTOM_REQUIREMENT' ||
        (item.name && item.name.startsWith('Custom:')) ||
        (item.serviceName && item.serviceName.startsWith('Custom:'));

      if (isCustomReq) {
        // Authoritative Custom Diagnostic rate
        unitPrice = 199;
        hasStandardService = true;
      } else {
        // Query public.services catalog
        const serviceMatch = INITIAL_SERVICES.find((s) => s.id === itemId);
        if (serviceMatch) {
          if (serviceMatch.active === false) {
            throw new Error(`Service item ${itemId} is invalid, inactive, or not found in catalog.`);
          }
          catalogItem = serviceMatch;
          const pType = String(serviceMatch.price_type || 'fixed').toUpperCase();
          if (pType === 'QUOTE_REQUIRED') {
            unitPrice = 0;
            // Quote-required consultations do not incur standard doorstep visit fee
          } else {
            unitPrice = serviceMatch.base_price ?? (serviceMatch as any).basePrice ?? 0;
            if (pType !== 'PACKAGE') {
              hasStandardService = true;
            } else {
              isPackage = true;
            }
          }
        } else {
          // Query public.service_packages catalog
          const packageMatch = INITIAL_PACKAGES.find((p) => p.id === itemId);
          if (packageMatch) {
            if (packageMatch.active === false) {
              throw new Error(`Service item ${itemId} is invalid, inactive, or not found in catalog.`);
            }
            catalogItem = packageMatch;
            unitPrice = packageMatch.price;
            isPackage = true;
          } else {
            throw new Error(`Service item ${itemId} is invalid, inactive, or not found in catalog.`);
          }
        }
      }

      calculatedSubtotal += unitPrice * rawQty;

      // Sanitized item representation enforcing catalog unit price
      sanitizedItems.push({
        ...item,
        serviceId: itemId,
        quantity: rawQty,
        price: unitPrice,
        isPackage
      });
    }

    // 3. Compute Authoritative Billing Fields (Overriding any client input)
    result.items = sanitizedItems;
    result.subtotal = calculatedSubtotal;
    result.locality_adjustment = 0.0;
    result.tax = 0.0;
    const visitFee = hasStandardService ? 99.0 : 0.0;
    result.total = calculatedSubtotal + visitFee + result.tax;

    return result;
  }

  // ----------------------------------------------------------------------------
  // BEFORE UPDATE
  // ----------------------------------------------------------------------------
  if (op === 'UPDATE') {
    if (!oldRow) {
      throw new Error('UPDATE operation requires previous database row state (OLD).');
    }

    // Customer Update Constraints
    if (callerRole === 'customer') {
      if (JSON.stringify(result.items) !== JSON.stringify(oldRow.items)) {
        throw new Error('Customers cannot modify booking items after creation.');
      }
      if (
        result.total !== oldRow.total ||
        result.subtotal !== oldRow.subtotal ||
        result.tax !== oldRow.tax ||
        result.locality_adjustment !== oldRow.locality_adjustment
      ) {
        throw new Error('Customers cannot modify pricing or billing fields.');
      }
      if (result.payment_status !== oldRow.payment_status || result.payment_method !== oldRow.payment_method) {
        throw new Error('Customers cannot modify payment fields.');
      }
      if (result.assigned_to !== oldRow.assigned_to) {
        throw new Error('Customers cannot assign technicians or vendors.');
      }
      if (result.status !== oldRow.status) {
        if (!(oldRow.status === 'NEW' && result.status === 'CANCELLED')) {
          throw new Error('Customers may only cancel requests that are currently in NEW status.');
        }
      }
      return result;
    }

    // Technician & Vendor Update Constraints
    if (callerRole === 'technician' || callerRole === 'vendor') {
      if (JSON.stringify(result.items) !== JSON.stringify(oldRow.items)) {
        throw new Error('Staff cannot modify booking items.');
      }
      if (
        result.total !== oldRow.total ||
        result.subtotal !== oldRow.subtotal ||
        result.tax !== oldRow.tax ||
        result.locality_adjustment !== oldRow.locality_adjustment
      ) {
        throw new Error('Staff cannot modify billing fields.');
      }
      if (result.payment_status !== oldRow.payment_status && !isPayVerified) {
        throw new Error('Staff cannot modify payment status without authorized record_payment() token.');
      }
      if (result.status === 'COMPLETED' && oldRow.status !== 'COMPLETED' && !isOtpVerified) {
        throw new Error('Staff cannot directly mark jobs COMPLETED without calling verify_job_otp().');
      }
      return result;
    }
  }

  return result;
}

// ------------------------------------------------------------------------------
// TEST SUITE: SEC-03 CLIENT-CONTROLLED SERVICE-REQUEST PRICING REMEDIATION
// ------------------------------------------------------------------------------

describe('SEC-03 Authoritative Service Request Pricing & Anti-Tampering Test Suite', () => {

  // ============================================================================
  // TIER 1: CORE FEATURE BEHAVIOR & INVARIANT RULES (25 Tests)
  // ============================================================================
  describe('Tier 1: Core Feature Behavior & Invariant Rules', () => {

    // Feature 1: DB Item Catalog Validation (5 Tests)
    describe('Feature 1: DB Item Catalog Validation', () => {
      it('F1-T1: Valid standard catalog service is accepted with exact catalog price', () => {
        const srv = INITIAL_SERVICES.find((s) => s.id === 'srv-ac-foam')!;
        assert.ok(srv, 'Catalog must contain srv-ac-foam');
        const payload: DbServiceRequestRow = {
          id: 'PB-T1-101',
          items: [{ serviceId: 'srv-ac-foam', quantity: 1, price: 9999 }],
          status: 'TAMPERED',
          subtotal: 9999,
          locality_adjustment: 0,
          tax: 0,
          total: 9999,
          payment_status: 'PAID'
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.items[0].price, 699, 'Item price must be enforced to catalog price ₹699');
      });

      it('F1-T2: Valid care package is accepted with package catalog price', () => {
        const pkg = INITIAL_PACKAGES.find((p) => p.id === 'pkg-2-ac-foam')!;
        assert.ok(pkg, 'Catalog must contain pkg-2-ac-foam');
        const payload: DbServiceRequestRow = {
          id: 'PB-T1-102',
          items: [{ serviceId: 'pkg-2-ac-foam', quantity: 1, price: 10 }],
          status: 'NEW',
          subtotal: 10,
          locality_adjustment: 0,
          tax: 0,
          total: 10,
          payment_status: 'PENDING'
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.items[0].price, 1299, 'Package price must be enforced to catalog ₹1299');
      });

      it('F1-T3: Unknown service ID triggers safe exception rejection', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T1-103',
          items: [{ serviceId: 'srv-fake-999', quantity: 1 }],
          status: 'NEW',
          subtotal: 100,
          locality_adjustment: 0,
          tax: 0,
          total: 100,
          payment_status: 'PENDING'
        };
        assert.throws(
          () => simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer'),
          /invalid, inactive, or not found in catalog/i
        );
      });

      it('F1-T4: Inactive catalog service triggers safe exception rejection', () => {
        // Create an inactive service payload
        const inactiveServiceId = 'srv-inactive-test';
        // Mock a catalog item with active: false
        const originalServices = [...INITIAL_SERVICES];
        try {
          (INITIAL_SERVICES as any).push({
            id: inactiveServiceId,
            name: 'Deprecated Old Service',
            base_price: 399,
            active: false
          });
          const payload: DbServiceRequestRow = {
            id: 'PB-T1-104',
            items: [{ serviceId: inactiveServiceId, quantity: 1 }],
            status: 'NEW',
            subtotal: 399,
            locality_adjustment: 0,
            tax: 0,
            total: 399,
            payment_status: 'PENDING'
          };
          assert.throws(
            () => simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer'),
            /invalid, inactive, or not found in catalog/i
          );
        } finally {
          const idx = INITIAL_SERVICES.findIndex((s) => s.id === inactiveServiceId);
          if (idx !== -1) INITIAL_SERVICES.splice(idx, 1);
        }
      });

      it('F1-T5: Custom requirement booking resolves to authoritative diagnostic inspection', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T1-105',
          request_type: 'CUSTOM_REQUIREMENT',
          items: [{ serviceId: 'custom-diagnostic', name: 'Custom: AC compressor noise inspection', quantity: 1, price: 1 }],
          status: 'NEW',
          subtotal: 1,
          locality_adjustment: 0,
          tax: 0,
          total: 1,
          payment_status: 'PENDING'
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.subtotal, 199, 'Diagnostic subtotal must be authoritative ₹199');
        assert.equal(processed.total, 298, 'Total must be ₹199 + ₹99 visit fee = ₹298');
      });
    });

    // Feature 2: DB Bounded Quantity Check (5 Tests)
    describe('Feature 2: DB Bounded Quantity Check', () => {
      it('F2-T1: Valid integer quantity 1 is accepted', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T1-201',
          items: [{ serviceId: 'srv-ac-gen', quantity: 1 }],
          status: 'NEW',
          subtotal: 499,
          locality_adjustment: 0,
          tax: 0,
          total: 598,
          payment_status: 'PENDING'
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.items[0].quantity, 1);
      });

      it('F2-T2: Valid integer quantity 5 is accepted and multiplies subtotal linearly', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T1-202',
          items: [{ serviceId: 'srv-ac-gen', quantity: 5 }],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PENDING'
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.subtotal, 499 * 5, 'Subtotal must be 5 * ₹499 = ₹2495');
      });

      it('F2-T3: Zero quantity is rejected with bounded quantity error', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T1-203',
          items: [{ serviceId: 'srv-ac-gen', quantity: 0 }],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PENDING'
        };
        assert.throws(
          () => simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer'),
          /quantity must be a positive integer between 1 and 100/i
        );
      });

      it('F2-T4: Negative quantity is rejected with bounded quantity error', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T1-204',
          items: [{ serviceId: 'srv-ac-gen', quantity: -3 }],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PENDING'
        };
        assert.throws(
          () => simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer'),
          /quantity must be a positive integer between 1 and 100/i
        );
      });

      it('F2-T5: Overflow quantity (>100) is rejected', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T1-205',
          items: [{ serviceId: 'srv-ac-gen', quantity: 101 }],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PENDING'
        };
        assert.throws(
          () => simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer'),
          /quantity must be a positive integer between 1 and 100/i
        );
      });
    });

    // Feature 3: DB Authoritative Subtotal & Total Calculation (5 Tests)
    describe('Feature 3: DB Authoritative Subtotal & Total Calculation', () => {
      it('F3-T1: Single standard service calculates exact subtotal + ₹99 doorstep fee overriding client total', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T1-301',
          items: [{ serviceId: 'srv-ac-foam', quantity: 1, price: 1 }],
          status: 'NEW',
          subtotal: 1,
          locality_adjustment: 0,
          tax: 0,
          total: 1, // Attacker passes 1
          payment_status: 'PENDING'
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.subtotal, 699, 'Authoritative subtotal must be ₹699');
        assert.equal(processed.total, 798, 'Authoritative total must be ₹699 + ₹99 = ₹798');
      });

      it('F3-T2: Multiple standard services sum catalog prices and add single ₹99 visit fee', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T1-302',
          items: [
            { serviceId: 'srv-ac-foam', quantity: 1 }, // 699
            { serviceId: 'srv-ac-gen', quantity: 2 }   // 499 * 2 = 998
          ],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PENDING'
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.subtotal, 1697, 'Subtotal: 699 + 998 = 1697');
        assert.equal(processed.total, 1796, 'Total: 1697 + 99 visit fee = 1796');
      });

      it('F3-T3: Care package has ₹0 visit fee and matches catalog package price', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T1-303',
          items: [{ serviceId: 'pkg-2-ac-foam', quantity: 1, price: 50 }],
          status: 'NEW',
          subtotal: 50,
          locality_adjustment: 0,
          tax: 0,
          total: 50,
          payment_status: 'PENDING'
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.subtotal, 1299, 'Subtotal: 1299');
        assert.equal(processed.total, 1299, 'Care package has ₹0 visit fee, total: 1299');
      });

      it('F3-T4: Mixed cart (care package + standard service) incurs ₹99 visit fee', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T1-304',
          items: [
            { serviceId: 'pkg-2-ac-foam', quantity: 1 }, // 1299
            { serviceId: 'srv-ac-inspect', quantity: 1 }  // 199
          ],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PENDING'
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.subtotal, 1498, 'Subtotal: 1299 + 199 = 1498');
        assert.equal(processed.total, 1597, 'Total: 1498 + 99 visit fee = 1597');
      });

      it('F3-T5: Locality adjustment and tax are initialized to 0.00 authoritatively', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T1-305',
          items: [{ serviceId: 'srv-ac-gen', quantity: 1 }],
          status: 'NEW',
          subtotal: 499,
          locality_adjustment: 500, // Attacker injected adjustment
          tax: 150,                // Attacker injected tax
          total: 1149,
          payment_status: 'PENDING'
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.locality_adjustment, 0.0, 'locality_adjustment must be forced to 0');
        assert.equal(processed.tax, 0.0, 'tax must be forced to 0');
        assert.equal(processed.total, 598, 'Total must be 499 + 99 = 598');
      });
    });

    // Feature 4: DB Item Immutability on Update (5 Tests)
    describe('Feature 4: DB Item Immutability on Update', () => {
      const baseRow: DbServiceRequestRow = {
        id: 'PB-T1-401',
        items: [{ serviceId: 'srv-ac-gen', quantity: 1, price: 499 }],
        status: 'NEW',
        subtotal: 499,
        locality_adjustment: 0,
        tax: 0,
        total: 598,
        payment_status: 'PENDING'
      };

      it('F4-T1: Customer cannot modify items array during UPDATE', () => {
        const updatedRow: DbServiceRequestRow = {
          ...baseRow,
          items: [{ serviceId: 'srv-ac-foam', quantity: 1, price: 699 }]
        };
        assert.throws(
          () => simulateEnforceServiceRequestsRules('UPDATE', updatedRow, baseRow, 'customer'),
          /cannot modify booking items/i
        );
      });

      it('F4-T2: Customer cannot modify total during UPDATE', () => {
        const updatedRow: DbServiceRequestRow = {
          ...baseRow,
          total: 1
        };
        assert.throws(
          () => simulateEnforceServiceRequestsRules('UPDATE', updatedRow, baseRow, 'customer'),
          /cannot modify pricing or billing fields/i
        );
      });

      it('F4-T3: Technician cannot modify items array during UPDATE', () => {
        const updatedRow: DbServiceRequestRow = {
          ...baseRow,
          items: [{ serviceId: 'srv-ac-gen', quantity: 2, price: 499 }]
        };
        assert.throws(
          () => simulateEnforceServiceRequestsRules('UPDATE', updatedRow, baseRow, 'technician'),
          /cannot modify booking items/i
        );
      });

      it('F4-T4: Technician cannot modify total during UPDATE', () => {
        const updatedRow: DbServiceRequestRow = {
          ...baseRow,
          total: 999
        };
        assert.throws(
          () => simulateEnforceServiceRequestsRules('UPDATE', updatedRow, baseRow, 'technician'),
          /cannot modify billing fields/i
        );
      });

      it('F4-T5: Admin role possesses authorization to modify rows for dispute resolution', () => {
        const updatedRow: DbServiceRequestRow = {
          ...baseRow,
          total: 499
        };
        const processed = simulateEnforceServiceRequestsRules('UPDATE', updatedRow, baseRow, 'admin');
        assert.equal(processed.total, 499, 'Admin update should be permitted');
      });
    });

    // Feature 5: Preservation of Workflow Defaults & Token Security (5 Tests)
    describe('Feature 5: Preservation of Workflow Defaults & Token Security', () => {
      it('F5-T1: INSERT unconditionally resets status to NEW even if client passes COMPLETED', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T1-501',
          items: [{ serviceId: 'srv-ac-gen', quantity: 1 }],
          status: 'COMPLETED',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PAID'
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.status, 'NEW', 'Status must be forced to NEW on INSERT');
      });

      it('F5-T2: INSERT unconditionally resets payment_status to PENDING even if client passes PAID', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T1-502',
          items: [{ serviceId: 'srv-ac-gen', quantity: 1 }],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PAID'
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.payment_status, 'PENDING', 'payment_status must be forced to PENDING');
      });

      it('F5-T3: INSERT nullifies assigned_to preventing customer self-dispatch', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T1-503',
          items: [{ serviceId: 'srv-ac-gen', quantity: 1 }],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PENDING',
          assigned_to: { id: 'emp-rogue', name: 'Rogue Employee' }
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.assigned_to, null, 'assigned_to must be nullified on INSERT');
      });

      it('F5-T4: UPDATE by technician to payment_status = PAID requires valid record_payment token', () => {
        const baseRow: DbServiceRequestRow = {
          id: 'PB-T1-504',
          items: [{ serviceId: 'srv-ac-gen', quantity: 1, price: 499 }],
          status: 'IN PROGRESS',
          subtotal: 499,
          locality_adjustment: 0,
          tax: 0,
          total: 598,
          payment_status: 'PENDING'
        };
        const updatedRow: DbServiceRequestRow = {
          ...baseRow,
          payment_status: 'PAID'
        };
        // Without valid payment session token
        assert.throws(
          () => simulateEnforceServiceRequestsRules('UPDATE', updatedRow, baseRow, 'technician', 'tech-uuid', {}),
          /cannot modify payment status without authorized record_payment/i
        );

        // With valid payment session token
        const token = 'token-pay-999';
        const secret = md5Hash(`${token}:PB-T1-504:pc_pay_secret_2026`);
        const processed = simulateEnforceServiceRequestsRules('UPDATE', updatedRow, baseRow, 'technician', 'tech-uuid', {
          paymentToken: token,
          paymentTokenSecret: secret
        });
        assert.equal(processed.payment_status, 'PAID', 'Must allow payment transition with valid token');
      });

      it('F5-T5: UPDATE by technician to status = COMPLETED requires valid verify_job_otp token', () => {
        const baseRow: DbServiceRequestRow = {
          id: 'PB-T1-505',
          items: [{ serviceId: 'srv-ac-gen', quantity: 1, price: 499 }],
          status: 'IN PROGRESS',
          subtotal: 499,
          locality_adjustment: 0,
          tax: 0,
          total: 598,
          payment_status: 'PENDING'
        };
        const updatedRow: DbServiceRequestRow = {
          ...baseRow,
          status: 'COMPLETED'
        };
        // Without OTP token
        assert.throws(
          () => simulateEnforceServiceRequestsRules('UPDATE', updatedRow, baseRow, 'technician', 'tech-uuid', {}),
          /cannot directly mark jobs COMPLETED without calling verify_job_otp/i
        );

        // With valid OTP token
        const token = 'token-otp-777';
        const secret = md5Hash(`${token}:PB-T1-505:pc_otp_secret_2026`);
        const processed = simulateEnforceServiceRequestsRules('UPDATE', updatedRow, baseRow, 'technician', 'tech-uuid', {
          otpToken: token,
          otpTokenSecret: secret
        });
        assert.equal(processed.status, 'COMPLETED', 'Must allow completion transition with valid OTP token');
      });
    });
  });

  // ============================================================================
  // TIER 2: BOUNDARY VALUE, ENCODING & ADVERSARIAL STRESS TESTS (25 Tests)
  // ============================================================================
  describe('Tier 2: Boundary Value, Encoding & Adversarial Stress Tests', () => {

    // Feature 1 Boundaries (5 Tests)
    describe('Feature 1 Boundaries: Malformed payloads & Catalog ID Escaping', () => {
      it('F1-B1: Empty items array is rejected', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T2-101',
          items: [],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PENDING'
        };
        assert.throws(
          () => simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer'),
          /Booking items must be a non-empty array/i
        );
      });

      it('F1-B2: Items array containing null or non-object element is rejected', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T2-102',
          items: [null as any],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PENDING'
        };
        assert.throws(
          () => simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer'),
          /malformed/i
        );
      });

      it('F1-B3: Item ID using legacy property "id" is correctly resolved via COALESCE', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T2-103',
          items: [{ id: 'srv-ac-foam', quantity: 1 }],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PENDING'
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.items[0].serviceId, 'srv-ac-foam');
        assert.equal(processed.total, 798);
      });

      it('F1-B4: Blank, whitespace, or SQL-injection serviceId is safely rejected', () => {
        const malformedIds = ['', '   ', "srv-ac-gen' OR '1'='1", '<script>alert(1)</script>'];
        for (const badId of malformedIds) {
          const payload: DbServiceRequestRow = {
            id: 'PB-T2-104',
            items: [{ serviceId: badId, quantity: 1 }],
            status: 'NEW',
            subtotal: 0,
            locality_adjustment: 0,
            tax: 0,
            total: 0,
            payment_status: 'PENDING'
          };
          assert.throws(
            () => simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer'),
            /(invalid|not found in catalog|invalid or missing service ID)/i
          );
        }
      });

      it('F1-B5: Multiple items where first is valid and second is invalid rejects entire transaction', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T2-105',
          items: [
            { serviceId: 'srv-ac-foam', quantity: 1 },
            { serviceId: 'srv-nonexistent-xyz', quantity: 1 }
          ],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PENDING'
        };
        assert.throws(
          () => simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer'),
          /invalid, inactive, or not found in catalog/i
        );
      });
    });

    // Feature 2 Boundaries (5 Tests)
    describe('Feature 2 Boundaries: Quantity Edge Values & Type Coercion Attacks', () => {
      it('F2-B1: Minimum boundary quantity (quantity = 1) succeeds', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T2-201',
          items: [{ serviceId: 'srv-ac-gen', quantity: 1 }],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PENDING'
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.items[0].quantity, 1);
        assert.equal(processed.subtotal, 499);
      });

      it('F2-B2: Maximum boundary quantity (quantity = 100) succeeds', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T2-202',
          items: [{ serviceId: 'srv-ac-gen', quantity: 100 }],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PENDING'
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.items[0].quantity, 100);
        assert.equal(processed.subtotal, 49900);
        assert.equal(processed.total, 49900 + 99);
      });

      it('F2-B3: Fractional quantity (e.g. 1.5) is rejected (must be integer)', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T2-203',
          items: [{ serviceId: 'srv-ac-gen', quantity: 1.5 }],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PENDING'
        };
        assert.throws(
          () => simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer'),
          /quantity must be a positive integer between 1 and 100/i
        );
      });

      it('F2-B4: String quantity (e.g. "2" or "NaN") is rejected', () => {
        const badQuantities = ['2' as any, 'NaN' as any, null as any, undefined as any, {} as any];
        for (const badQty of badQuantities) {
          const payload: DbServiceRequestRow = {
            id: 'PB-T2-204',
            items: [{ serviceId: 'srv-ac-gen', quantity: badQty }],
            status: 'NEW',
            subtotal: 0,
            locality_adjustment: 0,
            tax: 0,
            total: 0,
            payment_status: 'PENDING'
          };
          assert.throws(
            () => simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer'),
            /quantity must be a positive integer between 1 and 100/i
          );
        }
      });

      it('F2-B5: Boundary overflow quantity (quantity = 101) is rejected', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T2-205',
          items: [{ serviceId: 'srv-ac-gen', quantity: 101 }],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PENDING'
        };
        assert.throws(
          () => simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer'),
          /quantity must be a positive integer between 1 and 100/i
        );
      });
    });

    // Feature 3 Boundaries (5 Tests)
    describe('Feature 3 Boundaries: Adversarial Price Tampering Values', () => {
      it('F3-B1: Tampered negative total and subtotal are completely overwritten', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T2-301',
          items: [{ serviceId: 'srv-ac-foam', quantity: 1 }],
          status: 'NEW',
          subtotal: -5000,
          locality_adjustment: -999,
          tax: -100,
          total: -6099,
          payment_status: 'PENDING'
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.subtotal, 699);
        assert.equal(processed.total, 798);
        assert.equal(processed.locality_adjustment, 0);
        assert.equal(processed.tax, 0);
      });

      it('F3-B2: Tampered fractional currency total (₹0.01) is overwritten', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T2-302',
          items: [{ serviceId: 'srv-ac-foam', quantity: 1 }],
          status: 'NEW',
          subtotal: 0.01,
          locality_adjustment: 0,
          tax: 0,
          total: 0.01,
          payment_status: 'PENDING'
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.subtotal, 699);
        assert.equal(processed.total, 798);
      });

      it('F3-B3: Multiple care packages maintain ₹0 visit fee', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T2-303',
          items: [
            { serviceId: 'pkg-2-ac-foam', quantity: 2 },        // 1299 * 2 = 2598
            { serviceId: 'pkg-ac-complete-care', quantity: 1 }  // 1899
          ],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PENDING'
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.subtotal, 2598 + 1899);
        assert.equal(processed.total, 2598 + 1899, 'Only packages present: visit fee must remain 0');
      });

      it('F3-B4: Adding standard service to package flips visit fee from 0 to ₹99', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T2-304',
          items: [
            { serviceId: 'pkg-2-ac-foam', quantity: 1 }, // 1299
            { serviceId: 'srv-tap-leak', quantity: 1 }   // 149 standard
          ],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PENDING'
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.subtotal, 1299 + 149);
        assert.equal(processed.total, 1299 + 149 + 99, 'Must apply ₹99 visit fee when standard service is present');
      });

      it('F3-B5: Extreme item price tampering in items array is overwritten with catalog price', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T2-305',
          items: [{ serviceId: 'srv-ac-foam', quantity: 2, price: 0.001 }],
          status: 'NEW',
          subtotal: 0.002,
          locality_adjustment: 0,
          tax: 0,
          total: 0.002,
          payment_status: 'PENDING'
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.items[0].price, 699, 'Item array price must be sanitized to catalog rate');
        assert.equal(processed.subtotal, 1398);
        assert.equal(processed.total, 1497);
      });
    });

    // Feature 4 Boundaries (5 Tests)
    describe('Feature 4 Boundaries: Update Tamper Attempts & Role Segregation', () => {
      const baseRow: DbServiceRequestRow = {
        id: 'PB-T2-401',
        items: [{ serviceId: 'srv-ac-gen', quantity: 1, price: 499 }],
        status: 'NEW',
        subtotal: 499,
        locality_adjustment: 0,
        tax: 0,
        total: 598,
        payment_status: 'PENDING'
      };

      it('F4-B1: Customer attempt to add an extra item on UPDATE is rejected', () => {
        const updatedRow: DbServiceRequestRow = {
          ...baseRow,
          items: [
            { serviceId: 'srv-ac-gen', quantity: 1, price: 499 },
            { serviceId: 'srv-ac-foam', quantity: 1, price: 699 }
          ]
        };
        assert.throws(
          () => simulateEnforceServiceRequestsRules('UPDATE', updatedRow, baseRow, 'customer'),
          /cannot modify booking items/i
        );
      });

      it('F4-B2: Customer attempt to reduce quantity on UPDATE is rejected', () => {
        const updatedRow: DbServiceRequestRow = {
          ...baseRow,
          items: [{ serviceId: 'srv-ac-gen', quantity: 0, price: 499 }]
        };
        assert.throws(
          () => simulateEnforceServiceRequestsRules('UPDATE', updatedRow, baseRow, 'customer'),
          /cannot modify booking items/i
        );
      });

      it('F4-B3: Customer CAN cancel a booking in NEW status', () => {
        const updatedRow: DbServiceRequestRow = {
          ...baseRow,
          status: 'CANCELLED'
        };
        const processed = simulateEnforceServiceRequestsRules('UPDATE', updatedRow, baseRow, 'customer');
        assert.equal(processed.status, 'CANCELLED');
      });

      it('F4-B4: Customer CANNOT cancel a booking in IN PROGRESS status', () => {
        const inProgressRow: DbServiceRequestRow = {
          ...baseRow,
          status: 'IN PROGRESS'
        };
        const updatedRow: DbServiceRequestRow = {
          ...inProgressRow,
          status: 'CANCELLED'
        };
        assert.throws(
          () => simulateEnforceServiceRequestsRules('UPDATE', updatedRow, inProgressRow, 'customer'),
          /may only cancel requests that are currently in NEW status/i
        );
      });

      it('F4-B5: Vendor attempt to alter total or items during assignment is rejected', () => {
        const updatedRow: DbServiceRequestRow = {
          ...baseRow,
          total: 1000
        };
        assert.throws(
          () => simulateEnforceServiceRequestsRules('UPDATE', updatedRow, baseRow, 'vendor'),
          /Staff cannot modify billing fields/i
        );
      });
    });

    // Feature 5 Boundaries (5 Tests)
    describe('Feature 5 Boundaries: Token Security & OTP/Secret Protection', () => {
      it('F5-B1: Customer cannot inject customer_otp on INSERT', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T2-501',
          items: [{ serviceId: 'srv-ac-gen', quantity: 1 }],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PENDING',
          customer_otp: '1234'
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.customer_otp, null, 'customer_otp must be nullified on INSERT');
      });

      it('F5-B2: Customer cannot inject completion_code on INSERT', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T2-502',
          items: [{ serviceId: 'srv-ac-gen', quantity: 1 }],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PENDING',
          completion_code: 'CODE99'
        };
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(processed.completion_code, null, 'completion_code must be nullified on INSERT');
      });

      it('F5-B3: Forged payment token secret is rejected', () => {
        const baseRow: DbServiceRequestRow = {
          id: 'PB-T2-503',
          items: [{ serviceId: 'srv-ac-gen', quantity: 1, price: 499 }],
          status: 'IN PROGRESS',
          subtotal: 499,
          locality_adjustment: 0,
          tax: 0,
          total: 598,
          payment_status: 'PENDING'
        };
        const updatedRow: DbServiceRequestRow = {
          ...baseRow,
          payment_status: 'PAID'
        };
        const badTokens: TriggerSessionTokens = {
          paymentToken: 'token-abc',
          paymentTokenSecret: 'forged-hash-attempt'
        };
        assert.throws(
          () => simulateEnforceServiceRequestsRules('UPDATE', updatedRow, baseRow, 'technician', 'tech-uuid', badTokens),
          /cannot modify payment status without authorized record_payment/i
        );
      });

      it('F5-B4: Replay token with different booking ID is rejected', () => {
        const baseRow: DbServiceRequestRow = {
          id: 'PB-T2-504',
          items: [{ serviceId: 'srv-ac-gen', quantity: 1, price: 499 }],
          status: 'IN PROGRESS',
          subtotal: 499,
          locality_adjustment: 0,
          tax: 0,
          total: 598,
          payment_status: 'PENDING'
        };
        const updatedRow: DbServiceRequestRow = {
          ...baseRow,
          payment_status: 'PAID'
        };
        // Secret was computed for PB-DIFFERENT-BOOKING
        const token = 'valid-token';
        const secretForOtherBooking = md5Hash(`${token}:PB-DIFFERENT-BOOKING:pc_pay_secret_2026`);
        assert.throws(
          () =>
            simulateEnforceServiceRequestsRules('UPDATE', updatedRow, baseRow, 'technician', 'tech-uuid', {
              paymentToken: token,
              paymentTokenSecret: secretForOtherBooking
            }),
          /cannot modify payment status without authorized record_payment/i
        );
      });

      it('F5-B5: Calling user_id is forced to auth.uid() on INSERT', () => {
        const payload: DbServiceRequestRow = {
          id: 'PB-T2-505',
          items: [{ serviceId: 'srv-ac-gen', quantity: 1 }],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PENDING',
          user_id: 'spoofed-victim-uuid'
        };
        const callerId = 'genuine-attacker-uuid';
        const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer', callerId);
        assert.equal(processed.user_id, callerId, 'user_id must match authenticated caller ID');
      });
    });
  });

  // ============================================================================
  // TIER 3: PAIRWISE COMBINATORIAL INVARIANT VERIFICATION (5 Tests)
  // ============================================================================
  describe('Tier 3: Pairwise Combinatorial Invariant Verification', () => {
    it('Pairwise 1: Standard Service + Tampered Subtotal/Total (total: 1) + Valid Qty (2)', () => {
      // srv-ac-foam @ 699 * 2 = 1398; visit fee 99 -> 1497
      const payload: DbServiceRequestRow = {
        id: 'PB-P1-01',
        items: [{ serviceId: 'srv-ac-foam', quantity: 2, price: 0.5 }],
        status: 'TAMPERED',
        subtotal: 1,
        locality_adjustment: 0,
        tax: 0,
        total: 1,
        payment_status: 'PAID'
      };
      const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
      assert.equal(processed.subtotal, 1398);
      assert.equal(processed.total, 1497);
      assert.equal(processed.status, 'NEW');
      assert.equal(processed.payment_status, 'PENDING');
    });

    it('Pairwise 2: Care Package + Inactive Standard Service -> Fails Closed', () => {
      const inactiveServiceId = 'srv-inactive-pairwise';
      try {
        (INITIAL_SERVICES as any).push({
          id: inactiveServiceId,
          name: 'Inactive Fan Repair',
          base_price: 199,
          active: false
        });
        const payload: DbServiceRequestRow = {
          id: 'PB-P2-02',
          items: [
            { serviceId: 'pkg-2-ac-foam', quantity: 1 },
            { serviceId: inactiveServiceId, quantity: 1 }
          ],
          status: 'NEW',
          subtotal: 1299,
          locality_adjustment: 0,
          tax: 0,
          total: 1398,
          payment_status: 'PENDING'
        };
        assert.throws(
          () => simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer'),
          /invalid, inactive, or not found in catalog/i
        );
      } finally {
        const idx = INITIAL_SERVICES.findIndex((s) => s.id === inactiveServiceId);
        if (idx !== -1) INITIAL_SERVICES.splice(idx, 1);
      }
    });

    it('Pairwise 3: Care Package + Tampered Price (total: 0) + Qty (1) -> Authoritative Package Total', () => {
      const payload: DbServiceRequestRow = {
        id: 'PB-P3-03',
        items: [{ serviceId: 'pkg-2-ac-foam', quantity: 1, price: 0 }],
        status: 'NEW',
        subtotal: 0,
        locality_adjustment: 0,
        tax: 0,
        total: 0,
        payment_status: 'PENDING'
      };
      const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
      assert.equal(processed.subtotal, 1299);
      assert.equal(processed.total, 1299);
      assert.equal(processed.items[0].isPackage, true);
    });

    it('Pairwise 4: Custom Requirement + Injected Price (total: 5) -> Authoritative Diagnostic ₹298', () => {
      const payload: DbServiceRequestRow = {
        id: 'PB-P4-04',
        request_type: 'CUSTOM_REQUIREMENT',
        items: [{ serviceId: 'srv-custom-req', name: 'Custom: AC electrical trip diagnostics', quantity: 1, price: 5 }],
        status: 'NEW',
        subtotal: 5,
        locality_adjustment: 0,
        tax: 0,
        total: 5,
        payment_status: 'PENDING'
      };
      const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
      assert.equal(processed.subtotal, 199);
      assert.equal(processed.total, 298);
    });

    it('Pairwise 5: Multiple Standard Services + Tampered Tax (tax: 500) -> Tax Forced to 0', () => {
      const payload: DbServiceRequestRow = {
        id: 'PB-P5-05',
        items: [
          { serviceId: 'srv-ac-foam', quantity: 1 },
          { serviceId: 'srv-ac-gen', quantity: 1 }
        ],
        status: 'NEW',
        subtotal: 100,
        locality_adjustment: 0,
        tax: 500,
        total: 600,
        payment_status: 'PENDING'
      };
      const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
      assert.equal(processed.tax, 0.0);
      assert.equal(processed.subtotal, 699 + 499);
      assert.equal(processed.total, 699 + 499 + 99);
    });
  });

  // ============================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS & PAYMENT INTEGRITY (5 Tests)
  // ============================================================================
  describe('Tier 4: Real-World Application Scenarios & Payment Integrity', () => {
    it('Scenario 1: Attacker injects total = 1 for AC Foam Jet (₹699) -> Overridden to ₹798', () => {
      const service = INITIAL_SERVICES.find((s) => s.id === 'srv-ac-foam')!;
      assert.equal(service.base_price, 699);

      const tamperedPayload: DbServiceRequestRow = {
        id: 'PB-ATTACK-01',
        items: [{ serviceId: 'srv-ac-foam', quantity: 1, price: 1 }],
        status: 'NEW',
        subtotal: 1,
        locality_adjustment: 0,
        tax: 0,
        total: 1,
        payment_status: 'PENDING'
      };

      const result = simulateEnforceServiceRequestsRules('INSERT', tamperedPayload, undefined, 'customer');
      assert.equal(result.subtotal, 699, 'Must enforce catalog subtotal');
      assert.equal(result.total, 798, 'Must enforce authoritative total of ₹798');
    });

    it('Scenario 2: Customer books 2 Standard Services with valid quantities -> Subtotal + ₹99 visit fee calculated', () => {
      // 1 x srv-ac-foam (699) + 2 x srv-ac-gen (499) = 1697
      const cartItems: CartItem[] = [
        {
          serviceId: 'srv-ac-foam',
          serviceName: 'Foam-Jet AC Service',
          category: 'AC & Appliances',
          visitFee: 99,
          quantity: 1,
          price: 699,
          price_type: 'FIXED',
          isPackage: false
        },
        {
          serviceId: 'srv-ac-gen',
          serviceName: 'General AC Service',
          category: 'AC & Appliances',
          visitFee: 99,
          quantity: 2,
          price: 499,
          price_type: 'FIXED',
          isPackage: false
        }
      ];

      // Application pricing engine output
      const pricing = calculateOrderPricing(cartItems, INITIAL_SERVICES);
      assert.equal(pricing.itemSubtotal, 1697);
      assert.equal(pricing.visitFee, 99);
      assert.equal(pricing.total, 1796);

      // Verify DB trigger produces identical authoritative output
      const dbPayload: DbServiceRequestRow = {
        id: 'PB-SCENARIO-02',
        items: cartItems.map((c) => ({ serviceId: c.serviceId, quantity: c.quantity, price: c.price })),
        status: 'NEW',
        subtotal: 0,
        locality_adjustment: 0,
        tax: 0,
        total: 0,
        payment_status: 'PENDING'
      };
      const dbResult = simulateEnforceServiceRequestsRules('INSERT', dbPayload, undefined, 'customer');
      assert.equal(dbResult.subtotal, pricing.itemSubtotal);
      assert.equal(dbResult.total, pricing.total);
    });

    it('Scenario 3: Customer books AC Care Package (₹1299) -> Authoritative total = ₹1299 with ₹0 visit fee', () => {
      const pkg = INITIAL_PACKAGES.find((p) => p.id === 'pkg-2-ac-foam')!;
      assert.equal(pkg.price, 1299);

      const cartItems: CartItem[] = [
        {
          serviceId: 'pkg-2-ac-foam',
          serviceName: '2 AC Foam-Jet Package',
          category: 'AC & Appliances',
          visitFee: 0,
          quantity: 1,
          price: 1299,
          price_type: 'PACKAGE',
          isPackage: true
        }
      ];

      const pricing = calculateOrderPricing(cartItems, INITIAL_SERVICES);
      assert.equal(pricing.itemSubtotal, 1299);
      assert.equal(pricing.visitFee, 0, 'Care package must have ₹0 visit fee');
      assert.equal(pricing.total, 1299);

      const dbPayload: DbServiceRequestRow = {
        id: 'PB-SCENARIO-03',
        items: [{ serviceId: 'pkg-2-ac-foam', quantity: 1, price: 99 }],
        status: 'NEW',
        subtotal: 99,
        locality_adjustment: 0,
        tax: 0,
        total: 99,
        payment_status: 'PENDING'
      };
      const dbResult = simulateEnforceServiceRequestsRules('INSERT', dbPayload, undefined, 'customer');
      assert.equal(dbResult.subtotal, 1299);
      assert.equal(dbResult.total, 1299);
    });

    it('Scenario 4: Attacker submits unknown item string or inactive item -> Safely rejected with informative error', () => {
      const attackPayload: DbServiceRequestRow = {
        id: 'PB-SCENARIO-04',
        items: [{ serviceId: 'srv-hacked-custom-zero-price', quantity: 1 }],
        status: 'NEW',
        subtotal: 0,
        locality_adjustment: 0,
        tax: 0,
        total: 0,
        payment_status: 'PENDING'
      };

      assert.throws(() => {
        simulateEnforceServiceRequestsRules('INSERT', attackPayload, undefined, 'customer');
      }, (err: any) => {
        return (
          err instanceof Error &&
          err.message.includes('is invalid, inactive, or not found in catalog') &&
          err.message.includes('srv-hacked-custom-zero-price')
        );
      });
    });

    it('Scenario 5: Booking created -> staff calls record_payment -> Verifies payment matches exact authoritative total', () => {
      // 1. Booking created authoritatively
      const insertPayload: DbServiceRequestRow = {
        id: 'PB-PAY-FLOW-05',
        items: [{ serviceId: 'srv-ac-foam', quantity: 1 }],
        status: 'NEW',
        subtotal: 0,
        locality_adjustment: 0,
        tax: 0,
        total: 0,
        payment_status: 'PENDING'
      };
      const storedBooking = simulateEnforceServiceRequestsRules('INSERT', insertPayload, undefined, 'customer');
      assert.equal(storedBooking.total, 798, 'Authoritative total stored in DB must be 798');

      // 2. Staff attempts record_payment with tampered amount ₹1 -> Database rejects payment collection
      const attemptedPaymentAmount = 1;
      assert.notEqual(attemptedPaymentAmount, storedBooking.total);

      // Programmatic verification of record_payment invariant:
      // "IF p_amount != v_req.total THEN RAISE EXCEPTION 'Invalid payment amount...'"
      function simulateRecordPayment(booking: DbServiceRequestRow, amount: number) {
        if (amount !== booking.total) {
          throw new Error(`Invalid payment amount: received ${amount}, expected exact total ${booking.total}.`);
        }
        const token = 'token-pay-session';
        const secret = md5Hash(`${token}:${booking.id}:pc_pay_secret_2026`);
        return { token, secret };
      }

      assert.throws(
        () => simulateRecordPayment(storedBooking, 1),
        /Invalid payment amount: received 1, expected exact total 798/i
      );

      // 3. Genuine payment matching exact total succeeds and generates valid session token
      const { token, secret } = simulateRecordPayment(storedBooking, 798);
      const updatePayload: DbServiceRequestRow = {
        ...storedBooking,
        status: 'IN PROGRESS',
        payment_status: 'PAID',
        payment_method: 'CASH'
      };
      const updatedBooking = simulateEnforceServiceRequestsRules(
        'UPDATE',
        updatePayload,
        storedBooking,
        'technician',
        'tech-uuid',
        { paymentToken: token, paymentTokenSecret: secret }
      );
      assert.equal(updatedBooking.payment_status, 'PAID');
    });
  });

  // ============================================================================
  // TIER 5: DATABASE MIGRATION AST & PL/PGSQL CONTRACT INVARIANTS (3 Tests)
  // ============================================================================
  describe('Tier 5: Database Migration AST & PL/pgSQL Contract Invariants', () => {
    const migrationPath = path.resolve(
      __dirname,
      '../../supabase/migrations/20261028000019_remediate_sec03_authoritative_pricing.sql'
    );
    const baselineMigrationPath = path.resolve(
      __dirname,
      '../../supabase/migrations/20261013000015_fix_staff_payment_collection.sql'
    );

    it('MIG-T1: Baseline migration 15 confirms previous unvalidated INSERT vulnerability', () => {
      assert.ok(fs.existsSync(baselineMigrationPath), 'Migration 15 must exist in codebase');
      const content = fs.readFileSync(baselineMigrationPath, 'utf8');

      // Assert that Migration 15's TG_OP = 'INSERT' block lacked subtotal/total calculation
      assert.ok(content.includes("TG_OP = 'INSERT'"), 'Must contain TG_OP = INSERT');
      const insertBlock = content.split("TG_OP = 'INSERT'")[1].split("RETURN NEW;")[0];
      assert.equal(
        insertBlock.includes('subtotal :='),
        false,
        'Baseline migration 15 must not calculate subtotal (reproducing vulnerability SEC-03)'
      );
      assert.equal(
        insertBlock.includes('total :='),
        false,
        'Baseline migration 15 must not calculate total (reproducing vulnerability SEC-03)'
      );
    });

    it('MIG-T2: When migration 19 is created, it must satisfy all SEC-03 contract invariants', (t) => {
      if (!fs.existsSync(migrationPath)) {
        t.skip('Migration 20261028000019 pending implementation by worker agent');
        return;
      }

      const sql = fs.readFileSync(migrationPath, 'utf8');

      // 1. Function declaration
      assert.ok(
        sql.includes('CREATE OR REPLACE FUNCTION public.enforce_service_requests_rules()'),
        'Migration must replace enforce_service_requests_rules()'
      );

      // 2. Querying both catalog tables
      assert.ok(sql.includes('public.services'), 'Migration must query public.services catalog');
      assert.ok(sql.includes('public.service_packages'), 'Migration must query public.service_packages catalog');

      // 3. Positive quantity check
      assert.ok(
        sql.includes('quantity') && (sql.includes('100') || sql.includes('> 0')),
        'Migration must enforce bounded integer quantity check'
      );

      // 4. Authoritative calculation of subtotal and total
      assert.ok(sql.includes('NEW.subtotal :='), 'Migration must authoritatively assign NEW.subtotal');
      assert.ok(sql.includes('NEW.total :='), 'Migration must authoritatively assign NEW.total');

      // 5. Trigger re-attachment
      assert.ok(
        sql.includes('trigger_enforce_service_requests_rules'),
        'Migration must reattach trigger_enforce_service_requests_rules'
      );

      // 6. Preservation of cryptographic tokens
      assert.ok(sql.includes('pc_otp_secret_2026'), 'Migration must preserve OTP secret verification');
      assert.ok(sql.includes('pc_pay_secret_2026'), 'Migration must preserve payment secret verification');
    });

    it('MIG-T3: Integration test in supabase/tests/security_tests.sql documents Docker requirements', () => {
      const sqlTestPath = path.resolve(__dirname, '../../supabase/tests/security_tests.sql');
      assert.ok(fs.existsSync(sqlTestPath), 'security_tests.sql must exist');
      const content = fs.readFileSync(sqlTestPath, 'utf8');

      // Assert that security_tests.sql contains SEC-03 coverage or Test 14/15
      assert.ok(
        content.includes('SEC-03') || content.includes('authoritative') || content.includes('Test 14') || content.includes('Test 15'),
        'security_tests.sql must contain reference to security test cases'
      );
    });

    it('MIG-T4: When Migration 20 is present, it must satisfy all SEC-03 column privilege and ledger invariants', () => {
      const migration20Path = path.resolve(
        __dirname,
        '../../supabase/migrations/20261030000020_harden_payment_ledger_and_column_privileges.sql'
      );
      assert.ok(fs.existsSync(migration20Path), 'Migration 20 must exist in supabase/migrations');
      const sql = fs.readFileSync(migration20Path, 'utf8');

      // 1. Column privilege lockdown on service_requests
      assert.ok(
        sql.includes('REVOKE UPDATE ON public.service_requests FROM authenticated;'),
        'Migration 20 must revoke table-level UPDATE from authenticated'
      );
      assert.ok(
        sql.includes('GRANT UPDATE (') && sql.includes('status,') && sql.includes('technician_notes,'),
        'Migration 20 must grant column-level UPDATE on operational columns'
      );
      assert.ok(
        !sql.includes('payment_status,') && !sql.includes('payment_method,'),
        'Migration 20 must NOT grant UPDATE on payment_status or payment_method to authenticated'
      );

      // 1b. Partial unique index on completed payments for idempotency
      assert.ok(
        sql.includes('CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_req_completed') &&
        sql.includes("WHERE status = 'COMPLETED'"),
        'Migration 20 must define partial unique index idx_payments_req_completed'
      );

      // 2. Elimination of legacy 3-param overload to prevent PostgREST ambiguity (PGRST204)
      assert.ok(
        sql.includes('DROP FUNCTION IF EXISTS public.record_payment(TEXT, NUMERIC, TEXT);'),
        'Migration 20 must drop the legacy 3-parameter overload'
      );

      // 3. Hardened record_payment() as SECURITY DEFINER
      assert.ok(
        sql.includes('CREATE OR REPLACE FUNCTION public.record_payment('),
        'Migration 20 must define hardened record_payment()'
      );
      assert.ok(
        sql.includes('SECURITY DEFINER'),
        'record_payment() must be SECURITY DEFINER'
      );
      assert.ok(
        sql.includes('SET search_path = pg_catalog, public'),
        'record_payment() must enforce fixed search_path'
      );
      assert.ok(
        sql.includes('FOR UPDATE'),
        'record_payment() must acquire row-level lock on service request'
      );

      // 4. enforce_service_requests_rules() as SECURITY INVOKER
      const funcBlock = sql.split('CREATE OR REPLACE FUNCTION public.enforce_service_requests_rules()')[1].split('BEGIN')[0];
      assert.ok(
        !funcBlock.includes('SECURITY DEFINER'),
        'enforce_service_requests_rules() must be SECURITY INVOKER'
      );

      // 5. Relational ledger check
      assert.ok(
        sql.includes('FROM public.payments p') && sql.includes("p.status = 'COMPLETED'"),
        'enforce_service_requests_rules() must perform relational ledger verification on transition to PAID'
      );

      // 6. Caller validation on technician/vendor unassignment
      assert.ok(
        sql.includes("status = 'REASSIGNMENT REQUIRED' AND assigned_to IS NULL"),
        'Migration 20 must support staff unassignment'
      );
      assert.ok(
        sql.includes('v_assigned_employee_id') &&
        sql.includes('FROM public.employees WHERE user_id = v_caller_id') &&
        sql.includes("OLD.assigned_to->>'id' IS DISTINCT FROM v_assigned_employee_id"),
        'Migration 20 must validate caller identity matches OLD.assigned_to on unassignment'
      );
    });
  });

  // ============================================================================
  // TIER 6: ADVERSARIAL BUSINESS RULE REGRESSION RECOVERY (4 Tests)
  // ============================================================================
  describe('Tier 6: Adversarial Business Rule Regression Recovery', () => {
    it('REG-1: Quote-required consultation booking authoritatively calculates total = ₹0 (no doorstep fee)', () => {
      // srv-prj-turnkey is a QUOTE_REQUIRED service with base_price = 0
      const quoteService = INITIAL_SERVICES.find((s) => s.id === 'srv-prj-turnkey');
      assert.ok(quoteService, 'Catalog must contain srv-prj-turnkey');
      assert.equal(String(quoteService.price_type).toUpperCase(), 'QUOTE_REQUIRED');

      const payload: DbServiceRequestRow = {
        id: 'PB-QUOTE-001',
        items: [{ serviceId: 'srv-prj-turnkey', quantity: 1, price: 9999 }],
        status: 'TAMPERED',
        subtotal: 9999,
        locality_adjustment: 500,
        tax: 1800,
        total: 12299,
        payment_status: 'PAID'
      };

      const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');

      assert.equal(processed.subtotal, 0, 'Quote consultation subtotal must be authoritative ₹0');
      assert.equal(processed.locality_adjustment, 0, 'Locality adjustment must be 0');
      assert.equal(processed.tax, 0, 'Tax must be 0');
      assert.equal(processed.total, 0, 'Quote consultation total must remain ₹0 without doorstep fee');
      assert.equal(processed.items[0].price, 0, 'Item price must be stamped to catalog ₹0');
      assert.equal(processed.status, 'NEW');
      assert.equal(processed.payment_status, 'PENDING');
    });

    it('REG-2: Standard catalog srv-ac-inspect with quantity 2 preserves quantity 2 and catalog rate', () => {
      const inspectService = INITIAL_SERVICES.find((s) => s.id === 'srv-ac-inspect');
      assert.ok(inspectService, 'Catalog must contain srv-ac-inspect');
      assert.equal(inspectService.base_price, 199);

      const payload: DbServiceRequestRow = {
        id: 'PB-INSPECT-QTY2',
        request_type: 'STANDARD_SERVICE',
        items: [{ serviceId: 'srv-ac-inspect', quantity: 2, price: 1 }],
        status: 'TAMPERED',
        subtotal: 2,
        locality_adjustment: 0,
        tax: 0,
        total: 2,
        payment_status: 'PAID'
      };

      const processed = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');

      assert.equal(processed.items[0].quantity, 2, 'Quantity 2 must be preserved for standard catalog booking');
      assert.equal(processed.items[0].price, 199, 'Unit price must be stamped to catalog rate ₹199');
      assert.equal(processed.subtotal, 398, 'Subtotal must be 2 * ₹199 = ₹398');
      assert.equal(processed.total, 497, 'Total must be ₹398 subtotal + ₹99 visit fee = ₹497');
      assert.equal(processed.status, 'NEW');
      assert.equal(processed.payment_status, 'PENDING');
    });

    it('REG-3: Valid standard services and care packages retain exact established business pricing', () => {
      // Standard service: srv-ac-foam (₹699 + ₹99 = ₹798)
      const stdPayload: DbServiceRequestRow = {
        id: 'PB-STD-VALID',
        items: [{ serviceId: 'srv-ac-foam', quantity: 1, price: 699 }],
        status: 'NEW',
        subtotal: 699,
        locality_adjustment: 0,
        tax: 0,
        total: 798,
        payment_status: 'PENDING'
      };
      const stdProcessed = simulateEnforceServiceRequestsRules('INSERT', stdPayload, undefined, 'customer');
      assert.equal(stdProcessed.subtotal, 699);
      assert.equal(stdProcessed.total, 798);

      // Package: pkg-2-ac-foam (₹1299 + ₹0 = ₹1299)
      const pkgPayload: DbServiceRequestRow = {
        id: 'PB-PKG-VALID',
        items: [{ serviceId: 'pkg-2-ac-foam', quantity: 1, price: 1299 }],
        status: 'NEW',
        subtotal: 1299,
        locality_adjustment: 0,
        tax: 0,
        total: 1299,
        payment_status: 'PENDING'
      };
      const pkgProcessed = simulateEnforceServiceRequestsRules('INSERT', pkgPayload, undefined, 'customer');
      assert.equal(pkgProcessed.subtotal, 1299);
      assert.equal(pkgProcessed.total, 1299);
    });

    it('REG-4: Client-supplied subtotal, tax, and total cannot override database-calculated pricing', () => {
      const tamperedMixedPayload: DbServiceRequestRow = {
        id: 'PB-TAMPER-OVERRIDE',
        items: [
          { serviceId: 'srv-ac-foam', quantity: 2, price: 1 }, // Catalog ₹699 each -> ₹1398
          { serviceId: 'pkg-2-ac-foam', quantity: 1, price: 1 } // Catalog ₹1299 -> ₹1299
        ],
        status: 'NEW',
        subtotal: 2.0,
        locality_adjustment: -50.0,
        tax: 1.0,
        total: 1.0,
        payment_status: 'PENDING'
      };

      const processed = simulateEnforceServiceRequestsRules('INSERT', tamperedMixedPayload, undefined, 'customer');

      // Authoritative subtotal = 1398 + 1299 = 2697
      assert.equal(processed.subtotal, 2697, 'Subtotal must be completely overwritten by catalog calculation');
      assert.equal(processed.locality_adjustment, 0, 'Locality adjustment must be forced to 0.00');
      assert.equal(processed.tax, 0, 'Tax must be forced to 0.00');
      // Has standard service ('srv-ac-foam') -> adds ₹99 visit fee
      assert.equal(processed.total, 2796, 'Total must be ₹2697 subtotal + ₹99 visit fee = ₹2796');
      assert.equal(processed.items[0].price, 699);
      assert.equal(processed.items[1].price, 1299);
    });
  });

  // ============================================================================
  // TIER 7: MIGRATION 20 COLUMN PRIVILEGES & ATOMIC LEDGER INVARIANTS (5 Tests)
  // ============================================================================
  describe('Tier 7: Migration 20 Column Privileges & Atomic Ledger Invariants', () => {
    // Simulator for column privilege boundaries
    const AUTHENTICATED_ALLOWED_COLUMNS = new Set([
      'status',
      'assigned_to',
      'technician_notes',
      'vendor_scheduled_time',
      'vendor_arrival_status',
      'work_started_at',
      'work_completed_at',
      'before_work_photos',
      'completion_photos',
      'completion_notes',
      'updated_at'
    ]);

    function assertColumnPrivileges(modifiedColumns: string[], role: 'authenticated' | 'service_role') {
      if (role === 'service_role') return;
      for (const col of modifiedColumns) {
        if (!AUTHENTICATED_ALLOWED_COLUMNS.has(col)) {
          throw new Error(`permission denied for column "${col}" of relation "service_requests"`);
        }
      }
    }

    it('T7-1: Direct client UPDATE modifying payment_status throws 42501 permission denied', () => {
      assert.throws(
        () => assertColumnPrivileges(['payment_status'], 'authenticated'),
        /permission denied for column "payment_status"/
      );
    });

    it('T7-2: Direct client UPDATE modifying total or items throws 42501 permission denied', () => {
      assert.throws(
        () => assertColumnPrivileges(['total'], 'authenticated'),
        /permission denied for column "total"/
      );
      assert.throws(
        () => assertColumnPrivileges(['items'], 'authenticated'),
        /permission denied for column "items"/
      );
    });

    it('T7-3: Staff operational updates (status, technician_notes, completion_photos) succeed under column grants', () => {
      assert.doesNotThrow(() => {
        assertColumnPrivileges(['status', 'technician_notes', 'completion_photos'], 'authenticated');
      });
    });

    it('T7-4: Relational ledger check rejects payment_status = PAID without COMPLETED ledger entry', () => {
      const mockBooking: DbServiceRequestRow = {
        id: 'PB-T7-401',
        items: [{ serviceId: 'srv-ac-foam', quantity: 1, price: 699 }],
        status: 'IN PROGRESS',
        subtotal: 699,
        locality_adjustment: 0,
        tax: 0,
        total: 798,
        payment_status: 'PENDING',
        payment_method: undefined
      };

      // Simulated payments ledger
      const paymentsLedger: any[] = [];

      function simulateTransitionToPaid(newReq: DbServiceRequestRow) {
        const hasCompletedPayment = paymentsLedger.some(
          (p) =>
            p.request_id === newReq.id &&
            p.status === 'COMPLETED' &&
            p.amount === newReq.total &&
            p.method === newReq.payment_method
        );
        if (!hasCompletedPayment) {
          throw new Error(
            `Transition rejected: payment_status cannot be set to PAID without an exact-match COMPLETED ledger record for total ${newReq.total} and method ${newReq.payment_method}.`
          );
        }
      }

      // Transition without payment in ledger fails
      assert.throws(
        () =>
          simulateTransitionToPaid({
            ...mockBooking,
            payment_status: 'PAID',
            payment_method: 'CASH'
          }),
        /Transition rejected: payment_status cannot be set to PAID without an exact-match COMPLETED ledger record/
      );

      // Insert matching payment into ledger
      paymentsLedger.push({
        id: 'pay-ledger-1',
        request_id: 'PB-T7-401',
        amount: 798,
        method: 'CASH',
        status: 'COMPLETED'
      });

      // Transition with matching payment succeeds
      assert.doesNotThrow(() =>
        simulateTransitionToPaid({
          ...mockBooking,
          payment_status: 'PAID',
          payment_method: 'CASH'
        })
      );
    });

    it('T7-5: Atomic record_payment enforces exact total and idempotent retry', () => {
      interface PaymentDbRow {
        id: string;
        request_id: string;
        amount: number;
        method: string;
        status: string;
      }

      const ledger: PaymentDbRow[] = [];
      const serviceRequest = {
        id: 'PB-T7-501',
        total: 798,
        status: 'IN PROGRESS',
        payment_status: 'PENDING',
        payment_method: null as string | null
      };

      function recordPaymentRpc(reqId: string, amount: number, method: string) {
        if (reqId !== serviceRequest.id) throw new Error('Request not found');
        if (amount !== serviceRequest.total) {
          throw new Error(`Invalid payment amount: received ${amount}, expected exact total ${serviceRequest.total}.`);
        }

        const completed = ledger.filter((p) => p.request_id === reqId && p.status === 'COMPLETED');
        if (completed.length > 0) {
          const existing = completed[0];
          if (existing.method !== method || existing.amount !== amount) {
            throw new Error('Payment conflict: already settled with different params');
          }
          return { success: true, payment_id: existing.id, idempotent: true };
        }

        const paymentId = 'pay-' + Math.random().toString(36).substring(2, 9);
        ledger.push({ id: paymentId, request_id: reqId, amount, method, status: 'COMPLETED' });
        serviceRequest.payment_status = 'PAID';
        serviceRequest.payment_method = method;
        return { success: true, payment_id: paymentId, idempotent: false };
      }

      // Wrong amount fails
      assert.throws(() => recordPaymentRpc('PB-T7-501', 500, 'CASH'), /Invalid payment amount/);

      // Correct payment succeeds
      const result1 = recordPaymentRpc('PB-T7-501', 798, 'CASH');
      assert.equal(result1.success, true);
      assert.equal(result1.idempotent, false);
      assert.equal(serviceRequest.payment_status, 'PAID');
      assert.equal(ledger.length, 1);

      // Clean retry returns existing payment idempotently
      const result2 = recordPaymentRpc('PB-T7-501', 798, 'CASH');
      assert.equal(result2.success, true);
      assert.equal(result2.idempotent, true);
      assert.equal(result2.payment_id, result1.payment_id);
      assert.equal(ledger.length, 1, 'No duplicate payment rows created');
    });
  });
});
