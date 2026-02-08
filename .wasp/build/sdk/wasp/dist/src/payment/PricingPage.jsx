/**
 * BaseSync Pricing Page - Tech-Minimalist Glassmorphism
 * Full-page pricing experience with grid background, smooth animations
 * Reuses components from landing page for consistency
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "wasp/client/auth";
import { generateCheckoutSession, getCustomerPortalUrl, } from "wasp/client/operations";
import { Button } from "../client/components/ui/button";
import { PaymentPlanId, SubscriptionStatus } from "./plans";
const tiers = [
    {
        id: PaymentPlanId.Starter,
        name: "Starter",
        tagline: "For individuals",
        monthlyPrice: 9.99,
        annualPrice: 7.99,
        features: [
            "1 sync configuration",
            "1,000 records per sync",
            "15-minute sync interval",
            "Basic conflict resolution",
            "Email support",
        ],
    },
    {
        id: PaymentPlanId.Pro,
        name: "Pro",
        tagline: "For power users",
        monthlyPrice: 19.99,
        annualPrice: 15.99,
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
        id: PaymentPlanId.Business,
        name: "Business",
        tagline: "For growing teams",
        monthlyPrice: 39.99,
        annualPrice: 31.99,
        features: [
            "10 sync configurations",
            "Unlimited records",
            "5-minute sync interval",
            "Configurable conflict resolution",
            "Priority support + Slack",
        ],
    },
];
export default function PricingPage() {
    const [billingPeriod, setBillingPeriod] = useState("monthly");
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);
    const { data: user } = useAuth();
    const isUserSubscribed = !!user &&
        !!user.subscriptionStatus &&
        user.subscriptionStatus !== SubscriptionStatus.Deleted;
    // Removed pre-fetching of customer portal URL - now fetched on-demand with return URL
    const navigate = useNavigate();
    // Fade in animation on mount
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);
    async function handleBuyNowClick(basePlanId, currentBillingPeriod) {
        if (!user) {
            navigate("/login");
            return;
        }
        try {
            setIsPaymentLoading(true);
            setErrorMessage(null);
            // Map base plan ID to correct plan ID based on billing period
            const planId = getPlanIdForBillingPeriod(basePlanId, currentBillingPeriod);
            // Pass current page URL as return URL
            const checkoutResults = await generateCheckoutSession({
                paymentPlanId: planId,
                returnUrl: window.location.pathname,
            });
            if (checkoutResults?.sessionUrl) {
                window.open(checkoutResults.sessionUrl, "_self");
            }
            else {
                throw new Error("Error generating checkout session URL");
            }
        }
        catch (error) {
            console.error(error);
            if (error instanceof Error) {
                setErrorMessage(error.message);
            }
            else {
                setErrorMessage("Error processing payment. Please try again later.");
            }
            setIsPaymentLoading(false);
        }
    }
    // Helper function to get the correct plan ID based on billing period
    function getPlanIdForBillingPeriod(basePlanId, period) {
        if (period === "annual") {
            switch (basePlanId) {
                case PaymentPlanId.Starter:
                    return PaymentPlanId.StarterAnnual;
                case PaymentPlanId.Pro:
                    return PaymentPlanId.ProAnnual;
                case PaymentPlanId.Business:
                    return PaymentPlanId.BusinessAnnual;
                default:
                    return basePlanId;
            }
        }
        return basePlanId;
    }
    const handleCustomerPortalClick = async () => {
        if (!user) {
            navigate("/login");
            return;
        }
        try {
            setIsPaymentLoading(true);
            setErrorMessage(null);
            // Fetch portal URL with current page as return URL
            const portalUrl = await getCustomerPortalUrl({
                returnUrl: window.location.pathname,
            });
            if (!portalUrl) {
                setErrorMessage(`Customer Portal does not exist for user ${user.id}`);
                return;
            }
            window.open(portalUrl, "_blank");
        }
        catch (error) {
            console.error(error);
            if (error instanceof Error) {
                setErrorMessage(error.message);
            }
            else {
                setErrorMessage("Error fetching Customer Portal URL");
            }
        }
        finally {
            setIsPaymentLoading(false);
        }
    };
    return (<div className="relative min-h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Animated Grid Background - Matching Landing Page */}
      <AnimatedGridBackground />

      {/* Main Content */}
      <section ref={sectionRef} className="relative z-10 pt-12 pb-20 md:pt-16 md:pb-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>

            {/* Badge - Matching Hero Style */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm mb-6">
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span className="text-sm font-mono text-cyan-400">
                Simple, Transparent Pricing
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Choose Your{" "}
              <span className="text-gradient-sync">Perfect Plan</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Start with a 14-day free trial. No credit card required.
              <br />
              <span className="text-cyan-400 font-semibold">
                Upgrade, downgrade, or cancel anytime.
              </span>
            </p>

            {/* Billing Toggle */}
            <BillingToggle billingPeriod={billingPeriod} onChange={setBillingPeriod}/>
          </div>

          {/* Error Message */}
          {errorMessage && (<div className={`max-w-2xl mx-auto mb-8 p-4 rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm transition-all duration-300 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-sm text-red-200">{errorMessage}</p>
                <button onClick={() => setErrorMessage(null)} className="ml-auto text-red-400 hover:text-red-300 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>)}

          {/* Pricing Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16 items-center">
            {tiers.map((tier, index) => (<PricingCard key={tier.id} tier={tier} billingPeriod={billingPeriod} delay={index * 0.1} isVisible={isVisible} isLoading={isPaymentLoading} isUserSubscribed={isUserSubscribed} isCustomerPortalLoading={isPaymentLoading} onBuyClick={() => handleBuyNowClick(tier.id, billingPeriod)} onManageClick={handleCustomerPortalClick} hasUser={!!user}/>))}
          </div>

          {/* Trust Signals */}
          <TrustSignals isVisible={isVisible}/>

          {/* FAQ Teaser */}
          <FAQTeaser isVisible={isVisible}/>
        </div>
      </section>
    </div>);
}
// Billing Toggle - Reused from Landing Page
function BillingToggle({ billingPeriod, onChange, }) {
    const monthlyRef = useRef(null);
    const annualRef = useRef(null);
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
    return (<div className="relative inline-flex items-center p-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm">
      {/* Sliding background pill */}
      <div className="absolute top-1.5 h-[calc(100%-0.75rem)] rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/25 transition-all duration-500 ease-out" style={{
            left: `${pillStyle.left}px`,
            width: `${pillStyle.width}px`,
        }}/>

      {/* Monthly button */}
      <button ref={monthlyRef} onClick={() => onChange("monthly")} className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${billingPeriod === "monthly"
            ? "text-white"
            : "text-muted-foreground hover:text-foreground"}`}>
        Monthly
      </button>

      {/* Annual button */}
      <button ref={annualRef} onClick={() => onChange("annual")} className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${billingPeriod === "annual"
            ? "text-white"
            : "text-muted-foreground hover:text-foreground"}`}>
        Annual
        <span className={`text-xs px-2 py-0.5 rounded-full border font-mono transition-all duration-300 ${billingPeriod === "annual"
            ? "bg-white/20 text-white border-white/30"
            : "bg-emerald-400/20 text-emerald-400 border-emerald-400/30"}`}>
          -20%
        </span>
      </button>
    </div>);
}
// Pricing Card Component - Enhanced from Landing Page
function PricingCard({ tier, billingPeriod, delay, isVisible, isLoading, isUserSubscribed, isCustomerPortalLoading, onBuyClick, onManageClick, hasUser, }) {
    const price = billingPeriod === "monthly" ? tier.monthlyPrice : tier.annualPrice;
    const annualSavings = ((tier.monthlyPrice - tier.annualPrice) * 12).toFixed(0);
    return (<div className={`relative transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${tier.popular ? "md:scale-105 lg:scale-110 pt-6" : ""}`} style={{
            transitionDelay: isVisible ? `${delay}s` : "0s",
        }}>
      {/* Card - Glassmorphic Style (with badge inside) */}
      <div className={`relative h-full rounded-2xl border backdrop-blur-sm overflow-visible transition-all duration-300 hover:scale-[1.02] group ${tier.popular
            ? "border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 shadow-xl shadow-cyan-500/20"
            : "border-border bg-card/50 hover:border-cyan-500/20"}`}>
        {/* Popular Badge - Now inside the card */}
        {tier.badge && (<div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
            <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30">
              <span className="text-xs font-bold font-mono text-white tracking-wider">
                {tier.badge}
              </span>
            </div>
          </div>)}

        {/* Hover Glow Effect */}
        {tier.popular && (<div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{
                background: "radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.1), transparent 70%)",
            }}/>)}

        <div className="relative p-8">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-foreground mb-1">
              {tier.name}
            </h3>
            <p className="text-sm text-muted-foreground">{tier.tagline}</p>
          </div>

          {/* Price Display */}
          <div className="mb-6">
            <div className="flex items-baseline gap-1 mb-2">
              <span key={`${tier.id}-${billingPeriod}-${price}`} className="text-5xl font-bold text-gradient-sync transition-opacity duration-300">
                ${price}
              </span>
              <span className="text-lg text-muted-foreground font-medium">
                /month
              </span>
            </div>

            {/* Annual Savings */}
            {billingPeriod === "annual" && (<div className="flex items-center gap-2 animate-fade-in">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                </svg>
                <span className="text-sm text-emerald-400 font-medium">
                  ${(tier.annualPrice * 12).toFixed(0)}/year • Save $
                  {annualSavings}
                </span>
              </div>)}
          </div>

          {/* CTA Button */}
          {isUserSubscribed ? (<Button onClick={onManageClick} disabled={isCustomerPortalLoading} size="lg" className={`w-full mb-6 transition-all duration-300 ${tier.popular
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
                : "border-cyan-500/30 hover:border-cyan-500 hover:bg-cyan-500/5"}`} variant={tier.popular ? "default" : "outline"}>
              {isCustomerPortalLoading ? (<span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Loading...
                </span>) : ("Manage Subscription")}
            </Button>) : (<Button onClick={onBuyClick} disabled={isLoading} size="lg" className={`w-full mb-6 transition-all duration-300 ${tier.popular
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
                : "border-cyan-500/30 hover:border-cyan-500 hover:bg-cyan-500/5"}`} variant={tier.popular ? "default" : "outline"}>
              {isLoading ? (<span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Processing...
                </span>) : (<>
                  {hasUser ? "Start Free Trial" : "Log in to Start Trial"}
                  <span className="ml-2" aria-hidden="true">
                    →
                  </span>
                </>)}
            </Button>)}

          {/* Features List */}
          <div className="space-y-3 pt-6 border-t border-border">
            {tier.features.map((feature, index) => (<div key={index} className="flex items-start gap-3">
                <div className="shrink-0 w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <span className="text-sm text-muted-foreground leading-relaxed">
                  {feature}
                </span>
              </div>))}
          </div>
        </div>
      </div>
    </div>);
}
// Trust Signals Section
function TrustSignals({ isVisible }) {
    return (<div className={`text-center transition-all duration-700 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      <div className="flex flex-wrap items-center justify-center gap-8 max-w-4xl mx-auto">
        {/* Trial */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-foreground">
              14-Day Free Trial
            </div>
            <div className="text-xs text-muted-foreground">
              No credit card required
            </div>
          </div>
        </div>

        {/* Cancel Anytime */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-foreground">
              Cancel Anytime
            </div>
            <div className="text-xs text-muted-foreground">
              No long-term contracts
            </div>
          </div>
        </div>

        {/* Secure */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-foreground">
              Secure Payments
            </div>
            <div className="text-xs text-muted-foreground">
              Powered by Stripe
            </div>
          </div>
        </div>
      </div>
    </div>);
}
// FAQ Teaser Section
function FAQTeaser({ isVisible, }) {
    const faqs = [
        {
            q: "How is this different from Zapier?",
            a: "Zapier can only do one-way sync and doesn't handle linked records properly. BaseSync offers true bidirectional sync with smart conflict resolution.",
        },
        {
            q: "Can I change plans anytime?",
            a: "Yes! Upgrade instantly, downgrade at the end of your billing cycle. No penalties.",
        },
        {
            q: "What happens after my trial ends?",
            a: "Your syncs will pause but your data stays safe. Subscribe to reactivate anytime.",
        },
    ];
    return (<div className={`mt-20 max-w-4xl mx-auto transition-all duration-700 delay-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Common Questions
        </h2>
        <p className="text-muted-foreground">
          Quick answers to help you decide
        </p>
      </div>

      {/* FAQ Cards */}
      <div className="space-y-4">
        {faqs.map((faq, index) => (<div key={index} className="p-6 rounded-xl border border-border bg-card/30 backdrop-blur-sm hover:border-cyan-500/30 transition-all duration-300">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {faq.q}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {faq.a}
            </p>
          </div>))}
      </div>

      {/* View All FAQs Link */}
      <div className="text-center mt-8">
        <a href="/#faq" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors duration-300 group">
          <span className="text-sm font-semibold">View all FAQs</span>
          <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
    </div>);
}
// Animated Grid Background - Matching Landing Page Hero
function AnimatedGridBackground() {
    return (<div className="absolute inset-0 z-0 pointer-events-none">
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025]" style={{
            backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
            backgroundSize: '60px 60px',
            maskImage: `
            radial-gradient(ellipse 120% 120% at 50% 50%, black 20%, rgba(0,0,0,0.5) 50%, transparent 80%)
          `,
            WebkitMaskImage: `
            radial-gradient(ellipse 120% 120% at 50% 50%, black 20%, rgba(0,0,0,0.5) 50%, transparent 80%)
          `,
        }}/>

      {/* Gradient Orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl animate-pulse-slow" aria-hidden="true"/>
      <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl animate-pulse-slower" aria-hidden="true"/>
    </div>);
}
//# sourceMappingURL=PricingPage.jsx.map