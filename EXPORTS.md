# WZRD Extension Kit — export catalog

Everything the kit exposes to consumer extensions (`fantasyBasketballWizard`, `fantasy-baseball-wzrd`, `fantasy-football-wzrd`). Use this file to decide what to reuse from the kit **before** writing something sport-specific. Setup (Tailwind, CSS, install) is in `README.md`.

Keep this file in sync with `src/index.ts` whenever exports change.

## Entry points

| Import path | Contents |
| --- | --- |
| `wzrd-extension-kit` | Full barrel (everything below). Requires peers installed; most runtime pieces also require `configureWzrdKit`. |
| `wzrd-extension-kit/WzrdDropdown` | Deep import, no config needed. |
| `wzrd-extension-kit/WzrdProjectionsSkeleton` | Deep import, no config needed. |
| `wzrd-extension-kit/WzrdCheckoutEmailPrompt` | Deep import, no config needed. |
| `wzrd-extension-kit/mixpanel` | Mixpanel `/track` client for the host service worker. No React, no `configureWzrdKit`. |
| `wzrd-extension-kit/tailwind.preset` | Tailwind preset (tokens, `wz-` prefix, no preflight). |
| `wzrd-extension-kit/styles.css` | Static classes: `.wz-wzrd-btn*`, `.wz-wzrd-card`, `.wz-wzrd-spinner`, `.wz-animate-blur-reveal`. |

**Config column below:** "config" = needs `configureWzrdKit` first; "storage" = also needs `storage` on the config; "none" = usable standalone.

## Configuration (`src/configure.ts`)

| Export | Kind | Config | What it does |
| --- | --- | --- | --- |
| `configureWzrdKit(config)` | function | — | Registers kit config for this JS context (content script and popup each need their own call). Must run before auth, pay, storage helpers, or chrome UI. |
| `getKitConfig()` | function | config | Returns the active config; throws if `configureWzrdKit` has not run. |
| `getKitStorage()` | function | storage | Returns the `WzrdStorageApi` from config; throws if none was passed. |
| `WzrdKitConfig` | type | — | `{ productName, sportswzrdBaseUrl, supabaseUrl, supabaseAnonKey, authSuccessPath, sendToBackground, pricing, unlockAllFeatures?, freeTrial?, getActivePromoCode?, storage? }` |
| `WzrdPricingConfig` | type | — | `{ monthlyLookupKey, yearlyLookupKey, features, fallbackMonthlyCents, fallbackYearlyCents, currency?, proProductKeys }` |
| `WzrdBackgroundMessage` | type | — | Union of kit → background messages: `STRIPE_CHECKOUT`, `GET_STRIPE_PRICES`, `CHECK_SUBSCRIPTION`, `GET_USAGE`, `TRACK_EVENT`. The host extension's background must handle all five. |
| `WzrdBackgroundSend` | type | — | `(message: WzrdBackgroundMessage) => Promise<unknown>` — map onto the host's typed bus. |

## Brand tokens (`src/brand.ts`) — config: none

Color constants aligned with sportswzrd.com: `SPORTS_WZRD_PRIMARY` (`#006FEE`), `SPORTS_WZRD_PRIMARY_HOVER`, `SPORTS_WZRD_PRIMARY_SOFT`, `SPORTS_WZRD_SECONDARY`, `SPORTS_WZRD_SURFACE`, `SPORTS_WZRD_SURFACE_MUTED`, `SPORTS_WZRD_BORDER`, `SPORTS_WZRD_TEXT`, `SPORTS_WZRD_TEXT_MUTED`, `SPORTS_WZRD_SUCCESS`, `SPORTS_WZRD_WARNING`, `SPORTS_WZRD_DANGER`. Plus `BRAND_SHORT` (`'WZRD'`).

Prefer the Tailwind preset classes (`wz-bg-wzrd-primary` etc.) in JSX; use these constants for inline styles injected into host pages.

## UI primitives — config: none unless noted

