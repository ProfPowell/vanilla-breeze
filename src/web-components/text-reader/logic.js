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
 * @attr {string} highlight - Set to "false" to disable word highlighting
 * @attr {string} scroll - Set to "false" to disable auto-scroll
 */

class TextReader extends HTMLElement {

  // ---------- private fields ----------

  /** @type {HTMLElement | null} */
  #target = null;
  /** @type {SpeechSynthesisUtterance | null} */
  #utterance = null;
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

  // ---------- observed attributes ----------

  static get observedAttributes() {
    return ['speed', 'voice', 'for'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;

    if (name === 'for') {
      this.stop();
      this.#resolveTarget();
    }

    if ((name === 'speed' || name === 'voice') && this.#isSpeaking) {
      this.#restartFromPosition();
    }

    if (name === 'speed' && this.#speedInput) {
      const val = this.#clampSpeed(parseFloat(newVal) || 1);
      this.#speedInput.value = String(val);
      if (this.#speedValue) this.#speedValue.textContent = `${val}\u00d7`;
    }
  }

  // ---------- lifecycle ----------

  connectedCallback() {
    if (!('speechSynthesis' in window)) {
      this.style.display = 'none';
      return;
    }

    this.#render();
    this.#resolveTarget();
    this.#injectHighlightSheet();
    this.#voicesPromise = this.#loadVoices();
    this.#voicesPromise.then(voices => this.#populateVoiceSelect(voices));

    window.addEventListener('beforeunload', this.#handleBeforeUnload);
  }

  disconnectedCallback() {
    this.stop();
    this.#removeHighlightSheet();
    window.removeEventListener('beforeunload', this.#handleBeforeUnload);
  }

  // ---------- public API ----------

  play() {
    if (this.#isPaused) {
      this.resume();
      return;
    }
    if (this.#isSpeaking) return;
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
    controls.setAttribute('aria-label', 'Article reader');

    // Play
    const playBtn = this.#makeButton('play', this.getAttribute('label-play') || 'Play', '\u25b6');
    playBtn.addEventListener('click', () => this.play());

    // Pause
    const pauseBtn = this.#makeButton('pause', this.getAttribute('label-pause') || 'Pause', '\u23f8');
    pauseBtn.hidden = true;
    pauseBtn.addEventListener('click', () => this.pause());

    // Stop
    const stopBtn = this.#makeButton('stop', this.getAttribute('label-stop') || 'Stop', '\u23f9');
    stopBtn.disabled = true;
    stopBtn.addEventListener('click', () => this.stop());

    // Voice select
    const voiceSelect = document.createElement('select');
    voiceSelect.setAttribute('aria-label', 'Voice');
    const placeholder = document.createElement('option');
    placeholder.textContent = 'Loading voices\u2026';
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
    speedInput.setAttribute('aria-label', 'Speed');
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

  #moveSlotIcon(slotName, button) {
    const icon = this.querySelector(`[slot="${slotName}"]`);
    if (icon) {
      icon.removeAttribute('slot');
      button.textContent = '';
      button.append(icon);
    }
  }

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

    // Filter out elements inside pre, code, aria-hidden
    const excluded = el =>
      el.closest('pre') || el.closest('code') || el.closest('[aria-hidden="true"]');

    this.#paragraphs = [];
    let offset = 0;

    for (const el of candidates) {
      if (excluded(el)) continue;
      const text = el.textContent.trim();
      if (!text) continue;

      this.#paragraphs.push({
        element: el,
        text,
        speechStart: offset,
        speechEnd: offset + text.length,
      });
      offset += text.length + 1; // +1 for space separator
    }

    this.#fullText = this.#paragraphs.map(p => p.text).join(' ');
  }

  // ---------- speech ----------

  #speak(fromIndex) {
    if (!this.#fullText) return;

    const text = fromIndex > 0 ? this.#fullText.slice(fromIndex) : this.#fullText;
    if (!text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.#clampSpeed(parseFloat(this.#speedInput?.value ?? '1') || 1);

    // Apply selected voice
    const selectedOption = this.#voiceSelect?.selectedOptions[0];
    if (selectedOption?.dataset.voiceUri) {
      const voice = speechSynthesis.getVoices().find(
        v => v.voiceURI === selectedOption.dataset.voiceUri
      );
      if (voice) utterance.voice = voice;
    }

    utterance.onboundary = (e) => {
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
      const duration = Date.now() - this.#startTime;
      this.#cleanup();
      this.#emit('text-reader:end', { duration });
    };

    utterance.onerror = (e) => {
      // "interrupted" fires on cancel — not a real error
      if (e.error === 'interrupted' || e.error === 'canceled') return;
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
    const range = this.#findTextRange(para.element, localOffset, charLength);
    if (!range) return;

    const highlight = new Highlight(range);
    CSS.highlights.set('text-reader-word', highlight);
    this.#highlight = highlight;

    // Scroll into view
    if (this.getAttribute('scroll') !== 'false') {
      const rect = range.getBoundingClientRect();
      const viewH = window.innerHeight;
      if (rect.top < 0 || rect.bottom > viewH) {
        para.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

  // ---------- text range finder (TreeWalker) ----------

  #findTextRange(element, localOffset, length) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let accumulated = 0;

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const nodeText = node.textContent ?? '';
      // Skip whitespace-only text nodes
      if (!nodeText.trim()) continue;

      const nodeLen = nodeText.length;

      if (accumulated + nodeLen > localOffset) {
        const startInNode = localOffset - accumulated;
        const range = document.createRange();
        range.setStart(node, Math.min(startInNode, nodeLen));

        const endInNode = startInNode + length;
        if (endInNode <= nodeLen) {
          range.setEnd(node, endInNode);
        } else {
          // Word spans multiple text nodes — extend to end of current
          range.setEnd(node, nodeLen);
        }
        return range;
      }
      accumulated += nodeLen;
    }
    return null;
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

    // Prefer voices matching page lang
    const lang = document.documentElement.lang || 'en';
    const langVoices = voices.filter(v => v.lang.startsWith(lang));
    const otherVoices = voices.filter(v => !v.lang.startsWith(lang));
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

  #showSpeakingState(speaking) {
    if (!this.#playBtn || !this.#pauseBtn || !this.#stopBtn) return;
    if (speaking) {
      this.#playBtn.hidden = true;
      this.#pauseBtn.hidden = false;
      this.#stopBtn.disabled = false;
    } else {
      this.#playBtn.hidden = false;
      this.#pauseBtn.hidden = true;
      this.#stopBtn.disabled = true;
    }
  }

  #showPauseState(paused) {
    if (!this.#playBtn || !this.#pauseBtn) return;
    this.#playBtn.hidden = !paused;
    this.#pauseBtn.hidden = paused;
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
    speechSynthesis.cancel();
  };
}

customElements.define('text-reader', TextReader);
export { TextReader };
