# Category Pages - Real Data Implementation

## Summary

Updated all category-specific news pages to:
1. ✅ **Show real data from backend** (no dummy data fallback when API returns empty)
2. ✅ **Fetch categories from backend** for navigation bars
3. ✅ **Handle empty states gracefully** ("No articles" message instead of dummy content)
4. ✅ **Work correctly on server** (API_URL configuration supports both dev and production)

---

## Files Changed

### 1. **`web/src/pages/CategoryNews.jsx`**
   - Used by: `/news/in-space`, `/news/technology`, `/news/military`, `/news/finance`
   
   **Changes:**
   - ✅ Fetches categories from `GET /api/news/categories` for section nav
   - ✅ Removed dummy data fallback when API returns empty array (real state)
   - ✅ Shows "No articles found" message when category has no articles
   - ✅ Only shows dummy data on actual API errors (network/server failures)
   - ✅ Uses real article data from `GET /api/news?category={slug}&status=published`

### 2. **`web/src/pages/LaunchNews.jsx`**
   - Used by: `/launches/news`
   
   **Changes:**
   - ✅ Fetches categories from `GET /api/news/categories` for section nav
   - ✅ Removed dummy data fallback when API returns empty array
   - ✅ Shows "No articles found" message when no launch articles
   - ✅ Uses real article data from `GET /api/news?category=launch&status=published`

### 3. **`web/src/pages/News.jsx`** (already updated earlier)
   - ✅ Fetches categories from backend for main nav
   - ✅ Fetches trending topics from backend for trending bar

---

## Behavior Changes

### Before:
- Pages showed **dummy/fallback data** when API returned empty array
- Categories were **hardcoded** in frontend
- Trending topics were **hardcoded** in frontend

### After:
- Pages show **real data** when articles exist
- Pages show **"No articles found"** when category is empty (not dummy data)
- Categories come from **backend** (`GET /api/news/categories`)
- Trending topics come from **backend** (`GET /api/news/trending-topics`)
- Dummy data only shown on **actual API errors** (network/server failures)

---

## API Endpoints Used

| Page | API Calls |
|------|-----------|
| `/news/in-space` | `GET /api/news/categories`<br>`GET /api/news?category=in-space&status=published`<br>`GET /api/news/featured` |
| `/news/technology` | `GET /api/news/categories`<br>`GET /api/news?category=technology&status=published`<br>`GET /api/news/featured` |
| `/news/military` | `GET /api/news/categories`<br>`GET /api/news?category=military&status=published`<br>`GET /api/news/featured` |
| `/news/finance` | `GET /api/news/categories`<br>`GET /api/news?category=finance&status=published`<br>`GET /api/news/featured` |
| `/launches/news` | `GET /api/news/categories`<br>`GET /api/news?category=launch&status=published`<br>`GET /api/news/featured` |
| `/news` (main) | `GET /api/news/categories`<br>`GET /api/news/trending-topics`<br>`GET /api/news` (with filters) |

---

## Server Deployment

### Environment Variables

**Frontend (`web/.env` or `.env.production`):**
```bash
# Optional - if API is on different domain/port
VITE_API_URL=http://your-server-ip:3007
# OR leave unset to use relative URLs (if API and frontend on same domain)
```

**Backend (`api/.env`):**
```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=tlp_db
PORT=3007
NODE_ENV=production
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
CORS_ORIGIN=http://your-frontend-domain:5173
```

### Database Migrations

Run migrations to ensure categories and trending topics exist:

```bash
cd api
node scripts/run_migrations.js
```

This runs:
- `029_seed_news_categories.sql` - Creates NEWS, LAUNCH, IN SPACE, TECHNOLOGY, MILITARY, FINANCE
- `030_seed_trending_topics.sql` - Creates TRENDING, SPACEX, ARTEMIS 2, MARS SAMPLE RETURN, DARPA LUNAR ORBITER

### Verify Backend

```bash
# Check categories exist
curl http://your-server:3007/api/news/categories

# Check trending topics exist
curl http://your-server:3007/api/news/trending-topics

# Check articles by category
curl "http://your-server:3007/api/news?category=in-space&status=published"
```

---

## Testing Checklist

### Local Development:
- [ ] Categories appear in nav bar (from backend)
- [ ] Trending topics appear in bar (from backend)
- [ ] Category pages show real articles if they exist
- [ ] Category pages show "No articles" if category is empty (not dummy data)
- [ ] Launch news page shows real launch articles

### Server Deployment:
- [ ] API server running on correct port
- [ ] Frontend can connect to API (check browser console for errors)
- [ ] Categories load from backend
- [ ] Trending topics load from backend
- [ ] Category pages fetch articles correctly
- [ ] Empty states show "No articles" (not dummy data)

---

## Next Steps

1. **Assign categories to existing articles:**
   - Admin → Articles → Edit each article
   - Set Category dropdown
   - Ensure Published is ON
   - Save

2. **Verify category pages show real data:**
   - Visit `/news/in-space`, `/news/technology`, etc.
   - Should see articles with assigned categories
   - Or "No articles found" if category is empty

3. **Server deployment:**
   - Set `VITE_API_URL` in frontend `.env` (or use relative URLs)
   - Run migrations on server database
   - Verify API endpoints return data
   - Test category pages on server

---

## Notes

- **Dummy data is only used on API errors** (network failures, server down, etc.)
- **Empty arrays from API = real state** (no articles in category) → shows "No articles" message
- **Categories and trending topics** are fetched from backend on page load
- **API_URL configuration** automatically handles dev vs production environments
