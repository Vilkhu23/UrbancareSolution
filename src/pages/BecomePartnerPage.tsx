import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Handshake,
  ShieldCheck,
  Zap,
  CheckCircle2,
  FileText,
  BadgeAlert,
  ArrowRight,
  Check,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { validateStrongPassword, validateIndianPhone } from '../utils/authValidation';
import { checkPhoneAvailableViaRpc } from '../services/supabaseService';

export const BecomePartnerPage: React.FC = () => {
  const { addVendor, currentLocality, showToast, currentRole, setCurrentRole, setCurrentPage, setIsAuthModalOpen } = useApp();

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [category, setCategory] = useState('AC & Appliances');
  const [experienceYears, setExperienceYears] = useState(5);
  const [selectedPlanId, setSelectedPlanId] = useState<'initial' | 'contractor' | 'enterprise'>('initial');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordValidation = validateStrongPassword(password);

  const planConfig = {
    initial: {
      name: 'Initial Demo Plan',
      price: 1499,
      totalOpportunities: 7,
      validityDays: 30
    },
    contractor: {
      name: 'Contractor Plan',
      price: 2999,
      totalOpportunities: 16,
      validityDays: 30
    },
    enterprise: {
      name: 'Enterprise Crew Plan',
      price: 4999,
      totalOpportunities: 30,
      validityDays: 45
    }
  };

  const selectedPlan = planConfig[selectedPlanId];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneVal = validateIndianPhone(mobile);
    if (!phoneVal.isValid) {
      showToast(phoneVal.message || 'Please enter a valid 10-digit mobile number starting with 6 to 9 (+91).', 'error');
      return;
    }

    if (password.length < 8) {
      showToast('Password must be at least 8 characters long', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsSubmitting(true);

    // Pre-check phone availability via check_phone_available RPC
    try {
      const isAvailable = await checkPhoneAvailableViaRpc(phoneVal.formatted);
      if (!isAvailable) {
        showToast('This mobile number is already registered. Please log in, or contact support if this is not you.', 'error');
        setIsSubmitting(false);
        return;
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('Too many')) {
        showToast(err.message, 'error');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await addVendor(
        {
          id: `vnd-${Date.now()}`,
          businessName,
          ownerName,
          mobile: phoneVal.formatted,
          email: email || `${ownerName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
          categories: [category],
          serviceAreas: [currentLocality, 'Sector 104, Mohali', 'Sector 110, Mohali', 'Sector 94, Mohali'],
          experienceYears: Number(experienceYears),
          documentsVerified: false,
          status: 'PENDING_VERIFICATION',
          plan: {
            name: selectedPlan.name,
            price: selectedPlan.price,
            totalOpportunities: selectedPlan.totalOpportunities,
            usedOpportunities: 0,
            remainingOpportunities: selectedPlan.totalOpportunities,
            validityDays: selectedPlan.validityDays,
            expiryDate: new Date(Date.now() + selectedPlan.validityDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          activeJobs: 0,
          completedJobs: 0,
          rating: 5.0,
          createdAt: new Date().toISOString().split('T')[0]
        },
        password
      );

      setSubmitted(true);
      showToast(`Partner application submitted! Queued for Operations Manager review & activation.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Partner application failed.';
      if (
        msg.includes('PHONE_ALREADY_REGISTERED') ||
        msg.includes('idx_profiles_phone_normalized') ||
        msg.toLowerCase().includes('duplicate')
      ) {
        showToast('This mobile number is already registered. Please log in, or contact support if this is not you.', 'error');
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-24">
      {/* Header */}
      <div className="bg-[#003523] text-white rounded-2xl p-6 sm:p-8 space-y-4">
        <span className="bg-[#fe932c] text-[#002114] text-xs font-bold px-2.5 py-0.5 rounded-full inline-block">
          Artisans & Contractors in Punjab
        </span>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
          Join UrbanCare Solution as a Registered Service Partner
        </h1>
        <p className="text-xs sm:text-sm text-[#b6efd1] max-w-2xl leading-relaxed">
          Grow your local trade business across Sectors 94 to 111 (Mohali) with genuine Qualified Work Opportunities reviewed directly by our operations team.
        </p>
        <div className="pt-2">
          <button
            onClick={() => {
              if (currentRole === 'vendor') {
                setCurrentPage('vendor');
              } else {
                setIsAuthModalOpen(true);
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-white text-[#003523] font-bold text-xs hover:bg-[#b6efd1] transition-colors flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <span>Sign In to Existing Partner Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="p-6 rounded-2xl bg-white border border-[#c0c9c2]/50 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#131b2e]">
              Partner Subscription Plans & Verified Quotas
            </h3>
            <p className="text-xs text-[#707973]">
              Choose your starter tier. We never sell blind leads — opportunities are verified domestic requests.
            </p>
          </div>
          <span className="text-[11px] font-bold text-[#003523] bg-[#c0edd3]/40 px-2.5 py-1 rounded-lg self-start sm:self-auto">
            Zero Commission on Parts & Extra Labor
          </span>
        </div>

        {/* Subscription Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Initial Demo Plan */}
          <div
            onClick={() => setSelectedPlanId('initial')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
              selectedPlanId === 'initial'
                ? 'border-[#003523] bg-[#c0edd3]/25 ring-1 ring-[#003523] shadow-xs'
                : 'border-[#c0c9c2]/60 bg-white hover:border-[#003523]/50'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#003523] uppercase tracking-wider">
                  Initial Demo Plan
                </span>
                {selectedPlanId === 'initial' ? (
                  <span className="text-[10px] font-bold bg-[#003523] text-white px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <Check className="w-2.5 h-2.5" />
                    <span>Selected</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-[#707973] bg-[#faf8ff] px-1.5 py-0.5 rounded">
                    Trial Tier
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-[#131b2e]">₹1,499</div>
              <div className="text-xs font-bold text-[#003523]">7 Qualified Work Opportunities</div>
              <p className="text-[11px] text-[#707973] leading-relaxed">
                30-Day validity · Immediate verified domestic dispatch across Sectors 94 to 111 (Mohali).
              </p>
            </div>
            <div className="text-[10px] text-[#404943] pt-2 border-t border-[#c0c9c2]/30">
              * Opportunities deducted only upon Operations dispatch assignment.
            </div>
          </div>

          {/* Contractor Plan */}
          <div
            onClick={() => setSelectedPlanId('contractor')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
              selectedPlanId === 'contractor'
                ? 'border-[#003523] bg-[#c0edd3]/25 ring-1 ring-[#003523] shadow-xs'
                : 'border-[#c0c9c2]/60 bg-white hover:border-[#003523]/50'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#904d00] uppercase tracking-wider">
                  Contractor Plan
                </span>
                <span className="text-[10px] font-bold bg-[#ffdcc3] text-[#904d00] px-2 py-0.5 rounded-full">
                  MOST POPULAR
                </span>
              </div>
              <div className="text-2xl font-black text-[#131b2e]">₹2,999</div>
              <div className="text-xs font-bold text-[#003523]">16 Qualified Work Opportunities</div>
              <p className="text-[11px] text-[#707973] leading-relaxed">
                30-Day validity · Multi-category allocation and fast dispatch routing.
              </p>
            </div>
            <div className="text-[10px] text-[#404943] pt-2 border-t border-[#c0c9c2]/30">
              Ideal for plumbing, electrical & gate/grill fabrication contractor teams.
            </div>
          </div>

          {/* Enterprise Crew Plan */}
          <div
            onClick={() => setSelectedPlanId('enterprise')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
              selectedPlanId === 'enterprise'
                ? 'border-[#003523] bg-[#c0edd3]/25 ring-1 ring-[#003523] shadow-xs'
                : 'border-[#c0c9c2]/60 bg-white hover:border-[#003523]/50'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#003523] uppercase tracking-wider">
                  Enterprise Crew Plan
                </span>
                <span className="text-[10px] font-bold bg-[#c0edd3] text-[#003523] px-2 py-0.5 rounded-full">
                  BEST VALUE
                </span>
              </div>
              <div className="text-2xl font-black text-[#131b2e]">₹4,999</div>
              <div className="text-xs font-bold text-[#003523]">30 Qualified Work Opportunities</div>
              <p className="text-[11px] text-[#707973] leading-relaxed">
                45-Day validity · Priority dispatch routing & dedicated cluster coordinator.
              </p>
            </div>
            <div className="text-[10px] text-[#404943] pt-2 border-t border-[#c0c9c2]/30">
              Ideal for renovation, civil, painting & multi-artisan crews.
            </div>
          </div>
        </div>
      </div>

      {/* Application Form */}
      <div className="bg-white p-6 rounded-2xl border border-[#c0c9c2]/50 shadow-xs max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between border-b border-[#c0c9c2]/40 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#131b2e]">
              Apply for Partner Onboarding
            </h3>
            <p className="text-xs text-[#707973]">
              Selected Tier: <strong className="text-[#003523]">{selectedPlan.name} (₹{selectedPlan.price.toLocaleString('en-IN')})</strong>
            </p>
          </div>
          <span className="text-xs font-extrabold text-[#003523] bg-[#c0edd3]/50 px-2.5 py-1 rounded-lg">
            {selectedPlan.totalOpportunities} Leads Included
          </span>
        </div>

        {submitted ? (
          <div className="p-6 text-center space-y-4 bg-[#c0edd3]/25 rounded-2xl border border-[#b6efd1] animate-scaleUp">
            <div className="w-14 h-14 rounded-full bg-[#003523] text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8 text-[#b6efd1]" />
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-base text-[#003523]">Partner Application Submitted Successfully!</h4>
              <p className="text-xs text-[#707973]">
                Your 8-character password has been secured and registered for your mobile number.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Approval Workflow Required:</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                As per standard verification policy, your Vendor Partner profile has been assigned status <strong className="bg-amber-200 px-1.5 py-0.5 rounded text-amber-900">PENDING_VERIFICATION</strong>.
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                The <strong>Operations Manager</strong> must review your trade documents and confirm your application. Once confirmed, the Operations Manager will activate your profile. After activation, you will be able to log in to the Vendor Hub using your mobile number and password.
              </p>
            </div>

            <div className="pt-2 flex justify-center space-x-3">
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="px-4 py-2 rounded-xl border border-[#c0c9c2]/60 hover:bg-white text-xs font-semibold text-[#131b2e]"
              >
                Submit Another Application
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentPage('home');
                }}
                className="px-4 py-2 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold shadow-xs flex items-center space-x-1"
              >
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#131b2e] mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Malwa AC & Cooling"
                  className="w-full p-2.5 rounded-lg border border-[#c0c9c2]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#131b2e] mb-1">Owner / Lead Artisan Name *</label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Jaswinder Singh"
                  className="w-full p-2.5 rounded-lg border border-[#c0c9c2]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#131b2e] mb-1">Mobile (+91) *</label>
                <input
                  type="text"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91 9888X XXXXX"
                  className="w-full p-2.5 rounded-lg border border-[#c0c9c2]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#131b2e] mb-1">Primary Trade Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#c0c9c2] font-semibold"
                >
                  <option>AC & Appliances</option>
                  <option>Electrical</option>
                  <option>Plumbing</option>
                  <option>Carpentry & Handyman</option>
                  <option>Gate & Grill Fabrication</option>
                  <option>Painting & Improvement</option>
                  <option>Home Cleaning</option>
                  <option>Pest Control</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#131b2e] mb-1">Years of Experience in Tricity</label>
              <input
                type="number"
                required
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-[#c0c9c2]"
              />
            </div>

            {/* MANDATORY 8-CHAR STRONG PASSWORD FIELDS */}
            <div className="p-3.5 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#131b2e] flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#003523]" />
                  <span>Set 8-Letter Strong Password (Mandatory)</span>
                </span>
                {password && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    passwordValidation.strengthLabel === 'Strong'
                      ? 'bg-emerald-100 text-emerald-800'
                      : passwordValidation.strengthLabel === 'Medium'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {passwordValidation.strengthLabel}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#404943] mb-1">Password (8+ chars) *</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#c0c9c2] focus:border-[#003523] font-semibold"
                    />
                  </div>
                  <div className="mt-1 text-[10px] flex items-center justify-between">
                    <span className={passwordValidation.lengthOk ? 'text-emerald-700 font-bold' : 'text-red-600 font-semibold'}>
                      {password.length}/8 characters {passwordValidation.lengthOk ? '✓' : '(minimum 8)'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#404943] mb-1">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#c0c9c2] focus:border-[#003523] font-semibold"
                    />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[10px] text-red-600 font-bold mt-1">Passwords do not match</p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>Passwords match</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#faf8ff] border border-[#c0c9c2]/40 text-[11px] text-[#707973]">
              Required for verification: Aadhar card, trade background check, and approval from the Operations Manager.
            </div>

            <button
              type="submit"
              disabled={password.length < 8 || password !== confirmPassword}
              className="w-full py-3 bg-[#003523] hover:bg-[#144d37] disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>Submit Partner Registration with {selectedPlan.name} (₹{selectedPlan.price.toLocaleString('en-IN')})</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
