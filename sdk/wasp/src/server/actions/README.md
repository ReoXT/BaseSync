# Manual Sync Actions

This directory contains actions for triggering manual syncs in BaseSync.

## Actions

### `triggerManualSync`

Triggers an immediate manual sync for a specific sync configuration.

**Parameters:**
```typescript
{
  syncConfigId: string  // Required: The sync configuration ID to execute
}
```

**Returns:**
```typescript
{
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED'
  message: string
  details: {
    added: number         // Total records added
    updated: number       // Total records updated
    deleted: number       // Total records deleted
    total: number         // Total records processed
    errorCount: number    // Number of errors encountered
    duration: number      // Sync duration in milliseconds
    direction: string     // Sync direction used
    startedAt: string     // ISO timestamp
    completedAt: string   // ISO timestamp
  }
  errors?: Array<{
    message: string
    type?: string
    recordId?: string
  }>
  warnings?: string[]
  conflicts?: {          // Only present for bidirectional syncs
    total: number
    airtableWins: number
    sheetsWins: number
    deleted: number
    skipped: number
  }
}
```

### `runInitialSync`

Runs an initial bulk sync for first-time setup or complete resync.

**Parameters:**
```typescript
{
  syncConfigId: string   // Required: The sync configuration ID to execute
  dryRun?: boolean      // Optional: Preview changes without applying them
}
```

**Returns:** Same as `triggerManualSync`

## Edge Cases Handled

Both actions comprehensively handle the following edge cases:

### Authentication & Authorization
- ✅ User doesn't own the sync config (403 Forbidden)
- ✅ Sync config doesn't exist (404 Not Found)
- ✅ Missing Airtable/Google connection (400 Bad Request)
- ✅ Token decryption failures (500 Internal Server Error)
- ✅ Expired tokens (automatic refresh attempted by underlying clients)

### Validation
- ✅ Missing required parameters (400 Bad Request)
- ✅ Invalid parameter types (400 Bad Request)
- ✅ Inactive sync configurations (400 Bad Request)
- ✅ Invalid field mappings format (400 Bad Request)
- ✅ Invalid column indices in field mappings (400 Bad Request)

### Concurrency & Race Conditions
- ✅ Concurrent sync execution prevention (409 Conflict)
  - Checks for running syncs within last 5 minutes
  - Prevents multiple simultaneous syncs for same config

### Data Integrity
- ✅ Invalid sync direction in database (500 Internal Server Error)
- ✅ Malformed JSON in field mappings (400 Bad Request)
- ✅ Network failures during sync (partial results captured)
- ✅ Rate limiting from external APIs (retries with exponential backoff)

### Operational
- ✅ Large datasets (chunked processing via batch sizes)
- ✅ Partial sync failures (captures both successes and errors)
- ✅ Metadata update failures (non-fatal warnings)
- ✅ Dry run mode (preview without changes for `runInitialSync`)

### Initial Sync Specific
- ✅ First-time sync with no prior state
- ✅ Re-sync detection and warning
- ✅ Automatic activation of inactive configs
- ✅ More aggressive settings (create missing linked records, delete extras)
- ✅ Higher retry counts for reliability

## Usage Examples

### From Client Component (React)

