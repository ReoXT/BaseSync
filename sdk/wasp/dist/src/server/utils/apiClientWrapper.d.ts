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
export declare class TokenRefreshError extends Error {
    readonly needsReauth: boolean;
    constructor(message: string, needsReauth?: boolean);
}
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
export declare function withAirtableToken<T>(userId: string, apiCall: (accessToken: string) => Promise<T>, options?: ApiCallOptions): Promise<T>;
/**
 * Execute an Airtable API call with automatic token management (sync version)
 * Use this when you already have error handling and just need the token
 *
 * @param userId - User ID
 * @returns Valid access token
 * @throws TokenRefreshError if token refresh fails
 */
export declare function getAirtableToken(userId: string): Promise<string>;
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
export declare function withGoogleToken<T>(userId: string, apiCall: (accessToken: string) => Promise<T>, options?: ApiCallOptions): Promise<T>;
/**
 * Execute a Google Sheets API call with automatic token management (sync version)
 * Use this when you already have error handling and just need the token
 *
 * @param userId - User ID
 * @returns Valid access token
 * @throws TokenRefreshError if token refresh fails
 */
export declare function getGoogleToken(userId: string): Promise<string>;
/**
 * Execute an API call with automatic token management for either service
 *
 * @param userId - User ID
 * @param type - Service type ('airtable' or 'google')
 * @param apiCall - Function that takes an access token and makes the API call
 * @param options - Optional retry configuration
 * @returns Result of the API call
 */
export declare function withToken<T>(userId: string, type: 'airtable' | 'google', apiCall: (accessToken: string) => Promise<T>, options?: ApiCallOptions): Promise<T>;
//# sourceMappingURL=apiClientWrapper.d.ts.map