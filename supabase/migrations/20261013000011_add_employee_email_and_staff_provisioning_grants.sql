-- ==============================================================================
-- Migration: 20261013000011_add_employee_email_and_staff_provisioning_grants.sql
-- Description: Adds email column to employees table and reaffirms explicit grants
--              and RLS policies for staff provisioning and employee management.
-- ==============================================================================

-- 1. Add email column to employees table if not present
ALTER TABLE public.employees
    ADD COLUMN IF NOT EXISTS email TEXT;

CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);

-- 2. Verify RLS is enabled on employees and vendors
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- 3. Ensure operations managers and administrators have full manage permissions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'employees' AND policyname = 'employees_ops_manage'
    ) THEN
        CREATE POLICY "employees_ops_manage"
            ON public.employees FOR ALL
            TO authenticated
            USING (public.get_current_user_role() IN ('ops_manager', 'admin'))
            WITH CHECK (public.get_current_user_role() IN ('ops_manager', 'admin'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'vendors' AND policyname = 'vendors_ops_manage'
    ) THEN
        CREATE POLICY "vendors_ops_manage"
            ON public.vendors FOR ALL
            TO authenticated
            USING (public.get_current_user_role() IN ('ops_manager', 'admin'))
            WITH CHECK (public.get_current_user_role() IN ('ops_manager', 'admin'));
    END IF;
END $$;

-- 4. Explicit minimal privilege grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT ALL ON public.employees TO service_role;
GRANT ALL ON public.vendors TO service_role;
