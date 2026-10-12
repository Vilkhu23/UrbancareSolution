-- ==============================================================================
-- PindCare (UrbanCare Solution) - Supabase PostgreSQL Database Schema
-- Location: Kharar, Greater Mohali, Punjab (Sectors 94 to 111)
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean existing schema if re-running
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS opportunity_ledger CASCADE;
DROP TABLE IF EXISTS home_projects CASCADE;
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS service_categories CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS ops_settings CASCADE;

-- 1. OPERATIONS SETTINGS
CREATE TABLE ops_settings (
    id TEXT PRIMARY KEY DEFAULT 'ops-config',
    password TEXT NOT NULL DEFAULT 'OpsLead@2026',
    auto_assignment_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    emergency_contact TEXT NOT NULL DEFAULT '+91 98889 00122',
    dispatch_coverage_radius_km NUMERIC(5, 2) DEFAULT 12.5,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CUSTOMERS / RESIDENTS
CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    locality TEXT NOT NULL DEFAULT 'Sunny Enclave, Sector 125, Kharar',
    address TEXT NOT NULL,
    password TEXT DEFAULT 'Resident@123',
    total_bookings INTEGER DEFAULT 0,
    total_spent NUMERIC(10, 2) DEFAULT 0,
    registered_date DATE DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_locality ON customers(locality);

-- 3. IN-HOUSE FIELD TECHNICIANS (EMPLOYEES)
CREATE TABLE employees (
    id TEXT PRIMARY KEY,
    employee_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'Field Specialist',
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'TERMINATED')),
    availability TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (availability IN ('AVAILABLE', 'ON_JOB', 'OFF_DUTY')),
    skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    service_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
    rating NUMERIC(3, 2) DEFAULT 4.9,
    completed_jobs INTEGER DEFAULT 0,
    password TEXT NOT NULL DEFAULT 'TechPass@101',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employees_code ON employees(employee_code);
CREATE INDEX idx_employees_mobile ON employees(mobile);
CREATE INDEX idx_employees_availability ON employees(availability);

-- 4. VERIFIED TRADE PARTNER CONTRACTORS (VENDORS)
CREATE TABLE vendors (
    id TEXT PRIMARY KEY,
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED', 'REJECTED')),
    categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    service_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
    experience_years INTEGER DEFAULT 5,
    rating NUMERIC(3, 2) DEFAULT 4.8,
    plan JSONB NOT NULL DEFAULT '{
        "id": "starter",
        "name": "Standard Trade Plan",
        "price": 1499,
        "totalOpportunities": 7,
        "remainingOpportunities": 7,
        "purchasedAt": "2026-03-01",
        "expiresAt": "2026-04-01"
    }'::jsonb,
    password TEXT NOT NULL DEFAULT 'MalwaPass@2026',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendors_mobile ON vendors(mobile);
CREATE INDEX idx_vendors_status ON vendors(status);

-- 5. SERVICE CATALOG CATEGORIES
CREATE TABLE service_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SERVICE CATALOG ITEMS & RATES
CREATE TABLE services (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    market_average NUMERIC(10, 2),
    description TEXT,
    rating NUMERIC(3, 2) DEFAULT 4.8,
    review_count INTEGER DEFAULT 120,
    duration_minutes INTEGER DEFAULT 60,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    addons JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_category ON services(category_id);

-- 7. DOMESTIC SERVICE REQUESTS / BOOKINGS & DISPATCHES
CREATE TABLE service_requests (
    id TEXT PRIMARY KEY, -- e.g. 'PB-REQ-101'
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    locality TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN (
        'NEW',
        'UNDER REVIEW',
        'READY FOR ASSIGNMENT',
        'ASSIGNED',
        'ACCEPTED',
        'SCHEDULED',
        'IN PROGRESS',
        'COMPLETED',
        'CUSTOMER CONFIRMED',
        'CLOSED',
        'CANCELLED',
        'DISPUTED',
        'CUSTOMER NOT AVAILABLE',
        'VENDOR NOT AVAILABLE'
    )),
    total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
    locality_adjustment NUMERIC(10, 2) NOT NULL DEFAULT 0,
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
    preferred_date TEXT DEFAULT 'Today',
    preferred_slot TEXT DEFAULT 'Immediate (Next 60 Mins)',
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_method TEXT NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('ONLINE', 'CASH', 'UPI')),
    assigned_to JSONB, -- { id, name, phone, type: 'EMPLOYEE' | 'VENDOR', assignedAt }
    technician_notes TEXT,
    vendor_scheduled_time TEXT,
    vendor_arrival_status TEXT DEFAULT 'PENDING' CHECK (vendor_arrival_status IN ('PENDING', 'EN_ROUTE', 'ARRIVED')),
    work_started_at TIMESTAMPTZ,
    work_completed_at TIMESTAMPTZ,
    before_work_photos JSONB DEFAULT '[]'::jsonb,
    completion_photos JSONB DEFAULT '[]'::jsonb,
    completion_notes TEXT,
    completion_code TEXT,
    customer_otp TEXT DEFAULT '4192',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_locality ON service_requests(locality);
