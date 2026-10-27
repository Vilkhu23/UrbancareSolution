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
  CustomerReview,
  ServiceItem,
  ServicePackage,
  PriceType,
  VendorOnboardingPayment
} from '../types';
import { LOCALITIES } from '../data/initialData';
import { normalizeServiceItem } from '../utils/pricingEngine';

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
  user_id: row.user_id || undefined,
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
  user_id: cust.user_id || null,
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
  user_id: row.user_id || undefined,
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
  email: row.email || undefined,
  password: row.password || undefined
});

export const mapEmployeeToDb = (emp: Employee) => ({
  id: emp.id,
  user_id: emp.user_id || null,
  employee_code: emp.employeeCode || emp.id,
  name: emp.name,
  email: emp.email || null,
  mobile: emp.mobile,
  role: emp.role || 'Staff Technician',
  status: emp.status === 'INACTIVE' ? 'ON_LEAVE' : 'ACTIVE',
  availability: emp.availability,
  skills: emp.skills,
  service_areas: emp.serviceAreas,
  rating: emp.rating,
  completed_jobs: emp.completedJobs,
  password: emp.password || null
});

export const mapVendorFromDb = (row: any): Vendor => {
  const planData = row.plan || {
    name: 'Standard Trade Plan',
    price: 1499,
    totalOpportunities: 7,
    usedOpportunities: 0,
    remainingOpportunities: 7,
    validityDays: 30,
    expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  };
  const onboardingPayment = row.onboarding_payment || planData?.onboardingPayment || undefined;

  return {
    id: row.id,
    user_id: row.user_id || undefined,
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
    plan: planData,
    onboardingPayment,
    password: row.password || undefined
  };
};

export const mapVendorToDb = (vnd: Vendor) => ({
  id: vnd.id,
  user_id: vnd.user_id || null,
  business_name: vnd.businessName,
  owner_name: vnd.ownerName,
  mobile: vnd.mobile,
  email: vnd.email || null,
  status: vnd.status,
  categories: vnd.categories,
  service_areas: vnd.serviceAreas,
  experience_years: vnd.experienceYears,
  rating: vnd.rating,
  plan: {
    ...vnd.plan,
    onboardingPayment: vnd.onboardingPayment || vnd.plan.onboardingPayment
  },
  password: vnd.password || null
});

