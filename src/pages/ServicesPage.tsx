import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceItem, ServicePackage } from '../types';
import { SERVICE_CATEGORIES } from '../data/initialData';
import { formatServicePricing } from '../utils/pricingEngine';
import {
  Search,
  Filter,
  Check,
  Star,
  Clock,
  Sparkles,
  ShieldCheck,
  Plus,
  Minus,
  Info,
  PlusCircle,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  X,
  Grid,
  Wrench,
  Zap,
  Droplets,
  Hammer,
  Paintbrush,
  ShieldAlert,
  Home,
  Wind,
  Snowflake,
  Flame,
  Refrigerator,
  WashingMachine,
  Fan,
  BatteryCharging,
  Gauge,
  ShowerHead,
  Waves,
  DoorClosed,
  Armchair,
  Utensils,
  Bath,
  Sofa,
  Umbrella,
  Bug,
  Box,
  Layers
} from 'lucide-react';

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  'ac-appliances': '/category-banner-ac.jpg',
  'cleaning': '/category-banner-cleaning.jpg',
  'painting': '/thumb-interior-paint.jpg',
  'carpentry': '/category-banner-livingroom.jpg',
  'home-projects': '/hero-illustration.jpg',
  'fabrication': '/artisan-custom-need.jpg',
};

// Only assign distinctive photos to subservices that have dedicated photography
const SUBSERVICE_IMAGE_MAP: Record<string, string> = {
  'Wall Painting': '/thumb-wall-textures.jpg',
  'Waterproofing & Damp': '/thumb-waterproofing.jpg',
  'Wood Polish': '/thumb-wood-polish.jpg',
  'Exterior Painting': '/thumb-exterior-paint.jpg',
  'Full Home Painting': '/thumb-unfurnished-paint.jpg',
};

const getCategoryIconElement = (id: string) => {
  switch (id) {
    case 'ac-appliances':
      return <Wrench className="w-4 h-4 text-[#0D3B2E]" />;
    case 'electrical':
      return <Zap className="w-4 h-4 text-[#0D3B2E]" />;
    case 'plumbing':
      return <Droplets className="w-4 h-4 text-[#0D3B2E]" />;
    case 'carpentry':
      return <Hammer className="w-4 h-4 text-[#0D3B2E]" />;
    case 'cleaning':
      return <Sparkles className="w-4 h-4 text-[#0D3B2E]" />;
    case 'painting':
      return <Paintbrush className="w-4 h-4 text-[#0D3B2E]" />;
    case 'pest-control':
      return <ShieldAlert className="w-4 h-4 text-[#0D3B2E]" />;
    case 'fabrication':
      return <Grid className="w-4 h-4 text-[#0D3B2E]" />;
    case 'home-projects':
      return <Home className="w-4 h-4 text-[#0D3B2E]" />;
    default:
      return <Grid className="w-4 h-4 text-[#0D3B2E]" />;
  }
};

