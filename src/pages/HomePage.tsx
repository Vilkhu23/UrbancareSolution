import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SERVICE_CATEGORIES, SERVICE_AVAILABLE_ZONES } from '../data/initialData';
import { ViewAllServicesModal } from '../components/customer/ViewAllServicesModal';
import { formatServicePricing } from '../utils/pricingEngine';
import {
  Search,
  Wrench,
  Zap,
  Droplets,
  Hammer,
  Paintbrush,
  Sparkles,
  ShieldAlert,
  Heart,
  Scissors,
  Home,
  PlusCircle,
  Star,
  ArrowRight,
  ShieldCheck,
  Plus,
  Minus,
  Info,
  Layers,
  PhoneCall,
  Clock,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  Grid,
  MapPin,
  CheckCircle2,
  Phone,
  HelpCircle
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const {
    currentLocality,
    setCurrentLocality,
    setIsLocalityModalOpen,
    services,
    packages,
    cart,
    addToCart,
    addPackageToCart,
    updateCartQuantity,
    setSelectedDetailServiceId,
    setIsCustomTaskModalOpen,
    setIsProjectModalOpen,
    setCurrentPage,
    requests,
    setActiveTrackingRequestId,
    reviews,
    showToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('AC & Appliances');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [catalogMode, setCatalogMode] = useState<'all' | 'services' | 'packages'>('all');
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(0);

  // Quick problem symptom suggestions
  const searchChips = [
    'AC not cooling',
    'Ceiling fan repair',
    'Water tap leaking',
    'Bathroom deep cleaning',
    'Switchboard repair',
    'Kitchen modular quote',
    'Water motor repair'
  ];

  // Active category object
  const activeCategoryObj = useMemo(() => {
    return (
      SERVICE_CATEGORIES.find((c) => c.name.toLowerCase() === selectedCategory.toLowerCase()) ||
      SERVICE_CATEGORIES[0]
    );
  }, [selectedCategory]);

  // Available subcategories for selected category
  const availableSubcategories = activeCategoryObj.subcategories || [];

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (!s.active) return false;

      // Search match
      const q = searchQuery.toLowerCase().trim();
      if (q !== '') {
        const matchesQuery =
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.subcategory.toLowerCase().includes(q) ||
          (s.included && s.included.some((inc) => inc.toLowerCase().includes(q)));
        if (!matchesQuery) return false;
      } else {
        // Category match
        if (s.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
        // Subcategory match
        if (selectedSubcategory !== 'All' && s.subcategory !== selectedSubcategory) {
          return false;
        }
      }

      return true;
    });
  }, [services, searchQuery, selectedCategory, selectedSubcategory]);

  // Packages matching category
  const categoryPackages = useMemo(() => {
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
      return p.category.toLowerCase() === selectedCategory.toLowerCase();
    });
  }, [packages, searchQuery, selectedCategory]);

  const activeRequest = requests[0];

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'ac-appliances': return <Wrench className="w-5 h-5 text-[#003523]" />;
      case 'electrical': return <Zap className="w-5 h-5 text-[#904d00]" />;
      case 'plumbing': return <Droplets className="w-5 h-5 text-[#003523]" />;
      case 'carpentry': return <Hammer className="w-5 h-5 text-[#404943]" />;
      case 'fabrication': return <Hammer className="w-5 h-5 text-[#904d00]" />;
      case 'painting': return <Paintbrush className="w-5 h-5 text-[#904d00]" />;
      case 'cleaning': return <Sparkles className="w-5 h-5 text-[#003523]" />;
      case 'pest-control': return <ShieldAlert className="w-5 h-5 text-[#ba1a1a]" />;
      case 'salon-women': return <Heart className="w-5 h-5 text-[#ba1a1a]" />;
      case 'grooming-men': return <Scissors className="w-5 h-5 text-[#404943]" />;
      case 'home-projects': return <Home className="w-5 h-5 text-[#003523]" />;
      default: return <PlusCircle className="w-5 h-5 text-[#003523]" />;
    }
  };

  // Frequently Booked Together Pair
  const bundlePair = useMemo(() => {
    const s1 = services.find((s) => s.id === 'srv-ac-foam');
    const s2 = services.find((s) => s.id === 'srv-fan-repair');
    if (s1 && s2) {
      return { s1, s2, total: s1.basePrice + s2.basePrice };
    }
    return null;
  }, [services]);

  // General FAQs for catalogue
  const catalogueFaqs = [
    {
      q: 'How does local operations dispatch protect customer pricing and safety?',
      a: 'Unlike algorithmic aggregator apps that blindly push leads to unvetted gig workers, every UrbanCare Solution booking is audited by our Kharar dispatch officer at Sector 125, Sunny Enclave. We assign an accountable, background-verified technician equipped with verified tools and enforce genuine retail shop MRP billing on replacement parts.'
    },
    {
      q: 'What is the pricing policy for inspection fees and spare parts?',
      a: 'Doorstep inspection fees range from ₹149 to ₹199 and cover comprehensive diagnostics. If you proceed with the repair or book a care package, the visit fee is waived. All hardware replacement parts (capacitors, brass valves, wires) are billed strictly at retail shop MRP with shop receipts.'
    },
    {
      q: 'Do I have to pay any advance before work begins?',
      a: 'No. Standard home repairs require ₹0 advance payment. You inspect and test the completed work in your home first, then pay directly via UPI or Cash. For large Home Projects (modular kitchens, renovations), payments are tied to verified civil delivery milestones.'
    },
    {
      q: 'What is covered under the UrbanCare Solution 30-Day Workmanship Warranty?',
      a: 'If any serviced appliance, repaired joint, tap fitting, or switchboard re-develops an issue within 30 days of completion, our local dispatch supervisor schedules a technician visit with zero extra charge.'
    },
    {
      q: 'How do I request a custom repair or complete home renovation?',
      a: 'Tap "Post Custom Task" for unique domestic breakdowns, or click "Start a Home Project" for modular kitchens, painting, or renovations. A senior civil supervisor visits your residence for laser measurement and prepares an itemized Bill of Quantities (BOQ).'
    }
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Top Operations Desk Status Ribbon */}
      <div className="bg-[#002114] text-white border-b border-[#144d37]/50 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#fe932c] animate-pulse"></span>
            <span className="font-bold text-[#b6efd1]">UrbanCare Operations Dispatch Desk:</span>
            <span className="text-gray-200">Dispatches active across {currentLocality} (Sectors 94 to 111, Mohali)</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-gray-300">
            <span>Direct Dispatch: <strong className="text-white">+91 8284018909</strong></span>
            <span className="hidden md:inline">·</span>
            <span className="text-[#fe932c] font-semibold hidden md:inline">₹0 Advance · Pay After Completion</span>
          </div>
        </div>
      </div>

      {/* 2. Primary 5-Second Comprehension Hero Section */}
      <section className="bg-gradient-to-b from-[#f2f3ff] via-[#faf8ff] to-white pt-6 pb-10 border-b border-[#c0c9c2]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          {/* Main Headline & Trust Kicker */}
          <div className="max-w-3xl space-y-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#003523]">
              <span className="px-2.5 py-0.5 rounded-full bg-[#c0edd3]/60 text-[#003523] uppercase tracking-wider text-[11px]">
                Mohali Doorstep Care
              </span>
              <span>· Sectors 94 to 111 · Mohali</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#131b2e] tracking-tight leading-tight">
              Honest Home Services & Repairs in Kharar & Mohali
            </h1>
            <p className="text-sm sm:text-base text-[#404943] leading-relaxed">
              From quick AC and electrical repairs to modular kitchens and turnkey renovations. Handled by verified local technicians, managed and guaranteed by our Kharar Operations Team.
            </p>
          </div>

          {/* 5-Second Clarity Grid: 4 Core Answers for the Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* Box 1: Available Services */}
            <div className="p-4 rounded-xl bg-white border border-[#c0c9c2]/60 shadow-xs flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-[#003523] font-bold text-xs">
                  <Wrench className="w-4 h-4 text-[#003523]" />
                  <span>1. What We Offer</span>
                </div>
                <div className="text-sm font-extrabold text-[#131b2e]">
                  Repairs, Combos & Projects
                </div>
                <p className="text-xs text-[#707973]">
                  AC, electrical, plumbing, carpentry, cleaning, painting & full home renovations.
                </p>
              </div>
              <div className="text-[11px] text-[#003523] font-bold mt-2 pt-2 border-t border-[#c0c9c2]/30">
                Starting ₹149 inspection fee
              </div>
            </div>

            {/* Box 2: Clear Pricing */}
            <div className="p-4 rounded-xl bg-white border border-[#c0c9c2]/60 shadow-xs flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-[#904d00] font-bold text-xs">
                  <Tag className="w-4 h-4 text-[#fe932c]" />
                  <span>2. What It Costs</span>
                </div>
                <div className="text-sm font-extrabold text-[#131b2e]">
                  Transparent & Honest Rates
                </div>
                <p className="text-xs text-[#707973]">
                  Fixed diagnostic fee waived with repair. Spare parts billed at retail shop MRP.
                </p>
              </div>
              <div className="text-[11px] text-[#904d00] font-bold mt-2 pt-2 border-t border-[#c0c9c2]/30">
                ₹0 Advance · Pay on completion
              </div>
            </div>

            {/* Box 3: How to Book */}
            <div className="p-4 rounded-xl bg-white border border-[#c0c9c2]/60 shadow-xs flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-[#003523] font-bold text-xs">
                  <Clock className="w-4 h-4 text-[#003523]" />
                  <span>3. How to Book</span>
                </div>
                <div className="text-sm font-extrabold text-[#131b2e]">
                  Pick Slot in 2 Clicks
                </div>
                <p className="text-xs text-[#707973]">
                  Select service, choose your preferred doorstep slot, and receive instant booking ID.
                </p>
              </div>
              <div className="text-[11px] text-[#003523] font-bold mt-2 pt-2 border-t border-[#c0c9c2]/30">
                Doorstep visit within 90 mins
              </div>
            </div>

            {/* Box 4: Local Operations Governance */}
            <div className="p-4 rounded-xl bg-[#c0edd3]/25 border border-[#b6efd1] shadow-xs flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-[#003523] font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-[#003523]" />
                  <span>4. Local Ops Supervision</span>
                </div>
                <div className="text-sm font-extrabold text-[#131b2e]">
                  Human Team in Kharar
                </div>
                <p className="text-xs text-[#404943]">
                  Every job is manually assigned and inspected by our local supervisor.
                </p>
              </div>
              <div className="text-[11px] text-[#003523] font-bold mt-2 pt-2 border-t border-[#b6efd1]/60">
                Backed by 30-day warranty
              </div>
            </div>
          </div>

          {/* Quick Problem Symptom Search & Filter Bar */}
          <div className="space-y-3 pt-2">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-3.5 text-[#707973]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by repair or symptom (e.g. AC not cooling, fan repair, leaking tap, switchboard)..."
                className="w-full pl-12 pr-16 py-3.5 rounded-xl border border-[#c0c9c2] bg-white text-sm text-[#131b2e] placeholder:text-gray-400 focus:border-[#003523] focus:ring-2 focus:ring-[#003523]/10 shadow-xs transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-3.5 text-xs font-bold text-[#707973] hover:text-[#131b2e] bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Symptom Chips */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-[#707973] whitespace-nowrap pl-0.5 font-medium">Common Needs:</span>
              {searchChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setSearchQuery(chip);
                    const el = document.getElementById('services-catalog-view');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`px-3 py-1.5 rounded-lg border whitespace-nowrap text-xs font-medium transition-colors ${
                    searchQuery === chip
                      ? 'bg-[#003523] text-white border-[#003523]'
                      : 'bg-white text-[#404943] border-[#c0c9c2]/60 hover:border-[#003523] hover:bg-[#faf8ff]'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* 3 Prominent CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <button
              onClick={() => {
                const el = document.getElementById('services-catalog-view');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-4 bg-white rounded-xl border border-[#c0c9c2]/70 hover:border-[#003523] shadow-xs hover:shadow-sm transition-all text-left group flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffdcc3] text-[#904d00] flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#131b2e] group-hover:text-[#003523]">
                    Book Quick Service
                  </div>
                  <div className="text-xs text-[#707973]">Doorstep visit in 90 mins</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#707973] group-hover:text-[#003523] group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="p-4 bg-white rounded-xl border border-[#c0c9c2]/70 hover:border-[#003523] shadow-xs hover:shadow-sm transition-all text-left group flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#c0edd3] text-[#003523] flex items-center justify-center font-bold">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#131b2e] group-hover:text-[#003523]">
                    Start a Home Project
                  </div>
                  <div className="text-xs text-[#707973]">Modular kitchen & renovation</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#707973] group-hover:text-[#003523] group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setIsCustomTaskModalOpen(true)}
              className="p-4 bg-white rounded-xl border border-[#c0c9c2]/70 hover:border-[#003523] shadow-xs hover:shadow-sm transition-all text-left group flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#eaedff] text-[#003523] flex items-center justify-center font-bold">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#131b2e] group-hover:text-[#003523]">
                    Post Custom Task
                  </div>
                  <div className="text-xs text-[#707973]">Have a unique domestic repair?</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#707973] group-hover:text-[#003523] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Active Ongoing Order Tracker (if exists) */}
      {activeRequest && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-[#eaedff] border border-[#c0c9c2]/60 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#fe932c] animate-pulse"></span>
                <span className="text-xs font-bold text-[#003523] uppercase tracking-wider">
                  Active Service Request
                </span>
                <span className="text-xs bg-white px-2 py-0.5 rounded-md font-mono font-bold text-[#131b2e]">
                  #{activeRequest.id}
                </span>
              </div>
              <div className="text-sm font-bold text-[#131b2e]">
                {activeRequest.items.map((i) => i.serviceName).join(', ')}
              </div>
              <div className="text-xs text-[#404943]">
                Status: <strong className="text-[#003523]">{activeRequest.status}</strong> · {activeRequest.locality} · Preferred Slot: {activeRequest.preferredTimeSlot}
              </div>
            </div>

            <button
              onClick={() => setActiveTrackingRequestId(activeRequest.id)}
              className="px-4 py-2 bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center space-x-1.5 self-stretch sm:self-auto justify-center"
            >
              <span>Track Live Status</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}

      {/* 3. Popular Service Categories Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#131b2e]">Explore by Category</h2>
            <p className="text-xs text-[#707973]">
              Verified local artisan teams active across Sectors 94 to 111 (Mohali)
            </p>
          </div>
          <button
            onClick={() => setIsViewAllModalOpen(true)}
            className="text-xs font-bold text-[#003523] hover:underline flex items-center space-x-1"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>All Categories ({SERVICE_CATEGORIES.length})</span>
          </button>
        </div>

        {/* Popular Category Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {SERVICE_CATEGORIES.filter((c) => c.popular).map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase() && !searchQuery;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setSelectedSubcategory('All');
                  setSearchQuery('');
                  const el = document.getElementById('services-catalog-view');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center space-y-2 group ${
                  isSelected
                    ? 'bg-[#c0edd3]/25 border-[#003523] shadow-xs ring-1 ring-[#003523]'
                    : 'bg-white border-[#c0c9c2]/50 hover:border-[#003523] hover:bg-[#faf8ff]'
                }`}
              >
                <div className="w-11 h-11 rounded-lg bg-[#f2f3ff] group-hover:bg-[#eaedff] flex items-center justify-center transition-colors">
                  {getCategoryIcon(cat.id)}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#131b2e] leading-tight">{cat.name}</div>
                  <div className="text-[11px] text-[#707973] mt-0.5">{cat.count} services</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Frequently Booked Together Smart Banner */}
      {bundlePair && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-[#ffdcc3]/20 border border-[#fe932c]/50 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#904d00]">
                <Tag className="w-4 h-4 text-[#fe932c]" />
                <span className="uppercase tracking-wider">Frequently Booked Together in Kharar</span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#131b2e]">
                {bundlePair.s1.name} + {bundlePair.s2.name}
              </h3>
              <p className="text-xs text-[#404943]">
                Combine AC power wash with ceiling fan inspection during a single dispatch visit. Zero double visit fee.
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <div>
                <span className="text-[10px] text-[#707973] block">Bundle Price</span>
                <span className="text-lg sm:text-xl font-black text-[#003523]">₹{bundlePair.total}</span>
              </div>
              <button
                onClick={() => {
                  addToCart(bundlePair.s1, 1);
                  addToCart(bundlePair.s2, 1);
                  showToast('Bundle added to your basket', 'success');
                }}
                className="px-4 py-2.5 rounded-lg bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold shadow-xs active:scale-98 transition-all flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Both (₹{bundlePair.total})</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 5. Main Services & Packages Catalogue */}
      <section id="services-catalog-view" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Category Header Strip */}
        <div className="border-b border-[#c0c9c2]/40 pb-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#003523] bg-[#c0edd3]/30 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {selectedCategory}
                </span>
                <span className="text-xs text-[#707973]">
                  · {activeCategoryObj.description}
                </span>
              </div>
              <h2 className="text-2xl font-black text-[#131b2e] mt-1">
                {selectedCategory}
              </h2>
            </div>

            {/* Mode Toggle: All vs Singles vs Packages */}
            <div className="flex items-center space-x-1 bg-[#eaedff] p-1 rounded-lg self-start sm:self-auto text-xs font-bold">
              <button
                onClick={() => setCatalogMode('all')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  catalogMode === 'all'
                    ? 'bg-white text-[#003523] shadow-xs'
                    : 'text-[#404943] hover:text-[#131b2e]'
                }`}
              >
                All Options ({filteredServices.length + categoryPackages.length})
              </button>
              <button
                onClick={() => setCatalogMode('services')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  catalogMode === 'services'
                    ? 'bg-white text-[#003523] shadow-xs'
                    : 'text-[#404943] hover:text-[#131b2e]'
                }`}
              >
                Single Services ({filteredServices.length})
              </button>
              <button
                onClick={() => setCatalogMode('packages')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  catalogMode === 'packages'
                    ? 'bg-white text-[#003523] shadow-xs'
                    : 'text-[#404943] hover:text-[#131b2e]'
                }`}
              >
                Care Packages ({categoryPackages.length})
              </button>
            </div>
          </div>

          {/* Subcategory Navigation Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedSubcategory('All')}
              className={`px-3 py-1.5 rounded-md border whitespace-nowrap font-bold transition-all ${
                selectedSubcategory === 'All'
                  ? 'bg-[#003523] text-white border-[#003523]'
                  : 'bg-white text-[#404943] border-[#c0c9c2]/60 hover:border-[#003523]'
              }`}
            >
              All Subcategories
            </button>
            {availableSubcategories.map((sub) => {
              const isSelected = selectedSubcategory === sub;
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubcategory(sub)}
                  className={`px-3 py-1.5 rounded-md border whitespace-nowrap font-bold transition-all ${
                    isSelected
                      ? 'bg-[#003523] text-white border-[#003523]'
                      : 'bg-white text-[#404943] border-[#c0c9c2]/60 hover:border-[#003523]'
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. Packages Spotlight */}
        {(catalogMode === 'all' || catalogMode === 'packages') && categoryPackages.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#904d00] uppercase tracking-wider">
                CARE PACKAGES · Complete Multi-Point Servicing
              </span>
              <span className="text-xs text-[#003523] font-bold">Direct Savings · Zero Doorstep Visit Fee</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white rounded-xl border border-[#fe932c]/50 p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#003523]">{pkg.savings}</span>
                      <span className="bg-[#ffdcc3] text-[#904d00] font-bold text-[10px] px-2 py-0.5 rounded">
                        CARE COMBO
                      </span>
                    </div>

                    <h3 className="text-base font-black text-[#131b2e]">{pkg.name}</h3>
                    <p className="text-xs text-[#404943] leading-relaxed">{pkg.description}</p>

                    <div className="space-y-1.5 pt-2 text-xs">
                      {pkg.included.map((inc, i) => (
                        <div key={i} className="flex items-start space-x-2 text-[#131b2e]">
                          <Check className="w-3.5 h-3.5 text-[#003523] shrink-0 mt-0.5" />
                          <span className="text-[11px]">{inc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#c0c9c2]/40 flex items-center justify-between mt-4">
                    <div>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-xl font-black text-[#003523]">₹{pkg.price}</span>
                        <span className="text-xs text-[#707973] line-through">₹{pkg.originalPrice}</span>
                      </div>
                      <div className="text-[10px] text-[#003523] font-bold">Visit Fee Waived</div>
                    </div>

                    <button
                      onClick={() => addPackageToCart(pkg)}
                      className="px-4 py-2 rounded-lg bg-[#fe932c] hover:bg-[#e07f24] text-[#002114] font-bold text-xs shadow-xs active:scale-98 transition-all"
                    >
                      Book Package
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. Individual Service Cards Grid */}
        {(catalogMode === 'all' || catalogMode === 'services') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#003523] uppercase tracking-wider">
                {selectedSubcategory === 'All' ? 'INDIVIDUAL SERVICES' : selectedSubcategory.toUpperCase()}
              </span>
              <span className="text-xs text-[#707973]">
                Showing {filteredServices.length} options
              </span>
            </div>

            {filteredServices.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-[#c0c9c2]/50 space-y-3">
                <Search className="w-8 h-8 text-[#707973] mx-auto" />
                <h3 className="text-base font-bold text-[#131b2e]">No exact matches found</h3>
                <p className="text-xs text-[#707973]">
                  Have a specific domestic repair? You can post your custom requirement directly.
                </p>
                <button
                  onClick={() => setIsCustomTaskModalOpen(true)}
                  className="px-4 py-2 bg-[#003523] text-white rounded-lg text-xs font-bold"
                >
                  Post Custom Requirement
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices.map((service) => {
                  const pricing = formatServicePricing(service);
                  const inCart = cart.find((c) => c.serviceId === service.id);
                  const count = inCart ? inCart.quantity : 0;
                  const inclusions = (service.included_items || service.included || []).slice(0, 2);

                  return (
                    <div
                      key={service.id}
                      className="bg-white rounded-xl border border-[#c0c9c2]/60 hover:border-[#003523] p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        {/* Top Metadata: Subcategory & Badge */}
                        <div className="flex items-center justify-between">
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

                        {/* Service Title & Plain Description */}
                        <div>
                          <h3 className="text-base font-extrabold text-[#131b2e] leading-snug group-hover:text-[#003523] transition-colors">
                            {service.name}
                          </h3>
                          <p className="text-xs text-[#404943] line-clamp-2 mt-1 leading-relaxed">
                            {service.description}
                          </p>
                        </div>

                        {/* Rating (when real) & Duration & Guarantee */}
                        <div className="flex items-center space-x-3 text-xs text-[#707973]">
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
                              Verified Artisan
                            </span>
                          )}
                          <span>·</span>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-[#003523]" />
                            <span>{service.duration || service.estimatedDuration || '45-60 mins'}</span>
                          </div>
                        </div>

                        {/* Inclusions summary */}
                        {inclusions.length > 0 && (
                          <div className="p-2.5 rounded-lg bg-[#faf8ff] border border-[#c0c9c2]/30 space-y-1">
                            <span className="text-[10px] font-bold text-[#131b2e] uppercase block">
                              What's Included:
                            </span>
                            {inclusions.map((inc, i) => (
                              <div key={i} className="flex items-start space-x-1.5 text-[11px] text-[#404943]">
                                <Check className="w-3 h-3 text-[#003523] shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{inc}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Pricing Card Bottom Action Area */}
                      <div className="pt-4 border-t border-[#c0c9c2]/40 flex items-center justify-between mt-4">
                        <div>
                          {pricing.isQuoteRequired ? (
                            <div>
                              <span className="text-base font-black text-[#003523]">
                                Request Quote
                              </span>
                              <div className="text-[10px] text-[#707973]">
                                {pricing.visitFeeText}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-baseline space-x-1.5">
                                <span className="text-xl font-black text-[#003523]">
                                  {pricing.priceFormatted}
                                </span>
                                {pricing.originalPriceFormatted && (
                                  <span className="text-xs text-[#707973] line-through">
                                    {pricing.originalPriceFormatted}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#707973]">
                                {pricing.visitFeeText}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedDetailServiceId(service.id)}
                            className="p-2 rounded-lg text-[#707973] hover:text-[#131b2e] hover:bg-[#eaedff] transition-colors"
                            title="View Full Scope & Policy"
                          >
                            <Info className="w-4 h-4" />
                          </button>

                          {pricing.isQuoteRequired ? (
                            <button
                              onClick={() => setIsCustomTaskModalOpen(true)}
                              className="px-4 py-2 rounded-lg bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs flex items-center space-x-1 shadow-xs active:scale-98 transition-all"
                            >
                              <span>Request Quote</span>
                              <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </button>
                          ) : count > 0 ? (
                            <div className="flex items-center bg-[#003523] text-white rounded-lg p-1 space-x-1 shadow-xs">
                              <button
                                onClick={() => updateCartQuantity(service.id, -1)}
                                className="w-6 h-6 flex items-center justify-center font-bold text-xs hover:bg-[#144d37] rounded"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-bold px-2">{count}</span>
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
                              className="px-4 py-2 rounded-lg bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs flex items-center space-x-1 shadow-xs active:scale-98 transition-all"
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
            )}
          </div>
        )}
      </section>

      {/* 8. Local Operations Desk Card (Physical Credibility) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-xl border border-[#c0c9c2]/70 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#003523]">
              <MapPin className="w-4 h-4 text-[#fe932c]" />
              <span className="uppercase tracking-wider">Physical Presence · Kharar Operations Hub</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#131b2e]">
              A Real Local Team Behind Every Doorstep Visit
            </h3>
            <p className="text-xs sm:text-sm text-[#404943] leading-relaxed">
              We operate an on-ground office at SCF 14, Sector 125, Sunny Enclave, Kharar. When you book a service, our dispatch supervisor personally reviews the problem, verifies the required tools, and ensures our artisan carries retail shop MRP receipts for any spare parts.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#131b2e] font-semibold">
              <span className="flex items-center space-x-1 text-[#003523]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#003523]" />
                <span>Background Verified Artisans</span>
              </span>
              <span>·</span>
              <span className="flex items-center space-x-1 text-[#003523]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#003523]" />
                <span>Transparent MRP Billing</span>
              </span>
              <span>·</span>
              <span className="flex items-center space-x-1 text-[#003523]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#003523]" />
                <span>30-Day Workmanship Warranty</span>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto">
            <a
              href="tel:+918284018909"
              className="px-5 py-3 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-xs transition-all"
            >
              <Phone className="w-4 h-4 text-[#fe932c]" />
              <span>Call Dispatch: +91 82840 18909</span>
            </a>
            <button
              onClick={() => setIsCustomTaskModalOpen(true)}
              className="px-5 py-3 rounded-xl border border-[#c0c9c2] hover:border-[#003523] bg-[#faf8ff] text-xs font-bold text-[#131b2e] flex items-center justify-center space-x-1.5 transition-all"
            >
              <span>Describe Unique Problem</span>
            </button>
          </div>
        </div>
      </section>

      {/* Service Available Zones & Locations: Sectors 94 to 111 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#003523]">
              <span className="w-2 h-2 rounded-full bg-[#fe932c] animate-pulse"></span>
              <span className="uppercase tracking-wider">Active Doorstep Coverage</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#131b2e]">
              Service Available Zones & Locations (Sectors 94 to 111)
            </h2>
            <p className="text-xs text-[#707973] max-w-2xl">
              Dedicated vans and verified local artisans positioned across every GMADA, Emaar, TDI, and JLPL residential corridor for fast ~20–30 min arrival.
            </p>
          </div>

          <button
            onClick={() => setIsLocalityModalOpen(true)}
            className="self-start md:self-auto px-4 py-2 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all"
          >
            <MapPin className="w-3.5 h-3.5 text-[#fe932c]" />
            <span>Select Sector ({currentLocality})</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {SERVICE_AVAILABLE_ZONES.map((zone) => {
            const isCurrent = currentLocality === zone.name || currentLocality === zone.sector;
            return (
              <div
                key={zone.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  isCurrent
                    ? 'bg-[#c0edd3]/20 border-[#003523] ring-1 ring-[#003523] shadow-xs'
                    : 'bg-white border-[#c0c9c2]/60 hover:border-[#003523]/60 hover:shadow-xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-[#003523] text-white tracking-wide">
                      {zone.sector}
                    </span>
                    <span className="text-[11px] font-bold text-[#003523] flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-[#fe932c]" />
                      <span>~{zone.avgResponseMinutes} min ETA</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-[#131b2e]">
                    {zone.name}
                  </h3>

                  <p className="text-xs text-[#404943] leading-relaxed">
                    {zone.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {zone.keyEnclaves.map((enc) => (
                      <span
                        key={enc}
                        className="text-[10px] bg-[#f2f3ff] text-[#404943] font-semibold px-2 py-0.5 rounded-full border border-[#c0c9c2]/40"
                      >
                        {enc}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#c0c9c2]/30 flex items-center justify-between">
                  <span className="text-[11px] text-[#707973]">
                    {zone.activeArtisansCount} verified pros active
                  </span>

                  <button
                    onClick={() => {
                      setCurrentLocality(zone.name);
                      showToast(`Selected ${zone.sector} as your active service zone.`, 'info');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-[#003523] text-white'
                        : 'border border-[#003523] text-[#003523] hover:bg-[#c0edd3]/25'
                    }`}
                  >
                    {isCurrent ? 'Active Sector' : 'Select Sector'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. Frequently Asked Questions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-xl font-extrabold text-[#131b2e]">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-[#707973]">
            Clear, honest answers about our pricing, dispatch model, and warranty
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-2">
          {catalogueFaqs.map((faq, idx) => {
            const isOpen = activeFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-[#c0c9c2]/50 overflow-hidden shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-[#131b2e] hover:bg-[#faf8ff] transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#707973] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#707973] shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-[#404943] leading-relaxed border-t border-[#c0c9c2]/20">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* View All Services Modal */}
      <ViewAllServicesModal
        isOpen={isViewAllModalOpen}
        onClose={() => setIsViewAllModalOpen(false)}
        onSelectCategory={(catName) => {
          setSelectedCategory(catName);
          setSelectedSubcategory('All');
          const el = document.getElementById('services-catalog-view');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />
    </div>
  );
};
