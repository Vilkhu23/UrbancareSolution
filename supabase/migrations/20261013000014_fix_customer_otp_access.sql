-- ==============================================================================
-- Migration: 20261013000014_fix_customer_otp_access.sql
-- Description: Fixes customer verification OTP generation and display:
--              1. Updates service_request_secrets RLS policy to allow customers
--                 to read secrets matching either user_id or normalized customer_phone.
--              2. Creates secure RPC get_customer_job_otp(p_request_id) that
--                 safely verifies resident ownership and self-heals missing secrets.
--              3. Backfills and links any pre-existing bookings (e.g. PB-5295, PB-8699)
--                 with their corresponding profile user_id and secret entries.
--              4. Grants EXECUTE to authenticated and service_role.
-- ==============================================================================

-- 1. Update RLS policy on service_request_secrets for authenticated customers
DROP POLICY IF EXISTS "service_request_secrets_customer_select" ON public.service_request_secrets;
CREATE POLICY "service_request_secrets_customer_select"
    ON public.service_request_secrets FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR request_id IN (
            SELECT id FROM public.service_requests
            WHERE user_id = auth.uid()
               OR (
                   customer_phone IS NOT NULL AND
                   public.normalize_phone(customer_phone) = (SELECT phone_normalized FROM public.profiles WHERE id = auth.uid())
               )
        )
    );

-- 2. Secure RPC to fetch and self-heal customer completion OTP
CREATE OR REPLACE FUNCTION public.get_customer_job_otp(p_request_id TEXT)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID;
    v_caller_role TEXT;
    v_customer_phone_norm TEXT;
    v_request RECORD;
    v_secret RECORD;
    v_otp TEXT;
    v_code TEXT;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    SELECT role, phone_normalized INTO v_caller_role, v_customer_phone_norm
    FROM public.profiles
    WHERE id = v_caller_id;

    -- Technicians and vendors must ask the customer in person on-site
    IF v_caller_role IN ('technician', 'vendor') THEN
        RAISE EXCEPTION 'Access denied: Service professionals must request completion code from resident on-site.';
    END IF;

    -- Fetch parent request
    SELECT * INTO v_request
    FROM public.service_requests
    WHERE id = p_request_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service request not found.';
    END IF;

    -- Authorization check: Admin, Ops Manager, or matching resident (by user_id or normalized phone)
    IF v_caller_role NOT IN ('admin', 'ops_manager') THEN
        IF (v_request.user_id IS DISTINCT FROM v_caller_id) AND
           (v_customer_phone_norm IS NULL OR public.normalize_phone(v_request.customer_phone) IS DISTINCT FROM v_customer_phone_norm) THEN
            RAISE EXCEPTION 'Access denied: You are not authorized to view the completion code for this booking.';
        END IF;
    END IF;

    -- Check if secret exists
    SELECT * INTO v_secret
    FROM public.service_request_secrets
    WHERE request_id = p_request_id;

    IF NOT FOUND THEN
        -- Generate new 4-digit OTP and 6-char completion code
        v_otp := LPAD((FLOOR(RANDOM() * 9000) + 1000)::TEXT, 4, '0');
        v_code := UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT || RANDOM()::TEXT) FROM 1 FOR 6));

        INSERT INTO public.service_request_secrets (
            request_id,
            user_id,
            customer_otp,
            completion_code,
            failed_attempts,
            created_at,
            updated_at
        ) VALUES (
            p_request_id,
            COALESCE(v_request.user_id, v_caller_id),
            v_otp,
            v_code,
            0,
            NOW(),
            NOW()
        )
        RETURNING * INTO v_secret;
    ELSIF v_secret.user_id IS NULL AND (v_request.user_id IS NOT NULL OR v_caller_id IS NOT NULL) THEN
        -- Self-heal user_id linkage
        UPDATE public.service_request_secrets
        SET user_id = COALESCE(v_request.user_id, v_caller_id),
            updated_at = NOW()
        WHERE request_id = p_request_id;
    END IF;

    RETURN json_build_object(
        'customer_otp', v_secret.customer_otp,
        'completion_code', v_secret.completion_code
    );
END;
$$ LANGUAGE plpgsql;

-- 3. Explicit Data API Grants
REVOKE ALL ON FUNCTION public.get_customer_job_otp(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_customer_job_otp(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_job_otp(TEXT) TO service_role;

-- 4. Backfill & Self-Healing: Link existing service requests and secrets
-- Link service_requests.user_id by customer phone if unlinked
UPDATE public.service_requests sr
SET user_id = p.id
FROM public.profiles p
WHERE sr.user_id IS NULL
  AND p.phone_normalized IS NOT NULL
  AND public.normalize_phone(sr.customer_phone) = p.phone_normalized;

-- Ensure secrets exist for all service requests
INSERT INTO public.service_request_secrets (
    request_id,
    user_id,
    customer_otp,
    completion_code,
    failed_attempts,
    created_at,
    updated_at
)
SELECT 
    sr.id,
    sr.user_id,
    LPAD((FLOOR(RANDOM() * 9000) + 1000)::TEXT, 4, '0'),
    UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT || RANDOM()::TEXT) FROM 1 FOR 6)),
    0,
    NOW(),
    NOW()
FROM public.service_requests sr
WHERE NOT EXISTS (
    SELECT 1 FROM public.service_request_secrets srs WHERE srs.request_id = sr.id
)
ON CONFLICT (request_id) DO NOTHING;

-- Synchronize user_id on service_request_secrets from service_requests
UPDATE public.service_request_secrets srs
SET user_id = sr.user_id,
    updated_at = NOW()
FROM public.service_requests sr
WHERE srs.request_id = sr.id
  AND srs.user_id IS NULL
  AND sr.user_id IS NOT NULL;
