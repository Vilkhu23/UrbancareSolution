# Supabase & PostgreSQL Security Setup Guide
> Production Setup, Role-Based Access Control (RLS), and Hardening for UrbanCare Solution.

---

## ⚠️ Important Deployment Instruction

**DO NOT run migrations automatically from automated scripts against your live database.**
The SQL migrations in this repository are formatted and ordered for manual application by the database owner. Apply them sequentially using the **Supabase Dashboard SQL Editor** or via the **Supabase CLI**.

---

## 1. Migration Execution Order

Execute the following migration scripts sequentially:

### Step 1: Core Profiles, Schema Extensions & Triggers
File: [`supabase/migrations/20261013000001_create_profiles_and_auth_trigger.sql`](supabase/migrations/20261013000001_create_profiles_and_auth_trigger.sql)

**What this executes**:
1. Creates the `public.profiles` table with roles: `'customer'`, `'technician'`, `'vendor'`, `'ops_manager'`, `'admin'`.
2. Adds `user_id UUID REFERENCES public.profiles(id)` foreign keys to:
   - `public.customers`
   - `public.service_requests`
   - `public.payments`
   - `public.complaints`
   - `public.employees`
   - `public.vendors`
   - `public.home_projects`
3. Creates security helper `get_current_user_role()` defined with `SECURITY DEFINER` and `SET search_path = public`.
4. Creates trigger `prevent_profile_privilege_escalation()` on `public.profiles` blocking non-admin modifications to `role`, `phone_verified`, or `must_change_password`.
5. Creates trigger `handle_new_user()` on `auth.users` which guarantees that every public registration receives `role = 'customer'` and `phone_verified = false`, strictly ignoring any client-submitted metadata roles.

### Step 2: Role-Based Row Level Security (RLS) Policies
File: [`supabase/migrations/20261013000002_role_based_rls_policies.sql`](supabase/migrations/20261013000002_role_based_rls_policies.sql)

**What this executes**:
1. Enables Row Level Security on all 13 application tables.
2. Drops all legacy insecure open `USING (true)` policies.
3. Establishes strict isolation:
   - **Customers**: Can only read/insert/update rows where `user_id = auth.uid()`. Does not match on unverified phone numbers or client identifiers.
   - **Technicians**: Can only read/update bookings assigned to their employee record (`assigned_to->>'id' IN (SELECT id FROM employees WHERE user_id = auth.uid())`).
   - **Vendors**: Can only read/update bookings assigned to their vendor record (`assigned_to->>'id' IN (SELECT id FROM vendors WHERE user_id = auth.uid())`).
   - **Public**: Read-only access to `service_categories` and `services` catalog.
   - **Operations & Admin**: Full unrestricted operational dispatch and administrative access.

### Step 3: Security Hardening & Integrity Triggers (SEC-01 to SEC-11)
File: [`supabase/migrations/20261013000003_security_hardening.sql`](supabase/migrations/20261013000003_security_hardening.sql)

**What this executes**:
1. **SEC-05 Isolated Secrets & OTP Verification**: Creates `public.service_request_secrets` table (RLS: customer reads own; staff has zero direct access). Creates atomic, rate-limited RPC function `verify_job_otp(p_request_id, p_otp)` (max 5 attempts before lock).
2. **SEC-01 `service_requests` Integrity Triggers**:
   - `BEFORE INSERT`: Forces `status = 'NEW'`, `payment_status = 'PENDING'`, `assigned_to = NULL`, and auto-generates OTP into secrets table.
   - `BEFORE UPDATE (Customer)`: Allows updating only preferred date/slot, address, locality, and cancelling when status is `NEW`. Blocks tampering with total, subtotal, tax, payment status, assignment, or OTP.
   - `BEFORE UPDATE (Staff)`: Allows updating only execution fields (`status`, `technician_notes`, photos, times). Blocks tampering with billing totals, assignment, customer address, or OTP.