// Tailored distinct Lucide icons per subservice to avoid generic duplicates
const getSubserviceIconElement = (subName: string, categoryId?: string) => {
  const s = subName.toLowerCase();

  // AC & Appliances
  if (s.includes('foam') || s === 'ac service & repair') {
    return <Wind className="w-4 h-4 text-[#0D3B2E]" />;
  }
  if (s.includes('gas') || s.includes('cool') || s === 'ac repair & gas refill') {
    return <Snowflake className="w-4 h-4 text-[#0284C7]" />;
  }
  if (s.includes('install') || s.includes('relocation') || s === 'ac installation & relocation') {
    return <Wrench className="w-4 h-4 text-[#D97706]" />;
  }
  if (s.includes('refrigerator') || s.includes('fridge')) {
    return <Refrigerator className="w-4 h-4 text-[#0891B2]" />;
  }
  if (s.includes('washing machine')) {
    return <WashingMachine className="w-4 h-4 text-[#4F46E5]" />;
  }
  if (s.includes('ro') || s.includes('purifier') || s.includes('filter')) {
    return <Filter className="w-4 h-4 text-[#0284C7]" />;
  }
  if (s.includes('geyser') || s.includes('heater')) {
    return <Flame className="w-4 h-4 text-[#EA580C]" />;
  }

  // Electrical
  if (s.includes('fan') || s.includes('light')) {
    return <Fan className="w-4 h-4 text-[#CA8A04]" />;
  }
  if (s.includes('wiring') || s.includes('safety') || s.includes('mcb')) {
    return <ShieldCheck className="w-4 h-4 text-[#16A34A]" />;
  }
  if (s.includes('inverter') || s.includes('battery')) {
    return <BatteryCharging className="w-4 h-4 text-[#2563EB]" />;
  }

  // Plumbing
  if (s.includes('motor') || s.includes('pump')) {
    return <Gauge className="w-4 h-4 text-[#0D9488]" />;
  }
  if (s.includes('bathroom') || s.includes('shower') || s.includes('tap') || s.includes('kitchen')) {
    return <ShowerHead className="w-4 h-4 text-[#0284C7]" />;
  }
  if (s.includes('drain') || s.includes('tank')) {
    return <Waves className="w-4 h-4 text-[#0369A1]" />;
  }

  // Carpentry
  if (s.includes('door') || s.includes('window') || s.includes('lock')) {
    return <DoorClosed className="w-4 h-4 text-[#B45309]" />;
  }
  if (s.includes('furniture') || s.includes('assembly')) {
    return <Armchair className="w-4 h-4 text-[#854D0E]" />;
  }
  if (s.includes('handyman')) {
    return <Hammer className="w-4 h-4 text-[#78716C]" />;
  }

  // Gate & Grill Fabrication
  if (s.includes('gate') || s.includes('railing')) {
    return <Grid className="w-4 h-4 text-[#475569]" />;
  }
  if (s.includes('balcony') || s.includes('safety grill')) {
    return <Grid className="w-4 h-4 text-[#334155]" />;
  }
  if (s.includes('welding') || s.includes('hinge')) {
    return <Flame className="w-4 h-4 text-[#DC2626]" />;
  }
  if (s.includes('mesh') || s.includes('mosquito')) {
    return <Box className="w-4 h-4 text-[#64748B]" />;
  }
  if (s.includes('metal') || s.includes('enclosure')) {
    return <Layers className="w-4 h-4 text-[#0F172A]" />;
  }

  // Home Cleaning
  if (s.includes('kitchen')) {
    return <Utensils className="w-4 h-4 text-[#EA580C]" />;
  }
  if (s.includes('bathroom')) {
    return <Bath className="w-4 h-4 text-[#0284C7]" />;
  }
  if (s.includes('sofa') || s.includes('full home')) {
    return <Sofa className="w-4 h-4 text-[#9333EA]" />;
  }

  // Painting
  if (s.includes('paint') || s.includes('wall') || s.includes('texture')) {
    return <Paintbrush className="w-4 h-4 text-[#059669]" />;
  }
  if (s.includes('waterproof') || s.includes('damp')) {
    return <Umbrella className="w-4 h-4 text-[#0284C7]" />;
  }
  if (s.includes('polish')) {
    return <Sparkles className="w-4 h-4 text-[#D97706]" />;
  }

  // Pest Control
  if (s.includes('pest') || s.includes('termite') || s.includes('cockroach') || s.includes('rodent')) {
    return <Bug className="w-4 h-4 text-[#B91C1C]" />;
  }

  // Home Projects
  if (s.includes('renovat') || s.includes('turnkey') || s.includes('project') || s.includes('remodel')) {
    return <Home className="w-4 h-4 text-[#0D3B2E]" />;
  }

  if (categoryId) {
    return getCategoryIconElement(categoryId);
  }
  return <Wrench className="w-4 h-4 text-[#0D3B2E]" />;
};

