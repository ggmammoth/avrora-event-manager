# Create the Public Demo User

The README publishes these intentionally non-sensitive demonstration credentials:

- Email: `demo.user@avroramu.test`
- Password: `AvroraDemo2026!`
- Expected role: `user`

Do not use this password for any personal, administrator, email, GitHub, Netlify, or Supabase account.

## Create the user without sending email

1. Open the connected project in Supabase Dashboard.
2. Open **Authentication → Users**.
3. Select **Add user** / **Create new user**.
4. Enter the demo email and password above.
5. Enable **Auto Confirm User** so Supabase does not send a confirmation email through the rate-limited test SMTP service.
6. Create the user.

The existing `on_auth_user_created` trigger automatically creates the matching `public.profiles` row with role `user`. Do not promote this public account to administrator.

## Verify the profile

Run this read-only query in Supabase SQL Editor:

```sql
select
  p.id,
  p.full_name,
  p.role,
  p.created_at
from public.profiles p
join auth.users u on u.id = p.id
where lower(u.email) = lower('demo.user@avroramu.test');
```

Expected result: exactly one profile row with role `user`.

If the account already exists, do not create a duplicate. Use the Dashboard's password reset/update action, keep it auto-confirmed, and ensure the profile role remains `user`.

## Test

1. Log out of any existing account on the Netlify site.
2. Open `/login.html`.
3. Sign in with the public demo credentials.
4. Verify Profile, My Registrations, comments, and reactions.
5. Confirm that Admin Panel is not shown.
