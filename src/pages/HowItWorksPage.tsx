import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  CheckCircle2,
  Users,
  Eye,
  FileCheck,
  Wrench,
  ThumbsUp,
  ArrowRight
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const { setCurrentPage } = useApp();

  const steps = [
    {
      step: '01',
      title: 'Customer Submits Request',
      desc: 'Pick standard verified services from our catalogue, post a custom breakdown problem, or request a full project quote with your preferred time slot.'
    },
    {
      step: '02',
      title: 'Operations Manual Review',
      desc: 'Our central dispatch team in Sunny Enclave reviews the booking. We verify coverage, clarify breakdown nuances, and inspect technician tool requirements.'
    },
    {
      step: '03',
      title: 'Manual Technician Assignment',
      desc: 'NO BLIND ALGORITHMS. We explicitly assign either a direct company employee or a registered local artisan with active quota and verified skills in your sector.'
    },
    {
      step: '04',
      title: 'Technician Arrives On-Site',
      desc: 'Artisan arrives at your home in Kharar/Mohali equipped with safety gear, branded diagnostic tools, and authentic spare parts with MRP billing.'
    },
    {
      step: '05',
      title: 'Work Execution & Testing',
      desc: 'Diagnostics and repairs are completed with high craftsmanship standards. Performance is verified with test instruments (pressure gauges, multimeters, flow tests).'
    },
    {
      step: '06',
      title: 'Transparent Invoice & Payment',
      desc: 'Pay strictly after complete satisfaction via Cash or UPI. No advance payments for standard household repairs.'
    },
    {
      step: '07',
      title: 'Customer Review & Warranty Activation',
      desc: 'Your feedback is recorded on the artisan’s ledger. UrbanCare Solution 30-Day Workmanship Guarantee activates automatically.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10 pb-24">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold text-[#003523] bg-[#c0edd3]/30 px-3 py-1 rounded-full uppercase tracking-wider">
          Operations-Led Architecture
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#131b2e] tracking-tight">
          How UrbanCare Solution Works
        </h1>
        <p className="text-xs sm:text-sm text-[#404943] leading-relaxed">
          Why we strictly reject automated gig matching in favor of central human dispatch supervision for Kharar, Mohali, and Landran.
        </p>
      </div>

      {/* Comparison: Why Operations-Led > Blind Gig Matching */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-[#ffdad6]/20 border border-[#ba1a1a]/30 space-y-3">
          <div className="flex items-center space-x-2 text-[#ba1a1a] font-bold text-sm">
            <span>✕ The Generic Gig Economy Model</span>
          </div>
          <ul className="space-y-2 text-xs text-[#404943]">
            <li className="flex items-start space-x-2">
              <span className="text-[#ba1a1a] font-bold">•</span>
              <span>Blind algorithms broadcast jobs to random phones; technicians reject jobs repeatedly.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#ba1a1a] font-bold">•</span>
              <span>Unknown sub-contractors show up without proper ladders, pumps, or vacuum tools.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#ba1a1a] font-bold">•</span>
              <span>Inflated spare parts prices with zero supervisor oversight.</span>
            </li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-[#c0edd3]/30 border border-[#144d37]/30 space-y-3">
          <div className="flex items-center space-x-2 text-[#003523] font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-[#003523]" />
            <span>✓ The UrbanCare Solution Operations-Led Standard</span>
          </div>
          <ul className="space-y-2 text-xs text-[#131b2e]">
            <li className="flex items-start space-x-2">
              <span className="text-[#003523] font-bold">•</span>
              <span>Every request reviewed by local dispatch officers who know Kharar and Mohali sectors.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#003523] font-bold">•</span>
              <span>Technicians are individually vetted, allocated, and accountable on their ledger.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-[#003523] font-bold">•</span>
              <span>Fixed doorstep inspection fee (₹99) and retail shop MRP bills for all hardware.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 7-Step Progression Pipeline */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-[#131b2e] text-center">
          The 7-Step Service Lifecycle
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((item) => (
            <div
              key={item.step}
              className="bg-white p-5 rounded-2xl border border-[#c0c9c2]/50 shadow-xs space-y-2 hover:border-[#003523] transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-[#003523] text-white flex items-center justify-center font-bold text-xs">
                {item.step}
              </div>
              <h3 className="text-sm font-bold text-[#131b2e]">{item.title}</h3>
              <p className="text-xs text-[#404943] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Box */}
      <div className="bg-[#faf8ff] border border-[#c0c9c2]/60 rounded-2xl p-6 text-center space-y-3 max-w-xl mx-auto">
        <h3 className="text-base font-bold text-[#131b2e]">Ready to experience dependable home care?</h3>
        <p className="text-xs text-[#707973]">
          Book a verified local technician in Kharar or Mohali right now.
        </p>
        <button
          onClick={() => setCurrentPage('services')}
          className="px-6 py-3 rounded-xl bg-[#003523] text-white text-xs font-bold hover:bg-[#144d37] shadow-sm inline-flex items-center space-x-2"
        >
          <span>Browse All Services</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
