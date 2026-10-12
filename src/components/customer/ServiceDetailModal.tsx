import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatServicePricing } from '../../utils/pricingEngine';
import {
  X,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Clock,
  Star,
  Receipt,
  HelpCircle,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  ArrowRight,
  Tag
} from 'lucide-react';

export const ServiceDetailModal: React.FC = () => {
  const {
    selectedDetailServiceId,
    setSelectedDetailServiceId,
    services,
    addToCart,
    setIsCartDrawerOpen,
    setIsCustomTaskModalOpen,
    showToast
  } = useApp();

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  if (!selectedDetailServiceId) return null;

  const service = services.find((s) => s.id === selectedDetailServiceId);
  if (!service) return null;

  const pricing = formatServicePricing(service);
  const inclusions = service.included_items || service.included || [];
  const exclusions = service.excluded_items || service.excluded || [];

  const handleBookNow = () => {
    addToCart(service, 1);
    setSelectedDetailServiceId(null);
    setIsCartDrawerOpen(true);
  };

  const handleRequestQuote = () => {
    setSelectedDetailServiceId(null);
    setIsCustomTaskModalOpen(true);
  };

  // Find related services
  const relatedServices = services.filter((s) =>
    service.relatedServiceIds?.includes(s.id) ||
    (s.subcategory === service.subcategory && s.id !== service.id)
  ).slice(0, 3);

  // Find companion for frequently booked together
  const companionService = services.find((s) =>
    service.frequentlyBookedTogetherIds?.includes(s.id) ||
    (s.category === 'Electrical' && service.category === 'AC & Appliances')
  );

  const defaultFaqs = [
    {
      question: 'How does Operations manual dispatch work?',
      answer: 'When you submit your request, our Kharar dispatch officer reviews your address, verifies required parts/tools, and assigns a verified local technician.'
    },
    {
      question: 'Can I pay after the service?',
      answer: 'Yes! Payment is strictly post-service via Cash or UPI directly to the verified artisan after inspection.'
    },
    {
      question: 'What is the material/spares policy for repairs?',
      answer: service.materialPolicy || 'All replacement hardware or spare parts are charged strictly at genuine market retail MRP with a shop tax invoice.'
    }
  ];

  const faqsToDisplay = service.faqs && service.faqs.length > 0 ? service.faqs : defaultFaqs;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#c0c9c2]/50 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#c0c9c2]/40 bg-[#faf8ff] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#003523] bg-[#e2e7ff] px-2.5 py-0.5 rounded-full">
              {service.category}
            </span>
            <span className="text-[11px] text-[#707973]">· {service.subcategory}</span>
            <span className="text-[10px] font-bold text-[#904d00] bg-[#ffdcc3] px-2 py-0.5 rounded-full">
              {pricing.badgeLabel}
            </span>
          </div>
          <button
            onClick={() => setSelectedDetailServiceId(null)}
            className="p-1 rounded-lg text-[#707973] hover:text-[#131b2e] hover:bg-[#eaedff]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Title & Pricing Block */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#131b2e] leading-snug">
                  {service.name}
                </h2>
                {/* Rating only when genuine data exists */}
                {service.rating ? (
                  <div className="flex items-center space-x-2 text-xs text-[#404943] mt-1.5">
                    <div className="flex items-center space-x-1 text-[#fe932c] font-bold">
                      <Star className="w-3.5 h-3.5 fill-[#fe932c]" />
                      <span>{service.rating}</span>
                    </div>
                    {service.completedBookingsCount && (
                      <>
                        <span>·</span>
                        <span className="text-[#707973]">
                          {service.completedBookingsCount} bookings in Kharar & Mohali
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-[#003523] font-semibold mt-1">
                    Verified UrbanCare Solution Standard Service
                  </div>
                )}
              </div>
              {service.badge && (
                <span className="text-[11px] font-bold text-[#904d00] bg-[#ffdcc3] px-2.5 py-1 rounded-md shrink-0">
                  {service.badge}
                </span>
              )}
            </div>

            {/* Price Row */}
            {pricing.isQuoteRequired ? (
              <div className="mt-3.5 p-3 rounded-xl bg-[#faf8ff] border border-[#003523]/20 space-y-1">
                <span className="text-2xl font-black text-[#003523]">
                  Request a Quote
                </span>
                <p className="text-xs text-[#404943]">
                  {pricing.visitFeeText}
                </p>
                <div className="flex items-center space-x-2 pt-1 text-[10px]">
                  <span className="text-[#003523] font-bold bg-[#c0edd3] px-2 py-0.5 rounded">
                    Zero Upfront Obligation
                  </span>
                  <span className="text-[#904d00] bg-[#ffdcc3] px-2 py-0.5 rounded font-bold">
                    Itemized BOQ Quote
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-1 mt-3.5">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#003523]">
                    {pricing.priceFormatted}
                  </span>
                  {pricing.originalPriceFormatted && (
                    <span className="text-sm text-[#707973] line-through">
                      {pricing.originalPriceFormatted}
                    </span>
                  )}
                  {pricing.discountText && (
                    <span className="text-xs font-bold text-[#904d00] bg-[#ffdcc3] px-2 py-0.5 rounded">
                      {pricing.discountText}
                    </span>
                  )}
                  <span className="text-xs text-[#707973] ml-1">
                    {pricing.visitFeeText}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-[#707973]">
                  <span className="font-semibold text-[#003523]">
                    {service.tax ? `+ ${service.tax}% GST applicable` : 'Inclusive of standard taxes'}
                  </span>
                  <span>·</span>
                  <span className="bg-[#ffdcc3]/50 text-[#904d00] font-bold px-2 py-0.2 rounded">
                    Demo Configurable Value
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 text-xs text-[#707973] mt-3">
              <div className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-[#003523]" />
                <span>Estimated duration: <strong>{service.duration || service.estimatedDuration}</strong></span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#404943] leading-relaxed">
            {service.description}
          </p>

          {/* What's Included / Excluded Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="p-4 rounded-xl bg-[#c0edd3]/25 border border-[#b6efd1] space-y-2.5">
              <div className="font-bold text-[#003523] flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#003523]" />
                <span className="text-sm">What's Included</span>
              </div>
              <ul className="space-y-2 text-[#131b2e]">
                {inclusions.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <Check className="w-3.5 h-3.5 text-[#003523] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/50 space-y-2.5">
              <div className="font-bold text-[#ba1a1a] flex items-center space-x-1.5">
                <XCircle className="w-4 h-4 text-[#ba1a1a]" />
                <span className="text-sm">What's Excluded</span>
              </div>
              <ul className="space-y-2 text-[#404943]">
                {exclusions.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-[#ba1a1a] font-bold">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Warranty & Material Policy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#f2f3ff] border border-[#c0c9c2]/40 text-xs flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-[#003523] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#131b2e]">30-Day Workmanship Warranty</div>
                <p className="text-[#404943] mt-0.5 leading-relaxed">{service.warranty}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#f2f3ff] border border-[#c0c9c2]/40 text-xs flex items-start space-x-2.5">
              <Receipt className="w-4 h-4 text-[#904d00] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#131b2e]">Material & Spares Policy</div>
                <p className="text-[#404943] mt-0.5 leading-relaxed">{service.materialPolicy}</p>
              </div>
            </div>
          </div>

          {/* Frequently Booked Together Section */}
          {companionService && (
            <div className="p-4 rounded-xl border border-[#fe932c]/50 bg-[#ffdcc3]/15 space-y-3">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#904d00]">
                <Sparkles className="w-4 h-4 text-[#fe932c]" />
                <span>Frequently Booked Together in Kharar</span>
              </div>
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-[#c0c9c2]/40">
                <div>
                  <div className="text-xs font-bold text-[#131b2e]">
                    {service.name} + {companionService.name}
                  </div>
                  <div className="text-[11px] text-[#707973] mt-0.5">
                    Save time by bundling with our verified dispatch visit
                  </div>
                </div>
                <button
                  onClick={() => {
                    addToCart(service, 1);
                    addToCart(companionService, 1);
                    setSelectedDetailServiceId(null);
                    showToast(`Added bundle (${service.name} + ${companionService.name}) to basket`, 'success');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold whitespace-nowrap"
                >
                  Add Bundle (₹{service.basePrice + companionService.basePrice})
                </button>
              </div>
            </div>
          )}

          {/* FAQs Accordion */}
          <div className="border-t border-[#c0c9c2]/40 pt-4 space-y-2.5">
            <div className="text-xs font-bold text-[#131b2e] flex items-center space-x-1.5 mb-2">
              <HelpCircle className="w-4 h-4 text-[#003523]" />
              <span className="text-sm">Frequently Asked Questions</span>
            </div>

            <div className="space-y-2">
              {faqsToDisplay.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className="rounded-xl border border-[#c0c9c2]/40 bg-[#faf8ff] overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full p-3 text-left flex items-center justify-between text-xs font-bold text-[#131b2e] hover:bg-[#f2f3ff] transition-colors"
                    >
                      <span>{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#707973] shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#707973] shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 pt-1 text-xs text-[#404943] leading-relaxed border-t border-[#c0c9c2]/20">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Related Services in Category */}
          {relatedServices.length > 0 && (
            <div className="border-t border-[#c0c9c2]/40 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#131b2e] uppercase tracking-wider">
                  Related Services in {service.subcategory}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {relatedServices.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => setSelectedDetailServiceId(rel.id)}
                    className="p-2.5 rounded-lg border border-[#c0c9c2]/40 bg-[#faf8ff] hover:border-[#003523] cursor-pointer transition-all space-y-1"
                  >
                    <div className="font-bold text-xs text-[#131b2e] line-clamp-1">{rel.name}</div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-black text-[#003523]">₹{rel.basePrice}</span>
                      <span className="text-[#003523] font-bold flex items-center">
                        <span>View</span>
                        <ArrowRight className="w-3 h-3 ml-0.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Sticky Dock */}
        <div className="p-4 border-t border-[#c0c9c2]/40 bg-[#faf8ff] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#707973] uppercase font-bold block">
              {pricing.label}
            </span>
            <span className="text-xl font-black text-[#003523]">
              {pricing.priceFormatted}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {pricing.isQuoteRequired ? (
              <button
                onClick={handleRequestQuote}
                className="px-6 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs shadow-md active:scale-98 transition-all flex items-center space-x-1.5"
              >
                <span>Request a Quote</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    addToCart(service, 1);
                    setSelectedDetailServiceId(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-[#003523] text-[#003523] font-bold text-xs hover:bg-[#c0edd3]/20 active:scale-98 transition-all flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Basket</span>
                </button>
                <button
                  onClick={handleBookNow}
                  className="px-5 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs shadow-md active:scale-98 transition-all"
                >
                  {pricing.pricingType === 'INSPECTION' ? 'Book Diagnostic' : 'Book Now'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

