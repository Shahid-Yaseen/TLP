# TLP Platform API Endpoints Documentation

This document outlines all required REST API endpoints for the TLP platform, organized by module. These endpoints will be implemented in `api/index.js` or modular route files.

## Authentication & Authorization

All endpoints (except public routes) require JWT authentication via Bearer token in the Authorization header.

### Base URL
```
http://localhost:3007 (development)
```

---

## 1. Launch Center Module

### 1.1 Launches

#### GET /api/launches
Get all launches with optional filtering
- **Query Parameters:**
  - `provider` - Filter by provider name
  - `rocket` - Filter by rocket name
  - `site` - Filter by launch site
  - `orbit` - Filter by orbit code
  - `after` - Filter launches after date (ISO 8601)
  - `before` - Filter launches before date (ISO 8601)
  - `status` - Filter by outcome (success, failure, partial, TBD)
  - `featured` - Filter featured launches (true/false)
  - `limit` - Limit results (default: 100)
  - `offset` - Pagination offset
- **Response:** Array of launch objects with joined provider, rocket, site, orbit data

#### GET /api/launches/:id
Get a single launch by ID
- **Response:** Launch object with all related data (payloads, recovery, windows, hazards, crew)

#### GET /api/launches/upcoming
Get upcoming launches (launch_date >= now)
- **Query Parameters:** Same as GET /api/launches
- **Response:** Array of upcoming launches

#### GET /api/launches/previous
Get previous launches (launch_date < now)
- **Query Parameters:** Same as GET /api/launches
- **Response:** Array of previous launches

#### GET /api/launches/featured
Get featured launches
- **Response:** Array of featured launch objects

#### POST /api/launches (Admin/Writer)
Create a new launch
- **Body:** Launch object with all required fields
- **Auth Required:** Admin or Writer role

#### PATCH /api/launches/:id (Admin/Writer)
Update a launch
- **Body:** Partial launch object
- **Auth Required:** Admin or Writer role

#### DELETE /api/launches/:id (Admin)
Delete a launch
- **Auth Required:** Admin role

### 1.2 Launch Pads

#### GET /api/launch-pads
Get all launch pads
- **Query Parameters:**
  - `site_id` - Filter by launch site ID
  - `active` - Filter by active status (true/false)
- **Response:** Array of launch pad objects

#### GET /api/launch-pads/:id
Get a single launch pad by ID
- **Response:** Launch pad object

#### POST /api/launch-pads (Admin)
Create a new launch pad
- **Auth Required:** Admin role

#### PATCH /api/launch-pads/:id (Admin)
Update a launch pad
- **Auth Required:** Admin role

### 1.3 Payloads

#### GET /api/payloads
Get all payloads
- **Query Parameters:**
  - `customer` - Filter by customer name
  - `payload_type` - Filter by payload type
  - `destination_orbit` - Filter by destination orbit
- **Response:** Array of payload objects

#### GET /api/payloads/:id
Get a single payload by ID
- **Response:** Payload object

#### GET /api/launches/:id/payloads
Get payloads for a specific launch
- **Response:** Array of payload objects

#### POST /api/payloads (Admin/Writer)
Create a new payload
- **Auth Required:** Admin or Writer role

#### POST /api/launches/:id/payloads (Admin/Writer)
Associate payloads with a launch
- **Body:** `{ payload_ids: [1, 2, 3] }`
- **Auth Required:** Admin or Writer role

### 1.4 Recovery Information

#### GET /api/launches/:id/recovery
Get recovery information for a launch
- **Response:** Recovery object or null

#### POST /api/launches/:id/recovery (Admin/Writer)
Create or update recovery information
- **Auth Required:** Admin or Writer role

### 1.5 Launch Windows

#### GET /api/launches/:id/window
Get launch window information
- **Response:** Launch window object or null

#### POST /api/launches/:id/window (Admin/Writer)
Create or update launch window
- **Auth Required:** Admin or Writer role

### 1.6 Launch Hazards

#### GET /api/launches/:id/hazards
Get hazards for a launch
- **Response:** Array of hazard objects

#### POST /api/launches/:id/hazards (Admin/Writer)
Add hazard to a launch
- **Auth Required:** Admin or Writer role

