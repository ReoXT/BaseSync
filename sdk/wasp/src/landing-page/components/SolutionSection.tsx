/**
 * Solution Section - "How BaseSync Solves This"
 * Presents solutions in contrast to problems, using side-by-side comparison
 */

export default function SolutionSection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent">
      {/* Background Pattern */}
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

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm mb-6">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-mono text-emerald-400">The Solution</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How BaseSync Solves This
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Purpose-built to handle everything Zapier can't—with zero workarounds
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="space-y-6">
          <ComparisonRow
            problem={{
              icon: <XIcon />,
              title: "No Two-Way Sync",
              description: "Only one direction",
            }}
            solution={{
              icon: <CheckIcon />,
              title: "True Bidirectional Sync",
              description: "Smart conflict resolution when both sides change",
              detail: "Airtable ↔ Sheets sync simultaneously. You choose: Airtable wins, Sheets wins, or newest wins.",
            }}
            delay={0}
          />

          <ComparisonRow
            problem={{
              icon: <XIcon />,
              title: "Cryptic Record IDs",
              description: "rec123abc garbage",
            }}
            solution={{
              icon: <CheckIcon />,
              title: "Real Names, Automatically",
              description: "Linked records display as readable names",
              detail: "See 'John Smith' instead of 'rec8xTQ2a9Kzb'. BaseSync resolves linked records to primary field values.",
            }}
            delay={0.1}
          />

          <ComparisonRow
            problem={{
              icon: <XIcon />,
              title: "New Records Only",
              description: "Manual exports required",
            }}
            solution={{
              icon: <CheckIcon />,
              title: "Bulk Historical Sync",
              description: "All existing data syncs on first run",
              detail: "Hundreds or thousands of rows? Initial sync handles everything. No manual CSV exports.",
            }}
            delay={0.2}
          />

          <ComparisonRow
            problem={{
              icon: <XIcon />,
              title: "Infinite Loop Hell",
              description: "Two Zaps trigger endlessly",
            }}
            solution={{
              icon: <CheckIcon />,
              title: "Loop-Free Architecture",
              description: "Intelligent sync tracking prevents infinite loops",
              detail: "Built-in state management tracks what's synced. Bidirectional = one config, zero loops.",
            }}
            delay={0.3}
          />

          <ComparisonRow
            problem={{
              icon: <XIcon />,
              title: "Broken Attachments",
              description: "URLs get mangled",
            }}
            solution={{
              icon: <CheckIcon />,
              title: "Attachment URLs Work",
              description: "Files transfer with correct URLs preserved",
              detail: "Attachment fields sync as comma-separated URLs. Click to download. No corruption.",
            }}
            delay={0.4}
          />
        </div>

        {/* Feature Callout */}
        <div className="mt-16 relative">
          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/10 to-emerald-900/5 dark:from-emerald-950/20 dark:to-emerald-900/10 p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Set It Once, Forget It
                  </h3>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Configure your sync in 5 minutes. BaseSync automatically syncs every <span className="text-emerald-400 font-semibold">5 minutes</span> in the background.
                  Your data stays in sync while you focus on actual work.
                </p>
              </div>
              <div className="shrink-0">
                <div className="px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/30">
                  <span className="text-sm font-bold text-white whitespace-nowrap">
                    ⚡ Auto-sync every 5 min
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Comparison Row Component - Side-by-side Problem vs Solution
function ComparisonRow({
  problem,
  solution,
  delay,
}: {
  problem: {
    icon: React.ReactNode;
    title: string;
    description: string;
  };
  solution: {
    icon: React.ReactNode;
    title: string;
    description: string;
    detail: string;
  };
  delay: number;
}) {
  return (
    <div
      className="relative grid md:grid-cols-2 gap-4 group"
      style={{
        animation: `fade-in-up 0.6s ease-out ${delay}s both`,
      }}
    >
      {/* Problem Side (Muted) */}
      <div className="relative rounded-xl border border-red-500/10 bg-gradient-to-br from-red-950/5 to-red-900/5 dark:from-red-950/10 dark:to-red-900/5 p-6 opacity-60 group-hover:opacity-40 transition-opacity duration-300">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            {problem.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-foreground mb-1 leading-tight">
              {problem.title}
            </h4>
            <p className="text-sm text-red-400 line-through">
              {problem.description}
            </p>
          </div>
        </div>
      </div>

      {/* VS Divider */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-background border-2 border-border flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </div>

      {/* Solution Side (Highlighted) */}
      <div className="relative rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/10 to-emerald-900/5 dark:from-emerald-950/20 dark:to-emerald-900/10 p-6 group-hover:border-emerald-500/50 group-hover:shadow-lg group-hover:shadow-emerald-500/10 transition-all duration-300">
        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-emerald-500/10 transition-all duration-300" />

        <div className="relative">
          <div className="flex items-start gap-4 mb-4">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              {solution.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-foreground mb-1 leading-tight">
                {solution.title}
              </h4>
              <p className="text-sm font-medium text-emerald-400">
                {solution.description}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed pl-14">
            {solution.detail}
          </p>
        </div>
      </div>
    </div>
  );
}

// Simple X Icon
function XIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// Simple Check Icon
function CheckIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}