CREATE INDEX idx_service_requests_created_at ON service_requests(created_at DESC);

-- 8. TURNKEY HOME RENOVATIONS & PROJECTS
CREATE TABLE home_projects (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    locality TEXT NOT NULL,
    project_type TEXT NOT NULL,
    scope_summary TEXT NOT NULL,
    estimated_budget TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NEW_INQUIRY' CHECK (status IN ('NEW_INQUIRY', 'SITE_VISIT_SCHEDULED', 'ESTIMATE_PREPARED', 'CONTRACT_SIGNED', 'IN_EXECUTION', 'COMPLETED')),
    assigned_vendor_id TEXT REFERENCES vendors(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. VENDOR OPPORTUNITY CREDIT DISPATCH LEDGER
CREATE TABLE opportunity_ledger (
    id TEXT PRIMARY KEY,
    vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    vendor_name TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    action TEXT NOT NULL,
    opportunities_deducted INTEGER NOT NULL DEFAULT 1,
    remaining_balance INTEGER NOT NULL,
    notes TEXT,
    request_id TEXT REFERENCES service_requests(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ledger_vendor_id ON opportunity_ledger(vendor_id);

-- 10. CUSTOMER COMPLAINTS & ESCALATIONS
CREATE TABLE complaints (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    artisan_name TEXT,
    issue_type TEXT NOT NULL DEFAULT 'OTHER',
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED')),
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_complaints_status ON complaints(status);

-- 11. PAYMENT TRANSACTIONS
CREATE TABLE payments (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('ONLINE', 'CASH', 'UPI')),
    status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'PENDING', 'FAILED', 'REFUNDED')),
    reference_id TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_request_id ON payments(request_id);

-- 12. AUDIT LOGS FOR DPDP ACT & OPERATIONS
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('CUSTOMER', 'EMPLOYEE', 'VENDOR', 'BOOKING', 'DISPATCH', 'PAYMENT', 'COMPLAINT', 'SYSTEM')),
    entity_id TEXT NOT NULL,
    details TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ==============================================================================
-- AUTOMATIC UPDATED_AT TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON service_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_home_projects_updated_at BEFORE UPDATE ON home_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ops_settings_updated_at BEFORE UPDATE ON ops_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_settings ENABLE ROW LEVEL SECURITY;

-- 1. Public catalog read access
CREATE POLICY "Public read service categories" ON service_categories FOR SELECT USING (true);
CREATE POLICY "Public read services" ON services FOR SELECT USING (true);

-- 2. General authenticated/anon web client policies for PindCare SPA
CREATE POLICY "Allow public read customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow insert customers" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update customers" ON customers FOR UPDATE USING (true);

CREATE POLICY "Allow read employees" ON employees FOR SELECT USING (true);
CREATE POLICY "Allow update employees" ON employees FOR UPDATE USING (true);
CREATE POLICY "Allow insert employees" ON employees FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read vendors" ON vendors FOR SELECT USING (true);
CREATE POLICY "Allow insert vendors" ON vendors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update vendors" ON vendors FOR UPDATE USING (true);

CREATE POLICY "Allow read service requests" ON service_requests FOR SELECT USING (true);
CREATE POLICY "Allow insert service requests" ON service_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update service requests" ON service_requests FOR UPDATE USING (true);

CREATE POLICY "Allow read home projects" ON home_projects FOR SELECT USING (true);
CREATE POLICY "Allow insert home projects" ON home_projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update home projects" ON home_projects FOR UPDATE USING (true);

CREATE POLICY "Allow read opportunity ledger" ON opportunity_ledger FOR SELECT USING (true);
CREATE POLICY "Allow insert opportunity ledger" ON opportunity_ledger FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read complaints" ON complaints FOR SELECT USING (true);
CREATE POLICY "Allow insert complaints" ON complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update complaints" ON complaints FOR UPDATE USING (true);

CREATE POLICY "Allow read payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Allow insert payments" ON payments FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read audit logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read ops settings" ON ops_settings FOR SELECT USING (true);
CREATE POLICY "Allow update ops settings" ON ops_settings FOR UPDATE USING (true);

-- ==============================================================================
-- REALTIME REPLICATION (For live dispatch updates between customer & staff)
-- ==============================================================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE service_requests;
    ALTER PUBLICATION supabase_realtime ADD TABLE opportunity_ledger;
    ALTER PUBLICATION supabase_realtime ADD TABLE complaints;
    ALTER PUBLICATION supabase_realtime ADD TABLE employees;
    ALTER PUBLICATION supabase_realtime ADD TABLE vendors;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;
