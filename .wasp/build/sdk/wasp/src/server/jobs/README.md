# BaseSync Background Jobs

## Sync Job (`syncJob`)

Automated background job that syncs all active SyncConfigs every 5 minutes.

### Configuration

Defined in `main.wasp`:
```wasp
job syncJob {
  executor: PgBoss,
  perform: {
    fn: import { performSync } from "@src/server/jobs/syncJob"
  },
  schedule: {
    cron: "*/5 * * * *" // Every 5 minutes
  },
  entities: [User, AirtableConnection, GoogleSheetsConnection, SyncConfig, SyncLog]
}
```

### How It Works

1. **Fetch Active Configs**: Queries all `SyncConfig` records where `isActive = true`
2. **Validate Connections**: Ensures user has both Airtable and Google Sheets connections
3. **Decrypt Tokens**: Decrypts access tokens using AES-256-GCM encryption
4. **Execute Sync**: Runs appropriate sync based on `syncDirection`:
   - `AIRTABLE_TO_SHEETS`: One-way sync from Airtable to Sheets
   - `SHEETS_TO_AIRTABLE`: One-way sync from Sheets to Airtable
   - `BIDIRECTIONAL`: Two-way sync with conflict resolution
5. **Update Metadata**: Updates `SyncConfig.lastSyncAt` and `lastSyncStatus`
6. **Create Log**: Creates `SyncLog` entry with detailed results

### Error Handling

The job is designed to **never crash the scheduler**:

- **Config-Level Errors**: If one config fails, others still process
- **Validation Errors**: Missing connections are logged and skipped
- **Sync Errors**: Caught, logged, and recorded in `SyncLog`
- **Job-Level Errors**: Caught at top level, logged, job continues next schedule

### Logging

Extensive console logging for monitoring:

```
================================================================================
[SyncJob] Starting scheduled sync job...
[SyncJob] Time: 2026-01-22T10:00:00.000Z
================================================================================

[SyncJob] Fetching active sync configurations...
[SyncJob] Found 3 active sync configuration(s)

[SyncJob] [======================================================================]
[SyncJob] Processing config: My Airtable ↔ Sheets Sync (abc-123)
[SyncJob] Direction: BIDIRECTIONAL
[SyncJob] User: user@example.com
[SyncJob] [======================================================================]

[SyncJob] Decrypting access tokens...
[SyncJob] Executing BIDIRECTIONAL sync...
[SyncJob] ✓ Sync completed successfully
[SyncJob]   Status: success
[SyncJob]   Airtable → Sheets: 5 added, 12 updated
[SyncJob]   Sheets → Airtable: 3 added, 8 updated
[SyncJob]   Conflicts: 7 resolved
[SyncJob]   Duration: 2456ms
[SyncJob] Updating sync metadata...
[SyncJob] ✓ Sync metadata updated

================================================================================
[SyncJob] Job Summary:
[SyncJob]   Total Processed: 3
[SyncJob]   Successful: 3
[SyncJob]   Failed: 0
[SyncJob]   Skipped: 0
[SyncJob]   Duration: 8234ms
[SyncJob]
[SyncJob] Detailed Results:
[SyncJob]   1. ✓ My Airtable ↔ Sheets Sync - Synced successfully (success) (2456ms)
[SyncJob]   2. ✓ Sales Data Sync - Synced successfully (success) (3122ms)
[SyncJob]   3. ✓ Inventory Sync - Synced successfully (partial) (2656ms)
================================================================================
```

### Database Updates

For each sync execution:

**SyncConfig Updates:**
```typescript
{
  lastSyncAt: Date,      // Timestamp of this sync
  lastSyncStatus: 'success' | 'failed' | 'partial'
}
```

**SyncLog Creation:**
```typescript
{
  syncConfigId: string,
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED',
  recordsSynced: number,
  recordsFailed: number,
  errors: JSON,         // Array of error objects
  startedAt: Date,
  completedAt: Date,
  triggeredBy: 'scheduled',
  direction: SyncDirection
}
```

