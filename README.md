# AvroraMU Event Manager

A production-ready university capstone application for discovering and managing MU Online events. AvroraMU combines public event discovery with authenticated player registrations, comments, profile management, administrator workflows, secure file uploads, and PostgreSQL Row-Level Security.

> **Live demo:** `https://YOUR-DEPLOYMENT.vercel.app`  
> **GitHub repository:** `https://github.com/YOUR-USERNAME/avroramu-event-manager`

## Main features

- Responsive dark-fantasy interface built with Bootstrap 5 and custom CSS
- Eight genuinely separate HTML pages with direct URL navigation
- Searchable, category-filtered active event catalogue
- Event capacity, registration, PDF rules, and comments
- Supabase email/password registration, login, persistent sessions, and logout
- User profiles with avatar upload and editable display name
- Personal registration history with pending-entry cancellation
- Role-aware navigation, protected pages, and an admin-only dashboard
- Event/category CRUD, event uploads, registration statuses, users, and statistics
- Database constraints, triggers, and complete RLS policies
- Vite multi-page production build and Vercel configuration
- Clear configuration warnings when Supabase variables are absent

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | HTML5, CSS3, vanilla JavaScript ES modules |
| UI | Bootstrap 5, Bootstrap Icons, custom responsive design |
| Tooling | Node.js, npm, Vite |
| Backend | Supabase PostgreSQL, Auth, Storage, REST API |
| Security | JWT authentication, RLS, constraints, triggers |
| Deployment | Vercel static Vite deployment |

No React, Vue, Angular, TypeScript, custom Node server, or frontend service-role key is used.

## Application pages

| Page | Access | Purpose |
| --- | --- | --- |
| `index.html` | Public | Hero, featured future events, features, and calls to action |
| `events.html` | Public | Active event list, title search, and category filter |
| `event-details.html?id=1` | Public / enhanced for users | Event details, capacity, registration, rules, comments |
| `login.html` | Public | Email/password login and destination-aware redirect |
| `register.html` | Public | Validated registration with full-name metadata |
| `profile.html` | Authenticated | Profile, avatar, role, and logout |
| `my-registrations.html` | Authenticated | User registrations and pending cancellation |
| `admin.html` | Admin | Statistics and administrative workflows |

## Architecture

```text
.
├── *.html                    # Eight Vite HTML entry points
├── src/
│   ├── assets/               # Local fallback SVG graphics
│   ├── components/           # Navbar, footer, cards, alerts, UI states
│   ├── pages/                # One controller per HTML page
│   ├── services/             # Supabase data/auth/storage modules
│   ├── styles/               # Shared visual system
│   └── utils/                # Guards, constants, validation, formatting
├── supabase/                 # Ordered database and security scripts
├── vite.config.js            # Multi-page Rollup inputs
└── vercel.json               # Vercel deployment settings
```

Page controllers handle DOM interaction. Reusable services own Supabase operations, while shared components render navigation, cards, alerts, loading, and empty states. User-provided names, comments, and registration details are assigned through `textContent`, not unsafe HTML interpolation.

## Database schema and relationships

The data model has five related public tables:

- `profiles` has a one-to-one relationship with `auth.users`; auth deletion cascades.
- `categories` has many `events`; deletion is restricted while in use.
- `events` belongs to a category and may record the admin who created it.
- `registrations` joins a player and event; `(event_id, user_id)` is unique.
- `comments` belongs to an event and a player.

Indexes cover foreign keys, active dates, statuses, comment timelines, and trigram title search. `updated_at` triggers maintain timestamps. A registration trigger serializes entries per event and rejects inactive, started, or full events, avoiding client-side capacity races.

## Authentication and authorization

Supabase Auth issues JWT-backed browser sessions. Registration passes `full_name` in `raw_user_meta_data`; an `auth.users` trigger creates the matching profile with role `user`.

Protected-page guards require a valid session. The admin guard also requires `role = 'admin'`. These guards improve UX; PostgreSQL RLS remains the security authority.

## Row-Level Security

RLS is enabled on every application table. `public.is_admin()` is a `SECURITY DEFINER` function with a fixed empty search path, avoiding recursive profile policies.

