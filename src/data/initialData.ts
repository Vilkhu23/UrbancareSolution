import {
  ServiceItem,
  ServicePackage,
  Vendor,
  Employee,
  ServiceRequest,
  HomeProjectRequest,
  CustomerReview,
  AuditLog,
  PriceHistoryRecord,
  CustomerRecord,
  ComplaintRecord,
  PaymentRecord,
  OpsSettings,
  OpportunityLedgerEntry,
  EmployeeNotification,
  ServiceZone
} from '../types';
import { normalizeServiceItem } from '../utils/pricingEngine';

export const SERVICE_AVAILABLE_ZONES: ServiceZone[] = [
  {
    id: 'zone-sec-94',
    sector: 'Sector 94',
    name: 'Sector 94 (JLPL / Fateh Burj)',
    description: 'JLPL residential pocket, proximity to Fateh Burj & Sector 91 commercial spine',
    keyEnclaves: ['JLPL Residential Pocket', 'Fateh Burj Corridor', 'Sector 91 Commercial Spine'],
    activeArtisansCount: 8,
    avgResponseMinutes: 25
  },
  {
    id: 'zone-sec-95-97',
    sector: 'Sectors 95–97',
    name: 'Sectors 95–97 (GMADA Planned Zones)',
    description: 'GMADA planned expansion zones, residential layouts, green parks',
    keyEnclaves: ['GMADA Planned Expansion', 'Residential Layouts', 'Community Green Parks'],
    activeArtisansCount: 9,
    avgResponseMinutes: 30
  },
  {
    id: 'zone-sec-98-99',
    sector: 'Sectors 98–99',
    name: 'Sectors 98–99 (Wave Estate Extension)',
    description: 'GMADA residential plots, Wave Estate extension',
    keyEnclaves: ['GMADA Residential Plots', 'Wave Estate Extension Belts'],
    activeArtisansCount: 7,
    avgResponseMinutes: 25
  },
  {
    id: 'zone-sec-100-101',
    sector: 'Sector 100–101',
    name: 'Sector 100–101 (Plaksha Univ Corridor)',
    description: 'Institutional zone, Plaksha University corridor',
    keyEnclaves: ['Plaksha University Corridor', 'Institutional Knowledge Spine', 'IT City Boundary'],
    activeArtisansCount: 6,
    avgResponseMinutes: 30
  },
  {
    id: 'zone-sec-104',
    sector: 'Sector 104',
    name: 'Sector 104 (Emaar Mohali Hills / The Terraces)',
    description: 'Emaar Mohali Hills (The Terraces, plotted luxury belts)',
    keyEnclaves: ['Emaar Mohali Hills', 'The Terraces Luxury Floors', 'Plotted Luxury Belts'],
    activeArtisansCount: 11,
    avgResponseMinutes: 20
  },
  {
    id: 'zone-sec-105',
    sector: 'Sector 105',
    name: 'Sector 105 (Emaar Central Plaza / The Views)',
    description: 'Emaar Central Plaza, The Views, The Villas',
    keyEnclaves: ['Emaar Central Plaza', 'The Views High-Rise', 'The Villas Enclave'],
    activeArtisansCount: 12,
    avgResponseMinutes: 20
  },
  {
    id: 'zone-sec-106-107',
    sector: 'Sector 106–107',
    name: 'Sector 106–107 (Mixed Residential & Plots)',
    description: 'Mixed residential & upcoming plotted sectors',
    keyEnclaves: ['Mixed Residential Pockets', 'Upcoming Plotted Layouts', 'Aerocity Connecting Spine'],
    activeArtisansCount: 8,
    avgResponseMinutes: 30
  },
  {
    id: 'zone-sec-108',
    sector: 'Sector 108',
    name: 'Sector 108 (Emaar Mohali Hills Plots)',
    description: 'Emaar Mohali Hills plotted sectors',
    keyEnclaves: ['Emaar Mohali Hills Plotted', 'Private Villa Belts'],
    activeArtisansCount: 7,
    avgResponseMinutes: 25
  },
  {
    id: 'zone-sec-109',
    sector: 'Sector 109',
    name: 'Sector 109 (Emaar The Bungalows)',
    description: 'Emaar The Bungalows & adjoining plotted enclaves',
    keyEnclaves: ['Emaar The Bungalows', 'Adjoining Plotted Enclaves'],
    activeArtisansCount: 9,
    avgResponseMinutes: 25
  },
  {
    id: 'zone-sec-110',
    sector: 'Sector 110',
    name: 'Sector 110 (TDI City / Wellington)',
    description: 'TDI City (Wellington, plots, institutional edge)',
    keyEnclaves: ['TDI City Wellington Heights', 'Plotted Residential Sectors', 'Institutional Edge'],
    activeArtisansCount: 14,
    avgResponseMinutes: 20
  },
  {
    id: 'zone-sec-111',
    sector: 'Sector 111',
    name: 'Sector 111 (TDI Connaught Place / Tuscan)',
    description: 'TDI Connaught Place, Tuscan Residency, Landran–Banur Road junction',
    keyEnclaves: ['TDI Connaught Place', 'Tuscan Residency', 'Landran–Banur Road Junction'],
    activeArtisansCount: 12,
    avgResponseMinutes: 20
  }
];

export const LOCALITIES = SERVICE_AVAILABLE_ZONES.map((zone) => zone.name);

export const SERVICE_CATEGORIES = [
  { 
    id: 'ac-appliances', 
    name: 'AC & Appliances', 
    icon: 'Wrench', 
    count: 14, 
    popular: true,
    description: 'AC servicing, gas refills, compressor repair, and major appliances.',
    subcategories: [
      'AC Service & Repair',
      'AC Repair & Gas Refill',
      'AC Installation & Relocation',
      'Refrigerator',
      'Washing Machine',
      'RO Water Purifier',
      'Geyser'
    ]
  },
  { 
    id: 'electrical', 
    name: 'Electrical', 
    icon: 'Zap', 
    count: 2, 
    popular: true,
    description: 'Ceiling fans, switchboards, MCB trip diagnostics & lighting.',
    subcategories: ['Fans & Lights', 'Wiring & Safety', 'Inverter & Battery']
  },
  { 
    id: 'plumbing', 
    name: 'Plumbing', 
    icon: 'Droplets', 
    count: 2, 
    popular: true,
    description: 'Water motors, taps, leakages, diverters, and overhead tanks.',
    subcategories: ['Motors & Pumps', 'Bathroom & Kitchen', 'Drainage & Tanks']
  },
  { 
    id: 'carpentry', 
    name: 'Carpentry & Handyman', 
    icon: 'Hammer', 
    count: 1, 
    popular: true,
    description: 'Door locks, handles, furniture assembly, curtain rods & hinges.',
    subcategories: ['Doors & Windows', 'Furniture & Assembly', 'General Handyman']
  },
  { 
    id: 'fabrication', 
    name: 'Gate & Grill Fabrication', 
    icon: 'Hammer', 
    count: 5, 
    popular: true,
    description: 'Main gate welding, safety balcony grills, iron boundary fencing, railing repairs & motorized sliding gates.',
    subcategories: [
      'Main Gates & Railings',
      'Balcony Safety Grills',
      'Welding & Hinge Repair',
      'Window & Mesh Grills',
      'Custom Metal Enclosures'
    ]
  },
  { 
    id: 'cleaning', 
    name: 'Home Cleaning', 
    icon: 'Sparkles', 
    count: 1, 
    popular: true,
    description: 'Intense kitchen degreasing, bathroom descaling & full home care.',
    subcategories: [
      'Kitchen',
      'Bathroom',
      'Full Home & Sofa'
    ]
  },
  { 
    id: 'painting', 
    name: 'Painting & Improvement', 
    icon: 'Paintbrush', 
    count: 2, 
    popular: true,
    description: 'Damp treatment, wall touch-ups, waterproofing & full home colors.',
    subcategories: ['Wall Painting', 'Waterproofing & Damp', 'Wood Polish']
  },
  { 
    id: 'pest-control', 
    name: 'Pest Control', 
    icon: 'ShieldAlert', 
    count: 1, 
    popular: false,
    description: 'Drill-and-inject termite shield, herbal cockroach gel.',
    subcategories: ['Termite Care', 'General Pest Gel']
  },
  { 
    id: 'home-projects', 
    name: 'Home Projects', 
    icon: 'Home', 
    count: 1, 
    popular: true,
    description: 'Turnkey renovation, modular kitchens & bathroom remodeling.',
    subcategories: ['Turnkey Renovation', 'Modular Kitchens', 'Civil & Remodeling']
  },
  { 
    id: 'salon-women', 
    name: "Women's Salon", 
    icon: 'Heart', 
    count: 4, 
    popular: false,
    description: 'Facials, cleanups, waxing and hair spa by verified specialists.',
    subcategories: ['Facial & Cleanup', 'Waxing & Threading', 'Hair Care']
  },
  { 
    id: 'grooming-men', 
    name: "Men's Grooming", 
    icon: 'Scissors', 
    count: 3, 
    popular: false,
    description: 'Barber haircut, beard grooming and relaxing head massage.',
    subcategories: ['Hair & Beard', 'Massage & De-Tan']
  },
  { 
    id: 'other-services', 
    name: 'Other Services', 
    icon: 'PlusCircle', 
    count: 4, 
    popular: false,
    description: 'CCTV setup, inverter setup, solar wiring and domestic tasks.',
    subcategories: ['Security & CCTV', 'Solar & Inverter']
  },
];

