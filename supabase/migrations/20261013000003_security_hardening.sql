-- ==============================================================================
-- Migration: 20261013000003_security_hardening.sql
-- Description: Addresses security review findings SEC-01 through SEC-11:
--              1. SEC-01: BEFORE INSERT & BEFORE UPDATE triggers on service_requests.
--              2. SEC-05: Moves customer_otp to service_request_secrets & creates verify_job_otp().
--              3. SEC-02: Removes customer INSERT on payments & creates record_payment().
--              4. SEC-03: BEFORE UPDATE trigger on vendors protecting status, rating, plan, mobile.
--              5. SEC-06: BEFORE UPDATE trigger on customers protecting status & spend counters.
--              6. SEC-07: Allows self-service clearing of must_change_password from true to false.
--              7. SEC-08: Restricts complaints customer INSERT to own request_id and status = 'OPEN'.
--              8. SEC-10: Adds vendor policies and update triggers on home_projects.
-- ==============================================================================

-- ==============================================================================
-- 1. SEC-05: SECRETS ISOLATION & OTP VERIFICATION
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.service_request_secrets (
    request_id TEXT PRIMARY KEY REFERENCES public.service_requests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_otp TEXT NOT NULL,
    completion_code TEXT NOT NULL,
    failed_attempts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_request_secrets_user_id ON public.service_request_secrets(user_id);

ALTER TABLE public.service_request_secrets ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "service_request_secrets_customer_select" ON public.service_request_secrets;
DROP POLICY IF EXISTS "service_request_secrets_ops_all" ON public.service_request_secrets;

-- Customer can read only their own secrets (to display completion OTP to technician on site)
CREATE POLICY "service_request_secrets_customer_select"
    ON public.service_request_secrets FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Operations Manager & Admin have full oversight
CREATE POLICY "service_request_secrets_ops_all"
    ON public.service_request_secrets FOR ALL
    TO authenticated
    USING (public.get_current_user_role() IN ('ops_manager', 'admin'))
    WITH CHECK (public.get_current_user_role() IN ('ops_manager', 'admin'));

-- Technicians and Vendors have NO DIRECT ACCESS to service_request_secrets (Denied by default).

-- Migrate any legacy OTPs from service_requests into service_request_secrets
INSERT INTO public.service_request_secrets (
    request_id,
    user_id,
    customer_otp,
    completion_code,
    failed_attempts
)
SELECT 
    sr.id,
    sr.user_id,
    COALESCE(sr.customer_otp, LPAD((FLOOR(RANDOM() * 9000) + 1000)::TEXT, 4, '0')),
    COALESCE(sr.completion_code, UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))),
    0
FROM public.service_requests sr
WHERE NOT EXISTS (
    SELECT 1 FROM public.service_request_secrets srs WHERE srs.request_id = sr.id
);

-- Blank out legacy columns in service_requests
UPDATE public.service_requests SET customer_otp = NULL, completion_code = NULL;

-- Atomic OTP verification function
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

    -- Fetch secret record with lock
    SELECT * INTO v_secret FROM public.service_request_secrets WHERE request_id = p_request_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No OTP verification record found for request %.', p_request_id;
    END IF;

    -- Rate limiting check: max 5 failed attempts
    IF v_secret.failed_attempts >= 5 THEN
        RAISE EXCEPTION 'Maximum OTP verification attempts (5) exceeded. Job is locked. Contact operations supervisor.';
    END IF;

    -- Verify OTP
    IF TRIM(p_otp) = TRIM(v_secret.customer_otp) THEN
        -- Mark request completed
        UPDATE public.service_requests
        SET status = 'COMPLETED',
            work_completed_at = NOW(),
            completion_notes = COALESCE(completion_notes || E'\n', '') || 'Verified on-site via customer OTP at ' || NOW()::TEXT,
            updated_at = NOW()
        WHERE id = p_request_id;

        -- Reset failed attempts
        UPDATE public.service_request_secrets
        SET failed_attempts = 0,
            updated_at = NOW()
        WHERE request_id = p_request_id;

        RETURN jsonb_build_object('success', true, 'message', 'OTP verified successfully. Job marked COMPLETED.');
    ELSE
        -- Increment failed attempts
        UPDATE public.service_request_secrets
        SET failed_attempts = failed_attempts + 1,
            updated_at = NOW()
        WHERE request_id = p_request_id;

        RAISE EXCEPTION 'Invalid OTP provided. % attempts remaining.', (5 - (v_secret.failed_attempts + 1));
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ==============================================================================
-- 2. SEC-01: SERVICE REQUESTS INTEGRITY TRIGGERS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.enforce_service_requests_rules()
RETURNS TRIGGER AS $$
DECLARE
    v_caller_id UUID;
    v_caller_role TEXT;
    v_generated_otp TEXT;
    v_generated_code TEXT;
