import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, MapPin, Users, HeartHandshake, Award } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { setCurrentPage } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-24">
      {/* Header */}
      <div className="bg-[#144d37] text-white rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center space-x-2">
          <span className="bg-[#fe932c] text-[#002114] text-xs font-bold px-2.5 py-0.5 rounded-full inline-block">
            Original Tricity Identity
          </span>
          <span className="bg-white/20 text-[#b6efd1] text-xs font-semibold px-2.5 py-0.5 rounded-full inline-block">
            Your Space | Our Care
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
          UrbanCare Solution: Rooted in Kharar & Mohali
        </h1>
        <p className="text-xs sm:text-sm text-gray-200 max-w-2xl leading-relaxed">
          The rapidly growing residential and institutional corridor across Sectors 94 to 111 (Mohali) deserves authentic, dependable domestic care. We built UrbanCare Solution to solve the trust deficit in home repairs.
        </p>
      </div>

      {/* Core Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#c0c9c2]/50 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#c0edd3] text-[#003523] flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#131b2e]">Operations-Led, Not Blind Tech</h3>
          <p className="text-xs text-[#404943] leading-relaxed">
            Every booking is handled by real dispatch supervisors located in Kharar who understand local Punjabi households, sector roads, and authentic repair costs.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#c0c9c2]/50 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#ffdcc3] text-[#904d00] flex items-center justify-center font-bold">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#131b2e]">Fair to Local Artisans</h3>
          <p className="text-xs text-[#404943] leading-relaxed">
            We don't extract predatory commissions. Technicians subscribe to Qualified Work Opportunities with transparent quota consumption, keeping their pride and craftsmanship intact.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#c0c9c2]/50 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#eaedff] text-[#003523] flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#131b2e]">30-Day Tricity Guarantee</h3>
          <p className="text-xs text-[#404943] leading-relaxed">
            If a leak returns or a switch fails within 30 days, our supervisor re-dispatches an artisan at zero extra visit fee. We take full accountability.
          </p>
        </div>
      </div>

      {/* Local Footprint */}
      <div className="p-6 rounded-2xl bg-white border border-[#c0c9c2]/50 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-[#131b2e]">Neighborhood Coverage Hubs</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-[#faf8ff] border border-[#c0c9c2]/40">
            <div className="font-bold text-[#003523]">Sector 94 (JLPL / Fateh Burj)</div>
            <div className="text-[11px] text-[#707973] mt-0.5">Commercial & Residential Hub</div>
          </div>
          <div className="p-3 rounded-lg bg-[#faf8ff] border border-[#c0c9c2]/40">
            <div className="font-bold text-[#003523]">Sectors 95–99 (GMADA / Wave)</div>
            <div className="text-[11px] text-[#707973] mt-0.5">Planned Residential & Parks</div>
          </div>
          <div className="p-3 rounded-lg bg-[#faf8ff] border border-[#c0c9c2]/40">
            <div className="font-bold text-[#003523]">Sectors 104–109 (Emaar Mohali)</div>
            <div className="text-[11px] text-[#707973] mt-0.5">The Terraces, Views & Villas</div>
          </div>
          <div className="p-3 rounded-lg bg-[#faf8ff] border border-[#c0c9c2]/40">
            <div className="font-bold text-[#003523]">Sectors 110–111 (TDI City)</div>
            <div className="text-[11px] text-[#707973] mt-0.5">Wellington & Connaught Place</div>
          </div>
        </div>
      </div>
    </div>
  );
};
