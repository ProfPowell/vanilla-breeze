/**
 * <text-reader> — Text-to-speech reader with word-level highlighting
 *
 * Attaches a TTS control bar to any article element using the Web Speech API
 * for synthesis and the CSS Custom Highlight API for word tracking.
 * Progressive enhancement: hides itself if the browser lacks speechSynthesis.
 *
 * @attr {string} for - ID of the element to read (required)
 * @attr {string} selectors - Comma-separated selectors for text extraction (default: "p,li")
 * @attr {number} speed - Playback rate 0.5–2 (default: 1)
 * @attr {string} voice - voiceURI to pre-select
 * @attr {string} variant - Set to "icon" for compact trigger with floating toolbar
 * @attr {string} highlight - Set to "false" to disable word highlighting
 * @attr {string} scroll - Set to "false" to disable auto-scroll
 * @attr {string} data-label-play - Play button label (default "Play")
 * @attr {string} data-label-pause - Pause button label (default "Pause")
 * @attr {string} data-label-stop - Stop button label (default "Stop")
 * @attr {string} data-label-reader - Control bar / icon trigger label (default "Article reader")
 * @attr {string} data-label-controls - Icon-variant toolbar label (default "Reader controls")
 * @attr {string} data-label-voice - Voice select label (default "Voice")
 * @attr {string} data-label-loading-voices - Voice select placeholder (default "Loading voices…")
 * @attr {string} data-label-speed - Speed slider label (default "Speed")
 * @attr {string} data-label-slower - Icon toolbar slower button (default "Slower")
 * @attr {string} data-label-faster - Icon toolbar faster button (default "Faster")
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const LABELS = {
  play: 'Play',
  pause: 'Pause',
  stop: 'Stop',
  reader: 'Article reader',
  controls: 'Reader controls',
  voice: 'Voice',
  'loading-voices': 'Loading voices\u2026',
  speed: 'Speed',
  slower: 'Slower',
  faster: 'Faster',
};

/** Subtrees whose text is never spoken. */
const SKIP_SELECTOR = '[aria-hidden="true"], [hidden], script, style, template, text-reader';

const supportsPopover = () => typeof HTMLElement !== 'undefined'
  && Object.prototype.hasOwnProperty.call(HTMLElement.prototype, 'popover');

const hasSpeech = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Primary language subtag, lowercased ("en-GB" -> "en"). */
const primaryLang = (tag) => (tag || '').toLowerCase().split(/[-_]/)[0];

class TextReader extends VBElement {

  // ---------- private fields ----------

  /** @type {HTMLElement | null} */
  #target = null;
  /** @type {SpeechSynthesisUtterance | null} */
  #utterance = null;
  /** @type {Array<{ element: Element, text: string, speechStart: number, speechEnd: number, segments: Array<{ node: Text, start: number, end: number }> }>} */
  #paragraphs = [];
  #fullText = '';
  #currentCharIndex = 0;
  /** @type {ReturnType<typeof setInterval> | null} */
  #keepAlive = null;
  /** @type {CSSStyleSheet | null} */
  #highlightSheet = null;
  /** @type {Highlight | null} */
  #highlight = null;
  /** @type {Promise<SpeechSynthesisVoice[]> | null} */
  #voicesPromise = null;
  #isSpeaking = false;
  #isPaused = false;
  #startTime = 0;

  // control refs
  /** @type {HTMLButtonElement | null} */
  #playBtn = null;
  /** @type {HTMLButtonElement | null} */
  #pauseBtn = null;
  /** @type {HTMLButtonElement | null} */
  #stopBtn = null;
  /** @type {HTMLSelectElement | null} */
  #voiceSelect = null;
  /** @type {HTMLInputElement | null} */
  #speedInput = null;
  /** @type {HTMLSpanElement | null} */
  #speedValue = null;
  /** @type {HTMLDivElement | null} */
  #controls = null;
  // icon variant
  #isIconMode = false;
  /** @type {HTMLButtonElement | null} */
  #triggerBtn = null;
  /** @type {HTMLDivElement | null} */
  #toolbar = null;
  /** Slotted icons moved into generated buttons, restored on teardown. */
  /** @type {Array<{ icon: Element, slot: string }>} */
  #movedIcons = [];
  /** @type {SpeechSynthesisVoice[]} */
  #voiceList = [];