| Export | Kind | What it does | Key props |
| --- | --- | --- | --- |
| `WzrdModal` | component | Full-screen overlay for content scripts on `react-modal`; locks ESPN/Yahoo page scroll while open. | All `react-modal` props plus `preventScroll` (default true), `width`, `height`, `minWidth`, `maxWidth`, `minHeight`, `maxHeight`. |
| `WzrdTooltip` / `WzrdTooltipProps` | component | Portal tooltip that avoids `react-tooltip`'s double-React crash under CRXJS. `size="default"` rich panel or `size="compact"` pill. | `id`, `headerTitle`, `children`, `place`, `trigger`, `delayShow`, `width`, `maxWidth`, `ariaLabel`, `size`, `className`. |
| `WzrdDropdown` | component | Single-select Downshift dropdown styled for host-page injection. | `options: {value,label}[]`, `value`, `onChange(value)`, `disabled?`, `style?`, `buttonStyle?`, `buttonLabel?`. |
| `WzrdMultiSelectDropdown` / `MultiSelectOption` | component | Multi-select checkbox dropdown. | `options`, `values: string[]`, `onChange`, `disabled?`. |
| `WZRD_CHECKBOX_STYLE`, `WZRD_CHECKBOX_DISPLAY_STYLE` | const | Inline styles forcing native checkbox appearance on host pages that reset it. | — |
| `WzrdSocialLink` / `SocialNetwork` | component / enum | Icon link to a SportsWZRD social profile (`Instagram`, `X`, `Discord`); URLs are built in. | `network`, `size?` (default 18). |
| `LoadingIndicator` | component | Spinner with accessible status label. | `label?` (default `Loading…`), `className?`. |
| `WzrdErrorBoundary` / `WzrdErrorBoundaryProps` | component | React error boundary with a compact recovery card fallback. | `fallback?`, `label?` (for logging), `children`. |
| `WzrdProjectionsSkeleton` / `WzrdProjectionsSkeletonProps` | component | Matchup-projection loading UI: overlay copy plus a dummy grid that un-blurs over ~4s. Sport repos pass messages and category labels; Yahoo table classes stay in the sport repo. | `projectionType: 'categories' \| 'points'`, `loadingMessages: string[]`, `dummyCategories?`, `tableClassName?`. |

## Scroll / DOM utilities — config: none

| Export | What it does |
| --- | --- |
| `lockPageScroll()` | Locks host-page scroll (ref-counted); returns an unlock function. `WzrdModal` calls this for you. |
| `isVerticallyScrollable(el)` | True when an element can scroll vertically. |
| `wheelWouldEscapeScrollable(deltaY, scrollTop, scrollHeight, clientHeight)` | True when a wheel event would scroll past the element's edge (for scroll-chaining guards). |
| `wzrdKitLog(...args)` | `console.log` with a `[WZRD]` prefix. |

## React mount helpers (`src/chrome/reactHelpers.tsx`) — config: none

| Export | What it does |
| --- | --- |
| `attachReactComponentToDomElement(Component, element, props)` | Creates a React root on a host-page element; returns a mount handle. |
| `remountReactComponentById(Component, rootId, props, insertNewElement)` | Re-creates a mount by DOM id, inserting a fresh host element via the callback. |
| `unmountReactComponentById(rootId)` | Unmounts and removes the host element for a root id. |

## Auth (`src/auth/`) — config: config (Supabase URL/key)

Sessions persist in `chrome.storage.local` via the kit's Supabase adapter.

| Export | Kind | What it does |
| --- | --- | --- |
| `getSupabase()` | function | Memoized Supabase client built from kit config. |
| `getSession()` | async | Current session as `AuthSessionResponse` (`{ ok, authenticated, user?, session?, error? }`). |
| `login(email, password)` / `signUp(email, password)` | async | Password auth; both return `AuthSessionResponse`. `signUp` is only `authenticated` when Supabase also returns a session. |
| `logout()` | async | Signs out; returns `{ ok, error? }`. |
| `onAuthStateChanged(cb)` | function | Subscribes to auth changes; returns an unsubscribe function. |
| `useAuth()` | hook | `{ isLoading, authenticated, user, session, error, refetch }`. No QueryClientProvider needed. |
| `handleOAuthCallback()` | async | Completes Google OAuth on the `authSuccessPath` page: reads tokens from the URL hash, sets the session, strips the hash. |
| `WzrdUser`, `AuthSessionResponse` | types | User shape (`id`, `email?`) and session payload. |

