---
title: Form Bot Strategy — Spec
status: draft
category: forms, security
relates-to: FORM-VALIDATION-PE.md, FORM-ENDPOINT-CONTRACT.md, VB-AI-NATIVE.md, page-info-provenance-spec.md
---

# Form Bot Strategy — Spec

## The Core Problem (Stated Honestly)

The arms race between spam bots and detection is real and ongoing. In 2026, sophisticated bots can:
- Execute full JavaScript and render CSS
- Simulate mouse movement with libraries like Ghost Cursor
- Solve traditional CAPTCHAs with AI or human farms (~85% success on audio CAPTCHAs)
- Spoof TLS and browser fingerprints convincingly

**The goal is not to stop every bot.** It is to stop the opportunistic, dumb majority cheaply and with zero user friction, then escalate deliberately for the remainder. The economics of spam work in our favour: making a form marginally harder to spam profitably is usually enough.

---

## Bot Taxonomy

Before designing defences, classify the traffic. Not all bots should be blocked.

### Bad Bots (stop or score)

| Type | Behaviour | Goal |
|---|---|---|
| **Spam bots** | Fill and submit all fields | SEO links, lead gen fraud |
| **Exploit bots** | Inject payloads into field values | XSS, SQLi, template injection |
| **Scraper bots** | Extract form markup, email addresses | Data harvesting |
| **Account abuse bots** | Rapid-fire registrations | Fake accounts, promo abuse |

### Good Bots (allow or guide)

| Type | Behaviour | Goal |
|---|---|---|
| **Search crawlers** (Googlebot, Bingbot) | Index page content | Legitimate indexing |
| **AI crawlers** (GPTBot, ClaudeBot, Perplexity) | Read content for LLM training/retrieval | Content discovery |
| **Monitoring bots** (Pingdom, UptimeRobot) | Load pages to check availability | Your own ops |
| **Accessibility checkers** | Parse DOM for ARIA, labels | Testing tools |
| **AI agents acting for users** | Submit forms on behalf of a real person | Legitimate user intent |

The last category — **AI agents acting on a user's behalf** — is the novel case of 2025–2026. An LLM-powered agent helping a user fill in a contact form is technically a bot but carries genuine human intent. VB must handle this gracefully rather than weaponising anti-bot measures against beneficial automation.

---

## The Intentional Bot-Friendliness Problem

If a user asks an AI assistant "contact Acme Corp about their enterprise pricing," the agent may try to fill the contact form programmatically. Our anti-bot measures should not be the barrier — that is hostile to a user who is your customer.

### Strategy: Provide machine-readable alternatives

The best answer is to give AI agents a path that doesn't require form submission at all.

#### 1. Schema.org JSON-LD in `<head>`

On any page with a contact form, emit machine-readable contact metadata:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "mainEntity": {
    "@type": "Organization",
    "name": "Acme Corp",
    "email": "hello@acme.com",
    "telephone": "+1-555-0100",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "support@acme.com",
      "availableLanguage": "English"
    }
  }
}
</script>
```

An agent that can read this will use `mailto:` instead of form submission. This is the correct resolution — not a workaround.

#### 2. `llms.txt` contact section

```markdown
## Contact

- General enquiries: hello@acme.com
- Support: support@acme.com
- Contact form: /contact (human users only; bot-protected)

> AI agents: use the email addresses above rather than submitting the form.
```

#### 3. `data-bot-hint` on the form element

A machine-readable instruction directly on the form for agents processing the DOM, consistent with VB's `data-llm-*` escape hatch pattern:

```html
<form action="/contact" method="post"
      data-bot-hint="AI agents: email hello@acme.com instead of submitting this form">
