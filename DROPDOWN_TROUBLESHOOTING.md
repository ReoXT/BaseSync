# Dropdown Validation Troubleshooting Guide

## The Issue
Dropdown fields (Single Select, Multi Select) from Airtable are syncing as plain text instead of showing dropdown menus in Google Sheets.

## How to Debug

### Step 1: Check the Sync Logs

When you run a sync, look for these log messages in your console:

```
[AirtableToSheets] Detecting dropdown fields for data validation...
[AirtableToSheets] Total fields to check: X
[AirtableToSheets] Field types: FieldName:fieldType, ...
```

**What to look for:**
- Are `singleSelect` or `multipleSelects` types shown in the field types list?
- If NOT: The fields aren't being recognized as dropdowns by Airtable API

### Step 2: Check Dropdown Detection

Look for:
```
[DropdownDetector] Detected X dropdown field(s):
  - "FieldName" (singleSelect) at column Y: Z choices [choice1, choice2, ...]
```

**What to look for:**
- Number of dropdown fields detected
- Column indices (0 = A, 1 = B, 2 = C, etc.)
- List of choices extracted from Airtable

**If you see "No dropdown fields detected":**
- Check Step 3 below

### Step 3: Why No Dropdowns Detected?

Look for warnings like:
```
[DropdownDetector] Skipping field "FieldName" - no choices defined
```

**Common causes:**
1. **Airtable field has no choices**: The field exists but has zero options defined
2. **Field type mismatch**: The field isn't actually `singleSelect` or `multipleSelects` in Airtable's schema
3. **Field mappings filtering**: Your field mappings excluded the dropdown fields

### Step 4: Check API Call

Look for:
```
[GoogleSheets] Setting validation for column X (index Y): Z choices, strict/lenient
[GoogleSheets] Sending N validation request(s) to Sheets API...
[GoogleSheets] ✓ Validation API call successful
```

**If you see an error:**
```
[AirtableToSheets] Failed to set up dropdown validation: [error message]
```

The error message will tell you what went wrong (auth, permissions, invalid request, etc.)

### Step 5: Verify in Google Sheets

After sync completes:

1. Open the Google Sheet
2. Click on a cell in the column that should have validation
3. Look for a dropdown arrow in the cell
4. Try clicking the dropdown - do the choices appear?

**If dropdown doesn't appear:**
- The validation wasn't applied (check Step 4 for errors)
- You're looking at the wrong column (check column index in logs)
- Google Sheets permissions issue

## Common Issues & Solutions

### Issue 1: "No dropdown fields detected"

**Cause:** Airtable fields don't have choices defined

**Solution:**
1. Go to Airtable
2. Open the field configuration for your Single Select or Multi Select field
3. Ensure it has at least one choice defined
4. Run sync again

### Issue 2: Validation applied to wrong column

**Cause:** Column index mismatch

**Check the logs:**
```
[DropdownDetector] Field "Status" mapped to column 2 via fieldMappings
```

**Solution:**
- If using field mappings, verify the mapping is correct
- Column indices are 0-based: 0 = A, 1 = B, 2 = C, etc.
- Check that `fieldMappings` object has the right field ID → column index

### Issue 3: API Permission Error

**Error message:**
```
Failed to batch set dropdown validations: 403 PERMISSION_DENIED
```

**Cause:** OAuth scope missing

**Solution:**
Ensure your Google OAuth token includes the `https://www.googleapis.com/auth/spreadsheets` scope (not just `spreadsheets.readonly`)

### Issue 4: Dropdown appears but is empty

**Cause:** Choices array is empty or contains invalid values

**Check logs:**
```
[GoogleSheets] Setting validation for column B (index 1): 0 choices, strict
```

If it says "0 choices", the choices array is empty.

**Solution:**
- Verify Airtable field has choices defined
- Check if choices are being extracted correctly

### Issue 5: Multi-select doesn't work as expected

**Current behavior:** Google Sheets shows dropdown, but users must type comma-separated values

