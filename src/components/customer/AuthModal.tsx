import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LOCALITIES } from '../../data/initialData';
import { supabase } from '../../lib/supabase';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  LogOut,
  Building,
  Sparkles,
  Wrench,
  HardHat,
  Briefcase,
  Eye,
  EyeOff,
  Check,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { validatePassword, validateIndianPhone, validateEmail } from '../../utils/authValidation';
import { checkPhoneAvailableViaRpc } from '../../services/supabaseService';

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    currentRole,
    currentUser,
    authProfile,
    currentEmployeeId,
    currentVendorId,
    employees,
    vendors,
    login,
    loginWithGoogle,
    registerCustomer,
    logout,
    currentLocality,
    setCurrentPage,
    showToast,
    setIsDPDPNoticeOpen,
    updateDPDPConsent
  } = useApp();

  const currentEmployee = employees.find((e) => e.id === currentEmployeeId);
  const currentVendor = vendors.find((v) => v.id === currentVendorId);

  const mode = authModalMode;
  const setMode = setAuthModalMode;

  // Login form state (Unified for all roles)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isResetSending, setIsResetSending] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } finally {
      setTimeout(() => {
        setIsGoogleLoading(false);
      }, 2500);
    }
  };

  // Inline feedback state
  const [loginError, setLoginError] = useState<string | null>(null);

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regLocality, setRegLocality] = useState(currentLocality || LOCALITIES[0]);
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regConsentChecked, setRegConsentChecked] = useState(false);
  const [regConsentError, setRegConsentError] = useState(false);

  const regPasswordValidation = validatePassword(regPassword);
  const regPhoneValidation = validateIndianPhone(regPhone);

  if (!isAuthModalOpen) return null;

  const isRoleLoggedIn =
    !!authProfile ||
    (currentRole === 'customer' && !!currentUser) ||
    currentRole === 'employee' ||
    currentRole === 'technician' ||
    currentRole === 'vendor' ||
    currentRole === 'operations' ||
    currentRole === 'admin';

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginEmail.trim() || !loginPassword.trim()) {
      const err = 'Please enter both email and password';
      setLoginError(err);
      showToast(err, 'error');
      return;
    }

    setIsLoading(true);
    const result = await login(loginEmail.trim(), loginPassword.trim());
    setIsLoading(false);
    if (result.success) {
      setLoginError(null);
      setIsAuthModalOpen(false);
      setLoginEmail('');
      setLoginPassword('');
    } else {
      setLoginError(result.message || 'Incorrect email or password. Please verify your credentials and try again.');
    }
  };

  const handleForgotPassword = async () => {
    if (!loginEmail.trim() || !validateEmail(loginEmail.trim())) {
      showToast('Please enter your valid account email address above first.', 'error');
      return;
    }

    setIsResetSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(loginEmail.trim(), {
        redirectTo: `${window.location.origin}/?reset=true`
      });

      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast(`Password recovery link sent to ${loginEmail.trim()}! Check your inbox.`, 'success');
      }
    } catch {
      showToast('Failed to send recovery email. Please try again.', 'error');
    } finally {
      setIsResetSending(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim()) {
      showToast('Full name and mobile number are required', 'error');
      return;
    }

    if (!regPhoneValidation.isValid) {
      showToast(regPhoneValidation.message || 'Please enter a valid 10-digit mobile number (+91).', 'error');
      return;
    }

    if (!regEmail.trim() || !validateEmail(regEmail.trim())) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    if (!regPasswordValidation.isValid) {
      showToast(regPasswordValidation.message || 'Password must be at least 8 characters long.', 'error');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      showToast('Passwords do not match. Please verify.', 'error');
      return;
    }

    if (!regConsentChecked) {
      setRegConsentError(true);
      showToast('Please check the DPDP Act consent box to proceed', 'error');
      return;
    }

    setIsLoading(true);

    // Pre-check phone availability via check_phone_available RPC
    try {
      const isAvailable = await checkPhoneAvailableViaRpc(regPhoneValidation.formatted);
      if (!isAvailable) {
        showToast('This mobile number is already registered. Please log in, or contact support if this is not you.', 'error');
        setIsLoading(false);
        return;
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('Too many')) {
        showToast(err.message, 'error');
        setIsLoading(false);
        return;
      }
    }

    const created = await registerCustomer({
      name: regName.trim(),
      phone: regPhoneValidation.formatted,
      email: regEmail.trim(),
      locality: regLocality,
      address: regAddress,
      password: regPassword
    });
    setIsLoading(false);

    if (created) {
      updateDPDPConsent({
        essentialService: true,
        dispatchUpdates: true,
        consentedAt: new Date().toISOString()
      });
      localStorage.setItem('urbancare_dpdp_banner_ack', 'true');

      setIsAuthModalOpen(false);
      setRegName('');
      setRegPhone('');
      setRegEmail('');
      setRegAddress('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegConsentChecked(false);
      setRegConsentError(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-t-[20px] sm:rounded-2xl max-w-md w-full max-h-[90dvh] flex flex-col shadow-2xl border border-[#E2E6E4] overflow-hidden animate-scaleUp pb-[env(safe-area-inset-bottom)]">
        
        {/* Top Header */}
        <div className="px-5 py-4 bg-[#0D3B2E] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E7F3EC] text-[#0D3B2E] flex items-center justify-center font-bold">
              {currentRole === 'employee' || currentRole === 'technician' ? (
                <Wrench className="w-4 h-4 text-[#0D3B2E]" />
              ) : currentRole === 'vendor' ? (
                <HardHat className="w-4 h-4 text-[#0D3B2E]" />
              ) : currentRole === 'operations' || currentRole === 'admin' ? (
                <ShieldCheck className="w-4 h-4 text-[#0D3B2E]" />
              ) : (
                <User className="w-4 h-4 text-[#0D3B2E]" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {currentRole === 'employee' || currentRole === 'technician'
                  ? 'Field Technician Account'
                  : currentRole === 'vendor'
                  ? 'Vendor Partner Account'
                  : currentRole === 'operations' || currentRole === 'admin'
                  ? 'Operations Command Lead'
                  : currentUser
                  ? 'Resident Account'
                  : mode === 'register'
                  ? 'Sign up'
                  : 'Sign in'}
              </h2>
              <p className="text-[11px] text-[#E7F3EC]/90">
                UrbanCare Solution · Your Space | Our Care
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">

          {/* IF LOGGED IN IN ANY ROLE: SHOW DEDICATED PROFILE CARD */}
          {isRoleLoggedIn ? (
            <div className="space-y-4">

              {/* 1. EMPLOYEE (TECHNICIAN) PROFILE */}
              {(currentRole === 'employee' || currentRole === 'technician') && (
                <div className="p-4 rounded-xl bg-[#F7F8F7] border border-[#E2E6E4] space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-base shadow-xs">
                      <Wrench className="w-6 h-6 text-[#E7F3EC]" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#202124] flex items-center space-x-1.5">
                        <span>{currentEmployee?.name || 'Staff Technician'}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#E7F3EC] text-[#0D3B2E]">
                          {currentEmployee?.employeeCode || 'EMP-101'}
                        </span>
                      </div>
                      <p className="text-xs text-[#626B73] font-semibold">{currentEmployee?.role || 'Staff Technician'}</p>
                      <p className="text-[11px] text-[#626B73]">{currentEmployee?.mobile || '+91 98882 10452'}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E2E6E4] text-xs space-y-1 text-[#626B73]">
                    <div className="flex items-center space-x-1.5 text-xs text-[#626B73]">
                      <Briefcase className="w-3.5 h-3.5 text-[#0D3B2E] shrink-0" />
                      <span>Specialization: {currentEmployee?.skills?.slice(0, 2).join(', ') || 'Home Repairs'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs text-[#626B73]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0D3B2E] shrink-0" />
                      <span>Assigned Sector Hub: Sector 104 / Sunny Enclave</span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => {
                        setCurrentPage('employee');
                        setIsAuthModalOpen(false);
                      }}
                      className="w-full h-11 px-4 rounded-xl bg-[#0D3B2E] hover:bg-[#0A2E24] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer"
                    >
                      <Wrench className="w-4 h-4 text-[#E7F3EC]" />
                      <span>Open Technician Job Queue</span>
                    </button>
                    <button
                      onClick={async () => {
                        await logout();
                        setIsAuthModalOpen(false);
                      }}
                      className="w-full h-10 px-4 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. VENDOR PARTNER PROFILE */}
              {currentRole === 'vendor' && (
                <div className="p-4 rounded-xl bg-[#F7F8F7] border border-[#E2E6E4] space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-[#F79324] text-[#0D3B2E] flex items-center justify-center font-bold text-base shadow-xs">
                      <HardHat className="w-6 h-6 text-[#0D3B2E]" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#202124] flex items-center space-x-1.5">
                        <span>{currentVendor?.businessName || 'Vendor Partner'}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#FFF4E0] text-[#0D3B2E] border border-[#F79324]/30">
                          {currentVendor?.status || 'ACTIVE'}
                        </span>
                      </div>
                      <p className="text-xs text-[#626B73]">Lead: {currentVendor?.ownerName || 'Partner'}</p>
                      <p className="text-[11px] text-[#626B73]">{currentVendor?.mobile || '+91 94172 88412'}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E2E6E4] text-xs space-y-1 text-[#626B73]">
                    <div className="flex items-center space-x-1.5 text-xs text-[#626B73]">
                      <Briefcase className="w-3.5 h-3.5 text-[#0D3B2E] shrink-0" />
                      <span>Active Plan: {currentVendor?.plan?.name || 'Standard Plan'} ({currentVendor?.plan?.remainingOpportunities || 0} Dispatches left)</span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => {
                        setCurrentPage('vendor');
                        setIsAuthModalOpen(false);
                      }}
                      className="w-full h-11 px-4 rounded-xl bg-[#0D3B2E] hover:bg-[#0A2E24] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer"
                    >
                      <HardHat className="w-4 h-4 text-[#F79324]" />
                      <span>Open Vendor Dispatches & Ledger</span>
                    </button>
                    <button
                      onClick={async () => {
                        await logout();
                        setIsAuthModalOpen(false);
                      }}
                      className="w-full h-10 px-4 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 3. OPERATIONS SUPERVISOR PROFILE */}
              {(currentRole === 'operations' || currentRole === 'admin') && (
                <div className="p-4 rounded-xl bg-[#F7F8F7] border border-[#E2E6E4] space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-base shadow-xs">
                      <ShieldCheck className="w-6 h-6 text-[#F79324]" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#202124] flex items-center space-x-1.5">
                        <span>Operations Command</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#E7F3EC] text-[#0D3B2E]">
                          OPS-SUPERVISOR
                        </span>
                      </div>
                      <p className="text-xs text-[#626B73]">Kharar Central Operations Hub</p>
                      <p className="text-[11px] text-[#626B73]">ops@urbancaresolution.in</p>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => {
                        setCurrentPage('admin');
                        setIsAuthModalOpen(false);
                      }}
                      className="w-full h-11 px-4 rounded-xl bg-[#0D3B2E] hover:bg-[#0A2E24] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#F79324]" />
                      <span>Open Operations Control Board</span>
                    </button>
                    <button
                      onClick={async () => {
                        await logout();
                        setIsAuthModalOpen(false);
                      }}
                      className="w-full h-10 px-4 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 4. CUSTOMER / RESIDENT PROFILE */}
              {currentRole === 'customer' && currentUser && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#F7F8F7] border border-[#E2E6E4] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-base shadow-xs">
                          {currentUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#202124] flex items-center space-x-1.5">
                            <span>{currentUser.name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#E7F3EC] text-[#0D3B2E]">
                              {currentUser.status || 'ACTIVE'}
                            </span>
                          </div>
                          <p className="text-xs text-[#626B73]">{currentUser.phone}</p>
                          {currentUser.email && (
                            <p className="text-[11px] text-[#626B73]">{currentUser.email}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E2E6E4] text-xs space-y-1 text-[#626B73]">
                      <div className="flex items-center space-x-1.5 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-[#0D3B2E] shrink-0" />
                        <span className="truncate">{currentUser.address || currentUser.locality}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-[#626B73]">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#0D3B2E] shrink-0" />
                        <span>Verified Doorstep Coverage in {currentUser.locality}</span>
                      </div>
                    </div>
                  </div>

                  {/* Account Quick Shortcuts */}
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setCurrentPage('account');
                        setIsAuthModalOpen(false);
                      }}
                      className="w-full h-11 px-4 rounded-xl bg-[#0D3B2E] hover:bg-[#0A2E24] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      <span>Go to My Bookings & Dashboard</span>
                    </button>

                    <button
                      onClick={async () => {
                        await logout();
                        setIsAuthModalOpen(false);
                      }}
                      className="w-full h-10 px-4 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* IF LOGGED OUT: UNIFIED SIGN IN OR RESIDENT SIGN UP */
            <>
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-[#F7F8F7] p-1 border border-[#E2E6E4]">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setLoginError(null); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white text-[#0D3B2E] shadow-xs'
                      : 'text-[#626B73] hover:text-[#202124]'
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setLoginError(null); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-white text-[#0D3B2E] shadow-xs'
                      : 'text-[#626B73] hover:text-[#202124]'
                  }`}
                >
                  Sign up
                </button>
              </div>

              {/* 1. RESIDENT LOGIN TAB */}
              {mode === 'login' && (
                <div className="space-y-4 pt-1">
                  {/* Customer Google Login Option */}
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isGoogleLoading || isLoading}
                      className="w-full h-[52px] rounded-xl border border-[#E2E6E4] bg-white hover:bg-[#F7F8F7] active:bg-[#ECEEEC] text-[#202124] font-semibold text-sm flex items-center justify-center space-x-3 transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E] disabled:opacity-60"
                      aria-label="Continue with Google"
                    >
                      {isGoogleLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#0D3B2E] border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-[#202124]">Connecting to Google...</span>
                        </>
                      ) : (
                        <>
                          <GoogleIcon className="w-5 h-5 shrink-0" />
                          <span>Continue with Google</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-[#626B73] text-center">
                      Fast, passwordless sign-in for Kharar & Mohali residents
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="relative flex items-center justify-center pt-1">
                    <div className="border-t border-[#E2E6E4] w-full" />
                    <span className="bg-white px-3 text-[11px] font-bold text-[#626B73] uppercase tracking-wider shrink-0">
                      or with email
                    </span>
                    <div className="border-t border-[#E2E6E4] w-full" />
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {loginError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2 animate-shake">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold">Authentication Failed</p>
                        <p className="text-[11px] text-red-600 mt-0.5 leading-snug">{loginError}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#202124] mb-1.5">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#626B73] absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value);
                          if (loginError) setLoginError(null);
                        }}
                        placeholder="e.g. resident@gmail.com"
                        className="w-full pl-10 pr-3 h-12 rounded-xl border border-[#E2E6E4] text-base text-[#202124] bg-white placeholder:text-[#626B73] focus:border-[#0D3B2E] focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-[#202124]">
                        Password *
                      </label>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={isResetSending}
                        className="text-[11px] text-[#0D3B2E] font-semibold hover:underline cursor-pointer"
                      >
                        {isResetSending ? 'Sending link...' : 'Forgot password?'}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#626B73] absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          if (loginError) setLoginError(null);
                        }}
                        placeholder="Enter your account password"
                        className="w-full pl-10 pr-10 h-12 rounded-xl border border-[#E2E6E4] text-base text-[#202124] bg-white placeholder:text-[#626B73] focus:border-[#0D3B2E] focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                        title={showLoginPassword ? 'Hide password' : 'Show password'}
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !loginEmail.trim() || !loginPassword.trim()}
                    className="w-full h-[52px] rounded-xl bg-[#0D3B2E] hover:bg-[#0A2E24] disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
                  >
                    {isLoading ? (
                      <span>Verifying credentials...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Sign in</span>
                      </>
                    )}
                  </button>

                  <div className="pt-1 text-center text-xs text-[#626B73]">
                    <span>Need a resident account? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setLoginError(null);
                      }}
                      className="font-bold text-[#0D3B2E] hover:underline cursor-pointer"
                    >
                      Sign up
                    </button>
                  </div>

                  <p className="text-[10px] text-[#626B73] text-center pt-0.5">
                    By signing in, you acknowledge our{' '}
                    <button
                      type="button"
                      onClick={() => setIsDPDPNoticeOpen(true)}
                      className="text-[#0D3B2E] underline font-bold cursor-pointer"
                    >
                      DPDP Section 5 Privacy Notice
                    </button>
                    .
                  </p>
                </form>
                </div>
              )}

              {/* 2. REGISTRATION TAB */}
              {mode === 'register' && (
                <div className="space-y-3.5 pt-1">
                  {/* Customer Google Signup Option */}
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isGoogleLoading || isLoading}
                      className="w-full h-[52px] rounded-xl border border-[#E2E6E4] bg-white hover:bg-[#F7F8F7] active:bg-[#ECEEEC] text-[#202124] font-semibold text-sm flex items-center justify-center space-x-3 transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E] disabled:opacity-60"
                      aria-label="Sign up with Google"
                    >
                      {isGoogleLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#0D3B2E] border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-[#202124]">Connecting to Google...</span>
                        </>
                      ) : (
                        <>
                          <GoogleIcon className="w-5 h-5 shrink-0" />
                          <span>Continue with Google</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-[#626B73] text-center">
                      Instant setup. Creates your verified resident account directly.
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="relative flex items-center justify-center pt-1">
                    <div className="border-t border-[#E2E6E4] w-full" />
                    <span className="bg-white px-3 text-[11px] font-bold text-[#626B73] uppercase tracking-wider shrink-0">
                      or register manually
                    </span>
                    <div className="border-t border-[#E2E6E4] w-full" />
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[#202124] mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Gurpreet Singh"
                      className="w-full px-3 h-12 rounded-xl border border-[#E2E6E4] text-base text-[#202124] bg-white placeholder:text-[#626B73] focus:border-[#0D3B2E] focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#202124] mb-1.5">
                      Mobile Number (+91) *
                    </label>
                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      autoComplete="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="e.g. 98150 12345"
                      className="w-full px-3 h-12 rounded-xl border border-[#E2E6E4] text-base text-[#202124] bg-white placeholder:text-[#626B73] focus:border-[#0D3B2E] focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]/20 transition-all"
                    />
                    {regPhone && !regPhoneValidation.isValid && (
                      <p className="text-[10px] text-red-600 mt-1 font-medium">{regPhoneValidation.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#202124] mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. gsingh@gmail.com"
                      className="w-full px-3 h-12 rounded-xl border border-[#E2E6E4] text-base text-[#202124] bg-white placeholder:text-[#626B73] focus:border-[#0D3B2E] focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#202124] mb-1.5">
                      Select Tricity Sector Hub *
                    </label>
                    <select
                      value={regLocality}
                      onChange={(e) => setRegLocality(e.target.value)}
                      className="w-full px-3 h-12 rounded-xl border border-[#E2E6E4] text-base text-[#202124] bg-white focus:border-[#0D3B2E] focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]/20 transition-all"
                    >
                      {LOCALITIES.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#202124] mb-1.5">
                      House / Flat / Street Address
                    </label>
                    <input
                      type="text"
                      autoComplete="street-address"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      placeholder="e.g. Villa 42, The Terraces, Sector 104, Mohali"
                      className="w-full px-3 h-12 rounded-xl border border-[#E2E6E4] text-base text-[#202124] bg-white placeholder:text-[#626B73] focus:border-[#0D3B2E] focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]/20 transition-all"
                    />
                  </div>

                  {/* Password with Strength Hint */}
                  <div className="p-3.5 rounded-xl bg-[#F7F8F7] border border-[#E2E6E4] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#202124] flex items-center space-x-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#0D3B2E]" />
                        <span>Account Password (Min 8 Characters) *</span>
                      </span>
                      {regPassword && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            regPasswordValidation.score === 3
                              ? 'bg-emerald-100 text-emerald-800'
                              : regPasswordValidation.score === 2
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {regPasswordValidation.strengthLabel}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#626B73] absolute left-3.5 top-3.5 pointer-events-none" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          autoComplete="new-password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          className="w-full pl-10 pr-10 h-12 rounded-xl border border-[#E2E6E4] text-base text-[#202124] bg-white placeholder:text-[#626B73] focus:border-[#0D3B2E] focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]/20 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {regPasswordValidation.message && (
                        <p className="text-[10px] text-red-600 mt-1 font-medium">{regPasswordValidation.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#626B73] mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#626B73] absolute left-3.5 top-3.5 pointer-events-none" />
                        <input
                          type={showRegConfirmPassword ? 'text' : 'password'}
                          required
                          autoComplete="new-password"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full pl-10 pr-10 h-12 rounded-xl border border-[#E2E6E4] text-base text-[#202124] bg-white placeholder:text-[#626B73] focus:border-[#0D3B2E] focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]/20 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                        >
                          {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {regConfirmPassword && regPassword !== regConfirmPassword && (
                        <p className="text-[10px] text-red-600 font-bold mt-1">Passwords do not match</p>
                      )}
                      {regConfirmPassword && regPassword === regConfirmPassword && (
                        <p className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Passwords match</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* DPDP Consent Checkbox (Section 6.10: 44px min tap area) */}
                  <div
                    className={`p-3 rounded-xl border transition-all space-y-1.5 min-h-[44px] ${
                      regConsentError
                        ? 'bg-red-50 border-red-300'
                        : 'bg-[#F7F8F7] border-[#E2E6E4]'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      <input
                        type="checkbox"
                        id="reg-dpdp-consent"
                        required
                        checked={regConsentChecked}
                        onChange={(e) => {
                          setRegConsentChecked(e.target.checked);
                          if (e.target.checked) setRegConsentError(false);
                        }}
                        className="w-4 h-4 text-[#0D3B2E] rounded accent-[#0D3B2E] shrink-0 mt-0.5 cursor-pointer"
                      />
                      <label
                        htmlFor="reg-dpdp-consent"
                        className="text-[11px] text-[#202124] leading-snug cursor-pointer select-none"
                      >
                        <span className="font-bold text-[#0D3B2E]">DPDP Act 2023 Consent: </span>
                        I consent to UrbanCare Solution processing my contact and address details solely for technician dispatch and warranty fulfillment.
                      </label>
                    </div>
                    {regConsentError && (
                      <p className="text-[10px] text-red-600 font-bold pl-6">
                        * Please accept the consent terms to create your account.
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={
                      isLoading ||
                      !regName.trim() ||
                      !regPhone.trim() ||
                      !regEmail.trim() ||
                      !regPasswordValidation.isValid ||
                      regPassword !== regConfirmPassword
                    }
                    className="w-full h-[52px] mt-2 rounded-xl bg-[#0D3B2E] hover:bg-[#0A2E24] disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
                  >
                    {isLoading ? (
                      <span>Creating Account...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Register & Sign In</span>
                      </>
                    )}
                  </button>

                  <div className="pt-1.5 text-center text-xs text-[#626B73]">
                    <span>Already have an account? </span>
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="font-bold text-[#0D3B2E] hover:underline cursor-pointer"
                    >
                      Sign in
                    </button>
                  </div>
                </form>
                </div>
              )}
            </>
          )}

          {/* Trust Banner at bottom */}
          <div className="pt-2 border-t border-[#E2E6E4] text-center">
            <p className="text-[10px] text-[#626B73] flex items-center justify-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0D3B2E]" />
              <span>Safe local data policy · Verified Kharar dispatch center</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
