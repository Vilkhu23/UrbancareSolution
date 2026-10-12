import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  HardHat,
  Ruler,
  IndianRupee,
  Calendar,
  CheckCircle2,
  Building2,
  MapPin
} from 'lucide-react';

export const ProjectQuoteModal: React.FC = () => {
  const {
    isProjectModalOpen,
    setIsProjectModalOpen,
    currentLocality,
    createProjectRequest
  } = useApp();

  const [projectType, setProjectType] = useState('Modular Kitchen Fabrication');
  const [propertyType, setPropertyType] = useState('Independent Kothi');
  const [approxAreaSqFt, setApproxAreaSqFt] = useState(1200);
  const [budgetRange, setBudgetRange] = useState('Standard Tricity (₹1.5 Lakh - ₹4 Lakh)');
  const [preferredStartDate, setPreferredStartDate] = useState('Within 2 Weeks');
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('Amanjot Sandhu');
  const [customerPhone, setCustomerPhone] = useState('+91 98721 99120');
  const [address, setAddress] = useState('House 412, Sector 125, Sunny Enclave, Kharar');

  if (!isProjectModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProjectRequest({
      customerName,
      customerPhone,
      locality: currentLocality,
      address,
      projectType,
      propertyType,
      approxAreaSqFt,
      budgetRange,
      preferredStartDate,
      description: description || `Project quote request for ${projectType} in ${currentLocality}`
    });

    setIsProjectModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#c0c9c2]/50 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#c0c9c2]/40 bg-[#003523] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#fe932c] text-[#002114] flex items-center justify-center font-bold">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Start a Home Project</h3>
              <p className="text-[11px] text-[#b6efd1]">
                Contractor Quote & Civil Site Measurement in Tricity
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsProjectModalOpen(false)}
            className="p-1 rounded-lg text-gray-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form id="project-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-[#c0edd3]/25 border border-[#b6efd1] text-[#002114]">
            <strong>Free Contractor Site Visit:</strong> A certified civil supervisor from our Kharar central team visits with physical catalog samples and laser distance meter for an accurate estimate.
          </div>

          {/* Project Type */}
          <div>
            <label className="block font-bold text-[#131b2e] mb-1">1. Select Project Type</label>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-[#c0c9c2] font-semibold text-xs"
            >
              <option value="Renovation">Renovation (Complete Flat / Kothi)</option>
              <option value="Interior">Interior (Woodwork, Panelling & Wardrobes)</option>
              <option value="Kitchen">Kitchen (Modular BWP Fabrication)</option>
              <option value="Bathroom">Bathroom (Sanitary & Tile Overhaul)</option>
              <option value="Painting">Painting (Royale & Waterproofing)</option>
              <option value="Flooring">Flooring (Vitrified Slabs & Wooden Planks)</option>
              <option value="False Ceiling">False Ceiling (POP & Profile Lighting)</option>
              <option value="Electrical">Electrical (Concealed Rewiring & Automation)</option>
              <option value="Plumbing">Plumbing (Water Pipelines & Tanks)</option>
              <option value="Construction">Construction (Civil Masonry & Extensions)</option>
              <option value="Turnkey">Turnkey (End-to-End Civil Handover)</option>
            </select>
          </div>

          {/* Property Type & Area */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">Property Type</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#c0c9c2] text-xs font-semibold"
              >
                <option>Independent Kothi</option>
                <option>Builder Floor (2BHK/3BHK)</option>
                <option>Society High-Rise Flat</option>
                <option>Commercial Booth / SCO</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">Approx Carpet Area (Sq.Ft)</label>
              <input
                type="number"
                required
                value={approxAreaSqFt}
                onChange={(e) => setApproxAreaSqFt(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-[#c0c9c2] text-xs font-semibold"
              />
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <label className="block font-bold text-[#131b2e] mb-1">Estimated Budget Bracket</label>
            <select
              value={budgetRange}
              onChange={(e) => setBudgetRange(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-[#c0c9c2] text-xs font-semibold"
            >
              <option>Economy (₹50,000 - ₹1.5 Lakh)</option>
              <option>Standard Tricity (₹1.5 Lakh - ₹4 Lakh)</option>
              <option>Premium Architectural (₹4 Lakh - ₹10 Lakh+)</option>
              <option>Custom Budget / Flexible</option>
            </select>
          </div>

          {/* Preferred Start Date */}
          <div>
            <label className="block font-bold text-[#131b2e] mb-1">Preferred Timeline</label>
            <select
              value={preferredStartDate}
              onChange={(e) => setPreferredStartDate(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-[#c0c9c2] text-xs font-semibold"
            >
              <option>Immediately / Within 1 Week</option>
              <option>Within 2 Weeks</option>
              <option>Next Month</option>
              <option>Exploring Cost Estimates Only</option>
            </select>
          </div>

          {/* Project Details */}
          <div>
            <label className="block font-bold text-[#131b2e] mb-1">Scope & Material Notes</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Seeking acrylic finish cabinets with tandem boxes, quartz countertop, and chimney ducting."
              className="w-full p-2.5 rounded-lg border border-[#c0c9c2] text-xs"
            />
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">Contact Name</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-2 rounded-lg border border-[#c0c9c2]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">Mobile (+91)</label>
              <input
                type="text"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full p-2 rounded-lg border border-[#c0c9c2]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#131b2e] mb-1">Site Address in Tricity</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2 rounded-lg border border-[#c0c9c2]"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-[#c0c9c2]/40 bg-[#faf8ff] flex items-center justify-between">
          <div className="text-[11px] text-[#707973]">
            Site visit is completely free & non-binding
          </div>
          <button
            form="project-form"
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs shadow-md active:scale-98 transition-all flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-[#fe932c]" />
            <span>Request Project Quote</span>
          </button>
        </div>
      </div>
    </div>
  );
};