**This is expected!** Google Sheets doesn't have native multi-select dropdown UI like Airtable.

**Workaround:**
- Users select one value from dropdown
- To add more, they edit the cell and add commas: "Choice1, Choice2, Choice3"
- Validation will check each value against the list

## Manual Testing

### Test 1: Simple Single Select

1. Create test Airtable table with one Single Select field:
   - Field name: "Status"
   - Choices: "Todo", "In Progress", "Done"

2. Add a few records with different status values

3. Create sync configuration in BaseSync

4. Run sync

5. Check Google Sheets:
   - Column with "Status" header should have dropdown
   - Click cell → dropdown shows 3 choices
   - Select "In Progress" → should work
   - Type "Invalid" → should show error (if strict mode)

### Test 2: Multi Select

1. Create field with type Multi Select:
   - Field name: "Tags"
   - Choices: "Bug", "Feature", "Enhancement"

2. Add records with multiple tags

3. Sync to Sheets

4. Check:
   - Column "Tags" has dropdown
   - Try entering: "Bug, Feature" → should be valid
   - Try entering: "InvalidTag" → should show error

## Debug Mode

To see even more detailed logs, you can temporarily add debug output:

### In `airtableToSheets.ts` (Step 8):

```typescript
console.log('[DEBUG] tableFields:', JSON.stringify(tableFields.map(f => ({
  id: f.id,
  name: f.name,
  type: f.type,
  hasChoices: !!f.options?.choices,
  choiceCount: f.options?.choices?.length || 0
})), null, 2));

console.log('[DEBUG] fieldMappings:', fieldMappings);
```

### In `dropdownFieldDetector.ts`:

Already has debug logs - check for:
```
[DropdownDetector] Field "X" mapped to column Y via fieldMappings
```

## Still Not Working?

### Run the Test Script

Use the test script to verify the API calls work:

```bash
npx tsx test-dropdown-validation.ts
```

Update the script with:
- Your OAuth access token
- Your spreadsheet ID
- A test sheet name

If the test script works but the sync doesn't, the issue is in the sync logic.
If the test script fails, the issue is with the API call or permissions.

## Expected API Request

The batchUpdate request should look like:

```json
{
  "requests": [
    {
      "setDataValidation": {
        "range": {
          "sheetId": 0,
          "startRowIndex": 1,
          "endRowIndex": 1000,
          "startColumnIndex": 1,
          "endColumnIndex": 2
        },
        "rule": {
          "condition": {
            "type": "ONE_OF_LIST",
            "values": [
              { "userEnteredValue": "Todo" },
              { "userEnteredValue": "In Progress" },
              { "userEnteredValue": "Done" }
            ]
          },
          "showCustomUi": true,
          "strict": true
        }
      }
    }
  ]
}
```

**Key points:**
- `sheetId`: Numeric sheet ID (gid), not name
- `startRowIndex`: 0-based (1 = row 2 in UI)
- `startColumnIndex`: 0-based (0 = column A)
- `type: "ONE_OF_LIST"`: Creates dropdown validation
- `showCustomUi: true`: Shows dropdown arrow in cells
- `strict: true`: Rejects invalid values (false = warning only)

## Next Steps

1. Run a sync and capture all console logs
2. Share the logs (especially the dropdown detection section)
3. Check which step is failing based on the sections above
4. Try the test script to isolate if it's an API issue vs sync logic issue

## Quick Checklist

- [ ] Airtable fields are type `singleSelect` or `multipleSelects`
- [ ] Fields have at least one choice defined in Airtable
- [ ] OAuth token has `spreadsheets` scope (not just readonly)
- [ ] Sync logs show "Detected X dropdown field(s)"
- [ ] Sync logs show "✓ Data validation applied successfully"
- [ ] No errors in sync warnings/errors
- [ ] Checking the correct column in Sheets (verify column index)
- [ ] User has edit permission on the Google Sheet
