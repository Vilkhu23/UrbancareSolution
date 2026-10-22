-- ==============================================================================
-- TEST PROJECTS ONLY - NEVER RUN IN PRODUCTION
-- File: supabase/seed_demo.sql
-- Description: Demo seed data containing sample employees, vendors, customers,
--              mock bookings, ledger entries, and sample payments.
--              Intended EXCLUSIVELY for local sandbox testing and developer staging.
-- ==============================================================================

-- 1. In-House Field Technicians (Sample Employees without auth logins)
INSERT INTO employees (id, employee_code, name, mobile, role, status, availability, skills, service_areas, rating, completed_jobs, password) VALUES
('emp-1', 'EMP-101', 'Gurpreet Singh', '+91 98882 10452', 'Master AC Specialist', 'ACTIVE', 'AVAILABLE', '["Split AC Foam Wash", "Inverter AC Gas Charging", "Circuit Diagnostics"]'::jsonb, '["Sector 125 Kharar", "Sunny Enclave", "Sector 115"]'::jsonb, 4.95, 342, 'TechPass@101'),
('emp-2', 'EMP-102', 'Harpreet Kaur', '+91 98150 94120', 'Certified Electrician Lead', 'ACTIVE', 'AVAILABLE', '["Inverter Wiring", "MCB Box Replacement", "Short Circuit Detection"]'::jsonb, '["Sector 104 Mohali", "Sector 105", "Sector 110"]'::jsonb, 4.88, 289, 'TechPass@102'),
('emp-3', 'EMP-103', 'Vikramjit Sharma', '+91 94631 82014', 'Senior Plumbing Technician', 'ACTIVE', 'AVAILABLE', '["Concealed Leak Detection", "Submersible Motor", "Geyser Fitting"]'::jsonb, '["Kharar Central", "Shivalik City", "Gillco Valley"]'::jsonb, 4.91, 412, 'TechPass@103'),
('emp-4', 'EMP-104', 'Balwinder Dhillon', '+91 97793 61852', 'Carpentry & Joinery Specialist', 'ACTIVE', 'AVAILABLE', '["Main Door Mortise Locks", "Hydraulic Hinges", "Wooden Flooring"]'::jsonb, '["Sector 97 Mohali", "Sector 99", "Landran Road"]'::jsonb, 4.85, 215, 'TechPass@104')
ON CONFLICT (id) DO NOTHING;

-- 2. Verified Trade Partner Vendors (Sample Vendors without auth logins)
INSERT INTO vendors (id, business_name, owner_name, mobile, email, status, categories, service_areas, experience_years, rating, plan, password) VALUES
('vnd-1', 'Malwa Cooling & Electricals', 'Kulwinder Singh', '+91 94172 88412', 'malwacooling@gmail.com', 'ACTIVE', '["AC & Appliances", "Electrician"]'::jsonb, '["Sector 125 Kharar", "Sunny Enclave", "Sector 115"]'::jsonb, 9, 4.89, '{
    "id": "contractor",
    "name": "Contractor Trade Plan",
    "price": 2999,
    "totalOpportunities": 16,
    "remainingOpportunities": 11,
    "purchasedAt": "2026-03-01",
    "expiresAt": "2026-04-01"
}'::jsonb, 'MalwaPass@2026'),
('vnd-2', 'Kharar Electrician Hub', 'Amrinder Virk', '+91 98889 44102', 'amrinder.virk@outlook.com', 'ACTIVE', '["Electrician"]'::jsonb, '["Sector 104 Mohali", "Sector 105", "Sector 110"]'::jsonb, 7, 4.78, '{
    "id": "starter",
    "name": "Standard Trade Plan",
    "price": 1499,
    "totalOpportunities": 7,
    "remainingOpportunities": 4,
    "purchasedAt": "2026-03-05",
    "expiresAt": "2026-04-05"
}'::jsonb, 'KhararPass@2026'),
('vnd-3', 'Woodcraft & Modular Joinery', 'Satnam Singh', '+91 98721 34901', 'woodcraft.kharar@gmail.com', 'ACTIVE', '["Carpenter", "Turnkey Renovations"]'::jsonb, '["Shivalik City", "Gillco Valley", "Sector 126"]'::jsonb, 12, 4.92, '{
    "id": "enterprise",
    "name": "Enterprise Crew Plan",
    "price": 4999,
    "totalOpportunities": 30,
    "remainingOpportunities": 26,
    "purchasedAt": "2026-02-28",
    "expiresAt": "2026-03-30"
}'::jsonb, 'Woodcraft@2026'),
('vnd-4', 'CleanWave Water Solutions', 'Rohit Bains', '+91 95011 88321', 'cleanwave.pb@gmail.com', 'ACTIVE', '["Plumber", "Deep Cleaning"]'::jsonb, '["Sunny Enclave", "Sector 127", "Sector 124"]'::jsonb, 6, 4.81, '{
    "id": "starter",
    "name": "Standard Trade Plan",
    "price": 1499,
    "totalOpportunities": 7,
    "remainingOpportunities": 6,
    "purchasedAt": "2026-03-10",
    "expiresAt": "2026-04-10"
}'::jsonb, 'CleanPass@2026')
ON CONFLICT (id) DO NOTHING;

