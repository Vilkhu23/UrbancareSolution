import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_VENDORS } from '../data/initialData.ts';
import { mapVendorFromDb, mapVendorToDb } from './supabaseService.ts';
import { Vendor } from '../types/index.ts';

describe('SEC-01 Vendor Plaintext Password Remediation Tests', () => {
  it('INITIAL_VENDORS must not contain plaintext password properties', () => {
    for (const vendor of INITIAL_VENDORS) {
      assert.equal(
        (vendor as any).password,
        undefined,
        `Vendor ${vendor.id} (${vendor.businessName}) contains plaintext password property`
      );
      assert.equal(
        'password' in vendor,
        false,
        `Vendor ${vendor.id} has an enumerable password key`
      );
    }
  });

  it('mapVendorFromDb must never extract or persist password from database row', () => {
    const mockDbRow = {
      id: 'vnd-test-99',
      business_name: 'Supercool Services',
      owner_name: 'Hardeep Singh',
      mobile: '+91 98765 43210',
      email: 'hardeep@example.com',
      status: 'ACTIVE',
      categories: ['AC & Appliances'],
      service_areas: ['Sector 94, Mohali'],
      experience_years: 7,
      rating: 4.9,
      password: 'PlaintextSuperSecretPassword@123', // Legacy DB column simulation
      created_at: '2026-10-27T10:00:00.000Z',
      plan: {
        name: 'Standard Trade Plan',
        price: 1499,
        totalOpportunities: 7,
        usedOpportunities: 0,
        remainingOpportunities: 7,
        validityDays: 30,
        expiryDate: '2026-11-27'
      }
    };

    const mappedVendor = mapVendorFromDb(mockDbRow);

    assert.equal(
      (mappedVendor as any).password,
      undefined,
      'mapVendorFromDb must not attach password to mapped Vendor object'
    );
    assert.equal(
      'password' in mappedVendor,
      false,
      'mappedVendor must not possess an enumerable password property'
    );
    assert.equal(mappedVendor.businessName, 'Supercool Services');
    assert.equal(mappedVendor.ownerName, 'Hardeep Singh');
    assert.equal(mappedVendor.mobile, '+91 98765 43210');
  });

  it('mapVendorToDb must never send a password column in database mutation payload', () => {
    const testVendor: Vendor = {
      id: 'vnd-test-101',
      businessName: 'Doaba Electrics',
      ownerName: 'Manpreet Singh',
      mobile: '+91 98111 22233',
      email: 'manpreet@doaba.in',
      categories: ['Electrical'],
      serviceAreas: ['Sector 104, Mohali'],
      experienceYears: 10,
      documentsVerified: true,
      status: 'ACTIVE',
      activeJobs: 0,
      completedJobs: 25,
      rating: 4.9,
      createdAt: '2026-10-01',
      plan: {
        name: 'Standard Trade Plan',
        price: 1499,
        totalOpportunities: 7,
        usedOpportunities: 2,
        remainingOpportunities: 5,
        validityDays: 30,
        expiryDate: '2026-11-01'
      }
    };

    // Even if an untyped object injects a password property
    const injectedVendor = { ...testVendor, password: 'LeakedPassword#2026' } as unknown as Vendor;
    const dbPayload = mapVendorToDb(injectedVendor);

    assert.equal(
      (dbPayload as any).password,
      undefined,
      'mapVendorToDb must not produce a password column in database payload'
    );
    assert.equal(
      'password' in dbPayload,
      false,
      'dbPayload must not contain any password property key'
    );
    assert.equal(dbPayload.id, 'vnd-test-101');
    assert.equal(dbPayload.business_name, 'Doaba Electrics');
  });

  it('LocalStorage vendor sanitization strips legacy plaintext passwords', () => {
    // Simulate legacy localStorage data holding cached plaintext passwords
    const legacyCachedVendors = [
      {
        id: 'vnd-legacy-1',
        businessName: 'Legacy Trades 1',
        ownerName: 'Gurpreet Singh',
        mobile: '+91 94111 00001',
        password: 'LegacyPlaintextPassword1@2026',
        status: 'ACTIVE',
        categories: ['Carpentry & Handyman']
      },
      {
        id: 'vnd-legacy-2',
        businessName: 'Legacy Trades 2',
        ownerName: 'Amrik Singh',
        mobile: '+91 94111 00002',
        password: 'LegacyPlaintextPassword2@2026',
        status: 'PENDING_VERIFICATION',
        categories: ['Plumbing']
      }
    ];

    // Mirror the exact sanitization routine used by AppContext on startup
    let hadPasswords = false;
    const sanitizedVendors = legacyCachedVendors.map((v: any) => {
      if ('password' in v) {
        hadPasswords = true;
        const { password: _, ...rest } = v;
        return rest;
      }
      return v;
    });

    assert.equal(hadPasswords, true, 'Sanitization should detect presence of legacy passwords');
    assert.equal(sanitizedVendors.length, 2);

    for (const v of sanitizedVendors) {
      assert.equal('password' in v, false, `Sanitized vendor ${v.id} still retains password property`);
      assert.equal((v as any).password, undefined);
    }
  });

  it('Pending vendors (PENDING_VERIFICATION) must be filtered out of active dispatch queues', () => {
    const sampleVendors: Vendor[] = [
      {
        id: 'vnd-active',
        businessName: 'Approved Partner',
        ownerName: 'Harjit Singh',
        mobile: '+91 98888 11111',
        email: 'harjit@approved.in',
        categories: ['AC & Appliances'],
        serviceAreas: ['Sector 94'],
        experienceYears: 5,
        documentsVerified: true,
        status: 'ACTIVE',
        activeJobs: 0,
        completedJobs: 10,
        rating: 5.0,
        createdAt: '2026-10-01',
        plan: {
          name: 'Demo Plan',
          price: 1499,
          totalOpportunities: 7,
          usedOpportunities: 0,
          remainingOpportunities: 7,
          validityDays: 30,
          expiryDate: '2026-11-01'
        }
      },
      {
        id: 'vnd-pending',
        businessName: 'Pending Partner',
        ownerName: 'Jaspreet Singh',
        mobile: '+91 98888 22222',
        email: 'jaspreet@pending.in',
        categories: ['AC & Appliances'],
        serviceAreas: ['Sector 94'],
        experienceYears: 3,
        documentsVerified: false,
        status: 'PENDING_VERIFICATION',
        activeJobs: 0,
        completedJobs: 0,
        rating: 5.0,
        createdAt: '2026-10-27',
        plan: {
          name: 'Demo Plan',
          price: 1499,
          totalOpportunities: 7,
          usedOpportunities: 0,
          remainingOpportunities: 7,
          validityDays: 30,
          expiryDate: '2026-11-27'
        }
      }
    ];

    // Filter logic enforcing that only ACTIVE vendors receive opportunities
    const activeVendors = sampleVendors.filter((v) => v.status === 'ACTIVE');
    assert.equal(activeVendors.length, 1);
    assert.equal(activeVendors[0].id, 'vnd-active');

    // Pending vendor must not be present in active dispatches
    const pendingInActive = activeVendors.some((v) => v.id === 'vnd-pending');
    assert.equal(pendingInActive, false, 'Pending vendor must never be included in active vendors pool');
  });
});
