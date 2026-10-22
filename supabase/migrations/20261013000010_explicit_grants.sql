-- ==============================================================================
-- Migration: 20261013000010_explicit_grants.sql
-- Description: Establishes explicit Data API grants, sequence permissions, routine
--              execution privileges, and closed default privileges across schema public.
-- Context: Prepared for Supabase breaking change (October 30, 2026) removing
--          automatic Data API grants on new tables in schema public.
-- Idempotency: Fully idempotent. Safe to run on existing projects and brand-new instances.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ROW LEVEL SECURITY (RLS) ENABLEMENT CHECKS
-- Guarantee RLS is active on every existing public schema table.
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_request_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.home_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.opportunity_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ops_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.phone_check_rate_limits ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. REVOKE UNWANTED PRIVILEGES (BASELINE PRIVILEGE LOCKDOWN)
-- Strip dangerous DDL and mutation privileges across all public tables.
-- ------------------------------------------------------------------------------
-- Revoke TRUNCATE, REFERENCES, TRIGGER from both anon and authenticated
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- Strip all table privileges from anon as baseline
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- Strip private/internal table privileges from authenticated
REVOKE ALL ON public.phone_check_rate_limits FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.service_request_secrets FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.payments FROM authenticated;
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.audit_logs FROM authenticated;

-- Strip DELETE on core operational tables from authenticated (the app does not delete records)
REVOKE DELETE ON
    public.profiles,
    public.customers,
    public.employees,
    public.vendors,
    public.service_requests,
    public.home_projects,
    public.opportunity_ledger,
    public.complaints,
    public.ops_settings
FROM authenticated;

-- ------------------------------------------------------------------------------
-- 3. EXPLICIT TABLE GRANTS (MINIMAL PRIVILEGE MATRIX)
-- ------------------------------------------------------------------------------

-- (A) ANON ROLE (Public / Unauthenticated Website Visitors)
-- Only allowed to read public service catalog and operational zone settings
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.service_categories TO anon;
GRANT SELECT ON public.ops_settings TO anon;

-- (B) AUTHENTICATED ROLE (Logged-in Customers, Technicians, Vendors, Staff, Admins)
-- Catalog & Settings Read
GRANT SELECT ON public.services TO authenticated;
GRANT SELECT ON public.service_categories TO authenticated;
GRANT SELECT ON public.ops_settings TO authenticated;

-- Catalog mutations for Admin / Operations (governed by RLS)
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_categories TO authenticated;
GRANT UPDATE ON public.ops_settings TO authenticated;

-- Core business & operational tables (governed by role-based RLS)
GRANT SELECT, INSERT, UPDATE ON
    public.profiles,
    public.customers,
    public.employees,
    public.vendors,
    public.service_requests,
    public.home_projects,
    public.opportunity_ledger,
    public.complaints
TO authenticated;

-- Append-only audit logging
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;

-- Restricted read-only access (mutations handled exclusively by SECURITY DEFINER RPCs)
GRANT SELECT ON public.service_request_secrets TO authenticated;
GRANT SELECT ON public.payments TO authenticated;

-- (C) SERVICE_ROLE (Backend Admin, Edge Functions, Migrations, Webhooks)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ------------------------------------------------------------------------------
-- 4. SEQUENCES GRANTS
-- ------------------------------------------------------------------------------
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ------------------------------------------------------------------------------
-- 5. FUNCTION & ROUTINE EXECUTION HARDENING
-- Baseline: Revoke EXECUTE from PUBLIC, anon, and authenticated on ALL routines.
-- Then explicitly grant EXECUTE only to authorized roles.
-- ------------------------------------------------------------------------------
REVOKE EXECUTE ON ALL ROUTINES IN SCHEMA public FROM PUBLIC, anon, authenticated;

-- (A) Pre-registration check: callable by unauthenticated visitors and authenticated users
GRANT EXECUTE ON FUNCTION public.check_phone_available(TEXT) TO anon, authenticated;

-- (B) Operational RPCs & helpers: callable by authenticated users (internal checks enforce role)
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.normalize_phone(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_job_otp(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_payment(TEXT, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_job_otp_lock(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_release_phone(UUID, TEXT) TO authenticated;

-- (C) Service Role retains all execution privileges
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- ------------------------------------------------------------------------------
-- 6. ALTER DEFAULT PRIVILEGES (CLOSE PUBLIC SCHEMA BY DEFAULT FOR FUTURE OBJECTS)
-- Any future table, sequence, or function created in public will be closed
-- by default, requiring explicit grants in the migration that creates it.
-- ------------------------------------------------------------------------------
-- Current migration execution role
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

-- Reaffirm for postgres role explicitly if distinct from current user
DO $$
BEGIN
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role';
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role';
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON ROUTINES FROM PUBLIC, anon, authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role';
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
