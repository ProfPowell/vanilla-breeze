// @ts-nocheck -- linkedom globals stand in for the browser
/**
 * links-init: target="_blank" links get rel="noopener" at load, and links
 * added after load get it when they are activated (click or auxclick).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';

const { document, Element, Event } = parseHTML(
  '<!doctype html><html><body><a id="early" href="https://example.com/" target="_blank">x</a></body></html>',
);
Object.assign(globalThis, { document, Element });
await import('../../src/utils/links-init.js');

function addLink(attrs = '') {
  const holder = document.createElement('p');
  holder.innerHTML = `<a href="https://example.com/" target="_blank" ${attrs}><span>late</span></a>`;
  document.body.append(holder);
  return holder.firstElementChild;
}

test('links present at load are upgraded', () => {
  assert.equal(document.getElementById('early').getAttribute('rel'), 'noopener');
});

for (const type of ['click', 'auxclick']) {
  test(`a link added after load gets noopener on ${type}`, () => {
    const link = addLink();
    assert.equal(link.getAttribute('rel'), null);
    // Activate a descendant: the handler must find the enclosing link.
    link.firstElementChild.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
    assert.equal(link.getAttribute('rel'), 'noopener');
  });
}

test('an explicit opener policy on a late link is left alone', () => {
  const link = addLink('rel="opener"');
  link.dispatchEvent(new Event('click', { bubbles: true }));
  assert.equal(link.getAttribute('rel'), 'opener');
});

test('strict privacy mode adds noreferrer to a late link', () => {
  document.documentElement.dataset.linkPrivacy = 'strict';
  const link = addLink();
  link.dispatchEvent(new Event('click', { bubbles: true }));
  assert.equal(link.getAttribute('rel'), 'noopener noreferrer');
  delete document.documentElement.dataset.linkPrivacy;
});
