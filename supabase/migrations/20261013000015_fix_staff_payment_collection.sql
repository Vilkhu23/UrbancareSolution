-- ==============================================================================
-- Migration: 20261013000015_fix_staff_payment_collection.sql
-- Description: Fixes payment status persistence for technician completion and admin recording:
--              1. Updates record_payment() RPC to use a session token pair
--                 (app.payment_token / app.payment_token_secret) when updating service_requests.
--              2. Updates enforce_service_requests_rules() to recognize app.payment_token
--                 so that technician/vendor caller roles can successfully transition
--                 payment_status and payment_method to 'PAID' via record_payment().
--              3. Handles idempotency in record_payment() if a payment record already exists.
--              4. Heals and backfills #PB-5856 to PAID status with a completed payment record.
--              5. Grants EXECUTE on record_payment to authenticated and service_role.
-- ==============================================================================

-- 1. Updated record_payment() with cryptographic token pair for trigger authorization
CREATE OR REPLACE FUNCTION public.record_payment(
    p_request_id TEXT,
    p_amount NUMERIC,
    p_method TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID;
    v_caller_role TEXT;
    v_req RECORD;
    v_is_authorized BOOLEAN := FALSE;
    v_assigned_employee_id TEXT;
    v_assigned_vendor_id TEXT;
    v_payment_id TEXT;
    v_token TEXT;
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

    -- If a completed payment already exists for this request, ensure service_request is marked PAID and return success
    IF EXISTS (SELECT 1 FROM public.payments WHERE request_id = p_request_id AND status = 'COMPLETED') THEN
        v_token := gen_random_uuid()::TEXT;
        PERFORM set_config('app.payment_token', v_token, true);
        PERFORM set_config('app.payment_token_secret', md5(v_token || ':' || p_request_id || ':pc_pay_secret_2026'), true);

        UPDATE public.service_requests
        SET payment_status = 'PAID',
            payment_method = p_method,
            updated_at = NOW()
        WHERE id = p_request_id;

        PERFORM set_config('app.payment_token', '', true);
        PERFORM set_config('app.payment_token_secret', '', true);

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Payment already exists in ledger. Order status verified as PAID.'
        );
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

    -- Set cryptographic token pair so enforce_service_requests_rules allows the payment status update
    v_token := gen_random_uuid()::TEXT;
    PERFORM set_config('app.payment_token', v_token, true);
    PERFORM set_config('app.payment_token_secret', md5(v_token || ':' || p_request_id || ':pc_pay_secret_2026'), true);

    -- Mark service request as PAID
    UPDATE public.service_requests
    SET payment_status = 'PAID',
        payment_method = p_method,
        updated_at = NOW()
    WHERE id = p_request_id;

    -- Clear tokens
    PERFORM set_config('app.payment_token', '', true);
    PERFORM set_config('app.payment_token_secret', '', true);

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_payment_id,
        'message', 'Payment recorded successfully and order marked PAID.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Updated enforce_service_requests_rules() supporting both OTP and Payment tokens
CREATE OR REPLACE FUNCTION public.enforce_service_requests_rules()
RETURNS TRIGGER AS $$
DECLARE
    v_caller_id UUID;
    v_caller_role TEXT;
    v_is_otp_verified BOOLEAN := FALSE;
    v_client_token TEXT;
    v_secret_token TEXT;
    v_is_pay_verified BOOLEAN := FALSE;
    v_pay_client_token TEXT;
    v_pay_secret_token TEXT;
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

    -- Verify cryptographic token pair from record_payment()
    v_pay_client_token := current_setting('app.payment_token', true);
    v_pay_secret_token := current_setting('app.payment_token_secret', true);

    IF v_pay_client_token IS NOT NULL AND v_pay_client_token <> '' AND
       v_pay_secret_token IS NOT NULL AND v_pay_secret_token <> '' THEN
        IF v_pay_secret_token = md5(v_pay_client_token || ':' || NEW.id || ':pc_pay_secret_2026') THEN
            v_is_pay_verified := TRUE;
        END IF;
    END IF;

    -- Admin / Ops Manager or Superuser / Service Role:
    IF v_caller_id IS NULL THEN
        -- Service role or direct database connection
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
        IF v_caller_id IS NOT NULL THEN
            NEW.user_id := v_caller_id;
        END IF;
        NEW.customer_otp := NULL;
        NEW.completion_code := NULL;

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

            IF (NEW.status IS DISTINCT FROM OLD.status) THEN
                IF NOT (OLD.status = 'NEW' AND NEW.status = 'CANCELLED') THEN
                    RAISE EXCEPTION 'Customers may only cancel requests that are currently in NEW status.';
                END IF;
            END IF;

            RETURN NEW;

        -- TECHNICIAN & VENDOR UPDATE RESTRICTIONS
        ELSIF v_caller_role IN ('technician', 'vendor') THEN
            -- Block modifications to customer details, billing, assignment, or OTP
            -- Allow payment_status & payment_method updates ONLY when validated via record_payment() (v_is_pay_verified)
            IF (NEW.total IS DISTINCT FROM OLD.total) OR
               (NEW.subtotal IS DISTINCT FROM OLD.subtotal) OR
               (NEW.tax IS DISTINCT FROM OLD.tax) OR
               (NEW.locality_adjustment IS DISTINCT FROM OLD.locality_adjustment) OR
               (NEW.payment_status IS DISTINCT FROM OLD.payment_status AND NOT v_is_pay_verified) OR
               (NEW.payment_method IS DISTINCT FROM OLD.payment_method AND NOT v_is_pay_verified) OR
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

-- Re-attach trigger
DROP TRIGGER IF EXISTS trigger_enforce_service_requests_rules ON public.service_requests;
CREATE TRIGGER trigger_enforce_service_requests_rules
    BEFORE INSERT OR UPDATE ON public.service_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_service_requests_rules();

-- 3. Grants
GRANT EXECUTE ON FUNCTION public.record_payment(TEXT, NUMERIC, TEXT) TO authenticated, service_role;

-- 4. Backfill / heal PB-5856
UPDATE public.service_requests
SET payment_status = 'PAID',
    payment_method = COALESCE(payment_method, 'CASH'),
    updated_at = NOW()
WHERE id = 'PB-5856';

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
)
SELECT
    'pay-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8),
    sr.user_id,
    sr.id,
    sr.customer_name,
    sr.total,
    COALESCE(sr.payment_method, 'CASH'),
    'COMPLETED',
    COALESCE(UPPER(sr.payment_method), 'CASH') || '-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6),
    NOW(),
    NOW()
FROM public.service_requests sr
WHERE sr.id = 'PB-5856'
  AND NOT EXISTS (SELECT 1 FROM public.payments WHERE request_id = 'PB-5856')
ON CONFLICT (id) DO NOTHING;
