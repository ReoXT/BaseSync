# Wasp Build Fix for Circular Dependencies

## Problem

The server has circular dependencies between:
- `src/server/middleware/usageLimits.ts` → `src/server/emails/notificationSender.ts` → `src/server/middleware/usageLimits.ts`
- `src/server/emails/notificationSender.ts` → `src/server/utils/usageTracker.ts` → `src/server/emails/notificationSender.ts`

This causes Rollup to try to code-split, but Wasp's default rollup config doesn't support multiple chunks, leading to:

```
RollupError: Invalid value for option "output.file" - when building multiple chunks,
the "output.dir" option must be used, not "output.file".
To inline dynamic imports, set the "inlineDynamicImports" option.
```

## Solution

The fix adds `inlineDynamicImports: true` to the Wasp-generated rollup config. Since Wasp regenerates this file, we have two options:

### Option 1: Automatic Patch (Recommended)

After running `wasp clean` or when the rollup config is regenerated, run:

```bash
./scripts/patch-rollup-config.sh
```

This script automatically patches the `.wasp/out/server/rollup.config.js` file.

### Option 2: Manual Patch

If you need to patch manually:

1. Open `.wasp/out/server/rollup.config.js`
2. Find the `output` config (around line 11-15)
3. Add `inlineDynamicImports: true,` after `sourcemap: true,`

```javascript
output: {
  file: outputFilePath,
  format: 'es',
  sourcemap: true,
  inlineDynamicImports: true,  // <-- Add this line
},
```

## When to Apply

Apply this fix:
- After running `wasp clean`
- When you see the "Invalid value for option output.file" error
- Before running `wasp start` for the first time after a clean build

## Long-term Fix

To make this permanent, consider:
1. Breaking the circular dependencies by restructuring the code
2. Or submitting a PR to Wasp to allow customization of rollup config
3. Or using Wasp's `configFn` if it supports rollup configuration in future versions
