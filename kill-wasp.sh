#!/bin/bash

echo "🔴 Killing all Wasp development processes..."
echo ""

# Kill Wasp processes (except language server)
echo "1. Stopping Wasp dev servers..."
pkill -f "wasp start" 2>/dev/null
echo "   ✓ Wasp dev servers stopped"

# Kill Node.js processes on ports 3000 and 3001
echo "2. Freeing ports 3000 and 3001..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
echo "   ✓ Ports freed"

# Kill local PostgreSQL on port 5432 (if running via wasp start db)
echo "3. Stopping database..."
lsof -ti:5432 | xargs kill -9 2>/dev/null
echo "   ✓ Database stopped"

# Kill any remaining node processes in the BaseSync directory
echo "4. Cleaning up remaining processes..."
ps aux | grep "node.*BaseSync" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null
echo "   ✓ Cleanup complete"

echo ""
echo "✅ All Wasp development processes have been killed"
echo ""
echo "Note: The wasp language server (waspls) is still running - this is normal."
echo "It provides IDE support and doesn't affect development."
echo ""
echo "To restart development:"
echo "  Terminal 1: wasp start db"
echo "  Terminal 2: wasp start"
echo ""