#### DELETE /api/hazards/:id (Admin/Writer)
Delete a hazard
- **Auth Required:** Admin or Writer role

### 1.7 Launch Statistics

#### GET /api/statistics/launches
Get launch statistics
- **Query Parameters:**
  - `year` - Filter by year
  - `provider_id` - Filter by provider
  - `group_by` - Group by (year, month, provider)
- **Response:** Statistics object with totals and breakdowns

---

## 2. Mission Briefing Module

### 2.1 Mission Details

#### GET /api/launches/:id/mission
Get complete mission briefing data
- **Response:** Complete mission object including:
  - Launch details
  - Payloads
  - Crew members
  - Rocket details
  - Engines
  - Provider info
  - Pad details
  - Hazards
  - Recovery info
  - Related launches
  - Media links

---

## 3. Spacebase (TLPedia) Module

### 3.1 Agencies

#### GET /api/agencies
Get all agencies
- **Query Parameters:**
  - `country` - Filter by country
  - `search` - Search by name or abbreviation
- **Response:** Array of agency objects

#### GET /api/agencies/:id
Get a single agency by ID
- **Response:** Agency object with all details

#### POST /api/agencies (Admin)
Create a new agency
- **Auth Required:** Admin role

#### PATCH /api/agencies/:id (Admin)
Update an agency
- **Auth Required:** Admin role

### 3.2 Astronauts

#### GET /api/astronauts
Get all astronauts
- **Query Parameters:**
  - `status` - Filter by status (active, retired, deceased)
  - `nationality` - Filter by nationality
  - `agency_id` - Filter by agency
  - `search` - Search by name
  - `limit`, `offset` - Pagination
- **Response:** Array of astronaut objects

#### GET /api/astronauts/:id
Get a single astronaut by ID
- **Response:** Astronaut object with missions, achievements

#### GET /api/astronauts/stats
Get astronaut statistics
- **Response:** Total count and breakdowns

#### GET /api/astronauts/featured
Get featured astronaut (Astro of the Day)
- **Response:** Single astronaut object

#### POST /api/astronauts (Admin)
Create a new astronaut
- **Auth Required:** Admin role

#### PATCH /api/astronauts/:id (Admin)
Update an astronaut
- **Auth Required:** Admin role

#### GET /api/astronauts/:id/missions
Get missions for an astronaut
- **Response:** Array of launch objects

### 3.3 Rockets

#### GET /api/rockets
Get all rockets
- **Query Parameters:**
  - `provider_id` - Filter by provider
  - `search` - Search by name
- **Response:** Array of rocket objects

#### GET /api/rockets/:id
Get a single rocket by ID
- **Response:** Rocket object with engines, specifications

#### GET /api/rockets/:id/engines
Get engines for a rocket
- **Response:** Array of engine objects with stage information

#### POST /api/rockets (Admin)
Create a new rocket
- **Auth Required:** Admin role

#### PATCH /api/rockets/:id (Admin)
Update a rocket
- **Auth Required:** Admin role

### 3.4 Engines

#### GET /api/engines
Get all engines
- **Query Parameters:**
  - `manufacturer_id` - Filter by manufacturer agency
  - `engine_type` - Filter by type (liquid, solid, hybrid)
  - `search` - Search by name
- **Response:** Array of engine objects

#### GET /api/engines/:id
Get a single engine by ID
- **Response:** Engine object with specifications

#### POST /api/engines (Admin)
Create a new engine
- **Auth Required:** Admin role

#### PATCH /api/engines/:id (Admin)
Update an engine
- **Auth Required:** Admin role

### 3.5 Spacecraft

#### GET /api/spacecraft
Get all spacecraft
- **Query Parameters:**
  - `manufacturer_id` - Filter by manufacturer
  - `spacecraft_type` - Filter by type
  - `status` - Filter by status
  - `search` - Search by name
- **Response:** Array of spacecraft objects

#### GET /api/spacecraft/:id
Get a single spacecraft by ID
- **Response:** Spacecraft object

#### POST /api/spacecraft (Admin)
Create a new spacecraft
- **Auth Required:** Admin role

#### PATCH /api/spacecraft/:id (Admin)
Update a spacecraft
- **Auth Required:** Admin role

