-- AvroraMU Event Manager: RLS functions and policies
-- Run second, after schema.sql.

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.get_event_registration_count(bigint) from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.get_event_registration_count(bigint) to anon, authenticated;

create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- auth.uid() is null only for trusted direct database work such as SQL Editor.
  -- Browser/API sessions always have a JWT subject and must pass is_admin().
  if (select auth.uid()) is not null and not public.is_admin() then
    if old.role is distinct from new.role then
      raise exception 'Only administrators can change user roles';
    end if;
    if old.created_at is distinct from new.created_at then
      raise exception 'Account creation date cannot be changed';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles
for each row execute function public.protect_profile_role();

-- Admin-only directory for registration management. The frontend never queries
-- auth.users directly and receives only the email needed by the admin table.
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
language plpgsql stable security definer set search_path = '' as $$
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

-- Centralized role mutation adds a second protection layer against self-demotion.
create or replace function public.admin_set_user_role(target_user_id uuid, new_role text)
returns public.profiles
language plpgsql security definer set search_path = '' as $$
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
    raise exception 'You cannot remove your own administrator role' using errcode = '42501';
  end if;
  update public.profiles
  set role = new_role, updated_at = now()
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

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.comments enable row level security;

-- Re-running this file is safe.
drop policy if exists "Authenticated users can read profiles" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Admins can insert profiles" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;
drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Authenticated users can read profiles" on public.profiles for select to authenticated using (true);
create policy "Users can update their own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Admins can insert profiles" on public.profiles for insert to authenticated with check (public.is_admin());
create policy "Admins can update profiles" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete profiles" on public.profiles for delete to authenticated using (public.is_admin());

drop policy if exists "Everyone can read categories" on public.categories;
drop policy if exists "Admins can create categories" on public.categories;
drop policy if exists "Admins can update categories" on public.categories;
drop policy if exists "Admins can delete categories" on public.categories;
create policy "Everyone can read categories" on public.categories for select to anon, authenticated using (true);
create policy "Admins can create categories" on public.categories for insert to authenticated with check (public.is_admin());
create policy "Admins can update categories" on public.categories for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete categories" on public.categories for delete to authenticated using (public.is_admin());

drop policy if exists "Public can read active events" on public.events;
drop policy if exists "Admins can read all events" on public.events;
drop policy if exists "Admins can create events" on public.events;
drop policy if exists "Admins can update events" on public.events;
drop policy if exists "Admins can delete events" on public.events;
create policy "Public can read active events" on public.events for select to anon, authenticated using (is_active = true);
create policy "Admins can read all events" on public.events for select to authenticated using (public.is_admin());
create policy "Admins can create events" on public.events for insert to authenticated with check (public.is_admin());
create policy "Admins can update events" on public.events for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete events" on public.events for delete to authenticated using (public.is_admin());

drop policy if exists "Users can read own registrations" on public.registrations;
drop policy if exists "Users can create own registrations" on public.registrations;
drop policy if exists "Users can cancel pending registrations" on public.registrations;
drop policy if exists "Admins can read all registrations" on public.registrations;
drop policy if exists "Admins can create registrations" on public.registrations;
drop policy if exists "Admins can update registrations" on public.registrations;
drop policy if exists "Admins can delete registrations" on public.registrations;
create policy "Users can read own registrations" on public.registrations for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create own registrations" on public.registrations for insert to authenticated with check ((select auth.uid()) = user_id and status = 'pending');
create policy "Users can cancel pending registrations" on public.registrations for delete to authenticated using ((select auth.uid()) = user_id and status = 'pending');
create policy "Admins can read all registrations" on public.registrations for select to authenticated using (public.is_admin());
create policy "Admins can create registrations" on public.registrations for insert to authenticated with check (public.is_admin());
create policy "Admins can update registrations" on public.registrations for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete registrations" on public.registrations for delete to authenticated using (public.is_admin());

drop policy if exists "Everyone can read comments" on public.comments;
drop policy if exists "Users can create own comments" on public.comments;
drop policy if exists "Users can update own comments" on public.comments;
drop policy if exists "Users can delete own comments" on public.comments;
drop policy if exists "Admins can create comments" on public.comments;
drop policy if exists "Admins can update comments" on public.comments;
drop policy if exists "Admins can delete comments" on public.comments;
create policy "Everyone can read comments" on public.comments for select to anon, authenticated using (true);
create policy "Users can create own comments" on public.comments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own comments" on public.comments for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own comments" on public.comments for delete to authenticated using ((select auth.uid()) = user_id);
create policy "Admins can create comments" on public.comments for insert to authenticated with check (public.is_admin());
create policy "Admins can update comments" on public.comments for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete comments" on public.comments for delete to authenticated using (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.events, public.comments to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
