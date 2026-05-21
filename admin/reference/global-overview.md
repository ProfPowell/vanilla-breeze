# Global Overview

## Summary
This document provides a global overview of the various projects I am working on right now how the relate to each other.  It also discusses the philosophy the projects are built around and the technology choices made. The document is intended to be a living document.

Using https://zingsoft.test will help you find your way to various projects as well as ~src and my GitHub account ProfPowell.

## Philosophy

Everything done in my software projects is built around the following principles:

* Minimalism - the least amount of material required to accomplish a task.
    - In the case of software this focuses on the minimum amount of code required to accomplish a task, but also the tooling required to accomplish the task.  I mean tooling in the sense of the number of tools required to accomplish the task, not necessarily the use of the tools.  As an example consider testing I may rely on a NodeJS built-in testing framework to be minimalistic but that doesn't mean I don't have a minimal number of unit tests. As an another example consider the web platform and what it provides.  We aim always to leverage and extend rather than reinvent.

* Simplicity - the simplest possible solution to a problem.
    - Here again the point is to not overly engineer the solution, but it doesn't mean that the solution is not complex.  Further, the simple solutions still need outlets for extension and expansion.  We aim to be more more user apparent simplicity particularly to get started, but complexity that reveals itself when needed and opportunities to expand are not shut off.

* Acceptance - accept the current state of the art and move forward.
    - We develop software to be long lived and to understand that it will certainly change and evolve. In a sense this is the role of progressive enhancement at all levels.  We work up from what is base to that which is more complex, we work from now to the future.  Something simulated today, might be platform based tomorrow.

* Humanistic - human users and their needs are kept in mind at all times
    - Software is for human use first and foremost and software should be designed to be useful and easy to use for humans.  This includes developers as well as the end users.  This would include accepting the range of users and their needs which touches accessibility (a11y), internationalization (i18n), usability, and personalization.  Aesthetics are important as well as they can spark joy and excitement, but we acknowledge that aesthetics change rapidly over time and represent a sense of fashion so we should be prepared to adapt. The idea of ** Unified User Centered Design and Development** is my term for the idea of closing the gap from design to development to evolution.

* AI Realistic - we understand that AI is here to stay, but is not everything.
    - We understand the power of AI and leverage it to build where and when possible. We understand people using our software may rely on it as well and build systems with this in mind, often providing an AI surface along with a humanistic surface. However, we acknowledge the resource use nature of AI and so we want to minimize impacts producing software that is cheap to run even if it is somewhat expensive to develop resource wise. We acknowledge the non-deterministic nature of GenAI and build safe guards and verifications in software build and operation that acknowledges that any software produced needs to be tested and verified deeply.

* Accountable - we understand that perfection is not possible, but accountability is
    - We always aim to remove errors and bugs early and often.  However, it simply is not possible to remove them all so we design systems to iterate and improve over time.  Observability is a key to this.

* Engineered - we aim to build software that is creative in design, but precisely engineered in implementation.
    - We aim to build software that is engineered to be robust by following a process that is well understood and documented.  Software activities from problem specification, requirements gathering, design, prototyping, implementation, verification, deployment, monitoring, maintenance, and iteration for evolution is standard and our process follows this.  Rigidity is not possible in some aspects particular design choices and conditions change so true Agile beliefs are the heart of our approach.

* Open - open source software is used where possible.
    - In the cases we must use a dependency we aim to use open source.  We contribute back, but acknowledge that software and its creation is not free of risk when doing so.  Dependencies are wrapped for possible substitution down the line whether it is a tool, library, or service endpoint.


## Projects

The following projects are currently under development:

1. Vanilla Breeze

    This is the most active project that I am currently working.  The point of the project is to provide a web platform first approach to build web sites and basic web applications that would be typical for a personal or business site.  It is not geared towards global scale type projects and does not aim to be everything, but it is the output of other systems.

    The general idea of the project is to use semantic HTML strictly even with XHTML style parsing for quality and lean into what the platform gives us.  It favors an approach with few or no <div> tags and lots of semantic HTML.  Classes are used for variations and not to make new elements, set behavior or other things.  Data-* attributes are used for state and behavior.  When elements need to be introduced we start first with custom-elements just with CSS and eventually move to web components if needed.  Everything follows a progressive enhancement philosophy. Declarative programming with invokers and interactive elements like <details> and <dialog> are used to avoid needless JavaScript.   Traditional web philosophy with links, forms, and appropriate hypertext thinking is leveraged everywhere.

    CSS is used for styling and tries to map to the tree structure of HTML naturally using nesting, scope and layers. CSS variables are used throughout and relative units are the goal at all times to adapt to varying viewports and situations. Modern CSS is leveraged at all times using flex, grid, complex selectors like has: and is: and not: as well as functions. View transitions are used for SPA like effects and animations.  A robust theme system is provided to allow for dramatic customization of vanilla breeze sites for aesthetic, aesthetic, or environmental (medium) reasons.

    The last point suggest a multi-modality aspect of the project where we think about user and environment.  Desktop screen, laptop screen, mouse or touch, screen or print, even voice (see <text-reader>) all are considered.  As the basis and output of many things Vanilla Breeze is often the output of things (Vanilla Press or other CMS) or the configuration of things like (Open Analytics or other analytics).  It is even used as the platform for prototyping with the Universal User Centered Design and Development Process as we want to support wireframe modes and mocking text/images so that we can being building directly towards it.


2. HTML-Star

    This is the most Vanilla Breeze aligned project that has been considered to be folded in potentially.  The library is a remix of the ideas of HTMX trying to leverage traditional hypertext thoughts and standard HTML and CSS to build common app like experiences.  It relies on data-* attributes (thus the star) and tries to rely on smart defaults and progressive enhancement.  A concern with it is the lack of server side rendering and adaptability to different outputs like Markdown and JSON for consumption by AI or other software.  It may be rolled into one project or another or stay on its own.

3. Montane

    This project is an idea that covers the more SPA like ideas that HTML-Star is not well suited to.  It is like Alpine.js in spirit, but tries to adopt the more platform focused philosophy of Vanilla Breeze to avoid inventing specialized markup syntax.  It is not as far along as as HTML-Star and Vanilla Breeze and needs to be considered carefully for integration points.

4. Vanilla Press (CMS Strategy)

    This project is the most direct CMS strategy being worked on for Vanilla Breeze.  The idea is to provide structured content management for Vanilla Breeze sites and create the sites directly in Vanilla Breeze itself.  It could use an editor component and one is built but looking at others like https://github.com/Samyssmile/notectl looked promising if not.  There is a lot of work to do here and the sites we currently work on are mostly in Wordpress so understanding migration or integration with whatever CMS we use is important. Other CMS efforts include:
        - Cook - a custom static site generator that could be adapted for vanilla breeze
        - Eleventy or Astro - two SSGs we have used on projects with varying degrees of success.  11ty being a better fit generally.
        - The PWP (Pint Web Platform) - a PHP based CMS that had static publishing used by my agency for many years.  It did publishing style and interactive so it is an SSG and standard CMS, it supported multi-site management, and had a module system and robust list and templating mechanism.  The project was ported to NodeJS as well but it was retired mostly because its front end was built in ExtJS and was not easy to work on and thus looked dated despite its power.  It could be possible to recover this platform and use it as a CMS.
        - Other headless CMSes - there are lot of CMSes out there and it makes sense to look at then both to learn, but potentially just to use.

    - The CMS strategy is still a work in progress and likely won't settle on a single approach. The current thought is to stabilize what they will eventually output (Vanilla Breeze, HTML-Star, etc.) powered sites and then settle it.

5. Open Analytics

    This has lacked a set name I have tried this as TritonAnalytics and VBAnalytics in planning efforts, but the rough idea is to move away from Google Analytics and towards an open first party self-managed system. We also are very concerned with user management of collected data, the awareness of bots particular for LLM use, and how we can use analytics for both behaviorial value but development value such as finding errors and performance issues. We do not have a set roadmap and prototype for this but it is coming very soon.

6. Cross Cutting Data Integrity and Meta Initiative

    Because content is so easily created in the GenAI age there is a need for a system to ensure that content is not lost or corrupted and that users visiting a site can trust it.  Change tracking with native hooks to <ins> and <del> in HTML is a start, but we need some signature mechanism for content tracking and transparency of changes.  In a way it is likely to be related to digital signatures and cryptography like docusign style systems but for all content.  The general idea being how we moved from http to https we might have to move from html to htmls where htmls is a securely signed version of HTML.

     The meta data aspect of the project suggests aspects about the content and site that describe and control it.  Some of these things might influence navigation and search pushing adaptable interfaces following my idea of Wizzy-want (What you see is what you want) and the idea of the Universal User Centered Design and Development Process. It likely cross cuts into Vanilla Breeze and HTML-Star and the CMS strategy.

