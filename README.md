# StepCountLeague (SCL) — MVP

A step-tracking competition platform where users create/join leagues, submit daily step counts with screenshot proofs, and compete on leaderboards. AI-powered verification validates step counts from uploaded screenshots.

## Features

- **User Authentication** - Email/password via Supabase Auth
- **League Management** - Create leagues, invite via code, role-based access (owner/admin/member)
- **Step Submissions** - Daily step count with screenshot proof
- **AI Verification** - Google Gemini extracts step count from screenshots
- **Leaderboards** - Ranked standings with weekly periods
- **Superadmin System** - Dynamic site settings, user management
- **Rate Limiting** - Configurable per-user and global limits with client-side retry queue

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI**: Google Gemini 2.5 Flash
- **Deployment**: Cloudflare Pages via OpenNext

## Quick Start

### Windows
```bash
run-dev.bat    # Tests Gemini API, installs deps, starts server
```

### Manual Setup
```bash
cd apps/web
npm ci
cp .dev.vars.example .dev.vars   # Edit with your keys
cp .dev.vars .env.local          # Copy for Next.js
npm run dev                       # http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (server only) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | No | Google AdSense client ID |

## Supabase Setup

Apply migrations and deploy the verification Edge Function:

```bash
supabase db push
supabase functions deploy verify
```

### First Superadmin

After creating your account, promote yourself to superadmin:

```sql
UPDATE users SET is_superadmin = true WHERE id = 'your-user-id';
```

Then access `/admin` to manage settings and other users.

## Scripts

Inside `apps/web`:

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run lint` | ESLint check |
| `npm run preview` | Build + run on Miniflare |
| `npm run deploy` | Deploy to Cloudflare |

## Deployment (Cloudflare Pages)

1. Connect GitHub repo to Cloudflare Pages
2. **Build command**: Leave empty (handled by deploy command)
3. **Deploy command**: `npx wrangler deploy`
4. **Path**: `apps/web`
5. Add environment variables in Settings > Variables (encrypt secrets)
6. Deploy Supabase Edge Function separately with `supabase functions deploy verify`

## Project Structure

```
apps/web/           # Next.js application
├── app/            # Pages and API routes
├── components/     # React components
└── lib/            # Utilities
supabase/
├── migrations/     # SQL migrations
└── functions/      # Edge Functions
```

## Documentation

See [CLAUDE.md](./CLAUDE.md) for detailed technical documentation including:
- Complete API reference
- Database schema
- Code conventions
- Verification flow
- Superadmin system

## Roadmap

Future phases (weekly matches, advanced analytics, monetisation) build on the RPC surfaces in `supabase/migrations`. Keep new features behind feature flags to honour the modular architecture.
