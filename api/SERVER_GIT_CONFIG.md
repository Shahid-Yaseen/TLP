# Set Git Config on Server

Before you can commit, you need to set git user info on the server.

## Quick Setup

Run these commands on your server:

```bash
# Set git config (use your actual email/name or generic server info)
git config user.email "server@tlp-production.com"
git config user.name "TLP Server"

# Or set globally for all repos
git config --global user.email "server@tlp-production.com"
git config --global user.name "TLP Server"
```

## Then Resolve Conflict

```bash
cd /opt/tlp/api
git checkout --theirs scripts/run_migrations.js
git add scripts/run_migrations.js
git commit -m "Resolve merge conflict"
git pull origin main
```

## All-in-One Command

```bash
cd /opt/tlp/api && \
git config user.email "server@tlp-production.com" && \
git config user.name "TLP Server" && \
git checkout --theirs scripts/run_migrations.js && \
git add scripts/run_migrations.js && \
git commit -m "Resolve merge conflict" && \
git pull origin main
```