const RAW_SERVICES: any[] = [
  // ==========================================
  // AC & APPLIANCES -> AC Service & Repair (SERVICE)
  // ==========================================
  {
    id: 'srv-ac-gen',
    name: 'General AC Service',
    category: 'AC & Appliances',
    subcategory: 'AC Service & Repair',
    description: 'Complete high-pressure jet spray of indoor cooling coils, outdoor condenser unit wash, air filter sanitization, drain tray clearance, and power amp draw measurement.',
    basePrice: 499,
    originalPrice: 699,
    discount: '28% OFF',
    visitFee: 99,
    pricingType: 'fixed',
    materialPolicy: 'No spare parts included. Any capacitor replacement or copper valve repair charged as per transparent retail MRP bill.',
    estimatedDuration: '45 - 60 mins',
    warranty: '30 Days Leak & Cooling Guarantee',
    included: [
      'High pressure jet pump wash of outdoor condenser unit',
      'Air filter and indoor cooling coil jet wash with jacket cover',
      'Drain tray cleanup and pipe blockage purge',
      'Operating amp draw & voltage measurement',
      'Free operating temperature differential check'
    ],
    excluded: [
      'Refrigerant gas replenishment (if leaking)',
      'Capacitor / electrical contactor replacement',
      'Bracket fabrication or high-rise scaffolding work'
    ],
    badge: 'Bestseller in Kharar',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 1,
    completedBookingsCount: 342,
    rating: 4.8,
    faqs: [
      {
        question: 'How is this different from regular hand washing?',
        answer: 'We use a commercial pressure-jet pump with protective splash jackets. Hand spraying misses 60% of the mold and dirt deep within the aluminum cooling fins.'
      },
      {
        question: 'Does this service include gas top-up?',
        answer: 'No. AC gas does not deplete under normal operation unless there is an active copper joint leak. If a leak is found, our technician performs a pressure test first.'
      }
    ],
    relatedServiceIds: ['srv-ac-foam', 'srv-ac-inspect', 'srv-ac-gas'],
    frequentlyBookedTogetherIds: ['srv-fan-repair']
  },
  {
    id: 'srv-ac-foam',
    name: 'Foam-Jet AC Service',
    category: 'AC & Appliances',
    subcategory: 'AC Service & Repair',
    description: 'Heavy-duty foaming chemical wash that removes embedded mold, nicotine & bacteria. Deeply penetrates cooling fins for maximum heat transfer and 2x cooling throw.',
    basePrice: 699,
    originalPrice: 899,
    discount: '22% OFF',
    visitFee: 99,
    pricingType: 'fixed',
    materialPolicy: 'Chemical foaming agents included. Hardware parts charged extra.',
    estimatedDuration: '60 - 75 mins',
    warranty: '45 Days Performance Warranty',
    included: [
      'Non-corrosive antibacterial foaming coil wash front and rear',
      'Blower wheel brush and pressurized spray',
      'Antibacterial sanitization treatment',
      'Outdoor condenser fins wash with comb alignment',
      'Grill and filter deep degrease'
    ],
    excluded: [
      'Freon gas top-up',
      'Copper piping insulation replacement'
    ],
    badge: 'Summer Essential',
    active: true,
    serviceAreas: ['Sector 94', 'Sectors 95–97', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 2,
    completedBookingsCount: 198,
    rating: 4.9,
    faqs: [
      {
        question: 'Is the chemical foam harmful to health or AC coils?',
        answer: 'Not at all. We use specialized non-acidic aluminum coil cleaners that dissolve dirt without corroding copper tubes or fins.'
      }
    ],
    relatedServiceIds: ['srv-ac-gen', 'srv-ac-deep', 'srv-ac-gas'],
    frequentlyBookedTogetherIds: ['srv-fan-repair', 'srv-mcb-repair']
  },
  {
    id: 'srv-ac-deep',
    name: 'Deep Cleaning (Indoor & Outdoor Disassembly)',
    category: 'AC & Appliances',
    subcategory: 'AC Service & Repair',
    description: 'Complete disassembly of the indoor front fascia, drain pan removal, and intense dual chemical bath for severely choked units.',
    basePrice: 899,
    originalPrice: 1199,
    discount: '25% OFF',
    visitFee: 99,
    pricingType: 'fixed',
    materialPolicy: 'Dual-step chemical treatment and degreasers included.',
    estimatedDuration: '75 - 90 mins',
    warranty: '60 Days Cleanliness & Odor-Free Warranty',
    included: [
      'Full front panel and drain pan unmounting',
      'Blower fan drum thorough pressure wash',
      'Deep chemical soaking of coil core',
      'Outdoor condenser coil high-pressure flush',
      'Antimicrobial duct sanitizing fog'
    ],
    excluded: [
      'Spare parts and gas refill'
    ],
    badge: 'Intense Clean',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 3,
    completedBookingsCount: 74,
    rating: 4.9,
    faqs: [
      {
        question: 'When should I choose Deep Cleaning over General Service?',
        answer: 'Choose Deep Cleaning if the AC has unpleasant foul or stale smell, has not been serviced in over 2 years, or drops black debris from the blower.'
      }
    ],
    relatedServiceIds: ['srv-ac-foam', 'srv-ac-gen'],
    frequentlyBookedTogetherIds: ['srv-kitchen-clean']
  },
  {
    id: 'srv-ac-inspect',
    name: 'AC Inspection / Diagnostic Visit',
    category: 'AC & Appliances',
    subcategory: 'AC Service & Repair',
    description: 'Precision diagnostic inspection when AC is not cooling, making grinding noise, or tripping the MCB. Electronic testing by certified technician.',
    basePrice: 199,
    originalPrice: 299,
    visitFee: 99,
    pricingType: 'inspection_fee',
    materialPolicy: 'Inspection fee is adjusted into final repair quote if service is executed on spot.',
    estimatedDuration: '30 mins',
    warranty: 'Accurate Problem Diagnostic Guarantee',
    included: [
      'Electronic refrigerant sniffer leak check',
      'Compressor start-up winding resistance check',
      'Capacitor microfarad rating measurement',
      'Transparent quote before any repair begins'
    ],
    excluded: [
      'Parts and actual repairs (quoted separately)'
    ],
    badge: 'Low Cost Diagnostic',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 4,
    completedBookingsCount: 120,
    rating: 4.7,
    faqs: [
      {
        question: 'What if I decide to get the repair done immediately?',
        answer: 'The ₹199 diagnostic fee will be fully adjusted into your repair bill; you only pay for parts and the repair itself.'
      }
    ],
    relatedServiceIds: ['srv-ac-repair', 'srv-ac-gas', 'srv-ac-leak-repair'],
    frequentlyBookedTogetherIds: ['srv-mcb-repair']
  },

  // ==========================================
  // AC & APPLIANCES -> REPAIR & GAS REFILL
  // ==========================================
  {
    id: 'srv-ac-repair',
    name: 'AC Repair & Breakdown Diagnosis',
    category: 'AC & Appliances',
    subcategory: 'AC Repair & Gas Refill',
    description: 'Diagnosis and replacement of faulty capacitor, fan motor, contactor, PCB board, sensor, or terminal wiring.',
    basePrice: 299,
    originalPrice: 450,
    visitFee: 99,
    pricingType: 'starting_from',
    materialPolicy: 'Original brand capacitors (Tibcon/Epcos) and PCB relays charged strictly at shop MRP with retail tax invoice.',
    estimatedDuration: '45 - 60 mins',
    warranty: '90 Days Spare Part Replacement Warranty',
    included: [
      'Electrical component fault isolation',
      'Old part removal and genuine part installation',
      'Cooling load stabilization test'
    ],
    excluded: [
      'Cost of replacement parts itself'
    ],
    badge: 'Same-Day Repair',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 5,
    completedBookingsCount: 165,
    rating: 4.8,
    faqs: [
      {
        question: 'Do you carry spare parts in the dispatch van?',
        answer: 'Yes! Our technician vans stationed across Sectors 94 to 111 carry standard capacitors, sensors, relays, and copper flare fittings.'
      }
    ],
    relatedServiceIds: ['srv-ac-inspect', 'srv-ac-gas', 'srv-ac-leak-repair'],
    frequentlyBookedTogetherIds: ['srv-mcb-repair']
  },
  {
    id: 'srv-ac-gas',
    name: 'AC Gas Refill & Pressure Charging',
    category: 'AC & Appliances',
    subcategory: 'AC Repair & Gas Refill',
    description: 'Complete vacuuming of copper lines, nitrogen pressure leak testing, brazing leak repair, and virgin brand refrigerant (R32 / R410A / R22) charging by weight.',
    basePrice: 1499,
    originalPrice: 2200,
    discount: '31% OFF',
    visitFee: 0,
    pricingType: 'starting_from',
    materialPolicy: '100% Virgin brand refrigerant gas (Floron/Godrej/Mafron) included with digital pressure manifold readout.',
    estimatedDuration: '60 - 90 mins',
    warranty: '90 Days Gas Leak Warranty',
    included: [
      'Nitrogen pressure hold test to detect micro-leaks',
      'Flare joint / copper pinhole brazing repair',
      'Full line vacuum with two-stage vacuum pump',
      'Precision gas charging by weight specification',
      'Free doorstep visit fee included in package'
    ],
    excluded: [
      'Extensive copper pipe replacement (if rusted throughout)'
    ],
    badge: '90-Day Gas Warranty',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 6,
    completedBookingsCount: 142,
    rating: 4.9,
    faqs: [
      {
        question: 'Why do you test with nitrogen before filling gas?',
        answer: 'Filling gas without sealing the leak causes the gas to escape again in 10-15 days. Nitrogen pressure testing guarantees leak-tight copper lines before expensive gas is charged.'
      }
    ],
    relatedServiceIds: ['srv-ac-leak-repair', 'srv-ac-foam', 'srv-ac-repair'],
    frequentlyBookedTogetherIds: ['srv-ac-foam']
  },
  {
    id: 'srv-ac-leak-repair',
    name: 'AC Water Leakage Repair',
    category: 'AC & Appliances',
    subcategory: 'AC Repair & Gas Refill',
    description: 'Fix indoor unit water dripping on floor or walls. Purging clogged drain tray, correcting slope tilt, and replacing cracked flexible drain hose.',
    basePrice: 399,
    originalPrice: 550,
    visitFee: 99,
    pricingType: 'fixed',
    materialPolicy: 'Drain line connectors and slope re-alignment included. New hose extra if needed.',
    estimatedDuration: '30 - 45 mins',
    warranty: '30 Days No-Drip Warranty',
    included: [
      'Indoor unit backplate level check',
      'Drain channel clearing and anti-algae flush',
      'Drain hose airtight joint sealing'
    ],
    excluded: [
      'Coil ice formation due to low gas (quoted under gas charge)'
    ],
    badge: 'No-Drip Guarantee',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 7,
    completedBookingsCount: 89,
    rating: 4.7,
    faqs: [
      {
        question: 'Why is my AC leaking water inside the bedroom?',
        answer: 'Usually due to algae accumulation in the drain tray or an incorrect gravity slope. In some cases, ice melts rapidly when gas is low.'
      }
    ],
    relatedServiceIds: ['srv-ac-foam', 'srv-ac-repair'],
    frequentlyBookedTogetherIds: ['srv-ac-gen']
  },

  // ==========================================
  // AC & APPLIANCES -> INSTALLATION
  // ==========================================
  {
    id: 'srv-ac-install',
    name: 'AC Split Installation',
    category: 'AC & Appliances',
    subcategory: 'AC Installation & Relocation',
    description: 'Mounting indoor unit on wall, core drilling on standard brick wall, outdoor unit stand anchoring, copper pipe flaring, vacuuming and cooling testing.',
    basePrice: 999,
    originalPrice: 1299,
    visitFee: 99,
    pricingType: 'starting_from',
    materialPolicy: 'Copper pipe, wiring, core drilling on RCC beam, or metal brackets extra if not supplied in AC box.',
    estimatedDuration: '90 - 120 mins',
    warranty: '60 Days Installation Fit & Vibration Guarantee',
    included: [
      'Indoor unit leveling and backplate mount',
      'Outdoor unit placement and rubber anti-vibration dampers',
      'Interconnecting flare joints tight torque',
      'Vacuuming line prior to gas valve release'
    ],
    excluded: [
      'New copper piping, drain pipe, outdoor wall stand'
    ],
    badge: 'Precision Mounting',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 8,
    completedBookingsCount: 88,
    rating: 4.8,
    faqs: [
      {
        question: 'Do you bring heavy-duty outdoor wall stands?',
        answer: 'Yes! Our technician can provide powder-coated anti-rust outdoor MS stands at verified market retail prices.'
      }
    ],
    relatedServiceIds: ['srv-ac-uninstall', 'srv-ac-relocate', 'srv-ac-foam'],
    frequentlyBookedTogetherIds: ['srv-fan-repair']
  },
  {
    id: 'srv-ac-uninstall',
    name: 'AC Uninstallation & Gas Pump Down',
    category: 'AC & Appliances',
    subcategory: 'AC Installation & Relocation',
    description: 'Safe pumping down of existing refrigerant into outdoor unit compressor, indoor & outdoor dismounting, and copper pipe preservation.',
    basePrice: 499,
    originalPrice: 650,
    visitFee: 99,
    pricingType: 'fixed',
    materialPolicy: 'Teflon pipe end-caps included to prevent moisture entry.',
    estimatedDuration: '45 - 60 mins',
    warranty: 'Safe Gas Retention Guarantee',
    included: [
      'Refrigerant lock pump-down technique',
      'Careful indoor unit disassembly',
      'Outdoor unit dismounting from bracket',
      'Copper piping and cable bundling'
    ],
    excluded: [
      'Transportation to new residence'
    ],
    badge: 'Safe Removal',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 110', 'Sector 111'],
    sortOrder: 9,
    completedBookingsCount: 52,
    rating: 4.8,
    faqs: [
      {
        question: 'Will uninstallation waste my AC gas?',
        answer: 'No. Our certified technician executes a professional pump-down procedure that locks 100% of the gas inside the condenser unit before disconnection.'
      }
    ],
    relatedServiceIds: ['srv-ac-install', 'srv-ac-relocate'],
    frequentlyBookedTogetherIds: ['srv-ac-install']
  },
  {
    id: 'srv-ac-relocate',
    name: 'AC Relocation Package (Within Tricity)',
    category: 'AC & Appliances',
    subcategory: 'AC Installation & Relocation',
    description: 'End-to-end uninstallation from your existing room/house, vehicle transit within Kharar-Mohali, re-installation at new home, and testing.',
    basePrice: 1399,
    originalPrice: 1899,
    visitFee: 0,
    pricingType: 'package',
    materialPolicy: 'Re-flaring joints included. New copper pipe extra if distance between indoor and outdoor unit increases.',
    estimatedDuration: '150 - 180 mins',
    warranty: '60 Days Complete Relocation Fit Warranty',
    included: [
      'Complete uninstallation & gas pump-down',
      'Re-installation at new room/house',
      'Leveling, mounting and electrical check',
      'Zero visit fee included'
    ],
    excluded: [
      'Extra copper piping beyond existing length'
    ],
    badge: 'Turnkey Move',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 10,
    completedBookingsCount: 41,
    rating: 4.9,
    faqs: [
      {
        question: 'Can you relocate from Kharar to Mohali or Zirakpur?',
        answer: 'Yes! Our operations vans service all covered residential corridors across Sectors 94 to 111 (Mohali).'
      }
    ],
    relatedServiceIds: ['srv-ac-install', 'srv-ac-foam'],
    frequentlyBookedTogetherIds: ['srv-fan-repair']
  },

  // ==========================================
  // AC & APPLIANCES -> REFRIGERATOR & OTHER APPLIANCES
  // ==========================================
  {
    id: 'srv-fridge-diag',
    name: 'Refrigerator Repair & Gas Refill',
    category: 'AC & Appliances',
    subcategory: 'Refrigerator',
    description: 'Diagnosis of zero cooling in lower compartment, excess frost in freezer, relay-overload clicking, inverter PCB fault, or compressor gas leak.',
    basePrice: 299,
    originalPrice: 450,
    visitFee: 99,
    pricingType: 'starting_from',
    materialPolicy: 'Thermostat, bi-metal sensor, defrost timer, or PTC relay charged as per genuine retail bill.',
    estimatedDuration: '45 mins',
    warranty: '60 Days Cooling & Part Warranty',
    included: [
      'Capillary tube choke check',
      'Compressor amp draw measurement',
      'Defrost heater and thermal fuse check'
    ],
    excluded: [
      'Cost of parts or gas charging'
    ],
    badge: 'Quick Diagnostic',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 11,
    completedBookingsCount: 110,
    rating: 4.8,
    faqs: [
      {
        question: 'My freezer is freezing but lower fridge is warm. What is the cause?',
        answer: 'This is usually caused by a choked air duct damper, ice buildup around the evaporator coil, or a failed defrost timer/sensor.'
      }
    ],
    relatedServiceIds: ['srv-ro-service', 'srv-wm-repair'],
    frequentlyBookedTogetherIds: ['srv-ro-service']
  },
  {
    id: 'srv-wm-repair',
    name: 'Washing Machine Drum & Motor Repair',
    category: 'AC & Appliances',
    subcategory: 'Washing Machine',
    description: 'Fix washing machine not spinning, error codes (OE/IE/dE), heavy vibrating noise during spin cycle, or water drain pump blockage.',
    basePrice: 349,
    originalPrice: 499,
    visitFee: 99,
    pricingType: 'starting_from',
    materialPolicy: 'Inlet solenoid valve, drain motor, suspension rods, or belt supplied on actual shop bill.',
    estimatedDuration: '45 - 60 mins',
    warranty: '60 Days Operational Warranty',
    included: [
      'Spin drum balance check',
      'Inlet & outlet water filter wash',
      'Motor capacitor and belt tension check'
    ],
    excluded: [
      'Cost of spare parts or drum bearing overhaul'
    ],
    badge: 'All Brands',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 12,
    completedBookingsCount: 95,
    rating: 4.7,
    faqs: [
      {
        question: 'Do you service top-load and front-load machines?',
        answer: 'Yes, our technicians service Samsung, LG, IFB, Whirlpool, Bosch, and Godrej top-load and front-load models.'
      }
    ],
    relatedServiceIds: ['srv-fridge-diag', 'srv-ro-service'],
    frequentlyBookedTogetherIds: ['srv-ro-service']
  },
  {
    id: 'srv-ro-service',
    name: 'RO Water Purifier Service & Filter Swap',
    category: 'AC & Appliances',
    subcategory: 'RO Water Purifier',
    description: 'Deep servicing of RO system: Sediment filter wash, pre-carbon replacement, RO membrane flush, TDS calibration, and booster pump pressure test.',
    basePrice: 399,
    originalPrice: 599,
    visitFee: 99,
    pricingType: 'starting_from',
    materialPolicy: 'Sediment, carbon, or 80GPD membrane charged at genuine MRP.',
    estimatedDuration: '45 mins',
    warranty: '30 Days TDS & Leak Guarantee',
    included: [
      'Pre-filter spun candle check & wash',
      'TDS test before and after filtration',
      'High-pressure auto-cut switch check',
      'Sanitization of storage tank'
    ],
    excluded: [
      'Cost of replacement filters/candles'
    ],
    badge: 'TDS Certified',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 13,
    completedBookingsCount: 175,
    rating: 4.9,
    faqs: [
      {
        question: 'What TDS level is safe for Kharar groundwater?',
        answer: 'Raw groundwater in Kharar often exceeds 600-900 ppm. Our service balances the mineral cartridge to achieve a healthy 80-150 ppm drinking TDS.'
      }
    ],
    relatedServiceIds: ['srv-water-motor', 'srv-fridge-diag'],
    frequentlyBookedTogetherIds: ['srv-water-motor']
  },
  {
    id: 'srv-geyser-repair',
    name: 'Geyser Element & Thermostat Replacement',
    category: 'AC & Appliances',
    subcategory: 'Geyser',
    description: 'Fix geyser not heating water, electric shock in bathroom tap, leaking heating element flange, or burnt thermostat wiring.',
    basePrice: 349,
    originalPrice: 499,
    visitFee: 99,
    pricingType: 'starting_from',
    materialPolicy: 'ISI-marked copper heating element and thermostat charged at retail price.',
    estimatedDuration: '45 mins',
    warranty: '60 Days Heating Element Warranty',
    included: [
      'Hard water scale descaling inside inner tank',
      'Thermal cutout safety check',
      'Earthing continuity verification to prevent electric shocks'
    ],
    excluded: [
      'Cost of new heating element or anode rod'
    ],
    badge: 'Winter Care',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 14,
    completedBookingsCount: 82,
    rating: 4.8,
    faqs: [
      {
        question: 'Why does geyser trip the MCB when switched on?',
        answer: 'Usually the copper heating element has ruptured due to hard water scaling, allowing water to touch the electric filament.'
      }
    ],
    relatedServiceIds: ['srv-mcb-repair', 'srv-tap-leak'],
    frequentlyBookedTogetherIds: ['srv-mcb-repair']
  },

  // ==========================================
  // ELECTRICAL CATEGORY
  // ==========================================
  {
    id: 'srv-fan-repair',
    name: 'Ceiling Fan Repair / Installation',
    category: 'Electrical',
    subcategory: 'Fans & Lights',
    description: 'Mounting new ceiling fan on downrod, capacitor replacement for slow spinning fan, bearing lubrication, and wobble balancing.',
    basePrice: 149,
    originalPrice: 199,
    visitFee: 99,
    pricingType: 'fixed',
    materialPolicy: 'Capacitor (₹50-80) charged at MRP if replacement needed.',
    estimatedDuration: '30 mins',
    warranty: '30 Days Smooth Operation Guarantee',
    included: [
      'Safety clamp inspection & cotter pin check',
      'Capacitor swap and winding test',
      'Silent rotational balancing'
    ],
    excluded: [
      'Ceiling hook civil anchoring work'
    ],
    badge: 'Quick 30-min Job',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 15,
    completedBookingsCount: 412,
    rating: 4.9,
    faqs: [
      {
        question: 'My fan is running very slowly on speed 5. What is the issue?',
        answer: '90% of the time, the capacitor has degraded. A quick 10-minute capacitor swap restores original high-speed air throw.'
      }
    ],
    relatedServiceIds: ['srv-mcb-repair', 'srv-ac-gen'],
    frequentlyBookedTogetherIds: ['srv-ac-gen']
  },
  {
    id: 'srv-mcb-repair',
    name: 'MCB Trip & Short Circuit Diagnosis',
    category: 'Electrical',
    subcategory: 'Wiring & Safety',
    description: 'Specialist electrician with multimeter diagnosing neutral leaks, overloading circuits, and replacing burnt MCB switches.',
    basePrice: 299,
    originalPrice: 399,
    visitFee: 99,
    pricingType: 'starting_from',
    materialPolicy: 'Replacement MCB (Havells/Schneider) charged as per retail bill.',
    estimatedDuration: '45 mins',
    warranty: '30 Days Electrical Safety Warranty',
    included: [
      'Distribution board busbar check',
      'Megger insulation resistance test',
      'Phase load distribution balancing'
    ],
    excluded: [
      'Concealed wall conduit chiseling or rewiring'
    ],
    badge: 'Urgent Safety Need',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 16,
    completedBookingsCount: 154,
    rating: 4.8,
    faqs: [
      {
        question: 'Why does my main switch trip when multiple appliances run?',
        answer: 'The MCB rating may be undersized or one phase is heavily overloaded. Our electrician balances the circuit loads across phases.'
      }
    ],
    relatedServiceIds: ['srv-fan-repair', 'srv-ac-inspect'],
    frequentlyBookedTogetherIds: ['srv-ac-inspect']
  },

  // ==========================================
  // PLUMBING CATEGORY
  // ==========================================
  {
    id: 'srv-water-motor',
    name: 'Water Motor / Submersible Pump Repair',
    category: 'Plumbing',
    subcategory: 'Motors & Pumps',
    description: 'Troubleshooting low water lift, capacitor failure, stuck impeller, foot valve failure, or automatic water level controller wiring in Kharar houses.',
    basePrice: 299,
    originalPrice: 450,
    visitFee: 99,
    pricingType: 'fixed',
    materialPolicy: 'Capacitor, non-return valve, or float switch charged on verified bill.',
    estimatedDuration: '45 mins',
    warranty: '30 Days Water Lift Warranty',
    included: [
      'Suction line air lock priming',
      'Run/Start capacitor test',
      'Terminal lead wire rewiring'
    ],
    excluded: [
      'Complete motor rewinding (workshop quote extra)'
    ],
    badge: 'Critical Kharar Need',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 17,
    completedBookingsCount: 285,
    rating: 4.9,
    faqs: [
      {
        question: 'Water motor is humming but not rotating. Can it be fixed on spot?',
        answer: 'Yes! A faulty starter capacitor or dry impeller jam is resolved on-site in 30 minutes without taking the motor to a workshop.'
      }
    ],
    relatedServiceIds: ['srv-tap-leak', 'srv-ro-service'],
    frequentlyBookedTogetherIds: ['srv-tap-leak']
  },
  {
    id: 'srv-tap-leak',
    name: 'Tap / Mixer Repair & Installation',
    category: 'Plumbing',
    subcategory: 'Bathroom & Kitchen',
    description: 'Fix dripping quarter-turn taps, wall mixer diverter repair, angle valve replacement, and teflon tape leak arrest.',
    basePrice: 149,
    originalPrice: 199,
    visitFee: 99,
    pricingType: 'fixed',
    materialPolicy: 'Ceramic disc spindle or connection pipe provided at retail cost.',
    estimatedDuration: '30 mins',
    warranty: '30 Days Leak-Free Guarantee',
    included: [
      'Spindle cartridge replacement',
      'Aerator descaling for pressure',
      'Thread sealing with loctite/teflon'
    ],
    excluded: [
      'Supply of brand new designer mixer taps'
    ],
    badge: 'Standard Fit',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 110', 'Sector 111'],
    sortOrder: 18,
    completedBookingsCount: 310,
    rating: 4.7,
    faqs: [
      {
        question: 'Do you carry ceramic spindles for Jaquar and Hindware taps?',
        answer: 'Yes, our plumbers carry half-inch and three-quarter inch brass and ceramic replacement cartridges.'
      }
    ],
    relatedServiceIds: ['srv-water-motor'],
    frequentlyBookedTogetherIds: ['srv-water-motor']
  },

  // ==========================================
  // HOME CLEANING CATEGORY
  // ==========================================
  {
    id: 'srv-kitchen-clean',
    name: 'Kitchen Deep Degreasing',
    category: 'Home Cleaning',
    subcategory: 'Kitchen',
    description: 'Intense industrial scrub of chimney baffle filters, exhaust fan, kitchen backsplash oil stains, cabinet exteriors, and granite countertops.',
    basePrice: 899,
    originalPrice: 1199,
    discount: '25% OFF',
    visitFee: 99,
    pricingType: 'fixed',
    materialPolicy: 'Professional eco-friendly degreasing agents and microfiber towels brought by team.',
    estimatedDuration: '120 mins',
    warranty: '100% Grease-Free Assurance',
    included: [
      'Chimney filter soak and steam blast',
      'Gas stove burners and knobs degrease',
      'Tiled wall grout scrub',
      'Sink and tap water-spot descaling'
    ],
    excluded: [
      'Inside empty kitchen drawers (available as add-on)'
    ],
    badge: 'Top Rated',
    active: true,
    serviceAreas: ['Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 23,
    completedBookingsCount: 178,
    rating: 4.9,
    faqs: [
      {
        question: 'Do you remove sticky mustard oil stains from tiles?',
        answer: 'Yes! We use specialized non-caustic degreasing agents with high-temperature steam that melt stubborn oil stains safely.'
      }
    ],
    relatedServiceIds: ['srv-ac-foam'],
    frequentlyBookedTogetherIds: ['srv-ac-foam']
  },

    // ==========================================
  // CARPENTRY CATEGORY
  // ==========================================
  {
    id: 'srv-door-lock',
    name: 'Door Lock & Handle Fitting',
    category: 'Carpentry & Handyman',
    subcategory: 'Doors & Windows',
    description: 'Chiseling and installation of mortise handle lock, cylindrical lock, digital keypad lock, or door closer hydraulic arm.',
    basePrice: 249,
    originalPrice: 350,
    visitFee: 99,
    pricingType: 'fixed',
    materialPolicy: 'Locks supplied by customer or sourced on actual shop bill.',
    estimatedDuration: '45 mins',
    warranty: '30 Days Latch Alignment Warranty',
    included: [
      'Mortise recess wood chiseling',
      'Striker plate precision alignment',
      'Smooth key rotation test'
    ],
    excluded: [
      'Lock hardware set itself'
    ],
    badge: 'Artisan Fit',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 110', 'Sector 111'],
    sortOrder: 20,
    completedBookingsCount: 96,
    rating: 4.8,
    faqs: [
      {
        question: 'Can you install digital smart fingerprint locks on main doors?',
        answer: 'Yes! Our master carpenters specialize in installing Godrej, Yale, and Ozone smart mortise locks with precision mortising templates.'
      }
    ],
    relatedServiceIds: ['srv-fan-repair'],
    frequentlyBookedTogetherIds: ['srv-fan-repair']
  },

  // ==========================================
  // PAINTING CATEGORY
  // ==========================================
  {
    id: 'srv-paint-touchup',
    name: 'Wall Touch-Up & Damp Treatment',
    category: 'Painting & Improvement',
    subcategory: 'Wall Painting',
    description: 'Scraping flaking paint, applying damp-proof primer, putty leveling, and 2-coat color match touch-up on saltpetre / seepage walls.',
    basePrice: 499,
    originalPrice: 650,
    visitFee: 99,
    pricingType: 'starting_from',
    materialPolicy: 'Primer and waterproof putty charged as per square foot area.',
    estimatedDuration: '90 mins',
    warranty: '6 Months Anti-Peeling Warranty',
    included: [
      'Dead plaster sanding and scraping',
      'Waterproof sealing compound application',
      'Wall putty smooth finish'
    ],
    excluded: [
      'External roof waterproofing (quoted as project)'
    ],
    badge: 'Punjab Monsoon Guard',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 110'],
    sortOrder: 21,
    completedBookingsCount: 64,
    rating: 4.7,
    faqs: [
      {
        question: 'How do you stop white salt (shora) from peeling paint in Kharar homes?',
        answer: 'We scrape down to the masonry brick, apply an anti-efflorescence chemical barrier, followed by waterproof polymer putty.'
      }
    ],
    relatedServiceIds: ['srv-kitchen-clean'],
    frequentlyBookedTogetherIds: ['srv-kitchen-clean']
  },

  // ==========================================
  // PEST CONTROL
  // ==========================================
  {
    id: 'srv-pest-termite',
    name: 'Termite Drill & Inject Shield',
    category: 'Pest Control',
    subcategory: 'Termite Care',
    description: 'Precision drilling at 1-foot intervals along skirting, chemical injection under high pressure to kill subterranean termite colonies.',
    basePrice: 1299,
    originalPrice: 1699,
    visitFee: 99,
    pricingType: 'starting_from',
    materialPolicy: 'Government-approved odorless termiticide included.',
    estimatedDuration: '120 mins',
    warranty: '1 Year Written Termite Protection Warranty',
    included: [
      'Drilling and chemical pressure pumping',
      'Color-matched white cement hole sealing',
      'Door frame inspection'
    ],
    excluded: [
      'Replacement of hollowed out wooden frames'
    ],
    badge: '1-Year Shield',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 22,
    completedBookingsCount: 82,
    rating: 4.9,
    faqs: [
      {
        question: 'Is the termite chemical safe for children and pets?',
        answer: 'Yes. We use modern odorless non-repellent termiticides (Imidacloprid/Fipronil base) that are completely safe after 2 hours of drying.'
      }
    ],
    relatedServiceIds: ['srv-door-lock'],
    frequentlyBookedTogetherIds: ['srv-door-lock']
  },

  // ==========================================
  // HOME PROJECTS (QUOTE_REQUIRED SERVICES)
  // ==========================================
  {
    id: 'srv-prj-turnkey',
    name: 'Turnkey Home Renovation & Remodel',
    category: 'Home Projects',
    subcategory: 'Turnkey Renovation',
    description: 'Complete end-to-end home renovation, false ceiling, flooring, electrical re-wiring and luxury paint. Dedicated civil engineer supervisor and transparent itemized BOQ.',
    price_type: 'QUOTE_REQUIRED',
    base_price: 0,
    visit_fee: 0,
    tax: 18,
    material_policy: 'Itemized BOQ with verified brand specs (Asian Paints, Jaquar, Greenlam, Havells). Cost-plus transparent ledger.',
    duration: 'On-site Survey 60 mins',
    warranty: '5-Year Structural Workmanship Guarantee',
    included_items: [
      'On-site laser 3D measurement and survey',
      'Detailed itemized BOQ material cost estimation',
      'Architect consultation for space optimization',
      'Zero-obligation free formal proposal'
    ],
    excluded_items: [
      'Structural alterations without society/municipal NOC'
    ],
    badge: 'Turnkey Project',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 23,
    completedBookingsCount: 19,
    rating: 4.9,
    faqs: [
      {
        question: 'Is the initial site visit and measurement chargeable?',
        answer: 'No. Our senior civil operations lead visits your home in Kharar/Mohali completely free of charge to inspect and prepare an itemized quote.'
      }
    ]
  },
  {
    id: 'srv-waterproofing-terrace',
    name: 'Terrace & Roof Elastomeric Waterproofing',
    category: 'Painting & Improvement',
    subcategory: 'Waterproofing & Damp',
    description: 'Multi-layer fiber-mesh elastomeric PU membrane coating for leaking roofs and damp ceilings in Kharar kothis and builder floors.',
    price_type: 'QUOTE_REQUIRED',
    base_price: 0,
    visit_fee: 0,
    tax: 18,
    material_policy: 'Dr. Fixit / Asian Paints SmartCare polyurethane membrane with 7-year manufacturer warranty card.',
    duration: 'Survey: 45 mins',
    warranty: '7-Year Anti-Leakage Warranty',
    included_items: [
      'Moisture meter thermal leak detection',
      'Square-footage accurate laser measurement',
      'Crack filling scope assessment',
      'Written formal quote within 4 hours'
    ],
    excluded_items: [
      'Civil parapet brick rebuilding'
    ],
    badge: '7-Year Warranty',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 24,
    completedBookingsCount: 38,
    rating: 4.8,
    faqs: [
      {
        question: 'Why is this quote required instead of a fixed rate?',
        answer: 'Terrace waterproofing requires assessing surface slope, hairline parapet cracks, and existing tiling. An accurate quote prevents surprise costs.'
      }
    ]
  },
  {
    id: 'srv-gate-weld-repair',
    name: 'Gate Hinge, Roller & Welding Repair',
    category: 'Gate & Grill Fabrication',
    subcategory: 'Welding & Hinge Repair',
    description: 'On-site electric arc welding repair for squeaking, drooping, or stuck main gates, broken heavy-duty hinges, bottom roller replacement & alignment for smooth sliding.',
    basePrice: 449,
    originalPrice: 599,
    discount: '25% OFF',
    visitFee: 0,
    pricingType: 'fixed',
    materialPolicy: 'Includes welding rods, angle grinders, and basic fastener hardware. Replacement heavy-duty rollers or hinges charged on actual MRP receipt.',
    estimatedDuration: '45 - 60 mins',
    warranty: '30-Day Workmanship Warranty',
    included: [
      'Heavy-duty electric arc welding on cracked joints or snapped brackets',
      'Gate hinge lubrication, anti-sag alignment and clearance check',
      'Bottom sliding track leveling and ball-bearing roller greasing',
      'Latch, tower bolt and drop-pin locking alignment'
    ],
    excluded: [
      'Full gate replacement or new structural steel members',
      'Enamel painting / primer touch-up across the entire gate'
    ],
    badge: 'Same-Day Urgent Dispatch',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 25,
    completedBookingsCount: 124,
    rating: 4.9,
    faqs: [
      {
        question: 'Does the technician carry their own electric welding machine and power extension cables?',
        answer: 'Yes! Our dispatch van arrives fully equipped with a portable electric arc inverter welder, heavy-duty industrial extension cord, safety shields, and angle grinders.'
      },
      {
        question: 'Can you fix heavy sliding gates that keep jumping off the track?',
        answer: 'Yes. The technician checks track debris, straightens bent guide rails, and replaces worn-out concave ball-bearing wheels on the spot.'
      }
    ],
    relatedServiceIds: ['srv-balcony-safety-grill', 'srv-main-gate-custom'],
    frequentlyBookedTogetherIds: ['srv-door-repair']
  },
  {
    id: 'srv-balcony-safety-grill',
    name: 'Balcony Safety Grill Fabrication & Fitting',
    category: 'Gate & Grill Fabrication',
    subcategory: 'Balcony Safety Grills',
    description: 'Custom heavy-gauge MS (Mild Steel) square-pipe safety grill fabrication for high-rise apartment balconies, utility areas, and child-safe window enclosures.',
    basePrice: 180,
    originalPrice: 240,
    discount: '25% OFF',
    visitFee: 0,
    pricingType: 'per_unit',
    materialPolicy: 'Includes laser site measurement, raw Jindal/Tata MS square tubes, red-oxide primer coat, anchor fasteners & on-site fitting.',
    estimatedDuration: '2 - 3 Days (Measurement + Workshop Fabrication + Install)',
    warranty: '1-Year Structural Fabrication Warranty',
    included: [
      'Doorstep measurement by fabrication engineer with design catalog',
      'Heavy-gauge 18-gauge MS square pipe / ornamental round bars',
      'Anti-rust red oxide primer dip coating',
      'High-tensile heavy anchor fasteners secured into concrete lintel'
    ],
    excluded: [
      'Civil wall plaster repair beyond anchor drill points',
      'Final high-gloss paint coat (primer included)'
    ],
    badge: 'High-Rise Apartment Special',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 26,
    completedBookingsCount: 89,
    rating: 4.8,
    faqs: [
      {
        question: 'How are prices calculated for balcony grills?',
        answer: 'Pricing is based on measured surface area (Height × Width in sq.ft) and the thickness/gauge of the MS pipes selected from our sample catalog.'
      },
      {
        question: 'Is building society / RWA permission assisted?',
        answer: 'Yes. We build according to standard society height specifications (typically 4.5 ft to 6.5 ft) compliant with Mohali high-rise bylaws.'
      }
    ],
    relatedServiceIds: ['srv-window-safety-mesh', 'srv-ss-staircase-railing']
  },
  {
    id: 'srv-main-gate-custom',
    name: 'Custom Designer Main Gate Fabrication',
    category: 'Gate & Grill Fabrication',
    subcategory: 'Main Gates & Railings',
    description: 'Bespoke modern main boundary gates for kothis and villas across Sectors 94–111. Options include laser-cut CNC metal sheet designs, wooden WPC slat inserts, wrought iron, or motorized sliding track frames.',
    basePrice: 380,
    originalPrice: 480,
    discount: '20% OFF',
    visitFee: 0,
    pricingType: 'per_unit',
    materialPolicy: 'Quoted on actual weight or sq.ft basis. Branded heavy steel sections (Tata Structura / Apollo) with computerized cutting.',
    estimatedDuration: '4 - 7 Days',
    warranty: '3-Year Structural Workmanship Warranty',
    included: [
      'Architectural design consultation & 3D catalog selection at doorstep',
      'Heavy structural frame (50x50mm or 75x40mm hollow pipes)',
      'Anti-rust epoxy primer application',
      'Heavy-duty pivot bearing hinges or imported nylon bottom wheels',
      'Civil anchor welding and plumb-line installation'
    ],
    excluded: [
      'Automated motor installation (available as addon)'
    ],
    badge: 'Villa & Kothi Special',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 27,
    completedBookingsCount: 62,
    rating: 4.9,
    faqs: [
      {
        question: 'Do you offer modern laser-cut CNC leaf/geometric patterns?',
        answer: 'Yes! We have over 120 CNC sheet designs in 2mm to 4mm sheet thickness that integrate seamlessly into heavy steel box pipe outer frames.'
      }
    ],
    relatedServiceIds: ['srv-gate-weld-repair', 'srv-ss-staircase-railing']
  },
  {
    id: 'srv-ss-staircase-railing',
    name: 'Stainless Steel (SS 304) Staircase & Balcony Railing',
    category: 'Gate & Grill Fabrication',
    subcategory: 'Main Gates & Railings',
    description: 'Rust-proof Jindal SS 304 grade mirror/matte finish pipe railings with toughened safety glass or horizontal security pipes for internal duplex stairs and terrace parapets.',
    basePrice: 420,
    originalPrice: 550,
    discount: '24% OFF',
    visitFee: 0,
    pricingType: 'per_unit',
    materialPolicy: 'Authentic Jindal SS-304 chemical acid tested with laser markings. Argon TIG welded.',
    estimatedDuration: '2 - 4 Days',
    warranty: '5-Year Anti-Rust Material Guarantee',
    included: [
      'Argon gas TIG welding with seamless blended buffing',
      'High-precision floor core-cutting and epoxy chemical anchoring',
      'Mirror or satin-matte buffed polish finish',
      'Heavy 38mm / 50mm handrail pipe with baluster posts'
    ],
    excluded: [
      'Toughened glass tinting (clear glass included if selected)'
    ],
    badge: 'Lifetime Rust Free',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 28,
    completedBookingsCount: 74,
    rating: 4.9,
    faqs: [
      {
        question: 'How do I know this is genuine Grade 304 stainless steel and not Grade 202?',
        answer: 'Our supervisor performs an on-site M2 chemical acid droplet test in front of you. Authentic 304 does not turn red/brown, guaranteeing complete rust-proofing against rainwater.'
      }
    ],
    relatedServiceIds: ['srv-balcony-safety-grill', 'srv-main-gate-custom']
  },
  {
    id: 'srv-window-safety-mesh',
    name: 'Window Security Grill & Mosquito Mesh Enclosure',
    category: 'Gate & Grill Fabrication',
    subcategory: 'Window & Mesh Grills',
    description: 'Dual-protection window frames combining burglar-proof wrought iron bars with magnetic/hinged stainless steel mosquito wire mesh frames.',
    basePrice: 145,
    originalPrice: 195,
    discount: '25% OFF',
    visitFee: 0,
    pricingType: 'per_unit',
    materialPolicy: 'Heavy iron flat/square bars + SS 304 grade invisible/mosquito wire mesh.',
    estimatedDuration: '1 - 2 Days',
    warranty: '1-Year Workmanship Warranty',
    included: [
      'Accurate window frame outer-edge measurements',
      'Iron bar safety structure with welded corner braces',
      'Removable/hinged stainless wire mesh for easy glass cleaning',
      'Heavy anchor bolt fitting into exterior brickwork/concrete'
    ],
    excluded: [
      'Wooden window frame replacement'
    ],
    badge: 'Dual Protection',
    active: true,
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    sortOrder: 29,
    completedBookingsCount: 112,
    rating: 4.8,
    faqs: [
      {
        question: 'Can this be installed on existing aluminum or UPVC sliding windows?',
        answer: 'Yes. We fabricate external brick-anchored frames that sit flush on the outside wall without drilling into your UPVC profiles.'
      }
    ],
    relatedServiceIds: ['srv-balcony-safety-grill']
  }
];

export const INITIAL_SERVICES: ServiceItem[] = RAW_SERVICES.map(normalizeServiceItem);

export const INITIAL_PRICE_HISTORY: PriceHistoryRecord[] = [
  {
    id: 'ph-1',
    serviceId: 'srv-ac-gen',
    serviceName: 'General AC Service',
    fieldChanged: 'base_price',
    oldValue: 549,
    newValue: 499,
    effectiveFrom: '2026-10-01',
    changedBy: 'Harman (Operations Lead)',
    changedAt: '2026-10-01 10:00 AM',
    reason: 'Festive season promo pricing for Kharar & Mohali residents'
  },
  {
    id: 'ph-2',
    serviceId: 'srv-ac-foam',
    serviceName: 'Foam-Jet AC Service',
    fieldChanged: 'base_price',
    oldValue: 749,
    newValue: 699,
    effectiveFrom: '2026-10-01',
    changedBy: 'Harman (Operations Lead)',
    changedAt: '2026-10-01 10:30 AM',
    reason: 'Standardized rate across Tricity service hubs'
  },
  {
    id: 'ph-3',
    serviceId: 'srv-ac-inspect',
    serviceName: 'AC Inspection / Diagnostic Visit',
    fieldChanged: 'base_price',
    oldValue: 249,
    newValue: 199,
    effectiveFrom: '2026-10-02',
    changedBy: 'Harman (Operations Lead)',
    changedAt: '2026-10-02 11:15 AM',
    reason: 'Lowered diagnostic threshold to encourage pre-repair inspections'
  },
  {
    id: 'ph-4',
    serviceId: 'srv-ac-install',
    serviceName: 'AC Split Installation',
    fieldChanged: 'base_price',
    oldValue: 1199,
    newValue: 999,
    effectiveFrom: '2026-10-03',
    changedBy: 'Harman (Operations Lead)',
    changedAt: '2026-10-03 02:45 PM',
    reason: 'Summer installation campaign demo rate'
  }
];

export const INITIAL_PACKAGES: ServicePackage[] = [
  {
    id: 'pkg-2-ac-foam',
    name: '2 AC Foam-Jet Package',
    category: 'AC & Appliances',
    category_id: 'ac-appliances',
    subcategory: 'AC Service & Repair',
    description: 'Both ACs full foaming wash + outdoor coil pressure blast + free gas pressure check. Dedicated two-artisan crew with zero doorstep fee.',
    price: 1299,
    originalPrice: 1596,
    savings: 'Save ₹297 · Zero Visit Fee',
    duration: '90 - 120 mins',
    included: [
      'Foam-jet deep wash on 2 Split ACs',
      '2 Outdoor condenser pressure blasts',
      'Freon pressure diagnostic on both units',
      'Drain tray sanitization',
      'Zero doorstep visit fee included'
    ],
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    active: true,
    pricingType: 'package',
    rating: 4.9,
    faqs: [
      {
        question: 'Can I use this for 1 Split AC and 1 Window AC?',
        answer: 'Yes! The package is valid for any combination of 2 residential AC units.'
      }
    ]
  },
  {
    id: 'pkg-ac-complete-care',
    name: 'Complete AC Care Package',
    category: 'AC & Appliances',
    category_id: 'ac-appliances',
    subcategory: 'AC Service & Repair',
    description: 'Comprehensive seasonal care: 1 Split AC foam-jet wash, outdoor unit jet blast, electrical terminal tighten, capacitor rating test, and up to 25% refrigerant gas top-up included.',
    price: 1899,
    originalPrice: 2499,
    savings: 'Save ₹600 · Gas Top-up Included',
    duration: '90 mins',
    included: [
      'Indoor antibacterial foam-jet service',
      'Outdoor condenser pressure blast',
      'Refrigerant gas top-up (up to 25% pressure deficit)',
      'Run capacitor and electrical contactor safety test',
      '60 Days Cooling Assurance'
    ],
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    active: true,
    pricingType: 'package',
    rating: 4.9,
    faqs: [
      {
        question: 'What if my AC has a complete gas leak?',
        answer: 'If the AC is completely empty (zero pressure), our technician will perform a nitrogen pressure hold test first. The package amount is adjusted into the full repair.'
      }
    ]
  },
  {
    id: 'pkg-home-elec-audit',
    name: 'Full Home Electrical Safety Audit',
    category: 'Electrical',
    category_id: 'electrical',
    subcategory: 'Wiring & Safety',
    description: 'MCB load balancing, earthing continuity test, and 12-point socket thermal check. Comprehensive inspection of switches, inverter wiring and distribution box.',
    price: 649,
    originalPrice: 999,
    savings: 'Save ₹350 · Zero Visit Fee',
    duration: '60 mins',
    included: [
      'Main distribution panel thermal inspection',
      'Earthing pit continuity test with Megger meter',
      '12 electrical switch points tight screw check',
      'Inverter battery specific gravity test',
      'Full safety report card'
    ],
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    active: true,
    pricingType: 'package',
    rating: 4.8
  },
  {
    id: 'pkg-deep-clean-combo',
    name: 'Kitchen & Bathroom Duo Clean',
    category: 'Home Cleaning',
    category_id: 'cleaning',
    subcategory: 'Kitchen',
    description: 'Both intensive wet zones: full kitchen degreasing + one complete bathroom acid-free scrub. Sanitized, descaled and sparkling clean with zero visit fee.',
    price: 1399,
    originalPrice: 1798,
    savings: 'Save ₹399 · Zero Visit Fee',
    duration: '150 mins',
    included: [
      'Kitchen degreasing & baffle chimney wash',
      '1 Master bathroom acid-free tile descaling',
      'Spotless tap polishing and mirror shine',
      'Drain siphon cleaning',
      'Zero doorstep visit fee included'
    ],
    serviceAreas: ['Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    active: true,
    pricingType: 'package',
    rating: 4.9
  }
];


export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'vnd-1',
    businessName: 'Malwa Cooling & Electricals',
    ownerName: 'Kulwinder Singh',
    mobile: '+91 94172 88412',
    email: 'malwacooling@gmail.com',
    categories: ['AC & Appliances', 'Electrical'],
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 110', 'Sector 111'],
    experienceYears: 8,
    documentsVerified: true,
    status: 'ACTIVE',
    plan: {
      name: 'Initial Demo Plan',
      price: 1499,
      totalOpportunities: 7,
      usedOpportunities: 3,
      remainingOpportunities: 4,
      validityDays: 30,
      expiryDate: '2026-11-05'
    },
    activeJobs: 1,
    completedJobs: 46,
    rating: 4.8,
    createdAt: '2026-08-15'
  },
  {
    id: 'vnd-2',
    businessName: 'Kharar Hydraulic & Sanitary Works',
    ownerName: 'Kuldeep Sharma',
    mobile: '+91 98144 33019',
    email: 'kuldeep.plumbing@gmail.com',
    categories: ['Plumbing'],
    serviceAreas: ['Sector 94', 'Sectors 98–99', 'Sector 104', 'Sector 110', 'Sector 111'],
    experienceYears: 11,
    documentsVerified: true,
    status: 'ACTIVE',
    plan: {
      name: 'Contractor Plan',
      price: 2999,
      totalOpportunities: 16,
      usedOpportunities: 11,
      remainingOpportunities: 5,
      validityDays: 30,
      expiryDate: '2026-11-12'
    },
    activeJobs: 1,
    completedJobs: 82,
    rating: 4.9,
    createdAt: '2026-07-10'
  },
  {
    id: 'vnd-3',
    businessName: 'Tricity Woodcraft & Modulars',
    ownerName: 'Balwinder Singh Sandhu',
    mobile: '+91 98881 77312',
    email: 'balwinder.carpentry@gmail.com',
    categories: ['Carpentry & Handyman', 'Home Projects'],
    serviceAreas: ['Sunny Enclave, Kharar', 'Phase 7, Mohali', 'Sector 70, Mohali'],
    experienceYears: 14,
    documentsVerified: true,
    status: 'ACTIVE',
    plan: {
      name: 'Initial Demo Plan',
      price: 1499,
      totalOpportunities: 7,
      usedOpportunities: 2,
      remainingOpportunities: 5,
      validityDays: 30,
      expiryDate: '2026-11-01'
    },
    activeJobs: 0,
    completedJobs: 34,
    rating: 4.7,
    createdAt: '2026-09-01'
  },
  {
    id: 'vnd-4',
    businessName: 'ShineMaster Cleaning Crew',
    ownerName: 'Vikas Chopra',
    mobile: '+91 97791 22811',
    email: 'shinemaster.tricity@gmail.com',
    categories: ['Home Cleaning', 'Pest Control'],
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 110', 'Sector 111'],
    experienceYears: 6,
    documentsVerified: true,
    status: 'ACTIVE',
    plan: {
      name: 'Enterprise Crew Plan',
      price: 4999,
      totalOpportunities: 30,
      usedOpportunities: 8,
      remainingOpportunities: 22,
      validityDays: 45,
      expiryDate: '2026-11-25'
    },
    activeJobs: 1,
    completedJobs: 53,
    rating: 4.9,
    createdAt: '2026-08-01'
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'Gurpreet Singh',
    mobile: '+91 98882 10452',
    password: 'TechPass@101',
    skills: ['Split AC Master', 'Inverter PCB Wiring', 'Refrigeration Lead'],
    categories: ['AC & Appliances', 'Electrical'],
    serviceAreas: ['Sector 94', 'Sector 104', 'Sector 110'],
    availability: 'AVAILABLE',
    status: 'ACTIVE',
    activeJobs: 0,
    completedJobs: 134,
    rating: 4.9,
    joinedDate: '2025-04-10',
    role: 'Senior Master Technician',
    employeeCode: 'EMP-101'
  },
  {
    id: 'emp-2',
    name: 'Harpreet "Happy" Verma',
    mobile: '+91 98721 34912',
    password: 'TechPass@102',
    skills: ['Water Motor Priming', 'Submersible Rewiring', 'Mixer Diverter'],
    categories: ['Plumbing'],
    serviceAreas: ['Sector 94', 'Sector 98–99', 'Sector 104'],
    availability: 'AVAILABLE',
    status: 'ACTIVE',
    activeJobs: 1,
    completedJobs: 98,
    rating: 4.8,
    joinedDate: '2025-06-01',
    role: 'Field Specialist',
    employeeCode: 'EMP-102'
  },
  {
    id: 'emp-3',
    name: 'Vikramjit "Vicky" Sharma',
    mobile: '+91 94631 82014',
    password: 'TechPass@103',
    skills: ['Distribution Box Wiring', 'Earthing Pit Digging', 'Lighting Specialist'],
    categories: ['Electrical'],
    serviceAreas: ['Sector 104', 'Sector 105', 'Sector 110', 'Sector 111'],
    availability: 'AVAILABLE',
    status: 'ACTIVE',
    activeJobs: 0,
    completedJobs: 112,
    rating: 4.9,
    joinedDate: '2025-05-15',
    role: 'Lead Field Supervisor',
    employeeCode: 'EMP-103'
  },
  {
    id: 'emp-4',
    name: 'Jaswant Singh Dhillon',
    mobile: '+91 98155 42918',
    password: 'TechPass@104',
    skills: ['MIG Welding', 'SS 304 Railing Fitting', 'Heavy Iron Gate Alignments', 'Safety Grills'],
    categories: ['Gate & Grill Fabrication', 'Home Projects'],
    serviceAreas: ['Sector 94', 'Sectors 95–97', 'Sector 104', 'Sector 108', 'Sector 110'],
    availability: 'AVAILABLE',
    status: 'ACTIVE',
    activeJobs: 0,
    completedJobs: 74,
    rating: 4.95,
    joinedDate: '2025-08-20',
    role: 'Fabrication Specialist',
    employeeCode: 'EMP-104'
  }
];

export const INITIAL_REQUESTS: ServiceRequest[] = [
  {
    id: 'PB-8828',
    customerName: 'Tarunpreet Singh Gill',
    customerPhone: '+91 98884 10099',
    locality: 'Sunny Enclave, Kharar',
    address: 'Kothi 318, Sector 125, Sunny Enclave, Kharar',
    landmark: 'Near Reliance Smart Point',
    requestType: 'STANDARD_SERVICE',
    items: [
      { serviceId: 'srv-ac-foam', serviceName: 'AC Foam-Jet Deep Clean', quantity: 2, price: 1398 }
    ],
    subtotal: 1398,
    visitFee: 0,
    total: 1398,
    preferredDate: 'Today',
    preferredTimeSlot: '5:00 PM - 7:00 PM',
    notes: '2 Split ACs in drawing room and master bedroom. Both blowing warm air.',
    problemDescription: 'Dual Split units not cooling. Outdoor coils clogged with dust. Customer requested high pressure foam jet wash.',
    status: 'ASSIGNED',
    assignedTo: {
      id: 'vnd-1',
      name: 'Malwa Cooling & Electricals (Kulwinder)',
      type: 'VENDOR',
      phone: '+91 94172 88412',
      rating: '4.8 ★',
      hub: 'Sunny Enclave, Kharar'
    },
    statusHistory: [
      { status: 'NEW', timestamp: '2026-10-06 10:15 AM', updatedBy: 'Customer App' },
      { status: 'UNDER REVIEW', timestamp: '2026-10-06 10:30 AM', updatedBy: 'Operations Dispatcher' },
      { status: 'READY FOR ASSIGNMENT', timestamp: '2026-10-06 10:40 AM', updatedBy: 'Operations Dispatcher' },
      { status: 'ASSIGNED', timestamp: '2026-10-06 10:45 AM', updatedBy: 'Harman (Ops Lead)', note: 'Assigned to Kulwinder Singh (Malwa Cooling). Qualified opportunity deducted.' }
    ],
    assignmentHistory: [
      {
        id: 'asg-8828',
        assignedBy: 'Harman (Ops Lead)',
        assignedTo: 'Malwa Cooling & Electricals (Kulwinder)',
        assignedToName: 'Malwa Cooling & Electricals',
        assigneeType: 'VENDOR',
        timestamp: '2026-10-06 10:45 AM',
        reason: 'Sunny Enclave zone proximity & master AC certification',
        notes: 'Carry pressure jet and indoor washing jacket'
      }
    ],
    createdAt: '2026-10-06 10:15 AM',
    updatedAt: '2026-10-06 10:45 AM',
    paymentStatus: 'PENDING_ON_COMPLETION'
  },
  {
    id: 'PB-8832',
    customerName: 'Jaspreet Brar',
    customerPhone: '+91 98761 22840',
    customerEmail: 'jaspreet.brar@gmail.com',
    locality: 'Sector 104, Mohali',
    address: 'Villa 42, The Terraces, Sector 104, Mohali',
    landmark: 'Near Ananda Greens Gate 2',
    requestType: 'STANDARD_SERVICE',
    items: [
      { serviceId: 'srv-ac-foam', serviceName: 'AC Foam-Jet Deep Clean', quantity: 1, price: 699 }
    ],
    subtotal: 699,
    visitFee: 99,
    total: 798,
    preferredDate: 'Today',
    preferredTimeSlot: '2:00 PM - 4:00 PM',
    notes: 'Please ring bell twice, front gate latch is soft.',
    problemDescription: 'Split AC air flow is weak, foul odor when cooling starts, and outdoor condenser fan vibrating.',
    supervisorInstructions: 'Operations note: Carry pressure jet gun with anti-fungal foam agent. Test indoor cooling coil delta before leaving.',
    problemPhotos: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80'
    ],
    status: 'ASSIGNED',
    assignedTo: {
      id: 'emp-1',
      name: 'Gurpreet Singh',
      type: 'EMPLOYEE',
      phone: '+91 98882 10452',
      rating: '4.9 ★',
      hub: 'Sunny Enclave Hub'
    },
    statusHistory: [
      { status: 'NEW', timestamp: '2026-10-06 11:00 AM', updatedBy: 'Customer App' },
      { status: 'READY FOR ASSIGNMENT', timestamp: '2026-10-06 11:20 AM', updatedBy: 'Operations Dispatcher' },
      { status: 'ASSIGNED', timestamp: '2026-10-06 11:30 AM', updatedBy: 'Harman (Ops Lead)', note: 'Assigned to Staff Gurpreet Singh. Customer confirmed afternoon slot.' }
    ],
    assignmentHistory: [
      {
        id: 'asg-8832',
        assignedBy: 'Harman (Ops Lead)',
        assignedTo: 'Gurpreet Singh',
        assignedToName: 'Gurpreet Singh',
        assigneeType: 'EMPLOYEE',
        timestamp: '2026-10-06 11:30 AM',
        reason: 'Master AC certified employee on Sectors 94 to 111 route',
        notes: 'Priority resident booking.'
      }
    ],
    createdAt: '2026-10-06 11:00 AM',
    updatedAt: '2026-10-06 11:30 AM',
    paymentStatus: 'PENDING_ON_COMPLETION'
  },
  {
    id: 'PB-8829',
    customerName: 'Prof. Surinder Sethi',
    customerPhone: '+91 98142 99011',
    customerEmail: 'profsethi.kharar@gmail.com',
    locality: 'Sunny Enclave, Kharar',
    address: 'House 64, Sector 125, Sunny Enclave, Kharar',
    landmark: 'Behind Oxford Street Mall',
    requestType: 'STANDARD_SERVICE',
    items: [
      { serviceId: 'srv-elec-mcb', serviceName: 'Inverter & MCB Distribution Rewiring', quantity: 1, price: 499 }
    ],
    subtotal: 499,
    visitFee: 99,
    total: 598,
    preferredDate: 'Today',
    preferredTimeSlot: '11:00 AM - 1:00 PM',
    notes: 'Doctor at home, quiet tools preferred.',
    problemDescription: 'Main MCB 32A tripping intermittently when geyser and AC turn on simultaneously.',
    supervisorInstructions: 'Operations note: Inspect distribution box busbar connections and test neutral leakage with clamp meter.',
    problemPhotos: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'
    ],
    status: 'IN PROGRESS',
    vendorArrivalStatus: 'ARRIVED',
    arrivedAt: '2026-10-06 11:15 AM',
    workStartedAt: '2026-10-06 11:25 AM',
    assignedTo: {
      id: 'emp-1',
      name: 'Gurpreet Singh',
      type: 'EMPLOYEE',
      phone: '+91 98882 10452',
      rating: '4.9 ★',
      hub: 'Sunny Enclave Hub'
    },
    statusHistory: [
      { status: 'NEW', timestamp: '2026-10-06 09:15 AM', updatedBy: 'Customer App' },
      { status: 'ASSIGNED', timestamp: '2026-10-06 09:45 AM', updatedBy: 'Harman (Ops Lead)' },
      { status: 'ACCEPTED', timestamp: '2026-10-06 10:00 AM', updatedBy: 'Gurpreet Singh (Staff App)' },
      { status: 'IN PROGRESS', timestamp: '2026-10-06 11:25 AM', updatedBy: 'Gurpreet Singh (Staff App)', note: 'Technician reached doorstep and diagnosed MCB load.' }
    ],
    assignmentHistory: [
      {
        id: 'asg-8829',
        assignedBy: 'Harman (Ops Lead)',
        assignedTo: 'Gurpreet Singh',
        assignedToName: 'Gurpreet Singh',
        assigneeType: 'EMPLOYEE',
        timestamp: '2026-10-06 09:45 AM',
        reason: 'Senior electrician needed for thermal DB audit'
      }
    ],
    createdAt: '2026-10-06 09:15 AM',
    updatedAt: '2026-10-06 11:25 AM',
    paymentStatus: 'PENDING_ON_COMPLETION'
  },
  {
    id: 'PB-8835',
    customerName: 'Gurkirat Dhillon',
    customerPhone: '+91 98880 77319',
    customerEmail: 'g.dhillon@yahoo.com',
    locality: 'Landran Road, Kharar',
    address: 'Villa 22, Green Valley, Landran Road, Kharar',
    landmark: 'Opposite CGC Landran Campus',
    requestType: 'STANDARD_SERVICE',
    items: [
      { serviceId: 'srv-ac-insp', serviceName: 'AC Inspection / Diagnostic Visit', quantity: 1, price: 199 }
    ],
    subtotal: 199,
    visitFee: 99,
    total: 298,
    preferredDate: 'Tomorrow',
    preferredTimeSlot: '10:00 AM - 12:00 PM',
    notes: 'Call before reaching, dog on premises.',
    problemDescription: 'Daikin 1.5 Ton AC not powering on via remote or manual power button.',
    supervisorInstructions: 'Operations note: Verify 230V input at terminal block. If PCB fuse blown, inspect transformer secondary winding.',
    status: 'ACCEPTED',
    assignedTo: {
      id: 'emp-1',
      name: 'Gurpreet Singh',
      type: 'EMPLOYEE',
      phone: '+91 98882 10452',
      rating: '4.9 ★',
      hub: 'Sunny Enclave Hub'
    },
    statusHistory: [
      { status: 'NEW', timestamp: '2026-10-06 10:00 AM', updatedBy: 'Customer App' },
      { status: 'ASSIGNED', timestamp: '2026-10-06 10:30 AM', updatedBy: 'Harman (Ops Lead)' },
      { status: 'ACCEPTED', timestamp: '2026-10-06 10:45 AM', updatedBy: 'Gurpreet Singh (Staff App)' }
    ],
    assignmentHistory: [
      {
        id: 'asg-8835',
        assignedBy: 'Harman (Ops Lead)',
        assignedTo: 'Gurpreet Singh',
        assignedToName: 'Gurpreet Singh',
        assigneeType: 'EMPLOYEE',
        timestamp: '2026-10-06 10:30 AM',
        reason: 'Scheduled advance dispatch for tomorrow morning'
      }
    ],
    createdAt: '2026-10-06 10:00 AM',
    updatedAt: '2026-10-06 10:45 AM',
    paymentStatus: 'PENDING_ON_COMPLETION'
  },
  {
    id: 'PB-8825',
    customerName: 'Sukhwinder Cheema',
    customerPhone: '+91 98762 33190',
    locality: 'Sunny Enclave, Kharar',
    address: 'House 522, Sector 125, Sunny Enclave, Kharar',
    landmark: 'Near Gurdwara Sahib, Sector 125',
    requestType: 'STANDARD_SERVICE',
    items: [
      { serviceId: 'srv-ac-gas', serviceName: 'AC Refrigerant Gas Charging', quantity: 1, price: 1999 }
    ],
    subtotal: 1999,
    visitFee: 0,
    total: 1999,
    preferredDate: 'Today',
    preferredTimeSlot: '3:00 PM - 5:00 PM',
    notes: 'Split AC indoor fan working but no cooling at all. Compressor line warm.',
    problemDescription: 'R32 gas leakage detected at indoor flare nut. Vacuum hold test and complete recharge needed.',
    problemPhotos: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80'
    ],
    status: 'ACCEPTED',
    assignedTo: {
      id: 'vnd-1',
      name: 'Malwa Cooling & Electricals (Kulwinder)',
      type: 'VENDOR',
      phone: '+91 94172 88412',
      rating: '4.8 ★',
      hub: 'Sunny Enclave, Kharar'
    },
    statusHistory: [
      { status: 'NEW', timestamp: '2026-10-06 09:00 AM', updatedBy: 'Customer App' },
      { status: 'READY FOR ASSIGNMENT', timestamp: '2026-10-06 09:30 AM', updatedBy: 'Operations Dispatcher' },
      { status: 'ASSIGNED', timestamp: '2026-10-06 10:00 AM', updatedBy: 'Harman (Ops Lead)' },
      { status: 'ACCEPTED', timestamp: '2026-10-06 10:30 AM', updatedBy: 'Kulwinder Singh (Partner App)', note: 'Accepted by vendor partner. Schedule confirmed.' }
    ],
    assignmentHistory: [
      {
        id: 'asg-8825',
        assignedBy: 'Harman (Ops Lead)',
        assignedTo: 'Malwa Cooling & Electricals (Kulwinder)',
        assignedToName: 'Malwa Cooling & Electricals',
        assigneeType: 'VENDOR',
        timestamp: '2026-10-06 10:00 AM',
        reason: 'Refrigerant gas vacuum specialist in Sunny Enclave',
        notes: 'Carry R32 cylinder and digital manifold gauge'
      }
    ],
    createdAt: '2026-10-06 09:00 AM',
    updatedAt: '2026-10-06 10:30 AM',
    paymentStatus: 'PENDING_ON_COMPLETION'
  },
  {
    id: 'PB-8821',
    customerName: 'Amanjot Sandhu',
    customerPhone: '+91 98721 99120',
    locality: 'Sunny Enclave, Kharar',
    address: 'House 412, Sector 125, Sunny Enclave, Kharar',
    landmark: 'Opposite Community Park',
    requestType: 'STANDARD_SERVICE',
    items: [
      { serviceId: 'srv-ac-foam', serviceName: 'AC Foam-Jet Deep Clean', quantity: 1, price: 699 }
    ],
    subtotal: 699,
    visitFee: 99,
    total: 798,
    preferredDate: 'Today',
    preferredTimeSlot: '4:00 PM - 6:00 PM',
    notes: 'Low cooling in bedroom AC. Water slowly dripping from indoor louvre.',
    status: 'UNDER REVIEW',
    assignedTo: null,
    statusHistory: [
      { status: 'NEW', timestamp: '2026-10-06 01:10 PM', updatedBy: 'Customer App', note: 'Booking submitted via instant checkout.' },
      { status: 'UNDER REVIEW', timestamp: '2026-10-06 01:25 PM', updatedBy: 'Operations Dispatcher', note: 'Customer locality coverage verified for Kharar West.' }
    ],
    assignmentHistory: [],
    createdAt: '2026-10-06 01:10 PM',
    updatedAt: '2026-10-06 01:25 PM',
    paymentStatus: 'PENDING_ON_COMPLETION',
    paymentMode: 'UPI'
  },
  {
    id: 'PB-8819',
    customerName: 'Raman Preet Kaur',
    customerPhone: '+91 98150 44211',
    locality: 'Sector 104, Mohali',
    address: 'Tower 4, Flat 602, Wellington Heights, Sector 110, Mohali',
    landmark: 'Behind Gillco Parkhills',
    requestType: 'STANDARD_SERVICE',
    items: [
      { serviceId: 'srv-water-motor', serviceName: 'Water Motor / Submersible Pump Repair', quantity: 1, price: 299 }
    ],
    subtotal: 299,
    visitFee: 99,
    total: 398,
    preferredDate: 'Tomorrow',
    preferredTimeSlot: '10:00 AM - 12:00 PM',
    notes: 'Motor humming sound, water not being lifted to overhead rooftop tank.',
    status: 'ASSIGNED',
    assignedTo: {
      id: 'vnd-2',
      name: 'Kharar Hydraulic & Sanitary Works (Kuldeep)',
      type: 'VENDOR',
      phone: '+91 98144 33019',
      rating: '4.9 ★',
      hub: 'Landran Road, Kharar'
    },
    statusHistory: [
      { status: 'NEW', timestamp: '2026-10-05 04:30 PM', updatedBy: 'Customer App', note: 'Booking submitted.' },
      { status: 'UNDER REVIEW', timestamp: '2026-10-05 04:45 PM', updatedBy: 'Operations Dispatcher', note: 'Diagnosed as pump capacitor issue.' },
      { status: 'READY FOR ASSIGNMENT', timestamp: '2026-10-05 05:00 PM', updatedBy: 'Operations Dispatcher', note: 'Queued for Sector 110 plumbing specialist.' },
      { status: 'ASSIGNED', timestamp: '2026-10-05 05:15 PM', updatedBy: 'Operations Supervisor (Harman)', note: 'Assigned to Kuldeep Sharma. Tool kit verified.' }
    ],
    assignmentHistory: [
      {
        assignedBy: 'Harman (Ops Lead)',
        assignedTo: 'Kuldeep Sharma (Kharar Hydraulic)',
        assigneeType: 'VENDOR',
        timestamp: '2026-10-05 05:15 PM',
        notes: 'Advised technician to carry spare 25uF and 36uF motor capacitors.'
      }
    ],
    createdAt: '2026-10-05 04:30 PM',
    updatedAt: '2026-10-05 05:15 PM',
    paymentStatus: 'PENDING_ON_COMPLETION'
  },
  {
    id: 'PB-8815',
    customerName: 'Simranjeet K.',
    customerPhone: '+91 97810 55012',
    locality: 'Phase 7, Mohali',
    address: 'SCF 18, Commercial Block, Phase 7, Mohali',
    requestType: 'STANDARD_SERVICE',
    items: [
      { serviceId: 'srv-kitchen-clean', serviceName: 'Kitchen Deep Degreasing', quantity: 1, price: 899 }
    ],
    subtotal: 899,
    visitFee: 99,
    total: 998,
    preferredDate: 'Today',
    preferredTimeSlot: '2:00 PM - 4:00 PM',
    notes: 'Heavy chimney mesh cleaning required.',
    status: 'IN PROGRESS',
    assignedTo: {
      id: 'vnd-4',
      name: 'ShineMaster Cleaning Crew (Vikas)',
      type: 'VENDOR',
      phone: '+91 97791 22811',
      rating: '4.9 ★',
      hub: 'Phase 7, Mohali'
    },
    statusHistory: [
      { status: 'NEW', timestamp: '2026-10-05 09:00 AM', updatedBy: 'Customer App' },
      { status: 'READY FOR ASSIGNMENT', timestamp: '2026-10-05 10:00 AM', updatedBy: 'Operations Lead' },
      { status: 'ASSIGNED', timestamp: '2026-10-05 10:30 AM', updatedBy: 'Operations Lead' },
      { status: 'IN PROGRESS', timestamp: '2026-10-06 02:10 PM', updatedBy: 'Technician Check-In', note: 'Team reached on site with steam machine.' }
    ],
    assignmentHistory: [
      {
        assignedBy: 'Harman (Ops Lead)',
        assignedTo: 'Vikas Chopra (ShineMaster)',
        assigneeType: 'VENDOR',
        timestamp: '2026-10-05 10:30 AM',
        notes: '2-person cleaning crew dispatched.'
      }
    ],
    createdAt: '2026-10-05 09:00 AM',
    updatedAt: '2026-10-06 02:10 PM',
    paymentStatus: 'PENDING_ON_COMPLETION'
  },
  {
    id: 'PB-8810',
    customerName: 'Rajinder Sharma',
    customerPhone: '+91 98880 12044',
    locality: 'Sunny Enclave, Kharar',
    address: 'House 88, Sector 125, Sunny Enclave, Kharar',
    requestType: 'STANDARD_SERVICE',
    items: [
      { serviceId: 'srv-ac-gen', serviceName: 'AC General Service', quantity: 1, price: 499 }
    ],
    subtotal: 499,
    visitFee: 99,
    total: 598,
    preferredDate: 'Yesterday',
    preferredTimeSlot: '11:00 AM',
    status: 'CUSTOMER CONFIRMED',
    assignedTo: {
      id: 'emp-1',
      name: 'Gurpreet Singh',
      type: 'EMPLOYEE',
      phone: '+91 98882 10452',
      rating: '4.9 ★',
      hub: 'Sunny Enclave Hub'
    },
    statusHistory: [
      { status: 'NEW', timestamp: '2026-10-04 10:00 AM', updatedBy: 'Customer App' },
      { status: 'ASSIGNED', timestamp: '2026-10-04 11:00 AM', updatedBy: 'Operations Lead' },
      { status: 'IN PROGRESS', timestamp: '2026-10-05 11:15 AM', updatedBy: 'Staff Gurpreet' },
      { status: 'COMPLETED', timestamp: '2026-10-05 12:05 PM', updatedBy: 'Staff Gurpreet', note: 'AC pressure washed, cooling delta 12 degrees achieved.' },
      { status: 'CUSTOMER CONFIRMED', timestamp: '2026-10-05 12:20 PM', updatedBy: 'Customer App', note: 'Payment of ₹598 collected via UPI. 5-star rating left.' }
    ],
    assignmentHistory: [
      {
        assignedBy: 'Harman (Ops Lead)',
        assignedTo: 'Gurpreet Singh',
        assigneeType: 'EMPLOYEE',
        timestamp: '2026-10-04 11:00 AM',
        notes: 'Priority sunny enclave resident.'
      }
    ],
    createdAt: '2026-10-04 10:00 AM',
    updatedAt: '2026-10-05 12:20 PM',
    paymentStatus: 'PAID',
    paymentMode: 'UPI',
    customerRating: 5,
    customerFeedback: 'Gurpreet arrived with proper pressure pump for AC servicing. Transparent pricing, no surprise bills.'
  },
  {
    id: 'PB-8830',
    customerName: 'Manpreet Dhillon',
    customerPhone: '+91 98150 11200',
    locality: 'Sunny Enclave, Kharar',
    address: 'Kothi 502, Sector 125, Kharar',
    landmark: 'Near Gillco International School',
    requestType: 'STANDARD_SERVICE',
    items: [
      { serviceId: 'srv-ac-insp', serviceName: 'AC Inspection / Diagnostic Visit', quantity: 1, price: 199, price_type: 'INSPECTION' }
    ],
    subtotal: 199,
    visitFee: 99,
    total: 298,
    preferredDate: 'Today',
    preferredTimeSlot: '6:00 PM - 8:00 PM',
    notes: 'Master bedroom Voltas 1.5T AC showing E6 error code and tripping MCB.',
    problemDescription: 'Voltas 1.5 Ton split unit trips the 16A MCB after 3 minutes of outdoor compressor start. Burning smell noticed.',
    problemPhotos: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'
    ],
    internalNotes: [
      { id: 'in-1', author: 'Harman (Ops Lead)', text: 'Customer mentioned MCB was replaced last week. Advise technician to test outdoor dual run capacitor and compressor resistance.', timestamp: '2026-10-06 02:00 PM' }
    ],
    status: 'NEW',
    assignedTo: null,
    statusHistory: [
      { status: 'NEW', timestamp: '2026-10-06 01:50 PM', updatedBy: 'Customer App', note: 'New booking awaiting manual operations review.' }
    ],
    assignmentHistory: [],
    createdAt: '2026-10-06 01:50 PM',
    updatedAt: '2026-10-06 01:50 PM',
    paymentStatus: 'PENDING_ON_COMPLETION'
  },
  {
    id: 'PB-8826',
    customerName: 'Jaswinder Kaur',
    customerPhone: '+91 98889 44321',
    locality: 'Sector 104, Mohali',
    address: 'SCO 18, TDI Connaught Place, Sector 111, Mohali',
    landmark: 'Behind Shivalik City',
    requestType: 'STANDARD_SERVICE',
    items: [
      { serviceId: 'srv-plumb-drain', serviceName: 'Drain Blockage & Tap Diverter Repair', quantity: 1, price: 349 }
    ],
    subtotal: 349,
    visitFee: 99,
    total: 448,
    preferredDate: 'Tomorrow',
    preferredTimeSlot: '11:00 AM - 1:00 PM',
    notes: 'Bathroom floor drain water overflowing. Washbasin angle valve stuck.',
    problemDescription: 'Heavy blockage in 4-inch drain pipe. Mixer tap handle loose.',
    problemPhotos: [
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80'
    ],
    internalNotes: [
      { id: 'in-2', author: 'Ritu (Dispatcher)', text: 'Verified address with customer on call. Available after 11 AM.', timestamp: '2026-10-06 12:15 PM' }
    ],
    status: 'READY FOR ASSIGNMENT',
    assignedTo: null,
    statusHistory: [
      { status: 'NEW', timestamp: '2026-10-06 11:45 AM', updatedBy: 'Customer App' },
      { status: 'UNDER REVIEW', timestamp: '2026-10-06 12:00 PM', updatedBy: 'Operations Dispatcher', note: 'Customer called and confirmed slot.' },
      { status: 'READY FOR ASSIGNMENT', timestamp: '2026-10-06 12:15 PM', updatedBy: 'Operations Dispatcher', note: 'Requires manual assignment of plumber.' }
    ],
    assignmentHistory: [],
    createdAt: '2026-10-06 11:45 AM',
    updatedAt: '2026-10-06 12:15 PM',
    paymentStatus: 'PENDING_ON_COMPLETION'
  },
  {
    id: 'PB-8824',
    customerName: 'Col. H.S. Bains',
    customerPhone: '+91 94170 33819',
    locality: 'Landran Road, Kharar',
    address: 'Kothi 12, Defence Colony, Landran Road, Kharar',
    requestType: 'STANDARD_SERVICE',
    items: [
      { serviceId: 'srv-elec-mcb', serviceName: 'Inverter & MCB Distribution Rewiring', quantity: 1, price: 499 }
    ],
    subtotal: 499,
    visitFee: 99,
    total: 598,
    preferredDate: 'Today',
    preferredTimeSlot: '4:00 PM - 6:00 PM',
    notes: 'Inverter not charging battery on mains supply. Needs urgent check before evening.',
    status: 'ACCEPTED',
    assignedTo: {
      id: 'emp-3',
      name: 'Vikramjit "Vicky" Sharma',
      type: 'EMPLOYEE',
      phone: '+91 94631 82014',
      rating: '4.9 ★',
      hub: 'Kharar Central'
    },
    statusHistory: [
      { status: 'NEW', timestamp: '2026-10-06 10:15 AM', updatedBy: 'Customer App' },
      { status: 'ASSIGNED', timestamp: '2026-10-06 10:45 AM', updatedBy: 'Operations Supervisor' },
      { status: 'ACCEPTED', timestamp: '2026-10-06 11:00 AM', updatedBy: 'Vicky Sharma (Mobile)', note: 'Artisan acknowledged slot and confirmed tool kit.' }
    ],
    assignmentHistory: [
      {
        assignedBy: 'Harman (Ops Lead)',
        assignedTo: 'Vikramjit "Vicky" Sharma',
        assigneeType: 'EMPLOYEE',
        timestamp: '2026-10-06 10:45 AM',
        notes: 'Senior citizen defence veteran, prioritized dispatch.'
      }
    ],
    createdAt: '2026-10-06 10:15 AM',
    updatedAt: '2026-10-06 11:00 AM',
    paymentStatus: 'PENDING_ON_COMPLETION'
  },
  {
    id: 'PB-8812',
    customerName: 'Gurinder Sidhu',
    customerPhone: '+91 98765 88122',
    locality: 'Gillco Valley, Kharar',
    address: 'House 78, Phase 2, Gillco Valley, Kharar',
    requestType: 'STANDARD_SERVICE',
    items: [
      { serviceId: 'srv-carp-door', serviceName: 'Door Lock & Hydraulic Closer Installation', quantity: 1, price: 399 }
    ],
    subtotal: 399,
    visitFee: 99,
    total: 498,
    preferredDate: 'Today',
    preferredTimeSlot: '5:00 PM - 7:00 PM',
    notes: 'Main wooden gate lock jammed.',
    status: 'DISPUTED',
    assignedTo: {
      id: 'vnd-3',
      name: 'Tricity Woodcraft (Balwinder)',
      type: 'VENDOR',
      phone: '+91 98881 77312',
      rating: '4.7 ★',
      hub: 'Sunny Enclave'
    },
    internalNotes: [
      { id: 'in-3', author: 'Harman (Ops Lead)', text: 'Balwinder called in reporting vehicle breakdown on Landran highway. Job requires immediate manual reassignment to another carpenter.', timestamp: '2026-10-06 01:45 PM' }
    ],
    statusHistory: [
      { status: 'NEW', timestamp: '2026-10-06 09:30 AM', updatedBy: 'Customer App' },
      { status: 'ASSIGNED', timestamp: '2026-10-06 10:00 AM', updatedBy: 'Operations Dispatcher' },
      { status: 'DISPUTED', timestamp: '2026-10-06 01:45 PM', updatedBy: 'Operations Dispatcher', note: 'Vendor reported vehicle breakdown. Reassignment required immediately.' }
    ],
    assignmentHistory: [
      {
        assignedBy: 'Harman (Ops Lead)',
        assignedTo: 'Balwinder Singh Sandhu (Tricity Woodcraft)',
        assigneeType: 'VENDOR',
        timestamp: '2026-10-06 10:00 AM',
        notes: 'Initial assignment'
      }
    ],
    createdAt: '2026-10-06 09:30 AM',
    updatedAt: '2026-10-06 01:45 PM',
    paymentStatus: 'PENDING_ON_COMPLETION'
  },
  {
    id: 'PB-8802',
    customerName: 'Navneet Sahota',
    customerPhone: '+91 98144 00119',
    locality: 'Sector 70, Mohali',
    address: 'Kothi 312, Sector 70, Mohali',
    requestType: 'STANDARD_SERVICE',
    items: [
      { serviceId: 'srv-ac-gen', serviceName: 'AC General Service', quantity: 2, price: 998 }
    ],
    subtotal: 998,
    visitFee: 0,
    total: 998,
    preferredDate: '2026-10-04',
    preferredTimeSlot: '10:00 AM',
    notes: 'Customer had to travel unexpectedly to Amritsar.',
    status: 'CANCELLED',
    assignedTo: null,
    statusHistory: [
      { status: 'NEW', timestamp: '2026-10-03 04:00 PM', updatedBy: 'Customer App' },
      { status: 'CANCELLED', timestamp: '2026-10-03 07:00 PM', updatedBy: 'Customer App', note: 'Cancelled by customer before technician dispatch.' }
    ],
    assignmentHistory: [],
    createdAt: '2026-10-03 04:00 PM',
    updatedAt: '2026-10-03 07:00 PM',
    paymentStatus: 'PENDING_ON_COMPLETION'
  },
  {
    id: 'PB-8811',
    customerName: 'Harpreet Singh Walia',
    customerPhone: '+91 98881 22904',
    customerEmail: 'harpreet.walia@gmail.com',
    locality: 'Sector 104, Mohali',
    address: 'Flat 502, The Views, Sector 105, Mohali',
    landmark: 'Opposite State Bank of India',
    requestType: 'STANDARD_SERVICE',
    items: [
      { serviceId: 'srv-ac-pcb', serviceName: 'Inverter AC PCB Circuit Board Repair', quantity: 1, price: 1499 }
    ],
    subtotal: 1499,
    visitFee: 99,
    total: 1598,
    preferredDate: '2026-10-04',
    preferredTimeSlot: '03:00 PM',
    notes: 'Inverter AC Outdoor error code E4. Compressor not powering up.',
    problemDescription: 'Outdoor IPM module optical coupler fault rectified. Capacitor replaced.',
    status: 'COMPLETED',
    assignedTo: {
      id: 'vnd-1',
      name: 'Malwa Cooling & Electricals (Kulwinder)',
      type: 'VENDOR',
      phone: '+91 94172 88412',
      rating: '4.8 ★',
      hub: 'Sunny Enclave, Kharar'
    },
    statusHistory: [
      { status: 'NEW', timestamp: '2026-10-04 02:30 PM', updatedBy: 'Customer App' },
      { status: 'ASSIGNED', timestamp: '2026-10-04 03:15 PM', updatedBy: 'Harman (Ops Lead)' },
      { status: 'ACCEPTED', timestamp: '2026-10-04 03:20 PM', updatedBy: 'Kulwinder Singh' },
      { status: 'IN PROGRESS', timestamp: '2026-10-04 04:00 PM', updatedBy: 'Kulwinder Singh' },
      { status: 'COMPLETED', timestamp: '2026-10-04 05:15 PM', updatedBy: 'Kulwinder Singh', note: 'PCB repaired on-site, test runs fine.' }
    ],
    assignmentHistory: [
      {
        id: 'asg-8811',
        assignedBy: 'Harman (Ops Lead)',
        assignedTo: 'Malwa Cooling & Electricals (Kulwinder)',
        assignedToName: 'Malwa Cooling & Electricals',
        assigneeType: 'VENDOR',
        timestamp: '2026-10-04 03:15 PM',
        reason: 'Inverter PCB specialist'
      }
    ],
    completionPhotos: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'
    ],
    vendorNotes: [
      'IPM board optical coupler replaced. Full 5.8A power consumption verified with clamp meter.'
    ],
    createdAt: '2026-10-04 02:30 PM',
    updatedAt: '2026-10-04 05:15 PM',
    paymentStatus: 'PAID',
    paymentMode: 'UPI',
    customerRating: 5,
    customerFeedback: 'Kulwinder quickly diagnosed the outdoor IPM inverter module error and fixed the capacitor on-site. AC cooling like new.'
  },
  {
    id: 'PB-8801',
    customerName: 'Manmohan Bains',
    customerPhone: '+91 98141 55670',
    customerEmail: 'mbains.kharar@yahoo.com',
    locality: 'Sunny Enclave, Kharar',
    address: 'Kothi 94, Sector 125, Kharar',
    landmark: 'Near DESU Office',
    requestType: 'STANDARD_SERVICE',
    items: [
      { serviceId: 'srv-ac-foam', serviceName: 'AC Foam-Jet Deep Clean', quantity: 1, price: 699 }
    ],
    subtotal: 699,
    visitFee: 99,
    total: 798,
    preferredDate: '2026-10-02',
    preferredTimeSlot: '11:00 AM',
    notes: 'Seasonal foam wash for 1 Split AC.',
    status: 'COMPLETED',
    assignedTo: {
      id: 'vnd-1',
      name: 'Malwa Cooling & Electricals (Kulwinder)',
      type: 'VENDOR',
      phone: '+91 94172 88412',
      rating: '4.8 ★',
      hub: 'Sunny Enclave, Kharar'
    },
    statusHistory: [
      { status: 'NEW', timestamp: '2026-10-02 10:45 AM', updatedBy: 'Customer App' },
      { status: 'ASSIGNED', timestamp: '2026-10-02 11:30 AM', updatedBy: 'Harman (Ops Lead)' },
      { status: 'ACCEPTED', timestamp: '2026-10-02 11:35 AM', updatedBy: 'Kulwinder Singh' },
      { status: 'COMPLETED', timestamp: '2026-10-02 01:00 PM', updatedBy: 'Kulwinder Singh' }
    ],
    assignmentHistory: [
      {
        id: 'asg-8801',
        assignedBy: 'Harman (Ops Lead)',
        assignedTo: 'Malwa Cooling & Electricals (Kulwinder)',
        assignedToName: 'Malwa Cooling & Electricals',
        assigneeType: 'VENDOR',
        timestamp: '2026-10-02 11:30 AM',
        reason: 'Regular AC servicing dispatch'
      }
    ],
    completionPhotos: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80'
    ],
    vendorNotes: [
      'Cleaned indoor cooling coils with antibacterial foam. Outdoor pressure washed.'
    ],
    createdAt: '2026-10-02 10:45 AM',
    updatedAt: '2026-10-02 01:00 PM',
    paymentStatus: 'PAID',
    paymentMode: 'CASH',
    customerRating: 5,
    customerFeedback: 'Great service. Foam jet cleaned out heavy dust build-up. Very polite technician.'
  }
];

