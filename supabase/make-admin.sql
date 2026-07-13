-- AvroraMU administrator promotion
-- Run after the account has registered through register.html.
-- This file is preconfigured for the registered university demonstration account.

create or replace function pg_temp.promote_avroramu_admin(account_email text)
returns table (
  profile_id uuid,
  full_name text,
  email text,
  role text,
  updated_at timestamptz
)
language plpgsql as $$
declare
  matching_user_id uuid;
begin
  select u.id into matching_user_id
  from auth.users u
  where lower(u.email) = lower(btrim(account_email));

  if matching_user_id is null then
    raise exception 'No registered Supabase Auth user found for email: %', account_email;
  end if;

  update public.profiles p
  set role = 'admin', updated_at = now()
  where p.id = matching_user_id;

  if not found then
    raise exception 'Auth user exists, but the matching public.profiles row is missing for: %', account_email;
  end if;

  return query
  select p.id, p.full_name, u.email::text, p.role, p.updated_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id = matching_user_id;
end;
$$;

select * from pg_temp.promote_avroramu_admin('nereajl3n@gmail.com');
