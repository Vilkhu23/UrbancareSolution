import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  UserRole,
  ServiceItem,
  ServicePackage,
  CartItem,
  ServiceRequest,
  Vendor,
  Employee,
  HomeProjectRequest,
  CustomerReview,
  AuditLog,
  BookingStatus,
  OpportunityLedgerEntry,
  PriceHistoryRecord,
  PriceType,
  CustomerRecord,
  ComplaintRecord,
  PaymentRecord,
  OpsSettings,
  InternalNote,
  AssignmentHistoryItem,
  EmployeeNotification,
  DPDPConsentPreferences,
  DPDPNominee,
  DPDPGrievance,
  ProfileRecord,
  VendorOnboardingPayment
} from '../types';
import { validatePassword, validateIndianPhone, validateEmail } from '../utils/authValidation';
import {
  INITIAL_SERVICES,
  INITIAL_PACKAGES,
  INITIAL_VENDORS,
  INITIAL_EMPLOYEES,
  INITIAL_REQUESTS,
  INITIAL_PROJECT_REQUESTS,
  INITIAL_REVIEWS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PRICE_HISTORY,
  INITIAL_CUSTOMERS,
  INITIAL_COMPLAINTS,
  INITIAL_PAYMENTS,
  INITIAL_OPS_SETTINGS,
  INITIAL_OPPORTUNITY_LEDGER,
  INITIAL_EMPLOYEE_NOTIFICATIONS,
  LOCALITIES
} from '../data/initialData';
import { calculateOrderPricing, normalizeServiceItem } from '../utils/pricingEngine';
import { isSupabaseConfigured, supabase, checkSupabaseHealth } from '../lib/supabase';
import {
  loadAllDataFromSupabase,
  loadCatalogFromSupabase,
  loadUserDataByRoleFromSupabase,
  syncCustomerToSupabase,
  syncEmployeeToSupabase,
  syncVendorToSupabase,
  submitPartnerApplication,
  approveVendorViaEdgeFunction,
  syncServiceRequestToSupabase,
  syncOpportunityLedgerToSupabase,
  syncComplaintToSupabase,
  syncPaymentToSupabase,
  syncAuditLogToSupabase,
  syncOpsSettingsToSupabase,
  syncHomeProjectToSupabase,
  syncCustomerReviewToSupabase,
  syncServiceToSupabase,
  deleteServiceFromSupabase,
  syncServicePackageToSupabase,
  deleteServicePackageFromSupabase,
  updateServiceRequestInSupabase,
  mapServiceRequestFromDb,
  mapServiceItemFromDb,
  mapServicePackageFromDb,
  verifyJobOtpViaRpc,
  recordPaymentViaRpc
} from '../services/supabaseService';

