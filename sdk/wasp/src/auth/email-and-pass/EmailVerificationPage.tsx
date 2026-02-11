import { VerifyEmailForm } from "wasp/client/auth";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { AuthPageLayout } from "../AuthPageLayout";
import "../auth-overrides.css";

export function EmailVerificationPage() {
  return (
    <AuthPageLayout>
      {/* Page Title */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">Verify your email</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Please check your inbox and verify your email address
        </p>
      </div>

      {/* Email Verification Form */}
      <div className="mb-6 auth-form-container">
        <VerifyEmailForm
          appearance={{
            colors: {
              brand: '#06b6d4',
              brandAccent: '#3b82f6',
              submitButtonText: 'white',
              errorBackground: 'rgba(248, 113, 113, 0.1)',
              errorText: '#f87171',
              successBackground: 'rgba(52, 211, 153, 0.1)',
              successText: '#34d399',
              formErrorText: '#f87171',
            }
          }}
        />
      </div>

      {/* Links Section */}
      <div className="space-y-4 pt-6 border-t border-border/50">
        {/* Back to Login Link */}
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-muted-foreground">Email verified?</span>
          <WaspRouterLink
            to={routes.LoginRoute.to}
            className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors duration-200 inline-flex items-center gap-1 group"
          >
            Sign in now
            <svg
              className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </WaspRouterLink>
        </div>
      </div>
    </AuthPageLayout>
  );
}