export const INITIAL_CUSTOMERS: CustomerRecord[] = [
  {
    id: 'cust-1',
    name: 'Amanjot Sandhu',
    phone: '+91 98721 99120',
    email: 'amanjot.sandhu@gmail.com',
    password: 'Resident@123',
    locality: 'Sunny Enclave, Kharar',
    address: 'House 412, Sector 125, Sunny Enclave, Kharar',
    totalBookings: 3,
    totalSpent: 2850,
    registeredDate: '2026-07-14',
    status: 'VIP'
  },
  {
    id: 'cust-2',
    name: 'Raman Preet Kaur',
    phone: '+91 98150 44211',
    email: 'ramanpreet.k@outlook.com',
    password: 'Resident@123',
    locality: 'Sector 104, Mohali',
    address: 'Tower 4, Flat 602, Wellington Heights, Sector 110, Mohali',
    totalBookings: 2,
    totalSpent: 1196,
    registeredDate: '2026-08-20',
    status: 'ACTIVE'
  },
  {
    id: 'cust-3',
    name: 'Rajinder Sharma',
    phone: '+91 98880 12044',
    email: 'rsharma.pb@yahoo.com',
    password: 'Resident@123',
    locality: 'Sunny Enclave, Kharar',
    address: 'House 88, Sector 125, Sunny Enclave, Kharar',
    totalBookings: 4,
    totalSpent: 3490,
    registeredDate: '2026-06-10',
    status: 'VIP'
  },
  {
    id: 'cust-4',
    name: 'Col. H.S. Bains',
    phone: '+91 94170 33819',
    email: 'colbains.ret@gmail.com',
    password: 'Resident@123',
    locality: 'Landran Road, Kharar',
    address: 'Kothi 12, Defence Colony, Landran Road, Kharar',
    totalBookings: 1,
    totalSpent: 598,
    registeredDate: '2026-10-01',
    status: 'ACTIVE'
  },
  {
    id: 'cust-5',
    name: 'Dr. Paramjit Grewal',
    phone: '+91 98140 77123',
    email: 'drparamjitg@gmail.com',
    password: 'Resident@123',
    locality: 'Sector 104, Mohali',
    address: 'Villa 18, The Bungalows, Sector 109, Mohali',
    totalBookings: 2,
    totalSpent: 12500,
    registeredDate: '2026-05-18',
    status: 'VIP'
  }
];

