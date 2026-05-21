# Vanilla Breeze — Mobile-First Strategy
## Research & Implementation Plan

---

## The Big Idea

Native apps win on phones not because of exotic technology, but because they *respect the phone* — its shape, its safe zones, its touch model, and the user's context. The web can match this without frameworks, using platform APIs that are now well-supported.

**Five pillars:**

- **Stage 1: Content that respects the phone** — safe areas, viewport units, typography
- **Stage 2: App-shell layout** — fixed shell, scrolling interior, bottom nav
- **Stage 3: Gesture layer** — swipe, drag, pull-to-refresh — native feel without a library
- **Stage 4: Forms that don't suck** — keyboard-aware, autofill-powered, checkout-grade
- **Stage 5: The Ultimate Corporate Mobile Site** — what a jaw-dropping brand site looks like in a browser

---

## Stage 1: Content-First Mobile (The Foundation)

This is the quick-win layer. It makes *any* Vanilla Breeze page look significantly better on phones without touching layout logic.

### 1.1 Viewport & Safe Areas

The single biggest miss most sites have. Notches, Dynamic Islands, and home indicators occupy real pixels.

```html
<!-- In <head> — the unlock for safe area env() vars -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#your-brand-color">
```

```css
/* In Vanilla Breeze core — propagate safe area as custom props */
:root {
  --safe-top:    env(safe-area-inset-top,    0px);
  --safe-right:  env(safe-area-inset-right,  0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left:   env(safe-area-inset-left,   0px);
}
```

**The key discipline:** Apply safe areas only where content *touches the edge* — headers, footers, fixed bars. Don't blindly pad everything or full-bleed backgrounds break.

```css
body > header {
  padding-top: calc(1rem + var(--safe-top));
  padding-left: calc(1rem + var(--safe-left));
  padding-right: calc(1rem + var(--safe-right));
}

body > footer,
nav[role="navigation"]:last-child {
  padding-bottom: calc(1rem + var(--safe-bottom));
}
```

### 1.2 Modern Viewport Units (The `100vh` Fix)

`100vh` on mobile is broken — it ignores the browser chrome. Three units now exist to solve this:

| Unit | Meaning | Use When |
|------|---------|----------|
| `svh` | Small viewport height (chrome visible) | Safe hero sections — always fits |
| `lvh` | Large viewport height (chrome hidden) | Full-bleed background layers |
| `dvh` | Dynamic — updates on scroll | Truly full-screen app panels |

```css
.hero {
  min-height: 100svh;
}

.app-panel {
  height: 100dvh;
  overflow-y: auto;
  overscroll-behavior: contain;
}
```

Browser support: ~95%+ on current devices. Fallback: `100vh`.

### 1.3 Typography & Touch Targets

```css
/* Prevent iOS auto-zoom on input focus (requires font-size >= 16px) */
input, select, textarea {
  font-size: max(1rem, 16px);
}

/* Touch targets — WCAG 2.5.8 requires 24px, Apple HIG says 44px */
:where(button, [role="button"], a, label) {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
}

/* Remove tap flash — feels cheap on mobile */
* {
  -webkit-tap-highlight-color: transparent;
}
```

### 1.4 Scroll Behavior

```css
html {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* Prevent pull-to-refresh on app-like pages */
html, body {
  overscroll-behavior-y: none;
}

.content-scroll {
  overflow-y: auto;
  overscroll-behavior: contain;
}
```

### 1.5 Reading Experience on Mobile

```css
article {
  max-width: 70ch;
  margin-inline: auto;
  padding-inline: max(1rem, env(safe-area-inset-left));
  font-size: clamp(1rem, 2.5vw + 0.5rem, 1.25rem);
  line-height: 1.65;
  hyphens: auto;
  hyphenate-limit-chars: 6 3 2;
}
```

---

## Stage 2: App-Shell Layout

The key pattern: fixed shell with scrolling interior — the same model as every news app, social app, and reader.

### 2.1 The Shell Structure (Semantic HTML)

```html
<body class="mobile-shell">
  <header role="banner">
    <nav>...</nav>
  </header>

  <main>
    <article>...</article>
  </main>

  <nav aria-label="primary" class="bottom-nav">
    <a href="/">Home</a>
    <a href="/search">Search</a>
    <a href="/profile">Profile</a>
  </nav>
</body>
```

```css
.mobile-shell {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100dvh;
  overflow: hidden;  /* shell never scrolls */
}

.mobile-shell > header {
  padding-top: var(--safe-top);
  padding-inline: calc(1rem + var(--safe-left));
  z-index: 10;
}

.mobile-shell > main {
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.mobile-shell > .bottom-nav {
  display: flex;
  justify-content: space-around;
  padding-bottom: var(--safe-bottom);
  background: var(--surface);
  border-top: 1px solid var(--border);
  z-index: 10;
}
```

### 2.2 Progressive Enhancement: Desktop Falls Back Naturally

```css
.bottom-nav { display: none; }

@media (max-width: 768px) {
  .mobile-shell {
    display: grid;
    grid-template-rows: auto 1fr auto;
    height: 100dvh;
    overflow: hidden;
  }
  .bottom-nav { display: flex; }
  body > header nav { display: none; }
}
```

### 2.3 Auto-Hiding Header (Medium/Instagram Pattern)

```css
header {
  position: sticky;
  top: 0;
  transition: transform 0.3s ease;
  will-change: transform;
}
header.hidden { transform: translateY(-100%); }
```

```js
let lastY = 0;
const header = document.querySelector('header');
const main = document.querySelector('main');

main.addEventListener('scroll', () => {
  const currentY = main.scrollTop;
  header.classList.toggle('hidden', currentY > lastY && currentY > 80);
  lastY = currentY;
}, { passive: true });
```

### 2.4 Scroll Snap for Horizontal Content

```css
.card-feed {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 1rem;
  gap: 1rem;
  padding-inline: 1rem;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.card-feed::-webkit-scrollbar { display: none; }
.card-feed > * {
  scroll-snap-align: start;
  flex-shrink: 0;
  width: min(80vw, 320px);
}
```

### 2.5 The `<dialog>` as Bottom Sheet

Native browser element, zero library, fully accessible:

```css
dialog {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  width: 100%;
  max-height: 80dvh;
  margin: 0;
  border-radius: 1.5rem 1.5rem 0 0;
  padding-bottom: calc(1.5rem + var(--safe-bottom));
  transition: transform 0.3s ease, opacity 0.3s ease;
}
dialog::backdrop {
  background: rgb(0 0 0 / 0.4);
  backdrop-filter: blur(4px);
}
```

---

## Stage 3: Gesture Layer — Swipe & Touch Interactions

