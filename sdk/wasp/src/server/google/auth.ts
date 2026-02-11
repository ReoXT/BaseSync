import type { PrismaClient } from '@prisma/client';
import type { User } from 'wasp/entities';
import { encrypt, decrypt } from '../airtable/encryption';

// Type for Prisma delegate (from context.entities)
type GoogleSheetsConnectionDelegate = {
  findUnique: PrismaClient['googleSheetsConnection']['findUnique'];
  upsert: PrismaClient['googleSheetsConnection']['upsert'];
  delete: PrismaClient['googleSheetsConnection']['delete'];
};

// Union type that accepts either full Prisma client or just the delegate
type PrismaOrDelegate = PrismaClient | GoogleSheetsConnectionDelegate;

/**
 * Google OAuth Configuration
 * Docs: https://developers.google.com/identity/protocols/oauth2/web-server
 */
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

// Required scopes for BaseSync
// Only using spreadsheets scope to avoid Google CASA assessment requirements
const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
];

interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string; // Only provided on first authorization or if access_type=offline
  expires_in: number; // seconds
  token_type: 'Bearer';
  scope: string;
}

interface GoogleUserInfo {
  id: string;
  email?: string;
  verified_email?: boolean;
  name?: string;
  picture?: string;
}

/**
 * Gets Google OAuth configuration from environment variables
 */
function getGoogleConfig(): GoogleOAuthConfig {
  const clientId = process.env.GOOGLE_SHEETS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_SHEETS_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_SHEETS_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'Missing Google OAuth configuration. Please set GOOGLE_SHEETS_CLIENT_ID, ' +
      'GOOGLE_SHEETS_CLIENT_SECRET, and GOOGLE_SHEETS_REDIRECT_URI in your .env.server file.'
    );
  }

  return { clientId, clientSecret, redirectUri };
}

/**
 * Generates the Google OAuth authorization URL
 * User should be redirected to this URL to start the OAuth flow
 *
 * @param state - Optional state parameter for CSRF protection
 * @returns Authorization URL to redirect the user to
 */
export function generateAuthorizationUrl(state?: string): string {
  const config = getGoogleConfig();

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: REQUIRED_SCOPES.join(' '),
    access_type: 'offline', // Required to get refresh token
    prompt: 'consent', // Force consent screen to ensure refresh token is returned
    ...(state && { state }),
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchanges an authorization code for access and refresh tokens
 *
 * @param code - Authorization code from Google callback
 * @returns Token response from Google
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<GoogleTokenResponse> {
  const config = getGoogleConfig();

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to exchange code for tokens: ${response.status} ${response.statusText}. ` +
      `Error: ${JSON.stringify(errorData)}`
    );
  }

  return await response.json() as GoogleTokenResponse;
}

/**
 * Refreshes an expired access token using the refresh token
 *
 * @param refreshToken - The refresh token (encrypted)
 * @returns New token response from Google
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<GoogleTokenResponse> {
  const config = getGoogleConfig();

  // Decrypt the refresh token
  const decryptedRefreshToken = decrypt(refreshToken);

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: decryptedRefreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to refresh access token: ${response.status} ${response.statusText}. ` +
      `Error: ${JSON.stringify(errorData)}`
    );
  }

  return await response.json() as GoogleTokenResponse;
}

/**
 * Stores encrypted Google OAuth tokens in the database
 * Creates a new connection or updates existing one for the user
 *
 * @param userId - User ID
 * @param tokenResponse - Token response from Google
 * @param prisma - Prisma client instance
 * @param googleAccountEmail - Optional email to store with connection
 */
export async function storeGoogleSheetsConnection(
  userId: User['id'],
  tokenResponse: GoogleTokenResponse,
  prisma: PrismaOrDelegate,
  googleAccountEmail?: string
): Promise<void> {
  // Get the delegate (either it IS the delegate, or get it from the client)
  const delegate = 'googleSheetsConnection' in prisma
    ? prisma.googleSheetsConnection
    : prisma;

  // Encrypt tokens before storing
  const encryptedAccessToken = encrypt(tokenResponse.access_token);
  const encryptedRefreshToken = tokenResponse.refresh_token
    ? encrypt(tokenResponse.refresh_token)
    : null;

  // Calculate token expiry time
  const tokenExpiry = new Date(Date.now() + tokenResponse.expires_in * 1000);

  // Get existing connection to preserve refresh token if not provided
  const existingConnection = await delegate.findUnique({
    where: { userId },
  });

  // Upsert the connection (create or update)
  await delegate.upsert({
    where: { userId },
    create: {
      userId,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiry,
      googleAccountEmail,
    },
    update: {
      accessToken: encryptedAccessToken,
      // Only update refresh token if a new one was provided
      // Google doesn't always return a new refresh token
      ...(encryptedRefreshToken && { refreshToken: encryptedRefreshToken }),
      tokenExpiry,
      ...(googleAccountEmail && { googleAccountEmail }),
      updatedAt: new Date(),
    },
  });
}

