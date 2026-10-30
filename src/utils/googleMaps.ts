import { ServiceLocation } from '../types';

export const DEFAULT_KHARAR_COORDINATES = {
  lat: 30.7499,
  lng: 76.6413
};

export const DEFAULT_SERVICE_CITY = 'Kharar';
export const DEFAULT_SERVICE_STATE = 'Punjab';

/**
 * Known Kharar & Mohali landmark directory for high-accuracy local matching,
 * fallback autocomplete, and offline reverse geocoding.
 */
export interface LocalZoneMatch {
  name: string;
  locality: string;
  city: string;
  postalCode: string;
  lat: number;
  lng: number;
}

export const KHARAR_MOHALI_LOCAL_ZONES: LocalZoneMatch[] = [
  {
    name: 'Sunny Enclave, Sector 125',
    locality: 'Sector 125',
    city: 'Kharar',
    postalCode: '140301',
    lat: 30.738,
    lng: 76.662
  },
  {
    name: 'Sector 126, Model Town',
    locality: 'Sector 126',
    city: 'Kharar',
    postalCode: '140301',
    lat: 30.7512,
    lng: 76.643
  },
  {
    name: 'Sector 127, Gillco Valley',
    locality: 'Sector 127',
    city: 'Kharar',
    postalCode: '140301',
    lat: 30.754,
    lng: 76.648
  },
  {
    name: 'Sector 115, Ansal Golf Links / Landran Rd',
    locality: 'Sector 115',
    city: 'Kharar',
    postalCode: '140307',
    lat: 30.718,
    lng: 76.678
  },
  {
    name: 'Nirwana Greens / Chajju Majra',
    locality: 'Chajju Majra',
    city: 'Kharar',
    postalCode: '140301',
    lat: 30.741,
    lng: 76.635
  },
  {
    name: 'Wave Estate, Sector 85',
    locality: 'Sector 85',
    city: 'Mohali',
    postalCode: '140308',
    lat: 30.6865,
    lng: 76.7118
  },
  {
    name: 'Sector 68, Kumbra',
    locality: 'Sector 68',
    city: 'Mohali',
    postalCode: '140062',
    lat: 30.698,
    lng: 76.728
  },
  {
    name: 'Sector 70, Mattaur',
    locality: 'Sector 70',
    city: 'Mohali',
    postalCode: '140071',
    lat: 30.707,
    lng: 76.721
  },
  {
    name: 'Sector 71, Phase 7 Extension',
    locality: 'Sector 71',
    city: 'Mohali',
    postalCode: '140071',
    lat: 30.713,
    lng: 76.713
  },
  {
    name: 'Sector 82, JLPL Industrial Area',
    locality: 'Sector 82',
    city: 'Mohali',
    postalCode: '140306',
    lat: 30.672,
    lng: 76.745
  },
  {
    name: 'Sector 91, Garden City',
    locality: 'Sector 91',
    city: 'Mohali',
    postalCode: '140307',
    lat: 30.692,
    lng: 76.691
  },
  {
    name: 'Ambika Florence Park, New Chandigarh',
    locality: 'New Chandigarh',
    city: 'Mullanpur',
    postalCode: '140901',
    lat: 30.796,
    lng: 76.748
  }
];

/**
 * Returns the Google Maps API Key from environment, trimmed.
 */
export function getGoogleMapsApiKey(): string {
  const envKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;
  if (typeof envKey === 'string' && envKey.trim().length > 0) {
    return envKey.trim();
  }
  return '';
}

let googleMapsPromise: Promise<boolean> | null = null;

/**
 * Dynamically loads the Google Maps JavaScript API with Places and Geometry libraries.
 * Reuses active promise or detects already loaded window.google.maps.
 */