  // ---------- observed attributes ----------

  static get observedAttributes() {
    return ['speed', 'voice', 'for'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;

    // Before setup (initial parse/upgrade) there is nothing to stop or
    // resolve; setup() resolves the target itself.
    if (name === 'for' && oldVal !== null && this.hasAttribute('data-upgraded')) {
      if (this.#isSpeaking) this.stop();
      this.#resolveTarget();
      this.#populateVoiceSelect(this.#voiceList);
    }

    if ((name === 'speed' || name === 'voice') && this.#isSpeaking) {
      this.#restartFromPosition();
    }

    if (name === 'speed') {
      const val = this.#clampSpeed(parseFloat(newVal) || 1);
      if (this.#speedInput) this.#speedInput.value = String(val);
      if (this.#speedValue) this.#speedValue.textContent = `${val}\u00d7`;
    }
  }

  // ---------- lifecycle ----------

  setup() {
    if (!hasSpeech()) {
      this.style.display = 'none';
      return false;
    }

    if (this.getAttribute('variant') === 'icon') {
      this.#renderIcon();
    } else {
      this.#render();
    }

    this.#resolveTarget();
    this.#injectHighlightSheet();
    this.#voicesPromise = this.#loadVoices();
    this.#voicesPromise.then(voices => {
      this.#voiceList = voices;
      this.#populateVoiceSelect(voices);
    });

    this.listen(window, 'beforeunload', this.#handleBeforeUnload);
    return true;
  }

  teardown() {
    // Only cancel the page-global speech queue if this instance owns it.
    if (this.#isSpeaking) this.stop();
    this.#removeHighlightSheet();
    // Remove every generated node so a reconnect rebuilds exactly one set.
    this.#controls?.remove();
    this.#toolbar?.remove();
    this.#triggerBtn?.remove();
    this.#controls = null;
    this.#toolbar = null;
    this.#triggerBtn = null;
    this.#playBtn = this.#pauseBtn = this.#stopBtn = null;
    this.#voiceSelect = null;
    this.#speedInput = null;
    this.#speedValue = null;
    this.#isIconMode = false;
    // Hand slotted icons back to the host so the next setup() can reuse them.
    for (const { icon, slot } of this.#movedIcons) {
      icon.setAttribute('slot', slot);
      this.append(icon);
    }
    this.#movedIcons = [];
  }

  // ---------- public API ----------

  play() {
    if (!hasSpeech()) return;
    if (this.#isPaused) {
      this.resume();
      return;
    }
    if (this.#isSpeaking) return;
    // Re-extract so content injected after setup is picked up.
    this.#buildParagraphMap();
    this.#speak(0);
  }

  pause() {
    if (!this.#isSpeaking || this.#isPaused) return;
    speechSynthesis.pause();
    this.#isPaused = true;
    this.#showPauseState(true);
    this.#emit('text-reader:pause');
  }

  resume() {
    if (!this.#isPaused) return;
    speechSynthesis.resume();
    this.#isPaused = false;
    this.#showPauseState(false);
    this.#emit('text-reader:resume');
  }

  stop() {
    if (!hasSpeech() || !this.#isSpeaking) return;
    this.#utterance = null;
    speechSynthesis.cancel();
    this.#cleanup();
    this.#emit('text-reader:stop');
  }

  get voices() {
    return this.#voicesPromise || this.#loadVoices();
  }

  get speaking() { return this.#isSpeaking; }
  get paused() { return this.#isPaused; }

  get progress() {
    if (!this.#fullText.length) return 0;
    return Math.min(this.#currentCharIndex / this.#fullText.length, 1);
  }

  // ---------- render ----------

  #render() {
    const controls = document.createElement('div');
    controls.setAttribute('part', 'controls');
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', this.#label('reader'));

    // Play
    const playBtn = this.#makeButton('play', this.#label('play'), '\u25b6');
    playBtn.addEventListener('click', () => this.play());

    // Pause
    const pauseBtn = this.#makeButton('pause', this.#label('pause'), '\u23f8');
    pauseBtn.hidden = true;
    pauseBtn.addEventListener('click', () => this.pause());

    // Stop
    const stopBtn = this.#makeButton('stop', this.#label('stop'), '\u23f9');
    stopBtn.disabled = true;
    stopBtn.addEventListener('click', () => this.stop());

    // Voice select
    const voiceSelect = document.createElement('select');
    voiceSelect.setAttribute('aria-label', this.#label('voice'));
    const placeholder = document.createElement('option');
    placeholder.textContent = this.#label('loading-voices');
    voiceSelect.append(placeholder);
    voiceSelect.addEventListener('change', () => {
      if (this.#isSpeaking) this.#restartFromPosition();
    });

    // Speed control
    const speedGroup = document.createElement('label');
    speedGroup.setAttribute('data-speed-group', '');

    const speedVal = document.createElement('span');
    speedVal.setAttribute('data-speed-value', '');
    const initSpeed = this.#clampSpeed(parseFloat(this.getAttribute('speed') ?? '1') || 1);
    speedVal.textContent = `${initSpeed}\u00d7`;

    const speedInput = document.createElement('input');
    speedInput.type = 'range';
    speedInput.min = '0.5';
    speedInput.max = '2';
    speedInput.step = '0.1';
    speedInput.value = String(initSpeed);
    speedInput.setAttribute('aria-label', this.#label('speed'));
    speedInput.addEventListener('input', () => {
      const val = parseFloat(speedInput.value);
      speedVal.textContent = `${val}\u00d7`;
      if (this.#isSpeaking) this.#restartFromPosition();
    });

    speedGroup.append(speedVal, speedInput);

    // Slot custom icons from light DOM children
    this.#moveSlotIcon('icon-play', playBtn);
    this.#moveSlotIcon('icon-pause', pauseBtn);
    this.#moveSlotIcon('icon-stop', stopBtn);

    controls.append(playBtn, pauseBtn, stopBtn, voiceSelect, speedGroup);
    this.prepend(controls);

    this.#controls = controls;
    this.#playBtn = playBtn;
    this.#pauseBtn = pauseBtn;
    this.#stopBtn = stopBtn;
    this.#voiceSelect = voiceSelect;
    this.#speedInput = speedInput;
    this.#speedValue = speedVal;
  }

  #makeButton(name, label, fallbackText) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('part', `button ${name}`);
    btn.setAttribute('aria-label', label);
    btn.textContent = fallbackText;
    return btn;
  }

  #label(key) {
    return this.getAttribute(`data-label-${key}`) || LABELS[key];
  }

  #moveSlotIcon(slotName, button) {
    const icon = this.querySelector(`:scope > [slot="${slotName}"]`);
    if (icon) {
      icon.removeAttribute('slot');
      button.textContent = '';
      button.append(icon);
      this.#movedIcons.push({ icon, slot: slotName });
    }
  }

  // ---------- icon variant ----------

  #renderIcon() {
    this.#isIconMode = true;

    // Defensive: if a prior trigger is still in the tree (e.g. after a
    // disconnect/reconnect cycle from print preview reflow), remove it
    // so we don't end up with duplicates.
    for (const existing of this.querySelectorAll(':scope > [part="trigger"]')) {
      existing.remove();
    }

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.setAttribute('part', 'trigger');
    trigger.setAttribute('aria-label', this.#label('reader'));
    trigger.setAttribute('aria-pressed', 'false');

    const slotIcon = this.querySelector(':scope > [slot="icon-trigger"]');
    if (slotIcon) {
      slotIcon.removeAttribute('slot');
      trigger.append(slotIcon);
      this.#movedIcons.push({ icon: slotIcon, slot: 'icon-trigger' });
    } else {
      const icon = document.createElement('icon-wc');
      icon.setAttribute('name', 'volume-2');
      icon.setAttribute('aria-hidden', 'true');
      trigger.append(icon);
    }

    trigger.addEventListener('click', () => this.#handleTriggerClick());
    this.append(trigger);
    this.#triggerBtn = trigger;

    this.#createToolbar();
  }

  #createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.setAttribute('data-text-reader-toolbar', '');
    toolbar.setAttribute('role', 'group');
    toolbar.setAttribute('aria-label', this.#label('controls'));
    toolbar.hidden = true;
    // Top layer (popover) so ancestors with transforms or containment can't
    // trap the fixed-position toolbar. The DOM position stays right after
    // the trigger, so the tab order goes trigger -> toolbar.
    if (supportsPopover()) toolbar.popover = 'manual';

    const playBtn = this.#makeButton('play', this.#label('play'), '\u25b6');
    playBtn.addEventListener('click', () => this.play());

    const pauseBtn = this.#makeButton('pause', this.#label('pause'), '\u23f8');
    pauseBtn.hidden = true;
    pauseBtn.addEventListener('click', () => this.pause());

    const stopBtn = this.#makeButton('stop', this.#label('stop'), '\u23f9');
    stopBtn.addEventListener('click', () => this.stop());

    const speedDown = this.#makeButton('speed-down', this.#label('slower'), '\u2212');
    speedDown.addEventListener('click', () => this.#adjustSpeed(-0.1));

    const speedVal = document.createElement('span');
    speedVal.setAttribute('data-speed-value', '');
    const initSpeed = this.#clampSpeed(parseFloat(this.getAttribute('speed') ?? '1') || 1);
    speedVal.textContent = `${initSpeed}\u00d7`;

    const speedUp = this.#makeButton('speed-up', this.#label('faster'), '+');
    speedUp.addEventListener('click', () => this.#adjustSpeed(0.1));

    this.#moveSlotIcon('icon-play', playBtn);
    this.#moveSlotIcon('icon-pause', pauseBtn);
    this.#moveSlotIcon('icon-stop', stopBtn);

    toolbar.append(playBtn, pauseBtn, stopBtn, speedDown, speedVal, speedUp);
    this.append(toolbar);

    this.#playBtn = playBtn;
    this.#pauseBtn = pauseBtn;
    this.#stopBtn = stopBtn;
    this.#speedValue = speedVal;
    this.#toolbar = toolbar;

    this.listen(document, 'pointerdown', this.#onToolbarOutsidePointerDown);
    this.listen(document, 'keydown', this.#onToolbarKeyDown);
  }

  #handleTriggerClick() {
    if (!this.#isSpeaking) {
      this.play();
      return;
    }
    // Re-show toolbar if it was dismissed
    if (this.#toolbar?.hidden) {
      this.#showToolbar();
    }
    if (this.#isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  #showToolbar() {
    if (!this.#toolbar || !this.#triggerBtn) return;
    const toolbar = this.#toolbar;
    toolbar.hidden = false;
    if (toolbar.popover && !toolbar.matches(':popover-open')) toolbar.showPopover();
    toolbar.style.visibility = 'hidden';
    requestAnimationFrame(() => {
      this.#positionToolbar();
      toolbar.style.visibility = '';
    });
  }

  #hideToolbar() {
    const toolbar = this.#toolbar;
    if (!toolbar || toolbar.hidden) return;
    // Never strand keyboard focus inside a toolbar that is going away.
    const hadFocus = toolbar.contains(document.activeElement);
    if (toolbar.popover && toolbar.matches(':popover-open')) toolbar.hidePopover();
    toolbar.hidden = true;
    if (hadFocus) this.#triggerBtn?.focus();
  }

  #positionToolbar() {
    const toolbar = this.#toolbar;
    const trigger = this.#triggerBtn;
    if (!toolbar || !trigger) return;

    const tr = trigger.getBoundingClientRect();
    const tw = toolbar.offsetWidth;
    const th = toolbar.offsetHeight;
    const GAP = 8;
    const EDGE = 8;

    // Prefer above the trigger
    let top = tr.top - th - GAP;
    if (top < EDGE) top = tr.bottom + GAP;

    // Center horizontally on trigger
    let left = tr.left + tr.width / 2 - tw / 2;
    const maxLeft = window.innerWidth - tw - EDGE;
    left = Math.max(EDGE, Math.min(left, maxLeft));

    toolbar.style.top = `${top}px`;
    toolbar.style.left = `${left}px`;
  }

  #adjustSpeed(delta) {
    const current = parseFloat(this.getAttribute('speed') ?? '1') || 1;
    const newSpeed = this.#clampSpeed(current + delta);
    this.setAttribute('speed', String(newSpeed));
  }

  #onToolbarOutsidePointerDown = (e) => {
    if (!this.#toolbar || this.#toolbar.hidden) return;
    if (this.#toolbar.contains(e.target)) return;
    if (this.#triggerBtn?.contains(e.target)) return;
    this.#hideToolbar();
  };

  #onToolbarKeyDown = (e) => {
    if (e.key === 'Escape' && this.#toolbar && !this.#toolbar.hidden) {
      const focusInside = this.#toolbar.contains(document.activeElement)
        || this.#triggerBtn === document.activeElement;
      this.#hideToolbar();
      if (focusInside) this.#triggerBtn?.focus();
    }
  };

  // ---------- target resolution ----------

  #resolveTarget() {
    const id = this.getAttribute('for');
    if (!id) {
      console.warn('<text-reader>: missing "for" attribute');
      this.#disableControls();
      return;
    }
    this.#target = document.getElementById(id);
    if (!this.#target) {
      console.warn(`<text-reader>: no element found with id="${id}"`);
      this.#disableControls();
      return;
    }
    this.#buildParagraphMap();
    this.#enableControls();
  }

  #disableControls() {
    if (this.#playBtn) this.#playBtn.disabled = true;
    if (this.#stopBtn) this.#stopBtn.disabled = true;
  }

  #enableControls() {
    if (this.#playBtn) this.#playBtn.disabled = false;
  }

  // ---------- text extraction ----------

  #buildParagraphMap() {
    const target = this.#target;
    if (!target) return;

    const selectors = this.getAttribute('selectors') || 'p,li';
    const candidates = [...target.querySelectorAll(selectors)];

    // Filter out whole candidates inside pre, code, or hidden subtrees
    const excluded = el =>
      el.closest('pre') || el.closest('code') || el.closest(SKIP_SELECTOR);

    this.#paragraphs = [];
    let offset = 0;

    for (const el of candidates) {
      if (excluded(el)) continue;
      // One text walk defines both the spoken text and the highlight
      // offsets, so they can never drift apart.
      const segments = [];
      let text = '';
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        // The candidate itself is already known not to be inside a skipped
        // subtree, so any match here is a hidden descendant (aria-hidden
        // icon, [hidden] note, nested reader...).
        acceptNode: node => node.parentElement?.closest(SKIP_SELECTOR)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT,
      });
      while (walker.nextNode()) {
        const node = /** @type {Text} */ (walker.currentNode);
        const value = node.data;
        if (!value) continue;
        segments.push({ node, start: text.length, end: text.length + value.length });
        text += value;
      }
      if (!text.trim()) continue;

      this.#paragraphs.push({
        element: el,
        text,
        speechStart: offset,
        speechEnd: offset + text.length,
        segments,
      });
      offset += text.length + 1; // +1 for space separator
    }

    this.#fullText = this.#paragraphs.map(p => p.text).join(' ');
  }

  /** Language of the content being read: nearest [lang] on the target. */
  #contentLang() {
    const el = this.#target?.closest('[lang]');
    return el?.getAttribute('lang') || document.documentElement.lang || '';
  }

  // ---------- speech ----------

  #speak(fromIndex) {
    if (!this.#fullText) return;

    const rawText = fromIndex > 0 ? this.#fullText.slice(fromIndex) : this.#fullText;
    if (!rawText.trim()) return;

    // Browser TTS engines silently halt on literal `<` — the character is
    // reserved as the start of an SSML tag. If a paragraph contains text
    // extracted from an inline <code> element (e.g. "<geo-map>"), speech
    // stops after the first word before the `<` and onend fires with no
    // error. Replace angle brackets with spaces so playback continues;
    // same-length substitution preserves charIndex alignment so the DOM
    // highlight range math stays correct.
    const text = rawText.replace(/[<>]/g, ' ');

    const utterance = new SpeechSynthesisUtterance(text);
    const lang = this.#contentLang();
    if (lang) utterance.lang = lang;
    utterance.rate = this.#clampSpeed(parseFloat(this.#speedInput?.value ?? this.getAttribute('speed') ?? '1') || 1);

    // Apply selected voice
    const selectedOption = this.#voiceSelect?.selectedOptions[0];
    if (selectedOption?.dataset.voiceUri) {
      const voice = speechSynthesis.getVoices().find(
        v => v.voiceURI === selectedOption.dataset.voiceUri
      );
      if (voice) utterance.voice = voice;
    } else if (lang) {
      // No picker (icon variant): prefer a voice for the content language
      const want = primaryLang(lang);
      const voices = speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.toLowerCase() === lang.toLowerCase())
        || voices.find(v => primaryLang(v.lang) === want && v.default)
        || voices.find(v => primaryLang(v.lang) === want);
      if (voice) utterance.voice = voice;
    }

    utterance.onboundary = (e) => {
      if (this.#utterance !== utterance) return;
      if (e.name !== 'word') return;
      const charIndex = fromIndex + e.charIndex;
      this.#currentCharIndex = charIndex;

      // Determine charLength — Firefox may omit it
      let charLength = e.charLength;
      if (!charLength) {
        const rest = this.#fullText.slice(charIndex);
        const match = rest.match(/^\S+/);
        charLength = match ? match[0].length : 1;
      }

      this.#highlightWord(charIndex, charLength);

      this.#emit('text-reader:word', {
        word: this.#fullText.slice(charIndex, charIndex + charLength),
        charIndex,
        element: this.#findParagraph(charIndex)?.element,
      });
    };

    utterance.onend = () => {
      // A stale utterance (replaced by a restart, or stopped) is ignored.
      if (this.#utterance !== utterance) return;
      const duration = Date.now() - this.#startTime;
      this.#cleanup();
      this.#emit('text-reader:end', { duration });
    };

    utterance.onerror = (e) => {
      if (this.#utterance !== utterance) return;
      // Our own utterance was cancelled from elsewhere (another reader took
      // over the global speech queue): reset to idle instead of looking
      // stuck in the speaking state.
      if (e.error === 'interrupted' || e.error === 'canceled') {
        this.#cleanup();
        this.#emit('text-reader:stop');
        return;
      }
      // Surface real errors to the console so silent-halt regressions
      // (e.g. unescaped angle brackets, engine-rejected characters) are
      // visible during development instead of appearing as mysterious
      // early end-of-speech.
      console.warn('<text-reader>: SpeechSynthesisUtterance error:', e.error);
      this.#cleanup();
      this.#emit('text-reader:error', { error: e.error });
    };

    this.#utterance = utterance;
    this.#isSpeaking = true;
    this.#isPaused = false;
    this.#startTime = Date.now();
    this.#currentCharIndex = fromIndex;

    this.#showSpeakingState(true);
    speechSynthesis.cancel(); // clear any stale queue
    speechSynthesis.speak(utterance);
    this.#startKeepAlive();

    this.#emit('text-reader:play', {
      voice: utterance.voice?.name,
      speed: utterance.rate,
    });
  }

  #restartFromPosition() {
    const idx = this.#currentCharIndex;
    this.#utterance = null; // the cancelled utterance's events are now stale
    speechSynthesis.cancel();
    this.#stopKeepAlive();
    // Small delay to let cancel settle
    requestAnimationFrame(() => this.#speak(idx));
  }

  // ---------- Chrome keep-alive ----------

  #startKeepAlive() {
    this.#stopKeepAlive();
    this.#keepAlive = setInterval(() => {
      if (!speechSynthesis.speaking) {
        this.#stopKeepAlive();
        return;
      }
      speechSynthesis.pause();
      speechSynthesis.resume();
    }, 10_000);
  }

  #stopKeepAlive() {
    if (this.#keepAlive) clearInterval(this.#keepAlive);
    this.#keepAlive = null;
  }

  // ---------- highlighting ----------

  #injectHighlightSheet() {
    if (!CSS.highlights) return;
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      ::highlight(text-reader-word) {
        background-color: var(--text-reader-highlight, Mark);
        color: var(--text-reader-highlight-text, MarkText);
      }
    `);
    this.#highlightSheet = sheet;
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  }

  #removeHighlightSheet() {
    const sheet = this.#highlightSheet;
    if (sheet) {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
        s => s !== sheet
      );
      this.#highlightSheet = null;
    }
    this.#clearHighlight();
  }

  #highlightWord(charIndex, charLength) {
    if (!CSS.highlights) return;
    if (this.getAttribute('highlight') === 'false') return;

    const para = this.#findParagraph(charIndex);
    if (!para) return;

    const localOffset = charIndex - para.speechStart;
    const range = this.#findTextRange(para, localOffset, charLength);
    if (!range) return;

    const highlight = new Highlight(range);
    CSS.highlights.set('text-reader-word', highlight);
    this.#highlight = highlight;

    // Scroll into view
    if (this.getAttribute('scroll') !== 'false') {
      const rect = range.getBoundingClientRect();
      const viewH = window.innerHeight;
      if (rect.top < 0 || rect.bottom > viewH) {
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        para.element.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
      }
    }
  }

  #clearHighlight() {
    if (CSS.highlights) {
      CSS.highlights.delete('text-reader-word');
    }
    this.#highlight = null;
  }

  // ---------- paragraph lookup (binary search) ----------

  #findParagraph(charIndex) {
    const paras = this.#paragraphs;
    let lo = 0;
    let hi = paras.length - 1;

    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const p = paras[mid];
      if (charIndex < p.speechStart) {
        hi = mid - 1;
      } else if (charIndex >= p.speechEnd) {
        lo = mid + 1;
      } else {
        return p;
      }
    }
    return null;
  }

  // ---------- text range finder ----------

  /**
   * Map a paragraph-local [offset, offset+length) onto the text nodes
   * recorded by #buildParagraphMap. Words that span inline elements
   * (e.g. "re<em>use</em>") get a range across both nodes.
   */
  #findTextRange(para, localOffset, length) {
    const segs = para.segments;
    const end = localOffset + length;
    const startSeg = segs.find(sg => localOffset >= sg.start && localOffset < sg.end);
    if (!startSeg || !startSeg.node.isConnected) return null;
    const endSeg = segs.find(sg => end > sg.start && end <= sg.end) || startSeg;
    const range = document.createRange();
    range.setStart(startSeg.node, localOffset - startSeg.start);
    if (endSeg.node.isConnected && endSeg.start >= startSeg.start) {
      range.setEnd(endSeg.node, Math.min(end - endSeg.start, endSeg.node.length));
    } else {
      range.setEnd(startSeg.node, startSeg.node.length);
    }
    return range;
  }

  // ---------- voice loading ----------

  async #loadVoices() {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) return voices;

    return new Promise(resolve => {
      const handler = () => {
        speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(speechSynthesis.getVoices());
      };
      speechSynthesis.addEventListener('voiceschanged', handler);
      // Timeout fallback — some browsers never fire voiceschanged
      setTimeout(() => {
        speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(speechSynthesis.getVoices());
      }, 3000);
    });
  }

  #populateVoiceSelect(voices) {
    if (!this.#voiceSelect || !voices.length) return;

    const select = this.#voiceSelect;
    select.innerHTML = '';

    // Prefer voices matching the content language (nearest [lang] on the
    // target, falling back to <html lang>)
    const lang = primaryLang(this.#contentLang() || 'en');
    const matches = v => primaryLang(v.lang) === lang;
    const langVoices = voices.filter(matches);
    const otherVoices = voices.filter(v => !matches(v));
    const sorted = [...langVoices, ...otherVoices];

    const preferredURI = this.getAttribute('voice');

    for (const v of sorted) {
      const opt = document.createElement('option');
      opt.textContent = `${v.name} (${v.lang})`;
      opt.dataset.voiceUri = v.voiceURI;
      if (preferredURI && v.voiceURI === preferredURI) opt.selected = true;
      select.append(opt);
    }

    // If no preferred was set, select the first lang-matched default
    if (!preferredURI) {
      const defaultVoice = langVoices.find(v => v.default) || langVoices[0];
      if (defaultVoice) {
        const opt = [...select.options].find(
          o => o.dataset.voiceUri === defaultVoice.voiceURI
        );
        if (opt) opt.selected = true;
      }
    }
  }

  // ---------- UI state ----------

  /**
   * Swap transport-button visibility. Play/Pause are separate buttons, so
   * if the button that is being hidden (or disabled) had focus, focus moves
   * to the button that replaced it and keyboard users don't fall back to
   * <body>. Focus is read before the DOM change: hiding a focused element
   * can blur it during the next style update.
   * @param {() => void} change
   * @param {Array<[HTMLElement | null, HTMLElement | null]>} handoffs - [from, to]
   */
  #swapButtons(change, handoffs) {
    const active = document.activeElement;
    change();
    for (const [from, to] of handoffs) {
      if (from && to && active === from && !to.hidden && !(/** @type {HTMLButtonElement} */ (to).disabled)) {
        to.focus();
        return;
      }
    }
  }

  #showSpeakingState(speaking) {
    if (!this.#playBtn || !this.#pauseBtn || !this.#stopBtn) return;
    const play = this.#playBtn;
    const pause = this.#pauseBtn;
    const stop = this.#stopBtn;
    this.#swapButtons(() => {
      play.hidden = speaking;
      pause.hidden = !speaking;
      stop.disabled = !speaking;
    }, speaking ? [[play, pause]] : [[pause, play], [stop, play]]);
    if (this.#isIconMode) {
      if (this.#triggerBtn) this.#triggerBtn.setAttribute('aria-pressed', String(speaking));
      if (speaking) this.#showToolbar(); else this.#hideToolbar();
    }
  }

  #showPauseState(paused) {
    if (!this.#playBtn || !this.#pauseBtn) return;
    const play = this.#playBtn;
    const pause = this.#pauseBtn;
    this.#swapButtons(() => {
      play.hidden = !paused;
      pause.hidden = paused;
    }, paused ? [[pause, play]] : [[play, pause]]);
  }

  #cleanup() {
    this.#isSpeaking = false;
    this.#isPaused = false;
    this.#currentCharIndex = 0;
    this.#utterance = null;
    this.#stopKeepAlive();
    this.#clearHighlight();
    this.#showSpeakingState(false);
  }

  // ---------- helpers ----------

  #clampSpeed(val) {
    return Math.round(Math.max(0.5, Math.min(2, val)) * 10) / 10;
  }

  #emit(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
  }

  #handleBeforeUnload = () => {
    if (this.#isSpeaking) speechSynthesis.cancel();
  };
}

registerComponent('text-reader', TextReader);
export { TextReader };
