{{#IF_FRAMEWORK_ASTRO}}
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: '{{SITE_URL}}',
  markdown: {
{{#IF_CODE_HIGHLIGHTING_SHIKI}}
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
{{/IF_CODE_HIGHLIGHTING_SHIKI}}
{{#IF_CODE_HIGHLIGHTING_HIGHLIGHT_JS}}
    syntaxHighlight: false
{{/IF_CODE_HIGHLIGHTING_HIGHLIGHT_JS}}
{{#IF_CODE_HIGHLIGHTING_NONE}}
    syntaxHighlight: false
{{/IF_CODE_HIGHLIGHTING_NONE}}
  }
});
{{/IF_FRAMEWORK_ASTRO}}