- Anonymous users read categories, active events, and comments.
- Authenticated users read display profiles and update only their profile.
- Users create comments as themselves and update/delete only their comments.
- Users see/create only their registrations and delete only their pending entries.
- A role-protection trigger blocks normal users from changing their own role.
- Admins have management policies and can see inactive events and all users/registrations.
- Event and category mutations require admin authority at database level.

## Supabase Storage

`storage.sql` creates three public buckets with server-enforced restrictions:

- `avatars`: images up to 5 MB; users write only inside their UUID folder.
- `event-images`: images up to 5 MB; only admins write.
- `event-files`: PDF files up to 10 MB; only admins write.

Uploads use UUID-based filenames. Public read policies enable images and rules downloads. The frontend also validates MIME type and size.

## Local installation

Requirements: a current Node.js LTS release, npm, and a Supabase project.

```bash
npm install
Copy-Item .env.example .env   # PowerShell
npm run dev
```

For macOS/Linux, use `cp .env.example .env`. Open the URL printed by Vite.

## Environment variables

Edit `.env` in the project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Find these in Supabase **Project Settings → API** (or API Keys). Use the public anonymous/publishable key, never the service-role/secret key. Restart Vite after changing `.env`.

## Supabase setup

Run these complete files in the Supabase SQL Editor, in order:

1. `supabase/schema.sql`
2. `supabase/policies.sql`
3. `supabase/storage.sql`
4. `supabase/sample-data.sql`

Then configure Site URL and redirect URLs under **Authentication → URL Configuration** for local and deployed origins. [SETUP.md](./SETUP.md) provides the exact chronological checklist.

## Administrator Setup and Testing

1. Register a normal user through the application.
2. Confirm the email if Supabase confirmation is enabled.
3. Replace `YOUR_EMAIL@example.com` in `supabase/make-admin.sql`.
4. Run the complete file in SQL Editor. It returns the promoted profile or raises a clear error.
5. Log out and back in, then open `admin.html`.
6. Run `supabase/verify-admin.sql` with the same email to verify the profile ID, name, email, role, and creation date.
7. Test creating, editing, activating/deactivating, and deleting an event.
8. Test category creation, editing, duplicate prevention, and safe deletion.
9. Register for an event with a normal user, then test admin approval/rejection and registration deletion.
10. Test changing another profile between `user` and `admin`; verify the signed-in admin is protected from self-demotion.
11. Upload a JPG/PNG/WebP event image and a PDF rules file, then open their public links from the event table.

Never expose a browser-accessible “make me admin” operation.

## Run and build

```bash
npm run dev       # Development server
npm run build     # Optimized multi-page build in dist/
npm run preview   # Preview the production build
```

## Vercel deployment

1. Push the repository to GitHub and import it in Vercel.
2. Use build command `npm run build` and output directory `dist`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel settings.
4. Deploy, then add the Vercel origin to Supabase Auth redirect URLs.
5. Verify direct access to every `.html` page, login, uploads, and downloads.

The Vite configuration includes every HTML file as an entry point. No server rewrite or Node API is required.

## Sample accounts

No fake auth users are inserted. Create accounts through `register.html`:

- Admin: `YOUR_ADMIN_EMAIL` / `YOUR_ADMIN_PASSWORD` (promote with `make-admin.sql`)
- User: `YOUR_USER_EMAIL` / `YOUR_USER_PASSWORD`

Never commit real passwords or a populated `.env`.

## Screenshots

Add screenshots before final submission:

- `docs/screenshots/home.png` — landing page
- `docs/screenshots/events.png` — event catalogue
- `docs/screenshots/event-details.png` — details and registration
- `docs/screenshots/profile.png` — player profile
- `docs/screenshots/admin.png` — admin dashboard

## Future improvements

- Email and in-app status notifications
- Server-side pagination through Supabase range queries
- Recurring events and tournament brackets
- Optional private rules files with signed URLs
- Automated browser and RLS regression tests
- Bulgarian and additional localization

## Author

`YOUR NAME` — university capstone project.

## License

Add the license required by your university or repository policy.
