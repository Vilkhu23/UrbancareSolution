-- ==============================================================================
-- Migration: 20261013000009_unique_phone.sql
-- Description: Enforces strict one-account-per-mobile-number policy.
--              - Normalizes Indian national mobile numbers (10 digits starting 6-9)
--              - Backfills and validates profiles.phone_normalized
--              - Duplicate prevention in triggers (handle_new_user, sync_profile_phone_normalized)
--              - Creates unique partial index on profiles.phone_normalized
--              - Rate-limited check_phone_available(p_phone) for anonymous & authenticated checks
--              - Admin-only admin_release_phone(p_user_id, p_reason) with audit logging
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PHONE NORMALIZATION FUNCTION
-- Keeps digits only, removes leading 0, removes leading 91 when 12 digits remain,
-- and returns 10-digit national number starting 6 to 9 (NULL for invalid input).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_phone(p_phone TEXT)
RETURNS TEXT AS $$
DECLARE
    v_digits TEXT;
BEGIN
    IF p_phone IS NULL OR trim(p_phone) = '' THEN
        RETURN NULL;
    END IF;

    -- Extract digits only
    v_digits := regexp_replace(p_phone, '[^0-9]', '', 'g');

    -- Remove leading 0 if present (e.g. 09888811111 -> 9888811111)
    WHILE length(v_digits) > 10 AND v_digits LIKE '0%' LOOP
        v_digits := substring(v_digits from 2);
    END LOOP;

    -- Remove leading 91 when 12 digits remain (e.g. 919888811111 -> 9888811111)
    IF length(v_digits) = 12 AND v_digits LIKE '91%' THEN
        v_digits := substring(v_digits from 3);
    END IF;

    -- Return 10-digit national number starting with 6-9, or NULL for invalid input
    IF length(v_digits) = 10 AND v_digits ~ '^[6-9][0-9]{9}$' THEN
        RETURN v_digits;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT SET search_path = public;