interface ToastMessage {
  id: string;
  text: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  // Navigation & Role
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentLocality: string;
  setCurrentLocality: (loc: string) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  accountTab: 'overview' | 'bookings' | 'projects' | 'addresses' | 'dpdp';
  setAccountTab: (tab: 'overview' | 'bookings' | 'projects' | 'addresses' | 'dpdp') => void;
  toasts: ToastMessage[];
  showToast: (text: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  dismissToast: (id: string) => void;

  // Catalog & Pricing Engine
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  serviceSearchQuery: string;
  setServiceSearchQuery: (query: string) => void;
  services: ServiceItem[];
  packages: ServicePackage[];
  priceHistory: PriceHistoryRecord[];
  updateServicePricing: (id: string, updates: Partial<ServiceItem>, reason?: string, changedBy?: string) => void;
  toggleServiceActive: (id: string) => void;
  addService: (service: ServiceItem) => void;
  deleteService: (id: string) => Promise<boolean>;
  updatePackage: (id: string, updates: Partial<ServicePackage>) => void;
  deletePackage: (id: string) => Promise<boolean>;

  // Cart
  cart: CartItem[];
  addToCart: (service: ServiceItem, quantity?: number) => void;
  addPackageToCart: (pkg: ServicePackage) => void;
  removeFromCart: (serviceId: string) => void;
  updateCartQuantity: (serviceId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: {
    itemSubtotal: number;
    visitFee: number;
    taxPercent: number;
    taxAmount: number;
    discountAmount: number;
    total: number;
    hasQuoteRequired: boolean;
    itemCount: number;
  };

  // Service Requests & Bookings
  requests: ServiceRequest[];
  createBookingFromCart: (details: {
    customerName: string;
    customerPhone: string;
    locality: string;
    address: string;
    landmark?: string;
    preferredDate: string;
    preferredTimeSlot: string;
    notes?: string;
  }) => string;
  createCustomRequirement: (details: {
    customerName: string;
    customerPhone: string;
    locality: string;
    address: string;
    requirementText: string;
    preferredDate: string;
    preferredTimeSlot: string;
    category?: string;
  }) => string;
  createProjectRequest: (details: {
    customerName: string;
    customerPhone: string;
    locality: string;
    address: string;
    projectType: string;
    propertyType: string;
    approxAreaSqFt: number;
    budgetRange: string;
    preferredStartDate: string;
    description: string;
  }) => string;

  // Operations Control Workflow
  updateRequestStatus: (requestId: string, newStatus: BookingStatus, note?: string) => void;
  assignRequest: (
    requestId: string,
    assigneeId: string,
    assigneeType: 'EMPLOYEE' | 'VENDOR',
    notes?: string,
    assignedBy?: string,
    reason?: string
  ) => void;
  reassignRequest: (
    requestId: string,
    newAssigneeId: string,
    assigneeType: 'EMPLOYEE' | 'VENDOR',
    reason: string,
    notes?: string,
    assignedBy?: string
  ) => void;
  addInternalNote: (requestId: string, text: string, author?: string) => void;

  // Customers
  customers: CustomerRecord[];
  addCustomer: (customer: CustomerRecord) => void;
  updateCustomerStatus: (customerId: string, status: CustomerRecord['status']) => void;
  releaseCustomerPhone: (userId: string) => void;

  // Complaints
  complaints: ComplaintRecord[];
  addComplaint: (complaint: Partial<ComplaintRecord>) => void;
  resolveComplaint: (id: string, resolutionNotes: string) => void;

  // Payments
  payments: PaymentRecord[];
  recordPayment: (payment: Partial<PaymentRecord>) => Promise<boolean>;

  // Operations Settings
  opsSettings: OpsSettings;
  updateOpsSettings: (updates: Partial<OpsSettings>) => void;

  // Vendors & Opportunity Ledger
  vendors: Vendor[];
  opportunityLedger: OpportunityLedgerEntry[];
  adjustVendorOpportunities: (vendorId: string, delta: number, reason: string) => void;
  updateVendorStatus: (vendorId: string, status: Vendor['status']) => void;
  approveVendorWithPayment: (vendorId: string, paymentDetails: VendorOnboardingPayment) => Promise<boolean>;
  updateVendorPaymentStatus: (vendorId: string, clearingStatus: 'CLEARED' | 'PENDING_CLEARANCE') => Promise<boolean>;
  addVendor: (vendor: Vendor) => Promise<boolean> | void;

  // Vendor Portal Actions (Strict Role Protection & Privacy Gate)
  currentVendorId: string | null;
  setCurrentVendorId: (id: string | null) => void;
  vendorAcceptAssignment: (requestId: string, notes?: string) => void;
  vendorRejectAssignment: (requestId: string, reason: string, notes?: string) => void;
  vendorConfirmSchedule: (requestId: string, confirmedSlot: string, notes?: string) => void;
  vendorMarkArrived: (requestId: string) => void;
  vendorStartWork: (requestId: string, notes?: string) => void;
  vendorUploadCompletionPhotos: (requestId: string, photos: string[]) => void;
  vendorAddNotes: (requestId: string, note: string) => void;
  vendorCompleteJob: (
    requestId: string,
    paymentMode: 'CASH' | 'UPI' | 'ONLINE',
    notes?: string,
    photos?: string[],
    customerOtp?: string
  ) => void;

  // Employees & Employee Portal Actions
  employees: Employee[];
  updateEmployeeAvailability: (employeeId: string, availability: Employee['availability']) => void;
  addEmployee: (employee: Employee) => void;
  updateEmployee: (employeeId: string, updates: Partial<Employee>) => void;
  currentEmployeeId: string | null;
  setCurrentEmployeeId: (id: string | null) => void;
  employeeNotifications: EmployeeNotification[];
  markNotificationAsRead: (id: string) => void;
  employeeAcceptJob: (requestId: string, notes?: string) => void;
  employeeRejectJob: (requestId: string, reason: string, notes?: string) => void;
  employeeMarkArrived: (requestId: string) => void;
  employeeStartWork: (requestId: string, notes?: string) => void;
  employeeCompleteWork: (
    requestId: string,
    completionNotes: string,
    completionPhotos: string[],
    materialInfo?: string,
    partsUsed?: { name: string; quantity: number; cost: number }[],
    paymentCollectedMode?: 'CASH' | 'UPI' | 'ONLINE',
    customerOtp?: string
  ) => void;

  // Home Projects
  projectRequests: HomeProjectRequest[];
  updateProjectStatus: (projectId: string, status: HomeProjectRequest['status'], notes?: string) => void;

  // Reviews
  reviews: CustomerReview[];
  submitReview: (requestId: string, rating: number, feedback: string) => void;

  // Audit Logs
  auditLogs: AuditLog[];
  addAuditEntry: (
    action: string,
    entityType: AuditLog['entityType'],
    entityId: string,
    details: string,
    performedBy?: string
  ) => void;

  // Active Selected Tracker / Modal Triggers
  activeTrackingRequestId: string | null;
  setActiveTrackingRequestId: (id: string | null) => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  isCustomTaskModalOpen: boolean;
  setIsCustomTaskModalOpen: (open: boolean) => void;
  isProjectModalOpen: boolean;
  setIsProjectModalOpen: (open: boolean) => void;
  isLocalityModalOpen: boolean;
  setIsLocalityModalOpen: (open: boolean) => void;
  selectedDetailServiceId: string | null;
  setSelectedDetailServiceId: (id: string | null) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register';
  setAuthModalMode: (mode: 'login' | 'register') => void;
  openAuthModal: (mode?: 'login' | 'register', returnTo?: string) => void;
  authReturnTo: string | null;
  setAuthReturnTo: (page: string | null) => void;
  closeAllModals: () => void;

  // Authentication & Session State
  authProfile: ProfileRecord | null;
  setAuthProfile: (profile: ProfileRecord | null) => void;
  currentUser: CustomerRecord | null;
  setCurrentUser: (user: CustomerRecord | null) => void;
  login: (emailOrPhone: string, password: string, returnTo?: string) => Promise<{ success: boolean; role?: UserRole; mustChangePassword?: boolean; message?: string }>;
  logout: () => Promise<void>;
  loginWithGoogle: (returnTo?: string) => Promise<void>;
  loginCustomer: (phoneOrEmail: string, otpOrPassword?: string) => Promise<boolean> | boolean;
  registerCustomer: (details: {
    name: string;
    phone: string;
    email?: string;
    locality?: string;
    address?: string;
    password?: string;
  }) => Promise<CustomerRecord | null> | CustomerRecord;
  logoutCustomer: () => Promise<void> | void;
  loginStaff: (roleOrEmail: string, entityIdOrPassword?: string, password?: string) => Promise<boolean> | boolean;
  logoutStaff: () => Promise<void> | void;

  // DPDP Act 2023 Compliance & Data Principal Rights
  dpdpConsent: DPDPConsentPreferences;
  updateDPDPConsent: (preferences: Partial<DPDPConsentPreferences>) => void;
  dpdpNominee: DPDPNominee | null;
  updateDPDPNominee: (nominee: DPDPNominee) => void;
  dpdpGrievances: DPDPGrievance[];
  fileDPDPGrievance: (grievance: Omit<DPDPGrievance, 'id' | 'ticketNo' | 'status' | 'createdAt' | 'dpoOfficer'>) => DPDPGrievance;
  requestDataErasure: (reason?: string) => void;
  exportPersonalData: () => string;
  isDPDPNoticeOpen: boolean;
  setIsDPDPNoticeOpen: (open: boolean) => void;
  isDPDPConsentManagerOpen: boolean;
  setIsDPDPConsentManagerOpen: (open: boolean) => void;
  isDPDPDataRightsOpen: boolean;
  setIsDPDPDataRightsOpen: (open: boolean) => void;

  // Supabase + PostgreSQL Database State
  dbStatus: {
    connected: boolean;
    provider: 'supabase' | 'local';
    message: string;
    latencyMs?: number;
  };
  refreshDbConnection: () => Promise<void>;
  isLoadingData: boolean;
  isAuthLoading: boolean;
  dataLoadError: string | null;
  reloadUserData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SERVICES: 'pindcare_services_v2',
  PACKAGES: 'pindcare_packages_v2',
  REQUESTS: 'pindcare_requests_v1',
  VENDORS: 'pindcare_vendors_v1',
  EMPLOYEES: 'pindcare_employees_v1',
  PROJECTS: 'pindcare_projects_v1',
  REVIEWS: 'pindcare_reviews_v1',
  AUDIT: 'pindcare_audit_v1',
  LEDGER: 'pindcare_ledger_v1',
  CART: 'pindcare_cart_v1',
  LOCALITY: 'pindcare_locality_v1',
  CURRENT_PAGE: 'urbancare_current_page_v1',
  PRICE_HISTORY: 'pindcare_price_history_v1',
  CURRENT_VENDOR: 'pindcare_current_vendor_v1',
  CURRENT_EMPLOYEE: 'pindcare_current_employee_v1',
  EMPLOYEE_NOTIFICATIONS: 'pindcare_employee_notifications_v1',
  CURRENT_USER: 'pindcare_current_user_v1',
  CURRENT_ROLE: 'pindcare_current_role_v1',
  DPDP_CONSENT: 'urbancare_dpdp_consent_v1',
  DPDP_NOMINEE: 'urbancare_dpdp_nominee_v1',
  DPDP_GRIEVANCES: 'urbancare_dpdp_grievances_v1'
};

const DEFAULT_EMPTY_OPS_SETTINGS: OpsSettings = {
  dispatchCenterName: 'UrbanCare Operations Command - Kharar Hub',
  emergencyHotline: '+91 98889 00122',
  supportEmail: 'ops@urbancaresolution.in',
  password: '',
  defaultVisitFee: 99,
  defaultGstPercent: 18,
  requireSupervisorSignoff: true,
  autoSmsNotifications: true,
  serviceRadiusKm: 12.5,
  operatingHours: '08:00 AM - 08:00 PM',
  activeLocalities: LOCALITIES
};

// Purges personal data and session state from browser storage on explicit logout,
// strictly preserving cart, locality preference, and Supabase auth credentials (sb-* keys).
const purgeAllPersonalStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage) {
      const preservedKeys = new Set([
        STORAGE_KEYS.CART,
        STORAGE_KEYS.LOCALITY,
        STORAGE_KEYS.CURRENT_PAGE
      ]);
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // CRITICAL: NEVER delete Supabase auth tokens (keys starting with 'sb-')
        // Supabase manages its own auth session tokens in localStorage.
        if (key && !preservedKeys.has(key) && !key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
  } catch (err) {
    console.warn('Storage purge notice:', err);
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication profile loaded from Supabase Auth & public.profiles
  const [authProfile, setAuthProfile] = useState<ProfileRecord | null>(null);

  // Role is always initialized as unprivileged 'customer' and derived strictly from Supabase
  const [currentRole, setCurrentRoleState] = useState<UserRole>('customer');

  // Track initial auth restoration from Supabase to prevent flashing unauthenticated states on refresh
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(isSupabaseConfigured());

  // Category and Search query state shared with services catalog
  const [selectedCategory, setSelectedCategory] = useState<string>('AC & Appliances');
  const [serviceSearchQuery, setServiceSearchQuery] = useState<string>('');
  const [accountTab, setAccountTab] = useState<'overview' | 'bookings' | 'projects' | 'addresses' | 'dpdp'>('overview');

  // Initialize currentPage from URL path or stored page key, fallback to 'home'
  const [currentPage, setCurrentPageState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/^\//, '').toLowerCase();
      const validPages = [
        'services',
        'projects',
        'how-it-works',
        'become-partner',
        'about',
        'contact',
        'account',
        'admin',
        'vendor',
        'employee',
        'reset-password'
      ];
      if (path && validPages.includes(path)) {
        return path;
      }
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_PAGE);
        if (saved && validPages.includes(saved)) {
          return saved;
        }
      } catch {}
    }
    return 'home';
  });

  const setCurrentPage = (page: string) => {
    setCurrentPageState(page);
    try {
      if (page === 'home') {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_PAGE);
        if (typeof window !== 'undefined' && window.location.pathname !== '/') {
          window.history.pushState(null, '', '/');
        }
      } else {
        localStorage.setItem(STORAGE_KEYS.CURRENT_PAGE, page);
        if (typeof window !== 'undefined' && window.location.pathname !== `/${page}`) {
          window.history.pushState(null, '', `/${page}`);
        }
      }
    } catch {}
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\//, '').toLowerCase();
      const validPages = [
        'services',
        'projects',
        'how-it-works',
        'become-partner',
        'about',
        'contact',
        'account',
        'admin',
        'vendor',
        'employee',
        'reset-password'
      ];
      if (validPages.includes(path)) {
        setCurrentPageState(path);
      } else {
        setCurrentPageState('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Demo data and localStorage persistence are permitted ONLY when Supabase
  // is NOT configured AND running in local dev mode (import.meta.env.DEV).
  // In production builds and whenever Supabase is configured, data comes strictly from Supabase.
  const isDemoFallbackAllowed = !isSupabaseConfigured() && Boolean(import.meta.env.DEV);

  const [isLoadingData, setIsLoadingData] = useState<boolean>(isSupabaseConfigured());
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);

  const [currentVendorId, setCurrentVendorIdState] = useState<string | null>(() => {
    if (!isDemoFallbackAllowed) return null;
    return localStorage.getItem(STORAGE_KEYS.CURRENT_VENDOR) || null;
  });

  const setCurrentVendorId = (id: string | null) => {
    setCurrentVendorIdState(id);
    if (!isDemoFallbackAllowed) return;
    if (id) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_VENDOR, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_VENDOR);
    }
  };

  const [currentEmployeeId, setCurrentEmployeeIdState] = useState<string | null>(() => {
    if (!isDemoFallbackAllowed) return null;
    return localStorage.getItem(STORAGE_KEYS.CURRENT_EMPLOYEE) || null;
  });

  const setCurrentEmployeeId = (id: string | null) => {
    setCurrentEmployeeIdState(id);
    if (!isDemoFallbackAllowed) return;
    if (id) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_EMPLOYEE, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_EMPLOYEE);
    }
  };

  const [employeeNotifications, setEmployeeNotifications] = useState<EmployeeNotification[]>(() => {
    if (!isDemoFallbackAllowed) return [];
    const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEE_NOTIFICATIONS);
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEE_NOTIFICATIONS;
  });

  useEffect(() => {
    if (!isDemoFallbackAllowed) return;
    localStorage.setItem(STORAGE_KEYS.EMPLOYEE_NOTIFICATIONS, JSON.stringify(employeeNotifications));
  }, [employeeNotifications, isDemoFallbackAllowed]);

  const markNotificationAsRead = (id: string) => {
    setEmployeeNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Locality preference stays in localStorage
  const [currentLocality, setCurrentLocalityState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.LOCALITY) || LOCALITIES[0];
    } catch {
      return LOCALITIES[0];
    }
  });

  const setCurrentLocality = (loc: string) => {
    setCurrentLocalityState(loc);
    try {
      localStorage.setItem(STORAGE_KEYS.LOCALITY, loc);
    } catch {}
    showToast(`Neighborhood set to ${loc}`, 'info');
  };

  // Load Services: empty array while loading, demo only in offline dev
  const [services, setServices] = useState<ServiceItem[]>(() => {
    if (!isDemoFallbackAllowed) return [];
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (!saved) return INITIAL_SERVICES;
    try {
      const parsed: ServiceItem[] = JSON.parse(saved);
      const validIds = new Set(INITIAL_SERVICES.map((s) => s.id));
      const filtered = parsed.filter((s) => validIds.has(s.id));
      const existingIds = new Set(filtered.map((s) => s.id));
      const missing = INITIAL_SERVICES.filter((s) => !existingIds.has(s.id));
      return missing.length > 0 ? [...filtered, ...missing] : filtered;
    } catch {
      return INITIAL_SERVICES;
    }
  });

  // Price History records
  const [priceHistory, setPriceHistory] = useState<PriceHistoryRecord[]>(() => {
    if (!isDemoFallbackAllowed) return [];
    const saved = localStorage.getItem(STORAGE_KEYS.PRICE_HISTORY);
    return saved ? JSON.parse(saved) : INITIAL_PRICE_HISTORY;
  });

  useEffect(() => {
    if (!isDemoFallbackAllowed) return;
    localStorage.setItem(STORAGE_KEYS.PRICE_HISTORY, JSON.stringify(priceHistory));
  }, [priceHistory, isDemoFallbackAllowed]);

  // Packages
  const [packages, setPackages] = useState<ServicePackage[]>(() => {
    if (!isDemoFallbackAllowed) return [];
    const saved = localStorage.getItem(STORAGE_KEYS.PACKAGES);
    if (!saved) return INITIAL_PACKAGES;
    try {
      const parsed: ServicePackage[] = JSON.parse(saved);
      const validIds = new Set(INITIAL_PACKAGES.map((p) => p.id));
      const filtered = parsed.filter((p) => validIds.has(p.id));
      return filtered.length > 0 ? filtered : INITIAL_PACKAGES;
    } catch {
      return INITIAL_PACKAGES;
    }
  });

  // Requests
  const [requests, setRequests] = useState<ServiceRequest[]>(() => {
    if (!isDemoFallbackAllowed) return [];
    const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  // Vendors
  const [vendors, setVendors] = useState<Vendor[]>(() => {
    if (!isDemoFallbackAllowed) return [];
    const saved = localStorage.getItem(STORAGE_KEYS.VENDORS);
    return saved ? JSON.parse(saved) : INITIAL_VENDORS;
  });

  // Opportunity Ledger
  const [opportunityLedger, setOpportunityLedger] = useState<OpportunityLedgerEntry[]>(() => {
    if (!isDemoFallbackAllowed) return [];
    const saved = localStorage.getItem(STORAGE_KEYS.LEDGER);
    return saved ? JSON.parse(saved) : INITIAL_OPPORTUNITY_LEDGER;
  });

  // Employees
  const [employees, setEmployees] = useState<Employee[]>(() => {
    if (!isDemoFallbackAllowed) return [];
    const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  // Projects
  const [projectRequests, setProjectRequests] = useState<HomeProjectRequest[]>(() => {
    if (!isDemoFallbackAllowed) return [];
    const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return saved ? JSON.parse(saved) : INITIAL_PROJECT_REQUESTS;
  });

  // Reviews: Genuine verified customer feedback from project data + submitted orders
  const [reviews, setReviews] = useState<CustomerReview[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return INITIAL_REVIEWS;
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    if (!isDemoFallbackAllowed) return [];
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Cart: starts empty (no default AC service); only serviceId, quantity, locality stored
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => ({
            serviceId: item.serviceId,
            serviceName: item.serviceName || 'Service Item',
            category: item.category || 'General',
            price: Number(item.price) || 0,
            visitFee: Number(item.visitFee) || 0,
            quantity: Number(item.quantity) || 1,
            isPackage: Boolean(item.isPackage),
            price_type: item.price_type || 'FIXED'
          }));
        }
      }
    } catch {}
    return []; // Start empty
  });

  // Modals & UI States
  const [activeTrackingRequestId, setActiveTrackingRequestId] = useState<string | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCustomTaskModalOpen, setIsCustomTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isLocalityModalOpen, setIsLocalityModalOpen] = useState(false);
  const [selectedDetailServiceId, setSelectedDetailServiceId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authReturnTo, setAuthReturnTo] = useState<string | null>(null);

  const openAuthModal = (mode: 'login' | 'register' = 'login', returnTo?: string) => {
    setAuthModalMode(mode);
    if (returnTo) {
      setAuthReturnTo(returnTo);
    }
    setIsAuthModalOpen(true);
  };

  // DPDP Modals & Rights States (clean state without seeded personal data)
  const [isDPDPNoticeOpen, setIsDPDPNoticeOpen] = useState(false);
  const [isDPDPConsentManagerOpen, setIsDPDPConsentManagerOpen] = useState(false);
  const [isDPDPDataRightsOpen, setIsDPDPDataRightsOpen] = useState(false);

  // Session & logout tracker refs
  const hasActiveSessionRef = useRef<boolean>(false);
  const isExplicitLogoutRef = useRef<boolean>(false);

  // Close all open drawers and modals on logout / session termination
  const closeAllModals = () => {
    setActiveTrackingRequestId(null);
    setIsCartDrawerOpen(false);
    setIsCustomTaskModalOpen(false);
    setIsProjectModalOpen(false);
    setIsLocalityModalOpen(false);
    setSelectedDetailServiceId(null);
    setIsAuthModalOpen(false);
    setIsDPDPNoticeOpen(false);
    setIsDPDPConsentManagerOpen(false);
    setIsDPDPDataRightsOpen(false);
  };

  const [dpdpConsent, setDpdpConsent] = useState<DPDPConsentPreferences>(() => {
    if (isDemoFallbackAllowed) {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.DPDP_CONSENT);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      essentialService: true,
      dispatchUpdates: false,
      promotionalMarketing: false,
      callMasking: true,
      consentedAt: '',
      ipJurisdiction: '',
      version: 'DPDP-2023-V1.2'
    };
  });

  const [dpdpNominee, setDpdpNominee] = useState<DPDPNominee | null>(() => {
    if (!isDemoFallbackAllowed) return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DPDP_NOMINEE);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [dpdpGrievances, setDpdpGrievances] = useState<DPDPGrievance[]>(() => {
    if (!isDemoFallbackAllowed) return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DPDP_GRIEVANCES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync DPDP preferences only in offline demo mode
  useEffect(() => {
    if (!isDemoFallbackAllowed) return;
    localStorage.setItem(STORAGE_KEYS.DPDP_CONSENT, JSON.stringify(dpdpConsent));
  }, [dpdpConsent, isDemoFallbackAllowed]);

  useEffect(() => {
    if (!isDemoFallbackAllowed) return;
    if (dpdpNominee) {
      localStorage.setItem(STORAGE_KEYS.DPDP_NOMINEE, JSON.stringify(dpdpNominee));
    } else {
      localStorage.removeItem(STORAGE_KEYS.DPDP_NOMINEE);
    }
  }, [dpdpNominee, isDemoFallbackAllowed]);

  useEffect(() => {
    if (!isDemoFallbackAllowed) return;
    localStorage.setItem(STORAGE_KEYS.DPDP_GRIEVANCES, JSON.stringify(dpdpGrievances));
  }, [dpdpGrievances, isDemoFallbackAllowed]);

  // Sync collections to local storage ONLY in offline demo mode
  useEffect(() => {
    if (!isDemoFallbackAllowed) return;
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  }, [services, isDemoFallbackAllowed]);

  useEffect(() => {
    if (!isDemoFallbackAllowed) return;
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages));
  }, [packages, isDemoFallbackAllowed]);

  useEffect(() => {
    if (!isDemoFallbackAllowed) return;
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  }, [requests, isDemoFallbackAllowed]);

  useEffect(() => {
    if (!isDemoFallbackAllowed) return;
    localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
  }, [vendors, isDemoFallbackAllowed]);

  useEffect(() => {
    if (!isDemoFallbackAllowed) return;
    localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(opportunityLedger));
  }, [opportunityLedger, isDemoFallbackAllowed]);

  useEffect(() => {
    if (!isDemoFallbackAllowed) return;
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  }, [employees, isDemoFallbackAllowed]);

  useEffect(() => {
    if (!isDemoFallbackAllowed) return;
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projectRequests));
  }, [projectRequests, isDemoFallbackAllowed]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  }, [reviews]);

  // Synchronize reviews from verified completed orders (e.g. #PB-5856)
  useEffect(() => {
    const reviewedRequests = requests.filter((r) => r.customerRating && r.customerRating > 0);
    if (reviewedRequests.length > 0) {
      setReviews((prev) => {
        let updated = [...prev];
        let hasChanges = false;
        reviewedRequests.forEach((req) => {
          const existingIdx = updated.findIndex((rv) => rv.requestId === req.id);
          const reviewObj: CustomerReview = {
            id: `rev-${req.id}`,
            requestId: req.id,
            customerName: req.customerName,
            locality: req.locality,
            serviceName: req.items[0]?.serviceName || 'Home Service',
            technicianName: req.assignedTo?.name || 'Assigned Specialist',
            rating: req.customerRating!,
            review: req.customerFeedback || `${req.customerRating}-star verified domestic service.`,
            timestamp: req.updatedAt || 'Recently'
          };
          if (existingIdx >= 0) {
            if (
              updated[existingIdx].rating !== reviewObj.rating ||
              updated[existingIdx].review !== reviewObj.review
            ) {
              updated[existingIdx] = reviewObj;
              hasChanges = true;
            }
          } else {
            updated = [reviewObj, ...updated];
            hasChanges = true;
          }
        });
        return hasChanges ? updated : prev;
      });
    }
  }, [requests]);

  useEffect(() => {
    if (!isDemoFallbackAllowed) return;
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
  }, [auditLogs, isDemoFallbackAllowed]);

  // Cart persistence: only serviceId, quantity, locality (no customer personal data)
  useEffect(() => {
    try {
      const minimalCart = cart.map((item) => ({
        serviceId: item.serviceId,
        quantity: item.quantity,
        locality: currentLocality
      }));
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(minimalCart));
    } catch {}
  }, [cart, currentLocality]);

  // Hydrate cart item display details from live services catalog
  useEffect(() => {
    if (services.length > 0 && cart.length > 0) {
      setCart((prev) =>
        prev.map((item) => {
          const match = services.find((s) => s.id === item.serviceId);
          if (match) {
            const price = match.base_price ?? match.basePrice ?? item.price;
            const visitFee = match.visit_fee ?? match.visitFee ?? item.visitFee;
            return {
              ...item,
              serviceName: match.name,
              category: match.category,
              price,
              visitFee
            };
          }
          return item;
        })
      );
    }
  }, [services]);

  // Database connection state (Supabase + PostgreSQL)
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    provider: 'supabase' | 'local';
    message: string;
    latencyMs?: number;
  }>({
    connected: isSupabaseConfigured(),
    provider: isSupabaseConfigured() ? 'supabase' : 'local',
    message: isSupabaseConfigured()
      ? 'Connecting to Supabase PostgreSQL...'
      : 'Local Mock Mode (Add VITE_SUPABASE_URL in .env to connect live PostgreSQL)'
  });

  const refreshDbConnection = async () => {
    const health = await checkSupabaseHealth();
    setDbStatus({
      connected: health.connected,
      provider: isSupabaseConfigured() ? 'supabase' : 'local',
      message: health.message,
      latencyMs: health.latencyMs
    });
  };

  // Customers (empty while loading, demo only in offline dev)
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => {
    if (!isDemoFallbackAllowed) return [];
    const saved = localStorage.getItem('pindcare_customers_v1');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  // Current logged in customer state
  const [currentUser, setCurrentUserState] = useState<CustomerRecord | null>(null);

  const setCurrentUser = (user: CustomerRecord | null) => {
    setCurrentUserState(user);
  };

  // Complaints
  const [complaints, setComplaints] = useState<ComplaintRecord[]>(() => {
    if (!isDemoFallbackAllowed) return [];
    const saved = localStorage.getItem('pindcare_complaints_v1');
    return saved ? JSON.parse(saved) : INITIAL_COMPLAINTS;
  });

  // Payments
  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    if (!isDemoFallbackAllowed) return [];
    const saved = localStorage.getItem('pindcare_payments_v1');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  // Operations Settings
  const [opsSettings, setOpsSettings] = useState<OpsSettings>(() => {
    if (!isDemoFallbackAllowed) return DEFAULT_EMPTY_OPS_SETTINGS;
    const saved = localStorage.getItem('pindcare_settings_v1');
    return saved ? JSON.parse(saved) : INITIAL_OPS_SETTINGS;
  });

  useEffect(() => {
    if (!isDemoFallbackAllowed) return;
    localStorage.setItem('pindcare_customers_v1', JSON.stringify(customers));
  }, [customers, isDemoFallbackAllowed]);

  useEffect(() => {
    if (!isDemoFallbackAllowed) return;
    localStorage.setItem('pindcare_complaints_v1', JSON.stringify(complaints));
  }, [complaints, isDemoFallbackAllowed]);

  useEffect(() => {
    if (!isDemoFallbackAllowed) return;
    localStorage.setItem('pindcare_payments_v1', JSON.stringify(payments));
  }, [payments, isDemoFallbackAllowed]);

  useEffect(() => {
    if (!isDemoFallbackAllowed) return;
    localStorage.setItem('pindcare_settings_v1', JSON.stringify(opsSettings));
  }, [opsSettings, isDemoFallbackAllowed]);

  // Clears all in-memory personal state and purges browser storage on logout
  // Preserves ONLY cart and locality keys per Task 1.3
  const clearSessionData = () => {
    setAuthProfile(null);
    setCurrentUserState(null);
    setCurrentRoleState('customer');
    setCurrentEmployeeIdState(null);
    setCurrentVendorIdState(null);
    setRequests([]);
    setCustomers([]);
    setEmployees([]);
    setVendors([]);
    setComplaints([]);
    setPayments([]);
    setOpportunityLedger([]);
    setProjectRequests([]);
    setEmployeeNotifications([]);
    setAuditLogs([]);
    setDpdpNominee(null);
    setDpdpGrievances([]);
    purgeAllPersonalStorage();
  };

  // Role-based data loader: customers load only their own records;
  // employee portal loads only assigned jobs; vendor portal loads only own jobs & ledger;
  // admin / ops loads full tables.
  const applyRoleData = async (role: string, userId: string) => {
    if (!isSupabaseConfigured()) return;
    try {
      setIsLoadingData(true);
      setDataLoadError(null);
      const roleData = await loadUserDataByRoleFromSupabase(role, userId);
      if (roleData) {
        if (roleData.customers) setCustomers(roleData.customers);
        if (roleData.employees) {
          setEmployees(roleData.employees);
          const matched = roleData.employees.find((e) => e.user_id === userId || e.id === userId);
          if (matched) setCurrentEmployeeIdState(matched.id);
        }
        if (roleData.vendors) {
          setVendors(roleData.vendors);
          const matched = roleData.vendors.find((v) => v.user_id === userId || v.id === userId);
          if (matched) setCurrentVendorIdState(matched.id);
        }
        if (roleData.requests) setRequests(roleData.requests);
        if (roleData.services) setServices(roleData.services);
        if (roleData.packages) setPackages(roleData.packages);
        if (roleData.ledger) setOpportunityLedger(roleData.ledger);
        if (roleData.complaints) setComplaints(roleData.complaints);
        if (roleData.payments) setPayments(roleData.payments);
        if (roleData.opsSettings) setOpsSettings(roleData.opsSettings);
      }
    } catch (err: any) {
      console.error(`Role data load error for role ${role}:`, err);
      setDataLoadError(err?.message || 'Failed to load user workspace records.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const setCurrentRole = async (role: UserRole) => {
    setCurrentRoleState(role);
    if (isSupabaseConfigured() && authProfile) {
      const dbRole = role === 'employee' ? 'technician' : role === 'operations' ? 'ops_manager' : role;
      await applyRoleData(dbRole, authProfile.id);
    }
  };

  const reloadUserData = async () => {
    if (isSupabaseConfigured() && authProfile) {
      const dbRole = currentRole === 'employee' ? 'technician' : currentRole === 'operations' ? 'ops_manager' : currentRole;
      await applyRoleData(dbRole, authProfile.id);
    }
  };

  // Supabase PostgreSQL Bootstrap (Catalog) & Live Realtime Replication
  useEffect(() => {
    let isMounted = true;

    const bootstrapCatalog = async () => {
      if (isSupabaseConfigured()) {
        const health = await checkSupabaseHealth();
        if (isMounted) {
          setDbStatus({
            connected: health.connected,
            provider: 'supabase',
            message: health.message,
            latencyMs: health.latencyMs
          });
        }

        if (health.connected) {
          try {
            setIsLoadingData(true);
            const catalog = await loadCatalogFromSupabase();
            if (catalog?.services && catalog.services.length > 0 && isMounted) {
              setServices(catalog.services);
            }
            if (catalog?.packages && catalog.packages.length > 0 && isMounted) {
              setPackages(catalog.packages);
            }
          } catch (err: any) {
            if (isMounted) {
              console.error('Failed to load public catalog:', err);
              setDataLoadError(err?.message || 'Failed to load service catalog.');
            }
          } finally {
            if (isMounted) {
              setIsLoadingData(false);
            }
          }
        }
      }
    };

    bootstrapCatalog();

    // Supabase Realtime channel for live bookings, services & packages
    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel('public:app_realtime_sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'service_requests' },
          (payload) => {
            if (payload.eventType === 'INSERT' && payload.new) {
              const mapped = mapServiceRequestFromDb(payload.new);
              setRequests((prev) => [mapped, ...prev.filter((r) => r.id !== mapped.id)]);
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              const mapped = mapServiceRequestFromDb(payload.new);
              setRequests((prev) => prev.map((r) => (r.id === mapped.id ? mapped : r)));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'services' },
          (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const mapped = mapServiceItemFromDb(payload.new);
              setServices((prev) => {
                const idx = prev.findIndex((s) => s.id === mapped.id);
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = mapped;
                  return updated;
                }
                return [mapped, ...prev];
              });
            } else if (payload.eventType === 'DELETE' && payload.old) {
              setServices((prev) => prev.filter((s) => s.id !== (payload.old as any).id));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'service_packages' },
          (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const mapped = mapServicePackageFromDb(payload.new);
              setPackages((prev) => {
                const idx = prev.findIndex((p) => p.id === mapped.id);
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = mapped;
                  return updated;
                }
                return [mapped, ...prev];
              });
            } else if (payload.eventType === 'DELETE' && payload.old) {
              setPackages((prev) => prev.filter((p) => p.id !== (payload.old as any).id));
            }
          }
        )
        .subscribe();

      return () => {
        isMounted = false;
        supabase.removeChannel(channel);
      };
    }
  }, []);

  // Centralized helper to map profile attributes to AppContext state
  const syncProfileToState = async (profile: ProfileRecord, userEmail: string) => {
    setAuthProfile(profile);
    if (profile.role === 'customer') {
      setCurrentRoleState('customer');
      setCurrentUserState({
        id: profile.id,
        user_id: profile.id,
        name: profile.full_name,
        phone: profile.phone,
        email: userEmail,
        locality: profile.locality || 'Sector 94, Mohali',
        address: profile.address || '',
        totalBookings: 0,
        totalSpent: 0,
        registeredDate: profile.created_at ? new Date(profile.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: 'ACTIVE'
      });
    } else if (profile.role === 'technician') {
      setCurrentRoleState('employee');
    } else if (profile.role === 'vendor') {
      setCurrentRoleState('vendor');
    } else if (profile.role === 'admin' || profile.role === 'ops_manager') {
      setCurrentRoleState('operations');
    }

    await applyRoleData(profile.role, profile.id);

    if (profile.must_change_password) {
      showToast('Temporary password in use. Please change your password.', 'warning');
      setCurrentPage('reset-password');
    }
  };

  // Supabase Auth Session & Verified Role Synchronization
  useEffect(() => {
    let isMounted = true;

    // Helper to securely process a Supabase session, verify role constraints, and route users
    const handleSessionResolution = async (
      session: any,
      mounted: boolean,
      isInitialMount: boolean = false
    ) => {
      if (!session?.user || !mounted) return;

      hasActiveSessionRef.current = true;
      const isGoogleUser =
        session.user.app_metadata?.provider === 'google' ||
        session.user.identities?.some((id: any) => id.provider === 'google');

      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      // First-time Google OAuth trigger race mitigation: retry once after 350ms if profile not found
      if (!profile && isGoogleUser) {
        await new Promise((r) => setTimeout(r, 350));
        const retryRes = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        profile = retryRes.data;
        profileError = retryRes.error;
      }

      if (profileError) {
        console.error('Failed to load user profile during session resolution:', profileError);
      }

      if (profile && mounted) {
        // SECURITY GUARD: Google OAuth is strictly restricted to customer/resident accounts.
        // If an existing operational staff or administrator signs in with Google, reject and terminate.
        if (isGoogleUser && profile.role !== 'customer') {
          console.warn('Google login is strictly restricted to customer/resident accounts. Terminating session.');
          await supabase.auth.signOut();
          clearSessionData();
          showToast('Google sign-in is restricted to customer accounts. Staff and administrators must use password authentication.', 'error');
          setIsAuthModalOpen(true);
          return;
        }

        await syncProfileToState(profile, session.user.email || '');

        // Check if user was returning from a Google OAuth redirect
        if (typeof window !== 'undefined') {
          const savedReturnTo = sessionStorage.getItem('urbancare_auth_return_to');
          if (savedReturnTo) {
            sessionStorage.removeItem('urbancare_auth_return_to');
            const SAFE_CUSTOMER_PAGES = new Set([
              'home', 'services', 'projects', 'how-it-works', 'become-partner', 'about', 'contact', 'account'
            ]);
            if (SAFE_CUSTOMER_PAGES.has(savedReturnTo)) {
              setCurrentPage(savedReturnTo);
            } else {
              setCurrentPage('account');
            }
          }

          // Clean OAuth hash from address bar (e.g., #access_token=... or #error=...)
          if (window.location.hash.includes('access_token') || window.location.hash.includes('id_token') || window.location.hash.includes('error')) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }
      }
    };

    const syncSession = async () => {
      // 1. Detect and handle OAuth error hash / query params (e.g. user cancelled Google prompt)
      if (typeof window !== 'undefined') {
        const hash = window.location.hash ? window.location.hash.substring(1) : '';
        const search = window.location.search ? window.location.search.substring(1) : '';
        const hashParams = new URLSearchParams(hash);
        const searchParams = new URLSearchParams(search);

        const error = hashParams.get('error') || searchParams.get('error');
        const errorCode = hashParams.get('error_code') || searchParams.get('error_code');
        const errorDesc = hashParams.get('error_description') || searchParams.get('error_description');

        if (error || errorCode) {
          sessionStorage.removeItem('urbancare_auth_return_to');
          if (error === 'access_denied' || errorCode === '403' || errorDesc?.toLowerCase().includes('denied')) {
            showToast('Google sign-in was cancelled.', 'info');
          } else {
            const cleanDesc = errorDesc ? decodeURIComponent(errorDesc.replace(/\+/g, ' ')) : error || 'Authentication error';
            showToast(`Google sign-in failed: ${cleanDesc}`, 'error');
          }
          window.history.replaceState(null, '', window.location.pathname);
        }
      }

      if (!isSupabaseConfigured()) {
        if (isMounted) setIsAuthLoading(false);
        return;
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.warn('Session retrieval error:', sessionError);
        }

        if (session && isMounted) {
          await handleSessionResolution(session, isMounted, true);
        }
      } catch (err) {
        console.warn('Supabase auth session sync notice:', err);
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    syncSession();

    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        // Skip INITIAL_SESSION here because syncSession() handles initial mount with full loading state
        if (event === 'INITIAL_SESSION') {
          return;
        }

        if (event === 'SIGNED_OUT' || !session) {
          if (hasActiveSessionRef.current && !isExplicitLogoutRef.current) {
            clearSessionData();
            closeAllModals();
            setCurrentPage('home');
            if (typeof window !== 'undefined') {
              window.history.replaceState(null, '', '/');
            }
            showToast('Your session expired, please log in again', 'warning');
            setIsAuthModalOpen(true);
          } else {
            clearSessionData();
          }
          hasActiveSessionRef.current = false;
        } else if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
          await handleSessionResolution(session, isMounted, false);
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }
  }, []);

  // Toast Helpers
  const showToast = (text: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addAuditEntry = (
    action: string,
    entityType: AuditLog['entityType'],
    entityId: string,
    details: string,
    performedBy?: string
  ) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      entityType,
      entityId,
      details,
      performedBy:
        performedBy || (currentRole === 'operations' ? 'Operations Dispatch Supervisor' : 'Customer System'),
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    if (isSupabaseConfigured()) {
      syncAuditLogToSupabase(newLog).catch((err) => {
        console.warn('Supabase audit log sync notice:', err);
      });
    }
  };

  const addCustomer = (customer: CustomerRecord) => {
    setCustomers((prev) => [customer, ...prev]);
    addAuditEntry('CUSTOMER_ADDED', 'VENDOR', customer.id, `Created customer record for ${customer.name}`);
    showToast(`Added customer ${customer.name}`, 'success');
  };

  // Client cooldown tracker: 5 failed attempts -> 30s block
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const checkLoginCooldown = (): boolean => {
    const now = Date.now();
    if (now < cooldownUntil) {
      const secondsLeft = Math.ceil((cooldownUntil - now) / 1000);
      showToast(`Too many failed attempts. Please wait ${secondsLeft}s before trying again.`, 'error');
      return true;
    }
    return false;
  };

  const handleFailedLogin = (customMessage?: string) => {
    const nextAttempts = failedAttempts + 1;
    if (nextAttempts >= 5) {
      setCooldownUntil(Date.now() + 30000);
      setFailedAttempts(0);
      showToast('Too many failed attempts. Sign in locked for 30 seconds.', 'error');
    } else {
      setFailedAttempts(nextAttempts);
      const remaining = 5 - nextAttempts;
      const msg = customMessage || `Incorrect email or password. (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)`;
      showToast(msg, 'error');
    }
  };

  const handleSuccessfulLogin = () => {
    setFailedAttempts(0);
    setCooldownUntil(0);
  };

  const login = async (
    emailOrPhone: string,
    passwordInput: string,
    returnTo?: string
  ): Promise<{ success: boolean; role?: UserRole; mustChangePassword?: boolean; message?: string }> => {
    if (checkLoginCooldown()) {
      return { success: false, message: 'Too many attempts. Please try again after cooldown.' };
    }

    const cleanInput = (emailOrPhone || '').trim();
    const cleanPassword = (passwordInput || '').trim();

    if (!cleanInput || !cleanPassword) {
      showToast('Please enter both email and password.', 'error');
      return { success: false, message: 'Please enter both email and password.' };
    }

    if (isSupabaseConfigured()) {
      try {
        let emailToUse = cleanInput.toLowerCase();
        if (!cleanInput.includes('@')) {
          const cleanPhoneDigits = cleanInput.replace(/\D/g, '');
          const matchedCust = customers.find((c) => c.phone.replace(/\D/g, '').endsWith(cleanPhoneDigits.slice(-10)));
          if (matchedCust && matchedCust.email) {
            emailToUse = matchedCust.email.toLowerCase();
          } else {
            emailToUse = `${cleanPhoneDigits}@resident.urbancaresolution.in`;
          }
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password: cleanPassword
        });

        if (error || !data.user) {
          handleFailedLogin('Incorrect email or password. Please verify and try again.');
          return { success: false, message: 'Incorrect email or password.' };
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError || !profile) {
          console.error('Failed to load profile on login:', profileError);
          handleFailedLogin('Profile could not be loaded.');
          await supabase.auth.signOut();
          return { success: false, message: 'Profile record not found.' };
        }

        handleSuccessfulLogin();
        await syncProfileToState(profile, data.user.email || '');

        let resolvedRole: UserRole = 'customer';
        let targetDestination = 'home';

        if (profile.role === 'admin' || profile.role === 'ops_manager') {
          resolvedRole = 'operations';
          targetDestination = 'admin';
        } else if (profile.role === 'technician') {
          resolvedRole = 'employee';
          targetDestination = 'employee';
        } else if (profile.role === 'vendor') {
          resolvedRole = 'vendor';
          targetDestination = 'vendor';
        } else {
          resolvedRole = 'customer';
          const SAFE_CUSTOMER_PAGES = new Set([
            'home', 'services', 'projects', 'how-it-works', 'become-partner', 'about', 'contact', 'account'
          ]);
          const effectiveReturnTo = returnTo || authReturnTo;
          if (effectiveReturnTo && SAFE_CUSTOMER_PAGES.has(effectiveReturnTo)) {
            targetDestination = effectiveReturnTo;
          } else {
            targetDestination = 'home';
          }
        }

        setAuthReturnTo(null);

        if (profile.must_change_password) {
          showToast('Temporary password in use. Please change your password.', 'warning');
          setCurrentPage('reset-password');
        } else {
          setCurrentPage(targetDestination);
          showToast(`Welcome back, ${profile.full_name || 'User'}!`, 'success');
        }

        return {
          success: true,
          role: resolvedRole,
          mustChangePassword: !!profile.must_change_password
        };
      } catch (err: any) {
        handleFailedLogin('Incorrect email or password. Please verify and try again.');
        return { success: false, message: err?.message || 'Login failed.' };
      }
    }

    // Local offline mock fallback (DEV only)
    if (!import.meta.env.DEV) {
      showToast('Service not configured. Please contact administrator.', 'error');
      return { success: false, message: 'Service not configured.' };
    }

    if (cleanInput.includes('ops') || cleanInput.includes('admin')) {
      if (opsSettings.password && cleanPassword === opsSettings.password) {
        handleSuccessfulLogin();
        setCurrentRoleState('operations');
        setCurrentPage('admin');
        showToast('Welcome, Operations Command Supervisor!', 'success');
        return { success: true, role: 'operations' };
      }
    }

    const matchedEmp = employees.find((e) => (e.email || '').toLowerCase() === cleanInput.toLowerCase() || e.id === cleanInput);
    if (matchedEmp && matchedEmp.password && matchedEmp.password === cleanPassword) {
      handleSuccessfulLogin();
      setCurrentRoleState('employee');
      setCurrentEmployeeIdState(matchedEmp.id);
      setCurrentPage('employee');
      showToast(`Welcome back, ${matchedEmp.name}!`, 'success');
      return { success: true, role: 'employee' };
    }

    const matchedVnd = vendors.find((v) => (v.email || '').toLowerCase() === cleanInput.toLowerCase() || v.id === cleanInput);
    if (matchedVnd && matchedVnd.password && matchedVnd.password === cleanPassword) {
      handleSuccessfulLogin();
      setCurrentRoleState('vendor');
      setCurrentVendorIdState(matchedVnd.id);
      setCurrentPage('vendor');
      showToast(`Welcome back, ${matchedVnd.businessName}!`, 'success');
      return { success: true, role: 'vendor' };
    }

    const cleanPhoneDigits = cleanInput.replace(/\D/g, '');
    const matchedCust = customers.find((c) => {
      const cEmail = (c.email || '').toLowerCase();
      const cDigits = c.phone.replace(/\D/g, '');
      return cEmail === cleanInput.toLowerCase() || (cleanPhoneDigits.length >= 10 && cDigits.endsWith(cleanPhoneDigits.slice(-10)));
    });

    if (matchedCust && matchedCust.password && matchedCust.password === cleanPassword) {
      handleSuccessfulLogin();
      setCurrentUserState(matchedCust);
      setCurrentRoleState('customer');
      setCurrentPage('home');
      showToast(`Welcome back, ${matchedCust.name}!`, 'success');
      return { success: true, role: 'customer' };
    }

    handleFailedLogin('Incorrect email or password.');
    return { success: false, message: 'Incorrect email or password.' };
  };

  const loginWithGoogle = async (returnTo?: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      showToast('Supabase credentials not configured in .env file (Running in offline/local mock mode).', 'warning');
      return;
    }

    try {
      const targetDestination = returnTo || authReturnTo || (currentPage === 'account' ? 'account' : 'home');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('urbancare_auth_return_to', targetDestination);
      }

      const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        }
      });

      if (error) {
        console.error('Google OAuth initialization error:', error);
        showToast(error.message || 'Failed to initiate Google sign-in.', 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in could not be started.';
      console.error('Google OAuth exception:', err);
      showToast(msg, 'error');
    }
  };

  const loginCustomer = async (phoneOrEmail: string, otpOrPassword?: string): Promise<boolean> => {
    const res = await login(phoneOrEmail, otpOrPassword || '');
    return res.success;
  };

  const registerCustomer = async (details: {
    name: string;
    phone: string;
    email?: string;
    locality?: string;
    address?: string;
    password?: string;
  }): Promise<CustomerRecord | null> => {
    const rawPass = (details.password || '').trim();
    const passVal = validatePassword(rawPass);
    if (!passVal.isValid) {
      showToast(passVal.message || 'Password must be at least 8 characters long.', 'error');
      return null;
    }

    const phoneVal = validateIndianPhone(details.phone);
    if (!phoneVal.isValid) {
      showToast(phoneVal.message || 'Please enter a valid Indian mobile number (+91).', 'error');
      return null;
    }

    const emailToUse = (details.email || '').trim() || `${details.phone.replace(/\D/g, '')}@resident.urbancaresolution.in`;
    if (!validateEmail(emailToUse)) {
      showToast('Please enter a valid email address.', 'error');
      return null;
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: emailToUse,
          password: rawPass,
          options: {
            data: {
              full_name: details.name.trim(),
              phone: phoneVal.formatted,
              locality: details.locality || currentLocality,
              address: details.address || '',
            }
          }
        });

        if (error) {
          if (
            error.message?.includes('PHONE_ALREADY_REGISTERED') ||
            error.message?.includes('idx_profiles_phone_normalized') ||
            error.message?.toLowerCase().includes('duplicate')
          ) {
            showToast('This mobile number is already registered. Please log in, or contact support if this is not you.', 'error');
          } else {
            showToast(error.message, 'error');
          }
          return null;
        }

        const newId = data.user?.id || `cust-${Date.now()}`;
        const newCustomer: CustomerRecord = {
          id: newId,
          user_id: newId,
          name: details.name.trim(),
          phone: phoneVal.formatted,
          email: emailToUse,
          locality: details.locality || currentLocality,
          address: details.address || '',
          totalBookings: 0,
          totalSpent: 0,
          registeredDate: new Date().toISOString().split('T')[0],
          status: 'ACTIVE'
        };

        setCustomers((prev) => [newCustomer, ...prev]);
        setCurrentUser(newCustomer);
        setCurrentRole('customer');
        showToast(`Welcome to UrbanCare Solution, ${newCustomer.name}!`, 'success');
        return newCustomer;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Registration failed.';
        if (
          msg.includes('PHONE_ALREADY_REGISTERED') ||
          msg.includes('idx_profiles_phone_normalized') ||
          msg.toLowerCase().includes('duplicate')
        ) {
          showToast('This mobile number is already registered. Please log in, or contact support if this is not you.', 'error');
        } else {
          showToast(msg, 'error');
        }
        return null;
      }
    }

    // Local offline mock fallback (DEV only)
    if (!import.meta.env.DEV) {
      showToast('Service not configured. Please contact administrator.', 'error');
      return null;
    }

    const newCustomer: CustomerRecord = {
      id: `cust-${Date.now()}`,
      name: details.name.trim(),
      phone: phoneVal.formatted,
      email: emailToUse,
      locality: details.locality || currentLocality,
      address: details.address || '',
      password: rawPass,
      totalBookings: 0,
      totalSpent: 0,
      registeredDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    setCurrentUser(newCustomer);
    setCurrentRole('customer');
    showToast(`Welcome to UrbanCare Solution, ${newCustomer.name}!`, 'success');
    return newCustomer;
  };

  const logout = async () => {
    isExplicitLogoutRef.current = true;
    closeAllModals();
    clearSessionData();
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase logout notice:', err);
      }
    }
    setCurrentPage('home');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/');
    }
    showToast('You have been signed out.', 'info');
    setTimeout(() => {
      isExplicitLogoutRef.current = false;
    }, 500);
  };

  const logoutCustomer = async () => {
    await logout();
  };

  const logoutStaff = async () => {
    await logout();
  };

  const loginStaff = async (
    roleOrEmail: string,
    entityIdOrPassword?: string,
    maybePassword?: string
  ): Promise<boolean> => {
    const email = maybePassword !== undefined ? (roleOrEmail === 'operations' ? 'ops@urbancaresolution.in' : roleOrEmail) : roleOrEmail;
    const pass = maybePassword !== undefined ? maybePassword : (entityIdOrPassword || '');
    const res = await login(email, pass);
    return res.success;
  };

  const updateCustomerStatus = (customerId: string, status: CustomerRecord['status']) => {
    setCustomers((prev) => prev.map((c) => (c.id === customerId ? { ...c, status } : c)));
    addAuditEntry('CUSTOMER_STATUS_UPDATED', 'VENDOR', customerId, `Customer status changed to ${status}`);
    showToast(`Customer status updated to ${status}`, 'info');
  };

  const releaseCustomerPhone = (userId: string) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.user_id === userId || c.id === userId
          ? { ...c, phone: '' }
          : c
      )
    );
  };

  const addComplaint = (complaint: Partial<ComplaintRecord>) => {
    const newId = `cmp-${Date.now()}`;
    const full: ComplaintRecord = {
      id: newId,
      user_id: complaint.user_id || authProfile?.id || currentUser?.user_id || currentUser?.id,
      requestId: complaint.requestId || 'PB-GENERAL',
      customerName: complaint.customerName || 'Anonymous',
      customerPhone: complaint.customerPhone || '',
      artisanName: complaint.artisanName,
      issueType: complaint.issueType || 'OTHER',
      description: complaint.description || '',
      severity: complaint.severity || 'MEDIUM',
      status: 'OPEN',
      createdAt: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      ...complaint
    };
    setComplaints((prev) => [full, ...prev]);
    syncComplaintToSupabase(full).catch((err: unknown) => console.warn('Supabase persist complaint notice:', err));
    addAuditEntry('COMPLAINT_LOGGED', 'SERVICE_REQUEST', full.requestId, `Logged ${full.severity} complaint: ${full.issueType}`);
    showToast(`Complaint #${newId} logged for supervisor investigation`, 'warning');
  };

  const resolveComplaint = (id: string, resolutionNotes: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: 'RESOLVED', resolutionNotes, resolvedAt: now } : c
      )
    );
    addAuditEntry('COMPLAINT_RESOLVED', 'SERVICE_REQUEST', id, `Resolution: ${resolutionNotes}`);
    showToast(`Complaint #${id} marked resolved`, 'success');
  };

  const recordPayment = async (pay: Partial<PaymentRecord>): Promise<boolean> => {
    const rawReqId = pay.requestId || 'PB-DIRECT';
    const targetRequestId = rawReqId.replace(/^#/, '');

    const newRecord: PaymentRecord = {
      id: `pay-${Date.now()}`,
      user_id: pay.user_id || authProfile?.id || currentUser?.user_id || currentUser?.id,
      customerName: pay.customerName || 'Customer',
      amount: pay.amount || 0,
      mode: pay.mode || 'UPI',
      status: pay.status || 'SUCCESS',
      transactionRef: pay.transactionRef || `TXN-${Date.now()}`,
      collectedBy: pay.collectedBy || 'Operations Lead',
      date: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      ...pay,
      requestId: targetRequestId
    };

    if (
      isSupabaseConfigured() &&
      targetRequestId &&
      targetRequestId !== 'PB-DIRECT' &&
      targetRequestId !== 'PB-MANUAL' &&
      !targetRequestId.startsWith('ONBOARD-')
    ) {
      const dbMethod: 'CASH' | 'UPI' | 'ONLINE' =
        newRecord.mode === 'CASH' ? 'CASH' :
        newRecord.mode === 'ONLINE_CARD' || newRecord.mode === 'NET_BANKING' ? 'ONLINE' : 'UPI';

      try {
        const rpcResult = await recordPaymentViaRpc(targetRequestId, newRecord.amount, dbMethod);

        if (!rpcResult.success) {
          console.warn('[recordPayment] RPC error, attempting direct service_requests update fallback:', rpcResult.message);
          const updated = await updateServiceRequestInSupabase(targetRequestId, {
            payment_status: 'PAID',
            payment_method: dbMethod
          });

          if (!updated) {
            showToast(`Could not persist payment to database: ${rpcResult.message}`, 'error');
            return false;
          }
        }
      } catch (err: any) {
        console.error('[recordPayment] Error persisting payment to Supabase:', err);
        const updated = await updateServiceRequestInSupabase(targetRequestId, {
          payment_status: 'PAID',
          payment_method: dbMethod
        });
        if (!updated) {
          showToast(`Error recording payment: ${err?.message || 'Network error'}`, 'error');
          return false;
        }
      }
    }

    setPayments((prev) => [newRecord, ...prev]);
    if (newRecord.requestId) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === newRecord.requestId || r.id === rawReqId
            ? { ...r, paymentStatus: 'PAID', paymentMode: newRecord.mode === 'CASH' ? 'CASH' : 'UPI' }
            : r
        )
      );
    }
    addAuditEntry(
      'PAYMENT_RECORDED',
      'SERVICE_REQUEST',
      newRecord.requestId,
      `Recorded ₹${newRecord.amount} (${newRecord.mode}) ref: ${newRecord.transactionRef}`
    );
    showToast(`Payment of ₹${newRecord.amount} logged!`, 'success');
    return true;
  };

  const updateOpsSettings = (updates: Partial<OpsSettings>) => {
    setOpsSettings((prev) => ({ ...prev, ...updates }));
    addAuditEntry('SETTINGS_UPDATED', 'PRICING', 'GLOBAL_SETTINGS', `Updated Operations settings`);
    showToast('Operations settings updated', 'success');
  };

  const addInternalNote = (requestId: string, text: string, author: string = 'Harman (Ops Lead)') => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const newNote: InternalNote = {
      id: `in-${Date.now()}`,
      author,
      text,
      timestamp: now
    };
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, internalNotes: [...(r.internalNotes || []), newNote], updatedAt: now }
          : r
      )
    );
    addAuditEntry('INTERNAL_NOTE_ADDED', 'SERVICE_REQUEST', requestId, `Note by ${author}: "${text.substring(0, 40)}..."`, author);
    showToast('Internal note saved to file', 'success');
  };

  // Pricing & Catalog mutations
  const updateServicePricing = (
    id: string,
    updates: Partial<ServiceItem>,
    reason?: string,
    changedBy?: string
  ) => {
    const currentService = services.find((s) => s.id === id);
    if (!currentService) return;

    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const effectiveDate = updates.effective_from || new Date().toISOString().split('T')[0];
    const operator = changedBy || (currentRole === 'operations' ? 'Operations Dispatch Supervisor' : 'Operations Manager');

    const historyItems: PriceHistoryRecord[] = [];

    const oldBase = currentService.base_price ?? currentService.basePrice;
    const newBase = updates.base_price ?? updates.basePrice;
    if (newBase !== undefined && Number(newBase) !== Number(oldBase)) {
      historyItems.push({
        id: `ph-${Date.now()}-1`,
        serviceId: id,
        serviceName: currentService.name,
        fieldChanged: 'base_price',
        oldValue: oldBase,
        newValue: Number(newBase),
        effectiveFrom: effectiveDate,
        changedBy: operator,
        changedAt: now,
        reason: reason || 'Operations rate adjustment'
      });
    }

    const oldVisit = currentService.visit_fee ?? currentService.visitFee;
    const newVisit = updates.visit_fee ?? updates.visitFee;
    if (newVisit !== undefined && Number(newVisit) !== Number(oldVisit)) {
      historyItems.push({
        id: `ph-${Date.now()}-2`,
        serviceId: id,
        serviceName: currentService.name,
        fieldChanged: 'visit_fee',
        oldValue: oldVisit,
        newValue: Number(newVisit),
        effectiveFrom: effectiveDate,
        changedBy: operator,
        changedAt: now,
        reason: reason || 'Doorstep visit fee update'
      });
    }

    const oldType = currentService.price_type;
    const newType = updates.price_type ?? (updates.pricingType?.toString().toUpperCase() as PriceType);
    if (newType && newType !== oldType) {
      historyItems.push({
        id: `ph-${Date.now()}-3`,
        serviceId: id,
        serviceName: currentService.name,
        fieldChanged: 'price_type',
        oldValue: oldType,
        newValue: newType,
        effectiveFrom: effectiveDate,
        changedBy: operator,
        changedAt: now,
        reason: reason || 'Price type structural modification'
      });
    }

    if (historyItems.length > 0) {
      setPriceHistory((prev) => [...historyItems, ...prev]);
    }

    // Immediately update customer-facing catalog
    let updatedService: ServiceItem | undefined;
    setServices((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          updatedService = normalizeServiceItem({ ...s, ...updates });
          return updatedService;
        }
        return s;
      })
    );

    // Sync in-flight cart items
    setCart((prev) =>
      prev.map((item) =>
        item.serviceId === id
          ? {
              ...item,
              price: newBase !== undefined ? Number(newBase) : item.price,
              visitFee: newVisit !== undefined ? Number(newVisit) : item.visitFee,
              price_type: newType || item.price_type
            }
          : item
      )
    );

    addAuditEntry(
      'PRICING_UPDATED',
      'PRICING',
      id,
      `Updated ${currentService.name} (${Object.keys(updates).join(', ')}). Reason: ${reason || 'Rate modification'}`
    );
    showToast(`Updated pricing for ${currentService.name}`, 'success');

    if (isSupabaseConfigured() && updatedService) {
      syncServiceToSupabase(updatedService).catch((err) => {
        console.error('Failed to sync service pricing update to Supabase:', err);
      });
    }
  };

  const toggleServiceActive = (id: string) => {
    let targetService: ServiceItem | undefined;
    setServices((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          targetService = { ...s, active: !s.active };
          return targetService;
        }
        return s;
      })
    );
    showToast(`Service visibility updated`, 'info');
    if (isSupabaseConfigured() && targetService) {
      syncServiceToSupabase(targetService).catch((err) => {
        console.error('Failed to sync service visibility to Supabase:', err);
      });
    }
  };

  const addService = (newService: ServiceItem) => {
    const normalized = normalizeServiceItem(newService);
    setServices((prev) => [normalized, ...prev]);
    addAuditEntry('SERVICE_CREATED', 'PRICING', normalized.id, `Created service: ${normalized.name}`);
    showToast(`New service added to catalog`, 'success');
    if (isSupabaseConfigured()) {
      syncServiceToSupabase(normalized).catch((err) => {
        console.error('Failed to sync new service to Supabase:', err);
      });
    }
  };

  const deleteService = async (id: string): Promise<boolean> => {
    const target = services.find((s) => s.id === id);
    const serviceName = target?.name || id;

    // Immediately remove from customer-facing state & cart
    setServices((prev) => prev.filter((s) => s.id !== id));
    setCart((prev) => prev.filter((item) => item.serviceId !== id));

    addAuditEntry('SERVICE_DELETED', 'PRICING', id, `Deleted service: ${serviceName}`);
    showToast(`Deleted service: ${serviceName}`, 'info');

    if (isSupabaseConfigured()) {
      const ok = await deleteServiceFromSupabase(id);
      if (!ok) {
        showToast('Notice: Could not permanently delete from Supabase.', 'error');
        return false;
      }
    }
    return true;
  };

  const updatePackage = (id: string, updates: Partial<ServicePackage>) => {
    let targetPkg: ServicePackage | undefined;
    setPackages((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          targetPkg = { ...p, ...updates };
          return targetPkg;
        }
        return p;
      })
    );
    showToast(`Care package updated`, 'success');
    if (isSupabaseConfigured() && targetPkg) {
      syncServicePackageToSupabase(targetPkg).catch((err) => {
        console.error('Failed to sync care package to Supabase:', err);
      });
    }
  };

  const deletePackage = async (id: string): Promise<boolean> => {
    const target = packages.find((p) => p.id === id);
    const packageName = target?.name || id;

    setPackages((prev) => prev.filter((p) => p.id !== id));
    setCart((prev) => prev.filter((item) => item.serviceId !== id));

    addAuditEntry('PACKAGE_DELETED', 'PRICING', id, `Deleted package: ${packageName}`);
    showToast(`Deleted package: ${packageName}`, 'info');

    if (isSupabaseConfigured()) {
      const ok = await deleteServicePackageFromSupabase(id);
      if (!ok) {
        showToast('Notice: Could not permanently delete package from Supabase.', 'error');
        return false;
      }
    }
    return true;
  };

  // Cart operations
  const addToCart = (service: ServiceItem, quantity: number = 1) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      showToast('Please sign in or register to add items to your basket.', 'info');
      return;
    }

    const pType = service.price_type || (service.pricingType?.toString().toUpperCase() as PriceType) || 'FIXED';
    const effectivePrice = service.base_price ?? service.basePrice ?? 0;
    const effectiveVisit = service.visit_fee ?? service.visitFee ?? 99;

    setCart((prev) => {
      const existing = prev.find((item) => item.serviceId === service.id);
      if (existing) {
        return prev.map((item) =>
          item.serviceId === service.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          serviceId: service.id,
          serviceName: service.name,
          category: service.category,
          price: effectivePrice,
          visitFee: effectiveVisit,
          quantity,
          price_type: pType
        }
      ];
    });
    showToast(`Added ${service.name} to basket`, 'success');
  };

  const addPackageToCart = (pkg: ServicePackage) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.serviceId === pkg.id);
      if (existing) {
        return prev.map((item) =>
          item.serviceId === pkg.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          serviceId: pkg.id,
          serviceName: pkg.name,
          category: pkg.category,
          price: pkg.price,
          visitFee: 0,
          quantity: 1,
          isPackage: true,
          price_type: 'PACKAGE'
        }
      ];
    });
    showToast(`Added combo package to basket`, 'success');
  };

  const removeFromCart = (serviceId: string) => {
    setCart((prev) => prev.filter((item) => item.serviceId !== serviceId));
  };

  const updateCartQuantity = (serviceId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.serviceId === serviceId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const orderPricing = calculateOrderPricing(cart, services);
  const cartTotal = {
    itemSubtotal: orderPricing.itemSubtotal,
    visitFee: orderPricing.visitFee,
    taxPercent: orderPricing.taxPercent,
    taxAmount: orderPricing.taxAmount,
    discountAmount: orderPricing.discountAmount,
    total: orderPricing.total,
    hasQuoteRequired: orderPricing.hasQuoteRequired,
    itemCount: orderPricing.itemCount
  };

  // Booking Creation
  const createBookingFromCart = (details: {
    customerName: string;
    customerPhone: string;
    locality: string;
    address: string;
    landmark?: string;
    preferredDate: string;
    preferredTimeSlot: string;
    notes?: string;
  }): string => {
    if (!isSupabaseConfigured() && !import.meta.env.DEV) {
      showToast('Service not configured. Please contact administrator.', 'error');
      return '';
    }
    if (cart.length === 0) return '';
    const newId = `PB-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

    const newRequest: ServiceRequest = {
      id: newId,
      user_id: authProfile?.id || currentUser?.user_id || currentUser?.id,
      customerName: details.customerName,
      customerPhone: details.customerPhone,
      locality: details.locality,
      address: details.address,
      landmark: details.landmark,
      requestType: 'STANDARD_SERVICE',
      items: cart.map((c) => ({
        serviceId: c.serviceId,
        serviceName: c.serviceName,
        quantity: c.quantity,
        price: c.price,
        price_type: c.price_type,
        isPackage: c.isPackage
      })),
      subtotal: cartTotal.itemSubtotal,
      visitFee: cartTotal.visitFee,
      taxAmount: cartTotal.taxAmount,
      discountAmount: cartTotal.discountAmount,
      total: cartTotal.total,
      hasQuoteRequired: cartTotal.hasQuoteRequired,
      preferredDate: details.preferredDate,
      preferredTimeSlot: details.preferredTimeSlot,
      notes: details.notes || 'Instant standard booking',
      status: 'NEW', // Operations central control: always starts at NEW for manual supervisor review!
      assignedTo: null,
      statusHistory: [
        {
          status: 'NEW',
          timestamp: now,
          updatedBy: 'Customer App',
          note: 'Request created. Queued for Operations manual review.'
        }
      ],
      assignmentHistory: [],
      createdAt: now,
      updatedAt: now,
      paymentStatus: 'PENDING_ON_COMPLETION'
    };

    setRequests((prev) => [newRequest, ...prev]);
    syncServiceRequestToSupabase(newRequest).catch((err: unknown) => console.warn('Supabase persist booking notice:', err));
    clearCart();
    addAuditEntry('REQUEST_CREATED', 'SERVICE_REQUEST', newId, `Order created for ${details.locality} (₹${cartTotal.total})`);
    showToast(`Order ${newId} confirmed! Sent to Operations queue for manual dispatch.`, 'success');
    setActiveTrackingRequestId(newId);
    return newId;
  };

  // Custom Requirement Submission
  const createCustomRequirement = (details: {
    customerName: string;
    customerPhone: string;
    locality: string;
    address: string;
    requirementText: string;
    preferredDate: string;
    preferredTimeSlot: string;
    category?: string;
  }): string => {
    if (!isSupabaseConfigured() && !import.meta.env.DEV) {
      showToast('Service not configured. Please contact administrator.', 'error');
      return '';
    }
    const newId = `PB-CUST-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

    const newRequest: ServiceRequest = {
      id: newId,
      user_id: authProfile?.id || currentUser?.user_id || currentUser?.id,
      customerName: details.customerName,
      customerPhone: details.customerPhone,
      locality: details.locality,
      address: details.address,
      requestType: 'CUSTOM_REQUIREMENT',
      items: [
        {
          serviceName: `Custom: ${details.category || 'Domestic Repair'}`,
          quantity: 1,
          price: 199 // Standard diagnostic visit rate
        }
      ],
      subtotal: 199,
      visitFee: 99,
      total: 298,
      preferredDate: details.preferredDate,
      preferredTimeSlot: details.preferredTimeSlot,
      notes: details.requirementText,
      status: 'UNDER REVIEW',
      assignedTo: null,
      statusHistory: [
        {
          status: 'NEW',
          timestamp: now,
          updatedBy: 'Customer App',
          note: 'Custom requirement posted.'
        },
        {
          status: 'UNDER REVIEW',
          timestamp: now,
          updatedBy: 'Operations Dispatch Central',
          note: 'Supervisor isolating required tool kit and technician trade.'
        }
      ],
      assignmentHistory: [],
      createdAt: now,
      updatedAt: now,
      paymentStatus: 'PENDING_ON_COMPLETION'
    };

    setRequests((prev) => [newRequest, ...prev]);
    syncServiceRequestToSupabase(newRequest).catch((err: unknown) => console.warn('Supabase persist custom task notice:', err));
    addAuditEntry('CUSTOM_TASK_POSTED', 'SERVICE_REQUEST', newId, `Requirement: ${details.requirementText.substring(0, 40)}...`);
    showToast(`Custom task ${newId} submitted. Supervisor will review and call you.`, 'success');
    setActiveTrackingRequestId(newId);
    return newId;
  };

  // Home Project Submission
  const createProjectRequest = (details: {
    customerName: string;
    customerPhone: string;
    locality: string;
    address: string;
    projectType: string;
    propertyType: string;
    approxAreaSqFt: number;
    budgetRange: string;
    preferredStartDate: string;
    description: string;
  }): string => {
    if (!isSupabaseConfigured() && !import.meta.env.DEV) {
      showToast('Service not configured. Please contact administrator.', 'error');
      return '';
    }
    const newId = `PRJ-${Math.floor(500 + Math.random() * 499)}`;
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

    const newProject: HomeProjectRequest = {
      id: newId,
      user_id: authProfile?.id || currentUser?.user_id || currentUser?.id,
      customerName: details.customerName,
      customerPhone: details.customerPhone,
      locality: details.locality,
      address: details.address,
      projectType: details.projectType,
      propertyType: details.propertyType,
      approxAreaSqFt: details.approxAreaSqFt,
      budgetRange: details.budgetRange,
      preferredStartDate: details.preferredStartDate,
      description: details.description,
      status: 'UNDER_REVIEW',
      notes: 'Customer requested civil measurement & quote.',
      createdAt: now
    };

    setProjectRequests((prev) => [newProject, ...prev]);
    syncHomeProjectToSupabase(newProject).catch((err: unknown) => console.warn('Supabase persist project notice:', err));
    addAuditEntry('PROJECT_REQUESTED', 'SERVICE_REQUEST', newId, `Project: ${details.projectType} in ${details.locality}`);
    showToast(`Project quote request ${newId} logged! Civil supervisor assigned shortly.`, 'success');
    return newId;
  };

  // Operations Review & Status Updates
  const updateRequestStatus = (requestId: string, newStatus: BookingStatus, note?: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id === requestId) {
          const newHistory = [
            ...req.statusHistory,
            {
              status: newStatus,
              timestamp: now,
              updatedBy: currentRole === 'operations' ? 'Operations Manager' : 'System',
              note: note || `Status updated to ${newStatus}`
            }
          ];

          return {
            ...req,
            status: newStatus,
            updatedAt: now,
            statusHistory: newHistory,
            paymentStatus: newStatus === 'COMPLETED' || newStatus === 'CUSTOMER CONFIRMED' ? 'PAID' : req.paymentStatus
          };
        }
        return req;
      })
    );
    addAuditEntry('STATUS_CHANGED', 'SERVICE_REQUEST', requestId, `Status -> ${newStatus}. Note: ${note || 'None'}`);
    showToast(`Request ${requestId} status updated to ${newStatus}`, 'info');

    if (isSupabaseConfigured()) {
      updateServiceRequestInSupabase(requestId, {
        status: newStatus,
        technician_notes: note || undefined,
        payment_status: newStatus === 'COMPLETED' || newStatus === 'CUSTOMER CONFIRMED' ? 'PAID' : undefined
      }).catch((err) => {
        console.error('Failed to sync status update to Supabase:', err);
      });
    }
  };

  // MANUAL ASSIGNMENT (Critical Operations Core)
  // Vendor opportunity deduction happens HERE, never on initial customer booking!
  const assignRequest = (
    requestId: string,
    assigneeId: string,
    assigneeType: 'EMPLOYEE' | 'VENDOR',
    notes?: string,
    assignedBy?: string,
    reason?: string
  ) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    let assignedInfo: ServiceRequest['assignedTo'] = null;

    if (assigneeType === 'EMPLOYEE') {
      const emp = employees.find((e) => e.id === assigneeId);
      if (!emp) return;
      assignedInfo = {
        id: emp.id,
        name: emp.name,
        type: 'EMPLOYEE',
        phone: emp.mobile,
        rating: `${emp.rating} ★`,
        hub: emp.serviceAreas[0] || 'Kharar Central'
      };

      // Update employee active jobs count
      setEmployees((prev) =>
        prev.map((e) => (e.id === assigneeId ? { ...e, activeJobs: e.activeJobs + 1 } : e))
      );
    } else {
      const vnd = vendors.find((v) => v.id === assigneeId);
      if (!vnd) return;

      if (vnd.plan.remainingOpportunities <= 0) {
        showToast(`Vendor ${vnd.businessName} has 0 remaining work opportunities! Please recharge plan or adjust quota.`, 'error');
        return;
      }

      assignedInfo = {
        id: vnd.id,
        name: `${vnd.businessName} (${vnd.ownerName})`,
        type: 'VENDOR',
        phone: vnd.mobile,
        rating: `${vnd.rating} ★`,
        hub: vnd.serviceAreas[0] || 'Mohali Belt'
      };

      // DEDUCT WORK OPPORTUNITY FROM VENDOR PLAN
      const newUsed = vnd.plan.usedOpportunities + 1;
      const newRemaining = vnd.plan.totalOpportunities - newUsed;

      setVendors((prev) =>
        prev.map((v) =>
          v.id === assigneeId
            ? {
                ...v,
                activeJobs: v.activeJobs + 1,
                plan: {
                  ...v.plan,
                  usedOpportunities: newUsed,
                  remainingOpportunities: Math.max(0, newRemaining)
                }
              }
            : v
        )
      );

      // Record in Opportunity Ledger
      const ledgerEntry: OpportunityLedgerEntry = {
        id: `led-${Date.now()}`,
        vendorId: vnd.id,
        vendorName: vnd.businessName,
        change: -1,
        balanceAfter: Math.max(0, newRemaining),
        reason: `Consumed Qualified Work Opportunity for Order ${requestId}`,
        performedBy: assignedBy || 'Operations Supervisor (Manual Dispatch)',
        timestamp: now,
        serviceRequestId: requestId
      };
      setOpportunityLedger((prev) => [ledgerEntry, ...prev]);
    }

    const previousAssigneeName = req.assignedTo?.name || null;

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const assignmentRecord: AssignmentHistoryItem = {
            id: `asg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            assignedBy: assignedBy || 'Harman (Ops Lead)',
            assignedTo: assignedInfo?.name || '',
            assignedToName: assignedInfo?.name || '',
            assigneeType,
            timestamp: now,
            previousAssignee: previousAssigneeName,
            previousAssigneeName,
            reason: reason || (r.assignedTo ? 'Reassignment requested' : 'Initial Dispatch Assignment'),
            notes: notes || 'Manual supervisor dispatch'
          };

          return {
            ...r,
            status: 'ASSIGNED',
            assignedTo: assignedInfo,
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: 'ASSIGNED',
                timestamp: now,
                updatedBy: assignedBy || 'Operations Dispatch Supervisor',
                note: `Manually assigned to ${assignedInfo?.name}`
              }
            ],
            assignmentHistory: [
              ...r.assignmentHistory,
              assignmentRecord
            ]
          };
        }
        return r;
      })
    );

    addAuditEntry(
      'MANUAL_ASSIGNMENT',
      'SERVICE_REQUEST',
      requestId,
      `Assigned to ${assignedInfo?.name} (${assigneeType}). Notes: ${notes || 'None'}. Reason: ${reason || 'Standard dispatch'}`,
      assignedBy || 'Harman (Ops Lead)'
    );
    showToast(`Manually assigned ${assignedInfo?.name} to request ${requestId}`, 'success');

    if (isSupabaseConfigured()) {
      updateServiceRequestInSupabase(requestId, {
        status: 'ASSIGNED',
        assigned_to: assignedInfo,
        technician_notes: notes || undefined
      }).catch((err) => {
        console.error('Failed to sync assignment to Supabase:', err);
      });

      if (assigneeType === 'VENDOR') {
        const vnd = vendors.find((v) => v.id === assigneeId);
        if (vnd) {
          const newUsed = vnd.plan.usedOpportunities + 1;
          const newRemaining = vnd.plan.totalOpportunities - newUsed;
          const ledgerEntry: OpportunityLedgerEntry = {
            id: `led-${Date.now()}`,
            vendorId: vnd.id,
            vendorName: vnd.businessName,
            change: -1,
            balanceAfter: Math.max(0, newRemaining),
            reason: `Consumed Qualified Work Opportunity for Order ${requestId}`,
            performedBy: assignedBy || 'Operations Supervisor (Manual Dispatch)',
            timestamp: now,
            serviceRequestId: requestId
          };
          syncOpportunityLedgerToSupabase(ledgerEntry).catch((err) => {
            console.error('Failed to sync opportunity ledger to Supabase:', err);
          });
          syncVendorToSupabase({
            ...vnd,
            activeJobs: vnd.activeJobs + 1,
            plan: {
              ...vnd.plan,
              usedOpportunities: newUsed,
              remainingOpportunities: Math.max(0, newRemaining)
            }
          }).catch((err) => {
            console.error('Failed to sync vendor quota to Supabase:', err);
          });
        }
      }
    }
  };

  const reassignRequest = (
    requestId: string,
    newAssigneeId: string,
    assigneeType: 'EMPLOYEE' | 'VENDOR',
    reason: string,
    notes?: string,
    assignedBy?: string
  ) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const oldAssigneeName = req.assignedTo?.name || 'Previous Artisan';

    // Call assignRequest which handles new assignment and status
    assignRequest(requestId, newAssigneeId, assigneeType, notes, assignedBy || 'Harman (Ops Lead)', reason);

    addAuditEntry(
      'REASSIGNMENT_EXECUTED',
      'SERVICE_REQUEST',
      requestId,
      `Reassigned from ${oldAssigneeName} to new artisan. Reason: ${reason}. Notes: ${notes || 'None'}`,
      assignedBy || 'Harman (Ops Lead)'
    );
    showToast(`Request ${requestId} reassigned. Reason logged in audit log.`, 'info');
  };

  // Vendor Opportunity Ledger Adjustments
  const adjustVendorOpportunities = (vendorId: string, delta: number, reason: string) => {
    const vnd = vendors.find((v) => v.id === vendorId);
    if (!vnd) return;

    const newTotal = vnd.plan.totalOpportunities + delta;
    const newRemaining = newTotal - vnd.plan.usedOpportunities;
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

    setVendors((prev) =>
      prev.map((v) =>
        v.id === vendorId
          ? {
              ...v,
              plan: {
                ...v.plan,
                totalOpportunities: newTotal,
                remainingOpportunities: newRemaining
              }
            }
          : v
      )
    );

    const ledgerEntry: OpportunityLedgerEntry = {
      id: `led-${Date.now()}`,
      vendorId: vnd.id,
      vendorName: vnd.businessName,
      change: delta,
      balanceAfter: newRemaining,
      reason,
      performedBy: 'Operations Manager',
      timestamp: now
    };
    setOpportunityLedger((prev) => [ledgerEntry, ...prev]);

    addAuditEntry(
      'OPPORTUNITY_ADJUSTMENT',
      'OPPORTUNITY',
      vendorId,
      `Delta ${delta > 0 ? '+' : ''}${delta} opportunities. Reason: ${reason}`
    );
    showToast(`Adjusted opportunities for ${vnd.businessName}: ${delta > 0 ? '+' : ''}${delta}`, 'success');
  };

  const updateVendorStatus = (vendorId: string, status: Vendor['status']) => {
    let updatedVnd: Vendor | null = null;
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id === vendorId) {
          updatedVnd = {
            ...v,
            status,
            documentsVerified: status === 'ACTIVE' ? true : v.documentsVerified
          };
          return updatedVnd;
        }
        return v;
      })
    );
    if (updatedVnd && isSupabaseConfigured()) {
      syncVendorToSupabase(updatedVnd).catch((err) => {
        console.error('Failed to sync vendor status to Supabase:', err);
      });
    }
    const vnd = vendors.find((v) => v.id === vendorId);
    const name = vnd ? vnd.businessName : vendorId;
    addAuditEntry(
      status === 'ACTIVE' ? 'VENDOR_ACTIVATED' : 'VENDOR_STATUS_CHANGE',
      'VENDOR',
      vendorId,
      `Operations Manager set status of ${name} to ${status}`
    );
    if (status === 'ACTIVE') {
      showToast(`Vendor "${name}" approved & profile successfully activated by Operations Manager!`, 'success');
    } else {
      showToast(`Vendor "${name}" status updated to ${status}`, 'info');
    }
  };

  const approveVendorWithPayment = async (
    vendorId: string,
    paymentDetails: VendorOnboardingPayment
  ): Promise<boolean> => {
    const vnd = vendors.find((v) => v.id === vendorId);
    if (!vnd) {
      showToast('Vendor not found', 'error');
      return false;
    }

    // 1. Update vendor record with ACTIVE status, verified docs, and onboardingPayment
    const updatedVendor: Vendor = {
      ...vnd,
      status: 'ACTIVE',
      documentsVerified: true,
      onboardingPayment: paymentDetails,
      plan: {
        ...vnd.plan,
        onboardingPayment: paymentDetails
      }
    };

    setVendors((prev) => prev.map((v) => (v.id === vendorId ? updatedVendor : v)));

    // 2. Persist updated vendor to Supabase if configured
    if (isSupabaseConfigured()) {
      approveVendorViaEdgeFunction(vendorId, paymentDetails)
        .then((res) => {
          if (res.vendor) {
            setVendors((prev) => prev.map((v) => (v.id === vendorId ? res.vendor! : v)));
          }
        })
        .catch((err) => {
          console.error('Failed to approve vendor via edge function, falling back to direct sync:', err);
          syncVendorToSupabase(updatedVendor).catch((err2) => {
            console.error('Failed to sync approved vendor to Supabase:', err2);
          });
        });
    }

    // 3. Create and record PaymentRecord for financial ledger tracking
    const mode =
      paymentDetails.method === 'CHEQUE'
        ? 'CHEQUE'
        : paymentDetails.method === 'CASH'
        ? 'CASH'
        : 'ONLINE';
    const status =
      paymentDetails.method === 'CHEQUE' && paymentDetails.chequeClearingStatus === 'PENDING_CLEARANCE'
        ? 'PENDING'
        : 'SUCCESS';

    const paymentRecord: PaymentRecord = {
      id: `pay-vnd-${Date.now()}`,
      requestId: `ONBOARD-${vnd.id}`,
      customerName: `Vendor: ${vnd.businessName} (${vnd.ownerName})`,
      amount: Number(paymentDetails.amount),
      mode,
      status,
      transactionRef: paymentDetails.transactionRef,
      collectedBy: paymentDetails.collectedBy || authProfile?.full_name || 'Operations Lead',
      date: paymentDetails.paidAt || new Date().toISOString().split('T')[0],
      paymentType: 'VENDOR_ONBOARDING',
      notes: `${paymentDetails.method} payment for ${vnd.plan.name} onboarding plan. ${
        paymentDetails.method === 'CHEQUE'
          ? `Cheque #${paymentDetails.transactionRef} (${paymentDetails.bankName || 'Bank'}), Date: ${paymentDetails.chequeDate || 'N/A'}`
          : paymentDetails.method === 'CASH'
          ? `Receipt #${paymentDetails.receiptNumber || paymentDetails.transactionRef}`
          : `UTR/Ref: ${paymentDetails.transactionRef}`
      }. ${paymentDetails.notes || ''}`
    };

    setPayments((prev) => [paymentRecord, ...prev]);

    // Also persist to Supabase payments via recordPayment
    if (isSupabaseConfigured()) {
      recordPayment(paymentRecord).catch((err) => {
        console.error('Failed to persist onboarding payment record to Supabase:', err);
      });
    }

    // 4. Audit entry
    addAuditEntry(
      'VENDOR_ACTIVATED_WITH_PAYMENT',
      'VENDOR',
      vendorId,
      `Vendor "${vnd.businessName}" approved & activated. Plan fee of ₹${paymentDetails.amount} received via ${paymentDetails.method} (${paymentDetails.transactionRef}). Collected by ${paymentDetails.collectedBy}.`
    );

    showToast(
      `Vendor "${vnd.businessName}" approved! ₹${paymentDetails.amount} recorded via ${paymentDetails.method}.`,
      'success'
    );
    return true;
  };

  const updateVendorPaymentStatus = async (
    vendorId: string,
    clearingStatus: 'CLEARED' | 'PENDING_CLEARANCE'
  ): Promise<boolean> => {
    let updatedVnd: Vendor | null = null;
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id === vendorId && v.onboardingPayment) {
          const updatedPayment: VendorOnboardingPayment = {
            ...v.onboardingPayment,
            chequeClearingStatus: clearingStatus
          };
          updatedVnd = {
            ...v,
            onboardingPayment: updatedPayment,
            plan: {
              ...v.plan,
              onboardingPayment: updatedPayment
            }
          };
          return updatedVnd;
        }
        return v;
      })
    );

    if (updatedVnd && isSupabaseConfigured()) {
      syncVendorToSupabase(updatedVnd).catch((err) => {
        console.error('Failed to sync vendor payment status to Supabase:', err);
      });
    }

    // Also update payment record status if exists
    setPayments((prev) =>
      prev.map((p) =>
        p.requestId === `ONBOARD-${vendorId}`
          ? { ...p, status: clearingStatus === 'CLEARED' ? 'SUCCESS' : 'PENDING' }
          : p
      )
    );

    addAuditEntry(
      'VENDOR_CHEQUE_STATUS_UPDATED',
      'VENDOR',
      vendorId,
      `Vendor ${vendorId} cheque status marked as ${clearingStatus}`
    );

    showToast(
      `Cheque status updated to ${clearingStatus === 'CLEARED' ? 'Cleared' : 'Pending Clearance'}`,
      'success'
    );
    return true;
  };

  const addVendor = async (vendor: Vendor): Promise<boolean> => {
    setVendors((prev) => [vendor, ...prev]);
    if (isSupabaseConfigured()) {
      const res = await submitPartnerApplication(vendor);
      if (!res.success) {
        setVendors((prev) => prev.filter((v) => v.id !== vendor.id));
        showToast(res.error || 'Failed to submit partner application.', 'error');
        throw new Error(res.error || 'Failed to submit partner application.');
      }
      if (res.vendor) {
        setVendors((prev) => prev.map((v) => (v.id === vendor.id ? res.vendor! : v)));
      }
    }
    addAuditEntry('VENDOR_REGISTERED', 'VENDOR', vendor.id, `Created vendor: ${vendor.businessName}`);
    showToast(`Registered new vendor partner ${vendor.businessName}`, 'success');
    return true;
  };

  // VENDOR PORTAL ACTIONS (Role-protected & privacy-conscious)
  const vendorAcceptAssignment = (requestId: string, notes?: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const currentVendor = vendors.find((v) => v.id === currentVendorId);
    const vendorName = currentVendor?.businessName || req.assignedTo?.name || 'Vendor Partner';

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'ACCEPTED',
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: 'ACCEPTED',
                timestamp: now,
                updatedBy: `${vendorName} (Partner Portal)`,
                note: notes || 'Opportunity accepted. Customer contact and full address unlocked.'
              }
            ]
          };
        }
        return r;
      })
    );

    addAuditEntry(
      'VENDOR_ACCEPTED_ASSIGNMENT',
      'SERVICE_REQUEST',
      requestId,
      `${vendorName} accepted dispatch assignment. Privacy gate unlocked.`,
      vendorName
    );

    showToast('Opportunity accepted! Full customer contact and address details unlocked.', 'success');

    if (isSupabaseConfigured()) {
      updateServiceRequestInSupabase(requestId, {
        status: 'ACCEPTED'
      }).catch((err) => console.error('Failed to sync vendor accept job to Supabase:', err));
    }
  };

  const vendorRejectAssignment = (requestId: string, reason: string, notes?: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const currentVendor = vendors.find((v) => v.id === currentVendorId);
    const vendorName = currentVendor?.businessName || req.assignedTo?.name || 'Vendor Partner';

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'REASSIGNMENT REQUIRED',
            vendorRejectionReason: reason,
            assignedTo: null,
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: 'REASSIGNMENT REQUIRED',
                timestamp: now,
                updatedBy: `${vendorName} (Partner Portal)`,
                note: `Declined assignment. Reason: ${reason}. ${notes ? `Note: ${notes}` : ''}`
              }
            ]
          };
        }
        return r;
      })
    );

    addAuditEntry(
      'VENDOR_REJECTED_ASSIGNMENT',
      'SERVICE_REQUEST',
      requestId,
      `${vendorName} declined assignment. Reason: ${reason}. Returned to Operations board.`,
      vendorName
    );

    showToast('Assignment declined. Job returned to Operations Dispatch board.', 'info');

    if (isSupabaseConfigured()) {
      updateServiceRequestInSupabase(requestId, {
        status: 'REASSIGNMENT REQUIRED',
        assigned_to: null,
        technician_notes: `Vendor declined: ${reason}. ${notes || ''}`
      }).catch((err) => console.error('Failed to sync vendor reject job to Supabase:', err));
    }
  };

  const vendorConfirmSchedule = (requestId: string, confirmedSlot: string, notes?: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const currentVendor = vendors.find((v) => v.id === currentVendorId);
    const vendorName = currentVendor?.businessName || 'Vendor Partner';

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'SCHEDULED',
            confirmedScheduleSlot: confirmedSlot,
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: 'SCHEDULED',
                timestamp: now,
                updatedBy: `${vendorName} (Partner Portal)`,
                note: `Schedule confirmed: ${confirmedSlot}. ${notes || ''}`
              }
            ]
          };
        }
        return r;
      })
    );

    addAuditEntry(
      'SCHEDULE_CONFIRMED',
      'SERVICE_REQUEST',
      requestId,
      `Schedule confirmed for ${confirmedSlot} by ${vendorName}`,
      vendorName
    );

    showToast(`Schedule confirmed for ${confirmedSlot}`, 'success');

    if (isSupabaseConfigured()) {
      updateServiceRequestInSupabase(requestId, {
        status: 'SCHEDULED',
        vendor_scheduled_time: confirmedSlot,
        technician_notes: notes || undefined
      }).catch((err) => console.error('Failed to sync vendor schedule to Supabase:', err));
    }
  };

  const vendorMarkArrived = (requestId: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const currentVendor = vendors.find((v) => v.id === currentVendorId);
    const vendorName = currentVendor?.businessName || 'Vendor Partner';

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            vendorArrivalStatus: 'ARRIVED',
            arrivedAt: now,
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: r.status,
                timestamp: now,
                updatedBy: `${vendorName} (Doorstep Check-in)`,
                note: 'Artisan reached customer doorstep.'
              }
            ]
          };
        }
        return r;
      })
    );

    addAuditEntry(
      'VENDOR_ARRIVED',
      'SERVICE_REQUEST',
      requestId,
      `${vendorName} marked doorstep arrival at customer location.`,
      vendorName
    );

    showToast('Doorstep arrival confirmed!', 'success');

    if (isSupabaseConfigured()) {
      updateServiceRequestInSupabase(requestId, {
        vendor_arrival_status: 'ARRIVED'
      }).catch((err) => console.error('Failed to sync vendor arrival to Supabase:', err));
    }
  };

  const vendorStartWork = (requestId: string, notes?: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const currentVendor = vendors.find((v) => v.id === currentVendorId);
    const vendorName = currentVendor?.businessName || 'Vendor Partner';

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'IN PROGRESS',
            workStartedAt: now,
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: 'IN PROGRESS',
                timestamp: now,
                updatedBy: `${vendorName} (Partner Portal)`,
                note: notes || 'Service diagnostics and repair work commenced on site.'
              }
            ]
          };
        }
        return r;
      })
    );

    addAuditEntry(
      'WORK_STARTED',
      'SERVICE_REQUEST',
      requestId,
      `${vendorName} commenced work on site.`,
      vendorName
    );

    showToast('Work started! Status updated to In Progress.', 'info');

    if (isSupabaseConfigured()) {
      updateServiceRequestInSupabase(requestId, {
        status: 'IN PROGRESS',
        work_started_at: new Date().toISOString()
      }).catch((err) => console.error('Failed to sync vendor start work to Supabase:', err));
    }
  };

  const vendorUploadCompletionPhotos = (requestId: string, photos: string[]) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const existing = r.completionPhotos || [];
          const combined = Array.from(new Set([...existing, ...photos]));
          return {
            ...r,
            completionPhotos: combined,
            updatedAt: now
          };
        }
        return r;
      })
    );
    showToast(`${photos.length} completion photo(s) saved!`, 'success');
  };

  const vendorAddNotes = (requestId: string, note: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const existing = r.vendorNotes || [];
          return {
            ...r,
            vendorNotes: [...existing, `[${now}] ${note}`],
            updatedAt: now
          };
        }
        return r;
      })
    );
    showToast('Job observation note saved.', 'success');
  };

  const vendorCompleteJob = async (
    requestId: string,
    paymentMode: 'CASH' | 'UPI' | 'ONLINE',
    notes?: string,
    photos?: string[],
    customerOtp?: string
  ) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const currentVendor = vendors.find((v) => v.id === currentVendorId);
    const vendorName = currentVendor?.businessName || req.assignedTo?.name || 'Vendor Partner';

    // SEC-05: Mandatory customer verification OTP via database RPC verify_job_otp()
    if (!customerOtp || !customerOtp.trim()) {
      showToast('Customer verification OTP is required to complete this job.', 'error');
      return;
    }

    const otpResult = await verifyJobOtpViaRpc(requestId, customerOtp.trim());
    if (!otpResult.success) {
      if (otpResult.code === 'LOCKED') {
        showToast(
          'Verification Locked: 5 failed OTP attempts. Please contact the operations team to unlock this booking.',
          'error'
        );
      } else {
        showToast(otpResult.message || 'Invalid customer OTP provided.', 'error');
      }
      return;
    }

    // SEC-02: Record payment via database RPC record_payment()
    await recordPaymentViaRpc(requestId, req.total, paymentMode);

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const existingPhotos = r.completionPhotos || [];
          const combinedPhotos = photos ? Array.from(new Set([...existingPhotos, ...photos])) : existingPhotos;
          const existingNotes = r.vendorNotes || [];
          const combinedNotes = notes ? [...existingNotes, `[Completed ${now}] ${notes}`] : existingNotes;

          return {
            ...r,
            status: 'COMPLETED',
            completedAt: now,
            paymentStatus: 'PAID',
            paymentMode,
            paymentCollectedMode: paymentMode,
            paymentCollectedAmount: r.total,
            completionPhotos: combinedPhotos,
            vendorNotes: combinedNotes,
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: 'COMPLETED',
                timestamp: now,
                updatedBy: `${vendorName} (Partner Portal)`,
                note: `Job completed on site. Verified via customer OTP. Collected via ${paymentMode} (₹${r.total}).`
              }
            ]
          };
        }
        return r;
      })
    );

    if (currentVendorId) {
      setVendors((prev) =>
        prev.map((v) =>
          v.id === currentVendorId
            ? {
                ...v,
                activeJobs: Math.max(0, v.activeJobs - 1),
                completedJobs: v.completedJobs + 1
              }
            : v
        )
      );
    }

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      requestId,
      customerName: req.customerName,
      amount: req.total,
      mode: paymentMode === 'CASH' ? 'CASH' : 'UPI',
      status: 'SUCCESS',
      transactionRef: `${paymentMode}-VND-${Math.floor(100000 + Math.random() * 900000)}`,
      collectedBy: `${vendorName} (Artisan)`,
      date: now
    };
    setPayments((prev) => [newPayment, ...prev]);

    addAuditEntry(
      'JOB_COMPLETED_BY_VENDOR',
      'SERVICE_REQUEST',
      requestId,
      `${vendorName} completed job ${requestId}. Verified via customer OTP. Collected ₹${req.total} via ${paymentMode}.`,
      vendorName
    );

    showToast(`Job ${requestId} completed! Verified via customer OTP and payment of ₹${req.total} logged.`, 'success');

    if (isSupabaseConfigured()) {
      updateServiceRequestInSupabase(requestId, {
        status: 'COMPLETED',
        work_completed_at: new Date().toISOString(),
        payment_status: 'PAID',
        payment_method: paymentMode,
        technician_notes: notes || undefined
      }).catch((err) => console.error('Failed to sync vendor complete job to Supabase:', err));
    }
  };

  // Employees
  const updateEmployeeAvailability = (employeeId: string, availability: Employee['availability']) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === employeeId ? { ...e, availability } : e))
    );
    showToast(`Staff availability updated`, 'info');
  };

  const addEmployee = (emp: Employee) => {
    setEmployees((prev) => [emp, ...prev]);
    if (isSupabaseConfigured()) {
      syncEmployeeToSupabase(emp).catch((err) => {
        console.error('Failed to sync employee to Supabase:', err);
      });
    }
    addAuditEntry('EMPLOYEE_ONBOARDED', 'EMPLOYEE', emp.id, `Created employee: ${emp.name} (Role: ${emp.role || 'Field Technician'})`);
    showToast(`Added technician employee ${emp.name}`, 'success');
  };

  const updateEmployee = (employeeId: string, updates: Partial<Employee>) => {
    let updatedEmp: Employee | null = null;
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id === employeeId) {
          updatedEmp = { ...e, ...updates };
          return updatedEmp;
        }
        return e;
      })
    );
    if (updatedEmp && isSupabaseConfigured()) {
      syncEmployeeToSupabase(updatedEmp).catch((err) => {
        console.error('Failed to sync updated employee to Supabase:', err);
      });
    }
    addAuditEntry(
      'EMPLOYEE_UPDATED',
      'EMPLOYEE',
      employeeId,
      `Updated employee profile/role: ${updates.role || 'Details modified'}`
    );
    showToast(`Updated employee details & role`, 'success');
  };

  // EMPLOYEE PORTAL ACTIONS
  const employeeAcceptJob = (requestId: string, notes?: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const currentEmp = employees.find((e) => e.id === currentEmployeeId);
    const empName = currentEmp?.name || req.assignedTo?.name || 'Staff Technician';

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'ACCEPTED',
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: 'ACCEPTED',
                timestamp: now,
                updatedBy: `${empName} (Staff App)`,
                note: notes || 'Assigned job acknowledged and accepted by staff technician.'
              }
            ]
          };
        }
        return r;
      })
    );

    addAuditEntry(
      'EMPLOYEE_ACCEPTED_JOB',
      'SERVICE_REQUEST',
      requestId,
      `${empName} accepted assignment. Tools and route confirmed.`,
      empName
    );

    showToast(`Job ${requestId} accepted! Route and customer details loaded.`, 'success');

    if (isSupabaseConfigured()) {
      updateServiceRequestInSupabase(requestId, {
        status: 'ACCEPTED',
        technician_notes: notes || undefined
      }).catch((err) => console.error('Failed to sync employee accept job to Supabase:', err));
    }
  };

  const employeeRejectJob = (requestId: string, reason: string, notes?: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const currentEmp = employees.find((e) => e.id === currentEmployeeId);
    const empName = currentEmp?.name || req.assignedTo?.name || 'Staff Technician';

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'REASSIGNMENT REQUIRED',
            employeeRejectionReason: reason,
            assignedTo: null,
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: 'REASSIGNMENT REQUIRED',
                timestamp: now,
                updatedBy: `${empName} (Staff App)`,
                note: `Employee declined assignment. Reason: ${reason}. ${notes ? `Details: ${notes}` : ''}`
              }
            ]
          };
        }
        return r;
      })
    );

    addAuditEntry(
      'EMPLOYEE_REJECTED_JOB',
      'SERVICE_REQUEST',
      requestId,
      `${empName} declined assigned job. Reason: ${reason}. Returned to Operations Assignment Board.`,
      empName
    );

    showToast(`Job ${requestId} declined. Returned to Operations Assignment Board for reassignment.`, 'info');

    if (isSupabaseConfigured()) {
      updateServiceRequestInSupabase(requestId, {
        status: 'REASSIGNMENT REQUIRED',
        assigned_to: null,
        technician_notes: `Declined: ${reason}. ${notes || ''}`
      }).catch((err) => console.error('Failed to sync employee reject job to Supabase:', err));
    }
  };

  const employeeMarkArrived = (requestId: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const currentEmp = employees.find((e) => e.id === currentEmployeeId);
    const empName = currentEmp?.name || 'Staff Technician';

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            vendorArrivalStatus: 'ARRIVED',
            arrivedAt: now,
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: r.status,
                timestamp: now,
                updatedBy: `${empName} (Doorstep Check-in)`,
                note: 'Employee reached customer doorstep.'
              }
            ]
          };
        }
        return r;
      })
    );

    addAuditEntry(
      'EMPLOYEE_ARRIVED',
      'SERVICE_REQUEST',
      requestId,
      `${empName} confirmed doorstep arrival at ${req.locality}.`,
      empName
    );

    showToast('Doorstep arrival confirmed!', 'success');

    if (isSupabaseConfigured()) {
      updateServiceRequestInSupabase(requestId, {
        vendor_arrival_status: 'ARRIVED'
      }).catch((err) => console.error('Failed to sync doorstep arrival to Supabase:', err));
    }
  };

  const employeeStartWork = (requestId: string, notes?: string) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const currentEmp = employees.find((e) => e.id === currentEmployeeId);
    const empName = currentEmp?.name || 'Staff Technician';

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'IN PROGRESS',
            workStartedAt: now,
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: 'IN PROGRESS',
                timestamp: now,
                updatedBy: `${empName} (Staff App)`,
                note: notes || 'Diagnostics and repair work commenced on site.'
              }
            ]
          };
        }
        return r;
      })
    );

    addAuditEntry(
      'EMPLOYEE_STARTED_WORK',
      'SERVICE_REQUEST',
      requestId,
      `${empName} began work on site.`,
      empName
    );

    showToast('Work started! Status updated to In Progress.', 'info');

    if (isSupabaseConfigured()) {
      updateServiceRequestInSupabase(requestId, {
        status: 'IN PROGRESS',
        work_started_at: new Date().toISOString()
      }).catch((err) => console.error('Failed to sync start work to Supabase:', err));
    }
  };

  const employeeCompleteWork = async (
    requestId: string,
    completionNotes: string,
    completionPhotos: string[],
    materialInfo?: string,
    partsUsed?: { name: string; quantity: number; cost: number }[],
    paymentCollectedMode?: 'CASH' | 'UPI' | 'ONLINE',
    customerOtp?: string
  ) => {
    const now = new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    const currentEmp = employees.find((e) => e.id === currentEmployeeId);
    const empName = currentEmp?.name || req.assignedTo?.name || 'Staff Technician';
    const payMode = paymentCollectedMode || req.paymentMode || 'UPI';

    // SEC-05: Mandatory customer verification OTP via database RPC verify_job_otp()
    if (!customerOtp || !customerOtp.trim()) {
      showToast('Customer verification OTP is required to complete this job.', 'error');
      return;
    }

    const otpResult = await verifyJobOtpViaRpc(requestId, customerOtp.trim());
    if (!otpResult.success) {
      if (otpResult.code === 'LOCKED') {
        showToast(
          'Verification Locked: 5 failed OTP attempts. Please contact the operations team to unlock this booking.',
          'error'
        );
      } else {
        showToast(otpResult.message || 'Invalid customer OTP provided.', 'error');
      }
      return;
    }

    // SEC-02: Record payment via database RPC record_payment()
    await recordPaymentViaRpc(requestId, req.total, payMode);

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const existingPhotos = r.completionPhotos || [];
          const combinedPhotos = Array.from(new Set([...existingPhotos, ...completionPhotos]));
          const existingNotes = r.vendorNotes || [];
          const combinedNotes = [...existingNotes, `[Staff Completed ${now}] ${completionNotes}`];

          return {
            ...r,
            status: 'COMPLETED',
            completedAt: now,
            paymentStatus: 'PAID',
            paymentMode: payMode,
            paymentCollectedMode: payMode,
            paymentCollectedAmount: r.total,
            completionPhotos: combinedPhotos,
            vendorNotes: combinedNotes,
            materialInfo: materialInfo || r.materialInfo,
            partsUsed: partsUsed || r.partsUsed,
            updatedAt: now,
            statusHistory: [
              ...r.statusHistory,
              {
                status: 'COMPLETED',
                timestamp: now,
                updatedBy: `${empName} (Staff App)`,
                note: `Job completed. Verified by customer OTP. Collected via ${payMode} (₹${r.total}).`
              }
            ]
          };
        }
        return r;
      })
    );

    if (currentEmployeeId) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === currentEmployeeId
            ? {
                ...e,
                activeJobs: Math.max(0, e.activeJobs - 1),
                completedJobs: e.completedJobs + 1
              }
            : e
        )
      );
    }

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      requestId,
      customerName: req.customerName,
      amount: req.total,
      mode: payMode === 'CASH' ? 'CASH' : 'UPI',
      status: 'SUCCESS',
      transactionRef: `${payMode}-EMP-${Math.floor(100000 + Math.random() * 900000)}`,
      collectedBy: `${empName} (Company Staff)`,
      date: now
    };
    setPayments((prev) => [newPayment, ...prev]);

    addAuditEntry(
      'JOB_COMPLETED_BY_EMPLOYEE',
      'SERVICE_REQUEST',
      requestId,
      `${empName} completed job ${requestId}. Verified via customer OTP. Collected ₹${req.total} via ${payMode}. Material: ${materialInfo || 'None'}.`,
      empName
    );

    showToast(`Job ${requestId} finalized! Verified via customer OTP and payment recorded.`, 'success');

    if (isSupabaseConfigured()) {
      updateServiceRequestInSupabase(requestId, {
        status: 'COMPLETED',
        work_completed_at: new Date().toISOString(),
        payment_status: 'PAID',
        payment_method: payMode,
        technician_notes: completionNotes || undefined,
        completion_photos: completionPhotos,
        completion_notes: materialInfo || undefined
      }).catch((err) => console.error('Failed to sync employee complete work to Supabase:', err));
    }
  };

  // Projects
  const updateProjectStatus = (projectId: string, status: HomeProjectRequest['status'], notes?: string) => {
    setProjectRequests((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status, notes: notes || p.notes } : p))
    );
    addAuditEntry('PROJECT_STATUS_UPDATE', 'SERVICE_REQUEST', projectId, `Status: ${status}`);
    showToast(`Project ${projectId} updated to ${status}`, 'info');
  };

  // Reviews
  const submitReview = (requestId: string, rating: number, feedback: string) => {
    const req = requests.find((r) => r.id === requestId);
    const now = 'Just now';

    const newRev: CustomerReview = {
      id: `rev-${Date.now()}`,
      requestId,
      customerName: req?.customerName || 'Resident',
      locality: req?.locality || currentLocality,
      serviceName: req?.items[0]?.serviceName || 'Home Service',
      technicianName: req?.assignedTo?.name || 'Assigned Artisan',
      rating,
      review: feedback,
      timestamp: now
    };

    setReviews((prev) => [newRev, ...prev.filter((rv) => rv.requestId !== requestId)]);
    // update order
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, customerRating: rating, customerFeedback: feedback } : r))
    );

    if (isSupabaseConfigured()) {
      const currentNotes = req?.notes || '';
      const payload = JSON.stringify({ rating, feedback });
      const updatedNotes = currentNotes.includes('[CUSTOMER_REVIEW]:')
        ? currentNotes.replace(/\[CUSTOMER_REVIEW\]:\s*\{.*\}/, `[CUSTOMER_REVIEW]: ${payload}`)
        : currentNotes
        ? `${currentNotes}\n[CUSTOMER_REVIEW]: ${payload}`
        : `[CUSTOMER_REVIEW]: ${payload}`;

      updateServiceRequestInSupabase(requestId, {
        completion_notes: updatedNotes
      }).catch((err) => console.error('Failed to sync review to service_requests in Supabase:', err));

      syncCustomerReviewToSupabase(newRev).catch((err: unknown) => console.warn('Supabase persist review notice:', err));
    }

    showToast(`Thank you! Your feedback for ${newRev.technicianName} was submitted.`, 'success');
  };

  // DPDP Act 2023 Compliance & Data Principal Rights Implementations
  const updateDPDPConsent = (preferences: Partial<DPDPConsentPreferences>) => {
    setDpdpConsent((prev) => ({
      ...prev,
      ...preferences,
      consentedAt: new Date().toISOString()
    }));
    addAuditEntry(
      'DPDP_CONSENT_UPDATED',
      'SERVICE_REQUEST',
      'USER_CONSENT',
      `Updated preferences: ${JSON.stringify(preferences)}`,
      currentUser?.name || 'Resident'
    );
    showToast('Your DPDP privacy preferences have been updated.', 'success');
  };

  const updateDPDPNominee = (nominee: DPDPNominee) => {
    setDpdpNominee(nominee);
    addAuditEntry(
      'DPDP_NOMINEE_UPDATED',
      'SERVICE_REQUEST',
      'SEC_14_NOMINEE',
      `Nominee recorded: ${nominee.fullName} (${nominee.relationship})`,
      currentUser?.name || 'Resident'
    );
    showToast(`Nominee ${nominee.fullName} registered under Section 14 DPDP Act.`, 'success');
  };

  const fileDPDPGrievance = (
    grievance: Omit<DPDPGrievance, 'id' | 'ticketNo' | 'status' | 'createdAt' | 'dpoOfficer'>
  ): DPDPGrievance => {
    const newGrievance: DPDPGrievance = {
      ...grievance,
      id: `grv-${Date.now()}`,
      ticketNo: `DPDP-GRV-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
      dpoOfficer: 'Mr. Gurpreet Singh (DPO, UrbanCare Solution, Kharar)'
    };
    setDpdpGrievances((prev) => [newGrievance, ...prev]);
    addAuditEntry(
      'DPDP_GRIEVANCE_FILED',
      'SERVICE_REQUEST',
      newGrievance.ticketNo,
      `Category: ${newGrievance.type} - ${newGrievance.description.substring(0, 60)}...`,
      newGrievance.userName
    );
    showToast(`Grievance ${newGrievance.ticketNo} submitted to Data Protection Officer.`, 'info');
    return newGrievance;
  };

  const requestDataErasure = (reason = 'Right to Erasure under Section 12') => {
    logoutCustomer();
    setCart([]);
    addAuditEntry(
      'DPDP_ERASURE_REQUEST',
      'SERVICE_REQUEST',
      currentUser?.id || 'ANONYMOUS',
      `Reason: ${reason}`,
      currentUser?.name || 'Resident'
    );
    showToast('Personal data identifiers removed from browser storage. Erasure logged.', 'info');
  };

  const exportPersonalData = (): string => {
    const personalRecord = {
      title: 'UrbanCare Solution - Data Principal Personal Record Export',
      statutoryBasis: 'Digital Personal Data Protection Act, 2023 (Section 11)',
      exportedAt: new Date().toISOString(),
      jurisdiction: 'Kharar & Mohali, SAS Nagar, Punjab, India',
      profile: currentUser || { status: 'Guest User' },
      activeConsentPreferences: dpdpConsent,
      registeredNominee: dpdpNominee || 'No nominee appointed under Section 14',
      serviceRequestsHistory: requests.map((r) => ({
        id: r.id,
        status: r.status,
        locality: r.locality,
        address: r.address,
        createdAt: r.createdAt,
        total: r.total,
        services: r.items.map((i) => i.serviceName)
      })),
      projectRequests: projectRequests,
      privacyGrievances: dpdpGrievances,
      dataFiduciary: {
        company: 'UrbanCare Solution',
        dpoOfficer: 'Mr. Gurpreet Singh',
        dpoContact: '+91 98882 10452',
        dpoEmail: 'grievance@urbancaresolution.in',
        officeAddress: 'SCF 14, Sector 125, Sunny Enclave, Kharar, Punjab 140301'
      }
    };
    return JSON.stringify(personalRecord, null, 2);
  };


  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        currentLocality,
        setCurrentLocality,
        currentPage,
        setCurrentPage,
        accountTab,
        setAccountTab,
        toasts,
        showToast,
        dismissToast,
        services,
        packages,
        priceHistory,
        updateServicePricing,
        toggleServiceActive,
        addService,
        deleteService,
        updatePackage,
        deletePackage,
        cart,
        addToCart,
        addPackageToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        requests,
        createBookingFromCart,
        createCustomRequirement,
        createProjectRequest,
        updateRequestStatus,
        assignRequest,
        reassignRequest,
        vendors,
        opportunityLedger,
        adjustVendorOpportunities,
        updateVendorStatus,
        approveVendorWithPayment,
        updateVendorPaymentStatus,
        addVendor,
        currentVendorId,
        setCurrentVendorId,
        vendorAcceptAssignment,
        vendorRejectAssignment,
        vendorConfirmSchedule,
        vendorMarkArrived,
        vendorStartWork,
        vendorUploadCompletionPhotos,
        vendorAddNotes,
        vendorCompleteJob,
        employees,
        updateEmployeeAvailability,
        addEmployee,
        updateEmployee,
        currentEmployeeId,
        setCurrentEmployeeId,
        employeeNotifications,
        markNotificationAsRead,
        employeeAcceptJob,
        employeeRejectJob,
        employeeMarkArrived,
        employeeStartWork,
        employeeCompleteWork,
        projectRequests,
        updateProjectStatus,
        reviews,
        submitReview,
        auditLogs,
        addAuditEntry,
        customers,
        addCustomer,
        updateCustomerStatus,
        releaseCustomerPhone,
        complaints,
        addComplaint,
        resolveComplaint,
        payments,
        recordPayment,
        opsSettings,
        updateOpsSettings,
        addInternalNote,
        activeTrackingRequestId,
        setActiveTrackingRequestId,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isCustomTaskModalOpen,
        setIsCustomTaskModalOpen,
        isProjectModalOpen,
        setIsProjectModalOpen,
        isLocalityModalOpen,
        setIsLocalityModalOpen,
        selectedDetailServiceId,
        setSelectedDetailServiceId,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openAuthModal,
        authReturnTo,
        setAuthReturnTo,
        closeAllModals,
        authProfile,
        setAuthProfile,
        currentUser,
        setCurrentUser,
        login,
        logout,
        loginWithGoogle,
        loginCustomer,
        registerCustomer,
        logoutCustomer,
        loginStaff,
        logoutStaff,
        dpdpConsent,
        updateDPDPConsent,
        dpdpNominee,
        updateDPDPNominee,
        dpdpGrievances,
        fileDPDPGrievance,
        requestDataErasure,
        exportPersonalData,
        isDPDPNoticeOpen,
        setIsDPDPNoticeOpen,
        isDPDPConsentManagerOpen,
        setIsDPDPConsentManagerOpen,
        isDPDPDataRightsOpen,
        setIsDPDPDataRightsOpen,
        dbStatus,
        refreshDbConnection,
        isLoadingData,
        isAuthLoading,
        dataLoadError,
        reloadUserData,
        selectedCategory,
        setSelectedCategory,
        serviceSearchQuery,
        setServiceSearchQuery
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
