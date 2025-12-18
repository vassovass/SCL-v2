# StepCountLeague v3

A step-tracking competition platform built with Next.js 14 and Supabase.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

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

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deploy to Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/scl-v3.git
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Select your `scl-v3` repository
4. Click "Import"

### Step 3: Add Environment Variables

In the Vercel configuration screen, add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |
| `GEMINI_API_KEY` | Your Gemini API key |

### Step 4: Deploy

Click "Deploy" and wait ~2 minutes.

### Step 5: Update Supabase

Add your Vercel URL to Supabase:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add `https://your-app.vercel.app` to Site URL
3. Add `https://your-app.vercel.app/**` to Redirect URLs

---

## Project Structure

```
src/
├── app/                    # Pages and API routes
│   ├── (auth)/             # Auth pages (sign-in, sign-up)
│   ├── (dashboard)/        # Protected pages
│   └── api/                # API routes
├── components/             # React components
│   └── providers/          # Context providers
├── lib/                    # Utilities
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

- **Framework**: Next.js 14.2 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS
- **Validation**: Zod

---

## Reusing from SCL v2

This project is designed to work with your existing Supabase database from SCL v2.
The database schema, RPC functions, and storage buckets are already configured.

To generate proper TypeScript types from your database:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

---

## Notes

- Built for Vercel (zero-config deployment)
- Uses Next.js 14.2.x (stable, no async params issues)
- Flat structure (no monorepo complexity)
- TypeScript strict mode enabled
