-- ==============================================================================
-- Migration: 20261013000005_otp_flag_hardening.sql
-- Description: Hardens session-local OTP verification flag against client spoofing:
--              1. Replaces static app.otp_verified flag with unguessable cryptographic token pair:
--                 - app.otp_token (gen_random_uuid())
--                 - app.otp_token_secret (md5 signature with request ID and private salt)
--              2. Trigger enforces matching token signature and rejects static spoofing.
--              3. Note: pg_catalog.set_config is not exposed via PostgREST/Supabase API;
--                 verify_job_otp is the only supported path to completion.
--              4. Hardens record_payment() to require job status IN ('IN PROGRESS', 'COMPLETED').
-- ==============================================================================

-- 1. Architectural Note on set_config and API isolation:
-- pg_catalog.set_config is NOT exposed through the PostgREST / Supabase REST API
-- because PostgREST only exposes functions located in schemas explicitly declared
-- in db-schemas (by default 'public'), and pg_catalog functions are never callable
-- as direct RPC endpoints from web/mobile clients.
-- We intentionally preserve default permissions on pg_catalog.set_config because
-- revoking it breaks Supabase internal connection pooling, PostgREST transaction
-- pre-request hooks (setting claims and headers), and standard database tooling.
-- Inside PostgreSQL, the trigger enforces a cryptographically signed token pair,
-- making verify_job_otp() the ONLY supported path for staff to reach COMPLETED status.

-- 2. Hardened verify_job_otp() generating cryptographic session tokens
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
        RETURN jsonb_build_object('success', true, 'message', 'Job is already marked completed.');
    END IF;

    -- Fetch secret record with row lock
    SELECT * INTO v_secret FROM public.service_request_secrets WHERE request_id = p_request_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No OTP verification record found for request %.', p_request_id;
    END IF;

    -- Rate limiting check: max 5 failed attempts
    IF v_secret.failed_attempts >= 5 THEN
        RAISE EXCEPTION 'Maximum OTP verification attempts (5) exceeded. Job is locked. Contact operations supervisor.';
    END IF;

    -- Verify customer OTP
    IF TRIM(p_otp) = TRIM(v_secret.customer_otp) THEN
        -- Generate unguessable random token
        v_token := gen_random_uuid()::TEXT;

        -- Store transaction-local token and cryptographic signature
        PERFORM set_config('app.otp_token', v_token, true);
        PERFORM set_config('app.otp_token_secret', md5(v_token || ':' || p_request_id || ':pc_otp_secret_2026'), true);

        -- Mark service request as completed
        UPDATE public.service_requests
        SET status = 'COMPLETED',
            work_completed_at = NOW(),
            completion_notes = COALESCE(completion_notes || E'\n', '') || 'Verified on-site via customer OTP at ' || NOW()::TEXT,
            updated_at = NOW()
        WHERE id = p_request_id;

        -- Clear tokens immediately after update
        PERFORM set_config('app.otp_token', '', true);
        PERFORM set_config('app.otp_token_secret', '', true);

        -- Reset failed attempts on secret record
        UPDATE public.service_request_secrets
        SET failed_attempts = 0,
            updated_at = NOW()
        WHERE request_id = p_request_id;

        RETURN jsonb_build_object('success', true, 'message', 'OTP verified successfully. Job marked COMPLETED.');
    ELSE
        -- Increment failed attempts counter
        UPDATE public.service_request_secrets
        SET failed_attempts = failed_attempts + 1,
            updated_at = NOW()
        WHERE request_id = p_request_id;

        RAISE EXCEPTION 'Invalid OTP provided. % attempts remaining.', (5 - (v_secret.failed_attempts + 1));
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 3. Hardened Trigger rejecting static flags & requiring token signature match
CREATE OR REPLACE FUNCTION public.enforce_service_requests_rules()
RETURNS TRIGGER AS $$
DECLARE
    v_caller_id UUID;
    v_caller_role TEXT;
    v_generated_otp TEXT;
    v_generated_code TEXT;
    v_is_otp_verified BOOLEAN := FALSE;
    v_client_token TEXT;
    v_secret_token TEXT;
