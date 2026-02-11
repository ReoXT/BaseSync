import type { ChangePassword } from 'wasp/server/operations';
type ChangePasswordInput = {
    currentPassword: string;
    newPassword: string;
};
export declare const changePassword: ChangePassword<ChangePasswordInput, void>;
export {};
//# sourceMappingURL=security.d.ts.map