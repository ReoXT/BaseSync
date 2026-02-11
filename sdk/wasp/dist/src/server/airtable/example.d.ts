/**
 * Example usage of Airtable OAuth module
 * This file demonstrates how to implement the OAuth flow in your Wasp actions/queries
 */
import type { User } from 'wasp/entities';
import type { PrismaClient } from '@prisma/client';
/**
 * Generate authorization URL to redirect user to Airtable
 * Add this as a Wasp action
 */
export declare function getAirtableAuthUrl(_args: void, context: {
    user: User;
}): Promise<{
    url: string;
}>;
/**
 * Handle the OAuth callback from Airtable
 * Add this as a Wasp API endpoint
 */
export declare function handleAirtableCallback(req: any, res: any, context: {
    user: User;
    entities: PrismaClient;
}): Promise<void>;
/**
 * Check if user has connected their Airtable account
 * Add this as a Wasp query
 */
export declare function checkAirtableConnection(_args: void, context: {
    user: User;
    entities: PrismaClient;
}): Promise<{
    connected: boolean;
}>;
/**
 * Revoke Airtable access and delete connection
 * Add this as a Wasp action
 */
export declare function disconnectAirtable(_args: void, context: {
    user: User;
    entities: PrismaClient;
}): Promise<{
    success: boolean;
}>;
/**
 * Example: Fetch Airtable bases using the stored access token
 */
export declare function getAirtableBases(_args: void, context: {
    user: User;
    entities: PrismaClient;
}): Promise<{
    bases: any[];
}>;
/**
 * Robust error handling for Airtable operations
 */
export declare function robustAirtableOperation(_args: void, context: {
    user: User;
    entities: PrismaClient;
}): Promise<{
    data?: any;
    error?: string;
}>;
//# sourceMappingURL=example.d.ts.map