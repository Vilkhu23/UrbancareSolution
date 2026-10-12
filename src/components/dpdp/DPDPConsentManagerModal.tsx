import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  X,
  Check,
  Sliders,
  PhoneCall,
  Bell,
  Sparkles,
  Lock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const DPDPConsentManagerModal: React.FC = () => {
  const {
    isDPDPConsentManagerOpen,
    setIsDPDPConsentManagerOpen,
    dpdpConsent,
    updateDPDPConsent
  } = useApp();

  const [localPrefs, setLocalPrefs] = useState({
    essentialService: dpdpConsent.essentialService,
    dispatchUpdates: dpdpConsent.dispatchUpdates,
    promotionalMarketing: dpdpConsent.promotionalMarketing,
    callMasking: dpdpConsent.callMasking
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isDPDPConsentManagerOpen) return null;

  const handleSave = () => {
    updateDPDPConsent(localPrefs);
    localStorage.setItem('urbancare_dpdp_banner_ack', 'true');
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsDPDPConsentManagerOpen(false);
    }, 1200);
  };

  const handleWithdrawOptional = () => {
    const updated = {
      essentialService: true,
      dispatchUpdates: false,
      promotionalMarketing: false,
      callMasking: true
    };
    setLocalPrefs(updated);
    updateDPDPConsent(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsDPDPConsentManagerOpen(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-[#c0c9c2]/60 flex flex-col overflow-hidden text-xs">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#002114] text-white flex items-center justify-between border-b border-[#144d37]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#fe932c] text-[#002114] flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5 text-[#002114]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">DPDP Consent Preferences</h2>
              <p className="text-[11px] text-[#b6efd1]">
                Manage Purpose-Bound Processing Consents · Section 6 Digital Personal Data Protection Act
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDPDPConsentManagerOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-[#131b2e]">
          
          <div className="p-3 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/50 text-[11px] text-[#404943] leading-relaxed">
            In compliance with Section 6 of the DPDP Act 2023, consents must be freely given, specific, informed, and capable of withdrawal with equal ease. Adjust your preferences below at any time.
          </div>

          {/* Toggle 1: Essential Service Processing (Mandatory) */}
          <div className="p-3.5 rounded-xl border border-[#003523]/30 bg-[#c0edd3]/15 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xs text-[#003523]">1. Essential Service Fulfillment & Dispatch</span>
                <span className="text-[10px] bg-[#003523] text-white font-bold px-1.5 py-0.2 rounded">
                  Required
                </span>
              </div>
              <p className="text-[11px] text-[#404943] leading-normal">
                Authorizes UrbanCare Solution to process your name, contact number, and address to dispatch verified technicians, test appliance repairs, and manage the 30-day workmanship warranty.
              </p>
            </div>
            <div className="pt-1">
              <input
                type="checkbox"
                checked={true}
                disabled
                className="w-4 h-4 text-[#003523] rounded accent-[#003523] cursor-not-allowed opacity-80"
              />
            </div>
          </div>

          {/* Toggle 2: Phone Privacy & Call Masking */}
          <div className="p-3.5 rounded-xl border border-[#c0c9c2]/60 hover:border-[#003523]/60 transition-colors flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-[#003523]" />
                <span className="font-bold text-xs text-[#131b2e]">2. Technician Phone Privacy & Call Masking</span>
                <span className="text-[10px] bg-[#c0edd3] text-[#003523] font-bold px-1.5 py-0.2 rounded">
                  Privacy Shield
                </span>
              </div>
              <p className="text-[11px] text-[#404943] leading-normal">
                Protects your mobile number by routing technician arrival communications through virtual call bridges or masked relay numbers so the technician does not see your personal number.
              </p>
            </div>
            <div className="pt-1">
              <input
                type="checkbox"
                id="toggle-call-masking"
                checked={localPrefs.callMasking}
                onChange={(e) => setLocalPrefs({ ...localPrefs, callMasking: e.target.checked })}
                className="w-4 h-4 text-[#003523] rounded accent-[#003523] cursor-pointer"
              />
            </div>
          </div>

          {/* Toggle 3: WhatsApp & SMS Dispatch Status Alerts */}
          <div className="p-3.5 rounded-xl border border-[#c0c9c2]/60 hover:border-[#003523]/60 transition-colors flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5">
                <Bell className="w-3.5 h-3.5 text-[#fe932c]" />
                <span className="font-bold text-xs text-[#131b2e]">3. WhatsApp & SMS Live Tracking Alerts</span>
                <span className="text-[10px] bg-[#f2f3ff] text-[#404943] font-semibold px-1.5 py-0.2 rounded">
                  Optional
                </span>
              </div>
              <p className="text-[11px] text-[#404943] leading-normal">
                Receive instant status updates (technician assigned, van en route in Kharar/Mohali, job completion inspection code) via SMS and WhatsApp.
              </p>
            </div>
            <div className="pt-1">
              <input
                type="checkbox"
                id="toggle-dispatch-alerts"
                checked={localPrefs.dispatchUpdates}
                onChange={(e) => setLocalPrefs({ ...localPrefs, dispatchUpdates: e.target.checked })}
                className="w-4 h-4 text-[#003523] rounded accent-[#003523] cursor-pointer"
              />
            </div>
          </div>

          {/* Toggle 4: Promotional Announcements & Seasonal Reminders */}
          <div className="p-3.5 rounded-xl border border-[#c0c9c2]/60 hover:border-[#003523]/60 transition-colors flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#fe932c]" />
                <span className="font-bold text-xs text-[#131b2e]">4. Seasonal Maintenance & Promotional Alerts</span>
                <span className="text-[10px] bg-[#ffdcc3] text-[#904d00] font-bold px-1.5 py-0.2 rounded">
                  Default OFF
                </span>
              </div>
              <p className="text-[11px] text-[#404943] leading-normal">
                Receive seasonal reminders (e.g., pre-summer AC foam jet cleaning discounts, termite monsoon spray alerts). No third-party spam.
              </p>
            </div>
            <div className="pt-1">
              <input
                type="checkbox"
                id="toggle-marketing"
                checked={localPrefs.promotionalMarketing}
                onChange={(e) => setLocalPrefs({ ...localPrefs, promotionalMarketing: e.target.checked })}
                className="w-4 h-4 text-[#003523] rounded accent-[#003523] cursor-pointer"
              />
            </div>
          </div>

          {/* Audit trail indicator */}
          <div className="p-2.5 rounded-lg bg-[#faf8ff] border border-[#c0c9c2]/40 text-[10px] text-[#707973] flex items-center justify-between">
            <span>Active Consent Version: <strong>{dpdpConsent.version}</strong></span>
            <span>Last Updated: {new Date(dpdpConsent.consentedAt).toLocaleDateString()}</span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#faf8ff] border-t border-[#c0c9c2]/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleWithdrawOptional}
            className="w-full sm:w-auto text-[#ba1a1a] hover:underline font-bold text-xs flex items-center justify-center space-x-1 py-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Withdraw Optional Consents</span>
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {savedSuccess ? (
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#003523] bg-[#c0edd3] px-3 py-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-[#003523]" />
                <span>Preferences Saved!</span>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsDPDPConsentManagerOpen(false)}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-[#c0c9c2] text-[#404943] font-semibold hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Preferences</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
