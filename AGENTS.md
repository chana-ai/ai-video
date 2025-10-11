# Repository Guidelines

## Project Structure & Module Organization
- `src/app` holds App Router routes; the `ai` subtree delivers dashboards, scene builders, and billing flows, while `auth` and `settings` manage account access and environment controls.
- `src/components` collects reusable UI primitives (cards, dialogs, drag-and-drop widgets); extract shared logic here before duplicating scene controls.
- `src/lib` centralizes the Axios client, local storage helpers, and misc utilities—extend `settings/config.tsx` when wiring new environment toggles.
- `public` stores static assets (icons, QR codes, mock diagrams); update `components.json` when adding exported design tokens or icons.

## Build, Test, and Development Commands
- `npm run dev` boots the Next.js dev server with hot reload at http://localhost:3000.
- `npm run build` compiles the production bundle and fails on type errors or unreachable imports.
- `npm run start` serves the last production build for staging smoke tests.
- `npm run lint` runs ESLint with the Next.js preset; PRs should stay lint-clean even when tests are absent.

## Coding Style & Naming Conventions
- Author idiomatic TypeScript React with 2-space indentation, `camelCase` helpers, and `PascalCase` component modules (e.g., `SceneCanvas.tsx`).
- Prefer colocated component folders with `index.tsx` + `styles.module.scss` only when Tailwind utilities fall short.
- Keep request logic in `src/lib/axios.tsx`; expose typed helper functions from feature modules instead of sprinkling raw `instance` calls.

## Testing & Verification
- Automated suites are not yet committed; add unit or integration specs as `*.test.tsx` under `src/__tests__` or beside the feature.
- Mock Axios through the shared instance so interceptors still attach `satoken` headers; reuse `localcache` helpers for auth state.
- Until formal tests land, document manual QA in PRs (drag-and-drop in scenes, dashboard summaries, balance flows) and attach short screen captures when UI shifts.

## Commit & Pull Request Guidelines
- Mirror the current history by leading summaries with action tags (`Fix:`, `UI:`, `Debug pass:`) and, when needed, enumerated clauses (`1. … 2. …`) for multi-part changes.
- Keep subject lines imperative and under ~72 chars; include a one-paragraph body if the diff spans multiple surfaces.
- Pull requests must outline intent, list user-facing impacts, link issues (`Closes #123`), and supply screenshots or clips for UI updates (especially scene builder changes).
- Mixed-language commits are acceptable, but ensure each message starts with a concise English summary for cross-team clarity.

## Environment & Configuration Tips
- Store secrets in `.env.local`; configure `NEXT_PUBLIC_HOST` so the Axios client targets the correct backend.
- Route new environment switches through `src/app/settings/config.tsx` to keep deployments environment-agnostic.
- When adding APIs, respect interceptor assumptions (`satoken`, `user_id` params) and update `lib/localcache.tsx` if credential storage changes.
