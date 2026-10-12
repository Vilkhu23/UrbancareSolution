import React from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  Clock,
  Calendar,
  AlertCircle,
  Camera,
  FileText,
  ShieldCheck,
  CheckCircle2,
  HardHat,
  MessageSquare,
  Navigation,
  Eye,
  Wrench
} from 'lucide-react';
import { ServiceRequest } from '../../types';

interface EmployeeJobDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ServiceRequest | null;
  onAccept: (requestId: string) => void;
  onReject: (request: ServiceRequest) => void;
  onMarkArrived: (requestId: string) => void;
  onStartWork: (requestId: string) => void;
  onCompleteWork: (request: ServiceRequest) => void;
  onPhotoZoom?: (url: string) => void;
}

export const EmployeeJobDetailModal: React.FC<EmployeeJobDetailModalProps> = ({
  isOpen,
  onClose,
  request,
  onAccept,
  onReject,
  onMarkArrived,
  onStartWork,
  onCompleteWork,
  onPhotoZoom
}) => {
  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-200 my-8">
        {/* Top Header */}
        <div className="p-6 bg-[#003523] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#fe932c] text-[#002114] flex items-center justify-center font-black text-xl shadow-md">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold">Service Order #{request.id}</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#b6efd1] text-[10px] font-bold border border-emerald-400/30">
                  {request.status}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                {request.items.map((i) => i.serviceName).join(', ')} · Total: ₹{request.total}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Customer & Direct Contact */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold text-gray-900 text-sm">
                <User className="w-4 h-4 text-[#003523]" />
                <span>Customer: {request.customerName}</span>
              </div>
              <span className="text-xs font-black text-[#003523]">₹{request.total}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href={`tel:${request.customerPhone}`}
                className="px-3 py-1.5 rounded-xl bg-[#003523] text-white text-xs font-bold hover:bg-[#144d37] transition-colors flex items-center space-x-1.5 shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call {request.customerPhone}</span>
              </a>

              <a
                href={`https://wa.me/${request.customerPhone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center space-x-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Section 2: Address & Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                Doorstep Address & Sector
              </span>
              <div className="flex items-start space-x-2 text-xs text-gray-800">
                <MapPin className="w-4 h-4 text-[#003523] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-gray-900">{request.address}</div>
                  <div className="text-gray-500 mt-0.5">{request.locality}</div>
                  {request.landmark && (
                    <div className="text-emerald-800 font-medium text-[11px] mt-1">
                      Landmark: {request.landmark}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                Scheduled Date & Window
              </span>
              <div className="space-y-1.5 text-xs text-gray-800">
                <div className="flex items-center space-x-2 font-bold text-gray-900">
                  <Calendar className="w-4 h-4 text-[#003523]" />
                  <span>{request.preferredDate}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>Slot: {request.preferredTimeSlot}</span>
                </div>
                {request.confirmedScheduleSlot && (
                  <div className="text-[#003523] font-bold text-[11px]">
                    Confirmed Arrival: {request.confirmedScheduleSlot}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Operations Instructions */}
          {request.supervisorInstructions && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Operations Supervisor Dispatch Instructions</span>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed font-medium">
                {request.supervisorInstructions}
              </p>
            </div>
          )}

          {/* Section 4: Problem Scope & Customer Notes */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Reported Breakdown / Problem Description
            </span>
            <p className="text-xs text-gray-800 leading-relaxed">
              {request.problemDescription || request.notes || 'Standard service maintenance requested.'}
            </p>
            {request.notes && request.problemDescription && (
              <p className="text-xs text-gray-500 italic pt-1 border-t border-gray-200">
                Customer Note: "{request.notes}"
              </p>
            )}
          </div>

          {/* Section 5: Customer Photos */}
          {request.problemPhotos && request.problemPhotos.length > 0 && (
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-2">
                Attached Breakdown Photos ({request.problemPhotos.length})
              </span>
              <div className="grid grid-cols-3 gap-3">
                {request.problemPhotos.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onPhotoZoom && onPhotoZoom(url)}
                    className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-video group"
                  >
                    <img src={url} alt={`Problem ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
                      <Eye className="w-4 h-4 mr-1" />
                      <span>Zoom</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 6: Materials / Parts info if added */}
          {(request.materialInfo || (request.partsUsed && request.partsUsed.length > 0)) && (
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2 text-xs">
              <span className="font-bold text-blue-900 uppercase text-[10px] tracking-wider block">
                Parts & Material Requisition Details
              </span>
              {request.materialInfo && <p className="text-blue-950">{request.materialInfo}</p>}
              {request.partsUsed && request.partsUsed.length > 0 && (
                <div className="space-y-1 pt-1">
                  {request.partsUsed.map((p, idx) => (
                    <div key={idx} className="flex justify-between font-semibold text-blue-900">
                      <span>{p.name} (×{p.quantity})</span>
                      <span>₹{p.cost}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions Stepper */}
        <div className="p-5 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            {request.status === 'ASSIGNED' && (
              <>
                <button
                  onClick={() => onReject(request)}
                  className="px-4 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    onAccept(request.id);
                    onClose();
                  }}
                  className="px-5 py-2 rounded-xl bg-[#003523] text-white text-xs font-bold hover:bg-[#144d37] transition-all flex items-center space-x-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#b6efd1]" />
                  <span>Accept Job</span>
                </button>
              </>
            )}

            {(request.status === 'ACCEPTED' || request.status === 'SCHEDULED' || request.status === 'IN PROGRESS') && (
              <>
                {request.vendorArrivalStatus !== 'ARRIVED' && (
                  <button
                    onClick={() => {
                      onMarkArrived(request.id);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors flex items-center space-x-1.5 shadow-xs"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Mark Arrived</span>
                  </button>
                )}

                {request.status !== 'IN PROGRESS' && (
                  <button
                    onClick={() => {
                      onStartWork(request.id);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors flex items-center space-x-1.5 shadow-xs"
                  >
                    <HardHat className="w-3.5 h-3.5" />
                    <span>Start Work</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onCompleteWork(request);
                    onClose();
                  }}
                  className="px-5 py-2 rounded-xl bg-[#003523] text-white text-xs font-bold hover:bg-[#144d37] transition-all flex items-center space-x-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#b6efd1]" />
                  <span>Complete Work</span>
                </button>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-white text-xs font-bold transition-colors ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
