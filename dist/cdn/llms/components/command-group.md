# <command-group>

A labelled group of <command-item> elements inside a <command-palette>.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/command-palette/
- Vanilla Breeze 0.7.4

## Example

```html
<command-palette hotkey="meta+k">
  <command-group label="Navigation">
    <command-item value="home" data-hotkey="shift+h">
      Go Home
    </command-item>
    <command-item value="settings">
      Settings
    </command-item>
  </command-group>
  <command-group label="Actions">
    <command-item value="theme">Toggle Dark Mode</command-item>
    <command-item value="copy">Copy Current URL</command-item>
  </command-group>
</command-palette>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `label` | string |  |  |
