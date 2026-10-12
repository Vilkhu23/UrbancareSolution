import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  CustomerRecord,
  Employee,
  Vendor,
  ServiceRequest,
  OpportunityLedgerEntry,
  ComplaintRecord,
  PaymentRecord,
  AuditLog,
  OpsSettings,
  HomeProjectRequest,
  CustomerReview
} from '../types';
import { LOCALITIES } from '../data/initialData';

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description?: string;
  display_order?: number;
}

// ==============================================================================
// 1. DATA MAPPERS (PostgreSQL snake_case <-> Application Domain Models)
// ==============================================================================

export const mapCustomerFromDb = (row: any): CustomerRecord => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  email: row.email || '',
  locality: row.locality,
  address: row.address,
  password: row.password || undefined,
  totalBookings: row.total_bookings || 0,
  totalSpent: Number(row.total_spent) || 0,
  registeredDate: row.registered_date || new Date().toISOString().split('T')[0],
  status: row.status || 'ACTIVE'
});

export const mapCustomerToDb = (cust: CustomerRecord) => ({
  id: cust.id,
  name: cust.name,
  phone: cust.phone,
  email: cust.email || null,
  locality: cust.locality,
  address: cust.address,
  password: cust.password || null,
  total_bookings: cust.totalBookings,
  total_spent: cust.totalSpent,
  registered_date: cust.registeredDate,
  status: cust.status
});

export const mapEmployeeFromDb = (row: any): Employee => ({
  id: row.id,
  employeeCode: row.employee_code,
  name: row.name,
  mobile: row.mobile,
  role: row.role || 'Staff Technician',
  status: row.status === 'TERMINATED' ? 'INACTIVE' : 'ACTIVE',
  availability: row.availability || 'AVAILABLE',
  skills: Array.isArray(row.skills) ? row.skills : [],
  categories: Array.isArray(row.skills) ? row.skills : [],
  serviceAreas: Array.isArray(row.service_areas) ? row.service_areas : [],
  activeJobs: 0,
  completedJobs: row.completed_jobs || 0,
  rating: Number(row.rating) || 4.9,
  joinedDate: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '2025-01-15',
  password: row.password || undefined
});

export const mapEmployeeToDb = (emp: Employee) => ({
  id: emp.id,
  employee_code: emp.employeeCode || emp.id,
  name: emp.name,
  mobile: emp.mobile,
  role: emp.role || 'Staff Technician',
  status: emp.status === 'INACTIVE' ? 'ON_LEAVE' : 'ACTIVE',
  availability: emp.availability,
  skills: emp.skills,
  service_areas: emp.serviceAreas,
  rating: emp.rating,
  completed_jobs: emp.completedJobs,
  password: emp.password || 'TechPass@101'
});

export const mapVendorFromDb = (row: any): Vendor => ({
  id: row.id,
  businessName: row.business_name,
  ownerName: row.owner_name,
  mobile: row.mobile,
  email: row.email || '',
  status: row.status || 'ACTIVE',
  categories: Array.isArray(row.categories) ? row.categories : [],
  serviceAreas: Array.isArray(row.service_areas) ? row.service_areas : [],
  experienceYears: row.experience_years || 5,
  documentsVerified: row.status === 'ACTIVE',
  activeJobs: 0,
  completedJobs: 0,
  rating: Number(row.rating) || 4.8,
  createdAt: row.created_at || new Date().toISOString(),
  plan: row.plan || {
    name: 'Standard Trade Plan',
    price: 1499,
    totalOpportunities: 7,
    usedOpportunities: 0,
    remainingOpportunities: 7,
    validityDays: 30,
    expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  },
  password: row.password || undefined
});

export const mapVendorToDb = (vnd: Vendor) => ({
  id: vnd.id,
  business_name: vnd.businessName,
  owner_name: vnd.ownerName,
  mobile: vnd.mobile,
  email: vnd.email || null,
  status: vnd.status,
  categories: vnd.categories,
  service_areas: vnd.serviceAreas,
  experience_years: vnd.experienceYears,
  rating: vnd.rating,
  plan: vnd.plan,
  password: vnd.password || 'MalwaPass@2026'
});

