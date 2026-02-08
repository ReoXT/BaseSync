import { encrypt, decrypt } from './encryption';
import crypto from 'crypto';
/**
 * Airtable OAuth Configuration
 * Docs: https://airtable.com/developers/web/api/oauth-reference
 */
const AIRTABLE_AUTH_URL = 'https://airtable.com/oauth2/v1/authorize';
const AIRTABLE_TOKEN_URL = 'https://airtable.com/oauth2/v1/token';
// Required scopes for BaseSync
const REQUIRED_SCOPES = [
    'data.records:read',
    'data.records:write',
    'schema.bases:read',
];
/**
 * Gets Airtable OAuth configuration from environment variables
 */
function getAirtableConfig() {
    const clientId = process.env.AIRTABLE_CLIENT_ID;
    const clientSecret = process.env.AIRTABLE_CLIENT_SECRET;
    const redirectUri = process.env.AIRTABLE_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) {
        throw new Error('Missing Airtable OAuth configuration. Please set AIRTABLE_CLIENT_ID, ' +
            'AIRTABLE_CLIENT_SECRET, and AIRTABLE_REDIRECT_URI in your .env.server file.');
    }
    return { clientId, clientSecret, redirectUri };
}
/**
 * Generates PKCE code verifier and challenge for OAuth
 * @returns Object containing code verifier and challenge
 */
export function generatePKCEChallenge() {
    // Generate a random code verifier (43-128 characters)
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    // Create SHA256 hash of the verifier
    const hash = crypto.createHash('sha256').update(codeVerifier).digest();
    // Base64url encode the hash to get the challenge
    const codeChallenge = hash.toString('base64url');
    return {
        codeVerifier,
        codeChallenge,
    };
}
/**
 * Generates the Airtable OAuth authorization URL with PKCE
 * User should be redirected to this URL to start the OAuth flow
 *
 * @param state - Optional state parameter for CSRF protection
 * @param codeChallenge - PKCE code challenge
 * @returns Authorization URL to redirect the user to
 */
export function generateAuthorizationUrl(state, codeChallenge) {
    const config = getAirtableConfig();
    const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: REQUIRED_SCOPES.join(' '),
        ...(state && { state }),
        ...(codeChallenge && {
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        }),
    });
    return `${AIRTABLE_AUTH_URL}?${params.toString()}`;
}
/**
 * Exchanges an authorization code for access and refresh tokens
 *
 * @param code - Authorization code from Airtable callback
 * @param codeVerifier - PKCE code verifier (optional, required if PKCE was used)
 * @returns Token response from Airtable
 */
export async function exchangeCodeForTokens(code, codeVerifier) {
    const config = getAirtableConfig();
    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
        ...(codeVerifier && { code_verifier: codeVerifier }),
    });
    const authHeader = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
    const response = await fetch(AIRTABLE_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${authHeader}`,
        },
        body: params.toString(),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to exchange code for tokens: ${response.status} ${response.statusText}. ` +
            `Error: ${JSON.stringify(errorData)}`);
    }
    return await response.json();
}
/**
 * Refreshes an expired access token using the refresh token
 *
 * @param refreshToken - The refresh token (encrypted)
 * @returns New token response from Airtable
 */
export async function refreshAccessToken(refreshToken) {
    const config = getAirtableConfig();
    // Decrypt the refresh token
    const decryptedRefreshToken = decrypt(refreshToken);
    const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: decryptedRefreshToken,
    });
    const authHeader = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
    const response = await fetch(AIRTABLE_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${authHeader}`,
        },
        body: params.toString(),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to refresh access token: ${response.status} ${response.statusText}. ` +
            `Error: ${JSON.stringify(errorData)}`);
    }
    return await response.json();
}
/**
 * Stores encrypted Airtable OAuth tokens in the database
 * Creates a new connection or updates existing one for the user
 *
 * @param userId - User ID
 * @param tokenResponse - Token response from Airtable
 * @param prisma - Prisma client instance or delegate
 */