3. **SEC-02 Payment Hardening**: Removes direct client `INSERT` privilege on `payments`. Creates atomic RPC `record_payment(p_request_id, p_amount, p_method)` verifying exact total match, assignment authorization, and single payment rule.
4. **SEC-03 Vendor Protection**: `BEFORE UPDATE` trigger on `vendors` blocking non-admins from altering `status`, `rating`, `plan`, `mobile`, or `user_id`.
5. **SEC-06 Customer Protection**: `BEFORE UPDATE` trigger on `customers` blocking non-admins from altering `status`, `total_bookings`, `total_spent`, or `user_id`. Automatically resets `phone_verified = false` on phone update.
6. **SEC-07 Self-Service Password Reset Fix**: Updates `prevent_profile_privilege_escalation` to allow users to transition `must_change_password` from `true` to `false` on initial login.
7. **SEC-08 Grievance Restraint**: Updates `complaints` INSERT policy to require `user_id = auth.uid()`, `status = 'OPEN'`, `resolution_notes IS NULL`, and verified ownership of `request_id`.
8. **SEC-10 Turnkey Project Vendor Access**: Enables vendor `SELECT` and `UPDATE` on assigned `home_projects` rows while preventing alteration of budget or customer details.

### Step 4: OTP Completion Exclusivity & Audit Override (SEC-05 Extension)
File: [`supabase/migrations/20261013000004_otp_enforcement.sql`](supabase/migrations/20261013000004_otp_enforcement.sql)

**What this executes**:
1. **Exclusive verify_job_otp Completion**: Sets transaction-local flag `app.otp_verified = 'true'` inside `verify_job_otp()`.
2. **Trigger Enforcement**: Updates `trigger_enforce_service_requests_rules` to block any direct non-admin `UPDATE` to `COMPLETED` unless `app.otp_verified` was set by `verify_job_otp()`.
3. **Audit Logging of Admin Overrides**: Permits Administrators and Operations Managers to complete requests manually without OTP, and automatically logs each manual override into `public.audit_logs` (`action = 'MANUAL_JOB_COMPLETION'`).

### Step 5: Cryptographic Token Pair Hardening & Payment In-Progress Validation
File: [`supabase/migrations/20261013000005_otp_flag_hardening.sql`](supabase/migrations/20261013000005_otp_flag_hardening.sql)

**What this executes**:
1. **Cryptographic Token Verification**: Replaces static boolean flags with random UUID token (`app.otp_token`) and salted HMAC signature (`app.otp_token_secret`), preventing client spoofing.
2. **Preservation of `set_config`**: Maintains PostgREST internal connection pooling while enforcing verify_job_otp exclusivity inside the database trigger.
3. **Payment State Validation**: Hardens `record_payment()` to strictly require service requests to be in `IN PROGRESS` or `COMPLETED` state.

### Step 6: Foreign Key Resolution for OTP Secret Generation
File: [`supabase/migrations/20261013000006_fix_secret_creation.sql`](supabase/migrations/20261013000006_fix_secret_creation.sql)

**What this executes**:
1. **AFTER INSERT Trigger on `service_requests`**: Resolves foreign key constraint violation (`service_request_secrets_request_id_fkey`) by moving secret generation from the `BEFORE INSERT` trigger into a dedicated `AFTER INSERT` trigger (`trigger_generate_service_request_secret`).
2. **Server-Side OTP Generation**: Generates cryptographically random 4-digit OTP and 6-character completion codes and securely inserts them into `public.service_request_secrets` once the parent `service_requests` row exists.
3. **Immutability Enforcement**: Retains all `BEFORE INSERT` tamper resistance in `enforce_service_requests_rules()` (forcing status `'NEW'`, payment status `'PENDING'`, assigned_to `NULL`, and nullifying legacy in-table OTP columns).
4. **Historical Backfill**: Automatically provisions secrets for any pre-existing service requests lacking entries.

### Step 7: Revoke Unneeded Grants & Public Hardening
File: [`supabase/migrations/20261013000007_revoke_unneeded_grants.sql`](supabase/migrations/20261013000007_revoke_unneeded_grants.sql)

**What this executes**:
1. **Secrets Lockdown**: Revokes all privileges on `public.service_request_secrets` from `anon`, and revokes `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER` from `authenticated` (retaining `SELECT` only).
2. **DDL/Destructive Permission Revocation**: Revokes `TRUNCATE`, `REFERENCES`, and `TRIGGER` across all public tables from `anon` and `authenticated`.
3. **Public Anon Lockdown**: Strips all data and mutation privileges from `anon` on all private and operational tables, preserving read-only access (`SELECT`) only on public catalog tables (`services`, `service_categories`, and `ops_settings`).
4. **Authenticated Reaffirmation**: Reaffirms legitimate `SELECT, INSERT, UPDATE, DELETE` permissions for `authenticated` users across active operational tables (governed by strict RLS policies).

