import type { PrismaClient } from '@prisma/client';
import type { User } from 'wasp/entities';
type AirtableConnectionDelegate = {
    findUnique: PrismaClient['airtableConnection']['findUnique'];
    upsert: PrismaClient['airtableConnection']['upsert'];
    delete: PrismaClient['airtableConnection']['delete'];
};
type PrismaOrDelegate = PrismaClient | AirtableConnectionDelegate;
interface AirtableTokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: 'Bearer';
    scope: string;
}
interface PKCEChallenge {
    codeVerifier: string;
    codeChallenge: string;
}
/**
 * Generates PKCE code verifier and challenge for OAuth
 * @returns Object containing code verifier and challenge
 */
export declare function generatePKCEChallenge(): PKCEChallenge;
/**
 * Generates the Airtable OAuth authorization URL with PKCE
 * User should be redirected to this URL to start the OAuth flow
 *
 * @param state - Optional state parameter for CSRF protection
 * @param codeChallenge - PKCE code challenge
 * @returns Authorization URL to redirect the user to
 */
export declare function generateAuthorizationUrl(state?: string, codeChallenge?: string): string;
/**
 * Exchanges an authorization code for access and refresh tokens
 *
 * @param code - Authorization code from Airtable callback
 * @param codeVerifier - PKCE code verifier (optional, required if PKCE was used)
 * @returns Token response from Airtable
 */
export declare function exchangeCodeForTokens(code: string, codeVerifier?: string): Promise<AirtableTokenResponse>;
/**
 * Refreshes an expired access token using the refresh token
 *
 * @param refreshToken - The refresh token (encrypted)
 * @returns New token response from Airtable
 */
export declare function refreshAccessToken(refreshToken: string): Promise<AirtableTokenResponse>;
/**
 * Stores encrypted Airtable OAuth tokens in the database
 * Creates a new connection or updates existing one for the user
 *
 * @param userId - User ID
 * @param tokenResponse - Token response from Airtable
 * @param prisma - Prisma client instance or delegate
 */
export declare function storeAirtableConnection(userId: User['id'], tokenResponse: AirtableTokenResponse, prisma: PrismaOrDelegate): Promise<void>;
/**
 * Gets and decrypts the Airtable access token for a user
 * Automatically refreshes the token if it's expired
 *
 * @param userId - User ID
 * @param prisma - Prisma client instance or delegate
 * @returns Decrypted access token
 */
export declare function getAirtableAccessToken(userId: User['id'], prisma: PrismaOrDelegate): Promise<string>;
/**
 * Revokes Airtable access and deletes the connection from the database
 *
 * @param userId - User ID
 * @param prisma - Prisma client instance or delegate
 */
export declare function revokeAirtableConnection(userId: User['id'], prisma: PrismaOrDelegate): Promise<void>;
/**
 * Checks if a user has an active Airtable connection
 *
 * @param userId - User ID
 * @param prisma - Prisma client instance or delegate
 * @returns True if user has a valid connection
 */
export declare function hasAirtableConnection(userId: User['id'], prisma: PrismaOrDelegate): Promise<boolean>;
/**
 * Validates the scopes returned by Airtable match what we requested
 *
 * @param grantedScopes - Space-separated list of granted scopes
 * @returns True if all required scopes are granted
 */
export declare function validateScopes(grantedScopes: string): boolean;
export {};
//# sourceMappingURL=auth.d.ts.map