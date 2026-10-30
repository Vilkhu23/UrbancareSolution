import React, { useState, useEffect } from 'react';
import { ServicePackage } from '../../types';
import { SERVICE_CATEGORIES, LOCALITIES } from '../../data/initialData';
import {
  X,
  Plus,
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  AlertCircle,
  Check,
  Tag,
  DollarSign
} from 'lucide-react';

interface AddPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newPackage: ServicePackage) => void;
}

export const AddPackageModal: React.FC<AddPackageModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(SERVICE_CATEGORIES[0].name);
  const selectedCatObj = SERVICE_CATEGORIES.find((c) => c.name === category) || SERVICE_CATEGORIES[0];
  const [subcategory, setSubcategory] = useState(selectedCatObj.subcategories[0] || 'Combo Package');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(1299);
  const [originalPrice, setOriginalPrice] = useState<number>(1699);
  const [customSavings, setCustomSavings] = useState('');
  const [isCustomSavings, setIsCustomSavings] = useState(false);
  const [duration, setDuration] = useState('90 - 120 mins');
  const [includedText, setIncludedText] = useState(
    'Comprehensive multi-point diagnostic inspection\nSpecialized chemical foaming wash\nPressure coil cleaning & filter sterilization\nZero doorstep visit fee'
  );
  const [selectedAreas, setSelectedAreas] = useState<string[]>([
    'Sector 94',
    'Sector 104',
    'Sector 105',
    'Sector 110',
    'Sector 111'
  ]);
  const [active, setActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-calculated savings text
  const calculatedSavings =
    originalPrice > price
      ? `Save ₹${originalPrice - price} (${Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF) · Zero Visit Fee`
      : 'Special Multi-Unit Bundle · Zero Visit Fee';

  const effectiveSavings = isCustomSavings && customSavings.trim() ? customSavings.trim() : calculatedSavings;

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const catObj = SERVICE_CATEGORIES.find((c) => c.name === newCat);
    if (catObj && catObj.subcategories.length > 0) {
      setSubcategory(catObj.subcategories[0]);
    } else {
      setSubcategory('Combo Package');
    }
  };

  const resetForm = () => {
    setName('');
    setCategory(SERVICE_CATEGORIES[0].name);
    setSubcategory(SERVICE_CATEGORIES[0].subcategories[0] || 'Combo Package');
    setDescription('');
    setPrice(1299);
    setOriginalPrice(1699);
    setCustomSavings('');
    setIsCustomSavings(false);
    setDuration('90 - 120 mins');
    setIncludedText(
      'Comprehensive multi-point diagnostic inspection\nSpecialized chemical foaming wash\nPressure coil cleaning & filter sterilization\nZero doorstep visit fee'
    );
    setSelectedAreas(['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111']);
    setActive(true);
    setErrorMsg(null);
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Package bundle name is required.');
      return;
    }
    if (Number(price) <= 0) {
      setErrorMsg('Package price must be greater than ₹0.');
      return;
    }

    const includedItems = includedText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (includedItems.length === 0) {
      setErrorMsg('Please specify at least one included service/deliverable.');
      return;
    }

    const catSlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newPkg: ServicePackage = {
      id: `pkg-${Date.now()}`,
      name: name.trim(),
      category,
      category_id: catSlug,
      subcategory,
      description:
        description.trim() ||
        `${name.trim()} combo bundle with bulk household discounts and guaranteed zero doorstep visit fees across Mohali and Kharar.`,
      price: Number(price),
      originalPrice: Number(originalPrice) > 0 ? Number(originalPrice) : Number(price),
      savings: effectiveSavings,
      duration: duration.trim() || '90 - 120 mins',
      included: includedItems,
      serviceAreas: selectedAreas.length > 0 ? selectedAreas : ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
      active,
      pricingType: 'fixed',
      rating: 5.0
    };

    onSave(newPkg);
    resetForm();
    onClose();
  };

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const selectAllAreas = () => {
    if (selectedAreas.length === LOCALITIES.length) {
      setSelectedAreas([]);
    } else {
      setSelectedAreas([...LOCALITIES]);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#c0c9c2]/50 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#c0c9c2]/40 bg-[#003523] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fe932c] text-black flex items-center justify-center font-black shadow-md">
              <Package className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Create Care Package / Multi-Unit Bundle
                </h2>
                <span className="text-[10px] bg-white/20 text-[#fe932c] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Catalog Manager
                </span>
              </div>
              <p className="text-xs text-[#b6efd1] mt-0.5">
                Seasonal multi-room combos, bulk discounts & zero doorstep visit fee packages
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="add-package-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs bg-[#faf8ff]"
        >
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Bundle Identification */}
          <div className="bg-white rounded-2xl p-4 border border-[#c0c9c2]/50 shadow-xs space-y-3.5">
            <div className="font-black text-[#003523] uppercase text-[11px] tracking-wider flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-[#fe932c]" />
              <span>1. Bundle Identification</span>
            </div>

            <div>
              <label className="block text-[#131b2e] font-bold mb-1">
                Bundle / Package Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 2 AC Foam-Jet Package, 3-BHK Wiring & Switchboard Overhaul"
                className="w-full p-2.5 rounded-xl border border-[#c0c9c2] font-semibold text-xs text-[#131b2e] focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#131b2e] font-bold mb-1">Service Category</label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#c0c9c2] font-semibold text-xs bg-white text-[#131b2e] focus:border-[#003523]"
                >
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#131b2e] font-bold mb-1">Subcategory / Type</label>
                <input
                  type="text"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="e.g. Multi-Unit Bundle, Seasonal Care"
                  className="w-full p-2.5 rounded-xl border border-[#c0c9c2] font-semibold text-xs text-[#131b2e] focus:border-[#003523]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#131b2e] font-bold mb-1">Marketing Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the scope and why this combo package offers unmatched savings for residents..."
                className="w-full p-2.5 rounded-xl border border-[#c0c9c2] font-medium text-xs text-[#131b2e] focus:border-[#003523] resize-none"
              />
            </div>
          </div>

          {/* Section 2: Pricing, MRP & Savings Engine */}
          <div className="bg-white rounded-2xl p-4 border border-[#c0c9c2]/50 shadow-xs space-y-3.5">
            <div className="font-black text-[#003523] uppercase text-[11px] tracking-wider flex items-center space-x-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#fe932c]" />
              <span>2. Pricing & Savings Calculations</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#131b2e] font-bold mb-1">
                  Package Offer Price (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-[#707973]">₹</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-[#c0c9c2] font-black text-xs text-[#003523] focus:border-[#003523]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#131b2e] font-bold mb-1">Original Retail Total (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-[#707973]">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-[#c0c9c2] font-bold text-xs text-[#707973] focus:border-[#003523]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#131b2e] font-bold mb-1">Estimated Duration</label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 absolute left-3 top-3 text-[#707973]" />
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 90 - 120 mins"
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-[#c0c9c2] font-medium text-xs text-[#131b2e] focus:border-[#003523]"
                  />
                </div>
              </div>
            </div>

            {/* Savings Tag */}
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#003523] text-xs">Customer Savings Badge:</span>
                <button
                  type="button"
                  onClick={() => setIsCustomSavings(!isCustomSavings)}
                  className="text-[11px] font-bold text-[#fe932c] hover:underline"
                >
                  {isCustomSavings ? 'Auto-calculate' : 'Customize Tag'}
                </button>
              </div>

              {isCustomSavings ? (
                <input
                  type="text"
                  value={customSavings}
                  onChange={(e) => setCustomSavings(e.target.value)}
                  placeholder={calculatedSavings}
                  className="w-full p-2 bg-white rounded-lg border border-emerald-300 font-bold text-xs text-[#003523]"
                />
              ) : (
                <div className="font-black text-xs text-[#003523] flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#fe932c]" />
                  <span>{calculatedSavings}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Included Features & Deliverables */}
          <div className="bg-white rounded-2xl p-4 border border-[#c0c9c2]/50 shadow-xs space-y-3">
            <div className="font-black text-[#003523] uppercase text-[11px] tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#003523]" />
              <span>3. Included Scope & Checklist (One item per line)</span>
            </div>

            <textarea
              rows={4}
              value={includedText}
              onChange={(e) => setIncludedText(e.target.value)}
              placeholder="Enter bulleted items included in this bundle (one per line)..."
              className="w-full p-2.5 rounded-xl border border-[#c0c9c2] font-mono text-xs text-[#131b2e] focus:border-[#003523] resize-none"
            />
          </div>

          {/* Section 4: Service Areas & Store Status */}
          <div className="bg-white rounded-2xl p-4 border border-[#c0c9c2]/50 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-black text-[#003523] uppercase text-[11px] tracking-wider flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#fe932c]" />
                <span>4. Service Corridors ({selectedAreas.length} selected)</span>
              </div>
              <button
                type="button"
                onClick={selectAllAreas}
                className="text-[11px] font-bold text-[#003523] hover:underline"
              >
                {selectedAreas.length === LOCALITIES.length ? 'Deselect All' : 'Select All Sectors'}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
              {LOCALITIES.map((loc) => {
                const isSelected = selectedAreas.includes(loc);
                return (
                  <button
                    type="button"
                    key={loc}
                    onClick={() => toggleArea(loc)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#003523] text-white border-[#003523]'
                        : 'bg-white text-[#707973] border-[#c0c9c2]/60 hover:bg-[#eaedff]'
                    }`}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#c0c9c2]/30 flex items-center justify-between">
              <div>
                <span className="font-bold text-[#131b2e] text-xs block">Live on Storefront</span>
                <span className="text-[11px] text-[#707973]">
                  Publish this bundle immediately to customer Care Packages catalog.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003523]"></div>
              </label>
            </div>
          </div>
        </form>

        {/* Footer Action Buttons */}
        <div className="p-4 border-t border-[#c0c9c2]/40 bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2.5 rounded-xl border border-[#c0c9c2] text-[#404943] font-bold text-xs hover:bg-gray-100 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            form="add-package-form"
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs shadow-md active:scale-98 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-[#fe932c]" />
            <span>Create Care Package</span>
          </button>
        </div>
      </div>
    </div>
  );
};
