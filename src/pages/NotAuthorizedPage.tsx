import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

interface NotAuthorizedPageProps {
  requiredRoleName: string;
  portalName: string;
}

export const NotAuthorizedPage: React.FC<NotAuthorizedPageProps> = ({
  requiredRoleName,
  portalName,
}) => {
  const { currentRole, setCurrentPage, logoutStaff, setIsAuthModalOpen } = useApp();

  const handleSwitchAccount = async () => {
    await logoutStaff();
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 bg-[#faf8ff]">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-200 shadow-2xl text-center space-y-5 animate-scaleUp">
        
        <div className="w-16 h-16 bg-red-100 text-red-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
            403 · Access Denied
          </span>
          <h1 className="text-xl font-bold text-[#131b2e] tracking-tight">
            Not Authorized for {portalName}
          </h1>
          <p className="text-xs text-[#707973] leading-relaxed">
            This workspace requires <span className="font-bold text-[#131b2e]">{requiredRoleName}</span> privileges. 
            Your current authenticated account role is <span className="font-mono font-bold text-red-700">{currentRole}</span>.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => setCurrentPage('home')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#131b2e] text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </button>

          <button
            type="button"
            onClick={handleSwitchAccount}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch Account</span>
          </button>
        </div>

      </div>
    </div>
  );
};