export const INITIAL_COMPLAINTS: ComplaintRecord[] = [
  {
    id: 'cmp-101',
    requestId: 'PB-8812',
    customerName: 'Gurinder Sidhu',
    customerPhone: '+91 98765 88122',
    artisanName: 'Balwinder Singh Sandhu (Vendor)',
    issueType: 'DELAY',
    description: 'Technician was delayed by over 90 minutes past the scheduled 5 PM slot.',
    severity: 'MEDIUM',
    status: 'INVESTIGATING',
    resolutionNotes: 'Artisan suffered vehicle breakdown. Operations supervisor arranging immediate replacement artisan.',
    createdAt: '2026-10-06 01:50 PM'
  },
  {
    id: 'cmp-098',
    requestId: 'PB-8750',
    customerName: 'Neeraj Walia',
    customerPhone: '+91 98722 55104',
    artisanName: 'Vikramjit Sharma (Staff)',
    issueType: 'OVERCHARGING',
    description: 'Customer inquired why extra ₹150 was added for 25-meter wire reel.',
    severity: 'LOW',
    status: 'RESOLVED',
    resolutionNotes: 'Operations reviewed original Havells wire receipt; confirmed genuine material cost. Shared invoice with customer.',
    createdAt: '2026-10-03 11:30 AM',
    resolvedAt: '2026-10-03 02:15 PM'
  }
];

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-701',
    requestId: 'PB-8810',
    customerName: 'Rajinder Sharma',
    amount: 598,
    mode: 'UPI',
    status: 'SUCCESS',
    transactionRef: 'UPI-9821049210-ICICI',
    collectedBy: 'Gurpreet Singh (Staff Employee)',
    date: '2026-10-05 12:20 PM'
  },
  {
    id: 'pay-700',
    requestId: 'PB-8790',
    customerName: 'Simranjeet K.',
    amount: 498,
    mode: 'CASH',
    status: 'SUCCESS',
    transactionRef: 'CASH-REC-8790',
    collectedBy: 'Kuldeep Sharma (Vendor Partner)',
    date: '2026-10-04 04:15 PM'
  },
  {
    id: 'pay-699',
    requestId: 'PB-8762',
    customerName: 'Harinder Singh',
    amount: 749,
    mode: 'UPI',
    status: 'SUCCESS',
    transactionRef: 'UPI-4491028471-HDFC',
    collectedBy: 'Vicky Sharma (Staff Employee)',
    date: '2026-10-02 03:00 PM'
  }
];

