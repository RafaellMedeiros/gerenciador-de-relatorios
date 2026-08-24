-- One-time migration to bring an existing database in line with the
-- updated supabase/schema.sql. Run this once in the Supabase SQL Editor.
-- Safe to re-run (every statement is idempotent).

-- Allow MASTER/ADM to delete board posts (comments cascade automatically).

drop policy if exists "delete posts, admins only" on public.board_posts;
create policy "delete posts, admins only" on public.board_posts
  for delete using (public.current_user_role() in ('MASTER', 'ADM'));

-- Allow MASTER/ADM to delete the images stored for board posts.

drop policy if exists "delete board images, admins only" on storage.objects;
create policy "delete board images, admins only" on storage.objects
  for delete using (
    bucket_id = 'board-images'
    and public.current_user_role() in ('MASTER', 'ADM')
  );
