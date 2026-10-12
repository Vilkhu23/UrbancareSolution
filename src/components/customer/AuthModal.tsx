import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LOCALITIES } from '../../data/initialData';
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
  KeyRound
} from 'lucide-react';
import { validateStrongPassword } from '../../utils/authValidation';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    currentRole,
    currentUser,
    currentEmployeeId,
    currentVendorId,
    employees,
    vendors,
    loginCustomer,
    registerCustomer,
    logoutCustomer,
    loginStaff,
    logoutStaff,
    currentLocality,
    setCurrentLocality,
    setCurrentPage,
    setCurrentRole,
    customers,
    showToast,
    setIsDPDPNoticeOpen,
    updateDPDPConsent
  } = useApp();

  const currentEmployee = employees.find((e) => e.id === currentEmployeeId);
  const currentVendor = vendors.find((v) => v.id === currentVendorId);

  const [mode, setMode] = useState<'login' | 'register' | 'staff'>('login');
  
  // Login form state
  const [loginInput, setLoginInput] = useState('');
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginOtp, setLoginOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Staff login state
  const [staffRole, setStaffRole] = useState<'employee' | 'vendor' | 'operations'>('employee');
  const [selectedStaffEntityId, setSelectedStaffEntityId] = useState('emp-1');
  const [staffPassword, setStaffPassword] = useState('TechPass@101');
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  const handleStaffRoleChange = (role: 'employee' | 'vendor' | 'operations') => {
    setStaffRole(role);
    if (role === 'employee') {
      setSelectedStaffEntityId(employees[0]?.id || 'emp-1');
      setStaffPassword(employees[0]?.password || 'TechPass@101');
    } else if (role === 'vendor') {
      setSelectedStaffEntityId(vendors[0]?.id || 'vnd-1');
      setStaffPassword(vendors[0]?.password || 'MalwaPass@2026');
    } else {
      setSelectedStaffEntityId('ops-lead');
      setStaffPassword('OpsLead@2026');
    }
  };

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

  const regPasswordValidation = validateStrongPassword(regPassword);

  if (!isAuthModalOpen) return null;

  const isRoleLoggedIn =
    (currentRole === 'customer' && !!currentUser) ||
    currentRole === 'employee' ||
    currentRole === 'vendor' ||
    currentRole === 'operations';

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim()) {
      showToast('Please enter your mobile number or email', 'error');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpSent(true);
      showToast(`Verification code sent to ${loginInput}`, 'info');
    }, 400);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim()) {
      showToast('Please enter mobile number or email', 'error');
      return;
    }

    const credential = loginMethod === 'password' ? loginPassword : (loginOtp || '123456');
    if (loginMethod === 'password' && !loginPassword.trim()) {
      showToast('Please enter your 8-letter account password', 'error');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const success = loginCustomer(loginInput, credential);
      if (success) {
        setIsAuthModalOpen(false);
        setOtpSent(false);
        setLoginInput('');
        setLoginOtp('');
        setLoginPassword('');
      }
    }, 300);
  };

  const handleStaffLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffPassword.trim()) {
      showToast('Please enter your account password to sign in', 'error');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const targetEntityId = staffRole === 'operations' ? 'ops-lead' : selectedStaffEntityId;
      const success = loginStaff(staffRole, targetEntityId, staffPassword);
      if (success) {
        setIsAuthModalOpen(false);
        setStaffPassword('');
      }
    }, 300);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim()) {
      showToast('Name and mobile number are required', 'error');
      return;
    }

    if (!regPassword || regPassword.length < 8) {
      showToast('Password must be at least 8 characters strong', 'error');
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
    setTimeout(() => {
      setIsLoading(false);
      registerCustomer({
        name: regName,
        phone: regPhone,
        email: regEmail,
        locality: regLocality,
        address: regAddress,
        password: regPassword
      });
      // Store one-time DPDP consent
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
    }, 300);
  };

  const handleQuickDemoSelect = (customer: typeof customers[0]) => {
    const success = loginCustomer(customer.phone, customer.password || '123456');
    if (success) {
      setIsAuthModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#c0c9c2]/50 overflow-hidden animate-scaleUp">
        
        {/* Top Header */}
        <div className="px-5 py-4 bg-[#003523] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#b6efd1] text-[#003523] flex items-center justify-center font-bold">
              {currentRole === 'employee' ? (
                <Wrench className="w-4 h-4" />
              ) : currentRole === 'vendor' ? (
                <HardHat className="w-4 h-4" />
              ) : currentRole === 'operations' ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {currentRole === 'employee'
                  ? 'Field Technician Account'
                  : currentRole === 'vendor'
                  ? 'Vendor Partner Account'
                  : currentRole === 'operations'
                  ? 'Operations Command Lead'
                  : currentUser
                  ? 'Resident Account'
                  : mode === 'staff'
                  ? 'Staff & Partner Hub Sign In'
                  : mode === 'login'
                  ? 'Resident Sign In'
                  : 'Create Resident Account'}
              </h2>
              <p className="text-[11px] text-[#b6efd1]/90">
                UrbanCare Solution · Your Space | Our Care
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">

          {/* IF LOGGED IN IN ANY ROLE: SHOW DEDICATED PROFILE CARD & ROLE-LOCKED ACTIONS */}
          {isRoleLoggedIn ? (
            <div className="space-y-4">

              {/* 1. EMPLOYEE (TECHNICIAN) PROFILE */}
              {currentRole === 'employee' && (
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
                      <p className="text-xs text-[#707973] font-semibold">{currentEmployee?.role || 'Senior Master Technician'}</p>
                      <p className="text-[11px] text-[#707973]">{currentEmployee?.mobile || '+91 98882 10452'}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#c0c9c2]/40 text-xs space-y-1 text-[#404943]">
                    <div className="flex items-center space-x-1.5 text-xs text-[#707973]">
                      <Briefcase className="w-3.5 h-3.5 text-[#003523] shrink-0" />
                      <span>Specialization: {currentEmployee?.skills?.slice(0, 2).join(', ') || 'AC & Electricals'}</span>
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
                      className="w-full py-2.5 px-4 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-xs"
                    >
                      <Wrench className="w-4 h-4 text-[#b6efd1]" />
                      <span>Open Technician Job Queue</span>
                    </button>
                    <button
                      onClick={() => {
                        logoutStaff();
                        setIsAuthModalOpen(false);
                      }}
                      className="w-full py-2 px-4 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs flex items-center justify-center space-x-2 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out of Technician Hub</span>
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
                      <p className="text-xs text-[#707973]">Lead: {currentVendor?.ownerName || 'Kulwinder Singh'}</p>
                      <p className="text-[11px] text-[#707973]">{currentVendor?.mobile || '+91 94172 88412'}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#c0c9c2]/40 text-xs space-y-1 text-[#404943]">
                    <div className="flex items-center space-x-1.5 text-xs text-[#707973]">
                      <Briefcase className="w-3.5 h-3.5 text-[#003523] shrink-0" />
                      <span>Active Plan: {currentVendor?.plan?.name || 'Standard Plan'} ({currentVendor?.plan?.remainingOpportunities || 4} Dispatches left)</span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => {
                        setCurrentPage('vendor');
                        setIsAuthModalOpen(false);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-xs"
                    >
                      <HardHat className="w-4 h-4 text-[#fe932c]" />
                      <span>Open Vendor Dispatches & Ledger</span>
                    </button>
                    <button
                      onClick={() => {
                        logoutStaff();
                        setIsAuthModalOpen(false);
                      }}
                      className="w-full py-2 px-4 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs flex items-center justify-center space-x-2 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out of Vendor Hub</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 3. OPERATIONS SUPERVISOR PROFILE */}
              {currentRole === 'operations' && (
                <div className="p-4 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/60 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-[#003523] text-white flex items-center justify-center font-bold text-base shadow-xs">
                      <ShieldCheck className="w-6 h-6 text-[#fe932c]" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#131b2e] flex items-center space-x-1.5">
                        <span>Harman (Operations Lead)</span>
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
                      className="w-full py-2.5 px-4 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-xs"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#fe932c]" />
                      <span>Open Operations Control Board</span>
                    </button>
                    <button
                      onClick={() => {
                        logoutStaff();
                        setIsAuthModalOpen(false);
                      }}
                      className="w-full py-2 px-4 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs flex items-center justify-center space-x-2 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out of Operations Command</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 4. CUSTOMER / RESIDENT PROFILE */}
              {currentRole === 'customer' && currentUser && (
                <>
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
                        setCurrentRole('customer');
                        setCurrentPage('account');
                        setIsAuthModalOpen(false);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-xs"
                    >
                      <User className="w-4 h-4" />
                      <span>Go to My Bookings & Dashboard</span>
                    </button>

                    <button
                      onClick={() => {
                        logoutCustomer();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs flex items-center justify-center space-x-2 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out of Account</span>
                    </button>
                  </div>

                  {/* Switch Resident Profile Quick Bar (Strictly Resident to Resident only) */}
                  <div className="pt-2 border-t border-[#c0c9c2]/40">
                    <p className="text-[11px] font-bold text-[#707973] mb-2 uppercase tracking-wider">
                      Or Switch Resident Profile:
                    </p>
                    <div className="space-y-1.5">
                      {customers.slice(0, 3).map((cust) => (
                        <button
                          key={cust.id}
                          onClick={() => handleQuickDemoSelect(cust)}
                          className={`w-full p-2 rounded-lg text-left text-xs flex items-center justify-between border transition-all ${
                            cust.id === currentUser.id
                              ? 'bg-[#c0edd3]/40 border-[#003523] font-bold text-[#003523]'
                              : 'bg-white border-[#c0c9c2]/50 hover:bg-[#f2f3ff] text-[#131b2e]'
                          }`}
                        >
                          <div className="truncate">
                            <span className="font-semibold">{cust.name}</span>
                            <span className="text-[11px] text-[#707973] ml-2 font-normal">
                              {cust.phone} · {cust.locality.split(',')[0]}
                            </span>
                          </div>
                          {cust.id === currentUser.id ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#003523] shrink-0" />
                          ) : (
                            <span className="text-[10px] text-[#707973]">Select</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* IF LOGGED OUT: RESIDENT SIGN IN, REGISTER, OR STAFF PORTAL TABS */
            <>
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-[#f2f3ff] p-1 border border-[#c0c9c2]/40">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setOtpSent(false);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    mode === 'login'
                      ? 'bg-white text-[#003523] shadow-xs'
                      : 'text-[#707973] hover:text-[#131b2e]'
                  }`}
                >
                  Resident Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    mode === 'register'
                      ? 'bg-white text-[#003523] shadow-xs'
                      : 'text-[#707973] hover:text-[#131b2e]'
                  }`}
                >
                  Registration
                </button>
                <button
                  type="button"
                  onClick={() => setMode('staff')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    mode === 'staff'
                      ? 'bg-white text-[#003523] shadow-xs'
                      : 'text-[#707973] hover:text-[#131b2e]'
                  }`}
                >
                  Staff Hub
                </button>
              </div>

              {/* LOGIN TAB */}
              {mode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-3.5 pt-1">
                  {/* Login Method Toggle */}
                  <div className="flex rounded-lg bg-[#faf8ff] p-0.5 border border-[#c0c9c2]/50 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setLoginMethod('password')}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${
                        loginMethod === 'password'
                          ? 'bg-[#003523] text-white shadow-xs'
                          : 'text-[#707973] hover:text-[#131b2e]'
                      }`}
                    >
                      Password Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginMethod('otp')}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${
                        loginMethod === 'otp'
                          ? 'bg-[#003523] text-white shadow-xs'
                          : 'text-[#707973] hover:text-[#131b2e]'
                      }`}
                    >
                      Instant OTP Code
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#131b2e] mb-1">
                      Mobile Number or Email
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#707973] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        placeholder="e.g. 98721 99120 or email"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                      />
                    </div>
                    <p className="text-[11px] text-[#707973] mt-1">
                      Enter your registered 10-digit Punjab mobile number or email.
                    </p>
                  </div>

                  {loginMethod === 'password' ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-[#131b2e]">
                          8-Letter Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setLoginMethod('otp')}
                          className="text-[11px] text-[#003523] font-semibold hover:underline"
                        >
                          Use OTP Instead
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#707973] absolute left-3 top-2.5" />
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter your 8-letter password"
                          className="w-full pl-9 pr-9 py-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-[#707973] mt-1">
                        Tip: For demo residents & partners, enter your password or demo code <span className="font-mono font-bold text-[#003523]">123456</span>.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {otpSent ? (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-[#131b2e]">
                              6-Digit Verification Code
                            </label>
                            <button
                              type="button"
                              onClick={() => setOtpSent(false)}
                              className="text-[11px] text-[#003523] font-semibold hover:underline"
                            >
                              Change Number
                            </button>
                          </div>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-[#707973] absolute left-3 top-2.5" />
                            <input
                              type="text"
                              maxLength={6}
                              value={loginOtp}
                              onChange={(e) => setLoginOtp(e.target.value)}
                              placeholder="Auto-filled: 123456"
                              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523] tracking-widest"
                            />
                          </div>
                          <p className="text-[11px] text-emerald-700 mt-1 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Demo OTP auto-approved for Kharar residents.</span>
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Primary CTA */}
                  {loginMethod === 'password' ? (
                    <button
                      type="submit"
                      disabled={isLoading || !loginInput.trim() || !loginPassword.trim()}
                      className="w-full py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs"
                    >
                      {isLoading ? (
                        <span>Verifying...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Sign In with Password</span>
                        </>
                      )}
                    </button>
                  ) : !otpSent ? (
                    <button
                      type="button"
                      disabled={isLoading || !loginInput.trim()}
                      onClick={handleSendOtp}
                      className="w-full py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs"
                    >
                      {isLoading ? (
                        <span>Sending Code...</span>
                      ) : (
                        <>
                          <span>Get OTP / Continue</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs"
                    >
                      {isLoading ? (
                        <span>Verifying...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify & Log In</span>
                        </>
                      )}
                    </button>
                  )}

                  <p className="text-[10px] text-[#707973] text-center pt-0.5">
                    By continuing, you acknowledge our{' '}
                    <button
                      type="button"
                      onClick={() => setIsDPDPNoticeOpen(true)}
                      className="text-[#003523] underline font-bold"
                    >
                      DPDP Section 5 Privacy Notice
                    </button>
                    .
                  </p>

                  {/* Quick One-Click Demo Residents */}
                  <div className="pt-3 border-t border-[#c0c9c2]/40">
                    <p className="text-[11px] font-bold text-[#707973] mb-2 uppercase tracking-wider flex items-center justify-between">
                      <span>Quick Test with Verified Resident:</span>
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {customers.slice(0, 3).map((cust) => (
                        <button
                          key={cust.id}
                          type="button"
                          onClick={() => handleQuickDemoSelect(cust)}
                          className="w-full p-2 rounded-lg bg-[#faf8ff] hover:bg-[#e2e7ff] border border-[#c0c9c2]/40 text-left text-xs flex items-center justify-between transition-colors group"
                        >
                          <div>
                            <div className="font-bold text-[#131b2e] group-hover:text-[#003523]">
                              {cust.name}
                            </div>
                            <div className="text-[11px] text-[#707973]">
                              {cust.phone} · {cust.locality.split(',')[0]}
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-[#003523]">
                            Login →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              )}

              {/* REGISTRATION TAB */}
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
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#131b2e] mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
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

                  {/* MANDATORY 8-CHAR STRONG PASSWORD */}
                  <div className="p-3.5 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#131b2e] flex items-center space-x-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#003523]" />
                        <span>Set 8-Letter Strong Password (Mandatory) *</span>
                      </span>
                      {regPassword && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            regPasswordValidation.strengthLabel === 'Strong'
                              ? 'bg-emerald-100 text-emerald-800'
                              : regPasswordValidation.strengthLabel === 'Medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {regPasswordValidation.strengthLabel}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#404943] mb-1">
                        Password (8+ characters) *
                      </label>
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
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="mt-1 text-[10px] flex items-center justify-between">
                        <span className={regPasswordValidation.lengthOk ? 'text-emerald-700 font-bold' : 'text-red-600 font-semibold'}>
                          {regPassword.length}/8 characters {regPasswordValidation.lengthOk ? '✓' : '(minimum 8 letters)'}
                        </span>
                        <span className="text-[10px] text-[#707973]">
                          {regPasswordValidation.hasNumberOrSpecial ? 'Has numbers/symbols ✓' : 'Add numbers or symbols'}
                        </span>
                      </div>
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
                          placeholder="Re-enter 8-letter password"
                          className="w-full pl-9 pr-9 py-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
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

                  {/* One-Time DPDP Act 2023 Consent on Account Creation */}
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
                        <span className="font-bold text-[#003523]">DPDP Act 2023 Consent (One-Time): </span>
                        I freely consent to UrbanCare Solution processing my contact and doorstep address for technician dispatch and 30-day workmanship warranty fulfillment.
                      </label>
                    </div>
                    <div className="flex items-center justify-between pl-6 text-[10px] text-[#707973]">
                      <span>Purpose-bound · One-time consent</span>
                      <button
                        type="button"
                        onClick={() => setIsDPDPNoticeOpen(true)}
                        className="text-[#003523] hover:underline font-bold"
                      >
                        Read Section 5 Notice
                      </button>
                    </div>
                    {regConsentError && (
                      <p className="text-[10px] text-[#ba1a1a] font-bold pl-6">
                        * Please check the consent box to create your account under the DPDP Act.
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={
                      isLoading ||
                      !regName.trim() ||
                      !regPhone.trim() ||
                      regPassword.length < 8 ||
                      regPassword !== regConfirmPassword
                    }
                    className="w-full py-2.5 mt-2 rounded-xl bg-[#003523] hover:bg-[#144d37] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs"
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
                </form>
              )}

              {/* STAFF & PARTNER PORTAL TAB - STRICT PASSWORD AUTHENTICATION */}
              {mode === 'staff' && (
                <form onSubmit={handleStaffLoginSubmit} className="space-y-3.5 pt-1">
                  {/* Informational banner */}
                  <div className="p-3 bg-[#f2f3ff] rounded-xl border border-[#c0c9c2]/50 text-xs text-[#404943]">
                    <p className="font-bold text-[#003523] mb-1 flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#003523]" />
                      <span>Role-Protected Staff & Trade Partner Sign In</span>
                    </p>
                    <p className="text-[11px] text-[#707973] leading-relaxed">
                      Every technician and vendor must log in with their password. You will strictly access and view only your assigned work.
                    </p>
                  </div>

                  {/* Role Selector Segmented Controls */}
                  <div>
                    <label className="block text-xs font-bold text-[#131b2e] mb-1.5">
                      Select Your Staff Persona Role:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#faf8ff] rounded-xl border border-[#c0c9c2]/50 text-xs">
                      <button
                        type="button"
                        onClick={() => handleStaffRoleChange('employee')}
                        className={`py-2 px-1 rounded-lg font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                          staffRole === 'employee'
                            ? 'bg-[#003523] text-white shadow-xs'
                            : 'text-[#707973] hover:text-[#131b2e] hover:bg-white'
                        }`}
                      >
                        <Wrench className="w-4 h-4" />
                        <span className="text-[10px]">Technician</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStaffRoleChange('vendor')}
                        className={`py-2 px-1 rounded-lg font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                          staffRole === 'vendor'
                            ? 'bg-[#fe932c] text-[#002114] shadow-xs'
                            : 'text-[#707973] hover:text-[#131b2e] hover:bg-white'
                        }`}
                      >
                        <HardHat className="w-4 h-4" />
                        <span className="text-[10px]">Partner</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStaffRoleChange('operations')}
                        className={`py-2 px-1 rounded-lg font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                          staffRole === 'operations'
                            ? 'bg-[#003523] text-white shadow-xs'
                            : 'text-[#707973] hover:text-[#131b2e] hover:bg-white'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px]">Operations</span>
                      </button>
                    </div>
                  </div>

                  {/* Account Selector based on selected role */}
                  {staffRole === 'employee' && (
                    <div>
                      <label className="block text-xs font-bold text-[#131b2e] mb-1">
                        Select Field Technician Profile:
                      </label>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                        {employees.map((emp) => (
                          <label
                            key={emp.id}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                              selectedStaffEntityId === emp.id
                                ? 'border-[#003523] bg-[#c0edd3]/30 font-bold text-[#003523]'
                                : 'border-[#c0c9c2]/50 bg-white hover:bg-[#faf8ff] text-[#131b2e]'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="staffEmpAccount"
                                checked={selectedStaffEntityId === emp.id}
                                onChange={() => {
                                  setSelectedStaffEntityId(emp.id);
                                  setStaffPassword(emp.password || 'TechPass@101');
                                }}
                                className="text-[#003523] focus:ring-[#003523]"
                              />
                              <div>
                                <span className="font-bold">{emp.name}</span>
                                <span className="text-[10px] text-[#707973] ml-1.5">
                                  {emp.employeeCode || emp.id} · {emp.role || 'Tech'}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] text-emerald-800 font-bold">
                              {emp.rating} ★
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {staffRole === 'vendor' && (
                    <div>
                      <label className="block text-xs font-bold text-[#131b2e] mb-1">
                        Select Vendor Partner Profile:
                      </label>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                        {vendors.map((v) => (
                          <label
                            key={v.id}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                              selectedStaffEntityId === v.id
                                ? 'border-[#fe932c] bg-[#ffdcc3]/30 font-bold text-[#002114]'
                                : 'border-[#c0c9c2]/50 bg-white hover:bg-[#faf8ff] text-[#131b2e]'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="staffVndAccount"
                                checked={selectedStaffEntityId === v.id}
                                onChange={() => {
                                  setSelectedStaffEntityId(v.id);
                                  setStaffPassword(v.password || 'MalwaPass@2026');
                                }}
                                className="text-[#003523] focus:ring-[#003523]"
                              />
                              <div>
                                <div className="font-bold truncate max-w-[190px]">{v.businessName}</div>
                                <div className="text-[10px] text-[#707973]">
                                  {v.ownerName} · {v.id}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                v.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : v.status === 'PENDING_VERIFICATION'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {v.status === 'PENDING_VERIFICATION' ? 'PENDING' : v.status}
                            </span>
                          </label>
                        ))}
                      </div>

                      {vendors.find((v) => v.id === selectedStaffEntityId)?.status === 'PENDING_VERIFICATION' && (
                        <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-950 flex items-start space-x-1.5">
                          <span className="font-bold">⚠️ Notice:</span>
                          <span>This partner profile is pending Operations Manager verification & activation.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {staffRole === 'operations' && (
                    <div className="p-3 bg-[#faf8ff] rounded-xl border border-[#c0c9c2]/50 space-y-1">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#003523] text-white flex items-center justify-center font-bold">
                          <ShieldCheck className="w-4 h-4 text-[#fe932c]" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#131b2e]">
                            Operations Command Supervisor (Harman)
                          </p>
                          <p className="text-[10px] text-[#707973]">
                            Central Dispatch & Partner Verification
                          </p>
                        </div>
                      </div>
                      <p className="text-[10px] text-[#707973] pt-1">
                        Login ID: <span className="font-mono font-bold text-[#003523]">ops@urbancaresolution.in</span> / <span className="font-mono">admin</span>
                      </p>
                    </div>
                  )}

                  {/* Password Input Field with eye toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[#131b2e]">
                        Account Password (Mandatory) *
                      </label>
                      <span className="text-[10px] text-emerald-800 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Demo:{' '}
                        {staffRole === 'employee'
                          ? employees.find((e) => e.id === selectedStaffEntityId)?.password || 'TechPass@101'
                          : staffRole === 'vendor'
                          ? vendors.find((v) => v.id === selectedStaffEntityId)?.password || 'MalwaPass@2026'
                          : 'OpsLead@2026'}
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#707973] absolute left-3 top-2.5" />
                      <input
                        type={showStaffPassword ? 'text' : 'password'}
                        required
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        placeholder="Enter password or 123456"
                        className="w-full pl-9 pr-9 py-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStaffPassword(!showStaffPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                        title={showStaffPassword ? 'Hide password' : 'Show password'}
                      >
                        {showStaffPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-[#707973] mt-1">
                      Strict authentication: password verification ensures you view only your assigned work.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || !staffPassword.trim()}
                    className="w-full py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    {isLoading ? (
                      <span>Verifying Credentials...</span>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5 text-[#b6efd1]" />
                        <span>
                          {staffRole === 'employee'
                            ? 'Sign In to Technician Hub'
                            : staffRole === 'vendor'
                            ? 'Sign In to Partner Portal'
                            : 'Sign In to Operations Command'}
                        </span>
                      </>
                    )}
                  </button>
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
