# API Calls Analysis - Space Devs API Usage

## Overview

This document analyzes how many times the website makes calls to the external **Space Devs API** (`ll.thespacedevs.com`).

---

## 🔍 Types of API Calls

### 1. **Frontend → Backend API** (Internal - NOT external Space Devs API)
These are calls from your React frontend to your own backend API endpoints. These do NOT count as Space Devs API calls.

### 2. **Backend → Space Devs API** (External API calls)
These are the actual calls to the external Space Devs API that we need to track.

### 3. **Cron Jobs → Space Devs API** (Scheduled external API calls)
Automated cron jobs that sync data from Space Devs API.

---

## 📊 External Space Devs API Calls Breakdown

### **A. Website User Requests (On-Demand)**

#### 1. **GET /api/launches** (List Launches)
**When:** User visits homepage, launch center, or any page listing launches

**Space Devs API Calls:**
- **Conditional:** Only if cache is expired (older than 1 day)
- **Call:** `syncAllLaunchesFromExternal()` - Background sync
- **Frequency:** Once per day maximum (if cache expired)
- **API Calls Made:** 
  - Fetches ALL upcoming launches (paginated)
  - Example: ~361 upcoming launches = ~4 API calls (100 per page)

**Code Location:** `api/routes/launches.js:467-481`

```javascript
// Check if cache is expired (older than 1 day)
const cacheExpired = await launchSync.isCacheExpired(1);

// Start sync in background if cache is expired (non-blocking)
if (cacheExpired) {
  launchSync.syncAllLaunchesFromExternal() // Background sync
}
```

**Result:** 
- ✅ **Most requests: 0 API calls** (uses cached database data)
- ⚠️ **Cache expired: ~4 API calls** (once per day)

---

#### 2. **GET /api/launches/:id** (Single Launch Detail)
**When:** User views a specific launch detail page

**Space Devs API Calls:**
- **Conditional:** Only if launch NOT found in database
- **Call:** `spaceDevsApi.fetchLauncherById(id)` - 1 API call
- **Frequency:** Only for new launches not yet in database
- **API Calls Made:** 1 call per missing launch

**Code Location:** `api/routes/launches.js:1239-1244`

```javascript
if (!launchRows.length) {
  // Not found in DB, try fetching from API
  const apiData = await spaceDevsApi.fetchLauncherById(id);
  // ... syncs to database
}
```

**Result:**
- ✅ **Launch exists in DB: 0 API calls**
- ⚠️ **Launch missing: 1 API call** (rare, only for new launches)

---

#### 3. **GET /api/launches/:id** (Astronauts)
**When:** User views launch detail page (if astronauts are requested)

**Space Devs API Calls:**
- **Conditional:** Only if astronauts are requested and launch has `external_id`
- **Call:** `spaceDevsApi.fetchAstronautsByLaunchId()` - 1 API call
- **Frequency:** Per launch detail view (if astronauts requested)

**Code Location:** `api/routes/launches.js:1496`

```javascript
const astronauts = await spaceDevsApi.fetchAstronautsByLaunchId(launch.external_id);
```

**Result:**
- ⚠️ **1 API call** per launch detail view (if astronauts requested)

---

### **B. Cron Jobs (Scheduled)**

#### 1. **sync_upcoming_previous_launches.js** (Hourly)
**Schedule:** Every hour (`0 * * * *`)

**Space Devs API Calls:**
- **Upcoming Launches:** 
  - Fetches from `/launches/upcoming/`
  - Paginated: ~361 launches = ~4 API calls (100 per page)
  - Then fetches full details for each launch: **+361 API calls** (for video URLs)
  - **Total: ~365 API calls per run**

- **Previous Launches:** 
  - **DISABLED** (using `--upcoming-only` flag)
  - **Total: 0 API calls**

**Total per cron run:** ~365 API calls
**Total per day:** ~365 calls/hour × 24 hours = **~8,760 API calls/day**

**Code Location:** `api/scripts/sync_upcoming_previous_launches.js`

