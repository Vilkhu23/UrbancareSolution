import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ComplaintRecord } from '../../types';

interface ComplaintResolveModalProps {
  complaint: ComplaintRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ComplaintResolveModal: React.FC<ComplaintResolveModalProps> = ({
  complaint,
  isOpen,
  onClose
}) => {
  const { resolveComplaint } = useApp();
  const [resolutionNotes, setResolutionNotes] = useState('');

  if (!isOpen || !complaint) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) return;
    resolveComplaint(complaint.id, resolutionNotes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#c0c9c2]/50 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#c0c9c2]/40 bg-[#003523] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-[#fe932c]" />
            <h3 className="text-base font-bold">Resolve Customer Complaint</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div className="p-3 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/50 space-y-1">
            <div className="flex justify-between font-bold text-[#131b2e]">
              <span>Customer: {complaint.customerName}</span>
              <span className="text-[#ba1a1a] font-mono">#{complaint.id}</span>
            </div>
            <div className="text-[11px] text-[#707973]">
              Linked Order: #{complaint.requestId} · Issue: <strong>{complaint.issueType}</strong>
            </div>
            <p className="text-[11px] text-[#404943] mt-1 bg-white p-2 rounded border border-[#c0c9c2]/40">
              "{complaint.description}"
            </p>
          </div>

          <div>
            <label className="block font-bold text-[#131b2e] mb-1">
              Resolution Action & Supervisor Notes
            </label>
            <textarea
              required
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. Dispatched replacement artisan with zero visit fee. Customer satisfied with fix."
              className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#c0c9c2] text-[#404943] font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold shadow-xs flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-[#fe932c]" />
              <span>Mark Resolved</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
