/**
 * Diagnostic Actions for Troubleshooting Sync Issues
 */
export interface DiagnosticResult {
    airtable: {
        connected: boolean;
        needsReauth: boolean;
        tokenExpiry: string | null;
        lastRefreshError: string | null;
        canDecryptTokens: boolean;
    };
    google: {
        connected: boolean;
        needsReauth: boolean;
        tokenExpiry: string | null;
        lastRefreshError: string | null;
        canDecryptTokens: boolean;
    };
    recommendations: string[];
    [key: string]: any;
}
/**
 * Run diagnostics on user's OAuth connections
 */
export declare const runConnectionDiagnostics: (_args: unknown, context: any) => Promise<DiagnosticResult>;
/**
 * Force clear the needsReauth flag (use after manual reconnection)
 */
export declare const clearReauthFlags: (_args: unknown, context: any) => Promise<{
    success: boolean;
    message: string;
}>;
//# sourceMappingURL=diagnostics.d.ts.map