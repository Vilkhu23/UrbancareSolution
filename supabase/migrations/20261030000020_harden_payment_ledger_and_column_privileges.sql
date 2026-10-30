-- ==============================================================================
-- Migration: 20261030000020_harden_payment_ledger_and_column_privileges.sql
-- Dependency Order: Runs strictly AFTER 20261028000019_remediate_sec03_authoritative_pricing.sql
-- Description: SEC-03 Final Hardening:
--              1. Preflight sanity verification.
--              2. Schema search_path and CREATE privilege lockdown.
--              3. Column-level privilege lockdown on public.service_requests.
--              4. Partial unique index on public.payments for completed idempotency.
--              5. Explicit drop of legacy 3-parameter record_payment() overload.
--              6. SECURITY DEFINER record_payment() with FOR UPDATE locking, no fabricated refs.
--              7. SECURITY INVOKER enforce_service_requests_rules() with exact relational match.
--              8. Update technician & vendor RLS WITH CHECK to permit declination unassignment.
--              9. Explicit OLD.assigned_to caller-identity validation before staff unassignment.
-- Scope Note:  Phase 1 covers staff on-site CASH and manual UPI collections, admin
--              payment recording, and immutable ledger integrity. External payment
--              gateway APIs, webhooks, and auto-settlements are deferred to Phase 2.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- PREFLIGHT CHECK
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_locks l
        JOIN pg_class c ON l.relation = c.oid
        WHERE c.relname = 'service_requests' AND l.mode = 'AccessExclusiveLock'
    ) THEN
        RAISE EXCEPTION 'PREFLIGHT BLOCKED: Table service_requests is locked by an active transaction.';
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 1. SCHEMA PRIVILEGE HARDENING
-- ------------------------------------------------------------------------------
REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------------------------
-- 2. COLUMN-LEVEL PRIVILEGE LOCKDOWN ON public.service_requests
-- ------------------------------------------------------------------------------
REVOKE UPDATE ON public.service_requests FROM authenticated;

-- Grant strictly operational column-level UPDATE
GRANT UPDATE (
    status,
    assigned_to,
    technician_notes,
    vendor_scheduled_time,
    vendor_arrival_status,
    work_started_at,
    work_completed_at,
    before_work_photos,
    completion_photos,
    completion_notes,
    updated_at
) ON public.service_requests TO authenticated;

GRANT ALL ON public.service_requests TO service_role;
GRANT ALL ON public.payments TO service_role;

-- ------------------------------------------------------------------------------
-- 2b. PARTIAL UNIQUE INDEX FOR PAYMENT LEDGER IDEMPOTENCY
-- ------------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_req_completed
ON public.payments (request_id)
WHERE status = 'COMPLETED';

-- ------------------------------------------------------------------------------
-- 3. RLS WITH CHECK POLICY CORRECTION FOR STAFF DECLINATION
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_requests_technician_update" ON public.service_requests;
CREATE POLICY "service_requests_technician_update"
    ON public.service_requests FOR UPDATE
    TO authenticated
    USING (
        public.get_current_user_role() = 'technician' AND
        assigned_to->>'id' IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    )
    WITH CHECK (
        public.get_current_user_role() = 'technician' AND
        (
            (status = 'REASSIGNMENT REQUIRED' AND assigned_to IS NULL) OR
            (assigned_to->>'id' IN (SELECT id FROM public.employees WHERE user_id = auth.uid()))
        )
    );

DROP POLICY IF EXISTS "service_requests_vendor_update" ON public.service_requests;
CREATE POLICY "service_requests_vendor_update"
    ON public.service_requests FOR UPDATE
    TO authenticated
    USING (
        public.get_current_user_role() = 'vendor' AND
        assigned_to->>'id' IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
    )
    WITH CHECK (
        public.get_current_user_role() = 'vendor' AND
        (
            (status = 'REASSIGNMENT REQUIRED' AND assigned_to IS NULL) OR
            (assigned_to->>'id' IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()))
        )
    );

-- ------------------------------------------------------------------------------
-- 4. HARDENED SECURITY DEFINER RPC: public.record_payment()
-- ------------------------------------------------------------------------------

-- Drop legacy 3-parameter overload to prevent PostgREST resolution collisions
DROP FUNCTION IF EXISTS public.record_payment(TEXT, NUMERIC, TEXT);

