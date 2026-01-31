-- Quick fix: Reset all needsReauth flags
-- Run this in your database to immediately fix sync issues

UPDATE "AirtableConnection"
SET "needsReauth" = false,
    "lastRefreshError" = NULL,
    "lastRefreshAttempt" = NOW()
WHERE "needsReauth" = true;

UPDATE "GoogleSheetsConnection"
SET "needsReauth" = false,
    "lastRefreshError" = NULL,
    "lastRefreshAttempt" = NOW()
WHERE "needsReauth" = true;

-- Check results
SELECT 'Airtable' as connection, "userId", "needsReauth", "lastRefreshError", "tokenExpiry"
FROM "AirtableConnection"
UNION ALL
SELECT 'Google Sheets' as connection, "userId", "needsReauth", "lastRefreshError", "tokenExpiry"
FROM "GoogleSheetsConnection";
