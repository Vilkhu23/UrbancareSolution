import React, { useState } from 'react';
import { X, FileText, CheckCircle2 } from 'lucide-react';
import { ServiceRequest } from '../../types';

interface VendorAddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ServiceRequest | null;
  onSaveNote: (note: string) => void;
}

const PRESET_OBSERVATION_NOTES = [
  'Tested capacitor with multimeter: microfarad rating within acceptable ±5% tolerance.',
  'Replaced contactor switch terminal screws, tightened distribution wiring.',
  'Cleaned indoor AC filter mesh and treated with antibacterial wash.',
  'Checked compressor suction pressure: steady at 125 PSI on R32 gauge.',
  'Water pump priming valve gasket replaced, zero water leakage observed.',
  'Inverter wiring checked, battery electrolyte level topped up with distilled water.'
];

export const VendorAddNoteModal: React.FC<VendorAddNoteModalProps> = ({
  isOpen,
  onClose,
  request,
  onSaveNote
}) => {
  const [noteText, setNoteText] = useState<string>('');

  if (!isOpen || !request) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onSaveNote(noteText.trim());
    setNoteText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-200">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-[#f4fbf7]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#003523] text-white flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#b6efd1]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Add Technical Service Note</h3>
              <p className="text-xs text-gray-500">Job #{request.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Select or Type Observation Note
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {PRESET_OBSERVATION_NOTES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNoteText(preset)}
                  className="text-left p-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] leading-tight transition-colors line-clamp-1"
                >
                  + {preset.slice(0, 42)}...
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Type your technical notes, replaced components, measurement readings..."
              className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003523]"
              required
            />
          </div>

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
              className="px-5 py-2.5 rounded-xl bg-[#003523] text-white text-xs font-bold hover:bg-[#144d37] transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-[#b6efd1]" />
              <span>Save Note</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
