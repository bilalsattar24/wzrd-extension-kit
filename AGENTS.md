# WZRD Extension Kit

Shared library for Fantasy Basketball, Baseball, and Football WZRD (Chrome/Firefox MV3).

## Scope

This package is **extension-only**. Do not add Next.js / sportswzrd-web barrels.

Consumers: `fantasyBasketballWizard`, `fantasy-baseball-wzrd`, `fantasy-football-wzrd`.

`EXPORTS.md` is the API catalog for consumers (every export, what it does, config requirements). Agents in the sport repos read it via `node_modules/wzrd-extension-kit/EXPORTS.md` to know what the kit already provides.

## Conventions

- TypeScript. No `any` unless the user allows it.
- Tailwind prefix `wz-`. No Shadow DOM. No Tailwind preflight (host pages).
- Prefix shared UI with `Wzrd`.
- TSDoc on functions and components (`@param name - …`, `@returns`; types live in TypeScript).
- Prefer `async`/`await`.
- Sport-specific Yahoo/ESPN DOM, stat math, and feature UIs stay in the sport repos.
- Apps inject config: sport, brand strings, Stripe lookup keys, Supabase URL/key, storage prefix, background `send`.
- Mixpanel: reusable `/track` client + `WZRD_TRACK_EVENT` bus helper (not `TRACK_EVENT` — that name collides with PlayaYield). Event names and the **project token** stay in each sport repo. Never ship the Mixpanel API secret. Service workers deep-import `wzrd-extension-kit/mixpanel` (no React). Do not add Mixpanel `host_permissions`.
- Guest checkout is shared (`WzrdCheckoutEmailPrompt` + `isValidCheckoutEmail`). Do not require sign-in before Stripe; the web webhook creates the account.
- Matchup projection loading UI is shared (`WzrdProjectionsSkeleton`). Sport repos pass loading messages and dummy category labels; Yahoo table class names stay in the sport repo.
- Never add extension manifest permissions from this kit.

## Safety

- Do not stage, commit, or push unless the user asks.
- Keep `README.md` current, especially **Integrate into an extension** (GitHub dep, Tailwind `content` + preset, CSS import, `configureWzrdKit`, deep imports).
- Keep `EXPORTS.md` in sync with `src/index.ts` whenever exports are added, removed, or their props/signatures change.