This is the glaring gap between "mobile responsive" and "mobile native." Every major app is gesture-driven. The web has the full Touch Events API and Pointer Events — no Hammer.js needed.

### 3.1 The Mental Model

Three events drive everything: `pointerdown` (finger down), `pointermove` (dragging), `pointerup` (finger up). **Pointer Events** are the modern standard — they work identically for touch, mouse, and stylus.

```js
// The core pattern
element.addEventListener('pointerdown', onStart, { passive: true });
element.addEventListener('pointermove', onMove, { passive: true });
element.addEventListener('pointerup', onEnd);
element.addEventListener('pointercancel', onEnd); // handles interrupted gestures — don't skip this
```

### 3.2 Vanilla Swipe Utility (Vanilla Breeze core module)

A reusable zero-dependency swipe detector that fires custom events — keeps gesture logic decoupled from component logic.

```js
// vb-gestures.js
function addSwipeListener(element, options = {}) {
  const {
    threshold = 50,   // min pixels to count as swipe
    restraint = 100,  // max perpendicular drift
    timeout = 300,    // max ms for gesture
  } = options;

  let startX, startY, startTime;

  element.addEventListener('pointerdown', e => {
    startX = e.clientX;
    startY = e.clientY;
    startTime = Date.now();
  }, { passive: true });

  element.addEventListener('pointerup', e => {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const elapsed = Date.now() - startTime;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (elapsed > timeout) return;

    if (absDx >= threshold && absDy <= restraint) {
      element.dispatchEvent(new CustomEvent(dx > 0 ? 'swipe-right' : 'swipe-left', {
        bubbles: true,
        detail: { distance: absDx, duration: elapsed }
      }));
    } else if (absDy >= threshold && absDx <= restraint) {
      element.dispatchEvent(new CustomEvent(dy > 0 ? 'swipe-down' : 'swipe-up', {
        bubbles: true,
        detail: { distance: absDy, duration: elapsed }
      }));
    }
  });
}

// Usage — clean, event-driven
addSwipeListener(carousel);
carousel.addEventListener('swipe-left',  () => carousel.next());
carousel.addEventListener('swipe-right', () => carousel.prev());

addSwipeListener(document.body);
document.body.addEventListener('swipe-up', e => {
  if (e.detail.distance > 100) openDrawer();
});
```

### 3.3 Swipe-to-Dismiss (iOS Notification / Gmail / Tinder Pattern)

```js
function makeSwipeable(card) {
  let startX = 0;

  card.addEventListener('pointerdown', e => {
    startX = e.clientX;
    card.setPointerCapture(e.pointerId); // locks pointer to element during drag
    card.style.transition = 'none';
  });

  card.addEventListener('pointermove', e => {
    const dx = e.clientX - startX;
    card.style.transform = `translateX(${dx}px) rotate(${dx * 0.05}deg)`;
    card.style.opacity = 1 - Math.abs(dx) / 300;
  });

  card.addEventListener('pointerup', e => {
    const dx = e.clientX - startX;
    card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

    if (Math.abs(dx) > 100) {
      // Commit dismiss
      card.style.transform = `translateX(${dx > 0 ? 200 : -200}%)`;
      card.style.opacity = '0';
      card.addEventListener('transitionend', () => card.remove(), { once: true });
    } else {
      // Snap back
      card.style.transform = '';
      card.style.opacity = '1';
    }
  });
}
```

### 3.4 Pull-to-Refresh (Custom, Platform-Feeling)

The most distinctly native pattern. CSS handles the visual drag; JS decides when to fire.

```js
function addPullToRefresh(scrollContainer, onRefresh) {
  let startY, pulling = false;
  const indicator = document.querySelector('.refresh-indicator');

  scrollContainer.addEventListener('pointerdown', e => {
    if (scrollContainer.scrollTop === 0) {
      startY = e.clientY;
      pulling = true;
    }
  }, { passive: true });

  scrollContainer.addEventListener('pointermove', e => {
    if (!pulling) return;
    const dy = e.clientY - startY;
    if (dy > 0 && dy < 100) {
      indicator.style.transform = `translateY(${dy}px)`;
      indicator.style.opacity = dy / 100;
    }
  }, { passive: true });

  scrollContainer.addEventListener('pointerup', e => {
    if (!pulling) return;
    const dy = e.clientY - startY;
    pulling = false;

    if (dy > 70) {
      indicator.classList.add('loading');
      onRefresh().finally(() => {
        indicator.classList.remove('loading');
        indicator.style.transform = '';
        indicator.style.opacity = '0';
      });
    } else {
      indicator.style.transform = '';
      indicator.style.opacity = '0';
    }
  });
}
```

### 3.5 CSS `touch-action` — Tell the Browser What You're Handling

This property prevents conflict between your gesture handlers and the browser's own touch behaviors. Getting it wrong causes scroll lag or broken gestures.

```css
/* Let browser handle vertical scroll, your JS handles horizontal */
.carousel {
  touch-action: pan-y;
}

/* Full custom gesture control */
.game-canvas, .drawing-surface {
  touch-action: none;
}

/* Default for content — browser handles everything */
.content {
  touch-action: auto;
}
```

### 3.6 CSS Scroll Snap as Gesture (No JS Needed)

For carousels and onboarding flows, CSS scroll snap *is* the gesture system. No JS means no jank, no battery drain:

```css
/* Full-screen section swipe — onboarding, storytelling flows */
.onboarding {
  height: 100dvh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
}

.onboarding > section {
  height: 100dvh;
  scroll-snap-align: start;
  scroll-snap-stop: always; /* prevents skipping sections */
}
```

### 3.7 Gesture Inventory for Vanilla Breeze

| Gesture | Mechanism | Use Case |
|---------|-----------|----------|
| Swipe left/right | Pointer Events + custom events | Carousel, delete, back nav |
| Swipe up/down | Pointer Events | Drawer open, pull-to-refresh |
| Tap | `click` event | Buttons, links |
| Long press | `setTimeout` on `pointerdown` | Context menus, drag initiation |
| Pinch/zoom | `TouchEvent` with two touch points | Maps, image viewers |
| Horizontal scroll snap | CSS only | Card feeds, tab content |
| Vertical scroll snap | CSS only | Onboarding, full-screen sections |
| Swipe to dismiss | Pointer Events + CSS transform | Notifications, inbox cards |
| Drag to reorder | Pointer Events + CSS order | Lists, kanban |

### 3.8 Long Press (Context Menus, Hold-to-Action)

Long press is used throughout iOS and Android for context actions. It's a missed opportunity on mobile web — especially for lists, gallery items, and drag initiation.