CREATE OR REPLACE FUNCTION public.record_payment(
    p_request_id TEXT,
    p_amount NUMERIC,
    p_method TEXT,
    p_reference_id TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_caller_id UUID;
    v_caller_role TEXT;
    v_req RECORD;
    v_is_authorized BOOLEAN := FALSE;
    v_assigned_employee_id TEXT;
    v_assigned_vendor_id TEXT;
    v_payment_id TEXT;
    v_completed_count INTEGER;
    v_existing_payment RECORD;
    v_clean_ref TEXT;
BEGIN
    -- 1. Caller Authentication
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;

    -- 2. Row Lock & Request Retrieval (Serializes Concurrent Requests)
    SELECT * INTO v_req
    FROM public.service_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service request % not found.', p_request_id;
    END IF;

    -- 3. Caller Authorization Check against Assignment Model
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

    -- 4. Job State Validation (Must be IN PROGRESS or COMPLETED)
    IF v_req.status NOT IN ('IN PROGRESS', 'COMPLETED') THEN
        RAISE EXCEPTION 'Payment collection rejected: Service request % is in % status. Job must be IN PROGRESS or COMPLETED.',
            p_request_id, v_req.status;
    END IF;

    -- 5. Payment Method Validation
    IF p_method IS NULL OR p_method NOT IN ('CASH', 'UPI', 'ONLINE') THEN
        RAISE EXCEPTION 'Invalid payment method: %. Must be CASH, UPI, or ONLINE.', COALESCE(p_method, 'NULL');
    END IF;

    -- 6. Numeric Validation & Exact Total Match
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Invalid payment amount: %. Must be a positive numeric value.', COALESCE(p_amount::TEXT, 'NULL');
    END IF;

    IF p_amount != v_req.total THEN
        RAISE EXCEPTION 'Invalid payment amount: received %, expected exact total %.', p_amount, v_req.total;
    END IF;

    -- 7. Count Existing COMPLETED Payments for this Request
    SELECT COUNT(*) INTO v_completed_count
    FROM public.payments
    WHERE request_id = p_request_id AND status = 'COMPLETED';

    IF v_completed_count > 1 THEN
        RAISE EXCEPTION 'Ledger integrity violation: Multiple COMPLETED payments exist for request %. Manual supervisor audit required.', p_request_id;
    END IF;

    -- 8. Complete State & Idempotency Handling
    IF v_completed_count = 1 THEN
        SELECT * INTO v_existing_payment
        FROM public.payments
        WHERE request_id = p_request_id AND status = 'COMPLETED'
        LIMIT 1;

        IF v_req.payment_status = 'PENDING' THEN
            RAISE EXCEPTION 'Ledger inconsistency: Request % is PENDING but COMPLETED payment % already exists. Manual reconciliation required.',
                p_request_id, v_existing_payment.id;
        END IF;

        IF v_existing_payment.method != p_method THEN
            RAISE EXCEPTION 'Payment conflict: Service request % was settled via %, cannot re-record as %.',
                p_request_id, v_existing_payment.method, p_method;
        END IF;

        IF v_existing_payment.amount != p_amount THEN
            RAISE EXCEPTION 'Payment conflict: Service request % was settled for %, cannot re-record for %.',
                p_request_id, v_existing_payment.amount, p_amount;
        END IF;

        IF v_req.user_id IS NOT NULL AND v_existing_payment.user_id IS DISTINCT FROM v_req.user_id THEN
            RAISE EXCEPTION 'Customer identity mismatch: Payment belongs to user %, expected %.',
                v_existing_payment.user_id, v_req.user_id;
        END IF;

        RETURN jsonb_build_object(
            'success', true,
            'payment_id', v_existing_payment.id,
            'message', 'Service request is already paid. Existing completed payment returned.',
            'idempotent', true
        );
    END IF;

    IF v_req.payment_status = 'PAID' AND v_completed_count = 0 THEN
        RAISE EXCEPTION 'Ledger inconsistency: Request % is marked PAID but has no matching COMPLETED payment record in ledger.', p_request_id;
    END IF;

    -- 9. Clean Payment Reference (No Fabrication)
    v_clean_ref := NULLIF(trim(p_reference_id), '');

    -- 10. Atomic Ledger Insertion
    v_payment_id := 'pay-' || SUBSTRING(extensions.gen_random_uuid()::TEXT FROM 1 FOR 8);

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
        v_clean_ref,
        NOW(),
        NOW()
    );

    -- 11. Authoritative Payment Status Transition
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
$$ LANGUAGE plpgsql;

