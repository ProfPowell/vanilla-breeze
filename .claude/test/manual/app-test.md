# App Test - Backend Application Development

Test the backend development workflow for building a Node.js API application.

**Duration**: ~45 minutes

**Prerequisites**:
- Complete `hello-test.md` and `site-test.md` first
- PostgreSQL available locally or via Docker
- Docker installed (optional, for containerization tests)

---

## Test 1: Backend Project Scaffold

**Goal**: Verify the complete backend project structure is generated correctly.

### Step 1.1: Scaffold the backend

Prompt:
```
/scaffold-backend
```

**Expected structure**:
```
src/
├── api/
│   ├── routes/
│   ├── middleware/
│   └── index.js
├── config/
│   └── index.js
├── services/
├── db/
└── server.js
```

### Step 1.2: Verify package.json scripts

Check that these scripts were added:
```json
{
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "db:migrate": "node src/db/migrate.js",
    "db:seed": "node src/db/seed.js"
  }
}
```

### Step 1.3: Verify dependencies

Check that core dependencies are added:
- `express` or `fastify`
- `pg` (PostgreSQL client)
- `dotenv`

**Pass Criteria**:
- [ ] Directory structure created
- [ ] Scripts added to package.json
- [ ] Dependencies installed

---

## Test 2: Database Setup

**Goal**: Test database scaffolding, migrations, and seeds.

### Step 2.1: Scaffold database structure

Prompt:
```
/scaffold-database
```

**Expected structure**:
```
src/db/
├── client.js           # PostgreSQL connection pool
├── migrate.js          # Migration runner
├── seed.js             # Seed runner
├── migrations/         # Migration files
├── seeds/              # Seed files
├── queries/            # SQL query modules
└── schema.sql          # Schema documentation
```

### Step 2.2: Create a migration

Prompt:
```
/add-migration create_users
```

**Expected**:
- File created: `src/db/migrations/YYYYMMDDHHMMSS_create_users.js`
- Template with `up()` and `down()` functions
- Example SQL for users table

### Step 2.3: Edit the migration

Prompt:
```
Edit the migration to create a users table with: id (uuid), email (unique), name, password_hash, created_at, updated_at
```

**Expected SQL**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Step 2.4: Create a seed file

Prompt:
```
/add-seed users
```

**Expected**:
- File created: `src/db/seeds/001_users.js`
- Template with seed function
- Uses faker.js for realistic data

### Step 2.5: Verify migration commands work

```bash
# Check migration status
npm run db:migrate status

# Run migrations (requires PostgreSQL)
npm run db:migrate
```

**Pass Criteria**:
- [ ] Database structure scaffolded
- [ ] Migration file created with timestamp
- [ ] Seed file uses realistic data
- [ ] Migration scripts execute

---

## Test 3: API Endpoint Generation

**Goal**: Test REST API endpoint scaffolding.

### Step 3.1: Create a POST endpoint

Prompt:
```
/add-endpoint POST /api/users "Create a new user"
```

**Expected**:
- Route file created/updated
- Handler with request body validation
- Proper response structure
- OpenAPI documentation added

### Step 3.2: Create a GET endpoint with parameter

Prompt:
```
/add-endpoint GET /api/users/:id "Get user by ID"
```

**Expected**:
- Route with `:id` parameter
- Parameter validation (UUID format)
- 404 handling for not found
- OpenAPI documentation

### Step 3.3: Create a list endpoint with pagination

Prompt:
```
/add-endpoint GET /api/users "List all users with pagination"
```

**Expected**:
- Query parameters: `limit`, `offset`
- Pagination metadata in response
- Default limit (20)
- Maximum limit enforcement

### Step 3.4: Verify OpenAPI documentation

Prompt:
```
Show me the OpenAPI spec for these endpoints
```

**Expected**:
- Valid OpenAPI 3.0 YAML/JSON
- All endpoints documented
- Request/response schemas defined
- Error responses documented

**Pass Criteria**:
- [ ] POST endpoint created
- [ ] GET with param created
- [ ] Pagination implemented
- [ ] OpenAPI docs generated

---

## Test 4: Authentication Setup

**Goal**: Test authentication scaffolding.

### Step 4.1: Add JWT authentication

Prompt:
```
/add-auth jwt
```

**Expected**:
- Auth middleware created
- JWT utilities (sign, verify)
- Protected route pattern
- Token refresh mechanism
- Password hashing with bcrypt

### Step 4.2: Verify auth endpoints