export const INITIAL_OPS_SETTINGS: OpsSettings = [
  {
    dispatchCenterName: 'UrbanCare Solution Operations Command Hub - Kharar Central',
    emergencyHotline: '+91 98889 00122',
    supportEmail: 'ops@urbancaresolution.in',
    defaultVisitFee: 99,
    defaultGstPercent: 18,
    requireSupervisorSignoff: true,
    autoSmsNotifications: true,
    serviceRadiusKm: 25,
    operatingHours: '08:00 AM - 08:30 PM (7 Days a Week)',
    activeLocalities: [
      'Sunny Enclave, Kharar',
      'Sector 104, Mohali',
      'Landran Road, Kharar',
      'Gillco Valley, Kharar',
      'Phase 7, Mohali',
      'Sector 70, Mohali',
      'VIP Road, Zirakpur'
    ]
  }
][0];

export const INITIAL_PROJECT_REQUESTS: HomeProjectRequest[] = [
  {
    id: 'PRJ-401',
    customerName: 'Dr. Paramjit Grewal',
    customerPhone: '+91 98140 77123',
    locality: 'Sector 104, Mohali',
    address: 'Villa 18, The Bungalows, Sector 109, Mohali',
    projectType: 'Modular Kitchen Fabrication',
    propertyType: 'Independent Kothi',
    approxAreaSqFt: 180,
    budgetRange: 'Standard Tricity (₹1.5 Lakh - ₹4 Lakh)',
    preferredStartDate: 'Within 2 Weeks',
    description: 'L-shaped acrylic finish modular kitchen with tandem drawers, quartz countertop, and chimney ducting through exterior wall.',
    status: 'SITE_VISIT_SCHEDULED',
    assignedSupervisor: 'Balwinder Singh Sandhu (Master Carpenter)',
    notes: 'Site measurement scheduled for Wednesday 4:00 PM.',
    createdAt: '2026-10-04 03:00 PM'
  },
  {
    id: 'PRJ-398',
    customerName: 'Navjot Cheema',
    customerPhone: '+91 98760 99014',
    locality: 'Sunny Enclave, Kharar',
    address: 'Kothi 210, Sector 125, Kharar',
    projectType: 'Full Flat Renovation',
    propertyType: 'Builder Floor (3BHK)',
    approxAreaSqFt: 1450,
    budgetRange: 'Premium Architectural (₹4 Lakh - ₹10 Lakh+)',
    preferredStartDate: 'Next Month',
    description: 'Complete false ceiling with profile lighting, luxury bathroom tile replacement, and Asian Paints Royale luxury emulsion on all rooms.',
    status: 'UNDER_REVIEW',
    notes: 'Operations reviewing layout drawings and material preferences.',
    createdAt: '2026-10-05 06:30 PM'
  }
];

