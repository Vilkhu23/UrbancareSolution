import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SERVICE_AVAILABLE_ZONES } from '../../data/initialData';
import { X, MapPin, Check, Navigation, Search, ShieldCheck, Zap } from 'lucide-react';

export const LocalitySelectorModal: React.FC = () => {
  const {
    isLocalityModalOpen,
    setIsLocalityModalOpen,
    currentLocality,
    setCurrentLocality
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  if (!isLocalityModalOpen) return null;

  const filteredZones = SERVICE_AVAILABLE_ZONES.filter((zone) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      zone.sector.toLowerCase().includes(q) ||
      zone.name.toLowerCase().includes(q) ||
      zone.description.toLowerCase().includes(q) ||
      zone.keyEnclaves.some((enc) => enc.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] border border-[#E2E6E4] shadow-2xl flex flex-col overflow-hidden text-xs">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#0D3B2E] text-white flex items-center justify-between border-b border-[#0A2E24]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#E7F3EC] text-[#0D3B2E] flex items-center justify-center font-bold">
              <Navigation className="w-5 h-5 text-[#0D3B2E]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white">Service Available Zones</h3>
                <span className="text-[10px] bg-[#F79324] text-[#0D3B2E] font-black px-1.5 py-0.5 rounded uppercase">
                  Sectors 94 to 111
                </span>
              </div>
              <p className="text-[11px] text-[#E7F3EC]/80">
                Mohali & Greater Tricity Pockets · Dedicated Local Technicians Stationed
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLocalityModalOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close location selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="p-3 bg-[#F7F8F7] border-b border-[#E2E6E4]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#626B73] absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by sector (e.g. 104, 110) or society (Emaar, TDI, JLPL, Wave)..."
              className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl border border-[#E2E6E4] text-xs font-semibold text-[#202124] placeholder:text-[#626B73] focus:border-[#0D3B2E] focus:ring-1 focus:ring-[#0D3B2E] focus:outline-none"
              aria-label="Search serving sector or society"
            />
          </div>
        </div>

        {/* Zones List */}
        <div className="p-4 overflow-y-auto space-y-2.5 max-h-[58vh]">
          {filteredZones.length === 0 ? (
            <div className="p-8 text-center text-[#626B73] space-y-2">
              <p>No sector matched "{searchQuery}".</p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-[#0D3B2E] underline cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          ) : (
            filteredZones.map((zone) => {
              const isSelected = zone.name === currentLocality || zone.sector === currentLocality;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => {
                    setCurrentLocality(zone.name);
                    setIsLocalityModalOpen(false);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3B2E] ${
                    isSelected
                      ? 'border-[#0D3B2E] bg-[#E7F3EC]/50 shadow-xs ring-1 ring-[#0D3B2E]'
                      : 'border-[#E2E6E4] bg-white hover:bg-[#F7F8F7] hover:border-[#0D3B2E]/60'
                  }`}
                  aria-selected={isSelected}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-xs text-[#0D3B2E] bg-[#E7F3EC] px-2 py-0.5 rounded-md">
                        {zone.sector}
                      </span>
                      <span className="font-bold text-xs text-[#202124]">{zone.name}</span>
                      {isSelected && (
                        <span className="text-[10px] font-bold bg-[#0D3B2E] text-white px-1.5 py-0.2 rounded">
                          Selected
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#626B73] leading-relaxed">
                      {zone.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {zone.keyEnclaves.map((enc) => (
                        <span
                          key={enc}
                          className="text-[10px] bg-[#F7F8F7] text-[#202124] font-medium px-2 py-0.5 rounded-full border border-[#E2E6E4]"
                        >
                          {enc}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center space-x-3 text-[10px] text-[#626B73] pt-1">
                      <span className="flex items-center space-x-1 text-[#0D3B2E] font-semibold">
                        <Zap className="w-3 h-3 text-[#F79324]" />
                        <span>~{zone.avgResponseMinutes} min arrival ETA</span>
                      </span>
                      <span>·</span>
                      <span>{zone.activeArtisansCount} verified technicians active</span>
                    </div>
                  </div>

                  <div className="shrink-0 pt-1">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-[#0D3B2E] border-[#0D3B2E] text-white'
                          : 'border-[#E2E6E4] text-transparent hover:border-[#0D3B2E]'
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#F7F8F7] border-t border-[#E2E6E4] flex items-center justify-between text-[11px] text-[#626B73]">
          <div className="flex items-center space-x-1.5 text-[#0D3B2E]">
            <ShieldCheck className="w-4 h-4 text-[#0D3B2E]" />
            <span>Guaranteed Doorstep Response across all 11 Sectors</span>
          </div>
          <span className="font-semibold text-[#0D3B2E]">UrbanCare Solution Dispatch</span>
        </div>

      </div>
    </div>
  );
};
