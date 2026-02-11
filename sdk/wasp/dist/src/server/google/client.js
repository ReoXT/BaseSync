/**
 * Typed Google Sheets API Client
 * Handles API requests to Google Sheets and Drive APIs with proper error handling
 * API Documentation: https://developers.google.com/sheets/api/reference/rest
 */
// ============================================================================
// Error Handling
// ============================================================================
export class GoogleSheetsError extends Error {
    statusCode;
    response;
    isQuotaError;
    isAuthError;
    constructor(message, statusCode, response, isQuotaError = false, isAuthError = false) {
        super(message);
        this.statusCode = statusCode;
        this.response = response;
        this.isQuotaError = isQuotaError;
        this.isAuthError = isAuthError;
        this.name = 'GoogleSheetsError';
    }
}
async function handleGoogleResponse(response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = errorData
            ?.error;
        const errorMessage = error?.message || `Google API error: ${response.status} ${response.statusText}`;
        const errorCode = error?.code || response.status;
        // Check for quota/rate limit errors
        const isQuotaError = errorCode === 429 ||
            error?.status === 'RESOURCE_EXHAUSTED' ||
            errorMessage.toLowerCase().includes('quota') ||
            errorMessage.toLowerCase().includes('rate limit');
        // Check for authentication errors
        const isAuthError = errorCode === 401 ||
            errorCode === 403 ||
            error?.status === 'UNAUTHENTICATED' ||
            error?.status === 'PERMISSION_DENIED';
        throw new GoogleSheetsError(errorMessage, errorCode, errorData, isQuotaError, isAuthError);
    }
    return (await response.json());
}
// ============================================================================
// Exponential Backoff for Retries
// ============================================================================
async function fetchWithRetry(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            // Don't retry on auth errors
            if (error instanceof GoogleSheetsError && error.isAuthError) {
                throw error;
            }
            // Don't retry on client errors (except quota/rate limits)
            if (error instanceof GoogleSheetsError &&
                error.statusCode &&
                error.statusCode >= 400 &&
                error.statusCode < 500 &&
                !error.isQuotaError) {
                throw error;
            }
            // Don't retry on last attempt
            if (attempt === maxRetries) {
                break;
            }
            // Use longer delays for quota errors
            const delayMultiplier = error instanceof GoogleSheetsError && error.isQuotaError ? 3 : 1;
            const delay = baseDelay * Math.pow(2, attempt) * delayMultiplier + Math.random() * 1000;
            console.warn(`Google Sheets API request failed (attempt ${attempt + 1}/${maxRetries + 1}), ` +
                `retrying in ${Math.round(delay)}ms...`, lastError.message);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}
// ============================================================================
// API Client Methods
// ============================================================================
const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4';
// NOTE: Drive API functions removed to avoid CASA assessment requirements.
// Users will paste spreadsheet URLs directly instead of browsing Drive.
/**
 * Gets spreadsheet metadata including all sheets
 * Requires: spreadsheets.readonly or spreadsheets scope
 */
