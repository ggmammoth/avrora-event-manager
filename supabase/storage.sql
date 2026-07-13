-- AvroraMU Event Manager: public Storage buckets and object policies
-- Run third, after policies.sql.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('event-images', 'event-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('event-files', 'event-files', true, 10485760, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view AvroraMU files" on storage.objects;
drop policy if exists "Users can upload own avatars" on storage.objects;
drop policy if exists "Users can update own avatars" on storage.objects;
drop policy if exists "Users can delete own avatars" on storage.objects;
drop policy if exists "Admins can upload event files" on storage.objects;
drop policy if exists "Admins can update event files" on storage.objects;
drop policy if exists "Admins can delete event files" on storage.objects;

create policy "Public can view AvroraMU files" on storage.objects for select to public
using (bucket_id in ('avatars', 'event-images', 'event-files'));

create policy "Users can upload own avatars" on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users can update own avatars" on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users can delete own avatars" on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Admins can upload event files" on storage.objects for insert to authenticated
with check (bucket_id in ('event-images', 'event-files') and public.is_admin());
create policy "Admins can update event files" on storage.objects for update to authenticated
using (bucket_id in ('event-images', 'event-files') and public.is_admin())
with check (bucket_id in ('event-images', 'event-files') and public.is_admin());
create policy "Admins can delete event files" on storage.objects for delete to authenticated
using (bucket_id in ('event-images', 'event-files') and public.is_admin());
