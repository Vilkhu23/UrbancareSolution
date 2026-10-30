import React from 'react';
import { ServiceLocation } from '../../types';
import { Building2, Home, MapPin, Check, Info } from 'lucide-react';

interface LocationAddressFormProps {
  location: ServiceLocation;
  onChange: (updated: Partial<ServiceLocation>) => void;
  onConfirm: () => void;
  isConfirming?: boolean;
}

export const LocationAddressForm: React.FC<LocationAddressFormProps> = ({
  location,
  onChange,
  onConfirm,
  isConfirming = false
}) => {
  const isFormValid =
    Boolean(location.houseFlat?.trim()) &&
    Boolean(location.locality?.trim()) &&
    Boolean(location.city?.trim());

  return (
    <div className="space-y-3.5 pt-1">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider flex items-center space-x-1.5">
          <Home className="w-3.5 h-3.5 text-[#0D3B2E]" />
          <span>Doorstep Address Details</span>
        </h4>
        <span className="text-[11px] text-[#626B73]">Review & edit below</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-semibold text-[#626B73] block mb-1">
            House / Flat / Villa No. <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Flat 402, Block C"
            value={location.houseFlat || ''}
            onChange={(e) => onChange({ houseFlat: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-[#E2E6E4] text-xs font-semibold text-[#202124] focus:border-[#0D3B2E] focus:ring-1 focus:ring-[#0D3B2E]"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-[#626B73] block mb-1">
            Building / Society Name
          </label>
          <input
            type="text"
            placeholder="e.g. Wave Estate, Sunny Enclave"
            value={location.buildingSociety || ''}
            onChange={(e) => onChange({ buildingSociety: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-[#E2E6E4] text-xs font-semibold text-[#202124] focus:border-[#0D3B2E] focus:ring-1 focus:ring-[#0D3B2E]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-semibold text-[#626B73] block mb-1">
            Street / Internal Road
          </label>
          <input
            type="text"
            placeholder="e.g. Main Boulevard"
            value={location.street || ''}
            onChange={(e) => onChange({ street: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-[#E2E6E4] text-xs font-semibold text-[#202124] focus:border-[#0D3B2E] focus:ring-1 focus:ring-[#0D3B2E]"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-[#626B73] block mb-1">
            Sector / Locality <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Sector 125"
            value={location.locality || ''}
            onChange={(e) => onChange({ locality: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-[#E2E6E4] text-xs font-semibold text-[#202124] focus:border-[#0D3B2E] focus:ring-1 focus:ring-[#0D3B2E]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-semibold text-[#626B73] block mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Kharar / Mohali"
            value={location.city || ''}
            onChange={(e) => onChange({ city: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-[#E2E6E4] text-xs font-semibold text-[#202124] focus:border-[#0D3B2E] focus:ring-1 focus:ring-[#0D3B2E]"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-[#626B73] block mb-1">
            Postal / PIN Code
          </label>
          <input
            type="text"
            placeholder="e.g. 140301"
            value={location.postalCode || ''}
            onChange={(e) => onChange({ postalCode: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-[#E2E6E4] text-xs font-semibold text-[#202124] focus:border-[#0D3B2E] focus:ring-1 focus:ring-[#0D3B2E]"
          />
        </div>
      </div>

      <div>
        <label className="text-[11px] font-semibold text-[#626B73] block mb-1">
          Landmark & Access Instructions (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. Gate 2, near fountain, call before arrival"
          value={location.accessInstructions || ''}
          onChange={(e) => onChange({ accessInstructions: e.target.value })}
          className="w-full p-2.5 rounded-xl border border-[#E2E6E4] text-xs text-[#202124] focus:border-[#0D3B2E] focus:ring-1 focus:ring-[#0D3B2E]"
        />
      </div>

      {/* Confirmation Callout */}
      <div className="p-3 bg-[#E7F3EC] rounded-xl border border-[#0D3B2E]/20 text-[#0D3B2E] text-xs space-y-1">
        <div className="flex items-center space-x-1.5 font-bold">
          <MapPin className="w-3.5 h-3.5 text-[#0D3B2E]" />
          <span>Confirmed Service Destination</span>
        </div>
        <p className="text-[11px] text-[#202124] font-medium leading-relaxed pl-5">
          {location.formattedAddress || 'Location will be formatted upon confirmation'}
        </p>
      </div>

      <button
        type="button"
        disabled={!isFormValid || isConfirming}
        onClick={onConfirm}
        className="w-full py-3 px-4 bg-[#0D3B2E] text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-lg hover:bg-[#092B21] active:scale-98 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Check className="w-4 h-4" />
        <span>Confirm Service Location</span>
      </button>
    </div>
  );
};
