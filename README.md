# StepCountLeague (SCL) — MVP

This repository implements the StepCountLeague MVP defined in the PRD. The stack combines Next.js (App Router), Supabase (auth, database, storage), and Cloudflare Workers via the OpenNext adapter.

## Quick start

1. Install dependencies
   ```bash
   cd apps/web
   npm ci
   ```
2. Copy environment variables
   ```bash
   cp .dev.vars.example .dev.vars
   # edit values
   ```
3. Run the preview worker locally
   ```bash
   npm run preview
   ```

## Environment

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | (Optional) Google AdSense client ID |

Consent Mode is controlled by the custom CMP in `ConsentProvider`. A floating **Manage cookies** button re-opens preferences.

## Supabase

SQL migrations are stored under `supabase/migrations`. Apply them with the Supabase CLI:

```bash
supabase db push
```

An Edge Function for Gemini verification lives at `supabase/functions/verify`—deploy it with:

```bash
supabase functions deploy verify
```

## Scripts

Inside `apps/web`:

| Command | Description |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run preview` | Build via OpenNext and run on Miniflare |
| `npm run deploy` | Build and deploy via OpenNext CLI |
| `npm run lint` | ESLint using Next.js config |

## Testing

- `SubmissionForm` and leaderboard flows rely on Supabase RLS; integration tests should run against a local Supabase instance using seeded data.
- The verification Edge Function includes tolerance logic that should be extended with unit tests (e.g. using Deno test) before production rollout.

## Deployment

1. Configure a Cloudflare Pages/Workers project.
2. Connect the GitHub repository and set the build command to `npm run deploy`.
3. Provide required environment variables under Cloudflare → Settings → Variables.
4. Attach the Supabase project credentials and Gemini API key (`GEMINI_API_KEY`) in Workers secrets.

## Roadmap pointers

Future phases (weekly matches, advanced analytics, monetisation) build on the RPC surfaces added in `supabase/migrations`. Keep new features behind feature flags to honour the modular architecture.