# <audio-player>

Platform audio player web component

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/audio-player/
- Vanilla Breeze 0.7.4

## Example

```html
<audio-player>
  <audio controls>
    <source src="track.ogg" type="audio/ogg">
    <source src="track.mp3" type="audio/mpeg">
    <p><a href="track.mp3" download>Download track</a></p>
  </audio>
</audio-player>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `autoplay` | boolean |  | Start playing on load (subject to browser autoplay policy) |
| `loop` | boolean |  | Single track: sets the native audio.loop. Playlist: wrap to the first track after the last; with shuffle, start a new shuffle cycle |
| `shuffle` | boolean |  | Advance to a random track: each track plays once per cycle, never twice in a row. Without loop, playback stops at the end of the cycle |
| `state` | `playing`, `paused`, `ended` |  | Reflected playback state, set by the component |
| `muted` | boolean |  | Reflects the inner audio.muted (set by the mute button, the M shortcut or script) |
| `data-state` | `error` |  | "error" when the audio (or every <source>) fails to load; a visible, politely announced message is shown. Cleared when a source loads |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `controls` | audio | boolean |  | Native controls for the no-JS fallback. Removed while the component is upgraded, restored when it disconnects |
| `data-audio-active` | li | boolean |  | The loaded track. Author sets the initial one; the component moves it and keeps it on a track after it ends |
| `data-audio-played` | li | boolean |  | Set by the component when the track plays to the end |
| `data-audio-favorite` | li | boolean |  | Author-set editorial highlight (heart marker) |

## Structure

| Child | Description |
| --- | --- |
| `audio` | The native audio element (light DOM); the component renders custom controls for it |
| `ol.track-list` | Optional playlist (usually inside <details>): one <li> per track with an <a href> to the file |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `audio-player:play` | `{ currentTime, src }` | Playback started |
| `audio-player:pause` | `{ currentTime }` | Playback paused |
| `audio-player:ended` | `{ src }` | A track played to the end |
| `audio-player:track-change` | `{ src, title }` | A playlist track was activated (click or auto-advance) |
| `audio-player:src-changed` | `{ src, source: 'property' }` | The src property was set |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `src` | `string` | Get/set the inner <audio> source. Setting loads it, refreshes the title, moves data-audio-active to a matching track link and fires audio-player:src-changed |
| `currentTime` | `number` | Playback position in seconds (proxies audio.currentTime) |

## CSS custom properties

| Property | Description |
| --- | --- |
| `--audio-player-accent` | Play button, slider thumbs and progress fill colour |
| `--audio-player-bg` | Player background and slider thumb border |
| `--audio-player-radius` | Player border radius |
| `--audio-player-text` | Track title and controls text colour |
| `--audio-player-border` | Player border and slider track colour |
| `--audio-player-shadow` | Player box shadow (opt-in, default none) |
| `--audio-player-padding` | Controls row padding |

## Parts

| Part | Description |
| --- | --- |
| `player` | Outer player container |
| `controls` | Controls row |
| `play-button` | Play/pause button |
| `track-info` | Track title and time display |
| `timeline` | Seek range input |
| `volume` | Volume range input |
| `error` | Load-error message (hidden unless data-state="error") |

## Accessibility

- Pattern: Native media controls
- You provide: An <audio> element, and an aria-label on the player when the default "Audio player" does not describe it
- The component manages: `role="group"`, `role="status"`, `aria-label`, `aria-keyshortcuts`, `aria-pressed`, `aria-valuetext`, `aria-hidden`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Space` | Play or pause | Focus anywhere inside the player, except on a button, the playlist summary or a text field |
| `ArrowLeft` | Seek back 10 seconds | Focus anywhere inside the player, except on the seek or volume slider or a text field |
| `ArrowRight` | Seek forward 10 seconds | Focus anywhere inside the player, except on the seek or volume slider or a text field |
| `m` / `M` | Mute or unmute | Focus anywhere inside the player, except in a text field |
