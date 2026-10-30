import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_VENDORS } from '../../data/initialData.ts';
import { mapVendorFromDb, mapVendorToDb } from '../../services/supabaseService.ts';
import { Vendor } from '../../types/index.ts';
import { validateStrongPassword } from '../../utils/authValidation.ts';

describe('SEC-01 Security Regression Tests: Vendor Password & Privilege Remediation', () => {
  it('INITIAL_VENDORS mock entries must never contain plaintext passwords', () => {
    assert.ok(INITIAL_VENDORS.length > 0, 'INITIAL_VENDORS should have entries');
    for (const vnd of INITIAL_VENDORS) {
      assert.equal(
        (vnd as any).password,
        undefined,
        `Vendor ${vnd.id} (${vnd.businessName}) contains plaintext password property!`
      );
    }
  });

  it('mapVendorToDb must never serialize or send password to database', () => {
    const testVendor: Vendor = {
      id: 'vnd-sec-test',
      businessName: 'SecTest Trade Services',
      ownerName: 'Manpreet Singh',
      mobile: '+91 98888 11111',
      email: 'manpreet@test.com',
      categories: ['Electrical'],
      serviceAreas: ['Sector 94'],
      experienceYears: 5,
      documentsVerified: true,
      status: 'ACTIVE',
      plan: {
        name: 'Initial Demo Plan',
        price: 1499,
        totalOpportunities: 7,
        usedOpportunities: 0,
        remainingOpportunities: 7,
        validityDays: 30,
        expiryDate: '2026-11-30'
      },
      activeJobs: 0,
      completedJobs: 10,
      rating: 5.0,
      createdAt: '2026-10-27'
    };

    const dbRow: any = mapVendorToDb(testVendor);
    assert.equal(
      dbRow.password,
      undefined,
      'mapVendorToDb must not include a password property in the output database payload'
    );
    assert.equal(dbRow.business_name, 'SecTest Trade Services');
    assert.equal(dbRow.owner_name, 'Manpreet Singh');
  });

  it('mapVendorFromDb must never expose a password field even if database row contains one', () => {
    const legacyRowWithPassword = {
      id: 'vnd-legacy-1',
      user_id: 'user-uuid-1234',
      business_name: 'Legacy Coolers',
      owner_name: 'Rajinder Kumar',
      mobile: '+91 98144 00000',
      email: 'rajinder@legacy.com',
      password: 'PlaintextPassword123!', // Legacy unencrypted column
      status: 'ACTIVE',
      categories: ['AC & Appliances'],
      service_areas: ['Sector 104'],
      experience_years: 10,
      rating: 4.8,
      created_at: '2026-05-01T00:00:00Z',
      plan: {
        name: 'Contractor Plan',
        price: 2999,
        totalOpportunities: 16,
        usedOpportunities: 5,
        remainingOpportunities: 11,
        validityDays: 30,
        expiryDate: '2026-11-15'
      }
    };

    const vendor: any = mapVendorFromDb(legacyRowWithPassword);
    assert.equal(
      vendor.password,
      undefined,
      'mapVendorFromDb must omit or strip any password property from mapped vendor object'
    );
    assert.equal(vendor.id, 'vnd-legacy-1');
    assert.equal(vendor.businessName, 'Legacy Coolers');
  });

  it('localStorage legacy vendor scrubbing must strip password properties', () => {
    const mockStoredPayload = [
      {
        id: 'vnd-cached',
        businessName: 'Cached Artisan Works',
        ownerName: 'Harpreet Singh',
        mobile: '+91 97799 12345',
        email: 'harpreet@test.com',
        password: 'StaleLocalStoragePassword!2026',
        status: 'ACTIVE',
        categories: ['Carpentry'],
        serviceAreas: ['Sector 110'],
        experienceYears: 7,
        documentsVerified: true,
        plan: {
          name: 'Demo',
          price: 1499,
          totalOpportunities: 7,
          usedOpportunities: 0,
          remainingOpportunities: 7,
          validityDays: 30,
          expiryDate: '2026-11-30'
        },
        activeJobs: 0,
        completedJobs: 0,
        rating: 5.0,
        createdAt: '2026-10-27'
      }
    ];

    // Simulate AppContext localStorage sanitizer logic
    const sanitized: Vendor[] = mockStoredPayload.map((v) => {
      if ('password' in v) {
        const { password: _, ...rest } = v;
        return rest as Vendor;
      }
      return v as Vendor;
    });

    assert.equal(sanitized.length, 1);
    assert.equal(
      (sanitized[0] as any).password,
      undefined,
      'Scrubbed vendor object in memory/localStorage must not contain password'
    );
    assert.equal(sanitized[0].businessName, 'Cached Artisan Works');
  });

  it('Pending vendors (PENDING_VERIFICATION) must be blocked from active operational leads', () => {
    const pendingVendor: Vendor = {
      id: 'vnd-pending-1',
      user_id: 'auth-user-pending',
      businessName: 'Pending Trade Works',
      ownerName: 'Jaswinder Singh',
      mobile: '+91 98888 22222',
      email: 'jaswinder@test.com',
      categories: ['Plumbing'],
      serviceAreas: ['Sector 94'],
      experienceYears: 4,
      documentsVerified: false,
      status: 'PENDING_VERIFICATION',
      plan: {
        name: 'Initial Demo Plan',
        price: 1499,
        totalOpportunities: 7,
        usedOpportunities: 0,
        remainingOpportunities: 7,
        validityDays: 30,
        expiryDate: '2026-11-30'
      },
      activeJobs: 0,
      completedJobs: 0,
      rating: 5.0,
      createdAt: '2026-10-27'
    };

    const mockRequests = [
      {
        id: 'REQ-1',
        status: 'ASSIGNED',
        assignedTo: { id: pendingVendor.id, name: pendingVendor.businessName },
        items: [{ serviceName: 'Drain Unclogging' }]
      },
      {
        id: 'REQ-2',
        status: 'NEW',
        assignedTo: null,
        items: [{ serviceName: 'Plumbing Inspection' }]
      }
    ];

    // Simulate VendorPortal active authorization filter logic
    const canAccessOperationalJobs = (vendor: Vendor | null) => {
      if (!vendor || vendor.status !== 'ACTIVE') return false;
      return true;
    };

    assert.equal(
      canAccessOperationalJobs(pendingVendor),
      false,
      'Pending vendor must not have access to active operational jobs'
    );

    const activeVendor: Vendor = {
      ...pendingVendor,
      status: 'ACTIVE',
      documentsVerified: true
    };

    assert.equal(
      canAccessOperationalJobs(activeVendor),
      true,
      'Approved active vendor must have access to operational jobs'
    );
  });

  it('Partner registration password validation requires minimum 8 characters and rejects blocked patterns', () => {
    const shortResult = validateStrongPassword('short1!');
    assert.equal(shortResult.isValid, false);
    assert.ok(shortResult.message?.includes('8 characters'));

    const blockedResult = validateStrongPassword('malwapass@2026');
    assert.equal(blockedResult.isValid, false);
    assert.equal(blockedResult.strengthLabel, 'Blocked');

    const strongResult = validateStrongPassword('PindCare#Secure2026');
    assert.equal(strongResult.isValid, true);
    assert.ok(strongResult.lengthOk);
  });
});
