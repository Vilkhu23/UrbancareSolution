-- ==============================================================================
-- Migration: 20261013000001_create_profiles_and_auth_trigger.sql
-- Description: Creates the profiles table, adds user_id foreign keys, enforces
--              privilege escalation checks, and creates auth.users signup triggers.
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Profiles Table (1-to-1 with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'technician', 'vendor', 'ops_manager', 'admin')),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    phone_verified BOOLEAN NOT NULL DEFAULT false,
    locality TEXT DEFAULT 'Sector 94, Mohali',
    address TEXT,
    must_change_password BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- 2. Add user_id Foreign Key Columns to Existing Tables (FK -> profiles.id)
-- Customer RLS and Staff RLS rely strictly on user_id (auth.uid()), never on unverified phones or names
ALTER TABLE public.customers
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);

ALTER TABLE public.service_requests
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON public.service_requests(user_id);

ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);

ALTER TABLE public.complaints
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON public.complaints(user_id);

ALTER TABLE public.employees
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);

ALTER TABLE public.vendors
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);

ALTER TABLE public.home_projects
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_home_projects_user_id ON public.home_projects(user_id);

-- 3. Security Helper Function: Get Current User Role
-- Must be SECURITY DEFINER with SET search_path = public
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 4. Privilege Escalation Prevention Trigger on Profiles
-- Non-admins may only modify full_name, phone, address, and locality.
-- Changing role, phone_verified, or must_change_password requires admin privilege.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
DECLARE
    caller_role TEXT;
BEGIN
    -- Check if sensitive fields are being altered
    IF (NEW.role IS DISTINCT FROM OLD.role) OR
       (NEW.phone_verified IS DISTINCT FROM OLD.phone_verified) OR
       (NEW.must_change_password IS DISTINCT FROM OLD.must_change_password) THEN

        -- Look up the active session caller's role
        SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();

        -- Reject if the caller is not an admin (and caller is an authenticated user)
        IF auth.uid() IS NOT NULL AND (caller_role IS NULL OR caller_role != 'admin') THEN
            RAISE EXCEPTION 'Privilege escalation rejected: only administrators may modify role, phone_verified, or must_change_password.';
        END IF;
    END IF;

    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trigger_prevent_profile_privilege_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 5. Automatic Profile Provisioning Trigger on auth.users Sign Up
-- MUST ignore any client-supplied role in raw_user_meta_data and always set role = 'customer'.
-- Phone is marked unverified (phone_verified = false).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        role,
        full_name,
        phone,
        phone_verified,
        locality,
        address,
        must_change_password
    ) VALUES (
        NEW.id,
        'customer', -- STRICT: Always set to 'customer' server-side. Ignore raw_user_meta_data->>'role'
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'UrbanCare Resident'),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        false, -- Phone starts unverified
        COALESCE(NEW.raw_user_meta_data->>'locality', 'Sector 94, Mohali'),
        COALESCE(NEW.raw_user_meta_data->>'address', ''),
        false
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
