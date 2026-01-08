# Add Endpoint Command

Scaffold a new REST API endpoint with route handler, OpenAPI documentation, and JSON Schema validation.

## Usage

```
/add-endpoint [method] [path] [description]
```

## Arguments

- `$ARGUMENTS` - Method, path, and description
  - Examples: `GET /users List all users`
  - Examples: `POST /users Create a new user`
  - Examples: `PUT /users/:id Update user by ID`

## Examples

```
/add-endpoint GET /products List all products
/add-endpoint POST /orders Create a new order
/add-endpoint DELETE /users/:id Delete user by ID
```

## Steps to Execute

### 1. Parse Arguments

Extract:
- HTTP method (GET, POST, PUT, PATCH, DELETE)
- Path (e.g., `/users`, `/users/:id`)
- Description (remaining text)

### 2. Generate Route Handler

Create route handler in `src/api/` or `src/routes/`:

```javascript
/**
 * [Description]
 * [METHOD] [path]
 */
export async function [operationId](req, res) {
  try {
    // TODO: Implement endpoint logic

    res.status(200).json({
      // Response data
    });
  } catch (error) {
    console.error('[operationId] error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred'
      }
    });
  }
}
```

### 3. Generate OpenAPI Entry

Add path to `openapi.yaml`:

```yaml
/[path]:
  [method]:
    summary: [Description]
    operationId: [operationId]
    tags:
      - [Resource]
    parameters:
      # Add path/query parameters
    requestBody:  # For POST/PUT/PATCH
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/[RequestSchema]'
    responses:
      '200':
        description: Success
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/[ResponseSchema]'
      '400':
        $ref: '#/components/responses/BadRequest'
      '404':
        $ref: '#/components/responses/NotFound'
```

### 4. Generate JSON Schema

For POST/PUT/PATCH, create request schema in `schemas/`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://api.example.com/schemas/[resource]-request.json",
  "title": "[Resource] Request",
  "type": "object",
  "required": [],
  "properties": {
    // Define properties
  },
  "additionalProperties": false
}
```

### 5. Register Route

Add to router:

```javascript
import { [operationId] } from './handlers/[resource].js';

router.[method]('[path]', validate('[schema]'), [operationId]);
```

## Generated Files

For `/add-endpoint POST /products Create product`:

1. `src/api/handlers/products.js` - Route handler
2. `schemas/create-product-request.json` - Request schema
3. Update `openapi.yaml` - OpenAPI entry
4. Update `src/api/routes.js` - Route registration

## Templates by Method

**GET (list):**
- No request body
- Response: `{ data: [], pagination: {} }`
- Parameters: limit, offset, filters

**GET (single):**
- Path parameter: `id`
- Response: Single resource
- 404 response

**POST:**
- Request body required
- Response: 201 Created
- Validation middleware

**PUT/PATCH:**
- Path parameter: `id`
- Request body required
- 404 response

**DELETE:**
- Path parameter: `id`
- Response: 204 No Content
- 404 response

## Notes

- Use consistent naming: `listUsers`, `getUser`, `createUser`, `updateUser`, `deleteUser`
- Always include error responses in OpenAPI
- Add validation for all request bodies
- Use path parameters with format validation
- Include rate limiting for sensitive endpoints