```

#### 4. `noindex`/`nofollow` on thank-you pages

Suppresses crawlers from following through form submissions. Place on `/thank-you`, not the form page itself:

```html
<meta name="robots" content="noindex, nofollow"/>
```

---

## The Scoring Stack

For submissions that do arrive, VB uses a **layered bot score** computed client-side (with JS) and verified server-side. The score is a number 0–100; higher = more likely bot.

**No single signal is reliable. Scoring requires combinations.**

### Signal inventory

| Signal | Layer | Score contribution | Notes |
|---|---|---|---|
| **Honeypot filled** | HTML | +80 | Near-certain bot |
| **Time-to-submit < 3s** | JS | +50 | Bots submit instantly |
| **Time-to-submit < 1s** | JS | +80 | Essentially certain |
| **No field focus events fired** | JS | +40 | Bot filled fields without clicking |
| **No keyboard events on text fields** | JS | +30 | Programmatic `.value` assignment |
| **Mouse never moved** | JS | +20 | Headless or curl; zero weight on touch devices |
| **All fields filled simultaneously** | JS | +25 | Single-shot DOM manipulation |
| **Token missing or invalid** | Server | +90 | Signed token absent or tampered |
| **Submission rate > N/hour from IP** | Server | +60 | Rate limiting signal |
| **Field values contain URLs/HTML** | Server | +30 | Spam link injection |
| **Email domain on disposable list** | Server | +25 | Optional; third-party list |

### Escalation thresholds

| Score range | Action |
|---|---|
| 0–29 | Accept and process normally |
| 30–59 | Accept but flag for review, log `_vb_score` |
| 60–79 | Challenge: Turnstile invisible mode |
| 80–100 | Silent discard: return 200 fake success |

**Never return a 4xx that reveals detection.** Bots adapt to error codes. A convincing 200 makes the bot think it succeeded and move on.

---

## The Author Opt-In: `data-bot-protection` on `<form>`

Bot protection is activated by a data attribute on the `<form>` element. This follows the same pattern as the validation enhancement layer — `enhanceForm()` already queries `form:has(form-field)` and attaches behaviour. Bot protection is a second behaviour activated by an additional attribute on the same element. No wrapper element, no custom element registration. The `<form>` is the component.

```html
<form action="/contact"
      method="post"
      data-bot-protection
      data-turnstile-sitekey="0xABCD..."
      data-min-time="3000"
      data-bot-hint="AI agents: email hello@acme.com instead of submitting this form">
```

The enhancement entry point expands naturally:

```js
document.querySelectorAll('form:has(form-field)').forEach(form => {
  enhanceForm(form);
  if ('botProtection' in form.dataset) {
    enhanceBotProtection(form);
  }
});
```

---

## Layer 1 — The Honeypot Field (Authored in HTML)

The honeypot must be **authored in the HTML at Layer 3**, not injected by JavaScript. This is the critical distinction: a JS-injected honeypot catches bots that render the DOM; an authored honeypot catches bots that bypass JS entirely and POST directly.

### Design decisions

- **Hidden via stylesheet class**, not inline `style`. `style="display:none"` is the first thing modern bots check; so is `type="hidden"`.
- **Named like a real field** — `website`, `company`, `fax`. Not `honeypot`, `trap`, `spam`.
- **`tabindex="-1"`** prevents keyboard users from accidentally reaching it.
- **`autocomplete="one-time-code"`** — most reliable cross-browser prevention of password manager autofill. `autocomplete="off"` is ignored by Chrome.
- **`aria-hidden="true"` on the wrapper** so screen readers skip it entirely.
- The **wrapper `<div>` is the hidden element**, not the `<input>` directly — harder for bots to detect via CSS property inspection on the input itself.

```html
<!-- In every protected form -->
<div class="form-trap" aria-hidden="true">
  <label for="website">Website</label>
  <input type="text"
         id="website"
         name="website"
         tabindex="-1"
         autocomplete="one-time-code"
         data-honeypot/>
</div>
```

```css
/* forms.css — NOT inline */
.form-trap {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
```

### Server check

```js
const honeypot = formData.get('website') ?? '';
if (honeypot.trim()) return silentAccept();
```

---

## Layer 2 — Timing Token (Server/SSG Rendered)

A signed timestamp hidden field emitted at render time. The server computes elapsed time between issuance and submission. HMAC-signed so bots cannot forge an old timestamp to fake a slow submission.

```html
<input type="hidden"
       name="_vb_token"
       value="{{ signedTimestamp }}"
       data-timing-token/>
```

```js
// Cloudflare Worker HTML transform or 11ty shortcode
const timestamp = Date.now();
const sig = await signHmac(timestamp.toString(), env.FORM_SECRET);
const tokenValue = btoa(JSON.stringify({ ts: timestamp, sig }));
```

**Static-site caveat**: In 11ty, the token is per-build. A bot that scrapes and waits a few seconds will have a valid token — the timing check still catches instant submissions but not patient bots. For low-value contact forms this is acceptable. Registration and checkout forms should use a Worker HTML transform to inject per-request tokens.

---

## Layer 3 — Behavioural Signals (JS Enhancement)

`enhanceBotProtection(form)` attaches passive event listeners that collect signals with no external dependencies.

```js
function enhanceBotProtection(form) {
  const signals = {
    fieldFocusCount: 0,
    keyboardEventCount: 0,
    mouseMovedInForm: false,
    firstInteractionAt: null,
    submitAt: null,
  };

  const isTouchPrimary = navigator.maxTouchPoints > 0;

  form.addEventListener('focusin', (e) => {
    if (e.target.matches('input, textarea, select')) {
      signals.fieldFocusCount++;
      signals.firstInteractionAt ??= Date.now();
    }
  }, { capture: true });

  form.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) signals.keyboardEventCount++;
  }, { capture: true });

  if (!isTouchPrimary) {
    form.addEventListener('mousemove', () => {
      signals.mouseMovedInForm = true;
    }, { once: true });
  }

  // Hooks into the existing form enhancement submit flow
  form.addEventListener('vb:beforesubmit', () => {
    signals.submitAt = Date.now();
    const score = scoreSignals(signals, form, isTouchPrimary);

    // Attach signed client score as hidden field
    let scoreInput = form.querySelector('[data-bot-score-field]');
    if (!scoreInput) {
      scoreInput = document.createElement('input');
      scoreInput.type = 'hidden';
      scoreInput.name = '_vb_score';
      scoreInput.dataset.botScoreField = '';
      form.appendChild(scoreInput);
    }
    scoreInput.value = signScore(score);

    if (score >= 60 && form.dataset.turnstileSitekey) {
      loadTurnstile(form, form.dataset.turnstileSitekey);
    }
  });
}

