/**
 * Example usage of Airtable OAuth module
 * This file demonstrates how to implement the OAuth flow in your Wasp actions/queries
 */

import type { User } from 'wasp/entities';
import type { PrismaClient } from '@prisma/client';
import {
  generateAuthorizationUrl,
  exchangeCodeForTokens,
  storeAirtableConnection,
  getAirtableAccessToken,
  hasAirtableConnection,
  revokeAirtableConnection,
  validateScopes,
} from './auth';

// ============================================================================
// Example 1: Start OAuth Flow (Action)
// ============================================================================

/**
 * Generate authorization URL to redirect user to Airtable
 * Add this as a Wasp action
 */
export async function getAirtableAuthUrl(
  _args: void,
  context: { user: User }
): Promise<{ url: string }> {
  // Optional: Use user ID as state for CSRF protection
  const state = context.user.id;
  const url = generateAuthorizationUrl(state);

  return { url };
}

// In main.wasp:
// action getAirtableAuthUrl {
//   fn: import { getAirtableAuthUrl } from "@src/server/airtable/example"
//   entities: [User]
// }

// ============================================================================
// Example 2: Handle OAuth Callback (API endpoint)
// ============================================================================

/**
 * Handle the OAuth callback from Airtable
 * Add this as a Wasp API endpoint
 */
export async function handleAirtableCallback(
  req: any,
  res: any,
  context: { user: User; entities: PrismaClient }
): Promise<void> {
  try {
    const { code, state } = req.query;

    if (!code) {
      res.status(400).json({ error: 'Missing authorization code' });
      return;
    }

    // Optional: Validate state matches user ID (CSRF protection)
    if (state !== context.user.id) {
      res.status(400).json({ error: 'Invalid state parameter' });
      return;
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Validate scopes
    if (!validateScopes(tokens.scope)) {
      res.status(400).json({
        error: 'Required scopes not granted',
        granted: tokens.scope,
      });
      return;
    }

    // Store encrypted tokens
    await storeAirtableConnection(context.user.id, tokens, context.entities);

    // Redirect to success page
    res.redirect('/dashboard?airtable=connected');
  } catch (error) {
    console.error('Airtable OAuth callback error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// In main.wasp:
// api airtableCallback {
//   fn: import { handleAirtableCallback } from "@src/server/airtable/example"
//   entities: [User, AirtableConnection]
//   httpRoute: (GET, "/oauth/airtable/callback")
// }

// ============================================================================
// Example 3: Check Connection Status (Query)
// ============================================================================

/**
 * Check if user has connected their Airtable account
 * Add this as a Wasp query
 */
export async function checkAirtableConnection(
  _args: void,
  context: { user: User; entities: PrismaClient }
): Promise<{ connected: boolean }> {
  const connected = await hasAirtableConnection(
    context.user.id,
    context.entities
  );

  return { connected };
}

// In main.wasp:
// query checkAirtableConnection {
//   fn: import { checkAirtableConnection } from "@src/server/airtable/example"
//   entities: [User, AirtableConnection]
// }

// ============================================================================
// Example 4: Disconnect Airtable (Action)
// ============================================================================

/**
 * Revoke Airtable access and delete connection
 * Add this as a Wasp action
 */
export async function disconnectAirtable(
  _args: void,
  context: { user: User; entities: PrismaClient }
): Promise<{ success: boolean }> {
  await revokeAirtableConnection(context.user.id, context.entities);
  return { success: true };
}

// In main.wasp:
// action disconnectAirtable {
//   fn: import { disconnectAirtable } from "@src/server/airtable/example"
//   entities: [User, AirtableConnection]
// }

// ============================================================================
// Example 5: Use Access Token in Another Action
// ============================================================================

/**
 * Example: Fetch Airtable bases using the stored access token
 */
export async function getAirtableBases(
  _args: void,
  context: { user: User; entities: PrismaClient }
): Promise<{ bases: any[] }> {
  // Get valid access token (auto-refreshes if needed)
  const accessToken = await getAirtableAccessToken(
    context.user.id,
    context.entities
  );

  // Use token to call Airtable API
  const response = await fetch('https://api.airtable.com/v0/meta/bases', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return { bases: data.bases || [] };
}

// In main.wasp:
// action getAirtableBases {
//   fn: import { getAirtableBases } from "@src/server/airtable/example"
//   entities: [User, AirtableConnection]
// }

// ============================================================================
// Example 6: Error Handling Pattern
// ============================================================================

/**
 * Robust error handling for Airtable operations
 */
export async function robustAirtableOperation(
  _args: void,
  context: { user: User; entities: PrismaClient }
): Promise<{ data?: any; error?: string }> {
  try {
    const accessToken = await getAirtableAccessToken(
      context.user.id,
      context.entities
    );

    // Your Airtable API call here
    const response = await fetch('https://api.airtable.com/v0/...', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();
    return { data };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('connection not found')) {
      return { error: 'Please connect your Airtable account' };
    }

    if (message.includes('refresh token')) {
      return { error: 'Your Airtable connection expired. Please reconnect.' };
    }

    return { error: 'Failed to access Airtable' };
  }
}
