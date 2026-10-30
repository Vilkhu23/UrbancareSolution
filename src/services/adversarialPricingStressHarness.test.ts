/**
 * ==============================================================================
 * Adversarial Pricing Stress Test Harness (Challenger 1)
 * File: src/services/adversarialPricingStressHarness.test.ts
 *
 * Empirical verification of SEC-03 authoritative pricing invariant, catalog
 * validation, SQL injection resistance, and tamper-proofing.
 * ==============================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_SERVICES, INITIAL_PACKAGES } from '../data/initialData.ts';
import { calculateOrderPricing } from '../utils/pricingEngine.ts';
import {
  simulateEnforceServiceRequestsRules,
  DbServiceRequestRow,
  TriggerSessionTokens
} from './serviceRequestPricingSecurity.test.ts';

describe('CHALLENGER 1: Adversarial Pricing Stress Harness', () => {

  // ----------------------------------------------------------------------------
  // SECTION 1: SQL INJECTION & MALFORMED ITEM ID BATTERY
  // ----------------------------------------------------------------------------
  describe('Adversarial Section 1: SQL Injection & Malformed Item IDs', () => {
    const sqlInjectionPayloads = [
      "srv-ac-foam' OR '1'='1",
      "srv-ac-foam'; DROP TABLE services; --",
      "' UNION SELECT 'srv-hacked', 'Hacked', 0.01, true FROM services --",
      "srv-ac-foam' AND 1=sleep(5) --",
      "admin'--",
      "'; EXEC xp_cmdshell('dir'); --",
      "\" OR \"\"=\"",
      "` OR 1=1 --",
      "\\'; DROP TABLE service_requests; --",
      "srv-ac-foam\x00' OR 1=1 --",
      "srv-ac-foam\u0000admin",
      "SELECT * FROM profiles",
      "{{7*7}}",
      "${7*7}",
      "<script>alert('xss')</script>",
      "../../../../etc/passwd",
      "%27%20OR%201=1",
      "0x7372762d61632d666f616d", // hex encoding
      "   ",
      "\t\n\r"
    ];

    for (const sqli of sqlInjectionPayloads) {
      it(`Rejects SQLi / malformed string: ${JSON.stringify(sqli).slice(0, 40)}`, () => {
        const payload: DbServiceRequestRow = {
          id: 'ADV-SQLI-TEST',
          items: [{ serviceId: sqli, quantity: 1, price: 1 }],
          status: 'NEW',
          subtotal: 1,
          locality_adjustment: 0,
          tax: 0,
          total: 1,
          payment_status: 'PENDING'
        };

        assert.throws(
          () => simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer'),
          /(invalid|inactive|not found in catalog|missing service ID)/i,
          `Payload ${sqli} must be safely rejected`
        );
      });
    }

    it('Rejects unknown random UUIDs', () => {
      const randomUuids = [
        'c4a8b792-884f-4d2b-9e4a-4e2df4bb0011',
        '00000000-0000-0000-0000-000000000000',
        'ffffffff-ffff-ffff-ffff-ffffffffffff'
      ];
      for (const uuid of randomUuids) {
        const payload: DbServiceRequestRow = {
          id: 'ADV-UUID-TEST',
          items: [{ serviceId: uuid, quantity: 1 }],
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
      }
    });

    it('Rejects prototype pollution keys', () => {
      const protoKeys = ['__proto__', 'constructor', 'prototype', 'toString', 'valueOf'];
      for (const key of protoKeys) {
        const payload: DbServiceRequestRow = {
          id: 'ADV-PROTO-TEST',
          items: [{ serviceId: key, quantity: 1 }],
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
      }
    });
  });

  // ----------------------------------------------------------------------------
  // SECTION 2: ADVERSARIAL QUANTITY FUZZING (BOUNDED INTEGER ENFORCEMENT)
  // ----------------------------------------------------------------------------
  describe('Adversarial Section 2: Quantity Fuzzing', () => {
    const invalidQuantities = [
      -1000,
      -1,
      -0.0001,
      -0,
      0,
      0.1,
      0.999,
      1.000001,
      1.5,
      2.7,
      99.9,
      100.0001,
      101,
      1000,
      1000000,
      NaN,
      Infinity,
      -Infinity,
      '1' as any,
      '0' as any,
      '-1' as any,
      '101' as any,
      '1e5' as any,
      'NaN' as any,
      true as any,
      false as any,
      null as any,
      undefined as any,
      {} as any,
      [] as any
    ];

    for (const qty of invalidQuantities) {
      it(`Rejects adversarial quantity value: ${String(qty)}`, () => {
        const payload: DbServiceRequestRow = {
          id: 'ADV-QTY-TEST',
          items: [{ serviceId: 'srv-ac-gen', quantity: qty }],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PENDING'
        };

        assert.throws(
          () => simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer'),
          /quantity must be a positive integer between 1 and 100/i,
          `Quantity ${String(qty)} should have been rejected`
        );
      });
    }

    it('Accepts every integer in valid range [1..100] with exact linear subtotal', () => {
      const service = INITIAL_SERVICES.find((s) => s.id === 'srv-ac-gen')!;
      for (const qty of [1, 2, 10, 50, 99, 100]) {
        const payload: DbServiceRequestRow = {
          id: `ADV-VALID-QTY-${qty}`,
          items: [{ serviceId: 'srv-ac-gen', quantity: qty }],
          status: 'NEW',
          subtotal: 0,
          locality_adjustment: 0,
          tax: 0,
          total: 0,
          payment_status: 'PENDING'
        };
        const res = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
        assert.equal(res.subtotal, service.base_price * qty);
        assert.equal(res.total, service.base_price * qty + 99);
      }
    });
  });

  // ----------------------------------------------------------------------------
  // SECTION 3: AUTHORITATIVE PRICING INVARIANT FUZZING (ZERO CLIENT TRUST)
  // ----------------------------------------------------------------------------
  describe('Adversarial Section 3: Subtotal, Total, Tax, Locality Tampering', () => {
    const tamperingCases = [
      { name: 'Negative total', subtotal: -1000, total: -901, tax: 0, loc: 0 },
      { name: 'Zero total', subtotal: 0, total: 0, tax: 0, loc: 0 },
      { name: 'Fractional ₹0.0001 total', subtotal: 0.0001, total: 0.0001, tax: 0, loc: 0 },
      { name: '₹1 total bypass', subtotal: 1, total: 1, tax: 0, loc: 0 },
      { name: 'Inflated ₹100,000,000 total', subtotal: 100000000, total: 100000000, tax: 0, loc: 0 },
      { name: 'Negative tax injection', subtotal: 699, total: 199, tax: -500, loc: 0 },
      { name: 'Negative locality adjustment injection', subtotal: 699, total: 199, tax: 0, loc: -500 },
      { name: 'NaN total injection', subtotal: NaN, total: NaN, tax: 0, loc: 0 },
      { name: 'Infinity total injection', subtotal: Infinity, total: Infinity, tax: 0, loc: 0 }
    ];

    for (const tc of tamperingCases) {
      it(`Overwrites client tampering: ${tc.name}`, () => {
        const payload: DbServiceRequestRow = {
          id: 'ADV-PRICE-TAMPER',
          items: [{ serviceId: 'srv-ac-foam', quantity: 1, price: tc.subtotal }],
          status: 'TAMPERED',
          subtotal: tc.subtotal,
          locality_adjustment: tc.loc,
          tax: tc.tax,
          total: tc.total,
          payment_status: 'PAID'
        };

        const result = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');

        // Invariants that MUST strictly hold
        assert.equal(result.items[0].price, 699, 'Item price must be catalog rate');
        assert.equal(result.subtotal, 699, 'Subtotal must strictly match catalog');
        assert.equal(result.tax, 0.00, 'Tax must be forced to 0');
        assert.equal(result.locality_adjustment, 0.00, 'Locality adjustment must be forced to 0');
        assert.equal(result.total, 798, 'Total must strictly equal 699 + 99 = 798');
        assert.equal(result.status, 'NEW', 'Status must be forced to NEW');
        assert.equal(result.payment_status, 'PENDING', 'Payment status must be forced to PENDING');
      });
    }
  });

  // ----------------------------------------------------------------------------
  // SECTION 4: INACTIVE SERVICES & SERVICE PACKAGES INTEGRITY
  // ----------------------------------------------------------------------------
  describe('Adversarial Section 4: Inactive Services and Packages', () => {
    it('Cannot order inactive standard service', () => {
      const mockInactiveId = 'srv-inactive-mock';
      try {
        (INITIAL_SERVICES as any).push({
          id: mockInactiveId,
          name: 'Decommissioned AC Unit Clean',
          base_price: 399,
          active: false,
          price_type: 'FIXED'
        });

        const payload: DbServiceRequestRow = {
          id: 'ADV-INACT-01',
          items: [{ serviceId: mockInactiveId, quantity: 1 }],
          status: 'NEW',
          subtotal: 399,
          locality_adjustment: 0,
          tax: 0,
          total: 498,
          payment_status: 'PENDING'
        };

        assert.throws(
          () => simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer'),
          /invalid, inactive, or not found in catalog/i
        );
      } finally {
        const idx = INITIAL_SERVICES.findIndex((s) => s.id === mockInactiveId);
        if (idx !== -1) INITIAL_SERVICES.splice(idx, 1);
      }
    });

    it('Cannot order inactive care package', () => {
      const mockInactivePkgId = 'pkg-inactive-mock';
      try {
        (INITIAL_PACKAGES as any).push({
          id: mockInactivePkgId,
          name: 'Decommissioned Care Bundle',
          price: 999,
          active: false
        });

        const payload: DbServiceRequestRow = {
          id: 'ADV-INACT-02',
          items: [{ serviceId: mockInactivePkgId, quantity: 1 }],
          status: 'NEW',
          subtotal: 999,
          locality_adjustment: 0,
          tax: 0,
          total: 999,
          payment_status: 'PENDING'
        };

        assert.throws(
          () => simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer'),
          /invalid, inactive, or not found in catalog/i
        );
      } finally {
        const idx = INITIAL_PACKAGES.findIndex((p) => p.id === mockInactivePkgId);
        if (idx !== -1) INITIAL_PACKAGES.splice(idx, 1);
      }
    });

    it('Mixed Cart: 1 valid package + 1 inactive service fails closed', () => {
      const mockInactiveId = 'srv-inactive-mock-2';
      try {
        (INITIAL_SERVICES as any).push({
          id: mockInactiveId,
          name: 'Decommissioned Clean',
          base_price: 199,
          active: false
        });

        const payload: DbServiceRequestRow = {
          id: 'ADV-INACT-03',
          items: [
            { serviceId: 'pkg-2-ac-foam', quantity: 1 },
            { serviceId: mockInactiveId, quantity: 1 }
          ],
          status: 'NEW',
          subtotal: 1498,
          locality_adjustment: 0,
          tax: 0,
          total: 1597,
          payment_status: 'PENDING'
        };

        assert.throws(
          () => simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer'),
          /invalid, inactive, or not found in catalog/i
        );
      } finally {
        const idx = INITIAL_SERVICES.findIndex((s) => s.id === mockInactiveId);
        if (idx !== -1) INITIAL_SERVICES.splice(idx, 1);
      }
    });
  });

  // ----------------------------------------------------------------------------
  // SECTION 5: COMPLEX MIXED CARTS & COMBINATIONS
  // ----------------------------------------------------------------------------
  describe('Adversarial Section 5: Complex Cart Combinations', () => {
    it('Multiple packages in cart result in ₹0 visit fee', () => {
      const payload: DbServiceRequestRow = {
        id: 'ADV-CART-01',
        items: [
          { serviceId: 'pkg-2-ac-foam', quantity: 1 },        // 1299
          { serviceId: 'pkg-ac-complete-care', quantity: 2 }  // 1899 * 2 = 3798
        ],
        status: 'NEW',
        subtotal: 0,
        locality_adjustment: 0,
        tax: 0,
        total: 0,
        payment_status: 'PENDING'
      };

      const res = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
      assert.equal(res.subtotal, 1299 + 3798);
      assert.equal(res.total, 1299 + 3798, 'Total must equal subtotal with zero visit fee');
    });

    it('Package + Standard Service incurs single ₹99 visit fee', () => {
      const payload: DbServiceRequestRow = {
        id: 'ADV-CART-02',
        items: [
          { serviceId: 'pkg-2-ac-foam', quantity: 1 },        // 1299 (package)
          { serviceId: 'srv-tap-leak', quantity: 3 }          // 149 * 3 = 447 (standard)
        ],
        status: 'NEW',
        subtotal: 0,
        locality_adjustment: 0,
        tax: 0,
        total: 0,
        payment_status: 'PENDING'
      };

      const res = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
      assert.equal(res.subtotal, 1299 + 447);
      assert.equal(res.total, 1299 + 447 + 99, 'Must add 99 visit fee for standard service');
    });

    it('Custom Requirement with injected 0 price enforces diagnostic 199 + 99 visit fee = 298', () => {
      const payload: DbServiceRequestRow = {
        id: 'ADV-CUSTOM-01',
        request_type: 'CUSTOM_REQUIREMENT',
        items: [{ serviceId: 'custom-diagnostic', name: 'Custom: Strange compressor buzzing', quantity: 1, price: 0 }],
        status: 'NEW',
        subtotal: 0,
        locality_adjustment: 0,
        tax: 0,
        total: 0,
        payment_status: 'PENDING'
      };

      const res = simulateEnforceServiceRequestsRules('INSERT', payload, undefined, 'customer');
      assert.equal(res.subtotal, 199);
      assert.equal(res.total, 298);
    });
  });

  // ----------------------------------------------------------------------------
  // SECTION 6: UPDATE PHASE PRIVILEGE SEPARATION & TAMPER RESISTANCE
  // ----------------------------------------------------------------------------
  describe('Adversarial Section 6: Update Phase Privilege Enforcement', () => {
    const baseRow: DbServiceRequestRow = {
      id: 'ADV-UPDATE-01',
      items: [{ serviceId: 'srv-ac-gen', quantity: 1, price: 499 }],
      status: 'NEW',
      subtotal: 499,
      locality_adjustment: 0,
      tax: 0,
      total: 598,
      payment_status: 'PENDING'
    };

    it('Customer cannot reduce total from 598 to 1 on UPDATE', () => {
      const modified: DbServiceRequestRow = { ...baseRow, total: 1 };
      assert.throws(
        () => simulateEnforceServiceRequestsRules('UPDATE', modified, baseRow, 'customer'),
        /cannot modify pricing or billing fields/i
      );
    });

    it('Customer cannot mark booking as PAID on UPDATE', () => {
      const modified: DbServiceRequestRow = { ...baseRow, payment_status: 'PAID' };
      assert.throws(
        () => simulateEnforceServiceRequestsRules('UPDATE', modified, baseRow, 'customer'),
        /cannot modify payment fields/i
      );
    });

    it('Technician cannot modify total on UPDATE', () => {
      const modified: DbServiceRequestRow = { ...baseRow, total: 999 };
      assert.throws(
        () => simulateEnforceServiceRequestsRules('UPDATE', modified, baseRow, 'technician'),
        /Staff cannot modify billing fields/i
      );
    });

    it('Technician cannot alter payment_status without authorized payment token', () => {
      const modified: DbServiceRequestRow = { ...baseRow, payment_status: 'PAID' };
      assert.throws(
        () => simulateEnforceServiceRequestsRules('UPDATE', modified, baseRow, 'technician'),
        /without authorized record_payment/i
      );
    });
  });
});
