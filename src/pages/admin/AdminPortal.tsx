import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AssignModal } from './AssignModal';
import { VendorLedgerModal } from './VendorLedgerModal';
import { EditPricingModal } from './EditPricingModal';
import { AddServiceModal } from './AddServiceModal';
import { ServiceRequestDetailModal } from './ServiceRequestDetailModal';
import { AssignmentBoardModal } from './AssignmentBoardModal';
import { RecordPaymentModal } from './RecordPaymentModal';
import { ComplaintResolveModal } from './ComplaintResolveModal';
import { EmployeeModal } from './EmployeeModal';
import { DatabaseConfigModal } from './DatabaseConfigModal';
import { CreateStaffModal } from './CreateStaffModal';
import { VendorApprovalModal } from './VendorApprovalModal';
import { PhoneBookingModal } from './PhoneBookingModal';
import { AddPackageModal } from './AddPackageModal';
import {
  Database,
  ShieldCheck,
  UserCheck,
  Users,
  Wrench,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle2,
  Filter,
  Plus,
  RefreshCw,
  HardHat,
  Star,
  FileText,
  Search,
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Building,
  Tag,
  History,
  Edit3,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  FileCheck,
  Check,
  X,
  Layers,
  Package,
  Settings,
  HelpCircle,
  BarChart3,
  Compass,
  Briefcase,
  ChevronRight,
  UserPlus,
  Lock,
  ChevronDown,
  LayoutDashboard,
  ClipboardList,
  UserCog,
  ShieldAlert,
  ArrowUpRight,
  PieChart,
  LogOut,
  PhoneOff,
  Receipt,
  Wallet,
  Smartphone,
  Building2,
  Trash2
} from 'lucide-react';
import { adminReleasePhoneViaRpc } from '../../services/supabaseService';
import {
  BookingStatus,
  ServiceItem,
  Vendor,
  Employee,
  CustomerRecord,
  ComplaintRecord,
  PaymentRecord,
  ServiceRequest
} from '../../types';
import { SERVICE_CATEGORIES } from '../../data/initialData';
import { formatServicePricing } from '../../utils/pricingEngine';

export type AdminTab =
  | 'dashboard'
  | 'requests'
  | 'assignment'
  | 'customers'
  | 'vendors'
  | 'employees'
  | 'services'
  | 'categories'
  | 'packages'
  | 'pricing'
  | 'projects'
  | 'reviews'
  | 'complaints'
  | 'payments'
  | 'reports'
  | 'settings'
  | 'audit';

