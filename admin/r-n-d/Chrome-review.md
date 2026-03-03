# Chrome Review

I looked at the last year or two of updates from Chrome and highlight some things to look into to support

# Multi-column Layouts

Should we experiment with multi-column layouts and provide that for articles?

# Fluid / text-scale modification

Apparently a meta name="text-scale" concept is being explored we should see if that has use for us

# Text Improvements

text-box, text-box-trim, and text-box-edge - https://developer.chrome.com/blog/css-text-box-trim and https://codepen.io/web-dot-dev/pen/RNbyooE  Apparently this article talks about the value and use of this idea - https://medium.com/microsoft-design/leading-trim-the-future-of-digital-typesetting-d082d84b202 but uses old syntax - now it is implemented.

# Base CSS Features

The attr() function appears to be able to use custom properties as well as types https://developer.chrome.com/blog/advanced-attr  This could be quite useful with our whole data-* for behavior approach.

# Scrolling Details

The scroll state and related ideas https://developer.chrome.com/blog/css-scroll-state-queries may have some value in our responsive situations.

# <dialog> changes

Apparently there is a closedby attribute now - https://developer.chrome.com/blog/new-in-chrome-134

# Customized Selects

We may have this already but base-select and other changes https://developer.chrome.com/blog/a-customizable-select seem quite exciting and could lead to wonderful vanilla breeze demos that are progressive enhancement

# Accessibility and i18n related

The idea of reading flow being controlled via reading-flow could be useful in accessibility and i18n contexts -https://developer.chrome.com/blog/reading-flow

Is our execution of Carousel accessible? Consult this article - https://developer.chrome.com/blog/accessible-carousel and compare to what we have done to make sure.


# SVG and SVC Related

So "https://developer.chrome.com/blog/new-in-chrome-141?hl=en#support-nested-svg"  (This feature supports applying width and height as presentation attributes on nested <svg> elements through both SVG markup and CSS. This dual approach provides you with greater flexibility, letting you manage and style SVG elements more efficiently within complex designs.) I think SVC in particular might find this useful for the charting done there?

# Search and Inbound Support

Looking at highlighted text in search result with ::search-text may be useful

# <geolocation> tag

Polyfill required likely but pretty cutting edge - https://developer.chrome.com/blog/geolocation-html-element


# Scroll Driven and Scrolled Triggered Animation Support

We need to watch out for too much JS take a look at looking into this
https://developer.chrome.com/blog/scroll-triggered-animations


# Questions

Are we using css if() much in vanilla breeze? https://developer.chrome.com/blog/if-article If so where and how, if not why not?

Should we look at all the CSS functions and see what could be used and how?

This could be for HTML-star as well but are we using view-transitions well enought in the library - https://developer.chrome.com/blog/view-transitions-in-2025?

Are we using container queries well enough in the library - https://developer.chrome.com/blog/new-in-chrome-142?hl=en#range-syntax

CHrome supports interestfor="" on <a> and <button> this seems useful are we using it properly?
