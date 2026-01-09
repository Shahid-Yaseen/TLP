# Cron Jobs Implementation Analysis for Launches

## Overview

The system uses **two main cron job scripts** to sync launch data from the Space Devs API (`ll.thespacedevs.com`) to the database:

1. **`sync_upcoming_previous_launches.js`** - Comprehensive sync of upcoming and previous launches
2. **`check_new_launches.js`** - Quick check for new launches (runs more frequently)

---

## 1. Main Sync Script: `sync_upcoming_previous_launches.js`

### Purpose
Comprehensive synchronization of upcoming and previous launches with full rate limiting support.

### Schedule
- **Recommended**: Every hour (`0 * * * *`)
- Can be configured for different intervals (every 2 hours, twice daily, etc.)

### How It Works

#### Step 1: Fetch Upcoming Launches
```javascript
// Fetches from: /launches/upcoming/
// Uses pagination (100 launches per page)
// Filters: net__gte (launch date >= today)
// Orders by: net (launch date) ascending
```

**Process:**
- Paginates through all upcoming launches (up to 1000 safety limit)
- Respects rate limits (waits if limit reached)
- Adds 500ms delay between pages

#### Step 2: Fetch Previous Launches
```javascript
// Fetches from: /launches/previous/
// Only fetches last 30 days to avoid too many API calls
// Uses pagination (100 launches per page)
```

**Process:**
- Only syncs launches from the last 30 days
- Paginates through results (up to 500 safety limit)
- Adds 500ms delay between pages

#### Step 3: Sync Each Launch
For each launch fetched:

1. **Fetch Full Details** (Important!)
   ```javascript
   // The list endpoint returns empty vid_urls arrays
   // So we ALWAYS fetch full details: /launches/{id}/
   const fullLaunchData = await spaceDevsApi.fetchLauncherById(launchData.id);
   ```

2. **Map API Data to Database Schema**
   ```javascript
   const mappedLaunch = launchMapper.mapLauncherToLaunch(fullLaunchData);
   ```
   - Maps all fields from Space Devs API format to database schema
   - Handles nested objects (rocket, pad, mission, etc.)
   - Extracts video URLs, updates, timeline, mission patches

3. **Sync to Database**
   ```javascript
   await launchSync.syncLaunchFromApi(mappedLaunch);
   ```
   - Uses PostgreSQL `INSERT ... ON CONFLICT DO UPDATE` (upsert)
   - Updates existing launches or creates new ones
   - Syncs related data:
     - Providers/Agencies
     - Rockets
     - Launch Sites
     - Launch Pads
     - Orbits
     - Launch Statuses
     - Array data: updates, timeline, mission patches, info URLs, video URLs

### Rate Limiting

**Features:**
- Tracks API calls in `.rate_limit_state.json` file
- Default: 210 calls/hour (Advanced Supporter tier)
- Can be configured: `--rate-limit 15` (Free tier)
- Automatically waits if rate limit reached
- Cleans up stale entries older than 1 hour

**Rate Limit Logic:**
```javascript
// Before each API call:
await waitForRateLimit(); // Checks and waits if needed

// State file tracks timestamps of all calls in last hour
// Automatically removes entries older than 1 hour
```

### Database Updates

**Main Launch Table (`launches`):**
- Uses `external_id` (UUID from Space Devs API) as unique identifier
- Updates all fields including:
  - Basic info: name, slug, launch_date, window_start, window_end
  - Status: outcome, status_id, probability, weather_concerns
  - Media: youtube_video_id, youtube_channel_id, media JSON
  - Related IDs: provider_id, rocket_id, site_id, launch_pad_id, orbit_id
  - JSON fields: status_json, rocket_json, mission_json, pad_json, raw_data
  - Always updates `updated_at` timestamp

**Related Tables:**
- `providers` - Launch service providers/agencies
- `rockets` - Rocket configurations
- `launch_sites` - Launch locations
- `launch_pads` - Specific launch pads
- `orbits` - Orbit types
- `launch_statuses` - Launch status types

**Array Tables:**
- `launch_updates` - Launch updates/comments
- `launch_timeline` - Timeline events
- `launch_mission_patches` - Mission patch images
- `launch_info_urls` - Information URLs
- `launch_vid_urls` - Video/webcast URLs

**Update Strategy:**
- **DELETE then INSERT** for array tables (ensures clean sync)
- **UPSERT** for main launch table (preserves existing data if API data missing)

---

## 2. Quick Check Script: `check_new_launches.js`

### Purpose
Quick check for new launches, runs more frequently to catch new launches quickly.

### Schedule
- **Recommended**: Every 10 minutes (`*/10 * * * *`)

### How It Works

#### Step 1: Fetch Recent Launches
```javascript
// Fetches:
// 1. Upcoming launches (net >= today)
// 2. Recent past launches (last 7 days by default)
```

