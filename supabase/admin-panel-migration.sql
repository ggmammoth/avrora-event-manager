-- AvroraMU Event Manager
-- Safe incremental migration for the completed administrator panel.
-- This migration preserves every existing table row, Auth user, and Storage object.

begin;

-- ============================================================================
-- 1. HELPER FUNCTIONS
-- ============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Protect privileged profile fields for every direct table update. Normal users
-- may edit their own full_name/avatar_url, but cannot change role or created_at.
-- Administrators cannot demote their own currently authenticated account.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null then
    if old.id = (select auth.uid())
       and old.role = 'admin'
       and new.role <> 'admin' then
      raise exception 'You cannot remove your own administrator role'
        using errcode = '42501';
    end if;

    if old.role is distinct from new.role and not public.is_admin() then
      raise exception 'Only administrators can change user roles'
        using errcode = '42501';
    end if;

    if old.created_at is distinct from new.created_at and not public.is_admin() then
      raise exception 'Account creation date cannot be changed'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.protect_profile_role() from public;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
before update on public.profiles
for each row execute function public.protect_profile_role();

-- ============================================================================
-- 2. ADMIN RPC FUNCTIONS
-- ============================================================================

-- Matches: supabase.rpc('get_admin_registrations')
-- Email is exposed only through this admin-checked function. The browser never
-- queries auth.users directly and no service-role key is required.
create or replace function public.get_admin_registrations()
returns table (
  registration_id bigint,
  event_id bigint,
  event_title text,
  user_id uuid,
  player_full_name text,
  player_email text,
  character_name text,
  character_class text,
  status text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  return query
  select
    r.id,
    r.event_id,
    e.title,
    r.user_id,
    p.full_name,
    u.email::text,
    r.character_name,
    r.character_class,
    r.status,
    r.created_at
  from public.registrations r
  join public.events e on e.id = r.event_id
  join public.profiles p on p.id = r.user_id
  join auth.users u on u.id = r.user_id
  order by r.created_at desc
  limit 200;
end;
$$;

-- Matches: supabase.rpc('admin_set_user_role', {
--   target_user_id: id, new_role: role
-- })
create or replace function public.admin_set_user_role(
  target_user_id uuid,
  new_role text
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_profile public.profiles;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  if new_role not in ('user', 'admin') then
    raise exception 'Invalid user role' using errcode = '22023';
  end if;

  if target_user_id = (select auth.uid()) and new_role <> 'admin' then
    raise exception 'You cannot remove your own administrator role'
      using errcode = '42501';
  end if;

  update public.profiles
  set role = new_role,
      updated_at = now()
  where id = target_user_id
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'User profile not found' using errcode = 'P0002';
  end if;

  return updated_profile;
end;
$$;

revoke all on function public.get_admin_registrations() from public;
revoke all on function public.admin_set_user_role(uuid, text) from public;
grant execute on function public.get_admin_registrations() to authenticated;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;

-- ============================================================================
-- 3. PROFILE POLICIES
-- ============================================================================

alter table public.profiles enable row level security;

drop policy if exists "Authenticated users can read profiles" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Admins can insert profiles" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;
drop policy if exists "Admins can delete profiles" on public.profiles;

create policy "Authenticated users can read profiles"
on public.profiles for select to authenticated
using (true);

create policy "Users can update their own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Admins can insert profiles"
on public.profiles for insert to authenticated
with check (public.is_admin());

create policy "Admins can update profiles"
on public.profiles for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete profiles"
on public.profiles for delete to authenticated
using (public.is_admin());

-- ============================================================================
-- 4. EVENT POLICIES
-- ============================================================================

alter table public.events enable row level security;

drop policy if exists "Public can read active events" on public.events;
drop policy if exists "Admins can read all events" on public.events;
drop policy if exists "Admins can create events" on public.events;
drop policy if exists "Admins can update events" on public.events;
drop policy if exists "Admins can delete events" on public.events;

create policy "Public can read active events"
on public.events for select to anon, authenticated
using (is_active = true);

create policy "Admins can read all events"
on public.events for select to authenticated
using (public.is_admin());

create policy "Admins can create events"
on public.events for insert to authenticated
with check (public.is_admin());

create policy "Admins can update events"
on public.events for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete events"
on public.events for delete to authenticated
using (public.is_admin());

-- ============================================================================
-- 5. CATEGORY POLICIES
-- ============================================================================

alter table public.categories enable row level security;

drop policy if exists "Everyone can read categories" on public.categories;
drop policy if exists "Admins can create categories" on public.categories;
drop policy if exists "Admins can update categories" on public.categories;
drop policy if exists "Admins can delete categories" on public.categories;

create policy "Everyone can read categories"
on public.categories for select to anon, authenticated
using (true);

create policy "Admins can create categories"
on public.categories for insert to authenticated
with check (public.is_admin());

create policy "Admins can update categories"
on public.categories for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete categories"
on public.categories for delete to authenticated
using (public.is_admin());

-- ============================================================================
-- 6. REGISTRATION POLICIES
-- ============================================================================

alter table public.registrations enable row level security;

drop policy if exists "Users can read own registrations" on public.registrations;
drop policy if exists "Users can create own registrations" on public.registrations;
drop policy if exists "Users can cancel pending registrations" on public.registrations;
drop policy if exists "Admins can read all registrations" on public.registrations;
drop policy if exists "Admins can create registrations" on public.registrations;
drop policy if exists "Admins can update registrations" on public.registrations;
drop policy if exists "Admins can delete registrations" on public.registrations;

create policy "Users can read own registrations"
on public.registrations for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create own registrations"
on public.registrations for insert to authenticated
with check ((select auth.uid()) = user_id and status = 'pending');

create policy "Users can cancel pending registrations"
on public.registrations for delete to authenticated
using ((select auth.uid()) = user_id and status = 'pending');

create policy "Admins can read all registrations"
on public.registrations for select to authenticated
using (public.is_admin());

create policy "Admins can create registrations"
on public.registrations for insert to authenticated
with check (public.is_admin());

create policy "Admins can update registrations"
on public.registrations for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete registrations"
on public.registrations for delete to authenticated
using (public.is_admin());

-- ============================================================================
-- 7. COMMENT POLICIES
-- ============================================================================

alter table public.comments enable row level security;

drop policy if exists "Everyone can read comments" on public.comments;
drop policy if exists "Users can create own comments" on public.comments;
drop policy if exists "Users can update own comments" on public.comments;
drop policy if exists "Users can delete own comments" on public.comments;
drop policy if exists "Admins can create comments" on public.comments;
drop policy if exists "Admins can update comments" on public.comments;
drop policy if exists "Admins can delete comments" on public.comments;

create policy "Everyone can read comments"
on public.comments for select to anon, authenticated
using (true);

create policy "Users can create own comments"
on public.comments for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own comments"
on public.comments for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own comments"
on public.comments for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Admins can create comments"
on public.comments for insert to authenticated
with check (public.is_admin());

create policy "Admins can update comments"
on public.comments for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete comments"
on public.comments for delete to authenticated
using (public.is_admin());

-- ============================================================================
-- 8. STORAGE POLICIES
-- ============================================================================

-- Upsert changes only bucket configuration. Existing Storage objects remain
-- untouched. The MIME and size limits mirror the frontend validators.
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

-- Remove the previous combined admin policies before installing bucket-specific
-- policies. No Storage object is removed by dropping a policy.
drop policy if exists "Admins can upload event files" on storage.objects;
drop policy if exists "Admins can update event files" on storage.objects;
drop policy if exists "Admins can delete event files" on storage.objects;
drop policy if exists "Admins can upload event images" on storage.objects;
drop policy if exists "Admins can update event images" on storage.objects;
drop policy if exists "Admins can delete event images" on storage.objects;
drop policy if exists "Admins can upload event PDF files" on storage.objects;
drop policy if exists "Admins can update event PDF files" on storage.objects;
drop policy if exists "Admins can delete event PDF files" on storage.objects;

create policy "Public can view AvroraMU files"
on storage.objects for select to public
using (bucket_id in ('avatars', 'event-images', 'event-files'));

-- storage-service.js writes avatars/<auth-user-id>/<unique-file-name>.
create policy "Users can upload own avatars"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can update own avatars"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can delete own avatars"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- storage-service.js writes event-images/events/<user-id>-<timestamp>-<name>.
create policy "Admins can upload event images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = 'events'
  and public.is_admin()
);

create policy "Admins can update event images"
on storage.objects for update to authenticated
using (bucket_id = 'event-images' and public.is_admin())
with check (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = 'events'
  and public.is_admin()
);

create policy "Admins can delete event images"
on storage.objects for delete to authenticated
using (bucket_id = 'event-images' and public.is_admin());

-- storage-service.js writes event-files/rules/<user-id>-<timestamp>-<name>.
create policy "Admins can upload event PDF files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'event-files'
  and (storage.foldername(name))[1] = 'rules'
  and public.is_admin()
);

create policy "Admins can update event PDF files"
on storage.objects for update to authenticated
using (bucket_id = 'event-files' and public.is_admin())
with check (
  bucket_id = 'event-files'
  and (storage.foldername(name))[1] = 'rules'
  and public.is_admin()
);

create policy "Admins can delete event PDF files"
on storage.objects for delete to authenticated
using (bucket_id = 'event-files' and public.is_admin());

-- ============================================================================
-- 9. GRANTS
-- ============================================================================

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.events, public.comments to anon;
grant select, insert, update, delete on
  public.profiles,
  public.categories,
  public.events,
  public.registrations,
  public.comments
to authenticated;
grant usage, select on all sequences in schema public to authenticated;

commit;

-- ============================================================================
-- 10. VERIFICATION QUERIES (READ-ONLY)
-- ============================================================================

select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as parameters,
  p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_admin', 'get_admin_registrations', 'admin_set_user_role')
order by p.proname;

select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('avatars', 'event-images', 'event-files')
order by id;

select schemaname, tablename, policyname, cmd, roles
from pg_policies
where (schemaname = 'public' and tablename in ('profiles', 'categories', 'events', 'registrations', 'comments'))
   or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;