## Storage (`src/storage/createWzrdStorage.ts`) — config: none to create; helpers that call `getKitStorage()` need it on config

| Export | What it does |
| --- | --- |
| `createWzrdStorage(options)` | TTL cache on `chrome.storage.local` with LRU eviction (8 MB high-water, `avg` keys capped at 2500). Options: `durableKeys`, `migrationKey`, `isPageLocalStorageKey`, `inferKind?`. Pass the result as `storage` on `configureWzrdKit`. |
| `WzrdStorageApi` | Returned API: `hydrate`, `get`, `getSync`, `put(key, value, ttlSeconds?, kind?)`, `remove`, `keyExists`, `clear({ includeDurable? })`, `evictLru`, `getBytesInUse`. |
| `WzrdStorageTtl` | TTL constants in seconds: `Minute`, `FifteenMinutes`, `FourHours`, `OneDay`, `OneWeek`, `ThirtyDays`, `OneYear`. |
| `WzrdStorageKind` | `'avg' \| 'api' \| 'schedule' \| 'durable'` — eviction priority class. |
| `CreateWzrdStorageOptions`, `ClearOptions` | Option types. |

## Pay (`src/pay/`)

Guest checkout rule: collect an email with `WzrdCheckoutEmailPrompt`, then open Stripe. Never require sign-in first — the web checkout webhook creates the account.

| Export | Kind | Config | What it does |
| --- | --- | --- | --- |
| `openStripeCheckout(lookupKey, email?, promoCode?, trialDays?)` | async | config | Opens Stripe checkout via the background `STRIPE_CHECKOUT` message; returns `{ ok, url?, sessionId?, error? }`. |
| `fetchStripePricesViaBackground(lookupKeys)` | async | config | Live Stripe prices via `GET_STRIPE_PRICES` (avoids page CORS). |
| `fetchSubscriptionViaBackground()` | async | config | Subscription status via `CHECK_SUBSCRIPTION` using the session JWT; falls back to `defaultSubscription()`. |
| `fetchUsage(feature?)` | async | config | Feature usage via `GET_USAGE` (default bucket `projections`); `null` when logged out or on failure. |
| `defaultSubscription()` | function | — | Free-tier `SubscriptionStatusResponse`. |
| `getAccessBadge(s, proProductKeys?)` | function | config | Maps a subscription to `'ultra' \| 'pro' \| 'trial' \| 'free'` using this extension's `proProductKeys`. |
| `isProEntitled(s)` / `isUltraEntitled(s)` | function | config | Entitlement checks on a subscription payload. |
| `isWZRDProUser()` | async | config | Fetches the subscription itself and returns whether the user has Pro access (always true in open beta). |
| `formatStripePriceLabel(amountCents, currency, interval)` | function | none | Localized price label with `/mo` or `/yr`. |
| `getActivePromoCode()` / `areFreeTrialsEnabled()` / `getFreeTrialDays()` / `unlockAllFeatures()` | function | config | Read promo / trial / open-beta flags off kit config. |
| `WzrdPricingModal` | component | config | The paywall. Yearly-dominant plan cards, live Stripe amounts, guest checkout built in. Props: `open`, `onClose`, `context?`, `headline?`. |
| `UpgradePrompt` | component | config | Banner that opens the pricing modal. Props: `text?`, `context?`. |
| `FeatureUpgradePrompt` | component | none | Feature-gated upsell card. Props: `featureName`, `description`, `onUpgrade`, `className?`. |
| `WzrdCheckoutEmailPrompt` / `WzrdCheckoutEmailPromptProps` | component | none | Guest-checkout email overlay; render inside a `position: relative` ancestor. Props: `open`, `onCancel`, `onSubmit(email)`, `submitting?`, `initialEmail?`. |
| `isValidCheckoutEmail(email)` | function | none | Email validation used by the prompt. |
| Types | — | — | `SubscriptionTier`, `EntitlementTier`, `ExtensionSubscriptionSummary`, `SubscriptionStatusResponse`, `StripePriceInfo`, `GetStripePricesResponse`, `AccessBadge`, `UsageFeature`, `UsageStatusResponse`. |

