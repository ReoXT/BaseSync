/**
 * Centralized Token Management
 *
 * Handles OAuth token lifecycle for both Airtable and Google Sheets:
 * - Automatic token refresh before expiry
 * - Error handling and retry logic
 * - Connection status tracking
 * - User notifications for reauth needs
 */

import type { User, AirtableConnection, GoogleSheetsConnection } from 'wasp/entities';
import { prisma } from 'wasp/server';
import {
  refreshAccessToken as refreshAirtableToken,
  storeAirtableConnection,
  getAirtableAccessToken as getAirtableTokenRaw,
} from '../airtable/auth';
import {
  refreshAccessToken as refreshGoogleToken,
  storeGoogleSheetsConnection,
  getGoogleSheetsAccessToken as getGoogleTokenRaw,
} from '../google/auth';
import { decrypt } from '../airtable/encryption';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Constants
// ============================================================================

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REFRESH_RETRIES = 3;
const REFRESH_RETRY_DELAY_MS = 1000; // 1 second between retries

// Error messages that indicate reauth is needed
const REAUTH_ERROR_PATTERNS = [
  'invalid_grant',
  'refresh token',
  'revoked',
  'expired',
  'unauthorized',
  'invalid_client',
  'Please reconnect',
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if an error message indicates that reauth is required
 */
function isReauthError(error: string): boolean {
  const lowerError = error.toLowerCase();
  return REAUTH_ERROR_PATTERNS.some((pattern) => lowerError.includes(pattern.toLowerCase()));
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if a token is expired or about to expire
 */
function isTokenExpiringSoon(expiryDate: Date | null): boolean {
  if (!expiryDate) {
    return true; // No expiry date means we should refresh
  }
  const now = Date.now();
  const expiryBuffer = now + TOKEN_EXPIRY_BUFFER_MS;
  return expiryDate.getTime() <= expiryBuffer;
}

/**
 * Mark connection as needing reauth in the database
 */
async function markConnectionNeedsReauth(
  userId: string,
  type: ConnectionType,
  errorMessage: string
): Promise<void> {
  const timestamp = new Date();

  try {
    if (type === 'airtable') {
      await prisma.airtableConnection.update({
        where: { userId },
        data: {
          lastRefreshError: errorMessage,
          lastRefreshAttempt: timestamp,
          needsReauth: true,
        },
      });
    } else {
      await prisma.googleSheetsConnection.update({
        where: { userId },
        data: {
          lastRefreshError: errorMessage,
          lastRefreshAttempt: timestamp,
          needsReauth: true,
        },
      });
    }

    console.warn(`[TokenManager] Marked ${type} connection for user ${userId} as needing reauth: ${errorMessage}`);
  } catch (dbError) {
    console.error(`[TokenManager] Failed to mark ${type} connection as needing reauth:`, dbError);
  }
}

/**
 * Clear reauth flag when connection is restored
 */
async function clearReauthFlag(userId: string, type: ConnectionType): Promise<void> {
  try {
    if (type === 'airtable') {
      await prisma.airtableConnection.update({
        where: { userId },
        data: {
          needsReauth: false,
          lastRefreshError: null,
        },
      });
    } else {
      await prisma.googleSheetsConnection.update({
        where: { userId },
        data: {
          needsReauth: false,
          lastRefreshError: null,
        },
      });
    }

    console.log(`[TokenManager] Cleared reauth flag for ${type} connection for user ${userId}`);
  } catch (dbError) {
    console.error(`[TokenManager] Failed to clear reauth flag:`, dbError);
  }
}

// ============================================================================
// Token Refresh with Retry Logic
// ============================================================================

/**
 * Refresh an Airtable access token with retry logic
 */
async function refreshAirtableTokenWithRetry(
  userId: string,
  refreshToken: string,
  retries: number = MAX_REFRESH_RETRIES
): Promise<TokenRefreshResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[TokenManager] Attempting to refresh Airtable token for user ${userId} (attempt ${attempt}/${retries})`);

      const tokenResponse = await refreshAirtableToken(refreshToken);
      await storeAirtableConnection(userId, tokenResponse, prisma);
      await clearReauthFlag(userId, 'airtable');

      console.log(`[TokenManager] ✓ Successfully refreshed Airtable token for user ${userId}`);

      return {
        success: true,
        accessToken: tokenResponse.access_token,
        needsReauth: false,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorMessage = lastError.message;

      console.error(`[TokenManager] ✗ Failed to refresh Airtable token (attempt ${attempt}/${retries}):`, errorMessage);

      // Check if this is a reauth error (don't retry these)
      if (isReauthError(errorMessage)) {
        await markConnectionNeedsReauth(userId, 'airtable', errorMessage);
        return {
          success: false,
          error: errorMessage,
          needsReauth: true,
        };
      }

      // If we have retries left and it's a network error, wait and retry
      if (attempt < retries) {
        await sleep(REFRESH_RETRY_DELAY_MS * attempt); // Exponential backoff
      }
    }
  }

  // All retries failed
  const errorMessage = lastError?.message || 'Unknown error';
  await markConnectionNeedsReauth(userId, 'airtable', `Failed after ${retries} attempts: ${errorMessage}`);

  return {
    success: false,
    error: errorMessage,
    needsReauth: true,
  };
}

/**
 * Refresh a Google Sheets access token with retry logic
 */
async function refreshGoogleTokenWithRetry(
  userId: string,
  refreshToken: string,
  retries: number = MAX_REFRESH_RETRIES
): Promise<TokenRefreshResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[TokenManager] Attempting to refresh Google token for user ${userId} (attempt ${attempt}/${retries})`);

      const tokenResponse = await refreshGoogleToken(refreshToken);
      await storeGoogleSheetsConnection(userId, tokenResponse, prisma);
      await clearReauthFlag(userId, 'google');

      console.log(`[TokenManager] ✓ Successfully refreshed Google token for user ${userId}`);

      return {
        success: true,
        accessToken: tokenResponse.access_token,
        needsReauth: false,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorMessage = lastError.message;

      console.error(`[TokenManager] ✗ Failed to refresh Google token (attempt ${attempt}/${retries}):`, errorMessage);

      // Check if this is a reauth error (don't retry these)
      if (isReauthError(errorMessage)) {
        await markConnectionNeedsReauth(userId, 'google', errorMessage);
        return {
          success: false,
          error: errorMessage,
          needsReauth: true,
        };
      }

      // If we have retries left and it's a network error, wait and retry
      if (attempt < retries) {
        await sleep(REFRESH_RETRY_DELAY_MS * attempt); // Exponential backoff
      }
    }
  }

  // All retries failed
  const errorMessage = lastError?.message || 'Unknown error';
  await markConnectionNeedsReauth(userId, 'google', `Failed after ${retries} attempts: ${errorMessage}`);

  return {
    success: false,
    error: errorMessage,
    needsReauth: true,
  };
}