export const INITIAL_REVIEWS: CustomerReview[] = [
  {
    id: 'rev-1',
    requestId: 'PB-8810',
    customerName: 'Rajinder Sharma',
    locality: 'Sunny Enclave, Kharar',
    serviceName: 'AC General Service',
    technicianName: 'Gurpreet Singh',
    rating: 5,
    review: 'Gurpreet arrived with proper pressure pump for AC servicing. Transparent pricing, no surprise bills.',
    timestamp: 'Yesterday'
  },
  {
    id: 'rev-2',
    requestId: 'PB-8790',
    customerName: 'Simranjeet K.',
    locality: 'Sector 104, Mohali',
    serviceName: 'Water Motor / Pump Repair',
    technicianName: 'Kuldeep Sharma',
    rating: 5,
    review: 'Water motor capacitor repaired within 45 mins. Operations verified the bill before work started.',
    timestamp: '2 days ago'
  },
  {
    id: 'rev-3',
    requestId: 'PB-8762',
    customerName: 'Harinder Singh',
    locality: 'Landran Road, Kharar',
    serviceName: 'Ceiling Fan Repair / Install',
    technicianName: 'Vicky Sharma',
    rating: 5,
    review: 'Installed 3 fans cleanly with balanced blades. No wobbling, reasonable visit charge.',
    timestamp: '4 days ago'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    action: 'STATUS_CHANGE',
    entityType: 'SERVICE_REQUEST',
    entityId: 'PB-8821',
    details: 'Changed status from NEW to UNDER REVIEW',
    performedBy: 'Operations Dispatcher (Kharar Central)',
    timestamp: '2026-10-06 01:25 PM'
  },
  {
    id: 'aud-2',
    action: 'MANUAL_ASSIGNMENT',
    entityType: 'SERVICE_REQUEST',
    entityId: 'PB-8819',
    details: 'Assigned to Kuldeep Sharma (Kharar Hydraulic). Deducted 1 Work Opportunity from Vendor Plan.',
    performedBy: 'Harman (Ops Lead)',
    timestamp: '2026-10-05 05:15 PM'
  },
  {
    id: 'aud-3',
    action: 'OPPORTUNITY_ADJUSTMENT',
    entityType: 'OPPORTUNITY',
    entityId: 'vnd-1',
    details: 'Added +1 Work Opportunity due to genuine client reschedule without fault.',
    performedBy: 'Harman (Ops Lead)',
    timestamp: '2026-10-04 02:00 PM'
  }
];

