import React, { useState, useEffect, useRef } from 'react';
import { X, Search, MapPin, AlertCircle, Compass, Loader2 } from 'lucide-react';
import { ServiceLocation } from '../../types';
import {
  DEFAULT_KHARAR_COORDINATES,
  DEFAULT_SERVICE_CITY,
  loadGoogleMapsScript,
  reverseGeocodeCoordinates,
  formatServiceAddress,
  KHARAR_MOHALI_LOCAL_ZONES,
  LocalZoneMatch
} from '../../utils/googleMaps';
import { LocationMapCanvas } from './LocationMapCanvas';
import { LocationAddressForm } from './LocationAddressForm';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLocation?: ServiceLocation | null;
  onConfirmLocation: (location: ServiceLocation) => void;
  currentLocality?: string;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  initialLocation,
  onConfirmLocation,
  currentLocality
}) => {
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLocation?.latitude || DEFAULT_KHARAR_COORDINATES.lat,
    lng: initialLocation?.longitude || DEFAULT_KHARAR_COORDINATES.lng
  });

  const [locationState, setLocationState] = useState<ServiceLocation>(() => {
    if (initialLocation) return initialLocation;
    return {
      formattedAddress: '',
      latitude: DEFAULT_KHARAR_COORDINATES.lat,
      longitude: DEFAULT_KHARAR_COORDINATES.lng,
      locality: currentLocality || 'Sector 125',
      city: DEFAULT_SERVICE_CITY,
      postalCode: '140301',
      houseFlat: '',
      buildingSociety: '',
      street: ''
    };
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocalZoneMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const autocompleteInputRef = useRef<HTMLInputElement>(null);

  // Load Google Maps script once modal opens
  useEffect(() => {
    if (!isOpen) return;

    loadGoogleMapsScript().then((ready) => {
      setIsGoogleMapsReady(ready);
      if (ready && autocompleteInputRef.current) {
        initGooglePlacesAutocomplete();
      }
    });
  }, [isOpen]);

  const initGooglePlacesAutocomplete = () => {
    const google = (window as any).google;
    if (!google?.maps?.places || !autocompleteInputRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
      componentRestrictions: { country: 'in' },
      fields: ['geometry', 'formatted_address', 'address_components', 'place_id', 'name']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) {
        return;
      }

      const newLat = place.geometry.location.lat();
      const newLng = place.geometry.location.lng();
      setCoords({ lat: newLat, lng: newLng });
      updateLocationFromCoordinates(newLat, newLng, place);
      setSearchQuery(place.name || place.formatted_address || '');
    });
  };

  // Perform reverse geocoding when coordinates change
  const updateLocationFromCoordinates = async (lat: number, lng: number, placeData?: any) => {
    setIsGeocoding(true);
    try {
      const geoResult = await reverseGeocodeCoordinates(lat, lng);
      setLocationState((prev) => {
        const next: ServiceLocation = {
          ...prev,
          latitude: lat,
          longitude: lng,
          placeId: placeData?.place_id || geoResult.placeId || prev.placeId,
          locality: geoResult.locality || prev.locality,
          city: geoResult.city || prev.city,
          postalCode: geoResult.postalCode || prev.postalCode,
          street: geoResult.street || prev.street,
          buildingSociety: placeData?.name || geoResult.buildingSociety || prev.buildingSociety,
          formattedAddress: geoResult.formattedAddress || prev.formattedAddress
        };
        // Re-format address with active details
        next.formattedAddress = formatServiceAddress(next);
        return next;
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handlePositionChange = (newLat: number, newLng: number) => {
    setCoords({ lat: newLat, lng: newLng });
    updateLocationFromCoordinates(newLat, newLng);
  };

  // Browser Geolocation explicitly on tap
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('GPS location is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        updateLocationFromCoordinates(latitude, longitude);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setGeoError('Location permission was denied. Please select your sector manually.');
        } else {
          setGeoError('Unable to detect current GPS location. Please choose your sector.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Instant local search for Kharar & Mohali landmarks
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const filtered = KHARAR_MOHALI_LOCAL_ZONES.filter(
      (z) =>
        z.name.toLowerCase().includes(query.toLowerCase()) ||
        z.locality.toLowerCase().includes(query.toLowerCase()) ||
        z.city.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
  };

  const handleSelectLocalZone = (zone: LocalZoneMatch) => {
    setCoords({ lat: zone.lat, lng: zone.lng });
    setSearchQuery(zone.name);
    setSearchResults([]);
    updateLocationFromCoordinates(zone.lat, zone.lng);
  };

  const handleFieldChange = (updated: Partial<ServiceLocation>) => {
    setLocationState((prev) => {
      const next = { ...prev, ...updated };
      next.formattedAddress = formatServiceAddress(next);
      return next;
    });
  };

  const handleConfirm = () => {
    const finalLocation: ServiceLocation = {
      ...locationState,
      latitude: coords.lat,
      longitude: coords.lng,
      formattedAddress: formatServiceAddress(locationState)
    };
    onConfirmLocation(finalLocation);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border border-[#E2E6E4]">
        {/* Header */}
        <div className="p-4 border-b border-[#E2E6E4] bg-[#F7F8F7] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#0D3B2E] text-white flex items-center justify-center shadow-xs">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#202124]">Select Service Location</h3>
              <p className="text-[11px] text-[#626B73]">Kharar & Mohali Doorstep Dispatch</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#626B73] hover:text-[#202124] hover:bg-gray-200 transition-colors cursor-pointer"
            aria-label="Close location selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Places Search & Autocomplete */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-[#626B73]" />
              <input
                ref={autocompleteInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search sector, society, landmark (e.g. Wave Estate, Sector 125)..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-[#E2E6E4] text-xs font-semibold text-[#202124] placeholder:text-gray-400 focus:border-[#0D3B2E] focus:ring-1 focus:ring-[#0D3B2E]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute right-2.5 p-1 text-[#626B73] hover:text-[#202124] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Match Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E2E6E4] rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-[#E2E6E4]">
                {searchResults.map((res) => (
                  <button
                    key={res.name}
                    type="button"
                    onClick={() => handleSelectLocalZone(res)}
                    className="w-full p-2.5 text-left text-xs hover:bg-[#F7F8F7] flex items-center justify-between cursor-pointer"
                  >
                    <span className="font-bold text-[#202124]">{res.name}</span>
                    <span className="text-[10px] text-[#0D3B2E] font-semibold bg-[#E7F3EC] px-1.5 py-0.5 rounded">
                      {res.city}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Map Canvas */}
          <LocationMapCanvas
            lat={coords.lat}
            lng={coords.lng}
            onPositionChange={handlePositionChange}
            isGoogleMapsAvailable={isGoogleMapsReady}
            onUseCurrentLocation={handleUseCurrentLocation}
            isLocating={isLocating}
            geoError={geoError}
          />

          {/* Editable Details Form */}
          <LocationAddressForm
            location={locationState}
            onChange={handleFieldChange}
            onConfirm={handleConfirm}
            isConfirming={isGeocoding}
          />
        </div>
      </div>
    </div>
  );
};
