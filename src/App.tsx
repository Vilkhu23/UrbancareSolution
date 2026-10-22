/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { isSupabaseConfigured } from './lib/supabase';
import { ServiceNotConfiguredScreen } from './components/ServiceNotConfiguredScreen';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { BecomePartnerPage } from './pages/BecomePartnerPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { CustomerAccountPage } from './pages/CustomerAccountPage';
import { AdminPortal } from './pages/admin/AdminPortal';
import { VendorPortal } from './pages/vendor/VendorPortal';
import { EmployeePortal } from './pages/employee/EmployeePortal';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { NotAuthorizedPage } from './pages/NotAuthorizedPage';

import { CartDrawer } from './components/customer/CartDrawer';
import { ServiceDetailModal } from './components/customer/ServiceDetailModal';
import { OrderTrackerModal } from './components/customer/OrderTrackerModal';
import { CustomRequirementModal } from './components/customer/CustomRequirementModal';
import { ProjectQuoteModal } from './components/customer/ProjectQuoteModal';
import { LocalitySelectorModal } from './components/customer/LocalitySelectorModal';
import { AuthModal } from './components/customer/AuthModal';
import { DPDPConsentBanner } from './components/dpdp/DPDPConsentBanner';
import { DPDPNoticeModal } from './components/dpdp/DPDPNoticeModal';
import { DPDPConsentManagerModal } from './components/dpdp/DPDPConsentManagerModal';
import { DPDPDataRightsModal } from './components/dpdp/DPDPDataRightsModal';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    authProfile,
    toasts,
    dismissToast,
    isAuthLoading,
    openAuthModal
  } = useApp();

  // Detect Supabase password recovery token or query param on URL
  React.useEffect(() => {
    if (
      window.location.hash.includes('type=recovery') ||
      window.location.search.includes('reset=true')
    ) {
      setCurrentPage('reset-password');
    }
  }, [setCurrentPage]);

  // Auto-prompt unified login when an unauthenticated user visits protected portals
  React.useEffect(() => {
    if (!isAuthLoading && !authProfile && ['admin', 'vendor', 'employee'].includes(currentPage)) {
      openAuthModal('login', currentPage);
    }
  }, [isAuthLoading, authProfile, currentPage, openAuthModal]);

  const renderCurrentPage = () => {
    // If refreshing on a staff or customer portal, wait for Supabase auth to restore
    if (isAuthLoading && ['admin', 'vendor', 'employee', 'account'].includes(currentPage)) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3 p-8 bg-white/90 rounded-2xl border border-emerald-100 shadow-sm">
            <div className="w-8 h-8 border-3 border-[#003523] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-[#003523]">Restoring verified workspace...</span>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case 'services':
        return <ServicesPage />;
      case 'projects':
        return <ProjectsPage />;
      case 'how-it-works':
        return <HowItWorksPage />;
      case 'become-partner':
        return <BecomePartnerPage />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      case 'account':
        return <CustomerAccountPage />;
      case 'reset-password':
        return <ResetPasswordPage />;
      case 'not-authorized':
        return <NotAuthorizedPage requiredRoleName="Staff Member" portalName="Restricted Workspace" />;
      case 'admin':
        // If logged in as another role, reject with 403 NotAuthorizedPage
        if (
          authProfile &&
          authProfile.role !== 'admin' &&
          authProfile.role !== 'ops_manager'
        ) {
          return (
            <NotAuthorizedPage
              requiredRoleName="Operations Manager or Administrator"
              portalName="Operations Command Center"
            />
          );
        }
        if (!authProfile) {
          return (
            <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-red-200 shadow-xl text-center space-y-4 animate-scaleUp">
              <div className="w-14 h-14 bg-red-100 text-red-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-[#131b2e]">Sign In Required — Operations Command</h2>
              <p className="text-xs text-[#707973] leading-relaxed">
                This portal is strictly restricted to verified Operations Supervisors. Valid authentication is required to access dispatch records and system administration.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage('home')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#131b2e] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Return to Home
                </button>
                <button
                  onClick={() => openAuthModal('login', 'admin')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            </div>
          );
        }
        return <AdminPortal />;
      case 'vendor':
        // If logged in as another role, reject with 403 NotAuthorizedPage
        if (authProfile && authProfile.role !== 'vendor') {
          return (
            <NotAuthorizedPage
              requiredRoleName="Trade Partner (Vendor)"
              portalName="Trade Partner Network"
            />
          );
        }
        if (!authProfile) {
          return (
            <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-amber-200 shadow-xl text-center space-y-4 animate-scaleUp">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-[#131b2e]">Sign In Required — Trade Partner Network</h2>
              <p className="text-xs text-[#707973] leading-relaxed">
                This portal is strictly restricted to verified Vendor Partners. Valid partner authentication is required to view assigned jobs and trade financial ledgers.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage('home')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#131b2e] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Return to Home
                </button>
                <button
                  onClick={() => openAuthModal('login', 'vendor')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            </div>
          );
        }
        return <VendorPortal />;
      case 'employee':
        // If logged in as another role, reject with 403 NotAuthorizedPage
        if (
          authProfile &&
          authProfile.role !== 'technician' &&
          authProfile.role !== 'employee'
        ) {
          return (
            <NotAuthorizedPage
              requiredRoleName="Field Technician"
              portalName="Technician Portal"
            />
          );
        }
        if (!authProfile) {
          return (
            <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-blue-200 shadow-xl text-center space-y-4 animate-scaleUp">
              <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-[#131b2e]">Sign In Required — Technician Portal</h2>
              <p className="text-xs text-[#707973] leading-relaxed">
                This portal is strictly restricted to Field Technicians. Valid staff authentication is required to access assigned work orders and customer tickets.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage('home')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#131b2e] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Return to Home
                </button>
                <button
                  onClick={() => openAuthModal('login', 'employee')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            </div>
          );
        }
        return <EmployeePortal />;
      case 'home':
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8ff] text-[#131b2e] selection:bg-[#b6efd1] selection:text-[#002114]">
      {/* Toast Notification Container - Highest z-index so alerts are visible above all dialogs, backdrops, and modals */}
      <div className="fixed top-4 sm:top-5 right-4 left-4 sm:left-auto sm:right-6 z-[9999] flex flex-col space-y-2 pointer-events-none max-w-sm sm:w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto text-white px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between text-xs font-semibold border transition-all animate-slideIn ${
              toast.type === 'error'
                ? 'bg-[#1e1313] border-red-500/50 shadow-red-900/20 ring-1 ring-red-500/30'
                : toast.type === 'warning'
                ? 'bg-[#1f1911] border-amber-500/50 shadow-amber-900/20 ring-1 ring-amber-500/30'
                : toast.type === 'success'
                ? 'bg-[#0f1f18] border-emerald-500/50 shadow-emerald-900/20 ring-1 ring-emerald-500/30'
                : 'bg-[#131b2e] border-white/20'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
              {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
              {(!toast.type || toast.type === 'info') && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
              <span className="leading-snug">{toast.text}</span>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 text-gray-400 hover:text-white shrink-0 ml-2 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Navigation Header */}
      <Navbar />

      {/* Main Page Body */}
      <main id="main-content" className="flex-1 pb-16 md:pb-0">
        {renderCurrentPage()}
      </main>

      {/* Footer */}
      {currentPage !== 'admin' && currentPage !== 'vendor' && currentPage !== 'employee' && <Footer />}

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Modals & Drawers */}
      <CartDrawer />
      <ServiceDetailModal />
      <OrderTrackerModal />
      <CustomRequirementModal />
      <ProjectQuoteModal />
      <LocalitySelectorModal />
      <AuthModal />

      {/* DPDP Act 2023 Compliance Banner & Modals */}
      <DPDPConsentBanner />
      <DPDPNoticeModal />
      <DPDPConsentManagerModal />
      <DPDPDataRightsModal />
    </div>
  );
};

export default function App() {
  // Task 1: In a production build with missing Supabase config, show a clear "Service not configured" screen
  if (!isSupabaseConfigured() && !import.meta.env.DEV) {
    return <ServiceNotConfiguredScreen />;
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
