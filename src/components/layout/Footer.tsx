import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Phone, MapPin, Mail, ArrowRight, Heart, Lock, Sliders, UserCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  const {
    setCurrentPage,
    currentRole,
    setIsAuthModalOpen,
    setIsDPDPNoticeOpen,
    setIsDPDPConsentManagerOpen,
    setIsDPDPDataRightsOpen
  } = useApp();

  return (
    <footer className="bg-[#002114] text-white pt-12 pb-24 md:pb-12 border-t border-[#144d37]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand & Grounded Punjab Mission */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#fe932c] text-[#002114] flex items-center justify-center font-bold text-base">
                U
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight block leading-tight">UrbanCare Solution</span>
                <span className="text-[11px] text-[#b6efd1] font-medium">Your Space | Our Care</span>
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Operations-led local home services and project marketplace for Sectors 94 to 111 (Mohali). Every request manually verified and assigned by our local dispatch team.
            </p>
            <div className="flex items-center space-x-2 text-xs text-[#b6efd1] pt-1">
              <ShieldCheck className="w-4 h-4 text-[#fe932c]" />
              <span>100% Verified Local Artisans · No Blind Dispatch</span>
            </div>
          </div>

          {/* Col 2: Services Directory */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-[#b6efd1] uppercase tracking-wider text-[11px] mb-2">
              Popular Services
            </div>
            <ul className="space-y-1.5 text-gray-300">
              <li>
                <button onClick={() => setCurrentPage('services')} className="hover:text-white transition-colors">
                  AC Foam-Jet & General Service
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('services')} className="hover:text-white transition-colors">
                  Water Motor & Submersible Repair
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('services')} className="hover:text-white transition-colors">
                  Ceiling Fan & MCB Switchboard Wiring
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('services')} className="hover:text-white transition-colors">
                  Kitchen Deep Degreasing & Descaling
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('services')} className="hover:text-white transition-colors">
                  Termite Drill Shield & Pest Care
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('projects')} className="hover:text-white transition-colors">
                  Full Home Renovation & Modular Kitchen
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Company & Operational Governance */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-[#b6efd1] uppercase tracking-wider text-[11px] mb-2">
              Platform & Rules
            </div>
            <ul className="space-y-1.5 text-gray-300">
              <li>
                <button onClick={() => setCurrentPage('how-it-works')} className="hover:text-white transition-colors">
                  Operations Workflow (7-Step Quality Check)
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('become-partner')} className="hover:text-white transition-colors">
                  For Pros: Qualified Work Opportunities Model
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('about')} className="hover:text-white transition-colors">
                  About UrbanCare Solution
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('contact')} className="hover:text-white transition-colors">
                  Kharar Operations Center
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsDPDPNoticeOpen(true)}
                  className="text-[#b6efd1] hover:underline font-semibold flex items-center space-x-1.5"
                >
                  <Lock className="w-3 h-3 text-[#fe932c]" />
                  <span>DPDP Act 2023 Statutory Privacy Notice</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsDPDPConsentManagerOpen(true)}
                  className="hover:text-white transition-colors flex items-center space-x-1.5"
                >
                  <Sliders className="w-3 h-3 text-[#b6efd1]" />
                  <span>Consent Preferences Manager</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsDPDPDataRightsOpen(true)}
                  className="hover:text-white transition-colors flex items-center space-x-1.5"
                >
                  <UserCheck className="w-3 h-3 text-[#b6efd1]" />
                  <span>Data Principal Rights & Nomination (Sec 11-14)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (currentRole === 'employee') {
                      setCurrentPage('employee');
                    } else {
                      setIsAuthModalOpen(true);
                    }
                  }}
                  className="text-[#b6efd1] hover:underline font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <span>Staff Technician Portal (/employee)</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (currentRole === 'vendor') {
                      setCurrentPage('vendor');
                    } else {
                      setIsAuthModalOpen(true);
                    }
                  }}
                  className="text-[#fe932c] hover:underline font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <span>Vendor Partner Portal (/vendor)</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (currentRole === 'operations') {
                      setCurrentPage('admin');
                    } else {
                      setIsAuthModalOpen(true);
                    }
                  }}
                  className="text-gray-300 hover:text-white font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <span>Operations Manager Portal (/admin)</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Local Contact & Hubs */}
          <div className="space-y-3 text-xs">
            <div className="font-bold text-[#b6efd1] uppercase tracking-wider text-[11px] mb-2">
              Kharar Central Hub
            </div>
            <div className="flex items-start space-x-2 text-gray-300">
              <MapPin className="w-4 h-4 text-[#fe932c] shrink-0 mt-0.5" />
              <span>SCF 14, Sector 125, Sunny Enclave, Kharar, Punjab 140301</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Phone className="w-4 h-4 text-[#fe932c] shrink-0" />
              <span>+91 82840 18909 (Tricity Dispatch Line)</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Mail className="w-4 h-4 text-[#fe932c] shrink-0" />
              <span>dispatch@urbancaresolution.in</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#144d37]/40 border border-[#336851]/40 text-[11px] text-gray-200">
              ⚡ Dedicated local dispatch vans active across Sectors 94 to 111 (JLPL, GMADA, Wave Estate, Emaar Mohali Hills & TDI City).
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#144d37] flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-3">
          <div className="flex items-center space-x-2">
            <span>© {new Date().getFullYear()} UrbanCare Solution. Built for Tricity households.</span>
            <span className="hidden sm:inline">·</span>
            <span className="inline-flex items-center space-x-1 text-[#b6efd1] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#fe932c]" />
              <span>DPDP Act 2023 Compliant Data Fiduciary</span>
            </span>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={() => setIsDPDPNoticeOpen(true)}
              className="text-gray-300 hover:text-white underline text-[11px]"
            >
              Privacy Notice
            </button>
            <span>·</span>
            <button
              onClick={() => setIsDPDPConsentManagerOpen(true)}
              className="text-gray-300 hover:text-white underline text-[11px]"
            >
              Consent Manager
            </button>
            <span>·</span>
            <button
              onClick={() => setIsDPDPDataRightsOpen(true)}
              className="text-gray-300 hover:text-white underline text-[11px]"
            >
              Data Rights & DPO
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
