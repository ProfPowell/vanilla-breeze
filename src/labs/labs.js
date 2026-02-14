/**
 * Vanilla Breeze Labs JavaScript
 *
 * Experimental components and utilities for the Vanilla Breeze design system.
 * These features are in development and may change or be removed.
 */

/**
 * Sound Effects Manager
 *
 * Provides audio feedback for UI interactions using Web Audio API.
 * Sound is disabled by default and must be explicitly enabled.
 *
 * @example
 * // Enable sound
 * VBLabs.sound.enable();
 *
 * // Play a sound
 * VBLabs.sound.play('click');
 *
 * // Available sounds: click, success, error, notification
 */
class SoundManager {
  constructor() {
    this.audioContext = null;
    this.enabled = false;
    this.volume = 0.5;
  }

  enable() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    this.enabled = true;
    return this;
  }

  disable() {
    this.enabled = false;
    return this;
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    return this;
  }

  playTone(frequency, duration, type = 'sine') {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.value = this.volume * 0.3;

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration
    );
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  play(soundName) {
    const sounds = {
      click: () => this.playTone(800, 0.1),
      success: () => {
        this.playTone(523, 0.1);
        setTimeout(() => this.playTone(659, 0.1), 100);
        setTimeout(() => this.playTone(784, 0.15), 200);
      },
      error: () => {
        this.playTone(200, 0.15, 'sawtooth');
        setTimeout(() => this.playTone(180, 0.2, 'sawtooth'), 150);
      },
      notification: () => {
        this.playTone(880, 0.1);
        setTimeout(() => this.playTone(1100, 0.15), 100);
      },
    };

    if (sounds[soundName]) {
      sounds[soundName]();
    }
  }
}

/**
 * Theme Preview Manager
 *
 * Provides live theme preview without committing changes.
 * Useful for theme builders and preview interfaces.
 *
 * @example
 * // Preview a theme
 * VBLabs.themePreview.preview('cyber');
 *
 * // Commit the previewed theme
 * VBLabs.themePreview.commit();
 *
 * // Cancel preview and restore original
 * VBLabs.themePreview.cancel();
 */
class ThemePreviewManager {
  constructor() {
    this.originalTheme = null;
    this.previewTheme = null;
  }

  preview(themeName) {
    if (this.originalTheme === null) {
      this.originalTheme = document.body.dataset.theme || '';
    }
    this.previewTheme = themeName;

    if (themeName) {
      document.body.dataset.theme = themeName;
    } else {
      delete document.body.dataset.theme;
    }

    return this;
  }

  commit() {
    this.originalTheme = this.previewTheme;
    this.previewTheme = null;
    return this;
  }

  cancel() {
    if (this.originalTheme !== null) {
      if (this.originalTheme) {
        document.body.dataset.theme = this.originalTheme;
      } else {
        delete document.body.dataset.theme;
      }
    }
    this.originalTheme = null;
    this.previewTheme = null;
    return this;
  }
}

/**
 * Stagger Animation Controller
 *
 * Programmatically control stagger animations.
 *
 * @example
 * // Replay stagger animation
 * VBLabs.stagger.replay(container);
 *
 * // Set custom delay
 * VBLabs.stagger.setDelay(100);
 */
class StaggerController {
  constructor() {
    this.delay = 50;
  }

  setDelay(ms) {
    this.delay = ms;
    document.documentElement.style.setProperty(
      '--motion-stagger-delay',
      `${ms}ms`
    );
    return this;
  }

  replay(container) {
    if (!container) return this;

    const children = container.children;
    for (const child of children) {
      child.style.animation = 'none';
      void child.offsetWidth; // Force reflow
      child.style.animation = '';
    }
    return this;
  }
}

/**
 * VBLabs namespace
 *
 * Access experimental features through this namespace.
 */
const VBLabs = {
  sound: new SoundManager(),
  themePreview: new ThemePreviewManager(),
  stagger: new StaggerController(),

  /**
   * Initialize Labs features
   *
   * Call this after DOM is ready to enable auto-features.
   */
  init() {
    // Auto-bind sound to elements with data-labs-sound attribute
    document.querySelectorAll('[data-labs-sound]').forEach((el) => {
      el.addEventListener('click', () => {
        this.sound.play(el.dataset.labsSound);
      });
    });

    console.log('Vanilla Breeze Labs initialized');
    return this;
  },
};

// Export for ES modules
export { VBLabs, SoundManager, ThemePreviewManager, StaggerController };

// Also attach to window for script tag usage
if (typeof window !== 'undefined') {
  window.VBLabs = VBLabs;
}
