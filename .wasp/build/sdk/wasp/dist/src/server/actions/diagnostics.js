/**
 * Diagnostic Actions for Troubleshooting Sync Issues
 */
import { HttpError } from 'wasp/server';
import { decrypt } from '../airtable/encryption';
/**
 * Run diagnostics on user's OAuth connections
 */
export const runConnectionDiagnostics = async (_args, context) => {
    const userId = context.user.id;
    const recommendations = [];
    console.log('[Diagnostics] Running connection diagnostics for user:', userId);
    // Fetch connection data directly
    const airtableConnection = await context.entities.AirtableConnection.findUnique({
        where: { userId },
    });
    const googleConnection = await context.entities.GoogleSheetsConnection.findUnique({
        where: { userId },
    });
    // Check Airtable connection
    let airtableCanDecrypt = false;
    if (airtableConnection) {
        try {
            decrypt(airtableConnection.accessToken);
            decrypt(airtableConnection.refreshToken);
            airtableCanDecrypt = true;
        }
        catch (error) {
            console.error('[Diagnostics] Failed to decrypt Airtable tokens:', error);
            recommendations.push('Airtable tokens cannot be decrypted. Please reconnect your Airtable account.');
        }
        if (airtableConnection.needsReauth) {
            recommendations.push('Airtable connection is marked as needing reauth. Please reconnect.');
        }
        if (airtableConnection.tokenExpiry && new Date(airtableConnection.tokenExpiry) < new Date()) {
            recommendations.push('Airtable token is expired. It should auto-refresh on next sync.');
        }
    }
    else {
        recommendations.push('No Airtable connection found. Please connect your Airtable account.');
    }
    // Check Google connection
    let googleCanDecrypt = false;
    if (googleConnection) {
        try {
            decrypt(googleConnection.accessToken);
            decrypt(googleConnection.refreshToken);
            googleCanDecrypt = true;
        }
        catch (error) {
            console.error('[Diagnostics] Failed to decrypt Google tokens:', error);
            recommendations.push('Google Sheets tokens cannot be decrypted. Please reconnect your Google account.');
        }
        if (googleConnection.needsReauth) {
            recommendations.push('Google Sheets connection is marked as needing reauth. Please reconnect.');
        }
        if (googleConnection.tokenExpiry && new Date(googleConnection.tokenExpiry) < new Date()) {
            recommendations.push('Google Sheets token is expired. It should auto-refresh on next sync.');
        }
    }
    else {
        recommendations.push('No Google Sheets connection found. Please connect your Google account.');
    }
    return {
        airtable: {
            connected: !!airtableConnection,
            needsReauth: airtableConnection?.needsReauth || false,
            tokenExpiry: airtableConnection?.tokenExpiry?.toISOString() || null,
            lastRefreshError: airtableConnection?.lastRefreshError || null,
            canDecryptTokens: airtableCanDecrypt,
        },
        google: {
            connected: !!googleConnection,
            needsReauth: googleConnection?.needsReauth || false,
            tokenExpiry: googleConnection?.tokenExpiry?.toISOString() || null,
            lastRefreshError: googleConnection?.lastRefreshError || null,
            canDecryptTokens: googleCanDecrypt,
        },
        recommendations,
    };
};
/**
 * Force clear the needsReauth flag (use after manual reconnection)
 */
export const clearReauthFlags = async (_args, context) => {
    const userId = context.user.id;
    console.log('[Diagnostics] Clearing reauth flags for user:', userId);
    try {
        // Clear Airtable reauth flag
        const airtableConnection = await context.entities.AirtableConnection.findUnique({
            where: { userId },
        });
        if (airtableConnection) {
            await context.entities.AirtableConnection.update({
                where: { userId },
                data: {
                    needsReauth: false,
                    lastRefreshError: null,
                },
            });
            console.log('[Diagnostics] Cleared Airtable reauth flag');
        }
        // Clear Google reauth flag
        const googleConnection = await context.entities.GoogleSheetsConnection.findUnique({
            where: { userId },
        });
        if (googleConnection) {
            await context.entities.GoogleSheetsConnection.update({
                where: { userId },
                data: {
                    needsReauth: false,
                    lastRefreshError: null,
                },
            });
            console.log('[Diagnostics] Cleared Google Sheets reauth flag');
        }
        return {
            success: true,
            message: 'Cleared reauth flags for both connections. Try running a sync now.',
        };
    }
    catch (error) {
        console.error('[Diagnostics] Failed to clear reauth flags:', error);
        throw new HttpError(500, 'Failed to clear reauth flags');
    }
};
//# sourceMappingURL=diagnostics.js.map