export const mapServiceRequestFromDb = (row: any): ServiceRequest => {
  const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    address: row.customer_address || 'Address provided on booking',
    locality: row.locality,
    requestType: 'STANDARD_SERVICE',
    items: Array.isArray(row.items) ? row.items : [],
    status: row.status,
    subtotal: Number(row.subtotal) || Number(row.total) || 0,
    visitFee: 99,
    total: Number(row.total) || 0,
    preferredDate: row.preferred_date || 'Today',
    preferredTimeSlot: row.preferred_slot || 'Immediate (Next 60 Mins)',
    paymentStatus: row.payment_status === 'PAID' ? 'PAID' : 'PENDING_ON_COMPLETION',
    paymentMode: row.payment_method === 'ONLINE' ? 'ONLINE' : row.payment_method === 'UPI' ? 'UPI' : 'CASH',
    assignedTo: row.assigned_to || null,
    notes: row.technician_notes || undefined,
    confirmedScheduleSlot: row.vendor_scheduled_time || undefined,
    vendorArrivalStatus: row.vendor_arrival_status === 'ARRIVED' ? 'ARRIVED' : 'NOT_ARRIVED',
    workStartedAt: row.work_started_at || undefined,
    completedAt: row.work_completed_at || undefined,
    problemPhotos: Array.isArray(row.before_work_photos) ? row.before_work_photos : undefined,
    completionPhotos: Array.isArray(row.completion_photos) ? row.completion_photos : undefined,
    statusHistory: [
      {
        status: row.status,
        timestamp: row.updated_at || row.created_at || now,
        updatedBy: 'Database Sync',
        note: `Current database state: ${row.status}`
      }
    ],
    assignmentHistory: [],
    createdAt: row.created_at ? new Date(row.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : now,
    updatedAt: row.updated_at ? new Date(row.updated_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : now
  };
};

export const mapServiceRequestToDb = (req: ServiceRequest) => ({
  id: req.id,
  customer_name: req.customerName,
  customer_phone: req.customerPhone,
  customer_address: req.address,
  locality: req.locality,
  items: req.items,
  status: req.status,
  preferred_date: req.preferredDate,
  preferred_slot: req.preferredTimeSlot,
  total: req.total,
  subtotal: req.subtotal,
  locality_adjustment: 0,
  tax: req.taxAmount || 0,
  payment_status: req.paymentStatus === 'PAID' ? 'PAID' : 'PENDING',
  payment_method: req.paymentMode || req.paymentCollectedMode || 'CASH',
  assigned_to: req.assignedTo || null,
  technician_notes: req.notes || req.materialInfo || null,
  vendor_scheduled_time: req.confirmedScheduleSlot || null,
  vendor_arrival_status: req.vendorArrivalStatus === 'ARRIVED' ? 'ARRIVED' : 'PENDING',
  work_started_at: req.workStartedAt ? new Date().toISOString() : null,
  work_completed_at: req.completedAt ? new Date().toISOString() : null,
  before_work_photos: req.problemPhotos || [],
  completion_photos: req.completionPhotos || [],
  completion_notes: req.materialInfo || null,
  completion_code: null,
  customer_otp: '4192'
});

// ==============================================================================
// 2. SUPABASE ASYNC CRUD METHODS (With Graceful Offline Fallbacks)
// ==============================================================================

/**
 * Loads all initial datasets from Supabase PostgreSQL tables.
 * Returns null if Supabase is not configured or an error occurs.
 */
export const loadAllDataFromSupabase = async () => {
  if (!isSupabaseConfigured()) return null;

  try {
    const [
      customersRes,
      employeesRes,
      vendorsRes,
      requestsRes,
      servicesRes,
      categoriesRes,
      ledgerRes,
      complaintsRes,
      paymentsRes,
      opsRes
    ] = await Promise.all([
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      supabase.from('employees').select('*').order('name'),
      supabase.from('vendors').select('*').order('business_name'),
      supabase.from('service_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('services').select('*').order('name'),
      supabase.from('service_categories').select('*').order('display_order'),
      supabase.from('opportunity_ledger').select('*').order('created_at', { ascending: false }),
      supabase.from('complaints').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
      supabase.from('ops_settings').select('*').limit(1).maybeSingle()
    ]);

    const mappedOpsSettings: OpsSettings | null = opsRes.data ? {
      dispatchCenterName: 'UrbanCare Operations Command - Kharar Hub',
      emergencyHotline: opsRes.data.emergency_contact || '+91 98889 00122',
      supportEmail: 'ops@urbancaresolution.in',
      password: opsRes.data.password || 'OpsLead@2026',
      defaultVisitFee: 99,
      defaultGstPercent: 18,
      requireSupervisorSignoff: true,
      autoSmsNotifications: true,
      serviceRadiusKm: Number(opsRes.data.dispatch_coverage_radius_km) || 12.5,
      operatingHours: '08:00 AM - 08:00 PM',
      activeLocalities: LOCALITIES
    } : null;

    return {
      customers: customersRes.data && customersRes.data.length > 0 ? customersRes.data.map(mapCustomerFromDb) : null,
      employees: employeesRes.data && employeesRes.data.length > 0 ? employeesRes.data.map(mapEmployeeFromDb) : null,
      vendors: vendorsRes.data && vendorsRes.data.length > 0 ? vendorsRes.data.map(mapVendorFromDb) : null,
      requests: requestsRes.data && requestsRes.data.length > 0 ? requestsRes.data.map(mapServiceRequestFromDb) : null,
      services: servicesRes.data || null,
      categories: categoriesRes.data || null,
      ledger: ledgerRes.data && ledgerRes.data.length > 0 ? ledgerRes.data.map((row: any) => ({
        id: row.id,
        vendorId: row.vendor_id,
        vendorName: row.vendor_name,
        action: row.action,
        change: -Number(row.opportunities_deducted || 1),
        balanceAfter: Number(row.remaining_balance || 0),
        reason: row.notes || 'Opportunity Dispatch Deducted',
        performedBy: 'Operations Dispatch Engine',
        timestamp: row.timestamp || new Date().toISOString(),
        serviceRequestId: row.request_id || undefined
      })) : null,
      complaints: complaintsRes.data || null,
      payments: paymentsRes.data || null,
      opsSettings: mappedOpsSettings
    };
  } catch (error) {
    console.warn('Supabase fetch failed, falling back to local storage:', error);
    return null;
  }
};

/**
 * Persists a customer into Supabase PostgreSQL.
 */
export const syncCustomerToSupabase = async (customer: CustomerRecord): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('customers')
      .upsert(mapCustomerToDb(customer), { onConflict: 'id' });
    if (error) console.error('Supabase customer upsert error:', error);
    return !error;
  } catch (err) {
    console.error('Failed to sync customer to Supabase:', err);
    return false;
  }
};

