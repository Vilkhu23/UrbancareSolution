import React, { useState } from 'react';
import { Database, CheckCircle2, AlertTriangle, RefreshCw, Copy, Check, ExternalLink, ShieldCheck, Server, Radio, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isSupabaseConfigured } from '../../lib/supabase';

interface DatabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseConfigModal: React.FC<DatabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const { dbStatus, refreshDbConnection, showToast } = useApp();
  const [isPinging, setIsPinging] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePing = async () => {
    setIsPinging(true);
    await refreshDbConnection();
    setIsPinging(false);
    showToast('Database connection tested', 'info');
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const tables = [
    { name: 'ops_settings', purpose: 'Operations dispatch configuration, emergency hotline & service radius' },
    { name: 'customers', purpose: 'Resident accounts, phone authentication, address & booking history' },
    { name: 'employees', purpose: 'In-house technicians, trade skills, passwords & live availability' },
    { name: 'vendors', purpose: 'Trade partner contractors, approval status, category, passwords & quotas' },
    { name: 'service_categories', purpose: 'Parent taxonomy (Electrical, Plumbing, Appliances, Carpentry)' },
    { name: 'services', purpose: 'Granular rate card items with base rates and included scopes' },
    { name: 'service_requests', purpose: 'Core dispatch tickets with status progression, photos & assignments' },
    { name: 'home_projects', purpose: 'Turnkey renovation requests with civil scope & square footage' },
    { name: 'opportunity_ledger', purpose: 'Strict credit deduction journal tracking vendor opportunity usage' },
    { name: 'complaints', purpose: 'Escalations, severity tags, investigations & supervisor resolutions' },
    { name: 'payments', purpose: 'Transaction ledger (Cash, UPI, Online) and reference IDs' },
    { name: 'audit_logs', purpose: 'DPDP Act compliance immutable audit log of administrative actions' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#c0c9c2]/50 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#c0c9c2]/40 bg-linear-to-r from-[#003523] to-[#144d37] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
              <Database className="w-5 h-5 text-[#fe932c]" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Supabase + PostgreSQL Configuration</h2>
              <p className="text-xs text-white/80">Production Relational Backend & Realtime Replication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-sm text-[#131b2e]">
          {/* Live Status Card */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            dbStatus.connected && dbStatus.provider === 'supabase'
              ? 'bg-emerald-50/80 border-emerald-300'
              : 'bg-amber-50/80 border-amber-300'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${
                dbStatus.connected && dbStatus.provider === 'supabase' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
              }`}>
                {dbStatus.connected && dbStatus.provider === 'supabase' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Server className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-black text-sm">
                    {dbStatus.provider === 'supabase' && dbStatus.connected
                      ? 'Live Supabase PostgreSQL Connected'
                      : isSupabaseConfigured()
                      ? 'Supabase Configured (Connecting...)'
                      : 'Local Resilient Mock Mode (Offline)'}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    dbStatus.connected && dbStatus.provider === 'supabase'
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-amber-200 text-amber-900'
                  }`}>
                    {dbStatus.provider === 'supabase' ? 'Supabase Cloud' : 'Local Fallback'}
                  </span>
                </div>
                <p className="text-xs text-[#55605a] mt-0.5">{dbStatus.message}</p>
                {dbStatus.latencyMs !== undefined && (
                  <p className="text-[11px] text-emerald-700 font-mono mt-0.5 font-bold">
                    Round-trip latency: {dbStatus.latencyMs}ms
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handlePing}
              disabled={isPinging}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#c0c9c2] text-xs font-bold hover:bg-[#f2f3ff] transition-all flex items-center space-x-1.5 shadow-2xs whitespace-nowrap self-end sm:self-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#003523] ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'Pinging...' : 'Test Ping'}</span>
            </button>
          </div>

          {/* Quick Setup Instructions */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#707973]">Quick Connect Instructions</h3>
            <div className="space-y-2 bg-[#f8f9ff] p-3.5 rounded-xl border border-[#c0c9c2]/40 text-xs">
              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-full bg-[#003523] text-white flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                <div>
                  <p className="font-semibold text-[#131b2e]">Create your Supabase Project</p>
                  <p className="text-[#55605a] text-[11px]">Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-bold inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-2.5 h-2.5" /></a> and select Mumbai / South Asia region.</p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-full bg-[#003523] text-white flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                <div className="flex-1">
                  <p className="font-semibold text-[#131b2e]">Execute SQL Schema & Seed</p>
                  <p className="text-[#55605a] text-[11px]">Open Supabase <strong>SQL Editor</strong> and run the schema script located at <code className="bg-emerald-100 text-emerald-900 px-1 rounded font-mono text-[10px]">supabase/schema.sql</code>.</p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-full bg-[#003523] text-white flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[#131b2e]">Add Environment Variables to .env</p>
                    <button
                      onClick={() => handleCopy("VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-public-key", 'env')}
                      className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1"
                    >
                      {copiedKey === 'env' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'env' ? 'Copied' : 'Copy Keys'}</span>
                    </button>
                  </div>
                  <pre className="mt-1 p-2 bg-[#131b2e] text-emerald-400 rounded-lg text-[10px] font-mono overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Tables Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#707973]">
                PostgreSQL Schema Tables ({tables.length} Tables)
              </h3>
              <span className="text-[11px] text-[#003523] font-bold">Realtime Publication Active</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {tables.map((t) => (
                <div key={t.name} className="p-2.5 rounded-xl border border-[#c0c9c2]/40 bg-white hover:border-[#003523]/40 transition-colors">
                  <div className="flex items-center space-x-1.5 font-mono text-xs font-bold text-[#003523]">
                    <Radio className="w-3 h-3 text-emerald-600" />
                    <span>{t.name}</span>
                  </div>
                  <p className="text-[11px] text-[#55605a] mt-0.5 leading-snug">{t.purpose}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#c0c9c2]/40 bg-[#f8f9ff] flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-[#55605a]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>RLS Enabled + Auto Updated-at Triggers + Kharar / Mohali Seed Ready</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#003523] hover:bg-[#144d37] text-white text-xs font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
