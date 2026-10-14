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
    currentRole,
    authProfile,
    currentEmployeeId,
    currentVendorId,
    toasts,
    dismissToast,
    setIsAuthModalOpen
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

  const renderCurrentPage = () => {
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
        if (currentRole !== 'operations' && currentRole !== 'admin') {
          return (
            <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-red-200 shadow-xl text-center space-y-4 animate-scaleUp">
              <div className="w-14 h-14 bg-red-100 text-red-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-[#131b2e]">Login Required — Operations Command</h2>
              <p className="text-xs text-[#707973] leading-relaxed">
                This portal is strictly restricted to verified Operations Supervisors. Valid supervisor authentication is required to access dispatch records and system administration.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage('home')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#131b2e] text-xs font-semibold transition-colors"
                >
                  Return to Home
                </button>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Sign In to Operations
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
        if (currentRole !== 'vendor') {
          return (
            <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-amber-200 shadow-xl text-center space-y-4 animate-scaleUp">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-[#131b2e]">Login Required — Trade Partner Network</h2>
              <p className="text-xs text-[#707973] leading-relaxed">
                This portal is strictly restricted to verified Vendor Partners. Valid partner authentication is required to view assigned jobs and trade financial ledgers.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage('home')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#131b2e] text-xs font-semibold transition-colors"
                >
                  Return to Home
                </button>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Sign In as Partner
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
              portalName="Staff Technician Hub"
            />
          );
        }
        if (currentRole !== 'employee' && currentRole !== 'technician') {
          return (
            <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-blue-200 shadow-xl text-center space-y-4 animate-scaleUp">
              <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-[#131b2e]">Login Required — Staff Technician Hub</h2>
              <p className="text-xs text-[#707973] leading-relaxed">
                This portal is strictly restricted to Field Technicians. Valid staff authentication is required to access assigned work orders and customer tickets.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage('home')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#131b2e] text-xs font-semibold transition-colors"
                >
                  Return to Home
                </button>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Sign In as Technician
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
      {/* Toast Notification Container */}
      <div className="fixed top-14 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-[#131b2e] text-white px-4 py-3 rounded-xl shadow-xl flex items-center justify-between text-xs font-semibold border border-white/10 animate-slideIn"
          >
            <div className="flex items-center space-x-2">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#b6efd1]" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-[#ffdad6]" />}
              {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-[#ffdcc3]" />}
              {(!toast.type || toast.type === 'info') && <Info className="w-4 h-4 text-[#85bda1]" />}
              <span>{toast.text}</span>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 text-gray-400 hover:text-white"
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
