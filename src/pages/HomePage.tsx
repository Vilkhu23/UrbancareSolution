import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SERVICE_CATEGORIES, SERVICE_AVAILABLE_ZONES } from '../data/initialData';
import { CustomerOtpDisplay } from '../components/customer/CustomerOtpDisplay';
import {
  Search,
  Wrench,
  Zap,
  Droplets,
  Hammer,
  Paintbrush,
  Sparkles,
  ShieldAlert,
  HardHat,
  Star,
  ArrowRight,
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  MapPin,
  Clock,
  MessageCircle,
  Phone,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building2,
  Receipt,
  UserCheck
} from 'lucide-react';

/**
 * Single source of truth for pricing and ETA policies across the website.
 * Prevents conflicting promises and ensures transparent customer communication.
 */
export const PRICING_CONFIG = {
  inspectionFee: 149,
  inspectionFeeRule:
    'Our doorstep inspection fee is ₹149, completely waived whenever you proceed with the repair.',
  partsPolicy:
    'All replacement hardware and spare parts are billed strictly at genuine retail shop MRP with shop receipts.',
  warrantyDays: 30,
  warrantyPromise:
    '30-Day Workmanship Warranty on all completed repairs. Free return visit if any serviced part acts up.',
  etaStandard: '30 mins',
  etaDetailed:
    'Verified local technicians dispatched across Sectors 94–111 (Mohali & Kharar) for ~30-minute doorstep arrival.'
};

