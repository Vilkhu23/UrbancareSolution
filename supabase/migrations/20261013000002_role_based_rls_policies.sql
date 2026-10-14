-- ==============================================================================
-- Migration: 20261013000002_role_based_rls_policies.sql
-- Description: Drops open USING (true) policies and establishes strict, role-based
--              Row Level Security policies across all tables.
-- ==============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_settings ENABLE ROW LEVEL SECURITY;

-- 2. Drop all insecure legacy policies
DROP POLICY IF EXISTS "Public read service categories" ON public.service_categories;
DROP POLICY IF EXISTS "Public read services" ON public.services;
DROP POLICY IF EXISTS "Allow public read customers" ON public.customers;
DROP POLICY IF EXISTS "Allow insert customers" ON public.customers;
DROP POLICY IF EXISTS "Allow update customers" ON public.customers;
DROP POLICY IF EXISTS "Allow read employees" ON public.employees;
DROP POLICY IF EXISTS "Allow update employees" ON public.employees;
DROP POLICY IF EXISTS "Allow insert employees" ON public.employees;
DROP POLICY IF EXISTS "Allow read vendors" ON public.vendors;
DROP POLICY IF EXISTS "Allow insert vendors" ON public.vendors;
DROP POLICY IF EXISTS "Allow update vendors" ON public.vendors;
DROP POLICY IF EXISTS "Allow read service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Allow insert service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Allow update service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Allow read home projects" ON public.home_projects;
DROP POLICY IF EXISTS "Allow insert home projects" ON public.home_projects;
DROP POLICY IF EXISTS "Allow update home projects" ON public.home_projects;
DROP POLICY IF EXISTS "Allow read opportunity ledger" ON public.opportunity_ledger;
DROP POLICY IF EXISTS "Allow insert opportunity ledger" ON public.opportunity_ledger;
DROP POLICY IF EXISTS "Allow read complaints" ON public.complaints;
DROP POLICY IF EXISTS "Allow insert complaints" ON public.complaints;
DROP POLICY IF EXISTS "Allow update complaints" ON public.complaints;
DROP POLICY IF EXISTS "Allow read payments" ON public.payments;
DROP POLICY IF EXISTS "Allow insert payments" ON public.payments;
DROP POLICY IF EXISTS "Allow read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow read ops settings" ON public.ops_settings;
DROP POLICY IF EXISTS "Allow update ops settings" ON public.ops_settings;

-- ==============================================================================
-- 3. PROFILES POLICIES
-- ==============================================================================
-- Any authenticated user can read their own profile
CREATE POLICY "profiles_select_own"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Any authenticated user can update their own profile (triggers prevent privilege escalation)
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Ops Manager and Admin can view all profiles
CREATE POLICY "profiles_select_ops"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (public.get_current_user_role() IN ('ops_manager', 'admin'));

-- Admin can manage all profiles
CREATE POLICY "profiles_manage_admin"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.get_current_user_role() = 'admin')
    WITH CHECK (public.get_current_user_role() = 'admin');

-- ==============================================================================
-- 4. SERVICE CATALOG POLICIES (Public read-only)
-- ==============================================================================
CREATE POLICY "service_categories_public_read"
    ON public.service_categories FOR SELECT
    USING (true);

CREATE POLICY "service_categories_ops_manage"
    ON public.service_categories FOR ALL
    TO authenticated
    USING (public.get_current_user_role() IN ('ops_manager', 'admin'))
    WITH CHECK (public.get_current_user_role() IN ('ops_manager', 'admin'));

CREATE POLICY "services_public_read"
    ON public.services FOR SELECT
    USING (true);

CREATE POLICY "services_ops_manage"
    ON public.services FOR ALL
    TO authenticated
    USING (public.get_current_user_role() IN ('ops_manager', 'admin'))
    WITH CHECK (public.get_current_user_role() IN ('ops_manager', 'admin'));

-- ==============================================================================
-- 5. CUSTOMERS TABLE POLICIES (Strict auth.uid() matching via user_id)
-- ==============================================================================
CREATE POLICY "customers_select_own"
    ON public.customers FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "customers_insert_own"
    ON public.customers FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "customers_update_own"
    ON public.customers FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "customers_ops_manage"
    ON public.customers FOR ALL
    TO authenticated
    USING (public.get_current_user_role() IN ('ops_manager', 'admin'))
    WITH CHECK (public.get_current_user_role() IN ('ops_manager', 'admin'));

-- ==============================================================================
-- 6. SERVICE REQUESTS (BOOKINGS) POLICIES
-- ==============================================================================
-- Customers: select, create, update strictly by user_id = auth.uid()
CREATE POLICY "service_requests_customer_select"
    ON public.service_requests FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "service_requests_customer_insert"
    ON public.service_requests FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "service_requests_customer_update"
    ON public.service_requests FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Technicians: only bookings assigned to their employee record (matching user_id)
CREATE POLICY "service_requests_technician_select"
    ON public.service_requests FOR SELECT
    TO authenticated
    USING (
        public.get_current_user_role() = 'technician' AND
        assigned_to->>'id' IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    );

