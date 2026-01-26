/**
 * Problem Section - "Why Zapier Doesn't Cut It"
 * Highlights pain points with existing solutions to establish product need
 */

export default function ProblemSection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/20 bg-red-500/5 backdrop-blur-sm mb-6">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-mono text-red-400">The Problem</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Why Zapier Doesn't Cut It
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Zapier's limitations turn simple sync tasks into broken workflows and frustrating workarounds
          </p>
        </div>

        {/* Problem Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          <ProblemCard
            icon={<NoSyncIcon />}
            title="No Two-Way Sync"
            description="Zapier literally can't do this"
            detail="Only one-direction flows. Need both ways? Two Zaps = infinite loop nightmare."
            delay={0}
          />

          <ProblemCard
            icon={<CrypticIDIcon />}
            title="Cryptic Record IDs"
            description="Linked records show as rec123abc"
            detail="Meaningless IDs instead of readable names. Good luck understanding your data."
            delay={0.1}
          />

          <ProblemCard
            icon={<NewOnlyIcon />}
            title="New Records Only"
            description="No historical data sync"
            detail="Existing records? Manual export/import. Hundreds of rows? Have fun."
            delay={0.2}
          />

          <ProblemCard
            icon={<InfiniteLoopIcon />}
            title="Infinite Loop Hell"
            description="Two opposite Zaps create chaos"
            detail="Bidirectional needs two Zaps. They trigger each other endlessly. System meltdown."
            delay={0.3}
          />

          <ProblemCard
            icon={<AttachmentIcon />}
            title="Broken Attachments"
            description="Files don't transfer properly"
            detail="Attachment fields? URLs get mangled. Downloads break. Data corruption galore."
            delay={0.4}
          />
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-lg font-semibold text-foreground mb-2">
            Sound familiar?
          </p>
          <p className="text-muted-foreground">
            BaseSync was built to solve exactly these problems.
          </p>
        </div>
      </div>
    </section>
  );
}

// Problem Card Component
function ProblemCard({
  icon,
  title,
  description,
  detail,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  detail: string;
  delay: number;
}) {
  return (
    <div
      className="group relative rounded-xl border border-red-500/20 bg-gradient-to-br from-red-950/10 to-red-900/5 dark:from-red-950/20 dark:to-red-900/10 p-6 transition-all duration-300 hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10 hover:-translate-y-1"
      style={{
        animation: `fade-in-up 0.6s ease-out ${delay}s both`,
      }}
    >
      {/* Gradient Overlay on Hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-500/0 to-red-500/0 group-hover:from-red-500/5 group-hover:to-red-500/10 transition-all duration-300" />

      <div className="relative">
        {/* Icon */}
        <div className="mb-4 w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-foreground mb-2 leading-tight">
          {title}
        </h3>
        <p className="text-sm font-medium text-red-400 mb-3 leading-snug">
          {description}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {detail}
        </p>

        {/* X Mark Badge */}
        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// Custom Icons for Each Problem
function NoSyncIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      <line x1="2" y1="2" x2="22" y2="22" strokeWidth={2.5} stroke="currentColor" opacity={0.6} />
    </svg>
  );
}

function CrypticIDIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
    </svg>
  );
}

function NewOnlyIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12h8" opacity={0.6} />
    </svg>
  );
}

function InfiniteLoopIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function AttachmentIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      <line x1="18" y1="6" x2="6" y2="18" strokeWidth={2.5} stroke="currentColor" opacity={0.4} />
    </svg>
  );
}
