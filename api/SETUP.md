# TLP API Setup Guide

## Prerequisites

- Node.js 16+ and npm
- PostgreSQL 12+ (or Docker with PostgreSQL)
- Environment variables configured in `.env` file

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (create `.env` file):
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_DATABASE=tlp_db

JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

PORT=3007
NODE_ENV=development
```

3. Run database migrations:
```bash
npm run migrate
```

   Or to see what will be executed without making changes:
```bash
npm run migrate:dry-run
```

## Running the Server

### Development
```bash
npm run dev
```
(Requires `nodemon` installed globally or via devDependencies)

### Production
```bash
npm start
```

## Database Migrations

The migration system tracks which migrations have been executed to prevent duplicates.

### Running Migrations

```bash
# Run all pending migrations
npm run migrate

# Run migrations up to a specific version
node scripts/run_migrations.js --to=3

# Dry run (see SQL without executing)
npm run migrate:dry-run
```

### Migration Files

Migrations are in `api/sql/` directory:
- `001_init_launchpad.sql` - Initial launch tables
- `002_launch_extensions.sql` - Launch extensions (pads, payloads, recovery, etc.)
- `003_spacebase.sql` - Spacebase/TLPedia tables
- `004_news_section.sql` - News section tables
- `005_user_management.sql` - User management & RBAC
- `006_supporting_features.sql` - Supporting features
- `007_indexes.sql` - Performance indexes

## API Structure

### Routes

Routes are organized in `routes/` directory:
- `routes/launches.js` - Launch-related endpoints
- `routes/auth.js` - Authentication endpoints

### Middleware

Middleware is in `middleware/` directory:
- `middleware/auth.js` - JWT authentication
- `middleware/authorize.js` - RBAC authorization
- `middleware/errorHandler.js` - Error handling

## API Endpoints

See `API_ENDPOINTS.md` for complete documentation.

### Quick Examples

#### Get all launches
```bash
curl http://localhost:3007/api/launches
```

#### Register a user
```bash
curl -X POST http://localhost:3007/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

#### Login
```bash
curl -X POST http://localhost:3007/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

#### Get launch by ID (authenticated)
```bash
curl http://localhost:3007/api/launches/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Project Structure

```
api/
├── index.js                 # Main server file
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables (not in git)
├── middleware/              # Express middleware
│   ├── auth.js             # JWT authentication
│   ├── authorize.js        # RBAC authorization
│   └── errorHandler.js     # Error handling
├── routes/                  # API route handlers
│   ├── launches.js         # Launch endpoints
│   └── auth.js             # Authentication endpoints
├── sql/                     # Database migrations
│   ├── 001_init_launchpad.sql
│   ├── 002_launch_extensions.sql
│   ├── 003_spacebase.sql
│   ├── 004_news_section.sql
│   ├── 005_user_management.sql
│   ├── 006_supporting_features.sql
│   └── 007_indexes.sql
├── scripts/                 # Utility scripts
│   ├── run_migrations.js   # Migration runner
│   └── seed_launch_data.js # Seed data script
└── utils/                   # Utility functions (future)
```

## Next Steps

1. **Install dependencies**: Run `npm install`
2. **Set up database**: Run `npm run migrate`
3. **Seed initial data** (optional): Run `node scripts/seed_launch_data.js`
4. **Start server**: Run `npm start` or `npm run dev`
5. **Test endpoints**: Use curl, Postman, or your frontend

## Development Tips

- Check `/health` and `/db-health` endpoints to verify setup
- Use `npm run migrate:dry-run` before running actual migrations
- Check `API_ENDPOINTS.md` for complete endpoint documentation
- All authenticated endpoints require `Authorization: Bearer <token>` header

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check `.env` file has correct credentials
- Test connection: `psql -h localhost -U postgres -d tlp_db`

### Migration Issues
- Check migration table: `SELECT * FROM schema_migrations;`
- Rollback not supported yet - manual database reset may be needed

### JWT Token Issues
- Verify `JWT_SECRET` is set in `.env`
- Check token expiration (default 15 minutes for access, 7 days for refresh)

