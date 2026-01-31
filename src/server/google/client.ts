/**
 * Typed Google Sheets API Client
 * Handles API requests to Google Sheets and Drive APIs with proper error handling
 * API Documentation: https://developers.google.com/sheets/api/reference/rest
 */

// ============================================================================
// Types - Google Sheets API
// ============================================================================

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
      backgroundColor?: { red: number; green: number; blue: number };
      padding?: { top: number; right: number; bottom: number; left: number };
      textFormat?: {
        foregroundColor?: { red: number; green: number; blue: number };
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
    errorValue?: { type: string; message: string };
  };
  effectiveValue?: {
    stringValue?: string;
    numberValue?: number;
    boolValue?: boolean;
    errorValue?: { type: string; message: string };
  };
  effectiveFormat?: {
    numberFormat?: { type: string; pattern?: string };
    backgroundColor?: { red: number; green: number; blue: number };
    textFormat?: {
      foregroundColor?: { red: number; green: number; blue: number };
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
  values: any[][]; // 2D array of cell values
}

// ============================================================================
// Error Handling
// ============================================================================

export class GoogleSheetsError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown,
    public isQuotaError: boolean = false,
    public isAuthError: boolean = false
  ) {
    super(message);
    this.name = 'GoogleSheetsError';
  }
}

async function handleGoogleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    const error = (errorData as { error?: { message?: string; code?: number; status?: string } })
      ?.error;
    const errorMessage = error?.message || `Google API error: ${response.status} ${response.statusText}`;
    const errorCode = error?.code || response.status;

    // Check for quota/rate limit errors
    const isQuotaError =
      errorCode === 429 ||
      error?.status === 'RESOURCE_EXHAUSTED' ||
      errorMessage.toLowerCase().includes('quota') ||
      errorMessage.toLowerCase().includes('rate limit');

    // Check for authentication errors
    const isAuthError =
      errorCode === 401 ||
      errorCode === 403 ||
      error?.status === 'UNAUTHENTICATED' ||
      error?.status === 'PERMISSION_DENIED';

    throw new GoogleSheetsError(errorMessage, errorCode, errorData, isQuotaError, isAuthError);
  }

  return (await response.json()) as T;
}

