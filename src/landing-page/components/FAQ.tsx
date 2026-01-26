/**
 * FAQ Section - Tech-Minimalist Glassmorphism
 * Smooth accordion animations with glassmorphic cards
 */

import { useState, useEffect, useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../client/components/ui/accordion";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  href?: string;
}

export default function FAQ({ faqs }: { faqs: FAQ[] }) {
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
          className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-3xl animate-pulse-slow"
          aria-hidden="true"
        />
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8">
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
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-mono text-cyan-400">Got Questions?</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about BaseSync
          </p>
        </div>

        {/* Accordion */}
        <div
          className={`transition-all duration-700 delay-100 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.id}
                value={`faq-${faq.id}`}
                className="relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-cyan-500/30 hover:bg-card/70 group"
                style={{
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                {/* Hover Glow Effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle at 0% 50%, rgba(6, 182, 212, 0.05), transparent 70%)",
                  }}
                />

                <div className="relative px-6 py-4">
                  <AccordionTrigger className="text-foreground hover:text-cyan-400 text-left text-base font-semibold leading-7 transition-colors duration-200 [&[data-state=open]]:text-cyan-400">
                    <div className="flex items-center gap-3">
                      {/* Question Icon */}
                      <div className="shrink-0 w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors duration-300">
                        <span className="text-sm font-mono text-cyan-400">
                          Q
                        </span>
                      </div>
                      <span className="flex-1">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <div className="flex flex-col items-start gap-4 pl-11 pt-2">
                      <p className="text-base leading-7">
                        {faq.answer}
                      </p>
                      {faq.href && (
                        <a
                          href={faq.href}
                          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-semibold transition-colors duration-200"
                        >
                          Learn more
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </a>
                      )}
                    </div>
                  </AccordionContent>
                </div>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Bottom CTA */}
        <div
          className={`mt-16 text-center transition-all duration-700 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <p className="text-muted-foreground mb-4">
            Still have questions?
          </p>
          <a
            href="mailto:support@basesync.example.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-cyan-500/30 bg-cyan-500/5 backdrop-blur-sm text-cyan-400 hover:border-cyan-500 hover:bg-cyan-500/10 transition-all duration-300 hover:scale-105 font-semibold"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
}
