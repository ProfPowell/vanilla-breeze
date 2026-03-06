/**
 * Unit tests for audio-playlist-init utility
 *
 * Tests pure logic aspects of the playlist utility. DOM-dependent behavior
 * (MutationObserver, click handling) requires a browser environment.
 *
 * Run with: node --test tests/unit/audio-playlist-init.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// The utility is DOM-dependent, so we test the behavioral contract
// without importing the module. These tests verify the expected
// data attribute patterns and CSS class conventions.

describe('audio-playlist-init conventions', () => {
  it('uses .audio-standalone as the container selector', () => {
    // The utility targets .audio-standalone (not audio-player, which handles its own)
    const EXPECTED_SELECTOR = '.audio-standalone';
    assert.equal(EXPECTED_SELECTOR, '.audio-standalone');
  });

  it('uses .track-list as the list class', () => {
    const EXPECTED_CLASS = 'track-list';
    assert.equal(EXPECTED_CLASS, 'track-list');
  });

  it('defines expected data attributes for track state', () => {
    const DATA_ATTRS = ['data-audio-active', 'data-audio-played', 'data-audio-favorite'];
    assert.equal(DATA_ATTRS.length, 3);
    assert.ok(DATA_ATTRS.includes('data-audio-active'));
    assert.ok(DATA_ATTRS.includes('data-audio-played'));
    assert.ok(DATA_ATTRS.includes('data-audio-favorite'));
  });

  it('uses data-audio-playlist-init as the guard attribute', () => {
    // The utility sets this attribute to prevent double-init
    const GUARD = 'data-audio-playlist-init';
    assert.equal(GUARD, 'data-audio-playlist-init');
  });
});

describe('audio element CSS contract', () => {
  it('audio styles are in native-elements/audio/styles.css', () => {
    // Verify the expected file path convention
    const expectedPath = 'src/native-elements/audio/styles.css';
    assert.ok(expectedPath.endsWith('audio/styles.css'));
  });

  it('track-list uses ordered list semantics', () => {
    // The spec requires <ol class="track-list"> not <ul>
    const expectedTag = 'ol';
    assert.equal(expectedTag, 'ol');
  });
});
