/**
 * Wasp operations for Airtable OAuth integration
 * These functions are exposed as Wasp actions and queries
 */
import type { InitiateAirtableAuth, CompleteAirtableAuth, DisconnectAirtable } from 'wasp/server/operations';
import type { GetAirtableConnectionStatus } from 'wasp/server/operations';
type InitiateAirtableAuthInput = void;
type InitiateAirtableAuthOutput = {
    authUrl: string;
};
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
/**
 * Generates the Airtable OAuth authorization URL with PKCE
 * User should be redirected to this URL to start the OAuth flow
 */
export declare const initiateAirtableAuth: InitiateAirtableAuth<InitiateAirtableAuthInput, InitiateAirtableAuthOutput>;
/**
 * Handles the OAuth callback from Airtable
 * Exchanges code for tokens and stores them encrypted in the database
 */
export declare const completeAirtableAuth: CompleteAirtableAuth<CompleteAirtableAuthInput, CompleteAirtableAuthOutput>;
/**
 * Checks if the user has a valid Airtable connection
 * Returns connection status and basic account info
 */
export declare const getAirtableConnectionStatus: GetAirtableConnectionStatus<GetAirtableConnectionStatusInput, GetAirtableConnectionStatusOutput>;
type DisconnectAirtableInput = void;
type DisconnectAirtableOutput = {
    success: boolean;
    error?: string;
};
/**
 * Disconnects the user's Airtable account by removing the connection from the database
 */
export declare const disconnectAirtable: DisconnectAirtable<DisconnectAirtableInput, DisconnectAirtableOutput>;
export {};
//# sourceMappingURL=operations.d.ts.map