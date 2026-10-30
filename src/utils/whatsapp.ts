/**
 * WhatsApp integration utility for UrbanCare Solution.
 * Single source of truth for generating pre-filled, URL-encoded WhatsApp links.
 *
 * WhatsApp API format:
 *   https://wa.me/{phone}?text={encoded_message}
 *
 * - Allows users to review and edit the message before sending.
 * - Does NOT send automatically.
 * - Uses the official UrbanCare business line: +91 82840 18909.
 */

export const WHATSAPP_BUSINESS_PHONE = '918284018909';
export const WHATSAPP_DISPLAY_PHONE = '+91 82840 18909';

/**
 * Base helper to generate a WhatsApp URL with an optional pre-filled message.
 */
export function getWhatsAppUrl(message?: string): string {
  if (!message || !message.trim()) {
    return `https://wa.me/${WHATSAPP_BUSINESS_PHONE}`;
  }
  return `https://wa.me/${WHATSAPP_BUSINESS_PHONE}?text=${encodeURIComponent(message.trim())}`;
}

/**
 * Pre-filled message for homepage and general website inquiries.
 */
export function getGeneralEnquiryWhatsAppUrl(locality?: string): string {
  const locText = locality ? ` in ${locality}` : ' in Kharar & Mohali';
  const message = `Hello UrbanCare Solution, I would like to enquire about doorstep home repair services${locText}. Please share technician availability.`;
  return getWhatsAppUrl(message);
}

/**
 * Pre-filled message for specific service catalog items.
 */
export function getServiceEnquiryWhatsAppUrl(
  serviceName: string,
  category?: string,
  priceText?: string,
  locality?: string
): string {
  const locText = locality ? ` in ${locality}` : ' in Kharar / Mohali';
  const priceInfo = priceText ? ` (${priceText})` : '';
  const catInfo = category ? ` under ${category}` : '';
  const message = `Hello UrbanCare Solution, I'm interested in booking the '${serviceName}' service${catInfo}${priceInfo}${locText}. Could you please share more details on technician scheduling?`;
  return getWhatsAppUrl(message);
}

/**
 * Pre-filled message for on-site inspection and quote requests.
 */
export function getQuoteEnquiryWhatsAppUrl(
  serviceOrProjectName: string,
  locality?: string
): string {
  const locText = locality ? ` in ${locality}` : ' in Kharar / Mohali';
  const message = `Hello UrbanCare Solution, I would like to request an on-site inspection & quote for '${serviceOrProjectName}'${locText}.`;
  return getWhatsAppUrl(message);
}

/**
 * Pre-filled message for customer booking support and live order tracking.
 */
export function getBookingEnquiryWhatsAppUrl(
  bookingId: string,
  serviceNames?: string[],
  status?: string,
  locality?: string
): string {
  const servicesText = serviceNames && serviceNames.length > 0 ? ` (${serviceNames.join(', ')})` : '';
  const statusText = status ? ` [Status: ${status}]` : '';
  const locText = locality ? ` for ${locality}` : '';
  const message = `Hello UrbanCare Support, I need assistance regarding my booking #${bookingId}${servicesText}${statusText}${locText}.`;
  return getWhatsAppUrl(message);
}

/**
 * Pre-filled message for custom requirements or when search yields zero catalog results.
 */
export function getCustomRequirementWhatsAppUrl(
  searchQuery?: string,
  locality?: string
): string {
  const locText = locality ? ` in ${locality}` : ' in Kharar / Mohali';
  const searchPart = searchQuery?.trim() ? ` for '${searchQuery.trim()}'` : '';
  const message = `Hello UrbanCare Solution, I have a custom home repair requirement${searchPart}${locText}. Can you please assist me with scheduling a verified technician?`;
  return getWhatsAppUrl(message);
}

/**
 * Pre-filled message sent by Operations to the assigned Vendor.
 */
export function getVendorDispatchWhatsAppUrl(
  vendorPhone: string,
  details: {
    bookingId: string;
    serviceName: string;
    customerName: string;
    customerPhone: string;
    address: string;
    locality?: string;
    timeSlot: string;
    date: string;
    notes?: string;
    mapUrl?: string;
  }
): string {
  const cleanPhone = vendorPhone.replace(/\D/g, '').replace(/^0+/, '');
  const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const notesText = details.notes ? ` Problem Details: "${details.notes}".` : '';
  
  const hasValidAddress = details.address && details.address.trim().length > 0;
  const addressText = hasValidAddress
    ? details.address.trim()
    : '[Service address pending customer confirmation - Contact customer for doorstep location]';

  const localityText = hasValidAddress && details.locality ? ` (${details.locality})` : '';
  const mapText = details.mapUrl ? ` Map: ${details.mapUrl}` : '';

  const message = `UrbanCare Dispatch Order #${details.bookingId}: Service: ${details.serviceName}. Slot: ${details.date}, ${details.timeSlot}. Customer: ${details.customerName} (${details.customerPhone}). Address: ${addressText}${localityText}.${mapText}${notesText} Please review and confirm acceptance.`;
  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
}

/**
 * Pre-filled message sent by Operations to the Customer confirming dispatch.
 */
export function getCustomerBookingConfirmationWhatsAppUrl(
  customerPhone: string,
  details: {
    bookingId: string;
    serviceName: string;
    customerName: string;
    vendorName?: string;
    vendorPhone?: string;
    address: string;
    locality?: string;
    timeSlot: string;
    date: string;
    mapUrl?: string;
  }
): string {
  const cleanPhone = customerPhone.replace(/\D/g, '').replace(/^0+/, '');
  const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const vendorInfo = details.vendorName
    ? ` Assigned Technician: ${details.vendorName}${details.vendorPhone ? ` (${details.vendorPhone})` : ''}.`
    : ' A certified technician is being dispatched.';

  const hasValidAddress = details.address && details.address.trim().length > 0;
  const atAddressText = hasValidAddress
    ? `at ${details.address.trim()}${details.locality ? ` (${details.locality})` : ''}`
    : 'at your doorstep (Please reply with your flat/house no. and society/sector)';

  const mapText = details.mapUrl ? ` (Verified Map: ${details.mapUrl})` : '';

  const message = `Hello ${details.customerName}, your UrbanCare booking #${details.bookingId} for '${details.serviceName}' is scheduled for ${details.timeSlot} on ${details.date} ${atAddressText}.${mapText}${vendorInfo} Kharar Operations Desk: +91 82840 18909.`;
  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
}
