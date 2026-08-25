-- One-time migration to bring an existing database in line with the
-- updated supabase/schema.sql. Run this once in the Supabase SQL Editor.
-- Safe to re-run (every statement is idempotent).

-- 1) profiles: regional_health_department and phone are already read/written
--    by lib/actions/profile.ts (the "Editar perfil" screen) and declared in
--    schema.sql, but were never actually added to this database — every
--    profile update currently fails with "column ... does not exist".

alter table public.profiles
  add column if not exists regional_health_department text,
  add column if not exists phone text;

-- 2) planner_entries: drop the leftover per-day "status" column and its
--    admin-select policy from an older, pre-month-report design. No current
--    code reads or writes planner_entries.status — the report unit is the
--    whole month (planner_month_reports.status), not a single day. Worse,
--    the policy below let ADM/MASTER see an individual day marked
--    status = 'ready' even when the colaborador's month report was never
--    marked ready, bypassing the "content visible only once the month is
--    ready" rule enforced everywhere else.

drop policy if exists "select ready planner entries, admins" on public.planner_entries;

alter table public.planner_entries
  drop column if exists status;
