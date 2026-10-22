import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CustomerOtpDisplay } from '../components/customer/CustomerOtpDisplay';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LOCALITIES } from '../data/initialData';
import { validateIndianPhone } from '../utils/authValidation';
import { checkPhoneAvailableViaRpc } from '../services/supabaseService';
import {
  ClipboardList,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  AlertCircle,
  Star,
  ChevronRight,
  HardHat,
  User,
  ShieldCheck,
  Lock,
  Sliders,
  UserCheck,
  Download,
  Trash2,
  UserPlus,
  FileText,
  Building,
  PhoneCall,
  Bell,
  Sparkles,
  LogOut,
  Edit3,
  X,
  Save
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
    openAuthModal,
    logout,
    showToast,
    dpdpConsent,
    dpdpNominee,
    dpdpGrievances,
    exportPersonalData,
    setIsDPDPNoticeOpen,
    setIsDPDPConsentManagerOpen,
    setIsDPDPDataRightsOpen,
    isLoadingData,
    isAuthLoading,
    dataLoadError
  } = useApp();

  const [activeTab, setActiveTab] = useState<'bookings' | 'projects' | 'addresses' | 'dpdp'>('bookings');

  // Customer profile edit modal state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLocality, setEditLocality] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // If user is not logged in (e.g. after logout or back-button navigation),
  // strictly prevent private data exposure and render a clean auth prompt.
  if (!currentUser) {
    if (isAuthLoading) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3 p-8 bg-white/90 rounded-2xl border border-emerald-100 shadow-sm">
            <div className="w-8 h-8 border-3 border-[#003523] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-[#003523]">Restoring resident profile...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-gray-200 shadow-xl text-center space-y-4 animate-scaleUp">
        <div className="w-14 h-14 bg-emerald-50 text-[#003523] rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
          <User className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-[#131b2e]">Sign In Required</h2>
        <p className="text-xs text-[#707973] leading-relaxed">
          Please sign in to view your profile, active booking status, and warranty records.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage('home')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#131b2e] text-xs font-semibold transition-colors cursor-pointer"
          >
            Return to Home
          </button>
          <button
            onClick={() => openAuthModal('login', 'account')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  // Customer initials
  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-24">
      {/* Account Header */}
      <div className="bg-white rounded-2xl border border-[#c0c9c2]/50 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#003523] text-white flex items-center justify-center font-bold text-lg">
            {initials}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-[#131b2e]">
                {currentUser.name}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#c0edd3] text-[#003523]">
                {currentUser.status || 'ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-[#707973]">
              {`${currentUser.phone} · ${currentUser.locality || currentLocality}`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={openEditModal}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#c0c9c2]/60 hover:bg-[#f2f3ff] text-[#131b2e] transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-gray-600" />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={() => openAuthModal('login', 'account')}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#c0c9c2]/60 hover:bg-[#f2f3ff] text-[#131b2e] transition-colors cursor-pointer"
          >
            Switch Account
          </button>

          <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#003523] bg-[#c0edd3]/25 px-3 py-1.5 rounded-xl border border-[#b6efd1]">
            <ShieldCheck className="w-4 h-4 text-[#003523]" />
            <span>Verified Resident</span>
          </div>

          <button
            onClick={() => logout()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-colors cursor-pointer"
            title="Log out of account"
          >
            <LogOut className="w-3.5 h-3.5 text-red-600" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-[#003523]" />
                <h3 className="font-bold text-sm text-[#131b2e]">Edit Resident Profile</h3>
              </div>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
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
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003523] font-semibold"
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
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003523] font-semibold"
                  placeholder="+91 98888 12345"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Must be 10 digits starting with 6 to 9. One account per mobile number.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Locality / Sector
                </label>
                <select
                  value={editLocality}
                  onChange={(e) => setEditLocality(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003523] font-semibold bg-white cursor-pointer"
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
                  Primary Delivery Address
                </label>
                <textarea
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003523] font-semibold resize-none"
                  placeholder="House / Flat / Tower details"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-2 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingProfile ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#c0c9c2]/40 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'bookings'
              ? 'bg-[#003523] text-white'
              : 'text-[#404943] hover:text-[#131b2e]'
          }`}
        >
          My Service Bookings ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'projects'
              ? 'bg-[#003523] text-white'
              : 'text-[#404943] hover:text-[#131b2e]'
          }`}
        >
          Home Projects ({projectRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeTab === 'addresses'
              ? 'bg-[#003523] text-white'
              : 'text-[#404943] hover:text-[#131b2e]'
          }`}
        >
          Saved Addresses ({currentUser?.address ? 1 : 0})
        </button>
        <button
          onClick={() => setActiveTab('dpdp')}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
            activeTab === 'dpdp'
              ? 'bg-[#003523] text-white'
              : 'text-[#003523] bg-[#c0edd3]/30 hover:bg-[#c0edd3]/60'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>DPDP Privacy & Rights</span>
        </button>
      </div>

      {dataLoadError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>Failed to load account records from Supabase: {dataLoadError}</span>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="space-y-3">
          {isLoadingData && requests.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-5 bg-white rounded-xl border border-[#c0c9c2]/40 animate-pulse space-y-2">
                  <div className="h-4 bg-[#e7ede8] rounded w-1/4"></div>
                  <div className="h-5 bg-[#e7ede8] rounded w-1/2"></div>
                  <div className="h-3 bg-[#e7ede8] rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#c0c9c2]/40 text-xs text-[#707973]">
              No service requests yet.
            </div>
          ) : (
            requests.map((order) => (
              <div
                key={order.id}
                className="p-4 bg-white rounded-xl border border-[#c0c9c2]/50 hover:border-[#003523] transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-[#131b2e]">#{order.id}</span>
                    <span className="text-[11px] text-[#707973]">· {order.createdAt}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        order.status === 'NEW'
                          ? 'bg-[#ffdcc3] text-[#904d00]'
                          : order.status === 'UNDER REVIEW'
                          ? 'bg-[#eaedff] text-[#003523]'
                          : order.status === 'ASSIGNED'
                          ? 'bg-[#c0edd3] text-[#003523]'
                          : order.status === 'IN PROGRESS'
                          ? 'bg-[#fe932c] text-[#002114]'
                          : 'bg-[#c0edd3] text-[#003523]'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="font-bold text-sm text-[#131b2e]">
                    {order.items.map((i) => `${i.serviceName} (×${i.quantity})`).join(', ')}
                  </div>

                  <div className="text-[11px] text-[#707973]">
                    {order.address} · Preferred Slot: {order.preferredTimeSlot}
                  </div>

                  {order.assignedTo && (
                    <div className="text-[11px] text-[#003523] font-semibold pt-0.5">
                      Assigned Pro: {order.assignedTo.name} ({order.assignedTo.phone})
                    </div>
                  )}

                  <CustomerOtpDisplay
                    requestId={order.id}
                    status={order.status}
                    bookingUserId={order.user_id}
                    customerPhone={order.customerPhone}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center space-x-3 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-[#c0c9c2]/30">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-[#707973] block">Total</span>
                    <span className="text-sm font-black text-[#003523]">₹{order.total}</span>
                  </div>

                  <button
                    onClick={() => setActiveTrackingRequestId(order.id)}
                    className="px-3.5 py-2 rounded-lg bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold flex items-center space-x-1"
                  >
                    <span>View Timeline</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="space-y-3">
          {projectRequests.map((prj) => (
            <div
              key={prj.id}
              className="p-4 bg-white rounded-xl border border-[#c0c9c2]/50 shadow-xs space-y-2 text-xs"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-[11px] font-bold text-[#707973]">{prj.id}</span>
                  <h3 className="font-bold text-sm text-[#131b2e]">{prj.projectType}</h3>
                  <div className="text-[#003523] font-semibold">
                    {prj.locality} · {prj.approxAreaSqFt} sq.ft ({prj.propertyType})
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#eaedff] text-[#003523]">
                  {prj.status}
                </span>
              </div>
              <p className="text-[#404943] text-xs">{prj.description}</p>
              <div className="pt-2 border-t border-[#c0c9c2]/40 flex justify-between text-[#707973]">
                <span>Budget: {prj.budgetRange}</span>
                <span>Timeline: {prj.preferredStartDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {currentUser?.address ? (
            <div className="p-4 bg-white rounded-xl border border-[#003523] space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#003523]">Primary Residence ({currentUser.locality || currentLocality})</span>
                <span className="text-[10px] bg-[#c0edd3] text-[#003523] px-1.5 py-0.5 rounded font-bold">
                  DEFAULT
                </span>
              </div>
              <p className="text-[#131b2e]">{currentUser.address}</p>
              <div className="text-[11px] text-[#707973]">Locality: {currentUser.locality || currentLocality}</div>
            </div>
          ) : (
            <div className="p-8 col-span-2 text-center bg-white rounded-2xl border border-[#c0c9c2]/40 text-xs text-[#707973]">
              No saved addresses on file. Add your delivery address during service checkout.
            </div>
          )}
        </div>
      )}

      {/* DPDP Act 2023 Privacy & Data Rights Tab */}
      {activeTab === 'dpdp' && (
        <div className="space-y-4">
          {/* Statutory Preamble Banner */}
          <div className="p-4 rounded-2xl bg-[#002114] text-white border border-[#144d37] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#b6efd1] text-[#002114] flex items-center justify-center font-bold shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#003523]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-sm text-white">DPDP Act 2023 Compliance Center</h3>
                  <span className="text-[10px] bg-[#fe932c] text-[#002114] font-black px-1.5 py-0.5 rounded uppercase">
                    Law of India
                  </span>
                </div>
                <p className="text-xs text-[#b6efd1] leading-relaxed">
                  UrbanCare Solution acts as a verified Data Fiduciary in Kharar & Mohali. We process personal data solely for home repair execution and 30-day workmanship warranty fulfillment.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsDPDPNoticeOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#b6efd1] hover:bg-[#85bda1] text-[#002114] font-bold text-xs whitespace-nowrap shadow-xs transition-all flex items-center space-x-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-[#003523]" />
              <span>Read Section 5 Notice (EN/ਪੰਜਾਬੀ/HI)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Right to Access Information (Section 11) */}
            <div className="p-4 bg-white rounded-xl border border-[#c0c9c2]/50 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#003523]" />
                  <h4 className="font-bold text-xs text-[#131b2e]">Right to Access Information (Sec 11)</h4>
                </div>
                <span className="text-[10px] bg-[#c0edd3] text-[#003523] px-2 py-0.5 rounded-full font-bold">
                  Machine-Readable
                </span>
              </div>
              <p className="text-xs text-[#404943] leading-relaxed">
                Obtain a complete portable summary of personal records held, including booking logs, timestamps, technician dispatch assignments, and consent history.
              </p>
              <button
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
                className="w-full py-2 px-3 rounded-lg border border-[#003523] text-[#003523] hover:bg-[#c0edd3]/25 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export My Data File (JSON)</span>
              </button>
            </div>

            {/* Card 2: Purpose-Bound Consent Management (Section 6) */}
            <div className="p-4 bg-white rounded-xl border border-[#c0c9c2]/50 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-[#003523]" />
                  <h4 className="font-bold text-xs text-[#131b2e]">Purpose & Consent Controls (Sec 6)</h4>
                </div>
                <span className="text-[10px] bg-[#eaedff] text-[#003523] px-2 py-0.5 rounded-full font-bold">
                  {dpdpConsent.version}
                </span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center text-[#404943]">
                  <span>Doorstep Service Fulfillment:</span>
                  <span className="font-bold text-[#003523]">Active (Essential)</span>
                </div>
                <div className="flex justify-between items-center text-[#404943]">
                  <span>Technician Call Masking:</span>
                  <span className={`font-bold ${dpdpConsent.callMasking ? 'text-[#003523]' : 'text-[#ba1a1a]'}`}>
                    {dpdpConsent.callMasking ? 'Shielded' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#404943]">
                  <span>WhatsApp / SMS ETA Alerts:</span>
                  <span className={`font-bold ${dpdpConsent.dispatchUpdates ? 'text-[#003523]' : 'text-[#707973]'}`}>
                    {dpdpConsent.dispatchUpdates ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#404943]">
                  <span>Seasonal Maintenance Reminders:</span>
                  <span className={`font-bold ${dpdpConsent.promotionalMarketing ? 'text-[#003523]' : 'text-[#707973]'}`}>
                    {dpdpConsent.promotionalMarketing ? 'Opted-in' : 'Default OFF'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDPDPConsentManagerOpen(true)}
                className="w-full py-2 px-3 rounded-lg bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-[#fe932c]" />
                <span>Manage & Withdraw Consents</span>
              </button>
            </div>

            {/* Card 3: Statutory Right to Nominate (Section 14) */}
            <div className="p-4 bg-white rounded-xl border border-[#c0c9c2]/50 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-[#fe932c]" />
                  <h4 className="font-bold text-xs text-[#131b2e]">Right to Nominate (Sec 14)</h4>
                </div>
                <span className="text-[10px] bg-[#ffdcc3] text-[#904d00] px-2 py-0.5 rounded-full font-bold">
                  Statutory Protection
                </span>
              </div>
              <p className="text-xs text-[#404943] leading-relaxed">
                Nominate an individual to exercise your digital personal data rights in the event of death or incapacity.
              </p>
              {dpdpNominee ? (
                <div className="p-2.5 rounded-lg bg-[#faf8ff] border border-[#c0c9c2]/50 text-[11px] space-y-0.5">
                  <div className="font-bold text-[#003523]">{dpdpNominee.fullName} ({dpdpNominee.relationship})</div>
                  <div className="text-[#707973]">{dpdpNominee.phone}</div>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-gray-50 text-[11px] text-gray-500 italic">
                  No nominee appointed yet.
                </div>
              )}
              <button
                onClick={() => setIsDPDPDataRightsOpen(true)}
                className="w-full py-2 px-3 rounded-lg border border-[#c0c9c2] hover:bg-gray-50 text-[#131b2e] font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#003523]" />
                <span>{dpdpNominee ? 'Update Nominee' : 'Appoint Nominee'}</span>
              </button>
            </div>

            {/* Card 4: Grievance Redressal & Data Protection Officer (Section 13) */}
            <div className="p-4 bg-white rounded-xl border border-[#c0c9c2]/50 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-[#003523]" />
                  <h4 className="font-bold text-xs text-[#131b2e]">Data Protection Officer (Sec 13)</h4>
                </div>
                <span className="text-[10px] bg-[#c0edd3] text-[#003523] px-2 py-0.5 rounded-full font-bold">
                  7-Day SLA
                </span>
              </div>
              <div className="text-xs text-[#404943] space-y-1">
                <p><strong>Grievance Officer:</strong> Mr. Gurpreet Singh</p>
                <p><strong>Office:</strong> SCF 14, Sector 125, Kharar, Punjab</p>
                <p><strong>Direct Line:</strong> +91 98882 10452 | grievance@urbancaresolution.in</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsDPDPDataRightsOpen(true)}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Building className="w-3.5 h-3.5 text-[#fe932c]" />
                  <span>File Grievance Ticket</span>
                </button>
                <button
                  onClick={() => setIsDPDPDataRightsOpen(true)}
                  className="py-2 px-3 rounded-lg border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ffdad6]/20 font-bold text-xs flex items-center space-x-1 transition-colors"
                  title="Request Erasure"
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
  );
};
