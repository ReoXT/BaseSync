/**
 * Problem vs Solution Section - Tech-Minimalist Glassmorphism
 * Bold side-by-side comparison: Zapier limitations vs BaseSync solutions
 */

import { useEffect, useRef, useState } from "react";

const problems = [
  {
    title: "No two-way sync",
    description: "Zapier literally can't do this",
  },
  {
    title: "Linked records show as cryptic IDs",
    description: "Like \"rec123abc\" instead of names",
  },
  {
    title: "Only syncs new records",
    description: "No historical data",
  },
  {
    title: "Two opposite Zaps create infinite loops",
    description: "Endless triggering chaos",
  },
  {
    title: "Attachments don't transfer properly",
    description: "URLs get corrupted",
  },
];

const solutions = [
  {
    title: "True bidirectional sync",
    description: "Smart conflict resolution built in",
  },
  {
    title: "Linked records show actual names",
    description: "Automatically resolved, no cryptic IDs",
  },
  {
    title: "Initial bulk sync for all existing data",
    description: "Thousands of rows? No problem.",
  },
  {
    title: "Attachment URLs transferred correctly",
    description: "Files work perfectly, every time",
  },
  {
    title: "Set it once, syncs every 5 minutes",
    description: "Runs forever in the background",
  },
];

export default function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "-50px" }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative pt-8 pb-24 md:pt-12 md:pb-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
        {/* Dual Gradient Orbs */}
        <div
          className="absolute -top-40 left-1/4 w-96 h-96 rounded-full bg-red-500/5 blur-3xl animate-pulse-slower"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-40 right-1/4 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl animate-pulse-slow"
          aria-hidden="true"
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm mb-6">
            <svg
              className="w-4 h-4 text-cyan-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-mono text-cyan-400">The Comparison</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Why Zapier Falls Short
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See exactly how BaseSync solves the problems Zapier can't handle
          </p>
        </div>

        {/* Split Comparison Container */}
        <div
          className={`grid lg:grid-cols-2 gap-8 transition-all duration-700 delay-100 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* LEFT: Problems (Red themed) */}
          <div className="relative rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-red-600/5 backdrop-blur-sm p-8 md:p-10 overflow-hidden group hover:border-red-500/30 transition-all duration-300">
            {/* Hover Glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 0%, rgba(239, 68, 68, 0.05), transparent 70%)",
              }}
            />

            <div className="relative">
              {/* Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  Why Zapier Doesn't Cut It
                </h3>
              </div>

              {/* Problems List */}
              <div className="space-y-5">
                {problems.map((problem, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 group/item"
                    style={{
                      animationDelay: `${index * 0.1}s`,
                    }}
                  >
                    {/* X Icon */}
                    <div className="shrink-0 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center mt-0.5 group-hover/item:bg-red-500/20 transition-colors duration-300">
                      <svg
                        className="w-4 h-4 text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-foreground leading-relaxed">
                        {problem.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {problem.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Solutions (Cyan/Green themed) */}
          <div className="relative rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 backdrop-blur-sm p-8 md:p-10 overflow-hidden group hover:border-cyan-500/40 transition-all duration-300 shadow-lg shadow-cyan-500/10">
            {/* Hover Glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.1), transparent 70%)",
              }}
            />

            <div className="relative">
              {/* Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-cyan-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  How BaseSync Solves This
                </h3>
              </div>

              {/* Solutions List */}
              <div className="space-y-5">
                {solutions.map((solution, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 group/item"
                    style={{
                      animationDelay: `${index * 0.1}s`,
                    }}
                  >
                    {/* Checkmark Icon */}
                    <div className="shrink-0 w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center mt-0.5 group-hover/item:bg-cyan-500/20 transition-colors duration-300">
                      <svg
                        className="w-4 h-4 text-cyan-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-foreground leading-relaxed">
                        {solution.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {solution.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div
          className={`mt-16 text-center transition-all duration-700 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <p className="text-sm text-muted-foreground">
            <span className="text-cyan-400 font-semibold">BaseSync</span> handles all of
            this automatically, no configuration, no maintenance, no headaches.
          </p>
        </div>
      </div>
    </section>
  );
}