### 3.6 Facilities

#### GET /api/facilities
Get all facilities
- **Query Parameters:**
  - `agency_id` - Filter by agency
  - `facility_type` - Filter by type
  - `search` - Search by name or location
- **Response:** Array of facility objects

#### GET /api/facilities/:id
Get a single facility by ID
- **Response:** Facility object

#### POST /api/facilities (Admin)
Create a new facility
- **Auth Required:** Admin role

### 3.7 Search (Elasticsearch Integration)

#### GET /api/search
Universal search across Spacebase entities
- **Query Parameters:**
  - `q` - Search query string (required)
  - `type` - Filter by entity type (astronaut, rocket, engine, spacecraft, facility, agency)
  - `filters` - Additional filters (JSON)
  - `limit`, `offset` - Pagination
- **Response:** Search results with highlights

---

## 4. News Section Module

### 4.1 News Articles

#### GET /api/news
Get all published news articles
- **Query Parameters:**
  - `category` - Filter by category slug or ID
  - `tag` - Filter by tag slug or ID
  - `author_id` - Filter by author
  - `featured` - Filter featured articles (true/false)
  - `trending` - Filter trending articles (true/false)
  - `date_from` - Filter by date range
  - `date_to` - Filter by date range
  - `search` - Search in title/content
  - `limit`, `offset` - Pagination
- **Response:** Array of article objects (excerpts only)

#### GET /api/news/:id
Get a single article by ID or slug
- **Response:** Full article object with author, category, tags, related content

#### GET /api/news/featured
Get featured articles
- **Response:** Array of featured article objects

#### GET /api/news/trending
Get trending articles
- **Response:** Array of trending article objects

#### GET /api/news/latest
Get latest articles
- **Query Parameters:**
  - `limit` - Number of articles (default: 10)
- **Response:** Array of latest article objects

#### POST /api/news (Writer/Admin)
Create a new article
- **Body:** Article object
- **Auth Required:** Writer or Admin role

#### PATCH /api/news/:id (Writer/Admin)
Update an article
- **Auth Required:** Writer or Admin role (writers can only update their own drafts)

#### DELETE /api/news/:id (Admin)
Delete an article
- **Auth Required:** Admin role

#### POST /api/news/:id/publish (Admin)
Publish a draft article
- **Auth Required:** Admin role

### 4.2 News Categories

#### GET /api/news/categories
Get all news categories
- **Response:** Array of category objects

#### GET /api/news/categories/:id
Get a single category by ID or slug
- **Response:** Category object with article count

#### POST /api/news/categories (Admin)
Create a new category
- **Auth Required:** Admin role

### 4.3 Article Tags

#### GET /api/news/tags
Get all article tags
- **Response:** Array of tag objects

#### GET /api/news/tags/:id
Get a single tag by ID or slug
- **Response:** Tag object with article count

#### POST /api/news/tags (Admin)
Create a new tag
- **Auth Required:** Admin role

### 4.4 Authors

#### GET /api/authors
Get all authors
- **Response:** Array of author objects

#### GET /api/authors/:id
Get a single author by ID
- **Response:** Author object with articles count

#### POST /api/authors (Admin)
Create a new author
- **Auth Required:** Admin role

### 4.5 Trending Topics

#### GET /api/news/trending-topics
Get active trending topics
- **Response:** Array of trending topic objects, sorted by priority

#### POST /api/news/trending-topics (Admin)
Create or update a trending topic
- **Auth Required:** Admin role

### 4.6 Comments

#### GET /api/news/:id/comments
Get comments for an article
- **Query Parameters:**
  - `approved` - Filter by approval status (true/false)
  - `limit`, `offset` - Pagination
- **Response:** Array of comment objects (with nested replies)

#### POST /api/news/:id/comments (Authenticated)
Create a new comment
- **Body:** `{ content: "comment text", parent_comment_id: null }`
- **Auth Required:** Authenticated user (email verification may be required)

#### PATCH /api/comments/:id (Owner/Moderator)
Update own comment
- **Auth Required:** Comment owner or Moderator role

#### DELETE /api/comments/:id (Owner/Moderator/Admin)
Delete a comment
- **Auth Required:** Comment owner, Moderator, or Admin role

