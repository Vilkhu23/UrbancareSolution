import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { ServiceRequest } from '../../types';

interface EmployeeRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ServiceRequest | null;
  onConfirmReject: (reason: string, notes?: string) => void;
}

const EMPLOYEE_REJECT_REASONS = [
  'Current on-site job taking longer than estimated',
  'Specialized diagnostic gear or pump in calibration/maintenance',
  'Medical emergency / Sudden health illness',
  'Route delay / Severe transit bottleneck',
  'Job requires two-person lifting or ladder scaffolding',
  'Other dispatch constraint'
];

export const EmployeeRejectModal: React.FC<EmployeeRejectModalProps> = ({
  isOpen,
  onClose,
  request,
  onConfirmReject
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(EMPLOYEE_REJECT_REASONS[0]);
  const [customNote, setCustomNote] = useState<string>('');

  if (!isOpen || !request) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmReject(selectedReason, customNote.trim() ? customNote.trim() : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-200">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-[#fffbfa]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Decline Assigned Task</h3>
              <p className="text-xs text-gray-500">Order #{request.id} · {request.locality}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start space-x-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Supervisor Notification</span>
              <span>
                Declining this job will alert Operations Lead Harman on the manual Assignment Board to dispatch another technician.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Reason for Declining <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {EMPLOYEE_REJECT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-start space-x-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedReason === reason
                      ? 'border-[#003523] bg-[#003523]/5 font-semibold text-[#003523]'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="employeeRejectReason"
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="mt-0.5 text-[#003523] focus:ring-[#003523]"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Note for Operations Supervisor (Optional)
            </label>
            <textarea
              rows={2}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Currently finishing work at Sector 110, capacitor replacement will take extra 30 mins..."
              className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003523]"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-sm"
            >
              Decline & Return to Dispatch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