### Step 8: Persistent OTP Lockout & Operations Unlock (SEC-05 Hardening)
File: [`supabase/migrations/20261013000008_fix_otp_lockout.sql`](supabase/migrations/20261013000008_fix_otp_lockout.sql)

**What this executes**:
1. **Non-Throwing verify_job_otp()**: Returns structured JSON result (`{ success: false, code: 'INVALID_OTP' | 'LOCKED' }`) instead of aborting the transaction with an exception, ensuring failed attempt counters and timestamps are committed and persisted.
2. **Row Locking (FOR UPDATE)**: Serializes concurrent verification requests on `service_request_secrets` to prevent parallel brute-force race conditions.
3. **Hard Lockout Enforcement**: Persistently rejects all further verification attempts (including the correct OTP) once `failed_attempts >= 5`.
4. **Operations Unlock RPC (`reset_job_otp_lock`)**: Allows Operations Managers and Administrators to unlock locked bookings, resetting `failed_attempts = 0` and recording an audit trail in `public.audit_logs`.

### Step 9: One Account Per Mobile Number & Phone Release Management
File: [`supabase/migrations/20261013000009_unique_phone.sql`](supabase/migrations/20261013000009_unique_phone.sql)

**What this executes**:
1. **Canonical Phone Normalization (`normalize_phone(text)`)**: Normalizes Indian phone numbers across multiple formats (`+91 98888 11111`, `9888811111`, `09888811111`, `+919888811111`) to a canonical 10-digit national number starting with digits 6–9 (or returns `NULL` for invalid numbers).
2. **Normalized Phone Storage (`phone_normalized`) & Duplicate Detection**:
   - Adds `phone_normalized` column to `public.profiles`.
   - Runs a safety check that scans existing data and raises an informative exception listing any pre-existing duplicates before index creation.
   - Creates a partial UNIQUE index `idx_profiles_phone_normalized` on `profiles(phone_normalized)` ignoring NULLs.
   - Synchronizes `phone_normalized` automatically via trigger `sync_profile_phone_normalized` on `BEFORE INSERT OR UPDATE OF phone`.
3. **Signup Collision Defense (`handle_new_user`)**:
   - Computes `normalize_phone` on user metadata during signup.
   - Rejects duplicate mobile numbers during `auth.users` insertion with clear error: `'PHONE_ALREADY_REGISTERED: This mobile number is already associated with another account'`.
4. **Availability Verification RPC (`check_phone_available`)**:
   - Provides a `SECURITY DEFINER` function with `search_path = public` accessible by `anon` and `authenticated`.
   - Returns ONLY `true` (available) or `false` (taken/invalid) without exposing any personal data or emails.
   - Implements IP-hash based rate limiting (maximum 10 checks per minute per caller).
5. **Customer Update Guard**:
   - Resets `phone_verified = false` whenever a non-admin user updates their mobile number.
   - Aborts customer profile updates if the target number is already owned by another account.
6. **Admin-Only Phone Release RPC (`admin_release_phone`)**:
   - Enables verified administrators to release a customer's phone number (`phone = ''`, `phone_normalized = NULL`, `phone_verified = false`) with a mandatory audit reason.
   - Automatically writes an immutable audit record to `public.audit_logs` (`action = 'RELEASE_PHONE'`).

### Step 10: Explicit Grants & Future-Proof Privilege Hardening
File: [`supabase/migrations/20261013000010_explicit_grants.sql`](supabase/migrations/20261013000010_explicit_grants.sql)

**What this executes**:
1. **Supabase October 30 Breaking Change Defense**: Establishes explicit Data API grants on all 15 public tables, ensuring that fresh production databases, local `supabase db reset`, and preview branches never fail with PostgREST permission denied (42501).
2. **RLS Verification**: Runs `ENABLE ROW LEVEL SECURITY` on every public table to ensure zero unprotected surfaces.
3. **Least-Privilege Matrix**:
   - **`anon`**: Strict `SELECT` only on public catalog tables (`services`, `service_categories`, `ops_settings`). Zero access to business tables.
   - **`authenticated`**: Minimal operational access (`SELECT, INSERT, UPDATE` on bookings, customer records, complaints; `SELECT` on `service_request_secrets` and `payments`). Strips `DELETE` on core records and strips `TRUNCATE, REFERENCES, TRIGGER` globally.
   - **`service_role`**: Explicit `ALL` on all tables, sequences, and routines.
