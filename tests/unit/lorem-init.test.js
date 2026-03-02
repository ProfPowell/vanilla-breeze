/**
 * Unit tests for lorem-init utility
 *
 * Tests pure logic functions (text generation, corpus detection, value parsing).
 * DOM-dependent behavior (MutationObserver, element filling) is tested via Playwright.
 *
 * Run with: node --test tests/unit/lorem-init.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ---------- Corpuses (replicated from source) ----------

const LATIN = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum.';

const CORPUSES = {
  latin: LATIN,
  cjk: 'CJK placeholder text',
  arabic: 'Arabic placeholder text',
  cyrillic: 'Cyrillic placeholder text',
};

const LANG_MAP = {
  ja: 'cjk', zh: 'cjk', ko: 'cjk',
  ar: 'arabic', fa: 'arabic', ur: 'arabic', he: 'arabic',
  ru: 'cyrillic', uk: 'cyrillic', bg: 'cyrillic', sr: 'cyrillic',
};

// ---------- Logic functions (replicated from source) ----------

function getSentences(text) {
  return text.split(/(?<=[.!?\u3002])\s*/).filter(Boolean);
}

function isCjk(key) {
  return key === 'cjk';
}

function getWords(corpus, count, corpusKey) {
  if (isCjk(corpusKey)) {
    const chars = [...corpus];
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(chars[i % chars.length]);
    }
    return result.join('');
  }
  const words = corpus.split(/\s+/);
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(words[i % words.length]);
  }
  return result.join(' ');
}

function parseValue(value) {
  const trimmed = (value || '').trim();

  if (CORPUSES[trimmed]) {
    return { mode: 'words', count: isCjk(trimmed) ? 80 : 50, corpus: trimmed };
  }

  if (trimmed === 'heading') {
    return { mode: 'words', count: 5, corpus: 'latin' };
  }

  const sentenceMatch = trimmed.match(/^(\d+)\s+sentences?$/i);
  if (sentenceMatch) {
    return { mode: 'sentences', count: Number(sentenceMatch[1]), corpus: 'latin' };
  }

  const itemMatch = trimmed.match(/^(\d+)\s+items?$/i);
  if (itemMatch) {
    return { mode: 'items', count: Number(itemMatch[1]), corpus: 'latin' };
  }

  const numMatch = trimmed.match(/^(\d+)$/);
  if (numMatch) {
    return { mode: 'words', count: Number(numMatch[1]), corpus: 'latin' };
  }

  return { mode: 'words', count: 50, corpus: 'latin' };
}

// Update generateText to pass corpus key

function generateText(parsed) {
  const text = CORPUSES[parsed.corpus];
  const sentences = getSentences(text);

  if (parsed.mode === 'sentences') {
    const result = [];
    for (let i = 0; i < parsed.count; i++) {
      result.push(sentences[i % sentences.length]);
    }
    return result.join(' ');
  }

  if (parsed.mode === 'items') {
    const items = [];
    for (let i = 0; i < parsed.count; i++) {
      items.push(sentences[i % sentences.length]);
    }
    return items;
  }

  return getWords(text, parsed.count, parsed.corpus);
}

// ---------- Tests ----------

describe('getSentences', () => {
  it('splits Latin text on periods', () => {
    const sentences = getSentences(LATIN);
    assert.ok(sentences.length >= 4, 'Should have at least 4 sentences');
    assert.ok(sentences[0].startsWith('Lorem'));
  });

  it('handles empty string', () => {
    const sentences = getSentences('');
    assert.equal(sentences.length, 0);
  });

  it('handles single sentence', () => {
    const sentences = getSentences('Hello world.');
    assert.equal(sentences.length, 1);
  });
});

