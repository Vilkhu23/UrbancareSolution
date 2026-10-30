import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
  Unlock,
  MapPin,
  Phone,
  Calendar,
  IndianRupee,
  Camera,
  FileText,
  UserCheck,
  Eye,
  EyeOff,
  LogOut,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  HardHat,
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  Navigation,
  RefreshCw,
  Info,
  DollarSign
} from 'lucide-react';
import { ServiceRequest, Vendor } from '../../types';
import { VendorRejectModal } from './VendorRejectModal';
import { VendorCompleteModal } from './VendorCompleteModal';
import { VendorScheduleModal } from './VendorScheduleModal';
import { VendorAddNoteModal } from './VendorAddNoteModal';

export type VendorTab =
  | 'overview'
  | 'pending'
  | 'active'
  | 'opportunities'
  | 'completed'
  | 'ledger'
  | 'profile';

export const VendorPortal: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    currentPage,
    setCurrentPage,
    currentVendorId,
    setCurrentVendorId,
    authProfile,
    vendors,
    requests,
    opportunityLedger,
    vendorAcceptAssignment,
    vendorRejectAssignment,
    vendorConfirmSchedule,
    vendorMarkArrived,
    vendorStartWork,
    vendorUploadCompletionPhotos,
    vendorAddNotes,
    vendorCompleteJob,
    logout,
    showToast,
    isLoadingData,
    dataLoadError
  } = useApp();

  // Active sub-tab inside Vendor Portal
  const [activeTab, setActiveTab] = useState<VendorTab>('overview');

  // Selected request for modals
  const [selectedRequestForReject, setSelectedRequestForReject] = useState<ServiceRequest | null>(null);
  const [selectedRequestForComplete, setSelectedRequestForComplete] = useState<ServiceRequest | null>(null);
  const [selectedRequestForSchedule, setSelectedRequestForSchedule] = useState<ServiceRequest | null>(null);
  const [selectedRequestForNote, setSelectedRequestForNote] = useState<ServiceRequest | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Current logged in vendor object (strictly matched by user_id or active ID)
  const currentVendor = useMemo(() => {
    if (authProfile?.id) {
      return vendors.find((v) => v.user_id === authProfile.id) || null;
    }
    return vendors.find((v) => v.id === currentVendorId) || null;
  }, [vendors, currentVendorId, authProfile]);

  // Filter requests relevant to this vendor
  // 1. Pending Acceptance: Assigned to this vendor, status is 'ASSIGNED'
  const pendingRequests = useMemo(() => {
    if (!currentVendor || currentVendor.status !== 'ACTIVE') return [];
    return requests.filter(
      (r) => r.assignedTo?.id === currentVendor.id && r.status === 'ASSIGNED'
    );
  }, [requests, currentVendor]);

  // 2. Active Jobs: Assigned to this vendor, status in ['ACCEPTED', 'SCHEDULED', 'IN PROGRESS']
  const activeJobs = useMemo(() => {
    if (!currentVendor || currentVendor.status !== 'ACTIVE') return [];
    return requests.filter(
      (r) =>
        r.assignedTo?.id === currentVendor.id &&
        (r.status === 'ACCEPTED' || r.status === 'SCHEDULED' || r.status === 'IN PROGRESS')
    );
  }, [requests, currentVendor]);

  // 3. Completed Jobs: Assigned to this vendor, status in ['COMPLETED', 'CUSTOMER CONFIRMED', 'CLOSED']
  const completedJobs = useMemo(() => {
    if (!currentVendor || currentVendor.status !== 'ACTIVE') return [];
    return requests.filter(
      (r) =>
        r.assignedTo?.id === currentVendor.id &&
        (r.status === 'COMPLETED' || r.status === 'CUSTOMER CONFIRMED' || r.status === 'CLOSED')
    );
  }, [requests, currentVendor]);

  // 4. New Opportunities in Cluster: Unassigned requests in trades matching vendor categories
  const newClusterOpportunities = useMemo(() => {
    if (!currentVendor || currentVendor.status !== 'ACTIVE') return [];
    return requests.filter(
      (r) =>
        !r.assignedTo &&
        (r.status === 'NEW' || r.status === 'UNDER REVIEW' || r.status === 'READY FOR ASSIGNMENT') &&
        r.items.some((item) =>
          currentVendor.categories.some((cat) =>
            item.serviceName.toLowerCase().includes(cat.toLowerCase().split(' ')[0]) ||
            cat.toLowerCase().includes('ac') ||
            cat.toLowerCase().includes('electrical') ||
            cat.toLowerCase().includes('plumbing')
          )
        )
    );
  }, [requests, currentVendor]);

  // Vendor's opportunity ledger entries
  const vendorLedgerEntries = useMemo(() => {
    if (!currentVendor || currentVendor.status !== 'ACTIVE') return [];
    return opportunityLedger.filter((entry) => entry.vendorId === currentVendor.id);
  }, [opportunityLedger, currentVendor]);


  if (!currentVendor) {
    if (isLoadingData) {
      return (
        <div className="min-h-[85vh] bg-[#f8faf9] py-12 px-4 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200 text-center space-y-4 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-2xl mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-[85vh] bg-[#f8faf9] py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Vendor Record Not Found</h3>
          <p className="text-xs text-gray-600">
            No active vendor profile is linked to your current authenticated account.
          </p>
          <button
            onClick={() => {
              logout();
              setCurrentPage('home');
            }}
            className="px-4 py-2 bg-[#003523] text-white rounded-xl text-xs font-bold"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }


  // SEC-01: Pending vendor authorization barrier
  if (currentVendor.status === 'PENDING_VERIFICATION') {
    return (
      <div className="min-h-[85vh] bg-[#f8faf9] py-16 px-4 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 border border-gray-200 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 mb-2">
              Application Under Review
            </span>
            <h2 className="text-xl font-black text-gray-900">Partner Verification in Progress</h2>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Welcome, <span className="font-semibold text-gray-900">{currentVendor.ownerName}</span> ({currentVendor.businessName}). Your partner onboarding application has been registered and is pending verification by our Operations Command team.
            </p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 text-left text-xs text-gray-600 space-y-2 border border-gray-100">
            <div className="flex justify-between">
              <span className="text-gray-500">Registered Mobile:</span>
              <span className="font-semibold text-gray-800">{currentVendor.mobile}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Trade Categories:</span>
              <span className="font-semibold text-gray-800">{currentVendor.categories.join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Plan Selected:</span>
              <span className="font-semibold text-gray-800">{currentVendor.plan?.name || 'Partner Plan'}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Once our Operations Manager verifies your trade documents and onboarding details, your active job dispatches, customer assignments, and lead ledger will be enabled.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                logout();
                setCurrentPage('home');
              }}
              className="w-full px-5 py-2.5 bg-[#003523] hover:bg-[#002619] text-white rounded-xl text-xs font-bold transition-colors"
            >
              Sign Out & Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentVendor.status === 'SUSPENDED' || currentVendor.status === 'REJECTED') {
    return (
      <div className="min-h-[85vh] bg-[#f8faf9] py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Partner Account Suspended</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Your partner portal account is currently inactive. Please contact UrbanCare Operations Command for assistance.
          </p>
          <button
            onClick={() => {
              logout();
              setCurrentPage('home');
            }}
            className="px-4 py-2 bg-[#003523] text-white rounded-xl text-xs font-bold"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Helper for masking customer data BEFORE acceptance
  const maskCustomerName = (name: string) => {
    const parts = name.split(' ');
    return parts.map((p) => (p.length > 1 ? `${p[0]}***` : p)).join(' ') + ' (Resident)';
  };

  const maskCustomerPhone = (phone: string) => {
    return phone.slice(0, 8) + ' ••••• (Locked)';
  };

  const maskCustomerAddress = (locality: string) => {
    return `[Exact House / Flat Hidden] · ${locality}`;
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] text-[#131b2e] pb-16">
      {/* Top Vendor Status Header Banner */}
      <div className="bg-[#003523] text-white border-b border-[#144d37]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#fe932c] text-[#002114] flex items-center justify-center font-black text-xl shadow-md">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                  {currentVendor.businessName}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#b6efd1] text-[10px] font-bold border border-emerald-400/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Verified Partner
                </span>
              </div>
              <div className="text-xs text-gray-300 mt-1 flex items-center space-x-3">
                <span>Proprietor: {currentVendor.ownerName}</span>
                <span>•</span>
                <span>ID: {currentVendor.id}</span>
                <span>•</span>
                <span className="text-emerald-300 font-semibold">
                  {currentVendor.categories.join(' · ')}
                </span>
              </div>
            </div>
          </div>

          {/* Authenticated Partner Badge & Logout - Strict Work Isolation */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Authenticated Profile Badge */}
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 text-xs">
              <span className="text-gray-300 text-[11px]">Logged in:</span>
              <span className="text-white font-bold">{currentVendor.businessName}</span>
              <span className="text-[10px] text-[#b6efd1] font-mono font-bold">
                ({currentVendor.id})
              </span>
            </div>

            <button
              onClick={() => {
                logout();
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white border border-red-400/30 text-xs font-bold transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-300" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto border-t border-[#144d37]/60 no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              activeTab === 'overview'
                ? 'border-[#fe932c] text-white bg-white/5'
                : 'border-transparent text-gray-300 hover:text-white'
            }`}
          >
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center space-x-2 ${
              activeTab === 'pending'
                ? 'border-[#fe932c] text-white bg-white/5'
                : 'border-transparent text-gray-300 hover:text-white'
            }`}
          >
            <span>Pending Acceptance</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-gray-900 text-[10px] font-black animate-pulse">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center space-x-2 ${
              activeTab === 'active'
                ? 'border-[#fe932c] text-white bg-white/5'
                : 'border-transparent text-gray-300 hover:text-white'
            }`}
          >
            <span>Active Jobs</span>
            {activeJobs.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#b6efd1] text-[#002114] text-[10px] font-black">
                {activeJobs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('opportunities')}
            className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              activeTab === 'opportunities'
                ? 'border-[#fe932c] text-white bg-white/5'
                : 'border-transparent text-gray-300 hover:text-white'
            }`}
          >
            <span>New Opportunities</span>
            {newClusterOpportunities.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-semibold">
                {newClusterOpportunities.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              activeTab === 'completed'
                ? 'border-[#fe932c] text-white bg-white/5'
                : 'border-transparent text-gray-300 hover:text-white'
            }`}
          >
            <span>Completed Jobs</span>
            <span className="text-[10px] text-gray-400">({completedJobs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              activeTab === 'ledger'
                ? 'border-[#fe932c] text-white bg-white/5'
                : 'border-transparent text-gray-300 hover:text-white'
            }`}
          >
            <span>Opportunity Ledger</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-800 text-emerald-200 text-[10px] font-bold">
              {currentVendor.plan.remainingOpportunities} Left
            </span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
              activeTab === 'profile'
                ? 'border-[#fe932c] text-white bg-white/5'
                : 'border-transparent text-gray-300 hover:text-white'
            }`}
          >
            <span>Subscription & Profile</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* KPI Summary Cards Bar (Shown Across Dashboard & Tabs) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
          {/* 1. New Opportunities */}
          <div
            onClick={() => setActiveTab('opportunities')}
            className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-[#003523] cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">New Leads</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-black text-gray-900">{newClusterOpportunities.length}</div>
            <span className="text-[10px] text-gray-400">In your trade cluster</span>
          </div>

          {/* 2. Pending Acceptance */}
          <div
            onClick={() => setActiveTab('pending')}
            className={`p-3.5 rounded-2xl border shadow-xs cursor-pointer transition-all ${
              pendingRequests.length > 0
                ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/20'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between text-amber-700 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Pending Acceptance</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-black text-amber-900">{pendingRequests.length}</div>
            <span className="text-[10px] text-amber-700 font-medium">
              {pendingRequests.length > 0 ? 'Action required!' : 'Up to date'}
            </span>
          </div>

          {/* 3. Active Jobs */}
          <div
            onClick={() => setActiveTab('active')}
            className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-[#003523] cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-[#003523] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Active Jobs</span>
              <Clock className="w-4 h-4 text-[#003523]" />
            </div>
            <div className="text-xl font-black text-gray-900">{activeJobs.length}</div>
            <span className="text-[10px] text-emerald-700 font-medium">In execution</span>
          </div>

          {/* 4. Completed Jobs */}
          <div
            onClick={() => setActiveTab('completed')}
            className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-[#003523] cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-gray-900">{currentVendor.completedJobs}</div>
            <span className="text-[10px] text-gray-400">Total verified</span>
          </div>

          {/* 5. Subscription Plan */}
          <div
            onClick={() => setActiveTab('ledger')}
            className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-[#003523] cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Subscription</span>
              <IndianRupee className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-base font-black text-gray-900 truncate">₹{currentVendor.plan.price}</div>
            <span className="text-[10px] text-gray-500 truncate block">{currentVendor.plan.name}</span>
            {currentVendor.onboardingPayment && (
              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 mt-1 inline-block truncate">
                ✓ Paid ({currentVendor.onboardingPayment.method})
              </span>
            )}
          </div>

          {/* 6. Opportunities Remaining */}
          <div
            onClick={() => setActiveTab('ledger')}
            className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-300 shadow-xs hover:border-[#003523] cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-emerald-800 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Opportunities Left</span>
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-xl font-black text-emerald-950">
              {currentVendor.plan.remainingOpportunities}
              <span className="text-xs font-normal text-emerald-700"> / {currentVendor.plan.totalOpportunities}</span>
            </div>
            <span className="text-[10px] text-emerald-800 font-medium">Valid until Nov 2026</span>
          </div>

          {/* 7. Rating */}
          <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between text-amber-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Rating</span>
              <span className="text-xs">★</span>
            </div>
            <div className="text-xl font-black text-gray-900 flex items-center space-x-1">
              <span>{currentVendor.rating}</span>
              <span className="text-xs text-amber-500 font-bold">★</span>
            </div>
            <span className="text-[10px] text-gray-400">98% customer satisfaction</span>
          </div>
        </div>

        {/* =========================================================================
            TAB 1: OVERVIEW DASHBOARD
            ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Action Required Alert Banner if Pending Jobs Exist */}
            {pendingRequests.length > 0 && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">
                      {pendingRequests.length} New Opportunity Assigned by Operations
                    </h3>
                    <p className="text-xs text-amber-100 mt-0.5">
                      Operations supervisor dispatched qualified bookings in your service zone. Review the technical scope and accept or reject.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('pending')}
                  className="px-4 py-2.5 rounded-xl bg-white text-gray-900 text-xs font-bold hover:bg-amber-50 transition-colors shrink-0 shadow-xs flex items-center space-x-1.5 self-start sm:self-auto"
                >
                  <span>Review Pending Opportunities</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Quick Two-Column View: Active Jobs Stepper & Plan Snapshot */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Currently Active Jobs */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-[#003523]" />
                    <span>Jobs in Progress ({activeJobs.length})</span>
                  </h2>
                  <button
                    onClick={() => setActiveTab('active')}
                    className="text-xs font-bold text-[#003523] hover:underline"
                  >
                    View All Active →
                  </button>
                </div>

                {activeJobs.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-white border border-gray-200 text-center text-gray-500">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
                    <h4 className="font-bold text-gray-800 text-sm">No Active Jobs Right Now</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Check Pending Acceptance or available cluster opportunities to pick up new work.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeJobs.map((job) => (
                      <div
                        key={job.id}
                        className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-gray-300 transition-all space-y-4"
                      >
                        <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-sm text-gray-900">Order #{job.id}</span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                {job.status}
                              </span>
                              {job.vendorArrivalStatus === 'ARRIVED' && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                                  Doorstep Arrived ✓
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {job.items.map((i) => `${i.serviceName} (×${i.quantity})`).join(', ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-[#003523]">₹{job.total}</span>
                            <span className="text-[10px] text-gray-400 block">Collect on completion</span>
                          </div>
                        </div>

                        {/* Unlocked Customer Information */}
                        <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/60 text-xs space-y-2">
                          <div className="flex items-center justify-between font-semibold text-emerald-950">
                            <div className="flex items-center space-x-2">
                              <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Customer: {job.customerName}</span>
                            </div>
                            <a
                              href={`tel:${job.customerPhone}`}
                              className="px-2.5 py-1 rounded-lg bg-[#003523] text-white text-[11px] font-bold hover:bg-[#144d37] flex items-center space-x-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call {job.customerPhone}</span>
                            </a>
                          </div>

                          <div className="text-gray-700 flex items-start space-x-1.5 pt-1">
                            <MapPin className="w-3.5 h-3.5 text-[#003523] shrink-0 mt-0.5" />
                            <div>
                              <span className="font-medium text-gray-900">{job.address}</span>
                              {job.landmark && (
                                <span className="text-gray-500 block text-[11px]">
                                  Landmark: {job.landmark}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-gray-600 flex items-center space-x-2 text-[11px] pt-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>
                              Slot: {job.preferredDate} ({job.preferredTimeSlot})
                            </span>
                            {job.confirmedScheduleSlot && (
                              <span className="text-[#003523] font-bold">
                                · Confirmed: {job.confirmedScheduleSlot}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Step Execution Buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            onClick={() => setSelectedRequestForSchedule(job)}
                            className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-1"
                          >
                            <Calendar className="w-3.5 h-3.5 text-gray-500" />
                            <span>Confirm Schedule</span>
                          </button>

                          {job.vendorArrivalStatus !== 'ARRIVED' && (
                            <button
                              onClick={() => vendorMarkArrived(job.id)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-1 shadow-xs"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span>Mark Arrived</span>
                            </button>
                          )}

                          {job.status !== 'IN PROGRESS' && (
                            <button
                              onClick={() => vendorStartWork(job.id)}
                              className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors flex items-center space-x-1 shadow-xs"
                            >
                              <HardHat className="w-3.5 h-3.5" />
                              <span>Start Work</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedRequestForNote(job)}
                            className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-1"
                          >
                            <FileText className="w-3.5 h-3.5 text-gray-500" />
                            <span>Add Notes</span>
                          </button>

                          <button
                            onClick={() => setSelectedRequestForComplete(job)}
                            className="px-4 py-1.5 rounded-xl bg-[#003523] text-white text-xs font-bold hover:bg-[#144d37] transition-all flex items-center space-x-1.5 ml-auto shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#b6efd1]" />
                            <span>Mark Completed</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Opportunity Ledger & Plan Rules */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                  <span>Subscription & Quota</span>
                </h2>

                <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Current Plan
                      </span>
                      <h4 className="font-black text-gray-900 text-base">{currentVendor.plan.name}</h4>
                    </div>
                    <span className="text-lg font-black text-[#003523]">₹{currentVendor.plan.price}</span>
                  </div>

                  {/* Quota Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-gray-600">Opportunities Quota</span>
                      <span className="text-emerald-700">
                        {currentVendor.plan.remainingOpportunities} Remaining
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200">
                      <div
                        className="h-full bg-[#003523] rounded-full transition-all"
                        style={{
                          width: `${(currentVendor.plan.usedOpportunities / currentVendor.plan.totalOpportunities) * 100}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>Used: {currentVendor.plan.usedOpportunities}</span>
                      <span>Total Entitlement: {currentVendor.plan.totalOpportunities}</span>
                    </div>
                  </div>

                  {/* Mandatory Platform Disclaimer */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-600 space-y-1.5">
                    <div className="flex items-center space-x-1.5 font-bold text-gray-800">
                      <Info className="w-3.5 h-3.5 text-[#003523]" />
                      <span>Opportunity Transparency Rules</span>
                    </div>
                    <p>
                      • <strong>Operations Authority:</strong> Credit adjustments and plan renewals are managed solely by Operations Dispatch.
                    </p>
                    <p>
                      • <strong>No Guaranteed Volume:</strong> Credits represent verified dispatch allocations. Bookings depend on customer confirmation and schedule fit.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('ledger')}
                    className="w-full py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-800 transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <span>Open Detailed Opportunity Ledger</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: PENDING ACCEPTANCE (STRICT CUSTOMER PRIVACY ENFORCEMENT)
            ========================================================================= */}
        {activeTab === 'pending' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Prominent Privacy Enforcement Banner */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-3">
              <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sm block">Customer-Data Privacy Active Before Acceptance</span>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  In accordance with UrbanCare Solution Partner Privacy Standards, only the technical scope, requested time slot, locality sector, and gross payout are displayed below. Full customer name, exact house number, and phone number are locked until you evaluate the job and click <strong>Accept Assignment</strong>.
                </p>
              </div>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white border border-gray-200 text-center text-gray-500">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-60" />
                <h3 className="font-bold text-gray-900 text-base">No Pending Assignments</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  You are all caught up! When Operations Dispatch assigns a new verified booking in your trade cluster, it will appear here for your review.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl bg-white border-2 border-amber-300 shadow-sm space-y-4 relative overflow-hidden"
                  >
                    {/* Top Status Bar */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-sm text-gray-900">Request #{req.id}</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                            Pending Your Acceptance
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400 mt-0.5 block">
                          Assigned by Operations Lead · {req.updatedAt}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-[#003523]">₹{req.total}</span>
                        <span className="text-[10px] text-gray-400 block">Gross Payout</span>
                      </div>
                    </div>

                    {/* Services and Problem Scope (Evaluation Data) */}
                    <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                          Requested Services
                        </span>
                        <div className="space-y-1">
                          {req.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between font-semibold text-gray-800">
                              <span>
                                {item.serviceName} (×{item.quantity})
                              </span>
                              <span>₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {req.problemDescription && (
                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                            Reported Problem Scope
                          </span>
                          <p className="text-gray-700 italic">"{req.problemDescription}"</p>
                        </div>
                      )}

                      {/* Problem Photos preview if available */}
                      {req.problemPhotos && req.problemPhotos.length > 0 && (
                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                            Customer Attached Photos ({req.problemPhotos.length})
                          </span>
                          <div className="flex space-x-2">
                            {req.problemPhotos.map((url, idx) => (
                              <button
                                key={idx}
                                onClick={() => setPreviewPhotoUrl(url)}
                                className="w-14 h-14 rounded-lg overflow-hidden border border-gray-300 relative group"
                              >
                                <img src={url} alt={`Scope ${idx}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px]">
                                  <Eye className="w-3.5 h-3.5" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Privacy-Masked Customer Section */}
                    <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs space-y-2">
                      <div className="flex items-center justify-between text-amber-900 font-bold">
                        <div className="flex items-center space-x-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-700" />
                          <span>Customer: {maskCustomerName(req.customerName)}</span>
                        </div>
                        <span className="text-[10px] bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-full">
                          Contact Masked
                        </span>
                      </div>

                      <div className="text-gray-600 flex items-start space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-gray-800">
                            {maskCustomerAddress(req.locality)}
                          </span>
                          <span className="text-[10px] text-gray-400 block">
                            (Distance: ~2.4 km from your hub)
                          </span>
                        </div>
                      </div>

                      <div className="text-gray-600 flex items-center space-x-1.5 text-[11px]">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>
                          Time Slot: <strong>{req.preferredDate}</strong> ({req.preferredTimeSlot})
                        </span>
                      </div>

                      <div className="text-gray-500 text-[11px] flex items-center space-x-1.5">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>Phone: {maskCustomerPhone(req.customerPhone)}</span>
                      </div>
                    </div>

                    {/* Acceptance Actions */}
                    <div className="flex items-center space-x-3 pt-2">
                      <button
                        onClick={() => setSelectedRequestForReject(req)}
                        className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition-colors"
                      >
                        Reject Assignment
                      </button>

                      <button
                        onClick={() => vendorAcceptAssignment(req.id)}
                        className="flex-1 py-2.5 rounded-xl bg-[#003523] text-white hover:bg-[#144d37] text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1.5"
                      >
                        <Unlock className="w-3.5 h-3.5 text-[#b6efd1]" />
                        <span>Accept Assignment</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: ACTIVE JOBS (UNLOCKED CUSTOMER DATA & WORKFLOW STEPPER)
            ========================================================================= */}
        {activeTab === 'active' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-gray-900">Active Service Orders ({activeJobs.length})</h3>
                <p className="text-xs text-gray-500">
                  Full customer contact details and exact addresses unlocked for doorstep execution.
                </p>
              </div>
            </div>

            {activeJobs.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white border border-gray-200 text-center text-gray-500">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-60" />
                <h3 className="font-bold text-gray-900 text-base">No Active Jobs</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  When you accept an opportunity from the Pending Acceptance queue, it moves here with full customer contact details.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {activeJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-gray-900">Order #{job.id}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {job.status}
                          </span>
                          {job.vendorArrivalStatus === 'ARRIVED' && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                              Arrived at Doorstep ✓
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400 block mt-0.5">
                          Preferred: {job.preferredDate} ({job.preferredTimeSlot})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-[#003523]">₹{job.total}</span>
                        <span className="text-[10px] text-gray-400 block">Collect at Doorstep</span>
                      </div>
                    </div>

                    {/* Unlocked Customer Card */}
                    <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-2.5">
                      <div className="flex items-center justify-between font-bold text-emerald-950">
                        <div className="flex items-center space-x-2">
                          <Unlock className="w-4 h-4 text-emerald-700" />
                          <span className="text-sm">{job.customerName}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-200/60 text-emerald-900 rounded-full font-semibold">
                          Contact Unlocked
                        </span>
                      </div>

                      <div className="text-gray-800 flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-[#003523] shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-gray-900">{job.address}</div>
                          {job.landmark && (
                            <div className="text-[11px] text-gray-600">Landmark: {job.landmark}</div>
                          )}
                        </div>
                      </div>

                      {/* Contact Actions: Call & WhatsApp */}
                      <div className="flex items-center space-x-2 pt-1">
                        <a
                          href={`tel:${job.customerPhone}`}
                          className="flex-1 py-2 rounded-xl bg-[#003523] text-white font-bold text-xs hover:bg-[#144d37] transition-colors flex items-center justify-center space-x-1.5 shadow-xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call {job.customerPhone}</span>
                        </a>

                        <a
                          href={`https://wa.me/${job.customerPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center space-x-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>

                    {/* Service Items & Problem Description */}
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        Service Items:
                      </span>
                      {job.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between font-medium text-gray-800">
                          <span>
                            {item.serviceName} × {item.quantity}
                          </span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                      {job.problemDescription && (
                        <div className="pt-1.5 border-t border-gray-200 text-[11px] text-gray-600">
                          <strong>Reported issue:</strong> {job.problemDescription}
                        </div>
                      )}
                    </div>

                    {/* Vendor Recorded Notes if any */}
                    {job.vendorNotes && job.vendorNotes.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-200/60 text-xs space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">
                          Technical Notes Added:
                        </span>
                        {job.vendorNotes.map((note, idx) => (
                          <p key={idx} className="text-blue-950 text-[11px]">
                            • {note}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Step-by-Step Execution Workflow Stepper Buttons */}
                    <div className="border-t border-gray-100 pt-3 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        Job Execution Actions:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {/* 1. Confirm Schedule */}
                        <button
                          onClick={() => setSelectedRequestForSchedule(job)}
                          className="p-2 rounded-xl border border-gray-200 hover:border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center space-x-1"
                        >
                          <Calendar className="w-3 h-3 text-gray-500" />
                          <span>Confirm ETA</span>
                        </button>

                        {/* 2. Mark Arrived */}
                        <button
                          onClick={() => vendorMarkArrived(job.id)}
                          disabled={job.vendorArrivalStatus === 'ARRIVED'}
                          className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 ${
                            job.vendorArrivalStatus === 'ARRIVED'
                              ? 'bg-blue-50 text-blue-600 border border-blue-200 cursor-default'
                              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                          }`}
                        >
                          <MapPin className="w-3 h-3" />
                          <span>{job.vendorArrivalStatus === 'ARRIVED' ? 'Arrived ✓' : 'Mark Arrived'}</span>
                        </button>

                        {/* 3. Start Work */}
                        <button
                          onClick={() => vendorStartWork(job.id)}
                          disabled={job.status === 'IN PROGRESS'}
                          className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 ${
                            job.status === 'IN PROGRESS'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-default'
                              : 'bg-amber-600 text-white hover:bg-amber-700 shadow-xs'
                          }`}
                        >
                          <HardHat className="w-3 h-3" />
                          <span>{job.status === 'IN PROGRESS' ? 'In Progress ✓' : 'Start Work'}</span>
                        </button>

                        {/* 4. Add Notes */}
                        <button
                          onClick={() => setSelectedRequestForNote(job)}
                          className="p-2 rounded-xl border border-gray-200 hover:border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center space-x-1"
                        >
                          <FileText className="w-3 h-3 text-gray-500" />
                          <span>Add Notes</span>
                        </button>

                        {/* 5. Complete Job */}
                        <button
                          onClick={() => setSelectedRequestForComplete(job)}
                          className="col-span-2 sm:col-span-2 p-2.5 rounded-xl bg-[#003523] text-white text-xs font-bold hover:bg-[#144d37] transition-all flex items-center justify-center space-x-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#b6efd1]" />
                          <span>Finalize & Mark Completed</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 4: NEW OPPORTUNITIES (CLUSTER FEED)
            ========================================================================= */}
        {activeTab === 'opportunities' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-base text-gray-900">
                  Cluster Demand Feed ({newClusterOpportunities.length})
                </h3>
                <p className="text-xs text-gray-500">
                  Screened resident demand in {currentVendor.serviceAreas.join(', ')} matching your trades.
                </p>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Supervised Manual Dispatch Core</span>
              </div>
            </div>

            {newClusterOpportunities.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white border border-gray-200 text-center text-gray-500">
                <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-3 opacity-60" />
                <h3 className="font-bold text-gray-900 text-base">No New Cluster Leads Currently</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  New incoming customer bookings for {currentVendor.categories.join(' and ')} across Kharar and Mohali will be highlighted here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {newClusterOpportunities.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-sm text-gray-900">Order #{req.id}</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {req.createdAt}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {req.status}
                        </span>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                          Service Requested:
                        </span>
                        <div className="font-bold text-gray-900">
                          {req.items.map((i) => `${i.serviceName} (×${i.quantity})`).join(', ')}
                        </div>
                        <div className="text-gray-500 text-[11px] flex items-center space-x-1 pt-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{req.locality}</span>
                        </div>
                        <div className="text-gray-500 text-[11px] flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>
                            Slot: {req.preferredDate} ({req.preferredTimeSlot})
                          </span>
                        </div>
                      </div>

                      {req.notes && (
                        <p className="text-xs text-gray-600 italic">"{req.notes}"</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-[#003523]">₹{req.total}</span>
                        <span className="text-[10px] text-gray-400 block">Estimated Order</span>
                      </div>

                      <button
                        onClick={() => {
                          showToast(`Interested logged! Operations Dispatch supervisor has been notified for ${req.id}.`, 'info');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-[#003523] hover:text-white text-gray-700 text-xs font-bold transition-all flex items-center space-x-1"
                      >
                        <span>Express Interest</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 5: COMPLETED JOBS (VERIFIED EARNINGS & REVIEWS)
            ========================================================================= */}
        {activeTab === 'completed' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-gray-900">
                  Completed Work Archive ({completedJobs.length})
                </h3>
                <p className="text-xs text-gray-500">
                  Verified invoices, proof photos, and customer feedback.
                </p>
              </div>
            </div>

            {completedJobs.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white border border-gray-200 text-center text-gray-500">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-60" />
                <h3 className="font-bold text-gray-900 text-base">No Completed Jobs Logged Yet</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Once you finalize active orders, completed jobs will show here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-gray-900">Order #{job.id}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          COMPLETED
                        </span>
                        <span className="text-xs text-gray-500">· {job.customerName}</span>
                      </div>

                      <p className="text-xs text-gray-700">
                        {job.items.map((i) => `${i.serviceName} (×${i.quantity})`).join(', ')} ·{' '}
                        <span className="text-gray-500">{job.locality}</span>
                      </p>

                      {/* Customer Review if given */}
                      {job.customerFeedback && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
                          <span className="text-amber-500 font-bold">★ {job.customerRating}/5</span>
                          <span className="italic">"{job.customerFeedback}"</span>
                        </div>
                      )}

                      {/* Attached Completion Proof Photos */}
                      {job.completionPhotos && job.completionPhotos.length > 0 && (
                        <div className="flex items-center space-x-2 pt-1">
                          <span className="text-[10px] text-gray-500 font-semibold">Proof Photos:</span>
                          {job.completionPhotos.map((url, idx) => (
                            <button
                              key={idx}
                              onClick={() => setPreviewPhotoUrl(url)}
                              className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200"
                            >
                              <img src={url} alt={`Proof ${idx}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right md:min-w-[140px] border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                      <div className="text-base font-black text-[#003523]">₹{job.total}</div>
                      <span className="text-[11px] text-emerald-700 font-bold block">
                        Collected via {job.paymentCollectedMode || job.paymentMode || 'UPI'}
                      </span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">
                        {job.completedAt || job.updatedAt}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 6: VENDOR OPPORTUNITY LEDGER (SUBSCRIPTION, ENTITLEMENT & AUDIT)
            ========================================================================= */}
        {activeTab === 'ledger' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Plan Card Spec Match */}
            <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                    Active Subscription Plan
                  </span>
                  <h2 className="text-2xl font-black text-gray-900 mt-2">{currentVendor.plan.name}</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Managed exclusively by Operations Dispatcher · Kharar & Mohali Cluster
                  </p>
                </div>

                {/* Example Specification Metrics: Plan ₹1500, Entitlement 7, Used 3, Remaining 4 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Plan Fee</span>
                    <span className="text-xl font-black text-[#003523]">₹{currentVendor.plan.price}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Entitlement</span>
                    <span className="text-xl font-black text-gray-900">
                      {currentVendor.plan.totalOpportunities}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Used</span>
                    <span className="text-xl font-black text-amber-700">
                      {currentVendor.plan.usedOpportunities}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-center">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Remaining</span>
                    <span className="text-xl font-black text-emerald-950">
                      {currentVendor.plan.remainingOpportunities}
                    </span>
                  </div>
                </div>
              </div>

              {/* Strict Prompts Rules Disclaimers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1">
                  <div className="flex items-center space-x-2 font-bold text-amber-900">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Operations Sole Authority Over Quota</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Operations remains the sole authority over credit adjustments and plan entitlements. Vendors are strictly not permitted to edit their own opportunity balances. To dispute a consumed lead due to customer cancellation, request an adjustment via Operations Dispatch.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-1">
                  <div className="flex items-center space-x-2 font-bold text-blue-900">
                    <Info className="w-4 h-4 text-blue-700" />
                    <span>No Guaranteed Jobs Notice</span>
                  </div>
                  <p className="text-[11px] text-blue-900 leading-relaxed">
                    Opportunity credits connect verified partners with qualified, screened local customer demand. UrbanCare Solution does not promise or guarantee fixed employment, revenue, or job volume. Earnings depend on customer booking confirmation and technician responsiveness.
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Opportunity Ledger Table */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#faf8ff]">
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Credit Ledger History</h3>
                  <p className="text-xs text-gray-500">
                    Immutable transaction records for {currentVendor.businessName}
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  Total Entries: <strong className="text-gray-900">{vendorLedgerEntries.length}</strong>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-200">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Date & Time</th>
                      <th className="py-3.5 px-4 font-bold">Request ID</th>
                      <th className="py-3.5 px-4 font-bold">Action</th>
                      <th className="py-3.5 px-4 font-bold">Credit Change</th>
                      <th className="py-3.5 px-4 font-bold">Balance</th>
                      <th className="py-3.5 px-4 font-bold">Reason</th>
                      <th className="py-3.5 px-4 font-bold">Performed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {vendorLedgerEntries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400">
                          No ledger history found for this partner.
                        </td>
                      </tr>
                    ) : (
                      vendorLedgerEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">
                            {entry.timestamp}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#003523] whitespace-nowrap">
                            {entry.serviceRequestId ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                                {entry.serviceRequestId}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800">
                              {entry.action || (entry.change > 0 ? 'CREDIT_ADDED' : 'OPPORTUNITY_CONSUMED')}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`font-black text-xs ${
                                entry.change > 0 ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {entry.change > 0 ? `+${entry.change}` : entry.change}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-900 whitespace-nowrap">
                            {entry.balanceAfter} Left
                          </td>
                          <td className="py-3 px-4 text-gray-700 max-w-xs">{entry.reason}</td>
                          <td className="py-3 px-4 text-gray-500 text-[11px] whitespace-nowrap">
                            {entry.performedBy}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 7: VENDOR PROFILE & VERIFICATION
            ========================================================================= */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fadeIn max-w-4xl">
            <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-6">
              <div className="flex items-center space-x-4 border-b border-gray-100 pb-6">
                <div className="w-16 h-16 rounded-2xl bg-[#003523] text-white flex items-center justify-center font-black text-2xl shadow-md">
                  {currentVendor.businessName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{currentVendor.businessName}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Proprietor: {currentVendor.ownerName} · {currentVendor.experienceYears} Years Experience in Tricity
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>KYC & Aadhaar Verified</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                      Tools & Pressure Equipment Certified
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <span className="font-bold text-gray-900 uppercase text-[10px] tracking-wider block">
                    Contact Credentials
                  </span>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Primary Mobile:</span>
                    <span className="font-bold text-gray-900">{currentVendor.mobile}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Registered Email:</span>
                    <span className="font-bold text-gray-900">{currentVendor.email}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <span className="font-bold text-gray-900 uppercase text-[10px] tracking-wider block">
                    Trade Categories & Hub Coverage
                  </span>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Authorized Trades:</span>
                    <span className="font-bold text-gray-900">{currentVendor.categories.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Service Clusters:</span>
                    <span className="font-bold text-gray-900">{currentVendor.serviceAreas.join(' · ')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Vendor Modals */}
      <VendorRejectModal
        isOpen={!!selectedRequestForReject}
        onClose={() => setSelectedRequestForReject(null)}
        request={selectedRequestForReject}
        onConfirmReject={(reason, notes) => {
          if (selectedRequestForReject) {
            vendorRejectAssignment(selectedRequestForReject.id, reason, notes);
          }
        }}
      />

      <VendorCompleteModal
        isOpen={!!selectedRequestForComplete}
        onClose={() => setSelectedRequestForComplete(null)}
        request={selectedRequestForComplete}
        onConfirmComplete={(paymentMode, notes, photos, customerOtp) => {
          if (selectedRequestForComplete) {
            vendorCompleteJob(selectedRequestForComplete.id, paymentMode, notes, photos, customerOtp);
          }
        }}
      />

      <VendorScheduleModal
        isOpen={!!selectedRequestForSchedule}
        onClose={() => setSelectedRequestForSchedule(null)}
        request={selectedRequestForSchedule}
        onConfirmSchedule={(slot, notes) => {
          if (selectedRequestForSchedule) {
            vendorConfirmSchedule(selectedRequestForSchedule.id, slot, notes);
          }
        }}
      />

      <VendorAddNoteModal
        isOpen={!!selectedRequestForNote}
        onClose={() => setSelectedRequestForNote(null)}
        request={selectedRequestForNote}
        onSaveNote={(note) => {
          if (selectedRequestForNote) {
            vendorAddNotes(selectedRequestForNote.id, note);
          }
        }}
      />

      {/* Photo Lightbox Modal */}
      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
        >
          <div className="relative max-w-2xl w-full bg-black rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewPhotoUrl} alt="Preview" className="w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
