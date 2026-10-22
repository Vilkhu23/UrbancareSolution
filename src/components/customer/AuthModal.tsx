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
  const [isResetSending, setIsResetSending] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#c0c9c2]/50 overflow-hidden animate-scaleUp">
        
        {/* Top Header */}
        <div className="px-5 py-4 bg-[#003523] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#b6efd1] text-[#003523] flex items-center justify-center font-bold">
              {currentRole === 'employee' || currentRole === 'technician' ? (
                <Wrench className="w-4 h-4" />
              ) : currentRole === 'vendor' ? (
                <HardHat className="w-4 h-4" />
              ) : currentRole === 'operations' || currentRole === 'admin' ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
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
              <p className="text-[11px] text-[#b6efd1]/90">
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
                <div className="p-4 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/60 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-[#003523] text-white flex items-center justify-center font-bold text-base shadow-xs">
                      <Wrench className="w-6 h-6 text-[#b6efd1]" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#131b2e] flex items-center space-x-1.5">
                        <span>{currentEmployee?.name || 'Staff Technician'}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#c0edd3] text-[#003523]">
                          {currentEmployee?.employeeCode || 'EMP-101'}
                        </span>
                      </div>
                      <p className="text-xs text-[#707973] font-semibold">{currentEmployee?.role || 'Staff Technician'}</p>
                      <p className="text-[11px] text-[#707973]">{currentEmployee?.mobile || '+91 98882 10452'}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#c0c9c2]/40 text-xs space-y-1 text-[#404943]">
                    <div className="flex items-center space-x-1.5 text-xs text-[#707973]">
                      <Briefcase className="w-3.5 h-3.5 text-[#003523] shrink-0" />
                      <span>Specialization: {currentEmployee?.skills?.slice(0, 2).join(', ') || 'Home Repairs'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs text-[#707973]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#003523] shrink-0" />
                      <span>Assigned Sector Hub: Sector 104 / Sunny Enclave</span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => {
                        setCurrentPage('employee');
                        setIsAuthModalOpen(false);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer"
                    >
                      <Wrench className="w-4 h-4 text-[#b6efd1]" />
                      <span>Open Technician Job Queue</span>
                    </button>
                    <button
                      onClick={async () => {
                        await logout();
                        setIsAuthModalOpen(false);
                      }}
                      className="w-full py-2 px-4 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. VENDOR PARTNER PROFILE */}
              {currentRole === 'vendor' && (
                <div className="p-4 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/60 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-[#fe932c] text-[#002114] flex items-center justify-center font-bold text-base shadow-xs">
                      <HardHat className="w-6 h-6 text-[#002114]" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#131b2e] flex items-center space-x-1.5">
                        <span>{currentVendor?.businessName || 'Vendor Partner'}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#fe932c]/20 text-[#002114]">
                          {currentVendor?.status || 'ACTIVE'}
                        </span>
                      </div>
                      <p className="text-xs text-[#707973]">Lead: {currentVendor?.ownerName || 'Partner'}</p>
                      <p className="text-[11px] text-[#707973]">{currentVendor?.mobile || '+91 94172 88412'}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#c0c9c2]/40 text-xs space-y-1 text-[#404943]">
                    <div className="flex items-center space-x-1.5 text-xs text-[#707973]">
                      <Briefcase className="w-3.5 h-3.5 text-[#003523] shrink-0" />
                      <span>Active Plan: {currentVendor?.plan?.name || 'Standard Plan'} ({currentVendor?.plan?.remainingOpportunities || 0} Dispatches left)</span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => {
                        setCurrentPage('vendor');
                        setIsAuthModalOpen(false);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer"
                    >
                      <HardHat className="w-4 h-4 text-[#fe932c]" />
                      <span>Open Vendor Dispatches & Ledger</span>
                    </button>
                    <button
                      onClick={async () => {
                        await logout();
                        setIsAuthModalOpen(false);
                      }}
                      className="w-full py-2 px-4 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 3. OPERATIONS SUPERVISOR PROFILE */}
              {(currentRole === 'operations' || currentRole === 'admin') && (
                <div className="p-4 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/60 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-[#003523] text-white flex items-center justify-center font-bold text-base shadow-xs">
                      <ShieldCheck className="w-6 h-6 text-[#fe932c]" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#131b2e] flex items-center space-x-1.5">
                        <span>Operations Command</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#c0edd3] text-[#003523]">
                          OPS-SUPERVISOR
                        </span>
                      </div>
                      <p className="text-xs text-[#707973]">Kharar Central Operations Hub</p>
                      <p className="text-[11px] text-[#707973]">ops@urbancaresolution.in</p>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => {
                        setCurrentPage('admin');
                        setIsAuthModalOpen(false);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#fe932c]" />
                      <span>Open Operations Control Board</span>
                    </button>
                    <button
                      onClick={async () => {
                        await logout();
                        setIsAuthModalOpen(false);
                      }}
                      className="w-full py-2 px-4 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
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
                  <div className="p-4 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-[#003523] text-white flex items-center justify-center font-bold text-base shadow-xs">
                          {currentUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#131b2e] flex items-center space-x-1.5">
                            <span>{currentUser.name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#c0edd3] text-[#003523]">
                              {currentUser.status || 'ACTIVE'}
                            </span>
                          </div>
                          <p className="text-xs text-[#707973]">{currentUser.phone}</p>
                          {currentUser.email && (
                            <p className="text-[11px] text-[#707973]">{currentUser.email}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#c0c9c2]/40 text-xs space-y-1 text-[#404943]">
                      <div className="flex items-center space-x-1.5 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-[#003523] shrink-0" />
                        <span className="truncate">{currentUser.address || currentUser.locality}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-[#707973]">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#003523] shrink-0" />
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
                      className="w-full py-2.5 px-4 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      <span>Go to My Bookings & Dashboard</span>
                    </button>

                    <button
                      onClick={async () => {
                        await logout();
                        setIsAuthModalOpen(false);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
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
              <div className="flex rounded-xl bg-[#f2f3ff] p-1 border border-[#c0c9c2]/40">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setLoginError(null); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white text-[#003523] shadow-xs'
                      : 'text-[#707973] hover:text-[#131b2e]'
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setLoginError(null); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-white text-[#003523] shadow-xs'
                      : 'text-[#707973] hover:text-[#131b2e]'
                  }`}
                >
                  Sign up
                </button>
              </div>

              {/* 1. RESIDENT LOGIN TAB */}
              {mode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-3.5 pt-1">
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
                    <label className="block text-xs font-bold text-[#131b2e] mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#707973] absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value);
                          if (loginError) setLoginError(null);
                        }}
                        placeholder="e.g. resident@gmail.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[#131b2e]">
                        Password *
                      </label>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={isResetSending}
                        className="text-[11px] text-[#003523] font-semibold hover:underline cursor-pointer"
                      >
                        {isResetSending ? 'Sending link...' : 'Forgot password?'}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#707973] absolute left-3 top-2.5" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          if (loginError) setLoginError(null);
                        }}
                        placeholder="Enter your account password"
                        className="w-full pl-9 pr-9 py-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                        title={showLoginPassword ? 'Hide password' : 'Show password'}
                      >
                        {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !loginEmail.trim() || !loginPassword.trim()}
                    className="w-full py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    {isLoading ? (
                      <span>Verifying credentials...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sign in</span>
                      </>
                    )}
                  </button>

                  <div className="pt-1 text-center text-xs text-[#707973]">
                    <span>Need a resident account? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setLoginError(null);
                      }}
                      className="font-bold text-[#003523] hover:underline cursor-pointer"
                    >
                      Sign up
                    </button>
                  </div>

                  <p className="text-[10px] text-[#707973] text-center pt-0.5">
                    By signing in, you acknowledge our{' '}
                    <button
                      type="button"
                      onClick={() => setIsDPDPNoticeOpen(true)}
                      className="text-[#003523] underline font-bold cursor-pointer"
                    >
                      DPDP Section 5 Privacy Notice
                    </button>
                    .
                  </p>
                </form>
              )}

              {/* 2. REGISTRATION TAB */}
              {mode === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-[#131b2e] mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Gurpreet Singh"
                      className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#131b2e] mb-1">
                      Mobile Number (+91) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="e.g. 98150 12345"
                      className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                    />
                    {regPhone && !regPhoneValidation.isValid && (
                      <p className="text-[10px] text-red-600 mt-1 font-medium">{regPhoneValidation.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#131b2e] mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. gsingh@gmail.com"
                      className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#131b2e] mb-1">
                      Select Tricity Sector Hub *
                    </label>
                    <select
                      value={regLocality}
                      onChange={(e) => setRegLocality(e.target.value)}
                      className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                    >
                      {LOCALITIES.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#131b2e] mb-1">
                      House / Flat / Street Address
                    </label>
                    <input
                      type="text"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      placeholder="e.g. Villa 42, The Terraces, Sector 104, Mohali"
                      className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                    />
                  </div>

                  {/* Password with Strength Hint */}
                  <div className="p-3.5 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#131b2e] flex items-center space-x-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#003523]" />
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
                        <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          className="w-full pl-9 pr-9 py-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {regPasswordValidation.message && (
                        <p className="text-[10px] text-red-600 mt-1 font-medium">{regPasswordValidation.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#404943] mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                        <input
                          type={showRegConfirmPassword ? 'text' : 'password'}
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full pl-9 pr-9 py-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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

                  {/* DPDP Consent Checkbox */}
                  <div
                    className={`p-3 rounded-xl border transition-all space-y-1.5 ${
                      regConsentError
                        ? 'bg-[#ffdad6]/40 border-[#ba1a1a]'
                        : 'bg-[#faf8ff] border-[#c0c9c2]/60'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="reg-dpdp-consent"
                        required
                        checked={regConsentChecked}
                        onChange={(e) => {
                          setRegConsentChecked(e.target.checked);
                          if (e.target.checked) setRegConsentError(false);
                        }}
                        className="w-4 h-4 text-[#003523] rounded accent-[#003523] shrink-0 mt-0.5 cursor-pointer"
                      />
                      <label
                        htmlFor="reg-dpdp-consent"
                        className="text-[11px] text-[#131b2e] leading-snug cursor-pointer select-none"
                      >
                        <span className="font-bold text-[#003523]">DPDP Act 2023 Consent: </span>
                        I consent to UrbanCare Solution processing my contact and address details solely for technician dispatch and warranty fulfillment.
                      </label>
                    </div>
                    {regConsentError && (
                      <p className="text-[10px] text-[#ba1a1a] font-bold pl-6">
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
                    className="w-full py-2.5 mt-2 rounded-xl bg-[#003523] hover:bg-[#144d37] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    {isLoading ? (
                      <span>Creating Account...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Register & Sign In</span>
                      </>
                    )}
                  </button>

                  <div className="pt-1.5 text-center text-xs text-[#707973]">
                    <span>Already have an account? </span>
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="font-bold text-[#003523] hover:underline cursor-pointer"
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* Trust Banner at bottom */}
          <div className="pt-2 border-t border-[#c0c9c2]/40 text-center">
            <p className="text-[10px] text-[#707973] flex items-center justify-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-[#003523]" />
              <span>Safe local data policy · Verified Kharar dispatch center</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
