#!/bin/bash
# Patch Wasp-generated rollup config to support circular dependencies
# This adds inlineDynamicImports to prevent Rollup from code-splitting

ROLLUP_CONFIG=".wasp/out/server/rollup.config.js"

if [ -f "$ROLLUP_CONFIG" ]; then
  # Check if already patched
  if grep -q "inlineDynamicImports" "$ROLLUP_CONFIG"; then
    echo "Rollup config already patched"
  else
    # Add inlineDynamicImports to output config
    sed -i.bak 's/sourcemap: true,/sourcemap: true,\n      inlineDynamicImports: true,/' "$ROLLUP_CONFIG"
    echo "✓ Patched rollup config to inline dynamic imports"
  fi
else
  echo "⚠ Rollup config not found - run 'wasp start' first"
fi
