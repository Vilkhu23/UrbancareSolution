import { ServiceItem, ServicePackage, CartItem, PriceType } from '../types';

export const DEMO_PRICING_DISCLAIMER =
  "Configurable Demo Values: Displayed rates (e.g. AC General Service ₹499, AC Foam-Jet ₹699, AC Inspection ₹199, AC Installation ₹999) are configurable demonstration values for testing and operations management. Not official market prices.";

export interface FormattedPriceDisplay {
  label: string;
  priceFormatted: string;
  originalPriceFormatted?: string;
  discountText?: string;
  visitFeeText: string;
  pricingType: PriceType;
  badgeLabel: string;
  isQuoteRequired: boolean;
  ctaText: string;
}

export interface OrderPricingBreakdown {
  itemSubtotal: number;
  visitFee: number;
  taxPercent: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  hasQuoteRequired: boolean;
  itemCount: number;
}

/**
 * Normalizes a ServiceItem to ensure both camelCase and snake_case properties
 * are synchronized according to the Central Pricing Engine schema.
 */
export function normalizeServiceItem(raw: Partial<ServiceItem> & Record<string, any>): ServiceItem {
  const price_type: PriceType = (
    raw.price_type ||
    raw.pricingType?.toString().toUpperCase() ||
    'FIXED'
  ) as PriceType;

  const base_price = Number(raw.base_price ?? raw.basePrice ?? 0);
  const original_price = raw.original_price ?? raw.originalPrice ?? undefined;
  const visit_fee = Number(raw.visit_fee ?? raw.visitFee ?? 99);
  const tax = Number(raw.tax ?? 0);
  const discount = raw.discount ?? (original_price && original_price > base_price ? `${Math.round(((original_price - base_price) / original_price) * 100)}% OFF` : undefined);
  const material_policy = raw.material_policy || raw.materialPolicy || 'Standard material policy applies. Consumables on transparent bill.';
  const duration = raw.duration || raw.estimatedDuration || '45 - 60 mins';
  const warranty = raw.warranty || '30 Days Service Guarantee';
  const included_items = raw.included_items || raw.included || [];
  const excluded_items = raw.excluded_items || raw.excluded || [];
  const active = raw.active !== undefined ? Boolean(raw.active) : true;
  const effective_from = raw.effective_from || '2026-10-01';
  const effective_to = raw.effective_to || undefined;

  return {
    id: raw.id || `srv-${Date.now()}`,
    name: raw.name || 'Untitled Service',
    category: raw.category || 'General',
    subcategory: raw.subcategory || 'General',
    description: raw.description || '',

    // Central Pricing Engine Canonical Fields
    price_type,
    base_price,
    original_price,
    discount,
    visit_fee,
    tax,
    material_policy,
    duration,
    warranty,
    included_items,
    excluded_items,
    active,
    effective_from,
    effective_to,

    // Compatibility aliases
    basePrice: base_price,
    originalPrice: original_price,
    visitFee: visit_fee,
    pricingType: price_type,
    materialPolicy: material_policy,
    estimatedDuration: duration,
    included: included_items,
    excluded: excluded_items,

    badge: raw.badge,
    serviceAreas: raw.serviceAreas || ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: raw.sortOrder ?? 1,
    completedBookingsCount: raw.completedBookingsCount,
    rating: raw.rating,
    faqs: raw.faqs,
    relatedServiceIds: raw.relatedServiceIds,
    frequentlyBookedTogetherIds: raw.frequentlyBookedTogetherIds
  };
}

/**
 * Standardizes display formatting for any service or package according to its price_type.
 * Strictly respects QUOTE_REQUIRED, INSPECTION, PACKAGE, STARTING_FROM, and FIXED.
 */
