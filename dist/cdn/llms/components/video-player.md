# <video-player>

Platform video player: custom, keyboard-accessible controls (shadow DOM) over a light-DOM <video>, with optional playlist

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/video-player/
- Vanilla Breeze 0.7.4

## Example

```html
<video-player>
  <video controls poster="poster.jpg" width="960" height="540">
    <source src="video.mp4" type="video/mp4">
    <track kind="captions" src="en.vtt" srclang="en" label="English" default>
    <p><a href="video.mp4" download>Download video</a></p>
  </video>
</video-player>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `autoplay` | boolean |  | Start playing on first connect (subject to browser autoplay policy). Skipped under prefers-reduced-motion: reduce (which also cancels a native autoplay on the inner video) and never re-run when the player is moved/reconnected |
| `loop` | boolean |  | Single video: sets the native video.loop. Playlist: after the last track, wrap to the first |
| `shuffle` | boolean |  | Playlist: advance to a random other track when one ends |
| `muted` | boolean |  | Start muted. Afterwards reflects the inner video.muted (mute button, M key, an authored <video muted> or script) |
| `captions` | boolean |  | Start with the first captions/subtitles track showing. Afterwards reflects whether captions are showing |
| `state` | `idle`, `playing`, `paused`, `buffering`, `ended` |  | Reflected playback state, derived from the media element (also on reconnect) |
| `controls` | boolean |  | Set while the overlay controls are visible; removed by the auto-hide timer during playback (never while focus is inside the controls). Not the native controls attribute |
| `data-fullscreen` | boolean |  | Set while THIS player (or its video) is the fullscreen element |
| `data-label-player` | string | `Video player` | Host accessible name (role=group) unless aria-label/aria-labelledby is authored |
| `data-label-controls` | string | `Video controls` | Name of the controls group |
| `data-label-play-video` | string | `Play video` | Big play overlay button |
| `data-label-play` | string | `Play` | Play/pause button while paused |
| `data-label-pause` | string | `Pause` | Play/pause button while playing |
| `data-label-seek` | string | `Seek` | Seek slider |
| `data-label-skip-back` | string | `Skip back 10 seconds` | Skip-back button |
| `data-label-skip-forward` | string | `Skip forward 10 seconds` | Skip-forward button |
| `data-label-mute` | string | `Mute` | Mute toggle (state is carried by aria-pressed) |
| `data-label-volume` | string | `Volume` | Volume slider |
| `data-label-speed` | string | `Playback speed {rate}` | Speed button; {rate} is the localized rate, e.g. "1.5x" |
| `data-label-captions` | string | `Captions` | Captions toggle |
| `data-label-fullscreen` | string | `Fullscreen` | Fullscreen button |
| `data-label-exit-fullscreen` | string | `Exit fullscreen` | Fullscreen button while this player is fullscreen |
| `data-label-playing` | string | `Playing` | Live-region announcement |
| `data-label-paused` | string | `Paused` | Live-region announcement |
| `data-label-ended` | string | `Ended` | Live-region announcement |
| `data-label-buffering` | string | `Buffering` | Live-region announcement |
| `data-label-time-of` | string | `{current} of {duration}` | Seek slider aria-valuetext; {current}/{duration} are locale clock times, e.g. "0:05 of 3:20" |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `controls` | video | boolean |  | Native controls for the no-JS fallback. Removed while the component is upgraded, restored when it disconnects |
| `data-video-active` | li | boolean |  | The loaded playlist track. Author sets the initial one; the component moves it |
| `data-video-played` | li | boolean |  | Set by the component when the track plays to the end |
| `data-poster` | a | string |  | Playlist link: poster image to show for that track |
| `data-captions` | a | string |  | Playlist link: WebVTT captions URL; the component swaps in a captions <track> (marked data-dynamic) for that track |

## Structure

| Child | Description |
| --- | --- |
| `video` | The native video element (light DOM), with <source>/<track> children and fallback content |
| `ol.track-list` | Optional playlist (usually inside <details>): one <li> per video with an <a href> to the file |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `video-player:play` | `{ currentTime, src }` | Playback started |
| `video-player:pause` | `{ currentTime }` | Playback paused |
| `video-player:ended` | `{ src }` | A video played to the end |
| `video-player:track-change` | `{ src, title }` | A playlist track was activated (click or auto-advance) |
| `video-player:fullscreen` | `{ active }` | This player entered or left fullscreen |
| `video-player:speed` | `{ rate }` | Playback speed changed (cycles 0.5–2x) |
| `video-player:captions` | `{ active, label }` | Captions toggled by the button or C key |
| `video-player:src-changed` | `{ src, source: 'property' }` | The src property was set |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `src` | `string` | Get/set the inner <video> source. Setting loads it and fires video-player:src-changed |
| `currentTime` | `number` | Playback position in seconds (proxies video.currentTime) |

## CSS custom properties

| Property | Description |
| --- | --- |
| `--video-player-accent` | Progress fill, slider thumbs and focus ring fallback |
| `--video-player-controls-text` | Controls icon/text colour |
| `--video-player-radius` | Player border radius |
| `--video-player-border` | Player border (default none) |
| `--video-player-shadow` | Player box shadow (default none) |
| `--video-player-controls-padding` | Controls bar padding |
| `--video-player-overlay-bg` | Big play button disc background |
| `--video-player-timeline-height` | Seek track thickness |
| `--video-player-timeline-buffer` | Buffered-range bar colour |

## Parts

| Part | Description |
| --- | --- |
| `player` | Outer player container |
| `play-overlay` | Big centered play button (shown idle/ended; inert otherwise) |
| `controls` | Controls overlay (role=group) |
| `timeline` | Seek range input |
| `play-button` | Play/pause button |
| `mute-button` | Mute toggle (aria-pressed) |
| `volume` | Volume range input |
| `time-display` | Current time / duration readout |
| `speed-button` | Playback speed cycle button |
| `captions-button` | Captions toggle (hidden without a captions/subtitles track) |
| `fullscreen-button` | Fullscreen toggle |

## Accessibility

- Pattern: Media player with custom controls built from native buttons and range inputs
- You provide: A child <video>, with a captions <track> where speech is present; set aria-label when the default player name does not fit
- The component manages: `role="group"`, `role="status"`, `tabindex`, `aria-label`, `aria-keyshortcuts`, `aria-pressed`, `aria-valuetext`, `aria-live`, `aria-hidden`, `inert`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Space` / `k` | Play or pause | Focus on the player, not on one of its controls |
| `ArrowLeft` | Skip back 10 seconds | Focus on the player, not on one of its controls |
| `ArrowRight` | Skip forward 10 seconds | Focus on the player, not on one of its controls |
| `ArrowUp` | Raise the volume by 5% | Focus on the player, not on one of its controls |
| `ArrowDown` | Lower the volume by 5% | Focus on the player, not on one of its controls |
| `m` | Mute or unmute | Focus on the player, not on one of its controls |
| `f` | Enter or leave fullscreen | Focus on the player, not on one of its controls |
| `c` | Turn captions on or off | Focus on the player, not on one of its controls |
| `ArrowLeft` / `ArrowDown` | Seek back 5 seconds | Focus on the seek slider |
| `ArrowRight` / `ArrowUp` | Seek forward 5 seconds | Focus on the seek slider |
