/**
 * API Client Wrapper with Automatic Token Management
 *
 * This wrapper provides convenience functions that automatically handle
 * token refresh before making API calls to Airtable and Google Sheets.
 *
 * Usage:
 * Instead of manually calling getAirtableAccessToken and passing it to the client:
 *   const token = await getAirtableAccessToken(userId);
 *   const bases = await listBases(token);
 *
 * Use the wrapper:
 *   const bases = await withAirtableToken(userId, (token) => listBases(token));
 *
 * The wrapper automatically:
 * - Checks token expiry
 * - Refreshes if needed
 * - Handles refresh failures
 * - Marks connections as needing reauth when appropriate
 */

import { getValidAirtableToken, getValidGoogleToken } from './tokenManager';

// ============================================================================
// Types
// ============================================================================

export interface ApiCallOptions {
  /**
   * Maximum number of retries for the API call
   * Default: 0 (no retries)
   */
  maxRetries?: number;

  /**
   * Delay between retries in milliseconds
   * Default: 1000 (1 second)
   */
  retryDelay?: number;

  /**
   * Whether to use exponential backoff for retries
   * Default: true
   */
  exponentialBackoff?: boolean;
}

export class TokenRefreshError extends Error {
  constructor(
    message: string,
    public readonly needsReauth: boolean = true
  ) {
    super(message);
    this.name = 'TokenRefreshError';
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate retry delay with optional exponential backoff
 */
function getRetryDelay(
  baseDelay: number,
  attempt: number,
  useExponential: boolean
): number {
  if (!useExponential) {
    return baseDelay;
  }
  return baseDelay * Math.pow(2, attempt - 1);
}

// ============================================================================
// Airtable API Wrapper
// ============================================================================

/**
 * Execute an Airtable API call with automatic token management
 *
 * @param userId - User ID
 * @param apiCall - Function that takes an access token and makes the API call
 * @param options - Optional retry configuration
 * @returns Result of the API call
 * @throws TokenRefreshError if token refresh fails
 *
 * @example
 * const bases = await withAirtableToken(userId, (token) => {
 *   return listBases(token);
 * });
 */
export async function withAirtableToken<T>(
  userId: string,
  apiCall: (accessToken: string) => Promise<T>,
  options: ApiCallOptions = {}
): Promise<T> {
  const {
    maxRetries = 0,
    retryDelay = 1000,
    exponentialBackoff = true,
  } = options;

  // Get valid token (automatically refreshes if needed)
  let accessToken: string;
  try {
    accessToken = await getValidAirtableToken(userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new TokenRefreshError(
      `Failed to get valid Airtable token: ${message}`,
      true
    );
  }

  // Execute the API call with retries
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall(accessToken);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this is the last attempt, don't wait
      if (attempt >= maxRetries) {
        break;
      }

      // Wait before retrying
      const delay = getRetryDelay(retryDelay, attempt + 1, exponentialBackoff);
      console.log(
        `[ApiClientWrapper] Airtable API call failed (attempt ${attempt + 1}/${maxRetries + 1}), ` +
        `retrying in ${delay}ms: ${lastError.message}`
      );
      await sleep(delay);
    }
  }

  // All attempts failed
  throw lastError || new Error('API call failed');
}

/**
 * Execute an Airtable API call with automatic token management (sync version)
 * Use this when you already have error handling and just need the token
 *
 * @param userId - User ID
 * @returns Valid access token
 * @throws TokenRefreshError if token refresh fails
 */
export async function getAirtableToken(userId: string): Promise<string> {
  try {
    return await getValidAirtableToken(userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new TokenRefreshError(
      `Failed to get valid Airtable token: ${message}`,
      true
    );
  }
}

// ============================================================================
// Google Sheets API Wrapper
// ============================================================================

/**
 * Execute a Google Sheets API call with automatic token management
 *
 * @param userId - User ID
 * @param apiCall - Function that takes an access token and makes the API call
 * @param options - Optional retry configuration
 * @returns Result of the API call
 * @throws TokenRefreshError if token refresh fails
 *
 * @example
 * const spreadsheets = await withGoogleToken(userId, (token) => {
 *   return listSpreadsheets(token);
 * });
 */
export async function withGoogleToken<T>(
  userId: string,
  apiCall: (accessToken: string) => Promise<T>,
  options: ApiCallOptions = {}
): Promise<T> {
  const {
    maxRetries = 0,
    retryDelay = 1000,
    exponentialBackoff = true,
  } = options;

  // Get valid token (automatically refreshes if needed)
  let accessToken: string;
  try {
    accessToken = await getValidGoogleToken(userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new TokenRefreshError(
      `Failed to get valid Google token: ${message}`,
      true
    );
  }

  // Execute the API call with retries
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall(accessToken);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this is the last attempt, don't wait
      if (attempt >= maxRetries) {
        break;
      }

      // Wait before retrying
      const delay = getRetryDelay(retryDelay, attempt + 1, exponentialBackoff);
      console.log(
        `[ApiClientWrapper] Google API call failed (attempt ${attempt + 1}/${maxRetries + 1}), ` +
        `retrying in ${delay}ms: ${lastError.message}`
      );
      await sleep(delay);
    }
  }

  // All attempts failed
  throw lastError || new Error('API call failed');
}

/**
 * Execute a Google Sheets API call with automatic token management (sync version)
 * Use this when you already have error handling and just need the token
 *
 * @param userId - User ID
 * @returns Valid access token
 * @throws TokenRefreshError if token refresh fails
 */
export async function getGoogleToken(userId: string): Promise<string> {
  try {
    return await getValidGoogleToken(userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new TokenRefreshError(
      `Failed to get valid Google token: ${message}`,
      true
    );
  }
}

// ============================================================================
// Generic Wrapper
// ============================================================================

/**
 * Execute an API call with automatic token management for either service
 *
 * @param userId - User ID
 * @param type - Service type ('airtable' or 'google')
 * @param apiCall - Function that takes an access token and makes the API call
 * @param options - Optional retry configuration
 * @returns Result of the API call
 */
export async function withToken<T>(
  userId: string,
  type: 'airtable' | 'google',
  apiCall: (accessToken: string) => Promise<T>,
  options?: ApiCallOptions
): Promise<T> {
  if (type === 'airtable') {
    return withAirtableToken(userId, apiCall, options);
  } else {
    return withGoogleToken(userId, apiCall, options);
  }
}
