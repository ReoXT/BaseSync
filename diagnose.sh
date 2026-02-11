#!/bin/bash

echo "=== BaseSync Diagnostic Check ==="
echo ""

echo "1. Checking Wasp version..."
wasp version
echo ""

echo "2. Checking if .env.server exists..."
if [ -f .env.server ]; then
  echo "✓ .env.server found"
else
  echo "✗ .env.server missing"
fi
echo ""

echo "3. Checking database connection..."
if [ -f .wasp/out/db/schema.prisma ]; then
  echo "✓ Schema file exists"
else
  echo "✗ Schema file missing - run 'wasp compile' first"
fi
echo ""

echo "4. Running wasp clean and compile..."
wasp clean
wasp compile 2>&1 | tail -20
echo ""

echo "5. Checking for TypeScript errors in source..."
cd .wasp/out/sdk/wasp && npm run build 2>&1 | grep -i "error" || echo "✓ No TypeScript errors"
cd - > /dev/null
echo ""

echo "=== Diagnostic Complete ==="
echo "If you see errors above, please share them."
