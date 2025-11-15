# Space Devs API Integration

## Overview

This integration connects the TLP Platform with the Space Devs API (lldev.thespacedevs.com) to automatically sync launch data. The system uses a database-first approach: it checks the database first, then fetches from the API only when data is missing or outdated.

## Architecture

### Components

1. **Space Devs API Service** (`services/spaceDevsApi.js`)
   - Handles all HTTP requests to the Space Devs API
   - Supports pagination for bulk operations
   - Includes error handling and retry logic

2. **Launch Mapper** (`services/launchMapper.js`)
   - Maps Space Devs API response format to our database schema
   - Handles nested objects (providers, rockets, orbits, sites, pads)
   - Gracefully handles missing/null fields

3. **Launch Sync Service** (`services/launchSync.js`)
   - Core sync logic with database transactions
   - Upsert operations for launches and related entities
   - Timestamp comparison to determine if sync is needed

4. **API Routes** (`routes/launches.js`)
   - Modified to check database first
   - Automatically syncs when data is outdated
   - Returns cached data if API is unavailable

## Setup

### 1. Environment Configuration

Add the Space Devs API key to your `.env` file:

```bash
SPACE_DEVS_API_KEY=1f7f63ed1517cdef2181117304ae4ed3a6e326f0
```

**Note:** The API key is currently hardcoded as a fallback, but it's recommended to use environment variables for security.

### 2. Run Migration

The migration adds the `updated_at` column to track sync status:

```bash
npm run migrate
```

### 3. Initial Sync (Optional)

To populate the database with all available launches from Space Devs API:

```bash
npm run sync:launches
```

This will:
- Fetch all launchers from the API (handles pagination automatically)
- Save them to the database
- Show progress and error summary

**Note:** This may take several minutes depending on the number of launches.

## Usage

### Automatic Sync

The system automatically syncs data when:

1. **Launch is requested** (`GET /api/launches/:id`)
   - Checks database first
   - If not found, fetches from API and saves
   - If found but outdated, updates from API

2. **Launches list is requested** (`GET /api/launches`)
   - Queries database first
   - Checks first 10 launches for updates
   - Syncs if API data is newer

### Sync Logic

Data is synced when:
- Launch doesn't exist in database
- API `last_updated` timestamp is newer than database `updated_at`

### Error Handling

- If API is unavailable: Returns cached database data with `_cached: true` flag
- If sync fails: Logs error but continues with cached data
- Never fails a request due to API issues

## API Endpoints

### GET /api/launches

Returns launches from database, automatically syncing if needed.

**Query Parameters:**
- All existing filter parameters work as before
- Data is always returned from database (never directly from API)

**Response:**
```json
{
  "data": [...],
  "pagination": {...},
  "_cached": true,  // Optional: present if API was unavailable
  "_warning": "Some data may be stale due to API unavailability"  // Optional
}
```

### GET /api/launches/:id

Returns a single launch, syncing if needed.

**Parameters:**
- `id`: Can be internal database ID or external UUID

**Response:**
```json
{
  "id": 1,
  "external_id": "uuid-from-api",
  "name": "Launch Name",
  ...
  "_cached": true,  // Optional: present if API was unavailable
  "_warning": "Data may be stale due to API unavailability"  // Optional
}
```

## Database Schema

### New Column

- `launches.updated_at` (TIMESTAMPTZ): Tracks when launch was last synced
- `launches.external_id` (UUID): Stores Space Devs API UUID for matching

### Indexes

- `idx_launches_updated_at`: For efficient timestamp queries
- `idx_launches_external_id`: For fast UUID lookups

## Performance Considerations

1. **Limited Sync Checks**: Only first 10 launches are checked per list request
2. **Database Transactions**: All sync operations use transactions for data integrity
3. **Caching**: Database acts as cache, reducing API calls
4. **Rate Limiting**: Built-in delays prevent overwhelming the API

## Troubleshooting

### API Key Issues

If you see authentication errors:
1. Check that `SPACE_DEVS_API_KEY` is set in `.env`
2. Verify the API key is valid
3. Check API rate limits

### Sync Not Working

1. Check database connection
2. Verify migration ran successfully (`npm run migrate`)
3. Check server logs for errors
4. Ensure `updated_at` column exists: `SELECT updated_at FROM launches LIMIT 1;`

### Data Not Updating

1. Check if `external_id` is set on launches
2. Verify API is returning newer `last_updated` timestamps
3. Check server logs for sync messages

## Manual Operations

### Force Sync Single Launch

```javascript
const launchSync = require('./services/launchSync');
await launchSync.syncLaunchByExternalId('uuid-from-api');
```

### Check Sync Status

```sql
SELECT 
  id, 
  name, 
  external_id, 
  updated_at,
  NOW() - updated_at as age
FROM launches 
WHERE external_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
```

## Future Enhancements

- Background sync job (cron) for periodic updates
- Webhook support for real-time updates
- Batch sync optimization
- Sync status dashboard
- Rate limiting improvements

