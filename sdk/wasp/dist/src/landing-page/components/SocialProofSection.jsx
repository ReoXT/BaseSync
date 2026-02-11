/**
 * Social Proof Section - Tech-Minimalist Glassmorphism
 * "Trusted by Operations Teams" with logos, stats, and testimonials
 */
import { useState, useEffect, useRef } from "react";
export default function SocialProofSection() {
    const sectionRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
            }
        }, { threshold: 0.1, rootMargin: "-50px" });
        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }
        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
    }, []);
    return (<section ref={sectionRef} className="relative pt-8 pb-24 md:pt-12 md:pb-32 overflow-hidden">
      {/* Background Pattern - Matching Other Sections */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
        }}/>
        {/* Gradient Orb */}
        <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-3xl animate-pulse-slower" aria-hidden="true"/>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm mb-6">
            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
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
        <div className={`grid md:grid-cols-3 gap-8 mb-16 transition-all duration-700 delay-100 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <StatCard number="1M+" label="Records Synced" icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
              </svg>}/>
          <StatCard number="10K+" label="Hours Saved Weekly" icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>}/>
          <StatCard number="99.9%" label="Sync Success Rate" icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>}/>
        </div>

        {/* Customer Logos */}
        {/* <div
          className={`mb-16 transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12 max-w-6xl mx-auto items-center">
            <CompanyLogo name="Notion" />
            <CompanyLogo name="Monday" />
            <CompanyLogo name="HubSpot" />
            <CompanyLogo name="Salesforce" />
            <CompanyLogo name="McKinsey" />
            <CompanyLogo name="Stripe" />
          </div>
        </div> */}

        {/* Testimonial Cards */}
        <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-700 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <TestimonialCard quote="We were spending 6+ hours weekly copying data between Airtable and Sheets. BaseSync cut that to zero. Best $19/month we've ever spent." author="Marcus Chen" role="Operations Manager" company="Bonsai" avatar="/marcus-chen.jpg" delay={0} isVisible={isVisible}/>
          <TestimonialCard quote="Finally, linked records show actual names instead of 'rec123abc' IDs. Our executives can now read dashboards without constantly asking 'what does this mean?'" author="Rachel Patel" role="Product Operations Lead" company="Close CRM" avatar="/rachel-patel.jpg" delay={0.1} isVisible={isVisible}/>
          <TestimonialCard quote="Bidirectional sync was a game changer. Sales updates Sheets, ops works in Airtable, everything stays in sync. No more 'which version is correct?' messages." author="David Kim" role="Revenue Operations Analyst" company="Canny" avatar="/david-kim.jpg" avatarPosition="left" delay={0.2} isVisible={isVisible} featured/>
        </div>
      </div>
    </section>);
}
// Stat Card Component
function StatCard({ number, label, icon, }) {
    return (<div className="relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-8 text-center transition-all duration-300 hover:scale-105 hover:border-cyan-500/30 group">
      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{
            background: "radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.05), transparent 70%)",
        }}/>

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
    </div>);
}
// Company Logo Component with Official SVGs
function CompanyLogo({ name }) {
    const logos = {
        Notion: (<svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
        <path d="M24.588 12.134c1.678-1.14 3.356-.38 3.356 1.899v60.153c0 2.66-.759 3.42-3.166 4.179l-7.713 2.278c-1.678.76-3.166.38-3.166-1.14V20.606c0-1.52.76-2.66 2.088-3.42l8.6-5.052zm27.78 2.66c1.11 1.9.76 4.18-.76 5.699L27.562 47.588v38.824c0 1.52-1.109 2.279-2.218 1.9l-8.852-3.04c-1.109-.38-1.868-1.52-1.868-2.66V20.606c0-1.52.76-2.66 2.088-3.42L40.758 3.523c2.218-1.52 4.437-1.14 5.926.76l5.734 10.511zm26.103.76c1.109-.76 2.218-.38 2.218 1.14v58.255c0 1.52-.76 2.659-2.218 2.659h-8.852c-1.109 0-2.218-1.14-2.218-2.659V16.694c0-1.52 1.109-1.9 2.218-1.14l8.852 0z"/>
      </svg>),
        Monday: (<svg viewBox="0 0 155 35" fill="currentColor" className="w-full h-full">
        <path d="M46.3 14.8c-1.2 0-2.1.9-2.1 2.1v15.8c0 1.2.9 2.1 2.1 2.1s2.1-.9 2.1-2.1V16.9c0-1.2-.9-2.1-2.1-2.1zm-8.8-6.2c-1.2 0-2.1.9-2.1 2.1v21.9c0 1.2.9 2.1 2.1 2.1s2.1-.9 2.1-2.1V10.7c0-1.2-.9-2.1-2.1-2.1zm-8.8 3.1c-1.2 0-2.1.9-2.1 2.1v18.8c0 1.2.9 2.1 2.1 2.1s2.1-.9 2.1-2.1V13.8c0-1.2-.9-2.1-2.1-2.1z"/>
      </svg>),
        HubSpot: (<svg viewBox="0 0 100 28" fill="currentColor" className="w-full h-full">
        <path d="M58.5 6.9v5.7h-3.6V6.9h-2.7V4.4h8.9v2.5h-2.6zm10.8 5.7V4.4h-2.6v8.2h-2.6V4.4h-2.6v10.1c0 .9.7 1.6 1.6 1.6h6.2V12.6zm4.4-8.2v8.2h2.6V4.4h-2.6z"/>
        <circle cx="13" cy="13.5" r="4.5"/>
        <path d="M23 18.5v-2.2c.9-.6 1.5-1.7 1.5-2.9 0-1.9-1.5-3.4-3.4-3.4s-3.4 1.5-3.4 3.4c0 1.2.6 2.3 1.5 2.9v2.2c-3.1.5-5.5 3.1-5.5 6.3v.7h14.8v-.7c0-3.2-2.4-5.8-5.5-6.3zm-10-4.8L7.5 8.2c-.3-.3-.8-.3-1.1 0L.8 13.7c-.3.3-.3.8 0 1.1l5.6 5.5c.3.3.8.3 1.1 0l5.6-5.5c.2-.3.2-.8-.1-1.1z"/>
      </svg>),
        Salesforce: (<svg viewBox="0 0 100 72" fill="currentColor" className="w-full h-full">
        <path d="M25.2 29.9c1.2-4.5 5.2-7.8 10-7.8 3.1 0 5.9 1.4 7.8 3.6 2.2-1.4 4.8-2.2 7.6-2.2 7.9 0 14.3 6.4 14.3 14.3 0 1.2-.1 2.3-.4 3.4 3 1.8 5 5.1 5 8.9 0 5.7-4.6 10.3-10.3 10.3H24.8C16.8 60.4 10 53.6 10 45.6c0-6.8 4.7-12.5 11-14.1.7-.2 1.4-.3 2.2-.3 1.2 0 2.4.2 3.5.6-.3-.6-.5-1.3-.5-2z"/>
      </svg>),
        McKinsey: (<svg viewBox="0 0 200 40" fill="currentColor" className="w-full h-full">
        <path d="M7 8h6l8 14 8-14h6v24h-5V16l-7 12h-4l-7-12v16H7V8zm34 0h5v24h-5V8zm22 0h5v19h11v5H63V8zm20 0h5v19h11v5H83V8zm28 0h14v5h-9v6h8v5h-8v8h-5V8zm25 0h5v19h11v5h-16V8zm27 14.5c0-5.8 4.2-10.5 10-10.5s10 4.7 10 10.5-4.2 10.5-10 10.5-10-4.7-10-10.5zm5 0c0 3.3 2.2 6 5 6s5-2.7 5-6-2.2-6-5-6-5 2.7-5 6z"/>
      </svg>),
        Stripe: (<svg viewBox="0 0 60 25" fill="currentColor" className="w-full h-full">
        <path fillRule="evenodd" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 0 0-4.1-1.06c-.86 0-1.44.25-1.44.9 0 1.85 6.29.97 6.29 5.88z"/>
      </svg>),
    };
    return (<div className="relative group flex items-center justify-center h-20">
      {/* Logo Container */}
      <div className="relative w-full h-full flex items-center justify-center px-4 transition-all duration-500">
        {/* Logo SVG - Grayscale by default, color on hover */}
        <div className="w-full h-full max-w-[120px] text-muted-foreground/40 group-hover:text-cyan-400 transition-all duration-500 ease-out group-hover:scale-110">
          {logos[name]}
        </div>

        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-xl" style={{
            background: "radial-gradient(circle at center, rgba(6, 182, 212, 0.15), transparent 70%)",
        }}/>
      </div>
    </div>);
}
// Testimonial Card Component
function TestimonialCard({ quote, author, role, company, avatar, avatarPosition = "center", delay, isVisible, featured = false, }) {
    return (<div className={`relative transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{
            transitionDelay: isVisible ? `${delay}s` : "0s",
        }}>
      {/* Featured Badge */}
      {featured && (<div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30">
            <span className="text-xs font-bold font-mono text-white tracking-wider">
              FEATURED
            </span>
          </div>
        </div>)}

      {/* Card */}
      <div className={`relative h-full rounded-2xl border backdrop-blur-sm overflow-hidden transition-all duration-300 hover:scale-105 group ${featured
            ? "border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 shadow-lg shadow-cyan-500/10"
            : "border-border bg-card/50 hover:border-cyan-500/20"}`}>
        {/* Hover Glow Effect */}
        {featured && (<div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{
                background: "radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.1), transparent 70%)",
            }}/>)}

        <div className="relative p-8">
          {/* Quote Icon */}
          <div className="mb-4">
            <svg className="w-10 h-10 text-cyan-400/30" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
            </svg>
          </div>

          {/* Quote */}
          <blockquote className="text-sm text-muted-foreground leading-relaxed mb-6 italic">
            "{quote}"
          </blockquote>

          {/* Author */}
          <div className="flex items-center gap-4 pt-4 border-t border-border">
            {/* Avatar */}
            {avatar ? (<img src={avatar} alt={author} className="shrink-0 w-12 h-12 rounded-full object-cover border border-cyan-500/20" style={{
                objectPosition: avatarPosition === "left" ? "60% center" : "center"
            }}/>) : (<div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center">
                <span className="text-lg font-bold text-cyan-400">
                  {author.charAt(0)}
                </span>
              </div>)}

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
    </div>);
}
//# sourceMappingURL=SocialProofSection.jsx.map