export function loadGoogleMapsScript(apiKey?: string): Promise<boolean> {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  // Already loaded in window
  if ((window as any).google?.maps?.places) {
    return Promise.resolve(true);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const key = apiKey || getGoogleMapsApiKey();
  if (!key) {
    // No API key provided: resolve false to trigger fallback UI without crash
    return Promise.resolve(false);
  }

  googleMapsPromise = new Promise((resolve) => {
    // Check if script tag is already in DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      key
    )}&libraries=places,geometry&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      console.warn('Failed to load Google Maps JavaScript API. Falling back to manual search mode.');
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

/**
 * Generates an accessible Google Maps search link.
 */
export function getGoogleMapsWebUrl(lat: number, lng: number, label?: string): string {
  if (label && label.trim().length > 0) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label.trim())}&query_place_id=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/**
 * Parses Google Geocoder address_components array into a structured address object.
 */
export function parseGoogleAddressComponents(components: any[]): {
  houseFlat: string;
  buildingSociety: string;
  street: string;
  locality: string;
  city: string;
  postalCode: string;
} {
  let houseFlat = '';
  let buildingSociety = '';
  let street = '';
  let locality = '';
  let city = '';
  let postalCode = '';

  if (!Array.isArray(components)) {
    return { houseFlat, buildingSociety, street, locality, city, postalCode };
  }

  for (const comp of components) {
    const types: string[] = comp.types || [];
    const val = (comp.long_name || comp.short_name || '').trim();

    if (types.includes('street_number') || types.includes('room') || types.includes('floor')) {
      houseFlat = val;
    } else if (types.includes('premise') || types.includes('subpremise') || types.includes('point_of_interest')) {
      if (!buildingSociety) buildingSociety = val;
    } else if (types.includes('route')) {
      street = val;
    } else if (
      types.includes('sublocality_level_1') ||
      types.includes('sublocality') ||
      types.includes('neighborhood')
    ) {
      if (!locality) locality = val;
    } else if (types.includes('sublocality_level_2')) {
      if (!street) street = val;
    } else if (
      types.includes('locality') ||
      types.includes('administrative_area_level_2') ||
      types.includes('administrative_area_level_3')
    ) {
      if (!city) city = val;
    } else if (types.includes('postal_code')) {
      postalCode = val;
    }
  }

  // Fallbacks for Kharar / Mohali sub-districts if city not tagged
  if (!city) city = DEFAULT_SERVICE_CITY;

  return { houseFlat, buildingSociety, street, locality, city, postalCode };
}

/**
 * Finds the nearest known Kharar/Mohali sector/zone by coordinates (Euclidean approximation).
 */
export function findNearestLocalZone(lat: number, lng: number): LocalZoneMatch {
  let closest = KHARAR_MOHALI_LOCAL_ZONES[0];
  let minDistanceSq = Number.MAX_VALUE;

  for (const zone of KHARAR_MOHALI_LOCAL_ZONES) {
    const dLat = zone.lat - lat;
    const dLng = zone.lng - lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      closest = zone;
    }
  }

  return closest;
}

/**
 * Formats a clean, readable doorstep address string from component pieces,
 * preventing duplicate parts or awkward trailing commas.
 */
export function formatServiceAddress(loc: Partial<ServiceLocation>): string {
  const house = (loc.houseFlat || '').trim();
  const society = (loc.buildingSociety || '').trim();
  const street = (loc.street || '').trim();
  const locality = (loc.locality || '').trim();
  const city = (loc.city || '').trim();
  const pin = (loc.postalCode || '').trim();

  // If none of the specific doorstep details are provided, return formattedAddress directly
  if (!house && !society && !street && !locality) {
    if (loc.formattedAddress && loc.formattedAddress.trim().length > 0) {
      return loc.formattedAddress.trim();
    }
  }

  const parts: string[] = [];
  if (house) parts.push(house);
  if (society && !parts.includes(society)) parts.push(society);
  if (street && !parts.includes(street)) parts.push(street);
  if (locality && !parts.includes(locality)) parts.push(locality);
  if (city && !parts.includes(city)) parts.push(city);
  if (pin && !parts.includes(pin)) parts.push(pin);

  if (parts.length === 0) {
    return loc.formattedAddress || '';
  }

  return parts.join(', ');
}

/**
 * Executes reverse geocoding using active window.google.maps or local database fallback.
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number
): Promise<ServiceLocation> {
  const google = (window as any)?.google;

  if (google?.maps?.Geocoder) {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });

      if (response.results && response.results.length > 0) {
        const topResult = response.results[0];
        const parsed = parseGoogleAddressComponents(topResult.address_components);

        return {
          formattedAddress: topResult.formatted_address || '',
          latitude: lat,
          longitude: lng,
          placeId: topResult.place_id,
          houseFlat: parsed.houseFlat,
          buildingSociety: parsed.buildingSociety,
          street: parsed.street,
          locality: parsed.locality || findNearestLocalZone(lat, lng).locality,
          city: parsed.city || DEFAULT_SERVICE_CITY,
          postalCode: parsed.postalCode || '140301'
        };
      }
    } catch (err) {
      console.warn('Google reverse geocode error, using local fallback matcher:', err);
    }
  }

  // Fallback: nearest zone in Kharar / Mohali
  const nearest = findNearestLocalZone(lat, lng);
  const fallbackFormatted = `${nearest.name}, ${nearest.city}, Punjab ${nearest.postalCode}`;

  return {
    formattedAddress: fallbackFormatted,
    latitude: lat,
    longitude: lng,
    locality: nearest.locality,
    city: nearest.city,
    postalCode: nearest.postalCode
  };
}
