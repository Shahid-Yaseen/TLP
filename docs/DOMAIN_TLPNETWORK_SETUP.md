# Connecting TLPNetwork.com to Your Server

This guide walks you through connecting the domain **TLPNetwork.com** (and **www.TLPNetwork.com**) to your TLP server so the site is served at `https://TLPNetwork.com`.

---

## Overview

1. **DNS** – Point the domain to your server IP  
2. **Nginx** – Already configured for TLPNetwork.com in `deployment/nginx.conf`  
3. **SSL** – Get a free certificate with Let's Encrypt (Certbot)  
4. **Environment** – Set CORS and API URL for the domain  

---

## 1. DNS Configuration

In your domain registrar (where you bought TLPNetwork.com), add these records.

### A records (required)

| Type | Name/Host | Value        | TTL  |
|------|-----------|--------------|------|
| A    | `@`       | 143.110.146.177 | 300  |
| A    | `www`     | 143.110.146.177 | 300  |

- **@** = TLPNetwork.com  
- **www** = www.TLPNetwork.com  
- **143.110.146.177** = your server IP (replace if different)

### Optional: CNAME for www

If your registrar prefers CNAME for www:

| Type  | Name | Value          |
|-------|------|----------------|
| CNAME | www  | TLPNetwork.com |

Then ensure the root `@` has an A record to `143.110.146.177`.

### After saving DNS

- Propagation can take 5–60 minutes (up to 48 hours in rare cases).  
- Check: `dig TLPNetwork.com` or `nslookup TLPNetwork.com` – the answer should be your server IP.

---

## 2. Nginx Configuration on the Server

The repo’s `deployment/nginx.conf` is already set for TLPNetwork.com and www.

### Copy config to the server

```bash
# On your local machine (from project root)
scp deployment/nginx.conf root@143.110.146.177:/etc/nginx/sites-available/tlp
```

### On the server

```bash
# Enable the site if not already
sudo ln -sf /etc/nginx/sites-available/tlp /etc/nginx/sites-enabled/tlp

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

At this point the site should be reachable at:

- `http://TLPNetwork.com`
- `http://www.TLPNetwork.com`
- `http://143.110.146.177`

---

## 3. SSL with Let's Encrypt (HTTPS)

### Install Certbot (if not installed)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### Prepare for ACME challenge

```bash
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot
```

### Get certificate for TLPNetwork.com and www

```bash
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d TLPNetwork.com \
  -d www.TLPNetwork.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email
```

Use a real email for renewal notices.

Certificates will be at:

- `/etc/letsencrypt/live/TLPNetwork.com/fullchain.pem`
- `/etc/letsencrypt/live/TLPNetwork.com/privkey.pem`

### Enable HTTPS in Nginx

1. Open the config:

   ```bash
   sudo nano /etc/nginx/sites-available/tlp
   ```

2. **Uncomment** the entire HTTPS `server { ... }` block at the bottom (the one for `TLPNetwork.com` and `www.TLPNetwork.com`).

3. **Optional:** Redirect HTTP to HTTPS for the domain. Find this block:

   ```nginx
   # if ($host ~* ^(TLPNetwork\.com|www\.TLPNetwork\.com)$) {
   #     return 301 https://$host$request_uri;
   # }
   ```

   Uncomment those 3 lines so HTTP requests to the domain go to HTTPS.

4. Test and reload:

   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Auto-renewal

```bash
# Test renewal
sudo certbot renew --dry-run
```

Certbot installs a cron/systemd timer; certificates will renew automatically.

---

## 4. Environment Variables for the Domain

### Backend API (`api/.env`)

Allow the domain in CORS and (if needed) trust the forwarded host/proto:

```bash
# CORS – allow the domain
CORS_ORIGIN=https://TLPNetwork.com,https://www.TLPNetwork.com,http://TLPNetwork.com,http://www.TLPNetwork.com,http://143.110.146.177

# If you use a reverse proxy (Nginx), trust X-Forwarded-* headers
# (Your Express app may need app.set('trust proxy', 1) – check api app.js/server file)
```

Restart the API after changing `.env` (e.g. `pm2 restart tlp-api` or your process manager).

### Frontend (`web/`)

If the API is served under the same domain (e.g. `https://TLPNetwork.com/api`), you can use relative URLs so no build change is needed:

- Either leave `VITE_API_URL` unset, or  
- Set `VITE_API_URL=` (empty) in `.env.production`.

Then rebuild and deploy:

```bash
cd web
npm run build
# Deploy dist/ to /var/www/tlp-web (or your deploy script)
```

### Admin (`api/admin/`)

Set the API URL to the same domain:

```bash
# In api/admin/.env or build env
REACT_APP_API_URL=https://TLPNetwork.com
```

Rebuild admin and deploy to `/var/www/tlp-admin` (or your path).

---

## 5. Verify

- **Main site:** https://TLPNetwork.com  
- **WWW:** https://www.TLPNetwork.com  
- **Admin:** https://TLPNetwork.com/admin  
- **API:** https://TLPNetwork.com/api/health (or `/api/news`, etc.)

Check that:

- SSL is valid (padlock in browser).  
- API and admin load and work (login, data).  
- No mixed-content warnings (all assets/API over HTTPS).

---

## 6. Quick Reference

| Item            | Value / Path |
|-----------------|--------------|
| Domain          | TLPNetwork.com, www.TLPNetwork.com |
| Server IP       | 143.110.146.177 (replace if different) |
| Nginx config    | `/etc/nginx/sites-available/tlp` |
| Web root        | `/var/www/tlp-web` |
| Admin root      | `/var/www/tlp-admin` |
| Cert path       | `/etc/letsencrypt/live/TLPNetwork.com/` |
| Certbot webroot | `/var/www/certbot` |

---

## Troubleshooting

- **502 Bad Gateway** – API not running; check `pm2 list` or `systemctl` and that the app listens on the port Nginx proxies to (e.g. 3007).  
- **Certificate errors** – Ensure DNS for TLPNetwork.com and www points to this server before running certbot.  
- **CORS errors** – Confirm `CORS_ORIGIN` in `api/.env` includes `https://TLPNetwork.com` and `https://www.TLPNetwork.com` and restart the API.  
- **Admin/API 404** – Confirm Nginx `location /api` and `location /admin` match your deployment and that files exist in `/var/www/tlp-admin` and the API is on the correct upstream port.

After completing these steps, TLPNetwork.com will be connected to your server with HTTPS.
