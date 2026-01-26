/**
 * Social Proof Section - Tech-Minimalist Glassmorphism
 * "Trusted by Operations Teams" with logos, stats, and testimonials
 */

import { useState, useEffect, useRef } from "react";

export default function SocialProofSection() {
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
    <section ref={sectionRef} className="relative py-24 md:py-32 overflow-hidden">
      {/* Background Pattern - Matching Other Sections */}
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
        {/* Gradient Orb */}
        <div
          className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-3xl animate-pulse-slower"
          aria-hidden="true"
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="text-sm font-mono text-cyan-400">Trusted by Teams</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Trusted by Operations Teams
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join teams who've eliminated manual data entry and sync headaches
          </p>
        </div>

        {/* Stats Grid - Large Impact Numbers */}
        <div
          className={`grid md:grid-cols-3 gap-8 mb-16 transition-all duration-700 delay-100 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <StatCard
            number="1M+"
            label="Records Synced"
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            }
          />
          <StatCard
            number="10K+"
            label="Hours Saved Weekly"
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          />
          <StatCard
            number="99.9%"
            label="Sync Success Rate"
            icon={
              <svg
                className="w-6 h-6"
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
            }
          />
        </div>

        {/* Customer Logos - Placeholder Grid */}
        <div
          className={`mb-16 transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-center text-sm text-muted-foreground mb-8 font-mono">
            TODO: Customer logos coming soon
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <LogoPlaceholder key={i} index={i} />
            ))}
          </div>
        </div>

        {/* Testimonial Cards */}
        <div
          className={`grid md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-700 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <TestimonialCard
            quote="TODO: Replace with real testimonial about how BaseSync solved their sync problems and saved hours of manual work."
            author="Jane Smith"
            role="Operations Manager"
            company="Tech Startup Inc."
            delay={0}
            isVisible={isVisible}
          />
          <TestimonialCard
            quote="TODO: Replace with real testimonial highlighting the linked records feature and how it displays names instead of cryptic IDs."
            author="John Doe"
            role="Product Operations Lead"
            company="SaaS Company Co."
            delay={0.1}
            isVisible={isVisible}
          />
          <TestimonialCard
            quote="TODO: Replace with real testimonial about bidirectional sync and conflict resolution working seamlessly for their team."
            author="Sarah Johnson"
            role="Data Analyst"
            company="Growth Team Ltd."
            delay={0.2}
            isVisible={isVisible}
            featured
          />
        </div>
      </div>
    </section>
  );
}

// Stat Card Component
function StatCard({
  number,
  label,
  icon,
}: {
  number: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 text-center transition-all duration-300 hover:scale-105 hover:border-cyan-500/30 group">
      {/* Hover Glow Effect */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.05), transparent 70%)",
        }}
      />

      <div className="relative">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/10 mb-4">
          <div className="text-cyan-400">{icon}</div>
        </div>

        {/* Number */}
        <div className="text-5xl md:text-6xl font-bold text-gradient-sync mb-2">
          {number}
        </div>

        {/* Label */}
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
      </div>
    </div>
  );
}

// Logo Placeholder Component
function LogoPlaceholder({ index }: { index: number }) {
  return (
    <div className="relative rounded-xl border border-border bg-card/30 backdrop-blur-sm p-8 flex items-center justify-center transition-all duration-300 hover:border-cyan-500/20 hover:bg-card/50 group">
      {/* Placeholder Logo */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center">
          <span className="text-2xl font-bold font-mono text-cyan-400/50">
            {index}
          </span>
        </div>
        <span className="text-xs font-mono text-muted-foreground/50">LOGO</span>
      </div>
    </div>
  );
}

// Testimonial Card Component
function TestimonialCard({
  quote,
  author,
  role,
  company,
  delay,
  isVisible,
  featured = false,
}: {
  quote: string;
  author: string;
  role: string;
  company: string;
  delay: number;
  isVisible: boolean;
  featured?: boolean;
}) {
  return (
    <div
      className={`relative transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{
        transitionDelay: isVisible ? `${delay}s` : "0s",
      }}
    >
      {/* Featured Badge */}
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30">
            <span className="text-xs font-bold font-mono text-white tracking-wider">
              FEATURED
            </span>
          </div>
        </div>
      )}

      {/* Card */}
      <div
        className={`relative h-full rounded-2xl border backdrop-blur-sm overflow-hidden transition-all duration-300 hover:scale-105 group ${
          featured
            ? "border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 shadow-lg shadow-cyan-500/10"
            : "border-border bg-card/50 hover:border-cyan-500/20"
        }`}
      >
        {/* Hover Glow Effect */}
        {featured && (
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.1), transparent 70%)",
            }}
          />
        )}

        <div className="relative p-8">
          {/* Quote Icon */}
          <div className="mb-4">
            <svg
              className="w-10 h-10 text-cyan-400/30"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
          </div>

          {/* Quote */}
          <blockquote className="text-sm text-muted-foreground leading-relaxed mb-6 italic">
            "{quote}"
          </blockquote>

          {/* Author */}
          <div className="flex items-center gap-4 pt-4 border-t border-border">
            {/* Avatar Placeholder */}
            <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center">
              <span className="text-lg font-bold text-cyan-400">
                {author.charAt(0)}
              </span>
            </div>

            {/* Info */}
            <div>
              <p className="text-sm font-semibold text-foreground">{author}</p>
              <p className="text-xs text-muted-foreground">
                {role} • {company}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
