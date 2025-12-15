# CLAUDE.md - StepCountLeague MVP

## Project Overview

StepCountLeague (SCL) is a step-tracking competition platform where users create/join leagues, submit daily step counts with screenshot proofs, and compete on leaderboards. AI verification validates step counts from uploaded screenshots.

## Tech Stack

- **Framework**: Next.js 15.0.3 with App Router, React 18, TypeScript 5
- **Styling**: Tailwind CSS 3.4
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Deployment**: Cloudflare Workers via OpenNext
- **AI Verification**: Google Gemini 1.5 Flash

## Project Structure

```
apps/web/           # Main Next.js application
├── app/            # App Router pages and API routes
│   ├── api/        # REST endpoints
│   └── _components/# Page-specific components
├── components/     # Reusable UI components
├── lib/            # Utilities (server/, api/, supabase/)
supabase/
├── migrations/     # SQL schema migrations
└── functions/      # Edge Functions (verify/)
```

## Development Commands

```bash
cd apps/web
npm ci              # Install dependencies
npm run dev         # Start dev server (http://localhost:3000)
npm run lint        # Run ESLint
npm run preview     # Build and preview on Miniflare
npm run deploy      # Deploy to Cloudflare
```

## Environment Variables

Copy `.dev.vars.example` to `.dev.vars` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | No | Google AdSense client ID |

## Key API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/invite/create` | POST | Create league with invite code |
| `/api/invite/join` | POST | Join league via invite code |
| `/api/submissions` | POST/GET | Create/list step submissions |
| `/api/leaderboard` | GET | Get ranked leaderboard |
| `/api/proofs/sign-upload` | POST | Get signed URL for proof upload |
| `/api/me` | GET/PATCH | User profile |

## Database Schema

Main tables (all with RLS):
- **users**: id, display_name, units
- **leagues**: id, name, stepweek_start, invite_code, owner_id
- **memberships**: league_id, user_id, role (owner/admin/member)
- **submissions**: league_id, user_id, for_date, steps, proof_path, verified
- **audit_log**: actor_id, action, target_id, details

Key functions:
- `leaderboard_period()` - Ranked leaderboard with stats
- `admin_override_verify()` - Admin verification override with audit

## Verification Flow

1. User uploads screenshot via signed URL to Cloudflare storage
2. Submission created with `proof_path`
3. Edge Function (`/supabase/functions/verify/`) calls Gemini API
4. AI extracts step count and validates against submitted value
5. Result persisted with tolerance_used, extracted metrics

Rate limits: 6/min and 60/hour per user; 30/min and 240/hour global.

## Code Conventions

- Use Zod for all API input validation
- Server utilities in `lib/server/` (env.ts, supabase.ts, http.ts)
- Client API helpers in `lib/api/client.ts`
- All auth via Bearer token with `requireUser()` middleware
- Path alias: `@/*` maps to project root

## Database Commands

```bash
supabase db push                    # Apply migrations
supabase functions deploy verify    # Deploy verification function
```
