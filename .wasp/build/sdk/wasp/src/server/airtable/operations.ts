/**
 * Wasp operations for Airtable OAuth integration
 * These functions are exposed as Wasp actions and queries
 */

import type { User, AirtableConnection } from 'wasp/entities';
import type { InitiateAirtableAuth, CompleteAirtableAuth, DisconnectAirtable } from 'wasp/server/operations';
import type { GetAirtableConnectionStatus } from 'wasp/server/operations';
import {
  generateAuthorizationUrl,
  exchangeCodeForTokens,
  validateScopes,
  generatePKCEChallenge,
} from './auth';
import { encrypt } from './encryption';

// ============================================================================
// In-Memory Store for PKCE Code Verifiers
// ============================================================================
// In production, consider using Redis or database for multi-instance deployments
const pkceStore = new Map<string, { codeVerifier: string; timestamp: number }>();

// Clean up expired PKCE entries (older than 10 minutes)
setInterval(() => {
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;
  for (const [userId, data] of pkceStore.entries()) {
    if (now - data.timestamp > tenMinutes) {
      pkceStore.delete(userId);
    }
  }
}, 5 * 60 * 1000); // Run cleanup every 5 minutes

// ============================================================================
// Types
// ============================================================================

type InitiateAirtableAuthInput = void;
type InitiateAirtableAuthOutput = { authUrl: string };

type CompleteAirtableAuthInput = {
  code: string;
  state?: string;
};
type CompleteAirtableAuthOutput = {
  success: boolean;
  error?: string;
};

type GetAirtableConnectionStatusInput = void;
type GetAirtableConnectionStatusOutput = {
  isConnected: boolean;
  accountId?: string;
};

// ============================================================================
// Action: Initiate Airtable OAuth
// ============================================================================

/**
 * Generates the Airtable OAuth authorization URL with PKCE
 * User should be redirected to this URL to start the OAuth flow
 */
export const initiateAirtableAuth: InitiateAirtableAuth<
  InitiateAirtableAuthInput,
  InitiateAirtableAuthOutput
> = async (_args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  // Generate PKCE challenge
  const { codeVerifier, codeChallenge } = generatePKCEChallenge();

  // Store code verifier for later use in the callback
  pkceStore.set(context.user.id, {
    codeVerifier,
    timestamp: Date.now(),
  });

  // Use user ID as state for CSRF protection
  const state = context.user.id;
  const authUrl = generateAuthorizationUrl(state, codeChallenge);

  // Debug: Log the generated URL (client_id and redirect_uri will be visible in server logs)
  console.log('=== AIRTABLE OAUTH DEBUG ===');
  console.log('Generated Auth URL:', authUrl);
  console.log('PKCE Challenge:', codeChallenge);
  console.log('===========================');

  return { authUrl };
};

// ============================================================================
// Action: Complete Airtable OAuth
// ============================================================================

/**
 * Handles the OAuth callback from Airtable
 * Exchanges code for tokens and stores them encrypted in the database
 */
export const completeAirtableAuth: CompleteAirtableAuth<
  CompleteAirtableAuthInput,
  CompleteAirtableAuthOutput
> = async (args, context) => {
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
    // Retrieve the PKCE code verifier from our store
    const pkceData = pkceStore.get(context.user.id);
    if (!pkceData) {
      return {
        success: false,
        error: 'OAuth session expired. Please try connecting again.',
      };
    }

    // Clean up the PKCE data now that we're using it
    pkceStore.delete(context.user.id);

    // Exchange code for tokens with PKCE code verifier
    const tokens = await exchangeCodeForTokens(code, pkceData.codeVerifier);

    // Validate that all required scopes were granted
    if (!validateScopes(tokens.scope)) {
      return {
        success: false,
        error: 'Required permissions were not granted. Please authorize all requested scopes.',
      };
    }

    // Encrypt tokens before storing
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token
      ? encrypt(tokens.refresh_token)
      : null;

    // Calculate token expiry time
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    // Store encrypted tokens in database using context.entities
    await context.entities.AirtableConnection.upsert({
      where: { userId: context.user.id },
      create: {
        userId: context.user.id,
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

    return { success: true };
  } catch (error) {
    console.error('Failed to complete Airtable OAuth:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Provide user-friendly error messages
    if (errorMessage.includes('exchange code for tokens')) {
      return {
        success: false,
        error: 'Failed to connect to Airtable. The authorization code may have expired. Please try again.',
      };
    }

    if (errorMessage.includes('AIRTABLE_CLIENT_ID')) {
      return {
        success: false,
        error: 'Airtable integration is not configured. Please contact support.',
      };
    }

    return {
      success: false,
      error: 'Failed to connect Airtable account. Please try again.',
    };
  }
};

// ============================================================================
// Query: Get Airtable Connection Status
// ============================================================================

/**
 * Checks if the user has a valid Airtable connection
 * Returns connection status and basic account info
 */
export const getAirtableConnectionStatus: GetAirtableConnectionStatus<
  GetAirtableConnectionStatusInput,
  GetAirtableConnectionStatusOutput
> = async (_args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  try {
    // Get connection details directly from context.entities
    const connection = await context.entities.AirtableConnection.findUnique({
      where: { userId: context.user.id },
      select: {
        accountId: true,
      },
    });

    if (!connection) {
      return { isConnected: false };
    }

    return {
      isConnected: true,
      accountId: connection.accountId || undefined,
    };
  } catch (error) {
    console.error('Failed to get Airtable connection status:', error);
    return { isConnected: false };
  }
};

// ============================================================================
// Action: Disconnect Airtable
// ============================================================================

type DisconnectAirtableInput = void;
type DisconnectAirtableOutput = {
  success: boolean;
  error?: string;
};

/**
 * Disconnects the user's Airtable account by removing the connection from the database
 */
export const disconnectAirtable: DisconnectAirtable<
  DisconnectAirtableInput,
  DisconnectAirtableOutput
> = async (_args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  try {
    // Check if connection exists
    const connection = await context.entities.AirtableConnection.findUnique({
      where: { userId: context.user.id },
    });

    if (!connection) {
      return {
        success: false,
        error: 'No Airtable connection found',
      };
    }

    // Delete the connection
    await context.entities.AirtableConnection.delete({
      where: { userId: context.user.id },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to disconnect Airtable:', error);
    return {
      success: false,
      error: 'Failed to disconnect Airtable account. Please try again.',
    };
  }
};
