import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  UserCheck,
  ShieldAlert,
  AlertCircle,
  Star,
  CheckCircle2,
  Clock,
  Briefcase
} from 'lucide-react';
import { ServiceRequest } from '../../types';

interface AssignModalProps {
  requestId: string | null;
  onClose: () => void;
}

export const AssignModal: React.FC<AssignModalProps> = ({ requestId, onClose }) => {
  const {
    requests,
    vendors,
    employees,
    assignRequest,
    reassignRequest
  } = useApp();

  const [selectedType, setSelectedType] = useState<'EMPLOYEE' | 'VENDOR'>('EMPLOYEE');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [assignedBy, setAssignedBy] = useState('Harman (Ops Lead)');
  const [assignmentReason, setAssignmentReason] = useState('Trade skill match & locality proximity in Kharar/Mohali');
  const [isReassignment, setIsReassignment] = useState(false);
  const [reassignReason, setReassignReason] = useState('');

  if (!requestId) return null;
  const order = requests.find((r) => r.id === requestId);
  if (!order) return null;

  const orderCategory = order.items[0]?.serviceName || '';

  // Filter eligible employees and vendors
  const eligibleEmployees = employees.filter((e) => e.status === 'ACTIVE');
  const eligibleVendors = vendors.filter((v) => v.status === 'ACTIVE');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssigneeId) return;

    if (isReassignment || order.assignedTo) {
      reassignRequest(
        order.id,
        selectedAssigneeId,
        selectedType,
        reassignReason || assignmentReason || 'Supervisor reassignment',
        dispatchNotes,
        assignedBy
      );
    } else {
      assignRequest(
        order.id,
        selectedAssigneeId,
        selectedType,
        dispatchNotes,
        assignedBy,
        assignmentReason
      );
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#c0c9c2]/50 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#c0c9c2]/40 bg-[#003523] text-white flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-[#fe932c]" />
              <h3 className="text-base font-bold">Manual Operations Dispatch</h3>
              <span className="font-mono text-xs bg-[#144d37] px-2 py-0.5 rounded">
                #{order.id}
              </span>
            </div>
            <p className="text-xs text-[#b6efd1] mt-0.5">
              {order.locality} · {order.items.map((i) => i.serviceName).join(', ')}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form id="assign-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Order Summary & Customer Details */}
          <div className="p-3.5 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/50 space-y-1.5">
            <div className="flex justify-between text-[#131b2e] font-bold">
              <span>Customer: {order.customerName}</span>
              <span>Phone: {order.customerPhone}</span>
            </div>
            <div className="text-[#404943] text-[11px]">
              <strong>Address:</strong> {order.address} ({order.landmark || 'No landmark'})
            </div>
            <div className="text-[#404943] text-[11px]">
              <strong>Slot:</strong> {order.preferredDate} · {order.preferredTimeSlot}
            </div>
            {order.notes && (
              <div className="text-[11px] text-[#904d00] bg-[#ffdcc3]/40 p-1.5 rounded">
                <strong>Customer Problem Note:</strong> {order.notes}
              </div>
            )}
          </div>

          {/* Reassignment Toggle if already assigned */}
          {order.assignedTo && (
            <div className="p-3 rounded-xl bg-[#ffdcc3]/30 border border-[#fe932c] space-y-2">
              <div className="flex items-center justify-between font-bold text-[#904d00]">
                <span>Currently Assigned: {order.assignedTo.name}</span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded">REASSIGNMENT MODE</span>
              </div>
              <input
                type="text"
                placeholder="Reason for reassignment (e.g. technician delayed, required special ladder)..."
                value={reassignReason}
                onChange={(e) => {
                  setReassignReason(e.target.value);
                  setIsReassignment(true);
                }}
                className="w-full p-2 rounded-lg border border-[#c0c9c2] bg-white text-xs"
              />
            </div>
          )}

          {/* Select Type Toggle */}
          <div>
            <label className="block font-bold text-[#131b2e] mb-2 uppercase tracking-wider text-[11px]">
              Select Assignee Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedType('EMPLOYEE');
                  setSelectedAssigneeId('');
                }}
                className={`p-3 rounded-xl border text-center font-bold transition-all ${
                  selectedType === 'EMPLOYEE'
                    ? 'border-[#003523] bg-[#c0edd3]/25 text-[#003523]'
                    : 'border-[#c0c9c2]/60 bg-white text-[#404943]'
                }`}
              >
                Direct Staff Employee ({eligibleEmployees.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedType('VENDOR');
                  setSelectedAssigneeId('');
                }}
                className={`p-3 rounded-xl border text-center font-bold transition-all ${
                  selectedType === 'VENDOR'
                    ? 'border-[#003523] bg-[#c0edd3]/25 text-[#003523]'
                    : 'border-[#c0c9c2]/60 bg-white text-[#404943]'
                }`}
              >
                Registered Vendor Partner ({eligibleVendors.length})
              </button>
            </div>
          </div>

          {/* Assignee Options List */}
          <div className="space-y-2">
            <label className="block font-bold text-[#131b2e] mb-1">
              Select Verified Professional:
            </label>

            {selectedType === 'EMPLOYEE' ? (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {eligibleEmployees.map((emp) => (
                  <label
                    key={emp.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedAssigneeId === emp.id
                        ? 'border-[#003523] bg-[#c0edd3]/20'
                        : 'border-[#c0c9c2]/50 hover:border-[#003523] bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="assignee-choice"
                        value={emp.id}
                        checked={selectedAssigneeId === emp.id}
                        onChange={() => setSelectedAssigneeId(emp.id)}
                        className="text-[#003523] focus:ring-[#003523]"
                      />
                      <div>
                        <div className="font-bold text-[#131b2e] text-xs flex items-center space-x-2">
                          <span>{emp.name}</span>
                          <span className="text-[10px] bg-[#eaedff] text-[#003523] px-1.5 py-0.2 rounded font-semibold">
                            {emp.availability}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#707973]">
                          Skills: {emp.skills.join(', ')} · Active Jobs: {emp.activeJobs}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#003523]">{emp.rating} ★</div>
                      <div className="text-[10px] text-[#707973]">{emp.serviceAreas[0]}</div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {eligibleVendors.map((vnd) => {
                  const remaining = vnd.plan.remainingOpportunities;
                  const canAssign = remaining > 0;

                  return (
                    <label
                      key={vnd.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        !canAssign
                          ? 'opacity-60 bg-gray-50 border-gray-200 cursor-not-allowed'
                          : selectedAssigneeId === vnd.id
                          ? 'border-[#003523] bg-[#c0edd3]/20 cursor-pointer'
                          : 'border-[#c0c9c2]/50 hover:border-[#003523] bg-white cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="assignee-choice"
                          value={vnd.id}
                          disabled={!canAssign}
                          checked={selectedAssigneeId === vnd.id}
                          onChange={() => setSelectedAssigneeId(vnd.id)}
                          className="text-[#003523] focus:ring-[#003523]"
                        />
                        <div>
                          <div className="font-bold text-[#131b2e] text-xs">
                            {vnd.businessName} ({vnd.ownerName})
                          </div>
                          <div className="text-[11px] text-[#707973]">
                            {vnd.categories.join(', ')} · Active: {vnd.activeJobs}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-xs font-bold ${
                            canAssign ? 'text-[#003523]' : 'text-[#ba1a1a]'
                          }`}
                        >
                          {remaining} Opportunities Left
                        </div>
                        <div className="text-[10px] text-[#707973]">{vnd.rating} ★ Rating</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Assigned By & Assignment Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">
                Assigned By (Dispatcher / Ops Officer)
              </label>
              <select
                value={assignedBy}
                onChange={(e) => setAssignedBy(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#c0c9c2] text-xs font-semibold bg-white"
              >
                <option value="Harman (Ops Lead)">Harman (Ops Lead - Kharar Central)</option>
                <option value="Ritu Sharma (Dispatch Supervisor)">Ritu Sharma (Dispatch Supervisor)</option>
                <option value="Jaspreet Singh (Duty Manager)">Jaspreet Singh (Duty Manager)</option>
                <option value="Operations Central Dispatch">Operations Central Dispatch</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#131b2e] mb-1">
                Dispatch / Assignment Reason
              </label>
              <input
                type="text"
                required
                value={assignmentReason}
                onChange={(e) => setAssignmentReason(e.target.value)}
                placeholder="e.g. Verified trade certification & proximity"
                className="w-full p-2.5 rounded-lg border border-[#c0c9c2] text-xs bg-white"
              />
            </div>
          </div>

          {/* Supervisor Notes */}
          <div>
            <label className="block font-bold text-[#131b2e] mb-1">
              Supervisor Dispatch & Toolkit Instructions
            </label>
            <textarea
              rows={2}
              value={dispatchNotes}
              onChange={(e) => setDispatchNotes(e.target.value)}
              placeholder="e.g. Please carry spare 25uF capacitor and 6ft ladder. Customer requested call 15 mins prior."
              className="w-full p-2.5 rounded-lg border border-[#c0c9c2] text-xs"
            />
          </div>

          <div className="p-3 rounded-lg bg-[#f2f3ff] text-[11px] text-[#404943]">
            <strong>Compliance Note:</strong> Assigning a vendor will deduct 1 Qualified Work Opportunity from their balance and log the transaction in the Opportunity Ledger.
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-[#c0c9c2]/40 bg-[#faf8ff] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#c0c9c2] text-[#404943] font-bold text-xs hover:bg-[#f2f3ff]"
          >
            Cancel
          </button>
          <button
            form="assign-form"
            type="submit"
            disabled={!selectedAssigneeId}
            className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md active:scale-98 transition-all flex items-center space-x-1.5 ${
              selectedAssigneeId
                ? 'bg-[#003523] hover:bg-[#144d37]'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-[#fe932c]" />
            <span>Confirm & Dispatch</span>
          </button>
        </div>
      </div>
    </div>
  );
};
