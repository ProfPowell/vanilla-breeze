# HTML Tag Review

The goal here is to look at the HTML tags and see what they do and what can be upscaled aor not with Vanilla Breeze.


## a

Auto styling style or usability indicators based upon the link type is the most obvious improvement
Small improvements in link styling such as underline adjustment for improved look using modern CSS

### Other ideas

hreflang - if the lang is not the same as the current page then maybe annotate the link with some indication of the language.

interestfor - this needs to be explored

ping - this should be used to tie with the vanilla breeze ping analytics system

referrerpolicy - could auto add this to outside links based upon some policy set at the site level

target - the obvious idea here is to add icons or indicators for the link

rel - probably the biggest opportunity here - https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel

    ```
       <a href="" rel="alternate"></a>
       <a href="" rel="author"></a> (auto set with a page author meta is available and available via <page-info>  This also seems like rel="me")
       <a href="" rel="help"></a> (seems useful if we have a help system)
       <a href="" rel="license"></a> (could be useful if we had a definition for content usage by humans and bots)
       <a href="" rel="next"></a> and <a href="" ref="prev"> (could be useful if we have a pagination system and could be improved with preloading)
        <a href="" rel="privacy-policy"> (could be useful in the footer privacy policy case)
        <a href="" rel="terms-of-service"> (could be useful in the footer legal info)

   **See [A Rel attribute plan](a-rel-attribute-plan.md) for more details**

type - could map if present to some icons

## abbr
- Likely this is mostly used for styling so we need to see what we have for that.

## address
- We have upscaled this a bit with CSS and we have a wrapper concept for a GeoMap you could potentially consider with <a> tags with rel to upscale with social information?

## area
- The old school image map concept can be upscaled there is a separate component to help to that
See

## article
- We have upscaled this a bit with CSS for prose support and a few other things.  We could consider some integration for alternative forms of output we already did that with <text-reader> but we might look into some aspects with RSS and Markdown in particular

## aside

- Should already be uspscaled with CSS a bit, if not it should be.
- It is used heavily in the layout aspect of the site by library for the "holy grail" style

## audio
- We have upscaled this a bit but it is currently being looked at with <audio-player> and <audio-visualizer> There needs to be some work on the styling aspect as the retro version had full styling and currently we aren't doing this properly.  The idea of track listing is being explored and I believe we used <details>, <summary>, and <ol> for this.  We could use a special custom element like <track-list> and <track-list-item> or class or data- attributes to make this easier.
- This should have overlap with <video>

## b
The current thought here is upscale this to do better typography with selecting specialized typeface for the current font if available or see if there is a variable font available.  See [b-and-i-typography.md](b-and-i-typography.md) for more details.

## base

- I see no use here for this in Vanilla Breeze, but I open to do a review on it to find use cases.

## bdi and bdo

- i18n is important in vanilla breeze and we should document this features, but I am not sure what the use case for upscaling is here.  I open to review this for possibilities

## blockquote
- We have upscaled this a bit with CSS for prose support and a few other things. We should invetigage the use of the `cite` attribute and how we might use this for auto-citation listings.  This would match the idea of the glossary systems we are looking into for Vanilla Breeze.  Think academic citations here.  Looking at what other markup systems for academic papers have done and see if we can provide value here.  Worth some research

## body
- We have lots of data-* attributes here for layout
- The most interesting areas not researched are all the events like print, beforeunload, error, languagechange, message, offline, online, pageswap, etc. that are on this element.  This may tie both to Vanilla Breeze and html-star and we should look into these events and what other attributes on <body> we can set as data-* for a control plane

## br
- This is generally not a great thing to use but we could suggest a pattern with it for form fields where we hide them in the CSS case and then they are there for the HTML case making the raw form of a page more reasonable when striped of style

## button
- This is styled obviously, but the main thing we are trying to do with it is using invokers and popover related things.  We should audit to make sure we have covered every possible aspect of these new attributes
- Type reset could auto add in some sort of confirmation mechanism
- We might consider some custom data-type  mechanisms for automatic upscaling of common features
- We have not explored the idea of the form attribute and formmethod of this element and have detached forms that can do things.  FOr example a CRUD pattern has add, edit, delete and having forms for each that are separate starts to create a fallback for no JavaScript situations that is clean.
- We need to makes sure we have usability and aria worked out properly on this element


## canvas

## caption

## cite

## code

## colgroup

## data

## datalist

## dd

## del

## details

## dfn

## dialog

## div

## dl

## dt

## em

## fencedframe

## fieldset

## figcaption

## figure

## footer

## form

## geolocation

## h1 - h6

## head

## headers

## hgroup
- Not much has been done here, it should be looked at

## hr
- Lots of styling efforts have happened here.  We probably need to review more typographical conventions and small details with it more than anything

## html
- We have lots of data-* attributes here for page control, CSS, and hopefully analytics use in conjunction with the head related data

## i
- The current thought here is upscale this to do better typography with selecting specialized typeface for the current font if available or see if there is a variable font available. See [b-and-i-typography.md](b-and-i-typography.md) for more details.

## iframe

## img

## input

## ins

## kbd

## label

## legend

## li

## link

## main

## map
- The old school image map concept can be upscaled there is a separate component to help to that

## mark

## marquee
- while deprecated we have a mechanism to support this in vanilla breeze with text effects and should looking a <marquee-wc> if needed?

## menu


## meta
- Big oppotunity here is to auto add some analytics data to the head

## meter

## nav

## noscript

## object

## ol

## optgroup

## option

## output
- Used properly with form fields in a pattern approach
- We should look at its use with <meter> or other things which may have status or calculation related.  In page form usage should likely target into this element

## p

## picture

## pre
- Could upscale this with <code> for autodetecting code blocks
- Could add things for styles and effects like terminal, poetry, etc..

## progress

## q

## rp, rt, ruby

## s
- Probably something we could upscale with a text effect

## samp

## script

## search

## section

## select

## selectedcontent
- This is a new element that is being explored and we should look at it more closely as it apparently could address lots of issues with drop downs and people have been doing wild stuff with it

## slot

## small
- why this is here and <big> isn't is not clear!

## source

## span

## strong

## style

## sub

## summary

## sup

## table

## tbody, thead, tfoot

## th, td

## time

## title

- Doing some thinking about using it for tab updates and awareness of page status

## track

## u

## ul

## var

## video
- This one is very much like <audio> but given the state of YouTube dominance there are some other aspects we could look at upscaling it

## wbr





