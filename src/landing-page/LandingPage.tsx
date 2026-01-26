import FAQ from "./components/FAQ";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import ProblemSection from "./components/ProblemSection";
import PricingSection from "./components/PricingSection";
import SocialProofSection from "./components/SocialProofSection";
import {
  faqs,
  footerNavigation,
} from "./contentSections";

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      <main className="isolate">
        <Hero />
        <ProblemSection />
        <PricingSection />
        <SocialProofSection />
        <FAQ faqs={faqs} />
      </main>
      <Footer footerNavigation={footerNavigation} />
    </div>
  );
}