**Process:**
- Fetches upcoming launches from `/launch/` endpoint
- Fetches recent launches (last 7 days) from `/launch/` endpoint
- Removes duplicates by `external_id`
- Default: checks last 7 days (configurable with `--days N`)

#### Step 2: Compare with Database
```javascript
// Gets all existing external_ids from database
const existingIds = await getExistingLaunchIds();

// For each launch from API:
const isNew = !existingIds.has(launchId);
```

#### Step 3: Sync New/Updated Launches
- For each launch:
  - If new: Fetch full details and sync
  - If existing: Still syncs (updates existing record)
  - Adds 200ms delay between syncs

**Key Difference from Main Script:**
- Only checks recent launches (not all upcoming/previous)
- Faster execution (fewer API calls)
- Designed for frequent runs

---

## 3. External API Integration

### API Service: `spaceDevsApi.js`

**Base URL:** `https://ll.thespacedevs.com/2.3.0`

**Authentication:**
```javascript
headers: {
  'Authorization': `Token ${API_KEY}`
}
```

**Key Endpoints Used:**

1. **`/launches/upcoming/`** - Upcoming launches
   - Query params: `limit`, `offset`, `ordering`, `net__gte`
   - Returns: `{ results: [...], count: N, next: URL, previous: URL }`

2. **`/launches/previous/`** - Previous launches
   - Query params: `limit`, `offset`, `net__gte` (date filter)
   - Returns: `{ results: [...], count: N, next: URL, previous: URL }`

3. **`/launches/{id}/`** - Single launch details
   - Returns: Complete launch object with all fields including `vid_urls`

4. **`/launch/`** - General launches endpoint
   - Used by `check_new_launches.js`
   - Supports filtering by date ranges

**Rate Limits:**
- Free tier: 15 calls/hour
- Advanced Supporter: 210 calls/hour
- Configured via `SPACE_DEVS_RATE_LIMIT` env var or `--rate-limit` flag

**Error Handling:**
- Retries on timeout/connection errors (up to 3 retries)
- 60-second timeout per request
- Graceful error handling (continues on individual launch failures)

---

## 4. Data Mapping: `launchMapper.js`

### Purpose
Transforms Space Devs API response format to database schema.

### Key Mappings

**Core Fields:**
- `id` → `external_id` (UUID)
- `name` → `name`
- `net` → `launch_date`
- `window_start` → `window_start`
- `window_end` → `window_end`

**Nested Objects:**
- `launch_service_provider` → `provider_data` → Upserted to `providers` table
- `rocket` → `rocket_data` → Upserted to `rockets` table
- `pad.location` → `site_data` → Upserted to `launch_sites` table
- `pad` → `pad_data` → Upserted to `launch_pads` table
- `mission.orbit` → `orbit_data` → Upserted to `orbits` table
- `status` → `status_data` → Upserted to `launch_statuses` table

**Array Fields:**
- `updates` → `updates` → Synced to `launch_updates` table
- `timeline` → `timeline` → Synced to `launch_timeline` table
- `mission_patches` → `mission_patches` → Synced to `launch_mission_patches` table
- `info_urls` → `info_urls` → Synced to `launch_info_urls` table
- `vid_urls` → `vid_urls` → Synced to `launch_vid_urls` table

**JSON Storage:**
- Complete API objects stored as JSONB:
  - `status_json`
  - `rocket_json`
  - `mission_json`
  - `pad_json`
  - `program_json`
  - `raw_data` (complete API response)

---

## 5. Database Sync: `launchSync.js`

### Main Function: `syncLaunchFromApi()`

**Process:**

1. **Begin Transaction**
   ```javascript
   await client.query('BEGIN');
   ```

2. **Upsert Related Entities** (in order):
   - Provider → `providers` table
   - Orbit → `orbits` table
   - Launch Site → `launch_sites` table
   - Launch Pad → `launch_pads` table (requires site_id)
   - Rocket → `rockets` table (requires provider_id)
   - Launch Status → `launch_statuses` table

3. **Upsert Main Launch**
   ```sql
   INSERT INTO launches (...) VALUES (...)
   ON CONFLICT (external_id)
   DO UPDATE SET ...
   ```
   - Uses `COALESCE` to preserve existing data if API data is null
   - Always updates `updated_at` timestamp

4. **Sync Array Data** (DELETE then INSERT):
   - `syncLaunchUpdates()` - Launch updates
   - `syncLaunchTimeline()` - Timeline events
   - `syncLaunchMissionPatches()` - Mission patches
   - `syncLaunchInfoUrls()` - Info URLs
   - `syncLaunchVidUrls()` - Video URLs

5. **Commit Transaction**
   ```javascript
   await client.query('COMMIT');
   ```

**Error Handling:**
- Rolls back transaction on error
- Releases database connection in `finally` block
- Logs errors but continues processing other launches

