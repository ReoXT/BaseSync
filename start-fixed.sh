#!/bin/bash

echo "🚀 Starting BaseSync with automatic rollup fix..."
echo ""

# Step 1: Compile
echo "1. Compiling Wasp project..."
wasp compile

if [ $? -ne 0 ]; then
  echo "❌ Compilation failed"
  exit 1
fi

echo "✅ Compilation successful"
echo ""

# Step 2: Fix rollup config
echo "2. Applying rollup.config.js fix for circular dependencies..."
ROLLUP_CONFIG=".wasp/out/server/rollup.config.js"

if [ ! -f "$ROLLUP_CONFIG" ]; then
  echo "❌ Rollup config not found"
  exit 1
fi

# Add inlineDynamicImports option
sed -i.bak 's/format: '\''es'\'',/format: '\''es'\'',\n      inlineDynamicImports: true,/' "$ROLLUP_CONFIG"

echo "✅ Rollup config fixed"
echo ""

# Step 3: Start wasp
echo "3. Starting Wasp..."
echo ""
echo "📝 The app will start on:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop"
echo ""

wasp start
