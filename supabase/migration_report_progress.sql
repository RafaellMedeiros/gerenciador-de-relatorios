-- One-time migration to bring an existing database in line with the
-- updated supabase/schema.sql. Run this once in the Supabase SQL Editor.
-- Safe to re-run (create or replace).

-- The Relatórios screen needs to show every colaborador's status (not
-- started / started / ready) for the current month, but the existing RLS
-- policies only let MASTER/ADM select planner_month_reports/planner_entries
-- rows once status = 'ready' — draft rows and day entries stay invisible
-- until then. This function runs as security definer (like
-- current_user_role() already does) to look past those row policies, but
-- it only returns status metadata — never planejamento/licoes_aprendidas/
-- proximos_passos/atividades_* — so draft content stays hidden until the
-- colaborador marks the month ready, and it only returns rows at all when
-- the caller's own role is already MASTER or ADM.

create or replace function public.month_report_progress(p_period date)
returns table (
  user_id uuid,
  full_name text,
  status text,
  marked_ready_at timestamptz,
  last_activity_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    case
      when r.status = 'ready' then 'ready'
      when r.id is not null or e.entry_count > 0 then 'started'
      else 'not_started'
    end,
    r.marked_ready_at,
    greatest(r.updated_at, e.last_entry_at)
  from public.profiles p
  left join public.planner_month_reports r
    on r.user_id = p.id and r.period = p_period
  left join lateral (
    select count(*) as entry_count, max(pe.updated_at) as last_entry_at
    from public.planner_entries pe
    where pe.user_id = p.id
      and date_trunc('month', pe.entry_date) = date_trunc('month', p_period)
  ) e on true
  where p.role = 'COLABORADOR'
    and public.current_user_role() in ('MASTER', 'ADM')
  order by p.full_name
$$;
