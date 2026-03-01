# Mobile Strategy — Phase Roadmap

Reference: `admin/mobile-strategy.md` for full strategy details.

---

## Phase 1: Foundation (Current — In Progress)

CSS infrastructure fixes, guide page, 4 demos.

### What's included
- Safe-area tokens (`--safe-top/right/bottom/left` via `env()`)
- Tap highlight removal (`-webkit-tap-highlight-color: transparent`)
- Overscroll containment on dialogs, sticky nav/aside
- Safe-area padding on bottom drawer and app-shell mobile nav
- `100svh` on cover layout
- Guide page at `/docs/mobile/`
- 4 demos: app shell, bottom sheet, mobile form, hero + reel

---

## Phase 2: Gesture Layer

Strategy Stage 3. New JavaScript module(s) for touch interactions.

### Components to build

**`vb-gestures.js` — Swipe event module**
- Listens for `pointerdown` → `pointermove` → `pointerup` sequences
- Dispatches custom events: `swipe-left`, `swipe-right`, `swipe-up`, `swipe-down`
- Configurable: `threshold` (min px), `restraint` (max perpendicular drift), `timeout` (max ms)
- Event detail includes `{ distance, duration }`
- Usage: `addSwipeListener(element, options)` then `element.addEventListener('swipe-left', ...)`

**Swipe-to-dismiss pattern**
- `makeSwipeable(card)` — horizontal drag with `translateX` + opacity falloff
- Commits dismiss at threshold (100px), snaps back below
- Uses `setPointerCapture()` for reliable drag tracking
- Fires `transitionend` → `remove()` on commit

**Pull-to-refresh**
- `addPullToRefresh(scrollContainer, onRefresh)` — vertical pull at scrollTop=0
- Visual indicator via CSS transform, fires callback on threshold
- Returns a Promise from `onRefresh` to signal completion

**Long press**
- `addLongPress(element, callback, duration=500)` — `setTimeout` on `pointerdown`, cancel on move/up/cancel
- Optional haptic feedback via `navigator.vibrate(10)` on Android
- Blocks native `contextmenu`

**Haptic feedback utilities**
- `haptic.tap()` — 8ms vibration (selection, toggle)
- `haptic.confirm()` — double pulse [8, 40, 8] (confirmation, add-to-cart)
- `haptic.error()` — [30, 60, 30] (validation failure)
- `haptic.dismiss()` — 15ms (destructive action)
- Note: iOS ignores Vibration API; this is Android-only enhancement

### CSS additions
- `touch-action: pan-y` on horizontal-swipe containers
- `touch-action: none` on full gesture surfaces
- `.dragging` visual state (opacity, scale, shadow)

### Demos to build
- Gesture playground: 4 interactive zones (swipe carousel, swipe-to-dismiss, pull-to-refresh, vertical snap)
- Swipeable notification cards (inbox pattern)

### Decisions deferred
- Whether gestures ship as a standalone module or integrate into existing components
- Whether carousel-wc gets swipe-left/right navigation built in
- Whether drag-surface gets the reorder pattern

---

## Phase 3: Advanced Mobile Forms

Strategy Stage 4. Enhanced form UX for checkout-grade flows.

### Keyboard-aware layout
- Detect virtual keyboard via `navigator.virtualKeyboard.overlaysContent = true` (Chrome 94+)
- CSS: `.sticky-submit { bottom: env(keyboard-inset-height, 0px); }`
- JS fallback: `scrollIntoView({ behavior: 'smooth', block: 'center' })` on input focus with 300ms delay

### Validation timing
- Validate on `blur` (not `input`) — event delegation pattern
- Use `field.checkValidity()` + `field.validationMessage` (native API)
- Set `aria-invalid` attribute, show/hide error `<span>` via `hidden`
- VB's `<form-field>` already handles most of this; document the pattern

### Geolocation → address prefill
- Reverse geocode via Nominatim (free, no API key)
- Fills `autocomplete="street-address"`, `address-level2`, `address-level1`, `postal-code`, `country-name`
- Progressive: button only appears if `navigator.geolocation` exists

### Payment Request API
- `new PaymentRequest()` for Apple Pay / Google Pay
- `canMakePayment()` check before showing button
- Graceful fallback to manual card form

### `<select>` guidance
- Document when native `<select>` is better than custom dropdowns (short lists on mobile)
- Document `<datalist>` for searchable alternatives

### Demos to build
- Multi-step mobile checkout (3 steps: contact → shipping → payment)
- Form pattern library: side-by-side "what most sites do" vs. "what you should do"

### Decisions deferred
- Whether `<form-field>` gets built-in blur validation or stays opt-in
- Whether a `<checkout-form>` web component is warranted
- Whether `env(keyboard-inset-height)` support is broad enough to ship

---

## Phase 4: Corporate Mobile Site

Strategy Stage 5. CSS patterns for marketing/corporate pages.

### Scroll-driven animations (CSS only)
- `animation-timeline: view()` for fade-in-on-scroll
- `animation-timeline: scroll(root)` for parallax hero images
- `animation-range: entry 0% entry 30%` for reveal timing
- `@supports not (animation-timeline: scroll())` fallback
- Browser: Chrome 115+, Safari 18+

