import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { validateIndianPhone, validateEmail, validatePassword } from '../../utils/authValidation';
import { SERVICE_AVAILABLE_ZONES } from '../../data/initialData';
import {
  X,
  UserPlus,
  Key,
  ShieldCheck,
  Copy,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Briefcase,
  MapPin,
  Sparkles
} from 'lucide-react';

export const PRESET_ROLES = [
  { role: 'Field Specialist', desc: 'Core technician for standard domestic repairs, fast doorstep turnaround' },
  { role: 'Senior Master Technician', desc: '10+ years experience in high-precision diagnosis (HVAC, Inverter boards, 3-Phase)' },
  { role: 'Lead Field Supervisor', desc: 'Oversees sector squads, complex multi-trade escalations, and VIP inspections' },
  { role: 'Fabrication Specialist', desc: 'Mild steel, stainless steel (SS 304), heavy gates, grills & structural welding' },
  { role: 'Quality & Inspection Officer', desc: 'Pre-handover safety testing, earthing verification, and job audit sign-offs' },
  { role: 'Apprentice / Junior Technician', desc: 'Field trainee paired with senior masters for tool assistance and safety' }
];

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'technician' | 'vendor' | 'ops_manager';
}

export const CreateStaffModal: React.FC<CreateStaffModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'technician'
}) => {
  const { currentRole, authProfile, showToast, reloadUserData, addEmployee, addVendor } = useApp();

  const [targetRole, setTargetRole] = useState<'technician' | 'vendor' | 'ops_manager'>(defaultRole);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');

  // Technician-specific fields
  const [employeeCode, setEmployeeCode] = useState(`EMP-${Math.floor(100 + Math.random() * 900)}`);
  const [employeeRole, setEmployeeRole] = useState('Field Specialist');
  const [skillsText, setSkillsText] = useState('Split AC Installation, PCB Diagnostics, Gas Charging');
  const [selectedAreas, setSelectedAreas] = useState<string[]>(['Sector 94', 'Sector 104', 'Sector 110']);

  // Vendor-specific fields
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [categoriesText, setCategoriesText] = useState('Air Conditioning, Electrical, Plumbing');
  const [experienceYears, setExperienceYears] = useState(5);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSupabaseSession, setHasSupabaseSession] = useState<boolean | null>(null);
  const [sessionUserEmail, setSessionUserEmail] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{
    email: string;
    role: string;
    temporaryPassword?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync defaultRole when modal opens
  useEffect(() => {
    if (isOpen) {
      setTargetRole(defaultRole);
      setErrorMessage(null);
      setCreatedResult(null);
      setEmployeeCode(`EMP-${Math.floor(100 + Math.random() * 900)}`);

      if (isSupabaseConfigured()) {
        supabase.auth.getSession().then(({ data }) => {
          if (data?.session) {
            setHasSupabaseSession(true);
            setSessionUserEmail(data.session.user.email || 'Authenticated User');
          } else {
            setHasSupabaseSession(false);
            setSessionUserEmail(null);
          }
        }).catch(() => {
          setHasSupabaseSession(false);
          setSessionUserEmail(null);
        });
      } else {
        setHasSupabaseSession(false);
        setSessionUserEmail(null);
      }
    }
  }, [isOpen, defaultRole]);

  if (!isOpen) return null;

  const isAdmin = currentRole === 'admin' || authProfile?.role === 'admin';

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = 'PindCare#';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pass += '!';
    setTemporaryPassword(pass);
    if (errorMessage) setErrorMessage(null);
  };

  const toggleArea = (sector: string) => {
    setSelectedAreas((prev: string[]) =>
      prev.includes(sector) ? prev.filter((s: string) => s !== sector) : [...prev, sector]
    );
  };

  const selectAllSectors = () => {
    setSelectedAreas(SERVICE_AVAILABLE_ZONES.map((z) => z.sector));
  };

  const clearAllSectors = () => {
    setSelectedAreas([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      const err = 'Full name is required';
      setErrorMessage(err);
      showToast(err, 'error');
      return;
    }

    if (!validateEmail(email)) {
      const err = 'Please enter a valid work email address';
      setErrorMessage(err);
      showToast(err, 'error');
      return;
    }

    const phoneVal = validateIndianPhone(phone);
    if (!phoneVal.isValid) {
      const err = phoneVal.message || 'Please enter a valid 10-digit mobile number';
      setErrorMessage(err);
      showToast(err, 'error');
      return;
    }

    if (temporaryPassword && temporaryPassword.trim()) {
      const passVal = validatePassword(temporaryPassword);
      if (!passVal.isValid) {
        const err = passVal.message || 'Temporary password does not meet security criteria';
        setErrorMessage(err);
        showToast(err, 'error');
        return;
      }
    }

    if (targetRole === 'technician' && selectedAreas.length === 0) {
      const err = 'Please assign at least one service sector';
      setErrorMessage(err);
      showToast(err, 'error');
      return;
    }

    setLoading(true);

    // 1. When Supabase is configured, strictly enforce the live Edge Function flow.
    // NEVER fall back to local mock or add local-only records if session is missing or invocation fails.
    if (isSupabaseConfigured()) {
      const { data: sessionData } = await supabase.auth.getSession();
      const activeSession = sessionData?.session;

      if (!activeSession) {
        const sessionErr = 'Active Supabase admin session required: You are not currently signed into Supabase with an active session. Please sign in with your Admin or Operations Lead credentials to provision staff accounts.';
        setErrorMessage(sessionErr);
        showToast(sessionErr, 'error');
        setLoading(false);
        return;
      }

      try {
        const parsedSkills = skillsText
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);

        const parsedCategories = categoriesText
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);

        const { data, error } = await supabase.functions.invoke('create-staff-user', {
          body: {
            email: email.trim().toLowerCase(),
            role: targetRole,
            fullName: fullName.trim(),
            phone: phoneVal.formatted,
            temporaryPassword: temporaryPassword.trim() || undefined,
            employeeCode: employeeCode.trim(),
            employeeRole: employeeRole.trim(),
            skills: parsedSkills,
            serviceAreas: selectedAreas,
            businessName: businessName.trim() || undefined,
            ownerName: ownerName.trim() || undefined,
            categories: parsedCategories,
            experienceYears: experienceYears || 5
          },
        });

        let functionError: string | null = null;
        if (error) {
          if ('context' in error && (error as any).context) {
            try {
              const ctx = (error as any).context;
              if (typeof ctx.json === 'function') {
                const body = await ctx.json();
                functionError = body?.error || body?.message || null;
              } else if (typeof ctx.text === 'function') {
                const text = await ctx.text();
                if (text) {
                  try {
                    const parsed = JSON.parse(text);
                    functionError = parsed?.error || parsed?.message || text;
                  } catch {
                    functionError = text;
                  }
                }
              }
            } catch {}
          }
          if (!functionError && error.message && error.message !== 'Edge Function returned a non-2xx status code') {
            functionError = error.message;
          }
        }

        if (functionError || error || !data?.success) {
          let finalError = functionError || data?.error;
          if (!finalError || finalError === 'Edge Function returned a non-2xx status code') {
            finalError = 'Edge Function authorization failed. Ensure caller profile is admin or ops_manager and function secrets are set.';
          }
          setErrorMessage(finalError);
          showToast(finalError, 'error');
          setLoading(false);
          return;
        }

        // Reload live data from Supabase so the UI reflects the persisted server state
        await reloadUserData();

        setCreatedResult({
          email: data.email,
          role: data.role,
          temporaryPassword: data.temporaryPassword,
        });
        showToast(`Staff account successfully created for ${fullName} (${targetRole})!`, 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error invoking create-staff-user function';
        setErrorMessage(msg);
        showToast(msg, 'error');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. Mock behavior ONLY when Supabase is NOT configured and import.meta.env.DEV is true
    if (!isSupabaseConfigured() && import.meta.env.DEV) {
      const generatedPass = temporaryPassword.trim() || `PindCare#${Math.random().toString(36).slice(-6)}!`;
      const mockUserId = `dev-user-${Date.now()}`;

      if (targetRole === 'technician') {
        addEmployee({
          id: `emp-${Date.now()}`,
          user_id: mockUserId,
          name: fullName.trim(),
          mobile: phoneVal.formatted,
          email: email.trim().toLowerCase(),
          employeeCode: employeeCode.trim() || `EMP-${Math.floor(100 + Math.random() * 900)}`,
          role: employeeRole,
          skills: skillsText.split(',').map((s: string) => s.trim()).filter(Boolean),
          categories: ['Electrical', 'Air Conditioning'],
          serviceAreas: selectedAreas,
          availability: 'AVAILABLE',
          status: 'ACTIVE',
          activeJobs: 0,
          completedJobs: 0,
          rating: 5.0,
          joinedDate: new Date().toISOString().split('T')[0]
        });
      } else if (targetRole === 'vendor') {
        addVendor({
          id: `vnd-${Date.now()}`,
          user_id: mockUserId,
          businessName: businessName.trim() || `${fullName.trim()} Contracting Services`,
          ownerName: ownerName.trim() || fullName.trim(),
          mobile: phoneVal.formatted,
          email: email.trim().toLowerCase(),
          status: 'ACTIVE',
          categories: categoriesText.split(',').map((s: string) => s.trim()).filter(Boolean),
          serviceAreas: selectedAreas,
          experienceYears: experienceYears || 5,
          documentsVerified: true,
          activeJobs: 0,
          completedJobs: 0,
          rating: 5.0,
          createdAt: new Date().toISOString().split('T')[0],
          plan: {
            name: 'Standard Trade Plan',
            price: 1499,
            totalOpportunities: 7,
            usedOpportunities: 0,
            remainingOpportunities: 7,
            validityDays: 30,
            expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
          }
        });
      }

      setCreatedResult({
        email: email.trim().toLowerCase(),
        role: targetRole,
        temporaryPassword: generatedPass,
      });
      showToast(`Staff account created in local DEV mock mode for ${fullName.trim()}!`, 'success');
      setLoading(false);
      return;
    }

    // 3. Neither Supabase configured nor DEV environment
    const unconfiguredErr = 'Supabase is not configured. Please configure Supabase database credentials to provision live staff accounts.';
    setErrorMessage(unconfiguredErr);
    showToast(unconfiguredErr, 'error');
    setLoading(false);
  };

  const handleCopyCredentials = () => {
    if (!createdResult) return;
    const text = `UrbanCare Solution Staff Account:\nRole: ${createdResult.role}\nEmail: ${createdResult.email}\nTemporary Password: ${createdResult.temporaryPassword}\n\nPlease change your password immediately upon first sign-in.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Credentials copied to clipboard', 'info');
  };

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setTemporaryPassword('');
    setBusinessName('');
    setOwnerName('');
    setEmployeeCode(`EMP-${Math.floor(100 + Math.random() * 900)}`);
    setCreatedResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden my-4 animate-scaleUp">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#003523] to-[#0d4f36] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#fe932c] text-[#002114] flex items-center justify-center font-black shadow-md">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {targetRole === 'technician' ? 'Onboard In-House Technician' : targetRole === 'vendor' ? 'Onboard Trade Vendor Partner' : 'Provision Staff Account'}
              </h2>
              <p className="text-[11px] text-emerald-200">Atomic server-side login, profile, and database entity provisioning</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Status indicators */}
          {isSupabaseConfigured() && hasSupabaseSession === false && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Active Administrative Session Required</span>
                <span className="text-[11px] text-amber-800 leading-snug">
                  Supabase PostgreSQL is connected, but you are not currently signed into Supabase Auth with an administrative session. Please sign in with your Admin or Operations Lead credentials to provision live staff accounts.
                </span>
              </div>
            </div>
          )}

          {isSupabaseConfigured() && hasSupabaseSession === true && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-[11px]">
              <div className="flex items-center space-x-1.5 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Live Auth Session: <strong className="font-mono">{sessionUserEmail}</strong></span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                Edge Function Ready
              </span>
            </div>
          )}

          {!isSupabaseConfigured() && import.meta.env.DEV && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Offline Mock Mode (Development Only)</span>
                <span className="text-[11px] text-amber-800 leading-snug">
                  Supabase is not configured. Provisioning will create temporary in-memory mock records for UI testing.
                </span>
              </div>
            </div>
          )}

          {/* CREDENTIAL DISPLAY DIALOG (One-Time Temporary Password Warning) */}
          {createdResult ? (
            <div className="p-5 bg-emerald-50/90 rounded-2xl border-2 border-emerald-300 space-y-4">
              <div className="flex items-center space-x-2 text-emerald-900">
                <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
                <span className="font-black text-base">Account Provisioned & Synced Successfully</span>
              </div>

              {/* CRITICAL WARNING BANNER */}
              <div className="p-3 bg-amber-100 border-2 border-amber-400 rounded-xl text-amber-950 flex items-start space-x-2.5">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-xs uppercase tracking-wide text-amber-900">
                    ⚠️ Important: Temporary Password Displayed Once
                  </p>
                  <p className="text-[11px] text-amber-950 mt-0.5 leading-snug">
                    This temporary password will <strong>not be shown again</strong>. Please copy it immediately and provide it to the staff member. They will be required to change it on their first login.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-emerald-200 font-mono text-xs space-y-2 select-all shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-sans text-xs">Work Email:</span>
                  <span className="font-bold text-gray-900">{createdResult.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-sans text-xs">Role:</span>
                  <span className="font-bold text-[#003523] uppercase">{createdResult.role}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <span className="text-gray-500 font-sans text-xs">Temporary Password:</span>
                  <span className="font-bold text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200 text-sm">
                    {createdResult.temporaryPassword}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="flex-1 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold flex items-center justify-center space-x-2 cursor-pointer shadow-md transition-all"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-white text-gray-700 font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Inline Error Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Provisioning Failed</p>
                    <p className="text-[11px] text-red-600 mt-0.5 leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Role Selection Tabs */}
              <div>
                <label className="block font-bold text-gray-900 mb-1.5">Staff Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetRole('technician');
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      targetRole === 'technician'
                        ? 'border-[#003523] bg-[#003523]/5 ring-1 ring-[#003523] font-bold text-[#003523]'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    Field Technician
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetRole('vendor');
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      targetRole === 'vendor'
                        ? 'border-[#003523] bg-[#003523]/5 ring-1 ring-[#003523] font-bold text-[#003523]'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    Trade Partner (Vendor)
                  </button>
                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => {
                      setTargetRole('ops_manager');
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      !isAdmin
                        ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400'
                        : targetRole === 'ops_manager'
                        ? 'border-[#003523] bg-[#003523]/5 ring-1 ring-[#003523] font-bold text-[#003523] cursor-pointer'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 cursor-pointer'
                    }`}
                    title={!isAdmin ? 'Only full administrators can provision ops managers' : undefined}
                  >
                    Ops Manager {!isAdmin && '(Admin only)'}
                  </button>
                </div>
              </div>

              {/* Identity Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-900 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (!businessName && targetRole === 'vendor') {
                        setBusinessName(`${e.target.value} Contracting Services`);
                      }
                      if (!ownerName && targetRole === 'vendor') {
                        setOwnerName(e.target.value);
                      }
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="e.g. Jaswinder Singh"
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-900 mb-1">Mobile (+91) *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="98889 00122"
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                  />
                </div>
              </div>

              {/* Work Email */}
              <div>
                <label className="block font-bold text-gray-900 mb-1">Work Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder={targetRole === 'vendor' ? 'contractor@coolingpros.in' : 'technician@urbancaresolution.in'}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                />
              </div>

              {/* TECHNICIAN SPECIFIC FIELDS */}
              {targetRole === 'technician' && (
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-900 mb-1">Employee Code / Badge</label>
                      <input
                        type="text"
                        value={employeeCode}
                        onChange={(e) => setEmployeeCode(e.target.value)}
                        placeholder="EMP-105"
                        className="w-full p-2 rounded-xl border border-gray-300 text-xs font-mono font-bold uppercase bg-white focus:border-[#003523]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-900 mb-1">Operational Role</label>
                      <select
                        value={employeeRole}
                        onChange={(e) => setEmployeeRole(e.target.value)}
                        className="w-full p-2 rounded-xl border border-gray-300 text-xs font-semibold bg-white focus:border-[#003523]"
                      >
                        {PRESET_ROLES.map((r) => (
                          <option key={r.role} value={r.role}>{r.role}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-900 mb-1 flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#fe932c]" />
                      <span>Trade Skills (comma-separated)</span>
                    </label>
                    <input
                      type="text"
                      value={skillsText}
                      onChange={(e) => setSkillsText(e.target.value)}
                      placeholder="e.g. Split AC Installation, PCB Diagnostics, Gas Charging"
                      className="w-full p-2 rounded-xl border border-gray-300 text-xs font-semibold bg-white focus:border-[#003523]"
                    />
                  </div>

                  {/* Sectors */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-gray-900 flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-[#003523]" />
                        <span>Assigned Sectors (Sectors 94 to 111) *</span>
                      </label>
                      <div className="flex items-center space-x-2 text-[10px]">
                        <button type="button" onClick={selectAllSectors} className="text-[#003523] font-bold hover:underline">Select All</button>
                        <span className="text-gray-300">|</span>
                        <button type="button" onClick={clearAllSectors} className="text-gray-500 hover:underline">Clear</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 max-h-24 overflow-y-auto p-1 bg-white rounded-xl border border-gray-200">
                      {SERVICE_AVAILABLE_ZONES.map((zone) => {
                        const isSelected = selectedAreas.includes(zone.sector);
                        return (
                          <button
                            key={zone.id}
                            type="button"
                            onClick={() => toggleArea(zone.sector)}
                            className={`p-1.5 rounded-lg text-[10px] font-bold border transition-all text-left truncate cursor-pointer ${
                              isSelected
                                ? 'bg-[#003523] text-white border-[#003523]'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {zone.sector}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* VENDOR SPECIFIC FIELDS */}
              {targetRole === 'vendor' && (
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-900 mb-1 flex items-center space-x-1">
                        <Briefcase className="w-3.5 h-3.5 text-[#003523]" />
                        <span>Business / Entity Name *</span>
                      </label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Apex Cooling Solutions"
                        className="w-full p-2 rounded-xl border border-gray-300 text-xs font-semibold bg-white focus:border-[#003523]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-900 mb-1">Owner / Contact Name</label>
                      <input
                        type="text"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="Gurinder Singh"
                        className="w-full p-2 rounded-xl border border-gray-300 text-xs font-semibold bg-white focus:border-[#003523]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-900 mb-1">Contractor Categories</label>
                      <input
                        type="text"
                        value={categoriesText}
                        onChange={(e) => setCategoriesText(e.target.value)}
                        placeholder="Air Conditioning, Electrical"
                        className="w-full p-2 rounded-xl border border-gray-300 text-xs font-semibold bg-white focus:border-[#003523]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-900 mb-1">Trade Experience (Years)</label>
                      <input
                        type="number"
                        min="1"
                        max="40"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(Number(e.target.value) || 5)}
                        className="w-full p-2 rounded-xl border border-gray-300 text-xs font-semibold bg-white focus:border-[#003523]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Temporary Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-gray-900">
                    Temporary Password (Optional / Auto-generated)
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] text-[#003523] font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate Strong</span>
                  </button>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={temporaryPassword}
                    onChange={(e) => {
                      setTemporaryPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Leave blank to generate randomly"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 font-mono text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Must be at least 8 characters. The staff member must change this on first login. It will never be printed in server logs.
                </p>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#003523] hover:bg-[#144d37] disabled:opacity-50 text-white font-bold flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer"
                >
                  {loading ? (
                    <span>Provisioning & Creating Server Entity...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-[#fe932c]" />
                      <span>
                        {targetRole === 'technician' ? 'Create Employee & Account' : targetRole === 'vendor' ? 'Create Vendor Partner & Account' : 'Provision Ops Manager Account'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
