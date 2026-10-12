import React from 'react';
import { useApp } from '../context/AppContext';
import {
  HardHat,
  Ruler,
  Layers,
  Paintbrush,
  Home,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  Wrench,
  Zap,
  Droplets,
  Phone,
  Sparkles,
  Hammer
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { setIsProjectModalOpen, projectRequests, currentLocality } = useApp();

  const projectCategories = [
    {
      title: 'Renovation',
      desc: 'Complete architectural remodeling for flats and kothis across Kharar, Sunny Enclave, and Mohali.',
      bracket: '₹1.5L - ₹8.5L',
      unit: 'Custom BOQ',
      icon: <Home className="w-5 h-5 text-[#003523]" />
    },
    {
      title: 'Interior',
      desc: 'Wardrobes, TV consoles, panelling, and bespoke space planning with high-gloss/acrylic laminates.',
      bracket: '₹85,000 - ₹4.5L',
      unit: 'Architectural Specs',
      icon: <Layers className="w-5 h-5 text-[#904d00]" />
    },
    {
      title: 'Kitchen',
      desc: 'Modular kitchens with soft-close tandem boxes, moisture-proof BWP ply, and granite/quartz tops.',
      bracket: '₹95,000 - ₹3.8L',
      unit: 'Hardware MRP Billing',
      icon: <Sparkles className="w-5 h-5 text-[#003523]" />
    },
    {
      title: 'Bathroom',
      desc: 'Complete sanitary remodels, anti-skid floor tiles, concealed diverters, and glass shower enclosures.',
      bracket: '₹40,000 - ₹1.8L',
      unit: 'Per Bathroom',
      icon: <Wrench className="w-5 h-5 text-[#003523]" />
    },
    {
      title: 'Painting',
      desc: 'Asian Paints Royale, tractor emulsion, exterior damp-proof coatings, and high-finish wood polish.',
      bracket: '₹14 - ₹32 / sq.ft',
      unit: 'Laser Measured',
      icon: <Paintbrush className="w-5 h-5 text-[#904d00]" />
    },
    {
      title: 'Flooring',
      desc: 'Vitrified 4x2 slabs, wooden laminate planks, designer granite stairs, and Italian marble polishing.',
      bracket: '₹35 - ₹95 / sq.ft',
      unit: 'Material + Labor',
      icon: <Building className="w-5 h-5 text-[#003523]" />
    },
    {
      title: 'False Ceiling',
      desc: 'Gypsum board, POP channel framing, cove ambient lighting, and magnetic profile lighting channels.',
      bracket: '₹75 - ₹125 / sq.ft',
      unit: 'Standard Channel',
      icon: <Ruler className="w-5 h-5 text-[#904d00]" />
    },
    {
      title: 'Electrical',
      desc: 'Full kothi rewiring, distribution boards, concealed conduit channels, and smart home switches.',
      bracket: '₹25,000 - ₹1.5L',
      unit: 'Point & Conduit Basis',
      icon: <Zap className="w-5 h-5 text-[#904d00]" />
    },
    {
      title: 'Plumbing',
      desc: 'Overhead tank pipelines, CPVC concealed lines, water pressure pumps, and drainage line overhaul.',
      bracket: '₹15,000 - ₹85,000',
      unit: 'Pressure Tested',
      icon: <Droplets className="w-5 h-5 text-[#003523]" />
    },
    {
      title: 'Construction',
      desc: 'Room extensions, boundary walls, mumty construction, and structural civil masonry.',
      bracket: '₹1,200 - ₹1,750 / sq.ft',
      unit: 'Civil Structure',
      icon: <HardHat className="w-5 h-5 text-[#003523]" />
    },
    {
      title: 'Turnkey',
      desc: 'End-to-end design, material procurement, supervisor management, and turnkey handover.',
      bracket: '₹3.5L - ₹15L+',
      unit: 'Full Milestones',
      icon: <ShieldCheck className="w-5 h-5 text-[#003523]" />
    },
    {
      title: 'Gate & Grill Fabrication',
      desc: 'Bespoke main boundary gates, MS balcony safety grills, SS 304 railings, laser-cut CNC panels & boundary fencing.',
      bracket: '₹180 - ₹480 / sq.ft',
      unit: 'Custom Fabrication',
      icon: <Hammer className="w-5 h-5 text-[#904d00]" />
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 pb-24">
      {/* Hero Header */}
      <div className="bg-[#144d37] text-white rounded-xl p-6 sm:p-8 space-y-4 border border-[#336851]/40 shadow-xs">
        <div className="flex items-center space-x-2 text-xs">
          <span className="bg-[#fe932c] text-[#002114] font-bold px-2.5 py-0.5 rounded-full inline-block uppercase text-[10px] tracking-wide">
            Kharar Central Operations Hub
          </span>
          <span className="text-gray-200">· Civil Site Measurement & Milestone Delivery</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
          Home Projects & Renovation in Kharar & Mohali
        </h1>
        <p className="text-xs sm:text-sm text-gray-200 max-w-2xl leading-relaxed">
          Unlike quick repairs, complex home improvements require physical site inspection, itemized Bill of Quantities (BOQ), and dedicated supervisor oversight. Our Kharar civil team manages every stage with transparent milestone payments.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="bg-[#fe932c] hover:bg-[#e07f24] text-[#002114] font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl shadow-md active:scale-98 transition-all inline-flex items-center space-x-2"
          >
            <HardHat className="w-4 h-4" />
            <span>Request Free Site Visit & Quote</span>
          </button>
          <a
            href="tel:+918284018909"
            className="px-4 py-3 rounded-xl border border-white/30 text-white text-xs font-semibold hover:bg-white/10 transition-all flex items-center space-x-1.5"
          >
            <Phone className="w-3.5 h-3.5 text-[#fe932c]" />
            <span>Call Civil Supervisor: +91 82840 18909</span>
          </a>
        </div>
      </div>

      {/* 11 Project Categories Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#131b2e]">
              Project Categories ({projectCategories.length})
            </h2>
            <p className="text-xs text-[#707973]">
              Select a category to view typical rates or request an on-site estimate
            </p>
          </div>
          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="text-xs font-bold text-[#003523] hover:underline"
          >
            Open Project Form →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectCategories.map((cat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-[#c0c9c2]/60 p-5 space-y-3 hover:border-[#003523] transition-all flex flex-col justify-between shadow-xs group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-[#faf8ff] border border-[#c0c9c2]/40 flex items-center justify-center">
                    {cat.icon}
                  </div>
                  <span className="text-[10px] font-bold text-[#707973] uppercase tracking-wider">
                    {cat.unit}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#131b2e] group-hover:text-[#003523] transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-[#404943] leading-relaxed">{cat.desc}</p>
              </div>

              <div className="pt-3 border-t border-[#c0c9c2]/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#707973] block">Typical Bracket</span>
                  <span className="text-xs font-extrabold text-[#003523]">{cat.bracket}</span>
                </div>
                <button
                  onClick={() => setIsProjectModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#003523] text-white text-xs font-bold hover:bg-[#144d37] transition-all"
                >
                  Get Quote
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4-Step Project Delivery Model */}
      <div className="p-6 rounded-xl bg-white border border-[#c0c9c2]/60 space-y-4 shadow-xs">
        <h3 className="text-lg font-bold text-[#131b2e]">
          How Our Operations Team Delivers Your Home Project
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-[#faf8ff] border border-[#c0c9c2]/40 space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-[#003523] text-white flex items-center justify-center font-bold">1</div>
            <div className="font-bold text-[#131b2e]">Requirement Submission</div>
            <p className="text-[#404943]">Share property type, approx carpet area, and desired budget bracket.</p>
          </div>
          <div className="p-3.5 rounded-lg bg-[#faf8ff] border border-[#c0c9c2]/40 space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-[#003523] text-white flex items-center justify-center font-bold">2</div>
            <div className="font-bold text-[#131b2e]">Civil Site Visit</div>
            <p className="text-[#404943]">A Kharar supervisor visits with laser distance meter and material catalogues.</p>
          </div>
          <div className="p-3.5 rounded-lg bg-[#faf8ff] border border-[#c0c9c2]/40 space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-[#003523] text-white flex items-center justify-center font-bold">3</div>
            <div className="font-bold text-[#131b2e]">Detailed BOQ & Quotation</div>
            <p className="text-[#404943]">Receive itemized brand specifications, stage milestones, and transparent pricing.</p>
          </div>
          <div className="p-3.5 rounded-lg bg-[#faf8ff] border border-[#c0c9c2]/40 space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-[#003523] text-white flex items-center justify-center font-bold">4</div>
            <div className="font-bold text-[#131b2e]">Milestone-Based Delivery</div>
            <p className="text-[#404943]">Payment released strictly in staged milestones after civil inspection.</p>
          </div>
        </div>
      </div>

      {/* Active Project Requests Stream */}
      {projectRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-[#131b2e]">
            Live Tricity Projects Under Operations Supervision ({projectRequests.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {projectRequests.map((prj) => (
              <div
                key={prj.id}
                className="p-4 rounded-xl bg-white border border-[#c0c9c2]/50 shadow-xs space-y-2 text-xs"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-[#707973]">{prj.id}</span>
                    <h4 className="font-bold text-sm text-[#131b2e]">{prj.projectType}</h4>
                    <div className="text-[#003523] font-semibold">{prj.locality} · {prj.propertyType}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#e2e7ff] text-[#003523]">
                    {prj.status}
                  </span>
                </div>
                <p className="text-[#404943] text-[11px]">{prj.description}</p>
                <div className="text-[11px] text-[#707973] pt-1 border-t border-[#c0c9c2]/40 flex justify-between">
                  <span>Budget: {prj.budgetRange}</span>
                  <span>Supervisor: {prj.assignedSupervisor || 'Under Review'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