export const mapServiceRequestFromDb = (row: any): ServiceRequest => {
  const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

  let parsedRating: number | undefined = undefined;
  let parsedFeedback: string | undefined = undefined;
  if (row.completion_notes && typeof row.completion_notes === 'string') {
    const match = row.completion_notes.match(/\[CUSTOMER_REVIEW\]:\s*(\{.*\})/);
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        if (typeof parsed.rating === 'number') parsedRating = parsed.rating;
        if (typeof parsed.feedback === 'string') parsedFeedback = parsed.feedback;
      } catch {
        // ignore JSON parse error
      }
    }
  }

  return {
    id: row.id,
    user_id: row.user_id || undefined,
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
    customerRating: parsedRating,
    customerFeedback: parsedFeedback,
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

export const mapServiceRequestToDb = (req: ServiceRequest) => {
  let completionNotes = req.materialInfo || '';
  if (req.customerRating) {
    const payload = JSON.stringify({ rating: req.customerRating, feedback: req.customerFeedback || '' });
    if (!completionNotes.includes('[CUSTOMER_REVIEW]:')) {
      completionNotes = completionNotes ? `${completionNotes}\n[CUSTOMER_REVIEW]: ${payload}` : `[CUSTOMER_REVIEW]: ${payload}`;
    } else {
      completionNotes = completionNotes.replace(/\[CUSTOMER_REVIEW\]:\s*\{.*\}/, `[CUSTOMER_REVIEW]: ${payload}`);
    }
  }

  return {
    id: req.id,
    user_id: req.user_id || null,
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
    completion_notes: completionNotes || null,
    completion_code: null,
    customer_otp: null
  };
};

// Map PostgreSQL services row to Application ServiceItem
export const mapServiceItemFromDb = (row: any, categories?: ServiceCategory[]): ServiceItem => {
  const cat = categories?.find((c) => c.id === row.category_id)?.name || row.category_id || 'General';
  const price = Number(row.price) || 0;
  const originalPrice = row.market_average !== null && row.market_average !== undefined ? Number(row.market_average) : price;
  const features = Array.isArray(row.features) ? row.features : (Array.isArray(row.included) ? row.included : []);
  const duration = row.estimated_duration || (row.duration_minutes ? `${row.duration_minutes} Mins` : '60 Mins');
  const visitFee = row.visit_fee !== null && row.visit_fee !== undefined ? Number(row.visit_fee) : 99;

  const rawType = String(row.price_type || 'fixed').toUpperCase();
  let price_type: PriceType = 'FIXED';
  if (rawType === 'STARTING_FROM') price_type = 'STARTING_FROM';
  else if (rawType === 'PACKAGE') price_type = 'PACKAGE';
  else if (rawType === 'INSPECTION' || rawType === 'INSPECTION_FEE') price_type = 'INSPECTION';
  else if (rawType === 'QUOTE_REQUIRED') price_type = 'QUOTE_REQUIRED';

  const discount = row.discount || (originalPrice > price ? `Save ₹${originalPrice - price}` : undefined);
  const materialPolicy = row.material_policy || 'Transparent billing: Standard spares billed at MRP with pre-approval.';
  const warranty = row.warranty || '30-Day Workmanship Guarantee';

  return normalizeServiceItem({
    id: row.id,
    name: row.name,
    category: cat,
    subcategory: row.subcategory || 'General',
    description: row.description || '',
    price_type,
    base_price: price,
    original_price: originalPrice,
    discount,
    visit_fee: visitFee,
    tax: 0,
    material_policy: materialPolicy,
    duration,
    warranty,
    included_items: features,
    excluded_items: [],
    active: row.active !== false,
    effective_from: '2026-01-01',
    badge: row.badge || undefined,
    sortOrder: Number(row.display_order) || 1,
    rating: Number(row.rating) || 4.8,
    serviceAreas: LOCALITIES
  });
};

export const mapServiceItemToDb = (service: ServiceItem, categories?: ServiceCategory[]) => {
  let category_id = service.category;
  if (categories && categories.length > 0) {
    const matched = categories.find((c) => c.name.toLowerCase() === service.category.toLowerCase() || c.id === service.category);
    if (matched) category_id = matched.id;
  }
  const basePrice = service.base_price ?? service.basePrice ?? 0;
  const originalPrice = service.original_price ?? service.originalPrice ?? basePrice;
  const visitFee = service.visit_fee ?? service.visitFee ?? 99;
  const priceType = (service.price_type || service.pricingType || 'fixed').toString().toLowerCase();

  return {
    id: service.id,
    category_id,
    name: service.name,
    subcategory: service.subcategory || 'General',
    price: basePrice,
    market_average: originalPrice,
    price_type: priceType,
    visit_fee: visitFee,
    discount: service.discount || null,
    estimated_duration: service.duration || service.estimatedDuration || '60 mins',
    warranty: service.warranty || '30-Day Guarantee',
    material_policy: service.material_policy || service.materialPolicy || null,
    badge: service.badge || null,
    rating: service.rating || 4.8,
    description: service.description || '',
    features: service.included_items || service.included || [],
    display_order: service.sortOrder || 1,
    active: service.active !== false
  };
};

export const mapServicePackageFromDb = (row: any): ServicePackage => {
  const price = Number(row.price) || 0;
  const originalPrice = Number(row.original_price) || price;
  const savings = row.savings || (originalPrice > price ? `Save ₹${originalPrice - price}` : 'Special Offer');
  const included = Array.isArray(row.included) ? row.included : [];
  const serviceAreas = Array.isArray(row.service_areas) ? row.service_areas : LOCALITIES;

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    category_id: row.category_id || undefined,
    subcategory: row.subcategory || undefined,
    description: row.description || '',
    price,
    originalPrice,
    savings,
    duration: row.duration || '2 - 3 Hours',
    included,
    serviceAreas,
    active: row.active !== false,
    pricingType: 'package',
    rating: Number(row.rating) || 4.9
  };
};