---

## 6. Website Display Flow

### API Endpoints

**Main Endpoints:**
- `GET /api/launches` - All launches with filtering
- `GET /api/launches/upcoming` - Upcoming launches
- `GET /api/launches/previous` - Previous launches
- `GET /api/launches/:id` - Single launch details

**Query from Database:**
```sql
SELECT 
  launches.*,
  providers.name as provider_name,
  rockets.name as rocket_name,
  launch_sites.name as site_name,
  ...
FROM launches
LEFT JOIN providers ON launches.provider_id = providers.id
LEFT JOIN rockets ON launches.rocket_id = rockets.id
LEFT JOIN launch_sites ON launches.site_id = launch_sites.id
...
WHERE ...
ORDER BY launches.launch_date ASC
```

### Frontend Display

**Pages Using Launch Data:**
1. **Homepage** (`Homepage.jsx`)
   - Shows upcoming launches
   - Fetches from `/api/launches/upcoming`

2. **Upcoming Launches** (`UpcomingLaunches.jsx`)
   - Grid/carousel view of upcoming launches
   - Shows launch images, provider, name, site

3. **Launch Center** (`LaunchCenter.jsx`)
   - Full list of launches with filtering
   - Shows launch cards with status colors

4. **Launch Detail Pages**
   - Individual launch pages
   - Shows full launch information, videos, updates, timeline

**Data Flow:**
```
Cron Job → Space Devs API → Database → API Endpoints → Frontend
```

**Update Frequency:**
- Database updated by cron jobs (hourly or every 10 minutes)
- Frontend fetches from database (real-time, no caching)
- Users see latest data from database

---

## 7. Cron Job Setup

### Setup Scripts

1. **`setup_auto_sync.sh`** - Sets up hourly sync
   ```bash
   # Runs: sync_upcoming_previous_launches.js every hour
   ```

2. **`setup_cron.sh`** - Sets up 10-minute check
   ```bash
   # Runs: check_new_launches.js every 10 minutes
   ```

### Manual Setup

**For Hourly Sync:**
```bash
crontab -e
# Add:
0 * * * * cd /path/to/api && node scripts/sync_upcoming_previous_launches.js --rate-limit 210 >> logs/upcoming_previous_sync.log 2>&1
```

**For 10-Minute Check:**
```bash
crontab -e
# Add:
*/10 * * * * cd /path/to/api && node scripts/check_new_launches.js >> logs/cron_launch_sync.log 2>&1
```

### Logging

**Log Files:**
- `api/logs/upcoming_previous_sync.log` - Hourly sync logs
- `api/logs/cron_launch_sync.log` - 10-minute check logs

**Log Format:**
```
[2024-01-01T12:00:00.000Z] ℹ️ Starting Upcoming/Previous Launches Sync
[2024-01-01T12:00:01.000Z] ✅ Fetched 50 upcoming launches
[2024-01-01T12:00:02.000Z] ✅ Synced: Launch Name
```

---

## 8. Key Features

### ✅ Strengths

1. **Rate Limiting**: Proper rate limit handling with state file
2. **Pagination**: Handles large datasets with pagination
3. **Error Handling**: Continues processing on individual failures
4. **Data Completeness**: Always fetches full details for video URLs
5. **Transaction Safety**: Uses database transactions for consistency
6. **Upsert Logic**: Preserves existing data when API data is missing
7. **Array Sync**: Properly syncs nested arrays (updates, timeline, etc.)

### ⚠️ Potential Issues

1. **Video URLs**: List endpoint returns empty `vid_urls`, so script always fetches full details (extra API call per launch)
2. **Previous Launches**: Only syncs last 30 days (may miss older launches)
3. **Rate Limit File**: Uses file-based rate limiting (may not work in distributed systems)
4. **No Incremental Updates**: Always syncs all launches (could optimize to only sync changed launches)

### 🔧 Recommendations

1. **Optimize Video URL Fetching**: Cache which launches already have video URLs to avoid redundant API calls
2. **Incremental Sync**: Track `last_updated` timestamps to only sync changed launches
3. **Distributed Rate Limiting**: Use Redis or database for rate limit state in distributed systems
4. **Monitoring**: Add alerts for cron job failures
5. **Backfill**: Add script to sync historical launches beyond 30 days

---

## Summary

The cron job system:
1. ✅ Fetches launches from Space Devs API with proper rate limiting
2. ✅ Maps API data to database schema
3. ✅ Upserts launches and related entities to database
4. ✅ Syncs array data (updates, timeline, videos, etc.)
5. ✅ Website displays launches from database via API endpoints
6. ✅ Updates happen automatically via cron jobs

The system is well-structured with proper error handling, rate limiting, and data mapping. The main optimization opportunity is reducing redundant API calls for video URLs.