export const INITIAL_OPPORTUNITY_LEDGER: OpportunityLedgerEntry[] = [
  {
    id: 'led-101',
    vendorId: 'vnd-1',
    vendorName: 'Malwa Cooling & Electricals',
    action: 'PLAN_PURCHASE',
    change: 7,
    balanceAfter: 7,
    reason: 'Monthly Plan Subscription: Standard Pro Plan (₹1,500 for 7 opportunities)',
    performedBy: 'Operations Billing System',
    timestamp: '2026-10-01 09:00 AM'
  },
  {
    id: 'led-102',
    vendorId: 'vnd-1',
    vendorName: 'Malwa Cooling & Electricals',
    action: 'OPPORTUNITY_CONSUMED',
    change: -1,
    balanceAfter: 6,
    reason: 'Manual supervisor assignment for PB-8801 (Sunny Enclave AC Care)',
    performedBy: 'Harman (Ops Lead)',
    timestamp: '2026-10-02 11:30 AM',
    serviceRequestId: 'PB-8801'
  },
  {
    id: 'led-103',
    vendorId: 'vnd-1',
    vendorName: 'Malwa Cooling & Electricals',
    action: 'OPPORTUNITY_CONSUMED',
    change: -1,
    balanceAfter: 5,
    reason: 'Manual supervisor assignment for PB-8811 (Sector 104 Split AC)',
    performedBy: 'Harman (Ops Lead)',
    timestamp: '2026-10-04 03:15 PM',
    serviceRequestId: 'PB-8811'
  },
  {
    id: 'led-104',
    vendorId: 'vnd-1',
    vendorName: 'Malwa Cooling & Electricals',
    action: 'OPPORTUNITY_CONSUMED',
    change: -1,
    balanceAfter: 4,
    reason: 'Manual supervisor assignment for PB-8828 (Sunny Enclave 2 AC Clean)',
    performedBy: 'Harman (Ops Lead)',
    timestamp: '2026-10-06 10:45 AM',
    serviceRequestId: 'PB-8828'
  }
];

