import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LOCALITIES } from '../data/initialData';
import { validateIndianPhone } from '../utils/authValidation';
import { checkPhoneAvailableViaRpc } from '../services/supabaseService';
import {
  MapPin,
  CalendarCheck,
  Home,
  ShieldCheck,
  Users,
  Headphones,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Edit3,
  X,
  AlertCircle,
  CheckCircle2,
  Phone,
  MessageCircle,
  FileText,
  Download,
  Sliders,
  UserPlus,
  Building,
  Trash2,
  Save,
  User,
  Clock
} from 'lucide-react';

export const CustomerAccountPage: React.FC = () => {
  const {
    requests,
    projectRequests,
    setActiveTrackingRequestId,
    currentLocality,
    currentUser,
    setCurrentUser,
    setCurrentPage,
    accountTab,
    setAccountTab,
    openAuthModal,
    logout,
    showToast,
    dpdpConsent,
    dpdpNominee,
    exportPersonalData,
    setIsDPDPNoticeOpen,
    setIsDPDPConsentManagerOpen,
    setIsDPDPDataRightsOpen,
    isLoadingData,
    isAuthLoading,
    dataLoadError,
    authProfile,
    setIsProjectModalOpen
  } = useApp();

  // Customer profile edit modal state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLocality, setEditLocality] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Help & Support modal state
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // If user is not logged in (e.g. after logout or back-button navigation),
  // strictly prevent private data exposure and render a clean auth prompt.
  if (!currentUser) {
    if (isAuthLoading) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <div className="flex flex-col items-center space-y-3 p-8 bg-white/95 rounded-2xl border border-[#E2E6E4] shadow-sm">
            <div className="w-8 h-8 border-3 border-[#0D3B2E] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-[#0D3B2E]">Restoring resident profile...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto my-12 sm:my-16 p-6 sm:p-8 bg-white rounded-3xl border border-[#E2E6E4] shadow-lg text-center space-y-4 animate-scaleUp mx-4">
        <div className="w-14 h-14 bg-[#E7F3EC] text-[#0D3B2E] rounded-2xl flex items-center justify-center mx-auto border border-[#0D3B2E]/20">
          <User className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-[#202124]">Sign In Required</h2>
        <p className="text-xs text-[#626B73] leading-relaxed">
          Please sign in to view your profile, manage saved addresses, active bookings, and DPDP privacy settings.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage('home')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#202124] text-xs font-semibold transition-colors cursor-pointer"
          >
            Return to Home
          </button>
          <button
            type="button"
            onClick={() => openAuthModal('login', 'account')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0D3B2E] hover:bg-[#0A2E24] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Customer initials for avatar
  const initials = currentUser.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'UC';

  // Verified status derived from existing account data
  const isVerified = Boolean(
    authProfile?.phone_verified ||
      currentUser.status === 'ACTIVE' ||
      currentUser.status === 'VIP'
  );

  const openEditModal = () => {
    setEditName(currentUser.name);
    setEditPhone(currentUser.phone);
    setEditLocality(currentUser.locality || currentLocality);
    setEditAddress(currentUser.address || '');
    setProfileError(null);
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    if (!editName.trim()) {
      setProfileError('Full name is required.');
      return;
    }

    const phoneVal = validateIndianPhone(editPhone);
    if (!phoneVal.isValid) {
      setProfileError(phoneVal.message || 'Please enter a valid 10-digit mobile number starting with 6-9 (+91).');
      return;
    }

    setIsSavingProfile(true);

    try {
      // If phone number changed, pre-check availability via check_phone_available RPC
      if (phoneVal.formatted !== currentUser.phone) {
        const isAvailable = await checkPhoneAvailableViaRpc(phoneVal.formatted);
        if (!isAvailable) {
          const msg = 'This mobile number is already registered. Please log in, or contact support if this is not you.';
          setProfileError(msg);
          showToast(msg, 'error');
          setIsSavingProfile(false);
          return;
        }
      }

      if (isSupabaseConfigured()) {
        const { error: profileErrorResponse } = await supabase
          .from('profiles')
          .update({
            full_name: editName.trim(),
            phone: phoneVal.formatted,
            locality: editLocality,
            address: editAddress.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', currentUser.id);

        if (profileErrorResponse) {
          if (
            profileErrorResponse.message?.includes('PHONE_ALREADY_REGISTERED') ||
            profileErrorResponse.message?.includes('idx_profiles_phone_normalized') ||
            profileErrorResponse.message?.toLowerCase().includes('duplicate')
          ) {
            const msg = 'This mobile number is already registered. Please log in, or contact support if this is not you.';
            setProfileError(msg);
            showToast(msg, 'error');
          } else {
            setProfileError(profileErrorResponse.message);
            showToast(profileErrorResponse.message, 'error');
          }
          setIsSavingProfile(false);
          return;
        }

        // Also update customers row if exists
        await supabase
          .from('customers')
          .update({
            name: editName.trim(),
            phone: phoneVal.formatted,
            locality: editLocality,
            address: editAddress.trim()
          })
          .eq('user_id', currentUser.id);
      }

      // Update in-memory user record
      setCurrentUser({
        ...currentUser,
        name: editName.trim(),
        phone: phoneVal.formatted,
        locality: editLocality,
        address: editAddress.trim()
      });

      showToast('Profile details updated successfully!', 'success');
      setIsEditProfileOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.';
      if (
        msg.includes('PHONE_ALREADY_REGISTERED') ||
        msg.includes('idx_profiles_phone_normalized') ||
        msg.toLowerCase().includes('duplicate')
      ) {
        const dupMsg = 'This mobile number is already registered. Please log in, or contact support if this is not you.';
        setProfileError(dupMsg);
        showToast(dupMsg, 'error');
      } else {
        setProfileError(msg);
        showToast(msg, 'error');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Booking filter state: 'all' | 'active' | 'completed'
  const [bookingFilter, setBookingFilter] = useState<'all' | 'active' | 'completed'>('all');

  const isCompletedStatus = (status: string) =>
    status === 'COMPLETED' || status === 'CUSTOMER CONFIRMED' || status === 'CLOSED';

  const isCancelledStatus = (status: string) =>
    status === 'CANCELLED' ||
    status === 'CUSTOMER NOT AVAILABLE' ||
    status === 'VENDOR NOT AVAILABLE' ||
    status === 'DISPUTED';

  const isActiveStatus = (status: string) =>
    !isCompletedStatus(status) && !isCancelledStatus(status);

  const allBookingsCount = requests.length;
  const activeBookingsCount = requests.filter((r) => isActiveStatus(r.status)).length;
  const completedBookingsCount = requests.filter((r) => isCompletedStatus(r.status)).length;

  const filteredBookings = requests.filter((order) => {
    if (bookingFilter === 'active') return isActiveStatus(order.status);
    if (bookingFilter === 'completed') return isCompletedStatus(order.status);
    return true;
  });

  const formatStatusLabel = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'New';
      case 'UNDER REVIEW':
        return 'Under review';
      case 'READY FOR ASSIGNMENT':
      case 'ASSIGNED':
        return 'Assigned';
      case 'ACCEPTED':
      case 'SCHEDULED':
        return 'Scheduled';
      case 'IN PROGRESS':
        return 'In progress';
      case 'COMPLETED':
      case 'CUSTOMER CONFIRMED':
      case 'CLOSED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status.toLowerCase().replace(/_/g, ' ');
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-[#FFF4E0] text-[#B45309] border border-[#F79324]/30';
      case 'UNDER REVIEW':
      case 'READY FOR ASSIGNMENT':
      case 'ASSIGNED':
        return 'bg-[#E7F3EC] text-[#0D3B2E] border border-[#0D3B2E]/20';
      case 'IN PROGRESS':
      case 'ACCEPTED':
      case 'SCHEDULED':
        return 'bg-[#FFF4E0] text-[#B45309] border border-[#F79324]/30';
      case 'COMPLETED':
      case 'CUSTOMER CONFIRMED':
      case 'CLOSED':
        return 'bg-[#E7F3EC] text-[#15803D] border border-[#15803D]/20';
      case 'CANCELLED':
        return 'bg-red-50 text-red-600 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const getPrimaryBookingTitle = (order: (typeof requests)[0]) => {
    if (!order.items || order.items.length === 0) return 'Home Service';
    if (order.items.length === 1) return order.items[0].serviceName;
    if (order.items.length === 2) {
      const combined = `${order.items[0].serviceName} & ${order.items[1].serviceName}`;
      return combined.length <= 45 ? combined : `${order.items[0].serviceName} & 1 more service`;
    }
    return `${order.items[0].serviceName} & ${order.items.length - 1} more services`;
  };

  const activeBookings = requests.filter((r) => isActiveStatus(r.status));

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-6 pb-32 sm:pb-24 min-h-screen">
      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-[#E2E6E4] animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E6E4]">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-[#0D3B2E]" />
                <h3 className="font-bold text-sm text-[#202124]">Edit Profile Information</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
                aria-label="Close edit profile modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {profileError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] font-semibold"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Mobile Number (+91) *
                </label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] font-semibold"
                  placeholder="+91 98888 12345"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  10 digits starting with 6 to 9. Used for booking updates and doorstep dispatch.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Locality / Sector
                </label>
                <select
                  value={editLocality}
                  onChange={(e) => setEditLocality(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] font-semibold bg-white cursor-pointer"
                >
                  {LOCALITIES.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Primary Delivery / Service Address
                </label>
                <textarea
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] font-semibold resize-none"
                  placeholder="House / Flat / Tower / Street details"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-2.5 rounded-xl bg-[#0D3B2E] hover:bg-[#0A2E24] text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingProfile ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Help & Support Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-[#E2E6E4] animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E6E4]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-[#E7F3EC] text-[#0D3B2E] flex items-center justify-center">
                  <Headphones className="w-4 h-4 text-[#0D3B2E]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#202124]">Help & Support</h3>
                  <p className="text-[10px] text-[#626B73]">UrbanCare Solution Doorstep Assistance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
                aria-label="Close help modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#626B73] leading-relaxed">
              Need immediate assistance with an ongoing service booking or warranty claim in Kharar & Mohali?
            </p>

            <div className="space-y-2.5">
              <a
                href="https://wa.me/918284018909"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-3 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#0D3B2E] flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 fill-white/20 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Chat on WhatsApp</span>
                    <span className="text-[10px] text-[#626B73]">Instant response for live bookings</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#626B73]" />
              </a>

              <a
                href="tel:+918284018909"
                className="w-full p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-[#E2E6E4] text-[#202124] flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0D3B2E] text-white flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Direct Call Support</span>
                    <span className="text-[10px] text-[#626B73]">+91 82840 18909 (8 AM – 8 PM)</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#626B73]" />
              </a>

              <button
                type="button"
                onClick={() => {
                  setIsHelpModalOpen(false);
                  setIsDPDPDataRightsOpen(true);
                }}
                className="w-full p-3 rounded-2xl bg-[#F7F8F7] hover:bg-[#E7F3EC] border border-[#E2E6E4] text-[#0D3B2E] flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E7F3EC] text-[#0D3B2E] flex items-center justify-center shrink-0">
                    <Building className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold block">File Formal Grievance</span>
                    <span className="text-[10px] text-[#626B73]">Statutory DPDP Act Grievance Officer</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#626B73]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* VIEW 1: PROFILE DASHBOARD (Matches "Proposed Profile Redesign" Mockup)  */}
      {/* ======================================================================= */}
      {accountTab === 'overview' ? (
        <div className="space-y-5">
          {/* 1. Profile Summary Card */}
          <div
            onClick={openEditModal}
            className="group bg-white rounded-3xl border border-[#E2E6E4] hover:border-[#0D3B2E]/50 p-4 sm:p-5 shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openEditModal();
              }
            }}
            aria-label="View or edit personal profile details"
          >
            {/* Avatar Initials Square */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0D3B2E] text-white flex items-center justify-center font-black text-xl sm:text-2xl shrink-0 shadow-2xs group-hover:scale-102 transition-transform">
              {initials}
            </div>

            {/* Profile Meta Info */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-[#202124] leading-snug break-words">
                  {currentUser.name}
                </h2>
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-[#E7F3EC] text-[#0D3B2E] text-[11px] font-bold shrink-0 hover:bg-[#d8ecdf] transition-colors border border-[#0D3B2E]/20">
                  <Edit3 className="w-3 h-3 text-[#0D3B2E]" />
                  <span>Edit</span>
                </span>
              </div>

              <p className="text-xs text-[#626B73] font-medium">
                {authProfile?.role
                  ? `${authProfile.role.replace('_', ' ')} account`
                  : 'Customer account'}
              </p>

              {isVerified && (
                <div className="flex items-center space-x-1.5 text-xs font-bold text-[#15803D]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                  <span>Verified resident</span>
                </div>
              )}

              <p className="text-xs text-[#626B73] break-words">
                {currentUser.phone} · {currentUser.locality || currentLocality}
              </p>
            </div>

            {/* Chevron Right */}
            <div className="shrink-0 p-1 rounded-xl text-[#626B73] group-hover:text-[#0D3B2E] group-hover:translate-x-0.5 transition-all">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>

          {/* 2. Saved Address Quick Row */}
          <button
            type="button"
            onClick={() => setAccountTab('addresses')}
            className="w-full bg-white rounded-2xl p-4 border border-[#E2E6E4] hover:border-[#0D3B2E]/50 shadow-xs flex items-center justify-between text-left transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
            aria-label="View or manage saved addresses"
          >
            <div className="flex items-center space-x-3.5 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-[#E7F3EC] text-[#0D3B2E] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-[#0D3B2E]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-bold text-[#202124] block">
                  Saved address
                </span>
                <span className="text-xs text-[#626B73] break-words block mt-0.5">
                  {currentUser.address
                    ? `${currentUser.address}${currentUser.locality ? ` · ${currentUser.locality}` : ''}`
                    : 'View or manage saved addresses'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#626B73] group-hover:text-[#0D3B2E] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>

          {/* Active Booking Banner (if any) */}
          {activeBookings.length > 0 && (
            <div className="bg-[#FFF4E0] border border-[#F79324]/40 p-3 sm:p-4 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center space-x-2.5 min-w-0">
                <Clock className="w-4 h-4 text-[#F79324] shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#0D3B2E] block truncate">
                    {activeBookings.length} Active Booking in Progress
                  </span>
                  <span className="text-[10px] text-[#626B73] truncate block">
                    #{activeBookings[0].id} · {activeBookings[0].status}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTrackingRequestId(activeBookings[0].id)}
                className="px-3.5 py-1.5 rounded-xl bg-[#0D3B2E] text-white font-bold text-[11px] shrink-0 hover:bg-[#0A2E24] cursor-pointer shadow-xs active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
                aria-label={`Track active booking #${activeBookings[0].id}`}
              >
                Track Live
              </button>
            </div>
          )}

          {/* 3. Account Activity Summary (Compact 3 Tiles) */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-extrabold text-[#0D3B2E] uppercase tracking-wider px-1">
              Your account
            </h3>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {/* Tile 1: Bookings */}
              <button
                type="button"
                onClick={() => setAccountTab('bookings')}
                className="group bg-white rounded-2xl p-3 sm:p-4 border border-[#E2E6E4] hover:border-[#0D3B2E]/60 hover:shadow-xs active:scale-98 transition-all flex flex-col items-center text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
                aria-label={`View My Service Bookings (${requests.length})`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#E7F3EC] text-[#0D3B2E] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <CalendarCheck className="w-4 h-4 text-[#0D3B2E]" />
                </div>
                <span className="text-lg sm:text-2xl font-black text-[#202124]">
                  {requests.length}
                </span>
                <span className="text-xs text-[#626B73] font-semibold mt-0.5">
                  Bookings
                </span>
              </button>

              {/* Tile 2: Projects */}
              <button
                type="button"
                onClick={() => setAccountTab('projects')}
                className="group bg-white rounded-2xl p-3 sm:p-4 border border-[#E2E6E4] hover:border-[#0D3B2E]/60 hover:shadow-xs active:scale-98 transition-all flex flex-col items-center text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
                aria-label={`View Home Projects (${projectRequests.length})`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#E7F3EC] text-[#0D3B2E] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Home className="w-4 h-4 text-[#0D3B2E]" />
                </div>
                <span className="text-lg sm:text-2xl font-black text-[#202124]">
                  {projectRequests.length}
                </span>
                <span className="text-xs text-[#626B73] font-semibold mt-0.5">
                  Projects
                </span>
              </button>

              {/* Tile 3: Addresses */}
              <button
                type="button"
                onClick={() => setAccountTab('addresses')}
                className="group bg-white rounded-2xl p-3 sm:p-4 border border-[#E2E6E4] hover:border-[#0D3B2E]/60 hover:shadow-xs active:scale-98 transition-all flex flex-col items-center text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
                aria-label={`View Saved Addresses (${currentUser.address ? 1 : 0})`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#E7F3EC] text-[#0D3B2E] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <MapPin className="w-4 h-4 text-[#0D3B2E]" />
                </div>
                <span className="text-lg sm:text-2xl font-black text-[#202124]">
                  {currentUser.address ? 1 : 0}
                </span>
                <span className="text-xs text-[#626B73] font-semibold mt-0.5">
                  Addresses
                </span>
              </button>
            </div>
          </div>

          {/* 4. Account Settings (Consistent List Rows) */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-extrabold text-[#0D3B2E] uppercase tracking-wider px-1">
              Account settings
            </h3>

            <div className="bg-white rounded-3xl border border-[#E2E6E4] divide-y divide-[#E2E6E4] shadow-xs overflow-hidden">
              {/* Row 1: Personal information / Edit Profile */}
              <button
                type="button"
                onClick={openEditModal}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F7F8F7] transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
                aria-label="Edit personal information"
              >
                <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-[#E7F3EC] text-[#0D3B2E] flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-[#0D3B2E]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-bold text-[#202124] block">
                      Personal information
                    </span>
                    <span className="text-xs text-[#626B73] block mt-0.5">
                      Name and contact details
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#626B73] group-hover:text-[#0D3B2E] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              {/* Row 2: Saved addresses */}
              <button
                type="button"
                onClick={() => setAccountTab('addresses')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F7F8F7] transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
                aria-label="Manage saved addresses"
              >
                <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-[#E7F3EC] text-[#0D3B2E] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[#0D3B2E]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-bold text-[#202124] block">
                      Saved addresses
                    </span>
                    <span className="text-xs text-[#626B73] block mt-0.5">
                      Primary residence & service locations
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#626B73] group-hover:text-[#0D3B2E] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              {/* Row 3: Privacy & data rights */}
              <button
                type="button"
                onClick={() => setAccountTab('dpdp')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F7F8F7] transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
                aria-label="Manage privacy and data rights"
              >
                <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-[#E7F3EC] text-[#0D3B2E] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-[#0D3B2E]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-bold text-[#202124] block">
                      Privacy & data rights
                    </span>
                    <span className="text-xs text-[#626B73] block mt-0.5">
                      Manage your privacy requests (DPDP Act 2023)
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#626B73] group-hover:text-[#0D3B2E] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              {/* Row 4: Switch account */}
              <button
                type="button"
                onClick={() => openAuthModal('login', 'account')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F7F8F7] transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
                aria-label="Switch account"
              >
                <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-[#E7F3EC] text-[#0D3B2E] flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-[#0D3B2E]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-bold text-[#202124] block">
                      Switch account
                    </span>
                    <span className="text-xs text-[#626B73] block mt-0.5">
                      Access another authorized account
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#626B73] group-hover:text-[#0D3B2E] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              {/* Row 5: Help & support */}
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(true)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F7F8F7] transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
                aria-label="Help and support"
              >
                <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-[#E7F3EC] text-[#0D3B2E] flex items-center justify-center shrink-0">
                    <Headphones className="w-5 h-5 text-[#0D3B2E]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-bold text-[#202124] block">
                      Help & support
                    </span>
                    <span className="text-xs text-[#626B73] block mt-0.5">
                      Get help with a booking or talk to support
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#626B73] group-hover:text-[#0D3B2E] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>
            </div>
          </div>

          {/* 5. Log out button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => logout()}
              className="w-full py-3.5 px-4 rounded-2xl border border-red-300 hover:bg-red-50 text-red-600 font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-2xs active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              aria-label="Log out of your account"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      ) : accountTab === 'bookings' ? (
        /* ======================================================================= */
        /* VIEW 2: MY BOOKINGS (Redesigned per Reference Mobile Mockup)            */
        /* ======================================================================= */
        <div className="space-y-5">
          {/* Back to Account Dashboard Breadcrumb */}
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={() => setAccountTab('overview')}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#0D3B2E] hover:text-[#0A2E24] px-3 py-1.5 rounded-xl bg-[#F7F8F7] hover:bg-[#E7F3EC] transition-all cursor-pointer border border-[#E2E6E4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
              aria-label="Back to Account Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Account</span>
            </button>
          </div>

          {/* Page Header: "My Bookings" + Counter Pill + Subtitle */}
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-[#0D3B2E] tracking-tight">
                My Bookings
              </h1>
              <span className="shrink-0 text-xs font-bold px-3 py-1 rounded-full bg-[#E7F3EC] text-[#0D3B2E] border border-[#0D3B2E]/10">
                {allBookingsCount} {allBookingsCount === 1 ? 'booking' : 'bookings'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#626B73] leading-relaxed">
              Track your services, review job details, and follow progress.
            </p>
          </div>

          {/* Compact Accessible Booking Filters (All / Active / Completed) */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {/* Filter 1: All */}
            <button
              type="button"
              onClick={() => setBookingFilter('all')}
              className={`rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E] ${
                bookingFilter === 'all'
                  ? 'bg-[#0D3B2E] text-white shadow-xs'
                  : 'bg-white text-[#202124] border border-[#E2E6E4] hover:bg-[#F7F8F7]'
              }`}
              aria-label={`Show all bookings (${allBookingsCount})`}
              aria-pressed={bookingFilter === 'all'}
            >
              <span className={`text-xl sm:text-2xl font-black ${bookingFilter === 'all' ? 'text-white' : 'text-[#202124]'}`}>
                {allBookingsCount}
              </span>
              <span className={`text-xs font-semibold mt-0.5 ${bookingFilter === 'all' ? 'text-white/90' : 'text-[#626B73]'}`}>
                All
              </span>
            </button>

            {/* Filter 2: Active */}
            <button
              type="button"
              onClick={() => setBookingFilter('active')}
              className={`rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E] ${
                bookingFilter === 'active'
                  ? 'bg-[#0D3B2E] text-white shadow-xs'
                  : 'bg-white text-[#202124] border border-[#E2E6E4] hover:bg-[#F7F8F7]'
              }`}
              aria-label={`Show active bookings (${activeBookingsCount})`}
              aria-pressed={bookingFilter === 'active'}
            >
              <span className={`text-xl sm:text-2xl font-black ${bookingFilter === 'active' ? 'text-white' : 'text-[#202124]'}`}>
                {activeBookingsCount}
              </span>
              <span className={`text-xs font-semibold mt-0.5 ${bookingFilter === 'active' ? 'text-white/90' : 'text-[#626B73]'}`}>
                Active
              </span>
            </button>

            {/* Filter 3: Completed */}
            <button
              type="button"
              onClick={() => setBookingFilter('completed')}
              className={`rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E] ${
                bookingFilter === 'completed'
                  ? 'bg-[#0D3B2E] text-white shadow-xs'
                  : 'bg-white text-[#202124] border border-[#E2E6E4] hover:bg-[#F7F8F7]'
              }`}
              aria-label={`Show completed bookings (${completedBookingsCount})`}
              aria-pressed={bookingFilter === 'completed'}
            >
              <span className={`text-xl sm:text-2xl font-black ${bookingFilter === 'completed' ? 'text-white' : 'text-[#202124]'}`}>
                {completedBookingsCount}
              </span>
              <span className={`text-xs font-semibold mt-0.5 ${bookingFilter === 'completed' ? 'text-white/90' : 'text-[#626B73]'}`}>
                Completed
              </span>
            </button>
          </div>

          {dataLoadError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>Failed to load account records: {dataLoadError}</span>
            </div>
          )}

          {/* Bookings List / Empty State */}
          <div className="space-y-4">
            {isLoadingData && requests.length === 0 ? (
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="p-5 sm:p-6 bg-white rounded-3xl border border-[#E2E6E4] animate-pulse space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-[#E2E6E4] rounded w-28" />
                      <div className="h-4 bg-[#E2E6E4] rounded w-16" />
                    </div>
                    <div className="h-6 bg-[#E2E6E4] rounded w-1/2" />
                    <div className="h-4 bg-[#E2E6E4] rounded w-2/3" />
                    <div className="border-t border-[#E2E6E4] pt-3 flex justify-between items-center">
                      <div className="h-6 bg-[#E2E6E4] rounded w-20" />
                      <div className="h-9 bg-[#E2E6E4] rounded w-28" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredBookings.length === 0 ? (
              allBookingsCount === 0 ? (
                <div className="p-8 sm:p-10 text-center bg-white rounded-3xl border border-[#E2E6E4] space-y-4 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-[#E7F3EC] text-[#0D3B2E] flex items-center justify-center mx-auto border border-[#0D3B2E]/15">
                    <CalendarCheck className="w-7 h-7 text-[#0D3B2E]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-[#202124]">No Service Bookings Yet</h3>
                    <p className="text-xs text-[#626B73] max-w-sm mx-auto leading-relaxed">
                      You haven't scheduled any home services yet. Book verified doorstep cleaning, repairs, or AC servicing across Kharar & Mohali.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentPage('services')}
                    className="px-5 py-2.5 rounded-xl bg-[#0D3B2E] hover:bg-[#0A2E24] text-white text-xs font-bold transition-all shadow-xs inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>Browse Services Catalogue</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center bg-white rounded-3xl border border-[#E2E6E4] space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 text-[#626B73] flex items-center justify-center mx-auto">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-[#202124]">
                    {bookingFilter === 'active' ? 'No Active Bookings in Progress' : 'No Completed Bookings Yet'}
                  </h3>
                  <p className="text-xs text-[#626B73]">
                    {bookingFilter === 'active'
                      ? 'All your scheduled appointments are completed or cancelled.'
                      : 'You do not have any past completed services on record.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setBookingFilter('all')}
                    className="px-4 py-2 rounded-xl border border-[#0D3B2E] text-[#0D3B2E] hover:bg-[#E7F3EC] text-xs font-bold transition-colors cursor-pointer inline-flex items-center space-x-1"
                  >
                    <span>Show All Bookings ({allBookingsCount})</span>
                  </button>
                </div>
              )
            ) : (
              filteredBookings.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-[#E2E6E4] hover:border-[#0D3B2E]/50 shadow-xs p-5 sm:p-6 space-y-3.5 transition-all"
                >
                  {/* Top Row: Booking ID and Status Badge */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#626B73] uppercase tracking-wide">
                      BOOKING #{order.id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs capitalize ${getStatusBadgeStyle(order.status)}`}>
                      {formatStatusLabel(order.status)}
                    </span>
                  </div>

                  {/* Service Title and Sub-items */}
                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-bold text-[#202124] leading-snug break-words">
                      {getPrimaryBookingTitle(order)}
                    </h3>
                    <div className="space-y-0.5 pt-0.5">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-xs sm:text-sm text-[#626B73] break-words">
                          {item.serviceName} ×{item.quantity}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#E2E6E4]" />

                  {/* Appointment & Location Info Rows */}
                  <div className="space-y-2.5">
                    {/* Preferred Time */}
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 text-[#0D3B2E] shrink-0">
                        <Clock className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs sm:text-sm font-semibold text-[#202124] block">
                          Preferred time
                        </span>
                        <span className="text-xs text-[#626B73] block">
                          {order.preferredTimeSlot || order.preferredDate || 'Standard Slot (10 AM - 6 PM)'}
                        </span>
                      </div>
                    </div>

                    {/* Service Address */}
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 text-[#0D3B2E] shrink-0">
                        <MapPin className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <span className="text-xs sm:text-sm font-semibold text-[#202124] block">
                          Service address
                        </span>
                        <span className="text-xs text-[#626B73] break-words block">
                          {order.address}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#E2E6E4]" />

                  {/* Total Amount & View Details Action */}
                  <div className="flex items-center justify-between gap-3 pt-0.5 flex-wrap sm:flex-nowrap">
                    <div>
                      <span className="text-[10px] sm:text-xs font-bold text-[#626B73] uppercase tracking-wider block">
                        TOTAL AMOUNT
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-[#0D3B2E] block">
                        ₹{order.total.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTrackingRequestId(order.id)}
                      className="px-4 py-2.5 rounded-xl bg-[#0D3B2E] hover:bg-[#0A2E24] text-white font-bold text-xs sm:text-sm inline-flex items-center space-x-1.5 transition-all shadow-xs active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
                      aria-label={`View details and track booking #${order.id}`}
                    >
                      <span>View details</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* ======================================================================= */
        /* VIEW 3: OTHER SUB-VIEWS (Projects, Addresses, DPDP)                     */
        /* ======================================================================= */
        <div className="space-y-5">
          {/* Back to Profile Dashboard Button & Breadcrumb */}
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E6E4] gap-2">
            <button
              type="button"
              onClick={() => setAccountTab('overview')}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#0D3B2E] hover:text-[#0A2E24] px-3 py-2 rounded-xl bg-[#F7F8F7] hover:bg-[#E7F3EC] transition-all cursor-pointer border border-[#E2E6E4]"
              aria-label="Back to Account Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Account</span>
            </button>

            <span className="text-xs font-bold text-[#626B73]">
              {accountTab === 'projects' && `Projects (${projectRequests.length})`}
              {accountTab === 'addresses' && 'Saved Addresses'}
              {accountTab === 'dpdp' && 'DPDP Privacy'}
            </span>
          </div>

          {/* Sub-view Chips for Projects, Addresses, DPDP */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
            <button
              type="button"
              onClick={() => setAccountTab('projects')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                accountTab === 'projects'
                  ? 'bg-[#0D3B2E] text-white shadow-2xs'
                  : 'bg-white text-[#202124] border border-[#E2E6E4] hover:bg-[#E7F3EC]'
              }`}
            >
              Home Projects ({projectRequests.length})
            </button>

            <button
              type="button"
              onClick={() => setAccountTab('addresses')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                accountTab === 'addresses'
                  ? 'bg-[#0D3B2E] text-white shadow-2xs'
                  : 'bg-white text-[#202124] border border-[#E2E6E4] hover:bg-[#E7F3EC]'
              }`}
            >
              Addresses ({currentUser?.address ? 1 : 0})
            </button>

            <button
              type="button"
              onClick={() => setAccountTab('dpdp')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                accountTab === 'dpdp'
                  ? 'bg-[#0D3B2E] text-white shadow-2xs'
                  : 'bg-[#E7F3EC] text-[#0D3B2E] border border-[#0D3B2E]/20 hover:bg-[#d8ecdf]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DPDP Privacy</span>
            </button>
          </div>

          {dataLoadError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>Failed to load account records: {dataLoadError}</span>
            </div>
          )}

          {/* Sub-view: Projects Tab */}
          {accountTab === 'projects' && (
            <div className="space-y-3">
              {projectRequests.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-[#E2E6E4] space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#E7F3EC] text-[#0D3B2E] flex items-center justify-center mx-auto">
                    <Home className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-[#202124]">No Home Projects Filed</h4>
                  <p className="text-xs text-[#626B73]">
                    Planning turnkey renovation, woodwork, modular kitchen, or painting? Submit a turnkey requirement.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsProjectModalOpen(true)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#0D3B2E] text-white text-xs font-bold hover:bg-[#0A2E24] cursor-pointer inline-flex items-center justify-center space-x-1.5 shadow-xs"
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>Request Project Estimate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage('projects')}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#F7F8F7] border border-[#E2E6E4] text-[#0D3B2E] text-xs font-bold hover:bg-[#E7F3EC] cursor-pointer inline-flex items-center justify-center space-x-1.5"
                    >
                      <span>Explore Renovation Gallery</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                projectRequests.map((prj) => (
                  <div
                    key={prj.id}
                    className="p-4 sm:p-5 bg-white rounded-2xl border border-[#E2E6E4] shadow-xs space-y-2.5 text-xs"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-mono text-[11px] font-bold text-[#626B73]">{prj.id}</span>
                        <h4 className="font-bold text-sm text-[#202124]">{prj.projectType}</h4>
                        <div className="text-[#0D3B2E] font-semibold text-[11px]">
                          {prj.locality} · {prj.approxAreaSqFt} sq.ft ({prj.propertyType})
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E7F3EC] text-[#0D3B2E]">
                        {prj.status}
                      </span>
                    </div>

                    <p className="text-[#626B73] text-xs leading-relaxed">{prj.description}</p>

                    <div className="pt-2 border-t border-[#E2E6E4] flex justify-between text-[#626B73] text-[11px]">
                      <span>Budget: {prj.budgetRange}</span>
                      <span>Target Start: {prj.preferredStartDate}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Sub-view: Addresses Tab */}
          {accountTab === 'addresses' && (
            <div className="space-y-3">
              {currentUser?.address ? (
                <div className="p-4 sm:p-5 bg-white rounded-2xl border border-[#0D3B2E] shadow-xs space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-[#0D3B2E]" />
                      <span className="font-bold text-sm text-[#0D3B2E]">
                        Primary Residence
                      </span>
                    </div>
                    <span className="text-[10px] bg-[#E7F3EC] text-[#0D3B2E] px-2 py-0.5 rounded-full font-bold">
                      DEFAULT
                    </span>
                  </div>

                  <p className="text-xs text-[#202124] leading-relaxed font-medium">
                    {currentUser.address}
                  </p>

                  <div className="text-[11px] text-[#626B73]">
                    Locality: <strong className="text-[#202124]">{currentUser.locality || currentLocality}</strong>
                  </div>

                  <div className="pt-2 border-t border-[#E2E6E4] flex items-center justify-end">
                    <button
                      type="button"
                      onClick={openEditModal}
                      className="px-3.5 py-1.5 rounded-xl border border-[#E2E6E4] hover:border-[#0D3B2E] text-[#0D3B2E] text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Address</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-white rounded-3xl border border-[#E2E6E4] space-y-3 text-xs text-[#626B73]">
                  <p>No saved addresses on file. Add your primary service address.</p>
                  <button
                    type="button"
                    onClick={openEditModal}
                    className="px-4 py-2.5 rounded-xl bg-[#0D3B2E] text-white text-xs font-bold hover:bg-[#0A2E24] cursor-pointer inline-flex items-center space-x-1"
                  >
                    <span>Add Delivery Address</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sub-view: DPDP Act 2023 Compliance & Data Rights Tab */}
          {accountTab === 'dpdp' && (
            <div className="space-y-4">
              {/* Statutory Preamble Banner */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#0D3B2E] text-white border border-[#0A2E24] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#E7F3EC] text-[#0D3B2E] flex items-center justify-center font-bold shrink-0">
                    <ShieldCheck className="w-5 h-5 text-[#0D3B2E]" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-extrabold text-sm text-white">DPDP Act 2023 Compliance Center</h4>
                      <span className="text-[10px] bg-[#F79324] text-[#0D3B2E] font-black px-1.5 py-0.5 rounded uppercase">
                        Law of India
                      </span>
                    </div>
                    <p className="text-xs text-[#E7F3EC]/90 leading-relaxed">
                      UrbanCare Solution acts as a verified Data Fiduciary in Kharar & Mohali. We process personal data solely for home repair execution and workmanship warranty fulfillment.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDPDPNoticeOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#E7F3EC] hover:bg-white text-[#0D3B2E] font-bold text-xs whitespace-nowrap shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <FileText className="w-3.5 h-3.5 text-[#0D3B2E]" />
                  <span>Read Notice (EN/ਪੰਜਾਬੀ/HI)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Card 1: Right to Access Information (Section 11) */}
                <div className="p-4 bg-white rounded-2xl border border-[#E2E6E4] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-[#0D3B2E]" />
                      <h4 className="font-bold text-xs text-[#202124]">Right to Access Information (Sec 11)</h4>
                    </div>
                    <span className="text-[10px] bg-[#E7F3EC] text-[#0D3B2E] px-2 py-0.5 rounded-full font-bold">
                      Portable
                    </span>
                  </div>
                  <p className="text-xs text-[#626B73] leading-relaxed">
                    Obtain a complete portable summary of personal records held, including booking logs, timestamps, technician assignments, and consent history.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const dataJson = exportPersonalData();
                      const blob = new Blob([dataJson], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `urbancare_dpdp_data_${Date.now()}.json`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl border border-[#0D3B2E] text-[#0D3B2E] hover:bg-[#E7F3EC] font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export My Data (JSON)</span>
                  </button>
                </div>

                {/* Card 2: Purpose-Bound Consent Management (Section 6) */}
                <div className="p-4 bg-white rounded-2xl border border-[#E2E6E4] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sliders className="w-4 h-4 text-[#0D3B2E]" />
                      <h4 className="font-bold text-xs text-[#202124]">Consent Controls (Sec 6)</h4>
                    </div>
                    <span className="text-[10px] bg-gray-100 text-[#202124] px-2 py-0.5 rounded-full font-bold">
                      {dpdpConsent.version}
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] text-[#626B73]">
                    <div className="flex justify-between items-center">
                      <span>Service Fulfillment:</span>
                      <strong className="text-[#0D3B2E]">Essential (Active)</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Call Masking:</span>
                      <strong className={dpdpConsent.callMasking ? 'text-[#15803D]' : 'text-red-600'}>
                        {dpdpConsent.callMasking ? 'Shielded' : 'Disabled'}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>SMS / WhatsApp Alerts:</span>
                      <strong>{dpdpConsent.dispatchUpdates ? 'Enabled' : 'Disabled'}</strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDPDPConsentManagerOpen(true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#0D3B2E] hover:bg-[#0A2E24] text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#F79324]" />
                    <span>Manage Consents</span>
                  </button>
                </div>

                {/* Card 3: Statutory Right to Nominate (Section 14) */}
                <div className="p-4 bg-white rounded-2xl border border-[#E2E6E4] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <UserPlus className="w-4 h-4 text-[#0D3B2E]" />
                      <h4 className="font-bold text-xs text-[#202124]">Right to Nominate (Sec 14)</h4>
                    </div>
                    <span className="text-[10px] bg-[#FFF4E0] text-[#B45309] px-2 py-0.5 rounded-full font-bold">
                      Statutory
                    </span>
                  </div>
                  <p className="text-xs text-[#626B73] leading-relaxed">
                    Nominate an individual to exercise your digital personal data rights in the event of death or incapacity.
                  </p>
                  {dpdpNominee ? (
                    <div className="p-2.5 rounded-xl bg-gray-50 border border-[#E2E6E4] text-[11px] space-y-0.5">
                      <div className="font-bold text-[#0D3B2E]">{dpdpNominee.fullName} ({dpdpNominee.relationship})</div>
                      <div className="text-[#626B73]">{dpdpNominee.phone}</div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-gray-50 text-[11px] text-gray-500 italic">
                      No nominee appointed yet.
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsDPDPDataRightsOpen(true)}
                    className="w-full py-2.5 px-3 rounded-xl border border-[#E2E6E4] hover:bg-gray-50 text-[#202124] font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#0D3B2E]" />
                    <span>{dpdpNominee ? 'Update Nominee' : 'Appoint Nominee'}</span>
                  </button>
                </div>

                {/* Card 4: Grievance Redressal (Section 13) */}
                <div className="p-4 bg-white rounded-2xl border border-[#E2E6E4] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-[#0D3B2E]" />
                      <h4 className="font-bold text-xs text-[#202124]">Grievance Officer (Sec 13)</h4>
                    </div>
                    <span className="text-[10px] bg-[#E7F3EC] text-[#0D3B2E] px-2 py-0.5 rounded-full font-bold">
                      7-Day SLA
                    </span>
                  </div>
                  <div className="text-xs text-[#626B73] space-y-1">
                    <p><strong>Officer:</strong> Mr. Gurpreet Singh</p>
                    <p><strong>Office:</strong> SCF 14, Sector 125, Kharar, Punjab</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsDPDPDataRightsOpen(true)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#0D3B2E] hover:bg-[#0A2E24] text-white font-bold text-xs flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                    >
                      <span>File Ticket</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDPDPDataRightsOpen(true)}
                      className="py-2.5 px-3 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                      title="Request Data Erasure"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Erasure</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