Check that these endpoints are created:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/me` - Get current user

### Step 4.3: Test protected route pattern

Prompt:
```
Show me how to protect the GET /api/users endpoint with authentication
```

**Expected**:
```javascript
router.get('/users', authenticate, async (req, res) => {
  // req.user is populated by middleware
});
```

### Step 4.4: Verify password hashing

Check that passwords are:
- Hashed with bcrypt (cost factor 10+)
- Never stored in plain text
- Compared using timing-safe comparison

**Pass Criteria**:
- [ ] JWT middleware created
- [ ] Auth endpoints generated
- [ ] Protected route pattern works
- [ ] Password hashing implemented

---

## Test 5: API Validators

**Goal**: Test that API-specific validation hooks catch issues.

### Step 5.1: Create handler missing status code

Prompt:
```
Create src/api/routes/test.js with a handler that does res.json({ data }) without res.status()
```

**Expected warning**:
- "Use `res.status(200).json()` for explicit status codes"

### Step 5.2: Create handler with SQL string interpolation

Prompt:
```
Edit the test route to include:
const result = await db.query(`SELECT * FROM users WHERE id = '${req.params.id}'`);
```

**Expected warning**:
- "SQL injection risk: Use parameterized queries"
- Fix suggestion: `db.query('SELECT * FROM users WHERE id = $1', [req.params.id])`

### Step 5.3: Create handler without error handling

Prompt:
```
Create an async handler without try/catch
```

**Expected warning**:
- "Async handlers must have try/catch or error middleware"

### Step 5.4: Create handler exposing stack trace

Prompt:
```
Add error handling that sends err.stack to the client
```

**Expected warning**:
- "Never expose stack traces in production responses"

### Step 5.5: Fix all issues

Prompt:
```
Fix all the API issues in the test route
```

**Expected**:
- All warnings resolved
- Proper patterns applied

**Pass Criteria**:
- [ ] Missing status code caught
- [ ] SQL injection caught
- [ ] Missing error handling caught
- [ ] Stack trace exposure caught
- [ ] All fixes applied correctly

---

## Test 6: Test Scaffolding

**Goal**: Test the test file generation command.

### Step 6.1: Create a utility script

Prompt:
```
Create scripts/hash-password.js that exports a function to hash passwords
```

### Step 6.2: Scaffold tests for the script

Prompt:
```
/add-test scripts/hash-password.js
```

**Expected**:
- Test file: `test/validators/hash-password.test.js`
- Uses Node.js native test runner
- Includes test structure:
  - Valid cases
  - Invalid cases
  - Edge cases

### Step 6.3: Verify test runs

```bash
node --test test/validators/hash-password.test.js
```

**Expected**:
- Tests execute (may have placeholder assertions)
- No syntax errors
- Proper test structure

### Step 6.4: Add real test assertions

Prompt:
```
Fill in the test file with real assertions for the hash-password function
```

**Expected**:
- Tests for successful hashing
- Tests for different password lengths
- Tests for empty/null input handling

**Pass Criteria**:
- [ ] Test file scaffolded
- [ ] Test runs without errors
- [ ] Real assertions added
- [ ] All tests pass

---

## Test 7: UAT Workflow

**Goal**: Test the user acceptance testing workflow.

### Step 7.1: Create a feature branch

```bash
git checkout -b feature/beads-test-uat-workflow
```

### Step 7.2: Request UAT

Prompt:
```
/uat request test-feature
```

**Expected**:
- `.worklog/uat-test-feature.md` created with:
  - Feature description
  - Testing instructions
  - Expected results
  - Approval instructions
- Issue labeled with `uat:requested` (if using beads)

### Step 7.3: Check UAT status

Prompt:
```
/uat status test-feature
```

**Expected**:
- Shows current status: "PENDING"
- Shows waiting for human review message

### Step 7.4: Approve UAT

Prompt:
```
/uat approve test-feature
```

**Expected**:
- UAT file updated with "APPROVED" status
- Issue label changed to `uat:approved`
- Next steps shown (merge, close issue)

### Step 7.5: Test denial flow

Create another branch and test denial:
```
/uat request another-feature
/uat deny another-feature
```

**Expected**:
- Prompts for feedback
- UAT file updated with "DENIED" status
- Issue labeled with `uat:denied`

**Pass Criteria**:
- [ ] UAT request creates file
- [ ] Status command shows state
- [ ] Approve flow works
- [ ] Deny flow works
- [ ] Labels updated correctly

---

## Test 8: Environment Configuration

**Goal**: Test environment variable handling.

### Step 8.1: Create .env file

Prompt:
```
Create .env.example with all required environment variables for the backend
```

**Expected**:
```bash
# Database
DATABASE_URL=postgres://user:pass@localhost:5432/dbname