```js
function addLongPress(element, callback, duration = 500) {
  let timer = null;

  element.addEventListener('pointerdown', e => {
    // Only primary pointer (not multi-touch)
    if (e.isPrimary === false) return;

    timer = setTimeout(() => {
      // Haptic feedback if available
      if ('vibrate' in navigator) navigator.vibrate(10);
      callback(e);
      timer = null;
    }, duration);
  }, { passive: true });

  // Cancel on any movement or release
  const cancel = () => { clearTimeout(timer); timer = null; };
  element.addEventListener('pointermove', cancel, { passive: true });
  element.addEventListener('pointerup', cancel);
  element.addEventListener('pointercancel', cancel);
  element.addEventListener('contextmenu', e => e.preventDefault()); // block native
}

// Usage
addLongPress(photoCard, e => showContextMenu(e, photoCard));
```

### 3.9 Haptic Feedback — The Tactile Layer

Native apps give physical feedback for key interactions. The Vibration API brings this to mobile web. Keep vibrations short (5–15ms) — they should feel like a click, not a buzz.

```js
// vb-gestures.js — haptic feedback utilities
const haptic = {
  // Light tap — selection, toggle
  tap: () => navigator.vibrate?.(8),

  // Double pulse — confirmation, add-to-cart
  confirm: () => navigator.vibrate?.([8, 40, 8]),

  // Error — validation failure, payment declined
  error: () => navigator.vibrate?.([30, 60, 30]),

  // Long buzz — destructive action (delete, swipe-to-dismiss)
  dismiss: () => navigator.vibrate?.(15),
};

// Apply to quick-add button
document.querySelectorAll('.quick-add').forEach(btn => {
  btn.addEventListener('click', () => {
    haptic.confirm();
    btn.classList.add('added');
    setTimeout(() => btn.classList.remove('added'), 1500);
  });
});
```

Haptic feedback only works on Android Chrome. iOS ignores it (Apple restricts Vibration API). That's fine — it's enhancement, not dependency.

### 3.10 Drag-to-Reorder (Lists, Kanban)

```js
function makeDraggable(list) {
  let dragging = null;

  list.querySelectorAll('[draggable]').forEach(item => {
    item.addEventListener('pointerdown', e => {
      dragging = item;
      item.classList.add('dragging');
      item.setPointerCapture(e.pointerId);
    });

    item.addEventListener('pointermove', e => {
      if (!dragging) return;
      const siblings = [...list.querySelectorAll('[draggable]:not(.dragging)')];
      const next = siblings.find(s => {
        const rect = s.getBoundingClientRect();
        return e.clientY < rect.top + rect.height / 2;
      });
      list.insertBefore(dragging, next ?? null);
    }, { passive: true });

    item.addEventListener('pointerup', () => {
      dragging?.classList.remove('dragging');
      dragging = null;
    });
  });
}
```

```css
[draggable] { touch-action: none; cursor: grab; }
[draggable]:active { cursor: grabbing; }
.dragging {
  opacity: 0.5;
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.15);
}
```

### 3.11 iOS Back-Swipe Conflict (And How to Avoid It)

iOS Safari uses edge-swipe-right for back navigation. If your carousel or card-feed is full-width, it will intercept your gesture handler. Fix:

```css
/* Leave 20px edge margins — iOS back-swipe activates from the very edge */
.carousel {
  touch-action: pan-y; /* only claim vertical pan ownership */
  margin-inline: 1rem; /* don't let content reach screen edge */
}
```

For full-screen panels where you intentionally want to intercept back-swipe (e.g., a reader view), use `history.pushState()` so the browser's back gesture navigates your internal state before closing the page.

---

## Stage 4: Forms That Don't Suck — Mobile-Grade Input

Forms are where mobile web fails hardest. The keyboard takes 40–50% of the screen. Autofill is flaky. Error messages appear at the wrong moment. All of this is fixable with HTML — no custom widget library needed.

### 4.1 The Cardinal Rules

**Rule 1: 16px minimum font-size on inputs — always.** iOS auto-zooms on anything smaller and never zooms back. This breaks layout and frustrates users.

**Rule 2: Single-column layout.** Multi-column forms force a Z-scan on a narrow screen and dramatically increase completion time and errors. Always stack.

**Rule 3: Label above the field, not inside it.** Placeholder-as-label disappears when the user types. If they've forgotten what a field is for, they're stuck. Always use real `<label>` elements.

**Rule 4: Full-width inputs and buttons.** On a 390px screen, a 200px button is thumb-unfriendly. Make inputs and primary actions fill the container width.

**Rule 5: Descriptive CTAs.** "Next" tells the user nothing. "Continue to shipping" orients them in the journey. The "goal-gradient effect" applies too — showing progress makes people more likely to finish.

### 4.2 The Right Input Types — The Most Underused HTML Feature

The correct `type` + `inputmode` combo triggers the right keyboard. Most forms ignore this entirely.

```html
<!-- Email — triggers keyboard with @ key prominent -->
<input type="email" autocomplete="email">

<!-- Phone — triggers dialpad -->
<input type="tel" autocomplete="tel">

<!-- Credit card — NEVER use type="number" (spinners appear, values get truncated) -->
<!-- Use text + inputmode for numeric keyboard without spinners -->
<input type="text" inputmode="numeric" autocomplete="cc-number" pattern="[0-9 ]{13,19}">

<!-- OTP / verification codes — iOS shows SMS suggestion bar above keyboard -->
<input type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6">

<!-- Currency / price — numeric with decimal key -->
<input type="text" inputmode="decimal" pattern="[0-9]*\.?[0-9]*">

<!-- Search -->
<input type="search" inputmode="search">
```

### 4.3 The `autocomplete` Attribute — Your Most Powerful Form Tool

Proper `autocomplete` values do three things: enable one-tap browser autofill, trigger iOS/Android contact and card integration, and satisfy WCAG 2.1 AA (SC 1.3.5). Most sites get this wrong by using vague `name` attributes like `name="first"`.

```html
<!-- Address form — fully autocomplete-enabled -->
<input autocomplete="name"           type="text">
<input autocomplete="email"          type="email">
<input autocomplete="tel"            type="tel">
<input autocomplete="street-address" type="text">
<input autocomplete="address-level2" type="text">   <!-- city -->
<input autocomplete="address-level1" type="text">   <!-- state -->
<input autocomplete="postal-code"    type="text" inputmode="numeric">
<input autocomplete="country-name"   type="text">

<!-- Payment form — triggers Apple Pay card scan on iOS, Google Pay on Android -->
<input autocomplete="cc-name"    type="text" autocapitalize="words">
<input autocomplete="cc-number"  type="text" inputmode="numeric">
<input autocomplete="cc-exp"     type="text" inputmode="numeric" placeholder="MM/YY">
<input autocomplete="cc-csc"     type="text" inputmode="numeric" maxlength="4">
```

