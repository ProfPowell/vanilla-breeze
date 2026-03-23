
* Vanilla Breeze

  The core library that is a progressive enhancement framework that underpins all pages and views.  It is platform first, semantic, a11y focused, inherently i18n friendly, and comprehensive.

   It relies on smart defaults like a form of user-agent style sheet for a site using it.  It then upscales with custom elements avoiding <div> soup and class abuse.  It uses classes for overrides where appropriate however.

    data-* attributes are used to extend and provide hooks for behavior, configuration, and state.

    JavaScript is employed both in a traditional JavaScript direct DOM access using data-*, element, or class hooks or in the form of web components.

    It is highly themeable

    Dependent web components for the documentation site include

         * browser-window - a browser frame mechanism to show demos in a contextual manner and to provide easy containment and access.  These demos can easily be shared to code-pen or downloaded

         * code-block - a code listing and highlighting system

         * other components that could be included would include terminal-window and http-component but those are primarily for educational materials so far and have not been used in vanilla breeze

* HTML-Star

   This library is meant to be a variation of the HTMX approach to web development attempting to provide interaction support for common app styles that is more server focused and fits with the web platform as opposed to redeclaring it in JavaScript.

   Like VB (Vanilla Breeze) it is heavily data-* attribute driven and is potentially a candidate to be made first class in Vanilla Breeze given the common needs

* Montane

    This library is a play on the ideas of Alpine.js thus its name.  It is not heavily worked on compared to VB and HTML-star but may be developed further to provide more SPA support

* Cook

    This is an older project that has been revived and is a static site generator (SSG) like 11ty but it is even more platform first.  It has recently (March 2026) been revived and it is hopeful that we can remove this to avoid using 11ty or Astro though we will provide eventually support for 11ty, Astro and Wordpress in our broader ecosystem for both integration and migration.

* Vanilla Press

    A Prose Mirror AST based editor is in an Alpha shape and can roughly generate VB pages using a WYSIWYG style.  Development is on hold until VB and lower level concepts are stabilized.  The base idea being that do not automate page creation until the system itself is stable as the editor depends on something that should be done manual first.  A related editor "Grid Composer" was looked into at one point for layout purposes.


* Vanilla Analytics

*