function scoreSignals(signals, form, isTouchPrimary) {
  let score = 0;
  const elapsed = signals.submitAt - (signals.firstInteractionAt ?? signals.submitAt);

  const filledTextFields = [...form.querySelectorAll('input[type=text], input[type=email], textarea')]
    .filter(i => i.value.trim() && !('honeypot' in i.dataset));

  if (filledTextFields.length > 0 && signals.keyboardEventCount === 0) score += 30;
  if (signals.fieldFocusCount === 0) score += 40;
  if (!isTouchPrimary && !signals.mouseMovedInForm) score += 20;
  if (elapsed < 1000)      score += 80;
  else if (elapsed < 3000) score += 50;

  return score;
}
```

`vb:beforesubmit` is fired by `enhanceForm()` before validation runs. Bot scoring runs first — a bot-scored submission that also fails validation should be silently discarded, not shown a validation error.

---

## Layer 4 — Server-Side Verification (Cloudflare Worker)

```js
export async function handleFormPost(request, env) {
  const formData = await request.formData();

  // 1. Honeypot (instant silent discard)
  if ((formData.get('website') ?? '').trim()) return silentAccept();

  let score = 0;

  // 2. Timing token
  const tokenAge = await verifyToken(formData.get('_vb_token'), env.FORM_SECRET);
  if (tokenAge === null)    score += 90;
  else if (tokenAge < 1000) score += 80;
  else if (tokenAge < 3000) score += 50;

  // 3. Client bot score
  const clientScore = verifyClientScore(formData.get('_vb_score'), env.FORM_SECRET);
  score += clientScore ?? 50; // Missing = suspicious

  // 4. Rate limiting
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const rateKey = `form:${ip}`;
  const count = (await env.KV.get(rateKey, { type: 'json' })) ?? 0;
  if (count > 10) score += 60;
  await env.KV.put(rateKey, count + 1, { expirationTtl: 3600 });

  // 5. Content scan
  const allValues = [...formData.values()].join(' ');
  if (/https?:\/\//i.test(allValues)) score += 30;

  // 6. Escalation
  if (score >= 80) return silentAccept();
  if (score >= 60) return requireTurnstile(request, env);
  if (score >= 30) return acceptWithFlag(formData, score, env);
  return acceptAndProcess(formData, env);
}

function silentAccept() {
  return Response.json({ success: true }, { status: 200 });
}
```

---

## Layer 5 — Turnstile Escalation

Turnstile is a **peer dependency**, not required. If `data-turnstile-sitekey` is absent, the 60–79 band falls back to `acceptWithFlag()`. Free under 1M verifications/month; invisible mode resolves in ~142ms for legitimate users. The visible checkbox only appears if Turnstile's own signals flag the session.

```js
async function loadTurnstile(form, sitekey) {
  if (document.querySelector('[data-cf-turnstile-loaded]')) return;
  await loadScript('https://challenges.cloudflare.com/turnstile/v0/api.js');
  document.head.dataset.cfTurnstileLoaded = '';

  const widget = document.createElement('div');
  widget.className = 'cf-turnstile';
  widget.dataset.sitekey = sitekey;
  widget.dataset.size = 'invisible';
  form.appendChild(widget);
}
```

---

## Complete Author HTML

```html
<form action="/contact"
      method="post"
      data-bot-protection
      data-turnstile-sitekey="0xABCD..."
      data-min-time="3000"
      data-bot-hint="AI agents: email hello@acme.com instead of submitting this form">

  <!-- Timing token: emitted by server/SSG at render time -->
  <input type="hidden" name="_vb_token" value="{{ signedTimestamp }}" data-timing-token/>

  <!-- Honeypot: always authored in HTML -->
  <div class="form-trap" aria-hidden="true">
    <label for="website">Website</label>
    <input type="text" id="website" name="website"
           tabindex="-1" autocomplete="one-time-code" data-honeypot/>
  </div>

  <!-- form-fields and submit per FORM-VALIDATION-PE.md -->
  <form-field>...</form-field>
  <button type="submit">Send</button>
</form>
```

---

## Degradation Table

| Layer | Honeypot | Timing | Behavioural signals | Turnstile |
|---|---|---|---|---|
| HTML only | ✓ Authored; server checks | ✓ Token in markup; server checks | ✗ | ✗ |
| + CSS | ✓ Hidden from humans | ✓ | ✗ | ✗ |
| + JS | ✓ | ✓ | ✓ Signals collected and scored | Lazy-loaded if score ≥ 60 |

---

## Escalation Decision Tree

```
POST received
  │
  ├─ honeypot filled? ─────────────────────────── silentAccept()
  │
  ├─ token missing/invalid? ── score += 90
  ├─ token age < 1s? ─────────── score += 80
  ├─ token age < 3s? ─────────── score += 50
  │
  ├─ clientScore present + valid? ── add clientScore
  │    └─ clientScore absent? ────── score += 50
  │
  ├─ IP rate > 10/hour? ──────────── score += 60
  ├─ values contain URL? ─────────── score += 30
  │
  score ≥ 80 ──── silentAccept()
  score 60–79 ─── Turnstile (or acceptWithFlag if no sitekey)
  score 30–59 ─── acceptWithFlag → review queue
  score  0–29 ─── acceptAndProcess
```

---

## `data-*` Attribute Contract

| Attribute | Element | Set by | Meaning |
|---|---|---|---|
| `data-bot-protection` | `<form>` | Author | Activates `enhanceBotProtection()` |
| `data-turnstile-sitekey` | `<form>` | Author | Turnstile site key; optional peer dep |
| `data-min-time` | `<form>` | Author | Min ms before submit is credible (default: 3000) |
| `data-bot-hint` | `<form>` | Author | Machine-readable note for AI agents |
| `data-honeypot` | `<input>` | Author | Marks honeypot field; excluded from signal scoring |
| `data-timing-token` | `<input[hidden]>` | Server/SSG | Marks the signed timestamp field |
| `data-bot-score-field` | `<input[hidden]>` | JS enhancement | Injected field carrying signed client score |

---

## Relationship to Endpoint Contract

This spec covers bot protection and submission *integrity* — whether a submission is worth processing at all. It does not cover what the endpoint expects to receive or how it validates and processes the payload beyond bot scoring.

That is the **form endpoint contract**, a separate concern covering:

- POST body shape: field names, types, required/optional
- Server-side validation mirroring HTML5 constraints
- The JSON error response shape consumed by the validation layer (`{ errors: { fieldName: message } }`)
- CSRF protection — distinct from `_vb_token`, which is a bot-timing signal, not a CSRF token
- Content-type negotiation (`application/x-www-form-urlencoded` vs `application/json`)
- Form-type profiles: how contact, registration, subscription, and checkout forms differ at the endpoint

The bot protection layer is agnostic to form type. It runs as Worker middleware before any payload processing and either discards, flags, challenges, or passes. The endpoint contract governs what `acceptAndProcess()` calls.

**Recommended spec**: `FORM-ENDPOINT-CONTRACT.md` with a base contract all VB forms share, form-type profiles layered on top, and explicit cross-reference to this document for the bot gate that runs before it.

---

## Open Questions

1. **Static-site timing tokens**: Build-time tokens are per-build. A patient bot defeats the timing check. Is a Worker HTML transform required for all forms, or only registration/checkout? Contact forms are probably acceptable at per-build.

2. **`vb:beforesubmit` event contract**: Bot scoring hooks into `enhanceForm()` via this event. It needs to be formalised in FORM-VALIDATION-PE.md. Scoring runs before validation — a bot-confident submission should never see a validation error.

3. **Turnstile and no-JS users**: No JS means no client score and no Turnstile token. The absent client score alone pushes the submission to ~50 before other signals. Threshold tuning may be needed to avoid false-positive silent discards for legitimate no-JS users (rare but real, and increasingly assistive-technology contexts).

4. **Email transparency trade-off**: Schema.org and `llms.txt` contact emails are visible to harvesters. This is an intentional trade-off — AI agent usability outweighs harvester risk given modern spam filters. Authors should be able to opt out, using only `data-bot-hint` without exposing email addresses.

5. **CSRF token placement**: `_vb_token` is a bot-timing signal. A separate CSRF token is needed for state-mutating forms. These coexist but serve different purposes. CSRF strategy belongs in FORM-ENDPOINT-CONTRACT.md.