**iOS bonus:** When `autocomplete="cc-number"` is set correctly, Safari presents a camera button to scan the physical card. Browser fills number, expiry, and name automatically.

**Android bonus:** Chrome offers to autofill from Google Pay when payment `autocomplete` values are present.

### 4.4 Keyboard-Aware Layout

The virtual keyboard is the invisible enemy of mobile forms. When it appears, the viewport shrinks and layouts break.

**Problem: Active input scrolls behind the keyboard.**

```js
document.querySelectorAll('input, select, textarea').forEach(input => {
  input.addEventListener('focus', () => {
    setTimeout(() => {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300); // wait for keyboard animation to complete
  });
});
```

**Problem: Fixed footer submit button disappears behind the keyboard.**

The `virtualKeyboard` API (Chrome 94+) is the modern fix:

```js
if ('virtualKeyboard' in navigator) {
  navigator.virtualKeyboard.overlaysContent = true;
}
```

```css
/* Adjust fixed footer when keyboard is open */
.sticky-submit {
  bottom: env(keyboard-inset-height, 0px);
  transition: bottom 0.3s ease;
}
```

### 4.5 Inline Validation — Right Timing, Not Aggressive

Validate on `blur` (when user leaves a field), not on `input` (while typing). Validating while typing is patronizing and shows errors before the user is done.

```js
// vb-validation.js — event delegation, works on any form
document.addEventListener('blur', e => {
  if (!e.target.matches('input, textarea, select')) return;
  validateField(e.target);
}, { capture: true });

function validateField(field) {
  const valid = field.checkValidity(); // native browser validation API
  field.setAttribute('aria-invalid', !valid);

  const errorEl = document.getElementById(`${field.id}-error`);
  if (errorEl) {
    errorEl.textContent = valid ? '' : field.validationMessage;
    errorEl.hidden = valid;
  }
}
```

```html
<!-- HTML structure for validation -->
<div class="field">
  <label for="email">Email address</label>
  <input id="email" type="email" required autocomplete="email"
         aria-describedby="email-error">
  <span id="email-error" role="alert" hidden></span>
</div>
```

```css
/* Style via attribute — no JS class toggling needed */
input[aria-invalid="true"] {
  border-color: var(--color-error);
  background: var(--color-error-subtle);
}
```

### 4.6 Mobile Checkout Flow — The Full Pattern

This is where e-commerce loses 70%+ of mobile users. One-screen-at-a-time beats long scrolling pages.

```html
<form id="checkout" novalidate>

  <!-- Sticky progress indicator — always visible -->
  <nav class="checkout-progress" aria-label="Checkout progress">
    <ol>
      <li aria-current="step">Contact</li>
      <li>Shipping</li>
      <li>Payment</li>
    </ol>
  </nav>

  <!-- Step 1: Contact (simplest first — easiest to complete builds momentum) -->
  <section data-step="1" aria-labelledby="step1-heading">
    <h2 id="step1-heading">Contact information</h2>
    <div class="field">
      <label for="email">Email</label>
      <input id="email" type="email" autocomplete="email" required>
    </div>
    <div class="field">
      <label for="phone">Phone (for delivery updates)</label>
      <input id="phone" type="tel" autocomplete="tel">
    </div>
    <!-- Guest checkout by default — account creation after order completes -->
    <button type="button" class="btn-primary btn-full" data-next="2">
      Continue to shipping
    </button>
  </section>

  <!-- Step 2: Shipping -->
  <section data-step="2" hidden>
    <h2>Shipping address</h2>
    <input autocomplete="name"           type="text"  placeholder="Full name">
    <input autocomplete="street-address" type="text"  placeholder="Street address">
    <input autocomplete="address-level2" type="text"  placeholder="City">
    <input autocomplete="address-level1" type="text"  placeholder="State">
    <input autocomplete="postal-code"    type="text"  inputmode="numeric" placeholder="ZIP">
    <button type="button" class="btn-primary btn-full" data-next="3">
      Continue to payment
    </button>
  </section>

  <!-- Step 3: Payment -->
  <section data-step="3" hidden>
    <h2>Payment</h2>
    <!-- Apple Pay / Google Pay first — fastest possible path -->
    <div id="payment-request-button"></div>
    <p class="divider">or pay with card</p>
    <input autocomplete="cc-name"   type="text"  placeholder="Name on card" autocapitalize="words">
    <input autocomplete="cc-number" type="text"  inputmode="numeric" placeholder="Card number">
    <div class="field-row">
      <input autocomplete="cc-exp" type="text" inputmode="numeric" placeholder="MM/YY">
      <input autocomplete="cc-csc" type="text" inputmode="numeric" placeholder="CVV" maxlength="4">
    </div>
    <!-- Amount in the button — user knows what they're confirming -->
    <button type="submit" class="btn-primary btn-full">
      Place order — $49.00
    </button>
  </section>

</form>
```

### 4.7 Payment Request API (Apple Pay / Google Pay in 10 Lines)

The single biggest checkout conversion lever on the web. Bypasses every form field with biometric-authenticated pre-stored payment. Support: Chrome 60+, Safari 12.1+.

```js
async function initPaymentRequest(total) {
  if (!window.PaymentRequest) return; // graceful fallback to card form

  const request = new PaymentRequest(
    [{ supportedMethods: 'https://apple.com/apple-pay' },
     { supportedMethods: 'https://google.com/pay' }],
    {
      total: { label: 'Total', amount: { currency: 'USD', value: total } }
    }
  );

  if (!await request.canMakePayment()) return;

  const btn = document.getElementById('payment-request-button');
  btn.innerHTML = '<button class="apple-pay-button">Pay with Apple Pay</button>';

  btn.querySelector('button').addEventListener('click', async () => {
    const response = await request.show();
    await processPayment(response.details);
    await response.complete('success');
  });
}
```

### 4.8 The `<select>` Problem

`<select>` on mobile opens the native picker — iOS wheel, Android list. This is actually good UX for short lists. Fight the urge to replace it with a custom dropdown. Only replace `<select>` when you need search/filter. Use `<datalist>` as a lightweight searchable alternative:

```html
<!-- Searchable without any library -->
<label for="country">Country</label>
<input id="country" list="countries" autocomplete="country-name"
       type="text" placeholder="Start typing...">
<datalist id="countries">
  <option value="United States">
  <option value="United Kingdom">
  <option value="Canada">
</datalist>
```

### 4.9 The Address Autofill Trick — Geolocation → Prefill

On mobile the user has a GPS radio. Use it to save them typing an address:

```js
document.getElementById('use-location').addEventListener('click', async () => {
  const { coords } = await new Promise((res, rej) =>
    navigator.geolocation.getCurrentPosition(res, rej)
  );

  // Reverse geocode with free Nominatim (no API key)
  const r = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
  );
  const data = await r.json();
  const a = data.address;

  document.querySelector('[autocomplete="street-address"]').value =
    `${a.house_number ?? ''} ${a.road ?? ''}`.trim();
  document.querySelector('[autocomplete="address-level2"]').value = a.city ?? a.town ?? '';
  document.querySelector('[autocomplete="address-level1"]').value = a.state ?? '';
  document.querySelector('[autocomplete="postal-code"]').value = a.postcode ?? '';
  document.querySelector('[autocomplete="country-name"]').value = a.country ?? '';
});
```

```html
<button type="button" id="use-location" class="btn-secondary btn-full">
  📍 Use my current location
</button>
```

This turns a 30-second chore into one tap. Nobody else does this on mobile web. It's a genuine UX unlock.

### 4.10 Shopping Experience — The Full Journey, Not Just Checkout

Checkout gets all the attention but most abandonment happens before it. The whole product-browsing-to-buy journey needs mobile thinking.

**Product Listing Pages:**

The standard grid with 2 columns + tiny tap targets kills conversions. Better pattern:

```css
/* One-column featured + two-column grid hybrid */
.product-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  padding-inline: 1rem;
}

/* First product gets full width — editorial emphasis */
.product-grid > :first-child {
  grid-column: 1 / -1;
}

/* Generous tap target — the whole card, not a tiny button */
.product-card {
  display: block;
  position: relative;
  border-radius: 0.75rem;
  overflow: hidden;
}

/* Price and name in the safe zone of the image */
.product-card figcaption {
  position: absolute;
  bottom: 0;
  inset-inline: 0;
  padding: 0.75rem;
  background: linear-gradient(transparent, rgb(0 0 0 / 0.6));
  color: white;
}
```

**Quick-Add Pattern (one-tap add to cart without leaving the listing):**

```html
<article class="product-card">
  <figure>
    <img src="product.webp" alt="Blue Wool Sweater">
    <figcaption>
      <span class="product-name">Blue Wool Sweater</span>
      <span class="product-price">$89</span>
    </figcaption>
  </figure>
  <!-- Floats over card — tap to add, tap again to see cart -->
  <button class="quick-add" aria-label="Add Blue Wool Sweater to cart"
          data-product-id="xyz">+</button>
</article>
```

```css
.quick-add {
  position: absolute;
  top: 0.5rem; right: 0.5rem;
  width: 2.5rem; height: 2.5rem;
  border-radius: 50%;
  background: white;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.2);
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
}

.quick-add.added {
  background: var(--color-success);
  color: white;
  transform: scale(1.1);
}
```

**Filter Drawer Pattern (above-the-fold filters are wasted space on mobile):**

Filters belong in a bottom sheet `<dialog>`, not a collapsing sidebar or a row of buttons eating 30% of the screen.

```html
<button class="btn-filter" popovertarget="filter-drawer">
  Filters <span class="filter-count" hidden>3</span>
</button>

<dialog id="filter-drawer" class="bottom-sheet" popover>
  <header>
    <h2>Filter products</h2>
    <button popovertarget="filter-drawer" popovertargetaction="hide">✕</button>
  </header>
  <form method="dialog">
    <!-- Filter options -->
    <fieldset>
      <legend>Price range</legend>
      <label><input type="radio" name="price" value="under-50"> Under $50</label>
      <label><input type="radio" name="price" value="50-100"> $50–$100</label>
      <label><input type="radio" name="price" value="over-100"> Over $100</label>
    </fieldset>
    <!-- ... more filters ... -->
    <button type="submit" class="btn-primary btn-full">Show results</button>
  </form>
</dialog>
```

**Cart — Persistent, Accessible, Never Interrupting:**

The pattern most sites get wrong: cart as a page redirect that destroys browse context. On mobile, cart is a side drawer or bottom sheet. The user stays on the listing.

```html
<!-- Persistent cart button — always visible, shows count -->
<button class="cart-btn" aria-label="Cart, 3 items">
  <svg><!-- bag icon --></svg>
  <span class="cart-count" aria-live="polite">3</span>
</button>

<!-- Cart as bottom sheet dialog — non-disruptive -->
<dialog id="cart-sheet" class="bottom-sheet">
  <h2>Your cart</h2>
  <ul class="cart-items">
    <!-- Each item is swipe-to-remove using our vb-gestures.js -->
  </ul>
  <div class="cart-footer">
    <p class="cart-total">Total: <strong>$178</strong></p>
    <a href="/checkout" class="btn-primary btn-full">Checkout</a>
  </div>
</dialog>
```

**Cart items are swipe-to-remove** using the `makeSwipeable()` utility from Stage 3 — native iOS feel with zero library dependency.

### 4.11 Form Feedback — Micro-Interactions That Build Trust

The moment after submit matters as much as the form itself. A "sent!" message with no context causes anxiety.

```html
<!-- Progress state during submission -->
<button type="submit" id="submit-btn">
  <span class="btn-label">Place order — $49.00</span>
  <span class="btn-loading" hidden aria-live="polite">Processing...</span>
</button>
```

```js
form.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('submit-btn');

  // Disable to prevent double-submit — most sites forget this
  btn.disabled = true;
  btn.querySelector('.btn-label').hidden = true;
  btn.querySelector('.btn-loading').hidden = false;

  try {
    await submitOrder(new FormData(form));
    // Replace form with confirmation — clear, warm, informative
    form.innerHTML = `
      <div class="order-success" role="status">
        <p class="success-icon">✓</p>
        <h2>Order confirmed!</h2>
        <p>We'll send tracking to <strong>${emailInput.value}</strong></p>
        <p>Expected delivery: <strong>Feb 28 – Mar 2</strong></p>
      </div>
    `;
  } catch {
    btn.disabled = false;
    btn.querySelector('.btn-label').hidden = false;
    btn.querySelector('.btn-loading').hidden = true;
    showError('Payment failed — please check your card details.');
  }
});
```

---

## Stage 5: The Ultimate Corporate Mobile Site

Most corporate sites on mobile are embarrassments — shrunken desktop layouts, hamburger menus hiding everything, tiny CTAs, hero images that look like thumbnails. Here's what done right looks like.

### 5.1 The Diagnosis — What Makes Corporate Mobile Sites Fail

Before the recipe, name the disease:

- **Desktop-first thinking:** designers build at 1440px and "make it responsive." The phone gets whatever didn't break.
- **Hamburger menu:** requires the user to discover navigation exists, open it, then navigate. Two mandatory taps before any destination. Apps abandoned this in 2014.
- **Hero carousel with autoplay:** the one thing every UX study agrees is bad, still everywhere. Autoplaying carousels get ignored or cause accidental interaction.
- **CTAs in the footer:** the user has to earn the right to take action by scrolling all the way down. CTAs belong where the user is reading, not at the end.
- **Small text and links:** retrofitting a desktop layout produces 13px body copy and 24px links. Both are failure modes on a 390px screen.
- **Decorative video backgrounds:** start loading 4MB of video on a cell connection. The page looks broke until it loads, which it often never does.
- **No dark mode:** on an OLED iPhone at 11pm, a blinding white corporate site feels hostile.

**The standard to beat:** Apple, Stripe, Linear, Vercel — companies where someone clearly cared about the phone as a first-class platform.

### 5.2 The Vision — What Done Right Looks Like

A corporate mobile site in 2025 should feel like opening Apple.com or Stripe's homepage on your phone. The goal: **the phone IS the canvas.** Not "responsive" — designed for the phone first, then scaled up.

Five elements that create "wow" on a corporate mobile site:

**Element 1 — The hero owns the screen.** Full-bleed, edge-to-edge imagery using `100lvh` so backgrounds reach under the Dynamic Island. The headline is 3–4 words max, bold, and loads immediately. No hero carousels with autoplay — swipe-snap carousels if needed, but never autoplay.

**Element 2 — Typography IS the design.** Variable fonts, fluid sizing with `clamp()`, and genuine typographic hierarchy. The brand expresses itself through type, not stock photography collages.

**Element 3 — Scrollytelling replaces scroll jacking.** CSS scroll-driven animations (Chrome 115+, Safari 18 — no JS needed for simple effects) create depth as the user scrolls naturally. No IntersectionObserver spaghetti for basic reveals.

**Element 4 — Navigation lives at the thumb zone.** Bottom nav for main sections. The hamburger is a usability problem on mobile — it hides navigation and requires two taps for any destination. A visible bottom bar maps to how phone apps work.

**Element 5 — The CTA is always reachable.** A sticky bottom action bar or persistent button that follows the user down the page. Never make someone scroll back to the top to take action.

### 5.3 The "Magazine Cover" Hero

The thing that creates immediate wow on phones is treating the hero like a magazine cover — the phone edge-to-edge IS the page. No borders, no padding showing a white frame around the image. The content runs under the status bar, then safe areas pull critical text out of the notch.

```css
/* Full-bleed hero — the phone IS the canvas */
.hero {
  /* lvh = full height ignoring browser chrome, for pure background fills */
  min-height: 100lvh;
  /* But content uses svh — guaranteed visible */
  padding-block: calc(3rem + var(--safe-top)) calc(4rem + var(--safe-bottom));
  padding-inline: calc(1.5rem + var(--safe-left));
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end; /* headline anchored at bottom — standard for magazine/film poster */
}

/* Cinematic gradient — legible text over any photo */
.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 30%,
    rgb(0 0 0 / 0.3) 60%,
    rgb(0 0 0 / 0.7) 100%
  );
  pointer-events: none;
}

.hero-heading {
  font-size: clamp(2.5rem, 10vw, 5rem);
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: white;
  text-wrap: balance;
  position: relative; /* above ::after overlay */
  z-index: 1;
}
```

### 5.4 Swipeable Testimonials and Feature Showcases

Horizontal scroll snap replaces dots-and-arrows carousels. No JavaScript. The `scroll-snap` + `vb-gestures.js` combo gives you:
- CSS scroll snap for the scrolling (butter smooth, 60fps, no JS)
- Swipe events for programmatic `scrollTo()` calls on explicit left/right arrows

```html
<!-- Testimonials — swipe naturally or tap arrows -->
<section class="testimonials">
  <h2>What customers say</h2>
  <div class="card-feed" role="list" id="testimonial-feed">
    <article class="testimonial-card" role="listitem">
      <blockquote>"Reduced our deployment time by 80%."</blockquote>
      <cite>Sarah K., CTO at Acme</cite>
    </article>
    <!-- ... more ... -->
  </div>
  <!-- Dots indicator — CSS-only with scroll-driven animations -->
  <div class="feed-dots" aria-hidden="true">
    <span class="dot dot--1"></span>
    <span class="dot dot--2"></span>
    <span class="dot dot--3"></span>
  </div>
</section>
```

### 5.5 The Sticky "Always Reachable" CTA

Two patterns, pick based on how conversion-focused the page is:

**Pattern A — Floating Action Button (subtle):**
```css
.fab {
  position: fixed;
  bottom: calc(var(--safe-bottom) + 5rem); /* above bottom nav */
  right: 1.25rem;
  z-index: 30;
  padding: 0.875rem 1.5rem;
  border-radius: 9999px;
  background: var(--brand);
  color: white;
  font-weight: 700;
  box-shadow: 0 4px 20px color-mix(in srgb, var(--brand) 40%, transparent);
  /* Appears after scrolling past hero */
  opacity: 0;
  transform: translateY(0.5rem);
  transition: opacity 0.3s, transform 0.3s;
  pointer-events: none;
}
.fab.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
```

**Pattern B — Sticky Bottom Bar (aggressive):**
```html
<div class="sticky-bar" aria-label="Primary action">
  <p class="sticky-bar-copy">Start for free — no credit card needed</p>
  <a href="/signup" class="btn-cta">Get started</a>
</div>
```
```css
.sticky-bar {
  position: fixed;
  bottom: 0;
  inset-inline: 0;
  padding: 0.75rem 1rem calc(0.75rem + var(--safe-bottom));
  background: white;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 20;
}
```

### 5.6 The Bottom Nav — Corporate Edition

Replace the hamburger. 3–5 destinations, icons + labels, active state obvious:

```html
<nav class="bottom-nav" aria-label="Primary navigation">
  <a href="/" aria-current="page">
    <svg aria-hidden="true"><!-- home icon --></svg>
    <span>Home</span>
  </a>
  <a href="/product">
    <svg aria-hidden="true"><!-- product icon --></svg>
    <span>Product</span>
  </a>
  <a href="/pricing">
    <svg aria-hidden="true"><!-- pricing icon --></svg>
    <span>Pricing</span>
  </a>
  <a href="/contact">
    <svg aria-hidden="true"><!-- contact icon --></svg>
    <span>Contact</span>
  </a>
</nav>
```

