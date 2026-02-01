# Debug: Why Dropdowns Aren't Appearing

## The Issue
- ✅ Data IS syncing (you see "Todo, In Progress, Done" as text)
- ❌ Dropdown UI is NOT appearing (no dropdown arrow in cells)
- ❌ Single select values show as blue underlined text (like links)
- ❌ Multi select values show with commas

This means **the data validation API is not being called or is failing**.

## Quick Diagnosis

### Run a sync and check for these EXACT log messages:

```bash
wasp start
# Then trigger a sync from your UI
```

Look for these messages in the console:

**1. Detection phase:**
```
[AirtableToSheets] Detecting dropdown fields for data validation...
[AirtableToSheets] Total fields to check: X
[AirtableToSheets] Field types: Status:singleSelect, Tags:multipleSelects, ...
```

**Question:** Do you see `singleSelect` or `multipleSelects` in the field types list?
- ✅ YES → Go to step 2
- ❌ NO → Airtable fields aren't being recognized as dropdowns

**2. Dropdown detection:**
```
[DropdownDetector] Detected 2 dropdown field(s):
  - "Status" (singleSelect) at column 1: 3 choices [Todo, In Progress, Done]
```

**Question:** Do you see this message with your field names?
- ✅ YES → Go to step 3
- ❌ NO → Fields have no choices or are being filtered out

**3. API call:**
```
[GoogleSheets] Setting validation for column B (index 1): 3 choices, strict
[GoogleSheets] Sending 2 validation request(s) to Sheets API...
[GoogleSheets] ✓ Validation API call successful
```

**Question:** Do you see "Validation API call successful"?
- ✅ YES → The API worked! But validation might be on wrong column
- ❌ NO → The API call is failing (check for errors)

---

## Most Likely Causes

### Cause 1: Code Not Compiled (Wasp)
Since this is a Wasp project, TypeScript changes need to be compiled.

**Solution:**
```bash
# Stop Wasp if running
# Then restart it to trigger recompilation
wasp clean
wasp start
```

Wait for Wasp to finish compiling, then run a sync again.

### Cause 2: Sync Not Using New Code
You might be using an old version of the sync function.

**Check:** Look in the Wasp logs when starting - do you see any TypeScript compilation errors?

### Cause 3: API Call Failing Silently
The validation API might be failing but errors are being caught.

**Check the sync result:**
Look at the `warnings` array in your sync result. Does it contain:
```
"Failed to set up dropdown validation: ..."
```

If yes, that's the error message - share it!

### Cause 4: OAuth Scope Missing
Your Google OAuth token might not have write permissions.

**Required scope:**
```
https://www.googleapis.com/auth/spreadsheets
```

**NOT just:**
```
https://www.googleapis.com/auth/spreadsheets.readonly
```

**How to check:**
- Look at your Google OAuth configuration in your app
- The scope must include `spreadsheets` (write access)

---

## Manual Test (Bypass Sync)

To verify the API call works, you can test it directly.

### Option 1: Use Wasp REPL

```bash
wasp start db
# In another terminal:
wasp db studio
```

Then in your browser console or backend:

```typescript
import { batchSetDropdownValidations } from './src/server/google/client';

// Get your actual values:
const accessToken = "YOUR_GOOGLE_OAUTH_TOKEN";
const spreadsheetId = "YOUR_SPREADSHEET_ID";
const sheetId = "Sheet1"; // or the actual sheet name

await batchSetDropdownValidations(accessToken, spreadsheetId, sheetId, [
  {
    columnIndex: 0, // Column A
    choices: ["Todo", "In Progress", "Done"],
    showDropdown: true,
    strict: true
  }
]);
```

If this works → Sync integration issue
If this fails → API/permission issue

---

## Expected Behavior After Fix

When validation is correctly applied:

1. **Click on a cell** in the Status column
2. **See a dropdown arrow** appear in the cell
3. **Click the arrow** → dropdown menu appears
4. **See choices:** Todo, In Progress, Done
5. **Select a value** → it fills the cell
6. **Try typing "Invalid"** → Error: "Value not in list"

---

## Debug Checklist

Run through these:

- [ ] Wasp is running (`wasp start`)
- [ ] Wasp compiled without errors (check terminal)
- [ ] Ran a sync from the UI
- [ ] Checked console logs for dropdown detection messages
- [ ] Saw "Detected X dropdown field(s)" message (X > 0)
- [ ] Saw "Validation API call successful" message
- [ ] No errors/warnings in sync result
- [ ] Google OAuth has `spreadsheets` scope (not just readonly)
- [ ] Checked the correct column in Google Sheets
- [ ] Clicked on a cell to see if dropdown appears

---

## Share This Info

To help debug, please share:

1. **Copy-paste the console output** from when you run a sync, specifically these sections:
   ```
   [AirtableToSheets] Detecting dropdown fields...
   [DropdownDetector] Detected...
   [GoogleSheets] Setting validation...
   ```

2. **Any errors or warnings** in the sync result

3. **Your Google OAuth scopes** - check your Google OAuth config

4. **Wasp compilation** - any TypeScript errors when starting Wasp?

---

## Quick Fix Attempt

Try this sequence:

```bash
# 1. Stop Wasp
# Ctrl+C in the terminal running wasp start

# 2. Clean build
wasp clean

# 3. Restart Wasp (recompiles everything)
wasp start

# 4. Wait for "Server listening on..." message

# 5. Run a sync from your UI

# 6. Check console logs for dropdown detection messages

# 7. Check Google Sheets - click a cell in Status column
```

If the dropdown appears → It was a compilation issue!
If it still doesn't appear → Share the console logs
