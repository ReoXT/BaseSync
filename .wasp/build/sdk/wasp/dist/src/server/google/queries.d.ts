/**
 * Wasp queries for Google Sheets data access
 * These functions fetch data from Google Sheets on behalf of authenticated users
 */
import type { ListUserSpreadsheets, GetSpreadsheetSheets, GetSheetColumnHeaders } from 'wasp/server/operations';
type ListUserSpreadsheetsInput = void;
type ListUserSpreadsheetsOutput = Array<{
    id: string;
    name: string;
    createdTime?: string;
    modifiedTime?: string;
    webViewLink?: string;
    owners?: Array<{
        displayName: string;
        emailAddress: string;
    }>;
}>;
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
 * Lists all Google Spreadsheets accessible to the authenticated user
 * Automatically refreshes token if expired
 */
export declare const listUserSpreadsheets: ListUserSpreadsheets<ListUserSpreadsheetsInput, ListUserSpreadsheetsOutput>;
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