# StepCountLeague v3

A step-tracking competition platform built with Next.js 14 and Supabase.

> **For AI Assistants**: See [CLAUDE.md](./CLAUDE.md) for full technical context, patterns, and gotchas.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=your-gemini-key
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com) → "Add New..." → "Project"
2. Select your `scl-v3` repository
3. Add environment variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `GEMINI_API_KEY` | Your Gemini API key |

4. Click "Deploy"

### Step 3: Configure Supabase Auth (Critical!)

Update Supabase to use your Vercel URL instead of localhost:

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://your-app.vercel.app`
3. Add to **Redirect URLs**: `https://your-app.vercel.app/**`

Without this, confirmation emails will redirect to localhost.

---

## Project Structure

```
src/
├── app/                    # Pages and API routes
│   ├── (auth)/             # Sign-in, sign-up pages
│   ├── (dashboard)/        # Protected pages (dashboard, leagues)
│   └── api/                # API routes
├── components/             # React components
│   └── providers/          # Auth context provider
├── lib/                    # Utilities
│   ├── api.ts              # API response helpers
│   └── supabase/           # Supabase clients
└── types/                  # TypeScript types
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2.18 | Framework (App Router) |
| Supabase | Latest | Database, Auth, Storage |
| Tailwind CSS | 3.4 | Styling |
| Zod | 3.23 | Validation |
| TypeScript | 5.x | Type safety |

---

## Key Architecture Decisions

1. **Next.js 14.2.x** (not 15) - Avoids async params breaking changes
2. **Untyped Supabase clients** - Simpler, avoids complex type inference issues
3. **Flat structure** - No monorepo complexity
4. **Vercel deployment** - Zero-config, auto-deploy from main branch

See [CLAUDE.md](./CLAUDE.md) for detailed explanations.

---

## Using Existing SCL v2 Database

This project connects to your existing Supabase database from SCL v2. The schema, RPC functions, Edge Functions, and storage buckets are already configured.

**Optional**: Generate TypeScript types from your database:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

Note: Current setup uses untyped Supabase clients. See CLAUDE.md for why.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Auth redirects to localhost | Update Site URL in Supabase → Auth → URL Configuration |
| Build fails with type errors | See CLAUDE.md for common patterns |
| `useSearchParams` error | Wrap component in `<Suspense>` boundary |
| Supabase query returns `never` | Use untyped client with `any` casts |

---

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Full technical context for AI assistants
- **SCL v2 repo** - Contains Supabase migrations and Edge Functions