// Distinct tailored icon per individual bookable service card
const getServiceCardIcon = (service: ServiceItem) => {
  const name = service.name.toLowerCase();
  const sub = (service.subcategory || '').toLowerCase();
  const cat = (service.category || '').toLowerCase();

  // Refrigerators
  if (name.includes('refrigerator') || name.includes('fridge')) {
    return <Refrigerator className="w-4 h-4 text-[#0891B2]" />;
  }
  // Washing Machine
  if (name.includes('washing machine') || name.includes('drum')) {
    return <WashingMachine className="w-4 h-4 text-[#4F46E5]" />;
  }
  // RO Water Purifiers
  if (name.includes('ro') || name.includes('purifier') || name.includes('filter')) {
    return <Filter className="w-4 h-4 text-[#0284C7]" />;
  }
  // Geysers
  if (name.includes('geyser') || name.includes('thermostat') || name.includes('element')) {
    return <Flame className="w-4 h-4 text-[#EA580C]" />;
  }
  // AC Services
  if (name.includes('gas') || name.includes('freon') || name.includes('refill')) {
    return <Snowflake className="w-4 h-4 text-[#0284C7]" />;
  }
  if (name.includes('foam')) {
    return <Wind className="w-4 h-4 text-[#0D3B2E]" />;
  }
  if (name.includes('install') || name.includes('relocat') || name.includes('uninstall')) {
    return <Wrench className="w-4 h-4 text-[#D97706]" />;
  }
  if (name.includes('diagnostic') || name.includes('inspect')) {
    return <ShieldCheck className="w-4 h-4 text-[#16A34A]" />;
  }
  if (cat.includes('ac') || sub.includes('ac')) {
    return <Wind className="w-4 h-4 text-[#0D3B2E]" />;
  }

  // Electrical
  if (name.includes('fan')) {
    return <Fan className="w-4 h-4 text-[#CA8A04]" />;
  }
  if (name.includes('mcb') || name.includes('trip') || name.includes('short circuit') || name.includes('switch')) {
    return <Zap className="w-4 h-4 text-[#EAB308]" />;
  }
  if (name.includes('inverter') || name.includes('battery')) {
    return <BatteryCharging className="w-4 h-4 text-[#2563EB]" />;
  }

  // Plumbing
  if (name.includes('motor') || name.includes('pump') || name.includes('submersible')) {
    return <Gauge className="w-4 h-4 text-[#0D9488]" />;
  }
  if (name.includes('tap') || name.includes('mixer') || name.includes('leak')) {
    return <Droplets className="w-4 h-4 text-[#0284C7]" />;
  }
  if (name.includes('drain') || name.includes('tank')) {
    return <Waves className="w-4 h-4 text-[#0369A1]" />;
  }

  // Carpentry
  if (name.includes('lock') || name.includes('door') || name.includes('handle')) {
    return <DoorClosed className="w-4 h-4 text-[#B45309]" />;
  }
  if (name.includes('furniture') || name.includes('assembly') || name.includes('bed')) {
    return <Armchair className="w-4 h-4 text-[#854D0E]" />;
  }

  // Gates & Fabrication
  if (name.includes('weld') || name.includes('hinge')) {
    return <Flame className="w-4 h-4 text-[#DC2626]" />;
  }
  if (name.includes('gate') || name.includes('grill') || name.includes('railing') || name.includes('mesh')) {
    return <Grid className="w-4 h-4 text-[#475569]" />;
  }

  // Cleaning
  if (name.includes('kitchen')) {
    return <Utensils className="w-4 h-4 text-[#EA580C]" />;
  }
  if (name.includes('bathroom')) {
    return <Bath className="w-4 h-4 text-[#0284C7]" />;
  }
  if (name.includes('sofa') || name.includes('deep clean')) {
    return <Sofa className="w-4 h-4 text-[#9333EA]" />;
  }

  // Painting
  if (name.includes('waterproof') || name.includes('damp')) {
    return <Umbrella className="w-4 h-4 text-[#0284C7]" />;
  }
  if (name.includes('paint') || name.includes('touch-up')) {
    return <Paintbrush className="w-4 h-4 text-[#059669]" />;
  }

  // Pest Control
  if (name.includes('termite') || name.includes('pest') || name.includes('cockroach')) {
    return <Bug className="w-4 h-4 text-[#B91C1C]" />;
  }

  // Home Projects
  if (cat.includes('project') || name.includes('renovation') || name.includes('turnkey')) {
    return <Home className="w-4 h-4 text-[#0D3B2E]" />;
  }

  return <Sparkles className="w-4 h-4 text-[#0D3B2E]" />;
};

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
    currentLocality,
    isLoadingData,
    dataLoadError,
    selectedCategory,
    serviceSearchQuery,
    setIsCartDrawerOpen
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>(
    selectedCategory && selectedCategory !== 'All' ? selectedCategory : 'All'
  );
  const [activeSubcategory, setActiveSubcategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState(serviceSearchQuery || '');
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [searchCategoryFilter, setSearchCategoryFilter] = useState<string>('All');

  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedCategory) {
      setActiveCategory(selectedCategory);
      setActiveSubcategory('All');
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (serviceSearchQuery !== undefined) {
      setSearchQuery(serviceSearchQuery);
    }
  }, [serviceSearchQuery]);

  // Close category picker on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsCategoryPickerOpen(false);
      }
    };
    if (isCategoryPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryPickerOpen]);

  // Active category definition
  const activeCategoryObj = useMemo(() => {
    return (
      SERVICE_CATEGORIES.find((c) => c.name.toLowerCase() === activeCategory.toLowerCase()) ||
      SERVICE_CATEGORIES.find((c) => c.id.toLowerCase() === activeCategory.toLowerCase()) ||
      SERVICE_CATEGORIES[0]
    );
  }, [activeCategory]);

  const availableSubcategories = activeCategory !== 'All' ? activeCategoryObj.subcategories || [] : [];

  // Multi-token search matches across entire catalogue
  const rawSearchMatches = useMemo(() => {
    const rawQ = searchQuery.trim().toLowerCase();
    if (!rawQ) return [];

    const tokens = rawQ.split(/\s+/).filter(Boolean);

    return services.filter((s) => {
      const nameL = s.name.toLowerCase();
      const descL = s.description.toLowerCase();
      const catL = s.category.toLowerCase();
      const subL = (s.subcategory || '').toLowerCase();
      const incL = (s.included_items || s.included || []).join(' ').toLowerCase();

      return tokens.every(
        (t) =>
          nameL.includes(t) ||
          descL.includes(t) ||
          catL.includes(t) ||
          subL.includes(t) ||
          incL.includes(t)
      );
    });
  }, [services, searchQuery]);

  // Distinct categories present in active search results
  const searchResultCategories = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const catMap = new Map<string, number>();
    rawSearchMatches.forEach((s) => {
      catMap.set(s.category, (catMap.get(s.category) || 0) + 1);
    });
    return Array.from(catMap.entries()).map(([name, count]) => ({ name, count }));
  }, [searchQuery, rawSearchMatches]);

  // Filtered standard services list
  const filteredServices = useMemo(() => {
    const rawQ = searchQuery.trim().toLowerCase();

    // Mode A: Browse by Category & Subcategory
    if (!rawQ) {
      return services.filter((s) => {
        if (activeCategory !== 'All' && s.category.toLowerCase() !== activeCategory.toLowerCase()) {
          return false;
        }
        if (activeSubcategory !== 'All' && s.subcategory?.toLowerCase() !== activeSubcategory.toLowerCase()) {
          return false;
        }
        return true;
      });
    }

    // Mode B: Cross-Category Search
    if (searchCategoryFilter !== 'All') {
      return rawSearchMatches.filter(
        (s) => s.category.toLowerCase() === searchCategoryFilter.toLowerCase()
      );
    }

    return rawSearchMatches;
  }, [services, activeCategory, activeSubcategory, searchQuery, rawSearchMatches, searchCategoryFilter]);

  // Context-Aware Packages Filter:
  // 1. Initial screen (activeCategory === 'All'): Never show static AC packages
  // 2. Category selected: Match packages by category_id or category name
  // 3. Subcategory selected: Show packages relevant to the subcategory; hide when viewing unrelated subcategories
  // 4. Search: Match search query tokens; do not show AC packages for unrelated searches
  const matchingPackages = useMemo(() => {
    const rawQ = searchQuery.trim().toLowerCase();

    // Mode 1: Search Query active
    if (rawQ) {
      const tokens = rawQ.split(/\s+/).filter(Boolean);
      return packages
        .filter((p) => p.active)
        .filter((p) => {
          if (searchCategoryFilter !== 'All') {
            const filterLower = searchCategoryFilter.toLowerCase();
            const matchesCat =
              (p.category_id && p.category_id.toLowerCase() === filterLower) ||
              (p.category && p.category.toLowerCase() === filterLower);
            if (!matchesCat) return false;
          }
          const nameL = p.name.toLowerCase();
          const descL = p.description.toLowerCase();
          const catL = (p.category || '').toLowerCase();
          const subcatL = (p.subcategory || '').toLowerCase();
          const inclL = (p.included || []).join(' ').toLowerCase();

          return tokens.every(
            (t) =>
              nameL.includes(t) ||
              descL.includes(t) ||
              catL.includes(t) ||
              subcatL.includes(t) ||
              inclL.includes(t)
          );
        });
    }

    // Mode 2: Initial screen with All Categories -> Never show static AC packages
    if (activeCategory === 'All') {
      return [];
    }

    // Mode 3: Specific Category Selected
    const selectedCat = SERVICE_CATEGORIES.find(
      (c) =>
        c.id.toLowerCase() === activeCategory.toLowerCase() ||
        c.name.toLowerCase() === activeCategory.toLowerCase()
    );

    return packages.filter((p) => {
      if (!p.active) return false;

      // Stable category match (by ID or category name)
      const matchesCategory =
        (selectedCat && p.category_id && p.category_id.toLowerCase() === selectedCat.id.toLowerCase()) ||
        (selectedCat && p.category && p.category.toLowerCase() === selectedCat.name.toLowerCase()) ||
        (p.category_id && p.category_id.toLowerCase() === activeCategory.toLowerCase()) ||
        (p.category && p.category.toLowerCase() === activeCategory.toLowerCase());

      if (!matchesCategory) return false;

      // Subcategory filtering
      if (activeSubcategory !== 'All') {
        const activeSubL = activeSubcategory.toLowerCase();
        const pkgSubL = (p.subcategory || '').toLowerCase();

        // Direct subcategory match
        if (pkgSubL === activeSubL) return true;

        // If viewing an AC subcategory and the package is AC-related
        const isACSubcategory = activeSubL.includes('ac');
        const isACPackage = p.id.includes('ac') || (p.name && p.name.toLowerCase().includes('ac'));
        if (isACSubcategory && isACPackage) return true;

        // Hide when viewing unrelated subcategories (e.g. Refrigerator, Washing Machine, Fans & Lights)
        return false;
      }

      // activeSubcategory === 'All': display all packages in this category
      return true;
    });
  }, [packages, activeCategory, activeSubcategory, searchQuery, searchCategoryFilter]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3.5 sm:py-6 space-y-3.5 sm:space-y-5 pb-28 sm:pb-24 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      {/* Page Header */}
      <div className="space-y-1.5 border-b border-[#E2E6E4] pb-3 sm:pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-[#202124] tracking-tight">
            Explore Services & Rates
          </h1>
          <p className="text-xs sm:text-sm text-[#626B73]">
            Verified doorstep repairs and maintenance for {currentLocality} and surrounding sectors.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCustomTaskModalOpen(true)}
          className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[#0D3B2E] hover:bg-[#0A2E24] text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs shrink-0 self-start sm:self-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
        >
          <PlusCircle className="w-4 h-4 text-[#F79324]" />
          <span>Post Custom Requirement</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#626B73]" />
          <input
            type="text"
            id="service-search-input"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchCategoryFilter('All');
            }}
            placeholder="Search by appliance, symptom (e.g., 'cooling issue', 'tap leakage', 'MCB')..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#E2E6E4] bg-white text-xs sm:text-sm text-[#202124] placeholder-[#626B73] focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] focus:border-transparent transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchCategoryFilter('All');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#626B73] hover:text-[#202124] p-0.5 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Cross-Category Search Results Banner & Filter Pills */}
        {searchQuery.trim() && (
          <div className="space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs bg-[#E7F3EC] border border-[#0D3B2E]/20 px-3.5 py-2 rounded-xl text-[#0D3B2E]">
              <span>
                Found <strong>{filteredServices.length + matchingPackages.length}</strong> matching results for &ldquo;<strong>{searchQuery}</strong>&rdquo;
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchCategoryFilter('All');
                }}
                className="text-xs font-bold text-[#0D3B2E] hover:underline flex items-center space-x-1 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            {/* Cross-Category Pills if matches span multiple categories */}
            {searchResultCategories.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] font-bold text-[#626B73] shrink-0 mr-1">Filter by:</span>
                <button
                  type="button"
                  onClick={() => setSearchCategoryFilter('All')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    searchCategoryFilter === 'All'
                      ? 'bg-[#0D3B2E] text-white shadow-2xs'
                      : 'bg-white border border-[#E2E6E4] text-[#626B73] hover:border-[#0D3B2E]/40'
                  }`}
                >
                  All Categories ({rawSearchMatches.length})
                </button>
                {searchResultCategories.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setSearchCategoryFilter(cat.name)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      searchCategoryFilter === cat.name
                        ? 'bg-[#0D3B2E] text-white shadow-2xs'
                        : 'bg-white border border-[#E2E6E4] text-[#626B73] hover:border-[#0D3B2E]/40'
                    }`}
                  >
                    {cat.name} ({cat.count})
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================================= */}
      {/* 1. DEFAULT STATE: Compact Main Service Category Grid (when activeCategory === 'All') */}
      {/* Reduced height by ~25% (aspect-[4/3]), 3-col on standard mobile screens */}
      {/* ======================================================================= */}
      {!searchQuery.trim() && activeCategory === 'All' && (
        <section aria-labelledby="all-categories-heading" className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-[#0D3B2E]" />
              <h2 id="all-categories-heading" className="text-xs sm:text-sm font-black text-[#202124] uppercase tracking-wider">
                Service Categories
              </h2>
            </div>
            <span className="text-[10px] sm:text-[11px] text-[#626B73]">
              Select a category to view rate card
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-2 sm:gap-2.5">
            {SERVICE_CATEGORIES.map((cat) => {
              const imageUrl = CATEGORY_IMAGE_MAP[cat.id];

              return (
                <button
                  key={cat.id}
                  type="button"
                  id={`cat-tile-${cat.id}`}
                  onClick={() => {
                    setActiveCategory(cat.name);
                    setActiveSubcategory('All');
                  }}
                  className="aspect-[4/3] sm:aspect-square rounded-xl sm:rounded-2xl border border-[#E2E6E4] hover:border-[#0D3B2E]/60 bg-[#F7F8F7] text-center flex flex-col items-center justify-end p-1.5 sm:p-2 transition-all relative overflow-hidden group min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E] shadow-2xs hover:shadow-xs hover:scale-[1.02]"
                >
                  {imageUrl ? (
                    <>
                      <img
                        src={imageUrl}
                        alt={cat.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent group-hover:from-black/75 transition-opacity" />
                      <span className="relative z-10 text-[10px] sm:text-[11px] font-bold text-white leading-tight drop-shadow-md line-clamp-2 text-center px-0.5">
                        {cat.name}
                      </span>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-1 p-1 bg-white group-hover:bg-[#E7F3EC]/50 transition-colors">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#E7F3EC] flex items-center justify-center text-[#0D3B2E] shrink-0">
                        {getCategoryIconElement(cat.id)}
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold text-[#202124] leading-tight line-clamp-2 text-center px-0.5">
                        {cat.name}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ======================================================================= */}
      {/* 2. SELECTED-CATEGORY STATE: Compact Header & 2-Col Subcategories (Grid is HIDDEN) */}
      {/* Main grid is completely unmounted; replaced with header, compact 2-col subcategories */}
      {/* ======================================================================= */}
      {!searchQuery.trim() && activeCategory !== 'All' && (
        <section aria-label="Selected Category" className="space-y-2.5 animate-fadeIn">
          {/* Compact Category Header with Back Arrow & Switcher Dropdown */}
          <div className="bg-white rounded-xl border border-[#E2E6E4] p-2.5 sm:p-3 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
              <button
                type="button"
                id="btn-back-to-categories"
                onClick={() => {
                  setActiveCategory('All');
                  setActiveSubcategory('All');
                }}
                className="w-8 h-8 rounded-lg bg-[#F7F8F7] hover:bg-[#E7F3EC] text-[#0D3B2E] flex items-center justify-center transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
                aria-label="Back to all categories"
                title="Back to all categories"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#E7F3EC] flex items-center justify-center text-[#0D3B2E] shrink-0">
                  {getCategoryIconElement(activeCategoryObj.id)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#626B73]">
                      Category
                    </span>
                    <span className="text-[#626B73]">•</span>
                    <span className="text-[10px] text-[#0D3B2E] font-semibold">
                      {activeCategoryObj.count} services
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-base font-black text-[#202124] truncate">
                    {activeCategory}
                  </h2>
                </div>
              </div>
            </div>

            {/* Change Category Dropdown Switcher */}
            <div className="relative shrink-0" ref={pickerRef}>
              <button
                type="button"
                id="btn-category-switcher"
                onClick={() => setIsCategoryPickerOpen(!isCategoryPickerOpen)}
                className="px-2.5 py-1.5 rounded-lg border border-[#E2E6E4] hover:border-[#0D3B2E] bg-[#F7F8F7] text-[11px] sm:text-xs font-bold text-[#0D3B2E] flex items-center space-x-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
              >
                <span>Change</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isCategoryPickerOpen && (
                <div className="absolute right-0 mt-1.5 w-60 sm:w-64 bg-white rounded-xl shadow-lg border border-[#E2E6E4] py-1.5 z-50 max-h-80 overflow-y-auto">
                  <div className="px-3 py-1.5 border-b border-[#E2E6E4] flex items-center justify-between text-[11px] font-bold text-[#626B73]">
                    <span>Switch Category</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory('All');
                        setActiveSubcategory('All');
                        setIsCategoryPickerOpen(false);
                      }}
                      className="text-[#0D3B2E] hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                  {SERVICE_CATEGORIES.map((cat) => {
                    const isCurrent = cat.name.toLowerCase() === activeCategory.toLowerCase();
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setActiveCategory(cat.name);
                          setActiveSubcategory('All');
                          setIsCategoryPickerOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-[#E7F3EC]/50 transition-colors cursor-pointer ${
                          isCurrent ? 'bg-[#E7F3EC] font-bold text-[#0D3B2E]' : 'text-[#202124]'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="shrink-0">{getCategoryIconElement(cat.id)}</span>
                          <span className="truncate">{cat.name}</span>
                        </div>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-[#0D3B2E] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Subcategories (2-column layout on mobile) */}
          {availableSubcategories.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#626B73] uppercase tracking-wider">
                  {activeCategory} Subcategories
                </span>
                <span className="text-[10px] text-[#626B73]">
                  {activeSubcategory === 'All' ? 'Showing all subservices' : activeSubcategory}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5">
                {/* 'All in this Category' Subservice Tile */}
                <button
                  type="button"
                  onClick={() => setActiveSubcategory('All')}
                  className={`min-h-[48px] p-2 rounded-xl border text-left flex items-center space-x-2.5 transition-all relative overflow-hidden group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E] ${
                    activeSubcategory === 'All'
                      ? 'bg-[#0D3B2E] text-white border-[#0D3B2E] ring-2 ring-[#0D3B2E] shadow-2xs'
                      : 'bg-white text-[#202124] border-[#E2E6E4] hover:border-[#0D3B2E]/60 hover:bg-[#E7F3EC]/40'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 ${
                      activeSubcategory === 'All' ? 'bg-white/20 text-white' : 'bg-[#E7F3EC] text-[#0D3B2E]'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-xs font-bold block leading-tight truncate ${
                        activeSubcategory === 'All' ? 'text-white' : 'text-[#202124]'
                      }`}
                    >
                      All {activeCategory}
                    </span>
                    <span
                      className={`text-[10px] block leading-tight truncate ${
                        activeSubcategory === 'All' ? 'text-white/80' : 'text-[#626B73]'
                      }`}
                    >
                      Full Catalogue
                    </span>
                  </div>
                  {activeSubcategory === 'All' && (
                    <span className="w-2 h-2 rounded-full bg-[#F79324] ring-2 ring-white shrink-0" />
                  )}
                </button>

                {/* Individual Subservice Distinct Visual Tiles */}
                {availableSubcategories.map((sub) => {
                  const isSubSelected = activeSubcategory === sub;
                  const subImageUrl = SUBSERVICE_IMAGE_MAP[sub];

                  return (
                    <button
                      key={sub}
                      type="button"
                      id={`sub-tile-${sub.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => setActiveSubcategory(sub)}
                      className={`min-h-[48px] p-2 rounded-xl border text-left flex items-center space-x-2.5 transition-all relative overflow-hidden group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E] ${
                        isSubSelected
                          ? 'bg-[#0D3B2E] text-white border-[#0D3B2E] ring-2 ring-[#0D3B2E] shadow-2xs'
                          : 'bg-white text-[#202124] border-[#E2E6E4] hover:border-[#0D3B2E]/60 hover:bg-[#E7F3EC]/40'
                      }`}
                    >
                      {/* Compact thumbnail image or distinct tailored icon */}
                      <div
                        className={`w-9 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 ${
                          isSubSelected ? 'bg-white/20 text-white' : 'bg-[#E7F3EC]'
                        }`}
                      >
                        {subImageUrl ? (
                          <img
                            src={subImageUrl}
                            alt={sub}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {getSubserviceIconElement(sub, activeCategoryObj?.id)}
                          </div>
                        )}
                      </div>

                      {/* Subcategory Label */}
                      <div className="min-w-0 flex-1">
                        <span
                          className={`text-xs font-bold block leading-tight line-clamp-2 ${
                            isSubSelected ? 'text-white' : 'text-[#202124]'
                          }`}
                        >
                          {sub}
                        </span>
                      </div>

                      {/* Active Selection Indicator */}
                      {isSubSelected && (
                        <span className="w-2 h-2 rounded-full bg-[#F79324] ring-2 ring-white shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ======================================================================= */}
      {/* 3. CONTEXT-AWARE CARE PACKAGES: Only rendered when matchingPackages > 0 */}
      {/* Never rendered on all-categories screen or in unrelated contexts */}
      {/* ======================================================================= */}
      {matchingPackages.length > 0 && (
        <section aria-labelledby="care-packages-heading" className="space-y-2 pt-0.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span id="care-packages-heading" className="text-xs font-black text-[#B45309] uppercase tracking-wider">
              Care Packages ({matchingPackages.length})
            </span>
            <span className="text-xs text-[#626B73]">Bundled Multi-Unit Care</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {matchingPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl border border-[#F79324]/40 p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-[#B45309] bg-[#FFF4E0] px-2 py-0.5 rounded border border-[#F79324]/20">
                      PACKAGE
                    </span>
                    {pkg.duration && (
                      <span className="text-[10px] text-[#626B73] flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-[#626B73]" />
                        <span>{pkg.duration}</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-[#202124]">{pkg.name}</h3>
                  <p className="text-xs text-[#626B73] line-clamp-2 mt-1">{pkg.description}</p>

                  {/* Key inclusions */}
                  {pkg.included && pkg.included.length > 0 && (
                    <div className="mt-2.5 space-y-1 bg-[#F7F8F7] p-2 rounded-xl border border-[#E2E6E4]/70">
                      {pkg.included.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex items-center space-x-1.5 text-[11px] text-[#202124]">
                          <Check className="w-3 h-3 text-[#0D3B2E] shrink-0" />
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-xs font-bold text-[#0D3B2E] mt-2">{pkg.savings}</div>
                </div>

                <div className="pt-3 border-t border-[#E2E6E4] flex items-center justify-between mt-3">
                  <div>
                    <span className="text-lg font-black text-[#0D3B2E]">₹{pkg.price}</span>
                    <span className="text-xs text-[#626B73] line-through ml-1.5">₹{pkg.originalPrice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => addPackageToCart(pkg)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#F79324] hover:bg-[#E2810F] text-[#0D3B2E] text-xs font-bold shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
                  >
                    Add Package
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {dataLoadError && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-red-600 shrink-0" />
            <span>Failed to load live service rates from cloud database: {dataLoadError}</span>
          </div>
        </div>
      )}

      {/* Services Section */}
      <section aria-labelledby="services-list-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="services-list-heading" className="text-base sm:text-lg font-black text-[#202124]">
              {searchQuery.trim()
                ? `Search Results (${filteredServices.length})`
                : activeCategory === 'All'
                ? 'All Services & Standard Repairs'
                : `${activeCategory} Services`}
            </h2>
            <p className="text-xs text-[#626B73]">
              Upfront rates, guaranteed artisan dispatch & 30-day warranty
            </p>
          </div>
        </div>

        {isLoadingData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E2E6E4] p-5 space-y-4">
                <div className="h-4 bg-[#E7F3EC] rounded w-2/3"></div>
                <div className="h-3 bg-[#E7F3EC] rounded w-full"></div>
                <div className="pt-3 border-t border-[#E2E6E4] flex justify-between items-center">
                  <div className="h-6 bg-[#E7F3EC] rounded w-16"></div>
                  <div className="h-8 bg-[#E7F3EC] rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E6E4] p-8 sm:p-10 text-center space-y-4 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-[#E7F3EC] text-[#0D3B2E] flex items-center justify-center mx-auto">
              <Search className="w-6 h-6 text-[#0D3B2E]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm sm:text-base text-[#202124]">
                No services found {searchQuery.trim() ? `for "${searchQuery}"` : 'matching your criteria'}
              </h3>
              <p className="text-xs text-[#626B73] max-w-sm mx-auto leading-relaxed">
                Try searching by common symptoms like &ldquo;cooling&rdquo;, &ldquo;leakage&rdquo;, &ldquo;wiring&rdquo;, or choose from our top doorstep services below.
              </p>
            </div>

            {/* Quick Recovery Category Chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              {['AC Service', 'Plumber', 'Electrician', 'Deep Cleaning', 'Carpenter'].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setSearchQuery(chip);
                    setSearchCategoryFilter('All');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#E2E6E4] bg-[#F7F8F7] hover:border-[#0D3B2E] hover:bg-[#E7F3EC] text-xs font-semibold text-[#0D3B2E] transition-all cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchCategoryFilter('All');
                  setActiveCategory('All');
                  setActiveSubcategory('All');
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#0D3B2E] text-[#0D3B2E] hover:bg-[#E7F3EC] text-xs font-bold transition-colors cursor-pointer"
              >
                Clear Filters & Show All Services
              </button>
              <button
                type="button"
                onClick={() => setIsCustomTaskModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#0D3B2E] hover:bg-[#0A2E24] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <PlusCircle className="w-4 h-4 text-[#F79324]" />
                <span>Post Custom Requirement</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredServices.map((service) => {
              const pricing = formatServicePricing(service);
              const inCart = cart.find((c) => c.serviceId === service.id);
              const count = inCart ? inCart.quantity : 0;
              const inclusions = (service.included_items || service.included || []).slice(0, 2);

              return (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl border border-[#E2E6E4] hover:border-[#0D3B2E] p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-[#626B73] uppercase tracking-wider">
                        {service.subcategory}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-bold text-[#0D3B2E] bg-[#E7F3EC] px-2 py-0.5 rounded border border-[#0D3B2E]/20">
                          {pricing.badgeLabel}
                        </span>
                        {service.badge && (
                          <span className="text-[10px] font-bold text-[#B45309] bg-[#FFF4E0] px-2 py-0.5 rounded border border-[#F79324]/20">
                            {service.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Service Name with Distinct Tailored Visual Icon */}
                    <div className="flex items-start space-x-2.5 mb-1.5">
                      <div className="w-8 h-8 rounded-lg bg-[#E7F3EC] flex items-center justify-center shrink-0 mt-0.5 text-[#0D3B2E]">
                        {getServiceCardIcon(service)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-[#202124] leading-snug">
                          {service.name}
                        </h3>
                      </div>
                    </div>

                    <p className="text-xs text-[#626B73] line-clamp-2 mb-3">
                      {service.description}
                    </p>

                    <div className="flex items-center space-x-3 text-xs text-[#626B73] mb-3">
                      {service.rating ? (
                        <div className="flex items-center space-x-1 text-[#B45309] font-bold">
                          <Star className="w-3.5 h-3.5 fill-[#F79324] text-[#F79324]" />
                          <span>{service.rating}</span>
                          {service.completedBookingsCount && (
                            <span className="text-[#626B73] font-normal">
                              ({service.completedBookingsCount})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#0D3B2E] font-semibold text-[11px]">
                          Verified Standard
                        </span>
                      )}
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-[#0D3B2E]" />
                        <span>{service.duration || service.estimatedDuration}</span>
                      </div>
                    </div>

                    {/* Included Scope bullets */}
                    {inclusions.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-[#F7F8F7] border border-[#E2E6E4] text-[11px] text-[#202124] space-y-1 mb-3">
                        <span className="font-bold text-[#0D3B2E] block text-[10px] uppercase tracking-wider">
                          What&apos;s Included:
                        </span>
                        {inclusions.map((inc: string, i: number) => (
                          <div key={i} className="flex items-start space-x-1.5 text-[#202124]">
                            <Check className="w-3.5 h-3.5 text-[#0D3B2E] shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{inc}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Pricing & Cart Actions */}
                  <div className="pt-3 border-t border-[#E2E6E4] flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-lg font-black text-[#0D3B2E]">
                          {pricing.priceFormatted}
                        </span>
                        {pricing.originalPriceFormatted && (
                          <span className="text-xs text-[#626B73] line-through">
                            {pricing.originalPriceFormatted}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#626B73] block">
                        {pricing.visitFeeText}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDetailServiceId(service.id)}
                        className="text-xs font-bold text-[#0D3B2E] hover:underline px-1 py-1 cursor-pointer"
                      >
                        Details
                      </button>

                      {count > 0 ? (
                        <div className="flex items-center space-x-1 bg-[#E7F3EC] p-1 rounded-xl border border-[#0D3B2E]/20">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(service.id, count - 1)}
                            className="w-7 h-7 rounded-lg bg-white text-[#0D3B2E] flex items-center justify-center hover:bg-[#0D3B2E] hover:text-white transition-colors cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-[#0D3B2E]">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(service.id, count + 1)}
                            className="w-7 h-7 rounded-lg bg-[#0D3B2E] text-white flex items-center justify-center hover:bg-[#0A2E24] transition-colors cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          id={`add-service-${service.id}`}
                          onClick={() => addToCart(service)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#0D3B2E] hover:bg-[#0A2E24] text-white text-xs font-bold shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Floating View Cart Sticky Bar */}
      {cart.length > 0 && (
        <aside
          aria-label="Active Booking Cart"
          className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] sm:bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 bg-[#0D3B2E] text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between z-40 border border-white/10 animate-slideUp"
        >
          <div>
            <div className="text-xs font-bold text-white/80">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} {cart.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'item' : 'items'} in cart
            </div>
            <div className="text-base font-black text-white">
              ₹{cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
            </div>
          </div>

          <button
            type="button"
            id="btn-services-view-cart"
            onClick={() => setIsCartDrawerOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#F79324] hover:bg-[#E2810F] text-[#0D3B2E] text-xs font-black flex items-center space-x-1.5 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer active:scale-95"
            aria-label="Open service basket and proceed to booking"
          >
            <span>Proceed to Booking</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </aside>
      )}
    </div>
  );
};
