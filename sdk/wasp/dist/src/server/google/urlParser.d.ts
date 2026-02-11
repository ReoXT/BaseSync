/**
 * Google Sheets URL Parser
 * Extracts spreadsheet ID and optional sheet ID from various Google Sheets URL formats
 */
export interface ParsedGoogleSheetUrl {
    spreadsheetId: string;
    sheetId?: number;
}
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
export declare function parseGoogleSheetUrl(url: string): ParsedGoogleSheetUrl;
/**
 * Validates if a string is a valid Google Sheets URL or spreadsheet ID
 * Returns true if valid, false otherwise (no throw)
 *
 * @param url - The URL or spreadsheet ID to validate
 * @returns true if valid, false otherwise
 */
export declare function isValidGoogleSheetUrl(url: string): boolean;
/**
 * Constructs a Google Sheets URL from a spreadsheet ID and optional sheet ID
 *
 * @param spreadsheetId - The spreadsheet ID
 * @param sheetId - Optional sheet ID (gid)
 * @returns Fully formed Google Sheets URL
 */
export declare function constructGoogleSheetUrl(spreadsheetId: string, sheetId?: number): string;
/**
 * Extracts just the spreadsheet ID from any valid input format
 * Convenience function that wraps parseGoogleSheetUrl
 *
 * @param url - The Google Sheets URL or spreadsheet ID
 * @returns Just the spreadsheet ID string
 * @throws Error if the URL is invalid
 */
export declare function extractSpreadsheetId(url: string): string;
//# sourceMappingURL=urlParser.d.ts.map