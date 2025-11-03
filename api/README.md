# TLP Platform API

RESTful API backend for The Launch Pad platform, built with Node.js, Express.js, and PostgreSQL.

## Features

- 🚀 **Launch Center**: Complete launch data management with filtering, pagination, and mission details
- 📰 **News Section**: Article management with categories, tags, comments, and trending topics
- 🌌 **Spacebase (TLPedia)**: Comprehensive database of astronauts, agencies, rockets, engines, spacecraft, and facilities
- 👥 **User Management**: JWT-based authentication with role-based access control (RBAC)
- 📊 **Statistics**: Launch statistics and featured content management
- 🔒 **Security**: Password hashing, JWT tokens, refresh tokens, and permission-based authorization

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- PostgreSQL 12+ (or Docker)
- Environment variables configured

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

3. **Run database migrations:**
```bash
npm run migrate
```

4. **Start the server:**
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

The API will be available at `http://localhost:3007`

## Project Structure

```
api/
├── index.js                 # Main server entry point
├── package.json             # Dependencies and scripts
├── .env.example            # Environment variables template
├── middleware/              # Express middleware
│   ├── auth.js             # JWT authentication
│   ├── authorize.js        # RBAC authorization
│   └── errorHandler.js     # Error handling
├── routes/                  # API route handlers
│   ├── launches.js         # Launch endpoints
│   ├── auth.js            # Authentication endpoints
│   ├── news.js            # News endpoints
│   ├── spacebase.js       # Spacebase/TLPedia endpoints
│   └── statistics.js      # Statistics & featured content
├── sql/                     # Database migrations
│   ├── 001_init_launchpad.sql
│   ├── 002_launch_extensions.sql
│   ├── 003_spacebase.sql
│   ├── 004_news_section.sql
│   ├── 005_user_management.sql
│   ├── 006_supporting_features.sql
│   └── 007_indexes.sql
├── scripts/                 # Utility scripts
│   ├── run_migrations.js  # Migration runner
│   └── seed_launch_data.js # Seed data script
└── utils/                   # Utility functions
    ├── db.js               # Database utilities
    └── validation.js       # Validation helpers
```

## API Documentation

See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for complete endpoint documentation.

### Key Endpoints

**Authentication:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT tokens
- `POST /api/auth/refresh` - Refresh access token

**Launches:**
- `GET /api/launches` - Get all launches (with filtering)
- `GET /api/launches/:id` - Get launch details
- `GET /api/launches/upcoming` - Get upcoming launches
- `GET /api/launches/previous` - Get previous launches

**News:**
- `GET /api/news` - Get published articles
- `GET /api/news/:id` - Get article by ID or slug
- `GET /api/news/featured` - Get featured articles
- `GET /api/news/trending` - Get trending articles

**Spacebase:**
- `GET /api/spacebase/astronauts` - Get all astronauts
- `GET /api/spacebase/rockets` - Get all rockets
- `GET /api/spacebase/agencies` - Get all agencies

**Statistics:**
- `GET /api/statistics/launches` - Launch statistics
- `GET /api/featured` - Featured content

## Database Migrations

### Running Migrations

```bash
# Run all pending migrations
npm run migrate

# Dry run (see SQL without executing)
npm run migrate:dry-run

# Run migrations up to a specific version
node scripts/run_migrations.js --to=3
```

### Migration Files

Migrations are executed in order:
1. `001_init_launchpad.sql` - Initial launch tables
2. `002_launch_extensions.sql` - Launch extensions
3. `003_spacebase.sql` - Spacebase/TLPedia tables
4. `004_news_section.sql` - News section tables
5. `005_user_management.sql` - User management & RBAC
6. `006_supporting_features.sql` - Supporting features
7. `007_indexes.sql` - Performance indexes

The migration system tracks executed migrations in the `schema_migrations` table.

## Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register or Login** to get access and refresh tokens
2. **Include access token** in requests: `Authorization: Bearer <token>`
3. **Refresh token** when access token expires (default: 15 minutes)
4. **Refresh tokens** expire after 7 days

### Roles and Permissions

- **Admin**: Full access to all endpoints
- **Writer**: Can create/edit articles (own drafts only)
- **Moderator**: Can approve comments
- **User**: Read-only access to public content

## Environment Variables

See `.env.example` for all available environment variables.

**Required:**
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`
- `JWT_SECRET` (minimum 32 characters)

**Optional:**
- `PORT` (default: 3007)
- `NODE_ENV` (development/production)
- `JWT_EXPIRES_IN` (default: 15m)
- `REFRESH_TOKEN_EXPIRES_IN` (default: 7d)

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Invalid input data
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `DUPLICATE` - Resource already exists
- `INTERNAL_ERROR` - Server error

## Development

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server (requires nodemon)
- `npm run migrate` - Run database migrations
- `npm run migrate:dry-run` - Preview migrations without executing

### Code Style

- Use async/await for async operations
- Use `asyncHandler` wrapper for route handlers
- Validate all input data
- Handle errors appropriately
- Follow existing code patterns

## Testing

```bash
# Health check
curl http://localhost:3007/health

# Database health
curl http://localhost:3007/db-health

# Get launches
curl http://localhost:3007/api/launches
```

## Security Best Practices

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Use strong JWT secrets** - Minimum 32 characters, randomly generated
3. **Hash passwords** - Always use bcrypt (already implemented)
4. **Validate input** - Validate all user input on the server
5. **Rate limiting** - Consider adding rate limiting for production
6. **HTTPS** - Always use HTTPS in production
7. **CORS** - Configure CORS appropriately for your frontend domain

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running
- Check `.env` file has correct credentials
- Test connection: `psql -h localhost -U postgres -d tlp_db`

### Migration Issues

- Check migration status: `SELECT * FROM schema_migrations;`
- Run dry-run first: `npm run migrate:dry-run`

### JWT Token Issues

- Verify `JWT_SECRET` is set in `.env`
- Check token expiration times
- Ensure tokens are sent in `Authorization: Bearer <token>` header

## Contributing

1. Follow existing code patterns
2. Add validation for all inputs
3. Update API documentation
4. Test your changes thoroughly

## License

See LICENSE file for details.

## Support

For issues and questions, please refer to the project documentation or create an issue in the repository.