```css
.bottom-nav {
  /* Mobile only */
  display: none;
}

@media (max-width: 768px) {
  .bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: var(--surface);
    border-top: 1px solid var(--border);
    padding-bottom: var(--safe-bottom);
    z-index: 50;
    /* Subtle frosted glass — like iOS */
    backdrop-filter: blur(12px) saturate(180%);
    background: rgb(255 255 255 / 0.85);
  }

  .bottom-nav a {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    padding-block: 0.625rem;
    font-size: 0.625rem;
    color: var(--fg-muted);
    text-decoration: none;
  }

  .bottom-nav a[aria-current="page"] {
    color: var(--brand);
  }

  .bottom-nav svg {
    width: 1.5rem;
    height: 1.5rem;
  }
}
```

Chrome 115+ and Safari 18 support `animation-timeline: scroll()`. This is how you get polished parallax and reveal effects without a library.

```css
/* Fade-in on scroll — zero JavaScript */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(2rem); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-on-scroll {
  animation: fade-up linear both;
  animation-timeline: view();           /* fires when element enters viewport */
  animation-range: entry 0% entry 30%; /* over first 30% of entry */
}

/* Parallax hero image */
.hero-image {
  animation: parallax linear;
  animation-timeline: scroll(root);
}
@keyframes parallax {
  from { transform: translateY(0); }
  to   { transform: translateY(-30%); }
}

/* Fallback for older browsers */
@supports not (animation-timeline: scroll()) {
  .animate-on-scroll {
    opacity: 1;
    transform: none;
  }
}
```

### 5.3 The Corporate Mobile Layout Blueprint

```html
<body>

  <!-- Hero — owns the screen, edge-to-edge -->
  <section class="hero">
    <div class="hero-media">
      <!-- Use <img> not background-image — browsers can preload it (critical for LCP) -->
      <img src="hero-mobile.webp"
           srcset="hero-mobile.webp 640w, hero-desktop.webp 1280w"
           sizes="(max-width: 640px) 100vw, 1280px"
           alt="" fetchpriority="high" loading="eager">
    </div>
    <div class="hero-content">
      <h1 class="hero-heading">Build what matters.</h1>
      <p class="hero-sub">Software for teams that ship.</p>
      <a href="/start" class="btn-cta">Get started free</a>
    </div>
  </section>

  <!-- Social proof — horizontal scroll snap logos -->
  <section class="trust-bar" aria-label="Trusted by">
    <div class="logo-scroll">...</div>
  </section>

  <!-- Feature cards — each reveals on scroll -->
  <section class="features">
    <article class="feature animate-on-scroll">...</article>
    <article class="feature animate-on-scroll">...</article>
  </section>

  <!-- Testimonials — swipeable card feed -->
  <section class="testimonials">
    <div class="card-feed" role="list">...</div>
  </section>

  <!-- Final CTA — above footer, not buried in it -->
  <section class="cta-block">
    <h2>Ready to start?</h2>
    <a href="/start" class="btn-cta btn-full">Get started free</a>
    <p><a href="/demo">Watch a 2-min demo</a></p>
  </section>

  <!-- Bottom nav on mobile, footer on desktop -->
  <nav class="bottom-nav" aria-label="Primary">
    <a href="/">Home</a>
    <a href="/product">Product</a>
    <a href="/pricing">Pricing</a>
    <a href="/contact">Contact</a>
  </nav>

</body>
```

```css
/* Hero — true edge-to-edge */
.hero {
  position: relative;
  min-height: 100svh;
  display: grid;
  place-items: end start;
  padding: calc(2rem + var(--safe-top)) 1.5rem calc(2rem + var(--safe-bottom));
}

.hero-media {
  position: absolute;
  inset: 0;
}
.hero-media img {
  width: 100%; height: 100%;
  object-fit: cover;
}

/* Text over image — readable on any photo */
.hero-content {
  position: relative;
  padding: 2rem 1rem;
  background: linear-gradient(to top, rgb(0 0 0 / 0.7), transparent);
}

/* Fluid display heading — no breakpoint needed */
.hero-heading {
  font-size: clamp(2.5rem, 8vw, 5rem);
  line-height: 1.1;
  font-weight: 900;
  color: white;
  text-wrap: balance;
}

/* Sticky CTA — appears after scrolling past hero */
.sticky-cta {
  position: fixed;
  bottom: calc(var(--safe-bottom) + 4rem); /* above bottom nav */
  right: 1rem;
  z-index: 20;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
.sticky-cta.visible {
  opacity: 1;
  pointer-events: auto;
}
```

### 5.4 Performance = Perception (Non-Negotiable for Corporate Sites)

A stunning design on a slow site is invisible — users leave before it renders.

**LCP (hero image):** Use `fetchpriority="high"` and `loading="eager"` on the hero `<img>`. Never use `background-image` for LCP elements — the browser can't preload them.

**No layout shift (CLS = 0):** Set explicit `width` and `height` on all images. Use `aspect-ratio` containers for dynamic content.

**Font loading without FOUT:**

```html
<link rel="preload" href="/fonts/brand-display.woff2" as="font" type="font/woff2" crossorigin>
```

```css
@font-face {
  font-family: 'BrandDisplay';
  src: url('/fonts/brand-display.woff2') format('woff2');
  font-display: swap;
  /* Match metrics to system fallback to prevent layout shift during swap */
  size-adjust: 104%;
  ascent-override: 90%;
}
```

**Animations only after LCP:** Nothing animates during page load. No `animate-on-scroll` on above-the-fold content.

### 5.5 Dark Mode — Expected, Not Optional

Sites that don't respect `prefers-color-scheme` feel unfinished on OLED phones (where dark mode saves real battery):

```css
:root {
  --bg: #ffffff;
  --fg: #0a0a0a;
  --brand: #2563eb;
  --surface: #f8fafc;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0a0a0a;
    --fg: #f8fafc;
    --brand: #60a5fa; /* lighter for dark bg */
    --surface: #1a1a1a;
  }
}
```

### 5.6 Contact / Lead Gen Forms on Corporate Mobile

Apply Stage 4 rules. The specific corporate pattern — minimal fields, maximum conversion:

```html
<form class="contact-form" novalidate>
  <h2>Let's talk</h2>

  <!-- Name first — matches natural conversation order -->
  <div class="field">
    <label for="name">Your name</label>
    <input id="name" type="text" autocomplete="name" required
           autocapitalize="words" spellcheck="false">
  </div>

  <div class="field">
    <label for="work-email">Work email</label>
    <input id="work-email" type="email" autocomplete="work email" required>
  </div>

  <!-- Optional fields labeled as optional — never use asterisk alone -->
  <div class="field">
    <label for="company">Company <span class="optional">(optional)</span></label>
    <input id="company" type="text" autocomplete="organization">
  </div>

  <!-- One textarea, not a dozen dropdowns -->
  <div class="field">
    <label for="message">What can we help with?</label>
    <textarea id="message" rows="4" required></textarea>
  </div>

  <button type="submit" class="btn-primary btn-full">Send message</button>

  <!-- Trust signal inline, not buried in footer -->
  <p class="form-trust">We respond within one business day.</p>
</form>
```

