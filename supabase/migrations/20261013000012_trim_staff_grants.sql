-- ==============================================================================
-- Migration: 20261013000012_trim_staff_grants.sql
-- Description: Revoke DELETE privilege on public.employees and public.vendors
--              from authenticated role. The web application manages staff
--              lifecycles via status transitions (e.g. ACTIVE, ON_LEAVE,
--              INACTIVE, REJECTED) and never hard deletes rows from the browser.
--              Maintains SELECT, INSERT, UPDATE for authenticated and ALL for service_role.
-- ==============================================================================

-- 1. Revoke DELETE privilege from authenticated role on staff tables
REVOKE DELETE ON public.employees FROM authenticated;
REVOKE DELETE ON public.vendors FROM authenticated;

-- 2. Explicitly reaffirm least-privilege grants
GRANT SELECT, INSERT, UPDATE ON public.employees TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.vendors TO authenticated;
GRANT ALL ON public.employees TO service_role;
GRANT ALL ON public.vendors TO service_role;