export const mapServicePackageToDb = (pkg: ServicePackage, categories?: ServiceCategory[]) => {
  let category_id = 'ac-appliances';
  if (categories && categories.length > 0) {
    const matched = categories.find((c) => c.name.toLowerCase() === pkg.category.toLowerCase() || c.id === pkg.category);
    if (matched) category_id = matched.id;
  } else if (pkg.category.toLowerCase().includes('clean')) {
    category_id = 'cleaning';
  } else if (pkg.category.toLowerCase().includes('elec')) {
    category_id = 'electrical';
  }

  return {
    id: pkg.id,
    name: pkg.name,
    category_id,
    category: pkg.category,
    subcategory: pkg.subcategory || null,
    description: pkg.description || '',
    price: pkg.price,
    original_price: pkg.originalPrice,
    savings: pkg.savings,
    duration: pkg.duration,
    included: pkg.included || [],
    service_areas: pkg.serviceAreas || LOCALITIES,
    rating: pkg.rating || 4.9,
    active: pkg.active !== false
  };
};

/**
 * Maps PostgreSQL payments table row to Application PaymentRecord domain model.
 * Handles snake_case to camelCase conversion, safe casting of numeric amounts,
 * payment method normalization, and date formatting.
 */
export const mapPaymentFromDb = (row: any): PaymentRecord => {
  const reqId = row.request_id || row.requestId || '';
  const isVendorOnboarding =
    row.payment_type === 'VENDOR_ONBOARDING' ||
    (typeof reqId === 'string' && reqId.startsWith('ONBOARD-'));

  // Normalize status
  let status: 'SUCCESS' | 'PENDING' | 'REFUNDED' | 'DISPUTED' = 'SUCCESS';
  const rawStatus = (row.status || '').toUpperCase();
  if (rawStatus === 'PENDING') status = 'PENDING';
  else if (rawStatus === 'REFUNDED') status = 'REFUNDED';
  else if (rawStatus === 'DISPUTED' || rawStatus === 'FAILED') status = 'DISPUTED';
  else status = 'SUCCESS';

  // Normalize payment mode/channel
  let mode: 'UPI' | 'CASH' | 'ONLINE_CARD' | 'NET_BANKING' | 'CHEQUE' | 'ONLINE' = 'CASH';
  const rawMethod = (row.method || row.mode || 'CASH').toUpperCase();
  if (rawMethod === 'UPI') mode = 'UPI';
  else if (rawMethod === 'CHEQUE') mode = 'CHEQUE';
  else if (rawMethod === 'ONLINE_CARD') mode = 'ONLINE_CARD';
  else if (rawMethod === 'NET_BANKING') mode = 'NET_BANKING';
  else if (rawMethod === 'ONLINE') mode = 'ONLINE';
  else mode = 'CASH';

  // Format timestamp/created_at to display date string
  let formattedDate = 'Recent';
  const rawDate = row.date || row.timestamp || row.created_at;
  if (rawDate) {
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
      } else {
        formattedDate = String(rawDate);
      }
    } catch {
      formattedDate = String(rawDate);
    }
  }

  return {
    id: row.id || `pay-${Date.now()}`,
    user_id: row.user_id || undefined,
    requestId: reqId,
    customerName: row.customer_name || row.customerName || (isVendorOnboarding ? 'Vendor Partner' : 'Customer'),
    amount: Number(row.amount) || 0,
    mode,
    status,
    transactionRef: row.reference_id || row.transactionRef || row.transaction_ref || `TXN-${row.id || Date.now()}`,
    collectedBy: row.collected_by || row.collectedBy || (mode === 'CASH' ? 'Field Staff / Partner' : 'Digital Channel'),
    date: formattedDate,
    paymentType: isVendorOnboarding ? 'VENDOR_ONBOARDING' : 'SERVICE_BOOKING',
    notes: row.notes || undefined
  };
};

// ==============================================================================
// 2. SUPABASE ASYNC CRUD METHODS (Role-Based & Public Loaders)
// ==============================================================================

/**
 * Loads public service catalog (services, categories & packages) from Supabase.
 * Publicly accessible via RLS policies.
 */
