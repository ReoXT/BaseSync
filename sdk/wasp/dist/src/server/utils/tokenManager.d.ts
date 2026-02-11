/**
 * Centralized Token Management
 *
 * Handles OAuth token lifecycle for both Airtable and Google Sheets:
 * - Automatic token refresh before expiry
 * - Error handling and retry logic
 * - Connection status tracking
 * - User notifications for reauth needs
 */
export type ConnectionType = 'airtable' | 'google';
export type ConnectionStatus = 'active' | 'expired' | 'needs_reauth' | 'revoked';
export interface TokenRefreshResult {
    success: boolean;
    accessToken?: string;
    error?: string;
    needsReauth: boolean;
}
export interface ConnectionHealth {
    type: ConnectionType;
    status: ConnectionStatus;
    expiresAt?: Date | null;
    lastRefreshAttempt?: Date | null;
    lastRefreshError?: string | null;
    needsReauth: boolean;
}
/**
 * Get a valid Airtable access token for a user
 * Automatically refreshes if expired or about to expire
 *
 * @param userId - User ID
 * @returns Valid access token
 * @throws Error if token cannot be refreshed and reauth is needed
 */
export declare function getValidAirtableToken(userId: string): Promise<string>;
/**
 * Get a valid Google Sheets access token for a user
 * Automatically refreshes if expired or about to expire
 *
 * @param userId - User ID
 * @returns Valid access token
 * @throws Error if token cannot be refreshed and reauth is needed
 */
export declare function getValidGoogleToken(userId: string): Promise<string>;
/**
 * Get a valid token for either service
 * Convenience wrapper around getValidAirtableToken and getValidGoogleToken
 *
 * @param userId - User ID
 * @param type - Connection type ('airtable' or 'google')
 * @returns Valid access token
 */
export declare function getValidToken(userId: string, type: ConnectionType): Promise<string>;
/**
 * Get the health status of a connection
 *
 * @param userId - User ID
 * @param type - Connection type
 * @returns Connection health information
 */
export declare function getConnectionHealth(userId: string, type: ConnectionType): Promise<ConnectionHealth | null>;
/**
 * Get health status for all connections for a user
 *
 * @param userId - User ID
 * @returns Array of connection health statuses
 */
export declare function getAllConnectionsHealth(userId: string): Promise<ConnectionHealth[]>;
/**
 * Check if any connections need reauth
 *
 * @param userId - User ID
 * @returns True if any connection needs reauth
 */
export declare function hasConnectionsNeedingReauth(userId: string): Promise<boolean>;
/**
 * Force refresh a token (useful for testing or manual operations)
 *
 * @param userId - User ID
 * @param type - Connection type
 * @returns Refresh result
 */
export declare function forceRefreshToken(userId: string, type: ConnectionType): Promise<TokenRefreshResult>;
/**
 * Clear the "needs reauth" flag manually (after user has reconnected)
 *
 * @param userId - User ID
 * @param type - Connection type
 */
export declare function clearNeedsReauth(userId: string, type: ConnectionType): Promise<void>;
//# sourceMappingURL=tokenManager.d.ts.map