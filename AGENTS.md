# WZRD Extension Kit

Shared library for Fantasy Basketball, Baseball, and Football WZRD (Chrome/Firefox MV3).

## Scope

This package is **extension-only**. Do not add Next.js / sportswzrd-web barrels.

Consumers: `fantasyBasketballWizard`, `fantasy-baseball-wzrd`, `fantasy-football-wzrd`.

## Conventions

- TypeScript. No `any` unless the user allows it.
- Tailwind prefix `wz-`. No Shadow DOM. No Tailwind preflight (host pages).
- Prefix shared UI with `Wzrd`.
- TSDoc on functions and components (`@param name - …`, `@returns`; types live in TypeScript).
- Prefer `async`/`await`.
- Sport-specific Yahoo/ESPN DOM, stat math, and feature UIs stay in the sport repos.
- Apps inject config: sport, brand strings, Stripe lookup keys, Supabase URL/key, storage prefix, background `send`.
- Guest checkout is shared (`WzrdCheckoutEmailPrompt` + `isValidCheckoutEmail`). Do not require sign-in before Stripe; the web webhook creates the account.
- Never add extension manifest permissions from this kit.

## Safety

- Do not stage, commit, or push unless the user asks.
- Keep `README.md` current.
