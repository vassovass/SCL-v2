# SCL v3 - Fresh Start Guide

A complete guide for setting up StepCountLeague v3 from scratch, optimized for Vercel deployment.

---

## Table of Contents
1. [Decision: Supabase - Reuse or New?](#1-supabase-decision)
2. [PRD - Product Requirements](#2-prd)
3. [Tech Stack](#3-tech-stack)
4. [Project Setup](#4-project-setup)
5. [Folder Structure](#5-folder-structure)
6. [Vercel Deployment](#6-vercel-deployment)
7. [Environment Variables](#7-environment-variables)
8. [Common Issues & Fixes](#8-common-issues)

---

## 1. Supabase Decision

### Recommendation: REUSE existing Supabase project

**Why reuse:**
- Database schema already set up (users, leagues, memberships, submissions, etc.)
- RPC functions already working (leaderboard_period, etc.)
- Storage buckets configured
- Auth already configured
- No data migration needed

**When to create new:**
- If you want a completely fresh start with no legacy data
- If you want to test without affecting production

**Verdict:** Reuse. Just point the new app to the same Supabase URL and keys.

---

## 2. PRD - Product Requirements Document

### Project: StepCountLeague v3

#### Vision
A step-tracking competition platform where users join leagues, submit daily step counts with screenshot proofs, and compete on leaderboards.

#### Core Features (MVP)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Auth** | Email/password sign up & login via Supabase | P0 |
| **Leagues** | Create leagues, generate invite codes | P0 |
| **Join League** | Join via invite code | P0 |
| **Submit Steps** | Daily step count + screenshot upload | P0 |
| **AI Verification** | Gemini extracts step count from screenshot | P0 |
| **Leaderboard** | Ranked standings (daily/weekly) | P0 |
| **User Profile** | Display name, preferred units | P1 |
| **Admin Panel** | Superadmin settings management | P1 |

#### User Flows

```
1. Sign Up → Create/Join League → Submit Steps → View Leaderboard
2. Return User → Login → Submit Steps → View Leaderboard
3. Admin → Login → Access /admin → Manage Settings
```

#### Pages Required

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/sign-in` | Login form |
| `/sign-up` | Registration form |
| `/dashboard` | User's leagues list |
| `/league/[id]` | League detail + submission form |
| `/league/[id]/leaderboard` | League leaderboard |
| `/join` | Join league via invite code |
| `/admin` | Superadmin panel |

#### API Routes Required

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/callback` | GET | Supabase auth callback |
| `/api/leagues` | GET/POST | List/create leagues |
| `/api/leagues/[id]` | GET | Get league details |
| `/api/leagues/[id]/members` | GET | Get league members |
| `/api/invite/create` | POST | Generate invite code |
| `/api/invite/join` | POST | Join via invite code |
| `/api/submissions` | GET/POST | List/create submissions |
| `/api/leaderboard` | GET | Get leaderboard data |
| `/api/proofs/sign-upload` | POST | Get signed upload URL |
| `/api/me` | GET/PATCH | User profile |
| `/api/admin/settings` | GET/PATCH | Site settings |

---

## 3. Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Framework** | Next.js 14.2.x (NOT 15) | Stable, no async params issues |
| **Language** | TypeScript (strict) | Catch errors at build time |
| **Styling** | Tailwind CSS | Fast, utility-first |
| **Database** | Supabase (PostgreSQL) | Already set up |
| **Auth** | Supabase Auth | Already set up |
| **Storage** | Supabase Storage | Already set up |
| **AI** | Google Gemini | Step count extraction |
| **Hosting** | Vercel | Zero-config Next.js hosting |
| **Validation** | Zod | Runtime type checking |

---

## 4. Project Setup

### Step 1: Create New GitHub Repository

1. Go to https://github.com/new
2. Repository name: `scl-v3` (or whatever you prefer)
3. Make it **Public** or **Private**
4. Check "Add a README file"
5. Add `.gitignore` → select **Node**
6. Click "Create repository"

### Step 2: Clone and Initialize

Open terminal and run:

```bash
# Clone your new repo
git clone https://github.com/YOUR_USERNAME/scl-v3.git
cd scl-v3

# Create Next.js app (THIS IS THE KEY COMMAND)
npx create-next-app@14.2.18 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**IMPORTANT:** Use version `14.2.18` specifically to avoid Next.js 15 issues.

When prompted:
- Would you like to use TypeScript? → **Yes**
- Would you like to use ESLint? → **Yes**
- Would you like to use Tailwind CSS? → **Yes**
- Would you like to use `src/` directory? → **Yes**
- Would you like to use App Router? → **Yes**
- Would you like to customize the default import alias? → **Yes** → `@/*`

### Step 3: Install Dependencies

```bash
# Core dependencies
npm install @supabase/supabase-js @supabase/ssr zod

# Dev dependencies
npm install -D @types/node
```

### Step 4: Create Environment File

Create `.env.local` in the root:

```env
# Supabase (copy from your existing project)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key
```

### Step 5: Generate Supabase Types (IMPORTANT!)

This prevents TypeScript errors:

```bash
# Install Supabase CLI if you haven't
npm install -D supabase

# Login to Supabase
npx supabase login

# Generate types from your existing database
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

Replace `YOUR_PROJECT_ID` with your Supabase project ID (found in project settings URL).

### Step 6: Initial Commit

```bash
git add .
git commit -m "Initial Next.js 14 setup with Supabase"
git push origin main
```

---

## 5. Folder Structure

```
scl-v3/
├── src/
│   ├── app/                    # Pages and API routes
│   │   ├── (auth)/             # Auth pages group
│   │   │   ├── sign-in/
│   │   │   │   └── page.tsx
│   │   │   └── sign-up/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/        # Protected pages group
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── league/
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── leaderboard/
│   │   │   │           └── page.tsx
│   │   │   └── admin/
│   │   │       └── page.tsx
│   │   ├── api/                # API routes
│   │   │   ├── auth/
│   │   │   │   └── callback/
│   │   │   │       └── route.ts
│   │   │   ├── leagues/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       └── members/
│   │   │   │           └── route.ts
│   │   │   ├── submissions/
│   │   │   │   └── route.ts
│   │   │   ├── leaderboard/
│   │   │   │   └── route.ts
│   │   │   └── me/
│   │   │       └── route.ts
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Landing page
│   │   └── globals.css         # Global styles
│   ├── components/             # Reusable components
│   │   ├── ui/                 # Generic UI (Button, Input, etc.)
│   │   ├── forms/              # Form components
│   │   └── providers/          # Context providers
│   ├── lib/                    # Utilities
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser client
│   │   │   ├── server.ts       # Server client
│   │   │   └── middleware.ts   # Auth middleware
│   │   └── utils.ts            # Helper functions
│   └── types/
│       └── database.ts         # Generated Supabase types
├── public/                     # Static assets
├── .env.local                  # Environment variables (DO NOT COMMIT)
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 6. Vercel Deployment

### Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub

### Step 2: Import Project

1. From Vercel dashboard, click "Add New..." → "Project"
2. Find your `scl-v3` repository
3. Click "Import"

### Step 3: Configure Project

On the configuration screen:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js (auto-detected) |
| **Root Directory** | `.` (leave empty/default) |
| **Build Command** | `npm run build` (default) |
| **Output Directory** | `.next` (default) |
| **Install Command** | `npm install` (default) |

### Step 4: Add Environment Variables

Click "Environment Variables" and add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` |
| `GEMINI_API_KEY` | `your-key` |

**TIP:** Click the lock icon to encrypt sensitive values.

### Step 5: Deploy

Click "Deploy" and wait ~2 minutes.

Your app will be live at: `https://scl-v3.vercel.app` (or similar)

### Step 6: Update Supabase Auth Settings

**IMPORTANT:** Tell Supabase about your new URL:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to:
   - **Site URL:** `https://scl-v3.vercel.app`
   - **Redirect URLs:** `https://scl-v3.vercel.app/**`

---

## 7. Environment Variables

### Local Development (`.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Gemini
GEMINI_API_KEY=AIzaSy...

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (Vercel Dashboard)

Same variables, but with production values.

**NEVER commit `.env.local` to git!** It's already in `.gitignore`.

---

## 8. Common Issues & Fixes

### Issue: "Module not found: Can't resolve..."

**Fix:** Run `npm install` again, or check import paths.

### Issue: "Type error: Property X does not exist..."

**Fix:** Regenerate Supabase types:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

### Issue: Build fails on Vercel but works locally

**Fix:** Check that all environment variables are set in Vercel dashboard.

### Issue: Auth not working on Vercel

**Fix:** Add your Vercel URL to Supabase Auth settings:
- Dashboard → Authentication → URL Configuration → Redirect URLs

### Issue: "Invalid API key" errors

**Fix:** Double-check environment variables in Vercel. Make sure there are no extra spaces or quotes.

### Issue: Vercel says "No framework detected"

**Fix:** Make sure `package.json` is in the root directory, not a subdirectory.

---

## Quick Reference Commands

```bash
# Development
npm run dev          # Start dev server at localhost:3000

# Build & Test
npm run build        # Build for production
npm run lint         # Check for errors

# Supabase
npx supabase login                    # Login to Supabase CLI
npx supabase gen types typescript \
  --project-id YOUR_ID > src/types/database.ts   # Generate types

# Git
git add .
git commit -m "Your message"
git push origin main                  # This triggers Vercel deploy!
```

---

## Next Steps After Setup

1. **Copy over components** from SCL v2 that you want to keep
2. **Test locally** with `npm run dev`
3. **Push to GitHub** - Vercel auto-deploys on every push
4. **Monitor builds** at https://vercel.com/dashboard

---

## Summary: The "Vibe Coder" Checklist

- [ ] Create GitHub repo
- [ ] Run `npx create-next-app@14.2.18` command
- [ ] Install dependencies (`npm install @supabase/supabase-js @supabase/ssr zod`)
- [ ] Create `.env.local` with Supabase keys
- [ ] Generate Supabase types
- [ ] Push to GitHub
- [ ] Import to Vercel
- [ ] Add environment variables in Vercel
- [ ] Deploy
- [ ] Update Supabase redirect URLs
- [ ] Celebrate!

---

*Generated for SCL v3 setup. Last updated: December 2024*