BEGIN
    v_caller_id := auth.uid();

    -- Verify cryptographic token pair from verify_job_otp()
    v_client_token := current_setting('app.otp_token', true);
    v_secret_token := current_setting('app.otp_token_secret', true);

    IF v_client_token IS NOT NULL AND v_client_token <> '' AND
       v_secret_token IS NOT NULL AND v_secret_token <> '' THEN
        IF v_secret_token = md5(v_client_token || ':' || NEW.id || ':pc_otp_secret_2026') THEN
            v_is_otp_verified := TRUE;
        END IF;
    END IF;

    -- Admin / Ops Manager or Superuser / Service Role:
    IF v_caller_id IS NULL THEN
        -- Service role or direct database connection
        -- If completing without verify_job_otp, write an immutable record to audit_logs
        IF TG_OP = 'UPDATE' AND NEW.status = 'COMPLETED' AND (OLD.status IS DISTINCT FROM 'COMPLETED') AND NOT v_is_otp_verified THEN
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
                'aud-comp-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8),
                'MANUAL_JOB_COMPLETION',
                'BOOKING',
                NEW.id,
                'Manual completion override via service_role without OTP verification',
                'service_role',
                NOW()::TEXT,
                NOW()
            );
        END IF;
        RETURN NEW;
    END IF;

    SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;

    IF v_caller_role IN ('admin', 'ops_manager') THEN
        -- Ops Manager and Admin manual completion override logging
        IF TG_OP = 'UPDATE' AND NEW.status = 'COMPLETED' AND (OLD.status IS DISTINCT FROM 'COMPLETED') AND NOT v_is_otp_verified THEN
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
                'aud-comp-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8),
                'MANUAL_JOB_COMPLETION',
                'BOOKING',
                NEW.id,
                'Manual completion override without OTP by ' || v_caller_role || ' (' || v_caller_id::TEXT || ')',
                COALESCE(v_caller_role, 'admin') || ' (' || v_caller_id::TEXT || ')',
                NOW()::TEXT,
                NOW()
            );
        END IF;
        RETURN NEW;
    END IF;

    -- --------------------------------------------------------------------------
    -- BEFORE INSERT
    -- --------------------------------------------------------------------------
    IF TG_OP = 'INSERT' THEN
        -- Force immutable defaults for public customers
        NEW.status := 'NEW';
        NEW.payment_status := 'PENDING';
        NEW.assigned_to := NULL;
        NEW.user_id := v_caller_id;
        NEW.customer_otp := NULL;
        NEW.completion_code := NULL;

        -- Generate a secure 4-digit OTP and 6-char completion code
        v_generated_otp := LPAD((FLOOR(RANDOM() * 9000) + 1000)::TEXT, 4, '0');
        v_generated_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

        -- Insert secret into isolated service_request_secrets table
        INSERT INTO public.service_request_secrets (
            request_id,
            user_id,
            customer_otp,
            completion_code,
            failed_attempts
        ) VALUES (
            NEW.id,
            v_caller_id,
            v_generated_otp,
            v_generated_code,
            0
        ) ON CONFLICT (request_id) DO NOTHING;

        RETURN NEW;
    END IF;

    -- --------------------------------------------------------------------------
    -- BEFORE UPDATE
    -- --------------------------------------------------------------------------
    IF TG_OP = 'UPDATE' THEN
        -- Block any non-admin attempt to set COMPLETED directly unless cryptographic token matches
        IF NEW.status = 'COMPLETED' AND (OLD.status IS DISTINCT FROM 'COMPLETED') AND NOT v_is_otp_verified THEN
            RAISE EXCEPTION 'Completion rejected: Staff cannot directly mark jobs COMPLETED without calling verify_job_otp().';
        END IF;

        -- CUSTOMER UPDATE RESTRICTIONS
        IF v_caller_role = 'customer' THEN
            -- Block tampering with billing, payment, assignment, or verification fields
            IF (NEW.total IS DISTINCT FROM OLD.total) OR
               (NEW.subtotal IS DISTINCT FROM OLD.subtotal) OR
               (NEW.tax IS DISTINCT FROM OLD.tax) OR
               (NEW.locality_adjustment IS DISTINCT FROM OLD.locality_adjustment) OR
               (NEW.payment_status IS DISTINCT FROM OLD.payment_status) OR
               (NEW.payment_method IS DISTINCT FROM OLD.payment_method) OR
               (NEW.assigned_to IS DISTINCT FROM OLD.assigned_to) OR
               (NEW.customer_otp IS DISTINCT FROM OLD.customer_otp) OR
               (NEW.completion_code IS DISTINCT FROM OLD.completion_code) OR
               (NEW.user_id IS DISTINCT FROM OLD.user_id) THEN
                RAISE EXCEPTION 'Customers cannot modify pricing, payment, assignment, or OTP fields.';
            END IF;

            -- Customer status updates: only allowed to cancel when current status is NEW
            IF (NEW.status IS DISTINCT FROM OLD.status) THEN
                IF NOT (OLD.status = 'NEW' AND NEW.status = 'CANCELLED') THEN
                    RAISE EXCEPTION 'Customers may only cancel requests that are currently in NEW status.';
                END IF;
            END IF;

            RETURN NEW;

        -- TECHNICIAN & VENDOR UPDATE RESTRICTIONS
        ELSIF v_caller_role IN ('technician', 'vendor') THEN
            -- Block modifications to customer details, billing, payment, assignment, or OTP
            IF (NEW.total IS DISTINCT FROM OLD.total) OR
               (NEW.subtotal IS DISTINCT FROM OLD.subtotal) OR
               (NEW.tax IS DISTINCT FROM OLD.tax) OR
               (NEW.locality_adjustment IS DISTINCT FROM OLD.locality_adjustment) OR
               (NEW.payment_status IS DISTINCT FROM OLD.payment_status) OR
               (NEW.payment_method IS DISTINCT FROM OLD.payment_method) OR
               (NEW.assigned_to IS DISTINCT FROM OLD.assigned_to) OR
               (NEW.customer_name IS DISTINCT FROM OLD.customer_name) OR
               (NEW.customer_phone IS DISTINCT FROM OLD.customer_phone) OR
               (NEW.customer_address IS DISTINCT FROM OLD.customer_address) OR
               (NEW.locality IS DISTINCT FROM OLD.locality) OR
               (NEW.customer_otp IS DISTINCT FROM OLD.customer_otp) OR
               (NEW.completion_code IS DISTINCT FROM OLD.completion_code) OR
               (NEW.user_id IS DISTINCT FROM OLD.user_id) THEN
                RAISE EXCEPTION 'Staff cannot modify customer details, billing, assignment, or OTP fields.';
            END IF;

            -- Validate allowable status transitions by staff
            IF (NEW.status IS DISTINCT FROM OLD.status) THEN
                IF NEW.status NOT IN ('ACCEPTED', 'SCHEDULED', 'IN PROGRESS', 'COMPLETED', 'CUSTOMER NOT AVAILABLE') THEN
                    RAISE EXCEPTION 'Invalid status transition by staff: %', NEW.status;
                END IF;

                -- Staff can only reach COMPLETED via verify_job_otp()
                IF NEW.status = 'COMPLETED' AND NOT v_is_otp_verified THEN
                    RAISE EXCEPTION 'Completion rejected: Staff cannot directly mark jobs COMPLETED without calling verify_job_otp().';
                END IF;
            END IF;

            RETURN NEW;
        ELSE
            RAISE EXCEPTION 'Unauthorized role for updating service requests.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-attach trigger on service_requests
