import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  MapPin,
  ShoppingBag,
  ShieldCheck,
  ClipboardList,
  Menu,
  X,
  User,
  ArrowRight,
  Sparkles,
  HardHat,
  Wrench
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    currentLocality,
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
    setIsAuthModalOpen,
    employees,
    vendors,
    logoutStaff
  } = useApp();

  const currentEmployee = employees.find((e) => e.id === currentEmployeeId);
  const currentVendor = vendors.find((v) => v.id === currentVendorId);

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Count active requests pending operations
  const pendingRequestsCount = requests.filter(
    (r) => r.status === 'NEW' || r.status === 'UNDER REVIEW' || r.status === 'READY FOR ASSIGNMENT'
  ).length;

  // Count pending assignments specifically waiting for active vendor
  const pendingVendorRequestsCount = requests.filter(
    (r) => r.assignedTo?.id === (currentVendorId || 'vnd-1') && r.status === 'ASSIGNED'
  ).length;

  // Count pending jobs specifically assigned to active employee
  const pendingEmployeeJobsCount = requests.filter(
    (r) => r.assignedTo?.id === (currentEmployeeId || 'emp-1') && r.status === 'ASSIGNED'
  ).length;

  const activeCustomerOrder = requests[0];

  return (
    <>
      {/* Top persistent Single-Role Display Bar */}
      <div className="bg-[#003523] text-white text-xs border-b border-[#144d37]/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#fe932c] text-[#002114] font-bold text-[10px] tracking-wide uppercase">
              Tricity Civic Hub
            </span>
            <button
              onClick={() => setIsLocalityModalOpen(true)}
              className="hidden sm:inline-flex items-center space-x-1 text-gray-200 hover:text-white transition-colors cursor-pointer"
              title="Click to select or view covered sectors"
            >
              <span className="hover:underline">Service Available In Sectors 94 to 111</span>
              <span className="text-[10px] text-[#b6efd1]">▾</span>
            </button>
          </div>

          {/* Single Assigned Role Display - Strict Isolation */}
          <div className="flex items-center space-x-2">
            {currentRole === 'customer' && (
              currentUser ? (
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-gray-300 hidden md:inline">Account:</span>
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-[#144d37] border border-[#336851]/60 text-white font-semibold text-[11px]">
                    <User className="w-3 h-3 text-[#b6efd1]" />
                    <span>Resident: {currentUser.name}</span>
                    <span className="text-[10px] text-[#b6efd1] font-bold hidden sm:inline">
                      ({currentUser.locality.split(',')[0]})
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="text-[11px] text-[#b6efd1] hover:text-white font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <User className="w-3 h-3" />
                    <span>Resident Sign In</span>
                  </button>
                  <span className="text-white/40">·</span>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="text-[11px] text-gray-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Staff & Partner Login
                  </button>
                </div>
              )
            )}

            {currentRole === 'employee' && (
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-gray-300 hidden md:inline">Your Role:</span>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-[#144d37] border border-[#336851]/60 text-white font-semibold text-[11px]">
                  <Wrench className="w-3 h-3 text-[#b6efd1]" />
                  <span>Tech Hub: {currentEmployee?.name || 'Technician'}</span>
                  <span className="text-[10px] text-[#b6efd1] font-bold">
                    ({currentEmployee?.employeeCode || 'EMP'})
                  </span>
                  {pendingEmployeeJobsCount > 0 && (
                    <span className="bg-[#fe932c] text-[#002114] text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-1 animate-pulse">
                      {pendingEmployeeJobsCount} Active
                    </span>
                  )}
                </div>
                <button
                  onClick={() => logoutStaff()}
                  className="text-[11px] text-red-200 hover:text-white font-semibold ml-2 underline cursor-pointer"
                >
                  Exit Hub
                </button>
              </div>
            )}

            {currentRole === 'vendor' && (
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-gray-300 hidden md:inline">Your Role:</span>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-[#144d37] border border-[#336851]/60 text-white font-semibold text-[11px]">
                  <HardHat className="w-3 h-3 text-[#fe932c]" />
                  <span>Vendor Hub: {currentVendor?.businessName || 'Partner'}</span>
                  {pendingVendorRequestsCount > 0 && (
                    <span className="bg-[#fe932c] text-[#002114] text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-1 animate-pulse">
                      {pendingVendorRequestsCount} Dispatches
                    </span>
                  )}
                </div>
                <button
                  onClick={() => logoutStaff()}
                  className="text-[11px] text-red-200 hover:text-white font-semibold ml-2 underline cursor-pointer"
                >
                  Exit Hub
                </button>
              </div>
            )}

            {currentRole === 'operations' && (
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-gray-300 hidden md:inline">Your Role:</span>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-[#144d37] border border-[#336851]/60 text-white font-semibold text-[11px]">
                  <ShieldCheck className="w-3 h-3 text-[#fe932c]" />
                  <span>Operations Lead: Harman (Central Dispatch)</span>
                  {pendingRequestsCount > 0 && (
                    <span className="bg-[#fe932c] text-[#002114] text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-1">
                      {pendingRequestsCount} Pending
                    </span>
                  )}
                </div>
                <button
                  onClick={() => logoutStaff()}
                  className="text-[11px] text-red-200 hover:text-white font-semibold ml-2 underline cursor-pointer"
                >
                  Exit Hub
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Top Navigation Header */}
      <header className="bg-white border-b border-[#c0c9c2]/40 sticky top-[31px] z-40 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Zone 1: Brand Wordmark & Locality */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentPage('home')}
              className="text-left group flex items-center space-x-2"
            >
              <div className="w-9 h-9 rounded-xl bg-[#003523] text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-[#144d37] transition-colors">
                U
              </div>
              <div>
                <div className="text-lg font-bold text-[#003523] tracking-tight leading-none">
                  UrbanCare Solution
                </div>
                <div className="text-[11px] text-[#707973] font-medium leading-tight">
                  Your Space | Our Care
                </div>
              </div>
            </button>

            {/* Locality Selector Chip */}
            <button
              onClick={() => setIsLocalityModalOpen(true)}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#f2f3ff] hover:bg-[#eaedff] border border-[#c0c9c2]/50 text-xs font-semibold text-[#131b2e] transition-colors ml-2"
              title="Change Locality"
            >
              <MapPin className="w-3.5 h-3.5 text-[#003523]" />
              <span className="truncate max-w-[140px]">{currentLocality}</span>
              <span className="text-[10px] text-[#707973]">▼</span>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold text-[#404943]">
            <button
              onClick={() => setCurrentPage('home')}
              className={`hover:text-[#003523] transition-colors ${
                currentPage === 'home' ? 'text-[#003523] border-b-2 border-[#003523] pb-1 font-bold' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentPage('services')}
              className={`hover:text-[#003523] transition-colors ${
                currentPage === 'services' ? 'text-[#003523] border-b-2 border-[#003523] pb-1 font-bold' : ''
              }`}
            >
              Services
            </button>
            <button
              onClick={() => setCurrentPage('projects')}
              className={`hover:text-[#003523] transition-colors ${
                currentPage === 'projects' ? 'text-[#003523] border-b-2 border-[#003523] pb-1 font-bold' : ''
              }`}
            >
              Home Projects
            </button>
            <button
              onClick={() => setCurrentPage('how-it-works')}
              className={`hover:text-[#003523] transition-colors ${
                currentPage === 'how-it-works' ? 'text-[#003523] border-b-2 border-[#003523] pb-1 font-bold' : ''
              }`}
            >
              How It Works
            </button>
            <button
              onClick={() => setCurrentPage('become-partner')}
              className={`hover:text-[#003523] transition-colors ${
                currentPage === 'become-partner' ? 'text-[#003523] border-b-2 border-[#003523] pb-1 font-bold' : ''
              }`}
            >
              Become a Partner
            </button>
            <button
              onClick={() => setCurrentPage('about')}
              className={`hover:text-[#003523] transition-colors ${
                currentPage === 'about' ? 'text-[#003523] border-b-2 border-[#003523] pb-1 font-bold' : ''
              }`}
            >
              About
            </button>
          </nav>

          {/* Zone 3: Actions (Order Tracker, Cart, Mobile Menu) */}
          <div className="flex items-center space-x-3">
            {/* Active order quick button if exists */}
            {activeCustomerOrder && (
              <button
                onClick={() => setActiveTrackingRequestId(activeCustomerOrder.id)}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#e2e7ff] text-[#003523] hover:bg-[#dae2fd] text-xs font-bold transition-all"
                title="View Active Order"
              >
                <span className="w-2 h-2 rounded-full bg-[#fe932c] animate-pulse"></span>
                <span>Track {activeCustomerOrder.id}</span>
              </button>
            )}

            {/* Basket Button - Visible strictly once user is logged in */}
            {currentUser && currentRole === 'customer' && (
              <button
                onClick={() => setIsCartDrawerOpen(true)}
                className="relative p-2.5 rounded-xl bg-[#003523] text-white hover:bg-[#144d37] transition-all flex items-center space-x-2 shadow-sm animate-in fade-in"
                title="View Basket"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-bold">
                  {cartTotal.itemCount > 0 ? `₹${cartTotal.total}` : 'Basket'}
                </span>
                {cartTotal.itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#fe932c] text-[#002114] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                    {cartTotal.itemCount}
                  </span>
                )}
              </button>
            )}

            {/* Profile / Login Icon Button */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 py-2 rounded-xl border border-[#c0c9c2]/60 hover:border-[#003523] hover:bg-[#f2f3ff] text-[#131b2e] transition-all text-xs font-semibold"
              title={
                currentRole === 'employee'
                  ? `Technician Account: ${currentEmployee?.name}`
                  : currentRole === 'vendor'
                  ? `Vendor Account: ${currentVendor?.businessName}`
                  : currentRole === 'operations'
                  ? 'Operations Lead Account'
                  : currentUser
                  ? `Account: ${currentUser.name}`
                  : 'Login / Register'
              }
              aria-label="User Account and Login"
            >
              <div className="w-6 h-6 rounded-lg bg-[#c0edd3] text-[#003523] flex items-center justify-center font-bold text-[11px]">
                {currentRole === 'employee' ? (
                  <Wrench className="w-3.5 h-3.5" />
                ) : currentRole === 'vendor' ? (
                  <HardHat className="w-3.5 h-3.5" />
                ) : currentRole === 'operations' ? (
                  <ShieldCheck className="w-3.5 h-3.5" />
                ) : currentUser ? (
                  currentUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('')
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="hidden lg:inline text-xs font-bold truncate max-w-[120px]">
                {currentRole === 'employee'
                  ? currentEmployee?.name.split(' ')[0] || 'Technician'
                  : currentRole === 'vendor'
                  ? currentVendor?.businessName.split(' ')[0] || 'Vendor'
                  : currentRole === 'operations'
                  ? 'Operations'
                  : currentUser
                  ? currentUser.name.split(' ')[0]
                  : 'Sign In'}
              </span>
            </button>

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[#131b2e] hover:bg-[#f2f3ff]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#c0c9c2]/40 px-4 pt-2 pb-4 space-y-2 shadow-lg">
            <button
              onClick={() => {
                setIsLocalityModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#f2f3ff] text-xs font-semibold text-[#131b2e]"
            >
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#003523]" />
                <span>Sector Hub: {currentLocality}</span>
              </div>
              <span className="text-[#003523] font-bold">Change</span>
            </button>

            {/* Mobile Account / Auth Button */}
            <button
              onClick={() => {
                setIsAuthModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#faf8ff] border border-[#c0c9c2]/50 text-xs font-semibold text-[#131b2e] hover:bg-[#eaedff]"
            >
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-md bg-[#003523] text-white flex items-center justify-center font-bold text-[10px]">
                  {currentUser ? (
                    currentUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('')
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                </div>
                <span>
                  {currentUser ? `Resident: ${currentUser.name}` : 'Sign In / Register Customer'}
                </span>
              </div>
              <span className="text-[#003523] font-bold">
                {currentUser ? 'Profile' : 'Log In →'}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-semibold">
              <button
                onClick={() => {
                  setCurrentPage('home');
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-lg bg-[#faf8ff] text-left hover:bg-[#eaedff]"
              >
                Home
              </button>
              <button
                onClick={() => {
                  setCurrentPage('services');
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-lg bg-[#faf8ff] text-left hover:bg-[#eaedff]"
              >
                All Services
              </button>
              <button
                onClick={() => {
                  setCurrentPage('projects');
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-lg bg-[#faf8ff] text-left hover:bg-[#eaedff]"
              >
                Home Projects
              </button>
              <button
                onClick={() => {
                  setCurrentPage('account');
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-lg bg-[#faf8ff] text-left hover:bg-[#eaedff]"
              >
                My Bookings ({requests.length})
              </button>
              <button
                onClick={() => {
                  setCurrentPage('how-it-works');
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-lg bg-[#faf8ff] text-left hover:bg-[#eaedff]"
              >
                How It Works
              </button>
              <button
                onClick={() => {
                  setCurrentPage('become-partner');
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-lg bg-[#faf8ff] text-left hover:bg-[#eaedff]"
              >
                Become a Partner
              </button>
              <button
                onClick={() => {
                  setCurrentPage('about');
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-lg bg-[#faf8ff] text-left hover:bg-[#eaedff]"
              >
                About UrbanCare Solution
              </button>
              <button
                onClick={() => {
                  setCurrentPage('contact');
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-lg bg-[#faf8ff] text-left hover:bg-[#eaedff]"
              >
                Contact & Office
              </button>
            </div>

            {/* Role-specific Mobile Quick Access - Strict Role Isolation */}
            <div className="pt-2 space-y-2">
              {currentRole === 'employee' && (
                <button
                  onClick={() => {
                    setCurrentPage('employee');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 bg-[#003523] text-white rounded-lg text-xs font-bold shadow-xs border border-white/20"
                >
                  <Wrench className="w-4 h-4 text-[#b6efd1]" />
                  <span>Open My Technician Hub {pendingEmployeeJobsCount > 0 ? `(${pendingEmployeeJobsCount} Active)` : ''}</span>
                </button>
              )}

              {currentRole === 'vendor' && (
                <button
                  onClick={() => {
                    setCurrentPage('vendor');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 bg-[#fe932c] text-[#002114] rounded-lg text-xs font-bold shadow-xs"
                >
                  <HardHat className="w-4 h-4 text-[#002114]" />
                  <span>Open My Vendor Partner Hub {pendingVendorRequestsCount > 0 ? `(${pendingVendorRequestsCount} Pending)` : ''}</span>
                </button>
              )}

              {currentRole === 'operations' && (
                <button
                  onClick={() => {
                    setCurrentPage('admin');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 bg-[#003523] text-white rounded-lg text-xs font-bold"
                >
                  <ShieldCheck className="w-4 h-4 text-[#fe932c]" />
                  <span>Open Operations Command Portal</span>
                </button>
              )}

              {currentRole === 'customer' && !currentUser && (
                <button
                  onClick={() => {
                    setIsAuthModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In / Staff Portal Access</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