describe('getWords', () => {
  it('returns exact word count for Latin', () => {
    const result = getWords(LATIN, 5, 'latin');
    assert.equal(result.split(/\s+/).length, 5);
  });

  it('returns single word', () => {
    const result = getWords(LATIN, 1, 'latin');
    assert.equal(result, 'Lorem');
  });

  it('cycles when count exceeds corpus length', () => {
    const short = 'one two three';
    const result = getWords(short, 7, 'latin');
    const words = result.split(/\s+/);
    assert.equal(words.length, 7);
    assert.equal(words[3], 'one');
    assert.equal(words[4], 'two');
  });

  it('returns exact character count for CJK', () => {
    const result = getWords(CORPUSES.cjk, 10, 'cjk');
    assert.equal([...result].length, 10);
  });

  it('slices CJK by characters, not by spaces', () => {
    const cjkText = '\u3053\u308C\u306F\u30C0\u30DF\u30FC\u30C6\u30AD\u30B9\u30C8\u3067\u3059';
    const result = getWords(cjkText, 5, 'cjk');
    assert.equal([...result].length, 5);
    assert.equal(result, '\u3053\u308C\u306F\u30C0\u30DF');
  });
});

describe('parseValue', () => {
  it('returns default for empty value', () => {
    const { mode, count, corpus } = parseValue('');
    assert.equal(mode, 'words');
    assert.equal(count, 50);
    assert.equal(corpus, 'latin');
  });

  it('returns default for null', () => {
    const { mode, count } = parseValue(null);
    assert.equal(mode, 'words');
    assert.equal(count, 50);
  });

  it('parses pure number as word count', () => {
    const { mode, count } = parseValue('25');
    assert.equal(mode, 'words');
    assert.equal(count, 25);
  });

  it('parses "N sentences"', () => {
    const { mode, count } = parseValue('3 sentences');
    assert.equal(mode, 'sentences');
    assert.equal(count, 3);
  });

  it('parses "1 sentence" (singular)', () => {
    const { mode, count } = parseValue('1 sentence');
    assert.equal(mode, 'sentences');
    assert.equal(count, 1);
  });

  it('parses "N items"', () => {
    const { mode, count } = parseValue('5 items');
    assert.equal(mode, 'items');
    assert.equal(count, 5);
  });

  it('parses "heading"', () => {
    const { mode, count } = parseValue('heading');
    assert.equal(mode, 'words');
    assert.equal(count, 5);
  });

  it('parses explicit corpus name', () => {
    const { corpus, count } = parseValue('cjk');
    assert.equal(corpus, 'cjk');
    assert.equal(count, 80);
  });
});

describe('LANG_MAP', () => {
  it('maps Japanese to CJK', () => {
    assert.equal(LANG_MAP.ja, 'cjk');
  });

  it('maps Arabic to arabic', () => {
    assert.equal(LANG_MAP.ar, 'arabic');
  });

  it('maps Russian to cyrillic', () => {
    assert.equal(LANG_MAP.ru, 'cyrillic');
  });

  it('maps Farsi to arabic', () => {
    assert.equal(LANG_MAP.fa, 'arabic');
  });

  it('maps Ukrainian to cyrillic', () => {
    assert.equal(LANG_MAP.uk, 'cyrillic');
  });
});

describe('generateText', () => {
  it('generates word-mode text with correct count', () => {
    const result = generateText({ mode: 'words', count: 10, corpus: 'latin' });
    assert.equal(/** @type {string} */ (result).split(/\s+/).length, 10);
  });

  it('generates sentence-mode text', () => {
    const result = generateText({ mode: 'sentences', count: 2, corpus: 'latin' });
    assert.ok(typeof result === 'string');
    assert.ok(result.length > 20);
  });

  it('generates items as array', () => {
    const result = generateText({ mode: 'items', count: 3, corpus: 'latin' });
    assert.ok(Array.isArray(result));
    assert.equal(result.length, 3);
  });

  it('cycles items when count exceeds sentences', () => {
    const result = generateText({ mode: 'items', count: 20, corpus: 'latin' });
    assert.equal(result.length, 20);
  });
});
