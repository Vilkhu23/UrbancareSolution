import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SERVICE_CATEGORIES, SERVICE_AVAILABLE_ZONES } from '../data/initialData';
import { CustomerOtpDisplay } from '../components/customer/CustomerOtpDisplay';
import { Hero3DScene } from '../components/home/Hero3DScene';
import { getGeneralEnquiryWhatsAppUrl } from '../utils/whatsapp';
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
  UserCheck,
  X
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
  etaStandard: 'Prompt doorstep arrival',
  etaDetailed:
    'Verified local technicians dispatched across Sectors 94–111 (Mohali & Kharar) for scheduled doorstep visits.'
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
    dataLoadError,
    setSelectedCategory,
    setServiceSearchQuery,
    setIsLocalityModalOpen
  } = useApp();

  // Search input state & live search preview
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Fast live search results as user types (multi-token matching)
  const liveSearchResults = useMemo(() => {
    const rawQ = searchQuery.trim().toLowerCase();
    if (rawQ.length < 2) return [];
    const tokens = rawQ.split(/\s+/).filter(Boolean);
    return services
      .filter((s) => s.active)
      .map((s) => {
        const nameL = s.name.toLowerCase();
        const catL = s.category.toLowerCase();
        const subL = s.subcategory.toLowerCase();
        const descL = s.description.toLowerCase();
        const inclL = (s.included_items || s.included || []).join(' ').toLowerCase();

        const matches = tokens.every(
          (t) => nameL.includes(t) || catL.includes(t) || subL.includes(t) || descL.includes(t) || inclL.includes(t)
        );
        if (!matches) return null;

        let score = 0;
        if (nameL === rawQ) score += 100;
        else if (nameL.startsWith(rawQ)) score += 50;
        else if (nameL.includes(rawQ)) score += 20;

        return { s, score };
      })
      .filter((item): item is { s: typeof services[0]; score: number } => item !== null)
      .sort((a, b) => b.score - a.score || a.s.sortOrder - b.s.sortOrder)
      .slice(0, 5)
      .map((item) => item.s);
  }, [services, searchQuery]);

  // Sector checker state
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone-sec-94');
  const [pincodeQuery, setPincodeQuery] = useState('');

  // FAQ accordion state
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(0);

  // Derive short sector name for the location pill (e.g., "Sector 94")
  const shortSectorName = useMemo(() => {
    if (!currentLocality) return 'Sector 94';
    const match = currentLocality.match(/Sector[s]?\s+\d+([–-]\d+)?/i);
    return match ? match[0] : currentLocality.split(' (')[0] || 'Sector 94';
  }, [currentLocality]);

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

  // All 9 categories ordered per Design System Section 6.6:
  // Deep Cleaning, Electrician, Plumber, AC & Appliances, Carpenter, then remaining categories
  const mainCategories = useMemo(() => {
    const preferredOrder = [
      'cleaning',
      'electrical',
      'plumbing',
      'ac-appliances',
      'carpentry',
      'fabrication',
      'painting',
      'pest-control',
      'home-projects'
    ];
    return [...SERVICE_CATEGORIES]
      .sort((a, b) => {
        const idxA = preferredOrder.indexOf(a.id);
        const idxB = preferredOrder.indexOf(b.id);
        return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
      })
      .slice(0, 9);
  }, []);

  // Category Icon helper with Design System tokens
  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'cleaning':
        return <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#0D3B2E]" />;
      case 'electrical':
        return <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-[#F79324]" />;
      case 'plumbing':
        return <Droplets className="w-5 h-5 sm:w-6 sm:h-6 text-sky-700" />;
      case 'ac-appliances':
        return <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-[#0D3B2E]" />;
      case 'carpentry':
        return <Hammer className="w-5 h-5 sm:w-6 sm:h-6 text-stone-700" />;
      case 'fabrication':
        return <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-700" />;
      case 'painting':
        return <Paintbrush className="w-5 h-5 sm:w-6 sm:h-6 text-rose-700" />;
      case 'pest-control':
        return <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-[#B42318]" />;
      case 'home-projects':
        return <HardHat className="w-5 h-5 sm:w-6 sm:h-6 text-[#0D3B2E]" />;
      default:
        return <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-[#0D3B2E]" />;
    }
  };

  // Min active price computed from real service catalog per Section 6.5
  const minActivePrice = useMemo(() => {
    const active = services.filter((s) => s.active);
    return active.length > 0 ? Math.min(...active.map((s) => s.basePrice)) : 149;
  }, [services]);

  // Popular repairs per Design System Section 6.7:
  // Horizontal scroll, only Active services, sorted by price ascending
  const popularServices = useMemo(() => {
    return services
      .filter((s) => s.active)
      .sort((a, b) => a.basePrice - b.basePrice)
      .slice(0, 8);
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
    setServiceSearchQuery(searchQuery);
    setCurrentPage('services');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Quick Chip click
  const handleChipClick = (chip: string) => {
    setSearchQuery(chip);
    setServiceSearchQuery(chip);
    setCurrentPage('services');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Category click
  const handleCategoryClick = (cat: typeof mainCategories[0]) => {
    if (cat.id === 'home-projects') {
      setCurrentPage('projects');
    } else {
      setSelectedCategory(cat.name);
      setServiceSearchQuery('');
      setCurrentPage('services');
    }
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
      a: `${PRICING_CONFIG.etaDetailed} Our technicians are dispatched from our Kharar Operations Hub, reaching enclaves in Sectors 94–111 for prompt scheduled doorstep visits.`
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
    <div className="space-y-6 sm:space-y-12 lg:space-y-16 pb-20 font-['Inter',sans-serif]">
      {/* =========================================================
          1. HERO SECTION (Original Illustrated Home-Services Hero)
          - Forest-green branding & Warm-orange CTAs (#0D3B2E & #F79324)
          - Prominent combined Location Selector & 52px Search Field (16px font)
          - Dual CTAs: Primary 52px "Book a Service" (text #0D3B2E on orange) + Secondary 48px "WhatsApp Us"
          - Compact trust indicators row
          - Responsive layouts for mobile, tablet, and desktop
          ========================================================= */}
      <section className="bg-gradient-to-b from-[#EBF3EE] via-[#F4F8F5] to-white pt-4 sm:pt-8 pb-5 sm:pb-8 border-b border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
            {/* Left Column: Headlines, Location Selector, Search, CTAs & Trust Chips */}
            <div className="lg:col-span-7 space-y-3.5 sm:space-y-4 lg:space-y-5 text-center lg:text-left">
              {/* Sector Dispatch Badge */}
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0D3B2E]/10 border border-[#0D3B2E]/15 text-[#0D3B2E] text-xs font-semibold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>Serving Sectors 94–111, Mohali & Kharar</span>
              </div>

              {/* Main Headline & Subtitle */}
              <div className="space-y-2.5">
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-[#0D3B2E] tracking-tight leading-tight hero-headline-reveal">
                  Trusted Home Repairs in{' '}
                  <span className="text-[#F79324] hero-location-accent inline-block relative">
                    Kharar & Mohali
                    <span className="hero-location-underline" aria-hidden="true" />
                  </span>
                </h1>
                <p className="text-xs sm:text-base text-[#626B73] leading-relaxed max-w-xl mx-auto lg:mx-0 hero-subtitle-reveal">
                  Verified local electricians, plumbers & technicians at your doorstep. ₹0 advance payment.
                </p>
              </div>

              {/* Mobile Hero 3D Animated Scene (Compact 16:9 responsive frame, preserving all 3 artisans) */}
              <div className="lg:hidden my-2 sm:my-3">
                <Hero3DScene variant="mobile" />
              </div>

              {/* Prominent Combined Location Selector & Search Field (Height 52px, 16px font to prevent iOS zoom) */}
              <div className="bg-white rounded-2xl p-2 sm:p-2.5 border border-[#E2E6E4] shadow-sm focus-within:shadow-md focus-within:border-[#0D3B2E] transition-all flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl mx-auto lg:mx-0">
                {/* Prominent Location Selector Pill */}
                <button
                  type="button"
                  id="hero-location-selector"
                  onClick={() => setIsLocalityModalOpen(true)}
                  className="flex items-center justify-between sm:justify-start space-x-2 px-3 py-2 rounded-xl bg-[#E7F3EC] hover:bg-[#d8ece0] border border-[#0D3B2E]/20 text-[#0D3B2E] text-xs font-bold transition-all min-h-[44px] shrink-0 cursor-pointer"
                  title="Change serving locality or sector"
                  aria-label={`Current location: ${shortSectorName}. Tap to change sector.`}
                >
                  <div className="flex items-center space-x-1.5 truncate">
                    <MapPin className="w-4 h-4 text-[#F79324] shrink-0" />
                    <span className="truncate max-w-[140px] sm:max-w-[130px] font-bold text-[#202124]">
                      {shortSectorName}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#0D3B2E] shrink-0" />
                </button>

                {/* Search Field (52px height, 16px font to prevent iOS auto-zoom) */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="flex-1 relative flex items-center min-w-0"
                >
                  <Search className="w-4 h-4 absolute left-3.5 text-[#626B73] pointer-events-none" />
                  <input
                    type="text"
                    id="hero-service-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => {
                      setTimeout(() => setIsSearchFocused(false), 250);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setSearchQuery('');
                    }}
                    placeholder="Search AC, plumbing, repairs…"
                    className="w-full pl-10 pr-28 py-3 rounded-xl border border-[#E2E6E4] sm:border-transparent bg-[#F7F8F7] sm:bg-transparent text-base text-[#202124] placeholder:text-[#626B73] focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]/20 transition-all h-[52px]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      title="Clear / delete search query (Esc)"
                      className="absolute right-20 p-1.5 rounded-full text-[#626B73] hover:text-[#202124] hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    id="hero-search-submit"
                    className="absolute right-1 px-3.5 py-2 rounded-lg bg-[#F79324] hover:bg-[#E2810F] active:scale-95 text-[#0D3B2E] text-xs font-bold transition-all min-h-[38px] flex items-center justify-center cursor-pointer shadow-xs"
                  >
                    Search
                  </button>

                  {/* Fast Live Search Dropdown */}
                  {searchQuery.trim().length >= 2 && isSearchFocused && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-[#c0c9c2]/50 p-2 z-50 animate-fadeIn text-left">
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 text-[11px] text-[#707973] font-semibold">
                        <span>{liveSearchResults.length} Instant Results</span>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSearchQuery('');
                          }}
                          className="hover:text-red-600 flex items-center space-x-0.5 cursor-pointer text-[#707973]"
                        >
                          <X className="w-3 h-3" />
                          <span>Clear / Delete</span>
                        </button>
                      </div>
                      {liveSearchResults.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {liveSearchResults.map((srv) => (
                            <div
                              key={srv.id}
                              onMouseDown={() => {
                                setServiceSearchQuery(srv.name);
                                setSelectedCategory(srv.category);
                                setCurrentPage('services');
                                setSearchQuery('');
                              }}
                              className="p-2.5 hover:bg-[#faf8ff] rounded-xl cursor-pointer flex items-center justify-between transition-colors"
                            >
                              <div>
                                <div className="font-bold text-xs text-[#131b2e]">{srv.name}</div>
                                <div className="text-[10px] text-[#707973]">{srv.category} · {srv.subcategory}</div>
                              </div>
                              <div className="text-right">
                                <span className="font-extrabold text-xs text-[#003523]">
                                  {srv.price_type === 'QUOTE_REQUIRED' ? 'Quote' : `₹${srv.base_price}`}
                                </span>
                                <div className="text-[9px] text-[#fe932c] font-bold">View details →</div>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onMouseDown={handleSearchSubmit}
                            className="w-full text-center py-2 text-xs font-bold text-[#003523] hover:underline cursor-pointer"
                          >
                            View all results in catalogue →
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-xs text-[#707973]">
                          No services match &ldquo;{searchQuery}&rdquo;. Press Enter to post custom request.
                        </div>
                      )}
                    </div>
                  )}
                </form>
              </div>

              {/* 5 Quick Symptom Chips */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2 text-xs">
                <span className="text-[#626B73] font-medium mr-0.5 text-[11px] sm:text-xs">Quick search:</span>
                {quickChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleChipClick(chip)}
                    className="px-2.5 py-1 rounded-lg border border-[#E2E6E4] bg-white hover:border-[#0D3B2E] hover:bg-[#E7F3EC] text-[#202124] font-medium text-[11px] sm:text-xs transition-all cursor-pointer active:scale-95"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Dual CTAs: Primary 52px "Book a Service" (text #0D3B2E on orange, NEVER white) + Secondary 48px "WhatsApp Us" */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2.5 pt-1">
                <button
                  type="button"
                  id="hero-primary-cta"
                  onClick={() => {
                    setCurrentPage('services');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group w-full sm:w-auto px-6 h-[52px] rounded-xl bg-[#F79324] hover:bg-[#E2810F] text-[#0D3B2E] font-bold text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 flex items-center justify-center space-x-2 focus-visible:ring-2 focus-visible:ring-[#0D3B2E] focus-visible:outline-none cursor-pointer"
                >
                  <span>Book a Service</span>
                  <ArrowRight className="w-4 h-4 shrink-0 text-[#0D3B2E] transition-transform duration-200 group-hover:translate-x-1" />
                </button>

                <a
                  href={getGeneralEnquiryWhatsAppUrl(currentLocality)}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="hero-whatsapp-cta"
                  className="w-full sm:w-auto px-5 h-[48px] rounded-xl border-[1.5px] border-[#0D3B2E] text-[#0D3B2E] bg-transparent hover:bg-[#E7F3EC] font-bold text-sm transition-all flex items-center justify-center space-x-2 focus-visible:ring-2 focus-visible:ring-[#0D3B2E] focus-visible:outline-none cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                  <span>WhatsApp Us</span>
                </a>
              </div>

              {/* Compact Trust Indicators (Wrapped Cleanly for 320px screens) */}
              <div className="pt-2">
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-[#0D3B2E]">
                  <div className="hero-trust-badge hero-trust-badge-1 inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full bg-white/90 border border-emerald-200/70 shadow-2xs">
                    <Check className="w-3 h-3 text-[#0D3B2E] stroke-[3] shrink-0" />
                    <span>₹0 Advance</span>
                  </div>
                  <div className="hero-trust-badge hero-trust-badge-2 inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full bg-white/90 border border-emerald-200/70 shadow-2xs">
                    <Check className="w-3 h-3 text-[#0D3B2E] stroke-[3] shrink-0" />
                    <span>Pay After Work</span>
                  </div>
                  <div className="hero-trust-badge hero-trust-badge-3 inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full bg-white/90 border border-emerald-200/70 shadow-2xs">
                    <Check className="w-3 h-3 text-[#0D3B2E] stroke-[3] shrink-0" />
                    <span>Verified Pros</span>
                  </div>
                  <div className="hero-trust-badge hero-trust-badge-4 inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full bg-white/90 border border-emerald-200/70 shadow-2xs">
                    <Check className="w-3 h-3 text-[#0D3B2E] stroke-[3] shrink-0" />
                    <span>30-Day Warranty</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Desktop/Tablet 3D Animated Hero Scene with Parallax */}
            <div className="hidden lg:block lg:col-span-5 relative">
              <Hero3DScene variant="desktop" />
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
                <span className="w-2.5 h-2.5 rounded-full bg-[#F79324] animate-pulse" />
                <span className="text-xs font-bold text-[#0D3B2E] uppercase tracking-wider">
                  Active Service Request
                </span>
                <span className="text-xs bg-white px-2 py-0.5 rounded-md font-mono font-bold text-gray-800 border border-emerald-200">
                  #{activeOrder.id}
                </span>
              </div>
              <div className="text-sm font-bold text-[#202124]">
                {activeOrder.items.map((i) => i.serviceName).join(', ')}
              </div>
              <div className="text-xs text-[#626B73]">
                Status: <strong className="text-[#0D3B2E]">{activeOrder.status}</strong> · {activeOrder.locality}
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
              className="w-full sm:w-auto px-5 py-2.5 bg-[#0D3B2E] hover:bg-[#0A2E24] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all min-h-[44px] flex items-center justify-center space-x-2 focus-visible:ring-2 focus-visible:ring-[#0D3B2E] focus-visible:outline-none cursor-pointer"
            >
              <span>Track Live Status</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* =========================================================
          PROMO BANNER (Design System Section 6.5)
          - One card, 16px radius, green gradient (--color-primary to #145A45)
          - Copy: "Services from ₹{min active price} • ₹0 advance • Pay after completion"
          - One orange "Book a Service" button
          ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl p-4 sm:p-6 bg-gradient-to-r from-[#0D3B2E] to-[#145A45] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#F79324]">
              Doorstep Transparency Promise
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Services from ₹{minActivePrice} • ₹0 advance • Pay after completion
            </h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              Standard repairs backed by genuine retail MRP hardware billing and 30-day workmanship warranty.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCurrentPage('services');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-6 h-[48px] rounded-xl bg-[#F79324] hover:bg-[#E2810F] text-[#0D3B2E] font-bold text-xs sm:text-sm shrink-0 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <span>Book a Service</span>
            <ArrowRight className="w-4 h-4 text-[#0D3B2E]" />
          </button>
        </div>
      </section>

      {/* =========================================================
          2. CATEGORIES SECTION (Responsive 3 Columns on Standard Mobile Screens)
          - Exactly 3 columns on standard mobile screens (320px–430px)
          - Direct link to filtered category in ServicesPage
          ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-[#202124] tracking-tight">
              Explore Services
            </h2>
            <p className="text-xs sm:text-sm text-[#626B73] mt-0.5">
              Verified local technicians ready across Sectors 94–111
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setServiceSearchQuery('');
              setCurrentPage('services');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs sm:text-sm font-bold text-[#0D3B2E] hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>All 35+ Services</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Responsive Service Category Grid: EXACTLY 3 COLUMNS ON MOBILE */}
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 sm:gap-3 md:gap-4">
          {mainCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              id={`cat-card-${cat.id}`}
              onClick={() => handleCategoryClick(cat)}
              className="p-2 sm:p-3.5 rounded-2xl border border-[#E2E6E4] bg-[#F7F8F7] hover:border-[#0D3B2E] hover:bg-[#E7F3EC] transition-all text-center flex flex-col items-center justify-center space-y-1.5 sm:space-y-2 group shadow-2xs hover:shadow-xs active:scale-[0.96] min-h-[76px] sm:min-h-[96px] cursor-pointer"
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white group-hover:bg-[#E7F3EC] flex items-center justify-center border border-[#E2E6E4] transition-colors shrink-0">
                {getCategoryIcon(cat.id)}
              </div>
              <div className="w-full">
                <div className="text-[11px] sm:text-xs font-bold text-[#202124] group-hover:text-[#0D3B2E] transition-colors leading-tight line-clamp-2">
                  {cat.name}
                </div>
                <div className="text-[9px] sm:text-[10px] text-[#626B73] mt-0.5 font-medium truncate">
                  {cat.count} services
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* =========================================================
          3. POPULAR SERVICES (Horizontal Swipe Carousel)
          Active services sorted by price ascending per Section 6.7.
          "Book" button has dark green text on orange (WCAG AA 5.4:1).
          ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#202124] tracking-tight">
              Popular Doorstep Repairs
            </h2>
            <p className="text-xs sm:text-sm text-[#626B73] mt-0.5">
              Most requested repairs in Mohali & Kharar this week
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCurrentPage('services');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs sm:text-sm font-bold text-[#0D3B2E] hover:underline flex items-center space-x-1 cursor-pointer"
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
                className="w-72 sm:w-80 shrink-0 bg-white rounded-2xl border border-[#E2E6E4] p-5 shadow-xs animate-pulse space-y-4"
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
                  className="w-[260px] sm:w-80 shrink-0 snap-start bg-white rounded-2xl border border-[#E2E6E4] p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#626B73] truncate max-w-[150px]">
                        {service.category}
                      </span>
                      <span className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold">
                        <Star className="w-3 h-3 fill-[#F79324] text-[#F79324]" />
                        <span>4.9</span>
                      </span>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-[#202124] line-clamp-1">
                      {service.name}
                    </h3>

                    <p className="text-xs text-[#626B73] line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="text-lg sm:text-xl font-black text-[#0D3B2E]">
                        from ₹{service.basePrice}
                      </div>
                      <div className="text-[11px] text-[#626B73] font-medium">
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
                          ? 'bg-[#E7F3EC] text-[#0D3B2E] border border-emerald-300'
                          : 'bg-[#F79324] hover:bg-[#E2810F] text-[#0D3B2E] shadow-xs'
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
        <div className="p-3 bg-[#E7F3EC] rounded-xl border border-emerald-200/60 text-xs text-[#0D3B2E] flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#0D3B2E] shrink-0" />
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
          <div className="bg-[#FFF4E0] border border-[#F79324]/40 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#B45309] uppercase tracking-wider">
                <Tag className="w-4 h-4 text-[#F79324]" />
                <span>Frequently Booked Together in Mohali</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#202124]">
                {bundlePair.s1.name} + {bundlePair.s2.name}
              </h3>
              <p className="text-xs sm:text-sm text-[#626B73] leading-relaxed">
                Combine AC cleaning with ceiling fan checkup in a single doorstep dispatch visit. Zero double inspection fee.
              </p>
            </div>

            <div className="shrink-0 flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
              <div>
                <span className="text-[11px] text-[#626B73] block">Bundle Price</span>
                <span className="text-xl sm:text-2xl font-black text-[#0D3B2E]">
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
                className="px-6 py-3 rounded-xl bg-[#0D3B2E] hover:bg-[#0A2E24] text-white text-xs sm:text-sm font-bold min-h-[44px] shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer"
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
          <h2 className="text-xl sm:text-2xl font-bold text-[#202124] tracking-tight">
            How UrbanCare Works
          </h2>
          <p className="text-xs sm:text-sm text-[#626B73]">
            Simple 3-step home service booking with zero advance payment
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl border border-[#E2E6E4] p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#0D3B2E]/10 text-[#0D3B2E] flex items-center justify-center font-black text-base">
                1
              </div>
              <h3 className="font-bold text-base text-[#202124]">
                Choose Service & Time Slot
              </h3>
              <p className="text-xs sm:text-sm text-[#626B73] leading-relaxed">
                Select your repair and preferred doorstep visit slot online in under 60 seconds.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-semibold text-[#0D3B2E] flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Instant slot confirmation</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl border border-[#E2E6E4] p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF4E0] text-[#B45309] flex items-center justify-center font-black text-base">
                2
              </div>
              <h3 className="font-bold text-base text-[#202124]">
                Technician Arrives at Doorstep
              </h3>
              <p className="text-xs sm:text-sm text-[#626B73] leading-relaxed">
                Background-verified technician arrives with diagnostic tools and retail shop MRP hardware.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-semibold text-[#0D3B2E] flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Local dispatch from Kharar</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl border border-[#E2E6E4] p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#0D3B2E]/10 text-[#0D3B2E] flex items-center justify-center font-black text-base">
                3
              </div>
              <h3 className="font-bold text-base text-[#202124]">
                Inspect Work & Pay ₹0 Advance
              </h3>
              <p className="text-xs sm:text-sm text-[#626B73] leading-relaxed">
                Test the completed repair in your home first, then pay directly via UPI, Card, or Cash.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-semibold text-[#0D3B2E] flex items-center space-x-1">
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
        <div className="bg-white rounded-2xl border border-[#E2E6E4] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold text-[#0D3B2E] uppercase tracking-wider">
              Why UrbanCare Solution
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#202124] tracking-tight">
              A Real Local Team Behind Every Visit
            </h2>
            <p className="text-xs sm:text-sm text-[#626B73] leading-relaxed">
              Unlike algorithmic platforms that blindly hand tasks to unvetted strangers, we operate an on-ground center in Kharar and stand by every home visit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* Pillar 1 */}
            <div className="p-4 rounded-xl bg-[#F7F8F7] border border-[#E2E6E4] space-y-2">
              <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E6E4] flex items-center justify-center text-[#0D3B2E]">
                <Building2 className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-[#202124]">
                Physical Kharar Office
              </h4>
              <p className="text-xs text-[#626B73] leading-relaxed">
                Office at SCF 14, Sunny Enclave, Sector 125. Real supervisors you can call or visit anytime.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-4 rounded-xl bg-[#F7F8F7] border border-[#E2E6E4] space-y-2">
              <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E6E4] flex items-center justify-center text-[#0D3B2E]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-[#202124]">
                ₹0 Advance Payment
              </h4>
              <p className="text-xs text-[#626B73] leading-relaxed">
                You never pay before work starts. Inspect the repair in your home, test it thoroughly, then pay.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-4 rounded-xl bg-[#F7F8F7] border border-[#E2E6E4] space-y-2">
              <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E6E4] flex items-center justify-center text-[#0D3B2E]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-[#202124]">
                30-Day Warranty
              </h4>
              <p className="text-xs text-[#626B73] leading-relaxed">
                If the serviced appliance or joint acts up within 30 days, we fix it with zero extra labor charge.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-4 rounded-xl bg-[#F7F8F7] border border-[#E2E6E4] space-y-2">
              <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E6E4] flex items-center justify-center text-[#0D3B2E]">
                <Receipt className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-[#202124]">
                Genuine Retail MRP
              </h4>
              <p className="text-xs text-[#626B73] leading-relaxed">
                Capacitors, valves, and wires are billed at exact shop retail MRP with store receipts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          7. SECTOR CHECKER
          16px font inputs to prevent iOS zoom, #0D3B2E / #F79324 tokens
          ========================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[#F7F8F7] rounded-2xl border border-[#E2E6E4] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="max-w-xl space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#0D3B2E]">
              <MapPin className="w-4 h-4 text-[#F79324]" />
              <span className="uppercase tracking-wider">Fast Local Dispatch</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#202124] tracking-tight">
              Check If We Serve Your Sector
            </h2>
            <p className="text-xs sm:text-sm text-[#626B73]">
              Select your sector or Mohali pocket to see live technician availability and arrival ETA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left: Interactive Dropdown & Pincode Selector */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#202124] mb-1.5">
                  Select Sector / Area
                </label>
                <div className="relative">
                  <select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    className="w-full appearance-none px-4 py-3.5 rounded-xl border border-[#E2E6E4] bg-white text-base font-semibold text-[#202124] focus:border-[#0D3B2E] focus:ring-2 focus:ring-[#0D3B2E]/15 focus:outline-none cursor-pointer"
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
                <label className="block text-xs font-semibold text-[#626B73] mb-1">
                  Or enter Pincode (e.g. 140301, 140307, 160055)
                </label>
                <input
                  type="text"
                  value={pincodeQuery}
                  onChange={(e) => setPincodeQuery(e.target.value)}
                  placeholder="Enter 6-digit Pincode..."
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E6E4] bg-white text-base text-[#202124] placeholder:text-gray-400 focus:border-[#0D3B2E] focus:outline-none"
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
                <span className="text-xs font-bold text-[#0D3B2E] bg-[#E7F3EC] px-2.5 py-1 rounded-md">
                  ~{activeZone.avgResponseMinutes || 30} min ETA
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-base text-[#202124]">
                  {activeZone.name}
                </h3>
                <p className="text-xs text-[#626B73] leading-relaxed">
                  {activeZone.description}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-semibold text-[#202124] flex items-center space-x-1">
                  <UserCheck className="w-4 h-4 text-[#0D3B2E]" />
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
                  className="px-4 py-2.5 rounded-xl bg-[#F79324] hover:bg-[#E2810F] text-[#0D3B2E] font-bold text-xs min-h-[44px] transition-all active:scale-[0.98] cursor-pointer shadow-xs"
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
          <h2 className="text-xl sm:text-2xl font-bold text-[#202124] tracking-tight">
            Loved by Mohali & Kharar Residents
          </h2>
          <p className="text-xs sm:text-sm text-[#626B73]">
            Real feedback from verified homeowners in Sectors 94–111
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {reviews && reviews.length > 0 ? (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-2xl border border-[#E2E6E4] p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-[#F79324] text-[#F79324]"
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-[#626B73] font-medium">
                      {rev.timestamp}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#202124] leading-relaxed italic">
                    "{rev.review}"
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-[#202124]">{rev.customerName}</div>
                    <div className="text-[11px] text-[#626B73]">{rev.locality}</div>
                  </div>
                  <span className="text-[10px] font-semibold text-[#0D3B2E] bg-[#E7F3EC] px-2 py-0.5 rounded-md">
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
