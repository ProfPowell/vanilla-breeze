#!/usr/bin/env node

/**
 * Fake Content Batch Generator
 * Generate multiple fake content items using @faker-js/faker.
 *
 * Usage:
 *   node scripts/fake-content-helper.js --type product --count 10
 *   node scripts/fake-content-helper.js --type testimonial --count 5 --format json
 *   node scripts/fake-content-helper.js --type person --count 3 --output data/users.json
 *   node scripts/fake-content-helper.js --type article --count 5 --locale de
 */

import { faker } from '@faker-js/faker';
import { fakerDE, fakerFR, fakerES, fakerIT, fakerJA } from '@faker-js/faker';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  dim: '\x1b[2m'
};

// Locale mapping
const LOCALES = {
  en: faker,
  de: fakerDE,
  fr: fakerFR,
  es: fakerES,
  it: fakerIT,
  ja: fakerJA
};

// Content generators
const GENERATORS = {
  person: (f) => ({
    id: f.string.uuid(),
    name: f.person.fullName(),
    firstName: f.person.firstName(),
    lastName: f.person.lastName(),
    email: f.internet.email(),
    phone: f.phone.number(),
    jobTitle: f.person.jobTitle(),
    avatar: f.image.avatar(),
    bio: f.person.bio()
  }),

  product: (f) => ({
    id: f.string.uuid(),
    sku: f.string.alphanumeric(8).toUpperCase(),
    name: f.commerce.productName(),
    description: f.commerce.productDescription(),
    price: parseFloat(f.commerce.price({ min: 19.99, max: 299.99, dec: 2 })),
    category: f.commerce.department(),
    rating: parseFloat(f.number.float({ min: 3.5, max: 5, fractionDigits: 1 }).toFixed(1)),
    reviews: f.number.int({ min: 5, max: 500 }),
    inStock: f.datatype.boolean({ probability: 0.85 })
  }),

  testimonial: (f) => ({
    id: f.string.uuid(),
    quote: f.lorem.sentences({ min: 2, max: 4 }),
    author: f.person.fullName(),
    role: f.person.jobTitle(),
    company: f.company.name(),
    avatar: f.image.avatar(),
    rating: f.number.int({ min: 4, max: 5 })
  }),

  article: (f) => ({
    id: f.string.uuid(),
    title: f.lorem.sentence({ min: 5, max: 10 }),
    slug: f.lorem.slug(),
    author: f.person.fullName(),
    date: f.date.recent({ days: 30 }).toISOString(),
    excerpt: f.lorem.sentences(2),
    body: f.lorem.paragraphs(5),
    category: f.helpers.arrayElement(['Technology', 'Business', 'Lifestyle', 'Health', 'Science']),
    readTime: f.number.int({ min: 3, max: 15 }),
    tags: f.helpers.multiple(() => f.lorem.word(), { count: { min: 2, max: 5 } })
  }),

  company: (f) => ({
    id: f.string.uuid(),
    name: f.company.name(),
    catchPhrase: f.company.catchPhrase(),
    industry: f.company.buzzNoun(),
    phone: f.phone.number(),
    email: f.internet.email({ provider: 'company.com' }),
    website: f.internet.url(),
    address: {
      street: f.location.streetAddress(),
      city: f.location.city(),
      state: f.location.state({ abbreviated: true }),
      zip: f.location.zipCode(),
      country: f.location.country()
    },
    employees: f.number.int({ min: 10, max: 10000 }),
    founded: f.date.past({ years: 50 }).getFullYear()
  }),

  event: (f) => ({
    id: f.string.uuid(),
    title: f.lorem.sentence({ min: 3, max: 7 }),
    description: f.lorem.paragraph(),
    date: f.date.future({ years: 1 }).toISOString(),
    venue: f.company.name(),
    address: f.location.streetAddress(),
    city: f.location.city(),
    organizer: f.person.fullName(),
    price: parseFloat(f.commerce.price({ min: 0, max: 200, dec: 2 })),
    capacity: f.number.int({ min: 20, max: 500 }),
    attendees: f.number.int({ min: 5, max: 200 })
  }),

  faq: (f) => ({
    id: f.string.uuid(),
    question: f.lorem.sentence().replace('.', '?'),
    answer: f.lorem.sentences({ min: 2, max: 4 }),
    category: f.helpers.arrayElement(['General', 'Billing', 'Technical', 'Shipping', 'Returns'])
  })
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    type: 'person',
    count: 5,
    format: 'json',
    output: null,
    locale: 'en',
    seed: null,
    pretty: true
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--type':
      case '-t':
        parsed.type = next;
        i++;
        break;
      case '--count':
      case '-c':
        parsed.count = parseInt(next, 10);
        i++;
        break;
      case '--format':
      case '-f':
        parsed.format = next;
        i++;
        break;
      case '--output':
      case '-o':
        parsed.output = next;
        i++;
        break;
      case '--locale':
      case '-l':
        parsed.locale = next;
        i++;
        break;
      case '--seed':
      case '-s':
        parsed.seed = parseInt(next, 10);
        i++;
        break;
      case '--compact':
        parsed.pretty = false;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return parsed;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
${colors.cyan}Fake Content Batch Generator${colors.reset}

Generate multiple fake content items using @faker-js/faker.

${colors.yellow}Usage:${colors.reset}
  node scripts/fake-content-helper.js [options]

${colors.yellow}Options:${colors.reset}
  --type, -t     Content type (default: person)
  --count, -c    Number of items (default: 5)
  --format, -f   Output format: json, csv, html (default: json)
  --output, -o   Output file path
  --locale, -l   Locale: en, de, fr, es, it, ja (default: en)
  --seed, -s     Random seed for reproducibility
  --compact      Minified JSON output
  --help, -h     Show this help

${colors.yellow}Content Types:${colors.reset}
  person        Name, email, phone, job title, bio
  product       Name, price, description, category, SKU
  testimonial   Quote, author, company, role
  article       Title, author, date, body, excerpt
  company       Name, address, contact info
  event         Title, date, location, price
  faq           Question and answer pairs

${colors.yellow}Examples:${colors.reset}
  # Generate 10 products as JSON
  node scripts/fake-content-helper.js --type product --count 10

  # Generate 5 testimonials in German
  node scripts/fake-content-helper.js --type testimonial --count 5 --locale de

  # Save to file
  node scripts/fake-content-helper.js --type person --count 20 --output data/users.json

  # Reproducible output with seed
  node scripts/fake-content-helper.js --type product --count 5 --seed 12345
`);
}

/**
 * Convert items to CSV format
 */
function toCSV(items) {
  if (items.length === 0) return '';

  const headers = Object.keys(flattenObject(items[0]));
  const rows = items.map(item => {
    const flat = flattenObject(item);
    return headers.map(h => {
      const val = flat[h];
      // Escape quotes and wrap in quotes if contains comma
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Flatten nested object for CSV
 */
function flattenObject(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      Object.assign(result, flattenObject(value, newKey));
    } else if (Array.isArray(value)) {
      result[newKey] = value.join('; ');
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

/**
 * Convert items to HTML format
 */
function toHTML(items, type) {
  const templates = {
    person: (item) => `<article class="person">
  <img src="${item.avatar}" alt="${item.name}"/>
  <h3>${item.name}</h3>
  <p class="title">${item.jobTitle}</p>
  <p class="bio">${item.bio}</p>
  <a href="mailto:${item.email}">${item.email}</a>
</article>`,

    product: (item) => `<product-card sku="${item.sku}">
  <img src="/assets/images/placeholder/product-400x400.svg" alt="${item.name}"/>
  <h3>${item.name}</h3>
  <p>${item.description}</p>
  <data class="price" value="${item.price}">$${item.price}</data>
  <p class="category">${item.category}</p>
  <p class="rating">${item.rating} stars (${item.reviews} reviews)</p>
</product-card>`,

    testimonial: (item) => `<blockquote class="testimonial">
  <p>"${item.quote}"</p>
  <footer>
    <img src="${item.avatar}" alt="${item.author}"/>
    <cite>${item.author}</cite>
    <span class="role">${item.role}, ${item.company}</span>
  </footer>
</blockquote>`,

    article: (item) => `<article class="blog-post">
  <header>
    <h2>${item.title}</h2>
    <p class="meta">By ${item.author} | ${new Date(item.date).toLocaleDateString()} | ${item.readTime} min read</p>
  </header>
  <p class="excerpt">${item.excerpt}</p>
</article>`,

    faq: (item) => `<details class="faq-item">
  <summary>${item.question}</summary>
  <p>${item.answer}</p>
</details>`
  };

  const template = templates[type] || templates.person;
  return items.map(template).join('\n\n');
}

/**
 * Main function
 */
function main() {
  const args = parseArgs();

  // Validate type
  if (!GENERATORS[args.type]) {
    console.error(`${colors.red}Error: Unknown type "${args.type}"${colors.reset}`);
    console.error(`Available types: ${Object.keys(GENERATORS).join(', ')}`);
    process.exit(1);
  }

  // Get faker instance for locale
  const f = LOCALES[args.locale] || faker;
  if (!LOCALES[args.locale]) {
    console.error(`${colors.yellow}Warning: Unknown locale "${args.locale}", using English${colors.reset}`);
  }

  // Set seed if provided
  if (args.seed !== null) {
    f.seed(args.seed);
  }

  // Generate items
  const generator = GENERATORS[args.type];
  const items = f.helpers.multiple(() => generator(f), { count: args.count });

  // Format output
  let output;
  switch (args.format) {
    case 'csv':
      output = toCSV(items);
      break;
    case 'html':
      output = toHTML(items, args.type);
      break;
    case 'json':
    default:
      output = JSON.stringify(items, null, args.pretty ? 2 : 0);
  }

  // Output
  if (args.output) {
    const dir = dirname(args.output);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(args.output, output);
    console.log(`${colors.green}✓${colors.reset} Generated ${args.count} ${args.type}(s) -> ${args.output}`);
  } else {
    console.log(output);
  }
}

main();
