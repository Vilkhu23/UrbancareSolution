import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, ChevronRight, X, Lock } from 'lucide-react';

export const DPDPConsentBanner: React.FC = () => {
  const {
    dpdpConsent,
    updateDPDPConsent,
    setIsDPDPNoticeOpen,
    setIsDPDPConsentManagerOpen
  } = useApp();

  const [hasAcknowledged, setHasAcknowledged] = useState<boolean>(true);

  useEffect(() => {
    const saved = localStorage.getItem('urbancare_dpdp_banner_ack');
    if (!saved) {
      setHasAcknowledged(false);
    }
  }, []);

  const handleAcceptEssential = () => {
    updateDPDPConsent({
      essentialService: true,
      dispatchUpdates: true,
      promotionalMarketing: false,
      callMasking: true
    });
    localStorage.setItem('urbancare_dpdp_banner_ack', 'true');
    setHasAcknowledged(true);
  };

  const handleOpenPreferences = () => {
    setIsDPDPConsentManagerOpen(true);
  };

  if (hasAcknowledged) return null;

  return (
    <aside aria-label="DPDP privacy consent notice" className="fixed bottom-16 md:bottom-4 left-3 right-3 md:left-6 md:right-auto md:max-w-xl z-40 bg-[#131b2e] text-white rounded-2xl p-4 shadow-2xl border border-white/10 animate-slideUp">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-[#b6efd1] text-[#002114] flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4 text-[#003523]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-extrabold text-xs text-white">DPDP Act 2023 Compliant</h4>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#fe932c] text-[#002114]">
                Kharar & Mohali
              </span>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              UrbanCare Solution collects your contact and doorstep location exclusively to dispatch verified technicians and honor your 30-day workmanship warranty. You retain full statutory rights to access, correct, or erase your data.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.setItem('urbancare_dpdp_banner_ack', 'true');
            setHasAcknowledged(true);
          }}
          className="text-gray-400 hover:text-white p-1 rounded-lg"
          title="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
        <button
          onClick={() => setIsDPDPNoticeOpen(true)}
          className="text-[11px] text-[#b6efd1] hover:underline flex items-center space-x-0.5 font-semibold"
        >
          <span>Read Section 5 Notice</span>
          <ChevronRight className="w-3 h-3" />
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenPreferences}
            className="px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-white text-[11px] font-bold transition-all"
          >
            Customize
          </button>
          <button
            onClick={handleAcceptEssential}
            className="px-3.5 py-1.5 rounded-lg bg-[#b6efd1] hover:bg-[#85bda1] text-[#002114] text-[11px] font-bold shadow-xs transition-all flex items-center space-x-1"
          >
            <span>Accept Necessary</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
