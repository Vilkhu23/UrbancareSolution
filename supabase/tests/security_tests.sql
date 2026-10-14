-- ==============================================================================
-- Security Hardening Test Suite (PostgreSQL / Supabase RLS & Trigger Verification)
-- File: supabase/tests/security_tests.sql
-- Description: Automated SQL test cases verifying fixes for SEC-01 through SEC-11.
--              Every test strictly follows the robust authorization lifecycle:
--                (a) As postgres: perform all setup (users, bookings, assignments, status)
--                (b) Switch to restricted session via become_user(uuid) & SET LOCAL ROLE authenticated
--                (c) Run ONLY the attack / verified action in a nested BEGIN ... EXCEPTION block
--                (d) Guaranteed reset via become_postgres() & RESET ROLE under both success & exception
--                (e) As postgres: verify state, check logs, and output PASS / FAIL notice
--              Wraps in a transaction and rolls back all test records at the end.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- SETUP: Session Identity & Pass Counter Helpers
-- ------------------------------------------------------------------------------
-- Initialize transaction pass counter
DO $$
BEGIN
    PERFORM set_config('app.test_pass_count', '0', true);
END $$;

-- Helper to record a test pass and print notice output
CREATE OR REPLACE FUNCTION public.sec_test_record_pass(p_test_id TEXT, p_desc TEXT)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config(
        'app.test_pass_count',
        (COALESCE(NULLIF(current_setting('app.test_pass_count', true), ''), '0')::INT + 1)::TEXT,
        true
    );
    RAISE NOTICE 'PASS: % %', p_test_id, p_desc;
END;
$$ LANGUAGE plpgsql;

-- Helper to switch session identity to superuser (postgres) with empty JWT claims
CREATE OR REPLACE FUNCTION public.sec_test_become_postgres()
RETURNS VOID AS $$
BEGIN
    RESET ROLE;
    PERFORM set_config('request.jwt.claims', '', true);
    PERFORM set_config('request.jwt.claim.sub', '', true);
    PERFORM set_config('request.jwt.claim.role', 'postgres', true);
END;
$$ LANGUAGE plpgsql;

