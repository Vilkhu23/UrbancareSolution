# PindCare Security Rules & Database Engineering Standards

> Core operational security standards for PindCare (UrbanCare Solution).
> These rules are mandatory for all contributors, developers, and autonomous agents.

---

## 1. Never Weaken RLS, Triggers, or Security Functions
- **Zero Regressions**: Existing Row Level Security (RLS) policies, triggers, and constraint checks are audited guarantees (SEC-01 through SEC-12).
- **No Blanket Access**: Never replace granular role-based checks with `USING (true)` or open mutations on sensitive tables.
- **Trigger Integrity**: Business integrity rules (immutable billing amounts, completion codes, single-use OTPs, role validation) are enforced at the database level inside triggers and `SECURITY DEFINER` functions with fixed `search_path = public`.

---

## 2. Never Edit Applied Migrations
- **Immutability of Applied Scripts**: Migrations `000001` through `000010` have already been applied to existing databases. Modifying applied migration files introduces schema drift, breaks preview branches, and invalidates deployment checksums.
- **Forward-Only Changes**: Any change, bug fix, or schema evolution must be authored as a **new sequential migration** (e.g. `20261013000011_...sql`).

---

## 3. Never Put Secret Keys in Client Code
- **Client Key Boundaries**: Only the Supabase `anon` public publishable key may be bundled in client-side code (`VITE_SUPABASE_ANON_KEY`).
- **Service Role Secrecy**: The Supabase `service_role` key bypasses RLS and grants superuser database access. It must **never** appear in client source code, `.env` files bundled by Vite, or browser-accessible repositories. It is strictly reserved for secure backend environments (Cloud Run, Edge Functions, automated CI/CD migrations).

---

## 4. No Personal Data in Browser Storage
- **Local Storage Restrictions**: Never persist Personally Identifiable Information (PII) such as customer phone numbers, full names, home addresses, OTPs, or passwords in `localStorage`, `sessionStorage`, or unencrypted cookies.
- **State Hydration**: User identity is re-hydrated dynamically via verified Supabase Auth JWT sessions (`supabase.auth.getUser()`) and scoped database queries governed by RLS.

---

## 5. Every New Table Needs RLS Plus Explicit Grants
- **Supabase Oct 30 Post-Deprecation Standard**: Default privileges in `public` are closed. Supabase no longer automatically grants Data API access to newly created tables.
- **Mandatory Template**: Any migration that creates a table must, within that same file:
  1. `ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;`
  2. Define role-specific RLS policies (`CREATE POLICY ...`).
  3. Explicitly grant required Data API permissions:
     - `GRANT SELECT ON public.<table_name> TO anon;` *(only if public read is required)*
     - `GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table_name> TO authenticated;` *(only privileges needed)*
     - `GRANT ALL ON public.<table_name> TO service_role;`

---

## 6. Run `security_tests.sql` After Every Database Change
- **Continuous Security Verification**: The test suite in [`supabase/tests/security_tests.sql`](supabase/tests/security_tests.sql) verifies authorization boundaries across anon, customers, technicians, vendors, operations managers, and administrators.
- **Verification Requirement**: After applying any database migration or modifying RLS policies, execute `security_tests.sql` in the Supabase SQL Editor. The final output must report `ALL TESTS PASSED` with zero regressions.

---

## 7. Show a Plan First
- **Architectural Review**: Before executing security-sensitive changes (schema modifications, role transitions, grant adjustments, authentication flows), formulate and present an architectural plan detailing:
  1. Affected tables, functions, or endpoints.
  2. Security implications and potential attack vectors.
  3. Migration rollback and verification strategy.
