# WZRD Extension Kit

`wzrd-extension-kit` — shared UI, auth, storage, and paywalls for SportsWZRD fantasy extensions.

Not published yet. Consume from a sibling checkout:

```json
"wzrd-extension-kit": "file:../wzrd-extension-kit"
```

Call `configureWzrdKit({ ... })` once at startup (content script and popup). Pass `createWzrdStorage({ ... })` as `storage` if you use cache, welcome callouts, or release notes.

Tailwind: use the preset and include kit sources so `wz-` classes are not purged:

```js
presets: [require('wzrd-extension-kit/tailwind.preset')],
content: [
  './src/**/*.{js,jsx,ts,tsx,html}',
  './node_modules/wzrd-extension-kit/src/**/*.{js,jsx,ts,tsx}',
],
```

Import `wzrd-extension-kit/styles.css` for `.wz-wzrd-btn-*`, `.wz-wzrd-card`, and `.wz-wzrd-spinner`.

## Modules

- Design tokens + Tailwind preset + shared button/spinner CSS
- Chrome/React mount helpers + scroll lock
- Primitives: modal, tooltip, dropdowns, social links, loading, error boundary
- Auth: Supabase + `chrome.storage`, login form, OAuth callback
- Storage: `createWzrdStorage` TTL/LRU cache
- Pay: pricing modal, guest checkout email prompt (`WzrdCheckoutEmailPrompt`), checkout/subscription/usage via injected `sendToBackground`. Unsigned-in users enter an email; the web checkout webhook creates the account.
- Chrome: status bar, welcome/coach marks, release notes, feedback, clear cache, profile/login/link/mobile QR

Sport scrapers and projection math stay in each extension repo.
