import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { Button } from "../../client/components/ui/button";
import { useEffect, useRef, useState } from "react";

export default function Hero() {
  return (
    <div className="relative w-full pt-14 pb-20 overflow-hidden">
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
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-delayed-more">
              <Button
                size="lg"
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-8 py-6 text-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105"
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
          </div>

          {/* Hero Visual - Animated Sync Diagram */}
          <div className="mt-20 relative">
            <SyncVisualization />
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

// Interactive Sync Visualization
function SyncVisualization() {
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'complete'>('idle');
  const [direction, setDirection] = useState<'to-sheets' | 'to-airtable' | 'bidirectional'>('bidirectional');

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncState('syncing');
      setTimeout(() => {
        setSyncState('complete');
        setTimeout(() => {
          setSyncState('idle');
          // Rotate through sync directions
          setDirection(prev =>
            prev === 'bidirectional' ? 'to-sheets' :
            prev === 'to-sheets' ? 'to-airtable' : 'bidirectional'
          );
        }, 1000);
      }, 2000);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative max-w-5xl mx-auto">
      {/* Container with glassmorphism effect */}
      <div className="relative rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl p-12 shadow-2xl">
        {/* Sync Illustration */}
        <div className="flex items-center justify-between gap-8 md:gap-16">
          {/* Airtable Side */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" />
                </svg>
              </div>
              <div>
                <div className="font-bold text-white text-lg">Airtable</div>
                <div className="text-xs text-slate-400 font-mono">Source Base</div>
              </div>
            </div>

            {/* Sample Records */}
            <div className="space-y-2">
              <RecordCard
                name="John Smith"
                status="Active"
                isLinked
                syncing={syncState === 'syncing' && (direction === 'to-sheets' || direction === 'bidirectional')}
              />
              <RecordCard
                name="Sarah Johnson"
                status="Pending"
                isLinked
                syncing={syncState === 'syncing' && (direction === 'to-sheets' || direction === 'bidirectional')}
              />
            </div>
          </div>

          {/* Sync Arrow */}
          <div className="flex flex-col items-center gap-4">
            <SyncArrow
              direction={direction}
              syncing={syncState === 'syncing'}
            />
          </div>

          {/* Google Sheets Side */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V13H17V17Z" />
                </svg>
              </div>
              <div>
                <div className="font-bold text-white text-lg">Google Sheets</div>
                <div className="text-xs text-slate-400 font-mono">Target Sheet</div>
              </div>
            </div>

            {/* Sample Rows */}
            <div className="space-y-2">
              <RecordCard
                name="John Smith"
                status="Active"
                isLinked={false}
                syncing={syncState === 'syncing' && (direction === 'to-airtable' || direction === 'bidirectional')}
              />
              <RecordCard
                name="Sarah Johnson"
                status="Pending"
                isLinked={false}
                syncing={syncState === 'syncing' && (direction === 'to-airtable' || direction === 'bidirectional')}
              />
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-8 pt-6 border-t border-slate-700/50 flex items-center justify-center gap-3">
          <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            syncState === 'syncing' ? 'bg-cyan-400 animate-pulse' :
            syncState === 'complete' ? 'bg-green-400' : 'bg-slate-600'
          }`} />
          <span className="text-sm font-mono text-slate-400">
            {syncState === 'syncing' ? 'Syncing...' :
             syncState === 'complete' ? 'Sync Complete' : 'Ready'}
          </span>
          {syncState === 'complete' && (
            <svg className="w-4 h-4 text-green-400 animate-scale-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      {/* Feature Callout */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30">
        <span className="text-sm font-semibold text-white whitespace-nowrap">
          ✨ Linked records show as names, not IDs
        </span>
      </div>
    </div>
  );
}

// Record Card Component
function RecordCard({
  name,
  status,
  isLinked,
  syncing,
}: {
  name: string;
  status: string;
  isLinked: boolean;
  syncing: boolean;
}) {
  return (
    <div className={`relative rounded-lg border bg-slate-800/50 px-4 py-3 transition-all duration-300 ${
      syncing
        ? 'border-cyan-400/50 shadow-lg shadow-cyan-400/20 scale-[1.02]'
        : 'border-slate-700/50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{name}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {status}
            </span>
            {isLinked && (
              <span className="text-xs text-cyan-400 font-mono">→ linked</span>
            )}
          </div>
        </div>
        {syncing && (
          <div className="ml-2">
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

// Animated Sync Arrow
function SyncArrow({
  direction,
  syncing,
}: {
  direction: 'to-sheets' | 'to-airtable' | 'bidirectional';
  syncing: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center gap-2">
      {/* To Sheets Arrow */}
      <div className={`transition-all duration-500 ${
        direction === 'to-sheets' || direction === 'bidirectional' ? 'opacity-100' : 'opacity-20'
      }`}>
        <svg
          className={`w-16 h-8 text-cyan-400 ${syncing && (direction === 'to-sheets' || direction === 'bidirectional') ? 'animate-pulse' : ''}`}
          fill="none"
          viewBox="0 0 64 32"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16h56m0 0l-8-8m8 8l-8 8" />
          {syncing && (direction === 'to-sheets' || direction === 'bidirectional') && (
            <>
              <circle cx="20" cy="16" r="2" fill="currentColor" className="animate-travel-1" />
              <circle cx="30" cy="16" r="2" fill="currentColor" className="animate-travel-2" />
              <circle cx="40" cy="16" r="2" fill="currentColor" className="animate-travel-3" />
            </>
          )}
        </svg>
      </div>

      {/* Bidirectional Indicator */}
      {direction === 'bidirectional' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center backdrop-blur-sm">
            <svg className="w-4 h-4 text-cyan-400 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>
      )}

      {/* To Airtable Arrow */}
      <div className={`transition-all duration-500 ${
        direction === 'to-airtable' || direction === 'bidirectional' ? 'opacity-100' : 'opacity-20'
      }`}>
        <svg
          className={`w-16 h-8 text-cyan-400 ${syncing && (direction === 'to-airtable' || direction === 'bidirectional') ? 'animate-pulse' : ''}`}
          fill="none"
          viewBox="0 0 64 32"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M60 16H4m0 0l8-8m-8 8l8 8" />
          {syncing && (direction === 'to-airtable' || direction === 'bidirectional') && (
            <>
              <circle cx="44" cy="16" r="2" fill="currentColor" className="animate-travel-reverse-1" />
              <circle cx="34" cy="16" r="2" fill="currentColor" className="animate-travel-reverse-2" />
              <circle cx="24" cy="16" r="2" fill="currentColor" className="animate-travel-reverse-3" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