```typescript
import { triggerManualSync, runInitialSync } from 'wasp/client/operations';
import { useState } from 'react';

function SyncDashboard({ syncConfigId }) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);

  const handleManualSync = async () => {
    setSyncing(true);
    setResult(null);

    try {
      const syncResult = await triggerManualSync({
        syncConfigId
      });

      setResult(syncResult);

      if (syncResult.status === 'SUCCESS') {
        console.log('Sync completed successfully!');
        console.log(`Added: ${syncResult.details.added}`);
        console.log(`Updated: ${syncResult.details.updated}`);
      } else if (syncResult.status === 'PARTIAL') {
        console.warn('Sync completed with errors');
        console.log('Errors:', syncResult.errors);
      } else {
        console.error('Sync failed');
      }
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      // Error is already an HTTP error from the server
    } finally {
      setSyncing(false);
    }
  };

  const handleInitialSync = async (dryRun = false) => {
    setSyncing(true);
    setResult(null);

    try {
      const syncResult = await runInitialSync({
        syncConfigId,
        dryRun
      });

      setResult(syncResult);

      if (dryRun) {
        console.log('Dry run completed - preview:');
        console.log(`Would add: ${syncResult.details.added}`);
        console.log(`Would update: ${syncResult.details.updated}`);
        console.log(`Would delete: ${syncResult.details.deleted}`);
      }
    } catch (error) {
      console.error('Failed to run initial sync:', error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleManualSync}
        disabled={syncing}
      >
        {syncing ? 'Syncing...' : 'Trigger Manual Sync'}
      </button>

      <button
        onClick={() => handleInitialSync(true)}
        disabled={syncing}
      >
        Preview Initial Sync (Dry Run)
      </button>

      <button
        onClick={() => handleInitialSync(false)}
        disabled={syncing}
      >
        Run Initial Sync
      </button>

      {result && (
        <div>
          <h3>Sync Result: {result.status}</h3>
          <p>{result.message}</p>
          <ul>
            <li>Added: {result.details.added}</li>
            <li>Updated: {result.details.updated}</li>
            <li>Deleted: {result.details.deleted}</li>
            <li>Duration: {result.details.duration}ms</li>
          </ul>

          {result.warnings && result.warnings.length > 0 && (
            <div>
              <h4>Warnings:</h4>
              <ul>
                {result.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {result.errors && result.errors.length > 0 && (
            <div>
              <h4>Errors:</h4>
              <ul>
                {result.errors.map((error, i) => (
                  <li key={i}>
                    {error.message}
                    {error.recordId && ` (Record: ${error.recordId})`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.conflicts && (
            <div>
              <h4>Conflicts Resolved:</h4>
              <ul>
                <li>Total: {result.conflicts.total}</li>
                <li>Airtable Wins: {result.conflicts.airtableWins}</li>
                <li>Sheets Wins: {result.conflicts.sheetsWins}</li>
                <li>Deleted: {result.conflicts.deleted}</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Error Handling

All errors thrown by these actions are `HttpError` instances with appropriate status codes:

```typescript
import { HttpError } from 'wasp/server';

try {
  await triggerManualSync({ syncConfigId });
} catch (error) {
  if (error instanceof HttpError) {
    switch (error.statusCode) {
      case 400:
        // Bad request - invalid input or inactive config
        console.error('Invalid request:', error.message);
        break;
      case 403:
        // Forbidden - user doesn't own this config
        console.error('Access denied:', error.message);
        break;
      case 404:
        // Not found - sync config doesn't exist
        console.error('Config not found:', error.message);
        break;
      case 409:
        // Conflict - sync already in progress
        console.error('Sync in progress:', error.message);
        break;
      case 500:
        // Server error - token decryption, invalid direction, etc.
        console.error('Server error:', error.message);
        break;
      default:
        console.error('Unexpected error:', error.message);
    }
  }
}
```

## Differences: Manual Sync vs Initial Sync

| Feature | `triggerManualSync` | `runInitialSync` |
|---------|-------------------|------------------|
| **Purpose** | Regular incremental syncs | First-time or complete resync |
| **Delete Extra Records** | No | Yes |
| **Create Missing Linked Records** | No (except bidirectional) | Yes |
| **Retry Count** | 3 | 5 (higher for reliability) |
| **Validation Mode** | Lenient | Strict (Sheets→Airtable) |
| **Dry Run Support** | No | Yes |
| **Activates Inactive Configs** | No (throws error) | Yes (with warning) |
| **Sync Log Trigger** | 'manual' | 'initial' |

## Database Updates

Both actions automatically:
1. Update `SyncConfig.lastSyncAt` and `SyncConfig.lastSyncStatus`
2. Create a `SyncLog` entry with:
   - Sync status (SUCCESS/PARTIAL/FAILED)
   - Records synced and failed counts
   - Error details (first 10 errors)
   - Timing information
   - Trigger type ('manual' or 'initial')

## Performance Considerations

- **Batch Processing**: Operations are batched (10 for Airtable, 100 for Sheets)
- **Retry Logic**: Automatic retries with exponential backoff for rate limits
- **Concurrent Sync Prevention**: Only one sync per config can run at a time
- **Error Isolation**: Errors in individual records don't fail entire sync
- **Metadata Failures**: Non-fatal - sync succeeds even if metadata update fails

## Monitoring & Debugging

All actions include comprehensive console logging:
- Start/end timestamps
- Configuration details
- Progress updates for each phase
- Error details with context
- Performance metrics

Logs are prefixed with `[ManualSync]` or `[InitialSync]` for easy filtering.

## Testing Recommendations

1. **Dry Run First**: Always use `runInitialSync({ dryRun: true })` before actual initial sync
2. **Check Warnings**: Review warnings for non-critical issues
3. **Monitor Errors**: Partial success may indicate data issues
4. **Verify Mappings**: Ensure field mappings are correct before syncing
5. **Test Incrementally**: Start with small datasets before full syncs
