-- ==============================================================================
-- PindCare (UrbanCare Solution) - Production Database Seed Data
-- Location: Kharar, Greater Mohali, Punjab (Sectors 94 to 111)
-- Description: Production-essential foundation data (ops settings, service
--              categories, 29 official services, and 4 care packages).
--              Contains NO mock users, NO demo employees/vendors, and NO test bookings.
-- ==============================================================================

-- 1. Operations Settings (System Default Configuration)
INSERT INTO public.ops_settings (id, auto_assignment_enabled, emergency_contact, dispatch_coverage_radius_km)
VALUES ('ops-config', TRUE, '+91 98889 00122', 12.5)
ON CONFLICT (id) DO NOTHING;

-- 3. Synchronize Service Categories
INSERT INTO public.service_categories (id, name, icon, description, display_order) VALUES
('ac-appliances', 'AC & Appliances', 'Wrench', 'AC servicing, gas refills, compressor repair, and major appliances.', 1),
('electrical', 'Electrical', 'Zap', 'Ceiling fans, switchboards, MCB trip diagnostics & lighting.', 2),
('plumbing', 'Plumbing', 'Droplets', 'Water motors, taps, leakages, diverters, and overhead tanks.', 3),
('carpentry', 'Carpentry & Handyman', 'Hammer', 'Door locks, handles, furniture assembly, curtain rods & hinges.', 4),
('fabrication', 'Gate & Grill Fabrication', 'Hammer', 'Main gate welding, safety balcony grills, iron boundary fencing, railing repairs & motorized sliding gates.', 5),
('cleaning', 'Home Cleaning', 'Sparkles', 'Intense kitchen degreasing, bathroom descaling & full home care.', 6),
('painting', 'Painting & Improvement', 'Paintbrush', 'Damp treatment, wall touch-ups, waterproofing & full home colors.', 7),
('pest-control', 'Pest Control', 'ShieldAlert', 'Drill-and-inject termite shield, herbal cockroach gel.', 8),
('home-projects', 'Home Projects', 'Home', 'Turnkey renovation, modular kitchens & bathroom remodeling.', 9),
('cat-ac', 'AC & Appliances', 'Wrench', 'AC servicing, gas refills, compressor repair, and major appliances.', 1),
('cat-elec', 'Electrical', 'Zap', 'Ceiling fans, switchboards, MCB trip diagnostics & lighting.', 2),
('cat-plumb', 'Plumbing', 'Droplets', 'Water motors, taps, leakages, diverters, and overhead tanks.', 3),
('cat-carp', 'Carpentry & Handyman', 'Hammer', 'Door locks, handles, furniture assembly, curtain rods & hinges.', 4),
('cat-clean', 'Home Cleaning', 'Sparkles', 'Intense kitchen degreasing, bathroom descaling & full home care.', 6),
('cat-paint', 'Painting & Improvement', 'Paintbrush', 'Damp treatment, wall touch-ups, waterproofing & full home colors.', 7)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order;

-- 4. Remove all obsolete/mock services not in the official rate card
DELETE FROM public.services WHERE id NOT IN ('srv-ac-install', 'srv-ac-uninstall', 'srv-ac-relocate', 'srv-ac-repair', 'srv-ac-gas', 'srv-ac-leak-repair', 'srv-ac-gen', 'srv-ac-foam', 'srv-ac-deep', 'srv-ac-inspect', 'srv-geyser-repair', 'srv-ro-service', 'srv-fridge-diag', 'srv-wm-repair', 'srv-door-lock', 'srv-fan-repair', 'srv-mcb-repair', 'srv-balcony-safety-grill', 'srv-main-gate-custom', 'srv-ss-staircase-railing', 'srv-gate-weld-repair', 'srv-window-safety-mesh', 'srv-kitchen-clean', 'srv-prj-turnkey', 'srv-paint-touchup', 'srv-waterproofing-terrace', 'srv-pest-termite', 'srv-tap-leak', 'srv-water-motor');

