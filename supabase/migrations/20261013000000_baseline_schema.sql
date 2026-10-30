-- ==============================================================================
-- Migration: 20261013000000_baseline_schema.sql
-- Description: Establishes the baseline relational schema for PindCare/UrbanCare.
--              Defines the 12 core operational domain tables required by subsequent
--              delta migrations (20261013000001 through 20261030000020).
-- Safety:      - Strictly CREATE TABLE IF NOT EXISTS (zero destructive DROPs).
--              - Omit plaintext password from public.vendors (SEC-01 compliance).
--              - Omits tables created by later migrations (profiles, secrets, etc.).
-- ==============================================================================

-- 1. Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Operations Settings (System Default Configuration)
CREATE TABLE IF NOT EXISTS public.ops_settings (
    id TEXT PRIMARY KEY DEFAULT 'ops-config',
    auto_assignment_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    emergency_contact TEXT NOT NULL DEFAULT '+91 98889 00122',
    dispatch_coverage_radius_km NUMERIC(5, 2) DEFAULT 12.5,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Customers / Residents
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    locality TEXT NOT NULL DEFAULT 'Sunny Enclave, Sector 125, Kharar',
    address TEXT NOT NULL,
    total_bookings INTEGER DEFAULT 0,
    total_spent NUMERIC(10, 2) DEFAULT 0,
    registered_date DATE DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_locality ON public.customers(locality);

-- 4. In-House Field Technicians (Employees)
CREATE TABLE IF NOT EXISTS public.employees (
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_code ON public.employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_employees_mobile ON public.employees(mobile);
CREATE INDEX IF NOT EXISTS idx_employees_availability ON public.employees(availability);

-- 5. Verified Trade Partner Contractors (Vendors)
-- Note: password column intentionally omitted per SEC-01 (Auth resides strictly in auth.users)
CREATE TABLE IF NOT EXISTS public.vendors (
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendors_mobile ON public.vendors(mobile);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON public.vendors(status);

-- 6. Service Catalog Categories
CREATE TABLE IF NOT EXISTS public.service_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Service Catalog Items & Rates
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subcategory TEXT,
    price NUMERIC(10, 2) NOT NULL,
    market_average NUMERIC(10, 2),
    price_type TEXT DEFAULT 'fixed',
    unit_type TEXT,
    visit_fee NUMERIC(10, 2) DEFAULT 99,
    discount TEXT,
    warranty TEXT,
    material_policy TEXT,
    estimated_duration TEXT,
    badge TEXT,
    display_order INTEGER DEFAULT 1,
    description TEXT,
    rating NUMERIC(3, 2) DEFAULT 4.8,
    review_count INTEGER DEFAULT 120,
    duration_minutes INTEGER DEFAULT 60,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    addons JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_popular BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_subcategory ON public.services(subcategory);

-- 8. Service Packages & Multi-Unit Bundles
CREATE TABLE IF NOT EXISTS public.service_packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category_id TEXT NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    subcategory TEXT,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2) NOT NULL,
    savings TEXT,
    duration TEXT,
    included JSONB NOT NULL DEFAULT '[]'::jsonb,
    service_areas JSONB NOT NULL DEFAULT '["Sector 94", "Sector 104", "Sector 105", "Sector 110", "Sector 111"]'::jsonb,
    rating NUMERIC(3, 2) DEFAULT 4.9,
    pricing_type TEXT DEFAULT 'package',
    active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_packages_category ON public.service_packages(category_id);

-- 9. Domestic Service Requests / Bookings
CREATE TABLE IF NOT EXISTS public.service_requests (
    id TEXT PRIMARY KEY, -- e.g. 'PB-REQ-101'
    customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
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
        'VENDOR NOT AVAILABLE',
        'REASSIGNMENT REQUIRED'
    )),
    total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
    locality_adjustment NUMERIC(10, 2) NOT NULL DEFAULT 0,
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
    preferred_date TEXT DEFAULT 'Today',
    preferred_slot TEXT DEFAULT 'Immediate (Next 60 Mins)',
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_method TEXT NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('ONLINE', 'CASH', 'UPI')),
    assigned_to JSONB,
    technician_notes TEXT,
    vendor_scheduled_time TEXT,
    vendor_arrival_status TEXT DEFAULT 'PENDING' CHECK (vendor_arrival_status IN ('PENDING', 'EN_ROUTE', 'ARRIVED')),
    work_started_at TIMESTAMPTZ,
    work_completed_at TIMESTAMPTZ,
    before_work_photos JSONB DEFAULT '[]'::jsonb,
    completion_photos JSONB DEFAULT '[]'::jsonb,
    completion_notes TEXT,
    completion_code TEXT,
    customer_otp TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_locality ON public.service_requests(locality);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON public.service_requests(created_at DESC);

-- 10. Turnkey Home Renovations & Projects
CREATE TABLE IF NOT EXISTS public.home_projects (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    locality TEXT NOT NULL,
    project_type TEXT NOT NULL,
    scope_summary TEXT NOT NULL,
    estimated_budget TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NEW_INQUIRY' CHECK (status IN ('NEW_INQUIRY', 'SITE_VISIT_SCHEDULED', 'ESTIMATE_PREPARED', 'CONTRACT_SIGNED', 'IN_EXECUTION', 'COMPLETED')),
    assigned_vendor_id TEXT REFERENCES public.vendors(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Vendor Opportunity Credit Dispatch Ledger
CREATE TABLE IF NOT EXISTS public.opportunity_ledger (
    id TEXT PRIMARY KEY,
    vendor_id TEXT NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    vendor_name TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    action TEXT NOT NULL,
    opportunities_deducted INTEGER NOT NULL DEFAULT 1,
    remaining_balance INTEGER NOT NULL,
    notes TEXT,
    request_id TEXT REFERENCES public.service_requests(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_vendor_id ON public.opportunity_ledger(vendor_id);

-- 12. Customer Complaints & Escalations
CREATE TABLE IF NOT EXISTS public.complaints (
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

CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);

-- 13. Payment Transactions Ledger
CREATE TABLE IF NOT EXISTS public.payments (
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

CREATE INDEX IF NOT EXISTS idx_payments_request_id ON public.payments(request_id);

-- 14. Audit Logs for DPDP Act & Operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('CUSTOMER', 'EMPLOYEE', 'VENDOR', 'BOOKING', 'DISPATCH', 'PAYMENT', 'COMPLAINT', 'SYSTEM')),
    entity_id TEXT NOT NULL,
    details TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 15. Automatic updated_at Helper Function & Triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendors_updated_at ON public.vendors;
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_requests_updated_at ON public.service_requests;
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_home_projects_updated_at ON public.home_projects;
CREATE TRIGGER update_home_projects_updated_at BEFORE UPDATE ON public.home_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_complaints_updated_at ON public.complaints;
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ops_settings_updated_at ON public.ops_settings;
CREATE TRIGGER update_ops_settings_updated_at BEFORE UPDATE ON public.ops_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

