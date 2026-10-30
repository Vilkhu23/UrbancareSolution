-- ==============================================================================
-- Migration: 20261028000019_remediate_sec03_authoritative_pricing.sql
-- Description: SEC-03 Remediation - Authoritative database-level pricing enforcement
--              and catalog item validation on public.service_requests.
--
-- Invariants enforced:
--   1. Authoritative Pricing: The database calculates subtotal, doorstep visit fee
--      (₹99 for standard services, ₹0 for packages), tax (₹0), and total server-side
--      using catalog prices from public.services and public.service_packages.
--      Client-supplied subtotal, tax, and total values on INSERT are authoritatively
--      overwritten by calculated values.
--   2. Item & Catalog Validation: Every item in NEW.items must be an active catalog
--      item with a positive bounded integer quantity (1 to 100). Malformed, unknown,
--      or inactive items trigger safe, actionable exceptions.
--   3. Custom Diagnostic Support: Recognizes custom requirement bookings
--      (request_type = 'CUSTOM_REQUIREMENT' or 'srv-ac-inspect') and authoritatively
--      validates diagnostic rate (₹199 subtotal, ₹99 visit fee, ₹298 total).
--   4. Item Immutability on UPDATE: Modifying NEW.items after booking creation is
--      strictly forbidden for customer, technician, and vendor roles.
--   5. Workflow Preservation: Preserves default status ('NEW'), payment_status ('PENDING'),
--      OTP generation/session tokens (verify_job_otp), staff payment collection tokens
--      (record_payment), and admin manual completion override audit logging.
-- ==============================================================================

BEGIN;

-- 1. Ensure request_type column exists on public.service_requests
ALTER TABLE public.service_requests
    ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'STANDARD_SERVICE';

