/**
 * Wasp queries for Google Sheets data access
 * These functions fetch data from Google Sheets on behalf of authenticated users
 *
 * NOTE: Drive API query (listUserSpreadsheets) removed to avoid CASA assessment.
 * Users will paste spreadsheet URLs directly.
 */
import type { GetSpreadsheetSheets, GetSheetColumnHeaders, ValidateSpreadsheetUrl } from 'wasp/server/operations';
type ValidateSpreadsheetUrlInput = {
    url: string;
};
type ValidateSpreadsheetUrlOutput = {
    spreadsheetId: string;
    spreadsheetTitle: string;
    sheets: Array<{
        sheetId: number;
        title: string;
    }>;
};
type GetSpreadsheetSheetsInput = {
    spreadsheetId: string;
};
type GetSpreadsheetSheetsOutput = {
    spreadsheetId: string;
    title: string;
    spreadsheetUrl: string;
    sheets: Array<{
        sheetId: number;
        title: string;
        index: number;
        rowCount: number;
        columnCount: number;
        hidden?: boolean;
    }>;
};
type GetSheetColumnHeadersInput = {
    spreadsheetId: string;
    sheetId: string | number;
};
type GetSheetColumnHeadersOutput = {
    headers: string[];
    columnCount: number;
};
/**
 * Validates a Google Sheets URL by parsing it and checking user has access
 * Replaces the need to browse Drive - user pastes URL directly
 */
export declare const validateSpreadsheetUrl: ValidateSpreadsheetUrl<ValidateSpreadsheetUrlInput, ValidateSpreadsheetUrlOutput>;
/**
 * Gets all sheets (tabs) within a specific Google Spreadsheet
 * Automatically refreshes token if expired
 */
export declare const getSpreadsheetSheets: GetSpreadsheetSheets<GetSpreadsheetSheetsInput, GetSpreadsheetSheetsOutput>;
/**
 * Gets the column headers from the first row of a sheet
 * Automatically refreshes token if expired
 */
export declare const getSheetColumnHeaders: GetSheetColumnHeaders<GetSheetColumnHeadersInput, GetSheetColumnHeadersOutput>;
export {};
//# sourceMappingURL=queries.d.ts.map