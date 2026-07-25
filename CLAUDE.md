# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

ViverJunto is a Portuguese-language (pt-BR) mobile-first web app for couples/households to
manage shared life: finances, chores/routines, shopping lists, and goals. It's a plain
Create React App (JavaScript, no TypeScript) using React Router v6 for routing and Supabase
for auth + Postgres backend, deployed to Vercel.

## Commands

```bash
npm install       # install dependencies
npm start         # dev server (react-scripts start), http://localhost:3000
npm run build     # production build -> build/
```

There is no lint script, no test script, and no test files in the repo — don't assume a test
suite exists. `react-scripts` ships CRA's default ESLint config but it isn't wired into an npm
script. Deployment is via Vercel (`vercel --prod`, or automatic on push per `vercel.json`);
`.vercel/project.json` links this repo to the `viverjunto` Vercel project.

`atualizar.sh` is a legacy update script (unzips `viverjunto-parte1.zip` into the repo, commits,
pushes) from before this was a normal git workflow. It's not part of the current dev loop — just
edit files directly and use git normally.

## Architecture

### Routing & auth gating (`src/App.jsx`)

All routes are declared in one file, wrapped in three guard components:
- `PublicRoute` — redirects to `/dashboard` if already logged in (login/signup pages).
- `PrivateRoute` — redirects to `/login` if not logged in; if logged in but
  `profile.setup_completed` is false, redirects into the onboarding wizard at `/objetivos`.
- `SetupRoute` — always accessible while `useAuth()` is loading; used for the onboarding wizard
  screens themselves.

`/financas`, `/rotina`, `/compras`, `/metas`, `/perfil` are currently `PlaceholderPage`
stand-ins (routes exist, features don't) — check `App.jsx` before assuming a section is built.

### Auth/data layer (`src/hooks/useAuth.jsx`)

A single `AuthProvider` (React context, `useAuth()`) is the source of truth for `user`,
`profile` (row from `profiles`), and `household` (joined via `household_members` →
`households`, includes the caller's `role`). On mount and on every `onAuthStateChange` event it
reloads `profile` + `household` from Supabase. Pages read auth/household state from this hook
rather than querying Supabase directly for identity; they do query Supabase directly for
domain data (e.g. `Dashboard.jsx` queries `transactions`, `tasks`, `goals` scoped by
`household.id`).

`completeSetup(tipo)` sets `profiles.setup_completed = true` — this is the flag `PrivateRoute`
checks. Note that most onboarding wizard screens (`TipoDeUso`, `ObjetivosIniciais`,
`ConfigFinanceira`) currently only manage local component state and never call Supabase;
`completeSetup()` is called once, at the very end of `ConfigRotina.jsx`. Don't assume choices
made earlier in the wizard are persisted unless you check.

### Onboarding wizard flow

Linear sequence (see route paths in `App.jsx`): `/` (SplashScreen) → `/boas-vindas` →
`/carrossel` → `/cadastro` (signup) → `/confirmar` (email confirmation, reads the Supabase
session out of the URL hash) → `/tipo-de-uso` → `/convidar-parceiro` → `/objetivos` →
`/config-financeira` → `/config-rotina` (persists `setup_completed`) → `/dashboard`.

### Supabase (`src/lib/supabase.js`)

The client is created with a hardcoded project URL + anon key in source (not read from
`process.env`), even though the README describes an optional `REACT_APP_SUPABASE_*`
`.env.local` setup — that env-based path isn't actually wired up in code. Backend tables (all
RLS-enabled): `profiles`, `households`, `household_members`, `tasks`, `transactions`, `goals`,
`shopping_items`, `checkins`, `invites`. Most domain queries filter by `household_id`.

### Styling

`src/styles/global.css` defines a design-token system (CSS custom properties for the
coral/teal/amber/cream palette, radii, shadows) plus reusable utility classes (`.btn-*`,
`.card`, `.input-field`, `.pill-*`, `.bottom-nav`, etc.), and `.app-container` fixes the layout
to a 430px-wide mobile frame centered on the page.

In practice, most page components (especially onboarding screens and `Auth.jsx`) don't use
those utility classes — they use large inline `style={{...}}` objects with absolute positioning
and pixel values copied directly from Figma frames (fixed `852px`-tall screens, hardcoded "9:41"
status-bar mocks, literal hex colors instead of the CSS variables). Several onboarding files
reference remote asset URLs of the form `https://www.figma.com/api/mcp/asset/<uuid>` — these are
Figma Dev Mode MCP asset exports; if one 404s or needs replacing, it should come from Figma
(Figma MCP tools / `/figma-*` skills), not from a local `public/` asset. When editing these
screens, prefer matching the existing inline pixel-perfect style rather than migrating them to
the `global.css` utility classes, unless asked to do that refactor explicitly.

New shared components/pages will more consistently use `global.css` tokens and utilities
(`Dashboard.jsx`'s `BottomNav`/`EmptyCard`/`QuickAction` are a middle ground: still inline
styles, but referencing the same color values as the CSS variables).