---

## Stage 6: PWA — Installable Native Feel

### 6.1 Web App Manifest

```json
{
  "name": "Your App Name",
  "short_name": "App",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#your-brand-color",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

```html
<link rel="manifest" href="/manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
```

### 6.2 Service Worker (Minimal Caching)

```js
const SHELL = ['/', '/styles.css', '/app.js', '/icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open('shell-v1').then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const pathname = new URL(e.request.url).pathname;
  if (SHELL.includes(pathname)) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
    return;
  }
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
```

### 6.3 Detecting Standalone Mode

```css
@media (display-mode: standalone) {
  .install-prompt { display: none; }
  header { padding-top: calc(0.75rem + var(--safe-top)); }
}
```

---

## iOS vs Android Nuances

| Concern | iOS Safari | Android Chrome |
|---------|-----------|----------------|
| Safe areas | `env()` — needs `viewport-fit=cover` | Same |
| Install prompt | Manual (Share → Add to Home Screen) | Auto `beforeinstallprompt` event |
| CC autofill | Camera scan with `autocomplete="cc-number"` | Google Pay integration |
| OTP autofill | `autocomplete="one-time-code"` | Same via WebOTP API |
| Back gesture | Edge swipe — conflicts with x-scroll | Back button — less conflict |
| Virtual keyboard API | Not yet | Chrome 94+ |
| Scroll-driven animations | Safari 18+ | Chrome 115+ |
| Overscroll bounce | Partially respected | Fully respected |
| `dvh` units | Safari 15.4+ | Chrome 108+ |

---

## Implementation Priorities for Vanilla Breeze

### Quick Wins (no breaking changes)

1. Viewport meta + theme-color in the default HTML template
2. Safe area CSS custom props in `:root`
3. Touch target sizing in button/link component styles
4. `svh`/`dvh` utilities alongside existing `vh` utilities
5. `-webkit-tap-highlight-color: transparent` in the reset
6. `touch-action` base rules on interactive components
7. `autocomplete` attribute documentation — it's HTML, not a library

### New Components to Build

| Component | Stage | Complexity | Notes |
|-----------|-------|------------|-------|
| `.mobile-shell` grid layout | 2 | Low | CSS only |
| `.bottom-nav` with safe area | 2 | Low | CSS only |
| Auto-hide header | 2 | Low | ~15 lines JS |
| `.card-feed` scroll snap | 2 | Low | CSS only |
| `vb-gestures.js` swipe module | 3 | Medium | Pointer Events |
| Swipe-to-dismiss card | 3 | Medium | JS + CSS |
| Pull-to-refresh | 3 | Medium | JS + CSS |
| Mobile form validation | 4 | Medium | ~40 lines JS |
| Keyboard-aware scroll | 4 | Low | ~10 lines JS |
| Scroll-driven animation utils | 5 | Low | CSS only |
| Corporate hero layout | 5 | Low | CSS only |
| PWA manifest template | 6 | Low | JSON |
| Service worker starter | 6 | Medium | JS |

### Module Structure

Each component is independently includable:

```
vanilla-breeze/
  mobile/
    vb-shell.css        # Stage 2 — app shell layout
    vb-gestures.js      # Stage 3 — touch/swipe module
    vb-forms.css        # Stage 4 — form layout
    vb-forms.js         # Stage 4 — validation + keyboard awareness
    vb-corporate.css    # Stage 5 — scroll animations, hero
    vb-pwa.js           # Stage 6 — service worker registration
```

---

## Demo Plan

Each demo is a teaching artifact and a library showcase. Build as single HTML files — easy to share, view-source friendly for students.

### Demo 1: Content-First Article Page
**Shows:** Safe areas, viewport units, fluid typography, reading experience.
**File:** `demos/mobile/article.html`
The same article rendered two ways: (a) desktop-first responsive, (b) Vanilla Breeze mobile-first. Toggle between them. The difference is dramatic on an actual phone.

### Demo 2: App Shell — News-Reader Style
**Shows:** Shell layout, bottom nav, auto-hiding header, scroll snap card feed, `<dialog>` bottom sheet.
**File:** `demos/mobile/shell.html`
A simulated news reader with 3 tabs and swipeable article cards.

### Demo 3: Gesture Playground
**Shows:** The `vb-gestures.js` module in action with code annotations.
**File:** `demos/mobile/gestures.html`
Four interactive zones: swipe carousel, swipe-to-dismiss notifications, pull-to-refresh, and a full-screen vertical snap flow. Each zone shows the implementation code alongside it.

### Demo 4: Mobile Checkout
**Shows:** Single-column forms, correct `type`/`inputmode`/`autocomplete` values, keyboard-aware layout, Payment Request API, inline validation.
**File:** `demos/mobile/checkout.html`
A 3-step checkout (Contact → Shipping → Payment) with Apple Pay / Google Pay if available. Each input is annotated explaining what attribute does what and why — a teaching goldmine for students building e-commerce.

### Demo 5: The Corporate Site
**Shows:** Everything combined. Edge-to-edge hero, scroll-driven animations, swipeable testimonials, bottom nav, sticky CTA, dark mode, contact form, performance best practices.
**File:** `demos/mobile/corporate.html`
This is the mic-drop demo. A complete corporate homepage that looks genuinely excellent on a phone. Show it on someone's phone *before* explaining how it's built. The reaction should be "wait, that's just a website?" — that's the point.

### Demo 6: Form Pattern Library
**Shows:** Every mobile form pattern — input types, autocomplete values, validation timing, multi-step patterns.
**File:** `demos/mobile/forms.html`
Side-by-side comparison: "what most sites do" vs. "what you should do" — for each pattern. This directly addresses the shopping/ordering UX problem and is immediately applicable for students building real projects.

---

## The Unified Insight

Everything above serves one goal: **the phone feels like the intended platform, not a compromise.** What creates that perception:

Content fills edge-to-edge with safe-area awareness. Navigation sits at the bottom where thumbs live. Scrolling feels physical — momentum, snap, overscroll behavior is correct. Swiping works everywhere it's expected to. Forms open the right keyboard and autofill in one tap. The status bar color and corner radius of bottom sheets match the OS. It loads in under a second.

None of this requires React, a component library, or a native app. It requires HTML written with intent, CSS that respects the device, and roughly 200 lines of vanilla JavaScript. That is the Vanilla Breeze position — and it is defensible.