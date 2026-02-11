import type { UpdateUsername, RequestEmailChange, ConfirmEmailChange, UpdateNotificationPreferences } from 'wasp/server/operations';
type UpdateUsernameInput = {
    username: string;
};
export declare const updateUsername: UpdateUsername<UpdateUsernameInput, void>;
type RequestEmailChangeInput = {
    newEmail: string;
};
export declare const requestEmailChange: RequestEmailChange<RequestEmailChangeInput, void>;
type ConfirmEmailChangeInput = {
    token: string;
};
export declare const confirmEmailChange: ConfirmEmailChange<ConfirmEmailChangeInput, {
    success: boolean;
    email?: string;
}>;
type UpdateNotificationPreferencesInput = {
    emailNotifications: boolean;
    syncFailureAlerts: boolean;
    weeklyDigest: boolean;
};
export declare const updateNotificationPreferences: UpdateNotificationPreferences<UpdateNotificationPreferencesInput, void>;
export {};
//# sourceMappingURL=accountSettings.d.ts.map