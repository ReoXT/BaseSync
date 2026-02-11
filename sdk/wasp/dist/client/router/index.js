import { interpolatePath } from './linkHelpers';
// PUBLIC API
export const routes = {
    LandingPageRoute: {
        to: "/",
        build: (options) => interpolatePath("/", undefined, options?.search, options?.hash),
    },
    LoginRoute: {
        to: "/login",
        build: (options) => interpolatePath("/login", undefined, options?.search, options?.hash),
    },
    SignupRoute: {
        to: "/signup",
        build: (options) => interpolatePath("/signup", undefined, options?.search, options?.hash),
    },
    RequestPasswordResetRoute: {
        to: "/request-password-reset",
        build: (options) => interpolatePath("/request-password-reset", undefined, options?.search, options?.hash),
    },
    PasswordResetRoute: {
        to: "/password-reset",
        build: (options) => interpolatePath("/password-reset", undefined, options?.search, options?.hash),
    },
    EmailVerificationRoute: {
        to: "/email-verification",
        build: (options) => interpolatePath("/email-verification", undefined, options?.search, options?.hash),
    },
    AccountRoute: {
        to: "/account",
        build: (options) => interpolatePath("/account", undefined, options?.search, options?.hash),
    },
    AccountSettingsRoute: {
        to: "/account/settings",
        build: (options) => interpolatePath("/account/settings", undefined, options?.search, options?.hash),
    },
    VerifyEmailChangeRoute: {
        to: "/account/verify-email-change",
        build: (options) => interpolatePath("/account/verify-email-change", undefined, options?.search, options?.hash),
    },
    DemoAppRoute: {
        to: "/dashboard",
        build: (options) => interpolatePath("/dashboard", undefined, options?.search, options?.hash),
    },
    NewSyncRoute: {
        to: "/sync/new",
        build: (options) => interpolatePath("/sync/new", undefined, options?.search, options?.hash),
    },
    EditSyncRoute: {
        to: "/sync/:id/edit",
        build: (options) => interpolatePath("/sync/:id/edit", options.params, options?.search, options?.hash),
    },
    PricingPageRoute: {
        to: "/pricing",
        build: (options) => interpolatePath("/pricing", undefined, options?.search, options?.hash),
    },
    CheckoutResultRoute: {
        to: "/checkout",
        build: (options) => interpolatePath("/checkout", undefined, options?.search, options?.hash),
    },
    AdminRoute: {
        to: "/admin",
        build: (options) => interpolatePath("/admin", undefined, options?.search, options?.hash),
    },
    AdminUsersRoute: {
        to: "/admin/users",
        build: (options) => interpolatePath("/admin/users", undefined, options?.search, options?.hash),
    },
    AdminUserDetailRoute: {
        to: "/admin/users/:userId",
        build: (options) => interpolatePath("/admin/users/:userId", options.params, options?.search, options?.hash),
    },
    AdminSyncMonitorRoute: {
        to: "/admin/sync-monitor",
        build: (options) => interpolatePath("/admin/sync-monitor", undefined, options?.search, options?.hash),
    },
    AdminDatabaseRoute: {
        to: "/admin/database",
        build: (options) => interpolatePath("/admin/database", undefined, options?.search, options?.hash),
    },
    AdminSettingsRoute: {
        to: "/admin/settings",
        build: (options) => interpolatePath("/admin/settings", undefined, options?.search, options?.hash),
    },
    PrivacyPolicyRoute: {
        to: "/privacy",
        build: (options) => interpolatePath("/privacy", undefined, options?.search, options?.hash),
    },
    TermsOfServiceRoute: {
        to: "/terms",
        build: (options) => interpolatePath("/terms", undefined, options?.search, options?.hash),
    },
    NotFoundRoute: {
        to: "*",
        build: (options) => interpolatePath("*", options.params, options?.search, options?.hash),
    },
    AdminMessagesRoute: {
        to: "/admin/messages",
        build: (options) => interpolatePath("/admin/messages", undefined, options?.search, options?.hash),
    },
    AirtableCallbackRoute: {
        to: "/auth/airtable/callback",
        build: (options) => interpolatePath("/auth/airtable/callback", undefined, options?.search, options?.hash),
    },
    GoogleCallbackRoute: {
        to: "/oauth/google/callback",
        build: (options) => interpolatePath("/oauth/google/callback", undefined, options?.search, options?.hash),
    },
    SyncDetailRoute: {
        to: "/sync/:id",
        build: (options) => interpolatePath("/sync/:id", options.params, options?.search, options?.hash),
    },
};
// PUBLIC API
export { Link } from './Link';
//# sourceMappingURL=index.js.map