export async function getSpreadsheet(accessToken, spreadsheetId) {
    return fetchWithRetry(async () => {
        const response = await fetch(`${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        return handleGoogleResponse(response);
    });
}
/**
 * Validates that a spreadsheet exists and the user has access to it
 * This replaces the need for Drive API browsing - validates access when user provides URL
 *
 * @param accessToken - Google OAuth access token
 * @param spreadsheetId - The spreadsheet ID to validate
 * @returns Simplified spreadsheet metadata with id, title, and sheets
 * @throws GoogleSheetsError with user-friendly messages for 404, 403, or other errors
 */
export async function validateAndGetSpreadsheet(accessToken, spreadsheetId) {
    return fetchWithRetry(async () => {
        try {
            const response = await fetch(`${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            // Handle specific HTTP error codes before generic error handling
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const error = errorData
                    ?.error;
                const statusCode = error?.code || response.status;
                // 404 - Spreadsheet not found
                if (statusCode === 404) {
                    throw new GoogleSheetsError('Spreadsheet not found. Please check the URL and make sure the spreadsheet exists and is shared with your Google account.', 404, errorData, false, false);
                }
                // 403 - No access permission
                if (statusCode === 403) {
                    // Check if it's a permission issue specifically
                    const errorMessage = error?.message || '';
                    if (errorMessage.toLowerCase().includes('permission') ||
                        errorMessage.toLowerCase().includes('access') ||
                        error?.status === 'PERMISSION_DENIED') {
                        throw new GoogleSheetsError("You don't have access to this spreadsheet. Make sure it's shared with your Google account, or that the link sharing settings allow access.", 403, errorData, false, true);
                    }
                    // 403 could also be quota error
                    if (errorMessage.toLowerCase().includes('quota') ||
                        errorMessage.toLowerCase().includes('rate limit') ||
                        error?.status === 'RESOURCE_EXHAUSTED') {
                        throw new GoogleSheetsError('Google API quota exceeded. Please try again in a few moments.', 403, errorData, true, false);
                    }
                    // Generic 403
                    throw new GoogleSheetsError('Access forbidden. Please check your permissions for this spreadsheet.', 403, errorData, false, true);
                }
                // 401 - Authentication error
                if (statusCode === 401) {
                    throw new GoogleSheetsError('Authentication failed. Please reconnect your Google account.', 401, errorData, false, true);
                }
                // 400 - Bad request (likely invalid spreadsheet ID format)
                if (statusCode === 400) {
                    throw new GoogleSheetsError('Invalid spreadsheet ID format. Please check the URL and try again.', 400, errorData, false, false);
                }
                // Other errors - let generic handler deal with it
                throw new GoogleSheetsError(error?.message || `Google Sheets API error: ${response.status} ${response.statusText}`, statusCode, errorData, false, false);
            }
            const metadata = (await response.json());
            // Return simplified format
            return {
                id: metadata.spreadsheetId,
                title: metadata.properties.title,
                sheets: metadata.sheets.map((sheet) => ({
                    sheetId: sheet.properties.sheetId,
                    title: sheet.properties.title,
                })),
            };
        }
        catch (error) {
            // If it's already a GoogleSheetsError, re-throw it
            if (error instanceof GoogleSheetsError) {
                throw error;
            }
            // Network or other errors
            if (error instanceof Error) {
                throw new GoogleSheetsError(`Failed to validate spreadsheet: ${error.message}`, undefined, undefined, false, false);
            }
            throw new GoogleSheetsError('Failed to validate spreadsheet. Please try again.', undefined, undefined, false, false);
        }
    });
}
/**
 * Gets data from a sheet
 * @param sheetId - Can be sheet name or gid (numeric ID)
 * @param range - Optional A1 notation range (e.g., "A1:D10"), defaults to all data
 * Requires: spreadsheets.readonly or spreadsheets scope
 */
export async function getSheetData(accessToken, spreadsheetId, sheetId, range) {
    return fetchWithRetry(async () => {
        // If sheetId is a number (gid), we need to first get the sheet name
        let sheetName;
        if (typeof sheetId === 'number') {
            const metadata = await getSpreadsheet(accessToken, spreadsheetId);
            const sheet = metadata.sheets.find((s) => s.properties.sheetId === sheetId);
            if (!sheet) {
                throw new GoogleSheetsError(`Sheet with gid ${sheetId} not found`);
            }
            sheetName = sheet.properties.title;
        }
        else {
            sheetName = sheetId;
        }
        // Build the range string
        const rangeString = range ? `${sheetName}!${range}` : sheetName;
        const response = await fetch(`${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeString)}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        return handleGoogleResponse(response);
    });
}
/**
 * Updates data in a sheet (overwrites existing data in the range)
 * @param range - A1 notation range (e.g., "A1:D10")
 * @param values - 2D array of values to write
 * Requires: spreadsheets scope
 */
export async function updateSheetData(accessToken, spreadsheetId, sheetId, range, values) {
    return fetchWithRetry(async () => {
        // If sheetId is a number (gid), get the sheet name
        let sheetName;
        if (typeof sheetId === 'number') {
            const metadata = await getSpreadsheet(accessToken, spreadsheetId);
            const sheet = metadata.sheets.find((s) => s.properties.sheetId === sheetId);
            if (!sheet) {
                throw new GoogleSheetsError(`Sheet with gid ${sheetId} not found`);
            }
            sheetName = sheet.properties.title;
        }
        else {
            sheetName = sheetId;
        }
        const rangeString = `${sheetName}!${range}`;
        const response = await fetch(`${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeString)}?valueInputOption=USER_ENTERED`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                range: rangeString,
                majorDimension: 'ROWS',
                values: values,
            }),
        });
        return handleGoogleResponse(response);
    });
}
/**
 * Appends rows to the end of a sheet
 * @param values - 2D array of values to append
 * Requires: spreadsheets scope
 */
export async function appendRows(accessToken, spreadsheetId, sheetId, values) {
    return fetchWithRetry(async () => {
        // If sheetId is a number (gid), get the sheet name
        let sheetName;
        if (typeof sheetId === 'number') {
            const metadata = await getSpreadsheet(accessToken, spreadsheetId);
            const sheet = metadata.sheets.find((s) => s.properties.sheetId === sheetId);
            if (!sheet) {
                throw new GoogleSheetsError(`Sheet with gid ${sheetId} not found`);
            }
            sheetName = sheet.properties.title;
        }
        else {
            sheetName = sheetId;
        }
        const response = await fetch(`${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                range: sheetName,
                majorDimension: 'ROWS',
                values: values,
            }),
        });
        const data = await handleGoogleResponse(response);
        return data.updates;
    });
}
/**
 * Deletes rows from a sheet
 * Uses the batchUpdate API to delete rows by index
 * @param sheetId - Must be the numeric sheet ID (gid), not the name
 * @param startRow - Starting row index (0-based)
 * @param count - Number of rows to delete
 * Requires: spreadsheets scope
 */
