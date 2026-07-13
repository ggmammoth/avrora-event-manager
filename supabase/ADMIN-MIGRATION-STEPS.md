# Safe Admin Panel Migration

This guide applies only the administrator functions, trigger, RLS policies, grants, and Storage policies required by the completed admin panel. It does not recreate tables, alter IDs, insert sample data, remove Auth users, or delete existing application/Storage data.

## 1. Back up or inspect existing data

In Supabase Dashboard, review the Table Editor and optionally create a database backup before changing security policies. Confirm that existing rows are present in `profiles`, `categories`, `events`, `registrations`, and `comments`.

Expected result: existing record counts and Auth users are known before migration. No data has changed.

## 2. Run `admin-panel-migration.sql`

Open Supabase **SQL Editor → New query**, paste the complete contents of `supabase/admin-panel-migration.sql`, and run it once.

Expected result:

- The query completes with `Success. No rows returned` for DDL statements, followed by read-only verification result sets.
- Verification lists `is_admin`, `get_admin_registrations`, and `admin_set_user_role`.
- The three Storage buckets are listed as public with their expected file limits.
- Policies are listed for all five public tables and `storage.objects`.
- Existing table rows, Auth users, and Storage files remain unchanged.

If any statement fails, the transaction rolls back all database function/table-policy changes before `commit`. Copy the exact Supabase error before retrying.

## 3. Run `make-admin.sql`

Open a new SQL Editor query, paste the complete contents of `supabase/make-admin.sql`, and run it. It is already configured for `nereajl3n@gmail.com`.

Expected result: exactly one result row containing the profile ID, full name, email, role `admin`, and updated timestamp. Running the file again is safe and returns the same account as `admin`.

## 4. Run `verify-admin.sql`

Open a new query, paste `supabase/verify-admin.sql`, and run it.

Expected result: one row for `nereajl3n@gmail.com` with profile ID, full name, email, role `admin`, and account creation timestamp. Zero rows means either the email is not registered or its profile row is missing.

## 5. Log out of the application

Use the navbar **Logout** button. This clears the current browser session state.

Expected result: the navbar shows **Register** and **Login**, and protected links disappear.

## 6. Log in again

Sign in with `nereajl3n@gmail.com` and the existing account password.

Expected result: the navbar shows the user's name, Profile, My Registrations, Logout, and **Admin Panel**.

## 7. Open `admin.html`

Open `/admin.html` from the Admin Panel navigation link.

Expected result: no redirect occurs and the five admin sections become available.

## 8. Test statistics

Open Dashboard and use **Refresh**.

Expected result: total users, events, registrations, comments, active events, and pending registrations display numeric values (including zero when a table is empty).

## 9. Test event CRUD

Create a future event with a category and positive participant limit. Edit it, activate/deactivate it, and delete it after confirming the dialog.

Expected result: every mutation refreshes the table and statistics; inactive events remain visible to the administrator.

## 10. Test category CRUD

Create and edit a category. Try a duplicate name and try deleting a category used by an event.

Expected result: valid changes succeed; duplicates and referenced-category deletion show readable errors.

## 11. Test registration status changes

Change an existing registration between `pending`, `approved`, and `rejected`, then test confirmed deletion on a disposable registration.

Expected result: the exact database status is shown after refresh and pending statistics update.

## 12. Test user role changes

Change another user's role from `user` to `admin` and back.

Expected result: the table updates immediately. The signed-in administrator's own role is marked protected and cannot be demoted through either the UI or RPC.

## 13. Test image and PDF uploads

Edit or create an event. Upload a JPG/PNG/WebP image up to 5 MB and a PDF up to 10 MB.

Expected result: the files upload into `event-images/events/…` and `event-files/rules/…`; their public Image and Rules links open from the event table. Non-admin uploads are rejected by Storage RLS.
