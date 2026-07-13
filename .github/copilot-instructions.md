# AvroraMU Event Manager — Agent Instructions

## Project context

AvroraMU Event Manager is a university capstone multi-page application for MU Online events. It uses HTML5, CSS3, vanilla JavaScript ES modules, Bootstrap 5, Vite, and Supabase. Netlify deploys the `main` branch using `netlify.toml`.

## Non-negotiable technology constraints

- Keep the frontend framework-free: do not add React, Vue, Angular, TypeScript, or a client-side router.
- Keep every application screen as a separate root HTML file and include it in `vite.config.js`.
- Use the existing modular structure under `src/components`, `src/pages`, `src/services`, `src/styles`, and `src/utils`.
- Supabase PostgreSQL, Auth, and Storage are the backend. Do not add a custom Node server or server-side API.
- Never place a Supabase secret/service-role key, database password, GitHub token, Netlify token, or real private password in frontend code or committed files.
- Frontend code may use only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the ignored local `.env` file.

## Architecture and coding conventions

- Page controllers coordinate DOM behavior; Supabase operations belong in reusable service modules.
- Shared navigation, footer, cards, loading states, and alerts belong in `src/components`.
- Authentication/administrator protection belongs in reusable guards under `src/utils`.
- Use `async`/`await`, `try`/`catch`, disabled submit buttons, and clear loading/error/empty/success states.
- Render user-generated names, comments, character data, and descriptions with `textContent`. Do not interpolate untrusted content into `innerHTML`.
- Keep Bootstrap markup responsive and accessible. Add labels, meaningful button text or `aria-label`, keyboard focus states, and mobile table wrappers.
- Reuse constants, validators, formatters, and fallback assets rather than duplicating values.
- Import code-used assets through Vite (`import ... from './asset.svg?url'`) instead of runtime `/src/...` paths.

## Database and security rules

- Treat PostgreSQL RLS as the security boundary; frontend guards are only a user-experience layer.
- Use `auth.uid()` to bind user-owned rows. Normal users must never choose another `user_id` or change their own role.
- Administrator checks must use `public.is_admin()`, defined with `SECURITY DEFINER` and an explicit fixed `search_path`.
- Avoid recursive profile RLS policies. Protect role changes through the existing trigger/RPC design.
- Keep status and role values aligned with database constraints.
- Storage paths must remain compatible with `storage-service.js`: avatars under the user's UUID folder, event images under `events/`, and rule PDFs under `rules/`.
- Validate MIME type and size in the browser, while preserving Storage bucket restrictions and policies.

## Existing database changes

- The connected Supabase project contains real data. Never drop/truncate tables, reset Auth, delete existing rows, or rerun sample data as part of a feature.
- Add database changes through a focused, idempotent incremental SQL migration in `supabase/`.
- Use `create table if not exists`, `create or replace function`, `drop policy if exists`, and only a specifically named `drop trigger if exists` where appropriate.
- Update `schema.sql` and `policies.sql` as the canonical fresh-install definition, while providing an incremental migration for the live database.
- Do not insert fake rows directly into `auth.users` from SQL.

## Required verification

- Run `npm run build` after code changes and confirm all eight HTML entry points are emitted.
- Check imports, DOM selectors, exact Supabase column/RPC names, and the configuration-error path.
- Audit staged files before committing. `.env`, `node_modules`, `dist`, `.netlify`, logs, and editor files must remain ignored.
- Do not expose secret values in terminal output, documentation, commits, or final responses.

## Git and deployment workflow

- Make one honest, focused commit for each real change. Do not fabricate, split, backdate, amend, or rewrite history to satisfy grading metrics.
- Push completed commits to `main`; Netlify continuous deployment will build and publish `dist`.
- Confirm the Netlify deploy for the pushed commit reaches `ready` and verify affected live URLs.
- Use `npm run build` as the build command and `dist` as the publish directory. Do not add SPA redirects because this is a multi-page application.