export const loadCatalogFromSupabase = async (): Promise<{
  services: ServiceItem[];
  categories: ServiceCategory[];
  packages: ServicePackage[];
} | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const [categoriesRes, servicesRes, packagesRes] = await Promise.all([
      supabase.from('service_categories').select('*').order('display_order'),
      supabase.from('services').select('*').order('display_order', { ascending: true }),
      supabase.from('service_packages').select('*').order('display_order', { ascending: true })
    ]);

    if (servicesRes.error) {
      console.error('Supabase services fetch error:', servicesRes.error);
      throw servicesRes.error;
    }

    const categories: ServiceCategory[] = categoriesRes.data || [];
    const services: ServiceItem[] = (servicesRes.data || []).map((row: any) =>
      mapServiceItemFromDb(row, categories)
    );
    const packages: ServicePackage[] = (packagesRes.data || []).map(mapServicePackageFromDb);

    return { services, categories, packages };
  } catch (error) {
    console.error('Failed to load catalog from Supabase:', error);
    throw error;
  }
};

export interface RoleDataResult {
  customers?: CustomerRecord[] | null;
  employees?: Employee[] | null;
  vendors?: Vendor[] | null;
  requests?: ServiceRequest[] | null;
  ledger?: OpportunityLedgerEntry[] | null;
  complaints?: ComplaintRecord[] | null;
  payments?: PaymentRecord[] | null;
  opsSettings?: OpsSettings | null;
  services?: ServiceItem[] | null;
  categories?: ServiceCategory[] | null;
  packages?: ServicePackage[] | null;
}

/**
 * Role-based loader: customers load only their own records,
 * technicians load only their assigned jobs, vendors load only their own jobs/ledger,
 * admin and ops load full tables.
 */