---

#### 2. **check_new_launches.js** (Every 10 minutes)
**Schedule:** Every 10 minutes (`*/10 * * * *`)

**Space Devs API Calls:**
- Fetches upcoming launches: ~1-2 API calls
- For each new launch, fetches full details: ~1 API call per new launch
- **Typical: 2-5 API calls per run** (most launches already exist)

**Total per cron run:** ~2-5 API calls
**Total per day:** ~3 calls/run × 144 runs/day = **~432 API calls/day**

**Note:** This script may not be configured if you're using the main sync script.

---

## 📈 Total API Calls Summary

### **Per Day Estimates:**

| Source | API Calls/Day | Notes |
|--------|---------------|-------|
| **Cron Job (Hourly Sync)** | ~8,760 | Main sync (upcoming only) |
| **Cron Job (10-min Check)** | ~432 | Quick check (if configured) |
| **Website Cache Refresh** | ~4 | Once per day if cache expired |
| **Missing Launch Fallback** | ~0-10 | Only for new launches |
| **Astronauts Requests** | ~0-50 | Per user request |
| **TOTAL** | **~9,246 calls/day** | (with hourly cron) |

### **Per Hour Estimates:**

| Source | API Calls/Hour |
|--------|----------------|
| **Cron Job (Hourly)** | ~365 |
| **Cron Job (10-min)** | ~18 |
| **Website Requests** | ~0-1 |
| **TOTAL** | **~383 calls/hour** |

---

## ⚠️ Rate Limit Considerations

### **Space Devs API Rate Limits:**
- **Free Tier:** 15 calls/hour
- **Advanced Supporter:** 210 calls/hour

### **Current Usage:**
- **~383 calls/hour** (with hourly cron)
- **Exceeds both tiers!** ⚠️

### **Problem:**
The hourly cron job makes **~365 API calls per run**, which:
- ❌ Exceeds free tier (15/hour) by **24x**
- ❌ Exceeds Advanced Supporter tier (210/hour) by **1.7x**

---

## 🔧 Recommendations

### **1. Reduce Cron Frequency**
Instead of every hour, run less frequently:
- **Every 4 hours:** ~91 calls/hour ✅ (within Advanced Supporter limit)
- **Every 6 hours:** ~61 calls/hour ✅ (within Advanced Supporter limit)
- **Twice daily:** ~30 calls/hour ✅ (within Advanced Supporter limit)

### **2. Optimize Video URL Fetching**
Currently fetches full details for EVERY launch just to get video URLs:
- **Current:** 361 launches × 1 API call = 361 calls
- **Optimized:** Cache which launches already have video URLs
- **Potential savings:** ~300 calls per sync

### **3. Incremental Sync**
Only sync launches that have changed:
- Track `last_updated` timestamps
- Only fetch changed launches
- **Potential savings:** ~90% reduction

### **4. Remove Redundant Cron Jobs**
If using hourly sync, disable 10-minute check:
- Saves ~432 calls/day

---

## 📝 Current Configuration

### **Cron Jobs:**
```bash
# Hourly sync (upcoming only)
0 * * * * node scripts/sync_upcoming_previous_launches.js --upcoming-only

# 10-minute check (if configured)
*/10 * * * * node scripts/check_new_launches.js
```

### **Website API Calls:**
- Most requests: **0 external API calls** (uses database)
- Cache refresh: **~4 calls** (once per day)
- Missing launch: **1 call** (rare)

---

## ✅ Summary

**Website User Requests:**
- **Most requests:** 0 external API calls ✅
- **Cache refresh:** ~4 calls/day ✅
- **Missing launches:** ~0-10 calls/day ✅

**Cron Jobs:**
- **Hourly sync:** ~8,760 calls/day ⚠️ (exceeds rate limits)
- **10-min check:** ~432 calls/day (if configured)

**Total:** ~9,246 external API calls/day

**Recommendation:** Reduce cron frequency or optimize sync to stay within rate limits.

