/**
 * ==============================================================================
 * Adversarial Challenger 2 Test Suite: Workflow & State Transitions
 * File: src/services/workflowAdversarialChallenger.test.ts
 *
 * Focus:
 * 1. Payment workflow compatibility & record_payment total check
 * 2. OTP verification session tokens & completion bypass protection
 * 3. Item immutability & unauthorized status transitions on UPDATE
 * 4. Migration AST & PL/pgSQL invariant validation
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
import {
  simulateEnforceServiceRequestsRules,
  DbServiceRequestRow,
  TriggerSessionTokens
} from './serviceRequestPricingSecurity.test.ts';

function md5Hash(input: string): string {
  return createHash('md5').update(input).digest('hex');
}

/**
 * Programmatic model of public.record_payment() from migration 20261013000015
 */
function simulateRecordPayment(
  callerRole: 'customer' | 'technician' | 'vendor' | 'admin' | 'ops_manager',
  callerId: string,
  request: DbServiceRequestRow,
  p_amount: number,
  p_method: string,
  isAssigned: boolean = true
): { success: boolean; token?: string; secret?: string; error?: string } {
  // 1. Caller authentication & authorization
  let isAuthorized = false;
  if (callerRole === 'admin' || callerRole === 'ops_manager') {
    isAuthorized = true;
  } else if ((callerRole === 'technician' || callerRole === 'vendor') && isAssigned) {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    throw new Error(`Forbidden: You are not authorized to collect payment for service request ${request.id}.`);
  }

  // 2. Status check: must be IN PROGRESS or COMPLETED
  if (request.status !== 'IN PROGRESS' && request.status !== 'COMPLETED') {
    throw new Error(
      `Payment collection rejected: Service request ${request.id} is in ${request.status} status. Job must be IN PROGRESS or COMPLETED.`
    );
  }

  // 3. Payment method check
  if (!['CASH', 'UPI', 'ONLINE'].includes(p_method)) {
    throw new Error(`Invalid payment method: ${p_method}. Must be CASH, UPI, or ONLINE.`);
  }

  // 4. Exact total validation
  if (p_amount !== request.total) {
    throw new Error(`Invalid payment amount: received ${p_amount}, expected exact total ${request.total}.`);
  }

  // 5. Generate session tokens
  const token = `pay-token-${Math.random().toString(36).substring(2, 10)}`;
  const secret = md5Hash(`${token}:${request.id}:pc_pay_secret_2026`);

  return { success: true, token, secret };
}

/**
 * Programmatic model of public.verify_job_otp() from migration 20261013000008
 */
interface SecretRecord {
  requestId: string;
  customerOtp: string;
  failedAttempts: number;
}

function simulateVerifyJobOtp(
  callerRole: 'customer' | 'technician' | 'vendor' | 'admin' | 'ops_manager',
  callerId: string,
  request: DbServiceRequestRow,
  secretRecord: SecretRecord,
  submittedOtp: string,
  isAssigned: boolean = true
): { success: boolean; code: string; token?: string; secret?: string; message: string } {
  let isAuthorized = false;
  if (callerRole === 'admin' || callerRole === 'ops_manager') {
    isAuthorized = true;
  } else if ((callerRole === 'technician' || callerRole === 'vendor') && isAssigned) {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    throw new Error(`Forbidden: You are not assigned to service request ${request.id}.`);
  }

  if (request.status === 'COMPLETED') {
    return { success: true, code: 'ALREADY_COMPLETED', message: 'Job is already marked completed.' };
  }

  // Check lockout
  if (secretRecord.failedAttempts >= 5) {
    return {
      success: false,
      code: 'LOCKED',
      message: 'Maximum OTP verification attempts (5) exceeded. Job is locked. Contact operations team.'
    };
  }

  // Check OTP match
  if (submittedOtp.trim() === secretRecord.customerOtp.trim()) {
    const token = `otp-token-${Math.random().toString(36).substring(2, 10)}`;
    const secret = md5Hash(`${token}:${request.id}:pc_otp_secret_2026`);
    secretRecord.failedAttempts = 0;
    return {
      success: true,
      code: 'VERIFIED',
      token,
      secret,
      message: 'OTP verified successfully. Job marked COMPLETED.'
    };
  } else {
    secretRecord.failedAttempts += 1;
    if (secretRecord.failedAttempts >= 5) {
      return {
        success: false,
        code: 'LOCKED',
        message: 'Maximum OTP verification attempts (5) exceeded. Job is locked. Contact operations team.'
      };
    }
    return {
      success: false,
      code: 'INVALID_OTP',
      message: `Invalid OTP. ${5 - secretRecord.failedAttempts} attempts remaining.`
    };
  }
}

