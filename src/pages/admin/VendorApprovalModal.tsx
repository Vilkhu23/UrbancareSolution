import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Vendor, VendorOnboardingPayment } from '../../types';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Building2,
  Calendar,
  FileText,
  AlertCircle,
  Smartphone,
  Wallet,
  AlertTriangle,
  Receipt,
  User,
  Clock,
  Check
} from 'lucide-react';

interface VendorApprovalModalProps {
  vendor: Vendor | null;
  isOpen: boolean;
  onClose: () => void;
  mode?: 'approve' | 'view';
}

export const VendorApprovalModal: React.FC<VendorApprovalModalProps> = ({
  vendor,
  isOpen,
  onClose,
  mode = 'approve'
}) => {
  const {
    approveVendorWithPayment,
    updateVendorPaymentStatus,
    updateVendorStatus,
    authProfile,
    showToast
  } = useApp();

  const isViewOnly = mode === 'view' || (vendor && vendor.status !== 'PENDING_VERIFICATION');

  // Form states
  const [method, setMethod] = useState<'CASH' | 'ONLINE' | 'CHEQUE'>('ONLINE');
  const [amount, setAmount] = useState<number>(vendor?.plan.price || 1499);
  const [paidAt, setPaidAt] = useState<string>(new Date().toISOString().split('T')[0]);
  const [collectedBy, setCollectedBy] = useState<string>(
    authProfile?.full_name || 'Harman (Ops Lead)'
  );

  // Cash fields
  const [receiptNumber, setReceiptNumber] = useState<string>(
    `RCP-${Date.now().toString().slice(-6)}`
  );

  // Online fields
  const [onlineChannel, setOnlineChannel] = useState<string>('UPI');
  const [onlineTxnRef, setOnlineTxnRef] = useState<string>('');

  // Cheque fields
  const [chequeNumber, setChequeNumber] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [chequeDate, setChequeDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [chequeClearingStatus, setChequeClearingStatus] = useState<'CLEARED' | 'PENDING_CLEARANCE'>('CLEARED');

  // Common notes
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync state if vendor changes
  React.useEffect(() => {
    if (vendor) {
      setAmount(vendor.plan.price || 1499);
      if (vendor.onboardingPayment) {
        setMethod(vendor.onboardingPayment.method);
        setAmount(vendor.onboardingPayment.amount);
        setPaidAt(vendor.onboardingPayment.paidAt);
        setCollectedBy(vendor.onboardingPayment.collectedBy);
        setNotes(vendor.onboardingPayment.notes || '');
        if (vendor.onboardingPayment.method === 'CASH') {
          setReceiptNumber(vendor.onboardingPayment.receiptNumber || vendor.onboardingPayment.transactionRef);
        } else if (vendor.onboardingPayment.method === 'ONLINE') {
          setOnlineTxnRef(vendor.onboardingPayment.transactionRef);
        } else if (vendor.onboardingPayment.method === 'CHEQUE') {
          setChequeNumber(vendor.onboardingPayment.transactionRef);
          setBankName(vendor.onboardingPayment.bankName || '');
          setChequeDate(vendor.onboardingPayment.chequeDate || new Date().toISOString().split('T')[0]);
          setChequeClearingStatus(vendor.onboardingPayment.chequeClearingStatus || 'CLEARED');
        }
      }
    }
  }, [vendor]);

  if (!isOpen || !vendor) return null;

  const validateForm = (): boolean => {
    if (!amount || amount <= 0) {
      setValidationError('Please enter a valid positive payment amount.');
      return false;
    }
    if (!collectedBy.trim()) {
      setValidationError('Supervisor / verifier name is required.');
      return false;
    }

    if (method === 'CASH') {
      if (!receiptNumber.trim()) {
        setValidationError('Cash collection requires a Receipt or Voucher Number.');
        return false;
      }
    } else if (method === 'ONLINE') {
      if (!onlineTxnRef.trim()) {
        setValidationError('Online payment requires a valid UTR, UPI Reference, or Gateway Transaction ID.');
        return false;
      }
      if (onlineTxnRef.trim().length < 4) {
        setValidationError('Transaction reference appears too short. Please provide the full reference.');
        return false;
      }
    } else if (method === 'CHEQUE') {
      if (!chequeNumber.trim()) {
        setValidationError('Cheque payment requires a 6-digit Cheque Number.');
        return false;
      }
      if (!bankName.trim()) {
        setValidationError('Please specify the issuing Bank Name and Branch.');
        return false;
      }
      if (!chequeDate) {
        setValidationError('Please specify the date written on the cheque leaf.');
        return false;
      }
    }

    setValidationError(null);
    return true;
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const transactionRef =
        method === 'CASH'
          ? receiptNumber.trim()
          : method === 'ONLINE'
          ? `${onlineChannel}-${onlineTxnRef.trim()}`
          : chequeNumber.trim();

      const paymentDetails: VendorOnboardingPayment = {
        method,
        amount: Number(amount),
        transactionRef,
        bankName: method === 'CHEQUE' ? bankName.trim() : undefined,
        chequeDate: method === 'CHEQUE' ? chequeDate : undefined,
        chequeClearingStatus: method === 'CHEQUE' ? chequeClearingStatus : undefined,
        paidAt,
        collectedBy: collectedBy.trim(),
        receiptNumber: method === 'CASH' ? receiptNumber.trim() : undefined,
        notes: notes.trim() ? notes.trim() : undefined
      };

      const success = await approveVendorWithPayment(vendor.id, paymentDetails);
      if (success) {
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve vendor with payment.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkChequeCleared = async () => {
    setIsSubmitting(true);
    try {
      await updateVendorPaymentStatus(vendor.id, 'CLEARED');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = () => {
    if (window.confirm(`Are you sure you want to reject the application for ${vendor.businessName}?`)) {
      updateVendorStatus(vendor.id, 'REJECTED');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-[#c0c9c2]/50 overflow-hidden my-6 animate-scaleUp">
        {/* Header */}
        <div className="p-5 border-b border-[#c0c9c2]/30 bg-[#003523] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#fe932c] text-[#002114] flex items-center justify-center font-black shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                {isViewOnly ? 'Vendor Onboarding Payment Receipt' : 'Vendor Approval & Payment Workflow'}
              </h3>
              <p className="text-[11px] text-emerald-200">
                {isViewOnly
                  ? 'Verified financial audit record for trade partner subscription'
                  : 'Record plan payment method (Cash / Online / Cheque) to approve & activate partner'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vendor Partner Overview Summary Banner */}
        <div className="p-4 bg-[#faf8ff] border-b border-[#c0c9c2]/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-[#131b2e] text-sm">{vendor.businessName}</span>
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                    vendor.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {vendor.status === 'PENDING_VERIFICATION' ? 'Awaiting Payment' : vendor.status}
                </span>
              </div>
              <div className="text-xs text-[#707973] mt-0.5 flex flex-wrap items-center gap-x-3">
                <span>Proprietor: <strong className="text-[#131b2e]">{vendor.ownerName}</strong></span>
                <span>Mobile: <strong className="text-[#003523]">{vendor.mobile}</strong></span>
                <span>Category: <strong className="text-[#131b2e]">{vendor.categories.join(', ')}</strong></span>
              </div>
            </div>

            {/* Plan Quota Pill */}
            <div className="sm:text-right p-2 rounded-xl bg-white border border-[#c0c9c2]/50 shrink-0">
              <span className="text-[10px] text-[#707973] uppercase font-bold block">Assigned Plan</span>
              <span className="text-xs font-black text-[#003523] block">
                {vendor.plan.name} (₹{vendor.plan.price})
              </span>
              <span className="text-[10px] text-[#707973] font-semibold">
                {vendor.plan.totalOpportunities} Starter Leads Included
              </span>
            </div>
          </div>
        </div>

        {/* View Only Mode: Render Complete Receipt Information */}
        {isViewOnly && vendor.onboardingPayment ? (
          <div className="p-6 space-y-5 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Receipt className="w-5 h-5 text-emerald-700" />
                  <span className="font-extrabold text-sm text-emerald-950">
                    Payment Verified & Onboarded
                  </span>
                </div>
                <span className="text-base font-black text-[#003523] font-mono">
                  ₹{vendor.onboardingPayment.amount}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#707973] text-[10px] block font-bold uppercase">Payment Channel</span>
                  <div className="font-black text-[#131b2e] flex items-center space-x-1.5 mt-0.5">
                    {vendor.onboardingPayment.method === 'CASH' && <Wallet className="w-4 h-4 text-emerald-700" />}
                    {vendor.onboardingPayment.method === 'ONLINE' && <Smartphone className="w-4 h-4 text-blue-700" />}
                    {vendor.onboardingPayment.method === 'CHEQUE' && <Building2 className="w-4 h-4 text-purple-700" />}
                    <span>{vendor.onboardingPayment.method}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[#707973] text-[10px] block font-bold uppercase">Reference / Identifier</span>
                  <span className="font-mono font-black text-sm text-[#003523]">
                    {vendor.onboardingPayment.transactionRef}
                  </span>
                </div>

                {vendor.onboardingPayment.method === 'CHEQUE' && (
                  <>
                    <div>
                      <span className="text-[#707973] text-[10px] block font-bold uppercase">Issuing Bank</span>
                      <span className="font-bold text-[#131b2e]">
                        {vendor.onboardingPayment.bankName || 'Not recorded'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#707973] text-[10px] block font-bold uppercase">Cheque Clearing Status</span>
                      <span
                        className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded-full mt-0.5 ${
                          vendor.onboardingPayment.chequeClearingStatus === 'PENDING_CLEARANCE'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        {vendor.onboardingPayment.chequeClearingStatus === 'PENDING_CLEARANCE'
                          ? '⏳ PENDING CLEARANCE'
                          : '✓ CLEARED & RECONCILED'}
                      </span>
                    </div>
                  </>
                )}

                <div>
                  <span className="text-[#707973] text-[10px] block font-bold uppercase">Payment Date</span>
                  <span className="font-bold text-[#131b2e]">{vendor.onboardingPayment.paidAt}</span>
                </div>

                <div>
                  <span className="text-[#707973] text-[10px] block font-bold uppercase">Reconciled / Collected By</span>
                  <span className="font-bold text-[#131b2e]">{vendor.onboardingPayment.collectedBy}</span>
                </div>
              </div>

              {vendor.onboardingPayment.notes && (
                <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-gray-700">
                  <span className="font-bold block text-[#131b2e]">Audit Remarks:</span>
                  <p className="italic">{vendor.onboardingPayment.notes}</p>
                </div>
              )}
            </div>

            {/* If Cheque is still pending clearance, provide button to clear */}
            {vendor.onboardingPayment.method === 'CHEQUE' &&
              vendor.onboardingPayment.chequeClearingStatus === 'PENDING_CLEARANCE' && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between">
                  <div className="text-amber-900 text-xs">
                    <span className="font-bold block">Cheque Clearance Action</span>
                    <span className="text-[11px] text-amber-800">
                      Cheque #{vendor.onboardingPayment.transactionRef} awaiting bank credit notification.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleMarkChequeCleared}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center space-x-1 shadow-xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Updating...' : 'Mark Cleared'}</span>
                  </button>
                </div>
              )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#131b2e] font-bold transition-colors cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        ) : (
          /* Approval & Collection Workflow Form */
          <form onSubmit={handleApprove} className="p-6 space-y-5 text-xs">
            {/* Step 1: Select Payment Method */}
            <div>
              <label className="block font-black text-sm text-[#131b2e] mb-2">
                1. Select Verified Onboarding Payment Method <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Option 1: Online */}
                <button
                  type="button"
                  onClick={() => setMethod('ONLINE')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    method === 'ONLINE'
                      ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/30'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    {method === 'ONLINE' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-[#131b2e] block">Online / UPI</span>
                    <span className="text-[10px] text-gray-500">Google Pay, Paytm, NEFT / IMPS</span>
                  </div>
                </button>

                {/* Option 2: Cash */}
                <button
                  type="button"
                  onClick={() => setMethod('CASH')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    method === 'CASH'
                      ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/30'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                      <Wallet className="w-4 h-4" />
                    </div>
                    {method === 'CASH' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-[#131b2e] block">Cash at Hub</span>
                    <span className="text-[10px] text-gray-500">Handed over at Kharar center</span>
                  </div>
                </button>

                {/* Option 3: Cheque */}
                <button
                  type="button"
                  onClick={() => setMethod('CHEQUE')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    method === 'CHEQUE'
                      ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-500/30'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                      <Building2 className="w-4 h-4" />
                    </div>
                    {method === 'CHEQUE' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-[#131b2e] block">Bank Cheque</span>
                    <span className="text-[10px] text-gray-500">Physical bank cheque deposit</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 2: Payment Parameters */}
            <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200 space-y-3.5">
              <span className="text-xs font-bold text-[#131b2e] block border-b border-gray-200 pb-2">
                2. Transaction Details & Financial Reconciliation
              </span>

              {/* Amount and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#131b2e] mb-1">
                    Plan Amount Collected (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-mono font-bold bg-white focus:border-[#003523] focus:ring-1 focus:ring-[#003523] focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5 block">
                    Expected plan price: ₹{vendor.plan.price}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-[#131b2e] mb-1">
                    Collection / Settlement Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paidAt}
                    onChange={(e) => setPaidAt(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs bg-white font-semibold focus:border-[#003523] focus:ring-1 focus:ring-[#003523] focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Details: Method Specific */}
              {method === 'ONLINE' && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#131b2e] mb-1">Online Mode</label>
                      <select
                        value={onlineChannel}
                        onChange={(e) => setOnlineChannel(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-semibold bg-white"
                      >
                        <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                        <option value="IMPS">IMPS Instant Bank Transfer</option>
                        <option value="NEFT">NEFT / RTGS</option>
                        <option value="CARD">Debit / Credit Card (POS / Gateway)</option>
                        <option value="GATEWAY">UrbanCare Official Payment Gateway</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[#131b2e] mb-1">
                        UTR / Transaction ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 428901849102 or UTR-HDFC-99"
                        value={onlineTxnRef}
                        onChange={(e) => setOnlineTxnRef(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-mono font-bold bg-white uppercase placeholder:normal-case placeholder:font-normal"
                      />
                    </div>
                  </div>
                </div>
              )}

              {method === 'CASH' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block font-bold text-[#131b2e] mb-1">
                      Cash Receipt / Voucher Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. RCP-2026-0842"
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-mono font-bold bg-white"
                    />
                    <span className="text-[10px] text-gray-500 mt-0.5 block">
                      Physical receipt number issued to partner from Kharar center book.
                    </span>
                  </div>
                </div>
              )}

              {method === 'CHEQUE' && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#131b2e] mb-1">
                        Cheque Number (6 Digits) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        placeholder="e.g. 000412"
                        value={chequeNumber}
                        onChange={(e) => setChequeNumber(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-mono font-bold bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#131b2e] mb-1">
                        Issuing Bank & Branch <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. HDFC Bank, Kharar"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-gray-300 text-xs bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#131b2e] mb-1">
                        Date on Cheque Leaf <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={chequeDate}
                        onChange={(e) => setChequeDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-gray-300 text-xs bg-white font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#131b2e] mb-1">Cheque Clearance State</label>
                      <select
                        value={chequeClearingStatus}
                        onChange={(e) => setChequeClearingStatus(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-semibold bg-white"
                      >
                        <option value="CLEARED">Cleared / Deposited & Confirmed</option>
                        <option value="PENDING_CLEARANCE">Pending Clearance (In Transit / Clearing)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Collector & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-[#131b2e] mb-1">
                    Supervisor / Reconciled By <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={collectedBy}
                    onChange={(e) => setCollectedBy(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs bg-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#131b2e] mb-1">Audit Notes / Comments (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Verified by Ops Lead, KYC submitted"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Validation Error Banner */}
            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center space-x-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-xs">{validationError}</span>
              </div>
            )}

            {/* Mandatory policy assurance */}
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-start space-x-2 text-[11px]">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <strong>Audit Compliance:</strong> Partner approval activates the quota of{' '}
                <strong>{vendor.plan.totalOpportunities} dispatch leads</strong>. Every approval must have a
                verified payment receipt to prevent unauthorized access.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#c0c9c2]/30">
              <button
                type="button"
                onClick={handleReject}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-bold transition-colors cursor-pointer"
              >
                Reject Application
              </button>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-[#131b2e] font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-extrabold shadow-sm flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#fe932c]" />
                  <span>{isSubmitting ? 'Verifying & Activating...' : 'Verify Payment & Activate'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
