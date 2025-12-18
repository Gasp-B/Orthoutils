# Migration rollout: status enum first, status-based RLS second

Two migrations ship the new publication workflow. The schema migration must run before the policies migration.

## 1) Schema + data backfill (runs first)
- **Goal:** introduce the `validation_status` enum (`draft | in_review | published | archived`), convert `status` to that type, and add validation metadata.
- **Scope:** `tools_catalog`, `tools`, `tests`.
- **Changes:**
  - Create `validation_status` enum.
  - Add `validated_by uuid` and `validated_at timestamptz` (nullable).
  - Convert `status` to `validation_status` with default `draft`.
  - Backfill: set all existing `tests` and `tools` rows to `published`. For `tools_catalog`, map legacy text values to the enum (e.g., `validé/validée` → `published`; `en cours de revue`/`communauté` → `in_review`; unknown → `draft`).

## 2) Status-based RLS (runs second)
- **Goal:** lock reads/writes to status-aware rules and moderation roles.
- **Policies:**
  - Public (anon + authenticated) can `SELECT` only rows where `status = 'published'`.
  - Moderators (`role` = `admin`/`editor` or `service_role`) can read/write all statuses.
  - Writes on status tables require moderation role **and** keep `validated_by/validated_at` NULL unless `status = 'published'` (and non-NULL when published).
  - Translation/junction tables mirror parent visibility for public, full control for moderators.
  - Legacy policies are dropped before applying the new set.

## Execution order and CI
- The timestamps enforce ordering: `20250709120000_add_status_and_validation_metadata.sql` (schema) then `20250710120000_status_based_rls.sql` (policies).
- GitHub Action `.github/workflows/supabase-migrations.yml` runs `supabase migration up --db-url "$SUPABASE_DB_URL"` so the CLI only applies migrations that are not already recorded in `supabase_migrations`. This avoids primary-key conflicts when a timestamp already exists on the remote.
