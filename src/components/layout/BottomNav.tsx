import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Home,
  Grid,
  ShoppingBag,
  ClipboardList,
  ShieldCheck,
  HardHat
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    setCurrentRole,
    requests,
    cartTotal,
    setIsCartDrawerOpen
  } = useApp();

  const pendingRequests = requests.filter(
    (r) => r.status === 'NEW' || r.status === 'UNDER REVIEW'
  ).length;

  if (currentPage === 'admin' || currentPage === 'vendor' || currentPage === 'employee') {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#c0c9c2]/40 shadow-lg px-2 py-1 flex justify-around items-center">
      <button
        onClick={() => setCurrentPage('home')}
        className={`flex flex-col items-center justify-center min-h-[46px] min-w-[54px] p-1 rounded-xl transition-all ${
          currentPage === 'home'
            ? 'text-[#003523] font-bold'
            : 'text-[#404943] hover:text-[#003523]'
        }`}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Home</span>
      </button>

      <button
        onClick={() => setCurrentPage('services')}
        className={`flex flex-col items-center justify-center min-h-[46px] min-w-[54px] p-1 rounded-xl transition-all ${
          currentPage === 'services'
            ? 'text-[#003523] font-bold'
            : 'text-[#404943] hover:text-[#003523]'
        }`}
      >
        <Grid className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Services</span>
      </button>

      <button
        onClick={() => setCurrentPage('projects')}
        className={`flex flex-col items-center justify-center min-h-[46px] min-w-[54px] p-1 rounded-xl transition-all ${
          currentPage === 'projects'
            ? 'text-[#003523] font-bold'
            : 'text-[#404943] hover:text-[#003523]'
        }`}
      >
        <HardHat className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Projects</span>
      </button>

      {/* Direct Basket button with item count */}
      <button
        onClick={() => setIsCartDrawerOpen(true)}
        className="flex flex-col items-center justify-center min-h-[46px] min-w-[54px] p-1 rounded-xl text-[#003523] relative transition-all"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          {cartTotal.itemCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-[#fe932c] text-[#002114] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
              {cartTotal.itemCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold">
          {cartTotal.itemCount > 0 ? `₹${cartTotal.total}` : 'Basket'}
        </span>
      </button>

      <button
        onClick={() => setCurrentPage('account')}
        className={`flex flex-col items-center justify-center min-h-[46px] min-w-[54px] p-1 rounded-xl transition-all relative ${
          currentPage === 'account'
            ? 'text-[#003523] font-bold'
            : 'text-[#404943] hover:text-[#003523]'
        }`}
      >
        <ClipboardList className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Bookings</span>
        {requests.length > 0 && (
          <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#fe932c]" />
        )}
      </button>
    </nav>
  );
};
