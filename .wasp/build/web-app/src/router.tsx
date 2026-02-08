import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from '../../../../src/client/App'

import createAuthRequiredPage from "./auth/pages/createAuthRequiredPage"

import LandingPage from '../../../../src/landing-page/LandingPage'
import LoginPage from '../../../../src/auth/LoginPage'
import { Signup as SignupPage } from '../../../../src/auth/SignupPage'
import { RequestPasswordResetPage } from '../../../../src/auth/email-and-pass/RequestPasswordResetPage'
import { PasswordResetPage } from '../../../../src/auth/email-and-pass/PasswordResetPage'
import { EmailVerificationPage } from '../../../../src/auth/email-and-pass/EmailVerificationPage'
import AccountPage from '../../../../src/user/AccountPage'
import AccountSettingsPage from '../../../../src/user/AccountSettingsPage'
import VerifyEmailChangePage from '../../../../src/user/VerifyEmailChangePage'
import DemoAppPage from '../../../../src/demo-ai-app/DemoAppPage'
import NewSyncPage from '../../../../src/client/pages/NewSyncPage'
import EditSyncPage from '../../../../src/client/pages/EditSyncPage'
import PricingPage from '../../../../src/payment/PricingPage'
import CheckoutResultPage from '../../../../src/payment/CheckoutResultPage'
import AdminOverviewPage from '../../../../src/admin/dashboards/overview/OverviewPage'
import AdminUsersPage from '../../../../src/admin/dashboards/users/UsersDashboardPage'
import AdminUserDetailPage from '../../../../src/admin/dashboards/users/UserDetailPage'
import AdminSyncMonitorPage from '../../../../src/admin/dashboards/sync-monitor/SyncMonitorPage'
import AdminDatabasePage from '../../../../src/admin/dashboards/database/DatabasePage'
import AdminSettingsPage from '../../../../src/admin/elements/settings/SettingsPage'
import { NotFoundPage } from '../../../../src/client/components/NotFoundPage'
import AdminMessagesPage from '../../../../src/admin/dashboards/messages/MessagesPage'
import AirtableCallbackPage from '../../../../src/client/auth-callback/AirtableCallbackPage'
import GoogleCallbackPage from '../../../../src/client/auth-callback/GoogleCallbackPage'
import SyncDetailPage from '../../../../src/client/pages/SyncDetailPage'


import { DefaultRootErrorBoundary } from './components/DefaultRootErrorBoundary'

import { routes } from 'wasp/client/router'

export const routeNameToRouteComponent = {
  LandingPageRoute: LandingPage,
  LoginRoute: LoginPage,
  SignupRoute: SignupPage,
  RequestPasswordResetRoute: RequestPasswordResetPage,
  PasswordResetRoute: PasswordResetPage,
  EmailVerificationRoute: EmailVerificationPage,
  AccountRoute: createAuthRequiredPage(AccountPage),
  AccountSettingsRoute: createAuthRequiredPage(AccountSettingsPage),
  VerifyEmailChangeRoute: createAuthRequiredPage(VerifyEmailChangePage),
  DemoAppRoute: createAuthRequiredPage(DemoAppPage),
  NewSyncRoute: createAuthRequiredPage(NewSyncPage),
  EditSyncRoute: createAuthRequiredPage(EditSyncPage),
  PricingPageRoute: PricingPage,
  CheckoutResultRoute: createAuthRequiredPage(CheckoutResultPage),
  AdminRoute: createAuthRequiredPage(AdminOverviewPage),
  AdminUsersRoute: createAuthRequiredPage(AdminUsersPage),
  AdminUserDetailRoute: createAuthRequiredPage(AdminUserDetailPage),
  AdminSyncMonitorRoute: createAuthRequiredPage(AdminSyncMonitorPage),
  AdminDatabaseRoute: createAuthRequiredPage(AdminDatabasePage),
  AdminSettingsRoute: createAuthRequiredPage(AdminSettingsPage),
  NotFoundRoute: NotFoundPage,
  AdminMessagesRoute: createAuthRequiredPage(AdminMessagesPage),
  AirtableCallbackRoute: createAuthRequiredPage(AirtableCallbackPage),
  GoogleCallbackRoute: createAuthRequiredPage(GoogleCallbackPage),
  SyncDetailRoute: createAuthRequiredPage(SyncDetailPage),
} as const;

const waspDefinedRoutes = [
]
const userDefinedRoutes = Object.entries(routes).map(([routeKey, route]) => {
  return {
    path: route.to,
    Component: routeNameToRouteComponent[routeKey],
  }
})

const browserRouter = createBrowserRouter([{
  path: '/',
  element: <App />,
  ErrorBoundary: DefaultRootErrorBoundary,
  children: [
    ...waspDefinedRoutes,
    ...userDefinedRoutes,
  ],
}], {
  basename: '/',
})

export const router = <RouterProvider router={browserRouter} />