export async function deleteRows(accessToken, spreadsheetId, sheetId, startRow, count) {
    return fetchWithRetry(async () => {
        const response = await fetch(`${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}:batchUpdate`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId: sheetId,
                                dimension: 'ROWS',
                                startIndex: startRow,
                                endIndex: startRow + count,
                            },
                        },
                    },
                ],
            }),
        });
        await handleGoogleResponse(response);
    });
}
/**
 * Gets the numeric sheet ID (gid) from a sheet name
 * Helper function for operations that require the numeric ID
 */
export async function getSheetIdByName(accessToken, spreadsheetId, sheetName) {
    const metadata = await getSpreadsheet(accessToken, spreadsheetId);
    const sheet = metadata.sheets.find((s) => s.properties.title === sheetName);
    if (!sheet) {
        throw new GoogleSheetsError(`Sheet with name "${sheetName}" not found`);
    }
    return sheet.properties.sheetId;
}
/**
 * Clears data from a range in a sheet (keeps formatting)
 * Requires: spreadsheets scope
 */
export async function clearSheetData(accessToken, spreadsheetId, sheetId, range) {
    return fetchWithRetry(async () => {
        // If sheetId is a number (gid), get the sheet name
        let sheetName;
        if (typeof sheetId === 'number') {
            const metadata = await getSpreadsheet(accessToken, spreadsheetId);
            const sheet = metadata.sheets.find((s) => s.properties.sheetId === sheetId);
            if (!sheet) {
                throw new GoogleSheetsError(`Sheet with gid ${sheetId} not found`);
            }
            sheetName = sheet.properties.title;
        }
        else {
            sheetName = sheetId;
        }
        const rangeString = range ? `${sheetName}!${range}` : sheetName;
        const response = await fetch(`${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeString)}:clear`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        return handleGoogleResponse(response);
    });
}
/**
 * Creates a new sheet in a spreadsheet
 * Requires: spreadsheets scope
 */
export async function createSheet(accessToken, spreadsheetId, sheetTitle, rowCount = 1000, columnCount = 26) {
    return fetchWithRetry(async () => {
        const response = await fetch(`${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}:batchUpdate`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requests: [
                    {
                        addSheet: {
                            properties: {
                                title: sheetTitle,
                                gridProperties: {
                                    rowCount,
                                    columnCount,
                                },
                            },
                        },
                    },
                ],
            }),
        });
        const data = await handleGoogleResponse(response);
        return { properties: data.replies[0].addSheet.properties };
    });
}
/**
 * Helper function to convert column letters to numbers (A=1, B=2, ..., Z=26, AA=27, etc.)
 */
export function columnLetterToNumber(column) {
    let result = 0;
    for (let i = 0; i < column.length; i++) {
        result = result * 26 + (column.charCodeAt(i) - 64);
    }
    return result;
}
/**
 * Helper function to convert column numbers to letters (1=A, 2=B, ..., 26=Z, 27=AA, etc.)
 */
export function columnNumberToLetter(column) {
    let result = '';
    while (column > 0) {
        const remainder = (column - 1) % 26;
        result = String.fromCharCode(65 + remainder) + result;
        column = Math.floor((column - 1) / 26);
    }
    return result;
}
/**
 * Detects the last column index with data in a sheet
 * @param sheetData - The sheet data from getSheetData
 * @returns The zero-based index of the last column with data (0 = A, 1 = B, etc.)
 */
