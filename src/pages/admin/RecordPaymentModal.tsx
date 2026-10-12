import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, CheckCircle2, DollarSign, CreditCard } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose }) => {
  const { requests, recordPayment, showToast } = useApp();

  const [requestId, setRequestId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState<number>(499);
  const [mode, setMode] = useState<'UPI' | 'CASH' | 'ONLINE_CARD'>('UPI');
  const [transactionRef, setTransactionRef] = useState(`UPI-${Date.now().toString().slice(-8)}`);
  const [collectedBy, setCollectedBy] = useState('Harman (Ops Lead)');

  if (!isOpen) return null;

  const handleSelectRequest = (id: string) => {
    setRequestId(id);
    const req = requests.find((r) => r.id === id);
    if (req) {
      setCustomerName(req.customerName);
      setAmount(req.total);
      if (req.assignedTo) {
        setCollectedBy(req.assignedTo.name);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordPayment({
      requestId: requestId || 'PB-MANUAL',
      customerName: customerName || 'Direct Customer',
      amount: Number(amount),
      mode,
      transactionRef: transactionRef || `TXN-${Date.now()}`,
      collectedBy,
      status: 'SUCCESS'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#c0c9c2]/50 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#c0c9c2]/40 bg-[#003523] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-[#fe932c]" />
            <h3 className="text-base font-bold">Record Customer Payment</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-[#131b2e] mb-1">
              Link to Service Order (Optional)
            </label>
            <select
              value={requestId}
              onChange={(e) => handleSelectRequest(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs bg-white font-semibold"
            >
              <option value="">-- Direct Payment (No order linked) --</option>
              {requests.map((r) => (
                <option key={r.id} value={r.id}>
                  #{r.id} · {r.customerName} ({r.locality}) - ₹{r.total}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#131b2e] mb-1">Customer Name</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#131b2e] mb-1">Amount (₹)</label>
              <input
                type="number"
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-[#131b2e] mb-1">Payment Channel</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs font-semibold bg-white"
              >
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="CASH">Doorstep Cash</option>
                <option value="ONLINE_CARD">Online Debit/Credit Card</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#131b2e] mb-1">Transaction Ref / Receipt No.</label>
            <input
              type="text"
              required
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-[#131b2e] mb-1">Collected By</label>
            <input
              type="text"
              required
              value={collectedBy}
              onChange={(e) => setCollectedBy(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#c0c9c2] text-xs bg-white"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#c0c9c2] text-[#404943] font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#003523] hover:bg-[#144d37] text-white font-bold shadow-xs flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-[#fe932c]" />
              <span>Record & Reconcile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