-- 3. Sample Customers
INSERT INTO customers (id, name, phone, email, locality, address, password, total_bookings, total_spent, registered_date, status) VALUES
('cust-1', 'Simranjit Singh', '+91 98721 99120', 'simran.mohali@gmail.com', 'Sunny Enclave, Sector 125, Kharar', 'House 1422, Street 7, Sector 125', 'Resident@123', 3, 2847.00, '2026-01-14', 'ACTIVE'),
('cust-2', 'Manpreet Kaur', '+91 98144 32190', 'mkaur.sunny@yahoo.com', 'Shivalik City, Sector 127, Kharar', 'Villa 88, Lane 4, Shivalik City', 'Resident@123', 2, 1198.00, '2026-02-02', 'ACTIVE'),
('cust-3', 'Rajinder Kumar', '+91 94170 55432', 'rajinder.adv@gmail.com', 'Sector 104, Pearl City, Mohali', 'Kothi 204, Sector 104, Mohali', 'Resident@123', 5, 6490.00, '2026-01-08', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 4. Sample Service Requests
INSERT INTO service_requests (
    id, customer_id, customer_name, customer_phone, customer_address, locality, items, status,
    total, subtotal, locality_adjustment, tax, preferred_date, preferred_slot, payment_status, payment_method,
    assigned_to, technician_notes, vendor_arrival_status, customer_otp
) VALUES
(
    'PB-REQ-101', 'cust-1', 'Simranjit Singh', '+91 98721 99120', 'House 1422, Street 7, Sector 125', 'Sunny Enclave, Sector 125, Kharar',
    '[{"id":"srv-ac-deep","name":"Split AC Master Foam Jet Service","price":599,"quantity":2,"category":"cat-ac"}]'::jsonb,
    'ASSIGNED', 1198.00, 1198.00, 0.00, 0.00, 'Today', '2:00 PM - 4:00 PM', 'PENDING', 'CASH',
    '{"id":"emp-1","name":"Gurpreet Singh","phone":"+91 98882 10452","type":"EMPLOYEE","assignedAt":"2026-03-12T10:00:00Z"}'::jsonb,
    'AC coil foaming ready. Contacted resident.', 'PENDING', '7192'
),
(
    'PB-REQ-102', 'cust-2', 'Manpreet Kaur', '+91 98144 32190', 'Villa 88, Lane 4, Shivalik City', 'Shivalik City, Sector 127, Kharar',
    '[{"id":"srv-elec-switch","name":"Switchboard Repair & Fan Installation","price":249,"quantity":1,"category":"cat-elec"}]'::jsonb,
    'ACCEPTED', 249.00, 249.00, 0.00, 0.00, 'Today', 'Immediate', 'PAID', 'UPI',
    '{"id":"vnd-1","name":"Malwa Cooling & Electricals","phone":"+91 94172 88412","type":"VENDOR","assignedAt":"2026-03-12T10:15:00Z"}'::jsonb,
    'Partner en route with test meter.', 'EN_ROUTE', '4821'
),
(
    'PB-REQ-103', 'cust-3', 'Rajinder Kumar', '+91 94170 55432', 'Kothi 204, Sector 104, Mohali', 'Sector 104, Pearl City, Mohali',
    '[{"id":"srv-plumb-leak","name":"Tap Leak & Concealed Pipe Repair","price":299,"quantity":1,"category":"cat-plumb"}]'::jsonb,
    'COMPLETED', 299.00, 299.00, 0.00, 0.00, '2026-03-11', '10:00 AM', 'PAID', 'CASH',
    '{"id":"emp-3","name":"Vikramjit Sharma","phone":"+91 94631 82014","type":"EMPLOYEE","assignedAt":"2026-03-11T09:30:00Z"}'::jsonb,
    'Replaced spindle washer in master bathroom.', 'ARRIVED', '3310'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Sample Opportunity Ledger
INSERT INTO opportunity_ledger (id, vendor_id, vendor_name, action, opportunities_deducted, remaining_balance, notes, request_id) VALUES
('led-1', 'vnd-1', 'Malwa Cooling & Electricals', 'ASSIGNMENT_ALLOCATED', 1, 11, 'Allocated Switchboard repair in Shivalik City (PB-REQ-102)', 'PB-REQ-102'),
('led-2', 'vnd-2', 'Kharar Electrician Hub', 'ASSIGNMENT_ALLOCATED', 1, 4, 'Allocated Inverter battery health check in Sector 104', NULL)
ON CONFLICT (id) DO NOTHING;

-- 6. Sample Payments (for completed demo booking PB-REQ-103)
INSERT INTO payments (id, request_id, customer_name, amount, mode, status, transaction_ref, collected_by) VALUES
('pay-demo-103', 'PB-REQ-103', 'Rajinder Kumar', 299.00, 'CASH', 'SUCCESS', 'CASH-EMP-103', 'Vikramjit Sharma (Staff Technician)')
ON CONFLICT (id) DO NOTHING;