/**
 * Gets and decrypts the Google Sheets access token for a user
 * Automatically refreshes the token if it's expired
 *
 * @param userId - User ID
 * @param prisma - Prisma client instance
 * @returns Decrypted access token
 */
export async function getGoogleSheetsAccessToken(
  userId: User['id'],
  prisma: PrismaOrDelegate
): Promise<string> {
  // Get the delegate (either it IS the delegate, or get it from the client)
  const delegate = 'googleSheetsConnection' in prisma
    ? prisma.googleSheetsConnection
    : prisma;

  const connection = await delegate.findUnique({
    where: { userId },
  });

  if (!connection) {
    throw new Error('Google Sheets connection not found for user. Please connect your Google account.');
  }

  // Check if token is expired or about to expire (within 5 minutes)
  const now = new Date();
  const expiryBuffer = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes buffer

  if (connection.tokenExpiry && connection.tokenExpiry <= expiryBuffer) {
    // Token is expired or about to expire, refresh it
    if (!connection.refreshToken) {
      throw new Error('Google refresh token not found. Please reconnect your Google account.');
    }

    try {
      const newTokens = await refreshAccessToken(connection.refreshToken);
      await storeGoogleSheetsConnection(userId, newTokens, delegate as any, connection.googleAccountEmail || undefined);
      return newTokens.access_token;
    } catch (error) {
      throw new Error(
        `Failed to refresh Google token: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
        'Please reconnect your Google account.'
      );
    }
  }

  // Token is still valid, decrypt and return
  return decrypt(connection.accessToken);
}

/**
 * Fetches the user's Google account information
 *
 * @param accessToken - Valid access token
 * @returns User info from Google
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to fetch Google user info: ${response.status} ${response.statusText}. ` +
      `Error: ${JSON.stringify(errorData)}`
    );
  }

  return await response.json() as GoogleUserInfo;
}

/**
 * Revokes Google access and deletes the connection from the database
 *
 * @param userId - User ID
 * @param prisma - Prisma client instance
 */
export async function revokeGoogleSheetsConnection(
  userId: User['id'],
  prisma: PrismaOrDelegate
): Promise<void> {
  // Get the delegate (either it IS the delegate, or get it from the client)
  const delegate = 'googleSheetsConnection' in prisma
    ? prisma.googleSheetsConnection
    : prisma;

  const connection = await delegate.findUnique({
    where: { userId },
  });

  if (!connection) {
    return; // No connection to revoke
  }

  // Attempt to revoke the token with Google
  try {
    const decryptedToken = decrypt(connection.accessToken);
    const params = new URLSearchParams({
      token: decryptedToken,
    });

    await fetch(`${GOOGLE_REVOKE_URL}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  } catch (error) {
    // If revocation fails, we still delete the connection from our database
    console.error('Failed to revoke Google token:', error);
  }

  // Delete the connection from our database
  await delegate.delete({
    where: { userId },
  });
}

/**
 * Checks if a user has an active Google Sheets connection
 *
 * @param userId - User ID
 * @param prisma - Prisma client instance
 * @returns True if user has a valid connection
 */
export async function hasGoogleSheetsConnection(
  userId: User['id'],
  prisma: PrismaOrDelegate
): Promise<boolean> {
  // Get the delegate (either it IS the delegate, or get it from the client)
  const delegate = 'googleSheetsConnection' in prisma
    ? prisma.googleSheetsConnection
    : prisma;

  const connection = await delegate.findUnique({
    where: { userId },
    select: { id: true },
  });

  return !!connection;
}

/**
 * Validates the scopes returned by Google match what we requested
 *
 * @param grantedScopes - Space-separated list of granted scopes
 * @returns True if all required scopes are granted
 */
export function validateScopes(grantedScopes: string): boolean {
  const granted = new Set(grantedScopes.split(' '));
  return REQUIRED_SCOPES.every(scope => granted.has(scope));
}
