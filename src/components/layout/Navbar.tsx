import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { SERVICE_AVAILABLE_ZONES } from '../../data/initialData';
import {
  MapPin,
  Phone,
  MessageCircle,
  User,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  Check,
  Wrench,
  Zap,
  Droplets,
  Hammer,
  Sparkles,
  Paintbrush,
  ShieldAlert,
  HardHat,
  PackageCheck,
  ShoppingBag,
  LogOut,
  ChevronRight,
  ExternalLink,
  Briefcase
} from 'lucide-react';

/**
 * Redesigned UrbanCare Solution Header:
 * - Single sticky desktop header (~72px tall), shrinks to ~64px on scroll with subtle shadow.
 * - Single brand: UrbanCare Solution ("Your Space | Our Care") with logo. Removed "Tricity Civic Hub".
 * - Location pill ("Sector 94 ▾") with full area names inside inline dropdown for Sectors 94–111.
 * - Single-line nav: Services (mega-menu with icons), Home Projects, How It Works, Become a Partner.
 * - Call & WhatsApp direct action icon buttons (tel: and wa.me).
 * - Sign In dropdown (Resident / Staff & Partner).
 * - Filled primary CTA button: "Book a Service".
 * - "Track Order" link shown strictly for logged-in users with active orders.
 * - Mobile: Top bar (logo, location pill, hamburger) + Full-screen drawer with services listed first.
 * - Full accessibility: WCAG AA contrast, visible focus rings, skip-to-content link, keyboard navigation.
 */