# Authentication
JWT_SECRET=your-secret-here
JWT_EXPIRES_IN=1h

# Server
PORT=3000
NODE_ENV=development
```

### Step 8.2: Verify .env patterns

Check that:
- `.env` is in `.gitignore`
- `.env.example` has all variables documented
- Sensitive values have placeholder text
- Comments explain each variable

### Step 8.3: Test missing environment variable

Prompt:
```
Edit src/config/index.js to require DATABASE_URL and throw if missing
```

**Expected**:
- Config throws helpful error if DATABASE_URL is missing
- Error message indicates which variable is required

### Step 8.4: Verify env-config skill

Create a config file and verify the env-config skill guidance appears.

**Pass Criteria**:
- [ ] .env.example created
- [ ] .env in .gitignore
- [ ] Missing var throws error
- [ ] Error messages are helpful

---

## Test 9: OpenAPI Documentation

**Goal**: Verify OpenAPI spec generation and validation.

### Step 9.1: Generate OpenAPI spec

Prompt:
```
/add-openapi
```

**Expected**:
- `openapi.yaml` created in project root
- Includes common schemas (Error, Pagination)
- Auth endpoints documented
- Security schemes defined

### Step 9.2: Verify spec structure

```bash
# Validate OpenAPI spec
npx @redocly/cli lint openapi.yaml
```

### Step 9.3: Preview documentation

```bash
# Preview docs
npx @redocly/cli preview-docs openapi.yaml
```

**Expected**:
- Opens browser with rendered documentation
- All endpoints visible
- Schemas displayed correctly

**Pass Criteria**:
- [ ] OpenAPI spec created
- [ ] Spec validates successfully
- [ ] Documentation renders correctly

---

## Test 10: Containerization (Optional)

**Goal**: Test Docker configuration for deployment.

### Step 10.1: Check for Docker files

If containerization skill was invoked, verify:
- `Dockerfile` exists
- `docker-compose.yml` exists
- `.dockerignore` exists

### Step 10.2: Build Docker image

```bash
docker build -t my-test-app .
```

**Expected**:
- Multi-stage build completes
- Final image is small (Node slim base)
- Non-root user configured

### Step 10.3: Run with Docker Compose

```bash
docker compose up -d
```

**Expected**:
- App container starts
- Database container starts
- Health check passes

### Step 10.4: Verify security

Check Dockerfile for:
- Non-root user (`USER nodejs`)
- No secrets in image
- Production dependencies only

**Pass Criteria**:
- [ ] Dockerfile builds successfully
- [ ] Docker Compose works
- [ ] Security best practices followed

---

## Summary Checklist

| Test | Scaffold | Validation | Patterns |
|------|----------|------------|----------|
| Backend | [ ] | N/A | [ ] |
| Database | [ ] | [ ] | [ ] |
| API Endpoints | [ ] | [ ] | [ ] |
| Authentication | [ ] | [ ] | [ ] |
| API Validators | N/A | [ ] | [ ] |
| Test Scaffolding | [ ] | [ ] | [ ] |
| UAT Workflow | [ ] | N/A | [ ] |
| Environment | [ ] | [ ] | [ ] |
| OpenAPI | [ ] | [ ] | [ ] |
| Containerization | [ ] | [ ] | [ ] |

**Overall Result**: [ ] PASS / [ ] FAIL

---

## Troubleshooting

**Database connection failing?**
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists: `createdb myapp_dev`

**Migrations not running?**
- Check `src/db/client.js` has correct config
- Verify pg package installed: `npm list pg`

**API validators not catching issues?**
- Ensure file is in `src/api/`, `src/routes/`, or `src/server/`
- Check `.claude/settings.json` has API check hook

**UAT workflow not working?**
- Verify beads is installed: `bd --version`
- Check branch name format matches pattern

**Docker build failing?**
- Verify Dockerfile syntax
- Check package.json has all dependencies
- Ensure .dockerignore exists

---

## Completion

Congratulations! You've completed all manual tests for the project template.

**Summary of features tested**:
- Skill injection system (50 skills)
- Slash commands (33 commands)
- Validation hooks (7 types)
- Frontend workflow (HTML, CSS, JS, accessibility)
- Backend workflow (API, database, auth)
- Testing workflow (unit tests, UAT)
- Deployment preparation (env config, containers)

The project template is ready for production use.
