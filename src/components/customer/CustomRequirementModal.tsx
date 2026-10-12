import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  FileQuestion,
  Upload,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

export const CustomRequirementModal: React.FC = () => {
  const {
    isCustomTaskModalOpen,
    setIsCustomTaskModalOpen,
    currentLocality,
    createCustomRequirement
  } = useApp();

  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('Amanjot Sandhu');
  const [customerPhone, setCustomerPhone] = useState('+91 98721 99120');
  const [address, setAddress] = useState('House 412, Sector 125, Sunny Enclave, Kharar');
  const [category, setCategory] = useState('Electrical / Lighting');
  const [preferredDate, setPreferredDate] = useState('Today');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('2:00 PM - 4:00 PM');
  const [photoUploaded, setPhotoUploaded] = useState(false);

  if (!isCustomTaskModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    createCustomRequirement({
      customerName,
      customerPhone,
      locality: currentLocality,
      address,
      requirementText: description,
      preferredDate,
      preferredTimeSlot,
      category
    });

    setIsCustomTaskModalOpen(false);
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#c0c9c2]/50 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#c0c9c2]/40 bg-[#faf8ff] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#ffdcc3] text-[#904d00] flex items-center justify-center font-bold">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#131b2e]">Post Your Requirement</h3>
              <p className="text-[11px] text-[#707973]">Can't find your problem in standard catalog?</p>
            </div>
          </div>
          <button
            onClick={() => setIsCustomTaskModalOpen(false)}
            className="p-1 rounded-lg text-[#707973] hover:text-[#131b2e] hover:bg-[#eaedff]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form id="custom-task-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-[#f2f3ff] border border-[#c0c9c2]/40 text-[#404943] flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-[#003523] shrink-0 mt-0.5" />
            <span>
              <strong>Operations Review:</strong> Our Kharar dispatcher will read your requirement, verify suitable tools, and call you back with a verified local technician.
            </span>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-[#131b2e] mb-1">
              Describe Your Specific Breakdown or Task
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., I need to install 4 ceiling fans and 8 LED downlights in my new flat, plus check earthing in switchboard."
              className="w-full p-2.5 rounded-lg border border-[#c0c9c2] focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
            />
          </div>

          {/* Category */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">Suspected Trade</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 rounded-lg border border-[#c0c9c2] font-semibold"
              >
                <option>Electrical / Lighting</option>
                <option>Plumbing & Sanitary</option>
                <option>Carpentry & Door Fitting</option>
                <option>Water Motor & Submersible</option>
                <option>Appliance Breakdown</option>
                <option>Masonry & Civil Fix</option>
                <option>Other Domestic Work</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">Locality Hub</label>
              <input
                type="text"
                disabled
                value={currentLocality}
                className="w-full p-2 rounded-lg border border-[#c0c9c2] bg-gray-50 text-gray-600 font-semibold"
              />
            </div>
          </div>

          {/* Photos Upload Mock */}
          <div>
            <label className="block font-bold text-[#131b2e] mb-1">
              Upload Breakdown Photo (Optional)
            </label>
            <div
              onClick={() => setPhotoUploaded(!photoUploaded)}
              className="border-2 border-dashed border-[#c0c9c2] hover:border-[#003523] rounded-xl p-4 text-center cursor-pointer transition-colors bg-[#faf8ff]"
            >
              <Upload className="w-6 h-6 mx-auto text-[#707973] mb-1" />
              <span className="font-semibold text-xs text-[#131b2e] block">
                {photoUploaded ? '✓ 1 Photo attached (switchboard_breakdown.jpg)' : 'Tap to attach photo of problem'}
              </span>
              <span className="text-[10px] text-[#707973]">
                Helps technician arrive with the right spare parts
              </span>
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">Your Name</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-2 rounded-lg border border-[#c0c9c2]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">Contact Phone</label>
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
            <label className="block font-bold text-[#131b2e] mb-1">House / Building Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2 rounded-lg border border-[#c0c9c2]"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">Preferred Date</label>
              <select
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full p-2 rounded-lg border border-[#c0c9c2]"
              >
                <option value="Today">Today</option>
                <option value="Tomorrow">Tomorrow</option>
                <option value="This Weekend">This Weekend</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">Preferred Slot</label>
              <select
                value={preferredTimeSlot}
                onChange={(e) => setPreferredTimeSlot(e.target.value)}
                className="w-full p-2 rounded-lg border border-[#c0c9c2]"
              >
                <option value="9:00 AM - 11:00 AM">Morning (9 AM - 11 AM)</option>
                <option value="2:00 PM - 4:00 PM">Afternoon (2 PM - 4 PM)</option>
                <option value="4:00 PM - 6:00 PM">Evening (4 PM - 6 PM)</option>
              </select>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-[#c0c9c2]/40 bg-[#faf8ff] flex items-center justify-between">
          <div className="text-[11px] text-[#707973]">
            Standard ₹99 diagnostic visit fee applicable
          </div>
          <button
            form="custom-task-form"
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs shadow-md active:scale-98 transition-all flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-[#fe932c]" />
            <span>Submit for Review</span>
          </button>
        </div>
      </div>
    </div>
  );
};