### Magazine cover hero
- Full-bleed edge-to-edge: `100lvh` background, `100svh` content padding
- Cinematic gradient overlay via `::after`
- `clamp(2.5rem, 10vw, 5rem)` for display heading
- `text-wrap: balance` on headlines

### Sticky CTA patterns
- Floating action button: `position: fixed`, appears after scrolling past hero
- Sticky bottom bar: persistent full-width CTA with safe-area padding

### Bottom navigation (corporate)
- Frosted glass: `backdrop-filter: blur(12px) saturate(180%)`
- 3-5 destinations with icons + labels
- `aria-current="page"` active state
- Mobile-only via `@media (width < 48rem)`

### Auto-hiding header
- `position: sticky`, `transform: translateY(-100%)` on scroll-down
- ~15 lines JS: compare `scrollTop` with last position
- Complementary to existing `data-scroll-shrink` (which shrinks but doesn't hide)

### Performance considerations
- `fetchpriority="high"` on hero `<img>` (not `background-image`)
- `@font-face { font-display: swap; size-adjust }` for FOUT prevention
- No animations on above-the-fold content during load

### Demos to build
- Complete corporate mobile homepage (hero, trust bar, features, testimonials, CTA, bottom nav)

### Decisions deferred
- Whether scroll-driven animations become a VB utility (e.g., `data-animate="fade-up"`)
- Whether auto-hiding header becomes a `data-scroll-hide` attribute
- Whether bottom nav becomes a first-class VB component vs. documented pattern

---

## Phase 5: PWA

Strategy Stage 6. Installable web app capabilities.

### Web App Manifest template
- `manifest.json` with `display: standalone`, proper icons, theme color
- VB could ship a manifest generator or template

### Meta tags
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- `<link rel="apple-touch-icon" href="...">`

### Service worker (minimal)
- Shell caching: homepage, CSS, JS, icon
- Network-first for content, cache-first for shell
- `self.skipWaiting()` for instant activation

### Standalone mode detection
- `@media (display-mode: standalone)` CSS
- Hide install prompts, adjust header padding for safe areas

### `beforeinstallprompt` handling
- Chrome auto-prompt interception
- Custom install button pattern
- iOS: manual "Share → Add to Home Screen" guidance

### Decisions deferred
- Whether VB ships a service worker or just documents the pattern
- Whether the bundle configurator generates manifest.json
- Scope of offline support (cache-only vs. network-first)

---

## Excluded Ideas (Considered but Not Planned)

### `lvh` unit support
**Reason**: Not practically useful. `svh` (browser chrome visible) and `dvh` (dynamic) cover all real use cases. `lvh` (browser chrome hidden) has no scenario where it's meaningfully different from `dvh` for content sizing. Adding it would increase API surface for zero user benefit.

### Drag-to-reorder component
**Reason**: Complex interaction with accessibility implications (needs `aria-grabbed`, `aria-dropeffect`, live announcements). Better served by a dedicated `<sortable-list>` web component in a future release than as a CSS utility.

### Pinch-to-zoom handler
**Reason**: Requires two-touch-point tracking via `TouchEvent` (not `PointerEvent`). Only useful for image viewers and maps. `geo-map` already handles its own zoom. An image lightbox component would be the right vehicle.

### `<bottomSheet>` web component
**Reason**: Native `<dialog data-position="bottom">` already provides this with zero JS overhead. A web component would add bundle size and complexity for no functional gain. The strategy's bottom-sheet patterns map directly to existing dialog syntax.

### `<mobileNav>` web component
**Reason**: `data-page-layout="app-shell"` already moves nav to the bottom on mobile via CSS grid reordering. No JS needed. A component would be over-engineering.

### CSS Container Queries for responsive components
**Reason**: VB's intrinsic layouts (`sidebar`, `switcher`) already achieve container-responsive behavior without container queries. The `container-type: inline-size` on `main/article/section/aside` (in layout-attributes.css) provides containment. Adding `@container` rules would be useful for card-level responsiveness but is a separate concern from mobile strategy.

### Web Share API integration
**Reason**: Useful but orthogonal to mobile layout/UX strategy. Would be a standalone `<share-button>` web component if pursued.  This should absolutely be implemented as a feature.

### Vibration patterns beyond haptic feedback
**Reason**: The Vibration API is Android-only and considered a novelty. The brief haptic taps (8-15ms) for gesture feedback are the only defensible use case. Longer patterns feel gimmicky and drain battery.

### `user-scalable=no` on viewport
**Reason**: Breaks accessibility. Users must be able to zoom. VB's `text-size-adjust: none` prevents the iOS auto-zoom on inputs (the usual reason people add this), making `user-scalable=no` unnecessary.

### Horizontal swipe for page navigation
**Reason**: Conflicts with iOS back-swipe gesture (activated from screen edge). The strategy doc notes this explicitly — edge-swipe right triggers browser back navigation. Any full-width swipe handler would intercept it. VB should not ship a pattern that fights the OS.
