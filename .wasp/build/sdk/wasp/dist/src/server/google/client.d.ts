/**
 * Typed Google Sheets API Client
 * Handles API requests to Google Sheets and Drive APIs with proper error handling
 * API Documentation: https://developers.google.com/sheets/api/reference/rest
 */
export interface GoogleSpreadsheet {
    id: string;
    name: string;
    mimeType: string;
    createdTime?: string;
    modifiedTime?: string;
    webViewLink?: string;
    iconLink?: string;
    owners?: Array<{
        displayName: string;
        emailAddress: string;
    }>;
}
export interface GoogleSheet {
    properties: {
        sheetId: number;
        title: string;
        index: number;
        sheetType: 'GRID' | 'OBJECT' | 'DATA_SOURCE';
        gridProperties?: {
            rowCount: number;
            columnCount: number;
            frozenRowCount?: number;
            frozenColumnCount?: number;
        };
        hidden?: boolean;
        tabColor?: {
            red?: number;
            green?: number;
            blue?: number;
            alpha?: number;
        };
    };
}
export interface GoogleSpreadsheetMetadata {
    spreadsheetId: string;
    properties: {
        title: string;
        locale: string;
        autoRecalc: string;
        timeZone: string;
        defaultFormat?: {
            backgroundColor?: {
                red: number;
                green: number;
                blue: number;
            };
            padding?: {
                top: number;
                right: number;
                bottom: number;
                left: number;
            };
            textFormat?: {
                foregroundColor?: {
                    red: number;
                    green: number;
                    blue: number;
                };
                fontFamily?: string;
                fontSize?: number;
                bold?: boolean;
                italic?: boolean;
            };
        };
    };
    sheets: GoogleSheet[];
    spreadsheetUrl: string;
}
export interface CellValue {
    formattedValue?: string;
    userEnteredValue?: {
        stringValue?: string;
        numberValue?: number;
        boolValue?: boolean;
        formulaValue?: string;
        errorValue?: {
            type: string;
            message: string;
        };
    };
    effectiveValue?: {
        stringValue?: string;
        numberValue?: number;
        boolValue?: boolean;
        errorValue?: {
            type: string;
            message: string;
        };
    };
    effectiveFormat?: {
        numberFormat?: {
            type: string;
            pattern?: string;
        };
        backgroundColor?: {
            red: number;
            green: number;
            blue: number;
        };
        textFormat?: {
            foregroundColor?: {
                red: number;
                green: number;
                blue: number;
            };
            fontFamily?: string;
            fontSize?: number;
            bold?: boolean;
            italic?: boolean;
        };
    };
}
export interface SheetData {
    range: string;
    majorDimension: 'ROWS' | 'COLUMNS';
    values: any[][];
}
export declare class GoogleSheetsError extends Error {
    statusCode?: number | undefined;
    response?: unknown | undefined;
    isQuotaError: boolean;
    isAuthError: boolean;
    constructor(message: string, statusCode?: number | undefined, response?: unknown | undefined, isQuotaError?: boolean, isAuthError?: boolean);
}
/**
 * Lists all spreadsheets accessible to the user via Google Drive API
 * Requires: drive.readonly or drive scope
 */
export declare function listSpreadsheets(accessToken: string): Promise<GoogleSpreadsheet[]>;
/**
 * Gets spreadsheet metadata including all sheets
 * Requires: spreadsheets.readonly or spreadsheets scope
 */
export declare function getSpreadsheet(accessToken: string, spreadsheetId: string): Promise<GoogleSpreadsheetMetadata>;
/**
 * Gets data from a sheet
 * @param sheetId - Can be sheet name or gid (numeric ID)
 * @param range - Optional A1 notation range (e.g., "A1:D10"), defaults to all data
 * Requires: spreadsheets.readonly or spreadsheets scope
 */
export declare function getSheetData(accessToken: string, spreadsheetId: string, sheetId: string | number, range?: string): Promise<SheetData>;
/**
 * Updates data in a sheet (overwrites existing data in the range)
 * @param range - A1 notation range (e.g., "A1:D10")
 * @param values - 2D array of values to write
 * Requires: spreadsheets scope
 */
export declare function updateSheetData(accessToken: string, spreadsheetId: string, sheetId: string | number, range: string, values: any[][]): Promise<{
    updatedRange: string;
    updatedRows: number;
    updatedColumns: number;
    updatedCells: number;
}>;
/**
 * Appends rows to the end of a sheet
 * @param values - 2D array of values to append
 * Requires: spreadsheets scope
 */
