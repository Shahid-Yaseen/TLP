# Launch Detail Tabs - API Data Sources

This document details what data is available from the Space Devs API for each tab in the Launch Detail page.

## Tab Data Sources

### 1. PAYLOAD Tab

**API Sources:**
- `mission.agencies` - Primary payload agencies (array)
- `mission.spacecraft_flight` - Secondary payloads (array of spacecraft flights)
- `mission.spacecraft` - Single or array of spacecraft objects
- `mission.payloads` - Direct payloads array (some API versions)
- `rocket.spacecraft_stage` - Payloads from rocket configuration

**Data Structure:**
```json
{
  "id": "payload_id",
  "name": "Payload Name",
  "type": "Payload Type",
  "description": "Description",
  "mass_kg": 1000,
  "mass_lb": 2200,
  "orbit": "Orbit Name",
  "nationality": "Country",
  "manufacturer": "Manufacturer Name",
  "customers": ["Customer 1", "Customer 2"],
  "destination": "Destination"
}
```

**Backend Processing:**
- Extracts from `mission_json` JSONB column
- Falls back to database `payloads` table if available
- Merges API and database payloads (database takes priority)

**Status:** ✅ **WORKING** - Data is extracted from multiple API sources

---

### 2. CREW Tab

**API Sources:**
- **PRIMARY:** `/astronauts/` endpoint with `flights__launch__id` filter (most complete)
- `mission.crew` - Crew array in mission object
- `mission.spacecraft_flight[].launch_crew` - Crew from spacecraft flights

**Data Structure:**
```json
{
  "id": "astronaut_id",
  "name": "Full Name",
  "role": "Commander",
  "nationality": "Country",
  "date_of_birth": "YYYY-MM-DD",
  "flights_count": 3,
  "bio": "Biography",
  "wiki_url": "https://..."
}
```

**Backend Processing:**
- Fetches from astronaut endpoint using `fetchAstronautsByLaunchId()`
- Falls back to database `astronauts` table
- Falls back to JSONB crew data
- Merges all sources (database > astronaut endpoint > JSONB)

**Status:** ✅ **WORKING** - Uses dedicated astronaut endpoint for complete data

---

### 3. ROCKET Tab

**API Sources:**
- `rocket.configuration` - Complete rocket configuration object

**Data Structure:**
```json
{
  "id": 164,
  "name": "Falcon 9",
  "full_name": "Falcon 9 Block 5",
  "variant": "Block 5",
  "family": "Falcon",
  "length": 70.0,
  "diameter": 3.7,
  "launch_mass": 549054,
  "leo_capacity": 22800,
  "gto_capacity": 8300,
  "to_thrust": 7607,
  "reusable": true,
  "description": "Rocket description",
  "info_url": "https://...",
  "wiki_url": "https://..."
}
```

**Backend Processing:**
- Extracted from `rocket_json` JSONB column
- Falls back to database `rockets` table if JSONB not available

**Status:** ✅ **WORKING** - Complete rocket data available

---

### 4. ENGINE Tab

**API Sources:**
- **PRIMARY:** `rocket.configuration.url` → `/launcher_configurations/{id}/` endpoint (most complete)
- `rocket.configuration.launcher_stage[]` - Stages with engines array
- `rocket.launcher_stage[]` - Direct launcher stages

**Data Structure:**
```json
{
  "stage": 1,
  "stage_type": "First Stage",
  "reusable": true,
  "engine_id": "engine_id",
  "engine_name": "Merlin 1D",
  "engine_type": "liquid",
  "engine_configuration": "open-cycle",
  "engine_layout": "octaweb",
  "engine_version": "1D+",
  "isp_sea_level": 282,
  "isp_vacuum": 311,
  "thrust_sea_level_kn": 845,
  "thrust_vacuum_kn": 914,
  "number_of_engines": 9,
  "propellant_1": "RP-1",
  "propellant_2": "LOX",
  "stage_thrust_kn": 7607,
  "stage_fuel_amount_tons": 411,
  "stage_burn_time_sec": 162
}
```