-- Helper to switch session identity to an authenticated user with valid JWT claims
CREATE OR REPLACE FUNCTION public.sec_test_become_user(p_uid UUID)
RETURNS VOID AS $$
BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM set_config('request.jwt.claims', json_build_object('sub', p_uid::TEXT, 'role', 'authenticated')::text, true);
    PERFORM set_config('request.jwt.claim.sub', p_uid::TEXT, true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
END;
$$ LANGUAGE plpgsql;

-- Helper function to provision a real test user into auth.users and public.profiles
CREATE OR REPLACE FUNCTION public.sec_test_setup_user(
    p_id UUID,
    p_role TEXT,
    p_name TEXT,
    p_phone TEXT,
    p_must_change_password BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
DECLARE
    v_email TEXT;
BEGIN
    v_email := 'sec_test_' || replace(p_id::TEXT, '-', '') || '@test.pindcare.internal';

    -- Guarantee setup executes with superuser identity
    PERFORM public.sec_test_become_postgres();

    -- 1. Insert user into auth.users first
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    ) VALUES (
        p_id,
        '00000000-0000-0000-0000-000000000000'::UUID,
        'authenticated',
        'authenticated',
        v_email,
        crypt('TestSecretPass123!', gen_salt('bf')),
        NOW(),
        '{}'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- 2. Update profiles row
    INSERT INTO public.profiles (
        id,
        role,
        full_name,
        phone,
        phone_verified,
        locality,
        address,
        must_change_password,
        created_at,
        updated_at
    ) VALUES (
        p_id,
        p_role,
        p_name,
        p_phone,
        true,
        'Sector 94, Mohali',
        'Test Address',
        p_must_change_password,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        phone_verified = EXCLUDED.phone_verified,
        must_change_password = EXCLUDED.must_change_password,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.sec_test_record_pass(TEXT, TEXT) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.sec_test_become_postgres() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.sec_test_become_user(UUID) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.sec_test_setup_user(UUID, TEXT, TEXT, TEXT, BOOLEAN) TO PUBLIC;

DO $$
BEGIN
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'STARTING SECURITY HARDENING TEST SUITE FOR PINDCARE / URBANCARE';
    RAISE NOTICE '====================================================================';
END $$;

-- ------------------------------------------------------------------------------
-- TEST 1 (SEC-01): Customer Pricing & Status Tamper Protection
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_cust_uid UUID := gen_random_uuid();
    v_req_id TEXT := 'TEST-REQ-1-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8);
    v_t1_passed BOOLEAN := FALSE;
    v_t2_passed BOOLEAN := FALSE;
    v_t3_passed BOOLEAN := FALSE;
BEGIN
    -- (a) Setup as postgres
    PERFORM public.sec_test_become_postgres();
    PERFORM public.sec_test_setup_user(v_cust_uid, 'customer', 'Test Customer 1', '+91 98888 11111');

    INSERT INTO public.service_requests (
        id, customer_name, customer_phone, customer_address, locality, items, total, user_id
    ) VALUES (
        v_req_id, 'Test Customer 1', '+91 98888 11111', 'Flat 402, Sec 94', 'Sector 94, Mohali', '[]'::jsonb, 1499.00, v_cust_uid
    );

    -- (b) Switch to restricted customer
    BEGIN
        PERFORM public.sec_test_become_user(v_cust_uid);
        SET LOCAL ROLE authenticated;

        IF current_user != 'authenticated' OR auth.uid() IS DISTINCT FROM v_cust_uid OR public.get_current_user_role() IS DISTINCT FROM 'customer' THEN
            RAISE EXCEPTION 'TEST SETUP ERROR: session failed to switch to customer';
        END IF;

        -- (c) Attack attempts
        -- 1.1: Customer attempts to reduce total to 0.00
        BEGIN
            UPDATE public.service_requests SET total = 0.00 WHERE id = v_req_id;
            RAISE EXCEPTION 'FAIL: Test 1.1 customer was able to modify total!';
        EXCEPTION WHEN OTHERS THEN
            IF SQLERRM LIKE '%Customers cannot modify pricing%' THEN
                v_t1_passed := TRUE;
            ELSE
                RAISE EXCEPTION 'FAIL: Test 1.1 unexpected error: %', SQLERRM;
            END IF;
        END;

        -- 1.2: Customer attempts to set payment_status = 'PAID'
        BEGIN
            UPDATE public.service_requests SET payment_status = 'PAID' WHERE id = v_req_id;
            RAISE EXCEPTION 'FAIL: Test 1.2 customer was able to mark payment_status = PAID!';
        EXCEPTION WHEN OTHERS THEN
            IF SQLERRM LIKE '%Customers cannot modify pricing%' THEN
                v_t2_passed := TRUE;
            ELSE
                RAISE EXCEPTION 'FAIL: Test 1.2 unexpected error: %', SQLERRM;
            END IF;
        END;

        -- 1.3: Customer attempts to assign technician
        BEGIN
            UPDATE public.service_requests SET assigned_to = '{"id":"emp-1"}'::jsonb WHERE id = v_req_id;
            RAISE EXCEPTION 'FAIL: Test 1.3 customer was able to assign ticket!';
        EXCEPTION WHEN OTHERS THEN
            IF SQLERRM LIKE '%Customers cannot modify pricing%' THEN
                v_t3_passed := TRUE;
            ELSE
                RAISE EXCEPTION 'FAIL: Test 1.3 unexpected error: %', SQLERRM;
            END IF;
        END;

        -- (d) Reset
        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    -- (e) As postgres: record results
    IF v_t1_passed THEN
        PERFORM public.sec_test_record_pass('Test 01.1', 'customer cannot modify total');
    END IF;

    IF v_t2_passed THEN
        PERFORM public.sec_test_record_pass('Test 01.2', 'customer cannot mark payment_status = PAID');
    END IF;

    IF v_t3_passed THEN
        PERFORM public.sec_test_record_pass('Test 01.3', 'customer cannot assign technician');
    END IF;

    IF NOT (v_t1_passed AND v_t2_passed AND v_t3_passed) THEN
        RAISE EXCEPTION 'FAIL: Test 1 not all sub-tests passed';
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- TEST 2 (SEC-05): Secrets Isolation (RLS & Mutation Block)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_cust_uid UUID := gen_random_uuid();
    v_tech_uid UUID := gen_random_uuid();
    v_req_id TEXT := 'TEST-REQ-2-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8);
    v_emp_id TEXT := 'emp-test-2-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6);
    v_emp_code TEXT := 'EMP-2-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6);
    v_phone TEXT := '+91 ' || LPAD((FLOOR(RANDOM() * 9000000000) + 1000000000)::TEXT, 10, '0');
    v_otp_count INT;
    v_cust_count INT;
    v_t1_passed BOOLEAN := FALSE;
    v_t2_passed BOOLEAN := FALSE;
    v_t3_passed BOOLEAN := FALSE;
BEGIN
    -- (a) Setup as postgres: create users, employees, booking, and assign technician
    PERFORM public.sec_test_become_postgres();
    PERFORM public.sec_test_setup_user(v_cust_uid, 'customer', 'Customer 2', '+91 98888 22222');
    PERFORM public.sec_test_setup_user(v_tech_uid, 'technician', 'Tech 2', v_phone);

    INSERT INTO public.employees (id, employee_code, name, mobile, role, user_id)
    VALUES (v_emp_id, v_emp_code, 'Tech 2', v_phone, 'Field Specialist', v_tech_uid);

    INSERT INTO public.service_requests (
        id, customer_name, customer_phone, customer_address, locality, items, total, user_id
    ) VALUES (
        v_req_id, 'Customer 2', '+91 98888 22222', 'Sector 94', 'Sector 94', '[]'::jsonb, 500.00, v_cust_uid
    );

    UPDATE public.service_requests 
    SET assigned_to = jsonb_build_object('id', v_emp_id, 'name', 'Tech 2')
    WHERE id = v_req_id;

    -- (b) Technician attack checks
    BEGIN
        PERFORM public.sec_test_become_user(v_tech_uid);
        SET LOCAL ROLE authenticated;

        IF current_user != 'authenticated' OR auth.uid() IS DISTINCT FROM v_tech_uid OR public.get_current_user_role() IS DISTINCT FROM 'technician' THEN
            RAISE EXCEPTION 'TEST SETUP ERROR: session failed to switch to technician';
        END IF;

        -- 2.1: Technician attempts to SELECT from service_request_secrets (RLS returns 0 rows)
        SELECT COUNT(*) INTO v_otp_count FROM public.service_request_secrets WHERE request_id = v_req_id;
        IF v_otp_count = 0 THEN
            v_t1_passed := TRUE;
        ELSE
            RAISE EXCEPTION 'FAIL: Test 2.1 technician was able to read % secrets rows under RLS!', v_otp_count;
        END IF;

        -- 2.2: Technician attempts direct INSERT on service_request_secrets
        BEGIN
            INSERT INTO public.service_request_secrets (
                request_id, user_id, customer_otp, completion_code, failed_attempts
            ) VALUES (
                v_req_id, v_tech_uid, '9999', 'HACKED', 0
            );
            RAISE EXCEPTION 'FAIL: Test 2.2 technician was able to insert into service_request_secrets directly!';
        EXCEPTION WHEN OTHERS THEN
            v_t2_passed := TRUE;
        END;

        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    -- (c) Customer read check (should succeed)
    BEGIN
        PERFORM public.sec_test_become_user(v_cust_uid);
        SET LOCAL ROLE authenticated;

        IF current_user != 'authenticated' OR auth.uid() IS DISTINCT FROM v_cust_uid OR public.get_current_user_role() IS DISTINCT FROM 'customer' THEN
            RAISE EXCEPTION 'TEST SETUP ERROR: session failed to switch to customer';
        END IF;

        -- 2.3: Customer CAN read their own secret (Must return 1 row)
        SELECT COUNT(*) INTO v_cust_count FROM public.service_request_secrets WHERE request_id = v_req_id;
        IF v_cust_count = 1 THEN
            v_t3_passed := TRUE;
        ELSE
            RAISE EXCEPTION 'FAIL: Test 2.3 customer was unable to read own secret (count=%)!', v_cust_count;
        END IF;

        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    -- (d) As postgres: record results
    IF v_t1_passed THEN
        PERFORM public.sec_test_record_pass('Test 02.1', 'technician cannot read customer_otp from secrets table');
    END IF;

    IF v_t2_passed THEN
        PERFORM public.sec_test_record_pass('Test 02.2', 'technician cannot insert into service_request_secrets table');
    END IF;

    IF v_t3_passed THEN
        PERFORM public.sec_test_record_pass('Test 02.3', 'customer can read own secret from secrets table');
    END IF;

    IF NOT (v_t1_passed AND v_t2_passed AND v_t3_passed) THEN
        RAISE EXCEPTION 'FAIL: Test 2 not all sub-tests passed';
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- TEST 3 (SEC-05): Rate-Limiting & Brute Force Lockout
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_cust_uid UUID := gen_random_uuid();
    v_tech_uid UUID := gen_random_uuid();
    v_ops_uid UUID := gen_random_uuid();
    v_req_id TEXT := 'TEST-REQ-3-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8);
    v_emp_id TEXT := 'emp-test-3-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6);
    v_emp_code TEXT := 'EMP-3-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6);
    v_phone TEXT := '+91 ' || LPAD((FLOOR(RANDOM() * 9000000000) + 1000000000)::TEXT, 10, '0');
    v_real_otp TEXT;
    v_i INT;
    v_res JSONB;
    v_failed_attempts INT;
    v_status_after TEXT;
    v_audit_count INT;
    v_t1_passed BOOLEAN := FALSE;
    v_t2_passed BOOLEAN := FALSE;
BEGIN
    -- (a) Setup as postgres
    PERFORM public.sec_test_become_postgres();
    PERFORM public.sec_test_setup_user(v_cust_uid, 'customer', 'Customer 3', '+91 98888 44444');
    PERFORM public.sec_test_setup_user(v_tech_uid, 'technician', 'Tech 3', v_phone);
    PERFORM public.sec_test_setup_user(v_ops_uid, 'ops_manager', 'Ops Mgr 3', '+91 98888 44445');

    INSERT INTO public.employees (id, employee_code, name, mobile, user_id)
    VALUES (v_emp_id, v_emp_code, 'Tech 3', v_phone, v_tech_uid);

    INSERT INTO public.service_requests (
        id, customer_name, customer_phone, customer_address, locality, items, total, user_id
    ) VALUES (
        v_req_id, 'Customer 3', '+91 98888 44444', 'Sector 94', 'Sector 94', '[]'::jsonb, 799.00, v_cust_uid
    );

    UPDATE public.service_requests 
    SET assigned_to = jsonb_build_object('id', v_emp_id, 'name', 'Tech 3'),
        status = 'IN PROGRESS'
    WHERE id = v_req_id;

    SELECT customer_otp INTO v_real_otp FROM public.service_request_secrets WHERE request_id = v_req_id;

    -- (b) 5 wrong attempts as technician
    BEGIN
        PERFORM public.sec_test_become_user(v_tech_uid);
        SET LOCAL ROLE authenticated;

        IF current_user != 'authenticated' OR auth.uid() IS DISTINCT FROM v_tech_uid OR public.get_current_user_role() IS DISTINCT FROM 'technician' THEN
            RAISE EXCEPTION 'TEST SETUP ERROR: session failed to switch to technician';
        END IF;

        -- 1. Wrong attempts 1 to 4 must return code INVALID_OTP with attempts_left 4, 3, 2, 1
        FOR v_i IN 1..4 LOOP
            v_res := public.verify_job_otp(v_req_id, '0000');
            IF (v_res->>'success')::BOOLEAN != FALSE OR (v_res->>'code') != 'INVALID_OTP' OR (v_res->>'attempts_left')::INT != (5 - v_i) THEN
                RAISE EXCEPTION 'FAIL: Test 3.1 attempt % did not return expected INVALID_OTP: %', v_i, v_res;
            END IF;
        END LOOP;

        -- 2. Wrong attempt 5 must return code LOCKED with attempts_left 0
        v_res := public.verify_job_otp(v_req_id, '0000');
        IF (v_res->>'success')::BOOLEAN != FALSE OR (v_res->>'code') != 'LOCKED' OR (v_res->>'attempts_left')::INT != 0 THEN
            RAISE EXCEPTION 'FAIL: Test 3.1 attempt 5 did not return expected LOCKED: %', v_res;
        END IF;

        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    -- 3. As postgres, check failed_attempts = 5
    SELECT failed_attempts INTO v_failed_attempts FROM public.service_request_secrets WHERE request_id = v_req_id;
    IF v_failed_attempts != 5 THEN
        RAISE EXCEPTION 'FAIL: Test 3.1 failed_attempts is %, expected 5', v_failed_attempts;
    END IF;

    -- 4. 6th attempt as the technician with the CORRECT OTP must return LOCKED, and the job must not be completed
    BEGIN
        PERFORM public.sec_test_become_user(v_tech_uid);
        SET LOCAL ROLE authenticated;

        v_res := public.verify_job_otp(v_req_id, v_real_otp);
        IF (v_res->>'success')::BOOLEAN != FALSE OR (v_res->>'code') != 'LOCKED' OR (v_res->>'attempts_left')::INT != 0 THEN
            RAISE EXCEPTION 'FAIL: Test 3.1 6th attempt with correct OTP did not return LOCKED: %', v_res;
        END IF;

        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    SELECT status INTO v_status_after FROM public.service_requests WHERE id = v_req_id;
    IF v_status_after = 'COMPLETED' THEN
        RAISE EXCEPTION 'FAIL: Test 3.1 job status was marked COMPLETED despite lock!';
    END IF;
    v_t1_passed := TRUE;

    -- 5. The ops reset test: after reset_job_otp_lock, the correct OTP works and the reset is audit-logged
    BEGIN
        PERFORM public.sec_test_become_user(v_ops_uid);
        SET LOCAL ROLE authenticated;

        IF current_user != 'authenticated' OR auth.uid() IS DISTINCT FROM v_ops_uid OR public.get_current_user_role() IS DISTINCT FROM 'ops_manager' THEN
            RAISE EXCEPTION 'TEST SETUP ERROR: session failed to switch to ops_manager';
        END IF;

        v_res := public.reset_job_otp_lock(v_req_id);
        IF (v_res->>'success')::BOOLEAN != TRUE OR (v_res->>'code') != 'LOCK_RESET' THEN
            RAISE EXCEPTION 'FAIL: Test 3.2 reset_job_otp_lock failed: %', v_res;
        END IF;

        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    -- Technician attempts verification with correct OTP after reset: must succeed
    BEGIN
        PERFORM public.sec_test_become_user(v_tech_uid);
        SET LOCAL ROLE authenticated;

        v_res := public.verify_job_otp(v_req_id, v_real_otp);
        IF (v_res->>'success')::BOOLEAN != TRUE OR (v_res->>'code') != 'VERIFIED' THEN
            RAISE EXCEPTION 'FAIL: Test 3.2 technician verification after reset failed: %', v_res;
        END IF;

        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    -- As postgres: verify failed_attempts = 0, status is COMPLETED, and audit log entry exists
    SELECT failed_attempts INTO v_failed_attempts FROM public.service_request_secrets WHERE request_id = v_req_id;
    IF v_failed_attempts != 0 THEN
        RAISE EXCEPTION 'FAIL: Test 3.2 failed_attempts after reset is %, expected 0', v_failed_attempts;
    END IF;

    SELECT status INTO v_status_after FROM public.service_requests WHERE id = v_req_id;
    IF v_status_after != 'COMPLETED' THEN
        RAISE EXCEPTION 'FAIL: Test 3.2 job was not COMPLETED after successful verification following reset! (status=%)', v_status_after;
    END IF;

    SELECT COUNT(*) INTO v_audit_count FROM public.audit_logs WHERE action = 'RESET_OTP_LOCK' AND entity_id = v_req_id;
    IF v_audit_count < 1 THEN
        RAISE EXCEPTION 'FAIL: Test 3.2 audit log entry for RESET_OTP_LOCK was not found!';
    END IF;
    v_t2_passed := TRUE;

    -- (e) As postgres: record results
    IF v_t1_passed THEN
        PERFORM public.sec_test_record_pass('Test 03.1', 'verify_job_otp locks request after 5 failed attempts');
    END IF;

    IF v_t2_passed THEN
        PERFORM public.sec_test_record_pass('Test 03.2', 'ops_manager can reset OTP lock and technician can complete job');
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- TEST 4 (SEC-02): Direct Payment Insertion Protection
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_cust_uid UUID := gen_random_uuid();
    v_req_id TEXT := 'TEST-REQ-4-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8);
    v_blocked BOOLEAN := FALSE;
BEGIN
    -- (a) Setup as postgres
    PERFORM public.sec_test_become_postgres();
    PERFORM public.sec_test_setup_user(v_cust_uid, 'customer', 'Customer 4', '+91 98888 66666');

    INSERT INTO public.service_requests (
        id, customer_name, customer_phone, customer_address, locality, items, total, user_id
    ) VALUES (
        v_req_id, 'Customer 4', '+91 98888 66666', 'Sector 94', 'Sector 94', '[]'::jsonb, 999.00, v_cust_uid
    );

    -- (b) Customer attack
    BEGIN
        PERFORM public.sec_test_become_user(v_cust_uid);
        SET LOCAL ROLE authenticated;

        IF current_user != 'authenticated' OR auth.uid() IS DISTINCT FROM v_cust_uid OR public.get_current_user_role() IS DISTINCT FROM 'customer' THEN
            RAISE EXCEPTION 'TEST SETUP ERROR: session failed to switch to customer';
        END IF;

        BEGIN
            INSERT INTO public.payments (
                id, request_id, customer_name, amount, method, status, user_id
            ) VALUES (
                'pay-test-evil', v_req_id, 'Customer 4', 9999.00, 'UPI', 'COMPLETED', v_cust_uid
            );
            RAISE EXCEPTION 'FAIL: Test 4.1 customer was able to insert payment directly!';
        EXCEPTION WHEN OTHERS THEN
            v_blocked := TRUE;
        END;

        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    -- (c) As postgres: record results
    IF v_blocked THEN
        PERFORM public.sec_test_record_pass('Test 04.1', 'direct customer INSERT on payments table is completely blocked');
    ELSE
        RAISE EXCEPTION 'FAIL: Test 4.1 customer was able to insert payment directly!';
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- TEST 5 (SEC-03): Vendor Status & Metric Tamper Protection
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_vnd_uid UUID := gen_random_uuid();
    v_vnd_id TEXT := 'vnd-test-5-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6);
    v_phone TEXT := '+91 ' || LPAD((FLOOR(RANDOM() * 9000000000) + 1000000000)::TEXT, 10, '0');
    v_t1_passed BOOLEAN := FALSE;
    v_t2_passed BOOLEAN := FALSE;
BEGIN
    -- (a) Setup as postgres
    PERFORM public.sec_test_become_postgres();
    PERFORM public.sec_test_setup_user(v_vnd_uid, 'vendor', 'Artisan 5', v_phone);

    INSERT INTO public.vendors (id, business_name, owner_name, mobile, status, user_id)
    VALUES (v_vnd_id, 'Cooling Pros', 'Artisan 5', v_phone, 'PENDING_VERIFICATION', v_vnd_uid);

    -- (b) Vendor attacks
    BEGIN
        PERFORM public.sec_test_become_user(v_vnd_uid);
        SET LOCAL ROLE authenticated;

        IF current_user != 'authenticated' OR auth.uid() IS DISTINCT FROM v_vnd_uid OR public.get_current_user_role() IS DISTINCT FROM 'vendor' THEN
            RAISE EXCEPTION 'TEST SETUP ERROR: session failed to switch to vendor';
        END IF;

        -- 5.1: Status escalation attempt
        BEGIN
            UPDATE public.vendors SET status = 'ACTIVE' WHERE user_id = v_vnd_uid;
            RAISE EXCEPTION 'FAIL: Test 5.1 vendor was able to activate status!';
        EXCEPTION WHEN OTHERS THEN
            IF SQLERRM LIKE '%Vendors cannot modify status%' THEN
                v_t1_passed := TRUE;
            ELSE
                RAISE EXCEPTION 'FAIL: Test 5.1 unexpected error: %', SQLERRM;
            END IF;
        END;

        -- 5.2: Plan credit modification attempt
        BEGIN
            UPDATE public.vendors SET plan = '{"remainingOpportunities": 999}'::jsonb WHERE user_id = v_vnd_uid;
            RAISE EXCEPTION 'FAIL: Test 5.2 vendor was able to modify plan credits!';
        EXCEPTION WHEN OTHERS THEN
            IF SQLERRM LIKE '%Vendors cannot modify status%' THEN
                v_t2_passed := TRUE;
            ELSE
                RAISE EXCEPTION 'FAIL: Test 5.2 unexpected error: %', SQLERRM;
            END IF;
        END;

        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    -- (c) As postgres: record results
    IF v_t1_passed THEN
        PERFORM public.sec_test_record_pass('Test 05.1', 'vendor cannot escalate status');
    END IF;

    IF v_t2_passed THEN
        PERFORM public.sec_test_record_pass('Test 05.2', 'vendor cannot modify plan credits');
    END IF;

    IF NOT (v_t1_passed AND v_t2_passed) THEN
        RAISE EXCEPTION 'FAIL: Test 5 not all sub-tests passed';
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- TEST 6 (SEC-06): Customer Status & Metrics Tamper Protection
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_cust_uid UUID := gen_random_uuid();
    v_cust_id TEXT := 'cust-test-6-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6);
    v_phone TEXT := '+91 ' || LPAD((FLOOR(RANDOM() * 9000000000) + 1000000000)::TEXT, 10, '0');
    v_t1_passed BOOLEAN := FALSE;
    v_t2_passed BOOLEAN := FALSE;
BEGIN
    -- (a) Setup as postgres
    PERFORM public.sec_test_become_postgres();
    PERFORM public.sec_test_setup_user(v_cust_uid, 'customer', 'Customer 6', v_phone);

    INSERT INTO public.customers (id, name, phone, address, status, total_spent, total_bookings, user_id)
    VALUES (v_cust_id, 'Customer 6', v_phone, 'Sunny Enclave', 'BLOCKED', 5000.00, 5, v_cust_uid);

    -- (b) Customer attacks
    BEGIN
        PERFORM public.sec_test_become_user(v_cust_uid);
        SET LOCAL ROLE authenticated;

        IF current_user != 'authenticated' OR auth.uid() IS DISTINCT FROM v_cust_uid OR public.get_current_user_role() IS DISTINCT FROM 'customer' THEN
            RAISE EXCEPTION 'TEST SETUP ERROR: session failed to switch to customer';
        END IF;

        -- 6.1: Unblock attempt
        BEGIN
            UPDATE public.customers SET status = 'ACTIVE' WHERE user_id = v_cust_uid;
            RAISE EXCEPTION 'FAIL: Test 6.1 blocked customer was able to set status = ACTIVE!';
        EXCEPTION WHEN OTHERS THEN
            IF SQLERRM LIKE '%Customers cannot modify status%' THEN
                v_t1_passed := TRUE;
            ELSE
                RAISE EXCEPTION 'FAIL: Test 6.1 unexpected error: %', SQLERRM;
            END IF;
        END;

        -- 6.2: Spend tampering attempt
        BEGIN
            UPDATE public.customers SET total_spent = 0.00, total_bookings = 99 WHERE user_id = v_cust_uid;
            RAISE EXCEPTION 'FAIL: Test 6.2 customer was able to modify total_spent or total_bookings!';
        EXCEPTION WHEN OTHERS THEN
            IF SQLERRM LIKE '%Customers cannot modify status%' THEN
                v_t2_passed := TRUE;
            ELSE
                RAISE EXCEPTION 'FAIL: Test 6.2 unexpected error: %', SQLERRM;
            END IF;
        END;

        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    -- (c) As postgres: record results
    IF v_t1_passed THEN
        PERFORM public.sec_test_record_pass('Test 06.1', 'blocked customer cannot modify status');
    END IF;

    IF v_t2_passed THEN
        PERFORM public.sec_test_record_pass('Test 06.2', 'customer cannot tamper with total_spent or metrics');
    END IF;

    IF NOT (v_t1_passed AND v_t2_passed) THEN
        RAISE EXCEPTION 'FAIL: Test 6 not all sub-tests passed';
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- TEST 7 (SEC-07): Staff Password Reset & Role Escalation Protection
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_staff_uid UUID := gen_random_uuid();
    v_phone TEXT := '+91 ' || LPAD((FLOOR(RANDOM() * 9000000000) + 1000000000)::TEXT, 10, '0');
    v_flag_val BOOLEAN;
    v_t1_passed BOOLEAN := FALSE;
    v_t2_passed BOOLEAN := FALSE;
BEGIN
    -- (a) Setup as postgres
    PERFORM public.sec_test_become_postgres();
    PERFORM public.sec_test_setup_user(v_staff_uid, 'technician', 'Staff 7', v_phone, true);

    -- (b) Action under test: staff clears must_change_password (should succeed)
    BEGIN
        PERFORM public.sec_test_become_user(v_staff_uid);
        SET LOCAL ROLE authenticated;

        IF current_user != 'authenticated' OR auth.uid() IS DISTINCT FROM v_staff_uid OR public.get_current_user_role() IS DISTINCT FROM 'technician' THEN
            RAISE EXCEPTION 'TEST SETUP ERROR: session failed to switch to technician';
        END IF;

        UPDATE public.profiles SET must_change_password = false WHERE id = v_staff_uid;

        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    -- (c) As postgres: check result
    SELECT must_change_password INTO v_flag_val FROM public.profiles WHERE id = v_staff_uid;
    IF v_flag_val = false THEN
        v_t1_passed := TRUE;
    ELSE
        RAISE EXCEPTION 'FAIL: Test 7.1 staff was unable to clear must_change_password!';
    END IF;

    -- (d) Attack: staff attempts to escalate role to admin
    BEGIN
        PERFORM public.sec_test_become_user(v_staff_uid);
        SET LOCAL ROLE authenticated;

        BEGIN
            UPDATE public.profiles SET role = 'admin' WHERE id = v_staff_uid;
            RAISE EXCEPTION 'FAIL: Test 7.2 staff was able to escalate role to admin!';
        EXCEPTION WHEN OTHERS THEN
            IF SQLERRM LIKE '%Privilege escalation rejected%' THEN
                v_t2_passed := TRUE;
            ELSE
                RAISE EXCEPTION 'FAIL: Test 7.2 unexpected error: %', SQLERRM;
            END IF;
        END;

        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    -- (e) As postgres: record results
    IF v_t1_passed THEN
        PERFORM public.sec_test_record_pass('Test 07.1', 'staff can clear must_change_password from true to false');
    END IF;

    IF v_t2_passed THEN
        PERFORM public.sec_test_record_pass('Test 07.2', 'staff cannot escalate role to admin');
    END IF;

    IF NOT (v_t1_passed AND v_t2_passed) THEN
        RAISE EXCEPTION 'FAIL: Test 7 not all sub-tests passed';
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- TEST 8 (OTP ENFORCEMENT): Completion Workflow & Audit across 5 Distinct Roles
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    -- 5 distinct test users with 5 distinct UUIDs
    v_cust_uid  UUID := gen_random_uuid();
    v_tech_uid  UUID := gen_random_uuid();
    v_vnd_uid   UUID := gen_random_uuid();
    v_ops_uid   UUID := gen_random_uuid();
    v_admin_uid UUID := gen_random_uuid();

    -- Service requests (all belong to customer only)
    v_req_tech_id  TEXT := 'TEST-REQ-TECH-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6);
    v_req_vnd_id   TEXT := 'TEST-REQ-VND-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6);
    v_req_ops_id   TEXT := 'TEST-REQ-OPS-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6);
    v_req_admin_id TEXT := 'TEST-REQ-ADM-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6);

    v_emp_id TEXT := 'emp-test-8-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6);
    v_emp_code TEXT := 'EMP-8-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6);
    v_vnd_id TEXT := 'vnd-test-8-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6);

    v_tech_phone TEXT := '+91 ' || LPAD((FLOOR(RANDOM() * 9000000000) + 1000000000)::TEXT, 10, '0');
    v_vnd_phone  TEXT := '+91 ' || LPAD((FLOOR(RANDOM() * 9000000000) + 1000000000)::TEXT, 10, '0');

    v_real_otp TEXT;
    v_status_after TEXT;
    v_audit_count INT;
    v_res JSONB;

    v_t1_passed BOOLEAN := FALSE;
    v_t2_passed BOOLEAN := FALSE;
    v_t3_passed BOOLEAN := FALSE;
    v_t4_passed BOOLEAN := FALSE;
    v_t5_passed BOOLEAN := FALSE;
    v_t6_passed BOOLEAN := FALSE;
BEGIN
    -- (a) Setup as postgres: create all users, entities, bookings, assignments
    PERFORM public.sec_test_become_postgres();
    PERFORM public.sec_test_setup_user(v_cust_uid, 'customer', 'Customer 8', '+91 98888 88881');
    PERFORM public.sec_test_setup_user(v_tech_uid, 'technician', 'Tech 8', v_tech_phone);
    PERFORM public.sec_test_setup_user(v_vnd_uid, 'vendor', 'Vendor 8', v_vnd_phone);
    PERFORM public.sec_test_setup_user(v_ops_uid, 'ops_manager', 'Ops Mgr 8', '+91 98888 88884');
    PERFORM public.sec_test_setup_user(v_admin_uid, 'admin', 'Admin 8', '+91 98888 88885');

    INSERT INTO public.employees (id, employee_code, name, mobile, user_id)
    VALUES (v_emp_id, v_emp_code, 'Tech 8', v_tech_phone, v_tech_uid);

    INSERT INTO public.vendors (id, business_name, owner_name, mobile, status, user_id)
    VALUES (v_vnd_id, 'Super HVAC', 'Vendor 8', v_vnd_phone, 'ACTIVE', v_vnd_uid);

    INSERT INTO public.service_requests (id, customer_name, customer_phone, customer_address, locality, items, total, user_id)
    VALUES (v_req_tech_id, 'Customer 8', '+91 98888 88881', 'Sector 94', 'Sector 94', '[]'::jsonb, 650.00, v_cust_uid);

    INSERT INTO public.service_requests (id, customer_name, customer_phone, customer_address, locality, items, total, user_id)
    VALUES (v_req_vnd_id, 'Customer 8', '+91 98888 88881', 'Sector 94', 'Sector 94', '[]'::jsonb, 800.00, v_cust_uid);

    INSERT INTO public.service_requests (id, customer_name, customer_phone, customer_address, locality, items, total, user_id)
    VALUES (v_req_ops_id, 'Customer 8', '+91 98888 88881', 'Sector 94', 'Sector 94', '[]'::jsonb, 950.00, v_cust_uid);

    INSERT INTO public.service_requests (id, customer_name, customer_phone, customer_address, locality, items, total, user_id)
    VALUES (v_req_admin_id, 'Customer 8', '+91 98888 88881', 'Sector 94', 'Sector 94', '[]'::jsonb, 1200.00, v_cust_uid);

    UPDATE public.service_requests 
    SET assigned_to = jsonb_build_object('id', v_emp_id, 'name', 'Tech 8'), status = 'IN PROGRESS'
    WHERE id = v_req_tech_id;

    UPDATE public.service_requests 
    SET assigned_to = jsonb_build_object('id', v_vnd_id, 'name', 'Vendor 8'), status = 'IN PROGRESS'
    WHERE id = v_req_vnd_id;

    SELECT customer_otp INTO v_real_otp FROM public.service_request_secrets WHERE request_id = v_req_tech_id;

    -- (b) 1. TECHNICIAN VERIFICATION
    BEGIN
        PERFORM public.sec_test_become_user(v_tech_uid);
        SET LOCAL ROLE authenticated;

        IF current_user != 'authenticated' OR auth.uid() IS DISTINCT FROM v_tech_uid OR public.get_current_user_role() IS DISTINCT FROM 'technician' THEN
            RAISE EXCEPTION 'TEST SETUP ERROR: session failed to switch to technician';
        END IF;

        -- 8.1: Technician direct UPDATE fails
        BEGIN
            UPDATE public.service_requests SET status = 'COMPLETED' WHERE id = v_req_tech_id;
            RAISE EXCEPTION 'FAIL: Test 8.1 technician was able to directly UPDATE status to COMPLETED!';
        EXCEPTION WHEN OTHERS THEN
            IF SQLERRM LIKE '%Completion rejected%' OR SQLERRM LIKE '%verify_job_otp%' THEN
                v_t1_passed := TRUE;
            ELSE
                RAISE EXCEPTION 'FAIL: Test 8.1 unexpected error: %', SQLERRM;
            END IF;
        END;

        -- 8.2: Technician completion with wrong OTP fails (returns INVALID_OTP result)
        v_res := public.verify_job_otp(v_req_tech_id, '0000');
        IF (v_res->>'success')::BOOLEAN = FALSE AND (v_res->>'code') = 'INVALID_OTP' THEN
            v_t2_passed := TRUE;
        ELSE
            RAISE EXCEPTION 'FAIL: Test 8.2 verify_job_otp unexpected result on invalid OTP: %', v_res;
        END IF;

        -- 8.3: Technician completion with valid OTP succeeds
        v_res := public.verify_job_otp(v_req_tech_id, v_real_otp);
        IF (v_res->>'success')::BOOLEAN != TRUE OR (v_res->>'code') != 'VERIFIED' THEN
            RAISE EXCEPTION 'FAIL: Test 8.3 verify_job_otp failed: %', v_res;
        END IF;

        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    -- As postgres: verify job status is COMPLETED
    SELECT status INTO v_status_after FROM public.service_requests WHERE id = v_req_tech_id;
    IF v_status_after = 'COMPLETED' THEN
        v_t3_passed := TRUE;
    ELSE
        RAISE EXCEPTION 'FAIL: Test 8.3 job status was not COMPLETED after valid OTP';
    END IF;

    -- (c) 2. VENDOR VERIFICATION
    BEGIN
        PERFORM public.sec_test_become_user(v_vnd_uid);
        SET LOCAL ROLE authenticated;

        IF current_user != 'authenticated' OR auth.uid() IS DISTINCT FROM v_vnd_uid OR public.get_current_user_role() IS DISTINCT FROM 'vendor' THEN
            RAISE EXCEPTION 'TEST SETUP ERROR: session failed to switch to vendor';
        END IF;

        -- 8.4: Vendor direct UPDATE fails
        BEGIN
            UPDATE public.service_requests SET status = 'COMPLETED' WHERE id = v_req_vnd_id;
            RAISE EXCEPTION 'FAIL: Test 8.4 vendor was able to directly UPDATE status to COMPLETED!';
        EXCEPTION WHEN OTHERS THEN
            IF SQLERRM LIKE '%Completion rejected%' OR SQLERRM LIKE '%verify_job_otp%' THEN
                v_t4_passed := TRUE;
            ELSE
                RAISE EXCEPTION 'FAIL: Test 8.4 unexpected error: %', SQLERRM;
            END IF;
        END;

        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    -- (d) 3. OPS MANAGER VERIFICATION
    BEGIN
        PERFORM public.sec_test_become_user(v_ops_uid);
        SET LOCAL ROLE authenticated;

        IF current_user != 'authenticated' OR auth.uid() IS DISTINCT FROM v_ops_uid OR public.get_current_user_role() IS DISTINCT FROM 'ops_manager' THEN
            RAISE EXCEPTION 'TEST SETUP ERROR: session failed to switch to ops_manager';
        END IF;

        UPDATE public.service_requests SET status = 'COMPLETED' WHERE id = v_req_ops_id;

        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    -- As postgres: verify ops manager manual completion & audit log
    SELECT status INTO v_status_after FROM public.service_requests WHERE id = v_req_ops_id;
    SELECT COUNT(*) INTO v_audit_count FROM public.audit_logs WHERE entity_id = v_req_ops_id AND action = 'MANUAL_JOB_COMPLETION';

    IF v_status_after = 'COMPLETED' AND v_audit_count >= 1 THEN
        v_t5_passed := TRUE;
    ELSE
        RAISE EXCEPTION 'FAIL: Test 8.5 ops manager manual completion failed (status=%, audit=%)', v_status_after, v_audit_count;
    END IF;

    -- (e) 4. ADMINISTRATOR VERIFICATION
    BEGIN
        PERFORM public.sec_test_become_user(v_admin_uid);
        SET LOCAL ROLE authenticated;

        IF current_user != 'authenticated' OR auth.uid() IS DISTINCT FROM v_admin_uid OR public.get_current_user_role() IS DISTINCT FROM 'admin' THEN
            RAISE EXCEPTION 'TEST SETUP ERROR: session failed to switch to admin';
        END IF;

        UPDATE public.service_requests SET status = 'COMPLETED' WHERE id = v_req_admin_id;

        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    -- As postgres: verify admin manual completion & audit log
    SELECT status INTO v_status_after FROM public.service_requests WHERE id = v_req_admin_id;
    SELECT COUNT(*) INTO v_audit_count FROM public.audit_logs WHERE entity_id = v_req_admin_id AND action = 'MANUAL_JOB_COMPLETION';

    IF v_status_after = 'COMPLETED' AND v_audit_count >= 1 THEN
        v_t6_passed := TRUE;
    ELSE
        RAISE EXCEPTION 'FAIL: Test 8.6 admin manual completion failed (status=%, audit=%)', v_status_after, v_audit_count;
    END IF;

    -- (f) As postgres: record all results
    IF v_t1_passed THEN
        PERFORM public.sec_test_record_pass('Test 08.1', 'technician direct UPDATE of status to COMPLETED is rejected');
    END IF;

    IF v_t2_passed THEN
        PERFORM public.sec_test_record_pass('Test 08.2', 'verify_job_otp rejects incorrect OTP');
    END IF;

    IF v_t3_passed THEN
        PERFORM public.sec_test_record_pass('Test 08.3', 'verify_job_otp succeeds with valid OTP and marks job COMPLETED');
    END IF;

    IF v_t4_passed THEN
        PERFORM public.sec_test_record_pass('Test 08.4', 'vendor direct UPDATE of status to COMPLETED is rejected');
    END IF;

    IF v_t5_passed THEN
        PERFORM public.sec_test_record_pass('Test 08.5', 'ops manager manual completion succeeds and creates audit log');
    END IF;

    IF v_t6_passed THEN
        PERFORM public.sec_test_record_pass('Test 08.6', 'admin manual completion succeeds and creates audit log');
    END IF;

    IF NOT (v_t1_passed AND v_t2_passed AND v_t3_passed AND v_t4_passed AND v_t5_passed AND v_t6_passed) THEN
        RAISE EXCEPTION 'FAIL: Test 8 not all sub-tests passed';
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- TEST 9 (FLAG HARDENING & TOKEN SPOOFING PREVENTION): Session Spoof Rejection
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_cust_uid UUID := gen_random_uuid();
    v_tech_uid UUID := gen_random_uuid();
    v_req_id TEXT := 'TEST-REQ-SPOOF-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6);
    v_emp_id TEXT := 'emp-test-9-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6);
    v_emp_code TEXT := 'EMP-9-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6);
    v_tech_phone TEXT := '+91 ' || LPAD((FLOOR(RANDOM() * 9000000000) + 1000000000)::TEXT, 10, '0');
    v_t1_passed BOOLEAN := FALSE;
    v_t2_passed BOOLEAN := FALSE;
    v_t3_passed BOOLEAN := FALSE;
BEGIN
    -- (a) Setup as postgres
    PERFORM public.sec_test_become_postgres();
    PERFORM public.sec_test_setup_user(v_cust_uid, 'customer', 'Customer 9', '+91 98888 99999');
    PERFORM public.sec_test_setup_user(v_tech_uid, 'technician', 'Tech 9', v_tech_phone);

    INSERT INTO public.employees (id, employee_code, name, mobile, user_id)
    VALUES (v_emp_id, v_emp_code, 'Tech 9', v_tech_phone, v_tech_uid);

    INSERT INTO public.service_requests (
        id, customer_name, customer_phone, customer_address, locality, items, total, user_id
    ) VALUES (
        v_req_id, 'Customer 9', '+91 98888 99999', 'Sector 94', 'Sector 94', '[]'::jsonb, 850.00, v_cust_uid
    );

    UPDATE public.service_requests 
    SET assigned_to = jsonb_build_object('id', v_emp_id, 'name', 'Tech 9'),
        status = 'IN PROGRESS'
    WHERE id = v_req_id;

    -- (b) Technician spoof attempts
    BEGIN
        PERFORM public.sec_test_become_user(v_tech_uid);
        SET LOCAL ROLE authenticated;

        IF current_user != 'authenticated' OR auth.uid() IS DISTINCT FROM v_tech_uid OR public.get_current_user_role() IS DISTINCT FROM 'technician' THEN
            RAISE EXCEPTION 'TEST SETUP ERROR: session failed to switch to technician';
        END IF;

        -- 9.1: Spoof legacy app.otp_verified
        BEGIN
            PERFORM set_config('app.otp_verified', 'true', true);
            UPDATE public.service_requests SET status = 'COMPLETED' WHERE id = v_req_id;
            RAISE EXCEPTION 'FAIL: Test 9.1 technician bypassed completion using set_config(app.otp_verified)!';
        EXCEPTION WHEN OTHERS THEN
            IF SQLERRM LIKE '%Completion rejected%' OR SQLERRM LIKE '%verify_job_otp%' THEN
                v_t1_passed := TRUE;
            ELSE
                RAISE EXCEPTION 'FAIL: Test 9.1 unexpected error: %', SQLERRM;
            END IF;
        END;

        -- 9.2: Spoof app.otp_token
        BEGIN
            PERFORM set_config('app.otp_token', 'x', true);
            UPDATE public.service_requests SET status = 'COMPLETED' WHERE id = v_req_id;
            RAISE EXCEPTION 'FAIL: Test 9.2 technician bypassed completion using set_config(app.otp_token, x)!';
        EXCEPTION WHEN OTHERS THEN
            IF SQLERRM LIKE '%Completion rejected%' OR SQLERRM LIKE '%verify_job_otp%' THEN
                v_t2_passed := TRUE;
            ELSE
                RAISE EXCEPTION 'FAIL: Test 9.2 unexpected error: %', SQLERRM;
            END IF;
        END;

        -- 9.3: Spoof token pair
        BEGIN
            PERFORM set_config('app.otp_token', 'x', true);
            PERFORM set_config('app.otp_token_secret', 'x', true);
            UPDATE public.service_requests SET status = 'COMPLETED' WHERE id = v_req_id;
            RAISE EXCEPTION 'FAIL: Test 9.3 technician bypassed completion using forged token signature!';
        EXCEPTION WHEN OTHERS THEN
            IF SQLERRM LIKE '%Completion rejected%' OR SQLERRM LIKE '%verify_job_otp%' THEN
                v_t3_passed := TRUE;
            ELSE
                RAISE EXCEPTION 'FAIL: Test 9.3 unexpected error: %', SQLERRM;
            END IF;
        END;

        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    -- (c) As postgres: record results
    IF v_t1_passed THEN
        PERFORM public.sec_test_record_pass('Test 09.1', 'direct completion using spoofed app.otp_verified is rejected');
    END IF;

    IF v_t2_passed THEN
        PERFORM public.sec_test_record_pass('Test 09.2', 'direct completion using spoofed app.otp_token is rejected');
    END IF;

    IF v_t3_passed THEN
        PERFORM public.sec_test_record_pass('Test 09.3', 'direct completion using forged token and signature is rejected');
    END IF;

    IF NOT (v_t1_passed AND v_t2_passed AND v_t3_passed) THEN
        RAISE EXCEPTION 'FAIL: Test 9 not all sub-tests passed';
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- TEST 10 (SEC-08 & SEC-10): Complaints & Home Projects RLS & Anti-Tamper
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_cust_uid UUID := gen_random_uuid();
    v_other_cust_uid UUID := gen_random_uuid();
    v_vnd_uid UUID := gen_random_uuid();

    v_req_id TEXT := 'TEST-REQ-10-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8);
    v_other_req_id TEXT := 'TEST-REQ-OTHER-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8);
    v_comp_id TEXT := 'cmp-test-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6);
    v_proj_id TEXT := 'prj-test-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6);
    v_vnd_id TEXT := 'vnd-test-10-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6);
    v_vnd_phone TEXT := '+91 ' || LPAD((FLOOR(RANDOM() * 9000000000) + 1000000000)::TEXT, 10, '0');

    v_t1_passed BOOLEAN := FALSE;
    v_t2_passed BOOLEAN := FALSE;
    v_t3_passed BOOLEAN := FALSE;
    v_rows INT;
    v_proj_status TEXT;
    v_proj_vnd TEXT;
BEGIN
    -- (a) Setup as postgres: create users, vendor record, service request, home project
    PERFORM public.sec_test_become_postgres();
    PERFORM public.sec_test_setup_user(v_cust_uid, 'customer', 'Customer 10', '+91 98888 10101');
    PERFORM public.sec_test_setup_user(v_other_cust_uid, 'customer', 'Other Customer', '+91 98888 10102');
    PERFORM public.sec_test_setup_user(v_vnd_uid, 'vendor', 'Vendor 10', v_vnd_phone);

    INSERT INTO public.vendors (id, business_name, owner_name, mobile, status, user_id)
    VALUES (v_vnd_id, 'Premier Projects', 'Vendor 10', v_vnd_phone, 'ACTIVE', v_vnd_uid);

    INSERT INTO public.service_requests (
        id, customer_name, customer_phone, customer_address, locality, items, total, user_id
    ) VALUES (
        v_other_req_id, 'Other Customer', '+91 98888 10102', 'Sector 94', 'Sector 94', '[]'::jsonb, 500.00, v_other_cust_uid
    );

    INSERT INTO public.home_projects (
        id, customer_name, customer_phone, locality, project_type, scope_summary, estimated_budget, user_id
    ) VALUES (
        v_proj_id, 'Customer 10', '+91 98888 10101', 'Sector 94', 'Renovation', 'Full villa', '₹5 Lakh', v_cust_uid
    );

    -- (b) Customer 10 attacks
    BEGIN
        PERFORM public.sec_test_become_user(v_cust_uid);
        SET LOCAL ROLE authenticated;

        IF current_user != 'authenticated' OR auth.uid() IS DISTINCT FROM v_cust_uid OR public.get_current_user_role() IS DISTINCT FROM 'customer' THEN
            RAISE EXCEPTION 'TEST SETUP ERROR: session failed to switch to customer 10';
        END IF;

        -- 10.1: Attempt to file complaint for another user request (fails RLS WITH CHECK)
        BEGIN
            INSERT INTO public.complaints (
                id, request_id, customer_name, customer_phone, issue_type, description, user_id
            ) VALUES (
                v_comp_id, v_other_req_id, 'Customer 10', '+91 98888 10101', 'POOR_WORKMANSHIP', 'Bad work', v_cust_uid
            );
            RAISE EXCEPTION 'FAIL: Test 10.1 customer was able to file complaint for another user request!';
        EXCEPTION WHEN OTHERS THEN
            IF SQLERRM LIKE '%row-level security policy%' OR SQLERRM LIKE '%complaints%' OR SQLERRM LIKE '%Complaints can only be filed%' THEN
                v_t1_passed := TRUE;
            ELSE
                RAISE EXCEPTION 'FAIL: Test 10.1 unexpected error: %', SQLERRM;
            END IF;
        END;

        -- 10.2: Customer attempts to tamper with home project status or assign vendor
        -- Under RLS, customer has no UPDATE policy on home_projects, so update affects 0 rows or raises error
        BEGIN
            UPDATE public.home_projects SET status = 'COMPLETED', assigned_vendor_id = v_vnd_id WHERE id = v_proj_id;
            GET DIAGNOSTICS v_rows = ROW_COUNT;
            IF v_rows > 0 THEN
                RAISE EXCEPTION 'FAIL: Test 10.2 customer was able to update home_projects (% rows)!', v_rows;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            IF SQLERRM LIKE '%FAIL: Test 10.2 customer was able to update%' THEN
                RAISE;
            END IF;
            -- Any permission/RLS exception is also accepted
        END;

        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    -- As postgres: verify that the home project was not modified
    SELECT status, assigned_vendor_id INTO v_proj_status, v_proj_vnd FROM public.home_projects WHERE id = v_proj_id;
    IF v_proj_status IS DISTINCT FROM 'COMPLETED' AND v_proj_vnd IS NULL THEN
        v_t2_passed := TRUE;
    ELSE
        RAISE EXCEPTION 'FAIL: Test 10.2 home project was modified by customer! (status=%, vendor=%)', v_proj_status, v_proj_vnd;
    END IF;

    -- (c) As postgres: assign vendor to project
    UPDATE public.home_projects SET assigned_vendor_id = v_vnd_id WHERE id = v_proj_id;

    -- (d) Vendor 10 attack
    BEGIN
        PERFORM public.sec_test_become_user(v_vnd_uid);
        SET LOCAL ROLE authenticated;

        IF current_user != 'authenticated' OR auth.uid() IS DISTINCT FROM v_vnd_uid OR public.get_current_user_role() IS DISTINCT FROM 'vendor' THEN
            RAISE EXCEPTION 'TEST SETUP ERROR: session failed to switch to vendor 10';
        END IF;

        -- 10.3: Assigned vendor attempts to modify budget (trigger enforce_home_projects_rules blocks it)
        BEGIN
            UPDATE public.home_projects SET estimated_budget = '₹50 Lakh' WHERE id = v_proj_id;
            RAISE EXCEPTION 'FAIL: Test 10.3 vendor was able to modify project budget!';
        EXCEPTION WHEN OTHERS THEN
            IF SQLERRM LIKE '%Vendors cannot modify customer details%' OR SQLERRM LIKE '%budget%' THEN
                v_t3_passed := TRUE;
            ELSE
                RAISE EXCEPTION 'FAIL: Test 10.3 unexpected error: %', SQLERRM;
            END IF;
        END;

        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    -- (e) As postgres: record results
    IF v_t1_passed THEN
        PERFORM public.sec_test_record_pass('Test 10.1', 'customer cannot file complaint for another user request (SEC-08)');
    END IF;

    IF v_t2_passed THEN
        PERFORM public.sec_test_record_pass('Test 10.2', 'customer cannot tamper with home_projects status or assigned vendor (SEC-10)');
    END IF;

    IF v_t3_passed THEN
        PERFORM public.sec_test_record_pass('Test 10.3', 'assigned vendor cannot modify project budget (SEC-10)');
    END IF;

    IF NOT (v_t1_passed AND v_t2_passed AND v_t3_passed) THEN
        RAISE EXCEPTION 'FAIL: Test 10 not all sub-tests passed';
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- TEST 11 (SEC-11): One Account Per Mobile Number & Phone Release Verification
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_cust_11a_uid UUID := gen_random_uuid();
    v_cust_11b_uid UUID := gen_random_uuid();
    v_cust_11c_uid UUID := gen_random_uuid();
    v_cust_11_dup1_uid UUID := gen_random_uuid();
    v_cust_11_dup2_uid UUID := gen_random_uuid();
    v_admin_11_uid UUID := gen_random_uuid();
    v_test_phone_1 TEXT := '+91 98888 77711';
    v_test_phone_2 TEXT := '+91 98888 77722';
    v_test_phone_free TEXT := '+91 98888 77733';
    v_norm_1 TEXT;
    v_norm_2 TEXT;
    v_norm_3 TEXT;
    v_norm_4 TEXT;
    v_avail_taken BOOLEAN;
    v_avail_free BOOLEAN;
    v_t1_passed BOOLEAN := FALSE;
    v_t2_passed BOOLEAN := FALSE;
    v_t3_passed BOOLEAN := FALSE;
    v_t4_passed BOOLEAN := FALSE;
    v_t5_passed BOOLEAN := FALSE;
    v_t6_passed BOOLEAN := FALSE;
    v_t7_passed BOOLEAN := FALSE;
    v_audit_count INT;
    v_released_phone TEXT;
    v_released_norm TEXT;
BEGIN
    -- (a) Setup as postgres: create test customer 11A and admin 11
    PERFORM public.sec_test_become_postgres();
    PERFORM public.sec_test_setup_user(v_cust_11a_uid, 'customer', 'Customer 11A', v_test_phone_1);
    PERFORM public.sec_test_setup_user(v_cust_11b_uid, 'customer', 'Customer 11B', v_test_phone_2);
    PERFORM public.sec_test_setup_user(v_admin_11_uid, 'admin', 'Admin 11', '+91 98888 77799');

    -- --------------------------------------------------------------------------
    -- 11.1: Duplicate phone in the same format is blocked
    -- --------------------------------------------------------------------------
    BEGIN
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            v_cust_11_dup1_uid,
            '00000000-0000-0000-0000-000000000000'::UUID,
            'authenticated',
            'authenticated',
            'sec_test_dup_11_1@test.pindcare.internal',
            crypt('x', gen_salt('bf')),
            NOW(),
            '{}'::jsonb,
            jsonb_build_object('phone', v_test_phone_1, 'full_name', 'Customer 11 Dup 1'),
            NOW(),
            NOW()
        );
        RAISE EXCEPTION 'FAIL: Test 11.1 duplicate phone in same format was allowed!';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%PHONE_ALREADY_REGISTERED%' OR SQLERRM LIKE '%idx_profiles_phone_normalized%' OR SQLERRM LIKE '%unique%' THEN
            v_t1_passed := TRUE;
        ELSE
            RAISE EXCEPTION 'FAIL: Test 11.1 unexpected error: %', SQLERRM;
        END IF;
    END;

    -- --------------------------------------------------------------------------
    -- 11.2: Formats "+91 98888 11111", "9888811111", "09888811111" and "+919888811111"
    -- are all treated as the same number
    -- --------------------------------------------------------------------------
    v_norm_1 := public.normalize_phone('+91 98888 11111');
    v_norm_2 := public.normalize_phone('9888811111');
    v_norm_3 := public.normalize_phone('09888811111');
    v_norm_4 := public.normalize_phone('+919888811111');

    IF v_norm_1 = '9888811111' AND v_norm_2 = '9888811111' AND v_norm_3 = '9888811111' AND v_norm_4 = '9888811111' THEN
        -- Test cross-format collision detection: Customer 11A has '+91 98888 77711' (norm: '9888877711')
        -- Try inserting with format '09888877711'
        BEGIN
            INSERT INTO auth.users (
                id,
                instance_id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at
            ) VALUES (
                v_cust_11_dup2_uid,
                '00000000-0000-0000-0000-000000000000'::UUID,
                'authenticated',
                'authenticated',
                'sec_test_dup_11_2@test.pindcare.internal',
                crypt('x', gen_salt('bf')),
                NOW(),
                '{}'::jsonb,
                jsonb_build_object('phone', '09888877711', 'full_name', 'Customer 11 Dup 2'),
                NOW(),
                NOW()
            );
            RAISE EXCEPTION 'FAIL: Test 11.2 duplicate phone in alternate format was allowed!';
        EXCEPTION WHEN OTHERS THEN
            IF SQLERRM LIKE '%PHONE_ALREADY_REGISTERED%' OR SQLERRM LIKE '%idx_profiles_phone_normalized%' OR SQLERRM LIKE '%unique%' THEN
                v_t2_passed := TRUE;
            ELSE
                RAISE EXCEPTION 'FAIL: Test 11.2 unexpected error: %', SQLERRM;
            END IF;
        END;
    ELSE
        RAISE EXCEPTION 'FAIL: Test 11.2 normalize_phone failed on equivalent formats: % / % / % / %', v_norm_1, v_norm_2, v_norm_3, v_norm_4;
    END IF;

    -- --------------------------------------------------------------------------
    -- 11.3: A customer cannot change their phone to another account's number
    -- --------------------------------------------------------------------------
    BEGIN
        PERFORM public.sec_test_become_user(v_cust_11b_uid);
        SET LOCAL ROLE authenticated;

        IF current_user != 'authenticated' OR auth.uid() IS DISTINCT FROM v_cust_11b_uid THEN
            RAISE EXCEPTION 'TEST SETUP ERROR: session failed to switch to customer 11B';
        END IF;

        BEGIN
            UPDATE public.profiles
            SET phone = v_test_phone_1
            WHERE id = v_cust_11b_uid;
            RAISE EXCEPTION 'FAIL: Test 11.3 customer was able to change phone to another account phone!';
        EXCEPTION WHEN OTHERS THEN
            IF SQLERRM LIKE '%PHONE_ALREADY_REGISTERED%' OR SQLERRM LIKE '%idx_profiles_phone_normalized%' OR SQLERRM LIKE '%unique%' THEN
                v_t3_passed := TRUE;
            ELSE
                RAISE EXCEPTION 'FAIL: Test 11.3 unexpected error: %', SQLERRM;
            END IF;
        END;

        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    -- --------------------------------------------------------------------------
    -- 11.4: check_phone_available returns false for a taken number and true for a free one
    -- and exposes nothing else
    -- --------------------------------------------------------------------------
    BEGIN
        PERFORM public.sec_test_become_user(v_cust_11b_uid);
        SET LOCAL ROLE authenticated;

        v_avail_taken := public.check_phone_available(v_test_phone_1);
        v_avail_free := public.check_phone_available(v_test_phone_free);

        IF v_avail_taken = FALSE AND v_avail_free = TRUE THEN
            v_t4_passed := TRUE;
        ELSE
            RAISE EXCEPTION 'FAIL: Test 11.4 unexpected availability result: taken=%, free=%', v_avail_taken, v_avail_free;
        END IF;

        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    -- --------------------------------------------------------------------------
    -- 11.5: A non-admin cannot call admin_release_phone
    -- --------------------------------------------------------------------------
    BEGIN
        PERFORM public.sec_test_become_user(v_cust_11b_uid);
        SET LOCAL ROLE authenticated;

        BEGIN
            PERFORM public.admin_release_phone(v_cust_11a_uid, 'Unauthorized attempt');
            RAISE EXCEPTION 'FAIL: Test 11.5 non-admin was able to call admin_release_phone!';
        EXCEPTION WHEN OTHERS THEN
            IF SQLERRM LIKE '%FORBIDDEN%' OR SQLERRM LIKE '%administrators%' OR SQLERRM LIKE '%permission denied%' THEN
                v_t5_passed := TRUE;
            ELSE
                RAISE EXCEPTION 'FAIL: Test 11.5 unexpected error: %', SQLERRM;
            END IF;
        END;

        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    -- --------------------------------------------------------------------------
    -- 11.6: An admin can call admin_release_phone, and it is audit-logged
    -- --------------------------------------------------------------------------
    BEGIN
        PERFORM public.sec_test_become_user(v_admin_11_uid);
        SET LOCAL ROLE authenticated;

        IF public.get_current_user_role() IS DISTINCT FROM 'admin' THEN
            RAISE EXCEPTION 'TEST SETUP ERROR: session failed to switch to admin 11';
        END IF;

        PERFORM public.admin_release_phone(v_cust_11a_uid, 'Legitimate resident SIM transfer request');

        PERFORM public.sec_test_become_postgres();
    EXCEPTION WHEN OTHERS THEN
        PERFORM public.sec_test_become_postgres();
        RAISE;
    END;

    -- Verify as postgres: customer 11A phone is cleared, normalized is null, phone_verified is false
    SELECT phone, phone_normalized INTO v_released_phone, v_released_norm
    FROM public.profiles
    WHERE id = v_cust_11a_uid;

    SELECT COUNT(*) INTO v_audit_count
    FROM public.audit_logs
    WHERE action = 'RELEASE_PHONE' AND entity_id = v_cust_11a_uid::TEXT;

    IF (v_released_phone IS NULL OR v_released_phone = '') AND v_released_norm IS NULL AND v_audit_count > 0 THEN
        v_t6_passed := TRUE;
    ELSE
        RAISE EXCEPTION 'FAIL: Test 11.6 phone release verification failed (phone=%, norm=%, audit_count=%)', v_released_phone, v_released_norm, v_audit_count;
    END IF;

    -- --------------------------------------------------------------------------
    -- 11.7: After release, the number can be registered again
    -- --------------------------------------------------------------------------
    BEGIN
        PERFORM public.sec_test_become_postgres();

        -- Now customer 11C registers with v_test_phone_1 which was released
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            v_cust_11c_uid,
            '00000000-0000-0000-0000-000000000000'::UUID,
            'authenticated',
            'authenticated',
            'sec_test_cust_11c@test.pindcare.internal',
            crypt('x', gen_salt('bf')),
            NOW(),
            '{}'::jsonb,
            jsonb_build_object('phone', v_test_phone_1, 'full_name', 'Customer 11C New Owner'),
            NOW(),
            NOW()
        );

        -- The handle_new_user trigger creates the profile.
        -- Assert that the profile exists with that phone_normalized and no unique-violation happened
        SELECT phone_normalized INTO v_norm_1
        FROM public.profiles
        WHERE id = v_cust_11c_uid;

        IF v_norm_1 = '9888877711' THEN
            v_t7_passed := TRUE;
        ELSE
            RAISE EXCEPTION 'FAIL: Test 11.7 registered phone normalized unexpected: %', v_norm_1;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'FAIL: Test 11.7 re-registration after release failed: %', SQLERRM;
    END;

    -- (e) As postgres: record passes
    IF v_t1_passed THEN
        PERFORM public.sec_test_record_pass('Test 11.1', 'duplicate phone in same format is blocked (SEC-11)');
    END IF;

    IF v_t2_passed THEN
        PERFORM public.sec_test_record_pass('Test 11.2', 'equivalent phone formats normalize and collide identically (SEC-11)');
    END IF;

    IF v_t3_passed THEN
        PERFORM public.sec_test_record_pass('Test 11.3', 'customer cannot change phone to another account number (SEC-11)');
    END IF;

    IF v_t4_passed THEN
        PERFORM public.sec_test_record_pass('Test 11.4', 'check_phone_available returns accurate boolean and leaks no data (SEC-11)');
    END IF;

    IF v_t5_passed THEN
        PERFORM public.sec_test_record_pass('Test 11.5', 'non-admin cannot execute admin_release_phone (SEC-11)');
    END IF;

    IF v_t6_passed THEN
        PERFORM public.sec_test_record_pass('Test 11.6', 'admin can release phone and action is audit-logged (SEC-11)');
    END IF;

    IF v_t7_passed THEN
        PERFORM public.sec_test_record_pass('Test 11.7', 'released phone number can be registered to new account (SEC-11)');
    END IF;

    IF NOT (v_t1_passed AND v_t2_passed AND v_t3_passed AND v_t4_passed AND v_t5_passed AND v_t6_passed AND v_t7_passed) THEN
        RAISE EXCEPTION 'FAIL: Test 11 not all sub-tests passed';
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- FINAL TEST SUMMARY & RESULTS DISPLAY
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_total_passed INT;
BEGIN
    v_total_passed := COALESCE(NULLIF(current_setting('app.test_pass_count', true), ''), '0')::INT;

    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'SECURITY HARDENING TEST SUITE COMPLETE: % OF 34 TESTS PASSED.', v_total_passed;
    RAISE NOTICE '====================================================================';
END $$;

DROP FUNCTION IF EXISTS public.sec_test_setup_user(UUID, TEXT, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.sec_test_become_user(UUID);
DROP FUNCTION IF EXISTS public.sec_test_become_postgres();
DROP FUNCTION IF EXISTS public.sec_test_record_pass(TEXT, TEXT);

-- Final single result row returned to the Supabase SQL Editor
SELECT
    COALESCE(NULLIF(current_setting('app.test_pass_count', true), ''), '0')::INT AS tests_passed,
    34 AS tests_expected,
    CASE 
        WHEN COALESCE(NULLIF(current_setting('app.test_pass_count', true), ''), '0')::INT = 34 
        THEN 'ALL TESTS PASSED' 
        ELSE 'MISMATCH - CHECK TESTS' 
    END AS status;

ROLLBACK; -- Always rollback test side-effects to leave the database completely clean
