-- ==============================================================================
-- Migration: 20261013000007_revoke_unneeded_grants.sql
-- Description: Hardens public schema table grants:
--              1. Revokes ALL privileges on public.service_request_secrets from anon.
--              2. Revokes INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on
--                 public.service_request_secrets from authenticated (retains SELECT only).
--              3. Revokes TRUNCATE, REFERENCES, TRIGGER on all public tables from anon
--                 and authenticated.
--              4. Revokes unneeded write and data access from anon, preserving only public
--                 read access required by unauthenticated visitors (services, service_categories, ops_settings).
--              5. Reaffirms necessary client CRUD permissions on operational tables for
--                 authenticated users (governed by RLS policies).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ISOLATED SECRETS TABLE (service_request_secrets)
-- ------------------------------------------------------------------------------
-- Unauthenticated users have zero access to secrets
REVOKE ALL ON public.service_request_secrets FROM anon;

-- Authenticated clients only require SELECT (to read their own OTP via RLS policy).
-- Secret generation is executed exclusively via AFTER INSERT trigger (SECURITY DEFINER).
-- Secret verification is executed exclusively via verify_job_otp RPC (SECURITY DEFINER).
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.service_request_secrets FROM authenticated;
GRANT SELECT ON public.service_request_secrets TO authenticated;

-- ------------------------------------------------------------------------------
-- 2. REVOKE TRUNCATE, REFERENCES, TRIGGER ACROSS ALL PUBLIC TABLES
-- ------------------------------------------------------------------------------
REVOKE TRUNCATE, REFERENCES, TRIGGER ON
    public.profiles,
    public.service_categories,
    public.services,
    public.customers,
    public.employees,
    public.vendors,
    public.service_requests,
    public.home_projects,
    public.opportunity_ledger,
    public.complaints,
    public.payments,
    public.audit_logs,
    public.ops_settings,
    public.service_request_secrets
FROM anon, authenticated;

-- ------------------------------------------------------------------------------
-- 3. LOCK DOWN ANON (PUBLIC / UNAUTHENTICATED USERS)
-- ------------------------------------------------------------------------------
-- Revoke all table-level access from anon on private/business tables
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.customers FROM anon;
REVOKE ALL ON public.employees FROM anon;
REVOKE ALL ON public.vendors FROM anon;
REVOKE ALL ON public.service_requests FROM anon;
REVOKE ALL ON public.home_projects FROM anon;
REVOKE ALL ON public.opportunity_ledger FROM anon;
REVOKE ALL ON public.complaints FROM anon;
REVOKE ALL ON public.payments FROM anon;
REVOKE ALL ON public.audit_logs FROM anon;

-- Anon must not modify catalog or operational settings
REVOKE INSERT, UPDATE, DELETE ON public.services FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.service_categories FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.ops_settings FROM anon;

-- Unauthenticated public visitors only read public catalog and operational sector settings
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.service_categories TO anon;
GRANT SELECT ON public.ops_settings TO anon;

-- ------------------------------------------------------------------------------
-- 4. REAFFIRM AUTHENTICATED USER PERMISSIONS (GOVERNED BY RLS)
-- ------------------------------------------------------------------------------
-- Core operational tables used by authenticated customers, staff, vendors, and admins
GRANT SELECT, INSERT, UPDATE, DELETE ON
    public.profiles,
    public.service_categories,
    public.services,
    public.customers,
    public.employees,
    public.vendors,
    public.service_requests,
    public.home_projects,
    public.opportunity_ledger,
    public.complaints,
    public.audit_logs,
    public.ops_settings
TO authenticated;

-- Payments: SELECT only for authenticated clients (insertion is restricted to record_payment RPC & webhooks)
GRANT SELECT ON public.payments TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.payments FROM authenticated;
