# Add OpenAPI Command

Generate or initialize an OpenAPI 3.0 specification file with common schemas and responses.

## Usage

```
/add-openapi
```

## Arguments

None required. Generates `openapi.yaml` in the project root or backend directory.

## Examples

```
/add-openapi
```

## Generated File

Creates `openapi.yaml`:

```yaml
openapi: 3.0.3
info:
  title: API
  description: REST API documentation
  version: 1.0.0
  contact:
    email: api@example.com

servers:
  - url: http://localhost:3000
    description: Development server
  - url: https://api.example.com
    description: Production server

tags:
  - name: Auth
    description: Authentication endpoints
  - name: Users
    description: User management
  - name: Health
    description: Health check endpoints

paths:
  /health:
    get:
      summary: Health check
      operationId: healthCheck
      tags:
        - Health
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: ok
                  timestamp:
                    type: string
                    format: date-time

  /api/auth/register:
    post:
      summary: Register new user
      operationId: register
      tags:
        - Auth
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RegisterRequest'
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '409':
          $ref: '#/components/responses/Conflict'

  /api/auth/login:
    post:
      summary: Login user
      operationId: login
      tags:
        - Auth
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /api/auth/me:
    get:
      summary: Get current user
      operationId: getCurrentUser
      tags:
        - Auth
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Current user data
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    $ref: '#/components/schemas/User'
        '401':
          $ref: '#/components/responses/Unauthorized'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT access token

  schemas:
    # === Request Schemas ===

    RegisterRequest:
      type: object
      required:
        - email
        - name
        - password
      properties:
        email:
          type: string
          format: email
          example: user@example.com
        name:
          type: string
          minLength: 1
          maxLength: 255
          example: John Doe
        password:
          type: string
          minLength: 8
          maxLength: 128
          example: SecurePass123

    LoginRequest:
      type: object
      required:
        - email
        - password
      properties:
        email:
          type: string
          format: email
          example: user@example.com
        password:
          type: string
          example: SecurePass123

    # === Response Schemas ===

    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
          example: 123e4567-e89b-12d3-a456-426614174000
        email:
          type: string
          format: email
          example: user@example.com
        name:
          type: string
          example: John Doe
        role:
          type: string
          enum: [user, admin, moderator]
          example: user
        emailVerified:
          type: boolean
          example: false
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    AuthResponse:
      type: object
      properties:
        user:
          $ref: '#/components/schemas/User'
        accessToken:
          type: string
          example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
        refreshToken:
          type: string
          example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

    # === Common Schemas ===

    Error:
      type: object
      required:
        - error
      properties:
        error:
          type: object
          required:
            - code
            - message
          properties:
            code:
              type: string
              example: VALIDATION_ERROR
            message:
              type: string
              example: Validation failed
            details:
              type: object
              additionalProperties: true

    Pagination:
      type: object
      properties:
        total:
          type: integer
          example: 100
        limit:
          type: integer
          example: 20
        offset:
          type: integer
          example: 0
        hasMore:
          type: boolean
          example: true

  responses:
    BadRequest:
      description: Bad request - Invalid input
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error:
              code: BAD_REQUEST
              message: Invalid input data

    Unauthorized:
      description: Unauthorized - Missing or invalid token
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error:
              code: UNAUTHORIZED
              message: Invalid or expired token

    Forbidden:
      description: Forbidden - Insufficient permissions
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error:
              code: FORBIDDEN
              message: Insufficient permissions

    NotFound:
      description: Not found - Resource doesn't exist
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error:
              code: NOT_FOUND
              message: Resource not found

    Conflict:
      description: Conflict - Resource already exists
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error:
              code: CONFLICT
              message: Resource already exists

    ValidationError:
      description: Validation error - Request body validation failed
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error:
              code: VALIDATION_ERROR
              message: Validation failed
              details:
                errors:
                  - path: /email
                    message: must be a valid email

    RateLimitExceeded:
      description: Too many requests
      headers:
        X-RateLimit-Limit:
          schema:
            type: integer
          description: Request limit per window
        X-RateLimit-Remaining:
          schema:
            type: integer
          description: Remaining requests in window
        X-RateLimit-Reset:
          schema:
            type: integer
          description: Unix timestamp when window resets
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error:
              code: RATE_LIMIT_EXCEEDED
              message: Too many requests

  parameters:
    limitParam:
      name: limit
      in: query
      description: Maximum number of items to return
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 20

    offsetParam:
      name: offset
      in: query
      description: Number of items to skip
      schema:
        type: integer
        minimum: 0
        default: 0

    idParam:
      name: id
      in: path
      description: Resource ID
      required: true
      schema:
        type: string
        format: uuid
```

## Steps to Execute

### 1. Check for Existing OpenAPI File

Look for `openapi.yaml` or `openapi.json`. If exists, offer to enhance rather than overwrite.

### 2. Detect Project Type

- If `src/api/` exists: Backend project, generate full spec
- If `backend/` exists: Place in backend directory
- Otherwise: Generate in project root

### 3. Generate Base OpenAPI File

Write the template above to `openapi.yaml`.

### 4. Scan for Existing Endpoints (Optional Enhancement)

If route files exist, scan and suggest additions:

```javascript
// Look for patterns like:
// app.get('/api/users', ...)
// router.post('/products', ...)
```

### 5. Add npm Script

Add to `package.json`:

```json
{
  "scripts": {
    "docs:api": "npx @redocly/cli preview-docs openapi.yaml",
    "docs:validate": "npx @redocly/cli lint openapi.yaml"
  }
}
```

### 6. Output Summary

```
OpenAPI specification created: openapi.yaml

Included:
  - Auth endpoints (register, login, me)
  - Health check endpoint
  - Common schemas (User, Error, Pagination)
  - Standard error responses (400, 401, 403, 404, 409, 422, 429)
  - JWT bearer authentication
  - Reusable parameters (limit, offset, id)

To preview documentation:
  npx @redocly/cli preview-docs openapi.yaml

To validate:
  npx @redocly/cli lint openapi.yaml

Next steps:
1. Add your endpoints to the paths section
2. Create schemas for your resources
3. Use /add-endpoint to scaffold new endpoints
```

## Adding Endpoints

After creating the base file, add endpoints using this pattern:

```yaml
paths:
  /api/products:
    get:
      summary: List products
      operationId: listProducts
      tags:
        - Products
      parameters:
        - $ref: '#/components/parameters/limitParam'
        - $ref: '#/components/parameters/offsetParam'
      responses:
        '200':
          description: List of products
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Product'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

    post:
      summary: Create product
      operationId: createProduct
      tags:
        - Products
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateProductRequest'
      responses:
        '201':
          description: Product created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Product'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
```

## Notes

- Uses OpenAPI 3.0.3 (widely supported)
- Includes versioning header support
- JWT bearer auth configured
- Common responses reduce duplication
- Preview with Redoc or Swagger UI
