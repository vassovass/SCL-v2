# SCL Agent Rules

- Prefer **Supabase** RPC/REST and Storage. Do **not** add Firebase or other backends.
- Keep AI calls server-side (Edge Function or Worker). Never expose keys client-side.
- Respect **Verification Policy**: ±3% or ±300; pending/rejected not counted.
- Use **server-side aggregates**; do not compute totals on client.
- Follow PRD endpoints and data model in this repo; propose migrations via SQL.
- Cloudflare target: OpenNext Cloudflare adapter; Node runtime (not edge runtime).
- Write tests where logic is non-trivial.