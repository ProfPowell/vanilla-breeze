# Form Builder Starter

A dynamic form creation system with validation, conditional logic, and submission handling.

## Features

- **JSON Schema Forms** - Define forms declaratively
- **Field Types** - Text, email, phone, select, checkbox, radio, file, date, range
- **Validation** - Built-in and custom validation rules
- **Conditional Logic** - Show/hide fields based on answers
- **Multi-step Forms** - Wizard-style form flows
- **Data Storage** - localStorage, IndexedDB, or REST API
- **Analytics** - Track completion rates and drop-offs
- **Export** - Download responses as CSV or JSON
- **Accessible** - WCAG 2.1 AA compliant

## Project Structure

```
src/
├── components/
│   ├── FormRenderer.js      # Renders form from schema
│   ├── FieldFactory.js      # Creates field components
│   └── fields/
│       ├── TextField.js
│       ├── SelectField.js
│       ├── CheckboxField.js
│       ├── RadioField.js
│       ├── FileField.js
│       └── ...
├── lib/
│   ├── validation.js        # Validation rules
│   ├── conditions.js        # Conditional logic
│   ├── storage.js           # Data persistence
│   └── analytics.js         # Form analytics
├── forms/
│   ├── contact.json         # Sample contact form
│   ├── survey.json          # Sample survey
│   └── application.json     # Sample application
├── layouts/
│   └── FormLayout.js        # Form page layout
├── pages/
│   ├── index.html           # Form list
│   └── form.html            # Form renderer
└── styles/
    └── forms.css            # Form styles
```

## Defining Forms

Forms are defined as JSON schemas in `src/forms/`:

```json
{
  "id": "contact-form",
  "title": "Contact Us",
  "description": "Send us a message",
  "fields": [
    {
      "name": "name",
      "type": "text",
      "label": "Your Name",
      "required": true,
      "validation": {
        "minLength": 2,
        "maxLength": 100
      }
    },
    {
      "name": "email",
      "type": "email",
      "label": "Email Address",
      "required": true
    },
    {
      "name": "subject",
      "type": "select",
      "label": "Subject",
      "options": [
        { "value": "general", "label": "General Inquiry" },
        { "value": "support", "label": "Technical Support" },
        { "value": "sales", "label": "Sales" }
      ]
    },
    {
      "name": "message",
      "type": "textarea",
      "label": "Message",
      "required": true,
      "validation": {
        "minLength": 10,
        "maxLength": 1000
      }
    }
  ],
  "submitButton": "Send Message",
  "successMessage": "Thank you! We'll respond within 24 hours."
}
```

## Field Types

| Type | Description | Validation Options |
|------|-------------|-------------------|
| `text` | Single-line text | minLength, maxLength, pattern |
| `email` | Email address | Built-in email validation |
| `tel` | Phone number | pattern for format |
| `url` | URL input | Built-in URL validation |
| `number` | Numeric input | min, max, step |
| `textarea` | Multi-line text | minLength, maxLength |
| `select` | Dropdown | options array |
| `radio` | Radio buttons | options array |
| `checkbox` | Checkboxes | single or multiple |
| `file` | File upload | accept, maxSize |
| `date` | Date picker | min, max |
| `time` | Time picker | min, max |
| `range` | Slider | min, max, step |
| `hidden` | Hidden field | For tracking data |

## Conditional Logic

Show fields based on other field values:

```json
{
  "name": "otherReason",
  "type": "textarea",
  "label": "Please specify",
  "showWhen": {
    "field": "reason",
    "operator": "equals",
    "value": "other"
  }
}
```

### Operators

- `equals` - Field equals value
- `notEquals` - Field does not equal value
- `contains` - Field contains value (for arrays/text)
- `greaterThan` - Numeric comparison
- `lessThan` - Numeric comparison
- `isEmpty` - Field is empty
- `isNotEmpty` - Field has value

### Complex Conditions

```json
{
  "showWhen": {
    "operator": "and",
    "conditions": [
      { "field": "age", "operator": "greaterThan", "value": 18 },
      { "field": "country", "operator": "equals", "value": "US" }
    ]
  }
}
```

## Multi-step Forms

Define steps in your form schema:

```json
{
  "id": "application",
  "title": "Job Application",
  "steps": [
    {
      "title": "Personal Info",
      "fields": ["name", "email", "phone"]
    },
    {
      "title": "Experience",
      "fields": ["resume", "experience", "skills"]
    },
    {
      "title": "Review",
      "fields": [],
      "summary": true
    }
  ]
}
```

## Validation

### Built-in Rules

```json
{
  "validation": {
    "required": true,
    "minLength": 5,
    "maxLength": 100,
    "pattern": "^[A-Za-z]+$",
    "min": 0,
    "max": 100,
    "email": true,
    "url": true
  }
}
```

### Custom Validation

```javascript
// src/lib/validation.js
export const customRules = {
  postalCode: (value, country) => {
    const patterns = {
      US: /^\d{5}(-\d{4})?$/,
      CA: /^[A-Z]\d[A-Z] \d[A-Z]\d$/i,
      UK: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i
    };
    return patterns[country]?.test(value) || 'Invalid postal code';
  }
};
```

## Data Storage

### localStorage (Default)

```javascript
// Automatic - forms save to localStorage
// Access via: localStorage.getItem('form-{formId}-responses')
```

### IndexedDB

```javascript
// For large datasets with querying
import { FormStorage } from './lib/storage.js';

const storage = new FormStorage('indexeddb');
const responses = await storage.query('survey', {
  where: { completed: true },
  orderBy: 'submittedAt'
});
```

### REST API

```javascript
// Configure API endpoint in form schema
{
  "submit": {
    "endpoint": "/api/forms/submit",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer {{token}}"
    }
  }
}
```

## Analytics

Track form interactions:

```javascript
import { FormAnalytics } from './lib/analytics.js';

// Automatically tracks:
// - Form views
// - Field focus/blur times
// - Validation errors
// - Completion rate
// - Drop-off points

const analytics = new FormAnalytics('contact-form');
const stats = analytics.getStats();
// { views: 100, starts: 80, completions: 45, dropOffField: 'phone' }
```

## Export

Download form responses:

```javascript
import { exportResponses } from './lib/export.js';

// Export as CSV
exportResponses('survey', 'csv');

// Export as JSON
exportResponses('survey', 'json');

// Export with filters
exportResponses('survey', 'csv', {
  from: '2024-01-01',
  to: '2024-12-31',
  completed: true
});
```

## Customization

### Custom Field Types

```javascript
// src/components/fields/RatingField.js
export class RatingField extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'value', 'max'];
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const max = parseInt(this.getAttribute('max') || '5');
    this.innerHTML = `
      <fieldset class="rating-field">
        ${Array.from({ length: max }, (_, i) => `
          <label>
            <input type="radio" name="${this.getAttribute('name')}" value="${i + 1}" />
            <span class="star">★</span>
          </label>
        `).join('')}
      </fieldset>
    `;
  }
}

customElements.define('rating-field', RatingField);
```

### Styling Forms

Edit `src/styles/forms.css` for custom styles. Uses CSS custom properties for theming.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run test     # Run tests
```

## Skills Used

- `forms` - Accessible form patterns
- `validation` - Data validation with JSON Schema
- `state-management` - Client-side state handling
- `data-storage` - localStorage/IndexedDB patterns
- `accessibility-checker` - WCAG compliance