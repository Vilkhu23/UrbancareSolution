import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Phone, MapPin, Mail, ArrowRight, MessageCircle } from 'lucide-react';

/**
 * Redesigned UrbanCare Solution Footer:
 * - Clean 4-column layout: Services, Company, Support, Legal.
 * - Single discrete "Partner Login" link (removed public Staff/Vendor/Admin clutter).
 * - Plain language privacy links ("Privacy Policy", "Manage Consent", "Your Data Rights").
 * - High-contrast text meeting WCAG AA requirements on brand dark green (#0F3D2E).
 * - Clickable phone (tel:), WhatsApp (wa.me), and dispatch email.
 */
export const Footer: React.FC = () => {
  const {
    setCurrentPage,
    setIsAuthModalOpen,
    setIsDPDPNoticeOpen,
    setIsDPDPConsentManagerOpen,
    setIsDPDPDataRightsOpen
  } = useApp();

  return (
    <footer className="bg-[#0F3D2E] text-white pt-12 pb-24 md:pb-12 border-t border-[#1a5742]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Brand & Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-10">
          {/* Brand Info (2 cols on desktop) */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F28C28] text-[#0F3D2E] flex items-center justify-center font-black text-lg shadow-sm">
                U
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight block leading-tight text-white">
                  UrbanCare Solution
                </span>
                <span className="text-xs text-emerald-200 font-medium">
                  Your Space | Our Care
                </span>
              </div>
            </div>

            <p className="text-xs text-emerald-100/90 leading-relaxed max-w-sm">
              Local doorstep home services and repairs managed by our on-ground Kharar team. Background-verified professionals, ₹0 advance payment, and guaranteed 30-day workmanship warranty across Sectors 94 to 111, Mohali.
            </p>

            <div className="space-y-1.5 text-xs text-emerald-100/90 pt-1">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-[#F28C28] shrink-0 mt-0.5" />
                <span>SCF 14, Sector 125, Sunny Enclave, Kharar, Punjab 140301</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-[#F28C28] shrink-0" />
                <a href="tel:+918284018909" className="hover:text-white underline font-medium">
                  +91 82840 18909 (Direct Dispatch)
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-[#F28C28] shrink-0" />
                <a href="mailto:dispatch@urbancaresolution.in" className="hover:text-white underline">
                  dispatch@urbancaresolution.in
                </a>
              </div>
            </div>
          </div>

          {/* Group 1: Services */}
          <div className="space-y-3 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] pb-1 border-b border-emerald-800/60">
              Services
            </h3>
            <ul className="space-y-2 text-emerald-100">
              <li>
                <button
                  onClick={() => setCurrentPage('services')}
                  className="hover:text-white transition-colors text-left"
                >
                  AC Repair & Gas Refill
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('services')}
                  className="hover:text-white transition-colors text-left"
                >
                  Ceiling Fan & Switchboards
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('services')}
                  className="hover:text-white transition-colors text-left"
                >
                  Water Motor & Tap Leakages
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('services')}
                  className="hover:text-white transition-colors text-left"
                >
                  Kitchen & Home Deep Clean
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('services')}
                  className="hover:text-white transition-colors text-left"
                >
                  Carpentry & Door Lock Repairs
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('projects')}
                  className="hover:text-white transition-colors text-left text-[#F28C28] font-semibold flex items-center space-x-1"
                >
                  <span>Home Projects & Kitchens</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </li>
            </ul>
          </div>

          {/* Group 2: Company */}
          <div className="space-y-3 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] pb-1 border-b border-emerald-800/60">
              Company
            </h3>
            <ul className="space-y-2 text-emerald-100">
              <li>
                <button
                  onClick={() => setCurrentPage('about')}
                  className="hover:text-white transition-colors text-left"
                >
                  About UrbanCare
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('how-it-works')}
                  className="hover:text-white transition-colors text-left"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('become-partner')}
                  className="hover:text-white transition-colors text-left"
                >
                  Become a Partner
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('contact')}
                  className="hover:text-white transition-colors text-left"
                >
                  Kharar Operations Center
                </button>
              </li>
              <li className="pt-2">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-emerald-300 hover:text-white text-[11px] font-medium flex items-center space-x-1 underline cursor-pointer"
                >
                  <span>Partner login</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </li>
            </ul>
          </div>

          {/* Group 3: Support & Legal */}
          <div className="space-y-3 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] pb-1 border-b border-emerald-800/60">
              Support & Legal
            </h3>
            <ul className="space-y-2 text-emerald-100">
              <li>
                <a
                  href="https://wa.me/918284018909"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center space-x-1 text-emerald-300 font-semibold"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Support</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+918284018909"
                  className="hover:text-white transition-colors flex items-center space-x-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call +91 82840 18909</span>
                </a>
              </li>
              <li className="pt-1">
                <button
                  onClick={() => setIsDPDPNoticeOpen(true)}
                  className="hover:text-white transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsDPDPConsentManagerOpen(true)}
                  className="hover:text-white transition-colors text-left"
                >
                  Manage Consent
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsDPDPDataRightsOpen(true)}
                  className="hover:text-white transition-colors text-left"
                >
                  Your Data Rights
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Trust Badges */}
        <div className="pt-6 border-t border-emerald-900 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-200/80 gap-3">
          <div className="flex items-center space-x-2">
            <span>© {new Date().getFullYear()} UrbanCare Solution. Your Space | Our Care.</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">Serving Sectors 94–111, Mohali</span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-[#F28C28]" />
            <span>₹0 Advance · 30-Day Workmanship Warranty</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