export declare function appendRows(accessToken: string, spreadsheetId: string, sheetId: string | number, values: any[][]): Promise<{
    updatedRange: string;
    updatedRows: number;
    updatedColumns: number;
    updatedCells: number;
}>;
/**
 * Deletes rows from a sheet
 * Uses the batchUpdate API to delete rows by index
 * @param sheetId - Must be the numeric sheet ID (gid), not the name
 * @param startRow - Starting row index (0-based)
 * @param count - Number of rows to delete
 * Requires: spreadsheets scope
 */
export declare function deleteRows(accessToken: string, spreadsheetId: string, sheetId: number, startRow: number, count: number): Promise<void>;
/**
 * Gets the numeric sheet ID (gid) from a sheet name
 * Helper function for operations that require the numeric ID
 */
export declare function getSheetIdByName(accessToken: string, spreadsheetId: string, sheetName: string): Promise<number>;
/**
 * Clears data from a range in a sheet (keeps formatting)
 * Requires: spreadsheets scope
 */
export declare function clearSheetData(accessToken: string, spreadsheetId: string, sheetId: string | number, range?: string): Promise<{
    clearedRange: string;
}>;
/**
 * Creates a new sheet in a spreadsheet
 * Requires: spreadsheets scope
 */
export declare function createSheet(accessToken: string, spreadsheetId: string, sheetTitle: string, rowCount?: number, columnCount?: number): Promise<GoogleSheet>;
/**
 * Helper function to convert column letters to numbers (A=1, B=2, ..., Z=26, AA=27, etc.)
 */
export declare function columnLetterToNumber(column: string): number;
/**
 * Helper function to convert column numbers to letters (1=A, 2=B, ..., 26=Z, 27=AA, etc.)
 */
export declare function columnNumberToLetter(column: number): string;
/**
 * Detects the last column index with data in a sheet
 * @param sheetData - The sheet data from getSheetData
 * @returns The zero-based index of the last column with data (0 = A, 1 = B, etc.)
 */
export declare function detectLastColumnIndex(sheetData: SheetData): number;
/**
 * Ensures a sheet has at least the specified number of columns
 * Creates additional columns if needed
 * @param accessToken - Google OAuth access token
 * @param spreadsheetId - The spreadsheet ID
 * @param sheetId - The sheet ID (gid) or name
 * @param requiredColumnCount - Minimum number of columns needed (e.g., 27 for column AA)
 */
export declare function ensureColumnsExist(accessToken: string, spreadsheetId: string, sheetId: string | number, requiredColumnCount: number): Promise<void>;
/**
 * Hides a column in a Google Sheet
 * @param accessToken - Google OAuth access token
 * @param spreadsheetId - The spreadsheet ID
 * @param sheetId - The sheet ID (gid) or name
 * @param columnIndex - Zero-based column index to hide (0 = A, 1 = B, etc.)
 */
export declare function hideColumn(accessToken: string, spreadsheetId: string, sheetId: string | number, columnIndex: number): Promise<void>;
/**
 * Interface for dropdown validation options
 */
export interface DropdownValidationOptions {
    /** Column index to apply validation (0-based, 0 = A, 1 = B, etc.) */
    columnIndex: number;
    /** List of dropdown choices */
    choices: string[];
    /** Starting row for validation (1-based, typically 2 to skip header) */
    startRow?: number;
    /** Ending row for validation (if not specified, applies to entire column) */
    endRow?: number;
    /** Whether to show dropdown in cell (default: true) */
    showDropdown?: boolean;
    /** Whether to reject invalid input (default: true) */
    strict?: boolean;
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
export declare function setColumnDropdownValidation(accessToken: string, spreadsheetId: string, sheetId: string | number, options: DropdownValidationOptions): Promise<void>;
/**
 * Batch sets dropdown validations for multiple columns
 * More efficient than calling setColumnDropdownValidation multiple times
 *
 * @param accessToken - Google OAuth access token
 * @param spreadsheetId - The spreadsheet ID
 * @param sheetId - The sheet ID (gid) or name
 * @param validations - Array of dropdown validation configurations
 */
export declare function batchSetDropdownValidations(accessToken: string, spreadsheetId: string, sheetId: string | number, validations: DropdownValidationOptions[]): Promise<void>;
//# sourceMappingURL=client.d.ts.map