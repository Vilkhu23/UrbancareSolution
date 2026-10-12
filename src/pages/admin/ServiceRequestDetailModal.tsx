import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  FileText,
  MessageSquare,
  ShieldAlert,
  Send,
  UserCheck,
  RefreshCw,
  Image as ImageIcon,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { BookingStatus, ServiceRequest } from '../../types';

interface ServiceRequestDetailModalProps {
  requestId: string | null;
  onClose: () => void;
  onOpenAssign: (id: string) => void;
}

export const ServiceRequestDetailModal: React.FC<ServiceRequestDetailModalProps> = ({
  requestId,
  onClose,
  onOpenAssign
}) => {
  const {
    requests,
    updateRequestStatus,
    addInternalNote,
    recordPayment,
    showToast
  } = useApp();

  const [newNoteText, setNewNoteText] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateNote, setStatusUpdateNote] = useState('');
  const [targetStatus, setTargetStatus] = useState<BookingStatus | ''>('');

  if (!requestId) return null;
  const request = requests.find((r) => r.id === requestId);
  if (!request) return null;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addInternalNote(request.id, newNoteText.trim(), 'Harman (Ops Lead)');
    setNewNoteText('');
  };

  const handleStatusChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus) return;
    updateRequestStatus(request.id, targetStatus, statusUpdateNote || `Status changed to ${targetStatus} by Operations`);
    setIsUpdatingStatus(false);
    setStatusUpdateNote('');
    setTargetStatus('');
  };

  const handleMarkPaid = () => {
    recordPayment({
      requestId: request.id,
      customerName: request.customerName,
      amount: request.total,
      mode: request.paymentMode === 'CASH' ? 'CASH' : 'UPI',
      collectedBy: request.assignedTo ? request.assignedTo.name : 'Operations Supervisor',
      status: 'SUCCESS'
    });
  };

  const statusColors: Record<string, string> = {
    'NEW': 'bg-[#ffdcc3] text-[#904d00] border-[#fe932c]',
    'UNDER REVIEW': 'bg-[#eaedff] text-[#003523] border-[#c0c9c2]',
    'READY FOR ASSIGNMENT': 'bg-[#c0edd3] text-[#002114] border-[#003523]',
    'ASSIGNED': 'bg-blue-100 text-blue-800 border-blue-300',
    'ACCEPTED': 'bg-teal-100 text-teal-800 border-teal-300',
    'SCHEDULED': 'bg-indigo-100 text-indigo-800 border-indigo-300',
    'IN PROGRESS': 'bg-amber-100 text-amber-800 border-amber-300',
    'COMPLETED': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'CUSTOMER CONFIRMED': 'bg-[#c0edd3] text-[#003523] border-[#003523]',
    'CANCELLED': 'bg-gray-100 text-gray-700 border-gray-300',
    'DISPUTED': 'bg-red-100 text-red-800 border-red-300'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#c0c9c2]/50 overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-4 border-b border-[#c0c9c2]/40 bg-[#003523] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#144d37] rounded-xl text-[#fe932c]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Service Request Dossier
                </h2>
                <span className="font-mono text-xs bg-[#fe932c] text-[#002114] px-2 py-0.5 rounded font-black">
                  #{request.id}
                </span>
              </div>
              <p className="text-xs text-[#b6efd1] mt-0.5">
                Logged: {request.createdAt} · Sector Locality: {request.locality}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onOpenAssign(request.id);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#fe932c] hover:bg-[#e07f24] text-[#002114] text-xs font-bold flex items-center space-x-1 shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{request.assignedTo ? 'Reassign Artisan' : 'Assign Artisan'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs bg-[#faf8ff]">
          {/* Quick Status & Action Strip */}
          <div className="bg-white p-4 rounded-2xl border border-[#c0c9c2]/50 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div>
                <span className="text-[10px] text-[#707973] uppercase font-bold block">
                  Current Operational Status
                </span>
                <span
                  className={`inline-block px-3 py-1 rounded-lg text-xs font-black border mt-1 ${
                    statusColors[request.status] || 'bg-gray-100 text-gray-800 border-gray-300'
                  }`}
                >
                  {request.status}
                </span>
              </div>

              {request.assignedTo ? (
                <div className="pl-4 border-l border-[#c0c9c2]/40">
                  <span className="text-[10px] text-[#707973] uppercase font-bold block">
                    Assigned Artisan
                  </span>
                  <div className="font-extrabold text-[#131b2e] text-xs mt-1 flex items-center space-x-1.5">
                    <span>{request.assignedTo.name}</span>
                    <span className="text-[10px] font-bold text-[#003523] bg-[#c0edd3] px-1.5 py-0.2 rounded">
                      {request.assignedTo.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#707973]">
                    {request.assignedTo.phone} · {request.assignedTo.rating}
                  </div>
                </div>
              ) : (
                <div className="pl-4 border-l border-[#c0c9c2]/40 text-[#ba1a1a]">
                  <span className="text-[10px] uppercase font-bold block">Assignee Status</span>
                  <span className="font-bold text-xs mt-1 block">Unassigned · Awaiting Operations Selection</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsUpdatingStatus(!isUpdatingStatus)}
                className="px-3 py-2 rounded-xl border border-[#c0c9c2] hover:bg-[#eaedff] text-[#131b2e] font-bold text-xs flex items-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#003523]" />
                <span>Change Status</span>
              </button>
            </div>
          </div>

          {/* Change Status Popover Form */}
          {isUpdatingStatus && (
            <form
              onSubmit={handleStatusChangeSubmit}
              className="p-4 rounded-2xl bg-white border border-[#003523] shadow-md space-y-3 animate-fadeIn"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-[#131b2e] text-xs uppercase tracking-wider">
                  Update Operational State for #{request.id}
                </span>
                <button
                  type="button"
                  onClick={() => setIsUpdatingStatus(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#707973] font-semibold mb-1">
                    Select Next Lifecycle Status
                  </label>
                  <select
                    required
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as BookingStatus)}
                    className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs font-bold bg-white"
                  >
                    <option value="">-- Choose New Status --</option>
                    <option value="NEW">NEW</option>
                    <option value="UNDER REVIEW">UNDER REVIEW</option>
                    <option value="READY FOR ASSIGNMENT">READY FOR ASSIGNMENT</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="ACCEPTED">ACCEPTED</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="IN PROGRESS">IN PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CUSTOMER CONFIRMED">CUSTOMER CONFIRMED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="DISPUTED">DISPUTED / REASSIGNMENT REQUIRED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[#707973] font-semibold mb-1">
                    Status Transition Reason / Supervisor Note
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Verified customer address & gate pass"
                    value={statusUpdateNote}
                    onChange={(e) => setStatusUpdateNote(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsUpdatingStatus(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#c0c9c2] text-[#404943] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!targetStatus}
                  className="px-4 py-1.5 rounded-lg bg-[#003523] text-white text-xs font-bold shadow-xs hover:bg-[#144d37]"
                >
                  Commit Status Update
                </button>
              </div>
            </form>
          )}

          {/* 2-Column Core Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer & Address Card */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#c0c9c2]/50 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b border-[#c0c9c2]/30">
                <User className="w-4 h-4 text-[#003523]" />
                <h3 className="font-black text-sm text-[#131b2e]">Customer & Location Profile</h3>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#707973]">Full Name:</span>
                  <span className="font-extrabold text-[#131b2e]">{request.customerName}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#707973]">Phone (+91):</span>
                  <a
                    href={`tel:${request.customerPhone}`}
                    className="font-bold text-[#003523] hover:underline flex items-center space-x-1"
                  >
                    <Phone className="w-3 h-3 inline mr-1" />
                    <span>{request.customerPhone}</span>
                  </a>
                </div>

                {request.customerEmail && (
                  <div className="flex justify-between">
                    <span className="text-[#707973]">Email:</span>
                    <span className="font-medium text-[#131b2e]">{request.customerEmail}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-[#c0c9c2]/20">
                  <span className="text-[#707973] block mb-1">Service Address:</span>
                  <div className="p-2.5 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/40 text-[#131b2e] font-semibold leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 inline mr-1 text-[#003523]" />
                    {request.address}
                    {request.landmark && (
                      <span className="block text-[11px] text-[#707973] mt-1">
                        Landmark: {request.landmark}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between pt-1">
                  <span className="text-[#707973]">Sector Sub-Zone:</span>
                  <span className="font-bold text-[#003523]">{request.locality}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#707973]">Preferred Appointment:</span>
                  <span className="font-extrabold text-[#131b2e]">
                    {request.preferredDate} · {request.preferredTimeSlot}
                  </span>
                </div>
              </div>
            </div>

            {/* Price & Billing Card */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#c0c9c2]/50 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#c0c9c2]/30">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-[#003523]" />
                  <h3 className="font-black text-sm text-[#131b2e]">Financials & Payment Status</h3>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                    request.paymentStatus === 'PAID'
                      ? 'bg-[#c0edd3] text-[#003523]'
                      : 'bg-[#ffdcc3] text-[#904d00]'
                  }`}
                >
                  {request.paymentStatus}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[#707973]">
                  <span>Item Subtotal:</span>
                  <span className="font-mono font-bold text-[#131b2e]">₹{request.subtotal}</span>
                </div>

                <div className="flex justify-between text-[#707973]">
                  <span>Doorstep Visit / Inspection Fee:</span>
                  <span className="font-mono font-bold text-[#131b2e]">
                    {request.visitFee === 0 ? 'FREE' : `₹${request.visitFee}`}
                  </span>
                </div>

                {request.taxAmount !== undefined && request.taxAmount > 0 && (
                  <div className="flex justify-between text-[#707973]">
                    <span>Configured GST:</span>
                    <span className="font-mono font-bold text-[#131b2e]">₹{request.taxAmount}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-[#c0c9c2]/40 flex justify-between text-sm font-black text-[#131b2e]">
                  <span>Total Order Value:</span>
                  <span className="text-[#003523]">₹{request.total}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/40 flex items-center justify-between mt-2">
                  <div>
                    <span className="text-[10px] text-[#707973] uppercase font-bold block">
                      Payment Mode
                    </span>
                    <span className="font-bold text-[#131b2e]">
                      {request.paymentMode || 'Pending Settlement on Completion'}
                    </span>
                  </div>

                  {request.paymentStatus !== 'PAID' && (
                    <button
                      onClick={handleMarkPaid}
                      className="px-3 py-1.5 rounded-lg bg-[#003523] hover:bg-[#144d37] text-white font-bold text-[11px] shadow-xs"
                    >
                      Record Payment
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Service Items Ordered */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#c0c9c2]/50 shadow-xs space-y-3">
            <h3 className="font-black text-sm text-[#131b2e]">Booked Services Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#c0c9c2]/50 bg-[#faf8ff] text-[#404943] font-bold">
                    <th className="p-2.5">Service Name</th>
                    <th className="p-2.5">Pricing Model</th>
                    <th className="p-2.5">Unit Price</th>
                    <th className="p-2.5">Quantity</th>
                    <th className="p-2.5 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c0c9c2]/30">
                  {request.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#faf8ff]">
                      <td className="p-2.5 font-bold text-[#131b2e]">
                        {item.serviceName}
                        {item.isPackage && (
                          <span className="ml-2 text-[10px] bg-[#ffdcc3] text-[#904d00] font-bold px-1.5 py-0.2 rounded">
                            PACKAGE
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-[#707973]">
                        {item.price_type || (item.price === 0 ? 'QUOTE_REQUIRED' : 'FIXED')}
                      </td>
                      <td className="p-2.5 font-mono">
                        {item.price === 0 || item.price_type === 'QUOTE_REQUIRED'
                          ? 'Quote Basis'
                          : `₹${item.price}`}
                      </td>
                      <td className="p-2.5 font-bold">{item.quantity}</td>
                      <td className="p-2.5 font-mono font-black text-right text-[#003523]">
                        {item.price === 0 || item.price_type === 'QUOTE_REQUIRED'
                          ? 'On-Site Quote'
                          : `₹${item.price * item.quantity}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Problem Statement & Photos Gallery */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#c0c9c2]/50 shadow-xs space-y-3">
            <h3 className="font-black text-sm text-[#131b2e]">
              Customer Reported Problem & Uploaded Inspection Photos
            </h3>

            {request.notes && (
              <div className="p-3 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/40 text-[#131b2e] leading-relaxed">
                <span className="text-[10px] font-bold uppercase text-[#707973] block mb-1">
                  Customer Notes:
                </span>
                <p>{request.notes}</p>
              </div>
            )}

            {request.problemDescription && (
              <div className="p-3 rounded-xl bg-[#c0edd3]/20 border border-[#9ad3b5] text-[#002114] leading-relaxed">
                <span className="text-[10px] font-bold uppercase text-[#003523] block mb-1">
                  Diagnostic Specification:
                </span>
                <p>{request.problemDescription}</p>
              </div>
            )}

            {/* Photos Strip */}
            <div>
              <span className="text-[10px] font-bold uppercase text-[#707973] block mb-2">
                Attached Problem Photos ({request.problemPhotos?.length || 0})
              </span>
              {request.problemPhotos && request.problemPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {request.problemPhotos.map((url, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedPhoto(url)}
                      className="group relative rounded-xl overflow-hidden border border-[#c0c9c2]/50 aspect-4/3 cursor-pointer shadow-xs hover:border-[#003523] transition-all"
                    >
                      <img
                        src={url}
                        alt={`Problem photo ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold transition-opacity">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-[#c0c9c2] text-center text-[#707973]">
                  <ImageIcon className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                  <span>No client photos uploaded for this standard booking</span>
                </div>
              )}
            </div>
          </div>

          {/* Operational Timeline & Assignment Audit History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status History Timeline */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#c0c9c2]/50 shadow-xs space-y-3">
              <h3 className="font-black text-sm text-[#131b2e] flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-[#003523]" />
                <span>Status Change Timeline</span>
              </h3>
              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#c0c9c2]/40">
                {request.statusHistory.map((sh, idx) => (
                  <div key={idx} className="relative pl-7 space-y-0.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#003523] absolute left-1.5 top-1.5 -translate-x-1/2 ring-4 ring-white" />
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#131b2e]">{sh.status}</span>
                      <span className="text-[10px] text-[#707973]">{sh.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-[#404943]">Updated by: {sh.updatedBy}</div>
                    {sh.note && (
                      <p className="text-[11px] text-[#707973] bg-[#faf8ff] p-1.5 rounded-lg border border-[#c0c9c2]/30 mt-1">
                        "{sh.note}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Assignment History Ledger */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#c0c9c2]/50 shadow-xs space-y-3">
              <h3 className="font-black text-sm text-[#131b2e] flex items-center space-x-1.5">
                <UserCheck className="w-4 h-4 text-[#fe932c]" />
                <span>Assignment & Reassignment Audit</span>
              </h3>

              {request.assignmentHistory.length === 0 ? (
                <div className="p-6 text-center text-[#707973]">
                  No technician has been assigned yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {request.assignmentHistory.map((asg, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#003523]">
                          Assigned To: {asg.assignedTo} ({asg.assigneeType})
                        </span>
                        <span className="text-[10px] text-[#707973] font-mono">{asg.timestamp}</span>
                      </div>

                      <div className="text-[11px] text-[#404943]">
                        <strong>Assigned By:</strong> {asg.assignedBy}
                      </div>

                      {asg.previousAssignee && (
                        <div className="text-[11px] text-[#ba1a1a]">
                          <strong>Previous Assignee:</strong> {asg.previousAssignee}
                        </div>
                      )}

                      {asg.reason && (
                        <div className="text-[11px] text-[#131b2e]">
                          <strong>Reason:</strong> {asg.reason}
                        </div>
                      )}

                      {asg.notes && (
                        <p className="text-[11px] text-[#707973] italic">
                          "{asg.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Internal Operations Notes Thread */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#c0c9c2]/50 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-[#c0c9c2]/30">
              <MessageSquare className="w-4 h-4 text-[#003523]" />
              <h3 className="font-black text-sm text-[#131b2e]">
                Confidential Operations Internal Notes
              </h3>
              <span className="text-[10px] text-[#707973]">(Visible only to Operations Team)</span>
            </div>

            {/* Note List */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {(!request.internalNotes || request.internalNotes.length === 0) ? (
                <p className="text-gray-400 py-3 italic">
                  No internal notes recorded yet. Add notes regarding customer preferences, technician performance, or special toolkit requirements.
                </p>
              ) : (
                request.internalNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/40 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#003523]">{note.author}</span>
                      <span className="text-[#707973] font-mono">{note.timestamp}</span>
                    </div>
                    <p className="text-xs text-[#131b2e] leading-relaxed">{note.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
              <input
                type="text"
                required
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Type internal note for this file (e.g., Gate code is 4421, customer requested invoice via WhatsApp)..."
                className="flex-1 p-2.5 rounded-xl border border-[#c0c9c2] text-xs bg-[#faf8ff] focus:bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save Note</span>
              </button>
            </form>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 border-t border-[#c0c9c2]/40 bg-white flex items-center justify-between">
          <div className="text-[#707973] text-[11px]">
            Operations Supervisor On-Duty: <strong>Harman (Kharar Central)</strong>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#131b2e] hover:bg-black text-white text-xs font-bold shadow-xs"
          >
            Close Dossier
          </button>
        </div>
      </div>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
        >
          <div className="max-w-2xl max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl">
            <img src={selectedPhoto} alt="Full preview" className="w-full h-auto max-h-[80vh] object-contain" />
            <div className="p-3 text-center text-xs font-bold text-[#131b2e] bg-white">
              Click anywhere to close preview
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