BEGIN
    v_caller_id := auth.uid();

    -- Service role / postgres (no auth.uid()) or Admin / Ops Manager: unrestricted
    IF v_caller_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id;

    IF v_caller_role IN ('admin', 'ops_manager') THEN
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
            END IF;

            RETURN NEW;
        ELSE
            RAISE EXCEPTION 'Unauthorized role for updating service requests.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_enforce_service_requests_rules ON public.service_requests;
CREATE TRIGGER trigger_enforce_service_requests_rules
    BEFORE INSERT OR UPDATE ON public.service_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_service_requests_rules();


-- ==============================================================================
-- 3. SEC-02: PAYMENTS HARDENING & RPC RECORD PAYMENT
-- ==============================================================================
-- Remove direct client INSERT privilege on payments
DROP POLICY IF EXISTS "payments_customer_insert" ON public.payments;

-- Online gateway payments will be written by a payment webhook using the service_role key.
-- Cash / on-site collection is recorded through record_payment()
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


-- ==============================================================================
-- 4. SEC-03: VENDORS PROTECTION TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.enforce_vendor_update_rules()
RETURNS TRIGGER AS $$
DECLARE
    v_caller_role TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();

    IF v_caller_role = 'admin' THEN
        RETURN NEW;
    END IF;

    -- Non-admins cannot modify status, rating, subscription plan, mobile, or user_id
    IF (NEW.status IS DISTINCT FROM OLD.status) OR
       (NEW.rating IS DISTINCT FROM OLD.rating) OR
       (NEW.plan IS DISTINCT FROM OLD.plan) OR
       (NEW.user_id IS DISTINCT FROM OLD.user_id) OR
       (NEW.mobile IS DISTINCT FROM OLD.mobile) THEN
        RAISE EXCEPTION 'Vendors cannot modify status, rating, subscription plan, mobile, or user_id.';
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_enforce_vendor_update_rules ON public.vendors;
CREATE TRIGGER trigger_enforce_vendor_update_rules
    BEFORE UPDATE ON public.vendors
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_vendor_update_rules();


-- ==============================================================================
-- 5. SEC-06: CUSTOMERS PROTECTION TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.enforce_customer_update_rules()
RETURNS TRIGGER AS $$
DECLARE
    v_caller_role TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();

    IF v_caller_role = 'admin' THEN
        RETURN NEW;
    END IF;

    -- Block non-admin changes to status, total_bookings, total_spent, user_id
    IF (NEW.status IS DISTINCT FROM OLD.status) OR
       (NEW.total_bookings IS DISTINCT FROM OLD.total_bookings) OR
       (NEW.total_spent IS DISTINCT FROM OLD.total_spent) OR
       (NEW.user_id IS DISTINCT FROM OLD.user_id) THEN
        RAISE EXCEPTION 'Customers cannot modify status, spend counters, or user_id.';
    END IF;

    -- If customer changes phone, reset phone_verified on their profile
    IF (NEW.phone IS DISTINCT FROM OLD.phone) AND NEW.user_id IS NOT NULL THEN
        UPDATE public.profiles
        SET phone = NEW.phone,
            phone_verified = false,
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_enforce_customer_update_rules ON public.customers;
CREATE TRIGGER trigger_enforce_customer_update_rules
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_customer_update_rules();


