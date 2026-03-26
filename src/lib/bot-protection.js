/**
 * Bot Protection — Vanilla Breeze
 *
 * Zero-friction bot scoring for forms. Collects behavioural signals
 * (focus events, keyboard activity, mouse movement, timing) and computes
 * a 0–100 bot score. Optionally escalates to Cloudflare Turnstile.
 *
 * Activated by `data-bot-protection` on a `<form>` element.
 * Hooks into the form coordinator via the `vb:beforesubmit` event.
 *
 * Author contract:
 *   <form data-validate data-bot-protection>
 *     <div class="form-trap" aria-hidden="true">
 *       <label for="website">Website</label>
 *       <input type="text" id="website" name="website"
 *              tabindex="-1" autocomplete="one-time-code" data-honeypot />
 *     </div>
 *     ...
 *   </form>
 */

// ── Score encoding ───────────────────────────────────────────────────

/**
 * Light obfuscation for the client-side bot score.
 * Not cryptographically secure — stops casual tampering only.
 * Upgrade to HMAC signing with a server secret for production.
 */
function encodeScore(score) {
  const ts = Date.now();
  const checksum = (score * 7 + ts % 9973) & 0xFFFF;
  return btoa(JSON.stringify({ s: score, t: ts, c: checksum }));
}

// ── Signal scoring ───────────────────────────────────────────────────

function scoreSignals(signals, form, isTouchPrimary) {
  let score = 0;
  const elapsed = signals.submitAt - (signals.firstInteractionAt ?? signals.submitAt);

  // Honeypot check
  const honeypot = form.querySelector('[data-honeypot]');
  if (honeypot && honeypot.value.trim()) score += 80;

  // Interaction checks
  const filledTextFields = [
    ...form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea'),
  ].filter(i => i.value.trim() && !('honeypot' in i.dataset));

  if (filledTextFields.length > 0 && signals.keyboardEventCount === 0) score += 30;
  if (signals.fieldFocusCount === 0) score += 40;
  if (!isTouchPrimary && !signals.mouseMovedInForm) score += 20;

  // Timing checks
  if (elapsed < 1000) score += 80;
  else if (elapsed < 3000) score += 50;

  return Math.min(score, 100);
}

// ── Turnstile lazy loading ───────────────────────────────────────────

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function loadTurnstile(form, sitekey) {
  if (document.querySelector('[data-cf-turnstile-loaded]')) return;

  try {
    await loadScript('https://challenges.cloudflare.com/turnstile/v0/api.js');
    document.head.dataset.cfTurnstileLoaded = '';

    const widget = document.createElement('div');
    widget.className = 'cf-turnstile';
    widget.dataset.sitekey = sitekey;
    widget.dataset.size = 'invisible';
    form.appendChild(widget);
  } catch {
    // Turnstile is optional — if it fails to load, proceed without it
  }
}

// ── Form enhancement ─────────────────────────────────────────────────

/**
 * Attach bot protection to a single form.
 * Collects behavioural signals and scores on vb:beforesubmit.
 */
export function enhanceBotProtection(form) {
  if (form.hasAttribute('data-bot-enhanced')) return;
  form.setAttribute('data-bot-enhanced', '');

  const signals = {
    fieldFocusCount: 0,
    keyboardEventCount: 0,
    mouseMovedInForm: false,
    firstInteractionAt: null,
    submitAt: null,
  };

  const isTouchPrimary = navigator.maxTouchPoints > 0;

  // Passive signal collection
  form.addEventListener('focusin', (e) => {
    if (e.target.matches('input, textarea, select') && !('honeypot' in e.target.dataset)) {
      signals.fieldFocusCount++;
      signals.firstInteractionAt ??= Date.now();
    }
  }, { capture: true });

  form.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) {
      signals.keyboardEventCount++;
    }
  }, { capture: true });

  if (!isTouchPrimary) {
    form.addEventListener('mousemove', () => {
      signals.mouseMovedInForm = true;
    }, { once: true });
  }

  // Score and inject on vb:beforesubmit
  form.addEventListener('vb:beforesubmit', (e) => {
    signals.submitAt = Date.now();
    const score = scoreSignals(signals, form, isTouchPrimary);

    // Inject encoded score as hidden field
    let scoreInput = form.querySelector('[data-bot-score-field]');
    if (!scoreInput) {
      scoreInput = document.createElement('input');
      scoreInput.type = 'hidden';
      scoreInput.name = '_vb_score';
      scoreInput.dataset.botScoreField = '';
      form.appendChild(scoreInput);
    }
    scoreInput.value = encodeScore(score);

    // Escalation
    if (score >= 80) {
      // Silent block — prevent submission entirely
      e.preventDefault();
      // Dispatch a non-cancelable event so authors can react (analytics, etc.)
      form.dispatchEvent(new CustomEvent('vb:botblocked', {
        bubbles: true,
        detail: { score },
      }));
      return;
    }

    if (score >= 60 && form.dataset.turnstileSitekey) {
      loadTurnstile(form, form.dataset.turnstileSitekey);
    }
  });
}

// ── Init ─────────────────────────────────────────────────────────────

/**
 * Initialize bot protection globally.
 * Enhances all forms with `data-bot-protection` and observes for dynamic additions.
 */
export function initBotProtection() {
  for (const form of document.querySelectorAll('form[data-bot-protection]')) {
    enhanceBotProtection(form);
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const el = /** @type {Element} */ (node);
        if (el.matches?.('form[data-bot-protection]')) {
          enhanceBotProtection(/** @type {HTMLFormElement} */ (el));
        }
        el.querySelectorAll?.('form[data-bot-protection]').forEach(f =>
          enhanceBotProtection(/** @type {HTMLFormElement} */ (f))
        );
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