ALTER FUNCTION public.record_payment(TEXT, NUMERIC, TEXT, TEXT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.record_payment(TEXT, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_payment(TEXT, NUMERIC, TEXT, TEXT) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 5. TRIGGER enforce_service_requests_rules() AS SECURITY INVOKER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_service_requests_rules()
RETURNS TRIGGER AS $$
DECLARE
    v_caller_id UUID;
    v_caller_role TEXT;
    v_is_service_role BOOLEAN := FALSE;
    v_client_token TEXT;
    v_secret_token TEXT;
    v_is_otp_verified BOOLEAN := FALSE;
    v_sanitized_items JSONB := '[]'::jsonb;
    elem JSONB;
    v_item_id TEXT;
    v_qty INTEGER;
    v_qty_text TEXT;
    v_catalog_price NUMERIC(10, 2);
    v_item_active BOOLEAN;
    v_price_type TEXT;
    v_subtotal NUMERIC(10, 2) := 0.00;
    v_has_standard_service BOOLEAN := FALSE;
    v_is_custom BOOLEAN := FALSE;
    v_assigned_employee_id TEXT;
    v_assigned_vendor_id TEXT;
BEGIN
    IF current_user IN ('service_role', 'postgres') THEN
        v_is_service_role := TRUE;
    END IF;

    v_caller_id := auth.uid();
    IF v_caller_id IS NOT NULL THEN
        SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;
    END IF;

    -- ==========================================================================
    -- BEFORE INSERT
    -- ==========================================================================
    IF TG_OP = 'INSERT' THEN
        IF v_caller_id IS NOT NULL THEN
            NEW.user_id := v_caller_id;
        END IF;

        IF NEW.items IS NULL OR jsonb_typeof(NEW.items) <> 'array' OR jsonb_array_length(NEW.items) = 0 THEN
            RAISE EXCEPTION 'A service request must contain at least one item.';
        END IF;

        NEW.payment_status := 'PENDING';
        NEW.status := 'NEW';

        FOR elem IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
            v_item_id := COALESCE(elem->>'serviceId', elem->>'id');
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

                v_qty_text := elem->>'quantity';
                IF v_qty_text IS NULL OR NOT (v_qty_text ~ '^[0-9]+$') THEN
                    RAISE EXCEPTION 'Booking item quantity must be a positive integer between 1 and 100.';
                END IF;

                v_qty := (v_qty_text)::INTEGER;
                IF v_qty < 1 OR v_qty > 100 THEN
                    RAISE EXCEPTION 'Booking item quantity must be a positive integer between 1 and 100.';
                END IF;

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
                    SELECT price, active
                    INTO v_catalog_price, v_item_active
                    FROM public.service_packages
                    WHERE id = v_item_id;

                    IF FOUND THEN
                        IF NOT v_item_active THEN
                            RAISE EXCEPTION 'Service item % is invalid, inactive, or not found in catalog.', v_item_id;
                        END IF;
                    ELSE
                        RAISE EXCEPTION 'Service item % is invalid, inactive, or not found in catalog.', v_item_id;
                    END IF;
                END IF;
            END IF;

            v_subtotal := v_subtotal + (v_catalog_price * v_qty);
            elem := jsonb_set(elem, '{serviceId}', to_jsonb(v_item_id));
            elem := jsonb_set(elem, '{price}', to_jsonb(v_catalog_price));
            elem := jsonb_set(elem, '{quantity}', to_jsonb(v_qty));
            v_sanitized_items := v_sanitized_items || jsonb_build_array(elem);
        END LOOP;

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
        -- 1. Relational Payment Verification on transition to PAID
        IF (NEW.payment_status IS DISTINCT FROM OLD.payment_status) AND NEW.payment_status = 'PAID' THEN
            IF NOT EXISTS (
                SELECT 1 FROM public.payments p
                WHERE p.request_id = NEW.id
                  AND p.status = 'COMPLETED'
                  AND p.amount = NEW.total
                  AND p.method = NEW.payment_method
                  AND (NEW.user_id IS NULL OR p.user_id IS NOT DISTINCT FROM NEW.user_id)
            ) THEN
                RAISE EXCEPTION 'Transition rejected: payment_status cannot be set to PAID without an exact-match COMPLETED ledger record for total % and method %.',
                    NEW.total, NEW.payment_method;
            END IF;
        END IF;

        -- 2. Verify OTP token from verify_job_otp()
        v_client_token := current_setting('app.otp_token', true);
        v_secret_token := current_setting('app.otp_token_secret', true);

        IF v_client_token IS NOT NULL AND v_client_token <> '' AND
           v_secret_token IS NOT NULL AND v_secret_token <> '' THEN
            IF v_secret_token = md5(v_client_token || ':' || NEW.id || ':pc_otp_secret_2026') THEN
                v_is_otp_verified := TRUE;
            END IF;
        END IF;

        -- 3. Trusted Service Role Bypass with Audit Log on Manual Completion
        IF v_is_service_role THEN
            IF NEW.status = 'COMPLETED' AND (OLD.status IS DISTINCT FROM 'COMPLETED') AND NOT v_is_otp_verified THEN
                INSERT INTO public.audit_logs (
                    id, action, entity_type, entity_id, details, performed_by, timestamp, created_at
                ) VALUES (
                    'aud-comp-' || SUBSTRING(extensions.gen_random_uuid()::TEXT FROM 1 FOR 8),
                    'MANUAL_JOB_COMPLETION', 'BOOKING', NEW.id,
                    'Manual completion override via service_role',
                    'service_role', NOW()::TEXT, NOW()
                );
            END IF;
            RETURN NEW;
        END IF;

        -- 4. Admin / Ops Manager Bypass with Audit Log
        IF v_caller_role IN ('admin', 'ops_manager') THEN
            IF NEW.status = 'COMPLETED' AND (OLD.status IS DISTINCT FROM 'COMPLETED') AND NOT v_is_otp_verified THEN
                INSERT INTO public.audit_logs (
                    id, action, entity_type, entity_id, details, performed_by, timestamp, created_at
                ) VALUES (
                    'aud-comp-' || SUBSTRING(extensions.gen_random_uuid()::TEXT FROM 1 FOR 8),
                    'MANUAL_JOB_COMPLETION', 'BOOKING', NEW.id,
                    'Manual completion override without OTP by ' || v_caller_role || ' (' || v_caller_id::TEXT || ')',
                    COALESCE(v_caller_role, 'admin') || ' (' || v_caller_id::TEXT || ')',
                    NOW()::TEXT, NOW()
                );
            END IF;
            RETURN NEW;
        END IF;

        -- 5. Customer Role Restrictions
        IF v_caller_role = 'customer' THEN
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

        -- 6. Technician & Vendor Role Restrictions
        ELSIF v_caller_role IN ('technician', 'vendor') THEN
            IF (NEW.items IS DISTINCT FROM OLD.items) THEN
                RAISE EXCEPTION 'Modifying booking items after creation is not permitted.';
            END IF;

            -- Explicit OLD.assigned_to caller-identity validation before allowing unassignment
            IF (NEW.assigned_to IS DISTINCT FROM OLD.assigned_to) THEN
                IF NEW.assigned_to IS NULL AND NEW.status = 'REASSIGNMENT REQUIRED' THEN
                    IF v_caller_role = 'technician' THEN
                        SELECT id INTO v_assigned_employee_id FROM public.employees WHERE user_id = v_caller_id;
                        IF v_assigned_employee_id IS NULL OR OLD.assigned_to->>'id' IS DISTINCT FROM v_assigned_employee_id THEN
                            RAISE EXCEPTION 'Staff cannot unassign another technician''s booking.';
                        END IF;
                    ELSIF v_caller_role = 'vendor' THEN
                        SELECT id INTO v_assigned_vendor_id FROM public.vendors WHERE user_id = v_caller_id;
                        IF v_assigned_vendor_id IS NULL OR OLD.assigned_to->>'id' IS DISTINCT FROM v_assigned_vendor_id THEN
                            RAISE EXCEPTION 'Vendor cannot unassign another vendor''s booking.';
                        END IF;
                    END IF;
                ELSE
                    RAISE EXCEPTION 'Staff cannot alter assignment details directly.';
                END IF;
            END IF;

            IF (NEW.total IS DISTINCT FROM OLD.total) OR
               (NEW.subtotal IS DISTINCT FROM OLD.subtotal) OR
               (NEW.tax IS DISTINCT FROM OLD.tax) OR
               (NEW.locality_adjustment IS DISTINCT FROM OLD.locality_adjustment) OR
               (NEW.customer_name IS DISTINCT FROM OLD.customer_name) OR
               (NEW.customer_phone IS DISTINCT FROM OLD.customer_phone) OR
               (NEW.customer_address IS DISTINCT FROM OLD.customer_address) OR
               (NEW.locality IS DISTINCT FROM OLD.locality) OR
               (NEW.customer_otp IS DISTINCT FROM OLD.customer_otp) OR
               (NEW.completion_code IS DISTINCT FROM OLD.completion_code) OR
               (NEW.user_id IS DISTINCT FROM OLD.user_id) THEN
                RAISE EXCEPTION 'Staff cannot modify customer details, billing, or OTP fields directly.';
            END IF;

            IF (NEW.status IS DISTINCT FROM OLD.status) THEN
                IF NEW.status NOT IN ('ACCEPTED', 'SCHEDULED', 'IN PROGRESS', 'COMPLETED', 'CUSTOMER NOT AVAILABLE', 'REASSIGNMENT REQUIRED') THEN
                    RAISE EXCEPTION 'Invalid status transition by staff: %', NEW.status;
                END IF;

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
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public;

COMMIT;