4. **Function Execution Hardening**: Revokes `EXECUTE` on all public routines from `PUBLIC`, `anon`, and `authenticated`, then selectively grants execute only on designated RPCs (`check_phone_available` to anon/authenticated; operational RPCs to authenticated).
5. **Closed Default Privileges (`ALTER DEFAULT PRIVILEGES`)**: Sets default privileges in `public` to revoke all access from `anon` and `authenticated` on future tables, sequences, and functions.

### Step 11: Employee Email & Staff Provisioning Grants
File: [`supabase/migrations/20261013000011_add_employee_email_and_staff_provisioning_grants.sql`](supabase/migrations/20261013000011_add_employee_email_and_staff_provisioning_grants.sql)

**What this executes**:
1. Adds `email TEXT` column and unique index to `public.employees` so technician accounts can be reliably queried and linked by email address.
2. Reaffirms explicit Data API grants (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) on `employees` and `vendors` for `authenticated` roles.

### Step 12: Trim Staff Grants (Block Client Deletion)
File: [`supabase/migrations/20261013000012_trim_staff_grants.sql`](supabase/migrations/20261013000012_trim_staff_grants.sql)

**What this executes**:
1. Revokes `DELETE` on `public.employees` and `public.vendors` from `authenticated`. Staff deletion must be performed by soft-deactivating records (`status = 'INACTIVE'`) or through administrative database operations.

### Step 13: Staff Phone Uniqueness & Self-Collision Defense
File: [`supabase/migrations/20261013000013_fix_staff_phone.sql`](supabase/migrations/20261013000013_fix_staff_phone.sql)

**What this executes**:
1. Normalizes phone numbers during profile insert/update and ensures self-updates (`id = NEW.id`) do not trigger false-positive duplicate errors.
2. Handles metadata phone assignment gracefully during staff provisioning.

### Step 14: Customer Completion OTP Access & Self-Healing
File: [`supabase/migrations/20261013000014_fix_customer_otp_access.sql`](supabase/migrations/20261013000014_fix_customer_otp_access.sql)

**What this executes**:
1. Updates `service_request_secrets` RLS policy to allow authenticated residents to read their completion OTP by matching either `user_id` or normalized `customer_phone`.
2. Creates `get_customer_job_otp(p_request_id)` RPC function that securely returns the customer OTP while blocking technicians and vendors from querying it remotely.
3. Automatically self-heals and generates missing secrets for pre-existing bookings (e.g. `PB-5295`, `PB-8699`).
4. Links unlinked `service_requests.user_id` and `service_request_secrets.user_id` to profiles matching the customer phone number.

---

## 🔒 Mandatory Rule for Every Future Migration

**Any `CREATE TABLE` or `CREATE FUNCTION` in `public` must, in the same migration file, enable RLS and include explicit `GRANT` statements.**

Because default privileges are closed, any new table created without explicit grants will be unreachable via the Supabase Data API (`supabase-js`).

### Template for Future Table Migrations:
```sql
-- 1. Create table
CREATE TABLE public.your_new_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable RLS immediately
ALTER TABLE public.your_new_table ENABLE ROW LEVEL SECURITY;

-- 3. Define RLS policies
CREATE POLICY "Users access own rows"
ON public.your_new_table
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. Explicit Data API Grants
-- If unauthenticated public visitors need read access:
-- GRANT SELECT ON public.your_new_table TO anon;

-- Authenticated application users (access governed by RLS):
GRANT SELECT, INSERT, UPDATE, DELETE ON public.your_new_table TO authenticated;

-- Service role (admin scripts, edge functions, migrations):
GRANT ALL ON public.your_new_table TO service_role;
```

---

## 2. Bootstrapping Your First Administrator

Since public signup is permanently restricted to `customer` roles, create your initial administrator account through one of these methods:

### Method A: Via Supabase SQL Editor (Recommended)
Run the following SQL snippet in the Supabase SQL Editor:

```sql
-- 1. Create the user in auth.users (or sign up normally via UI then run step 2)
-- Replace with your real administrator credentials:
INSERT INTO auth.users (
    instance_id,
    id,
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
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@urbancaresolution.in',
    crypt('SetYourStrongAdminPassword2026!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Operations Administrator","phone":"+91 98889 00122"}',
    NOW(),
    NOW()
);

-- 2. Elevate the provisioned profile to 'admin'
UPDATE public.profiles
SET role = 'admin',
    must_change_password = false
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@urbancaresolution.in');
```