## Extension chrome (`src/chrome/`) — config: config; several also need storage

| Export | Config | What it does | Key props |
| --- | --- | --- | --- |
| `WzrdStatusBar` | config | Shared status/control bar: product title, plan chip (Pro / Ultra / Trial / Free / Open Beta), login/profile, social links, pricing modal wiring. Sport-specific controls go in `actions`. | `actions?`, `welcomeStorageKey?`, `welcomeBody?`, `frameClassName?`. |
| `WzrdLoginForm` / `WzrdLoginFormProps` | config | Login/signup modal (password + Google OAuth); shows profile + logout when signed in. | `open?`, `onClose?`, `onLoginSuccess?`, `onLoginError?`, `onLogoutSuccess?`, `showTitle?`, `className?`. |
| `WzrdLoginButton` | config | Trigger button that opens `WzrdLoginForm`; label flips when signed in. | `style?`, `className?`, `label?`, `logoutLabel?`, `onLoginSuccess?`, `onLoginError?`, `onLogoutSuccess?`. |
| `WzrdProfileButton` | config | Signed-in profile/account button. | `style?`, `className?`. |
| `WzrdLinkButton` | none | Small link-styled button for control bars. | `onClick`, `label`, `className?`, `style?`. |
| `MobileLinkButton` | config | Opens a QR-code modal linking to the mobile experience (`sportswzrdBaseUrl`). Needs the `qrcode.react` peer. | — |
| `ClearCacheButton` | storage | Clears the kit cache (durable keys kept) with a confirmation modal. | `clearUI?`. |
| `WzrdWelcomeCallout` | config + storage | One-time dismissible welcome tip keyed by durable storage key. | `storageKey`, `body`, `title?`. |
| `WzrdCoachMark` | storage | One-time coach mark keyed by durable storage key. | `storageKey`, `title`, `body`. |
| `WzrdReleaseNotes` / `WzrdReleaseNote` | storage | Release-notes modal shown once per `versionId`; Yahoo/ESPN notes ordered by `platform`. | `platform: 'yahoo' \| 'espn'`, `versionId`, `storageKey`, `notes`. |
| `WzrdFeedbackForm` | config | In-popup feedback form posting to `/api/extension/feedback`; links to the contact page when signed out. | `extension: FeedbackExtension`, `authenticated`. |
| `FEEDBACK_REASONS`, `FEEDBACK_REASON_LABELS` | none | Feedback reason ids and labels. | — |
| `FeedbackExtension`, `FeedbackReason` | types | `'basketball' \| 'baseball' \| 'football'` and reason union. | — |

## Mixpanel (`src/analytics/`) — token from the host; never the API secret

Event **names** stay in each sport repo (`FF League Page Loaded`, …). The kit only sends and posts.

| Export | Kind | Config | What it does |
| --- | --- | --- | --- |
| `trackEvent(event, properties?)` / `trackEventAsync` | function | config | Content script / popup → `TRACK_EVENT` on `sendToBackground`. Attaches `authenticated` and `user_id` (Supabase id, not email). |
| `createMixpanelClient(options)` | function | none | Service-worker client. Options: `token` (project token), `distinctIdStorageKey`, `mpLib`, optional `environment` / `log`. Import from `wzrd-extension-kit/mixpanel` so the worker does not bundle kit React. |
| `buildMixpanelEvent` / `sanitizeProperties` / `utf8ToBase64` / `encodeMixpanelFormBody` | function | none | Pure `/track` payload helpers (tests and custom workers). |
| `MixpanelProperties`, `MixpanelClient`, `CreateMixpanelClientOptions` | types | — | Property map and client shapes. |

Do **not** add Mixpanel `host_permissions`. `/track` is a CORS form POST from the worker. Do **not** ship the Mixpanel API secret.

## What is NOT in this kit

Stays in each sport repo: Yahoo/ESPN DOM scraping and selectors, stat math and projections, sport feature UIs, extension manifests and background scripts, Stripe lookup key values, Supabase credentials, Mixpanel event names and the project token. The kit never adds manifest permissions.