-- Grant execution to all roles
GRANT EXECUTE ON FUNCTION public.normalize_phone(TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 2. SCHEMA UPDATE: profiles.phone_normalized & nullable phone column
-- ------------------------------------------------------------------------------
-- Allow phone to be cleared on admin phone release while maintaining auditability
ALTER TABLE public.profiles
    ALTER COLUMN phone DROP NOT NULL;

-- Add phone_normalized column to profiles
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS phone_normalized TEXT;

-- Backfill existing profiles rows using normalize_phone
UPDATE public.profiles
SET phone_normalized = public.normalize_phone(phone)
WHERE phone IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 3. CHECK FOR EXISTING DUPLICATES BEFORE CREATING UNIQUE INDEX
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_duplicates TEXT;
BEGIN
    SELECT string_agg(phone_normalized || ' (found ' || cnt::TEXT || ' times across account IDs: ' || uids || ')', E'\n')
    INTO v_duplicates
    FROM (
        SELECT phone_normalized, COUNT(*) AS cnt, string_agg(id::TEXT, ', ') AS uids
        FROM public.profiles
        WHERE phone_normalized IS NOT NULL
        GROUP BY phone_normalized
        HAVING COUNT(*) > 1
    ) dupes;

    IF v_duplicates IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot create UNIQUE index on profiles.phone_normalized because existing duplicates were detected:%', E'\n' || v_duplicates;
    END IF;
END $$;

-- Create partial UNIQUE index ignoring NULLs
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_normalized
    ON public.profiles(phone_normalized)
    WHERE phone_normalized IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 4. PROFILE PHONE SYNCHRONIZATION & COLLISION DETECTION TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_profile_phone_normalized()
RETURNS TRIGGER AS $$
DECLARE
    v_caller_role TEXT;
    v_existing_id UUID;
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

    -- Detect collision with another account
    IF NEW.phone_normalized IS NOT NULL THEN
        SELECT id INTO v_existing_id
        FROM public.profiles
        WHERE phone_normalized = NEW.phone_normalized
          AND (TG_OP = 'INSERT' OR id != NEW.id)
        LIMIT 1;

        IF v_existing_id IS NOT NULL THEN
            RAISE EXCEPTION 'PHONE_ALREADY_REGISTERED: Mobile number % is already registered to another account.', NEW.phone;
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
-- 5. UPDATE PRIVILEGE ESCALATION TRIGGER ON PROFILES
-- Ensure customers changing their phone number can reset phone_verified to false
-- without failing the privilege escalation guard.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
DECLARE
    caller_role TEXT;
BEGIN
    -- Check if sensitive fields are being altered
    IF (NEW.role IS DISTINCT FROM OLD.role) OR
       (NEW.phone_verified IS DISTINCT FROM OLD.phone_verified) OR
       (NEW.must_change_password IS DISTINCT FROM OLD.must_change_password) THEN

        SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();

        -- Non-admin callers:
        IF auth.uid() IS NOT NULL AND (caller_role IS NULL OR caller_role != 'admin') THEN
            -- ALLOW EXCEPTION 1: User clearing their own must_change_password flag from true to false
            IF (OLD.must_change_password = true AND NEW.must_change_password = false) AND
               (NEW.role IS NOT DISTINCT FROM OLD.role) AND
               (NEW.phone_verified IS NOT DISTINCT FROM OLD.phone_verified) THEN
                NULL;
            -- ALLOW EXCEPTION 2: User changing their own phone number, which resets phone_verified to false
            ELSIF (NEW.phone IS DISTINCT FROM OLD.phone) AND
                  (NEW.phone_verified = false) AND
                  (NEW.role IS NOT DISTINCT FROM OLD.role) AND
                  (NEW.must_change_password IS NOT DISTINCT FROM OLD.must_change_password) THEN
                NULL;
            ELSE
                RAISE EXCEPTION 'Privilege escalation rejected: only administrators may modify role, phone_verified, or set must_change_password.';
            END IF;
        END IF;
    END IF;

    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 6. UPDATE handle_new_user() TRIGGER ON auth.users SIGNUP
-- Normalizes the phone and fails with 'PHONE_ALREADY_REGISTERED' on collision.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_raw_phone TEXT;
    v_norm_phone TEXT;
    v_existing_id UUID;
BEGIN
    v_raw_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
    v_norm_phone := public.normalize_phone(v_raw_phone);

    -- Strict duplicate check before inserting profile
    IF v_norm_phone IS NOT NULL THEN
        SELECT id INTO v_existing_id
        FROM public.profiles
        WHERE phone_normalized = v_norm_phone
        LIMIT 1;

        IF v_existing_id IS NOT NULL THEN
            RAISE EXCEPTION 'PHONE_ALREADY_REGISTERED: Mobile number % is already associated with another account.', v_raw_phone;
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
        'customer', -- STRICT: Always set to 'customer' server-side. Ignore raw_user_meta_data->>'role'
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'UrbanCare Resident'),
        v_raw_phone,
        v_norm_phone,
        false, -- Phone starts unverified
        COALESCE(NEW.raw_user_meta_data->>'locality', 'Sector 94, Mohali'),
        COALESCE(NEW.raw_user_meta_data->>'address', ''),
        false
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 7. RATE-LIMITED check_phone_available(p_phone text)
-- Returns strictly TRUE or FALSE. Rate-limited to max 10 calls per minute per client IP.
-- Does NOT reveal any account information.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.phone_check_rate_limits (
    client_key TEXT PRIMARY KEY,
    call_count INT NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Secure the rate limit table from client modification
ALTER TABLE public.phone_check_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.phone_check_rate_limits FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.check_phone_available(p_phone TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_norm TEXT;
    v_headers json;
    v_ip TEXT := 'direct';
    v_client_key TEXT;
    v_window_start TIMESTAMPTZ;
    v_count INT;
BEGIN
    -- Extract caller IP from PostgREST request headers if present
    BEGIN
        v_headers := NULLIF(current_setting('request.headers', true), '')::json;
        IF v_headers IS NOT NULL THEN
            v_ip := COALESCE(
                v_headers->>'cf-connecting-ip',
                split_part(v_headers->>'x-forwarded-for', ',', 1),
                v_headers->>'x-real-ip',
                'direct'
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_ip := 'direct';
    END;

    -- Hash the client key
    v_client_key := md5(trim(v_ip));

    -- Rate limiting check: max 10 calls per minute
    SELECT window_start, call_count INTO v_window_start, v_count
    FROM public.phone_check_rate_limits
    WHERE client_key = v_client_key
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.phone_check_rate_limits (client_key, call_count, window_start)
        VALUES (v_client_key, 1, NOW())
        ON CONFLICT (client_key) DO UPDATE
        SET call_count = 1, window_start = NOW();
    ELSIF NOW() - v_window_start > INTERVAL '1 minute' THEN
        UPDATE public.phone_check_rate_limits
        SET call_count = 1,
            window_start = NOW()
        WHERE client_key = v_client_key;
    ELSE
        IF v_count >= 10 THEN
            RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED: Maximum 10 phone availability checks per minute allowed.';
        END IF;

        UPDATE public.phone_check_rate_limits
        SET call_count = call_count + 1
        WHERE client_key = v_client_key;
    END IF;

    -- Normalize input phone
    v_norm := public.normalize_phone(p_phone);
    IF v_norm IS NULL THEN
        RETURN false;
    END IF;

    -- Check availability (strictly boolean, leaks no account details)
    IF EXISTS (
        SELECT 1 FROM public.profiles WHERE phone_normalized = v_norm
    ) THEN
        RETURN false;
    ELSE
        RETURN true;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execution to public clients for pre-registration check
GRANT EXECUTE ON FUNCTION public.check_phone_available(TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 8. ADMIN-ONLY admin_release_phone(p_user_id uuid, p_reason text)
-- Clears the phone from an account, sets phone_verified = false, and logs to audit_logs.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_release_phone(p_user_id UUID, p_reason TEXT)
RETURNS jsonb AS $$
DECLARE
    v_caller_id UUID;
    v_caller_role TEXT;
    v_old_phone TEXT;
    v_old_norm TEXT;
    v_clean_reason TEXT;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Authentication required to release mobile number.';
    END IF;

    SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;
    IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
        RAISE EXCEPTION 'FORBIDDEN: Only administrators can release mobile numbers.';
    END IF;

    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_ARGUMENT: Target user_id is required.';
    END IF;

    v_clean_reason := trim(COALESCE(p_reason, ''));
    IF v_clean_reason = '' THEN
        RAISE EXCEPTION 'INVALID_ARGUMENT: An administrative justification reason is required.';
    END IF;

    -- Fetch existing profile phone
    SELECT phone, phone_normalized INTO v_old_phone, v_old_norm
    FROM public.profiles
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'USER_NOT_FOUND: Profile with ID % does not exist.', p_user_id;
    END IF;

    -- Clear phone and normalized phone on profile
    UPDATE public.profiles
    SET phone = '',
        phone_normalized = NULL,
        phone_verified = false,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Clear phone on corresponding customer row if exists
    UPDATE public.customers
    SET phone = '',
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Write immutable audit log record
    INSERT INTO public.audit_logs (
        id,
        action,
        entity_type,
        entity_id,
        details,
        performed_by,
        timestamp,
        created_at
    ) VALUES (
        'aud-rel-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8),
        'RELEASE_PHONE',
        'CUSTOMER',
        p_user_id::TEXT,
        'Mobile number ' || COALESCE(v_old_norm, v_old_phone, '[NONE]') || ' released by admin. Reason: ' || v_clean_reason,
        COALESCE(v_caller_role, 'admin') || ' (' || v_caller_id::TEXT || ')',
        NOW()::TEXT,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'released_phone', COALESCE(v_old_norm, v_old_phone),
        'reason', v_clean_reason
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execution to authenticated users (admin role verified internally)
GRANT EXECUTE ON FUNCTION public.admin_release_phone(UUID, TEXT) TO authenticated;
