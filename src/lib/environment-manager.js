/**
 * Environment Manager
 *
 * Computes environmental hue modifiers based on time of day and season.
 * All features are opt-in toggles in settings-panel.
 *
 * Uses the existing @property-registered --hue-primary, --hue-secondary,
 * --hue-accent values which already animate via CSS transitions.
 * EnvironmentManager reads the theme's base hues, applies additive offsets,
 * and sets them as inline styles on :root. CSS handles the smooth shift.
 *
 * Listens for 'theme-change' events to re-capture base hues when the user
 * switches themes. Manages its own localStorage key independently of ThemeManager.
 */

const ENV_KEY = 'vb-environment';
const ENV_DEFAULTS = { timeOfDay: false, seasonal: false };
const UPDATE_INTERVAL = 15 * 60 * 1000; // 15 minutes

export function lerp(a, b, t) {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

export const EnvironmentManager = {
  _timer: null,
  _baseHues: null,
  _timeOverride: null,
  _monthOverride: null,

  /** Initialize — read prefs, start tick loop if any source enabled */
  init() {
    const prefs = this.load();
    if (prefs.timeOfDay || prefs.seasonal) {
      this._captureBaseHues();
      this._update();
      this._startLoop();
    }

    // Re-capture base hues whenever the theme changes
    window.addEventListener('theme-change', () => {
      if (!this._hasActiveSource()) return;
      requestAnimationFrame(() => {
        this._captureBaseHues();
        this._update();
      });
    });
  },

  /** Load environment prefs from localStorage */
  load() {
    try {
      const stored = localStorage.getItem(ENV_KEY);
      return stored ? { ...ENV_DEFAULTS, ...JSON.parse(stored) } : { ...ENV_DEFAULTS };
    } catch {
      return { ...ENV_DEFAULTS };
    }
  },

  /** Save environment prefs to localStorage */
  save(prefs) {
    try {
      localStorage.setItem(ENV_KEY, JSON.stringify(prefs));
    } catch { /* ignore */ }
    return prefs;
  },

  /** Override time for demos/testing. Pass null to clear. */
  setTimeOverride(hours) {
    this._timeOverride = hours;
    if (this._hasActiveSource()) this._update();
  },

  /** Override month for demos/testing (0-11). Pass null to clear. */
  setMonthOverride(month) {
    this._monthOverride = month;
    if (this._hasActiveSource()) this._update();
  },

  /** Enable/disable a source, restart loop as needed */
  setSource(source, enabled) {
    const prefs = { ...this.load(), [source]: enabled };
    this.save(prefs);

    if (enabled) {
      this._captureBaseHues();
      this._update();
      this._startLoop();
    } else {
      // If no sources active, clean up
      if (!this._hasActiveSource(prefs)) {
        this._clearModifiers();
        this._stopLoop();
      } else {
        // Recalculate with remaining sources
        this._update();
      }
    }
  },

  /** Check if any source is active */
  _hasActiveSource(prefs) {
    const p = prefs || this.load();
    return p.timeOfDay || p.seasonal;
  },

  /** Capture the theme's base hue values (before any env modifiers) */
  _captureBaseHues() {
    // Clear our inline overrides first so we read the theme's actual values
    const root = document.documentElement;
    root.style.removeProperty('--hue-primary');
    root.style.removeProperty('--hue-secondary');
    root.style.removeProperty('--hue-accent');

    // Read hue values directly from CSSOM to avoid animation interpolation.
    // @property-registered --hue-* values are animatable, so getComputedStyle
    // returns mid-transition values during View Transitions.
    const theme = root.getAttribute('data-theme');
    if (theme) {
      const selector = `[data-theme~="${theme}"]`;
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText?.includes(selector) && !rule.selectorText.includes('dark')) {
              const h = rule.style?.getPropertyValue('--hue-primary');
              if (h) {
                this._baseHues = {
                  primary: parseFloat(h) || 260,
                  secondary: parseFloat(rule.style.getPropertyValue('--hue-secondary')) || 200,
                  accent: parseFloat(rule.style.getPropertyValue('--hue-accent')) || 30,
                };
                return;
              }
            }
          }
        } catch { /* cross-origin sheet */ }
      }
    }
    this._baseHues = { primary: 260, secondary: 200, accent: 30 };
  },

  /** Compute and apply all active modifiers */
  _update() {
    const prefs = this.load();
    let hueOffset = 0;

    if (prefs.timeOfDay) hueOffset += this._getTimeOfDayOffset();
    if (prefs.seasonal) hueOffset += this._getSeasonalOffset();

    const root = document.documentElement;
    if (hueOffset !== 0 && this._baseHues) {
      root.style.setProperty('--hue-primary', String(this._baseHues.primary + hueOffset));
      root.style.setProperty('--hue-secondary', String(this._baseHues.secondary + hueOffset));
      // Accent shifts at half rate for subtlety
      root.style.setProperty('--hue-accent', String(this._baseHues.accent + hueOffset * 0.5));
    } else if (hueOffset === 0) {
      // No offset — remove inline overrides, let theme CSS cascade
      this._clearModifiers();
    }
  },

  /** Remove inline overrides — let theme CSS cascade */
  _clearModifiers() {
    const root = document.documentElement;
    root.style.removeProperty('--hue-primary');
    root.style.removeProperty('--hue-secondary');
    root.style.removeProperty('--hue-accent');
  },

  /**
   * Time-of-day hue offset curve.
   *
   * Time        Offset    Effect
   * ──────────────────────────────────
   * 05:00–07:00  +20      Golden sunrise warmth
   * 07:00–10:00  +5       Morning settling
   * 10:00–14:00   0       Midday — theme's natural colors
   * 14:00–17:00  -5       Afternoon cool shift
   * 17:00–19:00  +15      Sunset warmth
   * 19:00–21:00  -10      Evening blue shift
   * 21:00–05:00  -20      Night deep blue
   */
  _getTimeOfDayOffset() {
    const t = this._timeOverride ?? (new Date().getHours() + new Date().getMinutes() / 60);

    if (t < 5)  return -20;
    if (t < 7)  return lerp(-20, 20, (t - 5) / 2);
    if (t < 10) return lerp(20, 5, (t - 7) / 3);
    if (t < 14) return lerp(5, 0, (t - 10) / 4);
    if (t < 17) return lerp(0, -5, (t - 14) / 3);
    if (t < 19) return lerp(-5, 15, (t - 17) / 2);
    if (t < 21) return lerp(15, -10, (t - 19) / 2);
    return lerp(-10, -20, (t - 21) / 8);
  },

  /** Read site-configured hemisphere. Falls back to Northern hemisphere. */
  _getHemisphere() {
    return window.__VB_ENV_LOCATION?.hemisphere || 'north';
  },

  /**
   * Seasonal accent modifier.
   * Warmer in summer, cooler in winter.
   * Hemisphere-aware (flips 6 months for southern).
   */
  _getSeasonalOffset() {
    const month = this._monthOverride ?? new Date().getMonth(); // 0-11
    const south = this._getHemisphere() === 'south';
    const m = south ? (month + 6) % 12 : month;

    if (m >= 2 && m <= 4)  return 5;   // Spring: slightly warm
    if (m >= 5 && m <= 7)  return 10;  // Summer: warm gold shift
    if (m >= 8 && m <= 10) return -5;  // Autumn: slight cool
    return -10;                         // Winter: cool blue shift
  },

  _startLoop() {
    if (this._timer) return;
    this._timer = setInterval(() => this._update(), UPDATE_INTERVAL);
  },

  _stopLoop() {
    clearInterval(this._timer);
    this._timer = null;
  },
};
