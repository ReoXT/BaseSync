/**
 * Wasp operations for Google Sheets OAuth integration
 * These functions are exposed as Wasp actions and queries
 */
import type { InitiateGoogleAuth, CompleteGoogleAuth, DisconnectGoogle } from 'wasp/server/operations';
import type { GetGoogleConnectionStatus } from 'wasp/server/operations';
type InitiateGoogleAuthInput = void;
type InitiateGoogleAuthOutput = {
    authUrl: string;
};
type CompleteGoogleAuthInput = {
    code: string;
    state?: string;
};
type CompleteGoogleAuthOutput = {
    success: boolean;
    error?: string;
};
type GetGoogleConnectionStatusInput = void;
type GetGoogleConnectionStatusOutput = {
    isConnected: boolean;
    googleAccountEmail?: string;
};
/**
 * Generates the Google OAuth authorization URL
 * User should be redirected to this URL to start the OAuth flow
 */
export declare const initiateGoogleAuth: InitiateGoogleAuth<InitiateGoogleAuthInput, InitiateGoogleAuthOutput>;
/**
 * Handles the OAuth callback from Google
 * Exchanges code for tokens and stores them encrypted in the database
 */
export declare const completeGoogleAuth: CompleteGoogleAuth<CompleteGoogleAuthInput, CompleteGoogleAuthOutput>;
/**
 * Checks if the user has a valid Google Sheets connection
 * Returns connection status and basic account info
 */
export declare const getGoogleConnectionStatus: GetGoogleConnectionStatus<GetGoogleConnectionStatusInput, GetGoogleConnectionStatusOutput>;
type DisconnectGoogleInput = void;
type DisconnectGoogleOutput = {
    success: boolean;
    error?: string;
};
/**
 * Disconnects the user's Google Sheets account by removing the connection from the database
 */
export declare const disconnectGoogle: DisconnectGoogle<DisconnectGoogleInput, DisconnectGoogleOutput>;
export {};
//# sourceMappingURL=operations.d.ts.map