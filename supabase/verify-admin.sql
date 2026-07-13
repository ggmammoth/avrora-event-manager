-- Verify an AvroraMU administrator in Supabase SQL Editor.
-- Preconfigured for the registered university demonstration account.

with config(email) as (
  values ('nereajl3n@gmail.com'::text)
)
select
  p.id as profile_id,
  p.full_name,
  u.email,
  p.role,
  p.created_at
from config c
join auth.users u on lower(u.email) = lower(btrim(c.email))
join public.profiles p on p.id = u.id;
