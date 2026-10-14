# UrbanCare Solution (PindCare)
> "Your Space | Our Care" — Trusted Home Services Marketplace for Sectors 94–111, Mohali & Kharar (Punjab, India).

## ⚠️ Security Notice: Compromised Demo Passwords

The following legacy development/demo passwords are treat as **compromised and permanently revoked**:
- `OpsLead@2026`
- `TechPass@101`
- `MalwaPass@2026`

**Mandatory Action**:
- Any existing account or database record currently utilizing any of these passwords **must change its password immediately**.
- These passwords are added to the application's client and server validation blocklist (`src/utils/authValidation.ts`) and will be rejected for any new registration or password reset.
- Universal passwords, client-side fallback logins, and unauthenticated demo shortcuts have been completely eliminated from the codebase.

---

## 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS, Lucide Icons
- **Backend & Auth**: Supabase Auth (Email + Password), PostgreSQL, Row Level Security (RLS), Supabase Edge Functions (Deno)
- **Compliance**: Digital Personal Data Protection (DPDP) Act 2023 consent manager, Section 5 notice, Section 14 nominee, and grievance logging

---

## 🚀 Getting Started

### 1. Environment Configuration
Copy `.env.example` to `.env` and fill in your Supabase project credentials:
```bash
cp .env.example .env
```

Ensure `.env` contains:
```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
VITE_OTP_ENABLED="false"
```

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## 🔐 Database & Auth Architecture

For comprehensive database migrations, RLS policies, first admin creation, and SMTP/security configurations, refer to [SUPABASE_SETUP.md](SUPABASE_SETUP.md).
