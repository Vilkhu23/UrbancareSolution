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
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] border border-[#c0c9c2]/50 shadow-2xl flex flex-col overflow-hidden text-xs">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#002114] text-white flex items-center justify-between border-b border-[#144d37]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#b6efd1] text-[#002114] flex items-center justify-center font-bold">
              <Navigation className="w-5 h-5 text-[#003523]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white">Service Available Zones</h3>
                <span className="text-[10px] bg-[#fe932c] text-[#002114] font-black px-1.5 py-0.5 rounded uppercase">
                  Sectors 94 to 111
                </span>
              </div>
              <p className="text-[11px] text-[#b6efd1]">
                Mohali & Greater Tricity Pockets · Dedicated Local Technicians Stationed
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLocalityModalOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="p-3 bg-[#faf8ff] border-b border-[#c0c9c2]/40">
          <div className="relative">
            <Search className="w-4 h-4 text-[#707973] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by sector (e.g. 104, 110) or society (Emaar, TDI, JLPL, Wave)..."
              className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-[#c0c9c2]/60 text-xs font-semibold placeholder:text-[#707973] focus:border-[#003523] focus:ring-1 focus:ring-[#003523]"
            />
          </div>
        </div>

        {/* Zones List */}
        <div className="p-4 overflow-y-auto space-y-2.5 max-h-[58vh]">
          {filteredZones.length === 0 ? (
            <div className="p-8 text-center text-[#707973] space-y-2">
              <p>No sector matched "{searchQuery}".</p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-[#003523] underline"
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
                  onClick={() => {
                    setCurrentLocality(zone.name);
                    setIsLocalityModalOpen(false);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'border-[#003523] bg-[#c0edd3]/25 shadow-xs ring-1 ring-[#003523]'
                      : 'border-[#c0c9c2]/50 bg-white hover:bg-[#faf8ff] hover:border-[#003523]/60'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-xs text-[#003523] bg-[#c0edd3]/50 px-2 py-0.5 rounded-md">
                        {zone.sector}
                      </span>
                      <span className="font-bold text-xs text-[#131b2e]">{zone.name}</span>
                      {isSelected && (
                        <span className="text-[10px] font-bold bg-[#003523] text-white px-1.5 py-0.2 rounded">
                          Selected
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#404943] leading-relaxed">
                      {zone.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {zone.keyEnclaves.map((enc) => (
                        <span
                          key={enc}
                          className="text-[10px] bg-[#f2f3ff] text-[#404943] font-medium px-2 py-0.5 rounded-full border border-[#c0c9c2]/30"
                        >
                          {enc}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center space-x-3 text-[10px] text-[#707973] pt-1">
                      <span className="flex items-center space-x-1 text-[#003523] font-semibold">
                        <Zap className="w-3 h-3 text-[#fe932c]" />
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
                          ? 'bg-[#003523] border-[#003523] text-white'
                          : 'border-[#c0c9c2] text-transparent hover:border-[#003523]'
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
        <div className="p-3 bg-[#faf8ff] border-t border-[#c0c9c2]/40 flex items-center justify-between text-[11px] text-[#707973]">
          <div className="flex items-center space-x-1.5 text-[#002114]">
            <ShieldCheck className="w-4 h-4 text-[#003523]" />
            <span>Guaranteed Doorstep Response across all 11 Sectors</span>
          </div>
          <span className="font-semibold text-[#003523]">UrbanCare Solution Dispatch</span>
        </div>

      </div>
    </div>
  );
};
