import React, { useState } from 'react';
import { X, CheckCircle2, Camera, Upload, IndianRupee, Trash2, ShieldCheck, Sparkles } from 'lucide-react';
import { ServiceRequest } from '../../types';

interface VendorCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ServiceRequest | null;
  onConfirmComplete: (
    paymentMode: 'CASH' | 'UPI' | 'ONLINE',
    notes?: string,
    photos?: string[]
  ) => void;
}

const DEMO_COMPLETION_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    label: 'Appliance Electrical Tested'
  },
  {
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
    label: 'Outdoor Unit Foam Cleaned'
  },
  {
    url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80',
    label: 'Plumbing Joints Tested'
  }
];

export const VendorCompleteModal: React.FC<VendorCompleteModalProps> = ({
  isOpen,
  onClose,
  request,
  onConfirmComplete
}) => {
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'ONLINE'>('UPI');
  const [notes, setNotes] = useState<string>('Work completed to customer satisfaction. Equipment tested and operational.');
  const [photos, setPhotos] = useState<string[]>([]);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');

  if (!isOpen || !request) return null;

  const handleAddPresetPhoto = (url: string) => {
    if (!photos.includes(url)) {
      setPhotos([...photos, url]);
    }
  };

  const handleAddCustomPhoto = () => {
    if (customPhotoUrl.trim() && !photos.includes(customPhotoUrl.trim())) {
      setPhotos([...photos, customPhotoUrl.trim()]);
      setCustomPhotoUrl('');
    }
  };

  const handleRemovePhoto = (url: string) => {
    setPhotos(photos.filter((p) => p !== url));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmComplete(paymentMode, notes.trim(), photos.length > 0 ? photos : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 my-8">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-[#f4fbf7]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#003523] text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-[#b6efd1]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Complete Job & Finalize Bill</h3>
              <p className="text-xs text-gray-500">Service Request #{request.id} · {request.locality}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Amount Due Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#003523] to-[#144d37] text-white flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] text-emerald-200 uppercase tracking-wider font-semibold block">
                Total Payable by Customer
              </span>
              <div className="text-2xl font-black flex items-center">
                <span>₹{request.total}</span>
              </div>
              <span className="text-[11px] text-gray-200">
                {request.items.map((i) => `${i.serviceName} (×${i.quantity})`).join(', ')}
              </span>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-[10px] font-bold border border-emerald-400/30">
                Fixed Rate Verified
              </span>
            </div>
          </div>

          {/* Payment Collection Method */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Payment Collection Mode <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('UPI')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  paymentMode === 'UPI'
                    ? 'border-[#003523] bg-[#003523]/5 ring-2 ring-[#003523]/20 font-bold text-[#003523]'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="text-sm font-bold">UPI / QR</div>
                <div className="text-[10px] text-gray-500">GPay, PhonePe, Paytm</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('CASH')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  paymentMode === 'CASH'
                    ? 'border-[#003523] bg-[#003523]/5 ring-2 ring-[#003523]/20 font-bold text-[#003523]'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="text-sm font-bold">Cash in Hand</div>
                <div className="text-[10px] text-gray-500">Collected at Doorstep</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('ONLINE')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  paymentMode === 'ONLINE'
                    ? 'border-[#003523] bg-[#003523]/5 ring-2 ring-[#003523]/20 font-bold text-[#003523]'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="text-sm font-bold">Prepaid / App</div>
                <div className="text-[10px] text-gray-500">Card / NetBanking</div>
              </button>
            </div>
          </div>

          {/* Completion Proof Photos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Camera className="w-4 h-4 text-[#003523]" />
                <span>Upload Completion Proof Photos ({photos.length})</span>
              </label>
              <span className="text-[11px] text-gray-500">Quality guarantee audit</span>
            </div>

            {/* Quick Demo Photo Presets */}
            <div className="mb-3">
              <span className="text-[11px] text-gray-500 block mb-1.5">Quick add verified proof photos:</span>
              <div className="flex flex-wrap gap-2">
                {DEMO_COMPLETION_PHOTOS.map((dp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddPresetPhoto(dp.url)}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[11px] font-medium text-gray-700 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>+ {dp.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* URL Input */}
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                placeholder="Paste image URL (or select preset above)..."
                value={customPhotoUrl}
                onChange={(e) => setCustomPhotoUrl(e.target.value)}
                className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003523]"
              />
              <button
                type="button"
                onClick={handleAddCustomPhoto}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-colors flex items-center space-x-1"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Selected Photos Grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((url, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border border-gray-200 aspect-video group">
                    <img src={url} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(url)}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-600 text-white rounded-lg opacity-90 transition-colors"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Technician / Vendor Work Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Work Notes & Replaced Parts Details
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Capacitor 45uF replaced, coils washed, cooling temperature tested at 16°C..."
              className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003523]"
            />
          </div>

          {/* Operations Notice */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Automatic Invoice & Review Generation</span>
              <p className="text-[11px] text-emerald-800">
                Marking this job complete updates customer status instantly, releases the digital warranty, and prompts the customer for a 5-star artisan review.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#003523] text-white text-xs font-bold hover:bg-[#144d37] transition-all shadow-md flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4 text-[#b6efd1]" />
              <span>Confirm Completion & Collect ₹{request.total}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