### Sync Parameters

Each sync type uses safe defaults:

**Airtable → Sheets:**
- `includeHeader: true` - Add/preserve header row
- `deleteExtraRows: false` - Don't delete rows not in Airtable (safe)
- `resolveLinkedRecords: true` - Convert IDs to names
- `maxRetries: 3` - Retry rate limits
- `batchSize: 100` - Process 100 rows at a time

**Sheets → Airtable:**
- `skipHeaderRow: true` - Skip first row
- `deleteExtraRecords: false` - Don't delete records not in Sheets (safe)
- `resolveLinkedRecords: true` - Convert names to IDs
- `createMissingLinkedRecords: false` - Don't auto-create (safe)
- `validationMode: 'lenient'` - Continue on errors
- `maxRetries: 3` - Retry rate limits
- `batchSize: 10` - Airtable's max batch size

**Bidirectional:**
- `conflictResolution`: From SyncConfig
- `includeHeader: true` - Preserve headers
- `resolveLinkedRecords: true` - Both directions
- `createMissingLinkedRecords: false` - Don't auto-create (safe)
- `dryRun: false` - Execute actual sync
- `maxRetries: 3` - Retry rate limits
- `batchSize: 10` - Airtable's max batch size

### Monitoring

Monitor job health via:

1. **Console Logs**: Check server logs for job execution
2. **SyncLog Table**: Query recent sync logs
3. **SyncConfig Status**: Check `lastSyncStatus` and `lastSyncAt`
4. **Job Scheduler**: PgBoss dashboard (if available)

Example queries:

```sql
-- Recent sync logs
SELECT * FROM "SyncLog" 
ORDER BY "startedAt" DESC 
LIMIT 10;

-- Failed syncs in last hour
SELECT * FROM "SyncLog" 
WHERE status = 'FAILED' 
AND "startedAt" > NOW() - INTERVAL '1 hour';

-- Sync configs that haven't synced recently
SELECT * FROM "SyncConfig" 
WHERE "isActive" = true 
AND ("lastSyncAt" IS NULL OR "lastSyncAt" < NOW() - INTERVAL '10 minutes');
```

### Manual Trigger

While the job runs automatically, you can also trigger syncs manually:

```typescript
import { performSync } from '@src/server/jobs/syncJob';

// In an API endpoint or action
await performSync(null, context);
```

### Performance

Typical performance metrics:

- **Small Sync** (< 100 records): 1-3 seconds
- **Medium Sync** (100-1000 records): 3-10 seconds
- **Large Sync** (> 1000 records): 10-60 seconds
- **Multiple Configs**: Sequential processing, ~2-5s per config

### Troubleshooting

**Job Not Running:**
- Check PgBoss is configured correctly in Wasp
- Verify cron schedule syntax
- Check server logs for job scheduler errors

**Syncs Failing:**
- Check `SyncLog` entries for error details
- Verify OAuth tokens are valid (not expired/revoked)
- Check API rate limits (Airtable: 5 req/sec, Sheets: varies)
- Validate field mappings are correct

**Performance Issues:**
- Reduce number of active SyncConfigs
- Increase cron interval (e.g., */10 for 10 minutes)
- Check for large linked record tables (pre-loading can be slow)
- Monitor API rate limits

### Best Practices

1. **Start with Longer Intervals**: Begin with 10-15 minute intervals, optimize later
2. **Monitor Logs**: Watch first few runs to ensure everything works
3. **Handle Failures Gracefully**: Job will retry on next schedule
4. **Use Appropriate Sync Directions**: Don't use bidirectional unless needed
5. **Test Manually First**: Test sync configs manually before activating for scheduled sync
6. **Keep Configs Active Count Reasonable**: 10-20 active configs is a good target

### Security

- Access tokens are encrypted at rest (AES-256-GCM)
- Tokens are only decrypted in memory during sync
- No tokens are logged
- Job runs with user context (respects permissions)