7. The Unified User Centered Design and Development Process

    I have efforts underway to proceduralize the effort of developing an idea, writing personas and user stories with TUI or GUI tools, building site maps, taxonomies, and wireframe artifacts in open formats like JSON and raw HTML using vanilla breeze so we build in the final material as opposed to pixels first in Figma and then convert to HTML.

8. Useful Web Components

    A variety of web components have been developed recently and some are quite important for the projects discussed for documentation and teaching purposes.  The most notable are

    - <browser-window> - a way to display and scope demos that allow demo display, source access, and sharing
    - <code-black> - a way to display code listings complete with line numbering, highlighting, and copy features
    - <terminal-window> - a way to display terminal like demos in a browser window to show up commands or interactive use of a CLI.  It can even simulate actions to help train users
    - <http-component> - a collection of HTTP components that allow us to show request and responses in a pretty manner and to monitor requests on a web page like the browser dev tools
    - <browser-console> - a way to bring the console of the browser into the web page and display it in a pretty manner, might also be used to display errors and other messages
    - <screen-saver> - a silly screen saver component that may be consumed into vanilla breeze to allow users to market and have fun with their sites and applications.
    - Misc others like <user-persona>, <user-story>, <user-journey> (to be developed) and <page-diagnostics> are being developed and likely will fall into vanilla breeze or the UUCD or CMS projects

    9. Teaching Artifacts

    Teaching at two major institutions UC San Diego and University of San Diego the topics of web development and software engineering I am constantly making demos and tutorial content.  Sadly these items are spread all over and I need to really organize them and avoid rebuilds.

    A local site https://zingsoft.test/tutorials/ has many linked tutorials and there is a large effort at the https://cse135.site/

    The largest effort is IWT - Intro to Web Technologies

        My teaching site for all aspects of my web development courses that should subsume things like cse135.site and many of various tutorial files.  It is a private and public compendium of all the learnings I have gained over the 30 years of web development distilled into a knowledge base for course, public and AI use.  It is currently hosted at https://introweb.tech and has a local repo.  It uses Astro I believe and does not use Vanilla Breeze.

10. Data Visualization and ZingSoft

    Another aspect of myself is as the owner of ZingSoft. I have made ZingChart.com a declarative JavaScript charting library with a JSON configuration and multiple renders both SVG and Canvas and ZingGrid.com a web component data table that allows you to do a CRUD powered data table on a REST endpoint easily.  I am currently building ZingViz which is a next generation version of the ZingChart library and it has renders for Typescript, Swift, C# and Java so it can take a single packet and render to all environments.  I am constantly doing experiments to see how to do chart building in a generalized fashion, scale up to larger datasets using WebGL or esoteric techniques like data-structures like kd-trees or alternative data encoding schemes to remove the problems of parsing large JSON.  A number of the experiments in my ~src tree are for this type of thing and include concepts like Scalable Vector Charts (SVC) which is an old project I did for declarative charts that may be used in vanilla breeze and a variety of other experiments such as an AI style front-end that moves from NLP to more defined structured data.  These do not necessairly intersect with Vanilla Breeze but they are related in places.

11. Personal Website and Projects

    I have long wanted to have a personal website and need to work on building it.  I have a large amount of writing in my Craft system and documents I share from it.  Some of this belongs in teaching efforts but some not.

    I have a repo ProfPowell/retro-fun which is a collection of odd things I am making that is hosted at https://cyberviber.ninja that is my crazy side where as I would like https://thomasapowell.com to be the more serious site of me with resume and writings.  It would likely point to my class sites as well as my corporations.

## Challenges

Prioritization and coordination of work is a challenge.  I have many projects running and it is hard to keep track of them all and AI is both helping and hurting me in this regard, but generally I am bullish as it is helping me organize and move ideas from my head to reality.  I do think that an underlying goal for me is to help figure out how to leverage GenAI for Software Engineering both to teach it better and help my students and to leverage it to build tools and systems that are useful to me and my organizations.  I have lots of skills files and have tried various determinstic guards to help keep LLMs from not ruining code.  I am not sure I am doing things right and I while I know about CLAUDE.md files and other things my use of them is at times worrisome.