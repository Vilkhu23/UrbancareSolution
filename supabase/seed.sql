-- ==============================================================================
-- PindCare (UrbanCare Solution) - Production Database Seed Data
-- Location: Kharar, Greater Mohali, Punjab (Sectors 94 to 111)
-- Description: Production-essential foundation data (ops settings, service
--              categories, and service catalog).
--              Contains NO mock users, NO demo employees/vendors, and NO test bookings.
-- ==============================================================================

-- 1. Operations Settings (System Default Configuration)
INSERT INTO ops_settings (id, password, auto_assignment_enabled, emergency_contact, dispatch_coverage_radius_km)
VALUES ('ops-config', 'OpsLead@2026', TRUE, '+91 98889 00122', 12.5)
ON CONFLICT (id) DO NOTHING;

-- 2. Service Categories
INSERT INTO service_categories (id, name, icon, description, display_order) VALUES
('cat-ac', 'AC & Appliances', 'Snowflake', 'Servicing, deep jet wash, compressor gas recharge & repairs', 1),
('cat-elec', 'Electrician', 'Zap', 'Wiring, switchboard fixes, inverter battery setup, fans & MCBs', 2),
('cat-plumb', 'Plumber', 'Droplets', 'Pipe leaks, motor installation, bathroom sanitary fittings & geysers', 3),
('cat-carp', 'Carpenter', 'Hammer', 'Door locks, modular hinges, furniture repairs & bespoke joinery', 4),
('cat-clean', 'Deep Cleaning', 'Sparkles', 'Full villa/kothi scrubbing, sofa shampoo, kitchen & water tanks', 5),
('cat-paint', 'Painting & Waterproofing', 'Paintbrush', 'Interior plastic paint, damp wall PU treatment & exterior wash', 6)
ON CONFLICT (id) DO NOTHING;

-- 3. Services Catalog
INSERT INTO services (id, category_id, name, price, market_average, description, rating, review_count, duration_minutes, features, addons, is_popular) VALUES
('srv-ac-deep', 'cat-ac', 'Split AC Master Foam Jet Service', 599, 850, 'High-pressure foam-jet washing of indoor & outdoor units with antibacterial coil rinse.', 4.9, 142, 45, '["Indoor foam jet wash", "Outdoor unit deep cleaning", "Gas pressure measurement", "Drain tray unclogging"]'::jsonb, '[]'::jsonb, TRUE),
('srv-ac-gas', 'cat-ac', 'AC Gas Refill & Leak Detection', 2199, 2800, 'Complete nitrogen leak inspection followed by pure R32/R410A refrigerant gas recharging.', 4.8, 86, 90, '["Electronic nitrogen leak test", "Vacuuming & moisture purge", "Original OEM refrigerant", "30-Day cooling warranty"]'::jsonb, '[]'::jsonb, FALSE),
('srv-elec-switch', 'cat-elec', 'Switchboard Repair & Fan Installation', 249, 400, 'Fix sparking switches, socket replacements, and ceiling fan balancing/installation.', 4.9, 210, 30, '["Multi-meter voltage test", "Modular switch repair", "Safe insulation tape application", "No hidden service fees"]'::jsonb, '[]'::jsonb, TRUE),
('srv-elec-inverter', 'cat-elec', 'Inverter & Battery Health Diagnostics', 449, 650, 'Distilled water top-up, terminal desulphation, wire inspection and load backup testing.', 4.8, 64, 45, '["Specific gravity hydrometer check", "Terminal grease application", "Overload trip testing"]'::jsonb, '[]'::jsonb, FALSE),
('srv-plumb-leak', 'cat-plumb', 'Tap Leak & Concealed Pipe Repair', 299, 450, 'Fix dripping taps, jet sprays, basin angle valves, or noisy overhead pipe vibrations.', 4.8, 175, 40, '["Washer & cartridge replacement", "Thread seal tape fitting", "Water pressure flow check"]'::jsonb, '[]'::jsonb, TRUE),
('srv-plumb-motor', 'cat-plumb', 'Water Pump / Submersible Motor Installation', 799, 1100, '0.5HP to 1.5HP monoblock or submersible motor mounting, priming and electrical switch setup.', 4.9, 52, 75, '["Vibration dampening base pad", "Suction pipe leak check", "Starter panel safety check"]'::jsonb, '[]'::jsonb, FALSE),
('srv-carp-lock', 'cat-carp', 'Godrej / Main Door Smart Lock Installation', 499, 750, 'Chiseling and precision fitting of mortise locks, cylinder deadbolts or rim night latches.', 4.9, 98, 60, '["Smooth key alignment", "Strike plate alignment", "Hinges lubrication included"]'::jsonb, '[]'::jsonb, TRUE),
('srv-clean-deep', 'cat-clean', '3BHK Complete Kothi Deep Cleaning', 2999, 4200, 'Machine floor scrubbing, chemical kitchen degreasing, bathroom descaling & window tracks.', 4.9, 114, 240, '["Single-disc machine scrubbing", "Bathroom tiles hard-water removal", "Exhaust fan grease stripping"]'::jsonb, '[]'::jsonb, TRUE)
ON CONFLICT (id) DO NOTHING;