**Backend Processing:**
1. Fetches from `rocket.configuration.url` (launcher_configuration endpoint)
2. Falls back to `rocket.configuration.launcher_stage` in JSONB
3. Falls back to `rocket.launcher_stage` in JSONB
4. Extracts engines from each stage

**Status:** ⚠️ **PARTIAL** - Engine data depends on rocket configuration URL availability. Some rockets may not have complete engine data.

---

### 5. PROVIDER Tab

**API Sources:**
- `launch_service_provider` - Complete provider object

**Data Structure:**
```json
{
  "id": 121,
  "name": "SpaceX",
  "abbrev": "SpX",
  "type": {
    "id": 3,
    "name": "Commercial"
  },
  "founding_year": 2002,
  "country_code": "US",
  "administrator": "Administrator Name",
  "description": "Provider description",
  "url": "https://...",
  "wiki_url": "https://...",
  "info_url": "https://...",
  "logo_url": "https://..."
}
```

**Backend Processing:**
- Extracted from `launch_service_provider_json` JSONB column
- Falls back to database `providers` table

**Status:** ✅ **WORKING** - Complete provider data available

---

### 6. PAD Tab

**API Sources:**
- `pad` - Complete pad object with location

**Data Structure:**
```json
{
  "id": 16,
  "name": "Space Launch Complex 4E",
  "description": "Pad description",
  "location": {
    "id": 11,
    "name": "Vandenberg SFB, CA, USA",
    "country": {
      "id": 2,
      "name": "United States of America",
      "alpha_2_code": "US"
    }
  },
  "latitude": 34.632,
  "longitude": -120.611,
  "total_launch_count": 239,
  "orbital_launch_attempt_count": 239,
  "info_url": "https://...",
  "wiki_url": "https://...",
  "map_url": "https://...",
  "map_image": "https://..."
}
```

**Backend Processing:**
- Extracted from `pad_json` JSONB column
- Falls back to database `launch_pads` and `launch_sites` tables

**Status:** ✅ **WORKING** - Complete pad data available

---

### 7. HAZARDS Tab

**API Sources:**
- `hazards[]` - Array of hazard objects
- `weather_concerns` - Weather-related hazards (string)
- `failreason` - Failure reason (string)
- `probability` - Launch probability (number)
- `status` - Launch status (object with failure info)

**Data Structure:**
```json
{
  "type": "weather|failure|probability|status",
  "description": "Hazard description",
  "severity": "low|medium|high",
  "source": "api|database"
}
```

**Backend Processing:**
1. Extracts from `hazards` array in API response
2. Creates hazards from `weather_concerns` field
3. Creates hazards from `failreason` field
4. Creates hazards from `probability` field
5. Creates hazards from `status` if launch failed
6. Merges with database `launch_hazards` table

**Status:** ✅ **WORKING** - Multiple sources combined for comprehensive hazard data

---

## Data Availability Summary

| Tab | API Source | Database Fallback | Status |
|-----|------------|-------------------|--------|
| **PAYLOAD** | mission.agencies, mission.spacecraft_flight, etc. | payloads table | ✅ Working |
| **CREW** | /astronauts/ endpoint | astronauts table | ✅ Working |
| **ROCKET** | rocket.configuration | rockets table | ✅ Working |
| **ENGINE** | rocket.configuration.url, launcher_stage | None | ⚠️ Partial |
| **PROVIDER** | launch_service_provider | providers table | ✅ Working |
| **PAD** | pad | launch_pads, launch_sites | ✅ Working |
| **HAZARDS** | hazards[], weather_concerns, failreason | launch_hazards table | ✅ Working |

## Notes

1. **ENGINE Tab**: Engine data requires fetching from the launcher configuration URL. If the URL is missing or returns 404, engine data may not be available. The backend tries multiple fallback methods.

2. **CREW Tab**: Uses a dedicated astronaut endpoint for the most complete crew data. This requires an additional API call but provides the best data quality.

3. **PAYLOAD Tab**: Extracts payloads from multiple possible locations in the API response to ensure maximum coverage.

4. **HAZARDS Tab**: Combines multiple sources (API hazards array, weather concerns, failure reasons, etc.) to provide comprehensive hazard information.

5. All tabs have database fallbacks to ensure data is available even if API data is incomplete.

