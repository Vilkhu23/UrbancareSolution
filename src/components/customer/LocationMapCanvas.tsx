import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, AlertCircle, Compass, Loader2 } from 'lucide-react';
import { DEFAULT_KHARAR_COORDINATES, KHARAR_MOHALI_LOCAL_ZONES, LocalZoneMatch } from '../../utils/googleMaps';

interface LocationMapCanvasProps {
  lat: number;
  lng: number;
  onPositionChange: (newLat: number, newLng: number) => void;
  isGoogleMapsAvailable: boolean;
  onUseCurrentLocation: () => void;
  isLocating: boolean;
  geoError: string | null;
}

export const LocationMapCanvas: React.FC<LocationMapCanvasProps> = ({
  lat,
  lng,
  onPositionChange,
  isGoogleMapsAvailable,
  onUseCurrentLocation,
  isLocating,
  geoError
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  // Initialize or update real Google Map if available
  useEffect(() => {
    if (!isGoogleMapsAvailable || !mapContainerRef.current) return;
    const google = (window as any).google;
    if (!google?.maps) return;

    if (!mapInstanceRef.current) {
      const map = new google.maps.Map(mapContainerRef.current, {
        center: { lat, lng },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
        ]
      });

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        title: 'Drag to adjust exact doorstep location'
      });

      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        if (pos) {
          onPositionChange(pos.lat(), pos.lng());
        }
      });

      map.addListener('click', (e: any) => {
        if (e.latLng) {
          marker.setPosition(e.latLng);
          onPositionChange(e.latLng.lat(), e.latLng.lng());
        }
      });

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;
    } else {
      mapInstanceRef.current.panTo({ lat, lng });
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setPosition({ lat, lng });
      }
    }
  }, [isGoogleMapsAvailable, lat, lng, onPositionChange]);

  return (
    <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-[#E2E6E4] bg-[#F7F8F7] shadow-inner select-none">
      {isGoogleMapsAvailable ? (
        <div ref={mapContainerRef} className="w-full h-full" />
      ) : (
        /* High-fidelity Fallback Interactive Grid Map for Kharar & Mohali */
        <div className="relative w-full h-full bg-[#f2f6f4] flex flex-col justify-between p-3 overflow-hidden">
          {/* Subtle grid pattern resembling map tiles */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(#0D3B2E 1px, transparent 1px), linear-gradient(90deg, #0D3B2E 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Quick sector selection pills */}
          <div className="relative z-10 flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-bold text-[#0D3B2E] uppercase bg-white/90 backdrop-blur-xs px-2 py-1 rounded-md border border-[#E2E6E4] shrink-0">
              Popular Sectors:
            </span>
            {KHARAR_MOHALI_LOCAL_ZONES.slice(0, 5).map((zone) => (
              <button
                key={zone.name}
                type="button"
                onClick={() => onPositionChange(zone.lat, zone.lng)}
                className={`text-[10px] font-semibold px-2 py-1 rounded-md transition-all shrink-0 cursor-pointer ${
                  Math.abs(zone.lat - lat) < 0.005 && Math.abs(zone.lng - lng) < 0.005
                    ? 'bg-[#0D3B2E] text-white shadow-xs'
                    : 'bg-white text-[#202124] border border-[#E2E6E4] hover:border-[#0D3B2E]'
                }`}
              >
                {zone.name.split(',')[0]}
              </button>
            ))}
          </div>

          {/* Interactive center pin graphic */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto pointer-events-none">
            <div className="relative flex flex-col items-center animate-bounce">
              <div className="w-9 h-9 rounded-full bg-[#0D3B2E] text-white flex items-center justify-center shadow-lg border-2 border-white">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="w-2 h-2 bg-black/30 rounded-full blur-[1px] mt-0.5" />
            </div>
            <div className="mt-2 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-bold text-[#0D3B2E] border border-[#0D3B2E]/20 shadow-xs">
              Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
            </div>
          </div>

          <div className="relative z-10 text-[10px] text-center text-[#626B73] bg-white/80 backdrop-blur-xs rounded-md py-0.5">
            Tap a sector above or search your society below to reposition pin
          </div>
        </div>
      )}

      {/* Floating GPS Button */}
      <div className="absolute bottom-3 right-3 z-20">
        <button
          type="button"
          onClick={onUseCurrentLocation}
          disabled={isLocating}
          className="flex items-center space-x-1.5 px-3 py-2 bg-white text-[#0D3B2E] text-xs font-bold rounded-xl shadow-md border border-[#E2E6E4] hover:bg-[#F7F8F7] active:scale-95 transition-all cursor-pointer disabled:opacity-60"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0D3B2E]" />
          ) : (
            <Navigation className="w-3.5 h-3.5 text-[#0D3B2E]" />
          )}
          <span>{isLocating ? 'Locating...' : 'Use My Current Location'}</span>
        </button>
      </div>

      {/* Permission Denied Notice */}
      {geoError && (
        <div className="absolute top-2 left-2 right-2 z-20 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] p-2 rounded-xl flex items-center space-x-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}
    </div>
  );
};