-- 5. Upsert the 29 official services from Explore Services & Rates
INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-ac-install', 'ac-appliances', 'AC Split Installation', 'AC Installation & Relocation', 999.0, 1299.0, 'starting_from',
    NULL, 99.0, '23% OFF',
    '90 - 120 mins', '60 Days Installation Fit & Vibration Guarantee', 'Copper pipe, wiring, core drilling on RCC beam, or metal brackets extra if not supplied in AC box.', 'Precision Mounting', 4.8, 'Mounting indoor unit on wall, core drilling on standard brick wall, outdoor unit stand anchoring, copper pipe flaring, vacuuming and cooling testing.',
    '["Indoor unit leveling and backplate mount", "Outdoor unit placement and rubber anti-vibration dampers", "Interconnecting flare joints tight torque", "Vacuuming line prior to gas valve release"]'::jsonb, '["New copper piping, drain pipe, outdoor wall stand"]'::jsonb, 1, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-ac-uninstall', 'ac-appliances', 'AC Uninstallation & Gas Pump Down', 'AC Installation & Relocation', 499.0, 650.0, 'fixed',
    NULL, 99.0, '23% OFF',
    '45 - 60 mins', 'Safe Gas Retention Guarantee', 'Teflon pipe end-caps included to prevent moisture entry.', 'Safe Removal', 4.8, 'Safe pumping down of existing refrigerant into outdoor unit compressor, indoor & outdoor dismounting, and copper pipe preservation.',
    '["Refrigerant lock pump-down technique", "Careful indoor unit disassembly", "Outdoor unit dismounting from bracket", "Copper piping and cable bundling"]'::jsonb, '["Transportation to new residence"]'::jsonb, 2, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-ac-relocate', 'ac-appliances', 'AC Relocation Package (Within Tricity)', 'AC Installation & Relocation', 1399.0, 1899.0, 'package',
    NULL, 0.0, '26% OFF',
    '150 - 180 mins', '60 Days Complete Relocation Fit Warranty', 'Re-flaring joints included. New copper pipe extra if distance between indoor and outdoor unit increases.', 'Turnkey Move', 4.9, 'End-to-end uninstallation from your existing room/house, vehicle transit within Kharar-Mohali, re-installation at new home, and testing.',
    '["Complete uninstallation & gas pump-down", "Re-installation at new room/house", "Leveling, mounting and electrical check", "Zero visit fee included"]'::jsonb, '["Extra copper piping beyond existing length"]'::jsonb, 3, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-ac-repair', 'ac-appliances', 'AC Repair & Breakdown Diagnosis', 'AC Repair & Gas Refill', 299.0, 450.0, 'starting_from',
    NULL, 99.0, '34% OFF',
    '45 - 60 mins', '90 Days Spare Part Replacement Warranty', 'Original brand capacitors (Tibcon/Epcos) and PCB relays charged strictly at shop MRP with retail tax invoice.', 'Same-Day Repair', 4.8, 'Diagnosis and replacement of faulty capacitor, fan motor, contactor, PCB board, sensor, or terminal wiring.',
    '["Electrical component fault isolation", "Old part removal and genuine part installation", "Cooling load stabilization test"]'::jsonb, '["Cost of replacement parts itself"]'::jsonb, 4, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-ac-gas', 'ac-appliances', 'AC Gas Refill & Pressure Charging', 'AC Repair & Gas Refill', 1499.0, 2200.0, 'starting_from',
    NULL, 0.0, '31% OFF',
    '60 - 90 mins', '90 Days Gas Leak Warranty', '100% Virgin brand refrigerant gas (Floron/Godrej/Mafron) included with digital pressure manifold readout.', '90-Day Gas Warranty', 4.9, 'Complete vacuuming of copper lines, nitrogen pressure leak testing, brazing leak repair, and virgin brand refrigerant (R32 / R410A / R22) charging by weight.',
    '["Nitrogen pressure hold test to detect micro-leaks", "Flare joint / copper pinhole brazing repair", "Full line vacuum with two-stage vacuum pump", "Precision gas charging by weight specification", "Free doorstep visit fee included in package"]'::jsonb, '["Extensive copper pipe replacement (if rusted throughout)"]'::jsonb, 5, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-ac-leak-repair', 'ac-appliances', 'AC Water Leakage Repair', 'AC Repair & Gas Refill', 399.0, 550.0, 'fixed',
    NULL, 99.0, '27% OFF',
    '30 - 45 mins', '30 Days No-Drip Warranty', 'Drain line connectors and slope re-alignment included. New hose extra if needed.', 'No-Drip Guarantee', 4.7, 'Fix indoor unit water dripping on floor or walls. Purging clogged drain tray, correcting slope tilt, and replacing cracked flexible drain hose.',
    '["Indoor unit backplate level check", "Drain channel clearing and anti-algae flush", "Drain hose airtight joint sealing"]'::jsonb, '["Coil ice formation due to low gas (quoted under gas charge)"]'::jsonb, 6, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-ac-gen', 'ac-appliances', 'General AC Service', 'AC Service & Repair', 499.0, 699.0, 'fixed',
    NULL, 99.0, '28% OFF',
    '45 - 60 mins', '30 Days Leak & Cooling Guarantee', 'No spare parts included. Any capacitor replacement or copper valve repair charged as per transparent retail MRP bill.', 'Bestseller in Kharar', 4.8, 'Complete high-pressure jet spray of indoor cooling coils, outdoor condenser unit wash, air filter sanitization, drain tray clearance, and power amp draw measurement.',
    '["High pressure jet pump wash of outdoor condenser unit", "Air filter and indoor cooling coil jet wash with jacket cover", "Drain tray cleanup and pipe blockage purge", "Operating amp draw & voltage measurement", "Free operating temperature differential check"]'::jsonb, '["Refrigerant gas replenishment (if leaking)", "Capacitor / electrical contactor replacement", "Bracket fabrication or high-rise scaffolding work"]'::jsonb, 7, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-ac-foam', 'ac-appliances', 'Foam-Jet AC Service', 'AC Service & Repair', 699.0, 899.0, 'fixed',
    NULL, 99.0, '22% OFF',
    '60 - 75 mins', '45 Days Performance Warranty', 'Chemical foaming agents included. Hardware parts charged extra.', 'Summer Essential', 4.9, 'Heavy-duty foaming chemical wash that removes embedded mold, nicotine & bacteria. Deeply penetrates cooling fins for maximum heat transfer and 2x cooling throw.',
    '["Non-corrosive antibacterial foaming coil wash front and rear", "Blower wheel brush and pressurized spray", "Antibacterial sanitization treatment", "Outdoor condenser fins wash with comb alignment", "Grill and filter deep degrease"]'::jsonb, '["Freon gas top-up", "Copper piping insulation replacement"]'::jsonb, 8, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-ac-deep', 'ac-appliances', 'Deep Cleaning (Indoor & Outdoor Disassembly)', 'AC Service & Repair', 899.0, 1199.0, 'fixed',
    NULL, 99.0, '25% OFF',
    '75 - 90 mins', '60 Days Cleanliness & Odor-Free Warranty', 'Dual-step chemical treatment and degreasers included.', 'Intense Clean', 4.9, 'Complete disassembly of the indoor front fascia, drain pan removal, and intense dual chemical bath for severely choked units.',
    '["Full front panel and drain pan unmounting", "Blower fan drum thorough pressure wash", "Deep chemical soaking of coil core", "Outdoor condenser coil high-pressure flush", "Antimicrobial duct sanitizing fog"]'::jsonb, '["Spare parts and gas refill"]'::jsonb, 9, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-ac-inspect', 'ac-appliances', 'AC Inspection / Diagnostic Visit', 'AC Service & Repair', 199.0, 299.0, 'inspection_fee',
    NULL, 99.0, '33% OFF',
    '30 mins', 'Accurate Problem Diagnostic Guarantee', 'Inspection fee is adjusted into final repair quote if service is executed on spot.', 'Low Cost Diagnostic', 4.7, 'Precision diagnostic inspection when AC is not cooling, making grinding noise, or tripping the MCB. Electronic testing by certified technician.',
    '["Electronic refrigerant sniffer leak check", "Compressor start-up winding resistance check", "Capacitor microfarad rating measurement", "Transparent quote before any repair begins"]'::jsonb, '["Parts and actual repairs (quoted separately)"]'::jsonb, 10, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-geyser-repair', 'ac-appliances', 'Geyser Element & Thermostat Replacement', 'Geyser', 349.0, 499.0, 'starting_from',
    NULL, 99.0, '30% OFF',
    '45 mins', '60 Days Heating Element Warranty', 'ISI-marked copper heating element and thermostat charged at retail price.', 'Winter Care', 4.8, 'Fix geyser not heating water, electric shock in bathroom tap, leaking heating element flange, or burnt thermostat wiring.',
    '["Hard water scale descaling inside inner tank", "Thermal cutout safety check", "Earthing continuity verification to prevent electric shocks"]'::jsonb, '["Cost of new heating element or anode rod"]'::jsonb, 11, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-ro-service', 'ac-appliances', 'RO Water Purifier Service & Filter Swap', 'RO Water Purifier', 399.0, 599.0, 'starting_from',
    NULL, 99.0, '33% OFF',
    '45 mins', '30 Days TDS & Leak Guarantee', 'Sediment, carbon, or 80GPD membrane charged at genuine MRP.', 'TDS Certified', 4.9, 'Deep servicing of RO system: Sediment filter wash, pre-carbon replacement, RO membrane flush, TDS calibration, and booster pump pressure test.',
    '["Pre-filter spun candle check & wash", "TDS test before and after filtration", "High-pressure auto-cut switch check", "Sanitization of storage tank"]'::jsonb, '["Cost of replacement filters/candles"]'::jsonb, 12, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-fridge-diag', 'ac-appliances', 'Refrigerator Repair & Gas Refill', 'Refrigerator', 299.0, 450.0, 'starting_from',
    NULL, 99.0, '34% OFF',
    '45 mins', '60 Days Cooling & Part Warranty', 'Thermostat, bi-metal sensor, defrost timer, or PTC relay charged as per genuine retail bill.', 'Quick Diagnostic', 4.8, 'Diagnosis of zero cooling in lower compartment, excess frost in freezer, relay-overload clicking, inverter PCB fault, or compressor gas leak.',
    '["Capillary tube choke check", "Compressor amp draw measurement", "Defrost heater and thermal fuse check"]'::jsonb, '["Cost of parts or gas charging"]'::jsonb, 13, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-wm-repair', 'ac-appliances', 'Washing Machine Drum & Motor Repair', 'Washing Machine', 349.0, 499.0, 'starting_from',
    NULL, 99.0, '30% OFF',
    '45 - 60 mins', '60 Days Operational Warranty', 'Inlet solenoid valve, drain motor, suspension rods, or belt supplied on actual shop bill.', 'All Brands', 4.7, 'Fix washing machine not spinning, error codes (OE/IE/dE), heavy vibrating noise during spin cycle, or water drain pump blockage.',
    '["Spin drum balance check", "Inlet & outlet water filter wash", "Motor capacitor and belt tension check"]'::jsonb, '["Cost of spare parts or drum bearing overhaul"]'::jsonb, 14, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-door-lock', 'carpentry', 'Door Lock & Handle Fitting', 'Doors & Windows', 249.0, 350.0, 'fixed',
    NULL, 99.0, '29% OFF',
    '45 mins', '30 Days Latch Alignment Warranty', 'Locks supplied by customer or sourced on actual shop bill.', 'Artisan Fit', 4.8, 'Chiseling and installation of mortise handle lock, cylindrical lock, digital keypad lock, or door closer hydraulic arm.',
    '["Mortise recess wood chiseling", "Striker plate precision alignment", "Smooth key rotation test"]'::jsonb, '["Lock hardware set itself"]'::jsonb, 15, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-fan-repair', 'electrical', 'Ceiling Fan Repair / Installation', 'Fans & Lights', 149.0, 199.0, 'fixed',
    NULL, 99.0, '25% OFF',
    '30 mins', '30 Days Smooth Operation Guarantee', 'Capacitor (₹50-80) charged at MRP if replacement needed.', 'Quick 30-min Job', 4.9, 'Mounting new ceiling fan on downrod, capacitor replacement for slow spinning fan, bearing lubrication, and wobble balancing.',
    '["Safety clamp inspection & cotter pin check", "Capacitor swap and winding test", "Silent rotational balancing"]'::jsonb, '["Ceiling hook civil anchoring work"]'::jsonb, 16, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-mcb-repair', 'electrical', 'MCB Trip & Short Circuit Diagnosis', 'Wiring & Safety', 299.0, 399.0, 'starting_from',
    NULL, 99.0, '25% OFF',
    '45 mins', '30 Days Electrical Safety Warranty', 'Replacement MCB (Havells/Schneider) charged as per retail bill.', 'Urgent Safety Need', 4.8, 'Specialist electrician with multimeter diagnosing neutral leaks, overloading circuits, and replacing burnt MCB switches.',
    '["Distribution board busbar check", "Megger insulation resistance test", "Phase load distribution balancing"]'::jsonb, '["Concealed wall conduit chiseling or rewiring"]'::jsonb, 17, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-balcony-safety-grill', 'fabrication', 'Balcony Safety Grill Fabrication & Fitting', 'Balcony Safety Grills', 180.0, 240.0, 'unit_based',
    'sq.ft', 0.0, '25% OFF',
    '2 - 3 Days (Measurement + Workshop Fabrication + Install)', '1-Year Structural Fabrication Warranty', 'Includes laser site measurement, raw Jindal/Tata MS square tubes, red-oxide primer coat, anchor fasteners & on-site fitting.', 'High-Rise Apartment Special', 4.8, 'Custom heavy-gauge MS (Mild Steel) square-pipe safety grill fabrication for high-rise apartment balconies, utility areas, and child-safe window enclosures.',
    '["Doorstep measurement by fabrication engineer with design catalog", "Heavy-gauge 18-gauge MS square pipe / ornamental round bars", "Anti-rust red oxide primer dip coating", "High-tensile heavy anchor fasteners secured into concrete lintel"]'::jsonb, '["Civil wall plaster repair beyond anchor drill points", "Final high-gloss paint coat (primer included)"]'::jsonb, 18, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-main-gate-custom', 'fabrication', 'Custom Designer Main Gate Fabrication', 'Main Gates & Railings', 380.0, 480.0, 'unit_based',
    'sq.ft', 0.0, '20% OFF',
    '4 - 7 Days', '3-Year Structural Workmanship Warranty', 'Quoted on actual weight or sq.ft basis. Branded heavy steel sections (Tata Structura / Apollo) with computerized cutting.', 'Villa & Kothi Special', 4.9, 'Bespoke modern main boundary gates for kothis and villas across Sectors 94–111. Options include laser-cut CNC metal sheet designs, wooden WPC slat inserts, wrought iron, or motorized sliding track frames.',
    '["Architectural design consultation & 3D catalog selection at doorstep", "Heavy structural frame (50x50mm or 75x40mm hollow pipes)", "Anti-rust epoxy primer application", "Heavy-duty pivot bearing hinges or imported nylon bottom wheels", "Civil anchor welding and plumb-line installation"]'::jsonb, '["Automated motor installation (available as addon)"]'::jsonb, 19, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-ss-staircase-railing', 'fabrication', 'Stainless Steel (SS 304) Staircase & Balcony Railing', 'Main Gates & Railings', 420.0, 550.0, 'unit_based',
    'rft', 0.0, '24% OFF',
    '2 - 4 Days', '5-Year Anti-Rust Material Guarantee', 'Authentic Jindal SS-304 chemical acid tested with laser markings. Argon TIG welded.', 'Lifetime Rust Free', 4.9, 'Rust-proof Jindal SS 304 grade mirror/matte finish pipe railings with toughened safety glass or horizontal security pipes for internal duplex stairs and terrace parapets.',
    '["Argon gas TIG welding with seamless blended buffing", "High-precision floor core-cutting and epoxy chemical anchoring", "Mirror or satin-matte buffed polish finish", "Heavy 38mm / 50mm handrail pipe with baluster posts"]'::jsonb, '["Toughened glass tinting (clear glass included if selected)"]'::jsonb, 20, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-gate-weld-repair', 'fabrication', 'Gate Hinge, Roller & Welding Repair', 'Welding & Hinge Repair', 449.0, 599.0, 'fixed',
    NULL, 0.0, '25% OFF',
    '45 - 60 mins', '30-Day Workmanship Warranty', 'Includes welding rods, angle grinders, and basic fastener hardware. Replacement heavy-duty rollers or hinges charged on actual MRP receipt.', 'Same-Day Urgent Dispatch', 4.9, 'On-site electric arc welding repair for squeaking, drooping, or stuck main gates, broken heavy-duty hinges, bottom roller replacement & alignment for smooth sliding.',
    '["Heavy-duty electric arc welding on cracked joints or snapped brackets", "Gate hinge lubrication, anti-sag alignment and clearance check", "Bottom sliding track leveling and ball-bearing roller greasing", "Latch, tower bolt and drop-pin locking alignment"]'::jsonb, '["Full gate replacement or new structural steel members", "Enamel painting / primer touch-up across the entire gate"]'::jsonb, 21, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-window-safety-mesh', 'fabrication', 'Window Security Grill & Mosquito Mesh Enclosure', 'Window & Mesh Grills', 145.0, 195.0, 'unit_based',
    'sq.ft', 0.0, '25% OFF',
    '1 - 2 Days', '1-Year Workmanship Warranty', 'Heavy iron flat/square bars + SS 304 grade invisible/mosquito wire mesh.', 'Dual Protection', 4.8, 'Dual-protection window frames combining burglar-proof wrought iron bars with magnetic/hinged stainless steel mosquito wire mesh frames.',
    '["Accurate window frame outer-edge measurements", "Iron bar safety structure with welded corner braces", "Removable/hinged stainless wire mesh for easy glass cleaning", "Heavy anchor bolt fitting into exterior brickwork/concrete"]'::jsonb, '["Wooden window frame replacement"]'::jsonb, 22, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-kitchen-clean', 'cleaning', 'Kitchen Deep Degreasing', 'Kitchen', 899.0, 1199.0, 'fixed',
    NULL, 99.0, '25% OFF',
    '120 mins', '100% Grease-Free Assurance', 'Professional eco-friendly degreasing agents and microfiber towels brought by team.', 'Top Rated', 4.9, 'Intense industrial scrub of chimney baffle filters, exhaust fan, kitchen backsplash oil stains, cabinet exteriors, and granite countertops.',
    '["Chimney filter soak and steam blast", "Gas stove burners and knobs degrease", "Tiled wall grout scrub", "Sink and tap water-spot descaling"]'::jsonb, '["Inside empty kitchen drawers (available as add-on)"]'::jsonb, 23, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-prj-turnkey', 'home-projects', 'Turnkey Home Renovation & Remodel', 'Turnkey Renovation', 0.0, 0.0, 'quote_required',
    NULL, 0.0, NULL,
    'On-site Survey 60 mins', '5-Year Structural Workmanship Guarantee', 'Itemized BOQ with verified brand specs (Asian Paints, Jaquar, Greenlam, Havells). Cost-plus transparent ledger.', 'Turnkey Project', 4.9, 'Complete end-to-end home renovation, false ceiling, flooring, electrical re-wiring and luxury paint. Dedicated civil engineer supervisor and transparent itemized BOQ.',
    '["On-site laser 3D measurement and survey", "Detailed itemized BOQ material cost estimation", "Architect consultation for space optimization", "Zero-obligation free formal proposal"]'::jsonb, '["Structural alterations without society/municipal NOC"]'::jsonb, 24, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-paint-touchup', 'painting', 'Wall Touch-Up & Damp Treatment', 'Wall Painting', 499.0, 650.0, 'starting_from',
    NULL, 99.0, '23% OFF',
    '90 mins', '6 Months Anti-Peeling Warranty', 'Primer and waterproof putty charged as per square foot area.', 'Punjab Monsoon Guard', 4.7, 'Scraping flaking paint, applying damp-proof primer, putty leveling, and 2-coat color match touch-up on saltpetre / seepage walls.',
    '["Dead plaster sanding and scraping", "Waterproof sealing compound application", "Wall putty smooth finish"]'::jsonb, '["External roof waterproofing (quoted as project)"]'::jsonb, 25, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-waterproofing-terrace', 'painting', 'Terrace & Roof Elastomeric Waterproofing', 'Waterproofing & Damp', 0.0, 0.0, 'quote_required',
    NULL, 0.0, NULL,
    'Survey: 45 mins', '7-Year Anti-Leakage Warranty', 'Dr. Fixit / Asian Paints SmartCare polyurethane membrane with 7-year manufacturer warranty card.', '7-Year Warranty', 4.8, 'Multi-layer fiber-mesh elastomeric PU membrane coating for leaking roofs and damp ceilings in Kharar kothis and builder floors.',
    '["Moisture meter thermal leak detection", "Square-footage accurate laser measurement", "Crack filling scope assessment", "Written formal quote within 4 hours"]'::jsonb, '["Civil parapet brick rebuilding"]'::jsonb, 26, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-pest-termite', 'pest-control', 'Termite Drill & Inject Shield', 'Termite Care', 1299.0, 1699.0, 'starting_from',
    NULL, 99.0, '24% OFF',
    '120 mins', '1 Year Written Termite Protection Warranty', 'Government-approved odorless termiticide included.', '1-Year Shield', 4.9, 'Precision drilling at 1-foot intervals along skirting, chemical injection under high pressure to kill subterranean termite colonies.',
    '["Drilling and chemical pressure pumping", "Color-matched white cement hole sealing", "Door frame inspection"]'::jsonb, '["Replacement of hollowed out wooden frames"]'::jsonb, 27, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-tap-leak', 'plumbing', 'Tap / Mixer Repair & Installation', 'Bathroom & Kitchen', 149.0, 199.0, 'fixed',
    NULL, 99.0, '25% OFF',
    '30 mins', '30 Days Leak-Free Guarantee', 'Ceramic disc spindle or connection pipe provided at retail cost.', 'Standard Fit', 4.7, 'Fix dripping quarter-turn taps, wall mixer diverter repair, angle valve replacement, and teflon tape leak arrest.',
    '["Spindle cartridge replacement", "Aerator descaling for pressure", "Thread sealing with loctite/teflon"]'::jsonb, '["Supply of brand new designer mixer taps"]'::jsonb, 28, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

