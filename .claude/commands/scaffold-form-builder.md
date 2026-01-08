# Scaffold Form Builder

Create a form builder application with dynamic form creation, validation, and submission handling.

## Usage

```
/scaffold-form-builder [project-name]
```

## Arguments

- `project-name` (optional): Name for the project directory. If not provided, will prompt for it.

## What This Creates

A complete form builder application with:

- **JSON Schema Forms** - Define forms declaratively
- **Field Types** - Text, email, select, checkbox, radio, file, date, range
- **Validation** - Built-in and custom validation rules
- **Conditional Logic** - Show/hide fields based on answers
- **Multi-step Forms** - Wizard-style form flows
- **Data Storage** - localStorage, IndexedDB, or REST API

### Project Structure

```
project-name/
├── index.html              # Form list page
├── form.html               # Form renderer page
├── vite.config.js          # Vite configuration
├── package.json
├── src/
│   ├── app.js              # Application entry
│   ├── components/
│   │   ├── FormRenderer.js # Main form component
│   │   └── FieldFactory.js # Field component factory
│   ├── lib/
│   │   ├── validation.js   # Validation rules
│   │   ├── conditions.js   # Conditional logic
│   │   ├── storage.js      # Data persistence
│   │   └── form-registry.js# Form discovery
│   ├── forms/
│   │   ├── contact.json    # Sample contact form
│   │   ├── survey.json     # Sample survey
│   │   └── application.json# Sample job application
│   └── styles/
│       └── forms.css       # Form styles
└── README.md
```

## Instructions

1. Read the manifest at `.claude/starters/form-builder/manifest.yaml`
2. Collect configuration using AskUserQuestion:
   - Project name (lowercase, hyphens)
   - Application name (display name)
   - Description (max 160 chars)
   - Theme color (default: #1e40af)
   - Storage type (localStorage, indexeddb, or api)
   - Enable analytics (yes/no)
   - Enable export (yes/no)
3. Create project directory
4. Copy template files
5. Replace all `{{PLACEHOLDER}}` variables with collected values
6. Copy shared resources from `_shared/`
7. Display success message with next steps

## Skills Used

This starter activates these skills:
- `forms` - Accessible form patterns
- `validation` - Data validation
- `state-management` - Client-side state handling
- `data-storage` - localStorage/IndexedDB patterns
- `accessibility-checker` - WCAG compliance

## Example

```
User: /scaffold-form-builder

Claude: Let's create a form builder application! I'll need some information:

[Asks for project name]
User: customer-surveys

[Asks for app name]
User: Customer Surveys

[Asks for description]
User: Create and manage customer feedback surveys

[Asks for storage type]
User: localStorage

[Creates project]

Claude: Form builder created successfully!

Your project is ready at: ./customer-surveys/

Next steps:
1. cd customer-surveys
2. npm install
3. npm run dev

Add new forms by creating JSON files in src/forms/
```

## Creating Forms

Forms are defined as JSON schemas:

```json
{
  "id": "feedback",
  "title": "Feedback Form",
  "description": "Share your thoughts",
  "fields": [
    {
      "name": "rating",
      "type": "range",
      "label": "Overall Rating",
      "validation": { "min": 1, "max": 5 }
    },
    {
      "name": "comments",
      "type": "textarea",
      "label": "Comments",
      "required": true
    }
  ],
  "submitButton": "Send Feedback"
}
```

## Field Types

| Type | Description |
|------|-------------|
| `text` | Single-line text input |
| `email` | Email with validation |
| `tel` | Phone number |
| `url` | URL input |
| `number` | Numeric input |
| `textarea` | Multi-line text |
| `select` | Dropdown menu |
| `radio` | Radio button group |
| `checkbox` | Single or multiple checkboxes |
| `file` | File upload |
| `date` | Date picker |
| `time` | Time picker |
| `range` | Slider input |
| `hidden` | Hidden field |

## Conditional Logic

Show fields based on other values:

```json
{
  "name": "other",
  "type": "text",
  "label": "Please specify",
  "showWhen": {
    "field": "choice",
    "operator": "equals",
    "value": "other"
  }
}
```

## Multi-step Forms

Create wizard-style forms:

```json
{
  "id": "application",
  "title": "Application",
  "steps": [
    { "title": "Personal Info", "fields": ["name", "email"] },
    { "title": "Details", "fields": ["resume", "cover"] },
    { "title": "Review", "summary": true, "fields": [] }
  ],
  "fields": [...]
}
```