export const Navbar: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    currentLocality,
    setCurrentLocality,
    setIsLocalityModalOpen,
    currentPage,
    setCurrentPage,
    cartTotal,
    setIsCartDrawerOpen,
    requests,
    setActiveTrackingRequestId,
    currentVendorId,
    currentEmployeeId,
    currentUser,
    authProfile,
    openAuthModal,
    logout,
    employees,
    vendors
  } = useApp();

  const isLoggedIn = !!authProfile || !!currentUser || currentRole !== 'customer';

  const userRole = authProfile?.role || (
    currentRole === 'employee' ? 'technician' :
    currentRole === 'vendor' ? 'vendor' :
    currentRole === 'operations' || currentRole === 'admin' ? 'ops_manager' :
    'customer'
  );

  const roleLabel =
    userRole === 'technician' ? 'Technician' :
    userRole === 'vendor' ? 'Vendor Partner' :
    userRole === 'ops_manager' || userRole === 'admin' ? 'Operations' :
    'Resident';

  const currentEmployee = employees.find((e) => e.id === currentEmployeeId);
  const currentVendor = vendors.find((v) => v.id === currentVendorId);

  const displayName =
    authProfile?.full_name ||
    currentUser?.name ||
    (currentRole === 'employee' ? currentEmployee?.name : currentRole === 'vendor' ? currentVendor?.businessName : currentRole === 'operations' ? 'Operations Lead' : '') ||
    'Account';

  const displaySubtitle = currentUser?.email || authProfile?.phone || currentUser?.phone || '';

  const isStaff = userRole !== 'customer';

  const staffPortalTarget =
    userRole === 'technician' ? 'employee' :
    userRole === 'vendor' ? 'vendor' :
    'admin';

  // Scroll shrink state
  const [isScrolled, setIsScrolled] = useState(false);

  // Dropdown states
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isServicesMegaMenuOpen, setIsServicesMegaMenuOpen] = useState(false);
  const [isSignInDropdownOpen, setIsSignInDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dropdown container refs for click-outside detection
  const locationRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const signInRef = useRef<HTMLDivElement>(null);


  // Active customer order for logged-in tracker link
  const activeCustomerOrder = requests.find(
    (r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED' && r.status !== 'CLOSED'
  );

  // Derive short sector name for the location pill (e.g., "Sector 94 ▾")
  const shortSectorName = React.useMemo(() => {
    if (!currentLocality) return 'Sector 94';
    const match = currentLocality.match(/Sector[s]?\s+\d+([–-]\d+)?/i);
    return match ? match[0] : currentLocality.split(' (')[0] || 'Sector 94';
  }, [currentLocality]);

  // Handle scroll detection for shrink & subtle shadow
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (locationRef.current && !locationRef.current.contains(target)) {
        setIsLocationDropdownOpen(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(target)) {
        setIsServicesMegaMenuOpen(false);
      }
      if (signInRef.current && !signInRef.current.contains(target)) {
        setIsSignInDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle escape key to close open menus
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLocationDropdownOpen(false);
        setIsServicesMegaMenuOpen(false);
        setIsSignInDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Handle primary "Book a Service" action
  const handleBookService = () => {
    setIsServicesMegaMenuOpen(false);
    setMobileMenuOpen(false);
    if (currentPage === 'home') {
      const catalogEl = document.getElementById('services-catalog-view');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    setCurrentPage('services');
  };

  // Curated categories for the Services Mega-Menu
  const megaMenuCategories = [
    {
      id: 'ac-appliances',
      name: 'AC & Appliances',
      desc: 'AC service, gas refill, RO & fridge repair',
      icon: Wrench,
      accent: 'bg-emerald-50 text-[#0F3D2E]'
    },
    {
      id: 'electrical',
      name: 'Electrical Care',
      desc: 'Fans, switchboards, wiring & MCB diagnostics',
      icon: Zap,
      accent: 'bg-amber-50 text-amber-800'
    },
    {
      id: 'plumbing',
      name: 'Plumbing Services',
      desc: 'Motors, taps, leakages & bathroom fittings',
      icon: Droplets,
      accent: 'bg-sky-50 text-sky-800'
    },
    {
      id: 'carpentry',
      name: 'Carpentry & Handyman',
      desc: 'Door locks, handles, furniture & drill assembly',
      icon: Hammer,
      accent: 'bg-stone-50 text-stone-800'
    },
    {
      id: 'fabrication',
      name: 'Gate & Grill Fabrication',
      desc: 'Welding, safety balcony grills & gate repairs',
      icon: ShieldCheck,
      accent: 'bg-indigo-50 text-indigo-800'
    },
    {
      id: 'cleaning',
      name: 'Home Deep Cleaning',
      desc: 'Kitchen degreasing, bathroom descaling & sofas',
      icon: Sparkles,
      accent: 'bg-purple-50 text-purple-800'
    },
    {
      id: 'painting',
      name: 'Painting & Waterproofing',
      desc: 'Damp treatment, wall touch-ups & full colors',
      icon: Paintbrush,
      accent: 'bg-rose-50 text-rose-800'
    },
    {
      id: 'pest-control',
      name: 'Pest Control Shield',
      desc: 'Termite drill shield & herbal cockroach gel',
      icon: ShieldAlert,
      accent: 'bg-orange-50 text-orange-800'
    }
  ];

  return (
    <>
      {/* 1. Accessible Skip-to-Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-4 z-50 bg-[#0F3D2E] text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-xl focus:outline-none focus:ring-2 focus:ring-[#F28C28]"
      >
        Skip to main content
      </a>

      {/* 2. Single Sticky Desktop & Mobile Header */}
      <header
        role="banner"
        className={`sticky top-0 z-40 bg-white/98 backdrop-blur-md transition-all duration-200 border-b ${
          isScrolled
            ? 'h-16 shadow-md border-gray-200/90'
            : 'h-[72px] shadow-xs border-gray-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-3 sm:gap-4 font-['Inter',sans-serif]">
          {/* LEFT: Logo & Location Pill */}
          <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
            {/* Brand Logo & Tagline (Single Brand: UrbanCare Solution) */}
            <button
              onClick={() => {
                setCurrentPage('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-left group flex items-center space-x-2.5 focus-visible:ring-2 focus-visible:ring-[#0F3D2E] focus-visible:outline-none rounded-xl p-1"
              aria-label="UrbanCare Solution Home"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0F3D2E] text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-[#144d37] transition-all">
                U
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold text-[#0F3D2E] tracking-tight leading-none">
                  UrbanCare Solution
                </span>
                <span className="text-[10px] sm:text-[11px] text-[#5A6A60] font-medium leading-tight mt-0.5">
                  Your Space | Our Care
                </span>
              </div>
            </button>

            {/* Location Pill with Dropdown (Desktop & Tablet) */}
            <div className="relative" ref={locationRef}>
              <button
                type="button"
                onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                aria-expanded={isLocationDropdownOpen}
                aria-haspopup="listbox"
                aria-label={`Select location, currently ${shortSectorName}`}
                className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-xs font-semibold text-[#0F3D2E] transition-colors focus-visible:ring-2 focus-visible:ring-[#0F3D2E] focus-visible:outline-none cursor-pointer"
                title="Select serving sector"
              >
                <MapPin className="w-3.5 h-3.5 text-[#0F3D2E] shrink-0" />
                <span className="whitespace-nowrap font-medium text-gray-900">
                  {shortSectorName}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-150 ${
                    isLocationDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Location Dropdown with Full Area Names */}
              {isLocationDropdownOpen && (
                <div
                  role="listbox"
                  className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <div className="px-3 py-2 border-b border-gray-100">
                    <div className="text-xs font-bold text-[#0F3D2E] uppercase tracking-wider">
                      Serving Sectors 94–111, Mohali
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      JLPL, GMADA, Emaar & TDI corridors • 20–30 min dispatch
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto py-1 space-y-1">
                    {SERVICE_AVAILABLE_ZONES.map((zone) => {
                      const isSelected = currentLocality === zone.name;
                      return (
                        <button
                          key={zone.id}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setCurrentLocality(zone.name);
                            setIsLocationDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-emerald-50 text-[#0F3D2E] font-bold'
                              : 'text-gray-700 hover:bg-gray-50 font-medium'
                          }`}
                        >
                          <div className="pr-2">
                            <div className="text-xs text-gray-900 font-semibold">{zone.name}</div>
                            <div className="text-[11px] text-gray-500 truncate max-w-[260px]">
                              {zone.description}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-[#0F3D2E] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 mt-1 border-t border-gray-100 flex items-center justify-between px-2">
                    <span className="text-[11px] text-gray-500">Need another sector?</span>
                    <button
                      onClick={() => {
                        setIsLocalityModalOpen(true);
                        setIsLocationDropdownOpen(false);
                      }}
                      className="text-xs font-semibold text-[#0F3D2E] hover:underline"
                    >
                      View all coverage →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CENTER: Navigation Links (Single Line, 15-16px, Inter) */}
          <nav
            role="navigation"
            aria-label="Main menu"
            className="hidden lg:flex items-center space-x-6 xl:space-x-7 text-[15px] font-medium text-[#2D3748] shrink-0"
          >
            {/* Services Mega-Menu Trigger */}
            <div className="relative" ref={megaMenuRef}>
              <button
                type="button"
                onClick={() => setIsServicesMegaMenuOpen(!isServicesMegaMenuOpen)}
                aria-expanded={isServicesMegaMenuOpen}
                aria-haspopup="true"
                className={`flex items-center space-x-1 py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-[#0F3D2E] focus-visible:outline-none rounded-lg cursor-pointer ${
                  isServicesMegaMenuOpen || currentPage === 'services'
                    ? 'text-[#0F3D2E] font-bold'
                    : 'hover:text-[#0F3D2E]'
                }`}
              >
                <span>Services</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-150 ${
                    isServicesMegaMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Services Mega-Menu Popover */}
              {isServicesMegaMenuOpen && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[720px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  role="region"
                  aria-label="Services Mega Menu"
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                    <div>
                      <h3 className="text-sm font-bold text-[#0F3D2E]">
                        Doorstep Home Services & Repairs
                      </h3>
                      <p className="text-xs text-gray-500">
                        Verified local technicians across Sectors 94–111 • ₹0 Advance
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentPage('services');
                        setIsServicesMegaMenuOpen(false);
                      }}
                      className="text-xs font-semibold text-[#0F3D2E] hover:underline flex items-center space-x-1"
                    >
                      <span>All 35+ Services</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 2-Column Mega-Menu Services Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {megaMenuCategories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setCurrentPage('services');
                            setIsServicesMegaMenuOpen(false);
                          }}
                          className="flex items-start space-x-3 p-2.5 rounded-xl text-left hover:bg-gray-50 transition-colors group focus-visible:ring-2 focus-visible:ring-[#0F3D2E] focus-visible:outline-none"
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cat.accent} transition-transform group-hover:scale-105`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-900 group-hover:text-[#0F3D2E]">
                              {cat.name}
                            </div>
                            <div className="text-[11px] text-gray-500 leading-snug">
                              {cat.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Mega-menu Bottom Banner for Home Projects */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between bg-[#0F3D2E]/5 rounded-xl px-4 py-2.5">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-[#0F3D2E]">
                      <HardHat className="w-4 h-4 text-[#F28C28]" />
                      <span>Planning turnkey renovation or modular kitchen?</span>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentPage('projects');
                        setIsServicesMegaMenuOpen(false);
                      }}
                      className="text-xs font-bold text-[#0F3D2E] hover:underline"
                    >
                      View Home Projects →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Home Projects Link */}
            <button
              onClick={() => setCurrentPage('projects')}
              className={`py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-[#0F3D2E] focus-visible:outline-none rounded-lg cursor-pointer ${
                currentPage === 'projects'
                  ? 'text-[#0F3D2E] font-bold border-b-2 border-[#0F3D2E]'
                  : 'hover:text-[#0F3D2E]'
              }`}
            >
              Home Projects
            </button>

            {/* How It Works Link */}
            <button
              onClick={() => setCurrentPage('how-it-works')}
              className={`py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-[#0F3D2E] focus-visible:outline-none rounded-lg cursor-pointer ${
                currentPage === 'how-it-works'
                  ? 'text-[#0F3D2E] font-bold border-b-2 border-[#0F3D2E]'
                  : 'hover:text-[#0F3D2E]'
              }`}
            >
              How It Works
            </button>

            {/* Become a Partner Link */}
            <button
              onClick={() => setCurrentPage('become-partner')}
              className={`py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-[#0F3D2E] focus-visible:outline-none rounded-lg cursor-pointer ${
                currentPage === 'become-partner'
                  ? 'text-[#0F3D2E] font-bold border-b-2 border-[#0F3D2E]'
                  : 'hover:text-[#0F3D2E]'
              }`}
            >
              Become a Partner
            </button>
          </nav>

          {/* RIGHT: Action Icons, Auth, Active Track & Primary CTA */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Conditional "Track Order" link - STRICTLY for logged-in users with active order */}
            {currentUser && activeCustomerOrder && (
              <button
                onClick={() => setActiveTrackingRequestId(activeCustomerOrder.id)}
                className="hidden xl:inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0F3D2E] border border-emerald-200 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#0F3D2E] focus-visible:outline-none"
                title={`Track Order #${activeCustomerOrder.id}`}
                aria-label={`Track active order #${activeCustomerOrder.id}`}
              >
                <span className="w-2 h-2 rounded-full bg-[#F28C28] animate-pulse" />
                <PackageCheck className="w-3.5 h-3.5 text-[#0F3D2E]" />
                <span className="truncate max-w-[100px]">Track #{activeCustomerOrder.id}</span>
              </button>
            )}

            {/* Direct Click-to-Call Button */}
            <a
              href="tel:+918284018909"
              className="p-2 sm:p-2.5 rounded-xl border border-gray-200 text-[#0F3D2E] hover:bg-gray-50 hover:border-[#0F3D2E] transition-all focus-visible:ring-2 focus-visible:ring-[#0F3D2E] focus-visible:outline-none"
              aria-label="Call UrbanCare Support +91 8284018909"
              title="Call UrbanCare: +91 8284018909"
            >
              <Phone className="w-4 h-4 text-[#0F3D2E]" />
            </a>

            {/* Direct Click-to-WhatsApp Button */}
            <a
              href="https://wa.me/918284018909"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 sm:p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400 transition-all focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
              aria-label="Chat with UrbanCare on WhatsApp +91 8284018909"
              title="WhatsApp: +91 8284018909"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
            </a>

            {/* Basket Button (if logged-in customer has items) */}
            {currentUser && currentRole === 'customer' && cartTotal.itemCount > 0 && (
              <button
                onClick={() => setIsCartDrawerOpen(true)}
                className="relative p-2 sm:p-2.5 rounded-xl border border-[#0F3D2E] bg-[#0F3D2E] text-white hover:bg-[#144d37] transition-all focus-visible:ring-2 focus-visible:ring-[#0F3D2E] focus-visible:outline-none"
                aria-label={`View Basket with ${cartTotal.itemCount} items`}
                title="View Basket"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="absolute -top-1.5 -right-1.5 bg-[#F28C28] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cartTotal.itemCount}
                </span>
              </button>
            )}

            {/* Public Auth Buttons (Logged Out) or User Account Menu (Logged In) */}
            {!isLoggedIn ? (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="px-3 py-2 rounded-xl border border-gray-300 hover:border-[#0F3D2E] text-[#0F3D2E] text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-[#0F3D2E] cursor-pointer"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="px-3.5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#144d37] text-white text-xs font-bold transition-all shadow-xs focus-visible:ring-2 focus-visible:ring-[#0F3D2E] cursor-pointer"
                >
                  Sign up
                </button>
              </div>
            ) : (
              <div className="relative" ref={signInRef}>
                <button
                  type="button"
                  onClick={() => setIsSignInDropdownOpen(!isSignInDropdownOpen)}
                  aria-expanded={isSignInDropdownOpen}
                  aria-haspopup="menu"
                  aria-label="User account menu"
                  className="flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-gray-200 hover:border-[#0F3D2E] text-[#0F3D2E] text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#0F3D2E] cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-md bg-[#0F3D2E] text-white flex items-center justify-center font-bold text-xs">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col text-left leading-tight">
                    <span className="text-xs font-bold text-gray-900 truncate max-w-[110px]">
                      {displayName.split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-semibold text-[#0F3D2E]">
                      {roleLabel}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-150 ${
                      isSignInDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isSignInDropdownOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                  >
                    {/* User profile card */}
                    <div className="p-2.5 border-b border-gray-100 mb-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-gray-900 truncate">{displayName}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#0F3D2E] border border-emerald-200 shrink-0">
                          {roleLabel}
                        </span>
                      </div>
                      {displaySubtitle && (
                        <div className="text-[11px] text-gray-500 truncate mt-0.5">
                          {displaySubtitle}
                        </div>
                      )}
                    </div>

                    {!isStaff ? (
                      /* Resident Customer Menu */
                      <>
                        <button
                          role="menuitem"
                          onClick={() => {
                            setCurrentPage('account');
                            setIsSignInDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <User className="w-3.5 h-3.5 text-gray-500" />
                            <span>My Account</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        </button>

                        <button
                          role="menuitem"
                          onClick={() => {
                            setCurrentPage('account');
                            setIsSignInDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <PackageCheck className="w-3.5 h-3.5 text-gray-500" />
                            <span>My Bookings ({requests.length})</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        </button>

                        {activeCustomerOrder && (
                          <button
                            role="menuitem"
                            onClick={() => {
                              setActiveTrackingRequestId(activeCustomerOrder.id);
                              setIsSignInDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#0F3D2E] hover:bg-emerald-50 flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <div className="flex items-center space-x-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#F28C28] animate-pulse" />
                              <span>Track #{activeCustomerOrder.id}</span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                        )}
                      </>
                    ) : (
                      /* Staff Member Menu */
                      <>
                        <button
                          role="menuitem"
                          onClick={() => {
                            setCurrentPage(staffPortalTarget);
                            setIsSignInDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-[#0F3D2E] bg-emerald-50 hover:bg-emerald-100/70 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <Briefcase className="w-3.5 h-3.5 text-[#0F3D2E]" />
                            <span>Go to my portal</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-[#0F3D2E]" />
                        </button>
                      </>
                    )}

                    <div className="my-1.5 border-t border-gray-100" />

                    {/* Logout Option */}
                    <button
                      role="menuitem"
                      onClick={async () => {
                        setIsSignInDropdownOpen(false);
                        await logout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <LogOut className="w-3.5 h-3.5 text-red-500" />
                        <span>Logout</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Filled Primary CTA: "Book a Service" (Desktop) */}
            <button
              onClick={handleBookService}
              className="hidden sm:inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#F28C28] hover:bg-[#d9771e] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-[#0F3D2E] focus-visible:outline-none"
              aria-label="Book a Service"
            >
              <span>Book a Service</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-[#0F3D2E] hover:bg-gray-100 transition-colors focus-visible:ring-2 focus-visible:ring-[#0F3D2E] focus-visible:outline-none"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* 3. Mobile Full-Screen Drawer Menu (Services Listed First) */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
          >
            {/* Drawer Top Bar */}
            <div className="h-16 border-b border-gray-100 px-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0F3D2E] text-white flex items-center justify-center font-bold text-sm">
                  U
                </div>
                <div>
                  <div className="text-sm font-bold text-[#0F3D2E] leading-none">
                    UrbanCare Solution
                  </div>
                  <div className="text-[10px] text-gray-500 leading-tight">
                    Your Space | Our Care
                  </div>
                </div>
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 p-4 space-y-5 pb-24">
              {/* Location Selector Bar */}
              <button
                onClick={() => {
                  setIsLocalityModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/80 text-xs font-semibold text-[#0F3D2E]"
              >
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-[#0F3D2E]" />
                  <span>Serving: {shortSectorName} (JLPL & Mohali)</span>
                </div>
                <span className="text-[#F28C28] font-bold">Change ▾</span>
              </button>

              {/* SECTION 1: SERVICES LISTED FIRST */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Our Doorstep Services
                  </h3>
                  <button
                    onClick={() => {
                      setCurrentPage('services');
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs font-semibold text-[#0F3D2E] hover:underline"
                  >
                    View All 35+ →
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {megaMenuCategories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setCurrentPage('services');
                          setMobileMenuOpen(false);
                        }}
                        className="p-2.5 rounded-xl border border-gray-200/80 bg-white hover:bg-gray-50 text-left flex items-center space-x-2.5 transition-all shadow-2xs"
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cat.accent}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: PRIMARY NAVIGATION PAGES */}
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
                  Explore UrbanCare
                </div>
                <button
                  onClick={() => {
                    setCurrentPage('projects');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-left font-semibold text-xs text-gray-900 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <HardHat className="w-4 h-4 text-[#F28C28]" />
                    <span>Home Projects (Kitchen & Renovation)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => {
                    setCurrentPage('how-it-works');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-left font-semibold text-xs text-gray-900 flex items-center justify-between"
                >
                  <span>How It Works & ₹0 Advance Policy</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => {
                    setCurrentPage('become-partner');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-left font-semibold text-xs text-gray-900 flex items-center justify-between"
                >
                  <span>Become a Partner / Artisan Join</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => {
                    setCurrentPage('about');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-left font-semibold text-xs text-gray-900 flex items-center justify-between"
                >
                  <span>About UrbanCare Solution</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* SECTION 3: ACCOUNT & ROLE MANAGEMENT */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
                  Account Access
                </div>

                {!isLoggedIn ? (
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        openAuthModal('login');
                        setMobileMenuOpen(false);
                      }}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-gray-300 text-[#0F3D2E] text-xs font-bold hover:bg-gray-50 transition-colors text-center cursor-pointer"
                    >
                      Sign in
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        openAuthModal('register');
                        setMobileMenuOpen(false);
                      }}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#0F3D2E] text-white text-xs font-bold hover:bg-[#144d37] transition-all text-center shadow-xs cursor-pointer"
                    >
                      Sign up
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-2.5">
                    <div className="flex items-center justify-between gap-1">
                      <div>
                        <div className="text-xs font-bold text-gray-900 truncate">
                          {displayName}
                        </div>
                        {displaySubtitle && (
                          <div className="text-[11px] text-gray-500 truncate">
                            {displaySubtitle}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#0F3D2E] border border-emerald-200 shrink-0">
                        {roleLabel}
                      </span>
                    </div>

                    {!isStaff ? (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-100/60">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPage('account');
                            setMobileMenuOpen(false);
                          }}
                          className="py-1.5 px-2.5 rounded-lg bg-white border border-emerald-200 text-xs font-bold text-[#0F3D2E] flex items-center justify-center space-x-1 hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                          <User className="w-3.5 h-3.5 text-[#0F3D2E]" />
                          <span>My Account</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPage('account');
                            setMobileMenuOpen(false);
                          }}
                          className="py-1.5 px-2.5 rounded-lg bg-white border border-emerald-200 text-xs font-bold text-[#0F3D2E] flex items-center justify-center space-x-1 hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                          <PackageCheck className="w-3.5 h-3.5 text-[#0F3D2E]" />
                          <span>My Bookings ({requests.length})</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPage(staffPortalTarget);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-[#0F3D2E] text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Go to my portal</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={async () => {
                        setMobileMenuOpen(false);
                        await logout();
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-600" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Direct Support Contact Strip */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                <a
                  href="tel:+918284018909"
                  className="flex items-center space-x-1.5 font-semibold text-[#0F3D2E]"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>+91 8284018909</span>
                </a>
                <a
                  href="https://wa.me/918284018909"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 font-semibold text-emerald-700"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Chat</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
