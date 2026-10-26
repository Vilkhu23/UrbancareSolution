import React from 'react';
import { useApp } from '../../context/AppContext';
import { Home, Layers, CalendarCheck, User, MessageCircle, Phone } from 'lucide-react';

/**
 * Mobile-First Fixed Bottom Navigation:
 * - Exactly 4 tabs: [ Home | Services | Bookings | Account ]
 * - High-contrast Forest Green (#0F3D2E) active indicators with clean typography.
 * - Live active booking badge counter.
 * - Preserves instant WhatsApp & Call access via unobtrusive quick support trigger.
 * - Safe-area inset aware for modern mobile displays.
 */
export const BottomNav: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    accountTab,
    setAccountTab,
    currentUser,
    authProfile,
    requests,
    setActiveTrackingRequestId,
    isCartDrawerOpen,
    isAuthModalOpen,
    isCustomTaskModalOpen,
    isProjectModalOpen,
    isLocalityModalOpen,
    selectedDetailServiceId
  } = useApp();

  // Hide sticky bottom bar on dedicated staff portals (they have their own internal navigation)
  if (currentPage === 'admin' || currentPage === 'vendor' || currentPage === 'employee') {
    return null;
  }

  const isStaff = authProfile?.role && authProfile.role !== 'customer';
  const staffPortalTarget =
    authProfile?.role === 'technician' ? 'employee' :
    authProfile?.role === 'vendor' ? 'vendor' :
    'admin';

  // Count active customer bookings for the badge counter
  const activeBookingsCount = requests.filter(
    (r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED' && r.status !== 'CLOSED'
  ).length;

  const activeCustomerOrder = requests.find(
    (r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED' && r.status !== 'CLOSED'
  );

  const handleNav = (target: 'home' | 'services' | 'bookings' | 'account') => {
    if (target === 'home') {
      setCurrentPage('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (target === 'services') {
      setCurrentPage('services');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (target === 'bookings') {
      if (activeCustomerOrder && !currentUser) {
        setActiveTrackingRequestId(activeCustomerOrder.id);
      } else {
        setAccountTab('bookings');
        setCurrentPage('account');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (target === 'account') {
      if (isStaff) {
        setCurrentPage(staffPortalTarget);
      } else {
        setAccountTab('overview');
        setCurrentPage('account');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isHomeActive = currentPage === 'home';
  const isServicesActive = currentPage === 'services';
  const isBookingsActive = currentPage === 'account' && accountTab === 'bookings';
  const isAccountActive =
    (currentPage === 'account' && accountTab !== 'bookings') ||
    currentPage === staffPortalTarget;

  return (
    <>
      {/* Quick Floating WhatsApp Support Trigger:
          - Automatically hidden when any modal or drawer is open so it NEVER obstructs checkout, basket, or modal content.
          - Positioned with calc(68px + env(safe-area-inset-bottom, 0px)) so it clears the fixed bottom navigation (56px) and respects modern safe areas.
          - Kept at z-30 (below bottom nav's z-40 and modal overlays' z-50) so it never clips or overlaps other controls.
      */}
      {!isCartDrawerOpen && !isAuthModalOpen && !isCustomTaskModalOpen && !isProjectModalOpen && !isLocalityModalOpen && !selectedDetailServiceId && (
        <a
          href="https://wa.me/918284018909"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Direct WhatsApp Help"
          title="Chat on WhatsApp"
          style={{ bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))' }}
          className="md:hidden fixed right-3 z-30 w-11 h-11 rounded-full bg-[#25D366] hover:bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 flex items-center justify-center transition-transform active:scale-95 border-2 border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
        >
          <MessageCircle className="w-5 h-5 fill-white/20 stroke-[2.2]" />
        </a>
      )}

      {/* Fixed Bottom Navigation Bar: Home, Services, Bookings, Account */}
      <nav
        aria-label="Main Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2E6E4] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1 safe-bottom"
      >
        <div className="grid grid-cols-4 items-center max-w-md mx-auto">
          {/* 1. Home */}
          <button
            type="button"
            id="mobile-nav-home"
            onClick={() => handleNav('home')}
            aria-label="Home"
            aria-current={isHomeActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all min-h-[50px] relative ${
              isHomeActive
                ? 'text-[#0D3B2E] font-bold'
                : 'text-[#626B73] hover:text-[#0D3B2E] font-medium'
            }`}
          >
            {isHomeActive && (
              <span className="absolute top-0.5 w-8 h-1 bg-[#0D3B2E] rounded-full" />
            )}
            <Home
              className={`w-5 h-5 transition-transform ${
                isHomeActive ? 'stroke-[2.5] scale-105 text-[#0D3B2E]' : 'stroke-[1.8]'
              }`}
            />
            <span className="text-[11px] mt-1 leading-none tracking-tight">Home</span>
          </button>

          {/* 2. Services */}
          <button
            type="button"
            id="mobile-nav-services"
            onClick={() => handleNav('services')}
            aria-label="Services Catalogue"
            aria-current={isServicesActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all min-h-[50px] relative ${
              isServicesActive
                ? 'text-[#0D3B2E] font-bold'
                : 'text-[#626B73] hover:text-[#0D3B2E] font-medium'
            }`}
          >
            {isServicesActive && (
              <span className="absolute top-0.5 w-8 h-1 bg-[#0D3B2E] rounded-full" />
            )}
            <Layers
              className={`w-5 h-5 transition-transform ${
                isServicesActive ? 'stroke-[2.5] scale-105 text-[#0D3B2E]' : 'stroke-[1.8]'
              }`}
            />
            <span className="text-[11px] mt-1 leading-none tracking-tight">Services</span>
          </button>

          {/* 3. Bookings */}
          <button
            type="button"
            id="mobile-nav-bookings"
            onClick={() => handleNav('bookings')}
            aria-label={`My Bookings${activeBookingsCount > 0 ? ` (${activeBookingsCount} active)` : ''}`}
            aria-current={isBookingsActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all min-h-[50px] relative ${
              isBookingsActive && !isHomeActive && !isServicesActive
                ? 'text-[#0D3B2E] font-bold'
                : 'text-[#626B73] hover:text-[#0D3B2E] font-medium'
            }`}
          >
            {isBookingsActive && !isHomeActive && !isServicesActive && (
              <span className="absolute top-0.5 w-8 h-1 bg-[#0D3B2E] rounded-full" />
            )}
            <div className="relative">
              <CalendarCheck
                className={`w-5 h-5 transition-transform ${
                  isBookingsActive && !isHomeActive && !isServicesActive
                    ? 'stroke-[2.5] scale-105 text-[#0D3B2E]'
                    : 'stroke-[1.8]'
                }`}
              />
              {activeBookingsCount > 0 && (
                <span className="absolute -top-1 -right-2.5 w-4 h-4 rounded-full bg-[#F79324] text-[#0D3B2E] text-[9px] font-extrabold flex items-center justify-center shadow-xs animate-pulse">
                  {activeBookingsCount}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-1 leading-none tracking-tight">Bookings</span>
          </button>

          {/* 4. Account */}
          <button
            type="button"
            id="mobile-nav-account"
            onClick={() => handleNav('account')}
            aria-label="Account Profile"
            aria-current={isAccountActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all min-h-[50px] relative ${
              isAccountActive && !isHomeActive && !isServicesActive
                ? 'text-[#0D3B2E] font-bold'
                : 'text-[#626B73] hover:text-[#0D3B2E] font-medium'
            }`}
          >
            <User
              className={`w-5 h-5 transition-transform ${
                isAccountActive && !isHomeActive && !isServicesActive
                  ? 'stroke-[2.5] scale-105 text-[#0D3B2E]'
                  : 'stroke-[1.8]'
              }`}
            />
            <span className="text-[11px] mt-1 leading-none tracking-tight">
              {currentUser ? 'Profile' : 'Account'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
