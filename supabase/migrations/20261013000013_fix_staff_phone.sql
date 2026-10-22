-- ==============================================================================
-- Migration: 20261013000013_fix_staff_phone.sql
-- Description: Fixes phone collision detection in sync_profile_phone_normalized()
--              and handle_new_user() to always exclude the row's own id (id <> NEW.id)
--              across all paths (handle_new_user, upsert, admin update, self-update).
--              Also reveals existing account email only to admin/ops_manager callers.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. UPDATE sync_profile_phone_normalized()
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_profile_phone_normalized()
RETURNS TRIGGER AS $$
DECLARE
    v_caller_role TEXT;
    v_existing_id UUID;
    v_existing_email TEXT;
BEGIN
    -- Normalize phone input
    IF NEW.phone IS NULL OR trim(NEW.phone) = '' THEN
        NEW.phone := '';
        NEW.phone_normalized := NULL;
    ELSE
        NEW.phone_normalized := public.normalize_phone(NEW.phone);
    END IF;

    -- If phone changed on UPDATE:
    IF TG_OP = 'UPDATE' THEN
        IF NEW.phone IS DISTINCT FROM OLD.phone THEN
            -- If caller is non-admin, force phone_verified to false
            IF auth.uid() IS NOT NULL THEN
                SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
                IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
                    NEW.phone_verified := false;
                END IF;
            END IF;
        END IF;
    END IF;

    -- Detect collision with ANOTHER account (ALWAYS exclude same id!)
    IF NEW.phone_normalized IS NOT NULL THEN
        SELECT p.id, u.email INTO v_existing_id, v_existing_email
        FROM public.profiles p
        LEFT JOIN auth.users u ON u.id = p.id
        WHERE p.phone_normalized = NEW.phone_normalized
          AND p.id <> NEW.id
        LIMIT 1;

        IF v_existing_id IS NOT NULL THEN
            v_caller_role := public.get_current_user_role();
            IF v_caller_role IN ('admin', 'ops_manager') AND v_existing_email IS NOT NULL THEN
                RAISE EXCEPTION 'PHONE_ALREADY_REGISTERED: Mobile number % is already registered to account %.', NEW.phone, v_existing_email;
            ELSE
                RAISE EXCEPTION 'PHONE_ALREADY_REGISTERED: Mobile number % is already registered to another account.', NEW.phone;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_sync_profile_phone_normalized ON public.profiles;
CREATE TRIGGER trigger_sync_profile_phone_normalized
    BEFORE INSERT OR UPDATE OF phone, phone_normalized ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_profile_phone_normalized();

-- ------------------------------------------------------------------------------
-- 2. UPDATE handle_new_user()
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_raw_phone TEXT;
    v_norm_phone TEXT;
    v_existing_id UUID;
    v_existing_email TEXT;
    v_caller_role TEXT;
BEGIN
    v_raw_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
    v_norm_phone := public.normalize_phone(v_raw_phone);

    -- Strict duplicate check before inserting profile (exclude same id)
    IF v_norm_phone IS NOT NULL THEN
        SELECT p.id, u.email INTO v_existing_id, v_existing_email
        FROM public.profiles p
        LEFT JOIN auth.users u ON u.id = p.id
        WHERE p.phone_normalized = v_norm_phone
          AND p.id <> NEW.id
        LIMIT 1;

        IF v_existing_id IS NOT NULL THEN
            v_caller_role := public.get_current_user_role();
            IF v_caller_role IN ('admin', 'ops_manager') AND v_existing_email IS NOT NULL THEN
                RAISE EXCEPTION 'PHONE_ALREADY_REGISTERED: Mobile number % is already associated with account %.', v_raw_phone, v_existing_email;
            ELSE
                RAISE EXCEPTION 'PHONE_ALREADY_REGISTERED: Mobile number % is already associated with another account.', v_raw_phone;
            END IF;
        END IF;
    END IF;

    INSERT INTO public.profiles (
        id,
        role,
        full_name,
        phone,
        phone_normalized,
        phone_verified,
        locality,
        address,
        must_change_password
    ) VALUES (
        NEW.id,
        'customer', -- Default role for signups; staff Edge Function updates to technician/vendor/ops_manager
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'UrbanCare Resident'),
        v_raw_phone,
        v_norm_phone,
        false,
        COALESCE(NEW.raw_user_meta_data->>'locality', 'Sector 94, Mohali'),
        COALESCE(NEW.raw_user_meta_data->>'address', ''),
        false
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
