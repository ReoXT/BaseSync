/**
 * Grant Pro Plan Access to Test User
 *
 * This is a Wasp action that grants Pro plan to test@email.com
 * Call it from the browser console or create a temporary page
 */
export declare function grantTestUserProAccess(): Promise<{
    success: boolean;
    user: {
        email: string | null;
        plan: string | null;
        status: string | null;
        credits: number;
    };
}>;
//# sourceMappingURL=grantTestPro.d.ts.map