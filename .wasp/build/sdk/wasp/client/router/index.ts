import { interpolatePath } from './linkHelpers'
import type {
  RouteDefinitionsToRoutes,
  OptionalRouteOptions,
  ParamValue,
  ExpandRouteOnOptionalStaticSegments,
} from './types'

// PUBLIC API
export const routes = {
  LandingPageRoute: {
    to: "/",
    build: (
      options?:
      OptionalRouteOptions
    ) => interpolatePath(
        
        "/",
        undefined,
        options?.search,
        options?.hash
      ),
  },
  LoginRoute: {
    to: "/login",
    build: (
      options?:
      OptionalRouteOptions
    ) => interpolatePath(
        
        "/login",
        undefined,
        options?.search,
        options?.hash
      ),
  },
  SignupRoute: {
    to: "/signup",
    build: (
      options?:
      OptionalRouteOptions
    ) => interpolatePath(
        
        "/signup",
        undefined,
        options?.search,
        options?.hash
      ),
  },
  RequestPasswordResetRoute: {
    to: "/request-password-reset",
    build: (
      options?:
      OptionalRouteOptions
    ) => interpolatePath(
        
        "/request-password-reset",
        undefined,
        options?.search,
        options?.hash
      ),
  },
  PasswordResetRoute: {
    to: "/password-reset",
    build: (
      options?:
      OptionalRouteOptions
    ) => interpolatePath(
        
        "/password-reset",
        undefined,
        options?.search,
        options?.hash
      ),
  },
  EmailVerificationRoute: {
    to: "/email-verification",
    build: (
      options?:
      OptionalRouteOptions
    ) => interpolatePath(
        
        "/email-verification",
        undefined,
        options?.search,
        options?.hash
      ),
  },
  AccountRoute: {
    to: "/account",
    build: (
      options?:
      OptionalRouteOptions
    ) => interpolatePath(
        
        "/account",
        undefined,
        options?.search,
        options?.hash
      ),
  },
  AccountSettingsRoute: {
    to: "/account/settings",
    build: (
      options?:
      OptionalRouteOptions
    ) => interpolatePath(
        
        "/account/settings",
        undefined,
        options?.search,
        options?.hash
      ),
  },
  VerifyEmailChangeRoute: {
    to: "/account/verify-email-change",
    build: (
      options?:
      OptionalRouteOptions
    ) => interpolatePath(
        
        "/account/verify-email-change",
        undefined,
        options?.search,
        options?.hash
      ),
  },
  DemoAppRoute: {
    to: "/dashboard",
    build: (
      options?:
      OptionalRouteOptions
    ) => interpolatePath(
        
        "/dashboard",
        undefined,
        options?.search,
        options?.hash
      ),
  },
  NewSyncRoute: {
    to: "/sync/new",
    build: (
      options?:
      OptionalRouteOptions
    ) => interpolatePath(
        
        "/sync/new",
        undefined,
        options?.search,
        options?.hash
      ),
  },
  EditSyncRoute: {
    to: "/sync/:id/edit",
    build: (
      options: OptionalRouteOptions
      & { params: {"id": ParamValue;}}
    ) => interpolatePath(
        
        "/sync/:id/edit",
        options.params,
        options?.search,
        options?.hash
      ),
  },
  PricingPageRoute: {
    to: "/pricing",
    build: (
      options?:
      OptionalRouteOptions
    ) => interpolatePath(
        
        "/pricing",
        undefined,
        options?.search,
        options?.hash
      ),
  },
  CheckoutResultRoute: {
    to: "/checkout",
    build: (
      options?:
      OptionalRouteOptions
    ) => interpolatePath(
        
        "/checkout",
        undefined,
        options?.search,
        options?.hash
      ),
  },
  AdminRoute: {
    to: "/admin",
    build: (
      options?:
      OptionalRouteOptions
    ) => interpolatePath(
        
        "/admin",
        undefined,
        options?.search,
        options?.hash
      ),
  },
  AdminUsersRoute: {
    to: "/admin/users",
    build: (
      options?:
      OptionalRouteOptions
    ) => interpolatePath(
        
        "/admin/users",
        undefined,
        options?.search,
        options?.hash
      ),
  },
  AdminUserDetailRoute: {
    to: "/admin/users/:userId",
    build: (
      options: OptionalRouteOptions
      & { params: {"userId": ParamValue;}}
    ) => interpolatePath(
        
        "/admin/users/:userId",
        options.params,
        options?.search,
        options?.hash
      ),
  },
  AdminSyncMonitorRoute: {
    to: "/admin/sync-monitor",
    build: (
      options?:
      OptionalRouteOptions
    ) => interpolatePath(
        
        "/admin/sync-monitor",
        undefined,
        options?.search,
        options?.hash
      ),
  },
  AdminDatabaseRoute: {
    to: "/admin/database",
    build: (
      options?:
      OptionalRouteOptions
    ) => interpolatePath(
        
        "/admin/database",
        undefined,
        options?.search,
        options?.hash
      ),
  },
  AdminSettingsRoute: {
    to: "/admin/settings",
    build: (
      options?:
      OptionalRouteOptions
    ) => interpolatePath(
        
        "/admin/settings",
        undefined,
        options?.search,
        options?.hash
      ),
  },
  NotFoundRoute: {
    to: "*",
    build: (
      options: OptionalRouteOptions
      & { params: {"*": ParamValue;}}
    ) => interpolatePath(
        
        "*",
        options.params,
        options?.search,
        options?.hash
      ),
  },
  AdminMessagesRoute: {
    to: "/admin/messages",
    build: (
      options?:
      OptionalRouteOptions
    ) => interpolatePath(
        
        "/admin/messages",
        undefined,
        options?.search,
        options?.hash
      ),
  },
  AirtableCallbackRoute: {
    to: "/auth/airtable/callback",
    build: (
      options?:
      OptionalRouteOptions
    ) => interpolatePath(
        
        "/auth/airtable/callback",
        undefined,
        options?.search,
        options?.hash
      ),
  },
  GoogleCallbackRoute: {
    to: "/auth/google/callback",
    build: (
      options?:
      OptionalRouteOptions
    ) => interpolatePath(
        
        "/auth/google/callback",
        undefined,
        options?.search,
        options?.hash
      ),
  },
  SyncDetailRoute: {
    to: "/sync/:id",
    build: (
      options: OptionalRouteOptions
      & { params: {"id": ParamValue;}}
    ) => interpolatePath(
        
        "/sync/:id",
        options.params,
        options?.search,
        options?.hash
      ),
  },
} as const;

// PRIVATE API
export type Routes = RouteDefinitionsToRoutes<typeof routes>

// PUBLIC API
export { Link } from './Link'