#### POST /api/comments/:id/approve (Moderator/Admin)
Approve a comment
- **Auth Required:** Moderator or Admin role

### 4.7 Related Content

#### GET /api/news/:id/related
Get related content for an article
- **Query Parameters:**
  - `type` - Filter by related type (launch, article, etc.)
  - `limit` - Limit results (default: 5)
- **Response:** Array of related content objects

#### POST /api/news/:id/related (Admin)
Add related content link
- **Auth Required:** Admin role

---

## 5. About Us / Crew Module

### 5.1 Crew Members

#### GET /api/crew
Get all active crew members
- **Query Parameters:**
  - `category` - Filter by category (ADVISOR, PRODUCTION, etc.)
  - `location` - Filter by location
  - `active` - Filter by active status (default: true)
- **Response:** Array of crew member objects

#### GET /api/crew/:id
Get a single crew member by ID
- **Response:** Crew member object

#### POST /api/crew (Admin)
Create a new crew member
- **Auth Required:** Admin role

#### PATCH /api/crew/:id (Admin)
Update a crew member
- **Auth Required:** Admin role

### 5.2 Crew Locations

#### GET /api/crew/locations
Get all crew locations for map display
- **Response:** Array of location objects with coordinates

---

## 6. Events Module

### 6.1 Events

#### GET /api/events
Get all events
- **Query Parameters:**
  - `event_type` - Filter by event type
  - `status` - Filter by status (TBD, confirmed, etc.)
  - `date_from` - Filter by date range
  - `date_to` - Filter by date range
  - `related_launch_id` - Filter by related launch
- **Response:** Array of event objects

#### GET /api/events/:id
Get a single event by ID
- **Response:** Event object

#### GET /api/events/upcoming
Get upcoming events
- **Response:** Array of upcoming event objects

#### POST /api/events (Admin/Writer)
Create a new event
- **Auth Required:** Admin or Writer role

#### PATCH /api/events/:id (Admin/Writer)
Update an event
- **Auth Required:** Admin or Writer role

#### DELETE /api/events/:id (Admin)
Delete an event
- **Auth Required:** Admin role

---

## 7. Live Streams Module

### 7.1 Live Streams

#### GET /api/streams
Get all live streams
- **Query Parameters:**
  - `status` - Filter by status (live, offline, coming_soon)
  - `is_live` - Filter by live status (true/false)
- **Response:** Array of stream objects

#### GET /api/streams/:id
Get a single stream by ID
- **Response:** Stream object

#### GET /api/streams/live
Get currently live streams
- **Response:** Array of live stream objects

#### POST /api/streams (Admin)
Create or update a stream
- **Auth Required:** Admin role

#### PATCH /api/streams/:id (Admin)
Update stream status
- **Auth Required:** Admin role

---

## 8. Earth Navigator Module

### 8.1 Satellites

#### GET /api/satellites
Get all satellites
- **Query Parameters:**
  - `status` - Filter by status (active, inactive, decayed)
  - `launch_id` - Filter by launch
  - `norad_id` - Filter by NORAD ID
  - `search` - Search by name
- **Response:** Array of satellite objects

#### GET /api/satellites/:id
Get a single satellite by ID
- **Response:** Satellite object with TLE data

#### GET /api/satellites/norad/:norad_id
Get satellite by NORAD ID
- **Response:** Satellite object

#### POST /api/satellites (Admin)
Create or update satellite data
- **Auth Required:** Admin role

#### POST /api/satellites/sync-tle (Admin)
Sync TLE data from NORAD API
- **Auth Required:** Admin role

---

## 9. User Management Module

### 9.1 Authentication

#### POST /api/auth/register
Register a new user
- **Body:** `{ username, email, password, first_name, last_name }`
- **Response:** User object (without password)

#### POST /api/auth/login
Login user
- **Body:** `{ email, password }`
- **Response:** `{ user, access_token, refresh_token }`

#### POST /api/auth/refresh
Refresh access token
- **Body:** `{ refresh_token }`
- **Response:** `{ access_token, refresh_token }`

#### POST /api/auth/logout
Logout user (invalidate refresh token)
- **Auth Required:** Authenticated user

