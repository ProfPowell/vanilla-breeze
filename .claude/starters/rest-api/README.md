# REST API Starter

A Node.js REST API with Express, PostgreSQL, and JWT authentication.

## Features

- Express.js web framework
- PostgreSQL with connection pooling
- JWT authentication
- Rate limiting
- Request validation
- Structured logging
- OpenAPI documentation
- Migration system
- Test infrastructure

## Structure

```
project/
├── package.json
├── .env.example
├── openapi.yaml
├── src/
│   ├── index.js            # Server entry
│   ├── config/
│   │   └── index.js        # Environment config
│   ├── api/
│   │   ├── routes.js       # Route definitions
│   │   ├── handlers/       # Request handlers
│   │   └── middleware/     # Middleware
│   ├── services/           # Business logic
│   ├── db/
│   │   ├── client.js       # PostgreSQL client
│   │   ├── migrations/
│   │   └── queries/
│   └── lib/
│       ├── logger.js
│       └── errors.js
└── test/
    └── api/
```

## Usage

### Create with command

```bash
/scaffold-api my-service
```

### Development

```bash
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

### Database

```bash
npm run db:migrate     # Run migrations
npm run db:rollback    # Rollback last migration
npm run db:seed        # Seed data
```

### Testing

```bash
npm test               # Run all tests
npm run test:api       # API tests only
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| GET | /ready | Readiness check |
| POST | /auth/login | Login |
| POST | /auth/register | Register |
| GET | /api/v1/users | List users |
| GET | /api/v1/users/:id | Get user |

## Skills Invoked

- `nodejs-backend` - Express patterns
- `rest-api` - RESTful design
- `database` - PostgreSQL patterns
- `authentication` - JWT auth
