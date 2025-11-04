# Admin Dashboard Setup Guide

## Quick Start

1. **Install dependencies** (if not already done):
   ```bash
   cd api/admin
   npm install
   ```

2. **Configure environment**:
   - Copy `.env.example` to `.env` (if it doesn't exist)
   - Ensure `REACT_APP_API_URL` points to your API server (default: `http://localhost:3007`)

3. **Start the admin dashboard**:
   ```bash
   npm start
   ```

4. **Access the dashboard**:
   - Open `http://localhost:3000` in your browser
   - Login with admin credentials

## Prerequisites

- Backend API must be running on the configured port (default: 3007)
- Admin user account must exist in the database
- Node.js 18+ and npm installed

## Creating an Admin User

If you don't have an admin user yet, create one using the API script:

```bash
cd ../api
node scripts/create_admin_user.js
```

Or use the registration endpoint and then assign admin role via the API.

## Features

- ✅ JWT Authentication with automatic token refresh
- ✅ Full CRUD for all resources
- ✅ Reference field support (dropdowns for foreign keys)
- ✅ Pagination and sorting
- ✅ Filtering and search
- ✅ Role-based access (admin only)

## Resources Available

### Main Resources
- Launches
- Articles (News)
- Authors
- Categories & Tags
- Users
- Events
- Crew Members
- Roles & Permissions

### Spacebase Resources
- Astronauts (read-only)
- Agencies (full CRUD)
- Rockets (read-only)

### Reference Data
- Providers
- Orbits
- Launch Sites

## Troubleshooting

### Cannot connect to API
- Verify API is running: `curl http://localhost:3007/health`
- Check `REACT_APP_API_URL` in `.env` file
- Ensure CORS is enabled on the API

### Login fails
- Verify admin user exists in database
- Check API authentication endpoints are working
- Check browser console for errors

### TypeScript errors
- Run `npm install` to ensure all dependencies are installed
- Check that `@types/react` and `@types/react-dom` are in devDependencies

## Development

### Build for production:
```bash
npm run build
```

### Run tests:
```bash
npm test
```

## API Endpoint Mapping

The admin dashboard automatically maps resources to API endpoints:
- `launches` → `/api/launches`
- `articles` → `/api/news`
- `authors` → `/api/authors`
- `categories` → `/api/news/categories`
- `tags` → `/api/news/tags`
- `users` → `/api/users`
- `roles` → `/api/roles`
- `permissions` → `/api/permissions`
- And more...

See `src/dataProvider.ts` for complete mapping.