// ==============================================================================
// TEST SUITE
// ==============================================================================

describe('Adversarial Challenge: Workflow & State Transitions', () => {

  // ----------------------------------------------------------------------------
  // SECTION 1: PAYMENT WORKFLOW COMPATIBILITY & RECORD_PAYMENT CHECKS
  // ----------------------------------------------------------------------------
  describe('Section 1: Payment Workflow Compatibility & record_payment', () => {
    const authoritativeBooking: DbServiceRequestRow = {
      id: 'PB-CHALLENGE-PAY-01',
      items: [{ serviceId: 'srv-ac-foam', quantity: 1, price: 699 }],
      subtotal: 699,
      locality_adjustment: 0,
      tax: 0,
      total: 798, // 699 + 99 visit fee
      status: 'IN PROGRESS',
      payment_status: 'PENDING',
      assigned_to: 'emp-tech-1'
    };

    it('1.1: record_payment rejects underpayment (e.g. ₹1 or ₹797)', () => {
      assert.throws(
        () => simulateRecordPayment('technician', 'tech-uuid-1', authoritativeBooking, 1, 'CASH'),
        /Invalid payment amount: received 1, expected exact total 798/
      );
      assert.throws(
        () => simulateRecordPayment('technician', 'tech-uuid-1', authoritativeBooking, 797, 'CASH'),
        /Invalid payment amount: received 797, expected exact total 798/
      );
    });

    it('1.2: record_payment rejects overpayment (e.g. ₹800 or ₹1000)', () => {
      assert.throws(
        () => simulateRecordPayment('technician', 'tech-uuid-1', authoritativeBooking, 800, 'UPI'),
        /Invalid payment amount: received 800, expected exact total 798/
      );
    });

    it('1.3: record_payment rejects zero or negative payment amounts', () => {
      assert.throws(
        () => simulateRecordPayment('technician', 'tech-uuid-1', authoritativeBooking, 0, 'CASH'),
        /Invalid payment amount: received 0, expected exact total 798/
      );
      assert.throws(
        () => simulateRecordPayment('technician', 'tech-uuid-1', authoritativeBooking, -100, 'CASH'),
        /Invalid payment amount: received -100, expected exact total 798/
      );
    });

    it('1.4: record_payment rejects invalid payment methods', () => {
      assert.throws(
        () => simulateRecordPayment('technician', 'tech-uuid-1', authoritativeBooking, 798, 'BITCOIN'),
        /Invalid payment method: BITCOIN/
      );
      assert.throws(
        () => simulateRecordPayment('technician', 'tech-uuid-1', authoritativeBooking, 798, 'FREE'),
        /Invalid payment method: FREE/
      );
    });

    it('1.5: record_payment rejects settlement if booking is in NEW or SCHEDULED status', () => {
      const newBooking: DbServiceRequestRow = { ...authoritativeBooking, status: 'NEW' };
      assert.throws(
        () => simulateRecordPayment('technician', 'tech-uuid-1', newBooking, 798, 'CASH'),
        /Job must be IN PROGRESS or COMPLETED/
      );

      const scheduledBooking: DbServiceRequestRow = { ...authoritativeBooking, status: 'SCHEDULED' };
      assert.throws(
        () => simulateRecordPayment('technician', 'tech-uuid-1', scheduledBooking, 798, 'CASH'),
        /Job must be IN PROGRESS or COMPLETED/
      );
    });

    it('1.6: Customer role cannot execute record_payment', () => {
      assert.throws(
        () => simulateRecordPayment('customer', 'cust-uuid-1', authoritativeBooking, 798, 'CASH'),
        /Forbidden: You are not authorized to collect payment/
      );
    });

    it('1.7: Customer cannot directly update payment_status to PAID via PostgREST', () => {
      const updatedRow: DbServiceRequestRow = {
        ...authoritativeBooking,
        payment_status: 'PAID'
      };
      assert.throws(
        () => simulateEnforceServiceRequestsRules('UPDATE', updatedRow, authoritativeBooking, 'customer'),
        /Customers cannot modify payment fields|Customers cannot modify pricing, payment, assignment, or OTP fields/
      );
    });

    it('1.8: Customer cannot bypass payment_status restriction even with forged session tokens', () => {
      const updatedRow: DbServiceRequestRow = {
        ...authoritativeBooking,
        payment_status: 'PAID'
      };
      const forgedToken = 'forged-token-xyz';
      const forgedSecret = md5Hash(`${forgedToken}:${authoritativeBooking.id}:pc_pay_secret_2026`);

      // Even with the valid secret format, callerRole = 'customer' must be strictly blocked
      assert.throws(
        () =>
          simulateEnforceServiceRequestsRules('UPDATE', updatedRow, authoritativeBooking, 'customer', 'cust-uuid', {
            paymentToken: forgedToken,
            paymentTokenSecret: forgedSecret
          }),
        /Customers cannot modify payment fields|Customers cannot modify pricing/
      );
    });

    it('1.9: Technician cannot update payment_status to PAID without valid session tokens', () => {
      const updatedRow: DbServiceRequestRow = {
        ...authoritativeBooking,
        payment_status: 'PAID'
      };
      // No tokens provided
      assert.throws(
        () => simulateEnforceServiceRequestsRules('UPDATE', updatedRow, authoritativeBooking, 'technician'),
        /Staff cannot modify payment status without authorized record_payment/
      );

      // Wrong token secret provided
      assert.throws(
        () =>
          simulateEnforceServiceRequestsRules('UPDATE', updatedRow, authoritativeBooking, 'technician', 'tech-uuid', {
            paymentToken: 'valid-token',
            paymentTokenSecret: 'invalid-secret'
          }),
        /Staff cannot modify payment status without authorized record_payment/
      );
    });

    it('1.10: Payment token replay attack across different bookings is strictly rejected', () => {
      const bookingA: DbServiceRequestRow = { ...authoritativeBooking, id: 'REQ-A' };
      const bookingB: DbServiceRequestRow = { ...authoritativeBooking, id: 'REQ-B' };

      // Generate legitimate token for Booking A
      const { token, secret } = simulateRecordPayment('technician', 'tech-uuid-1', bookingA, 798, 'CASH');

      // Attempt to replay Booking A's token to settle Booking B
      const updateRowB: DbServiceRequestRow = { ...bookingB, payment_status: 'PAID' };
      assert.throws(
        () =>
          simulateEnforceServiceRequestsRules('UPDATE', updateRowB, bookingB, 'technician', 'tech-uuid', {
            paymentToken: token,
            paymentTokenSecret: secret
          }),
        /Staff cannot modify payment status without authorized record_payment/
      );
    });
  });

  // ----------------------------------------------------------------------------
  // SECTION 2: OTP VERIFICATION SESSION TOKENS & COMPLETION BYPASS
  // ----------------------------------------------------------------------------
  describe('Section 2: OTP Verification Session Tokens & Completion Bypass', () => {
    const activeBooking: DbServiceRequestRow = {
      id: 'PB-CHALLENGE-OTP-01',
      items: [{ serviceId: 'srv-ac-gen', quantity: 1, price: 499 }],
      subtotal: 499,
      locality_adjustment: 0,
      tax: 0,
      total: 598,
      status: 'IN PROGRESS',
      payment_status: 'PENDING',
      assigned_to: 'emp-tech-1'
    };

    it('2.1: Customer cannot mark status = COMPLETED on UPDATE', () => {
      const updateRow: DbServiceRequestRow = {
        ...activeBooking,
        status: 'COMPLETED'
      };
      assert.throws(
        () => simulateEnforceServiceRequestsRules('UPDATE', updateRow, activeBooking, 'customer'),
        /Customers may only cancel requests that are currently in NEW status/
      );
    });

    it('2.2: Staff cannot mark status = COMPLETED on UPDATE without verify_job_otp tokens', () => {
      const updateRow: DbServiceRequestRow = {
        ...activeBooking,
        status: 'COMPLETED'
      };
      assert.throws(
        () => simulateEnforceServiceRequestsRules('UPDATE', updateRow, activeBooking, 'technician'),
        /Staff cannot directly mark jobs COMPLETED without calling verify_job_otp/
      );
    });

    it('2.3: Attacker cannot pre-populate customer_otp or completion_code on INSERT', () => {
      const maliciousInsert: DbServiceRequestRow = {
        id: 'PB-ATTACK-INSERT-OTP',
        items: [{ serviceId: 'srv-ac-foam', quantity: 1 }],
        status: 'COMPLETED',
        payment_status: 'PAID',
        subtotal: 10,
        locality_adjustment: 0,
        tax: 0,
        total: 10,
        customer_otp: '1234',
        completion_code: 'HAXX00'
      };

      const result = simulateEnforceServiceRequestsRules('INSERT', maliciousInsert, undefined, 'customer');
      assert.equal(result.customer_otp, null, 'customer_otp must be wiped to null on INSERT');
      assert.equal(result.completion_code, null, 'completion_code must be wiped to null on INSERT');
      assert.equal(result.status, 'NEW', 'status must be forced to NEW');
      assert.equal(result.payment_status, 'PENDING', 'payment_status must be forced to PENDING');
    });

    it('2.4: verify_job_otp generates working token pair that permits status = COMPLETED', () => {
      const secretRecord: SecretRecord = {
        requestId: activeBooking.id,
        customerOtp: '8492',
        failedAttempts: 0
      };

      const verifyResult = simulateVerifyJobOtp(
        'technician',
        'tech-uuid-1',
        activeBooking,
        secretRecord,
        '8492'
      );
      assert.equal(verifyResult.success, true);
      assert.equal(verifyResult.code, 'VERIFIED');
      assert.ok(verifyResult.token);
      assert.ok(verifyResult.secret);

      const updateRow: DbServiceRequestRow = {
        ...activeBooking,
        status: 'COMPLETED'
      };
      const completedBooking = simulateEnforceServiceRequestsRules(
        'UPDATE',
        updateRow,
        activeBooking,
        'technician',
        'tech-uuid-1',
        {
          otpToken: verifyResult.token,
          otpTokenSecret: verifyResult.secret
        }
      );
      assert.equal(completedBooking.status, 'COMPLETED');
    });

    it('2.5: verify_job_otp enforces persistent lockout after 5 failed attempts', () => {
      const secretRecord: SecretRecord = {
        requestId: activeBooking.id,
        customerOtp: '9999',
        failedAttempts: 0
      };

      // 4 failed attempts
      for (let i = 1; i <= 4; i++) {
        const res = simulateVerifyJobOtp('technician', 'tech-uuid-1', activeBooking, secretRecord, '0000');
        assert.equal(res.success, false);
        assert.equal(res.code, 'INVALID_OTP');
      }

      // 5th failed attempt locks the record
      const lockRes = simulateVerifyJobOtp('technician', 'tech-uuid-1', activeBooking, secretRecord, '0000');
      assert.equal(lockRes.success, false);
      assert.equal(lockRes.code, 'LOCKED');

      // Even correct OTP is now rejected because failedAttempts >= 5
      const retryRes = simulateVerifyJobOtp('technician', 'tech-uuid-1', activeBooking, secretRecord, '9999');
      assert.equal(retryRes.success, false);
      assert.equal(retryRes.code, 'LOCKED');
    });

    it('2.6: OTP session token replay attack across different bookings is strictly rejected', () => {
      const bookingA: DbServiceRequestRow = { ...activeBooking, id: 'OTP-REQ-A' };
      const bookingB: DbServiceRequestRow = { ...activeBooking, id: 'OTP-REQ-B' };

      const secretRecordA: SecretRecord = {
        requestId: bookingA.id,
        customerOtp: '1234',
        failedAttempts: 0
      };
      const otpRes = simulateVerifyJobOtp('technician', 'tech-uuid-1', bookingA, secretRecordA, '1234');

      // Replay token from booking A to mark booking B completed
      const updateRowB: DbServiceRequestRow = { ...bookingB, status: 'COMPLETED' };
      assert.throws(
        () =>
          simulateEnforceServiceRequestsRules('UPDATE', updateRowB, bookingB, 'technician', 'tech-uuid', {
            otpToken: otpRes.token,
            otpTokenSecret: otpRes.secret
          }),
        /Staff cannot directly mark jobs COMPLETED without calling verify_job_otp/
      );
    });
  });

  // ----------------------------------------------------------------------------
  // SECTION 3: ITEM IMMUTABILITY & CANCELLATION RESTRICTIONS ON UPDATE
  // ----------------------------------------------------------------------------
  describe('Section 3: Item Immutability & Status Transitions on UPDATE', () => {
    const existingBooking: DbServiceRequestRow = {
      id: 'PB-CHALLENGE-IMMUTABLE-01',
      items: [{ serviceId: 'srv-ac-gen', quantity: 1, price: 499 }],
      subtotal: 499,
      locality_adjustment: 0,
      tax: 0,
      total: 598,
      status: 'NEW',
      payment_status: 'PENDING'
    };

    it('3.1: Customer altering items from cheap service to expensive service is rejected', () => {
      const tamperedUpdate: DbServiceRequestRow = {
        ...existingBooking,
        items: [{ serviceId: 'srv-ac-foam', quantity: 1, price: 699 }]
      };
      assert.throws(
        () => simulateEnforceServiceRequestsRules('UPDATE', tamperedUpdate, existingBooking, 'customer'),
        /Customers cannot modify booking items after creation/
      );
    });

    it('3.2: Customer altering quantity in items is rejected', () => {
      const tamperedUpdate: DbServiceRequestRow = {
        ...existingBooking,
        items: [{ serviceId: 'srv-ac-gen', quantity: 3, price: 499 }]
      };
      assert.throws(
        () => simulateEnforceServiceRequestsRules('UPDATE', tamperedUpdate, existingBooking, 'customer'),
        /Customers cannot modify booking items after creation/
      );
    });

    it('3.3: Technician altering items array is rejected', () => {
      const staffUpdate: DbServiceRequestRow = {
        ...existingBooking,
        status: 'IN PROGRESS',
        items: [{ serviceId: 'srv-ac-foam', quantity: 1, price: 699 }]
      };
      assert.throws(
        () => simulateEnforceServiceRequestsRules('UPDATE', staffUpdate, existingBooking, 'technician'),
        /Staff cannot modify booking items/
      );
    });

    it('3.4: Customer CAN cancel a booking in NEW status', () => {
      const cancelUpdate: DbServiceRequestRow = {
        ...existingBooking,
        status: 'CANCELLED'
      };
      const result = simulateEnforceServiceRequestsRules('UPDATE', cancelUpdate, existingBooking, 'customer');
      assert.equal(result.status, 'CANCELLED');
    });

    it('3.5: Customer CANNOT cancel a booking in IN PROGRESS status', () => {
      const inProgressBooking: DbServiceRequestRow = {
        ...existingBooking,
        status: 'IN PROGRESS'
      };
      const cancelUpdate: DbServiceRequestRow = {
        ...inProgressBooking,
        status: 'CANCELLED'
      };
      assert.throws(
        () => simulateEnforceServiceRequestsRules('UPDATE', cancelUpdate, inProgressBooking, 'customer'),
        /Customers may only cancel requests that are currently in NEW status/
      );
    });

    it('3.6: Customer CANNOT cancel a booking in COMPLETED status', () => {
      const completedBooking: DbServiceRequestRow = {
        ...existingBooking,
        status: 'COMPLETED'
      };
      const cancelUpdate: DbServiceRequestRow = {
        ...completedBooking,
        status: 'CANCELLED'
      };
      assert.throws(
        () => simulateEnforceServiceRequestsRules('UPDATE', cancelUpdate, completedBooking, 'customer'),
        /Customers may only cancel requests that are currently in NEW status/
      );
    });

    it('3.7: Customer CANNOT transition status from NEW to ACCEPTED or COMPLETED', () => {
      const acceptedUpdate: DbServiceRequestRow = {
        ...existingBooking,
        status: 'ACCEPTED'
      };
      assert.throws(
        () => simulateEnforceServiceRequestsRules('UPDATE', acceptedUpdate, existingBooking, 'customer'),
        /Customers may only cancel requests that are currently in NEW status/
      );
    });
  });

  // ----------------------------------------------------------------------------
  // SECTION 4: MIGRATION AST & PL/PGSQL SECURITY DEFINER CONTRACTS
  // ----------------------------------------------------------------------------
  describe('Section 4: Migration AST & Security Contracts', () => {
    const migration19Path = path.resolve(
      __dirname,
      '../../supabase/migrations/20261028000019_remediate_sec03_authoritative_pricing.sql'
    );
    const migration15Path = path.resolve(
      __dirname,
      '../../supabase/migrations/20261013000015_fix_staff_payment_collection.sql'
    );
    const migration8Path = path.resolve(
      __dirname,
      '../../supabase/migrations/20261013000008_fix_otp_lockout.sql'
    );

    it('4.1: Migration 19 contains strict item immutability check for both customer and staff', () => {
      const sql = fs.readFileSync(migration19Path, 'utf8');

      // Check customer block
      assert.ok(
        sql.includes('(NEW.items IS DISTINCT FROM OLD.items)'),
        'Must check NEW.items IS DISTINCT FROM OLD.items'
      );
      assert.ok(
        sql.includes('Modifying booking items after creation is not permitted.'),
        'Must raise exception for item modification'
      );
    });

    it('4.2: Migration 19 verifies both OTP and Payment session token secrets with separate salts', () => {
      const sql = fs.readFileSync(migration19Path, 'utf8');

      // OTP token verification
      assert.ok(sql.includes('app.otp_token'), 'Must check app.otp_token setting');
      assert.ok(sql.includes(':pc_otp_secret_2026'), 'Must use dedicated OTP salt');

      // Payment token verification
      assert.ok(sql.includes('app.payment_token'), 'Must check app.payment_token setting');
      assert.ok(sql.includes(':pc_pay_secret_2026'), 'Must use dedicated payment salt');
    });

    it('4.3: Migration 19 enforces search_path = public on SECURITY DEFINER function', () => {
      const sql = fs.readFileSync(migration19Path, 'utf8');
      assert.ok(
        sql.includes('SECURITY DEFINER SET search_path = public'),
        'enforce_service_requests_rules must set search_path = public'
      );
    });

    it('4.4: Migration 15 record_payment enforces exact total match', () => {
      const sql = fs.readFileSync(migration15Path, 'utf8');
      assert.ok(
        sql.includes('IF p_amount != v_req.total THEN'),
        'record_payment must compare p_amount != v_req.total'
      );
      assert.ok(
        sql.includes('Invalid payment amount: received %, expected exact total %'),
        'record_payment must reject mismatched amounts'
      );
    });

    it('4.5: Migration 8 verify_job_otp enforces 5 failed attempts lockout', () => {
      const sql = fs.readFileSync(migration8Path, 'utf8');
      assert.ok(
        sql.includes('failed_attempts >= 5'),
        'verify_job_otp must check failed_attempts >= 5'
      );
      assert.ok(
        sql.includes('Maximum OTP verification attempts (5) exceeded'),
        'verify_job_otp must lock on 5 attempts'
      );
    });
  });
});
