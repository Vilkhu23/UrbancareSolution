export type UserRole = 
  | 'customer'
  | 'technician'
  | 'vendor'
  | 'ops_manager'
  | 'admin'
  | 'employee'
  | 'operations';

export interface ProfileRecord {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string;
  phone_verified: boolean;
  locality?: string;
  address?: string;
  must_change_password?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type PriceType = 
  | 'FIXED'
  | 'PACKAGE'
  | 'STARTING_FROM'
  | 'INSPECTION'
  | 'QUOTE_REQUIRED';

export type PricingType = PriceType | 'fixed' | 'package' | 'starting_from' | 'inspection_fee' | 'quote_required';

export type BookingStatus =
  | 'NEW'
  | 'UNDER REVIEW'
  | 'READY FOR ASSIGNMENT'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'SCHEDULED'
  | 'IN PROGRESS'
  | 'COMPLETED'
  | 'CUSTOMER CONFIRMED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'REASSIGNMENT REQUIRED'
  | 'CUSTOMER NOT AVAILABLE'
  | 'VENDOR NOT AVAILABLE'
  | 'DISPUTED';

export interface PriceHistoryRecord {
  id: string;
  serviceId: string;
  serviceName: string;
  fieldChanged: string;
  oldValue: number | string;
  newValue: number | string;
  effectiveFrom: string;
  changedBy: string;
  changedAt: string;
  reason: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  
  // Central Pricing Engine Fields
  price_type: PriceType;
  base_price: number;
  original_price?: number;
  discount?: string;
  visit_fee: number;
  tax: number; // Configured tax percentage (e.g. 0 or 18)
  material_policy: string;
  duration: string;
  warranty: string;
  included_items: string[];
  excluded_items: string[];
  active: boolean;
  effective_from: string;
  effective_to?: string;

  // Compatibility aliases
  basePrice: number;
  originalPrice?: number;
  visitFee: number;
  pricingType: PricingType;
  materialPolicy: string;
  estimatedDuration: string;
  included: string[];
  excluded: string[];

