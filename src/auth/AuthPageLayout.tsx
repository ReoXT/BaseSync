import { ReactNode } from "react";

export function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-background px-6 py-12 lg:px-8">
      {/* Background Pattern - Grid */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Gradient Orbs */}
      <div
        className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-3xl animate-pulse-slow"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-3xl animate-pulse-slower"
        aria-hidden="true"
      />

      <div className="w-full max-w-md mx-auto">
        {/* Logo/Brand */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold">
            <span className="text-gradient-sync">BaseSync</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-mono">
            True Two-Way Sync
          </p>
        </div>

        {/* Glassmorphic Card */}
        <div className="relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden animate-fade-in-delayed">
          {/* Subtle gradient accent at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />

          <div className="px-8 py-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