CREATE POLICY "service_requests_technician_update"
    ON public.service_requests FOR UPDATE
    TO authenticated
    USING (
        public.get_current_user_role() = 'technician' AND
        assigned_to->>'id' IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    )
    WITH CHECK (
        public.get_current_user_role() = 'technician' AND
        assigned_to->>'id' IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    );

-- Vendors: only bookings assigned to their vendor record (matching user_id)
CREATE POLICY "service_requests_vendor_select"
    ON public.service_requests FOR SELECT
    TO authenticated
    USING (
        public.get_current_user_role() = 'vendor' AND
        assigned_to->>'id' IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
    );

CREATE POLICY "service_requests_vendor_update"
    ON public.service_requests FOR UPDATE
    TO authenticated
    USING (
        public.get_current_user_role() = 'vendor' AND
        assigned_to->>'id' IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
    )
    WITH CHECK (
        public.get_current_user_role() = 'vendor' AND
        assigned_to->>'id' IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
    );

-- Ops Manager and Admin: full unrestricted access
CREATE POLICY "service_requests_ops_manage"
    ON public.service_requests FOR ALL
    TO authenticated
    USING (public.get_current_user_role() IN ('ops_manager', 'admin'))
    WITH CHECK (public.get_current_user_role() IN ('ops_manager', 'admin'));

-- ==============================================================================
-- 7. EMPLOYEES & VENDORS TABLES POLICIES (Technician & Vendor own profile)
-- ==============================================================================
-- Technicians can read their own employee record matching user_id = auth.uid()
CREATE POLICY "employees_select_own"
    ON public.employees FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "employees_ops_manage"
    ON public.employees FOR ALL
    TO authenticated
    USING (public.get_current_user_role() IN ('ops_manager', 'admin'))
    WITH CHECK (public.get_current_user_role() IN ('ops_manager', 'admin'));

-- Vendors can read & update their own vendor record matching user_id = auth.uid()
CREATE POLICY "vendors_select_own"
    ON public.vendors FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "vendors_update_own"
    ON public.vendors FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "vendors_ops_manage"
    ON public.vendors FOR ALL
    TO authenticated
    USING (public.get_current_user_role() IN ('ops_manager', 'admin'))
    WITH CHECK (public.get_current_user_role() IN ('ops_manager', 'admin'));

-- ==============================================================================
-- 8. OPPORTUNITY LEDGER (VENDORS)
-- ==============================================================================
CREATE POLICY "opportunity_ledger_vendor_select"
    ON public.opportunity_ledger FOR SELECT
    TO authenticated
    USING (
        public.get_current_user_role() = 'vendor' AND
        vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
    );

CREATE POLICY "opportunity_ledger_ops_manage"
    ON public.opportunity_ledger FOR ALL
    TO authenticated
    USING (public.get_current_user_role() IN ('ops_manager', 'admin'))
    WITH CHECK (public.get_current_user_role() IN ('ops_manager', 'admin'));

-- ==============================================================================
-- 9. COMPLAINTS & PAYMENTS (Strict auth.uid() via user_id)
-- ==============================================================================
CREATE POLICY "complaints_customer_select"
    ON public.complaints FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "complaints_customer_insert"
    ON public.complaints FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "complaints_ops_manage"
    ON public.complaints FOR ALL
    TO authenticated
    USING (public.get_current_user_role() IN ('ops_manager', 'admin'))
    WITH CHECK (public.get_current_user_role() IN ('ops_manager', 'admin'));

CREATE POLICY "payments_customer_select"
    ON public.payments FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "payments_customer_insert"
    ON public.payments FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "payments_ops_manage"
    ON public.payments FOR ALL
    TO authenticated
    USING (public.get_current_user_role() IN ('ops_manager', 'admin'))
    WITH CHECK (public.get_current_user_role() IN ('ops_manager', 'admin'));

-- ==============================================================================
-- 10. HOME PROJECTS, AUDIT LOGS & OPS SETTINGS
-- ==============================================================================
CREATE POLICY "home_projects_customer_select"
    ON public.home_projects FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "home_projects_customer_insert"
    ON public.home_projects FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "home_projects_ops_manage"
    ON public.home_projects FOR ALL
    TO authenticated
    USING (public.get_current_user_role() IN ('ops_manager', 'admin'))
    WITH CHECK (public.get_current_user_role() IN ('ops_manager', 'admin'));

CREATE POLICY "audit_logs_ops_access"
    ON public.audit_logs FOR ALL
    TO authenticated
    USING (public.get_current_user_role() IN ('ops_manager', 'admin'))
    WITH CHECK (public.get_current_user_role() IN ('ops_manager', 'admin'));

CREATE POLICY "ops_settings_ops_access"
    ON public.ops_settings FOR ALL
    TO authenticated
    USING (public.get_current_user_role() IN ('ops_manager', 'admin'))
    WITH CHECK (public.get_current_user_role() IN ('ops_manager', 'admin'));