export const loadUserDataByRoleFromSupabase = async (
  role: string,
  userId: string
): Promise<RoleDataResult | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    if (role === 'customer') {
      const [custRes, reqRes] = await Promise.all([
        supabase.from('customers').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('service_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      ]);

      return {
        customers: custRes.data ? [mapCustomerFromDb(custRes.data)] : [],
        requests: reqRes.data ? reqRes.data.map(mapServiceRequestFromDb) : []
      };
    } else if (role === 'technician') {
      const empRes = await supabase.from('employees').select('*').eq('user_id', userId).maybeSingle();
      const emp = empRes.data ? mapEmployeeFromDb(empRes.data) : null;
      let requests: ServiceRequest[] = [];
      if (emp) {
        // RLS also enforces assigned_to->>'id' = emp.id
        const reqRes = await supabase.from('service_requests').select('*').order('created_at', { ascending: false });
        requests = reqRes.data ? reqRes.data.map(mapServiceRequestFromDb) : [];
      }
      return {
        employees: emp ? [emp] : [],
        requests
      };
    } else if (role === 'vendor') {
      const vndRes = await supabase.from('vendors').select('*').eq('user_id', userId).maybeSingle();
      const vnd = vndRes.data ? mapVendorFromDb(vndRes.data) : null;
      let requests: ServiceRequest[] = [];
      let ledger: OpportunityLedgerEntry[] = [];
      if (vnd) {
        const [reqRes, ledRes] = await Promise.all([
          supabase.from('service_requests').select('*').order('created_at', { ascending: false }),
          supabase.from('opportunity_ledger').select('*').eq('vendor_id', vnd.id).order('created_at', { ascending: false })
        ]);
        requests = reqRes.data ? reqRes.data.map(mapServiceRequestFromDb) : [];
        ledger = ledRes.data ? ledRes.data.map((row: any) => ({
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
        })) : [];
      }
      return {
        vendors: vnd ? [vnd] : [],
        requests,
        ledger
      };
    } else if (role === 'admin' || role === 'ops_manager') {
      return await loadAllDataFromSupabase();
    }
    return null;
  } catch (error) {
    console.error(`Failed to load data for role ${role}:`, error);
    throw error;
  }
};

/**
 * Loads all initial datasets from Supabase PostgreSQL tables.
 * Used exclusively by admin / ops_manager roles.
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
      packagesRes,
      ledgerRes,
      complaintsRes,
      paymentsRes,
      opsRes
    ] = await Promise.all([
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      supabase.from('employees').select('*').order('name'),
      supabase.from('vendors').select('*').order('business_name'),
      supabase.from('service_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('services').select('*').order('display_order', { ascending: true }),
      supabase.from('service_categories').select('*').order('display_order'),
      supabase.from('service_packages').select('*').order('display_order', { ascending: true }),
      supabase.from('opportunity_ledger').select('*').order('created_at', { ascending: false }),
      supabase.from('complaints').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
      supabase.from('ops_settings').select('*').limit(1).maybeSingle()
    ]);

    const mappedOpsSettings: OpsSettings | null = opsRes.data ? {
      dispatchCenterName: 'UrbanCare Operations Command - Kharar Hub',
      emergencyHotline: opsRes.data.emergency_contact || '+91 98889 00122',
      supportEmail: 'ops@urbancaresolution.in',
      password: opsRes.data.password || '',
      defaultVisitFee: 99,
      defaultGstPercent: 18,
      requireSupervisorSignoff: true,
      autoSmsNotifications: true,
      serviceRadiusKm: Number(opsRes.data.dispatch_coverage_radius_km) || 12.5,
      operatingHours: '08:00 AM - 08:00 PM',
      activeLocalities: LOCALITIES
    } : null;

    const categories: ServiceCategory[] = categoriesRes.data || [];
    const mappedServices: ServiceItem[] | null = servicesRes.data && servicesRes.data.length > 0
      ? servicesRes.data.map((row: any) => mapServiceItemFromDb(row, categories))
      : null;
    const mappedPackages: ServicePackage[] | null = packagesRes.data && packagesRes.data.length > 0
      ? packagesRes.data.map(mapServicePackageFromDb)
      : null;

    return {
      customers: customersRes.data && customersRes.data.length > 0 ? customersRes.data.map(mapCustomerFromDb) : null,
      employees: employeesRes.data && employeesRes.data.length > 0 ? employeesRes.data.map(mapEmployeeFromDb) : null,
      vendors: vendorsRes.data && vendorsRes.data.length > 0 ? vendorsRes.data.map(mapVendorFromDb) : null,
      requests: requestsRes.data && requestsRes.data.length > 0 ? requestsRes.data.map(mapServiceRequestFromDb) : null,
      services: mappedServices,
      categories: categoriesRes.data || null,
      packages: mappedPackages,
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
      payments: (() => {
        const mappedList: PaymentRecord[] = paymentsRes.data && paymentsRes.data.length > 0
          ? paymentsRes.data.map(mapPaymentFromDb)
          : [];
        const existingReqIds = new Set(mappedList.map((p) => p.requestId));

        if (vendorsRes.data && vendorsRes.data.length > 0) {
          for (const vndRow of vendorsRes.data) {
            const obPayment = vndRow.onboarding_payment || vndRow.plan?.onboardingPayment;
            const reqKey = `ONBOARD-${vndRow.id}`;
            if (obPayment && obPayment.amount && !existingReqIds.has(reqKey)) {
              const obMode = obPayment.method === 'CHEQUE' ? 'CHEQUE' : obPayment.method === 'CASH' ? 'CASH' : 'ONLINE';
              const obStatus = obPayment.chequeClearingStatus === 'PENDING_CLEARANCE' ? 'PENDING' : 'SUCCESS';
              mappedList.push({
                id: `pay-vnd-${vndRow.id}`,
                requestId: reqKey,
                customerName: `Vendor: ${vndRow.business_name} (${vndRow.owner_name})`,
                amount: Number(obPayment.amount) || 0,
                mode: obMode,
                status: obStatus,
                transactionRef: obPayment.transactionRef || `VND-OB-${vndRow.id}`,
                collectedBy: obPayment.collectedBy || 'Operations Lead',
                date: obPayment.paidAt || (vndRow.created_at ? new Date(vndRow.created_at).toISOString().split('T')[0] : 'Recent'),
                paymentType: 'VENDOR_ONBOARDING',
                notes: obPayment.notes || `Onboarding fee for ${vndRow.plan?.name || 'Partner Plan'}`
              });
              existingReqIds.add(reqKey);
            }
          }
        }
        return mappedList;
      })(),
      opsSettings: mappedOpsSettings
    };
  } catch (error) {
    console.error('Supabase fetch failed:', error);
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
 * Submits a public prospective vendor partner application via the secure Edge Function.
 * This runs with service-role permissions server-side, bypassing table RLS for unauthenticated applicants.
 */
export const submitPartnerApplication = async (
  vendor: Vendor
): Promise<{ success: boolean; error?: string; vendor?: Vendor }> => {
  if (!isSupabaseConfigured()) return { success: true, vendor };
  try {
    const { data, error } = await supabase.functions.invoke('create-staff-user', {
      body: {
        action: 'submit-partner-application',
        id: vendor.id,
        businessName: vendor.businessName,
        ownerName: vendor.ownerName,
        phone: vendor.mobile,
        email: vendor.email,
        category: vendor.categories[0] || 'AC & Appliances',
        categories: vendor.categories,
        serviceAreas: vendor.serviceAreas,
        experienceYears: vendor.experienceYears,
        plan: vendor.plan,
        password: vendor.password
      }
    });

    if (error) {
      console.error('Edge Function partner application error:', error);
      return { success: false, error: error.message };
    }

    if (data?.error) {
      return { success: false, error: data.error };
    }

    return {
      success: true,
      vendor: data?.vendor ? mapVendorFromDb(data.vendor) : vendor
    };
  } catch (err: any) {
    console.error('Failed to submit partner application via Edge Function:', err);
    return { success: false, error: err?.message || 'Partner application failed' };
  }
};

/**
 * Operations Manager or Admin activates a pending vendor partner with their onboarding payment.
 */
export const approveVendorViaEdgeFunction = async (
  vendorId: string,
  paymentDetails: VendorOnboardingPayment
): Promise<{ success: boolean; error?: string; vendor?: Vendor }> => {
  if (!isSupabaseConfigured()) return { success: true };
  try {
    const { data, error } = await supabase.functions.invoke('create-staff-user', {
      body: {
        action: 'approve-vendor',
        vendorId,
        paymentDetails
      }
    });

    if (error) {
      console.error('Edge Function approve-vendor error:', error);
      return { success: false, error: error.message };
    }

    if (data?.error) {
      return { success: false, error: data.error };
    }

    return {
      success: true,
      vendor: data?.vendor ? mapVendorFromDb(data.vendor) : undefined
    };
  } catch (err: any) {
    console.error('Failed to approve vendor via Edge Function:', err);
    return { success: false, error: err?.message || 'Vendor activation failed' };
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
    if (error) {
      console.warn('Supabase vendor upsert direct error:', error.message);
      if (vendor.status === 'PENDING_VERIFICATION') {
        const appRes = await submitPartnerApplication(vendor);
        return appRes.success;
      }
      return false;
    }
    return true;
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
 * Updates execution and dispatch attributes of an existing service request in Supabase PostgreSQL via UPDATE.
 */
export const updateServiceRequestInSupabase = async (
  requestId: string,
  updates: {
    status?: string;
    assigned_to?: any;
    technician_notes?: string;
    vendor_scheduled_time?: string;
    vendor_arrival_status?: string;
    work_started_at?: string;
    work_completed_at?: string;
    payment_status?: string;
    payment_method?: string;
    before_work_photos?: string[];
    completion_photos?: string[];
    completion_notes?: string;
  }
): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  try {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.assigned_to !== undefined) payload.assigned_to = updates.assigned_to;
    if (updates.technician_notes !== undefined) payload.technician_notes = updates.technician_notes;
    if (updates.vendor_scheduled_time !== undefined) payload.vendor_scheduled_time = updates.vendor_scheduled_time;
    if (updates.vendor_arrival_status !== undefined) payload.vendor_arrival_status = updates.vendor_arrival_status;
    if (updates.work_started_at !== undefined) payload.work_started_at = updates.work_started_at;
    if (updates.work_completed_at !== undefined) payload.work_completed_at = updates.work_completed_at;
    if (updates.payment_status !== undefined) payload.payment_status = updates.payment_status;
    if (updates.payment_method !== undefined) payload.payment_method = updates.payment_method;
    if (updates.before_work_photos !== undefined) payload.before_work_photos = updates.before_work_photos;
    if (updates.completion_photos !== undefined) payload.completion_photos = updates.completion_photos;
    if (updates.completion_notes !== undefined) payload.completion_notes = updates.completion_notes;

    const { error } = await supabase
      .from('service_requests')
      .update(payload)
      .eq('id', requestId);

    if (error) {
      console.error(`[supabaseService] Failed to update service_request ${requestId}:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[supabaseService] Error updating service_request ${requestId}:`, err);
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
        user_id: complaint.user_id || null,
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
/**
 * Records a verified on-site cash/UPI payment via the database RPC record_payment().
 * Enforces exact total match, assignment check, and single payment rule.
 */
export const recordPaymentViaRpc = async (
  requestId: string,
  amount: number,
  method: 'CASH' | 'UPI' | 'ONLINE'
): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured()) {
    if (!import.meta.env.DEV) {
      return { success: false, message: 'Service not configured. Please contact support.' };
    }
    return { success: true, message: 'Offline mode: payment recorded locally.' };
  }

  try {
    const { data, error } = await supabase.rpc('record_payment', {
      p_request_id: requestId,
      p_amount: amount,
      p_method: method
    });

    if (error) {
      console.error('record_payment RPC error:', error);
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: (data as any)?.message || 'Payment recorded successfully.'
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Failed to record payment via RPC:', err);
    return { success: false, message: msg };
  }
};

export interface VerifyJobOtpResult {
  success: boolean;
  message: string;
  code?: 'VERIFIED' | 'INVALID_OTP' | 'LOCKED' | 'ALREADY_COMPLETED' | 'RPC_ERROR';
  attemptsLeft?: number;
}

/**
 * Verifies on-site customer completion OTP via the database RPC verify_job_otp().
 * Checks assignment, enforces 5-attempt rate-limiting, and marks request completed.
 */
export const verifyJobOtpViaRpc = async (
  requestId: string,
  otp: string
): Promise<VerifyJobOtpResult> => {
  if (!isSupabaseConfigured()) {
    if (!import.meta.env.DEV) {
      return { success: false, message: 'Service not configured. Please contact support.', code: 'RPC_ERROR' };
    }
    return { success: true, message: 'Offline mode: OTP verified locally.', code: 'VERIFIED' };
  }

  try {
    const { data, error } = await supabase.rpc('verify_job_otp', {
      p_request_id: requestId,
      p_otp: otp.trim()
    });

    if (error) {
      console.error('verify_job_otp RPC error:', error);
      return { success: false, message: error.message, code: 'RPC_ERROR' };
    }

    const res = data as {
      success?: boolean;
      code?: 'VERIFIED' | 'INVALID_OTP' | 'LOCKED' | 'ALREADY_COMPLETED';
      message?: string;
      attempts_left?: number;
    } | null;

    if (res && res.success === false) {
      let userFriendlyMessage = res.message || 'OTP verification failed.';
      if (res.code === 'LOCKED') {
        userFriendlyMessage =
          'Maximum OTP verification attempts (5) exceeded. Job is locked. Please contact the operations team to reset verification.';
      } else if (res.code === 'INVALID_OTP' && typeof res.attempts_left === 'number') {
        userFriendlyMessage = `Invalid OTP code. ${res.attempts_left} attempt${res.attempts_left === 1 ? '' : 's'} remaining before lockout.`;
      }

      return {
        success: false,
        message: userFriendlyMessage,
        code: res.code,
        attemptsLeft: res.attempts_left
      };
    }

    return {
      success: true,
      message: res?.message || 'OTP verified successfully.',
      code: res?.code || 'VERIFIED'
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Failed to verify OTP via RPC:', err);
    return { success: false, message: msg, code: 'RPC_ERROR' };
  }
};

/**
 * Resets the OTP verification lockout counter for a service request (Ops Manager / Admin only).
 */
export const resetJobOtpLockViaRpc = async (
  requestId: string
): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: true, message: 'Offline mode: lockout reset.' };
  }

  try {
    const { data, error } = await supabase.rpc('reset_job_otp_lock', {
      p_request_id: requestId
    });

    if (error) {
      console.error('reset_job_otp_lock RPC error:', error);
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: (data as any)?.message || 'OTP lockout reset successfully.'
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Failed to reset OTP lockout via RPC:', err);
    return { success: false, message: msg };
  }
};

/**
 * Retrieves the customer verification secret OTP for the resident's active booking.
 * Note: Staff accounts are denied access by RLS; only the customer holding user_id can read this.
 */
export const fetchCustomerBookingSecret = async (
  requestId: string
): Promise<{ customerOtp: string; completionCode: string } | null> => {
  if (!isSupabaseConfigured()) {
    if (!import.meta.env.DEV) {
      return null;
    }
    // Generate deterministic demo code based on requestId for offline demonstration in DEV only
    const hash = requestId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const mockOtp = String(1000 + (hash % 9000));
    return {
      customerOtp: mockOtp,
      completionCode: `PB${mockOtp}`
    };
  }

  try {
    // 1. Preferred: call secure get_customer_job_otp RPC (handles phone fallback and self-heals missing secrets)
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_customer_job_otp', {
      p_request_id: requestId
    });

    if (!rpcError && rpcData && rpcData.customer_otp) {
      return {
        customerOtp: rpcData.customer_otp,
        completionCode: rpcData.completion_code || `PB${rpcData.customer_otp}`
      };
    }

    // 2. Direct select fallback from service_request_secrets
    const { data, error } = await supabase
      .from('service_request_secrets')
      .select('customer_otp, completion_code')
      .eq('request_id', requestId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      customerOtp: data.customer_otp,
      completionCode: data.completion_code
    };
  } catch (err) {
    console.error('Failed to fetch booking secret:', err);
    return null;
  }
};

