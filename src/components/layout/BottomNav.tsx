import React from 'react';
import { useApp } from '../../context/AppContext';
import { Phone, MessageCircle, ArrowRight } from 'lucide-react';

/**
 * Mobile Sticky Bottom Bar:
 * Provides the required high-conversion action bar on mobile viewports (<768px):
 * [ Call | WhatsApp | Book Now ]
 */
export const BottomNav: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    currentRole
  } = useApp();

  // Hide sticky bottom bar on dedicated staff portals
  if (currentPage === 'admin' || currentPage === 'vendor' || currentPage === 'employee') {
    return null;
  }

  const handleBookNow = () => {
    setCurrentPage('services');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <aside
      aria-label="Mobile quick action bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t border-gray-200/80 px-3 py-2 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex items-center justify-between gap-2 safe-bottom"
    >
      {/* 1. Direct Click-to-Call */}
      <a
        href="tel:+918284018909"
        className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl border border-gray-200 bg-gray-50/80 text-[#0F3D2E] hover:bg-gray-100 active:scale-[0.98] transition-all text-xs font-semibold focus-visible:ring-2 focus-visible:ring-[#0F3D2E] focus-visible:outline-none min-h-[44px]"
        aria-label="Call UrbanCare Support +91 8284018909"
      >
        <Phone className="w-4 h-4 text-[#0F3D2E] shrink-0" />
        <span>Call</span>
      </a>

      {/* 2. Direct Click-to-WhatsApp */}
      <a
        href="https://wa.me/918284018909"
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100 active:scale-[0.98] transition-all text-xs font-semibold focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none min-h-[44px]"
        aria-label="Chat with UrbanCare on WhatsApp"
      >
        <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>WhatsApp</span>
      </a>

      {/* 3. Primary CTA: Book Now */}
      <button
        onClick={handleBookNow}
        className="flex-[1.3] flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-[#F28C28] hover:bg-[#d9771e] active:scale-[0.98] text-white font-bold text-xs shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-[#0F3D2E] focus-visible:outline-none min-h-[44px]"
        aria-label="Book a Service Now"
      >
        <span>Book Now</span>
        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
      </button>
    </aside>
  );
};
