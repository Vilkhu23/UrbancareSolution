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
  ArrowRight
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

  const [customerName, setCustomerName] = useState(currentUser?.name || 'Amanjot Sandhu');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '+91 98721 99120');
  const [address, setAddress] = useState(currentUser?.address || `Villa 42, ${currentLocality}`);
  const [landmark, setLandmark] = useState('Near Sector Main Gate');
  const [preferredDate, setPreferredDate] = useState('Today');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('4:00 PM - 6:00 PM');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.name);
      setCustomerPhone(currentUser.phone);
      if (currentUser.address) setAddress(currentUser.address);
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
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-[#c0c9c2]/40 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#c0c9c2]/40 bg-[#faf8ff] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ReceiptText className="w-5 h-5 text-[#003523]" />
            <h3 className="text-base font-bold text-[#131b2e]">Your Service Basket</h3>
            <span className="text-xs bg-[#e2e7ff] text-[#003523] px-2 py-0.5 rounded-full font-bold">
              {cartTotal.itemCount} {cartTotal.itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            onClick={() => setIsCartDrawerOpen(false)}
            className="p-1 rounded-lg text-[#707973] hover:text-[#131b2e] hover:bg-[#eaedff]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="py-16 text-center text-[#707973] space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#f2f3ff] text-[#003523] flex items-center justify-center mx-auto">
                <ReceiptText className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-[#131b2e]">Your basket is empty</p>
              <p className="text-xs max-w-xs mx-auto">
                Select an electrical, plumbing, or AC service from our Kharar catalogue to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#404943] uppercase tracking-wider block">
                  1. Selected Services & Packages
                </label>
                <span className="text-xs text-[#003523] font-semibold">{currentLocality}</span>
              </div>

              {cart.map((item) => (
                <div
                  key={item.serviceId}
                  className="p-3.5 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/60 flex items-center justify-between"
                >
                  <div className="flex-1 pr-2">
                    <div className="text-xs font-bold text-[#131b2e]">{item.serviceName}</div>
                    <div className="text-[11px] text-[#707973]">
                      {item.price_type === 'QUOTE_REQUIRED' || item.price === 0 ? (
                        <span className="text-[#003523] font-semibold">Free On-Site Quote</span>
                      ) : (
                        `₹${item.price} per unit ${item.isPackage ? '(Combo Care)' : ''}`
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#003523]">
                      {item.price_type === 'QUOTE_REQUIRED' || item.price === 0
                        ? 'Quote Basis'
                        : `₹${item.price * item.quantity}`}
                    </span>
                    <div className="flex items-center bg-white border border-[#c0c9c2]/60 rounded-lg p-0.5">
                      <button
                        onClick={() => updateCartQuantity(item.serviceId, -1)}
                        className="w-5 h-5 flex items-center justify-center text-xs font-bold text-[#131b2e] hover:bg-[#f2f3ff] rounded"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold px-1.5">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.serviceId, 1)}
                        className="w-5 h-5 flex items-center justify-center text-xs font-bold text-[#131b2e] hover:bg-[#f2f3ff] rounded"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.serviceId)}
                      className="p-1 text-[#707973] hover:text-[#ba1a1a]"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
                <label className="text-xs font-bold text-[#404943] uppercase tracking-wider block">
                  2. Contact & Doorstep Details
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-[#707973]">Full Name</span>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full mt-1 p-2 rounded-lg border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#707973]">Phone (+91)</span>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full mt-1 p-2 rounded-lg border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                    />
                  </div>
                </div>
              </div>

              {/* Service Address in Tricity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#707973]">Doorstep Address in {currentLocality}</span>
                </div>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#c0c9c2] text-xs font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
                  placeholder="House / Flat / Street address"
                />
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full p-2 rounded-lg border border-[#c0c9c2] text-xs placeholder:text-gray-400"
                  placeholder="Nearest Landmark / Society Gate (e.g. Near Desu Majra flyover)"
                />
              </div>

              {/* Date & Time Slot (Easy Touch Pill Buttons) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#404943] uppercase tracking-wider block">
                  3. Preferred Date & Time Window
                </label>
                
                {/* Date Pills */}
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {dateOptions.map((date) => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setPreferredDate(date)}
                      className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all text-center ${
                        preferredDate === date
                          ? 'bg-[#003523] text-white border-[#003523]'
                          : 'bg-white text-[#404943] border-[#c0c9c2]/60 hover:border-[#003523]'
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
                      className={`py-2 px-2 rounded-lg text-[11px] font-bold border transition-all text-center ${
                        preferredTimeSlot === slot
                          ? 'bg-[#003523] text-white border-[#003523]'
                          : 'bg-white text-[#404943] border-[#c0c9c2]/60 hover:border-[#003523]'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="text-[11px] text-[#707973] block mb-1">
                  Technician Instructions / Problem Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 rounded-lg border border-[#c0c9c2] text-xs"
                  placeholder="e.g. Call before reaching, please bring extension board"
                />
              </div>

              {/* Transparent Bill Breakdown */}
              <div className="p-3.5 rounded-xl bg-[#faf8ff] border border-[#c0c9c2]/60 space-y-2 text-xs">
                <div className="flex justify-between text-[#404943]">
                  <span>Item Subtotal</span>
                  <span className="font-semibold">₹{cartTotal.itemSubtotal}</span>
                </div>
                <div className="flex justify-between text-[#404943]">
                  <span>Doorstep Inspection & Visit Fee</span>
                  <span className="font-semibold">
                    {cartTotal.visitFee === 0 ? (
                      <span className="text-[#003523] font-bold">FREE (Waived)</span>
                    ) : (
                      `₹${cartTotal.visitFee}`
                    )}
                  </span>
                </div>
                {cartTotal.taxAmount > 0 && (
                  <div className="flex justify-between text-[#404943]">
                    <span>Configured Tax ({cartTotal.taxPercent}% GST)</span>
                    <span className="font-semibold">₹{cartTotal.taxAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#404943]">
                  <span>UrbanCare Solution 30-Day Guarantee</span>
                  <span className="text-[#003523] font-bold">Included Free</span>
                </div>
                
                <div className="pt-2 border-t border-[#c0c9c2]/50 flex justify-between text-sm font-extrabold text-[#131b2e]">
                  <span>Total Payable at Completion</span>
                  <span className="text-[#003523] text-base">₹{cartTotal.total}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#c0edd3]/30 border border-[#b6efd1] text-[11px] text-[#002114] space-y-0.5">
                  <div className="font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#003523]" />
                    <span>Zero Advance Payment Required</span>
                  </div>
                  <p className="text-[#404943]">
                    Pay directly via UPI or Cash after you test and inspect the work. Our Kharar dispatch supervisor verifies the invoice.
                  </p>
                </div>
              </div>

              {/* DPDP Act 2023 Privacy Shield Reassurance */}
              <div className="p-2.5 rounded-xl bg-[#c0edd3]/25 border border-[#b6efd1] flex items-center justify-between text-[11px] text-[#002114]">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#003523] shrink-0" />
                  <span>
                    <strong>DPDP Act 2023 Protected:</strong> Purpose-bound dispatch with zero spam.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDPDPNoticeOpen(true)}
                  className="text-[#003523] hover:underline font-bold text-[10px] shrink-0 ml-2"
                >
                  Privacy Notice
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer with Big Obvious Primary CTA */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-[#c0c9c2]/40 bg-[#faf8ff]">
            <button
              form="checkout-form"
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4 text-[#fe932c]" />
              <span>Confirm Booking · Pay ₹{cartTotal.total} on Completion</span>
            </button>
            <div className="text-center text-[10px] text-[#707973] mt-2">
              Next Step: Kharar dispatch officer reviews address and assigns a verified local technician.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