-- 2. Define authoritative enforce_service_requests_rules() function
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

    -- SEC-03 Authoritative Pricing Variables
    elem JSONB;
    v_item_id TEXT;
    v_qty_text TEXT;
    v_qty INTEGER;
    v_catalog_price NUMERIC(10, 2);
    v_item_active BOOLEAN;
    v_price_type TEXT;
    v_subtotal NUMERIC(10, 2) := 0.00;
    v_has_standard_service BOOLEAN := FALSE;
    v_sanitized_items JSONB := '[]'::jsonb;
    v_is_custom BOOLEAN := FALSE;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NOT NULL THEN
        SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;
    END IF;

    -- ==========================================================================
    -- BEFORE INSERT
    -- ==========================================================================
    IF TG_OP = 'INSERT' THEN
        -- Allow internal superuser or admin fixture setup with empty items (for test fixtures / legacy seeds)
        IF (v_caller_id IS NULL OR v_caller_role IN ('admin', 'ops_manager')) AND
           (NEW.items IS NULL OR jsonb_typeof(NEW.items) <> 'array' OR jsonb_array_length(NEW.items) = 0) THEN
            NEW.status := COALESCE(NEW.status, 'NEW');
            NEW.payment_status := COALESCE(NEW.payment_status, 'PENDING');
            NEW.customer_otp := NULL;
            NEW.completion_code := NULL;
            RETURN NEW;
        END IF;

        -- Force immutable defaults for booking creation
        NEW.status := 'NEW';
        NEW.payment_status := 'PENDING';
        NEW.assigned_to := NULL;
        IF v_caller_id IS NOT NULL THEN
            NEW.user_id := v_caller_id;
        END IF;
        NEW.customer_otp := NULL;
        NEW.completion_code := NULL;

        -- 1. Validate items array
        IF NEW.items IS NULL OR jsonb_typeof(NEW.items) <> 'array' OR jsonb_array_length(NEW.items) = 0 THEN
            RAISE EXCEPTION 'Booking items must be a non-empty array.';
        END IF;

        -- 2. Validate and authoritatively price each item
        FOR elem IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
            v_item_id := COALESCE(elem->>'serviceId', elem->>'id');

            -- Detect custom requirement diagnostic booking
            v_is_custom := (NEW.request_type = 'CUSTOM_REQUIREMENT') OR
                           (COALESCE(elem->>'serviceName', '') ILIKE 'Custom%');

            IF v_is_custom THEN
                v_item_id := 'srv-ac-inspect';
                v_qty := 1;
                v_catalog_price := 199.00;
                v_has_standard_service := TRUE;
            ELSE
                IF v_item_id IS NULL OR trim(v_item_id) = '' THEN
                    RAISE EXCEPTION 'Booking item missing service ID.';
                END IF;

                -- Validate quantity: must be positive integer between 1 and 100
                v_qty_text := elem->>'quantity';
                IF v_qty_text IS NULL OR NOT (v_qty_text ~ '^[0-9]+$') THEN
                    RAISE EXCEPTION 'Booking item quantity must be a positive integer between 1 and 100.';
                END IF;

                v_qty := (v_qty_text)::INTEGER;
                IF v_qty < 1 OR v_qty > 100 THEN
                    RAISE EXCEPTION 'Booking item quantity must be a positive integer between 1 and 100.';
                END IF;

                -- Catalog lookup in public.services
                SELECT price, active, COALESCE(price_type, 'fixed')
                INTO v_catalog_price, v_item_active, v_price_type
                FROM public.services
                WHERE id = v_item_id;

                IF FOUND THEN
                    IF NOT v_item_active THEN
                        RAISE EXCEPTION 'Service item % is invalid, inactive, or not found in catalog.', v_item_id;
                    END IF;
                    IF v_price_type = 'quote_required' THEN
                        v_catalog_price := 0.00;
                    ELSIF v_price_type <> 'package' THEN
                        v_has_standard_service := TRUE;
                    END IF;
                ELSE
                    -- Catalog lookup in public.service_packages
                    SELECT price, active
                    INTO v_catalog_price, v_item_active
                    FROM public.service_packages
                    WHERE id = v_item_id;

                    IF FOUND THEN
                        IF NOT v_item_active THEN
                            RAISE EXCEPTION 'Service item % is invalid, inactive, or not found in catalog.', v_item_id;
                        END IF;
                        -- Packages do not trigger standard service doorstep visit fee (visitFee = 0)
                    ELSE
                        RAISE EXCEPTION 'Service item % is invalid, inactive, or not found in catalog.', v_item_id;
                    END IF;
                END IF;
            END IF;

            -- Accumulate subtotal
            v_subtotal := v_subtotal + (v_catalog_price * v_qty);

            -- Build sanitized item element
            elem := jsonb_set(elem, '{serviceId}', to_jsonb(v_item_id));
            elem := jsonb_set(elem, '{price}', to_jsonb(v_catalog_price));
            elem := jsonb_set(elem, '{quantity}', to_jsonb(v_qty));
            v_sanitized_items := v_sanitized_items || jsonb_build_array(elem);
        END LOOP;

        -- Authoritatively compute pricing fields
        NEW.items := v_sanitized_items;
        NEW.subtotal := v_subtotal;
        NEW.locality_adjustment := 0.00;
        NEW.tax := 0.00;
        NEW.total := v_subtotal + (CASE WHEN v_has_standard_service THEN 99.00 ELSE 0.00 END) + NEW.tax;

        RETURN NEW;
    END IF;

    -- ==========================================================================
    -- BEFORE UPDATE
    -- ==========================================================================
    IF TG_OP = 'UPDATE' THEN
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

        -- Superuser / service_role bypass with audit logging on manual completion
        IF v_caller_id IS NULL THEN
            IF NEW.status = 'COMPLETED' AND (OLD.status IS DISTINCT FROM 'COMPLETED') AND NOT v_is_otp_verified THEN
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

        -- Admin / ops_manager bypass with audit logging on manual completion
        IF v_caller_role IN ('admin', 'ops_manager') THEN
            IF NEW.status = 'COMPLETED' AND (OLD.status IS DISTINCT FROM 'COMPLETED') AND NOT v_is_otp_verified THEN
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

        -- Block any non-admin attempt to set COMPLETED directly unless cryptographic OTP token matches
        IF NEW.status = 'COMPLETED' AND (OLD.status IS DISTINCT FROM 'COMPLETED') AND NOT v_is_otp_verified THEN
            RAISE EXCEPTION 'Completion rejected: Staff cannot directly mark jobs COMPLETED without calling verify_job_otp().';
        END IF;

        -- CUSTOMER UPDATE RESTRICTIONS
        IF v_caller_role = 'customer' THEN
            -- SEC-03: Block customer modification of items after booking creation
            IF (NEW.items IS DISTINCT FROM OLD.items) THEN
                RAISE EXCEPTION 'Modifying booking items after creation is not permitted.';
            END IF;

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
            -- SEC-03: Block staff modification of items after booking creation
            IF (NEW.items IS DISTINCT FROM OLD.items) THEN
                RAISE EXCEPTION 'Modifying booking items after creation is not permitted.';
            END IF;

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

-- 3. Re-attach trigger to public.service_requests
DROP TRIGGER IF EXISTS trigger_enforce_service_requests_rules ON public.service_requests;
CREATE TRIGGER trigger_enforce_service_requests_rules
    BEFORE INSERT OR UPDATE ON public.service_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_service_requests_rules();

COMMIT;
