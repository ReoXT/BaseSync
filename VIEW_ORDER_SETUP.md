# Setting Up View-Based Ordering for Exact Airtable → Sheets Order

BaseSync now supports **exact row order matching** between Airtable and Google Sheets using Airtable views!

## Why Use Views?

When you create a sync without specifying a view:
- Records are sorted **alphabetically by the primary field** (usually "Name")
- This gives consistent, predictable ordering
- BUT it may not match your custom Airtable view order

When you specify an Airtable view:
- Records appear in Google Sheets in the **exact same order** as your Airtable view
- Preserves manual drag-and-drop ordering
- Preserves custom sort configurations
- Preserves filtered views (only syncs visible records)

## How to Get Your Airtable View ID

### Method 1: From the Airtable URL (Easiest)

1. Open your Airtable base
2. Navigate to the view you want to sync (e.g., "Grid view", "All records", etc.)
3. Look at the URL in your browser:
   ```
   https://airtable.com/appXXXXXXXXXX/tblYYYYYYYYYY/viwZZZZZZZZZZ
   ```
4. The view ID is the part starting with `viw`:
   ```
   viwZZZZZZZZZZ
   ```

### Method 2: From the Share View Link

1. In Airtable, click the view dropdown (top-left of the grid)
2. Click "Share view" or the share icon
3. The share URL contains the view ID:
   ```
   https://airtable.com/shrXXXXXXXX/tblYYYYYYY/viwZZZZZZZZ
   ```
4. Copy the `viwZZZZZZZZ` part

## How to Use the View ID in BaseSync

### Option 1: When Creating a New Sync

When creating a sync configuration through the BaseSync wizard:

1. After selecting your Airtable table, you'll see an **optional field** for "View ID"
2. Paste your view ID (e.g., `viwZZZZZZZZ`)
3. Complete the rest of the sync setup

### Option 2: Run Database Migration (Required First)

Before you can use view IDs, you need to update your database:

```bash
# In your BaseSync project directory
wasp db migrate-dev
```

This adds the `airtableViewId` field to your database.

### Option 3: Manually Update Existing Sync Config

If you already have a sync configured and want to add view support:

1. Get your sync config ID from the dashboard
2. Update it programmatically or through the database:
   ```sql
   UPDATE "SyncConfig"
   SET "airtableViewId" = 'viwZZZZZZZZ'
   WHERE id = 'your-sync-config-id';
   ```

## Examples

### Example 1: Syncing a Filtered View

If your Airtable view shows only "Active" records:
- Use the view ID for that filtered view
- Google Sheets will only show the active records
- Records appear in the exact order shown in the view

### Example 2: Syncing a Custom Sorted View

If you've manually sorted your Airtable view:
- Use the view ID
- Google Sheets will mirror that exact sort order
- Updates to the view order will sync on next sync

### Example 3: No View ID (Alphabetical)

If you don't provide a view ID:
- Records sort alphabetically by the primary field (Name column)
- Consistent and predictable
- Good for simple use cases

## Troubleshooting

### "No view or primary field - order may be unpredictable"

This warning appears if:
- You didn't provide a view ID
- AND we couldn't find a primary field to sort by

**Solution**: Add a view ID or ensure your Airtable table has a primary field.

### Records Still in Wrong Order

1. **Check you're using the correct view ID**
   - Make sure the view ID starts with `viw`
   - Try copying it from the URL again

2. **Run a manual sync**
   - After changing the view ID, trigger a manual sync
   - The order should update immediately

3. **Check view permissions**
   - Make sure your Airtable OAuth has access to the view
   - Private/restricted views may not be accessible

### View Not Found Error

If you get an error about the view not being found:
- The view ID might be incorrect
- The view might have been deleted in Airtable
- Your OAuth token might not have access to the view

**Solution**: Get a fresh view ID from Airtable and update your sync config.

## Best Practices

1. **Use view IDs for production syncs** - Ensures exact order matching
2. **Document your view configuration** - Note which view you're syncing from
3. **Don't delete views used for syncing** - This will break the sync
4. **Test with manual sync first** - Verify the order is correct before automating

## Migration Notes

If you're upgrading from an older version of BaseSync:

1. Run `wasp db migrate-dev` to add the `airtableViewId` field
2. Existing syncs will continue working with alphabetical ordering
3. Update syncs individually to add view IDs as needed
4. No data loss - this is purely an additive change

## API Reference

### SyncConfig Schema

```typescript
{
  airtableViewId?: string  // Optional Airtable view ID (starts with "viw")
}
```

### Create Sync Config

```typescript
{
  name: "My Sync",
  airtableBaseId: "appXXXXXX",
  airtableTableId: "tblYYYYYY",
  airtableViewId: "viwZZZZZZ",  // Optional - for exact order
  // ... other config
}
```

---

**Questions?** Check the [Airtable API documentation](https://airtable.com/developers/web/api/introduction) for more details on views.
