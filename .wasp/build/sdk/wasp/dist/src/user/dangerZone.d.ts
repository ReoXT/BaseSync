import type { ExportUserData, DeleteAccount } from 'wasp/server/operations';
export declare const exportUserData: ExportUserData<void, any>;
type DeleteAccountInput = {
    confirmationText: string;
    password: string;
};
export declare const deleteAccount: DeleteAccount<DeleteAccountInput, void>;
export {};
//# sourceMappingURL=dangerZone.d.ts.map