/**
 * Persists an employee (technician) into Supabase PostgreSQL.
 */
export const syncEmployeeToSupabase = async (employee: Employee): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('employees')
      .upsert(mapEmployeeToDb(employee), { onConflict: 'id' });
    if (error) console.error('Supabase employee upsert error:', error);
    return !error;
  } catch (err) {
    console.error('Failed to sync employee to Supabase:', err);
    return false;
  }
};

/**
 * Persists a trade vendor into Supabase PostgreSQL.
 */
export const syncVendorToSupabase = async (vendor: Vendor): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('vendors')
      .upsert(mapVendorToDb(vendor), { onConflict: 'id' });
    if (error) console.error('Supabase vendor upsert error:', error);
    return !error;
  } catch (err) {
    console.error('Failed to sync vendor to Supabase:', err);
    return false;
  }
};

/**
 * Persists a domestic service request / dispatch into Supabase PostgreSQL.
 */
export const syncServiceRequestToSupabase = async (request: ServiceRequest): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('service_requests')
      .upsert(mapServiceRequestToDb(request), { onConflict: 'id' });
    if (error) console.error('Supabase request upsert error:', error);
    return !error;
  } catch (err) {
    console.error('Failed to sync service request to Supabase:', err);
    return false;
  }
};

/**
 * Records an entry into the vendor opportunity ledger in Supabase PostgreSQL.
 */
export const syncOpportunityLedgerToSupabase = async (entry: OpportunityLedgerEntry): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('opportunity_ledger')
      .upsert({
        id: entry.id,
        vendor_id: entry.vendorId,
        vendor_name: entry.vendorName,
        action: entry.action || 'OPPORTUNITY_DISPATCH',
        opportunities_deducted: Math.abs(entry.change) || 1,
        remaining_balance: entry.balanceAfter,
        notes: entry.reason || null,
        request_id: entry.serviceRequestId || null
      }, { onConflict: 'id' });
    return !error;
  } catch (err) {
    console.error('Failed to sync opportunity ledger to Supabase:', err);
    return false;
  }
};

