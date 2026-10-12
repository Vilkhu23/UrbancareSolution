import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, BadgePercent, PlusCircle, MinusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Vendor } from '../../types';

interface VendorLedgerModalProps {
  vendorId: string | null;
  onClose: () => void;
}

export const VendorLedgerModal: React.FC<VendorLedgerModalProps> = ({ vendorId, onClose }) => {
  const { vendors, adjustVendorOpportunities, opportunityLedger } = useApp();

  const [delta, setDelta] = useState<number>(1);
  const [reason, setReason] = useState<string>('');

  if (!vendorId) return null;
  const vendor = vendors.find((v) => v.id === vendorId);
  if (!vendor) return null;

  const vendorHistory = opportunityLedger.filter((l) => l.vendorId === vendorId);

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    adjustVendorOpportunities(vendor.id, delta, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#c0c9c2]/50 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#c0c9c2]/40 bg-[#003523] text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Adjust Work Opportunities Balance</h3>
            <p className="text-xs text-[#b6efd1]">
              {vendor.businessName} ({vendor.ownerName})
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form id="ledger-form" onSubmit={handleAdjust} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Current Subscription Snapshot */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/40">
              <span className="text-[10px] text-[#707973] uppercase block">Total Plan</span>
              <span className="text-base font-black text-[#131b2e]">
                {vendor.plan.totalOpportunities}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/40">
              <span className="text-[10px] text-[#707973] uppercase block">Used</span>
              <span className="text-base font-black text-[#ba1a1a]">
                {vendor.plan.usedOpportunities}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#c0edd3]/20 border border-[#b6efd1]">
              <span className="text-[10px] text-[#003523] uppercase block font-bold">Remaining</span>
              <span className="text-base font-black text-[#003523]">
                {vendor.plan.remainingOpportunities}
              </span>
            </div>
          </div>

          {/* Delta selection */}
          <div>
            <label className="block font-bold text-[#131b2e] mb-1">
              Select Adjustment (+ / - Opportunities)
            </label>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setDelta(-1)}
                className={`flex-1 py-2 rounded-lg border font-bold text-xs ${
                  delta === -1
                    ? 'bg-[#ba1a1a] text-white border-[#ba1a1a]'
                    : 'bg-white text-[#ba1a1a] border-[#ba1a1a]/40'
                }`}
              >
                -1 Opportunity
              </button>
              <button
                type="button"
                onClick={() => setDelta(1)}
                className={`flex-1 py-2 rounded-lg border font-bold text-xs ${
                  delta === 1
                    ? 'bg-[#003523] text-white border-[#003523]'
                    : 'bg-white text-[#003523] border-[#003523]/40'
                }`}
              >
                +1 Opportunity
              </button>
              <button
                type="button"
                onClick={() => setDelta(7)}
                className={`flex-1 py-2 rounded-lg border font-bold text-xs ${
                  delta === 7
                    ? 'bg-[#003523] text-white border-[#003523]'
                    : 'bg-white text-[#003523] border-[#003523]/40'
                }`}
                title="Initial Demo Plan (₹1,499 · 7 Leads)"
              >
                +7 Demo (₹1,499)
              </button>
              <button
                type="button"
                onClick={() => setDelta(16)}
                className={`flex-1 py-2 rounded-lg border font-bold text-xs ${
                  delta === 16
                    ? 'bg-[#003523] text-white border-[#003523]'
                    : 'bg-white text-[#003523] border-[#003523]/40'
                }`}
                title="Contractor Plan (₹2,999 · 16 Leads)"
              >
                +16 Contractor (₹2,999)
              </button>
              <button
                type="button"
                onClick={() => setDelta(30)}
                className={`flex-1 py-2 rounded-lg border font-bold text-xs ${
                  delta === 30
                    ? 'bg-[#003523] text-white border-[#003523]'
                    : 'bg-white text-[#003523] border-[#003523]/40'
                }`}
                title="Enterprise Crew Plan (₹4,999 · 30 Leads)"
              >
                +30 Enterprise (₹4,999)
              </button>
            </div>
          </div>

          {/* Mandatory Reason */}
          <div>
            <label className="block font-bold text-[#131b2e] mb-1">
              Mandatory Adjustment Reason & Audit Note *
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Granted compensatory opportunity due to customer rescheduling cancellation."
              className="w-full p-2.5 rounded-lg border border-[#c0c9c2] text-xs"
            />
          </div>

          {/* Transaction Ledger Log */}
          <div className="space-y-2 pt-2 border-t border-[#c0c9c2]/40">
            <label className="block font-bold text-[#131b2e] text-[11px] uppercase tracking-wider">
              Recent Opportunity Ledger History
            </label>
            {vendorHistory.length === 0 ? (
              <p className="text-[11px] text-[#707973]">No past ledger transactions.</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {vendorHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg bg-[#faf8ff] border border-[#c0c9c2]/30 flex justify-between text-[11px]"
                  >
                    <div>
                      <div className="font-semibold text-[#131b2e]">{item.reason}</div>
                      <div className="text-[10px] text-[#707973]">{item.timestamp} · By {item.performedBy}</div>
                    </div>
                    <div className="text-right font-mono font-bold">
                      <span className={item.change > 0 ? 'text-[#003523]' : 'text-[#ba1a1a]'}>
                        {item.change > 0 ? `+${item.change}` : item.change}
                      </span>
                      <div className="text-[10px] text-[#707973]">Bal: {item.balanceAfter}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-[#c0c9c2]/40 bg-[#faf8ff] flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#c0c9c2] text-xs font-bold text-[#707973]"
          >
            Cancel
          </button>
          <button
            form="ledger-form"
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs shadow-md"
          >
            Save Quota Adjustment
          </button>
        </div>
      </div>
    </div>
  );
};
