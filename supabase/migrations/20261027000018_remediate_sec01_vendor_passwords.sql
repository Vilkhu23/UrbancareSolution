-- ==============================================================================
-- Migration: 20261027000018_remediate_sec01_vendor_passwords.sql
-- Description: SEC-01 Remediation - Eliminate plaintext vendor password persistence.
--              1. Drops the unencrypted 'password' column from public.vendors.
--              2. Reaffirms that credentials reside exclusively in auth.users (bcrypt-hashed).
--              3. Restricts vendor operational access (opportunity_ledger, service_requests)
--                 strictly to vendors with status = 'ACTIVE' and profile role = 'vendor'.
-- ==============================================================================

-- 1. DROP PLAINTEXT PASSWORD COLUMN FROM VENDORS TABLE
ALTER TABLE public.vendors 
DROP COLUMN IF EXISTS password;

-- 2. HARDEN VENDOR ASSIGNMENT & OPPORTUNITY LEDGER RLS POLICIES
-- Ensure pending vendors ('PENDING_VERIFICATION') cannot read dispatch opportunities
DROP POLICY IF EXISTS "opportunity_ledger_vendor_select" ON public.opportunity_ledger;
CREATE POLICY "opportunity_ledger_vendor_select"
    ON public.opportunity_ledger FOR SELECT
    TO authenticated
    USING (
        public.get_current_user_role() = 'vendor' AND
        vendor_id IN (
            SELECT id FROM public.vendors 
            WHERE user_id = auth.uid() 
              AND status = 'ACTIVE'
        )
    );

-- Ensure pending vendors cannot read or update assigned service requests
DROP POLICY IF EXISTS "service_requests_vendor_select" ON public.service_requests;
CREATE POLICY "service_requests_vendor_select"
    ON public.service_requests FOR SELECT
    TO authenticated
    USING (
        public.get_current_user_role() = 'vendor' AND
        assigned_to->>'id' IN (
            SELECT id FROM public.vendors 
            WHERE user_id = auth.uid() 
              AND status = 'ACTIVE'
        )
    );

DROP POLICY IF EXISTS "service_requests_vendor_update" ON public.service_requests;
CREATE POLICY "service_requests_vendor_update"
    ON public.service_requests FOR UPDATE
    TO authenticated
    USING (
        public.get_current_user_role() = 'vendor' AND
        assigned_to->>'id' IN (
            SELECT id FROM public.vendors 
            WHERE user_id = auth.uid() 
              AND status = 'ACTIVE'
        )
    )
    WITH CHECK (
        public.get_current_user_role() = 'vendor' AND
        assigned_to->>'id' IN (
            SELECT id FROM public.vendors 
            WHERE user_id = auth.uid() 
              AND status = 'ACTIVE'
        )
    );

-- 3. HARDEN HOME PROJECTS VENDOR POLICIES
-- Ensure pending vendors cannot view or alter home projects
DROP POLICY IF EXISTS "home_projects_vendor_select" ON public.home_projects;
CREATE POLICY "home_projects_vendor_select"
    ON public.home_projects FOR SELECT
    TO authenticated
    USING (
        public.get_current_user_role() = 'vendor' AND
        assigned_vendor_id IN (
            SELECT id FROM public.vendors 
            WHERE user_id = auth.uid() 
              AND status = 'ACTIVE'
        )
    );

DROP POLICY IF EXISTS "home_projects_vendor_update" ON public.home_projects;
CREATE POLICY "home_projects_vendor_update"
    ON public.home_projects FOR UPDATE
    TO authenticated
    USING (
        public.get_current_user_role() = 'vendor' AND
        assigned_vendor_id IN (
            SELECT id FROM public.vendors 
            WHERE user_id = auth.uid() 
              AND status = 'ACTIVE'
        )
    )
    WITH CHECK (
        public.get_current_user_role() = 'vendor' AND
        assigned_vendor_id IN (
            SELECT id FROM public.vendors 
            WHERE user_id = auth.uid() 
              AND status = 'ACTIVE'
        )
    );

