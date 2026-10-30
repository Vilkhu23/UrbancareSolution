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
  AlertCircle,
  MessageCircle
} from 'lucide-react';
import { CustomerOtpDisplay } from './CustomerOtpDisplay';
import { getBookingEnquiryWhatsAppUrl } from '../../utils/whatsapp';

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
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E2E6E4] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#E2E6E4] bg-[#0D3B2E] text-white flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight">Order Lifecycle Tracker</span>
              <span className="bg-[#F79324] text-[#0D3B2E] text-xs font-mono font-bold px-2 py-0.5 rounded-full">
                #{order.id}
              </span>
            </div>
            <p className="text-xs text-[#E7F3EC] mt-0.5">
              {order.locality} · Slot: {order.preferredTimeSlot}
            </p>
          </div>
          <button
            onClick={() => setActiveTrackingRequestId(null)}
            className="p-1 rounded-lg text-gray-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Active Status Badge Banner */}
          <div className="p-3.5 rounded-xl bg-[#F7F8F7] border border-[#E2E6E4] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#626B73] uppercase font-bold tracking-wider block">
                Current Operational State
              </span>
              <span className="text-sm font-extrabold text-[#0D3B2E]">{order.status}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#626B73] block">Total Amount</span>
              <span className="text-sm font-bold text-[#202124]">
                {order.hasQuoteRequired ? `₹${order.total} (Quote Basis)` : `₹${order.total}`}
              </span>
            </div>
          </div>

          {/* Assigned Technician Card (if assigned) */}
          {order.assignedTo ? (
            <div className="p-3.5 rounded-xl bg-[#E7F3EC] border border-[#0D3B2E]/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-[#0D3B2E]">
                  <UserCheck className="w-4 h-4 text-[#0D3B2E]" />
                  <span>Assigned Verified Artisan</span>
                </div>
                <span className="text-[10px] font-bold text-[#0D3B2E] bg-[#F79324] px-2 py-0.5 rounded-full">
                  {order.assignedTo.type === 'EMPLOYEE' ? 'Direct Staff' : 'Verified Partner'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-sm font-bold text-[#202124]">{order.assignedTo.name}</div>
                  <div className="text-xs text-[#626B73]">
                    {order.assignedTo.rating} · Hub: {order.assignedTo.hub}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={`tel:${order.assignedTo.phone}`}
                    className="px-3 py-1.5 rounded-lg bg-[#0D3B2E] text-white text-xs font-bold flex items-center space-x-1.5 hover:bg-[#0A2E24]"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Artisan</span>
                  </a>
                  <a
                    href={getBookingEnquiryWhatsAppUrl(
                      order.id,
                      order.items ? order.items.map((i) => i.serviceName) : [],
                      order.status,
                      order.locality
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg border border-[#25D366]/40 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#0D3B2E] text-xs font-semibold flex items-center space-x-1"
                    title="Chat with Kharar Operations Desk on WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href="tel:+918284018909"
                    className="px-2.5 py-1.5 rounded-lg border border-[#E2E6E4] text-[#202124] text-xs font-semibold hover:bg-white"
                    title="Call Kharar Operations Desk"
                  >
                    Ops Desk
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[#F7F8F7] border border-[#E2E6E4] text-xs text-[#626B73] flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 min-w-0">
                <ShieldAlert className="w-4 h-4 text-[#F79324] shrink-0" />
                <span>
                  <strong>Operations Review in Progress:</strong> Our Kharar dispatcher is assigning the best artisan for your slot.
                </span>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <a
                  href={getBookingEnquiryWhatsAppUrl(
                    order.id,
                    order.items ? order.items.map((i) => i.serviceName) : [],
                    order.status,
                    order.locality
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/40 text-[#0D3B2E] text-xs font-bold inline-flex items-center space-x-1"
                  title="WhatsApp Operations Desk"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href="tel:+918284018909"
                  className="text-xs font-bold text-[#0D3B2E] underline"
                >
                  Call Desk
                </a>
              </div>
            </div>
          )}

          {/* Customer Completion Verification OTP */}
          <CustomerOtpDisplay
            requestId={order.id}
            status={order.status}
            bookingUserId={order.user_id}
            customerPhone={order.customerPhone}
          />

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
                          ? 'bg-[#0D3B2E] text-white'
                          : 'bg-[#E7F3EC] text-[#626B73]'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold ${isCurrent ? 'text-[#0D3B2E]' : 'text-[#202124]'}`}>
                          {step.label}
                        </span>
                        {isCurrent && (
                          <span className="w-2 h-2 rounded-full bg-[#F79324] animate-pulse"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#626B73] mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Requested Items Summary */}
          <div className="border-t border-[#E2E6E4] pt-3 space-y-1.5 text-xs">
            <span className="font-bold text-[#202124] block">Service Order Items</span>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-[#626B73]">
                <span>
                  {item.serviceName} (×{item.quantity})
                </span>
                <span className="font-semibold">
                  {item.price_type === 'QUOTE_REQUIRED' || item.price === 0 ? (
                    <span className="text-[#0D3B2E] font-semibold">Quote on-site</span>
                  ) : (
                    `₹${item.price * item.quantity}`
                  )}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-[#626B73] pt-1">
              <span>Doorstep Visit / Inspection</span>
              <span>{order.visitFee === 0 ? <strong className="text-[#0D3B2E]">FREE</strong> : `₹${order.visitFee}`}</span>
            </div>
            {order.taxAmount !== undefined && order.taxAmount > 0 && (
              <div className="flex justify-between text-[#626B73]">
                <span>Configured Tax (GST)</span>
                <span>₹{order.taxAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-[#202124] font-bold pt-1.5 border-t border-[#E2E6E4]">
              <span>Total Payable</span>
              <span className="text-[#0D3B2E]">₹{order.total}</span>
            </div>
            {order.notes && (
              <div className="p-2 rounded bg-[#F7F8F7] text-[11px] text-[#626B73] mt-2">
                <strong>Notes:</strong> {order.notes}
              </div>
            )}
          </div>

          {/* Review Trigger (if completed) */}
          {(order.status === 'COMPLETED' || order.status === 'CUSTOMER CONFIRMED') && (
            <div className="border-t border-[#E2E6E4] pt-3">
              {order.customerRating ? (
                <div className="p-3 rounded-xl bg-[#E7F3EC] border border-[#0D3B2E]/20 text-xs">
                  <div className="font-bold text-[#0D3B2E] flex items-center space-x-1">
                    <Star className="w-3.5 h-3.5 fill-[#F79324] text-[#F79324]" />
                    <span>Your Review ({order.customerRating}/5 Stars)</span>
                  </div>
                  <p className="text-[#626B73] mt-1 text-[11px]">"{order.customerFeedback}"</p>
                </div>
              ) : showReviewForm ? (
                <form onSubmit={handleReviewSubmit} className="p-3 rounded-xl bg-[#F7F8F7] border border-[#E2E6E4] space-y-3">
                  <span className="text-xs font-bold text-[#202124] block">
                    Rate Your Assigned Artisan
                  </span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= reviewRating
                              ? 'text-[#F79324] fill-[#F79324]'
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
                    className="w-full p-2 rounded-lg border border-[#E2E6E4] text-xs font-semibold text-[#202124] focus:border-[#0D3B2E]"
                    required
                  />
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-3 py-1.5 rounded-lg border border-[#E2E6E4] text-xs text-[#626B73] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-[#0D3B2E] text-white text-xs font-bold hover:bg-[#0A2E24] cursor-pointer"
                    >
                      Submit Review
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="w-full py-2.5 rounded-xl bg-[#F79324] hover:bg-[#E2810F] text-[#0D3B2E] font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs active:scale-98"
                >
                  <Star className="w-4 h-4" />
                  <span>Leave Feedback for Artisan</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#F7F8F7] border-t border-[#E2E6E4] flex justify-between items-center text-xs">
          <a
            href={getBookingEnquiryWhatsAppUrl(
              order.id,
              order.items ? order.items.map((i) => i.serviceName) : [],
              order.status,
              order.locality
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0D3B2E] font-semibold flex items-center space-x-1.5 hover:underline"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
            <span>Need Help? Chat on WhatsApp</span>
          </a>
          <button
            onClick={() => setActiveTrackingRequestId(null)}
            className="px-4 py-1.5 bg-[#0D3B2E] hover:bg-[#0A2E24] text-white rounded-lg font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
