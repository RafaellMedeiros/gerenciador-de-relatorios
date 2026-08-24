<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: Gerenciador de Relatórios

A report manager backed by Supabase (Auth, Postgres database, Storage).

- UI components: prioritize `shadcn/ui` primitives from `components/ui/` (Button, Card, Field, Input, etc.) over hand-rolled markup or other component libraries. Only add a new `components/ui/*` primitive via `npx shadcn@latest add <component>` when nothing suitable already exists there.
- Auth/session: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (Server Components/Actions, `await cookies()`), `lib/supabase/middleware.ts` (session refresh, consumed by `proxy.ts`).
- Routing convention for this Next.js version: session refresh and route protection live in `proxy.ts` at the project root — the exported function must be named `proxy`, not `middleware` (this Next.js release renamed the `middleware.ts` file convention to `proxy.ts`).
- Protected pages live under the `app/(protected)/` route group (wrapped with `SiteHeader` + logout in `app/(protected)/layout.tsx`); `/login` and `/signup` are the public auth routes.
- Database/storage schema lives only in Supabase itself (no migration tool configured) — `supabase/schema.sql` is a tracked reference copy of what was run manually in the Supabase SQL Editor. Keep it in sync whenever you change a table/bucket/policy, and tell the user to re-run the diff in the SQL Editor.
- There is no standalone "reports" table — a report is a whole month, not a single day. `public.planner_month_reports` (one row per `user_id` + `period`, `period` being the first day of the month) holds the `status` (`draft`/`ready`) a COLABORADOR flips via the "Marcar mês como pronto" button on `/planner`. `public.planner_entries` has an extra admin-only select policy that exposes a user's day rows for a given month once that user's `planner_month_reports` row for the same month is `'ready'` — that's what lets `/reports` read the day-by-day content for MASTER/ADM. Any new table storing user data should follow the per-owner RLS pattern unless a feature explicitly requires shared/cross-user access.
- Roles/permissions: `public.profiles` (id references `auth.users`) stores `role` (`MASTER` | `ADM` | `COLABORADOR`) and `must_change_password`. There is no public signup — accounts are provisioned server-side via `lib/actions/users.ts`, which uses `lib/supabase/admin.ts` (service_role client, bypasses RLS). Only ever import `lib/supabase/admin.ts` from server actions, after checking the caller's role — never from client components. `lib/supabase/middleware.ts` force-redirects to `/change-password` whenever `must_change_password` is true.
- The one-time MASTER account is created with `npm run seed:master` (`scripts/create-master.mjs`), not through the app UI — it errors out if a MASTER profile already exists.

## Design system

This is a report management tool for the Ministério da Saúde — the visual language must stay light, calm and low-friction, never heavy or dark-by-default. All theme tokens live in `app/globals.css` (`:root` for light, `.dark` for dark) and are wired into Tailwind via the `@theme inline` block at the top of that file. Always consume colors through the semantic Tailwind classes (`bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border`, etc.) — never hardcode hex/oklch values in components.

- **Theme default**: `components/theme-provider.tsx` sets `defaultTheme="light"` on purpose so the app never opens dark just because the OS is in dark mode. `enableSystem` stays on and the `D` hotkey still toggles — don't revert the default back to `"system"`.
- **Palette intent**: soft cool blue/teal, not grayscale. `--primary` is a calm medium blue (`oklch(0.55 0.13 224)` light / `oklch(0.72 0.12 220)` dark), `--accent` is a soft mint/teal used for hover states and subtle backgrounds (`oklch(0.93 0.035 185)` light). `--background` is an almost-white cool tone (`oklch(0.99 0.004 240)`), never pure white or pure black — `--foreground` is a soft slate-blue, not `#000`.
- **Radius**: `--radius: 0.5rem` (light-footprint corners). Don't bump this back up to the old shadcn default of `0.625rem`.
- **Borders/shadows**: keep borders soft (`--border: oklch(0.9 0.012 235)` light) and avoid adding drop shadows or heavy rings for emphasis — use `bg-accent/40` hover states and thin borders instead.
- **Branding**: the app header (`components/site-header.tsx`) uses a `lucide-react` `HeartPulse` icon in a `bg-primary/10 text-primary` badge as the brand mark. Reuse this same badge pattern (icon in a tinted rounded square) if another header/brand touchpoint is ever added, rather than inventing a new style.
- **Auth pages**: `/login` and `/signup` use a subtle radial gradient background (`bg-[radial-gradient(circle_at_top,var(--accent)_0%,var(--background)_60%)]`) instead of flat white — reuse this exact gradient for any other full-page auth/marketing screen instead of a flat background.
- **Dark mode**: kept intentionally softer than shadcn's default — dark background is a navy-slate (`oklch(0.2 0.018 250)`), not near-black, so toggling dark mode never feels heavy. Any new dark-mode token should follow that same "soft navy, not black" rule.
