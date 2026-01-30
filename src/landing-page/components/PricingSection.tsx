/**
 * Pricing Section - Tech-Minimalist Glassmorphism
 * Soft, refined animations - sliding toggle and gentle price transitions
 */

import { useState, useEffect, useRef } from "react";
import { Button } from "../../client/components/ui/button";
import { Link as WaspRouterLink, routes } from "wasp/client/router";

type BillingPeriod = "monthly" | "annual";

interface PricingTier {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  badge?: string;
  popular?: boolean;
  features: string[];
}

const tiers: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For individuals",
    monthlyPrice: 9,
    annualPrice: 7.2,
    features: [
      "1 sync configuration",
      "1,000 records per sync",
      "15-minute sync interval",
      "Basic conflict resolution",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For power users",
    monthlyPrice: 19,
    annualPrice: 15.2,
    badge: "MOST POPULAR",
    popular: true,
    features: [
      "3 sync configurations",
      "5,000 records per sync",
      "5-minute sync interval",
      "Configurable conflict resolution",
      "Priority email support",
    ],
  },
  {
    id: "business",
    name: "Business",
    tagline: "For growing teams",
    monthlyPrice: 39,
    annualPrice: 31.2,
    features: [
      "10 sync configurations",
      "Unlimited records",
      "5-minute sync interval",
      "Configurable conflict resolution",
      "Priority support + Slack",
    ],
  },
];

export default function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
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
      {/* Background Pattern - Matching Hero */}
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
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-3xl animate-pulse-slow"
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
          {/* Badge - Matching Hero Style */}
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
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-mono text-cyan-400">Simple Pricing</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Start with a 14-day free trial. No credit card required.
          </p>

          {/* Billing Toggle */}
          <BillingToggle billingPeriod={billingPeriod} onChange={setBillingPeriod} />
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {tiers.map((tier, index) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              billingPeriod={billingPeriod}
              delay={index * 0.1}
              isVisible={isVisible}
            />
          ))}
        </div>

        {/* Bottom Message */}
        <div
          className={`mt-12 text-center transition-all duration-700 delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <p className="text-sm text-muted-foreground">
            All plans include{" "}
            <span className="text-cyan-400 font-semibold">14-day free trial</span> •{" "}
            <span className="text-cyan-400 font-semibold">No credit card required</span> •{" "}
            Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}

// Billing Toggle - Simple Sliding Pill
function BillingToggle({
  billingPeriod,
  onChange,
}: {
  billingPeriod: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
}) {
  const monthlyRef = useRef<HTMLButtonElement>(null);
  const annualRef = useRef<HTMLButtonElement>(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const updatePillPosition = () => {
      const activeButton = billingPeriod === "monthly" ? monthlyRef.current : annualRef.current;
      if (activeButton) {
        setPillStyle({
          left: activeButton.offsetLeft,
          width: activeButton.offsetWidth,
        });
      }
    };

    updatePillPosition();
    window.addEventListener("resize", updatePillPosition);
    return () => window.removeEventListener("resize", updatePillPosition);
  }, [billingPeriod]);

  return (
    <div className="relative inline-flex items-center p-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm">
      {/* Sliding background pill - smooth and simple */}
      <div
        className="absolute top-1.5 h-[calc(100%-0.75rem)] rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/25 transition-all duration-500 ease-out"
        style={{
          left: `${pillStyle.left}px`,
          width: `${pillStyle.width}px`,
        }}
      />

      {/* Monthly button */}
      <button
        ref={monthlyRef}
        onClick={() => onChange("monthly")}
        className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
          billingPeriod === "monthly"
            ? "text-white"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Monthly
      </button>

      {/* Annual button */}
      <button
        ref={annualRef}
        onClick={() => onChange("annual")}
        className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
          billingPeriod === "annual"
            ? "text-white"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Annual
        <span
          className={`text-xs px-2 py-0.5 rounded-full border font-mono transition-all duration-300 ${
            billingPeriod === "annual"
              ? "bg-white/20 text-white border-white/30"
              : "bg-emerald-400/20 text-emerald-400 border-emerald-400/30"
          }`}
        >
          -20%
        </span>
      </button>
    </div>
  );
}

// Pricing Card - Gentle Price Transitions
function PricingCard({
  tier,
  billingPeriod,
  delay,
  isVisible,
}: {
  tier: PricingTier;
  billingPeriod: BillingPeriod;
  delay: number;
  isVisible: boolean;
}) {
  const price = billingPeriod === "monthly" ? tier.monthlyPrice : tier.annualPrice;
  const annualSavings = ((tier.monthlyPrice - tier.annualPrice) * 12).toFixed(0);

  return (
    <div
      className={`relative transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{
        transitionDelay: isVisible ? `${delay}s` : "0s",
      }}
    >
      {/* Popular Badge */}
      {tier.badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30">
            <span className="text-xs font-bold font-mono text-white tracking-wider">
              {tier.badge}
            </span>
          </div>
        </div>
      )}

      {/* Card - Glassmorphic Style */}
      <div
        className={`relative h-full rounded-2xl border backdrop-blur-sm overflow-hidden transition-all duration-300 hover:scale-105 group ${
          tier.popular
            ? "border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 shadow-lg shadow-cyan-500/10"
            : "border-border bg-card/50 hover:border-cyan-500/20"
        }`}
      >
        {/* Hover Glow Effect */}
        {tier.popular && (
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.1), transparent 70%)",
            }}
          />
        )}

        <div className="relative p-8">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-foreground mb-1">{tier.name}</h3>
            <p className="text-sm text-muted-foreground">{tier.tagline}</p>
          </div>

          {/* Price Display - Simple Fade Transition */}
          <div className="mb-6">
            <div className="flex items-baseline gap-1 mb-2">
              <span
                key={`${tier.id}-${billingPeriod}-${price}`}
                className="text-5xl font-bold text-gradient-sync transition-opacity duration-300"
              >
                ${price}
              </span>
              <span className="text-lg text-muted-foreground font-medium">/month</span>
            </div>

            {/* Annual Savings - Gentle Reveal */}
            {billingPeriod === "annual" && (
              <div className="flex items-center gap-2 animate-fade-in">
                <svg
                  className="w-4 h-4 text-emerald-400"
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
                <span className="text-sm text-emerald-400 font-medium">
                  ${(tier.annualPrice * 12).toFixed(0)}/year • Save ${annualSavings}
                </span>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <Button
            size="lg"
            className={`w-full mb-6 transition-all duration-300 ${
              tier.popular
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
                : "border-cyan-500/30 hover:border-cyan-500 hover:bg-cyan-500/5"
            }`}
            variant={tier.popular ? "default" : "outline"}
            asChild
          >
            <WaspRouterLink to={routes.SignupRoute.to}>
              Start Free Trial
              <span className="ml-2" aria-hidden="true">
                →
              </span>
            </WaspRouterLink>
          </Button>

          {/* Features List */}
          <div className="space-y-3 pt-6 border-t border-border">
            {tier.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="shrink-0 w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center mt-0.5">
                  <svg
                    className="w-3 h-3 text-cyan-400"
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
                <span className="text-sm text-muted-foreground leading-relaxed">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
