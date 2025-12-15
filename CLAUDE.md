# CLAUDE.md - StepCountLeague MVP

## Project Overview

StepCountLeague (SCL) is a step-tracking competition platform where users create/join leagues, submit daily step counts with screenshot proofs, and compete on leaderboards. AI verification validates step counts from uploaded screenshots.

## Tech Stack

- **Framework**: Next.js 15.0.3 with App Router, React 18, TypeScript 5
- **Styling**: Tailwind CSS 3.4
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Deployment**: Cloudflare Pages via OpenNext
- **AI Verification**: Google Gemini 2.5 Flash (configurable via admin)

## Project Structure

```
apps/web/                    # Main Next.js application
├── app/                     # App Router pages and API routes
│   ├── api/                 # REST endpoints
│   │   ├── admin/           # Superadmin API routes (settings, users)
│   │   ├── submissions/     # Submission + verify endpoints
│   │   └── ...
│   ├── admin/               # Superadmin dashboard page
│   └── _components/         # Page-specific components
├── components/              # Reusable UI components
│   ├── forms/               # SubmissionForm with retry queue
│   ├── navigation/          # NavHeader with superadmin link
│   └── providers/           # Auth, Consent providers
├── lib/                     # Utilities
│   ├── server/              # Server-only (env.ts, supabase.ts, http.ts, verify.ts)
│   └── api/                 # Client API helpers (client.ts)
supabase/
├── migrations/              # SQL schema migrations (4 files)
└── functions/verify/        # Edge Function for AI verification
```

## Development Commands

```bash
# Quick start (Windows)
run-dev.bat                  # Tests Gemini API, installs deps, starts dev server

# Manual
cd apps/web
npm ci                       # Install dependencies
npm run dev                  # Start dev server (http://localhost:3000)
npm run lint                 # Run ESLint
npm run preview              # Build and preview on Miniflare
npm run deploy               # Deploy to Cloudflare
```

## Environment Variables

Copy `.dev.vars.example` to `.dev.vars` (and `.env.local` for Next.js):

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GEMINI_MODEL` | No | Default model (overridden by DB settings) |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | No | Google AdSense client ID |

## Key API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/invite/create` | POST | Create league with invite code |
| `/api/invite/join` | POST | Join league via invite code |
| `/api/submissions` | POST/GET | Create/list step submissions |
| `/api/submissions/verify` | POST | Retry verification (rate-limit aware) |
| `/api/leaderboard` | GET | Get ranked leaderboard |
| `/api/proofs/sign-upload` | POST | Get signed URL for proof upload |
| `/api/me` | GET/PATCH | User profile |
| `/api/admin/settings` | GET/PATCH | Site settings (superadmin only) |
| `/api/admin/superadmin` | GET/POST | Manage superadmins |
| `/api/admin/users` | GET | List users for admin |

## Database Schema

### Main Tables (all with RLS)
- **users**: id, display_name, units, `is_superadmin`
- **leagues**: id, name, stepweek_start, invite_code, owner_id
- **memberships**: league_id, user_id, role (owner/admin/member)
- **submissions**: league_id, user_id, for_date, steps, proof_path, verified
- **site_settings**: key, value, description, updated_at, updated_by
- **audit_log**: actor_id, action, target_id, details

### Site Settings Keys
| Key | Default | Description |
|-----|---------|-------------|
| `gemini_model` | `models/gemini-2.5-flash` | Gemini model for verification |
| `verify_per_minute` | `6` | Per-user rate limit (minute) |
| `verify_per_hour` | `60` | Per-user rate limit (hour) |
| `verify_global_per_minute` | `30` | Global rate limit (minute) |
| `verify_global_per_hour` | `240` | Global rate limit (hour) |

### Key Functions
- `leaderboard_period()` - Ranked leaderboard with stats
- `admin_override_verify()` - Admin verification override with audit
- `is_superadmin()` - Check if current user is superadmin
- `set_superadmin()` - Promote/demote users (superadmin only)
- `update_site_setting()` - Update settings (superadmin only)

## Verification Flow

1. User uploads screenshot via signed URL to Supabase storage
2. Submission created with `proof_path`
3. Edge Function (`/supabase/functions/verify/`) reads settings from DB (60s cache)
4. Calls Gemini API to extract step count
5. Validates against submitted value (3% tolerance or 300 steps minimum)
6. Result persisted with tolerance_used, extracted metrics
7. If rate-limited (429), client retries automatically with countdown UI
8. If wait > 3 minutes, user sees confirmation dialog

## Superadmin System

- First superadmin must be set manually in DB: `UPDATE users SET is_superadmin = true WHERE id = 'your-user-id'`
- Superadmins access `/admin` page to manage settings and promote other users
- NavHeader shows amber "Admin" link for superadmins
- All admin actions are logged to audit_log

## Code Conventions

- Use Zod for all API input validation
- Server utilities in `lib/server/` (never import in client code)
- Client API helpers in `lib/api/client.ts`
- All auth via Bearer token with `requireUser()` middleware
- Path alias: `@/*` maps to `apps/web/`
- Rate-limited requests use client-side retry queue with UI feedback

## Database Commands

```bash
supabase db push                    # Apply migrations
supabase functions deploy verify    # Deploy verification function
```

## Deployment (Cloudflare)

1. Connect GitHub repo to Cloudflare Pages
2. Build command: `npm run deploy` (in apps/web)
3. Build output directory: `.open-next`
4. Set environment variables in Cloudflare dashboard
5. Deploy Supabase Edge Function separately

## File Quick Reference

| Need to... | Look at... |
|------------|------------|
| Add API endpoint | `apps/web/app/api/` |
| Modify submission flow | `apps/web/components/forms/SubmissionForm.tsx` |
| Change navigation | `apps/web/components/navigation/NavHeader.tsx` |
| Update verification logic | `supabase/functions/verify/index.ts` |
| Add database table/column | `supabase/migrations/` (create new file) |
| Modify admin page | `apps/web/app/admin/page.tsx` |
| Change rate limits | `/admin` page or `site_settings` table |
