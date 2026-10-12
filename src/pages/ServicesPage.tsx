import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SERVICE_CATEGORIES } from '../data/initialData';
import { formatServicePricing, DEMO_PRICING_DISCLAIMER } from '../utils/pricingEngine';
import {
  Search,
  Plus,
  Minus,
  Info,
  ShieldCheck,
  Clock,
  Filter,
  CheckCircle2,
  Star,
  Check,
  PlusCircle,
  Layers,
  ArrowRight,
  Tag
} from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const {
    services,
    packages,
    cart,
    addToCart,
    addPackageToCart,
    updateCartQuantity,
    setSelectedDetailServiceId,
    setIsCustomTaskModalOpen,
    currentLocality
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('AC & Appliances');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Active category object
  const activeCategoryObj = useMemo(() => {
    return (
      SERVICE_CATEGORIES.find((c) => c.name.toLowerCase() === activeCategory.toLowerCase()) ||
      SERVICE_CATEGORIES[0]
    );
  }, [activeCategory]);

  const availableSubcategories = activeCategoryObj.subcategories || [];

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (!s.active) return false;
      const q = searchQuery.toLowerCase().trim();
      if (q !== '') {
        const matchesQuery =
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.subcategory.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      } else {
        if (activeCategory !== 'All' && s.category.toLowerCase() !== activeCategory.toLowerCase()) {
          return false;
        }
        if (activeSubcategory !== 'All' && s.subcategory !== activeSubcategory) {
          return false;
        }
      }
      return true;
    });
  }, [services, activeCategory, activeSubcategory, searchQuery]);

  const matchingPackages = useMemo(() => {
    return packages.filter((p) => {
      if (!p.active) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      }
      return activeCategory === 'All' || p.category.toLowerCase() === activeCategory.toLowerCase();
    });
  }, [packages, activeCategory, searchQuery]);

  const getPricingTypeLabel = (type: string) => {
    switch (type) {
      case 'inspection_fee':
        return 'Inspection / Visit Fee';
      case 'starting_from':
        return 'Starting From';
      case 'package':
        return 'Care Package';
      case 'quote_required':
        return 'Quote Required';
      case 'fixed':
      default:
        return 'Fixed Price';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-24">
      {/* Page Header */}
      <div className="space-y-2 border-b border-[#c0c9c2]/40 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#131b2e]">
            Tricity Home Services Catalogue
          </h1>
          <p className="text-xs sm:text-sm text-[#404943]">
            Category → Subcategory → Service hierarchy for {currentLocality} and surrounding sectors.
          </p>
        </div>

        <button
          onClick={() => setIsCustomTaskModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs shrink-0 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-[#fe932c]" />
          <span>Post Custom Requirement</span>
        </button>
      </div>

      {/* Search and Category Filter Strip */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#707973]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service by problem (e.g. AC cooling, tap leak, fan repair, motor humming)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#c0c9c2] text-xs bg-white text-[#131b2e] focus:border-[#003523] shadow-xs"
          />
        </div>

        {/* Category Selector Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => {
              setActiveCategory('All');
              setActiveSubcategory('All');
            }}
            className={`px-3 py-1.5 rounded-full border whitespace-nowrap font-bold transition-all ${
              activeCategory === 'All'
                ? 'bg-[#003523] text-white border-[#003523]'
                : 'bg-white text-[#404943] border-[#c0c9c2]/60 hover:border-[#003523]'
            }`}
          >
            All Categories ({services.length})
          </button>
          {SERVICE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.name);
                setActiveSubcategory('All');
              }}
              className={`px-3 py-1.5 rounded-full border whitespace-nowrap font-bold transition-all ${
                activeCategory.toLowerCase() === cat.name.toLowerCase()
                  ? 'bg-[#003523] text-white border-[#003523]'
                  : 'bg-white text-[#404943] border-[#c0c9c2]/60 hover:border-[#003523]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Subcategory Filter Pills (Hierarchy Tier 2) */}
        {activeCategory !== 'All' && availableSubcategories.length > 0 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto pt-1 pb-1 text-xs no-scrollbar border-t border-[#c0c9c2]/20">
            <span className="text-[#707973] text-[11px] font-semibold pl-1">Subcategory:</span>
            <button
              onClick={() => setActiveSubcategory('All')}
              className={`px-2.5 py-1 rounded-lg border whitespace-nowrap text-xs font-semibold ${
                activeSubcategory === 'All'
                  ? 'bg-[#003523] text-white border-[#003523]'
                  : 'bg-[#faf8ff] text-[#404943] border-[#c0c9c2]/40 hover:bg-[#eaedff]'
              }`}
            >
              All
            </button>
            {availableSubcategories.map((sub) => (
              <button
                key={sub}
                onClick={() => setActiveSubcategory(sub)}
                className={`px-2.5 py-1 rounded-lg border whitespace-nowrap text-xs font-semibold ${
                  activeSubcategory === sub
                    ? 'bg-[#003523] text-white border-[#003523]'
                    : 'bg-[#faf8ff] text-[#404943] border-[#c0c9c2]/40 hover:bg-[#eaedff]'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Demo Values Notice Banner */}
      <div className="bg-[#ffdcc3]/30 border border-[#fe932c]/50 p-3 sm:p-4 rounded-xl text-xs text-[#904d00] flex items-start space-x-2.5">
        <Tag className="w-4 h-4 text-[#fe932c] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Configurable Demo Values:</strong> Displayed rates (e.g. AC General Service ₹499, Foam-Jet ₹699, AC Inspection ₹199, AC Installation ₹999) are demo test rates. Not official market prices. Can be configured live in the Operations Portal.
        </div>
      </div>

      {/* Packages in this Category */}
      {matchingPackages.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#904d00] uppercase tracking-wider">
              Care Packages ({matchingPackages.length})
            </span>
            <span className="text-xs text-[#707973]">Bundled Multi-Unit Care</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchingPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl border border-[#fe932c]/50 p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] font-bold text-[#904d00] bg-[#ffdcc3] px-2 py-0.5 rounded inline-block mb-1">
                    PACKAGE
                  </div>
                  <h3 className="text-sm font-bold text-[#131b2e]">{pkg.name}</h3>
                  <p className="text-xs text-[#404943] line-clamp-2 mt-1">{pkg.description}</p>
                  <div className="text-xs font-bold text-[#003523] mt-2">{pkg.savings}</div>
                </div>

                <div className="pt-3 border-t border-[#c0c9c2]/40 flex items-center justify-between mt-3">
                  <div>
                    <span className="text-lg font-black text-[#003523]">₹{pkg.price}</span>
                    <span className="text-xs text-[#707973] line-through ml-1.5">₹{pkg.originalPrice}</span>
                  </div>
                  <button
                    onClick={() => addPackageToCart(pkg)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#fe932c] hover:bg-[#e07f24] text-[#002114] text-xs font-bold shadow-xs"
                  >
                    Add Package
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services Grid (Pricing Cards) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-[#003523] uppercase tracking-wider">
            {activeSubcategory === 'All' ? 'Standard Services' : activeSubcategory.toUpperCase()}
          </span>
          <span className="text-xs text-[#707973]">
            {filteredServices.length} options available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => {
            const pricing = formatServicePricing(service);
            const inCart = cart.find((c) => c.serviceId === service.id);
            const count = inCart ? inCart.quantity : 0;
            const inclusions = (service.included_items || service.included || []).slice(0, 2);

            return (
              <div
                key={service.id}
                className="bg-white rounded-2xl border border-[#c0c9c2]/50 hover:border-[#003523] p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-[#707973] uppercase tracking-wider">
                      {service.subcategory}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-bold text-[#003523] bg-[#c0edd3]/30 px-2 py-0.5 rounded">
                        {pricing.badgeLabel}
                      </span>
                      {service.badge && (
                        <span className="text-[10px] font-bold text-[#904d00] bg-[#ffdcc3] px-2 py-0.5 rounded">
                          {service.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-[#131b2e] leading-snug mb-1">
                    {service.name}
                  </h3>
                  <p className="text-xs text-[#404943] line-clamp-2 mb-3">
                    {service.description}
                  </p>

                  <div className="flex items-center space-x-3 text-xs text-[#707973] mb-3">
                    {service.rating ? (
                      <div className="flex items-center space-x-1 text-[#fe932c] font-bold">
                        <Star className="w-3.5 h-3.5 fill-[#fe932c]" />
                        <span>{service.rating}</span>
                        {service.completedBookingsCount && (
                          <span className="text-[#707973] font-normal">
                            ({service.completedBookingsCount})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#003523] font-semibold text-[11px]">
                        Verified Standard
                      </span>
                    )}
                    <span>·</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-[#003523]" />
                      <span>{service.duration || service.estimatedDuration}</span>
                    </div>
                  </div>

                  {/* Included Scope bullets */}
                  {inclusions.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[#faf8ff] text-[11px] text-[#404943] space-y-1 mb-3">
                      <span className="font-bold text-[#131b2e] block text-[10px] uppercase">
                        What's Included:
                      </span>
                      {inclusions.map((inc, i) => (
                        <div key={i} className="flex items-start space-x-1 text-gray-700">
                          <Check className="w-3 h-3 text-[#003523] shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{inc}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Dock */}
                <div className="pt-3 border-t border-[#c0c9c2]/40 flex items-center justify-between">
                  <div>
                    {pricing.isQuoteRequired ? (
                      <div>
                        <span className="text-base font-black text-[#003523]">
                          Request a Quote
                        </span>
                        <div className="text-[10px] text-[#707973]">
                          {pricing.visitFeeText}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-lg font-black text-[#003523]">
                            {pricing.priceFormatted}
                          </span>
                          {pricing.originalPriceFormatted && (
                            <span className="text-xs text-[#707973] line-through">
                              {pricing.originalPriceFormatted}
                            </span>
                          )}
                          {pricing.discountText && (
                            <span className="text-[10px] font-bold text-[#904d00] bg-[#ffdcc3] px-1.5 py-0.2 rounded">
                              {pricing.discountText}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#707973]">
                          {pricing.visitFeeText}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setSelectedDetailServiceId(service.id)}
                      className="p-2 rounded-xl text-[#707973] hover:text-[#131b2e] hover:bg-[#eaedff]"
                      title="View Inclusions & FAQs"
                    >
                      <Info className="w-4 h-4" />
                    </button>

                    {pricing.isQuoteRequired ? (
                      <button
                        onClick={() => setIsCustomTaskModalOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs flex items-center space-x-1 shadow-xs active:scale-98 transition-all"
                      >
                        <span>Request Quote</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                      </button>
                    ) : count > 0 ? (
                      <div className="flex items-center bg-[#003523] text-white rounded-xl p-0.5 space-x-1 shadow-xs">
                        <button
                          onClick={() => updateCartQuantity(service.id, -1)}
                          className="w-6 h-6 flex items-center justify-center font-bold text-xs hover:bg-[#144d37] rounded"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold px-1.5">{count}</span>
                        <button
                          onClick={() => updateCartQuantity(service.id, 1)}
                          className="w-6 h-6 flex items-center justify-center font-bold text-xs hover:bg-[#144d37] rounded"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(service, 1)}
                        className="px-3.5 py-2 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs flex items-center space-x-1 shadow-xs active:scale-98 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{pricing.ctaText}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
