# CLAUDE.md - StepCountLeague v3

> **LLM Context File**: This file provides instant context for AI assistants working on this codebase.

## Project Overview

**StepCountLeague (SCL)** is a step-tracking competition platform where users:
- Create and join leagues via invite codes
- Submit daily step counts with screenshot proofs
- Compete on leaderboards
- Have submissions verified by AI (Gemini)

**This is v3** - a fresh rewrite optimized for Vercel deployment (v2 used Cloudflare).

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 14.2.18 | App Router, NOT v15 (avoids async params issues) |
| Database | Supabase (PostgreSQL) | Shared with SCL v2 |
| Auth | Supabase Auth | Email/password |
| Styling | Tailwind CSS 3.4 | Dark theme (slate-950 base) |
| Validation | Zod | All API inputs validated |
| Deployment | Vercel | Zero-config, auto-deploy from main |
| AI Verification | Google Gemini 2.5 Flash | Via Supabase Edge Function (from v2) |

## Project Structure

```
scl-v3/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Auth pages (sign-in, sign-up)
│   │   │   ├── sign-in/page.tsx  # Uses Suspense for useSearchParams
│   │   │   └── sign-up/page.tsx
│   │   ├── (dashboard)/          # Protected pages
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── join/page.tsx
│   │   │   └── league/[id]/
│   │   │       ├── page.tsx
│   │   │       └── leaderboard/page.tsx
│   │   ├── api/                  # API routes
│   │   │   ├── auth/callback/    # Supabase auth callback
│   │   │   ├── invite/join/      # Join league via code
│   │   │   ├── leagues/          # CRUD leagues
│   │   │   ├── leaderboard/      # Leaderboard RPC
│   │   │   └── me/               # User profile
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Landing page
│   │   └── globals.css
│   ├── components/
│   │   └── providers/
│   │       └── AuthProvider.tsx  # Client-side auth context
│   ├── lib/
│   │   ├── api.ts                # Response helpers (json, badRequest, etc.)
│   │   └── supabase/
│   │       ├── client.ts         # Browser client (untyped)
│   │       ├── server.ts         # Server client (untyped)
│   │       └── middleware.ts     # Auth middleware
│   ├── types/
│   │   └── database.ts           # Supabase types (optional, currently unused)
│   └── middleware.ts             # Next.js middleware (auth redirects)
├── .env.example
├── .env.local                    # Your local env (git-ignored)
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Critical Architecture Decisions

### 1. Untyped Supabase Client
We removed `<Database>` generics from Supabase clients to avoid complex type inference issues. Use `any` casts for query results.

```typescript
// ✅ Current approach - simple, works
const supabase = createServerClient(url, key, { cookies: {...} });
const { data } = await supabase.from("leagues").select("*");
const leagues = (data || []).map((l: any) => ({ ... }));

// ❌ Previous approach - caused build failures
const supabase = createServerClient<Database>(url, key, { cookies: {...} });
```

**Why**: The typed approach caused cascading `never` type errors with `@supabase/ssr` v0.5.x. Untyped is simpler and builds successfully.

### 2. Suspense Boundaries for useSearchParams
Next.js 14 requires `useSearchParams()` to be wrapped in `<Suspense>` during static generation.

```typescript
// ✅ Correct pattern
function SignInForm() {
  const searchParams = useSearchParams(); // Uses the hook
  return <form>...</form>;
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
```

### 3. Cookie Type Annotations
When using untyped Supabase, you must explicitly type the `cookiesToSet` parameter:

```typescript
type CookieOptions = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

// In createServerClient cookies config:
setAll(cookiesToSet: CookieOptions[]) { ... }
```

### 4. API Response Helpers
All API routes use helpers from `@/lib/api.ts`:

```typescript
import { json, badRequest, unauthorized, serverError, notFound } from "@/lib/api";

// Usage
if (!user) return unauthorized();
if (error) return serverError(error.message);
return json({ data });
```

## Database Schema (Supabase)

Uses the same database as SCL v2. Key tables:

| Table | Purpose |
|-------|---------|
| `users` | User profiles (id, display_name, units, is_superadmin) |
| `leagues` | Leagues (id, name, stepweek_start, invite_code, owner_id) |
| `memberships` | User-league relationships (league_id, user_id, role) |
| `submissions` | Step submissions (league_id, user_id, for_date, steps, verified) |
| `site_settings` | Admin settings (key, value) |

### Key RPC Functions
- `leaderboard_period(league_id, dates[], limit, offset)` - Returns ranked leaderboard

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (server-only) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| `Parameter implicitly has 'any' type` | Missing type annotation on `cookiesToSet` | Add `CookieOptions[]` type |
| `useSearchParams should be wrapped in Suspense` | Next.js 14 static generation | Wrap component using useSearchParams in `<Suspense>` |
| `Property 'id' does not exist on type 'never'` | Typed Supabase with mismatched schema | Remove `<Database>` generic, use untyped client |
| Auth redirects to localhost | Supabase URL config | Update Site URL in Supabase Dashboard → Auth → URL Configuration |
| Build fails on type checking | Various TS strict mode issues | Check error message, add type assertions as needed |

## Deployment

### Vercel Setup
1. Connect GitHub repo `vassovass/scl-v3`
2. Add environment variables in Vercel dashboard
3. Deploy (auto-deploys on push to main)

### Supabase Setup
1. **Auth → URL Configuration**:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`

2. **Database**: Uses existing SCL v2 schema - no changes needed

## File Quick Reference

| Need to... | Look at... |
|------------|------------|
| Add API endpoint | `src/app/api/` |
| Add protected page | `src/app/(dashboard)/` |
| Add auth page | `src/app/(auth)/` |
| Modify auth flow | `src/lib/supabase/middleware.ts` |
| Change Supabase client | `src/lib/supabase/server.ts` or `client.ts` |
| Add response helper | `src/lib/api.ts` |
| Modify auth context | `src/components/providers/AuthProvider.tsx` |

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint
```

## Git Workflow

```bash
# All pushes to main auto-deploy to Vercel
git add .
git commit -m "Your message"
git push origin main
```

## Related Resources

- **SCL v2 repo**: Contains Supabase migrations, Edge Functions, and original implementation
- **Supabase Dashboard**: Database, Auth, Storage configuration
- **Vercel Dashboard**: Deployments, environment variables, logs

## For LLM Assistants

When working on this codebase:

1. **Read this file first** - it has the patterns and gotchas
2. **Don't add `<Database>` generics** - use untyped Supabase
3. **Check for Suspense needs** - any component using `useSearchParams()` needs it
4. **Use `any` casts for Supabase results** - e.g., `(data || []).filter((m: any) => ...)`
5. **Test builds before pushing** - `npm run build` catches type errors Vercel will hit
