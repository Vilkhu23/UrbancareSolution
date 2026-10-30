import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  parseGoogleAddressComponents,
  findNearestLocalZone,
  formatServiceAddress,
  getGoogleMapsWebUrl,
  DEFAULT_KHARAR_COORDINATES,
  KHARAR_MOHALI_LOCAL_ZONES
} from './googleMaps.js';

describe('Google Maps Service Location Utilities', () => {
  it('should generate valid Google Maps search URLs', () => {
    const url = getGoogleMapsWebUrl(30.7499, 76.6413);
    assert.strictEqual(url, 'https://www.google.com/maps/search/?api=1&query=30.7499,76.6413');

    const urlWithLabel = getGoogleMapsWebUrl(30.738, 76.662, 'Sunny Enclave, Kharar');
    assert.ok(urlWithLabel.includes('Sunny%20Enclave'));
  });

  it('should parse Google Geocoder address components accurately', () => {
    const sampleComponents = [
      { long_name: '402', short_name: '402', types: ['street_number'] },
      { long_name: 'Tower B, Wave Estate', short_name: 'Wave Estate', types: ['premise'] },
      { long_name: 'Internal Sector Road', short_name: 'Internal Sector Road', types: ['route'] },
      { long_name: 'Sector 85', short_name: 'Sec 85', types: ['sublocality_level_1'] },
      { long_name: 'Mohali', short_name: 'Mohali', types: ['locality'] },
      { long_name: '140308', short_name: '140308', types: ['postal_code'] }
    ];

    const parsed = parseGoogleAddressComponents(sampleComponents);
    assert.strictEqual(parsed.houseFlat, '402');
    assert.strictEqual(parsed.buildingSociety, 'Tower B, Wave Estate');
    assert.strictEqual(parsed.street, 'Internal Sector Road');
    assert.strictEqual(parsed.locality, 'Sector 85');
    assert.strictEqual(parsed.city, 'Mohali');
    assert.strictEqual(parsed.postalCode, '140308');
  });

  it('should match nearest local zone in Kharar/Mohali when offline', () => {
    // Exact match for Sunny Enclave
    const match1 = findNearestLocalZone(30.738, 76.662);
    assert.strictEqual(match1.locality, 'Sector 125');
    assert.strictEqual(match1.postalCode, '140301');

    // Nearby coordinate for Wave Estate Sector 85
    const match2 = findNearestLocalZone(30.686, 76.711);
    assert.strictEqual(match2.locality, 'Sector 85');
    assert.strictEqual(match2.city, 'Mohali');
  });

  it('should format clean service addresses without duplicated parts', () => {
    const loc = {
      houseFlat: 'Flat 301',
      buildingSociety: 'Gillco Palms',
      street: 'Sector 127 Road',
      locality: 'Sector 127',
      city: 'Kharar',
      postalCode: '140301'
    };

    const formatted = formatServiceAddress(loc);
    assert.strictEqual(
      formatted,
      'Flat 301, Gillco Palms, Sector 127 Road, Sector 127, Kharar, 140301'
    );
  });

  it('should fallback to formattedAddress if component fields are empty', () => {
    const loc = {
      formattedAddress: 'Main Bazar, Kharar, Punjab 140301'
    };
    const formatted = formatServiceAddress(loc);
    assert.strictEqual(formatted, 'Main Bazar, Kharar, Punjab 140301');
  });
});