-- ==============================================================================
-- 6. SEC-07: PROFILES MUST_CHANGE_PASSWORD TRANSITION PERMISSION
-- ==============================================================================
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
            -- ALLOW EXCEPTION: User clearing their own must_change_password flag from true to false
            IF (OLD.must_change_password = true AND NEW.must_change_password = false) AND
               (NEW.role IS NOT DISTINCT FROM OLD.role) AND
               (NEW.phone_verified IS NOT DISTINCT FROM OLD.phone_verified) THEN
                -- Permitted: staff member resetting temporary password on first login
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


-- ==============================================================================
-- 7. SEC-08: COMPLAINTS CUSTOMER INSERT RESTRICTION
-- ==============================================================================
DROP POLICY IF EXISTS "complaints_customer_insert" ON public.complaints;

CREATE POLICY "complaints_customer_insert"
    ON public.complaints FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        status = 'OPEN' AND
        resolution_notes IS NULL AND
        resolved_at IS NULL AND
        request_id IN (SELECT id FROM public.service_requests WHERE user_id = auth.uid())
    );


-- ==============================================================================
-- 8. SEC-10: HOME PROJECTS VENDOR ACCESS & RESTRICTION
-- ==============================================================================
DROP POLICY IF EXISTS "home_projects_vendor_select" ON public.home_projects;
DROP POLICY IF EXISTS "home_projects_vendor_update" ON public.home_projects;

-- Assigned vendor can view assigned home renovation projects
CREATE POLICY "home_projects_vendor_select"
    ON public.home_projects FOR SELECT
    TO authenticated
    USING (
        public.get_current_user_role() = 'vendor' AND
        assigned_vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
    );

-- Assigned vendor can update execution status & progress
CREATE POLICY "home_projects_vendor_update"
    ON public.home_projects FOR UPDATE
    TO authenticated
    USING (
        public.get_current_user_role() = 'vendor' AND
        assigned_vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
    )
    WITH CHECK (
        public.get_current_user_role() = 'vendor' AND
        assigned_vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
    );

-- Trigger preventing vendor tampering with customer details or project budget
CREATE OR REPLACE FUNCTION public.enforce_home_projects_rules()
RETURNS TRIGGER AS $$
DECLARE
    v_caller_role TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();

    IF v_caller_role IN ('admin', 'ops_manager') THEN
        RETURN NEW;
    END IF;

    IF v_caller_role = 'vendor' THEN
        -- Vendors cannot change customer info, budget, or assignment
        IF (NEW.customer_name IS DISTINCT FROM OLD.customer_name) OR
           (NEW.customer_phone IS DISTINCT FROM OLD.customer_phone) OR
           (NEW.locality IS DISTINCT FROM OLD.locality) OR
           (NEW.project_type IS DISTINCT FROM OLD.project_type) OR
           (NEW.estimated_budget IS DISTINCT FROM OLD.estimated_budget) OR
           (NEW.assigned_vendor_id IS DISTINCT FROM OLD.assigned_vendor_id) OR
           (NEW.user_id IS DISTINCT FROM OLD.user_id) THEN
            RAISE EXCEPTION 'Vendors cannot modify customer details, budget, or assignment on home projects.';
        END IF;

        IF NEW.status NOT IN ('SITE_VISIT_SCHEDULED', 'ESTIMATE_PREPARED', 'IN_EXECUTION', 'COMPLETED') THEN
            RAISE EXCEPTION 'Invalid status progression for home project.';
        END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_enforce_home_projects_rules ON public.home_projects;
CREATE TRIGGER trigger_enforce_home_projects_rules
    BEFORE UPDATE ON public.home_projects
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_home_projects_rules();