INSERT INTO public.services (
    id, category_id, name, subcategory, price, market_average, price_type, unit_type, visit_fee,
    discount, estimated_duration, warranty, material_policy, badge, rating, description,
    features, addons, display_order, is_popular
) VALUES (
    'srv-water-motor', 'plumbing', 'Water Motor / Submersible Pump Repair', 'Motors & Pumps', 299.0, 450.0, 'fixed',
    NULL, 99.0, '34% OFF',
    '45 mins', '30 Days Water Lift Warranty', 'Capacitor, non-return valve, or float switch charged on verified bill.', 'Critical Kharar Need', 4.9, 'Troubleshooting low water lift, capacitor failure, stuck impeller, foot valve failure, or automatic water level controller wiring in Kharar houses.',
    '["Suction line air lock priming", "Run/Start capacitor test", "Terminal lead wire rewiring"]'::jsonb, '["Complete motor rewinding (workshop quote extra)"]'::jsonb, 29, TRUE
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    price = EXCLUDED.price,
    market_average = EXCLUDED.market_average,
    price_type = EXCLUDED.price_type,
    unit_type = EXCLUDED.unit_type,
    visit_fee = EXCLUDED.visit_fee,
    discount = EXCLUDED.discount,
    estimated_duration = EXCLUDED.estimated_duration,
    warranty = EXCLUDED.warranty,
    material_policy = EXCLUDED.material_policy,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    addons = EXCLUDED.addons,
    display_order = EXCLUDED.display_order,
    is_popular = EXCLUDED.is_popular;

-- 6. Synchronize the 4 official packages
DELETE FROM public.service_packages;

INSERT INTO public.service_packages (
    id, category_id, category, subcategory, name, price, original_price, savings, duration, rating, description, included, display_order
) VALUES (
    'pkg-2-ac-foam', 'ac-appliances', 'AC & Appliances', 'AC Service & Repair', '2 AC Foam-Jet Package', 1299.0, 1596.0, 'Save ₹297 · Zero Visit Fee', '90 - 120 mins', 4.9, 'Both ACs full foaming wash + outdoor coil pressure blast + free gas pressure check. Dedicated two-artisan crew with zero doorstep fee.', '["Foam-jet deep wash on 2 Split ACs", "2 Outdoor condenser pressure blasts", "Freon pressure diagnostic on both units", "Drain tray sanitization", "Zero doorstep visit fee included"]'::jsonb, 1
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    category = EXCLUDED.category,
    subcategory = EXCLUDED.subcategory,
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    savings = EXCLUDED.savings,
    duration = EXCLUDED.duration,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    included = EXCLUDED.included,
    display_order = EXCLUDED.display_order;

INSERT INTO public.service_packages (
    id, category_id, category, subcategory, name, price, original_price, savings, duration, rating, description, included, display_order
) VALUES (
    'pkg-ac-complete-care', 'ac-appliances', 'AC & Appliances', 'AC Service & Repair', 'Complete AC Care Package', 1899.0, 2499.0, 'Save ₹600 · Gas Top-up Included', '90 mins', 4.9, 'Comprehensive seasonal care: 1 Split AC foam-jet wash, outdoor unit jet blast, electrical terminal tighten, capacitor rating test, and up to 25% refrigerant gas top-up included.', '["Indoor antibacterial foam-jet service", "Outdoor condenser pressure blast", "Refrigerant gas top-up (up to 25% pressure deficit)", "Run capacitor and electrical contactor safety test", "60 Days Cooling Assurance"]'::jsonb, 2
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    category = EXCLUDED.category,
    subcategory = EXCLUDED.subcategory,
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    savings = EXCLUDED.savings,
    duration = EXCLUDED.duration,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    included = EXCLUDED.included,
    display_order = EXCLUDED.display_order;

INSERT INTO public.service_packages (
    id, category_id, category, subcategory, name, price, original_price, savings, duration, rating, description, included, display_order
) VALUES (
    'pkg-home-elec-audit', 'electrical', 'Electrical', 'Wiring & Safety', 'Full Home Electrical Safety Audit', 649.0, 999.0, 'Save ₹350 · Zero Visit Fee', '60 mins', 4.8, 'MCB load balancing, earthing continuity test, and 12-point socket thermal check. Comprehensive inspection of switches, inverter wiring and distribution box.', '["Main distribution panel thermal inspection", "Earthing pit continuity test with Megger meter", "12 electrical switch points tight screw check", "Inverter battery specific gravity test", "Full safety report card"]'::jsonb, 3
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    category = EXCLUDED.category,
    subcategory = EXCLUDED.subcategory,
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    savings = EXCLUDED.savings,
    duration = EXCLUDED.duration,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    included = EXCLUDED.included,
    display_order = EXCLUDED.display_order;

INSERT INTO public.service_packages (
    id, category_id, category, subcategory, name, price, original_price, savings, duration, rating, description, included, display_order
) VALUES (
    'pkg-deep-clean-combo', 'cleaning', 'Home Cleaning', 'Kitchen', 'Kitchen & Bathroom Duo Clean', 1399.0, 1798.0, 'Save ₹399', '150 mins', 4.9, 'Kitchen degreasing combined with one master bathroom acid-free tile descaling. Spotless taps, mirrors, exhaust and tiles.', '["Full kitchen chimney & stove degreasing", "Bathroom hard water stain removal", "Grout scrubbing with single-disc machine", "Sanitizing fog spray"]'::jsonb, 4
) ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    category = EXCLUDED.category,
    subcategory = EXCLUDED.subcategory,
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    savings = EXCLUDED.savings,
    duration = EXCLUDED.duration,
    rating = EXCLUDED.rating,
    description = EXCLUDED.description,
    included = EXCLUDED.included,
    display_order = EXCLUDED.display_order;