### Method B: Promote an Existing User
If you have already signed up with an email through the UI:
```sql
UPDATE public.profiles
SET role = 'admin',
    must_change_password = false
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@domain.com');
```

---

## 3. Deploying the Staff Provisioning Edge Function

Staff accounts (Technicians, Vendors, and Operations Managers) are provisioned via a server-side Supabase Edge Function that uses the `SUPABASE_SERVICE_ROLE_KEY` safely on the server.

### Edge Function Code
Location: [`supabase/functions/create-staff-user/index.ts`](supabase/functions/create-staff-user/index.ts)

### Deploy Command:
```bash
# Login to Supabase CLI if not logged in
supabase login

# Link your project
supabase link --project-ref your-project-id

# Set secrets for the Edge Function
supabase secrets set SUPABASE_URL="https://your-project.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
supabase secrets set ALLOWED_ORIGIN="https://urbancaresolution.in"

# Deploy the function
supabase functions deploy create-staff-user
```

**Security Controls in `create-staff-user` (SEC-04, SEC-09, SEC-11)**:
- **JWT & Role Authentication**: Validates the caller's JWT token and directly queries `public.profiles` for live role status.
- **Strict Role Hierarchy**: Only `admin` can create `admin` or `ops_manager` accounts; `ops_manager` can create `technician` and `vendor` accounts only.
- **Entity Hijack Prevention (SEC-04)**: When linking an `entityId` (`employees` or `vendors`), strictly verifies the entity exists and `user_id IS NULL`. If already assigned or missing, rolls back by deleting the auth user and returns an error.
- **Password Policy Enforced (SEC-09)**: Validates temporary passwords against the blocked-password list and complexity rules (min 8 chars, numbers/symbols). Returns a generated temporary password once in the response; **never logs** passwords.
- **CORS & Error Sanitization (SEC-11)**: Restricts CORS headers to `ALLOWED_ORIGIN`. Returns sanitized, generic error messages to the client while logging details server-side only.

---

## 4. Automated Security Test Suite

Run the SQL verification script in your local/staging Supabase environment to verify all security triggers and RLS policies:
File: [`supabase/tests/security_tests.sql`](supabase/tests/security_tests.sql)

**Test coverage**:
- `TEST 1`: Proves customers cannot alter `total`, `payment_status`, or `assigned_to` on `service_requests`.
- `TEST 2`: Proves technicians are denied SELECT on `service_request_secrets` (RLS returns 0 rows).
- `TEST 3`: Proves `verify_job_otp()` completes the job on match and locks the request after 5 failed attempts.
- `TEST 4`: Proves direct customer `INSERT` on `payments` is blocked.
- `TEST 5`: Proves vendors cannot alter `status`, `rating`, or `plan` on `vendors`.
- `TEST 6`: Proves blocked customers cannot change `status = 'ACTIVE'` in `customers`.
- `TEST 7`: Proves staff can clear `must_change_password` from `true` to `false`, but role escalation is blocked.

---

## 5. Pre-Launch Custom SMTP & Email Settings

Supabase's default email service is intended solely for local testing and enforces a strict rate limit of approximately 3 emails per hour.

### Steps to Configure Custom SMTP Before Launch:
1. Go to **Supabase Dashboard** -> **Project Settings** -> **Authentication** -> **SMTP Settings**.
2. Toggle **Enable Custom SMTP** to `ON`.
3. Fill in your dedicated transactional email provider details:
   - **Sender email**: `noreply@urbancaresolution.in` (or `auth@urbancaresolution.in`)
   - **Sender name**: `UrbanCare Solution`
   - **Host**: e.g., `smtp.resend.com` / `smtp.sendgrid.net` / `email-smtp.ap-south-1.amazonaws.com`
   - **Port**: `587` (TLS) or `465` (SSL)
   - **Username** & **Password**: SMTP credentials from your email provider
4. Go to **Authentication** -> **URL Configuration**:
   - **Site URL**: `https://urbancaresolution.in` (or your production domain)
   - **Redirect URLs**: Add `https://urbancaresolution.in`, `https://urbancaresolution.in/?reset=true`, `http://localhost:3000`

