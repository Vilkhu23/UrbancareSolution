import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  ReceiptText,
  CreditCard,
  IndianRupee,
  ArrowRight,
  ShoppingBag
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    cart,
    removeFromCart,
    updateCartQuantity,
    cartTotal,
    currentLocality,
    createBookingFromCart,
    setActiveTrackingRequestId,
    currentUser,
    setIsAuthModalOpen,
    setIsDPDPNoticeOpen
  } = useApp();

  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [landmark, setLandmark] = useState('');
  const [preferredDate, setPreferredDate] = useState('Today');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('4:00 PM - 6:00 PM');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.name && !customerName) setCustomerName(currentUser.name);
      if (currentUser.phone && !customerPhone) setCustomerPhone(currentUser.phone);
      if (currentUser.address && !address) setAddress(currentUser.address);
    }
  }, [currentUser]);

  if (!isCartDrawerOpen) return null;

  const dateOptions = ['Today', 'Tomorrow', 'Day After'];
  const timeSlotOptions = [
    '9:00 AM - 11:00 AM',
    '11:00 AM - 1:00 PM',
    '2:00 PM - 4:00 PM',
    '4:00 PM - 6:00 PM',
    '6:00 PM - 8:00 PM'
  ];

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const newBookingId = createBookingFromCart({
      customerName,
      customerPhone,
      locality: currentLocality,
      address,
      landmark,
      preferredDate,
      preferredTimeSlot,
      notes
    });

    setIsCartDrawerOpen(false);
    if (newBookingId) {
      setActiveTrackingRequestId(newBookingId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-fadeIn">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-[#E2E6E4] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#E2E6E4] bg-[#F7F8F7] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ReceiptText className="w-5 h-5 text-[#0D3B2E]" />
            <h3 className="text-base font-bold text-[#202124]">Your Service Basket</h3>
            <span className="text-xs bg-[#E7F3EC] text-[#0D3B2E] px-2 py-0.5 rounded-full font-bold">
              {cartTotal.itemCount} {cartTotal.itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            onClick={() => setIsCartDrawerOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-[#626B73] hover:text-[#202124] hover:bg-gray-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
            aria-label="Close basket"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="py-16 text-center text-[#626B73] space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#E7F3EC] text-[#0D3B2E] flex items-center justify-center mx-auto">
                <ReceiptText className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-[#202124]">Your basket is empty</p>
              <p className="text-xs max-w-xs mx-auto">
                Select an electrical, plumbing, or AC service from our Kharar catalogue to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#202124] uppercase tracking-wider block">
                  1. Selected Services & Packages
                </label>
                <span className="text-xs text-[#0D3B2E] font-semibold">{currentLocality}</span>
              </div>

              {cart.map((item) => (
                <div
                  key={item.serviceId}
                  className="p-3.5 rounded-xl bg-[#F7F8F7] border border-[#E2E6E4] flex items-center justify-between"
                >
                  <div className="flex-1 pr-2">
                    <div className="text-xs font-bold text-[#202124] break-words">{item.serviceName}</div>
                    <div className="text-[11px] text-[#626B73]">
                      {item.price_type === 'QUOTE_REQUIRED' || item.price === 0 ? (
                        <span className="text-[#0D3B2E] font-semibold">Free On-Site Quote</span>
                      ) : (
                        `₹${item.price} per unit ${item.isPackage ? '(Combo Care)' : ''}`
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#0D3B2E]">
                      {item.price_type === 'QUOTE_REQUIRED' || item.price === 0
                        ? 'Quote Basis'
                        : `₹${item.price * item.quantity}`}
                    </span>
                    <div className="flex items-center bg-white border border-[#E2E6E4] rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.serviceId, -1)}
                        className="w-8 h-8 flex items-center justify-center text-xs font-bold text-[#202124] hover:bg-[#F7F8F7] active:bg-[#E7F3EC] rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
                        aria-label={`Decrease quantity of ${item.serviceName}`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold px-2.5 min-w-[20px] text-center" aria-label={`Quantity: ${item.quantity}`}>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.serviceId, 1)}
                        className="w-8 h-8 flex items-center justify-center text-xs font-bold text-[#202124] hover:bg-[#F7F8F7] active:bg-[#E7F3EC] rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
                        aria-label={`Increase quantity of ${item.serviceName}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.serviceId)}
                      className="p-2 text-[#626B73] hover:text-red-700 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                      title="Remove item"
                      aria-label={`Remove ${item.serviceName} from basket`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4 pt-1">
              {/* Customer Contact */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#202124] uppercase tracking-wider block">
                  2. Contact & Doorstep Details
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-[#626B73]">Full Name</span>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Gurpreet Singh"
                      className="w-full mt-1 p-2.5 rounded-lg border border-[#E2E6E4] text-xs font-semibold text-[#202124] placeholder:text-gray-400 focus:border-[#0D3B2E] focus:ring-1 focus:ring-[#0D3B2E]"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#626B73]">Phone (+91)</span>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full mt-1 p-2.5 rounded-lg border border-[#E2E6E4] text-xs font-semibold text-[#202124] placeholder:text-gray-400 focus:border-[#0D3B2E] focus:ring-1 focus:ring-[#0D3B2E]"
                    />
                  </div>
                </div>
              </div>

              {/* Service Address in Kharar / Mohali */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#626B73]">Doorstep Address in {currentLocality}</span>
                </div>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#E2E6E4] text-xs font-semibold text-[#202124] focus:border-[#0D3B2E] focus:ring-1 focus:ring-[#0D3B2E]"
                  placeholder="House / Flat / Street address"
                />
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full p-2 rounded-lg border border-[#E2E6E4] text-xs text-[#202124] placeholder:text-gray-400 focus:border-[#0D3B2E] focus:ring-1 focus:ring-[#0D3B2E]"
                  placeholder="Nearest Landmark / Society Gate (e.g. Near Desu Majra flyover)"
                />
              </div>

              {/* Date & Time Slot (Easy Touch Pill Buttons) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#202124] uppercase tracking-wider block">
                  3. Preferred Date & Time Window
                </label>
                
                {/* Date Pills */}
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {dateOptions.map((date) => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setPreferredDate(date)}
                      className={`h-10 py-2 px-2 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E] ${
                        preferredDate === date
                          ? 'bg-[#0D3B2E] text-white border-[#0D3B2E]'
                          : 'bg-white text-[#202124] border-[#E2E6E4] hover:border-[#0D3B2E]'
                      }`}
                    >
                      {date}
                    </button>
                  ))}
                </div>

                {/* Slot Pills */}
                <div className="grid grid-cols-2 gap-1.5 text-xs pt-1">
                  {timeSlotOptions.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setPreferredTimeSlot(slot)}
                      className={`h-10 py-2 px-2 rounded-lg text-[11px] font-bold border transition-all text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E] ${
                        preferredTimeSlot === slot
                          ? 'bg-[#0D3B2E] text-white border-[#0D3B2E]'
                          : 'bg-white text-[#202124] border-[#E2E6E4] hover:border-[#0D3B2E]'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="text-[11px] text-[#626B73] block mb-1">
                  Technician Instructions / Problem Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 rounded-lg border border-[#E2E6E4] text-xs text-[#202124] focus:border-[#0D3B2E] focus:ring-1 focus:ring-[#0D3B2E]"
                  placeholder="e.g. Call before reaching, please bring extension board"
                />
              </div>

              {/* Transparent Bill Breakdown */}
              <div className="p-3.5 rounded-xl bg-[#F7F8F7] border border-[#E2E6E4] space-y-2 text-xs">
                <div className="flex justify-between text-[#626B73]">
                  <span>Item Subtotal</span>
                  <span className="font-semibold text-[#202124]">₹{cartTotal.itemSubtotal}</span>
                </div>
                <div className="flex justify-between text-[#626B73]">
                  <span>Doorstep Inspection & Visit Fee</span>
                  <span className="font-semibold">
                    {cartTotal.visitFee === 0 ? (
                      <span className="text-[#0D3B2E] font-bold">FREE (Waived)</span>
                    ) : (
                      `₹${cartTotal.visitFee}`
                    )}
                  </span>
                </div>
                {cartTotal.taxAmount > 0 && (
                  <div className="flex justify-between text-[#626B73]">
                    <span>Configured Tax ({cartTotal.taxPercent}% GST)</span>
                    <span className="font-semibold text-[#202124]">₹{cartTotal.taxAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#626B73]">
                  <span>UrbanCare Solution 30-Day Guarantee</span>
                  <span className="text-[#0D3B2E] font-bold">Included Free</span>
                </div>
                
                <div className="pt-2 border-t border-[#E2E6E4] flex justify-between text-sm font-extrabold text-[#202124]">
                  <span>Total Payable at Completion</span>
                  <span className="text-[#0D3B2E] text-base font-black">₹{cartTotal.total}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#E7F3EC] border border-[#0D3B2E]/20 text-[11px] text-[#0D3B2E] space-y-0.5">
                  <div className="font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0D3B2E]" />
                    <span>Zero Advance Payment Required</span>
                  </div>
                  <p className="text-[#626B73]">
                    Pay directly via UPI or Cash after you test and inspect the work. Our Kharar dispatch supervisor verifies the invoice.
                  </p>
                </div>
              </div>

              {/* DPDP Act 2023 Privacy Shield Reassurance */}
              <div className="p-2.5 rounded-xl bg-[#E7F3EC] border border-[#0D3B2E]/20 flex items-center justify-between text-[11px] text-[#0D3B2E]">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0D3B2E] shrink-0" />
                  <span>
                    <strong>DPDP Act 2023 Protected:</strong> Purpose-bound dispatch with zero spam.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDPDPNoticeOpen(true)}
                  className="text-[#0D3B2E] hover:underline font-bold text-[10px] shrink-0 ml-2 cursor-pointer"
                >
                  Privacy Notice
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer with Big Obvious Primary CTA */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-[#E2E6E4] bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              form="checkout-form"
              type="submit"
              className="w-full h-[52px] py-3.5 px-4 rounded-xl bg-[#F79324] hover:bg-[#E2810F] text-[#0D3B2E] font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E]"
            >
              <CheckCircle2 className="w-4 h-4 text-[#0D3B2E]" />
              <span>Confirm Booking · Pay ₹{cartTotal.total} on Completion</span>
            </button>
            <div className="text-center text-[10px] text-[#626B73] mt-2">
              Next Step: Kharar dispatch officer reviews address and assigns a verified local technician.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
