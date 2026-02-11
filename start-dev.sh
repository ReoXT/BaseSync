#!/bin/bash

echo "🚀 Starting BaseSync Development Environment..."
echo ""

# Check if .env.client exists
if [ ! -f .env.client ]; then
  echo "❌ Error: .env.client not found"
  echo "Creating .env.client..."
  cat > .env.client << 'EOF'
# BaseSync - CLIENT Environment Variables
# All client-side env vars must start with REACT_APP_

# API URL - Points to the Wasp backend server
REACT_APP_API_URL=http://localhost:3001
EOF
  echo "✅ Created .env.client"
fi

# Check if .env.server exists
if [ ! -f .env.server ]; then
  echo "❌ Error: .env.server not found"
  echo "Please copy .env.server.example to .env.server and configure it"
  exit 1
fi

echo "✅ Environment files found"
echo ""

# Clean and recompile
echo "🧹 Cleaning previous build..."
wasp clean

echo ""
echo "🔨 Compiling Wasp project..."
wasp compile

if [ $? -ne 0 ]; then
  echo "❌ Compilation failed"
  exit 1
fi

echo ""
echo "✅ Compilation successful"
echo ""
echo "📝 To start the app, run these commands in separate terminals:"
echo ""
echo "   Terminal 1: wasp start db    # Starts PostgreSQL database"
echo "   Terminal 2: wasp start        # Starts web app (client + server)"
echo ""
echo "   The app will be available at: http://localhost:3000"
echo "   Backend API will be at: http://localhost:3001"
echo ""
