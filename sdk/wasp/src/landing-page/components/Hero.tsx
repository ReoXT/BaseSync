import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { Button } from "../../client/components/ui/button";

export default function Hero() {
  return (
    <div className="relative w-full pt-0 pb-20 overflow-hidden">
      <AnimatedBackground />
      <div className="md:p-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Hero Content */}
          <div className="lg:mb-18 mx-auto max-w-4xl text-center relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm mb-8 animate-fade-in">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-sm font-mono text-cyan-400">
                Zapier can't do this
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-foreground text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6 animate-slide-up">
              True Two-Way Sync:
              <br />
              <span className="relative inline-block mt-2">
                <span className="text-gradient-sync">
                  Airtable ↔ Google Sheets
                </span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  height="8"
                  viewBox="0 0 400 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0 4C100 2 200 6 400 4"
                    stroke="url(#gradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                      <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-muted-foreground mx-auto mt-8 max-w-2xl text-lg md:text-xl leading-relaxed animate-fade-in-delayed">
              Finally sync your Airtable base to Google Sheets with{" "}
              <span className="text-cyan-400 font-semibold">real linked record names</span>,{" "}
              bulk data, and bidirectional updates.
            </p>

            {/* CTAs */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-delayed-more">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 px-8 py-6 text-lg transition-all duration-300"
                asChild
              >
                <WaspRouterLink to={routes.SignupRoute.to}>
                  Start Free Trial
                  <span className="ml-2" aria-hidden="true">→</span>
                </WaspRouterLink>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-cyan-500/30 hover:border-cyan-500 hover:bg-cyan-500/5 px-8 py-6 text-lg transition-all duration-300"
                asChild
              >
                <WaspRouterLink to={routes.PricingPageRoute.to}>
                  See How It Works
                </WaspRouterLink>
              </Button>
            </div>

            {/* Privacy Policy Link for Google OAuth Verification */}
            <p className="mt-4 text-xs text-muted-foreground animate-fade-in-delayed-more">
              By signing up, you agree to our{" "}
              <WaspRouterLink
                to={routes.TermsOfServiceRoute.to}
                className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
              >
                Terms of Service
              </WaspRouterLink>
              {" "}and{" "}
              <WaspRouterLink
                to={routes.PrivacyPolicyRoute.to}
                className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
              >
                Privacy Policy
              </WaspRouterLink>
            </p>
          </div>

          {/* Hero Visual */}
          <HeroVisual />

        </div>
      </div>
    </div>
  );
}

// Hero Visual - Animated Sync Visualization
function HeroVisual() {
  return (
    <div className="mt-6 md:mt-8 relative z-10 animate-fade-in-delayed-more">
      <div className="max-w-5xl mx-auto px-4">
        {/* Main Container */}
        <div className="relative">
          {/* Connection Line with Particles */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px">
            <svg
              className="w-full h-24"
              viewBox="0 0 600 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Gradient Definitions */}
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
                </linearGradient>

                <radialGradient id="particleGlow">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Connection Line */}
              <line
                x1="100"
                y1="50"
                x2="500"
                y2="50"
                stroke="url(#lineGradient)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Bidirectional Arrows */}
              <path
                d="M110 45 L100 50 L110 55"
                stroke="#06b6d4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.4"
              />
              <path
                d="M490 45 L500 50 L490 55"
                stroke="#06b6d4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.4"
              />

              {/* Animated Particles - Left to Right */}
              <circle
                r="3"
                cy="50"
                fill="url(#particleGlow)"
                className="animate-travel-1"
              >
                <animate
                  attributeName="cx"
                  from="100"
                  to="500"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle
                r="2.5"
                cy="50"
                fill="#06b6d4"
                className="animate-travel-2"
              >
                <animate
                  attributeName="cx"
                  from="100"
                  to="500"
                  dur="2.3s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle
                r="2"
                cy="50"
                fill="#22d3ee"
                className="animate-travel-3"
              >
                <animate
                  attributeName="cx"
                  from="100"
                  to="500"
                  dur="2.6s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Animated Particles - Right to Left */}
              <circle
                r="3"
                cy="50"
                fill="url(#particleGlow)"
                className="animate-travel-reverse-1"
              >
                <animate
                  attributeName="cx"
                  from="500"
                  to="100"
                  dur="2.2s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle
                r="2.5"
                cy="50"
                fill="#3b82f6"
                className="animate-travel-reverse-2"
              >
                <animate
                  attributeName="cx"
                  from="500"
                  to="100"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle
                r="2"
                cy="50"
                fill="#60a5fa"
                className="animate-travel-reverse-3"
              >
                <animate
                  attributeName="cx"
                  from="500"
                  to="100"
                  dur="2.8s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
          </div>

          {/* Platform Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 relative">
            {/* Airtable Card */}
            <div className="relative group">
              <div className="relative rounded-2xl border border-cyan-500/20 bg-card/80 backdrop-blur-sm p-6 shadow-xl shadow-cyan-500/5 overflow-hidden transition-all duration-500 hover:border-cyan-500/40 hover:shadow-cyan-500/10">
                {/* Card Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Platform Logo Area */}
                <div className="relative flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center">
                    <img
                      src="/airtable-icon.svg"
                      alt="Airtable"
                      className="w-full h-full object-contain"
                      style={{ imageRendering: '-webkit-optimize-contrast', shapeRendering: 'geometricPrecision' }}
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">Airtable</div>
                    <div className="text-xs text-muted-foreground font-mono">Source Database</div>
                  </div>
                </div>

                {/* Simulated Table Data */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-xs text-muted-foreground font-mono">rec7X9kLm</span>
                    <span className="text-xs text-foreground ml-auto">→</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-xs text-muted-foreground font-mono">rec2P4nQw</span>
                    <span className="text-xs text-foreground ml-auto">→</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
                    <div className="w-2 h-2 rounded-full bg-cyan-300" />
                    <span className="text-xs text-muted-foreground font-mono">rec5K8hTp</span>
                    <span className="text-xs text-foreground ml-auto">→</span>
                  </div>
                </div>

                {/* Linked Records Label */}
                <div className="mt-4 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 inline-block">
                  <span className="text-xs font-mono text-cyan-400">Linked Records</span>
                </div>
              </div>
            </div>

            {/* Google Sheets Card */}
            <div className="relative group">
              <div className="relative rounded-2xl border border-emerald-500/20 bg-card/80 backdrop-blur-sm p-6 shadow-xl shadow-emerald-500/5 overflow-hidden transition-all duration-500 hover:border-emerald-500/40 hover:shadow-emerald-500/10">
                {/* Card Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Platform Logo Area */}
                <div className="relative flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center">
                    <img src="/google-sheets-icon.svg" alt="Google Sheets" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">Google Sheets</div>
                    <div className="text-xs text-muted-foreground font-mono">Destination Sheet</div>
                  </div>
                </div>

                {/* Simulated Table Data with Readable Names */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-foreground font-medium">Sarah Johnson</span>
                    <svg className="w-3 h-3 text-emerald-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-foreground font-medium">Michael Chen</span>
                    <svg className="w-3 h-3 text-emerald-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-foreground font-medium">Emma Rodriguez</span>
                    <svg className="w-3 h-3 text-emerald-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                {/* Readable Names Label */}
                <div className="mt-4 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 inline-block">
                  <span className="text-xs font-mono text-emerald-400">Readable Names ✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Badge - Key Value Prop */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
            <div className="relative">
              {/* Pulsing Glow */}
              <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl animate-pulse-slow" />

              {/* Badge */}
              <div className="relative px-4 py-2 rounded-full border-2 border-cyan-500/30 bg-background/95 backdrop-blur-sm shadow-2xl">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyan-400 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-xs font-bold font-mono text-gradient-sync whitespace-nowrap">
                    LIVE SYNC
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Callout Below */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20">
            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs text-muted-foreground">
              <span className="text-foreground font-semibold">IDs become names</span> automatically
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Animated Background with Grid Pattern
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: `
            radial-gradient(ellipse 120% 120% at 50% 50%, black 20%, rgba(0,0,0,0.5) 50%, transparent 80%)
          `,
          WebkitMaskImage: `
            radial-gradient(ellipse 120% 120% at 50% 50%, black 20%, rgba(0,0,0,0.5) 50%, transparent 80%)
          `,
        }}
      />

      {/* Gradient Orbs */}
      <div
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl animate-pulse-slow"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl animate-pulse-slower"
        aria-hidden="true"
      />
    </div>
  );
}