// ============================================================================
// Exponential Backoff for Retries
// ============================================================================

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on auth errors
      if (error instanceof GoogleSheetsError && error.isAuthError) {
        throw error;
      }

      // Don't retry on client errors (except quota/rate limits)
      if (
        error instanceof GoogleSheetsError &&
        error.statusCode &&
        error.statusCode >= 400 &&
        error.statusCode < 500 &&
        !error.isQuotaError
      ) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Use longer delays for quota errors
      const delayMultiplier = error instanceof GoogleSheetsError && error.isQuotaError ? 3 : 1;
      const delay = baseDelay * Math.pow(2, attempt) * delayMultiplier + Math.random() * 1000;

      console.warn(
        `Google Sheets API request failed (attempt ${attempt + 1}/${maxRetries + 1}), ` +
          `retrying in ${Math.round(delay)}ms...`,
        lastError.message
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ============================================================================
// API Client Methods
// ============================================================================

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

/**
 * Lists all spreadsheets accessible to the user via Google Drive API
 * Requires: drive.readonly or drive scope
 */
export async function listSpreadsheets(accessToken: string): Promise<GoogleSpreadsheet[]> {
  return fetchWithRetry(async () => {
    // Query for Google Sheets files only
    const query = "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false";
    const fields =
      'nextPageToken,files(id,name,mimeType,createdTime,modifiedTime,webViewLink,iconLink,owners)';

    const params = new URLSearchParams({
      q: query,
      fields: fields,
      pageSize: '100', // Max allowed by API
      orderBy: 'modifiedTime desc',
    });

    let allSpreadsheets: GoogleSpreadsheet[] = [];
    let pageToken: string | undefined;

    do {
      if (pageToken) {
        params.set('pageToken', pageToken);
      }

      const response = await fetch(`${DRIVE_API_BASE}/files?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await handleGoogleResponse<{
        files: GoogleSpreadsheet[];
        nextPageToken?: string;
      }>(response);

      allSpreadsheets = allSpreadsheets.concat(data.files);
      pageToken = data.nextPageToken;
    } while (pageToken);

    return allSpreadsheets;
  });
}

/**
 * Gets spreadsheet metadata including all sheets
 * Requires: spreadsheets.readonly or spreadsheets scope
 */
export async function getSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<GoogleSpreadsheetMetadata> {
  return fetchWithRetry(async () => {
    const response = await fetch(`${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return handleGoogleResponse<GoogleSpreadsheetMetadata>(response);
  });
}

/**
 * Gets data from a sheet
 * @param sheetId - Can be sheet name or gid (numeric ID)
 * @param range - Optional A1 notation range (e.g., "A1:D10"), defaults to all data
 * Requires: spreadsheets.readonly or spreadsheets scope
 */
export async function getSheetData(
  accessToken: string,
  spreadsheetId: string,
  sheetId: string | number,
  range?: string
): Promise<SheetData> {
  return fetchWithRetry(async () => {
    // If sheetId is a number (gid), we need to first get the sheet name
    let sheetName: string;

    if (typeof sheetId === 'number') {
      const metadata = await getSpreadsheet(accessToken, spreadsheetId);
      const sheet = metadata.sheets.find((s) => s.properties.sheetId === sheetId);
      if (!sheet) {
        throw new GoogleSheetsError(`Sheet with gid ${sheetId} not found`);
      }
      sheetName = sheet.properties.title;
    } else {
      sheetName = sheetId;
    }

    // Build the range string
    const rangeString = range ? `${sheetName}!${range}` : sheetName;

    const response = await fetch(
      `${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeString)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return handleGoogleResponse<SheetData>(response);
  });
}

/**
 * Updates data in a sheet (overwrites existing data in the range)
 * @param range - A1 notation range (e.g., "A1:D10")
 * @param values - 2D array of values to write
 * Requires: spreadsheets scope
 */
export async function updateSheetData(
  accessToken: string,
  spreadsheetId: string,
  sheetId: string | number,
  range: string,
  values: any[][]
): Promise<{
  updatedRange: string;
  updatedRows: number;
  updatedColumns: number;
  updatedCells: number;
}> {
  return fetchWithRetry(async () => {
    // If sheetId is a number (gid), get the sheet name
    let sheetName: string;

    if (typeof sheetId === 'number') {
      const metadata = await getSpreadsheet(accessToken, spreadsheetId);
      const sheet = metadata.sheets.find((s) => s.properties.sheetId === sheetId);
      if (!sheet) {
        throw new GoogleSheetsError(`Sheet with gid ${sheetId} not found`);
      }
      sheetName = sheet.properties.title;
    } else {
      sheetName = sheetId;
    }

    const rangeString = `${sheetName}!${range}`;

    const response = await fetch(
      `${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        rangeString
      )}?valueInputOption=USER_ENTERED`,
      {
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
      }
    );

    return handleGoogleResponse<{
      spreadsheetId: string;
      updatedRange: string;
      updatedRows: number;
      updatedColumns: number;
      updatedCells: number;
    }>(response);
  });
}

/**
 * Appends rows to the end of a sheet
 * @param values - 2D array of values to append
 * Requires: spreadsheets scope
 */
export async function appendRows(
  accessToken: string,
  spreadsheetId: string,
  sheetId: string | number,
  values: any[][]
): Promise<{
  updatedRange: string;
  updatedRows: number;
  updatedColumns: number;
  updatedCells: number;
}> {
  return fetchWithRetry(async () => {
    // If sheetId is a number (gid), get the sheet name
    let sheetName: string;

    if (typeof sheetId === 'number') {
      const metadata = await getSpreadsheet(accessToken, spreadsheetId);
      const sheet = metadata.sheets.find((s) => s.properties.sheetId === sheetId);
      if (!sheet) {
        throw new GoogleSheetsError(`Sheet with gid ${sheetId} not found`);
      }
      sheetName = sheet.properties.title;
    } else {
      sheetName = sheetId;
    }

    const response = await fetch(
      `${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        sheetName
      )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
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
      }
    );

    const data = await handleGoogleResponse<{
      spreadsheetId: string;
      tableRange: string;
      updates: {
        spreadsheetId: string;
        updatedRange: string;
        updatedRows: number;
        updatedColumns: number;
        updatedCells: number;
      };
    }>(response);

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
export async function deleteRows(
  accessToken: string,
  spreadsheetId: string,
  sheetId: number,
  startRow: number,
  count: number
): Promise<void> {
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

    await handleGoogleResponse<{ spreadsheetId: string; replies: unknown[] }>(response);
  });
}

/**
 * Gets the numeric sheet ID (gid) from a sheet name
 * Helper function for operations that require the numeric ID
 */
export async function getSheetIdByName(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string
): Promise<number> {
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
export async function clearSheetData(
  accessToken: string,
  spreadsheetId: string,
  sheetId: string | number,
  range?: string
): Promise<{ clearedRange: string }> {
  return fetchWithRetry(async () => {
    // If sheetId is a number (gid), get the sheet name
    let sheetName: string;

    if (typeof sheetId === 'number') {
      const metadata = await getSpreadsheet(accessToken, spreadsheetId);
      const sheet = metadata.sheets.find((s) => s.properties.sheetId === sheetId);
      if (!sheet) {
        throw new GoogleSheetsError(`Sheet with gid ${sheetId} not found`);
      }
      sheetName = sheet.properties.title;
    } else {
      sheetName = sheetId;
    }

    const rangeString = range ? `${sheetName}!${range}` : sheetName;

    const response = await fetch(
      `${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        rangeString
      )}:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return handleGoogleResponse<{ spreadsheetId: string; clearedRange: string }>(response);
  });
}

/**
 * Creates a new sheet in a spreadsheet
 * Requires: spreadsheets scope
 */
export async function createSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  rowCount: number = 1000,
  columnCount: number = 26
): Promise<GoogleSheet> {
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

    const data = await handleGoogleResponse<{
      spreadsheetId: string;
      replies: Array<{ addSheet: { properties: GoogleSheet['properties'] } }>;
    }>(response);

    return { properties: data.replies[0].addSheet.properties };
  });
}

/**
 * Helper function to convert column letters to numbers (A=1, B=2, ..., Z=26, AA=27, etc.)
 */
export function columnLetterToNumber(column: string): number {
  let result = 0;
  for (let i = 0; i < column.length; i++) {
    result = result * 26 + (column.charCodeAt(i) - 64);
  }
  return result;
}

/**
 * Helper function to convert column numbers to letters (1=A, 2=B, ..., 26=Z, 27=AA, etc.)
 */
export function columnNumberToLetter(column: number): string {
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
export function detectLastColumnIndex(sheetData: SheetData): number {
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
export async function ensureColumnsExist(
  accessToken: string,
  spreadsheetId: string,
  sheetId: string | number,
  requiredColumnCount: number
): Promise<void> {
  return fetchWithRetry(async () => {
    // Get the numeric sheet ID and current column count
    let numericSheetId: number;
    let currentColumnCount: number;

    const metadata = await getSpreadsheet(accessToken, spreadsheetId);

    if (typeof sheetId === 'number') {
      const sheet = metadata.sheets.find((s) => s.properties.sheetId === sheetId);
      if (!sheet) {
        throw new GoogleSheetsError(`Sheet with ID ${sheetId} not found`);
      }
      numericSheetId = sheetId;
      currentColumnCount = sheet.properties.gridProperties?.columnCount || 0;
    } else {
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
    const response = await fetch(
      `${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
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
      }
    );

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
export async function hideColumn(
  accessToken: string,
  spreadsheetId: string,
  sheetId: string | number,
  columnIndex: number
): Promise<void> {
  return fetchWithRetry(async () => {
    // Get the numeric sheet ID
    let numericSheetId: number;

    if (typeof sheetId === 'number') {
      numericSheetId = sheetId;
    } else {
      const metadata = await getSpreadsheet(accessToken, spreadsheetId);
      const sheet = metadata.sheets.find((s) => s.properties.title === sheetId);
      if (!sheet) {
        throw new GoogleSheetsError(`Sheet "${sheetId}" not found`);
      }
      numericSheetId = sheet.properties.sheetId;
    }

    // Use batchUpdate to hide the column
    const response = await fetch(
      `${SHEETS_API_BASE}/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
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
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new GoogleSheetsError(`Failed to hide column: ${error}`);
    }
  });
}