/**
 * Persists a payment record to Supabase PostgreSQL using record_payment RPC.
 * Online gateway payments will be written by a payment webhook using the service_role key.
 */
export const syncPaymentToSupabase = async (payment: PaymentRecord): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  try {
    const dbMethod = payment.mode === 'ONLINE_CARD' || payment.mode === 'NET_BANKING' ? 'ONLINE' : payment.mode;
    const rpcResult = await recordPaymentViaRpc(payment.requestId, payment.amount, dbMethod as 'CASH' | 'UPI' | 'ONLINE');
    return rpcResult.success;
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

/**
 * Checks whether a phone number is available for registration via check_phone_available() RPC.
 * Returns true if available (not registered), false if already taken.
 */
export const checkPhoneAvailableViaRpc = async (phone: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return true;
  }

  try {
    const { data, error } = await supabase.rpc('check_phone_available', {
      p_phone: phone.trim()
    });

    if (error) {
      console.error('check_phone_available RPC error:', error);
      if (error.message?.includes('RATE_LIMIT_EXCEEDED')) {
        throw new Error('Too many phone availability checks. Please wait a moment.');
      }
      return true;
    }

    return Boolean(data);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Too many')) {
      throw err;
    }
    console.error('Failed to check phone availability via RPC:', err);
    return true;
  }
};

