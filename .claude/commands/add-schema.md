# Add Schema Command

Generate a JSON Schema file for request/response validation.

## Usage

```
/add-schema [name]
```

## Arguments

- `$ARGUMENTS` - Schema name
  - Examples: `create-user`, `product`, `task-request`

## Examples

```
/add-schema create-user
/add-schema product
/add-schema update-task-request
```

## Steps to Execute

### 1. Create Schemas Directory

```bash
mkdir -p schemas
```

### 2. Parse Schema Name

Convert name to appropriate format:
- `create-user` → `CreateUser`
- `product` → `Product`
- Detect if request/response from name suffix

### 3. Generate Schema File

Create `schemas/{name}.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://api.example.com/schemas/{name}.json",
  "title": "{Title}",
  "description": "TODO: Add description",
  "type": "object",
  "required": [],
  "properties": {

  },
  "additionalProperties": false
}
```

### 4. Template by Type

**Request Schema (create-*)**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://api.example.com/schemas/create-user-request.json",
  "title": "Create User Request",
  "description": "Request body for creating a new user",
  "type": "object",
  "required": ["email", "name", "password"],
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "description": "User's email address"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 255,
      "description": "User's full name"
    },
    "password": {
      "type": "string",
      "minLength": 8,
      "maxLength": 128,
      "description": "User's password"
    }
  },
  "additionalProperties": false
}
```

**Request Schema (update-*)**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://api.example.com/schemas/update-user-request.json",
  "title": "Update User Request",
  "description": "Request body for updating a user",
  "type": "object",
  "minProperties": 1,
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 255,
      "description": "User's full name"
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "User's email address"
    }
  },
  "additionalProperties": false
}
```

**Resource Schema**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://api.example.com/schemas/user.json",
  "title": "User",
  "description": "User resource",
  "type": "object",
  "required": ["id", "email", "name", "role", "createdAt"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier"
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "User's email address"
    },
    "name": {
      "type": "string",
      "description": "User's full name"
    },
    "role": {
      "type": "string",
      "enum": ["user", "admin", "moderator"],
      "description": "User's role"
    },
    "emailVerified": {
      "type": "boolean",
      "description": "Whether email is verified"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "Creation timestamp"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time",
      "description": "Last update timestamp"
    }
  }
}
```

**List Response Schema**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://api.example.com/schemas/user-list-response.json",
  "title": "User List Response",
  "description": "Paginated list of users",
  "type": "object",
  "required": ["data", "pagination"],
  "properties": {
    "data": {
      "type": "array",
      "items": {
        "$ref": "user.json"
      }
    },
    "pagination": {
      "$ref": "pagination.json"
    }
  }
}
```

### 5. Generate Validation Helper

Create `src/lib/validate.js` if not exists:

```javascript
// src/lib/validate.js
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemasDir = join(__dirname, '../../schemas');

const ajv = new Ajv({
  allErrors: true,
  removeAdditional: true,
  useDefaults: true
});

addFormats(ajv);

// Load and compile schemas
const schemaCache = new Map();

/**
 * Load and compile a JSON schema
 * @param {string} name - Schema name (without .json)
 * @returns {import('ajv').ValidateFunction}
 */
function loadSchema(name) {
  if (schemaCache.has(name)) {
    return schemaCache.get(name);
  }

  const schemaPath = join(schemasDir, `${name}.json`);
  const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
  const validate = ajv.compile(schema);

  schemaCache.set(name, validate);
  return validate;
}

/**
 * Validation middleware factory
 * @param {string} schemaName - Schema name
 * @returns {Function} Express middleware
 */
export function validate(schemaName) {
  const validateFn = loadSchema(schemaName);

  return (req, res, next) => {
    const valid = validateFn(req.body);

    if (!valid) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: {
            errors: validateFn.errors.map(err => ({
              path: err.instancePath || '/',
              message: err.message,
              keyword: err.keyword
            }))
          }
        }
      });
    }

    next();
  };
}

/**
 * Validate data against schema (non-middleware)
 * @param {string} schemaName
 * @param {object} data
 * @returns {{ valid: boolean, errors?: object[] }}
 */
export function validateData(schemaName, data) {
  const validateFn = loadSchema(schemaName);
  const valid = validateFn(data);

  return {
    valid,
    errors: valid ? undefined : validateFn.errors
  };
}
```

### 6. Add Pagination Schema

Create `schemas/pagination.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://api.example.com/schemas/pagination.json",
  "title": "Pagination",
  "description": "Pagination metadata",
  "type": "object",
  "required": ["total", "limit", "offset"],
  "properties": {
    "total": {
      "type": "integer",
      "minimum": 0,
      "description": "Total number of items"
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "description": "Items per page"
    },
    "offset": {
      "type": "integer",
      "minimum": 0,
      "description": "Number of items skipped"
    },
    "hasMore": {
      "type": "boolean",
      "description": "Whether more items exist"
    }
  }
}
```

### 7. Output Summary

```
Created schema: schemas/{name}.json

Usage in routes:
  import { validate } from '../lib/validate.js';

  app.post('/api/users', validate('create-user-request'), createUser);

Dependencies:
  npm install ajv ajv-formats

Next steps:
1. Edit schema to match your data model
2. Import validate middleware in routes
3. Reference from OpenAPI spec
```

## Common JSON Schema Patterns

### String with constraints

```json
{
  "type": "string",
  "minLength": 1,
  "maxLength": 255,
  "pattern": "^[a-zA-Z0-9_]+$"
}
```

### Email

```json
{
  "type": "string",
  "format": "email"
}
```

### UUID

```json
{
  "type": "string",
  "format": "uuid"
}
```

### Date/DateTime

```json
{
  "type": "string",
  "format": "date"
}
{
  "type": "string",
  "format": "date-time"
}
```

### Enum

```json
{
  "type": "string",
  "enum": ["pending", "active", "completed"]
}
```

### Number with range

```json
{
  "type": "integer",
  "minimum": 0,
  "maximum": 100
}
```

### Array

```json
{
  "type": "array",
  "items": { "$ref": "item.json" },
  "minItems": 1,
  "maxItems": 100
}
```

### Nullable

```json
{
  "type": ["string", "null"]
}
```

## Notes

- Use JSON Schema draft 2020-12
- Prefer `additionalProperties: false` for security
- Use `$ref` for reusable schemas
- Schemas can be used in OpenAPI with `$ref`
- Use ajv-formats for email, uri, date-time, etc.
