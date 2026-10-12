import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  CheckCircle2,
  Clock,
  Phone,
  UserCheck,
  ShieldAlert,
  Star,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const OrderTrackerModal: React.FC = () => {
  const {
    activeTrackingRequestId,
    setActiveTrackingRequestId,
    requests,
    submitReview
  } = useApp();

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  if (!activeTrackingRequestId) return null;

  const order = requests.find((r) => r.id === activeTrackingRequestId);
  if (!order) return null;

  const pipeline = [
    { key: 'NEW', label: '1. Request Received', desc: 'Logged into Kharar central operations' },
    { key: 'UNDER REVIEW', label: '2. Under Operations Review', desc: 'Address & scope verified by dispatch supervisor' },
    { key: 'READY FOR ASSIGNMENT', label: '3. Ready for Manual Assignment', desc: 'Queued for certified local technician roster' },
    { key: 'ASSIGNED', label: '4. Assigned to Verified Artisan', desc: 'Technician locked & tool kit verified' },
    { key: 'IN PROGRESS', label: '5. In Progress (At Home)', desc: 'Artisan on-site executing diagnostics & repair' },
    { key: 'COMPLETED', label: '6. Completed & Tested', desc: 'Work done. Transparent invoice ready' }
  ];

  const statusHierarchy: Record<string, number> = {
    'NEW': 0,
    'UNDER REVIEW': 1,
    'READY FOR ASSIGNMENT': 2,
    'ASSIGNED': 3,
    'ACCEPTED': 3,
    'SCHEDULED': 3,
    'IN PROGRESS': 4,
    'COMPLETED': 5,
    'CUSTOMER CONFIRMED': 5,
    'CLOSED': 5
  };

  const currentLevel = statusHierarchy[order.status] ?? 0;

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReview(order.id, reviewRating, reviewText);
    setShowReviewForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#c0c9c2]/50 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#c0c9c2]/40 bg-[#003523] text-white flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight">Order Lifecycle Tracker</span>
              <span className="bg-[#fe932c] text-[#002114] text-xs font-mono font-bold px-2 py-0.5 rounded-full">
                #{order.id}
              </span>
            </div>
            <p className="text-xs text-[#b6efd1] mt-0.5">
              {order.locality} · Slot: {order.preferredTimeSlot}
            </p>
          </div>
          <button
            onClick={() => setActiveTrackingRequestId(null)}
            className="p-1 rounded-lg text-gray-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Active Status Badge Banner */}
          <div className="p-3.5 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/50 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#707973] uppercase font-bold tracking-wider block">
                Current Operational State
              </span>
              <span className="text-sm font-extrabold text-[#003523]">{order.status}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#707973] block">Total Amount</span>
              <span className="text-sm font-bold text-[#131b2e]">
                {order.hasQuoteRequired ? `₹${order.total} (Quote Basis)` : `₹${order.total}`}
              </span>
            </div>
          </div>

          {/* Assigned Technician Card (if assigned) */}
          {order.assignedTo ? (
            <div className="p-3.5 rounded-xl bg-[#c0edd3]/30 border border-[#b6efd1] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-[#003523]">
                  <UserCheck className="w-4 h-4 text-[#003523]" />
                  <span>Assigned Verified Artisan</span>
                </div>
                <span className="text-[10px] font-bold text-[#002114] bg-[#fe932c] px-2 py-0.5 rounded-full">
                  {order.assignedTo.type === 'EMPLOYEE' ? 'Direct Staff' : 'Verified Partner'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-sm font-bold text-[#131b2e]">{order.assignedTo.name}</div>
                  <div className="text-xs text-[#404943]">
                    {order.assignedTo.rating} · Hub: {order.assignedTo.hub}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={`tel:${order.assignedTo.phone}`}
                    className="px-3 py-1.5 rounded-lg bg-[#003523] text-white text-xs font-bold flex items-center space-x-1.5 hover:bg-[#144d37]"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Artisan</span>
                  </a>
                  <a
                    href="tel:+918284018909"
                    className="px-2.5 py-1.5 rounded-lg border border-[#c0c9c2] text-[#131b2e] text-xs font-semibold hover:bg-white"
                    title="Call Kharar Operations Desk"
                  >
                    Ops Desk
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[#f2f3ff] border border-[#c0c9c2]/50 text-xs text-[#404943] flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-[#904d00] shrink-0" />
                <span>
                  <strong>Operations Review in Progress:</strong> Our Kharar dispatcher is assigning the best artisan for your slot.
                </span>
              </div>
              <a
                href="tel:+918284018909"
                className="shrink-0 text-xs font-bold text-[#003523] underline"
              >
                Help Desk
              </a>
            </div>
          )}

          {/* Lifecycle Pipeline */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#404943] uppercase tracking-wider block">
              Operations Control Timeline
            </label>
            <div className="space-y-3">
              {pipeline.map((step, idx) => {
                const isPassed = idx <= currentLevel;
                const isCurrent = idx === currentLevel;

                return (
                  <div
                    key={step.key}
                    className={`flex items-start space-x-3 transition-opacity ${
                      isPassed ? 'opacity-100' : 'opacity-40'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isPassed
                          ? 'bg-[#003523] text-white'
                          : 'bg-[#eaedff] text-[#404943]'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold ${isCurrent ? 'text-[#003523]' : 'text-[#131b2e]'}`}>
                          {step.label}
                        </span>
                        {isCurrent && (
                          <span className="w-2 h-2 rounded-full bg-[#fe932c] animate-pulse"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#707973] mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Requested Items Summary */}
          <div className="border-t border-[#c0c9c2]/40 pt-3 space-y-1.5 text-xs">
            <span className="font-bold text-[#131b2e] block">Service Order Items</span>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-[#404943]">
                <span>
                  {item.serviceName} (×{item.quantity})
                </span>
                <span className="font-semibold">
                  {item.price_type === 'QUOTE_REQUIRED' || item.price === 0 ? (
                    <span className="text-[#003523] font-semibold">Quote on-site</span>
                  ) : (
                    `₹${item.price * item.quantity}`
                  )}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-[#707973] pt-1">
              <span>Doorstep Visit / Inspection</span>
              <span>{order.visitFee === 0 ? <strong className="text-[#003523]">FREE</strong> : `₹${order.visitFee}`}</span>
            </div>
            {order.taxAmount !== undefined && order.taxAmount > 0 && (
              <div className="flex justify-between text-[#707973]">
                <span>Configured Tax (GST)</span>
                <span>₹{order.taxAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-[#131b2e] font-bold pt-1.5 border-t border-[#c0c9c2]/30">
              <span>Total Payable</span>
              <span className="text-[#003523]">₹{order.total}</span>
            </div>
            {order.notes && (
              <div className="p-2 rounded bg-[#f2f3ff] text-[11px] text-[#404943] mt-2">
                <strong>Notes:</strong> {order.notes}
              </div>
            )}
          </div>

          {/* Review Trigger (if completed) */}
          {(order.status === 'COMPLETED' || order.status === 'CUSTOMER CONFIRMED') && (
            <div className="border-t border-[#c0c9c2]/40 pt-3">
              {order.customerRating ? (
                <div className="p-3 rounded-xl bg-[#c0edd3]/20 border border-[#b6efd1] text-xs">
                  <div className="font-bold text-[#003523] flex items-center space-x-1">
                    <Star className="w-3.5 h-3.5 fill-[#fe932c] text-[#fe932c]" />
                    <span>Your Review ({order.customerRating}/5 Stars)</span>
                  </div>
                  <p className="text-[#404943] mt-1 text-[11px]">"{order.customerFeedback}"</p>
                </div>
              ) : showReviewForm ? (
                <form onSubmit={handleReviewSubmit} className="p-3 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/50 space-y-3">
                  <span className="text-xs font-bold text-[#131b2e] block">
                    Rate Your Assigned Artisan
                  </span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="p-1"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= reviewRating
                              ? 'text-[#fe932c] fill-[#fe932c]'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience (promptness, pricing transparency, cleanliness)"
                    className="w-full p-2 rounded-lg border border-[#c0c9c2] text-xs"
                    required
                  />
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-3 py-1.5 rounded-lg border border-[#c0c9c2] text-xs text-[#707973]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-[#003523] text-white text-xs font-bold hover:bg-[#144d37]"
                    >
                      Submit Review
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="w-full py-2.5 rounded-xl bg-[#fe932c] text-[#002114] font-bold text-xs hover:bg-[#e07f24] transition-all flex items-center justify-center space-x-1.5"
                >
                  <Star className="w-4 h-4" />
                  <span>Leave Feedback for Artisan</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#faf8ff] border-t border-[#c0c9c2]/40 flex justify-between items-center text-xs">
          <span className="text-[#707973]">Live state synchronized</span>
          <button
            onClick={() => setActiveTrackingRequestId(null)}
            className="px-4 py-1.5 bg-[#003523] text-white rounded-lg font-bold hover:bg-[#144d37]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
