/**
 * Known mutation-XSS / sanitizer-bypass payloads, shared by the unit test
 * (tests/unit/sanitize-html.test.js, spec parser via parse5) and the browser
 * spec (tests/components/mn-sanitizer.spec.js, real insertion).
 *
 * Every payload calls `__hit()` when it executes. A sanitizer passes when no
 * payload's handler fires after the sanitized result is inserted — either as
 * nodes (sanitizeToFragment) or through a serialise + re-parse round trip
 * (innerHTML = sanitizeHTML(...)).
 */
export const MXSS_CORPUS = /** @type {Array<[string, string]>} */ ([
  // Baseline
  ['plain img onerror', '<img src=x onerror=__hit()>'],
  ['svg onload', '<svg onload=__hit()></svg>'],

  // MathML namespace confusion (the confirmed markdown-viewer bypass)
  ['math mtext table mglyph style', '<math><mtext><table><mglyph><style><img src=x onerror=__hit()>'],
  ['math mglyph style comment', '<math><mtext><table><mglyph><style><!--</style><img title="--&gt;&lt;img src=1 onerror=__hit()&gt;">'],
  ['DOMPurify 2.0.0 form/math', '<form><math><mtext></form><form><mglyph><style></math><img src onerror=__hit()>'],
  ['DOMPurify 2.0.17 mglyph svg textarea', '<math><mi><mglyph><svg><mtext><textarea><path id="</textarea><img onerror=__hit() src=1>"></textarea></mtext></svg></mglyph></mi></math>'],
  ['DOMPurify 2.2.2 h1/h6 mglyph', '<math><mtext><h1><a><h6></a></h6><mglyph><svg><mtext><style><a title="</style><img src onerror=__hit()>"></style></h1>'],
  ['DOMPurify 2.2.3 option mglyph', '<math><mtext><option><FAKEFAKE><option></option><mglyph><svg><mtext><style><a title="</style><img src=x onerror=__hit()>">'],
  ['math malignmark style', '<math><mtext><table><malignmark><style><img src=x onerror=__hit()>'],
  ['math annotation-xml html style', '<math><annotation-xml encoding="text/html"><style><img src=x onerror=__hit()></style></annotation-xml></math>'],
  ['math style', '<math><style><img src=x onerror=__hit()></style></math>'],
  ['math mi svg foreignObject', '<math><mi><svg><foreignObject><img src=x onerror=__hit()></foreignObject></svg></mi></math>'],

  // SVG namespace confusion
  ['svg </p> style id', '<svg></p><style><a id="</style><img src=1 onerror=__hit()>">'],
  ['svg style', '<svg><style><img src=x onerror=__hit()></style></svg>'],
  ['svg p breakout style', '<svg><p><style><img src=x onerror=__hit()>'],
  ['svg title style', '<svg><title><style><img src=x onerror=__hit()></style></title></svg>'],
  ['svg desc nested svg style', '<svg><desc><svg><style><img src=x onerror=__hit()>'],
  ['svg foreignObject', '<svg><foreignObject><img src=x onerror=__hit()></foreignObject></svg>'],
  ['svg CDATA', '<svg><![CDATA[><img src=x onerror=__hit()>]]></svg>'],
  ['table svg style', '<table><svg><style><img src=x onerror=__hit()>'],

  // Raw-text / RCDATA elements
  ['noscript title', '<noscript><p title="</noscript><img src=x onerror=__hit()>"></noscript>'],
  ['xmp title', '<xmp><p title="</xmp><img src=x onerror=__hit()>">'],
  ['textarea title', '<textarea><p title="</textarea><img src=x onerror=__hit()>"></textarea>'],
  ['noembed title', '<noembed><img title="</noembed><img src onerror=__hit()>"></noembed>'],
  ['noframes title', '<noframes><img title="</noframes><img src onerror=__hit()>"></noframes>'],
  ['iframe text', '<iframe><img title="</iframe><img src onerror=__hit()>"></iframe>'],
  ['style title', '<style><img title="</style><img src onerror=__hit()>"></style>'],
  ['title title', '<title><img title="</title><img src onerror=__hit()>"></title>'],
  ['plaintext', '<plaintext><img src=x onerror=__hit()>'],

  // Comment / CDATA tricks
  ['comment', '<!--<img src=x onerror=__hit()>-->'],
  ['comment --!>', '<!-- --!><img src=x onerror=__hit()> -->'],
  ['bogus comment', '<?xml-stylesheet <img src=x onerror=__hit()>?>'],
  ['comment in attribute', '<a title="<!--"><img src=x onerror=__hit()>--></a>'],

  // Template / nested
  ['template style', '<template><style></template><img src=x onerror=__hit()></style></template>'],
  ['nested math svg', '<svg><math><mtext><mglyph><style><img src=x onerror=__hit()>'],
]);
