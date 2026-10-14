import React from 'react';
import { ShieldAlert, ServerOff, Database, ExternalLink, RefreshCw } from 'lucide-react';

export const ServiceNotConfiguredScreen: React.FC = () => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-gray-200/80 shadow-2xl overflow-hidden animate-fadeIn">
        {/* Top Status Header */}
        <div className="bg-[#003523] text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#fe932c]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <ServerOff className="w-6 h-6 text-[#fe932c]" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-[#b6efd1] bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                Production Environment
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight mt-1 text-white">
                Service Not Configured
              </h1>
            </div>
          </div>
          <p className="text-xs text-[#b6efd1]/90 leading-relaxed max-w-md">
            Production mode requires active Supabase credentials. Offline mock behavior, local data caching, and synthetic OTP generation are disabled in production builds.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-bold text-amber-950">Security & Compliance Notice</p>
              <p className="leading-relaxed">
                To prevent accidental resident data loss and guarantee strict verification compliance under the DPDP Act, this application will not start without authentic database connectivity.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Required Environment Variables
            </h2>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 font-mono text-xs flex items-center justify-between">
                <span className="text-gray-700 font-semibold">VITE_SUPABASE_URL</span>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold font-sans">
                  Missing / Unconfigured
                </span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 font-mono text-xs flex items-center justify-between">
                <span className="text-gray-700 font-semibold">VITE_SUPABASE_ANON_KEY</span>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold font-sans">
                  Missing / Unconfigured
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleReload}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
            >
              <Database className="w-3.5 h-3.5 text-gray-500" />
              <span>Supabase Dashboard</span>
              <ExternalLink className="w-3 h-3 text-gray-400 ml-0.5" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span>UrbanCare Solution · Punjab Kharar & Greater Mohali</span>
          <span className="font-mono">v1.0.0-prod</span>
        </div>
      </div>
    </div>
  );
};