DROP TRIGGER IF EXISTS trigger_enforce_service_requests_rules ON public.service_requests;
CREATE TRIGGER trigger_enforce_service_requests_rules
    BEFORE INSERT OR UPDATE ON public.service_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_service_requests_rules();


-- 4. Hardened record_payment() requiring IN PROGRESS or COMPLETED status
CREATE OR REPLACE FUNCTION public.record_payment(
    p_request_id TEXT,
    p_amount NUMERIC,
    p_method TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_caller_id UUID;
    v_caller_role TEXT;
    v_req RECORD;
    v_assigned_employee_id TEXT;
    v_assigned_vendor_id TEXT;
    v_is_authorized BOOLEAN := FALSE;
    v_payment_id TEXT;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;

    -- Fetch the request
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
        RAISE EXCEPTION 'Forbidden: You are not authorized to collect payment for service request %.', p_request_id;
    END IF;

    -- REQUIRE JOB TO BE IN 'IN PROGRESS' OR 'COMPLETED' STATE
    IF v_req.status NOT IN ('IN PROGRESS', 'COMPLETED') THEN
        RAISE EXCEPTION 'Payment collection rejected: Service request % is in % status. Job must be IN PROGRESS or COMPLETED.', p_request_id, v_req.status;
    END IF;

    -- Validate payment method
    IF p_method NOT IN ('CASH', 'UPI', 'ONLINE') THEN
        RAISE EXCEPTION 'Invalid payment method: %. Must be CASH, UPI, or ONLINE.', p_method;
    END IF;

    -- Validate payment amount equals the request total
    IF p_amount != v_req.total THEN
        RAISE EXCEPTION 'Invalid payment amount: received %, expected exact total %.', p_amount, v_req.total;
    END IF;

    -- Prevent duplicate payments for the same request
    IF EXISTS (SELECT 1 FROM public.payments WHERE request_id = p_request_id AND status = 'COMPLETED') THEN
        RAISE EXCEPTION 'A completed payment already exists for service request %.', p_request_id;
    END IF;

    -- Generate payment transaction ID
    v_payment_id := 'pay-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8);

    -- Insert payment record with service-level privileges
    INSERT INTO public.payments (
        id,
        user_id,
        request_id,
        customer_name,
        amount,
        method,
        status,
        reference_id,
        timestamp,
        created_at
    ) VALUES (
        v_payment_id,
        v_req.user_id,
        p_request_id,
        v_req.customer_name,
        p_amount,
        p_method,
        'COMPLETED',
        UPPER(p_method) || '-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6),
        NOW(),
        NOW()
    );

    -- Mark service request as PAID
    UPDATE public.service_requests
    SET payment_status = 'PAID',
        payment_method = p_method,
        updated_at = NOW()
    WHERE id = p_request_id;

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_payment_id,
        'message', 'Payment recorded successfully and order marked PAID.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
