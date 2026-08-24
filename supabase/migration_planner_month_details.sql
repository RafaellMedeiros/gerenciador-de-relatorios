-- One-time migration to bring an existing database in line with the
-- updated supabase/schema.sql. Run this once in the Supabase SQL Editor.
-- Safe to re-run (every statement is idempotent).

-- 1) planner_entries: replace the five free-text fields with a single
--    morning/afternoon split. The old "atividades" column is the closest
--    match, so its content is copied into atividades_manha before the old
--    columns are dropped. There is no equivalent for dificuldades,
--    ensinamentos, proximas_acoes and visitas_realizadas — that data is
--    lost. If you need to keep it, export those columns before running
--    this section.

alter table public.planner_entries
  add column if not exists atividades_manha text,
  add column if not exists atividades_tarde text;

update public.planner_entries
set atividades_manha = atividades
where atividades is not null and atividades_manha is null;

alter table public.planner_entries
  drop column if exists dificuldades,
  drop column if exists atividades,
  drop column if exists ensinamentos,
  drop column if exists proximas_acoes,
  drop column if exists visitas_realizadas;

-- 2) planner_month_reports: three new free-text fields for the month as a
--    whole.

alter table public.planner_month_reports
  add column if not exists planejamento text,
  add column if not exists licoes_aprendidas text,
  add column if not exists proximos_passos text;

-- 3) planner_month_attachments: new table for images attached to the month
--    as a whole, each with a caption.

create table if not exists public.planner_month_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  period date not null,
  image_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

alter table public.planner_month_attachments enable row level security;

drop policy if exists "select own month attachments" on public.planner_month_attachments;
create policy "select own month attachments" on public.planner_month_attachments
  for select using (auth.uid() = user_id);

drop policy if exists "select month attachments for ready reports, admins" on public.planner_month_attachments;
create policy "select month attachments for ready reports, admins" on public.planner_month_attachments
  for select using (
    public.current_user_role() in ('MASTER', 'ADM')
    and exists (
      select 1 from public.planner_month_reports r
      where r.user_id = planner_month_attachments.user_id
        and r.status = 'ready'
        and r.period = planner_month_attachments.period
    )
  );

drop policy if exists "insert own month attachments, current month only" on public.planner_month_attachments;
create policy "insert own month attachments, current month only" on public.planner_month_attachments
  for insert with check (
    auth.uid() = user_id
    and date_trunc('month', period) = date_trunc('month', now())
  );

drop policy if exists "delete own month attachments, current month only" on public.planner_month_attachments;
create policy "delete own month attachments, current month only" on public.planner_month_attachments
  for delete using (
    auth.uid() = user_id
    and date_trunc('month', period) = date_trunc('month', now())
  );

-- 4) Storage bucket for planner month attachments.

insert into storage.buckets (id, name, public)
values ('planner-attachments', 'planner-attachments', false)
on conflict (id) do nothing;

drop policy if exists "insert own planner attachments, current month only" on storage.objects;
create policy "insert own planner attachments, current month only" on storage.objects
  for insert with check (
    bucket_id = 'planner-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
    and date_trunc('month', ((storage.foldername(name))[2])::date) = date_trunc('month', now())
  );

drop policy if exists "select own planner attachments" on storage.objects;
create policy "select own planner attachments" on storage.objects
  for select using (
    bucket_id = 'planner-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "select planner attachments for ready reports, admins" on storage.objects;
create policy "select planner attachments for ready reports, admins" on storage.objects
  for select using (
    bucket_id = 'planner-attachments'
    and public.current_user_role() in ('MASTER', 'ADM')
    and exists (
      select 1 from public.planner_month_reports r
      where r.user_id::text = (storage.foldername(name))[1]
        and r.status = 'ready'
        and r.period = ((storage.foldername(name))[2])::date
    )
  );

drop policy if exists "delete own planner attachments, current month only" on storage.objects;
create policy "delete own planner attachments, current month only" on storage.objects
  for delete using (
    bucket_id = 'planner-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
    and date_trunc('month', ((storage.foldername(name))[2])::date) = date_trunc('month', now())
  );
