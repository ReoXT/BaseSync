#!/bin/bash
set -e

echo "🎨 Deploying BaseSync Client (Frontend) to Railway..."
echo ""

# Step 1: Switch to production environment
echo "📝 Step 1/6: Switching to production environment..."
cp .env.production .env.server
echo "✓ Using production config"
echo ""

# Step 2: Build the Wasp project
echo "🔨 Step 2/6: Building Wasp project..."
wasp build
echo "✓ Wasp build complete"
echo ""

# Step 3: Navigate to web-app and install dependencies
echo "📦 Step 3/6: Installing client dependencies..."
cd .wasp/build/web-app
npm install
echo "✓ Dependencies installed"
echo ""

# Step 4: Build the client (creates build/ folder)
echo "⚛️  Step 4/6: Building React client..."
# Export REACT_APP_API_URL for Vite build
export REACT_APP_API_URL=https://basesync-server-production.up.railway.app
npm run build
echo "✓ Client build complete (build/ folder created)"
echo ""

# Step 5: Copy build folder to client-dist for deployment
echo "📁 Step 5/6: Preparing deployment package..."
cd ../../..
rm -rf client-dist
cp -r .wasp/build/web-app/build client-dist

# Create package.json for serve
cat > client-dist/package.json << 'EOF'
{
  "name": "basesync-client",
  "version": "1.0.0",
  "scripts": {
    "start": "serve -s . -l 8080"
  },
  "dependencies": {
    "serve": "^14.2.0"
  }
}
EOF

# Create nixpacks.toml for explicit build configuration
cat > client-dist/nixpacks.toml << 'EOF'
[phases.setup]
nixPkgs = ["nodejs"]

[phases.install]
cmds = ["npm install"]

[start]
cmd = "npx serve -s . -l ${PORT:-8080}"
EOF

echo "✓ Deployment package ready (client-dist/ with static server config)"
echo ""

# Step 6: Deploy to Railway BaseSync-client service from the dist folder
echo "🚀 Step 6/6: Deploying to Railway (BaseSync-client service)..."
railway up --service BaseSync-client --path-as-root ./client-dist --detach
echo "✓ Client deployed to Railway!"
echo ""

# Switch back to development environment
echo "🔄 Switching back to development environment..."
cp .env.development .env.server
echo "✓ Back to development mode"
echo ""

echo "✅ Client deployment complete!"
echo ""
echo "🌐 Frontend URL: https://basesync.app"
echo "📊 Check status: railway logs --service BaseSync-client"
