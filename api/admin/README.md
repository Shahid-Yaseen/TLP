# TLP Platform Admin Dashboard

Complete React Admin dashboard for managing the TLP Platform backend.

## Features

- JWT Authentication with refresh tokens
- Full CRUD for all resources:
  - Launches
  - News Articles
  - Authors
  - Categories & Tags
  - Astronauts (Read-only)
  - Agencies
  - Rockets (Read-only)
  - Users
  - Events
  - Roles & Permissions
  - Crew Members
  - Providers, Orbits, Launch Sites (Reference Data)
- Role-based access control integration
- Custom data provider for TLP API
- Responsive UI

## Setup

### Prerequisites

- Node.js 18+
- Backend API running on port 3007 (or configure `REACT_APP_API_URL`)

### Installation

```bash
cd api/admin
npm install
```

### Configuration

Create a `.env` file in the `api/admin` directory:

```env
REACT_APP_API_URL=http://localhost:3007
```

### Running the Admin Dashboard

```bash
npm start
```

The admin dashboard will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The production build will be in the `build/` directory.

## API Endpoint Mapping

The data provider maps React Admin resources to API endpoints:

- `launches` → `/api/launches`
- `articles` → `/api/news`
- `authors` → `/api/authors`
- `categories` → `/api/news/categories`
- `tags` → `/api/news/tags`
- `astronauts` → `/api/spacebase/astronauts`
- `agencies` → `/api/spacebase/agencies`
- `rockets` → `/api/spacebase/rockets`
- `users` → `/api/users`
- `events` → `/api/events`
- `crew` → `/api/crew`
- `roles` → `/api/roles`
- `permissions` → `/api/permissions`
- `providers` → `/api/providers`
- `orbits` → `/api/orbits`
- `launch_sites` → `/api/launch-sites`

## Authentication

The admin dashboard uses JWT authentication:

1. Login with admin credentials
2. Access token is stored in localStorage
3. Token is automatically refreshed when expired
4. Logout clears all tokens

## Resources

### Main Resources (Full CRUD)
- **Launches**: Manage launch data with provider, rocket, site, orbit references
- **Articles**: Manage news articles with author, category, tags
- **Authors**: Manage article authors
- **Categories**: News article categories
- **Tags**: Article tags
- **Users**: User management with roles
- **Events**: Event management
- **Crew**: Crew member management
- **Roles**: Role management with permissions
- **Permissions**: Permission management

### Spacebase Resources
- **Astronauts**: View-only (GET endpoints only)
- **Agencies**: Full CRUD
- **Rockets**: View-only (GET endpoints only)

### Reference Data
- **Providers**: Launch providers
- **Orbits**: Orbit types
- **Launch Sites**: Launch locations

## Notes

- Some resources (Astronauts, Rockets) are read-only as they don't have POST/PATCH/DELETE endpoints
- Reference fields use SelectInput for foreign keys
- Date/Time fields use DateTimeInput
- Boolean fields use BooleanInput
- Rich text content uses TextInput (can be enhanced with RichTextInput later)