// ============================================================================
// Public API - Token Management
// ============================================================================

/**
 * Get a valid Airtable access token for a user
 * Automatically refreshes if expired or about to expire
 *
 * @param userId - User ID
 * @returns Valid access token
 * @throws Error if token cannot be refreshed and reauth is needed
 */
export async function getValidAirtableToken(userId: string): Promise<string> {
  console.log(`[TokenManager] Getting valid Airtable token for user ${userId}`);

  const connection = await prisma.airtableConnection.findUnique({
    where: { userId },
  });

  if (!connection) {
    throw new Error('Airtable connection not found. Please connect your Airtable account.');
  }

  // Check if connection is marked as needing reauth
  if (connection.needsReauth) {
    throw new Error(
      `Airtable connection needs reauthorization. ${connection.lastRefreshError || 'Please reconnect your Airtable account.'}`
    );
  }

  // Check if token is expired or about to expire
  if (isTokenExpiringSoon(connection.tokenExpiry)) {
    console.log(`[TokenManager] Airtable token expired or expiring soon, refreshing...`);

    if (!connection.refreshToken) {
      await markConnectionNeedsReauth(userId, 'airtable', 'No refresh token available');
      throw new Error('Airtable refresh token not found. Please reconnect your Airtable account.');
    }

    const refreshResult = await refreshAirtableTokenWithRetry(userId, connection.refreshToken);

    if (!refreshResult.success) {
      throw new Error(
        `Failed to refresh Airtable token: ${refreshResult.error}. Please reconnect your Airtable account.`
      );
    }

    return refreshResult.accessToken!;
  }

  // Token is still valid, decrypt and return
  console.log(`[TokenManager] Airtable token still valid, returning cached token`);
  return decrypt(connection.accessToken);
}

/**
 * Get a valid Google Sheets access token for a user
 * Automatically refreshes if expired or about to expire
 *
 * @param userId - User ID
 * @returns Valid access token
 * @throws Error if token cannot be refreshed and reauth is needed
 */
