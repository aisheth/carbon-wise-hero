# Security

## Authentication

- Email/password and Google OAuth via Supabase Auth.
- No anonymous sign-ups, no auto-confirm bypass.
- Sessions stored as httpOnly cookies; client uses the publishable anon key only.

## Authorisation

- Every `public` table has **RLS enabled** and **explicit GRANTs** scoped to
  `authenticated` (or `service_role` for admin paths).
- All user-owned rows are filtered by `auth.uid() = user_id`.
- Privileged reads are funnelled through `SECURITY DEFINER` RPCs
  (`get_leaderboard`, `get_challenge_progress`) which return only
  whitelisted/aggregated columns.

## Storage

- `mission-proofs` is **private**. Policies on `storage.objects` require
  `auth.uid()::text = (storage.foldername(name))[1]`, so users can only
  read/write their own folder.

## Server boundaries

- Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`) are read only from
  `process.env` inside server handlers (`*.server.ts`, `routes/api/*`,
  `createServerFn` handler bodies). They never appear in the client bundle.
- Webhooks (none today) would live under `/api/public/*` and verify
  signatures before any database write.

## Input validation

- Client forms use Zod schemas where applicable.
- Server functions accept JSON validated by `inputValidator(...)` before
  the handler runs.

## Known accepted findings

- `get_leaderboard` / `get_challenge_progress` trigger the Supabase
  `0028`/`0029` linter warnings because they're `SECURITY DEFINER`. They are
  **intentionally** callable by signed-in users — they return only safe data.

## Reporting issues

Open a GitHub issue with the `security` label, or for sensitive reports,
email the project maintainer directly.