---

## 6. Supabase Password Security & Hardening Settings

Configure password security in the Supabase Dashboard (**Authentication** -> **Providers** -> **Email**):

1. **Minimum Password Length**: Set to **8** (or **10**).
2. **Leaked Password Protection (HaveIBeenPwned)**:
   - If available on your plan (Pro / Enterprise), toggle **Enable Leaked Password Protection** to `ON`.
   - This automatically prevents users from choosing passwords exposed in global data breaches.
3. **Application-Level Blocklist**:
   - The application enforces a client and server blocklist (`src/utils/authValidation.ts`) blocking common patterns and known legacy test passwords:
     `OpsLead@2026`, `TechPass@101`, `MalwaPass@2026`, `123456`, `password`, `12345678`, `admin123`.

---

## 7. Authentication Rate Limits & Brute-Force Safeguards

1. **Supabase Built-in Rate Limits**:
   - Go to **Project Settings** -> **Authentication** -> **Rate Limits**.
   - Review and set reasonable limits:
     - Email sign-ins per hour: 30 per IP
     - Password resets per hour: 5 per email
2. **Client-Side Cooldown Protection**:
   - The application tracks consecutive failed login attempts in memory.
   - After **5 failed attempts**, the client triggers a **30-second cooldown lock**.
   - Authentication errors always return a generic message: `"Incorrect email or password"` to prevent user enumeration.

---

## 8. Future OTP & WhatsApp Activation Checklist

Phone-based OTP is currently disabled (`VITE_OTP_ENABLED="false"`) in favor of email and password authentication.

When activating phone OTP in the future:
1. Choose an Indian DLT-compliant SMS provider (e.g. MSG91, Twilio, Fast2SMS).
2. Update `.env`:
   ```env
   VITE_OTP_ENABLED="true"
   SMS_PROVIDER="msg91"
   MSG91_AUTH_KEY="your-auth-key"
   MSG91_OTP_TEMPLATE_ID="your-dlt-template-id"
   MSG91_SENDER_ID="URBNCR"
   ```
3. Deploy the SMS hook in [`supabase/functions/sms-hook/index.ts`](supabase/functions/sms-hook/index.ts) or configure custom SMS provider in Supabase Dashboard (**Authentication** -> **Providers** -> **Phone**).
4. The frontend OTP adapter at [`src/lib/otp.ts`](src/lib/otp.ts) will automatically enable the OTP dispatch workflow once `VITE_OTP_ENABLED="true"`.

---

## 9. Database Seeding: Production Catalog vs Demo Staging

The database seeds are split into two files to protect production environments from fictitious records, mock users, and orphaned dropdown entries:

### 1. Production Seed: [`supabase/seed.sql`](supabase/seed.sql)
- **Target**: Production, Staging, and Clean Test environments.
- **Contents**: Strictly system configuration and service definitions only:
  - `public.ops_settings`: System operating thresholds, emergency hours, platform fee %, SLA response minutes.
  - `public.service_categories`: Standard category taxonomy (`cat-elec`, `cat-plumb`, `cat-hvac`, `cat-clean`, `cat-cctv`).
  - `public.services`: Real active service catalog with pricing and descriptions.
- **Zero Mock Data**: Contains **NO** fake employees, **NO** fake vendors, **NO** fake customers, and **NO** fake bookings. Safe to run against any new production deployment.

```bash
# Applying to a new production database via Supabase CLI or SQL Editor:
# Run supabase/seed.sql in the Supabase SQL Editor
```

### 2. Demo Staging Seed: [`supabase/seed_demo.sql`](supabase/seed_demo.sql)
- **Target**: **TEST PROJECTS ONLY — NEVER RUN IN PRODUCTION**
- **Contents**: Fictitious mock entities for offline testing and UI evaluation:
  - Demo employees (`emp-1` to `emp-4`) without linked login credentials.
  - Demo vendors (`vnd-1` to `vnd-4`) without linked login credentials.
  - Demo customers (`cust-1` to `cust-3`) without auth profiles.
  - Demo requests (`PB-REQ-101` to `PB-REQ-103`).
  - Demo opportunity ledger entries (`led-1`, `led-2`) and sample payments.
- **Warning**: Never run this file in an environment intended for live customer traffic, as unlinked demo staff and vendors will pollute dispatcher dropdowns and booking lists.

