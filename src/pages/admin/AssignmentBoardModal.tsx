import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, CheckCircle2, UserCheck, AlertCircle, Clock, MapPin } from 'lucide-react';
import { Employee, Vendor } from '../../types';

interface AssignmentBoardModalProps {
  artisan: Employee | Vendor | null;
  artisanType: 'EMPLOYEE' | 'VENDOR';
  mode: 'ASSIGN' | 'REASSIGN';
  isOpen: boolean;
  onClose: () => void;
}

export const AssignmentBoardModal: React.FC<AssignmentBoardModalProps> = ({
  artisan,
  artisanType,
  mode,
  isOpen,
  onClose
}) => {
  const { requests, assignRequest, reassignRequest, showToast } = useApp();

  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [assignedBy, setAssignedBy] = useState<string>('Harman (Ops Lead)');
  const [reason, setReason] = useState<string>(
    mode === 'ASSIGN'
      ? 'Selected from Assignment Board by trade expertise & locality'
      : 'Manual artisan reassignment from Assignment Board'
  );
  const [notes, setNotes] = useState<string>('');

  if (!isOpen || !artisan) return null;

  const artisanName = 'name' in artisan ? artisan.name : artisan.businessName;
  const isVendor = artisanType === 'VENDOR';
  const vendorObj = isVendor ? (artisan as Vendor) : null;
  const canVendorAccept = !vendorObj || vendorObj.plan.remainingOpportunities > 0;

  // For ASSIGN mode: show unassigned or pending requests
  // For REASSIGN mode: show all active requests or requests needing attention
  const candidateRequests = requests.filter((r) => {
    if (mode === 'ASSIGN') {
      return (
        r.status === 'NEW' ||
        r.status === 'UNDER REVIEW' ||
        r.status === 'READY FOR ASSIGNMENT' ||
        r.status === 'DISPUTED' ||
        !r.assignedTo
      );
    } else {
      return (
        r.status === 'ASSIGNED' ||
        r.status === 'ACCEPTED' ||
        r.status === 'SCHEDULED' ||
        r.status === 'IN PROGRESS' ||
        r.status === 'DISPUTED'
      );
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestId) {
      showToast('Please select a target service order', 'error');
      return;
    }

    if (isVendor && !canVendorAccept) {
      showToast('Vendor has 0 remaining work opportunities. Quota adjustment required.', 'error');
      return;
    }

    const order = requests.find((r) => r.id === selectedRequestId);
    if (!order) return;

    if (mode === 'REASSIGN' || order.assignedTo) {
      reassignRequest(
        order.id,
        artisan.id,
        artisanType,
        reason || 'Reassigned from Assignment Board',
        notes,
        assignedBy
      );
    } else {
      assignRequest(
        order.id,
        artisan.id,
        artisanType,
        notes,
        assignedBy,
        reason
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#c0c9c2]/50 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#c0c9c2]/40 bg-[#003523] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#144d37] rounded-xl text-[#fe932c]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {mode === 'ASSIGN' ? 'Assign Work to Artisan' : 'Reassign Order to Artisan'}
              </h3>
              <p className="text-xs text-[#b6efd1]">
                Target: <strong className="text-white">{artisanName}</strong> ({artisanType})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Artisan Summary Strip */}
          <div className="p-3.5 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/50 flex items-center justify-between">
            <div>
              <div className="font-black text-[#131b2e] text-sm">{artisanName}</div>
              <div className="text-[11px] text-[#707973]">
                {artisan.mobile} · Areas: {artisan.serviceAreas.join(', ')}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-[#003523]">{artisan.rating} ★</span>
              {isVendor && vendorObj && (
                <div
                  className={`text-[11px] font-bold ${
                    canVendorAccept ? 'text-[#003523]' : 'text-[#ba1a1a]'
                  }`}
                >
                  {vendorObj.plan.remainingOpportunities} Leads Left
                </div>
              )}
            </div>
          </div>

          {/* Select Target Request */}
          <div className="space-y-1.5">
            <label className="block font-bold text-[#131b2e] uppercase text-[11px]">
              Select Service Order ({candidateRequests.length} candidate jobs):
            </label>

            {candidateRequests.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-[#c0c9c2] rounded-xl text-gray-500">
                No orders currently in {mode === 'ASSIGN' ? 'unassigned/pending' : 'active'} state.
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {candidateRequests.map((req) => (
                  <label
                    key={req.id}
                    className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedRequestId === req.id
                        ? 'border-[#003523] bg-[#c0edd3]/25 shadow-xs'
                        : 'border-[#c0c9c2]/50 hover:border-[#003523] bg-white'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      <input
                        type="radio"
                        name="board-req"
                        value={req.id}
                        checked={selectedRequestId === req.id}
                        onChange={() => setSelectedRequestId(req.id)}
                        className="mt-1 text-[#003523] focus:ring-[#003523]"
                      />
                      <div>
                        <div className="font-extrabold text-[#131b2e]">
                          #{req.id} · {req.customerName} ({req.locality})
                        </div>
                        <div className="text-[11px] text-[#404943] mt-0.5">
                          {req.items.map((i) => i.serviceName).join(', ')}
                        </div>
                        <div className="text-[10px] text-[#707973] flex items-center space-x-2 mt-1">
                          <span>Slot: {req.preferredDate} · {req.preferredTimeSlot}</span>
                          <span>·</span>
                          <span className="font-mono font-bold text-[#003523]">₹{req.total}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#faf8ff] border border-[#c0c9c2]/50 text-[#131b2e]">
                        {req.status}
                      </span>
                      {req.assignedTo && (
                        <div className="text-[10px] text-[#ba1a1a] mt-1">
                          Current: {req.assignedTo.name}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Assigned By & Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">
                Assigned By (Dispatcher)
              </label>
              <select
                value={assignedBy}
                onChange={(e) => setAssignedBy(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs font-semibold bg-white"
              >
                <option value="Harman (Ops Lead)">Harman (Ops Lead - Kharar)</option>
                <option value="Ritu Sharma (Dispatch Supervisor)">Ritu Sharma (Dispatch Supervisor)</option>
                <option value="Jaspreet Singh (Duty Manager)">Jaspreet Singh (Duty Manager)</option>
                <option value="Operations Central Dispatch">Operations Central Dispatch</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#131b2e] mb-1">
                {mode === 'ASSIGN' ? 'Assignment Reason' : 'Reassignment Reason'}
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for audit log..."
                className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs bg-white"
              />
            </div>
          </div>

          {/* Dispatcher Notes */}
          <div>
            <label className="block font-bold text-[#131b2e] mb-1">
              Dispatch & Toolkit Instructions (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please carry spare parts. Call customer 15 mins prior..."
              className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-[#c0c9c2]/40 bg-[#faf8ff] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#c0c9c2] text-[#404943] font-bold text-xs hover:bg-[#eaedff]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedRequestId || (isVendor && !canVendorAccept)}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md active:scale-98 transition-all flex items-center space-x-1.5 ${
              selectedRequestId && (!isVendor || canVendorAccept)
                ? 'bg-[#003523] hover:bg-[#144d37]'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-[#fe932c]" />
            <span>Confirm {mode}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
