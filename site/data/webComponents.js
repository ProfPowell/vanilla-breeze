/**
 * Web Components data — organized by category for the index page.
 * Each entry: { name, href, desc }
 * Categories rendered as separate sections with headings.
 */
export default {
  'Forms & Input': [
    { name: 'color-picker', href: '/docs/elements/web-components/color-picker/', desc: 'Full color space picker with HSL area, hue slider, text inputs, swatches, and EyeDropper' },
    { name: 'combo-box', href: '/docs/elements/web-components/combobox/', desc: 'Autocomplete combobox with single-select and multi-select tag modes' },
    { name: 'date-picker', href: '/docs/elements/web-components/date-picker/', desc: 'Calendar date picker with month navigation, keyboard support, and form association' },
    { name: 'drop-down', href: '/docs/elements/web-components/dropdown/', desc: 'Dropdown menu with keyboard navigation' },
    { name: 'emoji-picker', href: '/docs/elements/web-components/emoji-picker/', desc: 'Emoji picker with search, categories, and insertion' },
    { name: 'form-field', href: '/docs/elements/web-components/form-field/', desc: 'Accessible form field wrapper with validation, custom messages, and error summaries' },
    { name: 'slide-accept', href: '/docs/elements/web-components/slide-accept/', desc: 'Slide-to-confirm interaction with drag handle and spring-back' },
    { name: 'poll-wc', href: '/docs/elements/web-components/poll-wc/', desc: 'Voting + live results with single/multi-choice and closed state; presentational, mirrors reaction-bar author-owned-state pattern' },
    { name: 'progress-tracker', href: '/docs/elements/web-components/progress-tracker/', desc: 'Multi-step progress bar for wizards / checkout / onboarding; status per step (complete/current/upcoming/error)' },
    { name: 'star-rating', href: '/docs/elements/web-components/rating/', desc: 'Star rating widget with CSS-only selection and form association' },
    { name: 'stepper-wc', href: '/docs/elements/web-components/stepper-wc/', desc: 'Stepper for formatted units, currency, time, token-snap scales, and discrete enums (use data-stepper for plain numbers)' },
    { name: 'time-picker', href: '/docs/elements/web-components/time-picker/', desc: 'Spinbutton time input with 12h/24h format and form association' },
  ],

  'Content & Layout': [
    { name: 'accordion-wc', href: '/docs/elements/web-components/accordion/', desc: 'Collapsible content sections' },
    { name: 'activity-feed', href: '/docs/elements/web-components/activity-feed/', desc: 'WAI-ARIA Feed timeline of user actions with relative timestamps; optional date grouping and infinite-scroll sentinel' },
    { name: 'card-list', href: '/docs/elements/web-components/card-list/', desc: 'Template-based list rendering with safe data binding' },
    { name: 'carousel-wc', href: '/docs/elements/web-components/carousel/', desc: 'Scroll carousel with controls and autoplay' },
    { name: 'compare-surface', href: '/docs/elements/web-components/comparison/', desc: 'Before/after image comparison slider with drag handle and keyboard support' },
    { name: 'content-swap', href: '/docs/elements/web-components/content-swap/', desc: 'Two-face content toggle with flip, fade, slide, and scale transitions' },
    { name: 'drag-surface', href: '/docs/elements/web-components/drag-surface/', desc: 'Drag-and-drop reordering surface' },
    { name: 'image-gallery', href: '/docs/elements/web-components/image-gallery/', desc: 'Thumbnail grid with lightbox viewer, swipe, keyboard nav, and View Transitions' },
    { name: 'split-surface', href: '/docs/elements/web-components/splitter/', desc: 'Resizable panel splitter with drag divider' },
    { name: 'tab-set', href: '/docs/elements/web-components/tabs/', desc: 'Tabbed interface component' },
  ],

  'Navigation & Menus': [
    { name: 'bread-crumb', href: '/docs/elements/web-components/bread-crumb/', desc: 'Hierarchical navigation trail. HTML-first <ol> wrap or auto-from-pathname; emits BreadcrumbList JSON-LD' },
    { name: 'command-palette', href: '/docs/elements/web-components/command-palette/', desc: 'Cmd+K command palette with search and actions' },
    { name: 'context-menu', href: '/docs/elements/web-components/context-menu/', desc: 'Right-click context menu with keyboard navigation' },
    { name: 'nav-bar', href: '/docs/elements/web-components/nav-bar/', desc: 'Top-level site/app nav primitive with auto aria-current sync (HTML-first or .items setter)' },
    { name: 'page-toc', href: '/docs/elements/web-components/page-toc/', desc: 'Table of contents generator' },
    { name: 'page-tour', href: '/docs/elements/web-components/page-tour/', desc: 'Progressive-enhancement guided tour with spotlight overlay and action gating' },
    { name: 'pop-over', href: '/docs/elements/web-components/pop-over/', desc: 'General-purpose anchored popover container with CSS Anchor Positioning + JS fallback' },
    { name: 'short-cuts', href: '/docs/elements/web-components/shortcuts/', desc: 'Keyboard shortcuts help overlay' },
    { name: 'site-search', href: '/docs/elements/web-components/site-search/', desc: 'Search dialog component' },
  ],

  'Data & Visualization': [
    { name: 'chart-wc', href: '/docs/elements/web-components/chart-wc/', desc: 'SVG chart component with progressive table-to-SVG enhancement' },
    { name: 'data-table', href: '/docs/elements/web-components/data-table/', desc: 'Enhanced data tables with sorting and filtering' },
    { name: 'diagram-wc', href: '/docs/elements/web-components/diagram-wc/', desc: 'Mermaid diagram renderer with VB token theming and lazy loading' },
    { name: 'flow-diagram', href: '/docs/elements/web-components/flow-diagram/', desc: 'SVG flow diagram renderer for process and workflow visualization' },
    { name: 'gantt-chart', href: '/docs/elements/web-components/gantt-chart/', desc: 'Timeline-based Gantt chart with task bars, dependencies, and milestones' },
    { name: 'geo-map', href: '/docs/elements/web-components/geo-map/', desc: 'Static map tiles with marker and address caption' },
    { name: 'image-map', href: '/docs/elements/web-components/image-map/', desc: 'Interactive image map with hotspots' },
    { name: 'qr-code', href: '/docs/elements/web-components/qr-code/', desc: 'QR code generator with progressive enhancement' },
  ],

  'Calendar & Scheduling': [
    { name: 'calendar-wc', href: '/docs/elements/web-components/calendar-wc/', desc: 'Calendar display with events, selection, and range highlighting' },
    { name: 'day-view', href: '/docs/elements/web-components/day-view/', desc: 'Daily schedule view with time slots and event rendering' },
    { name: 'week-view', href: '/docs/elements/web-components/week-view/', desc: 'Weekly calendar view with time grid and event positioning' },
  ],

  'Text & Annotation': [
    { name: 'comment-wc', href: '/docs/elements/web-components/comment-wc/', desc: 'Collaborative commenting component for text annotations' },
    { name: 'foot-notes', href: '/docs/elements/web-components/footnotes/', desc: 'Inline footnotes with popup' },
    { name: 'heading-links', href: '/docs/elements/web-components/heading-links/', desc: 'Auto-generate heading anchors' },
    { name: 'highlight-wc', href: '/docs/elements/web-components/highlight-wc/', desc: 'Text highlighting tool with color palette for selection-menu integration' },
    { name: 'markdown-editor', href: '/docs/elements/web-components/markdown-editor/', desc: 'Side-by-side markdown editor with live preview' },
    { name: 'markdown-viewer', href: '/docs/elements/web-components/markdown-viewer/', desc: 'Render markdown with progressive enhancement and theme integration' },
    { name: 'note-wc', href: '/docs/elements/web-components/note-wc/', desc: 'Annotation note component for selection-menu and page-level contexts' },
    { name: 'reader-view', href: '/docs/elements/web-components/reader-view/', desc: 'Immersive reading shell with scroll and paged modes' },
    { name: 'review-surface', href: '/docs/elements/web-components/review-surface/', desc: 'Document review surface with inline commenting and track-changes' },
    { name: 'selection-menu', href: '/docs/elements/web-components/selection-menu/', desc: 'Floating toolbar on text selection for highlighting, sharing, and annotating' },
    { name: 'text-reader', href: '/docs/elements/web-components/text-reader/', desc: 'Text-to-speech reader with word-level highlighting' },
  ],

  'Media': [
    { name: 'audio-player', href: '/docs/elements/web-components/audio-player/', desc: 'Custom audio player with playlist support' },
    { name: 'audio-visualizer', href: '/docs/elements/web-components/audio-visualizer/', desc: 'Audio frequency visualization' },
    { name: 'social-embed', href: '/docs/elements/web-components/social-embed/', desc: 'Privacy-first social content embed with click-to-activate' },
    { name: 'video-player', href: '/docs/elements/web-components/video-player/', desc: 'Video player with overlay controls, captions, fullscreen, and playlist' },
    { name: 'youtube-player', href: '/docs/elements/web-components/youtube-player/', desc: 'Privacy-first YouTube embed with facade pattern — zero iframe bytes until click' },
  ],

  'Chat & Communication': [
    { name: 'chat-input', href: '/docs/elements/web-components/chat-input/', desc: 'Chat message input with send button' },
    { name: 'chat-window', href: '/docs/elements/web-components/chat-window/', desc: 'Chat conversation window' },
  ],

  'Feedback & Notifications': [
    { name: 'consent-banner', href: '/docs/elements/web-components/consent-banner/', desc: 'Cookie consent banner with accept/decline' },
    { name: 'status-wc', href: '/docs/elements/web-components/status-wc/', desc: 'Visual state indicator: live/recording (pulse), online/offline/away/busy, running/paused/stopped, error. 11 built-in variants + CSS-only extension surface.' },
    { name: 'toast-msg', href: '/docs/elements/web-components/toast/', desc: 'Non-blocking notifications' },
    { name: 'tool-tip', href: '/docs/elements/web-components/tooltip/', desc: 'Contextual tooltips' },
  ],

  'UX Planning': [
    { name: 'adr-wc', href: '/docs/elements/web-components/adr-wc/', desc: 'Architecture Decision Record for documenting technical decisions' },
    { name: 'empathy-map', href: '/docs/elements/web-components/empathy-map/', desc: 'Four-quadrant empathy map (Says, Thinks, Does, Feels) with flip-to-edit' },
    { name: 'impact-effort', href: '/docs/elements/web-components/impact-effort/', desc: '2×2 prioritization matrix with drag between quadrants' },
    { name: 'kanban-board', href: '/docs/elements/web-components/kanban-board/', desc: 'Columnar drag-and-drop board with WIP limits' },
    { name: 'story-map', href: '/docs/elements/web-components/story-map/', desc: 'Horizontal user story map with activity columns and drag-and-drop' },
    { name: 'user-journey', href: '/docs/elements/web-components/user-journey/', desc: 'User journey map with SVG emotion curve and phase breakdown' },
    { name: 'user-persona', href: '/docs/elements/web-components/user-persona/', desc: 'User persona card with avatar, demographics, goals, and frustrations' },
    { name: 'user-story', href: '/docs/elements/web-components/user-story/', desc: 'Agile user story card with priority, status, and acceptance criteria' },
    { name: 'work-item', href: '/docs/elements/web-components/work-item/', desc: 'Agile work item card with status, priority, and assignee fields' },
  ],

  'Design System Tools': [
    { name: 'accessibility-specimen', href: '/docs/elements/web-components/accessibility-specimen/', desc: 'WCAG contrast-ratio table for color pairs + a11y checklist with status icons' },
    { name: 'color-palette', href: '/docs/elements/web-components/color-palette/', desc: 'Interactive color swatch display with click-to-copy' },
    { name: 'component-sampler', href: '/docs/elements/web-components/component-sampler/', desc: 'Themed grid of native UI elements' },
    { name: 'font-pairer', href: '/docs/elements/web-components/font-pairer/', desc: 'Interactive font pairing tool with Google Fonts, live preview, and CSS export' },
    { name: 'gradient-builder', href: '/docs/elements/web-components/gradient-builder/', desc: 'Interactive CSS gradient builder with color stops and oklab interpolation' },
    { name: 'layout-specimen', href: '/docs/elements/web-components/layout-specimen/', desc: 'Visual specimen of all 14 VB layout primitives with mini-examples and snippets' },
    { name: 'palette-generator', href: '/docs/elements/web-components/palette-generator/', desc: 'Algorithmic color palette generation from a seed using OKLCH harmony modes' },
    { name: 'spacing-specimen', href: '/docs/elements/web-components/spacing-specimen/', desc: 'Spacing scale specimen that reads VB tokens and renders a visual bar chart' },
    { name: 'token-specimen', href: '/docs/elements/web-components/token-specimen/', desc: 'Unified design token scale display for shadows, radii, borders, colors, or sizes' },
    { name: 'type-specimen', href: '/docs/elements/web-components/type-specimen/', desc: 'Typography specimen with character grid, weight scale, and type scale' },
  ],

  'Site Infrastructure': [
    { name: 'brand-mark', href: '/docs/elements/web-components/brand-mark/', desc: 'Logo display with dark mode, compact variant, and stacked layout' },
    { name: 'change-set', href: '/docs/elements/web-components/change-set/', desc: 'Change tracking group with toggle between tracking, final, and original views' },
    { name: 'glossary-index', href: '/docs/elements/web-components/glossary-index/', desc: 'Interactive glossary with live search and scroll-spy letter tracking' },
    { name: 'glossary-wc', href: '/docs/elements/web-components/glossary-wc/', desc: 'Alphabetical glossary with search filtering and jump navigation' },
    { name: 'icon-wc', href: '/docs/elements/web-components/icons/', desc: 'Icon component with Lucide, Phosphor, Tabler, Bold, and Mage icon sets' },
    { name: 'include-file', href: '/docs/elements/web-components/include-file/', desc: 'Load remote HTML fragments with progressive enhancement' },
    { name: 'page-info', href: '/docs/elements/web-components/page-info/', desc: 'Document provenance disclosure with trust badges and authorship' },
    { name: 'page-stats', href: '/docs/elements/web-components/page-stats/', desc: 'Reading statistics with word count, reading time, and last-modified date' },
    { name: 'page-tools', href: '/docs/elements/web-components/page-tools/', desc: 'Configurable toolbar for page-level utilities with responsive FAB collapse' },
    { name: 'print-page', href: '/docs/elements/web-components/print-page/', desc: 'Print button with raw-mode toggle' },
    { name: 'settings-panel', href: '/docs/elements/web-components/settings-panel/', desc: 'Theme/settings panel with gear trigger and details accordion' },
    { name: 'comment-box', href: '/docs/elements/web-components/comment-box/', desc: 'Form-associated comment form composing markdown-editor + Submit/Cancel; presentational with respect to persistence' },
    { name: 'comment-thread', href: '/docs/elements/web-components/comment-thread/', desc: 'Threaded discussion container; decorates author-rendered <article data-comment> children with header, action row, threaded indentation; composes comment-box for reply form' },
    { name: 'reaction-bar', href: '/docs/elements/web-components/reaction-bar/', desc: 'GitHub-style emoji reaction picker with persistent chips and a curated palette popover' },
    { name: 'share-wc', href: '/docs/elements/web-components/share/', desc: 'Social share with native Web Share API and platform fallbacks' },
    { name: 'site-index', href: '/docs/elements/web-components/site-index/', desc: 'Site keyword index with search filtering' },
    { name: 'site-map', href: '/docs/elements/web-components/site-map/', desc: 'Interactive HTML sitemap with expand/collapse controls' },
    { name: 'site-map-wc', href: '/docs/elements/web-components/site-map-wc/', desc: 'Structured HTML sitemap with hierarchical navigation' },
    { name: 'theme-picker', href: '/docs/elements/web-components/theme-picker/', desc: 'Theme picker for colors, typography, and accessibility settings' },
    { name: 'time-index', href: '/docs/elements/web-components/time-index/', desc: 'Changelog/timeline with relative dates and version filtering' },
    { name: 'content-lens', href: '/docs/elements/web-components/content-lens/', desc: 'Universal switchable host for VB lens components' },
    { name: 'author-index', href: '/docs/elements/web-components/author-index/', desc: 'Author-grouped view of site content' },
    { name: 'topic-map', href: '/docs/elements/web-components/topic-map/', desc: 'SKOS-aware concept tree from vocabulary.json + pages.json' },
    { name: 'trust-filter', href: '/docs/elements/web-components/trust-filter/', desc: 'Filter pages by provenance, review level, status, and signed state' },
    { name: 'version-switcher', href: '/docs/elements/web-components/version-switcher/', desc: 'Surface and switch between versions of a page over time. Two modes (release versions / per-page history); navigate action (Phase 1)' },
    { name: 'recently-visited', href: '/docs/elements/web-components/recently-visited/', desc: 'Device-local reader history (localStorage, never aggregated)' },
    { name: 'popularity-index', href: '/docs/elements/web-components/popularity-index/', desc: 'Aggregated most-visited lens (degrades when endpoint unavailable)' },
  ],
};