export function detectLastColumnIndex(sheetData) {
    if (!sheetData.values || sheetData.values.length === 0) {
        return 0;
    }
    let maxColumns = 0;
    for (const row of sheetData.values) {
        if (row.length > maxColumns) {
            maxColumns = row.length;
        }
    }
    return Math.max(0, maxColumns - 1); // Zero-based index
}
/**
 * Ensures a sheet has at least the specified number of columns
 * Creates additional columns if needed
 * @param accessToken - Google OAuth access token
 * @param spreadsheetId - The spreadsheet ID
 * @param sheetId - The sheet ID (gid) or name
 * @param requiredColumnCount - Minimum number of columns needed (e.g., 27 for column AA)
 */
export async function ensureColumnsExist(accessToken, spreadsheetId, sheetId, requiredColumnCount) {
    return fetchWithRetry(async () => {
        // Get the numeric sheet ID and current column count
        let numericSheetId;
        let currentColumnCount;
        const metadata = await getSpreadsheet(accessToken, spreadsheetId);
        if (typeof sheetId === 'number') {
            const sheet = metadata.sheets.find((s) => s.properties.sheetId === sheetId);
            if (!sheet) {
                throw new GoogleSheetsError(`Sheet with ID ${sheetId} not found`);
            }
            numericSheetId = sheetId;
            currentColumnCount = sheet.properties.gridProperties?.columnCount || 0;
        }
        else {
            const sheet = metadata.sheets.find((s) => s.properties.title === sheetId);
            if (!sheet) {
                throw new GoogleSheetsError(`Sheet "${sheetId}" not found`);
            }
            numericSheetId = sheet.properties.sheetId;
            currentColumnCount = sheet.properties.gridProperties?.columnCount || 0;
        }
        // If we already have enough columns, do nothing
        if (currentColumnCount >= requiredColumnCount) {
            return;
        }
        // Calculate how many columns to add
        const columnsToAdd = requiredColumnCount - currentColumnCount;
        // Use appendDimension to add columns
        const response = await fetch(`${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}:batchUpdate`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requests: [
                    {
                        appendDimension: {
                            sheetId: numericSheetId,
                            dimension: 'COLUMNS',
                            length: columnsToAdd,
                        },
                    },
                ],
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new GoogleSheetsError(`Failed to add columns: ${error}`);
        }
    });
}
/**
 * Hides a column in a Google Sheet
 * @param accessToken - Google OAuth access token
 * @param spreadsheetId - The spreadsheet ID
 * @param sheetId - The sheet ID (gid) or name
 * @param columnIndex - Zero-based column index to hide (0 = A, 1 = B, etc.)
 */
export async function hideColumn(accessToken, spreadsheetId, sheetId, columnIndex) {
    return fetchWithRetry(async () => {
        // Get the numeric sheet ID
        let numericSheetId;
        if (typeof sheetId === 'number') {
            numericSheetId = sheetId;
        }
        else {
            const metadata = await getSpreadsheet(accessToken, spreadsheetId);
            const sheet = metadata.sheets.find((s) => s.properties.title === sheetId);
            if (!sheet) {
                throw new GoogleSheetsError(`Sheet "${sheetId}" not found`);
            }
            numericSheetId = sheet.properties.sheetId;
        }
        // Use batchUpdate to hide the column
        const response = await fetch(`${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}:batchUpdate`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requests: [
                    {
                        updateDimensionProperties: {
                            range: {
                                sheetId: numericSheetId,
                                dimension: 'COLUMNS',
                                startIndex: columnIndex,
                                endIndex: columnIndex + 1,
                            },
                            properties: {
                                hiddenByUser: true,
                            },
                            fields: 'hiddenByUser',
                        },
                    },
                ],
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new GoogleSheetsError(`Failed to hide column: ${error}`);
        }
    });
}
/**
 * Sets up data validation (dropdown) for a column in Google Sheets
 * This matches Airtable's dropdown behavior for Single Select and Multi Select fields
 *
 * @param accessToken - Google OAuth access token
 * @param spreadsheetId - The spreadsheet ID
 * @param sheetId - The sheet ID (gid) or name
 * @param options - Dropdown validation configuration
 */
