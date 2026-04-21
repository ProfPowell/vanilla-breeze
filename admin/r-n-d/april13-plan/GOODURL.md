# GoodURL
## Content Stewardship for Vanilla Breeze

A content stewardship system that makes URL integrity — both outbound and
inbound — the path of least resistance. Built on Cook's data layer, Cook
plugins, and Cloudflare Workers — no runtime dependencies, no third-party
services. Designed for the AI age, when the cost of publishing has dropped
faster than the cost of maintaining what's published.

The system has one organizing principle: **every URL referenced by a site
is a managed dependency**. Outbound links are tracked, annotated, facade'd,
and health-monitored automatically. Inbound 404s are captured, analyzed,
and surfaced to the author for resolution. The author writes content the
way they always have. The system does the stewardship work, surfaces what
needs human judgment, and automates nothing that affects the user experience
without human review.

---

## Table of Contents

- [Background — The GoodURL Idea](#background--the-goodurl-idea)
- [Problem Statement](#problem-statement)
- [Design Decisions](#design-decisions)
- [System Overview](#system-overview)
- [Part 1: Auto-Discovered Outbound Links](#part-1-auto-discovered-outbound-links)
- [Part 2: Curated Outbound Links](#part-2-curated-outbound-links)
- [Part 3: Permalink System](#part-3-permalink-system)
- [Part 4: Link Preview Annotation](#part-4-link-preview-annotation)
- [Part 5: Trust Signals — Look Before You Leap](#part-5-trust-signals--look-before-you-leap)
- [Part 6: Smart Health Checking](#part-6-smart-health-checking)
- [Part 7: Click Analytics for Stability Signals](#part-7-click-analytics-for-stability-signals)
- [Part 8: Inbound Forensics — Smart 404 Page](#part-8-inbound-forensics--smart-404-page)
- [Part 9: Daily Digest and Care Workflow](#part-9-daily-digest-and-care-workflow)
- [Part 10: Stewardship Score](#part-10-stewardship-score)
- [Opt-Out and Exclusions](#opt-out-and-exclusions)
- [Data Model](#data-model)
- [Cook Integration](#cook-integration)
- [Cloudflare Workers Architecture](#cloudflare-workers-architecture)
- [HTML Authoring Patterns](#html-authoring-patterns)
- [Build Order](#build-order)
- [Open Questions](#open-questions)
- [Cross-References](#cross-references)

---

## Background — The GoodURL Idea

GoodURL has a lineage. Years ago, we built a CMS with a comprehensive
internal link integrity system: when content was added, removed, or moved,
the system guaranteed there was no way to leave broken internal links
behind. That was the first piece. The second piece came when we started
working on inbound links — first with a smart 404 page that helped us
identify misplaced incoming traffic and fix it with redirects, and as a
side effect, helped us spot emergent attack patterns. The third piece —
outbound links — was the one we started but never finished. The whole
constellation went by an internal name: GoodURL. The principle was that
URLs should be stable, permanent, and trustworthy, and that the tools an
author uses should make those properties the default rather than the
exception.

Revisiting the idea now feels right. The web has changed in ways that
make link stewardship harder and more important at the same time.
Generative AI has dropped the cost of producing content to nearly zero
without dropping the cost of maintaining it. The friction that used to
gate publishing — the time and care it took to write something — was
quietly doing real work. It made authors care about what they put their
name on, because publishing was expensive enough to be a deliberate act.
Remove the friction and the deliberation goes with it. Sites publish more,
maintain less, and the dependencies they reference rot at the same rate
they always have. The stewardship deficit compounds.

The argument here isn't that AI-generated content is bad. The tech itself
doesn't force any particular behavior. The argument is narrower and more
useful: **the ease of production has outpaced the ease of stewardship,
and that imbalance has consequences**. The tools we build can shift the
balance back without making any moral claims about how content gets
created. GoodURL is one such tool. It makes stewardship cheap enough that
there's no excuse not to do it, and it makes the act of stewardship visible
enough that authors can take pride in it. That fits Vanilla Breeze's
philosophy of being good web stewards and working *with* the platform
rather than against it.

This document is the spec for the outbound side of GoodURL, plus the
inbound 404 forensics piece, plus the human-in-the-loop daily care
workflow that ties them together. It is intentionally scoped to what
Cook, Vanilla Breeze, and Cloudflare Workers can deliver without external
services. It is also intentionally scoped to be implementable in phases —
Phase 1 ships the foundation, later phases light up the trust signals
and stewardship workflows. The data model is complete from Phase 1 so
that nothing has to be migrated later.

---

## Problem Statement

### Every outbound link is a dependency

When a piece of content references an external URL, that URL becomes a
dependency. It can break, change meaning, become a paywall, get hijacked,
or quietly serve different content than when the author cited it. The
content's reliability is now coupled to a resource on someone else's
infrastructure.

Software engineering learned to manage this with `package.json`, lockfiles,
version pinning, and CI checks. Web content has nothing equivalent.
Authors type a URL, browsers open whatever's there now, and nobody tracks
what changed. For educational sites, this is acute: students cite sources,
course materials need to remain valid for years, and a broken link in a
syllabus is a credibility hit.

### URL facades destroy trust if not done carefully

URL shorteners trained users to distrust opaque links. `bit.ly/3xY7` tells
the user nothing about where they'll end up. A facade pattern (`/go/wcag-2.2`)
only works if the user can trivially see the underlying destination *before*
clicking — which means automatic, build-time annotation that puts the real
destination back into the markup as `data-*` attributes, plus a small
runtime that surfaces it on hover or tap.

### Trust requires more than just "the URL is alive"

Knowing that a URL returns 200 isn't the same as knowing the content is
still what you cited. A page can return 200 forever while quietly turning
into a different article, getting paywalled, or being replaced with a
domain-squat. Stewardship requires watching for *change*, not just for
*availability*. That means tracking last-modified timestamps, content
hashes, and how often a target actually changes — and surfacing that
information to users at click time.

### Internal URLs are fragile too

Content restructuring breaks every inbound link: bookmarks, search results,
links from other sites, links from students' notes. A permalink system
gives each page a permanent identifier that survives restructuring. The
404 page becomes a forensics surface — it captures requests for URLs that
should have resolved, suggests fixes, and feeds the daily digest with
candidate redirects for human review.

### What this system delivers

- **Every outbound link is auto-discovered, tracked, and facade'd** — no
  opt-in, no per-link authoring overhead
- **Every facade link is annotated with the resolved destination plus
  trust signals** — last checked, volatility, click count, archive
  availability
- **Smart health checking** — conditional requests, change detection, and
  per-link frequency tiers based on observed stability
- **Click analytics with no PII** — aggregate counters that feed back into
  trust signals
- **Smart 404 forensics** — captured 404s become candidate redirects in
  the daily digest, with attack patterns filtered to a separate channel
- **Daily digest** — 60-second human review of items that need attention,
  with one-click actions
- **Stewardship score** — a composite metric so authors can see whether
  their care is keeping up with their publishing
- **Authors write the same Markdown they always have** — `[text](url)`
  works, the system handles the rest

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Default behavior | All external links auto-discovered, tracked, and facade'd | Every outbound link is a dependency; safety should be the default |
| Opt-out attribute | `data-direct` on `<a>` | Short, self-documenting, reads naturally |
| Opt-out scopes | Per-link, per-page (front matter), site-wide (config) | Easy escape hatch at every level |
| Curated vs auto-discovered | Both supported, both annotated, both health-checked | Curated entries get rich metadata; auto-discovered get the basics |
| Auto-discovered slug | Hash-based (e.g. `/go/a3kf9z`) | Deterministic, collision-resistant, derived from URL |
| Curated slug | Author-chosen, human-readable | More useful for important resources |
| Promotion path | Curated entry references its hash slug as alias | Existing references don't break when promoted |
| Auto-discovery storage | `config/links-auto.json` (git-tracked, dev-write only) | Audit trail in git; CI verifies nothing snuck in unannotated |
| CI behavior | Fail build if new external URLs are discovered but not in `links-auto.json` | Forces explicit dependency commits |
| Curated registry | `config/data.js` `links` array | Available to templates as global data |
| Domain ownership | `config/main.js` `ownDomains` array | Tells the plugin what counts as "internal" vs "external" |
| Redirect mechanism | Cloudflare Workers KV | Single mechanism, scales without limits |
| Outbound path prefix | `/go/` | Short, obvious, won't collide with content |
| Permalink path prefix | `/p/` | Distinct from `/go/` |
| Build hooks | Three Cook plugins: `before` (scan), `default` (annotate + discover), `after` (write redirects) | Each at the natural pipeline phase |
| Preview UI | `data-*` attributes + small enhancement script | No web component needed; native popover |
| Health checking | Conditional requests (If-Modified-Since, If-None-Match) + content hash fallback | Cheap on stable links, accurate on volatile ones |
| Health check schedule | Tiered by observed volatility — stable weekly, normal daily, volatile hourly, critical every 15 min | Proportional attention |
| Health check execution | Cloudflare Workers Cron (Workers Paid) | Commercial deployment target, no execution time anxiety |
| Click tracking | Aggregate counters via Analytics Engine, no cookies, no PII | Privacy-respecting, native to the deployment target |
| Bounce signal | Aggregate pagehide/visibilitychange counters per link | Indicates content drift without identifying users |
| 404 handling | Smart page with permalink fuzzy matching, suggested redirects, attack pattern filtering | Bidirectional stewardship |
| Auto-fix policy | Never. Suggestions go to the daily digest for human review | Promotes care and feeding without taking humans out of the loop |
| Daily digest delivery | Email and/or webhook; configurable per site | Lightweight, native to existing author workflows |
| Stewardship score | Composite metric, private, trends over time | Visibility without public shaming |
| Data model timing | Full schema present from Phase 1, fields populated as features come online | Avoids migration debt |

---

## System Overview

```
Author writes content
        │
        ▼
┌──────────────────────────────────────────────────┐
│ Author types whatever URLs they want, however    │
│ they normally would. No special syntax.          │
└─────────────────────┬────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────┐
│              Cook build pipeline                  │
│                                                   │
│  before plugin: goodurl-scanner                   │
│  default plugin: goodurl-annotator                │
│  after plugin: goodurl-redirects                  │
│                                                   │
│  Outputs:                                         │
│  • dist/_redirects + KV upload for facade routes  │
│  • dist/links-manifest.json for runtime           │
│  • config/links-auto.json (dev mode write)        │
│  • Annotated HTML with data-url-* on every link   │
└─────────────────────┬────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────┐
│           Cloudflare Workers Runtime              │
│                                                   │
│  goodurl-router (request handler)                 │
│  • Resolves /go/{slug} and /p/{id} from KV        │
│  • Logs click event to Analytics Engine           │
│  • Issues 301 to destination                      │
│                                                   │
│  goodurl-checker (cron, tiered schedule)          │
│  • Conditional fetches against dependency list    │
│  • Updates last-checked, content hash, volatility │
│  • Writes results back to KV                      │
│                                                   │
│  goodurl-404 (smart 404 handler)                  │
│  • Fuzzy-matches against permalink registry       │
│  • Detects attack patterns, routes to security    │
│  • Logs suggested redirects to digest queue       │
│                                                   │
│  goodurl-digest (cron, daily)                     │
│  • Aggregates events from the last 24 hours       │
│  • Computes stewardship score delta               │
│  • Sends digest email/webhook                     │
└─────────────────────┬────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────┐
│              Browser (runtime)                    │
│                                                   │
│  goodurl-preview.js — small enhancement           │
│  • Wires native popovers to a[data-url-preview]   │
│  • Shows trust signals: freshness, volatility,    │
│    click count, archive availability              │
└──────────────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────┐
│              Author (next morning)                │
│                                                   │
│  Daily digest in inbox:                           │
│  • 3 links need your attention [Approve / Skip]   │
│  • 12 new auto-discoveries from yesterday's build │
│  • Stewardship score: B+ (steady)                 │
│                                                   │
│  Total time to act: ~60 seconds                   │
└──────────────────────────────────────────────────┘
```

---

## Part 1: Auto-Discovered Outbound Links

### How discovery works

The `goodurl-annotator` plugin runs on every HTML file in Cook's per-file
loop. For each `<a>` element with an external `href`, it:

1. Checks the exclusions list
2. Looks up the URL in `data.links` (curated registry)
3. Otherwise looks up the URL in `links-auto.json` (auto-discovery store)
4. Otherwise creates a new entry:
   - **Dev mode:** generates a hash slug, adds the entry to `links-auto.json`
   - **CI mode:** fails the build with a clear error pointing to the
     unregistered URL and source file

### Hash slug generation

```javascript
import { createHash } from 'node:crypto';

function hashSlug(url) {
  return createHash('sha256')
    .update(url)
    .digest('base64url')
    .slice(0, 6)
    .toLowerCase();
}
```

Six base64url characters gives roughly 68 billion possibilities. Same
URL always produces the same slug. Collisions fail the build with a
clear message.

### `links-auto.json` format

The full Phase 1 schema includes all fields the system will eventually
populate, even though most start as `null`.

**`config/links-auto.json`**

```json
{
  "version": 1,
  "generated": "2026-04-06T14:30:00.000Z",
  "entries": [
    {
      "slug": "a3kf9z",
      "url": "https://www.nngroup.com/articles/ten-usability-heuristics/",
      "host": "www.nngroup.com",
      "discovered": "2026-03-15T10:22:00.000Z",
      "lastSeen": "2026-04-06T14:30:00.000Z",
      "lastChecked": null,
      "lastModified": null,
      "etag": null,
      "contentHash": null,
      "changeCount": 0,
      "lastChanged": null,
      "volatility": null,
      "checkTier": "normal",
      "clickCount": 0,
      "bounceRate": null,
      "status": "active"
    }
  ]
}
```

Fields populated by the build (Phase 1): `slug`, `url`, `host`, `discovered`,
`lastSeen`, `status` (default `"active"`), `checkTier` (default `"normal"`).

Fields populated by the smart checker (Phase 2): `lastChecked`, `lastModified`,
`etag`, `contentHash`, `changeCount`, `lastChanged`, `volatility`.

Fields populated by click analytics (Phase 3): `clickCount`, `bounceRate`.

The annotator writes all fields it knows about and leaves the rest as
`null` or `0`. The popover renders whatever's present.

### Promotion: auto → curated

When an auto-discovered link earns metadata, the author promotes it via
CLI:

```bash
npx cook goodurl promote a3kf9z --slug usability-heuristics
```

The command moves the entry from `links-auto.json` into `data.links`,
adds the hash slug as an `alias`, and reminds the author to fill in
title, archive, accessed date, etc. All accumulated health and click
data is preserved through the move.

---

## Part 2: Curated Outbound Links

### When to curate

Curate a link when it deserves first-class metadata:

- Academic papers (DOI, accessed date, citation info)
- Specifications and standards (stable slug for repeated reference)
- Key references that appear across many pages
- Anything that should surface a real title in the popover

### The curated registry

**`config/data.js`**

```javascript
export default {
  siteTitle: 'My Course Site',
  siteUrl: 'https://example.edu',

  links: [
    {
      slug: 'wcag-2.2',
      url: 'https://www.w3.org/TR/WCAG22/',
      title: 'Web Content Accessibility Guidelines (WCAG) 2.2',
      doi: null,
      archive: 'https://perma.cc/ABC1-2DEF',
      accessed: '2025-09-15',
      tags: ['accessibility', 'standards'],
      note: 'W3C Recommendation. Stable URL expected.',
      status: 'active',
      // Health/analytics fields populated by Workers
      lastChecked: null,
      lastModified: null,
      etag: null,
      contentHash: null,
      changeCount: 0,
      lastChanged: null,
      volatility: null,
      checkTier: 'stable',
      clickCount: 0,
      bounceRate: null
    },
    {
      slug: 'usability-heuristics',
      url: 'https://www.nngroup.com/articles/ten-usability-heuristics/',
      title: '10 Usability Heuristics for User Interface Design',
      archive: 'https://perma.cc/XY12-Z345',
      accessed: '2025-06-01',
      tags: ['ux', 'heuristics'],
      status: 'active',
      aliases: ['a3kf9z']
    }
  ]
};
```

### Slug conventions

- Kebab-case: `wcag-2.2`, `mdn-fetch-api`
- Academic papers: `author-year-keyword` → `meyer-2023-cascade`
- Specs/standards: `spec-name-version` → `html-spec-5.3`
- Tools/sites: `tool-name` → `perma-cc`, `caniuse`

---

## Part 3: Permalink System

### Front matter declaration

```yaml
---
title: Building Accessible Forms
permalink_id: a3kf
aliases:
  - /tutorials/forms-a11y
  - /blog/2024/accessible-forms
---
```

`/p/{id}` redirects to the page's current URL. Aliases handle organic
URL changes from site restructuring.

### ID generation

Deterministic IDs derived from file path hash survive deleted-and-recreated
files and don't require storing generated state.

---

## Part 4: Link Preview Annotation

### What the user sees in the rendered output

Author writes:

```html
<a href="https://www.nngroup.com/articles/ten-usability-heuristics/">Nielsen's heuristics</a>
```

Cook produces:

```html
<a href="/go/usability-heuristics"
   data-url-preview
   data-url-destination="https://www.nngroup.com/articles/ten-usability-heuristics/"
   data-url-host="www.nngroup.com"
   data-url-title="10 Usability Heuristics for User Interface Design"
   data-url-accessed="2025-06-01"
   data-url-archive="https://perma.cc/XY12-Z345"
   data-url-status="active"
   data-url-checked="2026-04-05"
   data-url-volatility="low"
   data-url-clicks="847"
   data-url-curated>Nielsen's heuristics<span class="link-preview-trigger" aria-hidden="true">ⓘ</span></a>
```

The `data-url-checked`, `data-url-volatility`, and `data-url-clicks`
attributes are present from Phase 1 in the schema but populated by Phase 2
and Phase 3 features. In Phase 1 they're missing or empty; the popover
just doesn't render those rows.

### Trust principle

Three things are true at all times:

1. **The visible link text** is what the author wrote
2. **The `href` attribute** is a stable site-local URL the user can copy and trust
3. **The `data-url-destination`** is the resolved external URL, visible in the popover and used for printing

The user can always see where they're going, plus trust signals about
freshness and stability. The author never has to manage that.

### Layer 2: CSS-only baseline

```css
.link-preview-trigger {
  display: inline-block;
  margin-inline-start: 0.25em;
  font-size: 0.85em;
  color: var(--color-text-muted);
  vertical-align: super;
  cursor: help;
}
```

### Layer 4: JS enhancement

Small script (~80 lines once trust signals are added) wires native
popovers using the Popover API. One shared popover element, repositioned
per link. Full implementation in [Cook Integration](#cook-integration).

### Print stylesheet

```css
@media print {
  a[data-url-destination]::after {
    content: " [" attr(data-url-destination) "]";
    font-size: 0.85em;
    color: var(--color-text-muted);
  }
  .link-preview-trigger {
    display: none;
  }
}
```

---

## Part 5: Trust Signals — Look Before You Leap

### The pattern

Every facade link's popover surfaces a small set of trust signals so the
user can decide whether to follow the link with confidence. These are the
*payoff* for all the infrastructure described elsewhere in the document —
the reason the smart checker, click analytics, and stewardship score
exist is so that this popover can be honest and useful.

### Signal categories

**Identity** (Phase 1)
- Host (`www.nngroup.com`)
- Title if curated (`10 Usability Heuristics for User Interface Design`)
- Full destination URL (`https://www.nngroup.com/articles/...`)
- Curated vs auto-discovered indicator

**Freshness** (Phase 2)
- Last checked relative time (`Verified 3 days ago`)
- Stale warning if not checked within expected interval
- Status dot (green/yellow/red)

**Stability** (Phase 2)
- Volatility level (`Stable for 18 months` / `Frequently changes`)
- Last content change date if known
- Warning badge for high-volatility links

**Provenance** (Phase 1, populated for curated links)
- Original accessed date (`Cited 2025-06-01`)
- Archive link (`View archived copy from 2024-09-15`)
- DOI if available

**Popularity** (Phase 3)
- Click count (`847 clicks this month`)
- Optional bounce indicator if high (`Many users return quickly`)

### Popover layout

```
┌─────────────────────────────────────────┐
│ www.nngroup.com                    ●    │  ← host + status dot
│ 10 Usability Heuristics for UI Design   │  ← title (curated only)
├─────────────────────────────────────────┤
│ https://www.nngroup.com/articles/...    │  ← full destination URL
├─────────────────────────────────────────┤
│ ✓ Verified 3 days ago                   │  ← freshness
│ ✓ Stable for 18 months                  │  ← stability
│ ✓ Cited 2025-06-01                      │  ← provenance (curated)
│ ↗ 847 clicks this month                 │  ← popularity (optional)
├─────────────────────────────────────────┤
│ [📄 View archived copy]                  │  ← archive button (curated)
└─────────────────────────────────────────┘
```

For an auto-discovered link, the popover is shorter — no title, no
accessed date, no archive button — but the host, full URL, freshness,
and stability are still present.

For a *broken* link with archive fallback:

```
┌─────────────────────────────────────────┐
│ www.example.com                    ●    │  ← red dot
│ Original Article                        │
├─────────────────────────────────────────┤
│ ⚠ Original link unavailable             │
│ Last working: 2025-12-03                │
│ Showing archived copy instead           │
├─────────────────────────────────────────┤
│ https://perma.cc/ABC1-2DEF              │
├─────────────────────────────────────────┤
│ [📄 View archive]                        │
└─────────────────────────────────────────┘
```

### Signal sourcing

| Signal | Source | Phase populated |
|--------|--------|-----------------|
| Host | URL parse at build time | 1 |
| Title | Curated entry `title` | 1 |
| Destination URL | Curated `url` or auto `url` | 1 |
| Status dot | Latest `status` from KV | 1 (green default), 2 (real status) |
| Freshness ("verified N days ago") | `lastChecked` from smart checker | 2 |
| Stability ("stable for N months") | `lastChanged` and `changeCount` | 2 |
| Volatility badge | Computed `volatility` field | 2 |
| Accessed date | Curated `accessed` | 1 |
| Archive button | Curated `archive` | 1 |
| Click count | `clickCount` from Analytics Engine | 3 |
| Bounce indicator | `bounceRate` from analytics | 3 |

### Phase 1 popover

Even with no smart checker or analytics, the Phase 1 popover is useful:

```
┌─────────────────────────────────────────┐
│ www.nngroup.com                         │
│ 10 Usability Heuristics for UI Design   │
├─────────────────────────────────────────┤
│ https://www.nngroup.com/articles/...    │
├─────────────────────────────────────────┤
│ Cited 2025-06-01                        │
├─────────────────────────────────────────┤
│ [📄 View archived copy]                  │
└─────────────────────────────────────────┘
```

Phase 2 lights up the freshness and stability rows. Phase 3 lights up the
click count. No popover refactoring required at any phase — the script
just renders whichever fields are present.

---

## Part 6: Smart Health Checking

### Conditional request strategy

Naive health checking hits every URL on the same schedule regardless of
how often the target changes — wasteful for stable resources, insufficient
for volatile ones. The smart checker uses HTTP's built-in conditional
request headers:

**First check (cold):**
1. Full GET to the URL
2. Store `Last-Modified` and `ETag` response headers
3. Compute SHA-256 hash of the response body, store as `contentHash`
4. Set `lastChecked`, `lastChanged` to now
5. Set `status` based on response code

**Subsequent checks (warm):**
1. HEAD with `If-Modified-Since: {lastModified}` and `If-None-Match: {etag}`
2. If 304: target is unchanged, just update `lastChecked`
3. If 200: target may have changed
   - Do a follow-up GET
   - Compute new content hash
   - If hash differs from stored hash: increment `changeCount`, update
     `lastChanged`, store new hash
   - Update `lastModified` and `etag` from response
4. If 4xx or 5xx: update `status`, log to digest queue

For sites that don't honor conditional requests properly (which is many),
the GET + hash comparison is the fallback. It's more expensive but
accurate.

### Volatility scoring

Volatility is a function of observed change rate over time:

```
volatility = changeCount / (daysObserved / 30)
```

Roughly: how many changes per month, averaged over the period the
checker has observed the URL. Categories:

| Volatility | Category | Check tier |
|------------|----------|------------|
| 0 (no changes after 90+ days observed) | `stable` | weekly |
| < 0.5 changes/month | `low` | daily |
| 0.5–2 changes/month | `normal` | daily |
| 2–10 changes/month | `high` | hourly |
| 10+ changes/month | `volatile` | hourly |
| `status === 'broken'` | `critical` | every 15 min until recovered |

The check tier is recomputed after every check, so a stable link that
suddenly starts changing gets watched more closely automatically. A
volatile link that quiets down drops back to normal.

### Tier execution

Cloudflare Workers Cron Triggers run separate workers per tier:

- `goodurl-checker-stable` — Sundays 02:00 UTC
- `goodurl-checker-daily` — Daily 02:00 UTC
- `goodurl-checker-hourly` — Every hour at :05
- `goodurl-checker-critical` — Every 15 minutes

Each worker reads its tier's URL list from KV, runs conditional fetches
in parallel (with reasonable concurrency limits), updates KV with
results, and logs anything notable to the digest queue.

### Smart checker output

After each check, the relevant entry in the dependency list is updated:

```json
{
  "slug": "usability-heuristics",
  "url": "https://www.nngroup.com/articles/ten-usability-heuristics/",
  "lastChecked": "2026-04-06T02:14:33.000Z",
  "lastModified": "2024-11-08T14:22:00.000Z",
  "etag": "\"a8f3c2b9-1234\"",
  "contentHash": "sha256-d7e8f9a1b2c3...",
  "changeCount": 0,
  "lastChanged": "2025-09-15T10:00:00.000Z",
  "volatility": 0,
  "checkTier": "stable",
  "status": "active"
}
```

The build's next run reads this state and emits it into the page
annotations as `data-url-checked`, `data-url-volatility`, etc.

### Status changes feed the digest

When a check moves a link from `active` to `broken`, or back, the worker
writes an event to the digest queue:

```json
{
  "type": "link-broken",
  "slug": "old-mdn-article",
  "url": "https://developer.mozilla.org/...",
  "lastWorking": "2026-04-05T02:14:33.000Z",
  "statusCode": 404,
  "referencingPages": ["src/guides/forms.md", "src/blog/css-tips.md"]
}
```

The digest worker picks these up overnight and includes them in the
next morning's report.

---

## Part 7: Click Analytics for Stability Signals

### What we collect

The router worker logs an event to Analytics Engine on every `/go/{slug}`
or `/p/{id}` request:

```javascript
env.GOODURL_ANALYTICS.writeDataPoint({
  blobs: [path, request.headers.get('user-agent')?.includes('bot') ? 'bot' : 'human'],
  doubles: [1],
  indexes: [path]
});
```

That's it. No cookies, no IP fingerprinting, no user IDs. Just a counter
per slug, with a coarse bot/human split based on user-agent heuristics.
This is Cloudflare-native, costs essentially nothing, and respects user
privacy by design.

### What we derive

A daily aggregation worker queries Analytics Engine and produces
per-slug counts:

```sql
SELECT
  blob1 as slug,
  count() as clicks,
  countIf(blob2 = 'bot') as bot_clicks
FROM goodurl_analytics
WHERE timestamp > now() - INTERVAL 1 DAY
GROUP BY blob1
```

The results get written back into the dependency entries as `clickCount`
and (eventually) trends:

```json
{
  "slug": "usability-heuristics",
  "clickCount": 847,
  "clickTrend": "stable",
  "lastClicked": "2026-04-06T13:42:00.000Z"
}
```

### Bounce signal — content drift detection

The bounce signal is the more interesting use case, but it's harder.
The hypothesis: if a link starts getting clicked-and-immediately-back
more often than it used to, the destination content probably changed
in a way that surprised users. The smart checker can't detect every
content drift (paywall, redesign, topic pivot), but the bounce rate can.

Implementation requires a small piece of state: when a user clicks
`/go/{slug}`, the router redirects them. To detect bounce, we need to
know if they came back. Two approaches:

**Approach A: Page-level pagehide event.**
When the user lands back on the referring page, a small script fires
a pagehide event to a Worker endpoint with the slug they just clicked.
The endpoint writes a "bounce" event to Analytics Engine. The bounce
rate is `bounces / clicks`. No tracking, no user ID, just counts.

**Approach B: Time-on-destination via beacon.**
The Worker that handles `/go/{slug}` sets a short-lived cookie with
the slug and timestamp, then issues the 301. When the user navigates
to any other page on the site, a Worker checks for the cookie, computes
elapsed time, logs a "return visit" event with duration, and clears
the cookie. Short return = bounce. Long return = engagement.

Approach A is simpler and has no cookie. Approach B gives richer data
but adds a cookie. Lean: A for Phase 3, evaluate B if A's signal is
too noisy.

### Surfacing in the popover

```
┌─────────────────────────────────────────┐
│ www.nngroup.com                    ●    │
│ 10 Usability Heuristics for UI Design   │
├─────────────────────────────────────────┤
│ ↗ 847 clicks this month                 │
└─────────────────────────────────────────┘
```

For high-bounce links:

```
┌─────────────────────────────────────────┐
│ www.example.com                    ●    │
│ Original Article                        │
├─────────────────────────────────────────┤
│ ⚠ Many users return quickly             │
│ Content may have changed                │
└─────────────────────────────────────────┘
```

The bounce warning is also a digest item — the author should know that
a previously stable link now seems to be confusing users.

### What we don't do

- **No user identification.** Counters only.
- **No referrer chains.** We don't track where users came from.
- **No A/B routing.** The facade always resolves to the same destination.
- **No geo-based logging.** Cloudflare provides geo data; we don't store it.
- **No per-user analytics.** This isn't a marketing product.

---

## Part 8: Inbound Forensics — Smart 404 Page

### The two jobs of a 404 page

A 404 page should do two things at once:

1. **Help the user.** The URL they typed or followed didn't resolve.
   Tell them what happened and suggest where to go.
2. **Help the steward.** Capture the failure as a forensic event so the
   author can fix it before more users hit the same dead path.

GoodURL's 404 page does both, with all forensics flowing into the
daily digest.

### Worker handler

The router worker handles the 404 case specifically:

```javascript
async function handle404(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Filter attack patterns first
  if (isAttackPattern(path)) {
    await logSecurityEvent(path, request, env);
    return new Response('Not Found', { status: 404 });
  }

  // Look for fuzzy matches in the permalink registry
  const suggestions = await findSuggestions(path, env);

  // Log the 404 to the digest queue with suggestions
  await logFourOhFour(path, request, suggestions, env);

  // Render the 404 page with suggestions
  return env.ASSETS.fetch(
    new Request(new URL('/404/', url.origin), request)
  ).then(async (res) => {
    const html = await res.text();
    return new Response(
      html.replace('<!--SUGGESTIONS-->', renderSuggestions(suggestions)),
      {
        status: 404,
        headers: { 'content-type': 'text/html' }
      }
    );
  });
}
```

### Fuzzy matching

The permalink registry plus the alias registry give us a search space.
When `/old-tutorial/` 404s, we look for:

1. **Exact match in aliases** — already a redirect candidate, but
   somehow not registered. Suggest registering.
2. **Levenshtein distance ≤ 3 from any current page slug** — likely typo
3. **Word overlap with current page titles** — `old-tutorial` matches
   `tutorial-getting-started` on the word `tutorial`
4. **Same path with trailing slash flipped** — common confusion

The search is cheap because the permalink registry is small (hundreds
to thousands of entries, not millions). Results are ranked by combined
score and the top 3 are shown to the user *and* logged to the digest.

### Attack pattern filtering

Certain request patterns are obviously not real users. They get filtered
to a separate security event channel and never reach the digest's
"suggested redirects" queue:

- `.env`, `.git/config`, `wp-admin/`, `wp-login.php`, `/admin.php`
- Path traversal attempts: `../`, `..\\`
- Common scanner UA strings (sqlmap, nikto, gobuster, etc.)
- Burst patterns: same IP requesting 50+ unique paths in 10 seconds
- Known bad bot networks via Cloudflare's threat intel headers

These get a count and a daily summary in a separate "noise filtered"
section of the digest, so the author has visibility but doesn't have
to triage.

### Suggested redirects in the digest

When a real (non-attack) 404 has at least one viable suggestion, it
becomes a digest item:

```
┌──────────────────────────────────────────────────────────┐
│ 404 with suggested fix                                    │
├──────────────────────────────────────────────────────────┤
│ Path requested: /old-tutorial/                            │
│ Hits in last 24h: 12                                      │
│ Referrers: 8 from google.com, 4 direct                    │
│                                                           │
│ Suggested redirects (ranked):                             │
│ 1. /guides/getting-started-tutorial/  (score 0.87)        │
│    [Approve] [Decline]                                    │
│ 2. /tutorials/intro/  (score 0.62)                        │
│    [Approve] [Decline]                                    │
│ 3. /old-guides/  (score 0.45)                             │
│    [Approve] [Decline]                                    │
│                                                           │
│ [Add to ignore list]                                      │
└──────────────────────────────────────────────────────────┘
```

When the author clicks Approve, the system writes the alias into the
target page's front matter (or into a top-level alias config), commits
the change to git via a webhook, and the next build picks it up. Never
auto-fix, always one click of human approval.

### Inbound 404s without suggestions

A 404 with no viable suggestion still gets logged but goes into a
"low confidence" section of the digest. The author can still see the
hit counts and decide whether to write a redirect manually.

---

## Part 9: Daily Digest and Care Workflow

### The principle

Automation that takes humans out of the loop is what got us into the
content stewardship problem. Automation that makes human attention
proportional and lightweight is what gets us out. The daily digest is
the human surface for everything the system observes.

The design constraint is **60 seconds**. The author should be able to
process the digest, make decisions, and move on in about a minute. If
it takes longer, the author won't read it, and the system fails.

### What the digest contains

Three sections, ordered by urgency:

**1. Needs your attention** (action required, sorted by impact)
- Newly broken curated links (with referencing pages and archive availability)
- New 404s with high-confidence redirect suggestions
- High-bounce links (possible content drift)
- Stewardship score drops of more than half a grade

Items are sorted by their per-link deficit value (see [Stewardship
Score](#part-10-stewardship-score)) so the worst things are at the top.
Each item has 1–2 buttons. Approve / Decline / Skip. No menus.

**2. For your information** (no action needed)
- Newly auto-discovered links from yesterday's build (count + sample)
- Links that recovered (good news matters)
- Volatility changes (links that became more or less stable)
- Promoted entries from the last 30 days

**3. Stewardship score**
- Current letter grade and trend arrow vs. last week
- One-sentence summary of *why* it's where it is — typically the highest-impact
  unresolved deficit (e.g., "1 high-impact curated link broken on the homepage")
- Link to the (private) detailed view

The "why" matters more than the number. A B+ that's been a B+ for six
months is fine. A B+ that was an A two weeks ago is a signal that
maintenance has slipped, and the digest should say which links caused
the slip.

### Delivery mechanisms

- **Email** (default) — sent via Cloudflare Email Workers or third-party
  SMTP. HTML for action buttons, plain text fallback.
- **Webhook** — POSTs the digest payload to a configured URL. For sites
  that want to wire it into Slack, Teams, Discord, or a custom dashboard.
- **In-page widget** — A `<good-url-digest>` web component that fetches
  the digest from a Workers endpoint and renders it in an admin area
  on the site. For authors who prefer a built-in surface over email.

The digest worker runs daily and writes the same payload to all
configured channels. Sites can configure quiet days (don't send
weekends, don't send during a vacation window).

### Action handling

Each action in the digest is a signed URL or webhook callback that
updates state when clicked:

- **Approve redirect** → writes the alias into the appropriate front
  matter file via a git commit, triggers a rebuild
- **Decline suggestion** → marks that path/target combination as
  rejected so it doesn't appear again
- **Skip / Snooze** → defers the item to the next digest
- **Mark broken link archived** → moves a curated link to `archived`
  status, switches its redirect to the archive URL
- **Promote to curated** → opens a CLI or web prompt to fill in title,
  archive, accessed date

The signed URL approach means actions work from the email client
without the author having to log into anything. The signature ties the
action to the specific item and expires after a few days.

### What the digest never does

- **Never auto-fix.** Every action is human-approved.
- **Never spam.** If there's nothing to act on, no digest is sent
  (configurable: "send daily" vs "send only when there's something").
- **Never moralize.** The digest is informational. No "your score is
  bad, you should care more" framing. The score speaks for itself.
- **Never gamify.** No streaks, no badges, no leaderboards. This is a
  professional tool, not a habit-tracking app.

### Digest as the product surface

The technical infrastructure described in this spec — annotation, smart
checking, click analytics, 404 forensics — is in service of the digest.
The digest is what authors actually interact with on a daily basis.
Everything else runs in the background. If the digest is lightweight,
honest, and useful, the system succeeds. If it's noisy, demanding, or
feels like work, the system fails regardless of how good the
infrastructure is.

This is worth a separate design document when Phase 4 is closer.
Treating the digest as a real product surface (not a technical
afterthought) is the difference between a stewardship tool that gets
used and one that gets ignored.

---

## Part 10: Stewardship Score

### Why percentages are the wrong metric

A naive stewardship score is "percentage of links currently working."
This is wrong, and it's wrong in a way that matters for the entire
purpose of the system.

A site with 5 links and 1 broken sits at 80%. A site with 500 links
and 10 broken sits at 98%. The percentage says the second site is
healthier. But consider what it actually means:

- The 5-link site might have a single broken link to a critical citation
  that students click 200 times a day. The credibility damage is real
  and ongoing.
- The 500-link site might have 10 broken links to footnote references in
  archived pages from 2019 that nobody clicks. The damage is theoretical.

The percentage metric inverts the real priority. A site is well-stewarded
when **users don't encounter broken or misleading links**, not when the
registry happens to be tidy. Those are different things.

### The impact-weighted model

The score measures aggregate user impact, not registry hygiene. Each
link contributes a weighted impact based on how much it actually matters
to users and how badly it's currently failing them.

```
impact(link) = clickWeight(clickCount)
             × curatedMultiplier(isCurated)
             × pageWeight(referencingPages)
             × recencyWeight(lastSeen)

deficit(link) = impact(link) × statusPenalty(status)

stewardshipScore = 100 × (1 − sum(deficit) / sum(impact))
```

A link that gets 1000 clicks per month, is curated, is referenced from
the homepage, and is broken with no archive contributes a huge deficit.
A link that gets 0 clicks, is auto-discovered, is referenced from one
2019 archive page, and is broken contributes almost nothing. The score
expresses what users actually experience.

### Weight functions

**`clickWeight(clicks)`** — log scale so popular links matter more but
not linearly:
```
clickWeight = log10(clicks + 10)
```
A link with 0 clicks gets weight 1.0. A link with 100 clicks gets weight
~2.0. A link with 10,000 clicks gets weight ~4.0. The log curve prevents
a single viral link from dominating the entire score.

**`curatedMultiplier(isCurated)`** — curated links are intentional
dependencies and matter more:
```
curatedMultiplier = 3.0 if curated else 1.0
```

**`pageWeight(referencingPages)`** — links cited from many pages or
from important pages matter more:
```
pageWeight = sum over each referencing page of pageImportance(page)
```
Where `pageImportance` is 3.0 for the homepage, 2.0 for top-level
section indexes, 1.5 for pages in primary navigation, and 1.0 otherwise.
Sites can configure this map. A link cited from 12 pages contributes
the sum of all 12 page weights.

**`recencyWeight(lastSeen)`** — links in stale content contribute less
because users are less likely to encounter them:
```
recencyWeight = 1.0 if lastSeen within 30 days
              0.7 if within 90 days
              0.4 if within 1 year
              0.1 if older
```
A broken link in a page nobody has updated in 4 years isn't a 5-alarm
fire even if it gets some traffic.

**`statusPenalty(status)`** — how much the link is currently hurting
users:

| Status | Penalty | Meaning |
|--------|---------|---------|
| `active` | 0.0 | Working fine |
| `active-recently-changed` | 0.1 | Working but content drift detected |
| `active-high-bounce` | 0.2 | Working but users bounce frequently |
| `active-stale-check` | 0.15 | Working last we checked but check is overdue |
| `archived` | 0.3 | Original dead, archive serving instead |
| `broken-with-archive` | 0.5 | Original dead, archive available, redirect already pointing there |
| `broken-no-archive` | 1.0 | Dead and nothing to fall back on |
| `unreachable` | 0.8 | Not responding (could be temporary) |

### What the math expresses

The impact-weighted model has properties the percentage doesn't:

**Importance is contextual.** A single broken curated link on the
homepage with high traffic destroys the score. A dozen broken auto links
in archived footnotes barely move it. The score reflects what users
experience.

**Site size doesn't matter.** A 5-link site and a 5000-link site can
both score perfectly if their links are healthy. Neither gets penalized
for being small or rewarded for being large.

**Recovery is fast for real problems.** Fixing the high-impact link
moves the score significantly. Fixing low-impact links nudges it. This
matches the right prioritization — authors should fix the things that
hurt the most users first.

**The same calculation drives the digest.** Each link's deficit is its
priority for human attention. The digest's "needs attention" section
sorts by deficit, descending. Authors triage the worst things first
without thinking about it.

### Grade scale

The numeric score still maps to a letter grade for the digest headline:

| Score | Grade |
|-------|-------|
| 95–100 | A |
| 85–94 | B |
| 75–84 | C |
| 65–74 | D |
| < 65 | F |

But the grade is just a quick read. The actual value to the author is
the per-link deficit list — which links are contributing how much to
the score being where it is.

### Phase 1 degraded scoring

The full impact model needs click data and bounce data, which is Phase 3.
Phase 1 can compute a degraded score using just:

- Curation status (curated vs auto)
- Reference count (how many pages link to it)
- Status

This degraded score is informational only and shouldn't be surfaced as
a letter grade — it would mislead. Show it as "Phase 1 health: 4 broken
curated links, 12 broken auto links, see digest for details" until
Phase 3 data is available.

Phase 3 lights up the full impact-weighted score with click counts and
recency. Phase 4 adds the bounce signal. Each phase makes the score
more meaningful without changing its fundamental shape.

### `data-direct` links and the score

Links marked `data-direct` are not in the dependency registry, are not
health-checked, and are not impact-weighted. This is a deliberate part
of the opt-out contract — opting out means opting out of stewardship.

If a `data-direct` link starts producing observable problems (high
bounce rate detected via the page-level pagehide signal in Phase 3),
that information surfaces in the digest as a notice but doesn't affect
the score. The author can choose to remove the `data-direct` opt-out
if they want the link tracked properly.

### What the score still doesn't measure

- **Content freshness.** A page that's accurate but old isn't penalized.
- **Total link count.** Big sites aren't penalized for being big.
- **Anything unrelated to URL integrity.** The score is narrow on purpose.

### Visibility

The score is private. It's shown in the digest, in the (optional)
in-page admin widget, and via a CLI command (`npx cook goodurl score`).
It is never exposed publicly via a header, meta tag, badge, or API
endpoint. There's no scoreboard. The score exists to help authors
notice when their care is slipping, not to compare sites against each
other.

### Phase

Phase 1 ships the degraded score (status counts only). Phase 3 ships
the full impact-weighted model. The data model from Phase 1 supports
the full calculation — only the score function itself changes.

---

## Opt-Out and Exclusions

### Three opt-out scopes

**Per-link:**

```html
<a href="https://example.com/oauth?token=xyz" data-direct>Authorize</a>
```

```markdown
[Authorize](https://example.com/oauth?token=xyz){data-direct}
```

**Per-page (front matter):**

```yaml
---
title: External Resources List
link_facade: false
---
```

**Site-wide (config):**

```javascript
// config/main.js
export default {
  goodurl: {
    facade: false
  }
};
```

### Structural exclusions (always skipped)

- Non-HTTP schemes (`mailto:`, `tel:`, `sms:`, `javascript:`, `data:`)
- Fragment-only links (`#section`)
- Same-origin links
- Owned domains (configured in `goodurl.ownDomains`)
- Already-facade'd links (`/go/...`, `/p/...`)
- Links inside `<head>`
- Links inside JSON-LD `<script>` blocks
- Links inside `<code>` and `<pre>` blocks

### Owned domains

```javascript
// config/main.js
export default {
  goodurl: {
    facade: true,
    ownDomains: [
      'example.edu',
      'docs.example.edu',
      'cdn.example.edu'
    ]
  }
};
```

---

## Data Model

### Curated entry schema

| Field | Type | Phase | Required | Notes |
|-------|------|-------|----------|-------|
| `slug` | string | 1 | yes | URL path segment under `/go/` |
| `url` | string (URL) | 1 | yes | Current target URL |
| `title` | string | 1 | yes | Human-readable resource title |
| `doi` | string \| null | 1 | no | Digital Object Identifier |
| `archive` | string (URL) \| null | 1 | no | Perma.cc or archive.org snapshot |
| `accessed` | string (ISO date) | 1 | no | Date the URL was last verified working at curation time |
| `tags` | string[] | 1 | no | Categorization for filtering |
| `note` | string \| null | 1 | no | Author notes |
| `status` | enum | 1 | yes | `active` / `broken` / `archived` / `retired` |
| `aliases` | string[] | 1 | no | Additional slugs that redirect here |
| `lastChecked` | string (ISO datetime) \| null | 1 schema, 2 populated | no | Smart checker timestamp |
| `lastModified` | string \| null | 1 schema, 2 populated | no | HTTP `Last-Modified` header |
| `etag` | string \| null | 1 schema, 2 populated | no | HTTP `ETag` header |
| `contentHash` | string \| null | 1 schema, 2 populated | no | SHA-256 of body |
| `changeCount` | integer | 1 schema, 2 populated | no | Times content has changed since first checked |
| `lastChanged` | string (ISO datetime) \| null | 1 schema, 2 populated | no | Last detected content change |
| `volatility` | enum \| null | 1 schema, 2 populated | no | `stable` / `low` / `normal` / `high` / `volatile` |
| `checkTier` | enum | 1 | no | `stable` / `daily` / `hourly` / `critical` (default `daily`) |
| `clickCount` | integer | 1 schema, 3 populated | no | Aggregate clicks |
| `bounceRate` | float \| null | 1 schema, 3 populated | no | Aggregate bounce rate |
| `lastClicked` | string (ISO datetime) \| null | 1 schema, 3 populated | no | Most recent click |

### Auto-discovered entry schema

| Field | Type | Phase | Required | Notes |
|-------|------|-------|----------|-------|
| `slug` | string | 1 | yes | Hash-derived |
| `url` | string (URL) | 1 | yes | Discovered URL |
| `host` | string | 1 | yes | Hostname |
| `discovered` | string (ISO datetime) | 1 | yes | First seen by build |
| `lastSeen` | string (ISO datetime) | 1 | yes | Most recent build that included it |
| `status` | enum | 1 | yes | `active` / `broken` / `unreachable` |
| `lastChecked` | string \| null | 1 schema, 2 populated | no | |
| `lastModified` | string \| null | 1 schema, 2 populated | no | |
| `etag` | string \| null | 1 schema, 2 populated | no | |
| `contentHash` | string \| null | 1 schema, 2 populated | no | |
| `changeCount` | integer | 1 schema, 2 populated | no | |
| `lastChanged` | string \| null | 1 schema, 2 populated | no | |
| `volatility` | enum \| null | 1 schema, 2 populated | no | |
| `checkTier` | enum | 1 | no | Default `normal` |
| `clickCount` | integer | 1 schema, 3 populated | no | |
| `bounceRate` | float \| null | 1 schema, 3 populated | no | |
| `lastClicked` | string \| null | 1 schema, 3 populated | no | |

### Permalink entry schema

| Field | Source | Description |
|-------|--------|-------------|
| `permalink_id` | front matter | Short permanent ID |
| `current_url` | computed from source path | Current canonical URL |
| `aliases` | front matter | Former URLs that redirect here |
| `title` | front matter | Page title |

### `data-url-*` attribute schema

| Attribute | Phase | Source |
|-----------|-------|--------|
| `data-url-preview` | 1 | Always present (when not opted out) |
| `data-url-destination` | 1 | Resolved target URL |
| `data-url-host` | 1 | Hostname |
| `data-url-title` | 1 | Curated title |
| `data-url-accessed` | 1 | Curated accessed date |
| `data-url-archive` | 1 | Curated archive URL |
| `data-url-status` | 1 | Entry status |
| `data-url-curated` | 1 | Flag |
| `data-url-checked` | 1 schema, 2 populated | Last checked relative |
| `data-url-volatility` | 1 schema, 2 populated | Volatility category |
| `data-url-changed` | 1 schema, 2 populated | Last changed relative |
| `data-url-clicks` | 1 schema, 3 populated | Click count |
| `data-url-bounce` | 1 schema, 3 populated | Bounce flag |

---

## Cook Integration

### Plugin architecture

Three Cook plugins, each at its natural pipeline phase:

1. **`before` plugin (`goodurl-scanner`)** — scans source files for
   `permalink_id` and `aliases`, loads `links-auto.json` into `store`.
   Runs once.
2. **`default` plugin (`goodurl-annotator`)** — runs on every HTML file
   in the per-file loop. Discovers external links, annotates them,
   replaces hrefs with facade URLs. Updates `links-auto.json` in dev
   mode, fails the build on new discoveries in CI mode.
3. **`after` plugin (`goodurl-redirects`)** — generates `_redirects`
   from curated + auto entries plus permalinks, writes
   `links-manifest.json`, optionally pushes to KV. Runs once.

### Plugin source

The plugin implementations follow the same shape as the previous
version of this document. They are now responsible for writing the
complete schema (including the Phase 2 and 3 fields as `null`) so that
nothing has to be migrated when those phases activate.

The annotator script and runtime preview enhancement are unchanged
in shape. The popover renderer just checks for the presence of trust
signal attributes and renders the matching rows.

### Plugin registration

```javascript
// config/main.js
export default {
  plugins: {
    before: ['goodurl-scanner'],
    default: ['goodurl-annotator'],
    after: ['goodurl-redirects']
  },
  pluginPath: 'plugins',
  goodurl: {
    facade: true,
    ownDomains: ['example.edu', 'docs.example.edu'],
    kvNamespace: 'GOODURL_LINKS',
    digest: {
      enabled: true,
      delivery: ['email', 'webhook'],
      email: 'steward@example.edu',
      webhook: 'https://hooks.example.edu/goodurl-digest',
      quietDays: ['saturday', 'sunday']
    }
  }
};
```

---

## Cloudflare Workers Architecture

### Workers Paid baseline

GoodURL is designed for the commercial Workers Paid tier. This removes
execution time anxiety, enables Durable Objects for stateful coordination,
and lets the smart checker run through thousands of dependencies in a
single cron invocation.

### Worker inventory

| Worker | Trigger | Purpose |
|--------|---------|---------|
| `goodurl-router` | All requests to `/go/*` and `/p/*` | Resolve facade, log click, issue 301 |
| `goodurl-404` | Requests that don't match any asset or route | Smart 404 page with suggestions, attack filter |
| `goodurl-checker-stable` | Cron, weekly Sunday 02:00 UTC | Conditional health checks for stable tier |
| `goodurl-checker-daily` | Cron, daily 02:00 UTC | Daily tier health checks |
| `goodurl-checker-hourly` | Cron, hourly :05 | Hourly tier checks |
| `goodurl-checker-critical` | Cron, every 15 minutes | Critical tier (recently broken) checks |
| `goodurl-analytics-aggregator` | Cron, hourly :15 | Aggregate Analytics Engine data into per-slug counters |
| `goodurl-digest` | Cron, daily 06:00 local time per site | Compose and send daily digest |
| `goodurl-actions` | Webhook from digest action buttons | Handle Approve/Decline/Snooze callbacks |

### KV namespaces

| Namespace | Contents |
|-----------|----------|
| `GOODURL_LINKS` | Facade redirects (slug → destination URL) |
| `GOODURL_DEPS` | Full dependency entries with health and analytics state |
| `GOODURL_PERMALINKS` | Permalink ID → current URL |
| `GOODURL_ALIASES` | Alias path → target path |
| `GOODURL_DIGEST_QUEUE` | Pending digest items, keyed by date + site |
| `GOODURL_ACTIONS` | Pending action signatures (for digest button callbacks) |

### Analytics Engine datasets

| Dataset | Schema |
|---------|--------|
| `goodurl_clicks` | timestamp, blob1=slug, blob2=human/bot, doubles=[1] |
| `goodurl_bounces` | timestamp, blob1=slug, blob2=referrer-page, doubles=[1] |
| `goodurl_404s` | timestamp, blob1=path, blob2=referrer, blob3=ua-class |

### Build → Workers handoff

After a successful production build, the deploy pipeline:

1. Reads `dist/links-manifest.json`
2. Bulk-uploads facade entries to `GOODURL_LINKS` KV
3. Bulk-uploads dependency entries to `GOODURL_DEPS` KV (preserving
   existing health/analytics fields, only updating identity fields)
4. Bulk-uploads permalinks and aliases
5. Triggers a one-time check of any newly-added entries so the digest
   has fresh data on day one

---

## HTML Authoring Patterns

### The default experience

Authors write nothing special:

```html
<a href="https://www.nngroup.com/articles/ten-usability-heuristics/">Nielsen's heuristics</a>
```

```markdown
See [Nielsen's heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
for the classic ten.
```

### Opt-out per link

```html
<a href="https://example.com/oauth?token=xyz" data-direct>Authorize</a>
```

### Permalink display

```html
<footer>
  <p>Permanent link:
    <a href="/p/${permalink_id}" data-copy>${siteUrl}/p/${permalink_id}</a>
  </p>
</footer>
```

---

## Build Order

### Phase 1: Foundation (the safety baseline)

1. **Define complete schemas** — JSON Schema for curated, auto, and
   permalink entries with all Phase 1–3 fields present
2. **`goodurl-scanner` before plugin** — front matter scanning, load
   auto registry
3. **`goodurl-annotator` default plugin** — discover, annotate, opt-out
   handling, dev/CI behavioral split, writes complete schema
4. **`goodurl-redirects` after plugin** — generate redirects, write
   manifest, persist `links-auto.json` in dev
5. **`links-auto-refs.json` index** — gitignored page-reference index for
   the digest (regenerated each build)
6. **`goodurl-router` Worker** — basic facade routing with 301 redirects
7. **`goodurl-preview.js`** — popover wiring with Phase 1 trust signals
8. **`goodurl-preview` CSS** — trigger glyph, popover layout, print
9. **Initial curated entries** — seed with known important resources
10. **Degraded stewardship score** — status counts only, no letter grade
11. **Documentation** — explain auto/curated/opt-out model to authors
12. **CLI: `npx cook goodurl list`** — show all dependencies grouped by tier

### Phase 2: Smart health checking

13. **`goodurl-checker-*` Workers** — tiered cron health checks with
    conditional requests
14. **Volatility scoring algorithm** — compute and store per-entry
15. **Tier reassignment logic** — move entries between tiers based on
    observed change rates
16. **Status change events to digest queue** — broken/recovered/changed
17. **Popover trust signal rendering** — light up freshness, stability,
    archive availability rows
18. **CLI: `npx cook goodurl health`** — show health summary

### Phase 3: Analytics and trust signals

19. **`goodurl-router` click logging** — Analytics Engine writes
20. **`goodurl-analytics-aggregator` Worker** — daily counter aggregation
21. **Bounce signal collection** — pagehide endpoint and aggregation
22. **Click count + bounce in popover** — additional trust signal rows
23. **Full impact-weighted stewardship score** — replaces degraded Phase 1
    score with complete formula

### Phase 4: Inbound forensics and daily digest

24. **`goodurl-404` Worker** — smart 404 page with fuzzy matching
25. **Attack pattern filter** — separate security event channel
26. **Suggested redirect ranking** — Levenshtein, word overlap, slash
    flip heuristics
27. **`goodurl-digest` Worker** — compose and deliver daily digest
    (sorted by per-link deficit)
28. **Action callback handling** — Approve/Decline/Snooze webhooks
29. **In-page digest widget** — `<good-url-digest>` web component
    (optional surface)
30. **Stewardship score in digest** — show grade, trend, and the
    high-impact deficits driving the number

### Phase 5: Authoring polish and onboarding

31. **`npx cook goodurl promote`** — auto → curated CLI
32. **`npx cook goodurl score`** — local stewardship score view
33. **`page-info` integration** — surface curated metadata for citation
34. **Citation export** — APA/MLA/Chicago from curated metadata
35. **`goodurl-bootstrap` standalone script** — one-time onboarding for
    existing sites with thousands of unmanaged links. Batches discovery,
    ranks by traffic, produces a review document. Not part of the main
    build pipeline.

---

## Open Questions

### Architectural

1. **Hash slug length.** Six base64url characters is plenty for any
   realistic site. Lean: 6, monitor for collisions.

2. **JSDOM cost on large sites.** Cook already loads jsdom for
   components, but the annotator adds parse-and-serialize overhead per
   file. For 1000+ page sites this matters. Consider regex pre-pass.

3. **KV write batching during deploys.** Bulk uploads after every build
   could be expensive. Worth detecting which entries actually changed
   and only updating those.

4. **Page reference tracking lives in `links-auto-refs.json`** —
   *resolved.* The annotator writes a separate index of which pages
   reference which slugs. The file is gitignored and regenerated on
   every build from the content files (which are the source of truth).
   The digest worker uses it to populate "affected pages" in
   action items. Adds no commit noise but gives the digest the data
   it needs.

### Smart checking

5. **Conditional requests on sites that don't honor them.** Some servers
   return 200 even for `If-None-Match` matches. Detection: do a few full
   GETs in parallel and compare hashes. If hashes match, the server is
   ignoring conditional headers; mark the entry to use full GET on the
   next check.

6. **Hash comparison cost on large pages.** A 5MB page hashes fast but
   downloading it daily is wasteful. Truncate to first 256KB for the
   hash? That misses changes in long-form articles. Lean: full body, but
   set a hard limit (1MB) above which we use only `Last-Modified` and
   `ETag`.

7. **Volatility scoring window.** Should the score use a sliding 90-day
   window, or all-time? Sliding is more responsive to recent behavior.
   All-time is more stable. Lean: 90-day sliding.

### Click analytics

8. **Bot vs human classification.** User-agent string heuristics catch
   the obvious bots but miss sophisticated ones. Cloudflare's bot
   management could help but it's a paid feature. For now, simple UA
   matching is good enough — it doesn't need to be perfect.

9. **Bounce signal accuracy.** Approach A (pagehide event) might miss
   users who bounce by closing the tab entirely. Approach B (cookie)
   catches more but adds a cookie. Need to experiment with both before
   committing.

10. **Should the click counter show on every link or only above a
    threshold?** Showing "3 clicks this month" feels weak. Maybe only
    show when count is above some floor (50? 100?), and show "popular"
    qualitatively above some ceiling (1000?).

### Digest and human workflow

11. **Email vs webhook as default delivery.** Email requires SMTP
    configuration. Webhook requires the author to set up a receiver.
    In-page widget is the most accessible but requires the author to
    visit the site. Lean: in-page widget as default, email as opt-in.

12. **Bootstrap mode is a separate script, not a Phase 1 concern.**
    Onboarding existing sites with thousands of unmanaged links is a
    real problem but it shouldn't shape the main system's architecture.
    Phase 5 includes a `goodurl-bootstrap` standalone script that runs
    once on an existing site, batches discovery, ranks by traffic, and
    produces a one-time review document. Until that ships, customers
    onboarding existing sites either run CI failures iteratively or
    set `goodurl.facade: false` until they're ready.

13. **Should the digest include positive items at all?** "12 new
    auto-discoveries" is informational but might add to the noise.
    Argument for: visibility of what the system is doing builds trust.
    Argument against: every word in the digest competes for the
    60-second budget.

14. **Action signature expiration.** Signed action URLs should expire
    after the next digest is sent (so old digests don't accumulate
    valid action buttons). 7 days seems right.

### Stewardship score

15. **Weight function calibration.** The impact-weighted model has
    several parameters that are educated guesses: the log base for
    `clickWeight`, the multiplier for curated links, the page importance
    map, the recency decay tiers, the status penalty values. These
    should be calibrated against real sites once Phase 3 ships and
    real click data is flowing. Until then, the defaults are reasonable
    starting points but shouldn't be treated as final.

16. **Should the score have any public expression at all?** The
    current answer is no. But there's an argument for an opt-in badge
    ("This site uses GoodURL stewardship — verified link health: A")
    that authors could display. Complicated incentives — could become
    a vanity metric. Lean: keep it private.

17. **Page importance configuration ergonomics.** The `pageWeight`
    function depends on a per-page importance score. Authors shouldn't
    have to maintain this manually. Reasonable defaults: pages in the
    top-level navigation get 3.0, pages in section indexes get 2.0,
    pages within 2 levels of those get 1.5, everything else 1.0. Cook's
    site manifest already knows this structure. The override mechanism
    is per-page front matter `goodurl_importance: 5` for explicit
    boosts on pages the author cares about.

18. **`data-direct` link bounce handling.** When a `data-direct` link
    starts producing high bounces in Phase 3, the digest surfaces it
    as a notice but the link isn't tracked or scored. Should the
    notice include a "want to start tracking this link?" action that
    removes the `data-direct` attribute? Risky because it modifies
    content based on telemetry. Lean: notice only, author decides.

### Inbound forensics

18. **Fuzzy matching false positive rate.** Need to monitor how often
    suggestions are accepted vs declined. High decline rate means the
    matching is too eager and should tighten.

19. **Should declined suggestions affect future ranking?** If the
    author declines `/old-tutorial/ → /guides/getting-started/` once,
    should we never suggest it again, or just lower its score? Lean:
    permanent decline by default, with an "undo" option in the digest.

20. **Attack pattern false positives.** If a real page on the site
    happens to be named something attack-pattern-shaped, we'd
    misclassify legitimate 404s. Need an allowlist mechanism.

---

## Cross-References

- `cook-ssg-overview-2026-04-06.md` — Cook SSG architecture
- `FORM-ENDPOINT-CONTRACT.md` — Cloudflare Workers patterns
- `page-info-provenance-spec.md` — Content metadata, citation, versioning
- `PAGE-MANIFEST.md` — Per-page runtime declarations
- `SITE-MANIFEST.md` — Site-wide configuration
- `BUNDLE-SYSTEM.md` — CSS/JS bundle architecture
