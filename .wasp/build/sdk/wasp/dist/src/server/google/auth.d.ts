import type { PrismaClient } from '@prisma/client';
import type { User } from 'wasp/entities';
type GoogleSheetsConnectionDelegate = {
    findUnique: PrismaClient['googleSheetsConnection']['findUnique'];
    upsert: PrismaClient['googleSheetsConnection']['upsert'];
    delete: PrismaClient['googleSheetsConnection']['delete'];
};
type PrismaOrDelegate = PrismaClient | GoogleSheetsConnectionDelegate;
interface GoogleTokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
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
 * Generates the Google OAuth authorization URL
 * User should be redirected to this URL to start the OAuth flow
 *
 * @param state - Optional state parameter for CSRF protection
 * @returns Authorization URL to redirect the user to
 */
export declare function generateAuthorizationUrl(state?: string): string;
/**
 * Exchanges an authorization code for access and refresh tokens
 *
 * @param code - Authorization code from Google callback
 * @returns Token response from Google
 */
export declare function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse>;
/**
 * Refreshes an expired access token using the refresh token
 *
 * @param refreshToken - The refresh token (encrypted)
 * @returns New token response from Google
 */
export declare function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse>;
/**
 * Stores encrypted Google OAuth tokens in the database
 * Creates a new connection or updates existing one for the user
 *
 * @param userId - User ID
 * @param tokenResponse - Token response from Google
 * @param prisma - Prisma client instance
 * @param googleAccountEmail - Optional email to store with connection
 */
export declare function storeGoogleSheetsConnection(userId: User['id'], tokenResponse: GoogleTokenResponse, prisma: PrismaOrDelegate, googleAccountEmail?: string): Promise<void>;
/**
 * Gets and decrypts the Google Sheets access token for a user
 * Automatically refreshes the token if it's expired
 *
 * @param userId - User ID
 * @param prisma - Prisma client instance
 * @returns Decrypted access token
 */
export declare function getGoogleSheetsAccessToken(userId: User['id'], prisma: PrismaOrDelegate): Promise<string>;
/**
 * Fetches the user's Google account information
 *
 * @param accessToken - Valid access token
 * @returns User info from Google
 */
export declare function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo>;
/**
 * Revokes Google access and deletes the connection from the database
 *
 * @param userId - User ID
 * @param prisma - Prisma client instance
 */
export declare function revokeGoogleSheetsConnection(userId: User['id'], prisma: PrismaOrDelegate): Promise<void>;
/**
 * Checks if a user has an active Google Sheets connection
 *
 * @param userId - User ID
 * @param prisma - Prisma client instance
 * @returns True if user has a valid connection
 */
export declare function hasGoogleSheetsConnection(userId: User['id'], prisma: PrismaOrDelegate): Promise<boolean>;
/**
 * Validates the scopes returned by Google match what we requested
 *
 * @param grantedScopes - Space-separated list of granted scopes
 * @returns True if all required scopes are granted
 */
export declare function validateScopes(grantedScopes: string): boolean;
export {};
//# sourceMappingURL=auth.d.ts.map