/**
 * Releases a phone number from an account (Admin only) via admin_release_phone() RPC.
 * Dissociates phone, resets verification, and writes to audit_logs.
 */
export const adminReleasePhoneViaRpc = async (
  userId: string,
  reason: string
): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: true, message: 'Offline mode: phone released locally.' };
  }

  try {
    const { data, error } = await supabase.rpc('admin_release_phone', {
      p_user_id: userId,
      p_reason: reason.trim()
    });

    if (error) {
      console.error('admin_release_phone RPC error:', error);
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: (data as any)?.message || 'Mobile number released successfully.'
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Failed to release phone via RPC:', err);
    return { success: false, message: msg };
  }
};

/**
 * Persists a service item into Supabase PostgreSQL.
 */
export const syncServiceToSupabase = async (
  service: ServiceItem,
  categories?: ServiceCategory[]
): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  try {
    const dbPayload = mapServiceItemToDb(service, categories);
    const { error } = await supabase
      .from('services')
      .upsert(dbPayload, { onConflict: 'id' });
    if (error) {
      console.error('Supabase service upsert error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to sync service to Supabase:', err);
    return false;
  }
};

/**
 * Deletes a service item from Supabase PostgreSQL.
 */
export const deleteServiceFromSupabase = async (id: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      console.error('Supabase service delete error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete service from Supabase:', err);
    return false;
  }
};

/**
 * Persists a service package into Supabase PostgreSQL.
 */
export const syncServicePackageToSupabase = async (
  pkg: ServicePackage,
  categories?: ServiceCategory[]
): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  try {
    const dbPayload = mapServicePackageToDb(pkg, categories);
    const { error } = await supabase
      .from('service_packages')
      .upsert(dbPayload, { onConflict: 'id' });
    if (error) {
      console.error('Supabase package upsert error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to sync package to Supabase:', err);
    return false;
  }
};

/**
 * Deletes a service package from Supabase PostgreSQL.
 */
export const deleteServicePackageFromSupabase = async (id: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('service_packages').delete().eq('id', id);
    if (error) {
      console.error('Supabase package delete error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete package from Supabase:', err);
    return false;
  }
};
