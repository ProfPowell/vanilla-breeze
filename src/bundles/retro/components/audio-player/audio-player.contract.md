---
contract: audio-player
version: 1.0.0
tag: audio-player
bundle-hint: retro
category: media

consumes-tokens:
  - --color-primary
  - --color-surface-sunken
  - --color-surface-raised
  - --color-border
  - --color-text
  - --color-text-muted
  - --size-m
  - --radius-m
  - --font-mono
  - --shadow-m

exposes-tokens:
  - name: --audioplayer-screen-color
    default: var(--color-primary)
    description: Visualizer line colour and active accent colour
  - name: --audioplayer-bg
    default: var(--color-surface-sunken)
    description: Main body background
  - name: --audioplayer-bezel
    default: var(--color-border)
    description: Housing border and bevel colour
  - name: --audioplayer-text
    default: var(--color-text)
    description: Labels and readout text colour
  - name: --audioplayer-radius
    default: var(--radius-m)
    description: Corner rounding of the housing

parts:
  - name: bezel
    description: Outer housing
  - name: screen
    description: Visualizer canvas area
  - name: controls
    description: Transport control region
  - name: play-button
    also: control
    description: Play/pause toggle
  - name: skip-button
    also: control
    description: Skip/restart button
  - name: timeline
    also: control
    description: Seek range input
  - name: volume
    also: control
    description: Volume range input
  - name: time-display
    also: display
    description: Current time and duration readout
  - name: track-title
    also: display
    description: Track name display

attributes:
  - name: src
    required: true
    type: string
    description: Audio source URL
  - name: data-title
    required: false
    type: string
    description: Track display name. Inferred from src filename if omitted.
  - name: autoplay
    required: false
    type: boolean
  - name: loop
    required: false
    type: boolean
  - name: data-visualizer
    required: false
    type: enum
    values: [wave, bars, circle, none]
    default: wave

events:
  - name: vb:audioplayer:play
    detail: "{ currentTime: number, src: string }"
  - name: vb:audioplayer:pause
    detail: "{ currentTime: number }"
  - name: vb:audioplayer:ended
    detail: "{ src: string }"
  - name: vb:audioplayer:timeupdate
    detail: "{ currentTime: number, duration: number, progress: number }"

fallback: >
  Provide a native <audio controls src="..."> element as child content.
  It renders immediately without JavaScript and is adopted by the component
  as its audio source when JS runs.
---

# audio-player

A themeable audio player with a canvas visualizer display.

## Minimum viable implementation

An implementation is contract-compliant when it:

1. Plays audio from the `src` attribute
2. Provides accessible play/pause, seek, and volume controls
3. Reflects `data-state="playing|paused|ended"` on the host element
4. Dispatches all events listed above with correct `detail` shapes
5. Exposes all listed `::part()` names
6. Reads all listed `--audioplayer-*` tokens with documented fallbacks
7. Renders usable native audio fallback before JS executes

## What implementations may vary

- Visual layout and chrome structure
- Presence and style of a visualizer
- Number of visualizer modes
- Additional custom properties beyond the required set
- Additional parts beyond the required set
- Animation character and style
