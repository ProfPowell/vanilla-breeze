/**
 * Styles for icon-wc component
 */
const styles = `
:host {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 1.5em;
  block-size: 1.5em;
  vertical-align: middle;
  line-height: 1;
  color: inherit;
}

:host([size="xs"]) {
  inline-size: 1em;
  block-size: 1em;
}

:host([size="sm"]) {
  inline-size: 1.25em;
  block-size: 1.25em;
}

:host([size="md"]) {
  inline-size: 1.5em;
  block-size: 1.5em;
}

:host([size="lg"]) {
  inline-size: 2em;
  block-size: 2em;
}

:host([size="xl"]) {
  inline-size: 2.5em;
  block-size: 2.5em;
}

:host([size="2xl"]) {
  inline-size: 3em;
  block-size: 3em;
}

/* Sizing only. Paint (fill/stroke/stroke-width) comes from each file's own
   presentation attributes: Lucide/Tabler/Mage are stroked, Phosphor/Bold are
   filled. Any author rule here, even :where(), would beat those attributes. */
svg {
  display: block;
  inline-size: 100%;
  block-size: 100%;
}

/* Opt-in RTL mirroring for directional glyphs (arrows, chevrons, undo…) */
:host([data-flip-rtl]:dir(rtl)) svg {
  transform: scaleX(-1);
}

/* Error state */
:host([data-error]) {
  opacity: 0.5;
}

/* Hidden state for missing icons */
:host([hidden]) {
  display: none;
}
`;

export { styles };
