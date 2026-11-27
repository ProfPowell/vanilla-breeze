# <audio-visualizer>

Canvas-based audio visualization companion

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/audio-visualizer/
- Vanilla Breeze 0.7.4

## Example

```html
<audio-player>
  <audio id="demo-track" controls>
    <source src="track.mp3" type="audio/mpeg">
    <p><a href="track.mp3" download>Download track</a></p>
  </audio>
</audio-player>
<audio-visualizer for="demo-track" data-mode="bars"></audio-visualizer>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `for` | string |  | Required. ID of the target <audio> element |
| `data-mode` | string |  | Visualization mode: "bars" (default), "waveform", "circle" |
| `data-fft-size` | number |  | AnalyserNode FFT size (power of 2, 32-32768). Default: 256. Other values are rounded to the nearest power of two and clamped to that range |
| `data-state` | `cross-origin`, `error` |  | Set when the visualizer cannot hook the audio: "cross-origin" (cross-origin source without crossorigin + CORS — left unhooked so it stays audible) or "error" (Web Audio connection failed). Absent while visualizing normally |

## Accessibility

- Pattern: Decorative canvas
- The component manages: `aria-hidden`
