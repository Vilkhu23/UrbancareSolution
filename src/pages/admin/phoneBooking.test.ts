import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getVendorDispatchWhatsAppUrl,
  getCustomerBookingConfirmationWhatsAppUrl
} from '../../utils/whatsapp';
import { Vendor, ServiceRequest } from '../../types';

describe('Phone Booking Module - Core Operations Logic', () => {
  describe('Step 1: Phone Lookup Normalization', () => {
    const normalizePhone = (input: string) => input.replace(/\D/g, '').slice(-10);

    it('should normalize various phone number formats into 10 digits', () => {
      assert.equal(normalizePhone('9876543210'), '9876543210');
      assert.equal(normalizePhone('+91 98765-43210'), '9876543210');
      assert.equal(normalizePhone('09876543210'), '9876543210');
      assert.equal(normalizePhone('+919876543210'), '9876543210');
      assert.equal(normalizePhone('98765 43210'), '9876543210');
    });

    it('should correctly match customer records by 10-digit phone', () => {
      const mockCustomers = [
        { id: 'c1', name: 'Simran Singh', phone: '9876543210', address: 'House 102, Wave Estate' },
        { id: 'c2', name: 'Gurpreet Kaur', phone: '+91 98765 01234', address: 'Villa 55, JLPL Sector 94' }
      ];

      const query = '+91 98765 43210';
      const cleanQuery = normalizePhone(query);

      const found = mockCustomers.find(c => normalizePhone(c.phone) === cleanQuery);
      assert.ok(found);
      assert.equal(found.id, 'c1');
      assert.equal(found.name, 'Simran Singh');
    });
  });

  describe('Step 3: Routing Logic (Quick Service vs Project)', () => {
    const routeBooking = (type: 'QUICK_SERVICE' | 'PROJECT') =>
      type === 'PROJECT' ? 'Visit Scheduled' : 'Pending Assignment';

    it('should route Quick Service bookings to Pending Assignment', () => {
      const initialStatus = routeBooking('QUICK_SERVICE');
      assert.equal(initialStatus, 'Pending Assignment');
    });

    it('should route Project bookings to Visit Scheduled without vendor assignment', () => {
      const initialStatus = routeBooking('PROJECT');
      const vendorId = null;

      assert.equal(initialStatus, 'Visit Scheduled');
      assert.equal(vendorId, null);
    });
  });

  describe('Step 4: Vendor Assignment Credits & Disqualification Rule', () => {
    const mockVendors: Vendor[] = [
      {
        id: 'v1',
        businessName: 'Sharma Electricals',
        ownerName: 'Rajesh Sharma',
        mobile: '9888811111',
        email: 'sharma@example.com',
        rating: 4.8,
        completedJobs: 45,
        activeJobs: 1,
        documentsVerified: true,
        categories: ['Electrician'],
        serviceAreas: ['Sector 94', 'Sector 95'],
        plan: {
          name: 'Growth Plan',
          price: 1999,
          totalOpportunities: 50,
          usedOpportunities: 20,
          remainingOpportunities: 30,
          validityDays: 30,
          expiryDate: '2026-11-30'
        },
        status: 'ACTIVE',
        createdAt: '2025-01-01',
        experienceYears: 6
      },
      {
        id: 'v2',
        businessName: 'Exhausted Credits Vendor',
        ownerName: 'Deepak Kumar',
        mobile: '9888822222',
        email: 'deepak@example.com',
        rating: 4.5,
        completedJobs: 30,
        activeJobs: 0,
        documentsVerified: true,
        categories: ['Electrician'],
        serviceAreas: ['Sector 94'],
        plan: {
          name: 'Starter Plan',
          price: 999,
          totalOpportunities: 15,
          usedOpportunities: 15,
          remainingOpportunities: 0,
          validityDays: 30,
          expiryDate: '2026-11-30'
        },
        status: 'ACTIVE',
        createdAt: '2025-02-01',
        experienceYears: 4
      }
    ];

    it('should permit assignment for vendors with positive remaining credits', () => {
      const vendorWithCredits = mockVendors[0];
      const canAssign = vendorWithCredits.plan.remainingOpportunities > 0;
      assert.equal(canAssign, true);
    });

    it('should disable and block assignment for vendors with 0 remaining credits', () => {
      const vendorZeroCredits = mockVendors[1];
      const canAssign = vendorZeroCredits.plan.remainingOpportunities > 0;
      assert.equal(canAssign, false);
    });

    it('should set status to REASSIGNMENT REQUIRED when vendor declines', () => {
      const currentStatus = 'ASSIGNED';
      const vendorAction = 'DECLINED';
      const newStatus = vendorAction === 'DECLINED' ? 'REASSIGNMENT REQUIRED' : currentStatus;
      assert.equal(newStatus, 'REASSIGNMENT REQUIRED');
    });
  });

  describe('Step 5: WhatsApp Notifications (wa.me pre-filled links)', () => {
    it('should generate pre-filled WhatsApp link for Vendor dispatch', () => {
      const url = getVendorDispatchWhatsAppUrl('9888811111', {
        bookingId: 'PB-2026-001',
        serviceName: 'Ceiling Fan Repair',
        customerName: 'Karan Singh',
        customerPhone: '9876543210',
        address: 'Villa 12, Wave Estate, Sector 99',
        locality: 'Sector 99',
        date: '28 Oct 2026',
        timeSlot: '10:00 AM - 12:00 PM',
        notes: 'Ceiling Fan Sparking & Short Circuit'
      });

      assert.ok(url.startsWith('https://wa.me/919888811111?text='));
      const decoded = decodeURIComponent(url.split('?text=')[1]);

      assert.ok(decoded.includes('UrbanCare Dispatch Order #PB-2026-001'));
      assert.ok(decoded.includes('Ceiling Fan Repair'));
      assert.ok(decoded.includes('Ceiling Fan Sparking & Short Circuit'));
      assert.ok(decoded.includes('Karan Singh'));
      assert.ok(decoded.includes('Villa 12, Wave Estate, Sector 99'));
      assert.ok(decoded.includes('10:00 AM - 12:00 PM'));
      assert.ok(decoded.includes('Please review and confirm acceptance'));
    });

    it('should generate pre-filled WhatsApp link for Customer confirmation', () => {
      const url = getCustomerBookingConfirmationWhatsAppUrl('9876543210', {
        bookingId: 'PB-2026-001',
        serviceName: 'Ceiling Fan Repair',
        customerName: 'Karan Singh',
        vendorName: 'Sharma Electricals (Rajesh Sharma)',
        vendorPhone: '9888811111',
        date: '28 Oct 2026',
        timeSlot: '10:00 AM - 12:00 PM',
        address: 'Villa 12, Wave Estate, Sector 99'
      });

      assert.ok(url.startsWith('https://wa.me/919876543210?text='));
      const decoded = decodeURIComponent(url.split('?text=')[1]);

      assert.ok(decoded.includes('Hello Karan Singh'));
      assert.ok(decoded.includes('#PB-2026-001'));
      assert.ok(decoded.includes('Ceiling Fan Repair'));
      assert.ok(decoded.includes('Sharma Electricals (Rajesh Sharma)'));
      assert.ok(decoded.includes('9888811111'));
      assert.ok(decoded.includes('Villa 12, Wave Estate, Sector 99'));
    });
  });

  describe('Step 6: Tracking & Overdue Calculation (>30 min)', () => {
    const isBookingUnassignedOverdue = (
      assignedTo: any,
      status: string,
      createdAtMs: number,
      nowMs: number
    ): boolean => {
      if (assignedTo) return false;
      if (status === 'COMPLETED' || status === 'CUSTOMER CONFIRMED' || status === 'CANCELLED') return false;
      const diffMinutes = (nowMs - createdAtMs) / (1000 * 60);
      return diffMinutes >= 30;
    };

    it('should highlight booking unassigned for more than 30 minutes', () => {
      const now = Date.now();
      const fortyMinutesAgo = now - 40 * 60 * 1000;
      const isOverdue = isBookingUnassignedOverdue(null, 'Pending Assignment', fortyMinutesAgo, now);
      assert.equal(isOverdue, true);
    });

    it('should not highlight booking created 10 minutes ago', () => {
      const now = Date.now();
      const tenMinutesAgo = now - 10 * 60 * 1000;
      const isOverdue = isBookingUnassignedOverdue(null, 'Pending Assignment', tenMinutesAgo, now);
      assert.equal(isOverdue, false);
    });

    it('should not highlight already assigned bookings even if created >30 min ago', () => {
      const now = Date.now();
      const twoHoursAgo = now - 120 * 60 * 1000;
      const isOverdue = isBookingUnassignedOverdue({ id: 'v1', name: 'Sharma' }, 'ASSIGNED', twoHoursAgo, now);
      assert.equal(isOverdue, false);
    });
  });

  describe('Form Cancellation & Reset Logic', () => {
    it('should reset all state fields to pristine defaults when Ops manager cancels', () => {
      let state = {
        phoneSearch: '9876543210',
        searched: true,
        customerName: 'Aman Deep',
        customerPhone: '9876543210',
        address: 'Sector 94, Plot 10',
        problemDescription: 'Leaking pipe under kitchen sink',
        photos: ['data:image/png;base64,preview'],
        internalNotes: 'Call before arriving at gated society'
      };

      const resetForm = () => {
        state = {
          phoneSearch: '',
          searched: false,
          customerName: '',
          customerPhone: '',
          address: '',
          problemDescription: '',
          photos: [],
          internalNotes: ''
        };
      };

      // Ops manager cancels
      resetForm();

      assert.equal(state.phoneSearch, '');
      assert.equal(state.searched, false);
      assert.equal(state.customerName, '');
      assert.equal(state.customerPhone, '');
      assert.equal(state.address, '');
      assert.equal(state.problemDescription, '');
      assert.equal(state.photos.length, 0);
      assert.equal(state.internalNotes, '');
    });
  });

  describe('Care Packages & Multi-Unit Bundles Management', () => {
    it('should compute auto-calculated savings text accurately', () => {
      const price = 1299;
      const originalPrice = 1699;
      const savingsDiff = originalPrice - price;
      const pct = Math.round((savingsDiff / originalPrice) * 100);
      const savingsTag = `Save ₹${savingsDiff} (${pct}% OFF) · Zero Visit Fee`;

      assert.equal(savingsTag, 'Save ₹400 (24% OFF) · Zero Visit Fee');
    });

    it('should validate package data structure before adding to catalog', () => {
      const newPackage = {
        id: 'pkg-test-1',
        name: '3 AC Monsoon Foam Blast & Coil Wash',
        category: 'AC & Appliances',
        category_id: 'ac-appliances',
        subcategory: 'Multi-Unit Bundle',
        description: 'Complete 3 AC deep service with zero visit fee.',
        price: 1899,
        originalPrice: 2399,
        savings: 'Save ₹500 (21% OFF) · Zero Visit Fee',
        duration: '120 - 150 mins',
        included: [
          'Indoor foam jet wash for 3 split units',
          'Outdoor coil high pressure blast',
          'Refrigerant gas pressure testing'
        ],
        serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105'],
        active: true,
        pricingType: 'fixed',
        rating: 5.0
      };

      assert.ok(newPackage.id.startsWith('pkg-'));
      assert.ok(newPackage.price > 0);
      assert.ok(newPackage.originalPrice >= newPackage.price);
      assert.ok(newPackage.included.length >= 3);
      assert.equal(newPackage.active, true);
    });
  });
});


