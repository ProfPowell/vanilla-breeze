# <youtube-player>

YouTube embed behind a facade: a thumbnail (or local poster) and one play button; the youtube-nocookie.com iframe loads only when the reader presses play. Without poster the thumbnail is requested from i.ytimg.com on render.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/youtube-player/
- Vanilla Breeze 0.7.4

## Example

```html
<youtube-player
  video-id="dQw4w9WgXcQ"
  title="Rick Astley — Never Gonna Give You Up">
</youtube-player>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `video-id` | string |  | YouTube video ID (6–20 of A–Z a–z 0–9 _ -). Missing or invalid: the element does not upgrade and the authored fallback stays. |
| `title` | string | `YouTube video` | Video title: the iframe title and the {title} in the play-button name. |
| `start` | number |  | Start playback at N seconds. Whole non-negative seconds only; anything else is ignored with a console warning. |
| `end` | number |  | Stop playback at N seconds. Whole non-negative seconds only. |
| `list` | string |  | YouTube playlist ID. |
| `params` | string |  | Extra query string for the embed URL (escape hatch); its keys override start, end, list and autoplay. The embed host is fixed. |
| `autoplay` | boolean |  | Load the iframe on connect instead of the facade (this contacts YouTube at once). Ignored under prefers-reduced-motion or data-motion-reduced. Never moves focus. |
| `thumbnail` | `hq`, `mq`, `sd`, `maxres` | `hq` | i.ytimg.com thumbnail size. sd and maxres fall back to hq when the video has none. |
| `poster` | string |  | Local image URL for the facade. When set, no thumbnail is requested from i.ytimg.com; nothing contacts Google until play. |
| `data-label-play` | string | `Play {title}` | Accessible name of the play button; {title} is replaced with the title. |
| `state` | `ready`, `active` |  | Set by the component: ready = facade shown, active = iframe inserted. Reconnect (move or reinsert) renders the facade again. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `youtube-player:activate` | `{ videoId: string, fromUser: boolean }` | Fired (bubbles) when the iframe is inserted; fromUser is false for the autoplay attribute. |
| `youtube-player:upgraded` |  | Fired (bubbles) after the element upgrades. |

## Accessibility

- Pattern: Button
- You provide: A title attribute naming the video; it names the play button and the player frame
- The component manages: `aria-label`, `title`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Load the video and move focus to the player frame | Native behaviour of button |
