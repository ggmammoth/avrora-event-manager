# AvroraMU Exact Setup Checklist

Complete these steps in order. Run SQL files as complete scripts in Supabase SQL Editor.

## 1. Install dependencies

Install a current Node.js LTS release, open a terminal in the project root, and run:

```bash
npm install
```

## 2. Create a Supabase project

Create a Supabase project, select a nearby region, save the database password securely, and wait for provisioning. Never put the database password or service-role key in this frontend.

## 3. Run `schema.sql`

Open **SQL Editor → New query**, paste all of `supabase/schema.sql`, and run it. Confirm five public tables and the user-profile trigger exist.

## 4. Run `policies.sql`

Run all of `supabase/policies.sql`. Confirm RLS is enabled for every public application table.

## 5. Run `storage.sql`

Run all of `supabase/storage.sql`. Confirm the public `avatars`, `event-images`, and `event-files` buckets appear under Storage.

## 6. Run `sample-data.sql`

Run all of `supabase/sample-data.sql`. Confirm four categories and six events. It deliberately creates no fake Auth users.

## 7. Copy the Supabase URL and anon key

Open **Project Settings → API** (or **API Keys**) and copy the Project URL and public `anon`/publishable key. Never use the `service_role` or secret key.

## 8. Create `.env`

In the project root:

```powershell
Copy-Item .env.example .env
```

Replace the placeholders:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

`.env` is ignored by Git.

## 9. Start the application

```bash
npm run dev
```

Open the URL Vite prints, normally `http://localhost:5173`. Add the local origin in Supabase **Authentication → URL Configuration** as the Site URL and an allowed redirect URL.

## 10. Register a user

Use `register.html`. If email confirmation is enabled, open the confirmation link. Verify `public.profiles` automatically contains the user with role `user`.

## 11. Run `make-admin.sql`

Replace `YOUR_EMAIL@example.com` in `supabase/make-admin.sql` with the registered email and run the whole file. It must return the promoted profile with role `admin`. Optionally set the same email in `supabase/verify-admin.sql` and run it for an independent check. Log out and back in.

## 12. Test the admin panel

Open `admin.html` and verify statistics; event/category CRUD; image/PDF upload; registration status changes; user role changes; and that the current admin cannot demote themselves in the UI. Also test logged-out and normal-user access.

## 13. Build the project

```bash
npm run build
npm run preview
```

Open every page directly from the preview URL. Output is written to `dist/`.

## 14. Deploy to Vercel

Push to GitHub, import in Vercel, choose Vite, use `npm run build`, and output `dist`. Add both `VITE_` environment variables before deployment. Add the production origin to Supabase Auth URLs, redeploy after variable changes, and test each direct `.html` route.
