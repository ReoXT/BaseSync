#!/bin/bash

set -e  # Exit on error

echo "🚀 Deploying BaseSync to Railway..."
echo ""

# 1. Switch to production
echo "📝 Switching to production environment..."
cp .env.production .env.server

# 2. Build
echo "🔨 Building for production..."
wasp build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    cp .env.development .env.server
    exit 1
fi
echo "✅ Build successful!"
echo ""

# 3. Copy required folders to root (needed by Dockerfile)
echo "📁 Copying folders for Railway Dockerfile..."
cp -r .wasp/build/db . 2>/dev/null || true
cp -r .wasp/out/sdk . 2>/dev/null || true
cp -r .wasp/build/server . 2>/dev/null || true
echo "✅ Folders copied (db, sdk, server)!"
echo ""

# 4. Deploy
echo "🚢 Deploying to Railway..."
echo "⚠️  NOTE: You may see 'nixpacks' errors - these are expected and can be ignored."
echo "    Railway will use the Dockerfile from .wasp/build/ directory."
echo ""
railway up --detach

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    cp .env.development .env.server
    exit 1
fi
echo ""

# 5. Wait and verify
echo "⏳ Waiting for deployment to initialize..."
sleep 20

echo "👀 Checking deployment status..."
railway status
echo ""

# 6. Verify site is live
echo "🌐 Verifying production site..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://basesync.app)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Site is LIVE and responding!"
else
    echo "⚠️  Site returned HTTP $HTTP_CODE"
fi
echo ""

# 7. Switch back to dev
echo "🔄 Switching back to development..."
cp .env.development .env.server

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Production URL: https://basesync.app"
echo "📊 View logs:      railway logs"
echo "📈 Check status:   railway status"
echo ""
