import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WHATSAPP_BUSINESS_PHONE,
  WHATSAPP_DISPLAY_PHONE,
  getWhatsAppUrl,
  getGeneralEnquiryWhatsAppUrl,
  getServiceEnquiryWhatsAppUrl,
  getQuoteEnquiryWhatsAppUrl,
  getBookingEnquiryWhatsAppUrl,
  getCustomRequirementWhatsAppUrl,
  getVendorDispatchWhatsAppUrl,
  getCustomerBookingConfirmationWhatsAppUrl
} from './whatsapp.ts';

describe('WhatsApp Integration Utility Tests', () => {
  it('should have the correct business phone constants', () => {
    assert.equal(WHATSAPP_BUSINESS_PHONE, '918284018909');
    assert.equal(WHATSAPP_DISPLAY_PHONE, '+91 82840 18909');
  });

  it('should return a basic wa.me url when message is empty or whitespace', () => {
    assert.equal(getWhatsAppUrl(), 'https://wa.me/918284018909');
    assert.equal(getWhatsAppUrl(''), 'https://wa.me/918284018909');
    assert.equal(getWhatsAppUrl('   '), 'https://wa.me/918284018909');
  });

  it('should properly URL-encode pre-filled messages', () => {
    const rawMsg = 'Hello! & How are you? #123';
    const url = getWhatsAppUrl(rawMsg);
    assert.ok(url.startsWith('https://wa.me/918284018909?text='));
    const textParam = url.split('?text=')[1];
    assert.equal(decodeURIComponent(textParam), rawMsg);
  });

  it('should generate relevant general enquiry message for homepage', () => {
    const url = getGeneralEnquiryWhatsAppUrl('Sector 125, Kharar');
    assert.ok(url.includes('Sector%20125%2C%20Kharar'));
    assert.ok(url.includes('doorstep%20home%20repair%20services'));

    const defaultUrl = getGeneralEnquiryWhatsAppUrl();
    assert.ok(defaultUrl.includes('Kharar%20%26%20Mohali'));
  });

  it('should generate context-aware message for service catalogue item', () => {
    const url = getServiceEnquiryWhatsAppUrl(
      'Ceiling Fan Repair',
      'Electrical',
      '₹149',
      'Sunny Enclave, Kharar'
    );
    assert.ok(url.includes('Ceiling%20Fan%20Repair'));
    assert.ok(url.includes('Electrical'));
    assert.ok(url.includes('%E2%82%B9149'));
    assert.ok(url.includes('Sunny%20Enclave%2C%20Kharar'));
  });

  it('should generate context-aware quote enquiry message', () => {
    const url = getQuoteEnquiryWhatsAppUrl('Turnkey Home Renovation', 'Sector 115');
    assert.ok(url.includes('Turnkey%20Home%20Renovation'));
    assert.ok(url.includes('Sector%20115'));
    assert.ok(url.includes('inspection%20%26%20quote'));
  });

  it('should generate context-aware booking enquiry message with ID and status', () => {
    const url = getBookingEnquiryWhatsAppUrl(
      'PB-1042',
      ['Split AC Foam Jet Wash', 'Switchboard Repair'],
      'ASSIGNED',
      'Sector 126, Mohali'
    );
    assert.ok(url.includes('PB-1042'));
    assert.ok(url.includes('Split%20AC%20Foam%20Jet%20Wash'));
    assert.ok(url.includes('ASSIGNED'));
    assert.ok(url.includes('Sector%20126%2C%20Mohali'));
  });

  it('should generate custom requirement enquiry message', () => {
    const url = getCustomRequirementWhatsAppUrl('Submersible pump rewinding', 'Kharar');
    assert.ok(url.includes('Submersible%20pump%20rewinding'));
    assert.ok(url.includes('Kharar'));
  });

  it('should generate vendor dispatch message with confirmed service address and maps link', () => {
    const url = getVendorDispatchWhatsAppUrl('9876543210', {
      bookingId: 'PB-2041',
      serviceName: 'Deep Cleaning',
      customerName: 'Aman Singh',
      customerPhone: '9812345678',
      address: 'Flat 402, Block B, Wave Estate',
      locality: 'Sector 85',
      timeSlot: '2:00 PM - 4:00 PM',
      date: 'Today',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=30.6865,76.7118'
    });

    assert.ok(url.includes('919876543210'));
    assert.ok(url.includes('PB-2041'));
    assert.ok(url.includes('Flat%20402%2C%20Block%20B%2C%20Wave%20Estate'));
    assert.ok(url.includes('Sector%2085'));
    assert.ok(url.includes('maps'));
  });

  it('should prompt vendor and customer for address when address is empty instead of guessing', () => {
    const vendorUrl = getVendorDispatchWhatsAppUrl('9876543210', {
      bookingId: 'PB-2042',
      serviceName: 'Plumbing',
      customerName: 'Simran Kaur',
      customerPhone: '9812345678',
      address: '',
      timeSlot: '11:00 AM - 1:00 PM',
      date: 'Tomorrow'
    });

    assert.ok(vendorUrl.includes('pending%20customer%20confirmation'));

    const custUrl = getCustomerBookingConfirmationWhatsAppUrl('9812345678', {
      bookingId: 'PB-2042',
      serviceName: 'Plumbing',
      customerName: 'Simran Kaur',
      address: '',
      timeSlot: '11:00 AM - 1:00 PM',
      date: 'Tomorrow'
    });

    assert.ok(custUrl.includes('Please%20reply%20with%20your%20flat%2Fhouse'));
  });
});