export const AdminPortal: React.FC = () => {
  const {
    requests,
    updateRequestStatus,
    vendors,
    updateVendorStatus,
    employees,
    updateEmployeeAvailability,
    addEmployee,
    updateEmployee,
    services,
    packages,
    priceHistory,
    updateServicePricing,
    toggleServiceActive,
    addService,
    deleteService,
    addPackage,
    deletePackage,
    projectRequests,
    updateProjectStatus,
    reviews,
    auditLogs,
    opportunityLedger,
    currentLocality,
    customers,
    updateCustomerStatus,
    releaseCustomerPhone,
    complaints,
    payments,
    opsSettings,
    updateOpsSettings,
    dbStatus,
    refreshDbConnection,
    showToast,
    logout,
    authProfile
  } = useApp();

  // Active top-level tab
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('dashboard');

  // Request list filters
  const [requestFilter, setRequestFilter] = useState<string>('ALL');
  const [requestSearch, setRequestSearch] = useState<string>('');
  const [requestLocalityFilter, setRequestLocalityFilter] = useState<string>('ALL');
  const [requestSourceFilter, setRequestSourceFilter] = useState<'ALL' | 'Phone' | 'Website' | 'WhatsApp' | 'Referral'>('ALL');

  // Phone Booking Modal State
  const [isPhoneBookingModalOpen, setIsPhoneBookingModalOpen] = useState(false);

  // Modal states
  const [assigningRequestId, setAssigningRequestId] = useState<string | null>(null);
  const [ledgerVendorId, setLedgerVendorId] = useState<string | null>(null);
  const [selectedEditService, setSelectedEditService] = useState<ServiceItem | null>(null);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isAddPackageModalOpen, setIsAddPackageModalOpen] = useState(false);
  const [selectedDetailRequestId, setSelectedDetailRequestId] = useState<string | null>(null);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Admin Release Mobile Number Modal State
  const [releasingCustomer, setReleasingCustomer] = useState<CustomerRecord | null>(null);
  const [releaseReason, setReleaseReason] = useState<string>('');
  const [isReleasingPhone, setIsReleasingPhone] = useState<boolean>(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isCreateStaffModalOpen, setIsCreateStaffModalOpen] = useState(false);
  const [staffModalDefaultRole, setStaffModalDefaultRole] = useState<'technician' | 'vendor' | 'ops_manager'>('technician');

  // Vendor Approval & Payment Tracking Modal State
  const [selectedApprovalVendor, setSelectedApprovalVendor] = useState<Vendor | null>(null);
  const [approvalModalMode, setApprovalModalMode] = useState<'approve' | 'view'>('approve');
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [paymentLedgerFilter, setPaymentLedgerFilter] = useState<'ALL' | 'ORDERS' | 'ONBOARDING'>('ALL');

  // Assignment Board Modal state
  const [boardModalTarget, setBoardModalTarget] = useState<{
    artisan: Employee | Vendor | null;
    type: 'EMPLOYEE' | 'VENDOR';
    mode: 'ASSIGN' | 'REASSIGN';
  } | null>(null);

  // Payments & Complaints Modals
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintRecord | null>(null);

  // Pricing sub-tab
  const [pricingSubTab, setPricingSubTab] = useState<'catalog' | 'history'>('catalog');
  const [pricingSearchQuery, setPricingSearchQuery] = useState('');
  const [pricingCategoryFilter, setPricingCategoryFilter] = useState('ALL');
  const [adminServiceSearch, setAdminServiceSearch] = useState('');
  const [adminPackageSearch, setAdminPackageSearch] = useState('');

  const filteredAdminServices = useMemo(() => {
    const q = adminServiceSearch.trim().toLowerCase();
    if (!q) return services;
    const tokens = q.split(/\s+/).filter(Boolean);
    return services.filter((s) => {
      const nameL = s.name.toLowerCase();
      const catL = s.category.toLowerCase();
      const subL = s.subcategory.toLowerCase();
      const descL = s.description.toLowerCase();
      return tokens.every(
        (t) => nameL.includes(t) || catL.includes(t) || subL.includes(t) || descL.includes(t)
      );
    });
  }, [services, adminServiceSearch]);

  const filteredAdminPackages = useMemo(() => {
    const q = adminPackageSearch.trim().toLowerCase();
    if (!q) return packages;
    const tokens = q.split(/\s+/).filter(Boolean);
    return packages.filter((p) => {
      const nameL = p.name.toLowerCase();
      const catL = p.category.toLowerCase();
      const descL = p.description.toLowerCase();
      return tokens.every((t) => nameL.includes(t) || catL.includes(t) || descL.includes(t));
    });
  }, [packages, adminPackageSearch]);

  const filteredPricingServices = useMemo(() => {
    const q = pricingSearchQuery.trim().toLowerCase();
    if (!q) return services;
    const tokens = q.split(/\s+/).filter(Boolean);
    return services.filter((s) => {
      const nameL = s.name.toLowerCase();
      const catL = s.category.toLowerCase();
      const subL = s.subcategory.toLowerCase();
      return tokens.every((t) => nameL.includes(t) || catL.includes(t) || subL.includes(t));
    });
  }, [services, pricingSearchQuery]);

  // Assignment Board filters
  const [boardTypeFilter, setBoardTypeFilter] = useState<'ALL' | 'EMPLOYEE' | 'VENDOR'>('ALL');
  const [boardSearch, setBoardSearch] = useState('');

  // Mobile sidebar open state
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  // ==========================================
  // DASHBOARD KPIS (12 Mandatory KPIs)
  // ==========================================
  const newRequestsCount = requests.filter((r) => r.status === 'NEW').length;
  const pendingReviewCount = requests.filter((r) => r.status === 'UNDER REVIEW').length;
  const readyForAssignmentCount = requests.filter((r) => r.status === 'READY FOR ASSIGNMENT').length;
  const assignedCount = requests.filter((r) => r.status === 'ASSIGNED').length;
  const acceptedCount = requests.filter((r) => r.status === 'ACCEPTED').length;
  const inProgressCount = requests.filter((r) => r.status === 'IN PROGRESS').length;
  const completedCount = requests.filter(
    (r) => r.status === 'COMPLETED' || r.status === 'CUSTOMER CONFIRMED'
  ).length;
  const cancelledCount = requests.filter((r) => r.status === 'CANCELLED').length;
  const reassignmentRequiredCount = requests.filter(
    (r) => r.status === 'DISPUTED' || r.status === 'CUSTOMER NOT AVAILABLE' || r.status === 'VENDOR NOT AVAILABLE'
  ).length;
  const projectRequestsCount = projectRequests.length;
  const activeVendorsCount = vendors.filter((v) => v.status === 'ACTIVE').length;
  const activeEmployeesCount = employees.filter((e) => e.status === 'ACTIVE').length;

  const totalRevenue = requests.reduce((acc, r) => acc + r.total, 0);
  const totalReconciledPayments = payments.reduce((acc, p) => acc + (Number(p?.amount) || 0), 0);

  // Operations Live Counters (Phone booking, unassigned, awaiting vendor response)
  const todayPhoneBookingsCount = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return requests.filter((r) => {
      const isPhone = (r.source || 'Website') === 'Phone';
      const createdStr = r.createdAt || (r.createdAtMs ? new Date(r.createdAtMs).toISOString().slice(0, 10) : '');
      return isPhone && createdStr.startsWith(todayStr);
    }).length;
  }, [requests]);

  const unassignedJobsCount = useMemo(() => {
    return requests.filter(
      (r) =>
        !r.assignedTo &&
        r.status !== 'COMPLETED' &&
        r.status !== 'CUSTOMER CONFIRMED' &&
        r.status !== 'CANCELLED'
    ).length;
  }, [requests]);

  const awaitingVendorResponseCount = useMemo(() => {
    return requests.filter(
      (r) =>
        r.vendorResponseStatus === 'NOTIFIED' ||
        (r.assignedTo && !r.vendorResponseStatus && (r.status === 'ASSIGNED' || r.status === 'UNDER REVIEW'))
    ).length;
  }, [requests]);

  const isBookingUnassignedOverdue = (req: ServiceRequest): boolean => {
    if (req.assignedTo) return false;
    if (req.status === 'COMPLETED' || req.status === 'CUSTOMER CONFIRMED' || req.status === 'CANCELLED') return false;
    const now = Date.now();
    let createdTime = req.createdAtMs;
    if (!createdTime && req.createdAt) {
      const parsed = Date.parse(req.createdAt);
      if (!isNaN(parsed)) createdTime = parsed;
    }
    if (!createdTime) return false;
    const diffMinutes = (now - createdTime) / (1000 * 60);
    return diffMinutes >= 30;
  };

  const overdueUnassignedCount = useMemo(() => {
    return requests.filter(isBookingUnassignedOverdue).length;
  }, [requests]);

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesStatus =
        requestFilter === 'ALL'
          ? true
          : requestFilter === 'REASSIGNMENT_REQUIRED'
          ? r.status === 'DISPUTED' ||
            r.status === 'CUSTOMER NOT AVAILABLE' ||
            r.status === 'VENDOR NOT AVAILABLE' ||
            r.status === 'REASSIGNMENT REQUIRED'
          : r.status === requestFilter;

      const matchesLocality =
        requestLocalityFilter === 'ALL' ? true : r.locality.toLowerCase().includes(requestLocalityFilter.toLowerCase());

      const matchesSource =
        requestSourceFilter === 'ALL' ? true : (r.source || 'Website') === requestSourceFilter;

      const matchesSearch =
        !requestSearch.trim() ||
        r.id.toLowerCase().includes(requestSearch.toLowerCase()) ||
        r.customerName.toLowerCase().includes(requestSearch.toLowerCase()) ||
        r.customerPhone.includes(requestSearch) ||
        r.items.some((i) => i.serviceName.toLowerCase().includes(requestSearch.toLowerCase()));

      return matchesStatus && matchesLocality && matchesSource && matchesSearch;
    });
  }, [requests, requestFilter, requestLocalityFilter, requestSourceFilter, requestSearch]);

  // Combined artisans list for the Assignment Board
  const combinedArtisans = useMemo(() => {
    const empList = employees.map((e) => ({
      ...e,
      artisanType: 'EMPLOYEE' as const,
      displayName: e.name,
      displayHub: e.serviceAreas.join(', ')
    }));

    const vndList = vendors.map((v) => ({
      ...v,
      artisanType: 'VENDOR' as const,
      displayName: `${v.businessName} (${v.ownerName})`,
      skills: v.categories,
      availability: v.plan.remainingOpportunities > 0 ? ('AVAILABLE' as const) : ('OFF_DUTY' as const),
      displayHub: v.serviceAreas.join(', ')
    }));

    return [...empList, ...vndList].filter((a) => {
      const matchesType =
        boardTypeFilter === 'ALL' ? true : a.artisanType === boardTypeFilter;
      const matchesSearch =
        !boardSearch.trim() ||
        a.displayName.toLowerCase().includes(boardSearch.toLowerCase()) ||
        a.skills.some((s) => s.toLowerCase().includes(boardSearch.toLowerCase())) ||
        a.displayHub.toLowerCase().includes(boardSearch.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [employees, vendors, boardTypeFilter, boardSearch]);

  // Pending vendors awaiting Operations Manager review & activation
  const pendingVendors = useMemo(() => {
    return vendors.filter((v) => v.status === 'PENDING_VERIFICATION');
  }, [vendors]);

  // Navigation Items Definition (17 sections)
  const navItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'requests', label: 'Service Requests', icon: ClipboardList, badge: requests.length },
    { id: 'assignment', label: 'Assignment Board', icon: UserCheck, badge: readyForAssignmentCount },
    { id: 'customers', label: 'Customers', icon: Users, badge: customers.length },
    { id: 'vendors', label: 'Vendors', icon: Briefcase, badge: pendingVendors.length > 0 ? pendingVendors.length : vendors.length },
    { id: 'employees', label: 'Employees', icon: UserCog, badge: employees.length },
    { id: 'services', label: 'Services', icon: Wrench, badge: services.length },
    { id: 'categories', label: 'Categories', icon: Layers, badge: SERVICE_CATEGORIES.length },
    { id: 'packages', label: 'Packages', icon: Package, badge: packages.length },
    { id: 'pricing', label: 'Pricing Engine', icon: DollarSign },
    { id: 'projects', label: 'Projects', icon: HardHat, badge: projectRequests.length },
    { id: 'reviews', label: 'Reviews', icon: Star, badge: reviews.length },
    { id: 'complaints', label: 'Complaints', icon: AlertTriangle, badge: complaints.filter(c => c.status === 'OPEN').length },
    { id: 'payments', label: 'Payments', icon: CreditCard, badge: payments.length },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'audit', label: 'Audit Logs', icon: Clock, badge: auditLogs.length }
  ];

  return (
    <div className="bg-[#f2f3ff] min-h-screen text-[#131b2e] flex flex-col">
      {/* Top Operations Header */}
      <header className="bg-white border-b border-[#c0c9c2]/50 sticky top-[31px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSidebarMobileOpen(!isSidebarMobileOpen)}
              className="lg:hidden p-2 rounded-xl border border-[#c0c9c2] text-[#131b2e] hover:bg-[#eaedff]"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <div className="p-2 bg-[#003523] rounded-xl text-white">
              <ShieldCheck className="w-5 h-5 text-[#fe932c]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-[#131b2e]">
                  {opsSettings.dispatchCenterName}
                </h1>
                <span className="hidden sm:inline-flex bg-[#c0edd3] text-[#002114] text-[10px] font-black px-2 py-0.5 rounded-full border border-[#9ad3b5]">
                  Manual Operations Layer
                </span>
                <button
                  onClick={() => setIsDbModalOpen(true)}
                  title="Click to view Supabase PostgreSQL connection details & SQL schema"
                  className={`hidden md:inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                    dbStatus.connected && dbStatus.provider === 'supabase'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  <Database className="w-3 h-3 text-[#003523]" />
                  <span className={`w-1.5 h-1.5 rounded-full ${dbStatus.connected && dbStatus.provider === 'supabase' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span>{dbStatus.provider === 'supabase' && dbStatus.connected ? 'Supabase PostgreSQL' : 'Local Fallback (Offline)'}</span>
                  {dbStatus.latencyMs !== undefined && (
                    <span className="text-[9px] opacity-75 font-mono">({dbStatus.latencyMs}ms)</span>
                  )}
                </button>
              </div>
              <p className="text-xs text-[#707973] hidden sm:block">
                Mohali Service Corridors (Sectors 94 to 111) | Emergency: {opsSettings.emergencyHotline}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="text-right hidden md:block">
              <span className="text-[10px] text-[#707973] uppercase font-bold block">
                Supervisor On Duty
              </span>
              <span className="text-xs font-black text-[#003523]">
                {authProfile?.full_name || 'Harman'} ({authProfile?.role === 'admin' ? 'Administrator' : 'Operations Lead'})
              </span>
            </div>
            <button
              onClick={() => setIsPhoneBookingModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#fe932c] hover:bg-[#e07e1e] text-black text-xs font-black shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
              title="Create New Phone Booking on behalf of customer"
            >
              <Phone className="w-3.5 h-3.5 text-black" />
              <span>+ New Phone Booking</span>
            </button>
            <button
              onClick={() => {
                setActiveAdminTab('assignment');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#fe932c]" />
              <span className="hidden sm:inline">Manual Assignment Board</span>
              <span className="sm:hidden">Board</span>
            </button>
            <button
              onClick={() => logout()}
              className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer"
              title="Sign Out of Operations Command"
            >
              <LogOut className="w-3.5 h-3.5 text-red-600" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Operations Container (Desktop 2-Column Sidebar + Content) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar Navigation (Desktop Fixed, Tablet Collapsible) */}
        <aside
          className={`lg:w-64 shrink-0 space-y-1 lg:block ${
            isSidebarMobileOpen ? 'block fixed inset-y-0 left-0 z-50 w-72 bg-white p-4 shadow-2xl overflow-y-auto' : 'hidden'
          }`}
        >
          {isSidebarMobileOpen && (
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#c0c9c2]/40 lg:hidden">
              <div className="font-black text-sm text-[#003523]">Dispatch Navigation</div>
              <button
                onClick={() => setIsSidebarMobileOpen(false)}
                className="p-1 rounded-lg text-gray-500 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-2 shadow-xs space-y-0.5">
            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#707973]">
              Dispatch & Control
            </div>
            {navItems.slice(0, 3).map((item) => {
              const Icon = item.icon;
              const isActive = activeAdminTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveAdminTab(item.id);
                    setIsSidebarMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#003523] text-white shadow-xs'
                      : 'text-[#404943] hover:bg-[#eaedff] hover:text-[#131b2e]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#fe932c]' : 'text-[#707973]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#faf8ff] border border-[#c0c9c2]/50 text-[#131b2e]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#707973] border-t border-[#c0c9c2]/30 mt-2">
              People & Network
            </div>
            {navItems.slice(3, 6).map((item) => {
              const Icon = item.icon;
              const isActive = activeAdminTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveAdminTab(item.id);
                    setIsSidebarMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#003523] text-white shadow-xs'
                      : 'text-[#404943] hover:bg-[#eaedff] hover:text-[#131b2e]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#fe932c]' : 'text-[#707973]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#faf8ff] border border-[#c0c9c2]/50 text-[#131b2e]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#707973] border-t border-[#c0c9c2]/30 mt-2">
              Catalogue & Pricing
            </div>
            {navItems.slice(6, 11).map((item) => {
              const Icon = item.icon;
              const isActive = activeAdminTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveAdminTab(item.id);
                    setIsSidebarMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#003523] text-white shadow-xs'
                      : 'text-[#404943] hover:bg-[#eaedff] hover:text-[#131b2e]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#fe932c]' : 'text-[#707973]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#faf8ff] border border-[#c0c9c2]/50 text-[#131b2e]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#707973] border-t border-[#c0c9c2]/30 mt-2">
              Operations & Governance
            </div>
            {navItems.slice(11).map((item) => {
              const Icon = item.icon;
              const isActive = activeAdminTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveAdminTab(item.id);
                    setIsSidebarMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#003523] text-white shadow-xs'
                      : 'text-[#404943] hover:bg-[#eaedff] hover:text-[#131b2e]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#fe932c]' : 'text-[#707973]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#faf8ff] border border-[#c0c9c2]/50 text-[#131b2e]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-2 px-1 border-t border-[#c0c9c2]/30 mt-2">
              <button
                onClick={() => logout()}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Exit Operations Command</span>
              </button>
            </div>
          </div>

          {/* Quick Hub Statistics Card */}
          <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-3.5 shadow-xs text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-[#131b2e]">
              <span>Tricity Service Radius</span>
              <span className="text-[#003523]">{opsSettings.serviceRadiusKm} km</span>
            </div>
            <div className="text-[11px] text-[#707973]">
              Auto-Dispatch: <strong className="text-[#ba1a1a]">DISABLED</strong> (100% human supervisor reviewed).
            </div>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <main className="flex-1 space-y-6 min-w-0">
          {/* ======================================================== */}
          {/* 1. DASHBOARD VIEW (All 12 Mandatory Statuses & Metrics) */}
          {/* ======================================================== */}
          {activeAdminTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Operations Alert Banner: Pending Vendor Registrations */}
              {pendingVendors.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-amber-950">
                        {pendingVendors.length} New Vendor Partner Application{pendingVendors.length > 1 ? 's' : ''} Awaiting Activation
                      </h3>
                      <p className="text-xs text-amber-800">
                        Newly registered vendors have set their 8-letter passwords and are awaiting Operations confirmation to activate their profiles.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveAdminTab('vendors')}
                    className="px-4 py-2 rounded-xl bg-amber-900 hover:bg-amber-950 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shrink-0 transition-all shadow-xs cursor-pointer"
                  >
                    <span>Open Activation Queue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Compact Ops Quick Dispatch Bar */}
              <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-2.5 sm:px-4 sm:py-2 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center flex-wrap gap-2">
                  <div className="flex items-center space-x-1.5 text-xs font-black text-[#003523] pr-2.5 border-r border-[#c0c9c2]/40">
                    <Phone className="w-3.5 h-3.5 text-[#fe932c]" />
                    <span>Phone Desk</span>
                  </div>

                  {/* Counter 1: Today's Phone Bookings */}
                  <button
                    onClick={() => {
                      setRequestSourceFilter('Phone');
                      setActiveAdminTab('requests');
                    }}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200/80 text-xs transition-colors cursor-pointer"
                    title="Click to view today's phone bookings"
                  >
                    <span className="text-[11px] font-semibold text-blue-800">Today's Phone:</span>
                    <span className="font-black text-blue-900">{todayPhoneBookingsCount}</span>
                  </button>

                  {/* Counter 2: Unassigned Jobs */}
                  <button
                    onClick={() => {
                      setRequestFilter('READY FOR ASSIGNMENT');
                      setActiveAdminTab('requests');
                    }}
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors cursor-pointer ${
                      overdueUnassignedCount > 0
                        ? 'bg-red-50 hover:bg-red-100 border-red-300 text-red-900'
                        : 'bg-amber-50 hover:bg-amber-100 border-amber-200/80 text-amber-900'
                    }`}
                    title="Click to view unassigned jobs"
                  >
                    <span className="text-[11px] font-semibold">Unassigned:</span>
                    <span className="font-black">{unassignedJobsCount}</span>
                    {overdueUnassignedCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] font-black bg-red-600 text-white animate-pulse">
                        {overdueUnassignedCount} overdue &gt;30m
                      </span>
                    )}
                  </button>

                  {/* Counter 3: Awaiting Vendor Response */}
                  <button
                    onClick={() => {
                      setRequestFilter('ASSIGNED');
                      setActiveAdminTab('requests');
                    }}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200/80 text-xs transition-colors cursor-pointer"
                    title="Click to view jobs dispatched awaiting vendor response"
                  >
                    <span className="text-[11px] font-semibold text-teal-800">Awaiting Response:</span>
                    <span className="font-black text-teal-900">{awaitingVendorResponseCount}</span>
                  </button>
                </div>

                {/* Direct Action: + New Phone Booking */}
                <button
                  onClick={() => setIsPhoneBookingModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#fe932c] hover:bg-[#e07e1e] text-black font-black text-xs shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all shrink-0 hover:scale-[1.01]"
                >
                  <Phone className="w-3.5 h-3.5 text-black" />
                  <span>+ New Phone Booking</span>
                </button>
              </div>

              {/* Slim Overdue Alert (only if overdue unassigned bookings exist) */}
              {overdueUnassignedCount > 0 && (
                <div className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between gap-2 text-xs text-red-900">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 animate-bounce" />
                    <span>
                      <strong>{overdueUnassignedCount} booking{overdueUnassignedCount > 1 ? 's' : ''}</strong> unassigned for &gt;30 mins!
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setRequestFilter('ALL');
                      setActiveAdminTab('requests');
                    }}
                    className="text-[11px] font-bold text-red-700 hover:underline cursor-pointer"
                  >
                    Resolve Now →
                  </button>
                </div>
              )}

              {/* Mandatory 12 Metrics Grid */}
              <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-[#131b2e] flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-[#003523]" />
                    <span>Operations Command Metrics · 12 State Pulse</span>
                  </h2>
                  <span className="text-xs text-[#707973]">Real-time Tricity dispatch tally</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {/* Metric 1: New Requests */}
                  <div
                    onClick={() => {
                      setRequestFilter('NEW');
                      setActiveAdminTab('requests');
                    }}
                    className="p-3.5 rounded-xl border border-[#fe932c]/50 bg-[#ffdcc3]/20 hover:bg-[#ffdcc3]/40 cursor-pointer transition-all"
                  >
                    <span className="text-[10px] font-bold text-[#904d00] uppercase block">New Requests</span>
                    <div className="text-2xl font-black text-[#904d00] mt-0.5">{newRequestsCount}</div>
                    <span className="text-[10px] text-[#707973]">Awaiting initial triage</span>
                  </div>

                  {/* Metric 2: Pending Review */}
                  <div
                    onClick={() => {
                      setRequestFilter('UNDER REVIEW');
                      setActiveAdminTab('requests');
                    }}
                    className="p-3.5 rounded-xl border border-[#c0c9c2]/50 bg-[#eaedff]/40 hover:bg-[#eaedff] cursor-pointer transition-all"
                  >
                    <span className="text-[10px] font-bold text-[#003523] uppercase block">Pending Review</span>
                    <div className="text-2xl font-black text-[#003523] mt-0.5">{pendingReviewCount}</div>
                    <span className="text-[10px] text-[#707973]">Address & scope check</span>
                  </div>

                  {/* Metric 3: Ready for Assignment */}
                  <div
                    onClick={() => {
                      setRequestFilter('READY FOR ASSIGNMENT');
                      setActiveAdminTab('requests');
                    }}
                    className="p-3.5 rounded-xl border border-[#003523]/40 bg-[#c0edd3]/30 hover:bg-[#c0edd3]/50 cursor-pointer transition-all"
                  >
                    <span className="text-[10px] font-bold text-[#002114] uppercase block">Ready for Assignment</span>
                    <div className="text-2xl font-black text-[#003523] mt-0.5">{readyForAssignmentCount}</div>
                    <span className="text-[10px] text-[#003523] font-bold">Requires manual artisan</span>
                  </div>

                  {/* Metric 4: Assigned */}
                  <div
                    onClick={() => {
                      setRequestFilter('ASSIGNED');
                      setActiveAdminTab('requests');
                    }}
                    className="p-3.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 cursor-pointer transition-all"
                  >
                    <span className="text-[10px] font-bold text-blue-800 uppercase block">Assigned</span>
                    <div className="text-2xl font-black text-blue-900 mt-0.5">{assignedCount}</div>
                    <span className="text-[10px] text-[#707973]">Dispatched by supervisor</span>
                  </div>

                  {/* Metric 5: Accepted */}
                  <div
                    onClick={() => {
                      setRequestFilter('ACCEPTED');
                      setActiveAdminTab('requests');
                    }}
                    className="p-3.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 cursor-pointer transition-all"
                  >
                    <span className="text-[10px] font-bold text-teal-800 uppercase block">Accepted</span>
                    <div className="text-2xl font-black text-teal-900 mt-0.5">{acceptedCount}</div>
                    <span className="text-[10px] text-[#707973]">Acknowledged by artisan</span>
                  </div>

                  {/* Metric 6: In Progress */}
                  <div
                    onClick={() => {
                      setRequestFilter('IN PROGRESS');
                      setActiveAdminTab('requests');
                    }}
                    className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 cursor-pointer transition-all"
                  >
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">In Progress</span>
                    <div className="text-2xl font-black text-amber-900 mt-0.5">{inProgressCount}</div>
                    <span className="text-[10px] text-[#707973]">Active at Kharar/Mohali site</span>
                  </div>

                  {/* Metric 7: Completed */}
                  <div
                    onClick={() => {
                      setRequestFilter('COMPLETED');
                      setActiveAdminTab('requests');
                    }}
                    className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 cursor-pointer transition-all"
                  >
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Completed</span>
                    <div className="text-2xl font-black text-emerald-900 mt-0.5">{completedCount}</div>
                    <span className="text-[10px] text-[#707973]">Work finished & verified</span>
                  </div>

                  {/* Metric 8: Cancelled */}
                  <div
                    onClick={() => {
                      setRequestFilter('CANCELLED');
                      setActiveAdminTab('requests');
                    }}
                    className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all"
                  >
                    <span className="text-[10px] font-bold text-gray-700 uppercase block">Cancelled</span>
                    <div className="text-2xl font-black text-gray-800 mt-0.5">{cancelledCount}</div>
                    <span className="text-[10px] text-[#707973]">Customer withdrawn</span>
                  </div>

                  {/* Metric 9: Reassignment Required */}
                  <div
                    onClick={() => {
                      setRequestFilter('REASSIGNMENT_REQUIRED');
                      setActiveAdminTab('requests');
                    }}
                    className="p-3.5 rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 cursor-pointer transition-all"
                  >
                    <span className="text-[10px] font-bold text-red-800 uppercase block">Reassignment Required</span>
                    <div className="text-2xl font-black text-red-900 mt-0.5">{reassignmentRequiredCount}</div>
                    <span className="text-[10px] text-red-700 font-bold">Disputed / Breakdown</span>
                  </div>

                  {/* Metric 10: Project Requests */}
                  <div
                    onClick={() => setActiveAdminTab('projects')}
                    className="p-3.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 cursor-pointer transition-all"
                  >
                    <span className="text-[10px] font-bold text-purple-800 uppercase block">Project Requests</span>
                    <div className="text-2xl font-black text-purple-900 mt-0.5">{projectRequestsCount}</div>
                    <span className="text-[10px] text-[#707973]">Civil, kitchen & interior</span>
                  </div>

                  {/* Metric 11: Active Vendors */}
                  <div
                    onClick={() => setActiveAdminTab('vendors')}
                    className="p-3.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 cursor-pointer transition-all"
                  >
                    <span className="text-[10px] font-bold text-blue-800 uppercase block">Active Vendors</span>
                    <div className="text-2xl font-black text-blue-900 mt-0.5">{activeVendorsCount}</div>
                    <span className="text-[10px] text-[#707973]">Registered partner firms</span>
                  </div>

                  {/* Metric 12: Active Employees */}
                  <div
                    onClick={() => setActiveAdminTab('employees')}
                    className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 cursor-pointer transition-all"
                  >
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Active Employees</span>
                    <div className="text-2xl font-black text-emerald-900 mt-0.5">{activeEmployeesCount}</div>
                    <span className="text-[10px] text-[#707973]">Direct payroll staff</span>
                  </div>
                </div>
              </div>

              {/* Urgent Dispatch Action Banner */}
              {(newRequestsCount > 0 || readyForAssignmentCount > 0 || reassignmentRequiredCount > 0) && (
                <div className="bg-[#ffdcc3]/30 border border-[#fe932c] p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-[#fe932c] text-[#002114] rounded-xl font-black">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-[#904d00]">
                        Action Required: {newRequestsCount + readyForAssignmentCount + reassignmentRequiredCount} orders pending manual dispatch
                      </h3>
                      <p className="text-xs text-[#404943]">
                        No robot automations are assigning leads. Pick qualified artisans matching customer locality on the Assignment Board.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveAdminTab('assignment')}
                    className="px-4 py-2 rounded-xl bg-[#003523] text-white text-xs font-bold shadow-xs hover:bg-[#144d37] flex items-center space-x-1.5"
                  >
                    <UserCheck className="w-4 h-4 text-[#fe932c]" />
                    <span>Open Assignment Board</span>
                  </button>
                </div>
              )}

              {/* Vendor Partner Onboarding Payment Alert Banner */}
              {pendingVendors.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-extrabold text-sm text-amber-950">
                          {pendingVendors.length} Trade Partner{pendingVendors.length > 1 ? 's' : ''} Awaiting Onboarding Payment Verification
                        </h3>
                        <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                          Payment Required
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Approval requires recording plan subscription payment via Cash, Online (UPI/UTR), or Cheque to track revenue and release lead quotas.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveAdminTab('vendors')}
                    className="px-4 py-2 rounded-xl bg-[#003523] text-white text-xs font-bold shadow-xs hover:bg-[#144d37] flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <span>Review & Collect Payments</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#fe932c]" />
                  </button>
                </div>
              )}

              {/* 2-Column Dashboard Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Priority Queue */}
                <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-[#131b2e] flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-[#003523]" />
                      <span>Incoming Requests Queue</span>
                    </h3>
                    <button
                      onClick={() => setActiveAdminTab('requests')}
                      className="text-xs font-bold text-[#003523] hover:underline"
                    >
                      View All ({requests.length}) →
                    </button>
                  </div>

                  <div className="divide-y divide-[#c0c9c2]/30">
                    {requests.slice(0, 5).map((req) => (
                      <div
                        key={req.id}
                        onClick={() => setSelectedDetailRequestId(req.id)}
                        className="py-3 flex items-center justify-between hover:bg-[#faf8ff] px-2 rounded-xl cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-extrabold text-xs text-[#131b2e] flex items-center space-x-2">
                            <span>#{req.id}</span>
                            <span>·</span>
                            <span>{req.customerName}</span>
                          </div>
                          <div className="text-[11px] text-[#707973]">
                            {req.locality} · {req.items.map((i) => i.serviceName).join(', ')}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-xs text-[#003523]">₹{req.total}</span>
                          <span className="block text-[10px] font-bold text-[#707973]">{req.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operations Financial & Dispatch Overview */}
                <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-[#131b2e] flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-[#003523]" />
                      <span>Financial & Quota Summary</span>
                    </h3>
                    <button
                      onClick={() => setActiveAdminTab('payments')}
                      className="text-xs font-bold text-[#003523] hover:underline"
                    >
                      Reconciled Ledger ({payments.length}) →
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/40">
                      <span className="text-[10px] text-[#707973] uppercase font-bold block">Gross Booking Volume</span>
                      <span className="text-xl font-black text-[#003523]">₹{totalRevenue}</span>
                      <span className="text-[10px] text-[#707973] block mt-0.5">{requests.length} jobs booked</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/40">
                      <span className="text-[10px] text-[#707973] uppercase font-bold block">Reconciled Collections</span>
                      <span className="text-xl font-black text-[#131b2e]">₹{totalReconciledPayments}</span>
                      <span className="text-[10px] text-[#003523] font-bold block mt-0.5">UPI & Cash settled</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#c0c9c2]/30 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#707973]">Vendor Opportunity Quota Consumed:</span>
                      <span className="font-black text-[#003523]">
                        {opportunityLedger.filter((l) => l.change < 0).length} Leads Dispatched
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#707973]">Active Open Complaints:</span>
                      <span className="font-bold text-[#ba1a1a]">
                        {complaints.filter((c) => c.status === 'OPEN').length} Open
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. SERVICE REQUESTS QUEUE VIEW */}
          {/* ======================================================== */}
          {activeAdminTab === 'requests' && (
            <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-[#131b2e] flex items-center space-x-2">
                    <ClipboardList className="w-5 h-5 text-[#003523]" />
                    <span>Service Requests Queue ({filteredRequests.length})</span>
                  </h2>
                  <p className="text-xs text-[#707973]">
                    Click any service order to view full customer dossier, inspect diagnostic photos, add internal notes, or dispatch an artisan.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsPhoneBookingModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#fe932c] hover:bg-[#e07e1e] text-black font-black text-xs shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-black" />
                    <span>+ New Phone Booking</span>
                  </button>
                  <button
                    onClick={() => setRequestFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      requestFilter === 'ALL'
                        ? 'bg-[#003523] text-white border-[#003523]'
                        : 'bg-white text-[#404943] border-[#c0c9c2]/60'
                    }`}
                  >
                    All ({requests.length})
                  </button>
                  <button
                    onClick={() => setRequestFilter('READY FOR ASSIGNMENT')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      requestFilter === 'READY FOR ASSIGNMENT'
                        ? 'bg-[#003523] text-white border-[#003523]'
                        : 'bg-white text-[#404943] border-[#c0c9c2]/60'
                    }`}
                  >
                    Unassigned ({readyForAssignmentCount})
                  </button>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#707973]" />
                  <input
                    type="text"
                    value={requestSearch}
                    onChange={(e) => setRequestSearch(e.target.value)}
                    placeholder="Search by order ID, customer name, phone, service..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#c0c9c2] text-xs focus:border-[#003523]"
                  />
                </div>

                <select
                  value={requestFilter}
                  onChange={(e) => setRequestFilter(e.target.value)}
                  className="p-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold bg-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="NEW">NEW</option>
                  <option value="Pending Assignment">Pending Assignment</option>
                  <option value="Visit Scheduled">Visit Scheduled (Project)</option>
                  <option value="UNDER REVIEW">UNDER REVIEW</option>
                  <option value="READY FOR ASSIGNMENT">READY FOR ASSIGNMENT</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="IN PROGRESS">IN PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CUSTOMER CONFIRMED">CUSTOMER CONFIRMED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="REASSIGNMENT_REQUIRED">REASSIGNMENT REQUIRED</option>
                </select>

                <select
                  value={requestSourceFilter}
                  onChange={(e) => setRequestSourceFilter(e.target.value as any)}
                  className="p-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold bg-white"
                >
                  <option value="ALL">All Sources (Phone, Web, WA)</option>
                  <option value="Phone">Source: Phone (Ops)</option>
                  <option value="Website">Source: Website</option>
                  <option value="WhatsApp">Source: WhatsApp</option>
                  <option value="Referral">Source: Referral</option>
                </select>

                <select
                  value={requestLocalityFilter}
                  onChange={(e) => setRequestLocalityFilter(e.target.value)}
                  className="p-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold bg-white"
                >
                  <option value="ALL">All Sectors (94 to 111)</option>
                  <option value="Sector 94">Sector 94 (JLPL)</option>
                  <option value="Sectors 95">Sectors 95–97 (GMADA)</option>
                  <option value="Sectors 98">Sectors 98–99 (Wave Estate)</option>
                  <option value="Sector 100">Sector 100–101 (Plaksha)</option>
                  <option value="Sector 104">Sector 104 (Emaar Mohali Hills)</option>
                  <option value="Sector 105">Sector 105 (Emaar Central Plaza)</option>
                  <option value="Sector 106">Sector 106–107</option>
                  <option value="Sector 108">Sector 108</option>
                  <option value="Sector 109">Sector 109 (The Bungalows)</option>
                  <option value="Sector 110">Sector 110 (TDI City)</option>
                  <option value="Sector 111">Sector 111 (TDI Connaught Place)</option>
                </select>
              </div>

              {/* Requests Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#c0c9c2]/50 bg-[#faf8ff] text-[#404943] font-bold">
                      <th className="p-3">Order & Customer</th>
                      <th className="p-3">Locality / Address</th>
                      <th className="p-3">Services Ordered</th>
                      <th className="p-3">Price & Payment</th>
                      <th className="p-3">Preferred Slot</th>
                      <th className="p-3">Operational Status</th>
                      <th className="p-3">Assigned Artisan</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c0c9c2]/30">
                    {filteredRequests.map((req) => {
                      const isOverdue = isBookingUnassignedOverdue(req);
                      return (
                        <tr
                          key={req.id}
                          className={`transition-colors ${
                            isOverdue ? 'bg-red-50/70 hover:bg-red-50 border-l-4 border-l-red-500' : 'hover:bg-[#faf8ff]'
                          }`}
                        >
                          <td className="p-3">
                            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                              <button
                                onClick={() => setSelectedDetailRequestId(req.id)}
                                className="font-black text-[#003523] hover:underline flex items-center space-x-1"
                              >
                                <span>#{req.id}</span>
                              </button>
                              <span
                                className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black ${
                                  (req.source || 'Website') === 'Phone'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : (req.source || 'Website') === 'WhatsApp'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : (req.source || 'Website') === 'Referral'
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                                }`}
                              >
                                {req.source || 'Website'}
                              </span>
                              {req.bookingType === 'Project' && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                                  Project
                                </span>
                              )}
                            </div>
                            <div className="font-bold text-[#131b2e] mt-0.5">{req.customerName}</div>
                            <div className="text-[11px] text-[#707973]">{req.customerPhone}</div>
                            {isOverdue && (
                              <div className="mt-1 inline-flex items-center space-x-1 text-[10px] font-black text-red-700 bg-red-100 px-1.5 py-0.5 rounded border border-red-300 animate-pulse">
                                <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
                                <span>Unassigned &gt;30m</span>
                              </div>
                            )}
                          </td>

                        <td className="p-3">
                          <div className="font-bold text-[#003523]">{req.locality}</div>
                          <div className="text-[11px] text-[#707973] line-clamp-1">{req.address}</div>
                        </td>

                        <td className="p-3">
                          <div className="font-semibold text-[#131b2e]">
                            {req.items.map((i) => i.serviceName).join(', ')}
                          </div>
                          {req.notes && (
                            <div className="text-[11px] text-[#904d00] line-clamp-1 mt-0.5">
                              "{req.notes}"
                            </div>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="font-mono font-black text-sm text-[#003523]">₹{req.total}</div>
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              req.paymentStatus === 'PAID'
                                ? 'bg-[#c0edd3] text-[#003523]'
                                : 'bg-[#ffdcc3] text-[#904d00]'
                            }`}
                          >
                            {req.paymentStatus}
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-[#131b2e]">{req.preferredDate}</div>
                          <div className="text-[11px] text-[#707973]">{req.preferredTimeSlot}</div>
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                              req.status === 'READY FOR ASSIGNMENT'
                                ? 'bg-[#c0edd3] text-[#002114] border-[#003523]'
                                : req.status === 'NEW'
                                ? 'bg-[#ffdcc3] text-[#904d00] border-[#fe932c]'
                                : req.status === 'DISPUTED'
                                ? 'bg-red-100 text-red-800 border-red-300'
                                : 'bg-[#faf8ff] text-[#131b2e] border-[#c0c9c2]'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>

                        <td className="p-3">
                          {req.assignedTo ? (
                            <div>
                              <div className="font-extrabold text-[#131b2e]">{req.assignedTo.name}</div>
                              <div className="text-[10px] text-[#707973]">
                                {req.assignedTo.type} · {req.assignedTo.rating}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[#ba1a1a] font-bold text-[11px]">Unassigned</span>
                          )}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setSelectedDetailRequestId(req.id)}
                              className="px-2.5 py-1.5 rounded-lg border border-[#c0c9c2] hover:bg-[#eaedff] text-xs font-bold text-[#131b2e]"
                              title="View Full File & Notes"
                            >
                              Dossier
                            </button>

                            <button
                              onClick={() => setAssigningRequestId(req.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold shadow-xs"
                            >
                              {req.assignedTo ? 'Reassign' : 'Assign'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. MANUAL ASSIGNMENT BOARD (Core Operations Heart) */}
          {/* ======================================================== */}
          {activeAdminTab === 'assignment' && (
            <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-[#131b2e] flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-[#003523]" />
                    <span>Manual Assignment Board</span>
                  </h2>
                  <p className="text-xs text-[#707973]">
                    Columns: Name · Type · Skills · Service Area · Rating · Active Jobs · Availability · Status · Actions (ASSIGN / REASSIGN).
                    Every assignment creates an immutable audit trail with operator, reason, and previous assignee.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setBoardTypeFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      boardTypeFilter === 'ALL'
                        ? 'bg-[#003523] text-white border-[#003523]'
                        : 'bg-white text-[#404943] border-[#c0c9c2]/60'
                    }`}
                  >
                    All Artisans ({combinedArtisans.length})
                  </button>
                  <button
                    onClick={() => setBoardTypeFilter('EMPLOYEE')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      boardTypeFilter === 'EMPLOYEE'
                        ? 'bg-[#003523] text-white border-[#003523]'
                        : 'bg-white text-[#404943] border-[#c0c9c2]/60'
                    }`}
                  >
                    Staff ({employees.length})
                  </button>
                  <button
                    onClick={() => setBoardTypeFilter('VENDOR')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      boardTypeFilter === 'VENDOR'
                        ? 'bg-[#003523] text-white border-[#003523]'
                        : 'bg-white text-[#404943] border-[#c0c9c2]/60'
                    }`}
                  >
                    Vendors ({vendors.length})
                  </button>
                </div>
              </div>

              {/* Assignment Board Search Filter */}
              <div className="relative max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#707973]" />
                <input
                  type="text"
                  value={boardSearch}
                  onChange={(e) => setBoardSearch(e.target.value)}
                  placeholder="Filter artisan by trade skill or locality hub..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#c0c9c2] text-xs focus:border-[#003523]"
                />
              </div>

              {/* Manual Assignment Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#c0c9c2]/50 bg-[#faf8ff] text-[#404943] font-bold">
                      <th className="p-3">Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Skills</th>
                      <th className="p-3">Service Area</th>
                      <th className="p-3">Rating</th>
                      <th className="p-3">Active Jobs</th>
                      <th className="p-3">Availability</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Dispatch Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c0c9c2]/30">
                    {combinedArtisans.map((artisan) => {
                      const isVendor = artisan.artisanType === 'VENDOR';
                      const vendorObj = isVendor ? (artisan as Vendor) : null;
                      const hasOpportunities = !vendorObj || vendorObj.plan.remainingOpportunities > 0;

                      return (
                        <tr key={artisan.id} className="hover:bg-[#faf8ff] transition-colors">
                          <td className="p-3 font-extrabold text-[#131b2e]">
                            {artisan.displayName}
                            <div className="text-[11px] text-[#707973] font-normal">{artisan.mobile}</div>
                          </td>

                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                artisan.artisanType === 'EMPLOYEE'
                                  ? 'bg-[#c0edd3] text-[#003523]'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {artisan.artisanType}
                            </span>
                          </td>

                          <td className="p-3">
                            <div className="font-semibold text-[#131b2e]">{artisan.skills.join(', ')}</div>
                          </td>

                          <td className="p-3 font-medium text-[#003523]">
                            {artisan.displayHub}
                          </td>

                          <td className="p-3">
                            <div className="font-black text-[#003523] flex items-center space-x-1">
                              <Star className="w-3.5 h-3.5 fill-[#fe932c] text-[#fe932c]" />
                              <span>{artisan.rating}</span>
                            </div>
                          </td>

                          <td className="p-3 font-bold text-[#131b2e]">
                            {artisan.activeJobs} jobs
                          </td>

                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                artisan.availability === 'AVAILABLE'
                                  ? 'bg-[#c0edd3] text-[#003523]'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {artisan.availability}
                            </span>
                            {isVendor && vendorObj && (
                              <div
                                className={`text-[10px] font-bold mt-0.5 ${
                                  hasOpportunities ? 'text-[#003523]' : 'text-[#ba1a1a]'
                                }`}
                              >
                                {vendorObj.plan.remainingOpportunities} quota left
                              </div>
                            )}
                          </td>

                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#c0edd3] text-[#003523]">
                              {artisan.status}
                            </span>
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() =>
                                  setBoardModalTarget({
                                    artisan: artisan as any,
                                    type: artisan.artisanType,
                                    mode: 'ASSIGN'
                                  })
                                }
                                disabled={isVendor && !hasOpportunities}
                                className={`px-2.5 py-1.5 rounded-lg font-bold text-xs shadow-xs transition-all ${
                                  isVendor && !hasOpportunities
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-[#003523] hover:bg-[#144d37] text-white'
                                }`}
                              >
                                ASSIGN
                              </button>

                              <button
                                onClick={() =>
                                  setBoardModalTarget({
                                    artisan: artisan as any,
                                    type: artisan.artisanType,
                                    mode: 'REASSIGN'
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg border border-[#c0c9c2] hover:bg-[#eaedff] text-xs font-bold text-[#131b2e]"
                              >
                                REASSIGN
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. CUSTOMERS ROSTER VIEW */}
          {/* ======================================================== */}
          {activeAdminTab === 'customers' && (
            <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-[#131b2e] flex items-center space-x-2">
                    <Users className="w-5 h-5 text-[#003523]" />
                    <span>Customer Relationship Ledger ({customers.length})</span>
                  </h2>
                  <p className="text-xs text-[#707973]">
                    Registered homeowners across Kharar, Mohali, and Tricity sub-sectors.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#c0c9c2]/50 bg-[#faf8ff] text-[#404943] font-bold">
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">Phone & Email</th>
                      <th className="p-3">Locality / Address</th>
                      <th className="p-3">Total Orders</th>
                      <th className="p-3">Lifetime Value</th>
                      <th className="p-3">Registered Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c0c9c2]/30">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-[#faf8ff]">
                        <td className="p-3 font-extrabold text-[#131b2e]">
                          {c.name}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-[#003523]">{c.phone}</div>
                          <div className="text-[11px] text-[#707973]">{c.email}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-[#131b2e]">{c.locality}</div>
                          <div className="text-[11px] text-[#707973] line-clamp-1">{c.address}</div>
                        </td>
                        <td className="p-3 font-bold text-[#131b2e]">
                          {c.totalBookings} bookings
                        </td>
                        <td className="p-3 font-mono font-black text-[#003523]">
                          ₹{c.totalSpent}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[#707973]">
                          {c.registeredDate}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.status === 'VIP'
                                ? 'bg-[#ffdcc3] text-[#904d00]'
                                : 'bg-[#c0edd3] text-[#003523]'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => {
                                setRequestSearch(c.name);
                                setActiveAdminTab('requests');
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-[#c0c9c2] hover:bg-[#eaedff] font-bold text-xs cursor-pointer"
                            >
                              View Bookings
                            </button>
                            {c.phone && (
                              <button
                                onClick={() => {
                                  setReleasingCustomer(c);
                                  setReleaseReason('');
                                  setReleaseError(null);
                                }}
                                className="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs flex items-center space-x-1 cursor-pointer"
                                title="Release Mobile Number (Admin only)"
                              >
                                <PhoneOff className="w-3 h-3 text-red-600" />
                                <span className="hidden sm:inline">Release Mobile</span>
                                <span className="sm:hidden">Release</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 5. VENDORS & OPPORTUNITY LEDGER VIEW */}
          {/* ======================================================== */}
          {activeAdminTab === 'vendors' && (
            <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-5 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-black text-[#131b2e] flex items-center space-x-2">
                    <Briefcase className="w-5 h-5 text-[#003523]" />
                    <span>Registered Partner Contractors & Opportunity Ledger ({vendors.length})</span>
                  </h2>
                  <p className="text-xs text-[#707973]">
                    Opportunity deduction occurs upon manual supervisor dispatch. Zero fees charged upon customer booking.
                  </p>
                </div>
                <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
                  {pendingVendors.length > 0 && (
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                      <span>{pendingVendors.length} Awaiting Operations Activation</span>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setStaffModalDefaultRole('vendor');
                      setIsCreateStaffModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4 text-[#fe932c]" />
                    <span>Add Vendor Partner</span>
                  </button>
                </div>
              </div>

              {/* PENDING VENDOR APPLICATIONS & ACTIVATION QUEUE */}
              {pendingVendors.length > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border-2 border-amber-300 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-black text-amber-950">
                            Pending Vendor Applications & Activation Queue
                          </h3>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                            {pendingVendors.length} New Application{pendingVendors.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800">
                          These contractors completed registration with an 8-character password. Per Standard Operating Procedure, the Operations Manager must verify trade details and confirm activation before they can log in to the Partner Hub.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    {pendingVendors.map((vnd) => (
                      <div
                        key={vnd.id}
                        className="p-4 rounded-xl bg-white border border-amber-300 shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-extrabold text-sm text-[#131b2e] flex items-center space-x-2">
                              <span>{vnd.businessName}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                                {vnd.id}
                              </span>
                            </div>
                            <div className="text-xs text-[#707973] font-medium mt-0.5">
                              Owner: <span className="font-bold text-[#131b2e]">{vnd.ownerName}</span> · {vnd.mobile}
                            </div>
                          </div>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 uppercase tracking-wider border border-amber-200">
                            Pending Activation
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-lg bg-[#faf8ff] border border-[#c0c9c2]/40">
                          <div>
                            <span className="text-[#707973] block text-[10px]">Trade Category</span>
                            <span className="font-bold text-[#131b2e]">{vnd.categories.join(', ')}</span>
                          </div>
                          <div>
                            <span className="text-[#707973] block text-[10px]">Service Corridors</span>
                            <span className="font-bold text-[#003523]">{vnd.serviceAreas.join(', ')}</span>
                          </div>
                          <div>
                            <span className="text-[#707973] block text-[10px]">Selected Plan</span>
                            <span className="font-bold text-[#131b2e]">{vnd.plan.name} (₹{vnd.plan.price})</span>
                          </div>
                          <div>
                            <span className="text-[#707973] block text-[10px]">Starter Quota</span>
                            <span className="font-bold text-[#003523]">{vnd.plan.totalOpportunities} Opportunities</span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-[#c0c9c2]/30">
                          <div className="text-[10px] text-emerald-800 font-semibold flex items-center space-x-1">
                            <Lock className="w-3 h-3 text-emerald-700" />
                            <span>8-Letter Password Set by Vendor</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => updateVendorStatus(vnd.id, 'REJECTED')}
                              className="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedApprovalVendor(vnd);
                                setApprovalModalMode('approve');
                                setIsApprovalModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5 text-[#fe932c]" />
                              <span>Collect Payment & Activate</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#c0c9c2]/50 bg-[#faf8ff] text-[#404943] font-bold">
                      <th className="p-3">Business & Owner</th>
                      <th className="p-3">Categories & Hub</th>
                      <th className="p-3">Plan / Validity</th>
                      <th className="p-3">Onboarding Payment</th>
                      <th className="p-3">Quota (Used / Total)</th>
                      <th className="p-3">Remaining Balance</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c0c9c2]/30">
                    {vendors.map((vnd) => {
                      const remaining = vnd.plan.remainingOpportunities;
                      const isPending = vnd.status === 'PENDING_VERIFICATION';
                      return (
                        <tr key={vnd.id} className={isPending ? 'bg-amber-50/50 hover:bg-amber-50/80 transition-colors' : 'hover:bg-[#faf8ff] transition-colors'}>
                          <td className="p-3">
                            <div className="font-extrabold text-[#131b2e] flex items-center space-x-1.5">
                              <span>{vnd.businessName}</span>
                              {isPending && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-300">
                                  NEW AWAITING ACTIVATION
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#707973]">
                              {vnd.ownerName} · {vnd.mobile}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-[#131b2e]">{vnd.categories.join(', ')}</div>
                            <div className="text-[11px] text-[#003523]">{vnd.serviceAreas[0]}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-mono text-xs font-bold">{vnd.plan.name} (₹{vnd.plan.price})</div>
                            <div className="text-[10px] text-[#707973]">Expires: {vnd.plan.expiryDate}</div>
                          </td>
                          {/* Onboarding Payment Status & Method */}
                          <td className="p-3">
                            {vnd.onboardingPayment ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedApprovalVendor(vnd);
                                  setApprovalModalMode('view');
                                  setIsApprovalModalOpen(true);
                                }}
                                className="text-left group cursor-pointer"
                                title="Click to view full financial audit receipt"
                              >
                                <div className="flex items-center space-x-1.5">
                                  {vnd.onboardingPayment.method === 'CASH' && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                                      <Wallet className="w-3 h-3 text-emerald-700" />
                                      <span>CASH · ₹{vnd.onboardingPayment.amount}</span>
                                    </span>
                                  )}
                                  {vnd.onboardingPayment.method === 'ONLINE' && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center space-x-1">
                                      <Smartphone className="w-3 h-3 text-blue-700" />
                                      <span>ONLINE · ₹{vnd.onboardingPayment.amount}</span>
                                    </span>
                                  )}
                                  {vnd.onboardingPayment.method === 'CHEQUE' && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 flex items-center space-x-1">
                                      <Building2 className="w-3 h-3 text-purple-700" />
                                      <span>CHQ · ₹{vnd.onboardingPayment.amount}</span>
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 group-hover:underline block mt-0.5 truncate max-w-[120px]">
                                  Ref: {vnd.onboardingPayment.transactionRef}
                                </span>
                              </button>
                            ) : isPending ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                Payment Required
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-mono">Legacy Verified</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="w-full bg-[#eaedff] rounded-full h-1.5 max-w-[90px] mb-1">
                              <div
                                className="bg-[#003523] h-1.5 rounded-full"
                                style={{
                                  width: `${(vnd.plan.usedOpportunities / vnd.plan.totalOpportunities) * 100}%`
                                }}
                              />
                            </div>
                            <span className="text-[11px] text-[#404943] font-bold">
                              {vnd.plan.usedOpportunities} / {vnd.plan.totalOpportunities}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`font-black ${
                                remaining > 2 ? 'text-[#003523]' : 'text-[#ba1a1a]'
                              }`}
                            >
                              {remaining} Leads Left
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isPending
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : vnd.status === 'ACTIVE'
                                  ? 'bg-[#c0edd3] text-[#003523]'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {isPending ? 'PENDING APPROVAL' : vnd.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {isPending ? (
                                <>
                                  <button
                                    onClick={() => updateVendorStatus(vnd.id, 'REJECTED')}
                                    className="px-2 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedApprovalVendor(vnd);
                                      setApprovalModalMode('approve');
                                      setIsApprovalModalOpen(true);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs flex items-center space-x-1 shadow-xs cursor-pointer"
                                  >
                                    <CreditCard className="w-3.5 h-3.5 text-[#fe932c]" />
                                    <span>Approve & Collect</span>
                                  </button>
                                </>
                              ) : (
                                <div className="flex items-center space-x-1">
                                  {vnd.onboardingPayment && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedApprovalVendor(vnd);
                                        setApprovalModalMode('view');
                                        setIsApprovalModalOpen(true);
                                      }}
                                      className="px-2 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs cursor-pointer flex items-center space-x-1"
                                      title="View verified payment audit receipt"
                                    >
                                      <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                                      <span>Receipt</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setLedgerVendorId(vnd.id)}
                                    className="px-3 py-1.5 rounded-lg bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs cursor-pointer"
                                  >
                                    Adjust Quota
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 6. EMPLOYEES VIEW */}
          {/* ======================================================== */}
          {activeAdminTab === 'employees' && (
            <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-[#131b2e] flex items-center space-x-2">
                    <UserCog className="w-5 h-5 text-[#003523]" />
                    <span>Direct Company Staff & Payroll Artisans ({employees.length})</span>
                  </h2>
                  <p className="text-xs text-[#707973]">
                    Permanent company technicians equipped with standardized tool kits, assigned roles, and verified KYC across Sectors 94 to 111.
                  </p>
                </div>
                <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
                  <button
                    onClick={() => {
                      setStaffModalDefaultRole('technician');
                      setIsCreateStaffModalOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-[#fe932c]" />
                    <span>Add Employee / Staff</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-4 rounded-2xl border border-[#c0c9c2]/60 bg-[#faf8ff] space-y-3 text-xs hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span className="font-black text-sm text-[#131b2e]">{emp.name}</span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">
                            {emp.employeeCode || emp.id}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#707973] flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-[#003523]" />
                          <span>{emp.mobile}</span>
                        </div>
                      </div>

                      <select
                        value={emp.availability}
                        onChange={(e) => updateEmployeeAvailability(emp.id, e.target.value as any)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border cursor-pointer ${
                          emp.availability === 'AVAILABLE'
                            ? 'bg-[#c0edd3] text-[#003523] border-[#003523]'
                            : emp.availability === 'ON_JOB'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-gray-100 text-gray-600 border-gray-300'
                        }`}
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="ON_JOB">ON JOB</option>
                        <option value="OFF_DUTY">OFF DUTY</option>
                      </select>
                    </div>

                    {/* Assigned Operational Role */}
                    <div className="bg-[#f4fbf7] p-2.5 rounded-xl border border-[#c0edd3]/70 space-y-1">
                      <div className="text-[10px] font-black uppercase tracking-wider text-[#003523] flex items-center justify-between">
                        <span className="flex items-center space-x-1">
                          <Briefcase className="w-3 h-3 text-[#fe932c]" />
                          <span>Assigned Role</span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-[#003523] border border-[#003523]/30 font-extrabold">
                          {emp.status}
                        </span>
                      </div>
                      <div className="font-extrabold text-[#003523] text-xs">
                        {emp.role || 'Field Specialist'}
                      </div>
                    </div>

                    {/* Trade Categories */}
                    {emp.categories && emp.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {emp.categories.map((cat, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#c0c9c2]/50 text-[#404943]"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Skills */}
                    <div className="text-[#404943] leading-relaxed">
                      <strong className="text-[#131b2e]">Specializations:</strong>{' '}
                      <span className="text-[#404943]">{emp.skills.join(', ')}</span>
                    </div>

                    {/* Assigned Hubs / Sectors */}
                    <div className="text-[#404943] space-y-1">
                      <div className="flex items-center space-x-1 text-[11px] font-bold text-[#131b2e]">
                        <MapPin className="w-3 h-3 text-[#003523]" />
                        <span>Assigned Sectors ({emp.serviceAreas.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {emp.serviceAreas.map((area, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-[#003523] border border-emerald-200 font-medium"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Stats & Actions Footer */}
                    <div className="pt-2 border-t border-[#c0c9c2]/40 flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-[11px] text-[#707973]">
                        <span className="font-bold text-amber-700">{emp.rating} ★</span>
                        <span>•</span>
                        <span>{emp.completedJobs} jobs</span>
                      </div>

                      <button
                        onClick={() => {
                          setEditingEmployee(emp);
                          setIsEmployeeModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-[#003523] text-[#003523] hover:bg-[#003523] hover:text-white transition-all text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                        title="Edit operational role, trade skills and assigned service sectors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Role & Hubs</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 7. SERVICES VIEW */}
          {/* ======================================================== */}
          {activeAdminTab === 'services' && (
            <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-[#131b2e] flex items-center space-x-2">
                    <Wrench className="w-5 h-5 text-[#003523]" />
                    <span>Services Catalogue ({filteredAdminServices.length}{adminServiceSearch ? ` of ${services.length}` : ''})</span>
                  </h2>
                  <p className="text-xs text-[#707973]">
                    Active catalogue items with pricing types, warranty, and doorstep visit fees.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddServiceModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#fe932c]" />
                  <span>Add New Service</span>
                </button>
              </div>

              {/* Fast Search Query & Instant Deletion Bar */}
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-[#707973] absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={adminServiceSearch}
                  onChange={(e) => setAdminServiceSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setAdminServiceSearch('');
                  }}
                  placeholder="Fast search services by name, category, subcategory, or description... (Press Esc to clear)"
                  className="w-full pl-9 pr-9 py-2.5 bg-[#faf8ff] border border-[#c0c9c2]/60 rounded-xl text-xs font-medium text-[#131b2e] placeholder-[#707973] focus:outline-none focus:ring-2 focus:ring-[#003523]/20 focus:border-[#003523] transition-all"
                />
                {adminServiceSearch && (
                  <button
                    onClick={() => setAdminServiceSearch('')}
                    title="Clear search query (Esc)"
                    className="absolute right-2.5 p-1 rounded-full text-[#707973] hover:text-[#131b2e] hover:bg-[#e2e8e0] transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#c0c9c2]/50 bg-[#faf8ff] text-[#404943] font-bold">
                      <th className="p-3">Service Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Pricing Type</th>
                      <th className="p-3">Base Price</th>
                      <th className="p-3">Duration & Warranty</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c0c9c2]/30">
                    {filteredAdminServices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-xs text-[#707973]">
                          No services found matching &ldquo;<span className="font-bold text-[#131b2e]">{adminServiceSearch}</span>&rdquo;.
                          <button
                            onClick={() => setAdminServiceSearch('')}
                            className="ml-2 font-bold text-[#003523] underline cursor-pointer"
                          >
                            Clear search query
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredAdminServices.map((srv) => (
                        <tr key={srv.id} className="hover:bg-[#faf8ff]">
                          <td className="p-3 font-extrabold text-[#131b2e]">{srv.name}</td>
                          <td className="p-3 text-[#707973]">{srv.category} · {srv.subcategory}</td>
                          <td className="p-3 font-bold text-[#003523]">{srv.price_type}</td>
                          <td className="p-3 font-mono font-bold">
                            {srv.price_type === 'QUOTE_REQUIRED' ? 'Request a Quote' : `₹${srv.base_price}`}
                          </td>
                          <td className="p-3 text-[#707973]">{srv.duration} · {srv.warranty}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                srv.active ? 'bg-[#c0edd3] text-[#003523]' : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {srv.active ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => setSelectedEditService(srv)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#003523] text-white font-bold"
                              >
                                Edit Pricing
                              </button>
                              <button
                                onClick={() => toggleServiceActive(srv.id)}
                                className="px-2 py-1 rounded-lg border border-[#c0c9c2] font-semibold"
                              >
                                {srv.active ? 'Disable' : 'Enable'}
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to permanently delete "${srv.name}"? This will delete it directly from Supabase.`)) {
                                    await deleteService(srv.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors cursor-pointer"
                                title="Permanently Delete Service from Supabase"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 8. CATEGORIES VIEW */}
          {/* ======================================================== */}
          {activeAdminTab === 'categories' && (
            <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-5 shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-black text-[#131b2e] flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-[#003523]" />
                  <span>Category & Subcategory Hierarchy System</span>
                </h2>
                <p className="text-xs text-[#707973]">
                  Configurable Category → Subcategory → Service → Package architecture.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SERVICE_CATEGORIES.map((cat) => {
                  const matchingServices = services.filter((s) => s.category === cat.name);
                  return (
                    <div
                      key={cat.id}
                      className="p-4 rounded-xl border border-[#c0c9c2]/50 bg-[#faf8ff] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-[#131b2e]">{cat.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#c0edd3] text-[#003523]">
                          {matchingServices.length} Services
                        </span>
                      </div>
                      <p className="text-[#707973]">{cat.description}</p>
                      <div className="pt-2 border-t border-[#c0c9c2]/30 text-[11px] text-[#003523] font-semibold">
                        Subcategories: {cat.subcategories.join(' · ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 9. PACKAGES VIEW */}
          {/* ======================================================== */}
          {activeAdminTab === 'packages' && (
            <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-[#131b2e] flex items-center space-x-2">
                    <Package className="w-5 h-5 text-[#003523]" />
                    <span>Care Packages & Multi-Unit Bundles ({filteredAdminPackages.length}{adminPackageSearch ? ` of ${packages.length}` : ''})</span>
                  </h2>
                  <p className="text-xs text-[#707973]">
                    Seasonal combos offering zero doorstep visit fees and bulk household discounts.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddPackageModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0 transition-all active:scale-98"
                >
                  <Plus className="w-4 h-4 text-[#fe932c]" />
                  <span>+ Add Package</span>
                </button>
              </div>

              {/* Fast Search Query & Instant Deletion Bar */}
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-[#707973] absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={adminPackageSearch}
                  onChange={(e) => setAdminPackageSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setAdminPackageSearch('');
                  }}
                  placeholder="Fast search packages by bundle name, category, or features... (Press Esc to clear)"
                  className="w-full pl-9 pr-9 py-2.5 bg-[#faf8ff] border border-[#c0c9c2]/60 rounded-xl text-xs font-medium text-[#131b2e] placeholder-[#707973] focus:outline-none focus:ring-2 focus:ring-[#003523]/20 focus:border-[#003523] transition-all"
                />
                {adminPackageSearch && (
                  <button
                    onClick={() => setAdminPackageSearch('')}
                    title="Clear search query (Esc)"
                    className="absolute right-2.5 p-1 rounded-full text-[#707973] hover:text-[#131b2e] hover:bg-[#e2e8e0] transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {filteredAdminPackages.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#707973] bg-[#faf8ff] rounded-xl border border-[#c0c9c2]/40">
                  No packages found matching &ldquo;<span className="font-bold text-[#131b2e]">{adminPackageSearch}</span>&rdquo;.
                  <button
                    onClick={() => setAdminPackageSearch('')}
                    className="ml-2 font-bold text-[#003523] underline cursor-pointer"
                  >
                    Clear search query
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {filteredAdminPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="p-4 rounded-xl border border-[#fe932c]/50 bg-white shadow-xs space-y-2 text-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="font-black text-sm text-[#131b2e]">{pkg.name}</span>
                          <span className="text-[10px] font-bold text-[#904d00] bg-[#ffdcc3] px-1.5 py-0.2 rounded">
                            PACKAGE
                          </span>
                        </div>
                        <p className="text-[#404943] mt-1">{pkg.description}</p>
                        <div className="text-[#003523] font-bold mt-2">{pkg.savings}</div>

                        <ul className="mt-2 space-y-1 text-[#707973] text-[11px]">
                          {pkg.included.map((inc, i) => (
                            <li key={i} className="flex items-center space-x-1">
                              <Check className="w-3 h-3 text-[#003523]" />
                              <span>{inc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-3 border-t border-[#c0c9c2]/40 flex justify-between items-center mt-3">
                        <div>
                          <span className="text-lg font-black text-[#003523]">₹{pkg.price}</span>
                          <span className="text-xs text-[#707973] line-through ml-1">₹{pkg.originalPrice}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold text-[#003523]">
                            {pkg.active ? 'Live on Store' : 'Inactive'}
                          </span>
                          <button
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to permanently delete package "${pkg.name}"? This will delete it directly from Supabase.`)) {
                                await deletePackage(pkg.id);
                              }
                            }}
                            className="p-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors cursor-pointer"
                            title="Permanently Delete Package from Supabase"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 10. PRICING ENGINE VIEW */}
          {/* ======================================================== */}
          {activeAdminTab === 'pricing' && (
            <div className="space-y-4">
              <div className="bg-[#ffdcc3]/30 border border-[#fe932c]/50 p-4 rounded-2xl text-xs space-y-1.5 text-[#904d00] shadow-xs">
                <div className="flex items-center space-x-2 font-black text-sm">
                  <Tag className="w-4 h-4 text-[#fe932c]" />
                  <span>Central Pricing Engine & Demo Rates Policy</span>
                </div>
                <p className="text-[#404943] leading-relaxed">
                  Displayed rates (e.g., <strong>AC General Service ₹499</strong>, <strong>Foam-Jet ₹699</strong>, <strong>AC Inspection ₹199</strong>, <strong>AC Installation ₹999</strong>) are configurable demonstration values for operations testing. When edited by Operations, customer-facing rates, active carts, and invoices update immediately with an immutable audit record.
                </p>
              </div>

              {/* Sub-tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c0c9c2]/40 pb-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPricingSubTab('catalog')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      pricingSubTab === 'catalog'
                        ? 'bg-[#003523] text-white shadow-xs'
                        : 'bg-white text-[#404943] border border-[#c0c9c2]/50'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Services Catalogue ({services.length})</span>
                  </button>

                  <button
                    onClick={() => setPricingSubTab('history')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      pricingSubTab === 'history'
                        ? 'bg-[#003523] text-white shadow-xs'
                        : 'bg-white text-[#404943] border border-[#c0c9c2]/50'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Price Revision Audit Trail ({priceHistory.length})</span>
                  </button>
                </div>

                <button
                  onClick={() => setIsAddServiceModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#fe932c]" />
                  <span>Add New Service</span>
                </button>
              </div>

              {pricingSubTab === 'catalog' ? (
                <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-5 shadow-xs space-y-4">
                  {/* Fast Search Query & Instant Deletion Bar */}
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-[#707973] absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={pricingSearchQuery}
                      onChange={(e) => setPricingSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setPricingSearchQuery('');
                      }}
                      placeholder="Fast search pricing catalog by service, category or subcategory... (Press Esc to clear)"
                      className="w-full pl-9 pr-9 py-2.5 bg-[#faf8ff] border border-[#c0c9c2]/60 rounded-xl text-xs font-medium text-[#131b2e] placeholder-[#707973] focus:outline-none focus:ring-2 focus:ring-[#003523]/20 focus:border-[#003523] transition-all"
                    />
                    {pricingSearchQuery && (
                      <button
                        onClick={() => setPricingSearchQuery('')}
                        title="Clear search query (Esc)"
                        className="absolute right-2.5 p-1 rounded-full text-[#707973] hover:text-[#131b2e] hover:bg-[#e2e8e0] transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#c0c9c2]/50 bg-[#faf8ff] text-[#404943] font-bold">
                          <th className="p-3">Service Name</th>
                          <th className="p-3">Pricing Type</th>
                          <th className="p-3">Customer Base Rate</th>
                          <th className="p-3">Visit Fee</th>
                          <th className="p-3">Tax</th>
                          <th className="p-3">Warranty</th>
                          <th className="p-3">Effective Date</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#c0c9c2]/30">
                        {filteredPricingServices.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-xs text-[#707973]">
                              No services found matching &ldquo;<span className="font-bold text-[#131b2e]">{pricingSearchQuery}</span>&rdquo;.
                              <button
                                onClick={() => setPricingSearchQuery('')}
                                className="ml-2 font-bold text-[#003523] underline cursor-pointer"
                              >
                                Clear search query
                              </button>
                            </td>
                          </tr>
                        ) : (
                          filteredPricingServices.map((srv) => (
                            <tr key={srv.id} className="hover:bg-[#faf8ff]">
                              <td className="p-3 font-extrabold text-[#131b2e]">{srv.name}</td>
                              <td className="p-3 font-bold text-[#003523]">{srv.price_type}</td>
                              <td className="p-3 font-mono font-bold">
                                {srv.price_type === 'QUOTE_REQUIRED' ? 'Request a Quote' : `₹${srv.base_price}`}
                              </td>
                              <td className="p-3 text-[#707973]">₹{srv.visit_fee}</td>
                              <td className="p-3 text-[#707973]">{srv.tax}% GST</td>
                              <td className="p-3 text-[#707973]">{srv.warranty}</td>
                              <td className="p-3 font-mono text-[11px] text-[#707973]">{srv.effective_from}</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => setSelectedEditService(srv)}
                                  className="px-3 py-1.5 rounded-lg bg-[#003523] text-white font-bold text-xs"
                                >
                                  Edit Pricing
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-5 shadow-xs space-y-4">
                  <h3 className="font-black text-sm text-[#131b2e]">Permanent Price Revision Ledger</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#c0c9c2]/50 bg-[#faf8ff] text-[#404943] font-bold">
                          <th className="p-3">Service</th>
                          <th className="p-3">Field Modified</th>
                          <th className="p-3">Old Value</th>
                          <th className="p-3">New Value</th>
                          <th className="p-3">Changed By</th>
                          <th className="p-3">Timestamp</th>
                          <th className="p-3">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#c0c9c2]/30 font-mono">
                        {priceHistory.map((item) => (
                          <tr key={item.id} className="hover:bg-[#faf8ff]">
                            <td className="p-3 font-bold text-[#131b2e] font-sans">{item.serviceName}</td>
                            <td className="p-3 font-bold text-[#003523]">{item.fieldChanged}</td>
                            <td className="p-3 text-gray-500 line-through">{String(item.oldValue)}</td>
                            <td className="p-3 font-bold text-[#131b2e]">{String(item.newValue)}</td>
                            <td className="p-3 text-[#707973] font-sans">{item.changedBy}</td>
                            <td className="p-3 text-[11px] text-[#707973]">{item.changedAt}</td>
                            <td className="p-3 font-sans text-gray-700">"{item.reason}"</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 11. PROJECTS VIEW */}
          {/* ======================================================== */}
          {activeAdminTab === 'projects' && (
            <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-5 shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-black text-[#131b2e] flex items-center space-x-2">
                  <HardHat className="w-5 h-5 text-[#003523]" />
                  <span>Home Projects & Civil Renovations ({projectRequests.length})</span>
                </h2>
                <p className="text-xs text-[#707973]">
                  Large residential requirements requiring on-site BOQ estimation and civil supervisor assignment.
                </p>
              </div>

              <div className="space-y-3">
                {projectRequests.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-4 rounded-xl border border-[#c0c9c2]/50 bg-[#faf8ff] space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-[#003523] text-sm">#{proj.id}</span>
                        <span className="font-extrabold text-sm text-[#131b2e]">{proj.projectType}</span>
                        <span className="text-[#707973]">({proj.propertyType} · {proj.approxAreaSqFt} sq ft)</span>
                      </div>
                      <select
                        value={proj.status}
                        onChange={(e) => updateProjectStatus(proj.id, e.target.value as any)}
                        className="p-1.5 rounded-lg border border-[#c0c9c2] text-xs font-bold bg-white"
                      >
                        <option value="UNDER_REVIEW">UNDER REVIEW</option>
                        <option value="ESTIMATE_PREPARED">ESTIMATE PREPARED</option>
                        <option value="SITE_VISIT_SCHEDULED">SITE VISIT SCHEDULED</option>
                        <option value="WORK_IN_PROGRESS">WORK IN PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </div>

                    <div className="text-[#404943]">
                      Customer: <strong>{proj.customerName}</strong> ({proj.customerPhone}) · {proj.locality}
                    </div>
                    <p className="text-[#131b2e] bg-white p-2.5 rounded-lg border border-[#c0c9c2]/40">
                      "{proj.description}"
                    </p>
                    <div className="flex justify-between text-[11px] text-[#707973] pt-1 border-t border-[#c0c9c2]/30">
                      <span>Budget: <strong>{proj.budgetRange}</strong></span>
                      <span>Target Start: {proj.preferredStartDate}</span>
                      <span>Supervisor: {proj.assignedSupervisor || 'Unassigned'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 12. REVIEWS VIEW */}
          {/* ======================================================== */}
          {activeAdminTab === 'reviews' && (
            <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-5 shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-black text-[#131b2e] flex items-center space-x-2">
                  <Star className="w-5 h-5 text-[#fe932c]" />
                  <span>Verified Customer Reviews ({reviews.length})</span>
                </h2>
                <p className="text-xs text-[#707973]">
                  Genuine post-completion feedback left by homeowners across Kharar and Mohali.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-xl border border-[#c0c9c2]/50 bg-[#faf8ff] space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-extrabold text-[#131b2e]">{rev.customerName} ({rev.locality})</div>
                      <div className="flex items-center space-x-1 text-[#fe932c] font-black">
                        <Star className="w-4 h-4 fill-[#fe932c]" />
                        <span>{rev.rating} / 5</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#003523] font-semibold">
                      Service: {rev.serviceName} · Artisan: {rev.technicianName}
                    </div>
                    <p className="text-[#404943] bg-white p-2.5 rounded-lg border border-[#c0c9c2]/30 italic">
                      "{rev.review}"
                    </p>
                    <div className="text-[10px] text-[#707973] text-right">{rev.timestamp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 13. COMPLAINTS VIEW */}
          {/* ======================================================== */}
          {activeAdminTab === 'complaints' && (
            <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-[#131b2e] flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-[#ba1a1a]" />
                    <span>Customer Complaints & Dispute Desk ({complaints.length})</span>
                  </h2>
                  <p className="text-xs text-[#707973]">
                    Dispatched jobs escalated due to delays, workmanship questions, or artisan reassignment requests.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {complaints.map((cmp) => (
                  <div
                    key={cmp.id}
                    className="p-4 rounded-xl border border-[#c0c9c2]/50 bg-[#faf8ff] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-[#ba1a1a]">#{cmp.id}</span>
                        <span className="font-extrabold text-[#131b2e]">{cmp.customerName}</span>
                        <span className="text-[#707973]">({cmp.customerPhone})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cmp.severity === 'CRITICAL'
                              ? 'bg-red-200 text-red-900'
                              : cmp.severity === 'HIGH'
                              ? 'bg-orange-200 text-orange-900'
                              : 'bg-yellow-200 text-yellow-900'
                          }`}
                        >
                          {cmp.severity} SEVERITY
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cmp.status === 'RESOLVED'
                              ? 'bg-[#c0edd3] text-[#003523]'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {cmp.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#404943]">
                      Issue Category: <strong>{cmp.issueType}</strong> · Artisan Involved: {cmp.artisanName || 'Unassigned'}
                    </div>

                    <p className="text-[#131b2e] bg-white p-2.5 rounded-lg border border-[#c0c9c2]/40">
                      "{cmp.description}"
                    </p>

                    {cmp.resolutionNotes && (
                      <div className="p-2.5 rounded-lg bg-[#c0edd3]/25 border border-[#9ad3b5] text-[#002114]">
                        <strong>Resolution Notes:</strong> {cmp.resolutionNotes}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1 border-t border-[#c0c9c2]/30">
                      <span className="text-[10px] text-[#707973]">Logged: {cmp.createdAt}</span>
                      {cmp.status !== 'RESOLVED' && (
                        <button
                          onClick={() => setSelectedComplaint(cmp)}
                          className="px-3 py-1.5 rounded-lg bg-[#003523] text-white font-bold text-xs hover:bg-[#144d37]"
                        >
                          Resolve Complaint
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 14. PAYMENTS VIEW */}
          {/* ======================================================== */}
          {activeAdminTab === 'payments' && (
            <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-[#131b2e] flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-[#003523]" />
                    <span>Payment Reconciliation & Transactions Ledger ({payments.length})</span>
                  </h2>
                  <p className="text-xs text-[#707973]">
                    Reconciled UPI and doorstep cash settlements collected by employees and vendor partners.
                  </p>
                </div>
                <button
                  onClick={() => setIsRecordPaymentOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold shadow-xs flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              </div>

              {/* Payment Type Filters */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPaymentLedgerFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    paymentLedgerFilter === 'ALL'
                      ? 'bg-[#003523] text-white shadow-xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  All Transactions ({payments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentLedgerFilter('ONBOARDING')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                    paymentLedgerFilter === 'ONBOARDING'
                      ? 'bg-purple-800 text-white shadow-xs'
                      : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>
                    Vendor Onboarding Fees (
                    {payments.filter((p) => p.paymentType === 'VENDOR_ONBOARDING' || (typeof p.requestId === 'string' && p.requestId.startsWith('ONBOARD-'))).length}
                    )
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentLedgerFilter('ORDERS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    paymentLedgerFilter === 'ORDERS'
                      ? 'bg-[#003523] text-white shadow-xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Service Bookings (
                  {payments.filter((p) => p.paymentType !== 'VENDOR_ONBOARDING' && (!p.requestId || !p.requestId.startsWith('ONBOARD-'))).length}
                  )
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#c0c9c2]/50 bg-[#faf8ff] text-[#404943] font-bold">
                      <th className="p-3">Receipt / Ref</th>
                      <th className="p-3">Reference / Order</th>
                      <th className="p-3">Payer / Entity</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Channel / Mode</th>
                      <th className="p-3">Collected By</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c0c9c2]/30">
                    {payments
                      .filter((p) => {
                        const isVendorOnboarding =
                          p.paymentType === 'VENDOR_ONBOARDING' ||
                          (typeof p.requestId === 'string' && p.requestId.startsWith('ONBOARD-'));
                        if (paymentLedgerFilter === 'ORDERS') return !isVendorOnboarding;
                        if (paymentLedgerFilter === 'ONBOARDING') return isVendorOnboarding;
                        return true;
                      })
                      .map((pay) => {
                        const isOnboarding =
                          pay.paymentType === 'VENDOR_ONBOARDING' ||
                          (typeof pay.requestId === 'string' && pay.requestId.startsWith('ONBOARD-'));
                        return (
                          <tr key={pay.id} className={isOnboarding ? 'bg-purple-50/30 hover:bg-purple-50/60' : 'hover:bg-[#faf8ff]'}>
                            <td className="p-3">
                              <span className="font-mono font-bold text-[#131b2e] block">{pay.transactionRef || pay.id}</span>
                              {pay.notes && (
                                <span className="text-[10px] text-gray-500 italic block truncate max-w-[140px]" title={pay.notes}>
                                  {pay.notes}
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className="font-mono font-bold text-[#003523] block">
                                {pay.requestId ? `#${pay.requestId}` : '—'}
                              </span>
                              {isOnboarding ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200 uppercase">
                                  Vendor Onboarding
                                </span>
                              ) : (
                                <span className="text-[9px] text-gray-500">Service Booking</span>
                              )}
                            </td>
                            <td className="p-3 font-extrabold text-[#131b2e]">{pay.customerName || 'N/A'}</td>
                            <td className="p-3 font-mono font-black text-sm text-[#003523]">
                              ₹{Number(pay.amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-[#404943] flex items-center space-x-1">
                                {pay.mode === 'CASH' && <Wallet className="w-3 h-3 text-emerald-700" />}
                                {pay.mode === 'CHEQUE' && <Building2 className="w-3 h-3 text-purple-700" />}
                                {(pay.mode === 'ONLINE' || pay.mode === 'UPI' || pay.mode === 'ONLINE_CARD' || pay.mode === 'NET_BANKING') && (
                                  <Smartphone className="w-3 h-3 text-blue-700" />
                                )}
                                <span>{pay.mode || 'CASH'}</span>
                              </span>
                            </td>
                            <td className="p-3 text-[#707973]">{pay.collectedBy || 'Staff'}</td>
                            <td className="p-3 font-mono text-[11px] text-[#707973]">{pay.date || '—'}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  pay.status === 'SUCCESS'
                                    ? 'bg-[#c0edd3] text-[#003523]'
                                    : pay.status === 'PENDING'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {pay.status || 'SUCCESS'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    {payments.filter((p) => {
                      const isVendorOnboarding =
                        p.paymentType === 'VENDOR_ONBOARDING' ||
                        (typeof p.requestId === 'string' && p.requestId.startsWith('ONBOARD-'));
                      if (paymentLedgerFilter === 'ORDERS') return !isVendorOnboarding;
                      if (paymentLedgerFilter === 'ONBOARDING') return isVendorOnboarding;
                      return true;
                    }).length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-500">
                          <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="font-bold text-sm">No payment records found</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {paymentLedgerFilter === 'ONBOARDING'
                              ? 'No vendor onboarding fee settlements recorded yet.'
                              : paymentLedgerFilter === 'ORDERS'
                              ? 'No service booking customer payments recorded yet.'
                              : 'Transactions and payment settlements will appear here.'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 15. REPORTS VIEW */}
          {/* ======================================================== */}
          {activeAdminTab === 'reports' && (
            <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-5 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-black text-[#131b2e] flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-[#003523]" />
                  <span>Operations Analytics & Sub-Sector Reports</span>
                </h2>
                <p className="text-xs text-[#707973]">
                  Performance metrics across Sectors 94 to 111 service corridors (Mohali).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-[#c0c9c2]/50 bg-[#faf8ff] space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#707973]">Total Orders Processed</span>
                  <div className="text-2xl font-black text-[#003523]">{requests.length}</div>
                  <div className="text-[11px] text-[#404943]">
                    Completion Rate: <strong>{Math.round((completedCount / (requests.length || 1)) * 100)}%</strong>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#c0c9c2]/50 bg-[#faf8ff] space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#707973]">Direct Staff Utilization</span>
                  <div className="text-2xl font-black text-[#131b2e]">{employees.reduce((acc, e) => acc + e.activeJobs, 0)} Active</div>
                  <div className="text-[11px] text-[#404943]">
                    Payroll technicians handling urgent breakdowns
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#c0c9c2]/50 bg-[#faf8ff] space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#707973]">Vendor Partner Network</span>
                  <div className="text-2xl font-black text-[#003523]">{vendors.length} Partners</div>
                  <div className="text-[11px] text-[#404943]">
                    Opportunity Quotas Active: {vendors.reduce((acc, v) => acc + v.plan.remainingOpportunities, 0)} leads
                  </div>
                </div>
              </div>

              {/* Locality Distribution */}
              <div className="p-4 rounded-xl border border-[#c0c9c2]/40 bg-white space-y-3">
                <h3 className="font-black text-sm text-[#131b2e]">Sub-Zone Order Distribution</h3>
                <div className="space-y-2 text-xs">
                  {['Sector 94', 'Sectors 95–97', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'].map((loc) => {
                    const count = requests.filter((r) => r.locality.includes(loc.split(',')[0])).length;
                    const pct = Math.round((count / (requests.length || 1)) * 100);
                    return (
                      <div key={loc} className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>{loc}</span>
                          <span>{count} orders ({pct}%)</span>
                        </div>
                        <div className="w-full bg-[#eaedff] rounded-full h-2">
                          <div className="bg-[#003523] h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 16. SETTINGS VIEW */}
          {/* ======================================================== */}
          {activeAdminTab === 'settings' && (
            <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-5 shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-black text-[#131b2e] flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-[#003523]" />
                  <span>Operations Hub Configuration & Tricity Parameters</span>
                </h2>
                <p className="text-xs text-[#707973]">
                  Configure emergency dispatch hotlines, standard visit fees, and operational coverage zones.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  showToast('Operations settings updated successfully', 'success');
                }}
                className="space-y-4 max-w-2xl text-xs"
              >
                <div>
                  <label className="block font-bold text-[#131b2e] mb-1">Dispatch Center Title</label>
                  <input
                    type="text"
                    value={opsSettings.dispatchCenterName}
                    onChange={(e) => updateOpsSettings({ dispatchCenterName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs font-semibold bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#131b2e] mb-1">Emergency Operations Hotline</label>
                    <input
                      type="text"
                      value={opsSettings.emergencyHotline}
                      onChange={(e) => updateOpsSettings({ emergencyHotline: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#131b2e] mb-1">Operations Email</label>
                    <input
                      type="email"
                      value={opsSettings.supportEmail}
                      onChange={(e) => updateOpsSettings({ supportEmail: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#131b2e] mb-1">Default Doorstep Visit Fee (₹)</label>
                    <input
                      type="number"
                      value={opsSettings.defaultVisitFee}
                      onChange={(e) => updateOpsSettings({ defaultVisitFee: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs font-mono font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#131b2e] mb-1">Default Configured GST (%)</label>
                    <input
                      type="number"
                      value={opsSettings.defaultGstPercent}
                      onChange={(e) => updateOpsSettings({ defaultGstPercent: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs font-mono font-bold bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#131b2e] mb-1">Daily Operating Hours</label>
                  <input
                    type="text"
                    value={opsSettings.operatingHours}
                    onChange={(e) => updateOpsSettings({ operatingHours: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs bg-white"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-[#c0edd3]/25 border border-[#9ad3b5] space-y-1">
                  <div className="font-bold text-[#003523] flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Mandatory Human Supervisor Review Protocol</span>
                  </div>
                  <p className="text-[11px] text-[#002114]">
                    Automatic blind vendor matching is strictly disabled in system core. Every booking requires human review by the Operations Team.
                  </p>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs shadow-xs"
                >
                  Save Operations Settings
                </button>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* 17. AUDIT LOGS VIEW */}
          {/* ======================================================== */}
          {activeAdminTab === 'audit' && (
            <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-5 shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-black text-[#131b2e] flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-[#003523]" />
                  <span>Permanent Operations Audit Trail Logs ({auditLogs.length})</span>
                </h2>
                <p className="text-xs text-[#707973]">
                  Immutable ledger of every manual assignment, status change, price revision, and complaint resolution.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#c0c9c2]/50 bg-[#faf8ff] text-[#404943] font-bold">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Operator</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Entity Type</th>
                      <th className="p-3">Entity ID</th>
                      <th className="p-3">Details & Audit Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c0c9c2]/30 font-mono text-[11px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#faf8ff]">
                        <td className="p-3 text-[#707973]">{log.timestamp}</td>
                        <td className="p-3 font-sans font-bold text-[#131b2e]">{log.performedBy}</td>
                        <td className="p-3 font-bold text-[#003523]">{log.action}</td>
                        <td className="p-3 text-[#707973]">{log.entityType}</td>
                        <td className="p-3 font-bold text-[#003523]">#{log.entityId}</td>
                        <td className="p-3 font-sans text-gray-700">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}

      {/* 1. Request Detail Dossier Modal */}
      {selectedDetailRequestId && (
        <ServiceRequestDetailModal
          requestId={selectedDetailRequestId}
          onClose={() => setSelectedDetailRequestId(null)}
          onOpenAssign={(id) => {
            setSelectedDetailRequestId(null);
            setAssigningRequestId(id);
          }}
        />
      )}

      {/* 2. Order Centric Assign Modal */}
      {assigningRequestId && (
        <AssignModal
          requestId={assigningRequestId}
          onClose={() => setAssigningRequestId(null)}
        />
      )}

      {/* 3. Artisan Centric Assignment Board Modal */}
      {boardModalTarget && (
        <AssignmentBoardModal
          artisan={boardModalTarget.artisan}
          artisanType={boardModalTarget.type}
          mode={boardModalTarget.mode}
          isOpen={true}
          onClose={() => setBoardModalTarget(null)}
        />
      )}

      {/* 4. Edit Pricing Modal */}
      {selectedEditService && (
        <EditPricingModal
          service={selectedEditService}
          isOpen={true}
          onClose={() => setSelectedEditService(null)}
          onSave={(id, updates, reason) => {
            updateServicePricing(id, updates, reason, 'Harman (Ops Lead)');
          }}
        />
      )}

      {/* Add New Service Modal */}
      {isAddServiceModalOpen && (
        <AddServiceModal
          isOpen={true}
          onClose={() => setIsAddServiceModalOpen(false)}
          onSave={addService}
        />
      )}

      {/* 5. Vendor Quota Ledger Modal */}
      {ledgerVendorId && (
        <VendorLedgerModal
          vendorId={ledgerVendorId}
          onClose={() => setLedgerVendorId(null)}
        />
      )}

      {/* 6. Record Payment Modal */}
      {isRecordPaymentOpen && (
        <RecordPaymentModal
          isOpen={true}
          onClose={() => setIsRecordPaymentOpen(false)}
        />
      )}

      {/* 7. Resolve Complaint Modal */}
      {selectedComplaint && (
        <ComplaintResolveModal
          complaint={selectedComplaint}
          isOpen={true}
          onClose={() => setSelectedComplaint(null)}
        />
      )}

      {/* 8. Onboard & Edit Employee / Role Modal */}
      {isEmployeeModalOpen && (
        <EmployeeModal
          isOpen={true}
          onClose={() => {
            setIsEmployeeModalOpen(false);
            setEditingEmployee(null);
          }}
          initialEmployee={editingEmployee}
          onSave={(empData, isEdit) => {
            if (isEdit) {
              updateEmployee(empData.id, empData);
            } else {
              addEmployee(empData);
            }
          }}
        />
      )}

      {/* 9. Database & Supabase PostgreSQL Configuration Modal */}
      <DatabaseConfigModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />

      {/* 10. Provision Staff User Account Modal */}
      <CreateStaffModal
        isOpen={isCreateStaffModalOpen}
        onClose={() => setIsCreateStaffModalOpen(false)}
        defaultRole={staffModalDefaultRole}
      />

      {/* 11. Release Mobile Number Modal (Admin Only, Audit Logged) */}
      {releasingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2 text-rose-700">
                <PhoneOff className="w-4 h-4 text-red-600" />
                <h3 className="font-bold text-sm text-[#131b2e]">Release Registered Mobile Number</h3>
              </div>
              <button
                onClick={() => setReleasingCustomer(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center space-x-1.5 text-amber-800">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Administrative Action (Audit Logged)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                This will dissociate <strong>{releasingCustomer.phone}</strong> from resident <strong>{releasingCustomer.name}</strong>, reset phone_verified to false, and allow this mobile number to be registered by another user.
              </p>
            </div>

            {releaseError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{releaseError}</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!releaseReason.trim()) {
                  setReleaseError('Please enter an administrative justification reason.');
                  return;
                }
                setIsReleasingPhone(true);
                setReleaseError(null);
                const targetUid = releasingCustomer.user_id || releasingCustomer.id;
                const result = await adminReleasePhoneViaRpc(targetUid, releaseReason.trim());
                setIsReleasingPhone(false);
                if (result.success) {
                  showToast(`Mobile number released for ${releasingCustomer.name}.`, 'success');
                  releaseCustomerPhone(targetUid);
                  setReleasingCustomer(null);
                } else {
                  setReleaseError(result.message);
                  showToast(result.message, 'error');
                }
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Reason for Mobile Release *
                </label>
                <textarea
                  required
                  rows={3}
                  value={releaseReason}
                  onChange={(e) => setReleaseReason(e.target.value)}
                  placeholder="e.g. Resident changed phone number, verified identity via physical ID, or SIM transferred..."
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003523] font-semibold resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setReleasingCustomer(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReleasingPhone}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span>{isReleasingPhone ? 'Releasing...' : 'Confirm Release'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 12. Vendor Approval & Payment Tracking Modal */}
      {isApprovalModalOpen && selectedApprovalVendor && (
        <VendorApprovalModal
          vendor={selectedApprovalVendor}
          isOpen={isApprovalModalOpen}
          mode={approvalModalMode}
          onClose={() => {
            setIsApprovalModalOpen(false);
            setSelectedApprovalVendor(null);
          }}
        />
      )}

      {/* 13. Ops Phone Booking Modal */}
      <PhoneBookingModal
        isOpen={isPhoneBookingModalOpen}
        onClose={() => setIsPhoneBookingModalOpen(false)}
        onBookingCreated={(newRequestId) => {
          setSelectedDetailRequestId(newRequestId);
        }}
      />

      {/* 14. Add Care Package Modal */}
      {isAddPackageModalOpen && (
        <AddPackageModal
          isOpen={isAddPackageModalOpen}
          onClose={() => setIsAddPackageModalOpen(false)}
          onSave={(newPkg) => {
            addPackage(newPkg);
            setIsAddPackageModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
