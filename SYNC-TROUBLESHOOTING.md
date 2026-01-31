# Sync Troubleshooting Guide

## Issue: Syncs Failing After Reauthentication

If your syncs are still failing even after refreshing and reauthenticating your Airtable and Google Sheets connections, follow these steps:

### Quick Fix Steps

1. **Navigate to the New Sync wizard** at `/sync/new`
2. **Look for the "Connection Diagnostics" section** at the top of the page
3. **Click "Run Diagnostics"** to check the status of both connections
4. **Review the diagnostic results:**
   - Check if "Needs Reauth" shows "Yes ❌" for either connection
   - Check if "Token Decryption" shows "Failed ❌" for either connection
   - Read any error messages displayed

5. **If either connection shows "Needs Reauth: Yes":**
   - Click the **"Clear 'Needs Reauth' Flags"** button
   - Try running your sync again

6. **If token decryption is failing:**
   - You need to fully reconnect that account (disconnect then reconnect)

### What the Diagnostics Check

The diagnostic tool checks:
- Whether connections exist in the database
- Whether the `needsReauth` flag is stuck to `true` (common issue)
- Whether tokens can be decrypted successfully
- Token expiry status
- Last refresh errors

### Common Causes

1. **needsReauth Flag Stuck**: After reauthenticating, the `needsReauth` flag in the database may not have been cleared properly. This causes syncs to fail immediately without attempting to refresh tokens.

2. **Encryption Key Mismatch**: If the `ENCRYPTION_KEY` in your `.env.server` file has changed, tokens cannot be decrypted.

3. **Stale Token Refresh Errors**: Old error messages in the database may be blocking syncs even though you've successfully reconnected.

### How to Use the Diagnostics Tool

```
1. Go to: http://localhost:3000/sync/new
2. Look at the top of the page for "Connection Diagnostics"
3. Click "Run Diagnostics"
4. Review the output for both Airtable and Google Sheets connections
5. If needed, click "Clear 'Needs Reauth' Flags"
6. Try your sync again
```

### Manual Database Fix (If Diagnostics Don't Work)

If the diagnostic tool doesn't help, you can manually reset the flags in the database:

```sql
-- Clear Airtable reauth flag
UPDATE "AirtableConnection"
SET "needsReauth" = false, "lastRefreshError" = NULL
WHERE "userId" = 'your-user-id';

-- Clear Google Sheets reauth flag
UPDATE "GoogleSheetsConnection"
SET "needsReauth" = false, "lastRefreshError" = NULL
WHERE "userId" = 'your-user-id';
```

### Still Having Issues?

Check the server console logs when you trigger a manual sync. Look for error messages like:

```
[TokenManager] ✗ Failed to refresh Airtable token: ...
[ManualSync] ✗ Sync execution failed: ...
[SyncJob] ✗ Failed to process config: ...
```

These will give you more specific information about what's failing.

### Files Added/Modified

**New Files:**
- `src/server/actions/diagnostics.ts` - Diagnostic actions
- `src/client/components/ConnectionDiagnostics.tsx` - UI component

**Modified Files:**
- `main.wasp` - Added diagnostic actions
- `src/client/pages/NewSyncPage.tsx` - Added diagnostics display

### Actions Available

The following Wasp actions have been added:

```typescript
// Run connection diagnostics
runConnectionDiagnostics()

// Clear reauth flags manually
clearReauthFlags()
```

Both can be called from the UI via the Connection Diagnostics component.
