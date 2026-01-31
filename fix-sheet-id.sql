-- Fix Google Sheet ID: Replace numeric gid with sheet name
--
-- IMPORTANT: Replace 'Sheet1' with your actual Google Sheet tab name
-- If you don't know the sheet name, open your Google Spreadsheet and look at the tab name at the bottom
--
-- Example: If your tab is called "Main Data", use 'Main Data'
--          If your tab is called "Sheet1", use 'Sheet1'

UPDATE "SyncConfig"
SET "googleSheetId" = 'Sheet1'  -- <-- CHANGE THIS to your actual sheet name
WHERE "googleSheetId" ~ '^[0-9]+$';  -- Only update numeric IDs

-- To see what would be updated first, run this query:
-- SELECT id, name, "googleSheetId", "googleSpreadsheetId"
-- FROM "SyncConfig"
-- WHERE "googleSheetId" ~ '^[0-9]+$';
