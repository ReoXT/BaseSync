export declare const userMenuItems: readonly [{
    readonly name: "Dashboard";
    readonly to: "/dashboard";
    readonly icon: import("lucide-react").LucideIcon;
    readonly isAdminOnly: false;
    readonly isAuthRequired: true;
}, {
    readonly name: "Account Settings";
    readonly to: "/account/settings";
    readonly icon: import("lucide-react").LucideIcon;
    readonly isAuthRequired: true;
    readonly isAdminOnly: false;
}, {
    readonly name: "Admin";
    readonly to: "/admin";
    readonly icon: import("lucide-react").LucideIcon;
    readonly isAuthRequired: false;
    readonly isAdminOnly: true;
}];
//# sourceMappingURL=constants.d.ts.map