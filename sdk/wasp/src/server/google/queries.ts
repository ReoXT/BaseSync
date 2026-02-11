/**
 * Wasp queries for Google Sheets data access
 * These functions fetch data from Google Sheets on behalf of authenticated users
 *
 * NOTE: Drive API query (listUserSpreadsheets) removed to avoid CASA assessment.
 * Users will paste spreadsheet URLs directly.
 */

import type { User, GoogleSheetsConnection } from 'wasp/entities';
import type {
  GetSpreadsheetSheets,
  GetSheetColumnHeaders,
  ValidateSpreadsheetUrl,
} from 'wasp/server/operations';
import { getGoogleSheetsAccessToken } from './auth';
import * as googleClient from './client';
import { parseGoogleSheetUrl } from './urlParser';

// ============================================================================
// Types
// ============================================================================

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
  sheetId: string | number; // Accept both sheet name and numeric gid
};
type GetSheetColumnHeadersOutput = {
  headers: string[];
  columnCount: number;
};

// ============================================================================
// Query: Validate Spreadsheet URL
// ============================================================================

/**
 * Validates a Google Sheets URL by parsing it and checking user has access
 * Replaces the need to browse Drive - user pastes URL directly
 */
export const validateSpreadsheetUrl: ValidateSpreadsheetUrl<
  ValidateSpreadsheetUrlInput,
  ValidateSpreadsheetUrlOutput
> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  const { url } = args;

  if (!url || typeof url !== 'string' || !url.trim()) {
    throw new Error('Please provide a valid Google Sheets URL');
  }

  // Check if user has Google Sheets connection
  const connection = await context.entities.GoogleSheetsConnection.findUnique({
    where: { userId: context.user.id },
  });

  if (!connection) {
    throw new Error(
      'Google account not connected. Please connect your Google account first.'
    );
  }

  try {
    // Parse the URL to extract spreadsheet ID
    const parsed = parseGoogleSheetUrl(url.trim());

    // Get access token (automatically refreshes if expired)
    const accessToken = await getGoogleSheetsAccessToken(
      context.user.id,
      context.entities.GoogleSheetsConnection as any
    );

    // Validate spreadsheet exists and user has access
    const spreadsheet = await googleClient.validateAndGetSpreadsheet(
      accessToken,
      parsed.spreadsheetId
    );

    return {
      spreadsheetId: spreadsheet.id,
      spreadsheetTitle: spreadsheet.title,
      sheets: spreadsheet.sheets,
    };
  } catch (error) {
    console.error('Failed to validate Google Sheets URL:', error);

    // Provide user-friendly error messages
    if (error instanceof googleClient.GoogleSheetsError) {
      // Already has a user-friendly message from validateAndGetSpreadsheet
      throw error;
    }

    if (error instanceof Error) {
      // Wrap URL parsing errors in user-friendly messages
      if (error.message.includes('Invalid') || error.message.includes('spreadsheet')) {
        throw new Error(
          'Invalid Google Sheets URL. Please check the URL and try again.'
        );
      }

      if (error.message.includes('refresh') || error.message.includes('token')) {
        throw new Error(
          'Your Google connection has expired. Please reconnect your Google account.'
        );
      }

      // Generic error - don't expose implementation details
      throw new Error('Failed to validate spreadsheet. Please check the URL and try again.');
    }

    throw new Error('Failed to validate spreadsheet. Please try again.');
  }
};

// ============================================================================
// Query: Get Spreadsheet Sheets
// ============================================================================

/**
 * Gets all sheets (tabs) within a specific Google Spreadsheet
 * Automatically refreshes token if expired
 */
export const getSpreadsheetSheets: GetSpreadsheetSheets<
  GetSpreadsheetSheetsInput,
  GetSpreadsheetSheetsOutput
> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  const { spreadsheetId } = args;

  if (!spreadsheetId) {
    throw new Error('Spreadsheet ID is required');
  }

  // Check if user has Google Sheets connection
  const connection = await context.entities.GoogleSheetsConnection.findUnique({
    where: { userId: context.user.id },
  });

  if (!connection) {
    throw new Error(
      'Google account not connected. Please connect your Google account first.'
    );
  }

  try {
    // Get access token (automatically refreshes if expired)
    const accessToken = await getGoogleSheetsAccessToken(
      context.user.id,
      context.entities.GoogleSheetsConnection as any
    );

    // Fetch spreadsheet metadata from Google Sheets API
    const metadata = await googleClient.getSpreadsheet(accessToken, spreadsheetId);

    // Return simplified sheet data
    return {
      spreadsheetId: metadata.spreadsheetId,
      title: metadata.properties.title,
      spreadsheetUrl: metadata.spreadsheetUrl,
      sheets: metadata.sheets.map((sheet) => ({
        sheetId: sheet.properties.sheetId,
        title: sheet.properties.title,
        index: sheet.properties.index,
        rowCount: sheet.properties.gridProperties?.rowCount || 0,
        columnCount: sheet.properties.gridProperties?.columnCount || 0,
        hidden: sheet.properties.hidden,
      })),
    };
  } catch (error) {
    console.error('Failed to get spreadsheet sheets:', error);

    // Provide user-friendly error messages
    if (error instanceof googleClient.GoogleSheetsError) {
      if (error.isAuthError) {
        throw new Error(
          'Your Google connection has expired or lacks permissions. Please reconnect your Google account.'
        );
      }
      if (error.isQuotaError) {
        throw new Error(
          'Google API quota exceeded. Please try again later or contact support.'
        );
      }
      if (error.statusCode === 404) {
        throw new Error(
          `Spreadsheet with ID "${spreadsheetId}" not found or you don't have access to it.`
        );
      }
      throw new Error(`Failed to fetch spreadsheet: ${error.message}`);
    }

    if (error instanceof Error) {
      if (error.message.includes('refresh') || error.message.includes('token')) {
        throw new Error(
          'Your Google connection has expired. Please reconnect your Google account.'
        );
      }
      if (error.message.includes('not found')) {
        throw error; // Re-throw "not found" errors as-is
      }
      if (error.message.includes('GOOGLE_SHEETS_CLIENT_ID')) {
        throw new Error('Google Sheets integration is not configured. Please contact support.');
      }
      throw new Error(`Failed to fetch spreadsheet: ${error.message}`);
    }

    throw new Error('Failed to fetch spreadsheet. Please try again.');
  }
};

// ============================================================================
// Query: Get Sheet Column Headers
// ============================================================================

/**
 * Gets the column headers from the first row of a sheet
 * Automatically refreshes token if expired
 */
export const getSheetColumnHeaders: GetSheetColumnHeaders<
  GetSheetColumnHeadersInput,
  GetSheetColumnHeadersOutput
> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  const { spreadsheetId, sheetId } = args;

  if (!spreadsheetId || sheetId === undefined) {
    throw new Error('Spreadsheet ID and Sheet ID are required');
  }

  // Check if user has Google Sheets connection
  const connection = await context.entities.GoogleSheetsConnection.findUnique({
    where: { userId: context.user.id },
  });

  if (!connection) {
    throw new Error(
      'Google account not connected. Please connect your Google account first.'
    );
  }

  try {
    // Get access token (automatically refreshes if expired)
    const accessToken = await getGoogleSheetsAccessToken(
      context.user.id,
      context.entities.GoogleSheetsConnection as any
    );

    // Get the first row of the sheet (headers)
    const sheetData = await googleClient.getSheetData(
      accessToken,
      spreadsheetId,
      sheetId,
      'A1:ZZ1' // Get first row, up to column ZZ (702 columns)
    );

    // Extract headers from the first row
    const headers = sheetData.values?.[0] || [];

    // Get the total column count from metadata
    const metadata = await googleClient.getSpreadsheet(accessToken, spreadsheetId);

    // Find sheet by either numeric ID or name
    const sheet = typeof sheetId === 'number'
      ? metadata.sheets.find((s) => s.properties.sheetId === sheetId)
      : metadata.sheets.find((s) => s.properties.title === sheetId);

    const columnCount = sheet?.properties.gridProperties?.columnCount || headers.length;

    // If headers are empty, generate column letters (A, B, C, etc.)
    const finalHeaders = headers.length > 0
      ? headers.map((h, i) => h || googleClient.columnNumberToLetter(i + 1))
      : Array.from({ length: columnCount }, (_, i) => googleClient.columnNumberToLetter(i + 1));

    return {
      headers: finalHeaders.slice(0, columnCount),
      columnCount,
    };
  } catch (error) {
    console.error('Failed to get sheet column headers:', error);

    // Provide user-friendly error messages
    if (error instanceof googleClient.GoogleSheetsError) {
      if (error.isAuthError) {
        throw new Error(
          'Your Google connection has expired or lacks permissions. Please reconnect your Google account.'
        );
      }
      if (error.isQuotaError) {
        throw new Error(
          'Google API quota exceeded. Please try again later or contact support.'
        );
      }
      throw new Error(`Failed to fetch column headers: ${error.message}`);
    }

    if (error instanceof Error) {
      if (error.message.includes('refresh') || error.message.includes('token')) {
        throw new Error(
          'Your Google connection has expired. Please reconnect your Google account.'
        );
      }
      throw new Error(`Failed to fetch column headers: ${error.message}`);
    }

    throw new Error('Failed to fetch column headers. Please try again.');
  }
};
