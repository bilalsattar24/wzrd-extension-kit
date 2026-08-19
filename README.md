# WZRD Extension Kit

Shared UI, auth, storage, and paywalls for SportsWZRD Chrome/Firefox MV3 extensions (basketball, baseball, football).

This package is **extension-only**. Do not import it from `sportswzrd-web`. Sport scrapers, Yahoo/ESPN DOM, and projection math stay in each extension repo.

Not published to npm.

## Integrate into an extension

Do these steps in the **consuming** repo (`fantasyBasketballWizard`, `fantasy-football-wzrd`, `fantasy-baseball-wzrd`). The kit never adds Chrome/Firefox manifest permissions.

### 1. Depend on the GitHub repo

```json
"wzrd-extension-kit": "https://github.com/bilalsattar24/wzrd-extension-kit"
```

Same pattern as `yahoo-fantasy` in `sportswzrd-web`. Run `npm install` so `package-lock.json` pins a git commit SHA.

The kit repo is **private**. Local install works if you can clone it (SSH or `gh auth`). GitHub Actions cannot read another private repo with the default `GITHUB_TOKEN`. Before `npm ci`, rewrite git URLs with a PAT that has Contents: Read on this repo:

```yaml
git config --global url."https://x-access-token:${{ secrets.WZRD_KIT_TOKEN }}@github.com/".insteadOf "https://github.com/"
```

Ship kit changes to `main` before merging an extension PR that needs them (or pin a SHA instead of floating `main`).

Do **not** commit `"file:../wzrd-extension-kit"`. That only works with a sibling checkout. Optional local live-edit: `npm link` the kit.

### 2. Tailwind (required for kit UI)

Kit components use `wz-` utilities in their own `.tsx` files. Tailwind only emits classes it finds in `content`, so you must scan kit sources **and** load the preset (tokens, `prefix: 'wz-'`, no preflight).

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
	presets: [require('wzrd-extension-kit/tailwind.preset')],
	content: [
		'./src/**/*.{js,jsx,ts,tsx,html}', // or ./src/extension/** if that is your tree
		'./node_modules/wzrd-extension-kit/src/**/*.{js,jsx,ts,tsx}',
	],
	theme: {
		extend: {
			// Optional overrides (e.g. basketball login colors). These win over the preset.
		},
	},
	prefix: 'wz-',
	corePlugins: { preflight: false },
};
```

If you skip the `node_modules/wzrd-extension-kit/src/**` glob, kit markup renders unstyled (layout, spacing, colors stripped). The preset alone is not enough — it does not scan class names.

Keep **preflight off**. Host fantasy pages break if Tailwind’s reset runs.

### 3. Kit CSS

In the extension stylesheet that already has `@tailwind` (put `@import` first):

```css
@import 'wzrd-extension-kit/styles.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

That file is not purged by `content`. It includes:

- `.wz-wzrd-btn`, `.wz-wzrd-btn-primary`, `.wz-wzrd-btn-secondary`, `.wz-wzrd-btn-ghost`
- `.wz-wzrd-card`, `.wz-wzrd-spinner`
- `.wz-animate-blur-reveal` (projections skeleton)

### 4. Imports

Presentational pieces that do **not** need `configureWzrdKit`:

| Export | Use |
| --- | --- |
| `WzrdProjectionsSkeleton` | Matchup loading overlay. Pass `loadingMessages` and `dummyCategories` from the sport (league cats when you have them). Pass Yahoo table classes as `tableClassName` — do not hardcode host classes in the kit. |
| `WzrdCheckoutEmailPrompt` / `isValidCheckoutEmail` | Guest checkout email overlay. |

Deep import using the package `exports` field (needs `moduleResolution` `bundler` or `node16` in the extension):

```ts
import { WzrdProjectionsSkeleton } from 'wzrd-extension-kit/WzrdProjectionsSkeleton';
import { WzrdCheckoutEmailPrompt } from 'wzrd-extension-kit/WzrdCheckoutEmailPrompt';
```

`import { … } from 'wzrd-extension-kit'` is the full barrel. Only use it after `configureWzrdKit` and the peers below are installed.

### 5. `configureWzrdKit` (auth, pay, chrome chrome)

Call once per JS context (content script **and** popup) **before** auth, Stripe, status bar, login form, or storage helpers.

```ts
import { configureWzrdKit, createWzrdStorage } from 'wzrd-extension-kit';

configureWzrdKit({
	productName: 'Fantasy Basketball WZRD',
	sportswzrdBaseUrl: 'https://www.sportswzrd.com',
	supabaseUrl: '…',
	supabaseAnonKey: '…',
	authSuccessPath: 'auth-success.html',
	sendToBackground: (message) => chrome.runtime.sendMessage(message),
	pricing: {
		monthlyLookupKey: 'pro_monthly',
		yearlyLookupKey: 'pro_yearly',
		features: ['…'],
		fallbackMonthlyCents: 499,
		fallbackYearlyCents: 1499,
		proProductKeys: ['pro'],
	},
	storage: createWzrdStorage({ /* prefix, kind */ }),
});
```

Map `sendToBackground` onto the host extension’s typed bus. Kit messages: `STRIPE_CHECKOUT`, `GET_STRIPE_PRICES`, `CHECK_SUBSCRIPTION`, `GET_USAGE`.

Guest checkout: collect email with `WzrdCheckoutEmailPrompt`, then Stripe. Do not require sign-in first. The web checkout webhook creates the account.

### 6. Peer dependencies

Already in the extensions: `react`, `react-dom`, `react-modal`, `@supabase/supabase-js`, `@tanstack/react-query`, `clsx`, `downshift`. Add `qrcode.react` if you use `MobileLinkButton`.

## Modules

- Design tokens + Tailwind preset + shared button/spinner/blur-reveal CSS
- Chrome/React mount helpers + scroll lock
- Primitives: modal, tooltip, dropdowns, social links, loading, error boundary, projections skeleton
- Auth: Supabase + `chrome.storage`, login form, OAuth callback
- Storage: `createWzrdStorage` TTL/LRU cache
- Pay: pricing modal, guest checkout email prompt, checkout/subscription/usage via `sendToBackground`
- Chrome: status bar, welcome/coach marks, release notes, feedback, clear cache, profile/login/link/mobile QR
