import React, { useState } from 'react';
import { X, CheckCircle2, Camera, Upload, Trash2, Plus, Sparkles, ShieldCheck, Wrench } from 'lucide-react';
import { ServiceRequest } from '../../types';

interface EmployeeCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ServiceRequest | null;
  onConfirmComplete: (
    completionNotes: string,
    completionPhotos: string[],
    materialInfo?: string,
    partsUsed?: { name: string; quantity: number; cost: number }[],
    paymentCollectedMode?: 'CASH' | 'UPI' | 'ONLINE'
  ) => void;
}

const PRESET_COMPLETION_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
    label: 'Coils Cleaned & Tested'
  },
  {
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    label: 'Wiring & Capacitor Fixed'
  },
  {
    url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80',
    label: 'Pressure Tested No Leak'
  }
];

export const EmployeeCompleteModal: React.FC<EmployeeCompleteModalProps> = ({
  isOpen,
  onClose,
  request,
  onConfirmComplete
}) => {
  const [workNotes, setWorkNotes] = useState<string>(
    'Diagnostic test completed. Cleaned filter mesh, checked terminal voltages, and verified normal temperature differential.'
  );
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80'
  ]);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');

  // Optional material/parts information
  const [materialText, setMaterialText] = useState<string>('');
  const [parts, setParts] = useState<{ name: string; quantity: number; cost: number }[]>([]);
  const [newPartName, setNewPartName] = useState<string>('');
  const [newPartCost, setNewPartCost] = useState<number>(350);

  // Mandatory completion confirmation checkbox
  const [confirmedByEmployee, setConfirmedByEmployee] = useState<boolean>(false);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'ONLINE'>('UPI');

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

  const handleAddPart = () => {
    if (!newPartName.trim()) return;
    setParts([...parts, { name: newPartName.trim(), quantity: 1, cost: newPartCost }]);
    setNewPartName('');
    setNewPartCost(0);
  };

  const handleRemovePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (photos.length === 0) {
      alert('Please upload at least one completion proof photo.');
      return;
    }
    if (!workNotes.trim()) {
      alert('Please provide work notes detailing what was serviced or repaired.');
      return;
    }
    if (!confirmedByEmployee) {
      alert('Please confirm that technical service and customer testing are completed.');
      return;
    }

    onConfirmComplete(
      workNotes.trim(),
      photos,
      materialText.trim() ? materialText.trim() : undefined,
      parts.length > 0 ? parts : undefined,
      paymentMode
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 my-8">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-[#f4fbf7]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#003523] text-white flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-[#b6efd1]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Finalize Job Completion</h3>
              <p className="text-xs text-gray-500">Order #{request.id} · {request.customerName}</p>
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
          <div className="p-4 rounded-xl bg-[#003523] text-white flex items-center justify-between">
            <div>
              <span className="text-[10px] text-emerald-200 uppercase tracking-wider font-semibold block">
                Total Bill to Collect
              </span>
              <div className="text-2xl font-black">₹{request.total}</div>
              <span className="text-[11px] text-gray-200">
                {request.items.map((i) => i.serviceName).join(', ')}
              </span>
            </div>
            <div className="flex bg-white/10 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setPaymentMode('UPI')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  paymentMode === 'UPI' ? 'bg-white text-[#003523]' : 'text-gray-200'
                }`}
              >
                UPI
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('CASH')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  paymentMode === 'CASH' ? 'bg-white text-[#003523]' : 'text-gray-200'
                }`}
              >
                Cash
              </button>
            </div>
          </div>

          {/* 1. Completion Photos (Mandatory) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Camera className="w-4 h-4 text-[#003523]" />
                <span>Completion Photos <span className="text-red-500">*</span></span>
              </label>
              <span className="text-[11px] text-gray-400">({photos.length} uploaded)</span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-2.5">
              {PRESET_COMPLETION_PHOTOS.map((dp, idx) => (
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

            <div className="flex space-x-2 mb-2.5">
              <input
                type="text"
                placeholder="Or paste completion photo URL..."
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

            {/* Photo thumbnails */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((url, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border border-gray-200 aspect-video group">
                    <img src={url} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(url)}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-600 text-white rounded-lg opacity-90 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Work Notes (Mandatory) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Work Notes & Technical Inspection <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={workNotes}
              onChange={(e) => setWorkNotes(e.target.value)}
              placeholder="Detail what was diagnosed, fixed, and tested..."
              className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003523]"
              required
            />
          </div>

          {/* 3. Optional Material/Parts Information */}
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-gray-800">
              <Wrench className="w-3.5 h-3.5 text-[#003523]" />
              <span>Optional Material & Spare Parts Consumed</span>
            </div>

            <div className="grid grid-cols-12 gap-2">
              <input
                type="text"
                placeholder="Part Name (e.g. Capacitor 45uF, 32A MCB)"
                value={newPartName}
                onChange={(e) => setNewPartName(e.target.value)}
                className="col-span-7 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white"
              />
              <input
                type="number"
                placeholder="Cost ₹"
                value={newPartCost || ''}
                onChange={(e) => setNewPartCost(Number(e.target.value))}
                className="col-span-3 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white"
              />
              <button
                type="button"
                onClick={handleAddPart}
                className="col-span-2 bg-[#003523] text-white rounded-lg text-xs font-bold flex items-center justify-center"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {parts.length > 0 && (
              <div className="space-y-1">
                {parts.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200 text-xs">
                    <span>{p.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#003523]">₹{p.cost}</span>
                      <button type="button" onClick={() => handleRemovePart(idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <input
              type="text"
              placeholder="Material notes (e.g. Copper wire 2 meters from hub store, Teflon tape)..."
              value={materialText}
              onChange={(e) => setMaterialText(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white"
            />
          </div>

          {/* 4. Completion Confirmation (Mandatory) */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <label className="flex items-start space-x-2.5 cursor-pointer text-xs text-emerald-950 font-medium">
              <input
                type="checkbox"
                checked={confirmedByEmployee}
                onChange={(e) => setConfirmedByEmployee(e.target.checked)}
                className="mt-0.5 text-[#003523] focus:ring-[#003523] rounded-sm"
                required
              />
              <span>
                <strong>Completion Confirmation:</strong> I verify that the service was executed properly, the customer tested the equipment on-site, and the work area has been cleaned.
              </span>
            </label>
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
              disabled={!confirmedByEmployee}
              className="px-6 py-2.5 rounded-xl bg-[#003523] disabled:opacity-50 text-white text-xs font-bold hover:bg-[#144d37] transition-all shadow-md flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4 text-[#b6efd1]" />
              <span>Complete Job & Collect ₹{request.total}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
