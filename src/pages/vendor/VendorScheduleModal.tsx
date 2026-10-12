import React, { useState } from 'react';
import { X, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { ServiceRequest } from '../../types';

interface VendorScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ServiceRequest | null;
  onConfirmSchedule: (slot: string, notes?: string) => void;
}

export const VendorScheduleModal: React.FC<VendorScheduleModalProps> = ({
  isOpen,
  onClose,
  request,
  onConfirmSchedule
}) => {
  const [confirmedSlot, setConfirmedSlot] = useState<string>('');
  const [scheduleNotes, setScheduleNotes] = useState<string>('');

  React.useEffect(() => {
    if (request) {
      setConfirmedSlot(`${request.preferredDate} at ${request.preferredTimeSlot.split('-')[0].trim() || 'Scheduled Time'}`);
      setScheduleNotes('Artisan confirmed schedule. Arriving with complete tools.');
    }
  }, [request]);

  if (!isOpen || !request) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedSlot.trim()) return;
    onConfirmSchedule(confirmedSlot.trim(), scheduleNotes.trim() ? scheduleNotes.trim() : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-200">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-[#f4fbf7]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#003523] text-white flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#b6efd1]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Confirm Service Schedule</h3>
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
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
            <span className="text-gray-500 block mb-0.5">Customer Requested Slot:</span>
            <div className="font-bold text-gray-900 flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-[#003523]" />
              <span>{request.preferredDate} ({request.preferredTimeSlot})</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Confirmed Arrival Time / Window <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={confirmedSlot}
              onChange={(e) => setConfirmedSlot(e.target.value)}
              placeholder="e.g. Today at 5:15 PM or Tomorrow 10:30 AM"
              className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003523]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Schedule Notes for Customer
            </label>
            <textarea
              rows={2}
              value={scheduleNotes}
              onChange={(e) => setScheduleNotes(e.target.value)}
              placeholder="e.g. Technician on the way from Sector 125, reaching in 20 minutes..."
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
              className="px-5 py-2.5 rounded-xl bg-[#003523] text-white text-xs font-bold hover:bg-[#144d37] transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-[#b6efd1]" />
              <span>Confirm & Lock Schedule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