export async function getValidGoogleToken(userId: string): Promise<string> {
  console.log(`[TokenManager] Getting valid Google token for user ${userId}`);

  const connection = await prisma.googleSheetsConnection.findUnique({
    where: { userId },
  });

  if (!connection) {
    throw new Error('Google Sheets connection not found. Please connect your Google account.');
  }

  // Check if connection is marked as needing reauth
  if (connection.needsReauth) {
    throw new Error(
      `Google Sheets connection needs reauthorization. ${connection.lastRefreshError || 'Please reconnect your Google account.'}`
    );
  }

  // Check if token is expired or about to expire
  if (isTokenExpiringSoon(connection.tokenExpiry)) {
    console.log(`[TokenManager] Google token expired or expiring soon, refreshing...`);

    if (!connection.refreshToken) {
      await markConnectionNeedsReauth(userId, 'google', 'No refresh token available');
      throw new Error('Google refresh token not found. Please reconnect your Google account.');
    }

    const refreshResult = await refreshGoogleTokenWithRetry(userId, connection.refreshToken);

    if (!refreshResult.success) {
      throw new Error(
        `Failed to refresh Google token: ${refreshResult.error}. Please reconnect your Google account.`
      );
    }

    return refreshResult.accessToken!;
  }

  // Token is still valid, decrypt and return
  console.log(`[TokenManager] Google token still valid, returning cached token`);
  return decrypt(connection.accessToken);
}

/**
 * Get a valid token for either service
 * Convenience wrapper around getValidAirtableToken and getValidGoogleToken
 *
 * @param userId - User ID
 * @param type - Connection type ('airtable' or 'google')
 * @returns Valid access token
 */
export async function getValidToken(userId: string, type: ConnectionType): Promise<string> {
  if (type === 'airtable') {
    return getValidAirtableToken(userId);
  } else {
    return getValidGoogleToken(userId);
  }
}

// ============================================================================
// Connection Health Checks
// ============================================================================

/**
 * Get the health status of a connection
 *
 * @param userId - User ID
 * @param type - Connection type
 * @returns Connection health information
 */
export async function getConnectionHealth(
  userId: string,
  type: ConnectionType
): Promise<ConnectionHealth | null> {
  const connection =
    type === 'airtable'
      ? await prisma.airtableConnection.findUnique({ where: { userId } })
      : await prisma.googleSheetsConnection.findUnique({ where: { userId } });

  if (!connection) {
    return null;
  }

  // Determine status
  let status: ConnectionStatus;
  if (connection.needsReauth) {
    status = 'needs_reauth';
  } else if (connection.tokenExpiry && connection.tokenExpiry < new Date()) {
    status = 'expired';
  } else if (connection.tokenExpiry && isTokenExpiringSoon(connection.tokenExpiry)) {
    status = 'expired';
  } else {
    status = 'active';
  }

  return {
    type,
    status,
    expiresAt: connection.tokenExpiry ?? null,
    lastRefreshAttempt: connection.lastRefreshAttempt ?? null,
    lastRefreshError: connection.lastRefreshError ?? null,
    needsReauth: connection.needsReauth || false,
  };
}

/**
 * Get health status for all connections for a user
 *
 * @param userId - User ID
 * @returns Array of connection health statuses
 */
export async function getAllConnectionsHealth(userId: string): Promise<ConnectionHealth[]> {
  const airtableHealth = await getConnectionHealth(userId, 'airtable');
  const googleHealth = await getConnectionHealth(userId, 'google');

  return [airtableHealth, googleHealth].filter((h): h is ConnectionHealth => h !== null);
}

/**
 * Check if any connections need reauth
 *
 * @param userId - User ID
 * @returns True if any connection needs reauth
 */
export async function hasConnectionsNeedingReauth(userId: string): Promise<boolean> {
  const [airtable, google] = await Promise.all([
    prisma.airtableConnection.findUnique({
      where: { userId },
      select: { needsReauth: true },
    }),
    prisma.googleSheetsConnection.findUnique({
      where: { userId },
      select: { needsReauth: true },
    }),
  ]);

  return !!(airtable?.needsReauth || google?.needsReauth);
}

// ============================================================================
// Manual Token Operations
// ============================================================================

/**
 * Force refresh a token (useful for testing or manual operations)
 *
 * @param userId - User ID
 * @param type - Connection type
 * @returns Refresh result
 */
export async function forceRefreshToken(
  userId: string,
  type: ConnectionType
): Promise<TokenRefreshResult> {
  console.log(`[TokenManager] Force refreshing ${type} token for user ${userId}`);

  const connection =
    type === 'airtable'
      ? await prisma.airtableConnection.findUnique({ where: { userId } })
      : await prisma.googleSheetsConnection.findUnique({ where: { userId } });

  if (!connection) {
    return {
      success: false,
      error: `${type} connection not found`,
      needsReauth: true,
    };
  }

  if (!connection.refreshToken) {
    return {
      success: false,
      error: 'No refresh token available',
      needsReauth: true,
    };
  }

  if (type === 'airtable') {
    return refreshAirtableTokenWithRetry(userId, connection.refreshToken);
  } else {
    return refreshGoogleTokenWithRetry(userId, connection.refreshToken);
  }
}

/**
 * Clear the "needs reauth" flag manually (after user has reconnected)
 *
 * @param userId - User ID
 * @param type - Connection type
 */
export async function clearNeedsReauth(userId: string, type: ConnectionType): Promise<void> {
  await clearReauthFlag(userId, type);
}