export const HomePage: React.FC = () => {
  const {
    currentLocality,
    setCurrentLocality,
    services,
    addToCart,
    cart,
    setCurrentPage,
    currentUser,
    requests,
    setActiveTrackingRequestId,
    reviews,
    showToast,
    isLoadingData,
    dataLoadError
  } = useApp();

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');

  // Sector checker state
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone-sec-94');
  const [pincodeQuery, setPincodeQuery] = useState('');

  // FAQ accordion state
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(0);

  // Quick symptom search chips (5 curated high-intent needs)
  const quickChips = [
    'AC Service',
    'Fan Repair',
    'Tap Leakage',
    'Switchboard',
    'Deep Cleaning'
  ];

  // Active customer request strictly for logged-in users with active orders
  const activeOrder = useMemo(() => {
    if (!currentUser) return null;
    return requests.find(
      (r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED' && r.status !== 'CLOSED'
    );
  }, [currentUser, requests]);

  // Curated 8 categories for the icon grid
  const mainCategories = useMemo(() => {
    return SERVICE_CATEGORIES.slice(0, 8);
  }, []);

  // Category Icon helper
  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'ac-appliances':
        return <Wrench className="w-6 h-6 text-[#0F3D2E]" />;
      case 'electrical':
        return <Zap className="w-6 h-6 text-[#F28C28]" />;
      case 'plumbing':
        return <Droplets className="w-6 h-6 text-[#0F3D2E]" />;
      case 'carpentry':
        return <Hammer className="w-6 h-6 text-[#4A5568]" />;
      case 'fabrication':
        return <ShieldCheck className="w-6 h-6 text-[#0F3D2E]" />;
      case 'cleaning':
        return <Sparkles className="w-6 h-6 text-[#0F3D2E]" />;
      case 'painting':
        return <Paintbrush className="w-6 h-6 text-[#F28C28]" />;
      case 'pest-control':
        return <ShieldAlert className="w-6 h-6 text-[#BA1A1A]" />;
      default:
        return <Wrench className="w-6 h-6 text-[#0F3D2E]" />;
    }
  };

  // 6 Curated Popular Services for the horizontal carousel
  const popularServices = useMemo(() => {
    const popularIds = [
      'srv-ac-foam',
      'srv-fan-repair',
      'srv-water-motor',
      'srv-tap-repair',
      'srv-switchboard',
      'srv-kitchen-clean'
    ];
    const picked = popularIds
      .map((id) => services.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));

    if (picked.length >= 6) return picked.slice(0, 6);
    // Fallback to active services if IDs change
    return services.filter((s) => s.active).slice(0, 6);
  }, [services]);

  // Frequently Booked Together Bundle Pair
  const bundlePair = useMemo(() => {
    const s1 = services.find((s) => s.id === 'srv-ac-foam');
    const s2 = services.find((s) => s.id === 'srv-fan-repair');
    if (s1 && s2) {
      return { s1, s2, total: s1.basePrice + s2.basePrice };
    }
    return null;
  }, [services]);

  // Active Zone for the Sector Checker
  const activeZone = useMemo(() => {
    return (
      SERVICE_AVAILABLE_ZONES.find((z) => z.id === selectedZoneId) ||
      SERVICE_AVAILABLE_ZONES[0]
    );
  }, [selectedZoneId]);

  // Handle Search submit
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCurrentPage('services');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Quick Chip click
  const handleChipClick = (chip: string) => {
    setSearchQuery(chip);
    setCurrentPage('services');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // FAQ list with consistent pricing and ETA rules
  const faqs = [
    {
      q: 'How much is the doorstep inspection fee?',
      a: `${PRICING_CONFIG.inspectionFeeRule} Diagnostics include complete troubleshooting with professional testing tools. If you approve the repair, you only pay for the service itself.`
    },
    {
      q: 'How fast can a technician reach my home in Mohali or Kharar?',
      a: `${PRICING_CONFIG.etaDetailed} Our technicians are dispatched from our Kharar Operations Hub, reaching enclaves in Sectors 94–111 typically within 25 to 35 minutes.`
    },
    {
      q: 'Do I have to pay any advance before work begins?',
      a: 'No. Standard home repairs require ₹0 advance payment. You inspect and test the completed work in your home first, then pay directly via UPI, Card, or Cash.'
    },
    {
      q: 'What is covered under the 30-Day Workmanship Warranty?',
      a: `${PRICING_CONFIG.warrantyPromise} If any serviced appliance, repaired joint, tap fitting, or switchboard re-develops an issue within 30 days, we revisit with zero extra labor charge.`
    },
    {
      q: 'How are spare parts billed?',
      a: `${PRICING_CONFIG.partsPolicy} Our technicians do not inflate parts prices or install counterfeit hardware. You receive the retail store invoice with every component.`
    }
  ];

  return (
    <div className="space-y-12 sm:space-y-16 pb-20 font-['Inter',sans-serif]">
      {/* =========================================================
          1. HERO SECTION
          H1, 1-line subtext, search bar, 5 quick chips,
          Primary "Book a Service" + Secondary "WhatsApp Us",
          Single-color trust chips row
          ========================================================= */}
      <section className="bg-gradient-to-b from-[#F2F7F4] via-white to-white pt-8 sm:pt-12 pb-6 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          {/* Main H1 & 1-Line Subtext */}
          <div className="space-y-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#0F3D2E]/10 text-[#0F3D2E] text-xs font-semibold tracking-wide">
              Serving Sectors 94–111, Mohali & Kharar
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tight leading-tight">
              Trusted Home Repairs in Kharar & Mohali
            </h1>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Verified local electricians, plumbers & technicians at your doorstep in {PRICING_CONFIG.etaStandard}. ₹0 advance payment.
            </p>
          </div>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-xl mx-auto relative flex items-center shadow-xs focus-within:shadow-md transition-shadow rounded-2xl"
          >
            <Search className="w-5 h-5 absolute left-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repair or problem (e.g. AC cooling, fan, tap leak)..."
              className="w-full pl-12 pr-28 py-3.5 sm:py-4 rounded-2xl border border-gray-300 bg-white text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:border-[#0F3D2E] focus:ring-2 focus:ring-[#0F3D2E]/15 focus:outline-none transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 sm:py-2.5 rounded-xl bg-[#0F3D2E] hover:bg-[#144d37] text-white text-xs sm:text-sm font-semibold transition-all min-h-[38px] flex items-center justify-center cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* 5 Quick Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
            <span className="text-gray-500 font-medium mr-1">Common:</span>
            {quickChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-[#0F3D2E] hover:bg-emerald-50/50 text-gray-700 font-medium transition-all cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Dual CTAs: Primary "Book a Service" + Secondary "WhatsApp Us" */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setCurrentPage('services');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#F28C28] hover:bg-[#d9771e] text-[#0F3D2E] font-bold text-sm sm:text-base shadow-sm hover:shadow-md active:scale-[0.98] transition-all min-h-[44px] flex items-center justify-center space-x-2 focus-visible:ring-2 focus-visible:ring-[#0F3D2E] focus-visible:outline-none cursor-pointer"
            >
              <span>Book a Service</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="https://wa.me/918284018909"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border-2 border-[#0F3D2E] text-[#0F3D2E] bg-transparent hover:bg-[#0F3D2E]/5 font-bold text-sm sm:text-base transition-all min-h-[44px] flex items-center justify-center space-x-2 focus-visible:ring-2 focus-visible:ring-[#0F3D2E] focus-visible:outline-none cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-700" />
              <span>WhatsApp Us</span>
            </a>
          </div>

          {/* Unified Trust Chips Row (1 Single Color Theme) */}
          <div className="pt-4 max-w-3xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold text-[#0F3D2E]">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#0F3D2E]/5 border border-[#0F3D2E]/15">
                <Check className="w-3.5 h-3.5 text-[#0F3D2E] stroke-[3]" />
                <span>₹0 Advance</span>
              </div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#0F3D2E]/5 border border-[#0F3D2E]/15">
                <Check className="w-3.5 h-3.5 text-[#0F3D2E] stroke-[3]" />
                <span>Pay After Completion</span>
              </div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#0F3D2E]/5 border border-[#0F3D2E]/15">
                <Check className="w-3.5 h-3.5 text-[#0F3D2E] stroke-[3]" />
                <span>Verified Professionals</span>
              </div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#0F3D2E]/5 border border-[#0F3D2E]/15">
                <Check className="w-3.5 h-3.5 text-[#0F3D2E] stroke-[3]" />
                <span>30-Day Warranty</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CONDITIONAL ACTIVE ORDER TRACKER
          Strictly shown for logged-in residents with active orders.
          ========================================================= */}
      {activeOrder && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F28C28] animate-pulse" />
                <span className="text-xs font-bold text-[#0F3D2E] uppercase tracking-wider">
                  Active Service Request
                </span>
                <span className="text-xs bg-white px-2 py-0.5 rounded-md font-mono font-bold text-gray-800 border border-emerald-200">
                  #{activeOrder.id}
                </span>
              </div>
              <div className="text-sm font-bold text-[#1A1A1A]">
                {activeOrder.items.map((i) => i.serviceName).join(', ')}
              </div>
              <div className="text-xs text-gray-600">
                Status: <strong className="text-[#0F3D2E]">{activeOrder.status}</strong> · {activeOrder.locality}
              </div>
              <CustomerOtpDisplay
                requestId={activeOrder.id}
                status={activeOrder.status}
                bookingUserId={activeOrder.user_id}
                customerPhone={activeOrder.customerPhone}
                className="mt-2"
              />
            </div>

            <button
              type="button"
              onClick={() => setActiveTrackingRequestId(activeOrder.id)}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#0F3D2E] hover:bg-[#144d37] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all min-h-[44px] flex items-center justify-center space-x-2 focus-visible:ring-2 focus-visible:ring-[#0F3D2E] focus-visible:outline-none cursor-pointer"
            >
              <span>Track Live Status</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* =========================================================
          2. CATEGORIES SECTION (8-Category Icon Grid)
          Links directly to category pages/routes
          ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] tracking-tight">
              Explore Services
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Verified local technicians ready across Sectors 94–111
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCurrentPage('services');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs sm:text-sm font-bold text-[#0F3D2E] hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>All 35+ Services</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 8-Category Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {mainCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCurrentPage('services');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="p-4 sm:p-5 rounded-2xl border border-gray-200/90 bg-white hover:border-[#0F3D2E] hover:bg-emerald-50/30 transition-all text-center flex flex-col items-center justify-center space-y-2.5 group shadow-xs hover:shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-50 group-hover:bg-white flex items-center justify-center border border-gray-100 transition-colors">
                {getCategoryIcon(cat.id)}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-[#1A1A1A] group-hover:text-[#0F3D2E] transition-colors leading-tight">
                  {cat.name}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5 font-medium">
                  {cat.count} services
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* =========================================================
          3. POPULAR SERVICES (Horizontal Swipe Carousel)
          6 real services, name, rating, price, duration, Book button.
          Single global visit fee note underneath.
          ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] tracking-tight">
              Popular Doorstep Repairs
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Most requested repairs in Mohali & Kharar this week
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCurrentPage('services');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs sm:text-sm font-bold text-[#0F3D2E] hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontal Scroll / Swipe Container with Loading Skeletons */}
        {isLoadingData && popularServices.length === 0 ? (
          <div className="flex overflow-x-auto gap-4 pb-3 pt-1 snap-x no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-72 sm:w-80 shrink-0 bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs animate-pulse space-y-4"
              >
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-10 bg-gray-100 rounded w-full"></div>
                </div>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-10 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : dataLoadError && popularServices.length === 0 ? (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm flex items-center justify-between">
            <span>Unable to load services catalog: {dataLoadError}</span>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 font-bold text-xs cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-4 pb-3 pt-1 snap-x snap-mandatory no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {popularServices.map((service) => {
              const inCart = cart.some((c) => c.serviceId === service.id);
              return (
                <div
                  key={service.id}
                  className="w-72 sm:w-80 shrink-0 snap-start bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-500 truncate max-w-[150px]">
                        {service.category}
                      </span>
                      <span className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>4.9</span>
                      </span>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-[#1A1A1A] line-clamp-1">
                      {service.name}
                    </h3>

                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="text-lg sm:text-xl font-black text-[#0F3D2E]">
                        ₹{service.basePrice}
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium">
                        ~{service.duration || '45 mins'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        addToCart(service, 1);
                        showToast(`${service.name} added to basket`, 'success');
                      }}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm min-h-[44px] flex items-center justify-center space-x-1.5 transition-all active:scale-[0.98] cursor-pointer ${
                        inCart
                          ? 'bg-emerald-100 text-[#0F3D2E] border border-emerald-300'
                          : 'bg-[#F28C28] hover:bg-[#d9771e] text-[#0F3D2E] shadow-xs'
                      }`}
                    >
                      <span>{inCart ? 'Added ✓' : 'Book'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Global Inspection Fee & Spare Parts Policy Note (Shown ONCE) */}
        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-gray-600 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#0F3D2E] shrink-0" />
          <span>
            <strong>Transparent Pricing:</strong> {PRICING_CONFIG.inspectionFeeRule}{' '}
            {PRICING_CONFIG.partsPolicy}
          </span>
        </div>
      </section>

      {/* =========================================================
          4. BUNDLE OFFER BANNER (Frequently Booked Together)
          ========================================================= */}
      {bundlePair && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-[#FFF8F2] border border-[#F28C28]/40 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#A85800] uppercase tracking-wider">
                <Tag className="w-4 h-4 text-[#F28C28]" />
                <span>Frequently Booked Together in Mohali</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#1A1A1A]">
                {bundlePair.s1.name} + {bundlePair.s2.name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Combine AC cleaning with ceiling fan checkup in a single doorstep dispatch visit. Zero double inspection fee.
              </p>
            </div>

            <div className="shrink-0 flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
              <div>
                <span className="text-[11px] text-gray-500 block">Bundle Price</span>
                <span className="text-xl sm:text-2xl font-black text-[#0F3D2E]">
                  ₹{bundlePair.total}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  addToCart(bundlePair.s1, 1);
                  addToCart(bundlePair.s2, 1);
                  showToast('Bundle package added to basket', 'success');
                }}
                className="px-6 py-3 rounded-xl bg-[#0F3D2E] hover:bg-[#144d37] text-white text-xs sm:text-sm font-bold min-h-[44px] shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Book Both Services</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
          5. HOW IT WORKS (3 Simple Steps)
          ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] tracking-tight">
            How UrbanCare Works
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Simple 3-step home service booking with zero advance payment
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#0F3D2E]/10 text-[#0F3D2E] flex items-center justify-center font-black text-base">
                1
              </div>
              <h3 className="font-bold text-base text-[#1A1A1A]">
                Choose Service & Time Slot
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Select your repair and preferred doorstep visit slot online in under 60 seconds.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-semibold text-[#0F3D2E] flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Instant slot confirmation</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#F28C28]/20 text-[#A85800] flex items-center justify-center font-black text-base">
                2
              </div>
              <h3 className="font-bold text-base text-[#1A1A1A]">
                Technician Arrives in {PRICING_CONFIG.etaStandard}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Background-verified technician arrives with diagnostic tools and retail shop MRP hardware.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-semibold text-[#0F3D2E] flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Local dispatch from Kharar</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#0F3D2E]/10 text-[#0F3D2E] flex items-center justify-center font-black text-base">
                3
              </div>
              <h3 className="font-bold text-base text-[#1A1A1A]">
                Inspect Work & Pay ₹0 Advance
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Test the completed repair in your home first, then pay directly via UPI, Card, or Cash.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-semibold text-[#0F3D2E] flex items-center space-x-1">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Backed by 30-Day Warranty</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          6. WHY URBANCARE
          Merged local-team and physical-presence blocks.
          4 Key pillars: Local Team, ₹0 Advance, 30-Day Warranty, MRP Billing
          ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold text-[#0F3D2E] uppercase tracking-wider">
              Why UrbanCare Solution
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] tracking-tight">
              A Real Local Team Behind Every Visit
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Unlike algorithmic platforms that blindly hand tasks to unvetted strangers, we operate an on-ground center in Kharar and stand by every home visit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* Pillar 1 */}
            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[#0F3D2E]">
                <Building2 className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-[#1A1A1A]">
                Physical Kharar Office
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Office at SCF 14, Sunny Enclave, Sector 125. Real supervisors you can call or visit anytime.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[#0F3D2E]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-[#1A1A1A]">
                ₹0 Advance Payment
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                You never pay before work starts. Inspect the repair in your home, test it thoroughly, then pay.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[#0F3D2E]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-[#1A1A1A]">
                30-Day Warranty
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                If the serviced appliance or joint acts up within 30 days, we fix it with zero extra labor charge.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[#0F3D2E]">
                <Receipt className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-[#1A1A1A]">
                Genuine Retail MRP
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Capacitors, valves, and wires are billed at exact shop retail MRP with store receipts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          7. SECTOR CHECKER
          Replaces the 12 sector cards with a single interactive checker
          ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[#F8FAF9] rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="max-w-xl space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0F3D2E]">
              <MapPin className="w-4 h-4 text-[#F28C28]" />
              <span className="uppercase tracking-wider">Fast Local Dispatch</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] tracking-tight">
              Check If We Serve Your Sector
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Select your sector or Mohali pocket to see live technician availability and arrival ETA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left: Interactive Dropdown & Pincode Selector */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Select Sector / Area
                </label>
                <div className="relative">
                  <select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    className="w-full appearance-none px-4 py-3.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-[#1A1A1A] focus:border-[#0F3D2E] focus:ring-2 focus:ring-[#0F3D2E]/15 focus:outline-none cursor-pointer"
                  >
                    {SERVICE_AVAILABLE_ZONES.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-4 top-4 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Or enter Pincode (e.g. 140301, 140307, 160055)
                </label>
                <input
                  type="text"
                  value={pincodeQuery}
                  onChange={(e) => setPincodeQuery(e.target.value)}
                  placeholder="Enter 6-digit Pincode..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-800 placeholder:text-gray-400 focus:border-[#0F3D2E] focus:outline-none"
                />
              </div>
            </div>

            {/* Right: Live Coverage Status Card */}
            <div className="bg-white rounded-2xl border border-emerald-200 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                    Live Doorstep Coverage
                  </span>
                </div>
                <span className="text-xs font-bold text-[#0F3D2E] bg-emerald-50 px-2.5 py-1 rounded-md">
                  ~{activeZone.avgResponseMinutes || 30} min ETA
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-base text-[#1A1A1A]">
                  {activeZone.name}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {activeZone.description}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-semibold text-gray-700 flex items-center space-x-1">
                  <UserCheck className="w-4 h-4 text-[#0F3D2E]" />
                  <span>{activeZone.activeArtisansCount} Verified Pros active</span>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentLocality(activeZone.name);
                    setCurrentPage('services');
                    showToast(`Active sector updated to ${activeZone.sector}`, 'success');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#F28C28] hover:bg-[#d9771e] text-[#0F3D2E] font-bold text-xs min-h-[44px] transition-all active:scale-[0.98] cursor-pointer"
                >
                  Book in {activeZone.sector}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          8. CUSTOMER REVIEWS
          Real data from the project (INITIAL_REVIEWS)
          ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] tracking-tight">
            Loved by Mohali & Kharar Residents
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Real feedback from verified homeowners in Sectors 94–111
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {reviews && reviews.length > 0 ? (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-amber-500 text-amber-500"
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {rev.timestamp}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed italic">
                    "{rev.review}"
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-[#1A1A1A]">{rev.customerName}</div>
                    <div className="text-[11px] text-gray-500">{rev.locality}</div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {rev.serviceName}
                  </span>
                </div>
              </div>
            ))
          ) : (
            /* Clear placeholder if no reviews exist */
            <div className="col-span-3 p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-500 text-xs">
              Verified customer feedback will display here once completed orders are submitted.
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          9. FREQUENTLY ASKED QUESTIONS (Accordion)
          Consistent pricing rule and single ETA statement
          ========================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Clear, honest answers about inspection charges, warranty, and visits
          </p>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-[#1A1A1A] hover:bg-gray-50/70 transition-colors cursor-pointer"
                >
                  <span className="pr-4">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
