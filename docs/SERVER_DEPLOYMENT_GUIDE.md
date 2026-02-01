# Server Deployment Guide

This guide covers deploying the TLP application to a production server, ensuring categories and trending topics work correctly.

**Connecting the domain TLPNetwork.com?** See **[DOMAIN_TLPNETWORK_SETUP.md](./DOMAIN_TLPNETWORK_SETUP.md)** for DNS, Nginx, SSL (Let's Encrypt), and environment setup.

---

## 1. **Environment Variables**

### Frontend (`web/`)

Create `.env` or `.env.production` in the `web/` directory:

```bash
# API URL - use your server's API endpoint
VITE_API_URL=http://your-server-ip:3007
# OR if API is on same domain as frontend:
# VITE_API_URL=/api
# OR leave unset to use relative URLs (recommended if API and frontend are on same domain)
```

**Note:** The `web/src/config/api.js` automatically:
- Uses `VITE_API_URL` if set
- Falls back to `http://localhost:3007` for local development
- Uses relative URLs (empty string) if `VITE_API_URL` is not set and not on localhost (good for same-domain deployment)

### Backend (`api/`)

Create `.env` in the `api/` directory:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=tlp_db

# Server
PORT=3007
NODE_ENV=production

# JWT Secrets
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

# CORS (adjust for your frontend domain)
CORS_ORIGIN=http://your-frontend-domain:5173,http://your-server-ip:5173
```

---

## 2. **Database Setup**

### Run Migrations

```bash
cd api
node scripts/run_migrations.js
```

This will:
- Create all tables
- Seed required categories (NEWS, LAUNCH, IN SPACE, TECHNOLOGY, MILITARY, FINANCE) via `029_seed_news_categories.sql`
- Seed default trending topics (TRENDING, SPACEX, ARTEMIS 2, etc.) via `030_seed_trending_topics.sql`

### Verify Categories and Trending Topics

```bash
# Check categories
curl http://localhost:3007/api/news/categories

# Check trending topics
curl http://localhost:3007/api/news/trending-topics
```

---

## 3. **Backend API Server**

### Start API Server

```bash
cd api
npm install
npm start
# OR for development with auto-reload:
npm run dev
```

The API should be accessible at `http://your-server-ip:3007`

### Verify API Endpoints

```bash
# Health check
curl http://localhost:3007/health

# Categories (should return 6 categories)
curl http://localhost:3007/api/news/categories

# Trending topics (should return 5 topics)
curl http://localhost:3007/api/news/trending-topics

# News articles (should return published articles)
curl http://localhost:3007/api/news?status=published&limit=5
```

---

## 4. **Frontend Build and Deployment**

### Build for Production

```bash
cd web
npm install
npm run build
```

This creates a `dist/` directory with production-ready files.

### Serve Frontend

**Option 1: Using a web server (nginx, Apache, etc.)**

Point your web server to the `web/dist/` directory.

**Option 2: Using Node.js (express/serve)**

```bash
cd web
npm install -g serve
serve -s dist -l 5173
```

**Option 3: Using Vite preview**

```bash
cd web
npm run preview
```

---

## 5. **Category Pages Verification**

After deployment, verify these URLs work and show real data (or "No articles" if empty):

- `http://your-frontend/news/in-space`
- `http://your-frontend/news/technology`
- `http://your-frontend/news/military`
- `http://your-frontend/news/finance`
- `http://your-frontend/launches/news`

**Expected behavior:**
- ✅ If articles exist in that category → shows real articles
- ✅ If no articles in category → shows "No articles found" message (not dummy data)
- ✅ Categories in nav bar come from backend (`GET /api/news/categories`)
- ✅ Trending topics bar comes from backend (`GET /api/news/trending-topics`)

---

## 6. **Assign Categories to Articles**

To populate category pages with real data:

1. **Admin Panel:** `http://your-server-ip:3001` (or your admin URL)
2. Login as admin
3. Go to **Articles** → Edit each article
4. Set **Category** dropdown (LAUNCH, IN SPACE, TECHNOLOGY, MILITARY, FINANCE)
5. Ensure **Published** is ON
6. Save

After assigning categories, the category pages will show those articles.

---

## 7. **Troubleshooting**

### Categories/Trending Topics Not Showing

**Check backend:**
```bash
# Verify categories exist
curl http://your-server-ip:3007/api/news/categories

# Verify trending topics exist
curl http://your-server-ip:3007/api/news/trending-topics

# If empty, run migrations again
cd api && node scripts/run_migrations.js
```

### Frontend Can't Connect to API

**Check:**
1. API server is running on correct port
2. `VITE_API_URL` in frontend `.env` points to correct API URL
3. CORS is configured in backend to allow frontend domain
4. Firewall allows connections on API port (3007)

### Articles Not Showing on Category Pages

**Check:**
1. Articles are **Published** (status = 'published')
2. Articles have **Category** assigned (category_id is not null)
3. Category slug matches (e.g., "In Space" → slug "in-space")
4. API returns articles: `curl "http://your-api/api/news?category=in-space&status=published"`

---

## 8. **Production Checklist**

- [ ] Database migrations run (`029_seed_news_categories.sql`, `030_seed_trending_topics.sql`)
- [ ] Categories exist: `GET /api/news/categories` returns 6 categories
- [ ] Trending topics exist: `GET /api/news/trending-topics` returns 5 topics
- [ ] Frontend `VITE_API_URL` set correctly (or using relative URLs)
- [ ] Backend CORS allows frontend domain
- [ ] Articles have categories assigned in admin panel
- [ ] Category pages show real data or "No articles" (not dummy data)
- [ ] Trending bar shows topics from backend

---

## 9. **API Endpoints Summary**

| Endpoint | Purpose | Auth Required |
|----------|---------|---------------|
| `GET /api/news/categories` | List all categories | No |
| `GET /api/news/trending-topics` | List active trending topics | No |
| `GET /api/news?category={slug}` | Get articles by category | No (public) / Yes (admin sees all) |
| `GET /api/news/featured` | Get featured article | No |
| `GET /api/news/trending` | Get trending articles | No |
| `GET /api/news?is_interview=true` | Get interview articles | No |

All category pages use these endpoints to fetch real data from the backend.