#### POST /api/auth/verify-email
Verify email address
- **Body:** `{ token }` (from email verification link)
- **Response:** Success message

#### POST /api/auth/resend-verification
Resend verification email
- **Auth Required:** Authenticated user

### 9.2 Users

#### GET /api/users/me
Get current user profile
- **Auth Required:** Authenticated user
- **Response:** User object with roles

#### PATCH /api/users/me
Update own profile
- **Auth Required:** Authenticated user
- **Body:** Partial user object

#### GET /api/users (Admin)
Get all users
- **Query Parameters:**
  - `role` - Filter by role name
  - `active` - Filter by active status
  - `search` - Search by username/email
  - `limit`, `offset` - Pagination
- **Auth Required:** Admin role
- **Response:** Array of user objects

#### GET /api/users/:id (Admin)
Get a single user by ID
- **Auth Required:** Admin role

#### PATCH /api/users/:id (Admin)
Update a user
- **Auth Required:** Admin role

#### DELETE /api/users/:id (Admin)
Deactivate a user
- **Auth Required:** Admin role

### 9.3 Roles & Permissions

#### GET /api/roles
Get all roles
- **Auth Required:** Admin role
- **Response:** Array of role objects with permissions

#### GET /api/permissions
Get all permissions
- **Auth Required:** Admin role
- **Response:** Array of permission objects

#### POST /api/users/:id/roles (Admin)
Assign roles to a user
- **Body:** `{ role_ids: [1, 2] }`
- **Auth Required:** Admin role

#### DELETE /api/users/:id/roles/:role_id (Admin)
Remove a role from a user
- **Auth Required:** Admin role

---

## 10. Featured Content Module

### 10.1 Featured Content

#### GET /api/featured
Get featured content
- **Query Parameters:**
  - `section` - Filter by section (homepage, news, launch_center)
  - `content_type` - Filter by content type
  - `active` - Filter by active status (default: true)
- **Response:** Array of featured content objects

#### POST /api/featured (Admin)
Create featured content entry
- **Auth Required:** Admin role

#### DELETE /api/featured/:id (Admin)
Remove featured content
- **Auth Required:** Admin role

---

## 11. Mobile App Support

### 11.1 User Preferences

#### GET /api/users/me/preferences
Get user preferences
- **Auth Required:** Authenticated user
- **Response:** Object with preference key-value pairs

#### PUT /api/users/me/preferences/:key
Set a user preference
- **Auth Required:** Authenticated user
- **Body:** `{ value: {...} }`

#### DELETE /api/users/me/preferences/:key
Delete a user preference
- **Auth Required:** Authenticated user

### 11.2 Push Notifications

#### POST /api/users/me/push-subscriptions
Register push notification subscription
- **Auth Required:** Authenticated user
- **Body:** `{ device_token, platform, subscribed_topics }`

#### DELETE /api/users/me/push-subscriptions/:id
Unregister push notification subscription
- **Auth Required:** Authenticated user

---

## Error Responses

All endpoints should follow this error response format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Validation Error
- `500` - Internal Server Error

---

## Rate Limiting

- Public endpoints: 100 requests per minute per IP
- Authenticated endpoints: 500 requests per minute per user
- Admin endpoints: 1000 requests per minute per user

---

## Pagination

All list endpoints should support pagination:

- `limit` - Number of results (default: 20, max: 100)
- `offset` - Number of results to skip (default: 0)

Response format:
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

---

## Notes for Implementation

1. **File Structure**: Consider organizing routes into separate files:
   - `routes/launches.js`
   - `routes/spacebase.js`
   - `routes/news.js`
   - `routes/auth.js`
   - `routes/users.js`
   - etc.

2. **Middleware**: 
   - Authentication middleware for protected routes
   - Authorization middleware (RBAC check)
   - Validation middleware (e.g., using express-validator)
   - Error handling middleware

3. **Data Validation**: Validate all input data using express-validator or Joi

4. **Elasticsearch**: The `/api/search` endpoint should integrate with Elasticsearch for fast, faceted search

5. **Caching**: Consider Redis caching for frequently accessed data (launch lists, statistics, etc.)

6. **Webhooks**: Consider webhook support for external integrations (NASA API, Space Devs API)

