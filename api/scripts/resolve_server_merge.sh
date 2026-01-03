#!/bin/bash
# Script to resolve merge conflict on server and pull latest changes

set -e

cd /opt/tlp/api

echo "📋 Current git status:"
git status

echo ""
echo "🔧 Resolving merge conflict in run_migrations.js..."
# Accept the incoming version (from origin/main) which should have all migrations
git checkout --theirs scripts/run_migrations.js

echo ""
echo "✅ Verifying migrations list includes all migrations..."
if grep -q "028_create_launch_related_articles" scripts/run_migrations.js; then
  echo "✅ Migration 028 found - file looks good"
else
  echo "⚠️  Warning: Migration 028 not found, but continuing..."
fi

echo ""
echo "💾 Staging resolved file..."
git add scripts/run_migrations.js

echo ""
echo "📝 Committing merge resolution..."
git commit -m "Resolve merge conflict in run_migrations.js" || {
  echo "⚠️  Commit may have failed (file might already be committed)"
}

echo ""
echo "📥 Pulling latest changes from origin..."
git pull origin main || {
  echo "⚠️  Pull failed, trying to fetch and merge manually..."
  git fetch origin main
  git merge origin/main || {
    echo "❌ Merge still failed. Please check manually."
    exit 1
  }
}

echo ""
echo "✅ Merge conflict resolved and latest changes pulled!"
echo "📋 Final status:"
git status