export async function storeAirtableConnection(userId, tokenResponse, prisma) {
    // Encrypt tokens before storing
    const encryptedAccessToken = encrypt(tokenResponse.access_token);
    const encryptedRefreshToken = tokenResponse.refresh_token
        ? encrypt(tokenResponse.refresh_token)
        : null;
    // Calculate token expiry time
    const tokenExpiry = new Date(Date.now() + tokenResponse.expires_in * 1000);
    // Get the delegate (either it IS the delegate, or get it from the client)
    const delegate = 'airtableConnection' in prisma
        ? prisma.airtableConnection
        : prisma;
    // Upsert the connection (create or update)
    await delegate.upsert({
        where: { userId },
        create: {
            userId,
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiry,
        },
        update: {
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiry,
            updatedAt: new Date(),
        },
    });
}
/**
 * Gets and decrypts the Airtable access token for a user
 * Automatically refreshes the token if it's expired
 *
 * @param userId - User ID
 * @param prisma - Prisma client instance or delegate
 * @returns Decrypted access token
 */
export async function getAirtableAccessToken(userId, prisma) {
    // Get the delegate (either it IS the delegate, or get it from the client)
    const delegate = 'airtableConnection' in prisma
        ? prisma.airtableConnection
        : prisma;
    const connection = await delegate.findUnique({
        where: { userId },
    });
    if (!connection) {
        throw new Error('Airtable connection not found for user. Please connect your Airtable account.');
    }
    // Check if token is expired or about to expire (within 5 minutes)
    const now = new Date();
    const expiryBuffer = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes buffer
    if (connection.tokenExpiry && connection.tokenExpiry <= expiryBuffer) {
        // Token is expired or about to expire, refresh it
        if (!connection.refreshToken) {
            throw new Error('Airtable refresh token not found. Please reconnect your Airtable account.');
        }
        try {
            const newTokens = await refreshAccessToken(connection.refreshToken);
            await storeAirtableConnection(userId, newTokens, delegate);
            return newTokens.access_token;
        }
        catch (error) {
            throw new Error(`Failed to refresh Airtable token: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
                'Please reconnect your Airtable account.');
        }
    }
    // Token is still valid, decrypt and return
    return decrypt(connection.accessToken);
}
/**
 * Revokes Airtable access and deletes the connection from the database
 *
 * @param userId - User ID
 * @param prisma - Prisma client instance or delegate
 */
export async function revokeAirtableConnection(userId, prisma) {
    // Get the delegate (either it IS the delegate, or get it from the client)
    const delegate = 'airtableConnection' in prisma
        ? prisma.airtableConnection
        : prisma;
    const connection = await delegate.findUnique({
        where: { userId },
    });
    if (!connection) {
        return; // No connection to revoke
    }
    // Note: Airtable doesn't provide a token revocation endpoint as of 2024
    // So we just delete the connection from our database
    // Users can revoke access from their Airtable account settings
    await delegate.delete({
        where: { userId },
    });
}
/**
 * Checks if a user has an active Airtable connection
 *
 * @param userId - User ID
 * @param prisma - Prisma client instance or delegate
 * @returns True if user has a valid connection
 */
export async function hasAirtableConnection(userId, prisma) {
    // Get the delegate (either it IS the delegate, or get it from the client)
    const delegate = 'airtableConnection' in prisma
        ? prisma.airtableConnection
        : prisma;
    const connection = await delegate.findUnique({
        where: { userId },
        select: { id: true },
    });
    return !!connection;
}
/**
 * Validates the scopes returned by Airtable match what we requested
 *
 * @param grantedScopes - Space-separated list of granted scopes
 * @returns True if all required scopes are granted
 */
export function validateScopes(grantedScopes) {
    const granted = new Set(grantedScopes.split(' '));
    return REQUIRED_SCOPES.every(scope => granted.has(scope));
}
//# sourceMappingURL=auth.js.map