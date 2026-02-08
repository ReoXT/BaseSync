export declare const userMenuItems: readonly [{
    readonly name: "Dashboard";
    readonly to: "/dashboard";
    readonly icon: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
    readonly isAdminOnly: false;
    readonly isAuthRequired: true;
}, {
    readonly name: "Account Settings";
    readonly to: "/account/settings";
    readonly icon: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
    readonly isAuthRequired: true;
    readonly isAdminOnly: false;
}, {
    readonly name: "Admin";
    readonly to: "/admin";
    readonly icon: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
    readonly isAuthRequired: false;
    readonly isAdminOnly: true;
}];
//# sourceMappingURL=constants.d.ts.map