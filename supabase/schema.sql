-- Reference copy of what to run manually in the Supabase SQL Editor.
-- No migration tool is configured for this project — this file documents
-- the schema, it is not applied automatically.

-- User roles and profiles.

create type public.user_role as enum ('MASTER', 'ADM', 'COLABORADOR');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  regional_health_department text,
  phone text,
  role public.user_role not null,
  must_change_password boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Only one MASTER account is allowed in the system.
create unique index one_master_only on public.profiles (role) where role = 'MASTER';

-- Security definer so RLS policies on profiles can check the caller's role
-- without recursively evaluating the select policy on profiles itself.
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

alter table public.profiles enable row level security;

create policy "select own profile or global for admins" on public.profiles
  for select using (
    auth.uid() = id or public.current_user_role() in ('MASTER', 'ADM')
  );

create policy "update own profile or any for master" on public.profiles
  for update using (
    auth.uid() = id or public.current_user_role() = 'MASTER'
  );

-- No insert/delete policy for the authenticated role: account provisioning
-- only happens server-side via the service_role client, which bypasses RLS.

-- Planner: daily entries filled by a COLABORADOR.

create table public.planner_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  entry_date date not null,
  dificuldades text,
  atividades text,
  ensinamentos text,
  proximas_acoes text,
  visitas_realizadas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

alter table public.planner_entries enable row level security;

create policy "select own planner entries" on public.planner_entries
  for select using (auth.uid() = user_id);

-- Insert/update are restricted to the current calendar month — defense in
-- depth for the "days lock once the month rolls over" business rule; the UI
-- itself only ever shows/edits the current month.
create policy "insert own planner entries, current month only" on public.planner_entries
  for insert with check (
    auth.uid() = user_id
    and date_trunc('month', entry_date) = date_trunc('month', now())
  );

create policy "update own planner entries, current month only" on public.planner_entries
  for update using (
    auth.uid() = user_id
    and date_trunc('month', entry_date) = date_trunc('month', now())
  );

-- The report unit is the whole month, not a single day: a COLABORADOR flips
-- this to 'ready' once for the current month, which is what makes that
-- month's planner entries visible to ADM/MASTER on the Relatórios screen.

create table public.planner_month_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  period date not null, -- first day of the month, e.g. 2026-08-01
  status text not null default 'draft' check (status in ('draft', 'ready')),
  marked_ready_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period)
);

alter table public.planner_month_reports enable row level security;

create policy "select own month reports" on public.planner_month_reports
  for select using (auth.uid() = user_id);

create policy "select ready month reports, admins" on public.planner_month_reports
  for select using (
    status = 'ready' and public.current_user_role() in ('MASTER', 'ADM')
  );

create policy "insert own month reports, current month only" on public.planner_month_reports
  for insert with check (
    auth.uid() = user_id
    and date_trunc('month', period) = date_trunc('month', now())
  );

create policy "update own month reports, current month only" on public.planner_month_reports
  for update using (
    auth.uid() = user_id
    and date_trunc('month', period) = date_trunc('month', now())
  );

-- ADM/MASTER need to read the day-by-day content of a month once its report
-- has been marked ready, even though those rows belong to another user.
create policy "select planner entries for ready month reports, admins" on public.planner_entries
  for select using (
    public.current_user_role() in ('MASTER', 'ADM')
    and exists (
      select 1 from public.planner_month_reports r
      where r.user_id = planner_entries.user_id
        and r.status = 'ready'
        and date_trunc('month', r.period) = date_trunc('month', planner_entries.entry_date)
    )
  );

-- Home board: posts by MASTER/ADM, commentable by anyone.

create table public.board_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  caption text,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.board_posts enable row level security;

create policy "select posts, global" on public.board_posts
  for select using (auth.uid() is not null);

create policy "insert posts, admins only" on public.board_posts
  for insert with check (public.current_user_role() in ('MASTER', 'ADM'));

create policy "update posts, admins only" on public.board_posts
  for update using (public.current_user_role() in ('MASTER', 'ADM'));

create table public.board_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.board_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.board_comments enable row level security;

create policy "select comments, global" on public.board_comments
  for select using (auth.uid() is not null);

create policy "insert comments, any authenticated user" on public.board_comments
  for insert with check (auth.uid() = author_id);

-- Storage bucket for board post images.

insert into storage.buckets (id, name, public)
values ('board-images', 'board-images', false)
on conflict (id) do nothing;

create policy "insert board images, admins only" on storage.objects
  for insert with check (
    bucket_id = 'board-images'
    and public.current_user_role() in ('MASTER', 'ADM')
  );

create policy "read board images, any authenticated user" on storage.objects
  for select using (bucket_id = 'board-images' and auth.uid() is not null);