export const INITIAL_EMPLOYEE_NOTIFICATIONS: EmployeeNotification[] = [
  {
    id: 'notif-1',
    employeeId: 'emp-1',
    title: 'New Service Job Assigned',
    message: 'Harman (Ops Lead) manually assigned order PB-8832 (Sunny Enclave AC Care) to you for 2:00 PM today.',
    timestamp: '2026-10-06 11:30 AM',
    requestId: 'PB-8832',
    read: false,
    type: 'ASSIGNMENT'
  },
  {
    id: 'notif-2',
    employeeId: 'emp-1',
    title: 'Spare Parts Requisition Ready',
    message: 'Dual 45uF capacitor and foam jet nozzle issued from Kharar Central Store.',
    timestamp: '2026-10-06 10:15 AM',
    read: true,
    type: 'ALERT'
  },
  {
    id: 'notif-3',
    employeeId: 'emp-1',
    title: 'Customer Note Attached',
    message: 'Jaspreet Brar requested doorbell ring twice rather than knocking.',
    timestamp: '2026-10-06 11:05 AM',
    requestId: 'PB-8832',
    read: false,
    type: 'ALERT'
  },
  {
    id: 'notif-4',
    employeeId: 'emp-3',
    title: 'Defence Colony Urgent Dispatch',
    message: 'Col. Bains inverter rewiring job PB-8824 assigned to you. Priority dispatch.',
    timestamp: '2026-10-06 10:45 AM',
    requestId: 'PB-8824',
    read: false,
    type: 'ASSIGNMENT'
  }
];

