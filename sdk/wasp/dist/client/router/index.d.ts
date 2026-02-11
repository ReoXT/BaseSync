import type { RouteDefinitionsToRoutes, OptionalRouteOptions, ParamValue } from './types';
export declare const routes: {
    readonly LandingPageRoute: {
        readonly to: "/";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly LoginRoute: {
        readonly to: "/login";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly SignupRoute: {
        readonly to: "/signup";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly RequestPasswordResetRoute: {
        readonly to: "/request-password-reset";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly PasswordResetRoute: {
        readonly to: "/password-reset";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly EmailVerificationRoute: {
        readonly to: "/email-verification";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly AccountRoute: {
        readonly to: "/account";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly AccountSettingsRoute: {
        readonly to: "/account/settings";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly VerifyEmailChangeRoute: {
        readonly to: "/account/verify-email-change";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly DemoAppRoute: {
        readonly to: "/dashboard";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly NewSyncRoute: {
        readonly to: "/sync/new";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly EditSyncRoute: {
        readonly to: "/sync/:id/edit";
        readonly build: (options: OptionalRouteOptions & {
            params: {
                "id": ParamValue;
            };
        }) => string;
    };
    readonly PricingPageRoute: {
        readonly to: "/pricing";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly CheckoutResultRoute: {
        readonly to: "/checkout";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly AdminRoute: {
        readonly to: "/admin";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly AdminUsersRoute: {
        readonly to: "/admin/users";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly AdminUserDetailRoute: {
        readonly to: "/admin/users/:userId";
        readonly build: (options: OptionalRouteOptions & {
            params: {
                "userId": ParamValue;
            };
        }) => string;
    };
    readonly AdminSyncMonitorRoute: {
        readonly to: "/admin/sync-monitor";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly AdminDatabaseRoute: {
        readonly to: "/admin/database";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly AdminSettingsRoute: {
        readonly to: "/admin/settings";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly PrivacyPolicyRoute: {
        readonly to: "/privacy";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly TermsOfServiceRoute: {
        readonly to: "/terms";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly NotFoundRoute: {
        readonly to: "*";
        readonly build: (options: OptionalRouteOptions & {
            params: {
                "*": ParamValue;
            };
        }) => string;
    };
    readonly AdminMessagesRoute: {
        readonly to: "/admin/messages";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly AirtableCallbackRoute: {
        readonly to: "/auth/airtable/callback";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly GoogleCallbackRoute: {
        readonly to: "/oauth/google/callback";
        readonly build: (options?: OptionalRouteOptions) => string;
    };
    readonly SyncDetailRoute: {
        readonly to: "/sync/:id";
        readonly build: (options: OptionalRouteOptions & {
            params: {
                "id": ParamValue;
            };
        }) => string;
    };
};
export type Routes = RouteDefinitionsToRoutes<typeof routes>;
export { Link } from './Link';
//# sourceMappingURL=index.d.ts.map