export function formatServicePricing(service: ServiceItem): FormattedPriceDisplay {
  const priceType: PriceType = (service.price_type || service.pricingType?.toString().toUpperCase() || 'FIXED') as PriceType;
  const basePrice = service.base_price ?? service.basePrice ?? 0;
  const originalPrice = service.original_price ?? service.originalPrice;
  const visitFee = service.visit_fee ?? service.visitFee ?? 99;
  const discount = service.discount;

  switch (priceType) {
    case 'QUOTE_REQUIRED':
      return {
        label: 'Request a Quote',
        priceFormatted: 'Request a Quote',
        visitFeeText: 'Free on-site measurement & custom estimate',
        pricingType: 'QUOTE_REQUIRED',
        badgeLabel: 'Quote Required',
        isQuoteRequired: true,
        ctaText: 'Request a Quote'
      };

    case 'INSPECTION':
      return {
        label: 'Inspection / Visit Fee',
        priceFormatted: `₹${basePrice}`,
        originalPriceFormatted: originalPrice ? `₹${originalPrice}` : undefined,
        discountText: discount,
        visitFeeText: `+ ₹${visitFee} doorstep visit (adjusted in final repair bill)`,
        pricingType: 'INSPECTION',
        badgeLabel: 'Inspection / Visit Fee',
        isQuoteRequired: false,
        ctaText: 'Book Diagnostic'
      };

    case 'PACKAGE':
      return {
        label: 'Package Price',
        priceFormatted: `₹${basePrice}`,
        originalPriceFormatted: originalPrice ? `₹${originalPrice}` : undefined,
        discountText: discount,
        visitFeeText: 'Zero doorstep visit fee included',
        pricingType: 'PACKAGE',
        badgeLabel: 'Care Package',
        isQuoteRequired: false,
        ctaText: 'Book Package'
      };

    case 'STARTING_FROM':
      return {
        label: 'Starting From',
        priceFormatted: `₹${basePrice}`,
        originalPriceFormatted: originalPrice ? `₹${originalPrice}` : undefined,
        discountText: discount,
        visitFeeText: `+ ₹${visitFee} doorstep inspection`,
        pricingType: 'STARTING_FROM',
        badgeLabel: 'Starting From',
        isQuoteRequired: false,
        ctaText: 'Add to Basket'
      };

    case 'FIXED':
    default:
      return {
        label: 'Fixed Price',
        priceFormatted: `₹${basePrice}`,
        originalPriceFormatted: originalPrice ? `₹${originalPrice}` : undefined,
        discountText: discount,
        visitFeeText: `+ ₹${visitFee} doorstep inspection`,
        pricingType: 'FIXED',
        badgeLabel: 'Fixed Price',
        isQuoteRequired: false,
        ctaText: 'Add to Basket'
      };
  }
}

/**
 * Calculates complete pricing breakdown consistently for Cart, Checkout, Bookings, and Invoices.
 */
export function calculateOrderPricing(
  cartItems: CartItem[],
  servicesCatalog: ServiceItem[]
): OrderPricingBreakdown {
  let itemSubtotal = 0;
  let hasStandardService = false;
  let hasQuoteRequired = false;
  let configuredTaxPercent = 0;

  for (const item of cartItems) {
    const srv = servicesCatalog.find((s) => s.id === item.serviceId);
    const pType = (srv?.price_type || srv?.pricingType?.toString().toUpperCase() || 'FIXED') as PriceType;

    if (pType === 'QUOTE_REQUIRED') {
      hasQuoteRequired = true;
    } else {
      itemSubtotal += item.price * item.quantity;
      if (!item.isPackage && pType !== 'PACKAGE') {
        hasStandardService = true;
      }
    }

    if (srv && srv.tax && srv.tax > configuredTaxPercent) {
      configuredTaxPercent = srv.tax;
    }
  }

  // Visit fee: ₹0 if cart is empty or only packages, otherwise ₹99 flat doorstep fee
  const visitFee = cartItems.length > 0 && hasStandardService ? 99 : 0;
  
  // Tax calculation (calculated on itemSubtotal if tax configured)
  const taxAmount = configuredTaxPercent > 0 ? Math.round((itemSubtotal * configuredTaxPercent) / 100) : 0;
  
  const discountAmount = 0;
  const total = itemSubtotal + visitFee + taxAmount - discountAmount;
  const itemCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  return {
    itemSubtotal,
    visitFee,
    taxPercent: configuredTaxPercent,
    taxAmount,
    discountAmount,
    total,
    hasQuoteRequired,
    itemCount
  };
}