export async function setColumnDropdownValidation(accessToken, spreadsheetId, sheetId, options) {
    return fetchWithRetry(async () => {
        // Get the numeric sheet ID
        let numericSheetId;
        let rowCount = 1000; // Default fallback
        const metadata = await getSpreadsheet(accessToken, spreadsheetId);
        if (typeof sheetId === 'number') {
            const sheet = metadata.sheets.find((s) => s.properties.sheetId === sheetId);
            if (!sheet) {
                throw new GoogleSheetsError(`Sheet with ID ${sheetId} not found`);
            }
            numericSheetId = sheetId;
            rowCount = sheet.properties.gridProperties?.rowCount || 1000;
        }
        else {
            const sheet = metadata.sheets.find((s) => s.properties.title === sheetId);
            if (!sheet) {
                throw new GoogleSheetsError(`Sheet "${sheetId}" not found`);
            }
            numericSheetId = sheet.properties.sheetId;
            rowCount = sheet.properties.gridProperties?.rowCount || 1000;
        }
        const { columnIndex, choices, startRow = 2, // Default: skip header row
        endRow = rowCount, showDropdown = true, strict = true, } = options;
        // Build the data validation rule
        // For multi-select, we'll use ONE_OF_LIST which allows users to enter comma-separated values
        const response = await fetch(`${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}:batchUpdate`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requests: [
                    {
                        setDataValidation: {
                            range: {
                                sheetId: numericSheetId,
                                startRowIndex: startRow - 1, // Convert to 0-based
                                endRowIndex: endRow,
                                startColumnIndex: columnIndex,
                                endColumnIndex: columnIndex + 1,
                            },
                            rule: {
                                condition: {
                                    type: 'ONE_OF_LIST',
                                    values: choices.map((choice) => ({ userEnteredValue: choice })),
                                },
                                showCustomUi: showDropdown,
                                strict: strict,
                            },
                        },
                    },
                ],
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new GoogleSheetsError(`Failed to set dropdown validation: ${error}`);
        }
    });
}
/**
 * Batch sets dropdown validations for multiple columns
 * More efficient than calling setColumnDropdownValidation multiple times
 *
 * @param accessToken - Google OAuth access token
 * @param spreadsheetId - The spreadsheet ID
 * @param sheetId - The sheet ID (gid) or name
 * @param validations - Array of dropdown validation configurations
 */
export async function batchSetDropdownValidations(accessToken, spreadsheetId, sheetId, validations) {
    if (validations.length === 0)
        return;
    return fetchWithRetry(async () => {
        // Get the numeric sheet ID and row count
        let numericSheetId;
        let rowCount = 1000;
        const metadata = await getSpreadsheet(accessToken, spreadsheetId);
        if (typeof sheetId === 'number') {
            const sheet = metadata.sheets.find((s) => s.properties.sheetId === sheetId);
            if (!sheet) {
                throw new GoogleSheetsError(`Sheet with ID ${sheetId} not found`);
            }
            numericSheetId = sheetId;
            rowCount = sheet.properties.gridProperties?.rowCount || 1000;
        }
        else {
            const sheet = metadata.sheets.find((s) => s.properties.title === sheetId);
            if (!sheet) {
                throw new GoogleSheetsError(`Sheet "${sheetId}" not found`);
            }
            numericSheetId = sheet.properties.sheetId;
            rowCount = sheet.properties.gridProperties?.rowCount || 1000;
        }
        // Build all validation requests
        const requests = validations.map((validation) => {
            const { columnIndex, choices, startRow = 2, endRow = rowCount, showDropdown = true, strict = true, } = validation;
            const columnLetter = columnNumberToLetter(columnIndex + 1);
            console.log(`[GoogleSheets] Setting validation for column ${columnLetter} (index ${columnIndex}): ${choices.length} choices, ${strict ? 'strict' : 'lenient'}`);
            return {
                setDataValidation: {
                    range: {
                        sheetId: numericSheetId,
                        startRowIndex: startRow - 1,
                        endRowIndex: endRow,
                        startColumnIndex: columnIndex,
                        endColumnIndex: columnIndex + 1,
                    },
                    rule: {
                        condition: {
                            type: 'ONE_OF_LIST',
                            values: choices.map((choice) => ({ userEnteredValue: choice })),
                        },
                        showCustomUi: showDropdown,
                        strict: strict,
                    },
                },
            };
        });
        console.log(`[GoogleSheets] Sending ${requests.length} validation request(s) to Sheets API...`);
        console.log(`[GoogleSheets] Sheet ID: ${numericSheetId}, Row count: ${rowCount}`);
        // Send batch request
        const response = await fetch(`${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}:batchUpdate`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ requests }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[GoogleSheets] API Error Response:`, errorText);
            throw new GoogleSheetsError(`Failed to batch set dropdown validations: ${errorText}`);
        }
        const result = await response.json();
        console.log(`[GoogleSheets] ✓ Validation API call successful:`, result);
    });
}
//# sourceMappingURL=client.js.map