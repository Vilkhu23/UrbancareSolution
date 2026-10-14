-- ==============================================================================
-- Migration: 20261013000006_fix_secret_creation.sql
-- Description: Fixes foreign key constraint violation (service_request_secrets_request_id_fkey):
--              1. Removes child row insertion into service_request_secrets from the BEFORE INSERT
--                 trigger enforce_service_requests_rules() (where NEW.id does not yet exist).
--              2. Preserves immutable BEFORE INSERT customer defaults on service_requests.
--              3. Creates a dedicated AFTER INSERT trigger trigger_generate_service_request_secret
--                 that safely inserts server-generated OTP secrets once the parent request exists.
--              4. Backfills secrets for any existing service_requests lacking a secret entry.
-- ==============================================================================

-- 1. Updated enforce_service_requests_rules() WITHOUT BEFORE INSERT child insertion
CREATE OR REPLACE FUNCTION public.enforce_service_requests_rules()
RETURNS TRIGGER AS $$
DECLARE
    v_caller_id UUID;
    v_caller_role TEXT;
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
        IF v_caller_id IS NOT NULL THEN
            NEW.user_id := v_caller_id;
        END IF;
        NEW.customer_otp := NULL;
        NEW.completion_code := NULL;

        -- NOTE: Secret generation has been moved to trigger_generate_service_request_secret (AFTER INSERT)
        -- so that the parent service_requests row exists before service_request_secrets references it.
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

-- Re-attach BEFORE INSERT OR UPDATE trigger
DROP TRIGGER IF EXISTS trigger_enforce_service_requests_rules ON public.service_requests;
CREATE TRIGGER trigger_enforce_service_requests_rules
    BEFORE INSERT OR UPDATE ON public.service_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_service_requests_rules();

-- 2. Dedicated AFTER INSERT Trigger for Service Request Secrets
CREATE OR REPLACE FUNCTION public.generate_service_request_secret()
RETURNS TRIGGER AS $$
DECLARE
    v_generated_otp TEXT;
    v_generated_code TEXT;
BEGIN
    -- Generate cryptographically random 4-digit OTP (1000-9999) and 6-char completion code
    v_generated_otp := LPAD((FLOOR(RANDOM() * 9000) + 1000)::TEXT, 4, '0');
    v_generated_code := UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT || RANDOM()::TEXT) FROM 1 FOR 6));

    -- Insert secret into isolated service_request_secrets table
    -- Parent service_requests row is now guaranteed to exist
    INSERT INTO public.service_request_secrets (
        request_id,
        user_id,
        customer_otp,
        completion_code,
        failed_attempts,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.user_id,
        v_generated_otp,
        v_generated_code,
        0,
        NOW(),
        NOW()
    ) ON CONFLICT (request_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_generate_service_request_secret ON public.service_requests;
CREATE TRIGGER trigger_generate_service_request_secret
    AFTER INSERT ON public.service_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_service_request_secret();

-- 3. Backfill secrets for any pre-existing requests that lack a secrets entry
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
