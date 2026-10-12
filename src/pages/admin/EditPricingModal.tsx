import React, { useState } from 'react';
import { ServiceItem, PriceType } from '../../types';
import { formatServicePricing } from '../../utils/pricingEngine';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Tag,
  Clock,
  ShieldCheck,
  Sparkles,
  Save,
  Check,
  Info
} from 'lucide-react';

interface EditPricingModalProps {
  service: ServiceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (serviceId: string, updates: Partial<ServiceItem>, reason: string) => void;
}

export const EditPricingModal: React.FC<EditPricingModalProps> = ({
  service,
  isOpen,
  onClose,
  onSave
}) => {
  const [priceType, setPriceType] = useState<PriceType>(
    service?.price_type || (service?.pricingType?.toString().toUpperCase() as PriceType) || 'FIXED'
  );
  const [basePrice, setBasePrice] = useState<number>(
    service?.base_price ?? service?.basePrice ?? 0
  );
  const [originalPrice, setOriginalPrice] = useState<number>(
    service?.original_price ?? service?.originalPrice ?? 0
  );
  const [discount, setDiscount] = useState<string>(service?.discount || '');
  const [visitFee, setVisitFee] = useState<number>(
    service?.visit_fee ?? service?.visitFee ?? 99
  );
  const [tax, setTax] = useState<number>(service?.tax ?? 0);
  const [duration, setDuration] = useState<string>(
    service?.duration || service?.estimatedDuration || '45 - 60 mins'
  );
  const [warranty, setWarranty] = useState<string>(service?.warranty || '30 Days Warranty');
  const [materialPolicy, setMaterialPolicy] = useState<string>(
    service?.material_policy || service?.materialPolicy || ''
  );
  const [includedText, setIncludedText] = useState<string>(
    (service?.included_items || service?.included || []).join('\n')
  );
  const [excludedText, setExcludedText] = useState<string>(
    (service?.excluded_items || service?.excluded || []).join('\n')
  );
  const [effectiveFrom, setEffectiveFrom] = useState<string>(
    service?.effective_from || new Date().toISOString().split('T')[0]
  );
  const [effectiveTo, setEffectiveTo] = useState<string>(service?.effective_to || '');
  const [active, setActive] = useState<boolean>(service?.active ?? true);
  const [reason, setReason] = useState<string>('Standard periodic pricing review');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !service) return null;

  // Temporary mock object for live preview
  const previewItem: ServiceItem = {
    ...service,
    price_type: priceType,
    base_price: priceType === 'QUOTE_REQUIRED' ? 0 : basePrice,
    original_price: originalPrice > 0 ? originalPrice : undefined,
    discount: discount.trim() ? discount : undefined,
    visit_fee: visitFee,
    tax,
    duration,
    warranty,
    material_policy: materialPolicy,
    included_items: includedText.split('\n').filter((l) => l.trim()),
    excluded_items: excludedText.split('\n').filter((l) => l.trim()),
    active,
    effective_from: effectiveFrom,
    effective_to: effectiveTo || undefined,
    basePrice: priceType === 'QUOTE_REQUIRED' ? 0 : basePrice,
    visitFee,
    pricingType: priceType,
    materialPolicy,
    estimatedDuration: duration,
    included: includedText.split('\n').filter((l) => l.trim()),
    excluded: excludedText.split('\n').filter((l) => l.trim())
  };

  const previewPricing = formatServicePricing(previewItem);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('Audit trail requires a stated reason for changing service pricing.');
      return;
    }
    setErrorMsg(null);

    const updates: Partial<ServiceItem> = {
      price_type: priceType,
      pricingType: priceType,
      base_price: priceType === 'QUOTE_REQUIRED' ? 0 : Number(basePrice),
      basePrice: priceType === 'QUOTE_REQUIRED' ? 0 : Number(basePrice),
      original_price: originalPrice > 0 ? Number(originalPrice) : undefined,
      originalPrice: originalPrice > 0 ? Number(originalPrice) : undefined,
      discount: discount.trim() ? discount.trim() : undefined,
      visit_fee: Number(visitFee),
      visitFee: Number(visitFee),
      tax: Number(tax),
      duration,
      estimatedDuration: duration,
      warranty,
      material_policy: materialPolicy,
      materialPolicy: materialPolicy,
      included_items: includedText.split('\n').map((l) => l.trim()).filter(Boolean),
      included: includedText.split('\n').map((l) => l.trim()).filter(Boolean),
      excluded_items: excludedText.split('\n').map((l) => l.trim()).filter(Boolean),
      excluded: excludedText.split('\n').map((l) => l.trim()).filter(Boolean),
      effective_from: effectiveFrom,
      effective_to: effectiveTo ? effectiveTo : undefined,
      active
    };

    onSave(service.id, updates, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#c0c9c2]/50 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#c0c9c2]/40 bg-[#faf8ff] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#003523] rounded-xl text-white">
              <Tag className="w-4 h-4 text-[#fe932c]" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#131b2e]">
                Operations Pricing & Catalogue Editor
              </h3>
              <p className="text-xs text-[#707973]">
                Updating: <strong className="text-[#003523]">{service.name}</strong> ({service.category} · {service.subcategory})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#707973] hover:text-[#131b2e] hover:bg-[#eaedff]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Notice Banner */}
        <div className="bg-[#ffdcc3]/30 px-5 py-2.5 border-b border-[#fe932c]/30 text-xs text-[#904d00] flex items-center justify-between">
          <span>
            <strong>Configurable Demo Values:</strong> Rates updated here immediately reflect on customer service pages, cart calculations, and booking checkout.
          </span>
          <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-[#fe932c]/50 font-bold shrink-0 ml-2">
            Operations Audit Log Active
          </span>
        </div>

        {/* Form Body */}
        <form id="edit-pricing-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form Inputs */}
            <div className="lg:col-span-2 space-y-4 text-xs">
              {/* Row 1: Price Type & Base Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#131b2e] block mb-1">
                    Price Type Structure <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={priceType}
                    onChange={(e) => setPriceType(e.target.value as PriceType)}
                    className="w-full p-2.5 rounded-xl border border-[#c0c9c2] font-semibold bg-white text-[#131b2e] focus:border-[#003523]"
                  >
                    <option value="FIXED">FIXED (Exact Transparent Price)</option>
                    <option value="PACKAGE">PACKAGE (Combo / Multi-unit Care)</option>
                    <option value="STARTING_FROM">STARTING_FROM (Standard Starting Rate)</option>
                    <option value="INSPECTION">INSPECTION (Inspection / Diagnostic Fee)</option>
                    <option value="QUOTE_REQUIRED">QUOTE_REQUIRED (Custom On-Site Quote)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#131b2e] block mb-1">
                    Base Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    disabled={priceType === 'QUOTE_REQUIRED'}
                    value={priceType === 'QUOTE_REQUIRED' ? '' : basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    placeholder={priceType === 'QUOTE_REQUIRED' ? 'Quote Required (No Fixed Price)' : 'e.g. 499'}
                    className={`w-full p-2.5 rounded-xl border font-black text-sm ${
                      priceType === 'QUOTE_REQUIRED'
                        ? 'bg-gray-100 text-gray-400 border-gray-300'
                        : 'bg-white text-[#003523] border-[#c0c9c2] focus:border-[#003523]'
                    }`}
                  />
                  {priceType === 'QUOTE_REQUIRED' && (
                    <span className="text-[10px] text-[#707973] mt-0.5 block">
                      QUOTE_REQUIRED services display "Request a Quote" to customers.
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: Original Price & Discount Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#131b2e] block mb-1">
                    Original Strike-through Price (₹)
                  </label>
                  <input
                    type="number"
                    value={originalPrice || ''}
                    onChange={(e) => setOriginalPrice(Number(e.target.value))}
                    placeholder="e.g. 699 (Optional for savings badge)"
                    className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#131b2e] block mb-1">
                    Discount / Offer Tag
                  </label>
                  <input
                    type="text"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="e.g. 28% OFF or Summer Special"
                    className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs"
                  />
                </div>
              </div>

              {/* Row 3: Visit Fee & Tax % */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#131b2e] block mb-1">
                    Doorstep Visit Fee (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={visitFee}
                    onChange={(e) => setVisitFee(Number(e.target.value))}
                    placeholder="e.g. 99 (or 0 for packages)"
                    className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#131b2e] block mb-1">
                    Configured Tax (%)
                  </label>
                  <input
                    type="number"
                    value={tax}
                    onChange={(e) => setTax(Number(e.target.value))}
                    placeholder="e.g. 0 or 18 (GST percentage)"
                    className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Row 4: Duration & Warranty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#131b2e] block mb-1">
                    Estimated Duration <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 45 - 60 mins"
                    className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#131b2e] block mb-1">
                    Warranty / Guarantee Policy <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    placeholder="e.g. 30 Days Leak Guarantee"
                    className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs"
                  />
                </div>
              </div>

              {/* Row 5: Material & Spares Policy */}
              <div>
                <label className="font-bold text-[#131b2e] block mb-1">
                  Material & Spares Policy
                </label>
                <textarea
                  rows={2}
                  value={materialPolicy}
                  onChange={(e) => setMaterialPolicy(e.target.value)}
                  placeholder="Explain spare parts transparent retail MRP bill policy..."
                  className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs leading-relaxed"
                />
              </div>

              {/* Row 6: Inclusions & Exclusions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#003523] block mb-1">
                    What's Included (1 item per line)
                  </label>
                  <textarea
                    rows={3}
                    value={includedText}
                    onChange={(e) => setIncludedText(e.target.value)}
                    placeholder="High pressure jet wash&#10;Outdoor coil wash&#10;Amp draw test"
                    className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#ba1a1a] block mb-1">
                    What's Excluded (1 item per line)
                  </label>
                  <textarea
                    rows={3}
                    value={excludedText}
                    onChange={(e) => setExcludedText(e.target.value)}
                    placeholder="Spare parts cost&#10;Scaffolding charges"
                    className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs font-mono"
                  />
                </div>
              </div>

              {/* Row 7: Effective Dates & Active Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-[#131b2e] block mb-1">
                    Effective From
                  </label>
                  <input
                    type="date"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#131b2e] block mb-1">
                    Effective To (Optional)
                  </label>
                  <input
                    type="date"
                    value={effectiveTo}
                    onChange={(e) => setEffectiveTo(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#c0c9c2] text-xs"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="service-active"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 text-[#003523] rounded border-gray-300"
                  />
                  <label htmlFor="service-active" className="font-bold text-xs text-[#131b2e]">
                    Service Active in Catalog
                  </label>
                </div>
              </div>

              {/* Audit Reason Field (MANDATORY) */}
              <div className="p-3.5 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/50 space-y-1.5">
                <label className="font-bold text-[#131b2e] flex items-center space-x-1">
                  <span>Reason for Pricing Modification (Logged in Audit Trail)</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Seasonal festive campaign, supplier spare price revision, Kharar promo..."
                  className="w-full p-2 rounded-lg border border-[#c0c9c2] text-xs bg-white"
                />
              </div>
            </div>

            {/* Right 1 Col: Live Preview Card */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#707973] uppercase tracking-wider block">
                Live Customer Card Preview
              </span>

              <div className="bg-[#f2f3ff] p-3 rounded-2xl border border-[#c0c9c2]/40">
                <div className="bg-white rounded-xl border border-[#003523] p-4 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-[#707973] uppercase">
                      {service.subcategory}
                    </span>
                    <span className="text-[9px] font-bold text-[#003523] bg-[#c0edd3] px-2 py-0.5 rounded">
                      {previewPricing.badgeLabel}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-[#131b2e]">{service.name}</h4>
                  <p className="text-[11px] text-[#404943] line-clamp-2">{service.description}</p>

                  <div className="text-[10px] text-[#707973] flex items-center space-x-2">
                    <Clock className="w-3 h-3 text-[#003523]" />
                    <span>{duration}</span>
                    <span>·</span>
                    <span>{warranty}</span>
                  </div>

                  <div className="pt-2 border-t border-[#c0c9c2]/30 flex items-center justify-between">
                    <div>
                      {previewPricing.isQuoteRequired ? (
                        <div>
                          <span className="font-bold text-xs text-[#003523]">Request a Quote</span>
                          <div className="text-[9px] text-[#707973]">Free site estimate</div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline space-x-1">
                            <span className="font-black text-base text-[#003523]">
                              {previewPricing.priceFormatted}
                            </span>
                            {previewPricing.originalPriceFormatted && (
                              <span className="text-[10px] text-[#707973] line-through">
                                {previewPricing.originalPriceFormatted}
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] text-[#707973]">
                            {previewPricing.visitFeeText}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 bg-[#003523] text-white rounded-lg font-bold text-[10px]"
                    >
                      {previewPricing.ctaText}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-[#707973] space-y-1">
                <strong>Instant Synchronization:</strong>
                <p>
                  Saving writes an audit record to <code>priceHistory</code>, updates React context state, and updates active cart entries automatically.
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-[#c0c9c2]/40 bg-[#faf8ff] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#c0c9c2] text-xs font-semibold text-[#404943] hover:bg-white"
          >
            Cancel
          </button>

          <button
            form="edit-pricing-form"
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs shadow-md active:scale-98 transition-all flex items-center space-x-1.5"
          >
            <Save className="w-4 h-4 text-[#fe932c]" />
            <span>Save Pricing & Create Audit Record</span>
          </button>
        </div>
      </div>
    </div>
  );
};
