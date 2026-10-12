import React, { useState } from 'react';
import { ServiceItem, PriceType } from '../../types';
import { SERVICE_CATEGORIES } from '../../data/initialData';
import {
  X,
  Plus,
  CheckCircle2,
  Tag,
  Clock,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newService: ServiceItem) => void;
}

export const AddServiceModal: React.FC<AddServiceModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(SERVICE_CATEGORIES[0].name);
  const selectedCatObj = SERVICE_CATEGORIES.find((c) => c.name === category) || SERVICE_CATEGORIES[0];
  const [subcategory, setSubcategory] = useState(selectedCatObj.subcategories[0] || 'General');
  const [description, setDescription] = useState('');
  const [priceType, setPriceType] = useState<PriceType>('FIXED');
  const [basePrice, setBasePrice] = useState<number>(399);
  const [originalPrice, setOriginalPrice] = useState<number>(499);
  const [discount, setDiscount] = useState('20% OFF');
  const [visitFee, setVisitFee] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [duration, setDuration] = useState('45 - 60 mins');
  const [warranty, setWarranty] = useState('30-Day Workmanship Warranty');
  const [materialPolicy, setMaterialPolicy] = useState('Consumables included. Hardware parts charged on MRP.');
  const [includedText, setIncludedText] = useState('Comprehensive inspection\nStandard repair labor\nPost-repair testing');
  const [excludedText, setExcludedText] = useState('Major structural steel replacement\nHigh-rise scaffolding');
  const [badge, setBadge] = useState('New Service');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const catObj = SERVICE_CATEGORIES.find((c) => c.name === newCat);
    if (catObj && catObj.subcategories.length > 0) {
      setSubcategory(catObj.subcategories[0]);
    } else {
      setSubcategory('General');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Service name is required.');
      return;
    }

    const id = `srv-${Date.now()}`;
    const included = includedText.split('\n').map((s) => s.trim()).filter(Boolean);
    const excluded = excludedText.split('\n').map((s) => s.trim()).filter(Boolean);

    const newService: ServiceItem = {
      id,
      name: name.trim(),
      category,
      subcategory,
      description: description.trim() || `Professional ${name} service delivered at your doorstep across Sectors 94 to 111.`,
      base_price: priceType === 'QUOTE_REQUIRED' ? 0 : Number(basePrice),
      original_price: Number(originalPrice) > 0 ? Number(originalPrice) : undefined,
      discount: discount.trim() || undefined,
      visit_fee: Number(visitFee),
      tax: Number(tax),
      price_type: priceType,
      duration,
      warranty,
      material_policy: materialPolicy,
      included_items: included,
      excluded_items: excluded,
      active: true,
      effective_from: new Date().toISOString().split('T')[0],

      // Legacy normalized fields
      basePrice: priceType === 'QUOTE_REQUIRED' ? 0 : Number(basePrice),
      originalPrice: Number(originalPrice) > 0 ? Number(originalPrice) : undefined,
      visitFee: Number(visitFee),
      pricingType: priceType,
      materialPolicy,
      estimatedDuration: duration,
      included,
      excluded,
      badge: badge.trim() || undefined,
      serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
      sortOrder: 30,
      completedBookingsCount: 0,
      rating: 5.0
    };

    onSave(newService);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#c0c9c2]/50 overflow-hidden text-xs">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#002114] text-white flex items-center justify-between border-b border-[#144d37]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#b6efd1] text-[#002114] flex items-center justify-center font-bold">
              <Plus className="w-4 h-4 text-[#003523]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Add New Service to Catalogue</h3>
              <p className="text-[11px] text-[#b6efd1]">
                Publish a new offering across Sectors 94 to 111 (Mohali)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 max-h-[75vh]">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#ffdad6] text-[#ba1a1a] font-bold">
              {errorMsg}
            </div>
          )}

          {/* Service Name & Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-[#131b2e] mb-1">
                Service Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Motorized Sliding Gate Automation"
                className="w-full p-2.5 rounded-xl border border-[#c0c9c2] font-semibold text-xs focus:ring-1 focus:ring-[#003523]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">
                Badge / Tag (Optional)
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Popular, 20% OFF"
                className="w-full p-2.5 rounded-xl border border-[#c0c9c2] font-semibold text-xs focus:ring-1 focus:ring-[#003523]"
              />
            </div>
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#c0c9c2] font-semibold text-xs focus:ring-1 focus:ring-[#003523]"
              >
                {SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">
                Subcategory *
              </label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#c0c9c2] font-semibold text-xs focus:ring-1 focus:ring-[#003523]"
              >
                {selectedCatObj.subcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing Model & Rates */}
          <div className="p-3.5 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/60 space-y-3">
            <span className="font-bold text-[#003523] uppercase tracking-wider text-[11px] block">
              Pricing & Rate Structure
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-[#404943] mb-1">
                  Pricing Type
                </label>
                <select
                  value={priceType}
                  onChange={(e) => setPriceType(e.target.value as PriceType)}
                  className="w-full p-2 rounded-lg border border-[#c0c9c2] font-bold text-xs"
                >
                  <option value="FIXED">FIXED (Standard)</option>
                  <option value="PER_UNIT">PER_UNIT (sq.ft / r.ft)</option>
                  <option value="DIAGNOSTIC">DIAGNOSTIC (Inspect First)</option>
                  <option value="QUOTE_REQUIRED">QUOTE_REQUIRED (Custom BOQ)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#404943] mb-1">
                  Base Price (₹)
                </label>
                <input
                  type="number"
                  disabled={priceType === 'QUOTE_REQUIRED'}
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-[#c0c9c2] font-bold text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#404943] mb-1">
                  Original Price (₹)
                </label>
                <input
                  type="number"
                  disabled={priceType === 'QUOTE_REQUIRED'}
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-[#c0c9c2] text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#404943] mb-1">
                  Doorstep Visit Fee (₹)
                </label>
                <input
                  type="number"
                  value={visitFee}
                  onChange={(e) => setVisitFee(Number(e.target.value))}
                  placeholder="0 for waived"
                  className="w-full p-2 rounded-lg border border-[#c0c9c2] text-xs"
                />
              </div>
            </div>
          </div>

          {/* Duration & Warranty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">
                Estimated Duration
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 45 - 60 mins or 1 - 2 Days"
                className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">
                Workmanship Warranty
              </label>
              <input
                type="text"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                placeholder="e.g. 30-Day Workmanship Warranty"
                className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-[#131b2e] mb-1">
              Short Customer Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain problem solved and scope for customer..."
              className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs"
            />
          </div>

          {/* Inclusions & Material Policy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">
                Included Deliverables (One per line)
              </label>
              <textarea
                rows={3}
                value={includedText}
                onChange={(e) => setIncludedText(e.target.value)}
                placeholder="On-site diagnostics&#10;Consumables included&#10;Final performance check"
                className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">
                Excluded Items (One per line)
              </label>
              <textarea
                rows={3}
                value={excludedText}
                onChange={(e) => setExcludedText(e.target.value)}
                placeholder="Major structural steel&#10;Enamel spray paint"
                className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#131b2e] mb-1">
              Material & Hardware Policy
            </label>
            <input
              type="text"
              value={materialPolicy}
              onChange={(e) => setMaterialPolicy(e.target.value)}
              placeholder="e.g. Includes welding rods and consumables. Hardware charged on MRP."
              className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#c0c9c2]/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#c0c9c2] hover:bg-gray-50 text-[#131b2e] font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-[#fe932c]" />
              <span>Publish Service to Catalogue</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
