/**
 * Cook data config — imports shared data from the site data/ directory.
 * Both sites share the same data source so navigation, elements, etc. stay in sync.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '../data');

// Import JSON data
const navigation = JSON.parse(readFileSync(resolve(dataDir, 'navigation.json'), 'utf-8'));

// Import site config (dev/prod asset paths)
const siteModule = await import(resolve(dataDir, 'site.js'));
const site = siteModule.default || siteModule;

// Import data files for index page generation
const elementsModule = await import(resolve(dataDir, 'elements.js'));
const nativeCategoriesModule = await import(resolve(dataDir, 'nativeCategories.js'));
const webComponentsModule = await import(resolve(dataDir, 'webComponents.js'));
const customElementsModule = await import(resolve(dataDir, 'customElements.js'));
const attributeIndexModule = await import(resolve(dataDir, 'attributeIndex.js'));
const themeRegistryModule = await import(resolve(dataDir, 'themeRegistry.js'));
const budgetReportModule = await import(resolve(dataDir, 'budgetReport.js'));
const resilience = JSON.parse(readFileSync(resolve(dataDir, 'resilience.json'), 'utf-8'));
const themeRegistry = themeRegistryModule.default || themeRegistryModule;
const rawBudgetReport = budgetReportModule.default || budgetReportModule;
const budgetReport = typeof rawBudgetReport === 'function' ? rawBudgetReport() : rawBudgetReport;

export default {
  // Site metadata
  siteTitle: site.title,
  siteDescription: site.description,
  siteUrl: site.url,

  // Service worker meta tag (only in production)
  serviceWorkerMeta: site.isDev ? '' : '<meta name="vb-service-worker" content="true">',

  // Full site config object — layouts use ${site.css}, ${site.js}, etc.
  site,

  // Navigation data (header, sidebars, element/attribute/pattern listings)
  navigation,

  // Index page data
  elements: elementsModule.default || elementsModule,
  nativeCategories: nativeCategoriesModule.default || nativeCategoriesModule,
  webComponents: webComponentsModule.default || webComponentsModule,
  customElements: customElementsModule.default || customElementsModule,
  attributeIndex: attributeIndexModule.default || attributeIndexModule,
  themeRegistry,
  budgetReport,
  resilience,

  /* Provenance defaults — overridden per-page by generate-provenance-meta plugin
     when frontmatter declares author/dates/version/provenance/etc. Default to
     empty strings so layouts that reference ${provenanceMeta} etc. don't
     render literal placeholders on pages without frontmatter. */
  provenanceMeta: '',
  provenanceJsonLd: '',
  provenanceHtmlAttrs: '',
  pageInfoBlock: '',
};