/**
 * Persists a complaint to Supabase PostgreSQL.
 */
export const syncComplaintToSupabase = async (complaint: ComplaintRecord): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('complaints')
      .upsert({
        id: complaint.id,
        request_id: complaint.requestId,
        customer_name: complaint.customerName,
        customer_phone: complaint.customerPhone,
        artisan_name: complaint.artisanName || null,
        issue_type: complaint.issueType,
        description: complaint.description,
        status: complaint.status,
        resolution_notes: complaint.resolutionNotes || null,
        resolved_at: complaint.resolvedAt || null
      }, { onConflict: 'id' });
    return !error;
  } catch (err) {
    console.error('Failed to sync complaint to Supabase:', err);
    return false;
  }
};

/**
 * Persists a payment record to Supabase PostgreSQL.
 */
export const syncPaymentToSupabase = async (payment: PaymentRecord): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  try {
    const dbMethod = payment.mode === 'ONLINE_CARD' || payment.mode === 'NET_BANKING' ? 'ONLINE' : payment.mode;
    const { error } = await supabase
      .from('payments')
      .upsert({
        id: payment.id,
        request_id: payment.requestId,
        customer_name: payment.customerName,
        amount: payment.amount,
        method: dbMethod,
        status: payment.status === 'SUCCESS' ? 'COMPLETED' : payment.status,
        reference_id: payment.transactionRef || null
      }, { onConflict: 'id' });
    return !error;
  } catch (err) {
    console.error('Failed to sync payment to Supabase:', err);
    return false;
  }
};

/**
 * Persists an audit log to Supabase PostgreSQL.
 */
export const syncAuditLogToSupabase = async (log: AuditLog): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  try {
    // Map entityType to schema check constraint
    let entityType = 'SYSTEM';
    if (log.entityType === 'SERVICE_REQUEST') entityType = 'BOOKING';
    else if (log.entityType === 'VENDOR') entityType = 'VENDOR';
    else if (log.entityType === 'EMPLOYEE') entityType = 'EMPLOYEE';
    else if (log.entityType === 'OPPORTUNITY') entityType = 'DISPATCH';

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        id: log.id,
        action: log.action,
        entity_type: entityType,
        entity_id: log.entityId,
        details: log.details,
        performed_by: log.performedBy,
        timestamp: log.timestamp
      });
    return !error;
  } catch (err) {
    console.error('Failed to sync audit log to Supabase:', err);
    return false;
  }
};

/**
 * Updates operations settings in Supabase PostgreSQL.
 */
export const syncOpsSettingsToSupabase = async (settings: OpsSettings): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('ops_settings')
      .upsert({
        id: 'ops-config',
        password: settings.password || 'OpsLead@2026',
        auto_assignment_enabled: true,
        emergency_contact: settings.emergencyHotline || '+91 98889 00122',
        dispatch_coverage_radius_km: settings.serviceRadiusKm || 12.5
      }, { onConflict: 'id' });
    return !error;
  } catch (err) {
    console.error('Failed to sync ops settings to Supabase:', err);
    return false;
  }
};

/**
 * Persists a turnkey home project to Supabase PostgreSQL.
 */
export const syncHomeProjectToSupabase = async (project: HomeProjectRequest): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('home_projects')
      .upsert({
        id: project.id,
        customer_name: project.customerName,
        customer_phone: project.customerPhone,
        locality: project.locality,
        project_type: project.projectType,
        scope_summary: project.description,
        estimated_budget: project.budgetRange,
        status: 'NEW_INQUIRY'
      }, { onConflict: 'id' });
    return !error;
  } catch (err) {
    console.error('Failed to sync home project to Supabase:', err);
    return false;
  }
};

/**
 * Persists a customer review to Supabase PostgreSQL.
 */
export const syncCustomerReviewToSupabase = async (review: CustomerReview): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  try {
    await supabase.from('audit_logs').insert({
      id: `aud-rev-${review.id}`,
      action: 'CUSTOMER_REVIEW_SUBMITTED',
      entity_type: 'BOOKING',
      entity_id: review.requestId,
      details: `Rating: ${review.rating}★ for ${review.serviceName} - "${review.review}"`,
      performed_by: review.customerName,
      timestamp: review.timestamp
    });
    return true;
  } catch (err) {
    console.error('Failed to sync customer review to Supabase:', err);
    return false;
  }
};
