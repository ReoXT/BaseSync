/**
 * Google Sheets URL Parser
 * Extracts spreadsheet ID and optional sheet ID from various Google Sheets URL formats
 */
// Minimum length for valid Google Sheets spreadsheet IDs
const MIN_SPREADSHEET_ID_LENGTH = 20;
/**
 * Parses a Google Sheets URL and extracts the spreadsheet ID and optional sheet ID (gid)
 *
 * Supported formats:
 * - https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
 * - https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=SHEET_ID
 * - https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit?usp=sharing#gid=SHEET_ID
 * - https://docs.google.com/spreadsheets/d/SPREADSHEET_ID
 * - https://docs.google.com/spreadsheets/d/SPREADSHEET_ID#gid=SHEET_ID
 * - docs.google.com/spreadsheets/d/SPREADSHEET_ID (without protocol)
 * - Or just the spreadsheet ID itself: SPREADSHEET_ID
 *
 * @param url - The Google Sheets URL or spreadsheet ID
 * @returns Object containing spreadsheetId and optional sheetId (gid)
 * @throws Error if the URL is invalid or doesn't match expected formats
 */
export function parseGoogleSheetUrl(url) {
    if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL: URL must be a non-empty string');
    }
    // Trim whitespace
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
        throw new Error('Invalid URL: URL cannot be empty');
    }
    // Pattern to match Google Sheets spreadsheet ID (alphanumeric, hyphens, underscores, typically 44 chars)
    const spreadsheetIdPattern = new RegExp(`[a-zA-Z0-9_-]{${MIN_SPREADSHEET_ID_LENGTH},}`);
    // Try to extract spreadsheet ID from full URL first
    // Pattern: /d/{SPREADSHEET_ID}/ or /d/{SPREADSHEET_ID}#gid= or /d/{SPREADSHEET_ID}?
    const fullUrlMatch = trimmedUrl.match(new RegExp(`\\/spreadsheets\\/d\\/([a-zA-Z0-9_-]{${MIN_SPREADSHEET_ID_LENGTH},})(?:\\/|#|\\?|$)`, 'i'));
    let spreadsheetId;
    if (fullUrlMatch && fullUrlMatch[1]) {
        // Extracted from full URL
        spreadsheetId = fullUrlMatch[1];
    }
    else if (spreadsheetIdPattern.test(trimmedUrl) && !trimmedUrl.includes('/')) {
        // Input is just the spreadsheet ID itself (no slashes, looks like an ID)
        spreadsheetId = trimmedUrl;
    }
    else {
        // No lenient fallback - be strict about URL format
        throw new Error('Invalid Google Sheets URL: Could not extract spreadsheet ID. ' +
            'Please provide a valid Google Sheets URL (e.g., https://docs.google.com/spreadsheets/d/SPREADSHEET_ID) ' +
            'or just the spreadsheet ID itself.');
    }
    // Validate spreadsheet ID format (should be alphanumeric with hyphens/underscores, typically 44 chars)
    if (spreadsheetId.length < MIN_SPREADSHEET_ID_LENGTH) {
        throw new Error('Invalid spreadsheet ID: ID appears too short. ' +
            'Please check that you copied the full URL or spreadsheet ID.');
    }
    // Extract sheet ID (gid) if present
    let sheetId;
    // Look for #gid=NUMBER or &gid=NUMBER (case-sensitive - Google Sheets always uses lowercase)
    const gidMatch = trimmedUrl.match(/[#&]gid=(\d+)/);
    if (gidMatch && gidMatch[1]) {
        const parsedGid = parseInt(gidMatch[1], 10);
        if (!isNaN(parsedGid)) {
            sheetId = parsedGid;
        }
    }
    return {
        spreadsheetId,
        ...(sheetId !== undefined && { sheetId }),
    };
}
/**
 * Validates if a string is a valid Google Sheets URL or spreadsheet ID
 * Returns true if valid, false otherwise (no throw)
 *
 * @param url - The URL or spreadsheet ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidGoogleSheetUrl(url) {
    try {
        parseGoogleSheetUrl(url);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Constructs a Google Sheets URL from a spreadsheet ID and optional sheet ID
 *
 * @param spreadsheetId - The spreadsheet ID
 * @param sheetId - Optional sheet ID (gid)
 * @returns Fully formed Google Sheets URL
 */
export function constructGoogleSheetUrl(spreadsheetId, sheetId) {
    // Validate spreadsheet ID
    if (!spreadsheetId || spreadsheetId.length < MIN_SPREADSHEET_ID_LENGTH) {
        throw new Error('Invalid spreadsheetId: must be at least 20 characters');
    }
    // URL-encode the spreadsheet ID to prevent potential XSS/URL issues
    const encodedId = encodeURIComponent(spreadsheetId);
    let url = `https://docs.google.com/spreadsheets/d/${encodedId}/edit`;
    if (sheetId !== undefined) {
        url += `#gid=${sheetId}`;
    }
    return url;
}
/**
 * Extracts just the spreadsheet ID from any valid input format
 * Convenience function that wraps parseGoogleSheetUrl
 *
 * @param url - The Google Sheets URL or spreadsheet ID
 * @returns Just the spreadsheet ID string
 * @throws Error if the URL is invalid
 */
export function extractSpreadsheetId(url) {
    const parsed = parseGoogleSheetUrl(url);
    return parsed.spreadsheetId;
}
//# sourceMappingURL=urlParser.js.map