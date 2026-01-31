#!/bin/bash
# Run diagnostic check on sync configurations

cd app

# Use Wasp's node environment to run the diagnostic
NODE_PATH="$(pwd)/node_modules" npx ts-node ../diagnose-sync.ts
