-- ==============================================================================
-- Migration: 20261013000008_fix_otp_lockout.sql
-- Description: Fixes OTP verification lockout persistence (SEC-05 Hardening):
--              1. Adds last_failed_at timestamp to service_request_secrets.
--              2. Replaces exception-raising on wrong OTP with non-throwing failure JSON
--                 ({success: false, code: 'INVALID_OTP' | 'LOCKED'}), ensuring failed_attempts
--                 increments and row-locks are committed and never rolled back by the caller.
--              3. Enforces persistent lockout once failed_attempts >= 5 for ALL attempts,
--                 including the correct OTP.
--              4. Creates reset_job_otp_lock(p_request_id) allowing ops_manager and admin
--                 to unlock requests, logging the action to audit_logs.
--              5. Grants EXECUTE on verify_job_otp and reset_job_otp_lock to authenticated.
-- ==============================================================================

-- 1. Add last_failed_at tracking column to service_request_secrets
ALTER TABLE public.service_request_secrets
    ADD COLUMN IF NOT EXISTS last_failed_at TIMESTAMPTZ;

-- 2. Non-throwing, rate-limited verify_job_otp()
CREATE OR REPLACE FUNCTION public.verify_job_otp(p_request_id TEXT, p_otp TEXT)
RETURNS JSONB AS $$
DECLARE
    v_caller_id UUID;
    v_caller_role TEXT;
    v_req RECORD;
    v_secret RECORD;
    v_assigned_employee_id TEXT;
    v_assigned_vendor_id TEXT;
    v_is_authorized BOOLEAN := FALSE;
    v_token TEXT;
    v_remaining_attempts INT;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;

    -- Fetch the service request
    SELECT * INTO v_req FROM public.service_requests WHERE id = p_request_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service request % not found.', p_request_id;
    END IF;

    -- Verify caller authorization: ops/admin or assigned technician / vendor
    IF v_caller_role IN ('ops_manager', 'admin') THEN
        v_is_authorized := TRUE;
    ELSIF v_caller_role = 'technician' THEN
        SELECT id INTO v_assigned_employee_id FROM public.employees WHERE user_id = v_caller_id;
        IF v_assigned_employee_id IS NOT NULL AND v_req.assigned_to->>'id' = v_assigned_employee_id THEN
            v_is_authorized := TRUE;
        END IF;
    ELSIF v_caller_role = 'vendor' THEN
        SELECT id INTO v_assigned_vendor_id FROM public.vendors WHERE user_id = v_caller_id;
        IF v_assigned_vendor_id IS NOT NULL AND v_req.assigned_to->>'id' = v_assigned_vendor_id THEN
            v_is_authorized := TRUE;
        END IF;
    END IF;

    IF NOT v_is_authorized THEN
        RAISE EXCEPTION 'Forbidden: You are not assigned to service request %.', p_request_id;
    END IF;

    -- Check if request is already completed
    IF v_req.status = 'COMPLETED' THEN
        RETURN jsonb_build_object(
            'success', true,
            'code', 'ALREADY_COMPLETED',
            'message', 'Job is already marked completed.'
        );
    END IF;

    -- Fetch secret record with row lock to serialize concurrent attempts
    SELECT * INTO v_secret 
    FROM public.service_request_secrets 
    WHERE request_id = p_request_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No OTP verification record found for request %.', p_request_id;
    END IF;

    -- Persistent lockout check: if already locked, reject immediately without testing OTP
    IF v_secret.failed_attempts >= 5 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'LOCKED',
            'attempts_left', 0,
            'message', 'Maximum OTP verification attempts (5) exceeded. Job is locked. Contact operations team.'
        );
    END IF;

    -- Check customer OTP
    IF TRIM(p_otp) = TRIM(v_secret.customer_otp) THEN
        -- Generate cryptographic session token
        v_token := gen_random_uuid()::TEXT;

        PERFORM set_config('app.otp_token', v_token, true);
        PERFORM set_config('app.otp_token_secret', md5(v_token || ':' || p_request_id || ':pc_otp_secret_2026'), true);

        -- Mark service request as completed
        UPDATE public.service_requests
        SET status = 'COMPLETED',
            work_completed_at = NOW(),
            completion_notes = COALESCE(completion_notes || E'\n', '') || 'Verified on-site via customer OTP at ' || NOW()::TEXT,
            updated_at = NOW()
        WHERE id = p_request_id;

        -- Clear tokens
        PERFORM set_config('app.otp_token', '', true);
        PERFORM set_config('app.otp_token_secret', '', true);

        -- Reset failed attempts on success
        UPDATE public.service_request_secrets
        SET failed_attempts = 0,
            updated_at = NOW()
        WHERE request_id = p_request_id;

        RETURN jsonb_build_object(
            'success', true,
            'code', 'VERIFIED',
            'message', 'OTP verified successfully. Job marked COMPLETED.'
        );
    ELSE
        -- Increment failed attempts counter and update timestamp
        UPDATE public.service_request_secrets
        SET failed_attempts = failed_attempts + 1,
            last_failed_at = NOW(),
            updated_at = NOW()
        WHERE request_id = p_request_id;

        v_remaining_attempts := 5 - (v_secret.failed_attempts + 1);

        IF v_remaining_attempts <= 0 THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'LOCKED',
                'attempts_left', 0,
                'message', 'Maximum OTP verification attempts (5) exceeded. Job is locked. Contact operations team.'
            );
        ELSE
            RETURN jsonb_build_object(
                'success', false,
                'code', 'INVALID_OTP',
                'attempts_left', v_remaining_attempts,
                'message', 'Invalid OTP provided. ' || v_remaining_attempts::TEXT || ' attempt(s) remaining.'
            );
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Reset OTP Lockout function (Admin & Ops Manager only)
CREATE OR REPLACE FUNCTION public.reset_job_otp_lock(p_request_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_caller_id UUID;
    v_caller_role TEXT;
    v_secret RECORD;
BEGIN
    v_caller_id := auth.uid();

    IF v_caller_id IS NOT NULL THEN
        SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;
        IF v_caller_role NOT IN ('ops_manager', 'admin') THEN
            RAISE EXCEPTION 'Forbidden: Only operations managers and administrators can reset OTP lockouts.';
        END IF;
    ELSE
        v_caller_role := 'service_role';
    END IF;

    -- Lock secret row
    SELECT * INTO v_secret 
    FROM public.service_request_secrets 
    WHERE request_id = p_request_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No OTP verification record found for request %.', p_request_id;
    END IF;

    -- Reset counter
    UPDATE public.service_request_secrets
    SET failed_attempts = 0,
        updated_at = NOW()
    WHERE request_id = p_request_id;

    -- Write to audit_logs
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
        'aud-otp-reset-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8),
        'RESET_OTP_LOCK',
        'BOOKING',
        p_request_id,
        'OTP verification lockout counter reset by ' || COALESCE(v_caller_role, 'admin'),
        COALESCE(v_caller_role, 'admin') || ' (' || COALESCE(v_caller_id::TEXT, 'system') || ')',
        NOW()::TEXT,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'code', 'LOCK_RESET',
        'message', 'OTP verification lockout reset successfully.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Reaffirm permissions
GRANT EXECUTE ON FUNCTION public.verify_job_otp(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_job_otp_lock(TEXT) TO authenticated;