  images?: string[];
  badge?: string;
  serviceAreas: string[];
  sortOrder: number;
  completedBookingsCount?: number;
  rating?: number;
  faqs?: { question: string; answer: string }[];
  relatedServiceIds?: string[];
  frequentlyBookedTogetherIds?: string[];
}

export interface ServicePackage {
  id: string;
  name: string;
  category: string;
  category_id?: string;
  subcategory?: string;
  description: string;
  price: number;
  originalPrice: number;
  savings: string;
  duration: string;
  included: string[];
  serviceAreas: string[];
  active: boolean;
  pricingType?: PricingType;
  faqs?: { question: string; answer: string }[];
  rating?: number;
}

export interface CartItem {
  serviceId: string;
  serviceName: string;
  category: string;
  price: number;
  visitFee: number;
  quantity: number;
  isPackage?: boolean;
  price_type?: PriceType;
}

export interface StatusHistoryItem {
  status: BookingStatus;
  timestamp: string;
  updatedBy: string;
  note?: string;
}

export interface InternalNote {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface AssignmentHistoryItem {
  id?: string;
  assignedBy: string;
  assignedTo: string;
  assignedToName?: string;
  assigneeType: 'EMPLOYEE' | 'VENDOR';
  timestamp: string;
  previousAssignee?: string | null;
  previousAssigneeName?: string | null;
  reason?: string;
  notes?: string;
}

export interface ServiceRequestItem {
  serviceId?: string;
  serviceName: string;
  quantity: number;
  price: number;
  price_type?: PriceType;
  isPackage?: boolean;
}

export interface ServiceRequest {
  id: string;
  user_id?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  locality: string;
  address: string;
  landmark?: string;
  requestType: 'STANDARD_SERVICE' | 'CUSTOM_REQUIREMENT' | 'HOME_PROJECT';
  items: ServiceRequestItem[];
  subtotal: number;
  visitFee: number;
  taxAmount?: number;
  discountAmount?: number;
  total: number;
  hasQuoteRequired?: boolean;
  preferredDate: string;
  preferredTimeSlot: string;
  notes?: string;
  problemDescription?: string;
  problemPhotos?: string[];
  internalNotes?: InternalNote[];
  vendorArrivalStatus?: 'NOT_ARRIVED' | 'ARRIVED';
  completionPhotos?: string[];
  vendorRejectionReason?: string;
  vendorNotes?: string[];
  confirmedScheduleSlot?: string;
  arrivedAt?: string;
  workStartedAt?: string;
  completedAt?: string;
  paymentCollectedMode?: 'CASH' | 'UPI' | 'ONLINE';
  paymentCollectedAmount?: number;
  materialInfo?: string;
  partsUsed?: { name: string; quantity: number; cost: number }[];
  employeeRejectionReason?: string;
  supervisorInstructions?: string;
  status: BookingStatus;
  assignedTo?: {
    id: string;
    name: string;
    type: 'EMPLOYEE' | 'VENDOR';
    phone: string;
    rating: string;
    hub: string;
  } | null;
  statusHistory: StatusHistoryItem[];
  assignmentHistory: AssignmentHistoryItem[];
  createdAt: string;
  updatedAt: string;
  paymentStatus: 'PENDING_ON_COMPLETION' | 'PAID' | 'DISPUTED';
  paymentMode?: 'CASH' | 'UPI' | 'ONLINE';
  customerRating?: number;
  customerFeedback?: string;
}

export interface CustomerRecord {
  id: string;
  user_id?: string;
  name: string;
  phone: string;
  email: string;
  locality: string;
  address: string;
  password?: string;
  totalBookings: number;
  totalSpent: number;
  registeredDate: string;
  status: 'ACTIVE' | 'FLAGGED' | 'VIP';
}

export interface ComplaintRecord {
  id: string;
  user_id?: string;
  requestId: string;
  customerName: string;
  customerPhone: string;
  artisanName?: string;
  issueType: 'DELAY' | 'POOR_WORKMANSHIP' | 'OVERCHARGING' | 'BEHAVIOUR' | 'DAMAGE' | 'OTHER';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface VendorOnboardingPayment {
  method: 'CASH' | 'ONLINE' | 'CHEQUE';
  amount: number;
  transactionRef: string; // UTR / Txn ID for online, Receipt No. for cash, Cheque No. for cheque
  bankName?: string;     // Issuing bank for cheque or bank transfer
  chequeDate?: string;   // Date on cheque
  chequeClearingStatus?: 'CLEARED' | 'PENDING_CLEARANCE';
  paidAt: string;
  collectedBy: string;
  receiptNumber?: string;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  user_id?: string;
  requestId: string;
  customerName: string;
  amount: number;
  mode: 'UPI' | 'CASH' | 'ONLINE_CARD' | 'NET_BANKING' | 'CHEQUE' | 'ONLINE';
  status: 'SUCCESS' | 'PENDING' | 'REFUNDED' | 'DISPUTED';
  transactionRef: string;
  collectedBy: string;
  date: string;
  paymentType?: 'SERVICE_BOOKING' | 'VENDOR_ONBOARDING';
  notes?: string;
}

export interface OpsSettings {
  dispatchCenterName: string;
  emergencyHotline: string;
  supportEmail: string;
  password?: string;
  defaultVisitFee: number;
  defaultGstPercent: number;
  requireSupervisorSignoff: boolean;
  autoSmsNotifications: boolean;
  serviceRadiusKm: number;
  operatingHours: string;
  activeLocalities: string[];
}

export interface Vendor {
  id: string;
  user_id?: string;
  businessName: string;
  ownerName: string;
  mobile: string;
  email: string;
  password?: string;
  categories: string[];
  serviceAreas: string[];
  experienceYears: number;
  documentsVerified: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'REJECTED';
  plan: {
    name: string;
    price: number;
    totalOpportunities: number;
    usedOpportunities: number;
    remainingOpportunities: number;
    validityDays: number;
    expiryDate: string;
    onboardingPayment?: VendorOnboardingPayment;
  };
  onboardingPayment?: VendorOnboardingPayment;
  activeJobs: number;
  completedJobs: number;
  rating: number;
  createdAt: string;
}

export interface OpportunityLedgerEntry {
  id: string;
  vendorId: string;
  vendorName: string;
  action?: string;
  change: number;
  balanceAfter: number;
  reason: string;
  performedBy: string;
  timestamp: string;
  serviceRequestId?: string;
}

export interface Employee {
  id: string;
  user_id?: string;
  name: string;
  mobile: string;
  password?: string;
  skills: string[];
  categories: string[];
  serviceAreas: string[];
  availability: 'AVAILABLE' | 'ON_JOB' | 'OFF_DUTY';
  status: 'ACTIVE' | 'INACTIVE';
  activeJobs: number;
  completedJobs: number;
  rating: number;
  joinedDate: string;
  role?: string;
  employeeCode?: string;
  email?: string;
}

export interface HomeProjectRequest {
  id: string;
  user_id?: string;
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
  status: 'UNDER_REVIEW' | 'ESTIMATE_PREPARED' | 'SITE_VISIT_SCHEDULED' | 'WORK_IN_PROGRESS' | 'COMPLETED';
  assignedSupervisor?: string;
  notes?: string;
  createdAt: string;
}

export interface EmployeeNotification {
  id: string;
  employeeId: string;
  title: string;
  message: string;
  timestamp: string;
  requestId?: string;
  read: boolean;
  type?: 'ASSIGNMENT' | 'OVERRIDE' | 'REASSIGNMENT' | 'ALERT';
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: 'SERVICE_REQUEST' | 'VENDOR' | 'EMPLOYEE' | 'PRICING' | 'OPPORTUNITY';
  entityId: string;
  details: string;
  performedBy: string;
  timestamp: string;
}

export interface CustomerReview {
  id: string;
  requestId: string;
  customerName: string;
  locality: string;
  serviceName: string;
  technicianName: string;
  rating: number;
  review: string;
  timestamp: string;
}

export interface DPDPConsentPreferences {
  essentialService: boolean; // Purpose: Technician dispatch & Doorstep fulfillment
  dispatchUpdates: boolean;  // Purpose: WhatsApp & SMS real-time technician status
  promotionalMarketing: boolean; // Purpose: Seasonal offers & maintenance advisories (Default false)
  callMasking: boolean;      // Purpose: Virtual proxy call routing to protect phone number (Default true)
  consentedAt: string;
  ipJurisdiction: string;
  version: string;
}

export interface DPDPNominee {
  fullName: string;
  relationship: string;
  phone: string;
  email?: string;
  updatedAt: string;
}

export interface DPDPGrievance {
  id: string;
  ticketNo: string;
  userName: string;
  userPhone: string;
  type: 
    | 'RIGHT_TO_ACCESS' 
    | 'RIGHT_TO_CORRECTION' 
    | 'RIGHT_TO_ERASURE' 
    | 'CONSENT_WITHDRAWAL' 
    | 'UNAUTHORIZED_PROCESSING' 
    | 'GENERAL_PRIVACY';
  description: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'RESOLVED';
  createdAt: string;
  dpoOfficer: string;
  resolutionNotes?: string;
}

export interface ServiceZone {
  id: string;
  sector: string;
  name: string;
  description: string;
  keyEnclaves: string[];
  activeArtisansCount: number;
  avgResponseMinutes: number;
}
