# Database Migration Notes

## Token Management Enhancement (Phase 10.1)

### Changes Made

Added connection status tracking fields to both `AirtableConnection` and `GoogleSheetsConnection` models:

- `lastRefreshAttempt` (DateTime?) - Tracks when we last attempted to refresh the token
- `lastRefreshError` (String?) - Stores the last error message if refresh failed
- `needsReauth` (Boolean, default: false) - Flag indicating user needs to reconnect

### Migration Command

Run the following command to apply the database schema changes:

```bash
npx prisma migrate dev --name add_connection_status_tracking
```

### What This Enables

1. **Automatic Token Refresh**: Token manager can now track refresh attempts and failures
2. **User Notifications**: Dashboard can show when users need to reconnect
3. **Error Diagnostics**: Last error message helps debug connection issues
4. **Graceful Degradation**: Syncs pause instead of failing repeatedly when tokens expire

### Rollback

If you need to rollback this migration:

```bash
npx prisma migrate resolve --rolled-back add_connection_status_tracking
```

Then manually remove the three fields from both connection models in `schema.prisma` and run:

```bash
npx prisma migrate dev --name revert_connection_status_tracking
```

### Files Modified

- `schema.prisma` - Added fields to AirtableConnection and GoogleSheetsConnection models
- `src/server/utils/tokenManager.ts` - Created centralized token management
- `src/server/utils/apiClientWrapper.ts` - Created API client wrappers with auto-refresh

### Testing Checklist

After migration, verify:

- [ ] Migration applied successfully without errors
- [ ] Existing connections still work
- [ ] Token refresh works when tokens expire
- [ ] needsReauth flag is set when refresh fails
- [ ] Dashboard shows connection status correctly
- [ ] Sync job handles connection errors gracefully
