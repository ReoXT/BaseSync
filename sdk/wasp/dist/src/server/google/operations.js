/**
 * Wasp operations for Google Sheets OAuth integration
 * These functions are exposed as Wasp actions and queries
 */
import { generateAuthorizationUrl, exchangeCodeForTokens, validateScopes, getGoogleUserInfo, } from './auth';
import { encrypt } from '../airtable/encryption';
// ============================================================================
// Action: Initiate Google OAuth
// ============================================================================
/**
 * Generates the Google OAuth authorization URL
 * User should be redirected to this URL to start the OAuth flow
 */
export const initiateGoogleAuth = async (_args, context) => {
    if (!context.user) {
        throw new Error('User must be authenticated');
    }
    // Use user ID as state for CSRF protection
    const state = context.user.id;
    const authUrl = generateAuthorizationUrl(state);
    return { authUrl };
};
// ============================================================================
// Action: Complete Google OAuth
// ============================================================================
/**
 * Handles the OAuth callback from Google
 * Exchanges code for tokens and stores them encrypted in the database
 */
export const completeGoogleAuth = async (args, context) => {
    if (!context.user) {
        throw new Error('User must be authenticated');
    }
    const { code, state } = args;
    // Validate required parameters
    if (!code) {
        return {
            success: false,
            error: 'Missing authorization code',
        };
    }
    // Validate state matches user ID (CSRF protection)
    if (state && state !== context.user.id) {
        return {
            success: false,
            error: 'Invalid state parameter. Please try again.',
        };
    }
    try {
        // Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code);
        // Validate that all required scopes were granted
        if (!validateScopes(tokens.scope)) {
            return {
                success: false,
                error: 'Required permissions were not granted. Please authorize all requested scopes.',
            };
        }
        // Get user's Google account information
        let googleAccountEmail;
        try {
            const userInfo = await getGoogleUserInfo(tokens.access_token);
            googleAccountEmail = userInfo.email;
        }
        catch (error) {
            console.warn('Failed to fetch Google user info:', error);
            // Continue without email - it's not critical
        }
        // Encrypt tokens before storing
        const encryptedAccessToken = encrypt(tokens.access_token);
        const encryptedRefreshToken = tokens.refresh_token
            ? encrypt(tokens.refresh_token)
            : null;
        // Calculate token expiry time
        const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);
        // Get existing connection to preserve refresh token if not provided
        const existingConnection = await context.entities.GoogleSheetsConnection.findUnique({
            where: { userId: context.user.id },
        });
        // Store encrypted tokens in database using context.entities
        await context.entities.GoogleSheetsConnection.upsert({
            where: { userId: context.user.id },
            create: {
                userId: context.user.id,
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
        return { success: true };
    }
    catch (error) {
        console.error('Failed to complete Google OAuth:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        // Provide user-friendly error messages
        if (errorMessage.includes('exchange code for tokens')) {
            return {
                success: false,
                error: 'Failed to connect to Google. The authorization code may have expired. Please try again.',
            };
        }
        if (errorMessage.includes('GOOGLE_SHEETS_CLIENT_ID')) {
            return {
                success: false,
                error: 'Google Sheets integration is not configured. Please contact support.',
            };
        }
        return {
            success: false,
            error: 'Failed to connect Google account. Please try again.',
        };
    }
};
// ============================================================================
// Query: Get Google Connection Status
// ============================================================================
/**
 * Checks if the user has a valid Google Sheets connection
 * Returns connection status and basic account info
 */
export const getGoogleConnectionStatus = async (_args, context) => {
    if (!context.user) {
        throw new Error('User must be authenticated');
    }
    try {
        // Get connection details directly from context.entities
        const connection = await context.entities.GoogleSheetsConnection.findUnique({
            where: { userId: context.user.id },
            select: {
                googleAccountEmail: true,
            },
        });
        if (!connection) {
            return { isConnected: false };
        }
        return {
            isConnected: true,
            googleAccountEmail: connection.googleAccountEmail || undefined,
        };
    }
    catch (error) {
        console.error('Failed to get Google Sheets connection status:', error);
        return { isConnected: false };
    }
};
/**
 * Disconnects the user's Google Sheets account by removing the connection from the database
 */
export const disconnectGoogle = async (_args, context) => {
    if (!context.user) {
        throw new Error('User must be authenticated');
    }
    try {
        // Check if connection exists
        const connection = await context.entities.GoogleSheetsConnection.findUnique({
            where: { userId: context.user.id },
        });
        if (!connection) {
            return {
                success: false,
                error: 'No Google Sheets connection found',
            };
        }
        // Delete the connection
        await context.entities.GoogleSheetsConnection.delete({
            where: { userId: context.user.id },
        });
        return { success: true };
    }
    catch (error) {
        console.error('Failed to disconnect Google Sheets:', error);
        return {
            success: false,
            error: 'Failed to disconnect Google account. Please try again.',
        };
    }
};
//# sourceMappingURL=operations.js.map