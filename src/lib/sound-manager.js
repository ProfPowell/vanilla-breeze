/**
 * Sound Manager
 * Optional audio feedback using Web Audio API
 *
 * @example
 * import { SoundManager } from './lib/sound-manager.js';
 *
 * // Initialize (call once, e.g., on user interaction)
 * SoundManager.init();
 *
 * // Enable sounds (disabled by default)
 * SoundManager.enable();
 *
 * // Play sounds
 * SoundManager.play('click');
 * SoundManager.play('success');
 * SoundManager.play('error');
 * SoundManager.play('notification');
 *
 * // Adjust volume (0-1)
 * SoundManager.setVolume(0.5);
 *
 * // Disable sounds
 * SoundManager.disable();
 */

const STORAGE_KEY = 'vb-sound';
const DEFAULTS = { enabled: false, volume: 0.5 };

export const SoundManager = {
  /** @type {AudioContext | null} */
  _ctx: null,

  /** @type {boolean} */
  _enabled: false,

  /** @type {number} */
  _volume: 0.5,

  /** @type {boolean} */
  _initialized: false,

  /**
   * Initialize audio context and load preferences
   * Must be called after user interaction (browser autoplay policy)
   */
  init() {
    if (this._initialized) return this;

    // Load preferences
    const prefs = this._load();
    this._enabled = prefs.enabled;
    this._volume = prefs.volume;

    this._initialized = true;
    return this;
  },

  /**
   * Get or create AudioContext (lazy initialization)
   * @returns {AudioContext}
   * @private
   */
  _getContext() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
    return this._ctx;
  },

  /**
   * Load preferences from localStorage
   * @returns {{ enabled: boolean, volume: number }}
   * @private
   */
  _load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : { ...DEFAULTS };
    } catch {
      return { ...DEFAULTS };
    }
  },

  /**
   * Save preferences to localStorage
   * @param {{ enabled?: boolean, volume?: number }} prefs
   * @private
   */
  _save(prefs) {
    try {
      const current = this._load();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...prefs }));
    } catch {
      // Ignore storage errors
    }
  },

  /**
   * Play a tone using Web Audio API
   * @param {number} frequency - Frequency in Hz
   * @param {number} duration - Duration in seconds
   * @param {OscillatorType} type - Oscillator type
   * @private
   */
  _playTone(frequency, duration, type = 'sine') {
    if (!this._enabled) return;

    const ctx = this._getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.value = this._volume * 0.3;

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    oscillator.stop(ctx.currentTime + duration);
  },

  /**
   * Enable sound effects
   */
  enable() {
    this._enabled = true;
    this._save({ enabled: true });
    // Play click to confirm
    this.play('click');
  },

  /**
   * Disable sound effects
   */
  disable() {
    this._enabled = false;
    this._save({ enabled: false });
  },

  /**
   * Toggle sound enabled state
   * @returns {boolean} New enabled state
   */
  toggle() {
    if (this._enabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this._enabled;
  },

  /**
   * Check if sounds are enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this._enabled;
  },

  /**
   * Set volume level
   * @param {number} volume - Volume from 0 to 1
   */
  setVolume(volume) {
    this._volume = Math.max(0, Math.min(1, volume));
    this._save({ volume: this._volume });
  },

  /**
   * Get current volume level
   * @returns {number}
   */
  getVolume() {
    return this._volume;
  },

  /**
   * Play a named sound effect
   * @param {'click' | 'success' | 'error' | 'notification' | 'soft' | 'tick'} name
   */
  play(name) {
    if (!this._enabled) return;

    switch (name) {
      case 'click':
        this._playTone(800, 0.1);
        break;

      case 'success':
        // C-E-G chord arpeggio
        this._playTone(523, 0.1);
        setTimeout(() => this._playTone(659, 0.1), 100);
        setTimeout(() => this._playTone(784, 0.15), 200);
        break;

      case 'error':
        // Low rumble
        this._playTone(200, 0.15, 'sawtooth');
        setTimeout(() => this._playTone(180, 0.2, 'sawtooth'), 150);
        break;

      case 'notification':
        // High ping
        this._playTone(880, 0.1);
        setTimeout(() => this._playTone(1100, 0.15), 100);
        break;

      case 'soft':
        // Subtle pop
        this._playTone(600, 0.05);
        break;

      case 'tick':
        // Clock tick
        this._playTone(1200, 0.02, 'square');
        break;
    }
  },

  /**
   * Get current state
   * @returns {{ enabled: boolean, volume: number }}
   */
  getState() {
    return {
      enabled: this._enabled,
      volume: this._volume
    };
  }
};

export default SoundManager;
