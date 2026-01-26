# BaseSync Design System
## "Tech-Minimalist Glassmorphism"

This document defines the design language for BaseSync's landing page and all future pages. Follow these guidelines to maintain visual consistency across the entire site.

---

## 🎨 Design Philosophy

**Style Name**: **Tech-Minimalist Glassmorphism**

**Core Concept**: A refined, technical aesthetic that combines:
- Minimalist layouts with generous white space
- Glassmorphic (frosted glass) UI elements
- Cyan-blue gradient accents
- Subtle geometric patterns
- Smooth, purposeful animations

**Tone**: Professional, modern, technical, trustworthy, transparent

---

## 🌈 Color Palette

### Primary Colors
```css
--cyan-500: #06b6d4    /* Primary accent - bright cyan */
--blue-500: #3b82f6     /* Secondary accent - bright blue */
--cyan-400: #22d3ee     /* Lighter cyan for text/icons */
--blue-400: #60a5fa     /* Lighter blue */
```

### Semantic Colors
```css
--emerald-400: #34d399  /* Success states, savings */
--emerald-500: #10b981  /* Success backgrounds */
--red-400: #f87171      /* Error states */
--yellow-400: #fbbf24   /* Warning states */
```

### Neutral Colors (via Tailwind CSS Variables)
```css
--foreground: text-foreground           /* Primary text */
--muted-foreground: text-muted-foreground /* Secondary text */
--background: bg-background             /* Page background */
--card: bg-card                         /* Card backgrounds */
--border: border-border                 /* Border colors */
```

### Usage Guidelines
- **Primary actions**: Cyan-blue gradient (`from-cyan-500 to-blue-500`)
- **Accents**: Cyan-400 for icons, badges, highlights
- **Success indicators**: Emerald-400
- **Text hierarchy**: foreground → muted-foreground
- **Backgrounds**: Semi-transparent with blur effects

---

## 📐 Layout Patterns

### Section Structure
```tsx
<section className="relative py-24 md:py-32 overflow-hidden">
  {/* Background Pattern */}
  <div className="absolute inset-0 -z-10">
    {/* Grid or gradient backgrounds */}
  </div>

  <div className="max-w-7xl mx-auto px-6 lg:px-8">
    {/* Section Header */}
    <div className="text-center mb-16">
      {/* Badge + Title + Description */}
    </div>

    {/* Content */}
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* Cards or content blocks */}
    </div>
  </div>
</section>
```

### Spacing
- **Section padding**: `py-24 md:py-32`
- **Container max-width**: `max-w-7xl`
- **Container padding**: `px-6 lg:px-8`
- **Header margin**: `mb-16`
- **Grid gap**: `gap-6` to `gap-8`

---

## 🔤 Typography

### Font Stack
Uses the project's default font stack (defined in `tailwind.config.js`).

### Type Scale
```tsx
// Headings
<h1 className="text-5xl md:text-7xl font-bold">       // Hero headline
<h2 className="text-4xl md:text-5xl font-bold">       // Section titles
<h3 className="text-2xl font-bold">                   // Card titles

// Body
<p className="text-lg md:text-xl">                    // Large body (hero)
<p className="text-lg">                               // Section descriptions
<p className="text-sm">                               // Card descriptions
<span className="text-xs">                            // Labels, metadata
```

### Monospace Usage
```tsx
<span className="font-mono">Technical labels, badges, code</span>
```

**Use monospace for**:
- Badges (e.g., "Zapier can't do this")
- Technical labels (e.g., "Save 20%")
- Prices in some contexts
- Status indicators

---

## 🎭 Glassmorphism Components

### Badge Component
```tsx
<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm">
  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
  <span className="text-sm font-mono text-cyan-400">Badge Text</span>
</div>
```

### Card Component
```tsx
<div className="relative rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:scale-105">
  {/* Card content */}
</div>
```

### Popular/Highlighted Card Variant
```tsx
<div className="relative rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 backdrop-blur-sm shadow-lg shadow-cyan-500/10">
  {/* Card content */}
</div>
```

### Toggle/Switch Component
```tsx
<div className="inline-flex items-center gap-3 p-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm">
  <button className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25">
    Active Option
  </button>
  <button className="px-6 py-2.5 rounded-full text-muted-foreground hover:text-foreground">
    Inactive Option
  </button>
</div>
```

---

## 🎬 Animations & Motion

### Core Animation Philosophy
**"Soft & Refined"** - Subtle, professional animations that enhance usability without drawing excessive attention. Motion is purposeful, gentle, and respects the user's focus.

### Basic Animation Classes (in Main.css)
```css
.animate-fade-in              // Fade in with slight upward movement
.animate-fade-in-delayed      // Same but delayed 400ms
.animate-fade-in-delayed-more // Same but delayed 600ms
.animate-slide-up             // Slide up animation
.animate-pulse-slow           // Slow pulsing for gradient orbs
.animate-pulse-slower         // Even slower pulsing
```

### Gradient Animation
```tsx
<span className="text-gradient-sync">Animated Text</span>
```
Creates animated cyan-blue gradient on text.

### 💫 Pricing Section Animations

**Toggle Switch - Sliding Pill:**
```tsx
// Smooth sliding background pill
className="transition-all duration-500 ease-out"
style={{
  left: billingPeriod === "monthly" ? "0.375rem" : "calc(50%)",
}}
```
- **Duration:** 500ms
- **Easing:** ease-out (gentle deceleration)
- **Movement:** Slides smoothly from left to right (Monthly → Annual)
- **No overshoot** - clean, professional motion
- **Text transition:** 300ms color fade

**Price Number Transitions:**
```tsx
// Gentle fade using React key prop
<span
  key={`${tier.id}-${billingPeriod}-${price}`}
  className="transition-opacity duration-300"
>
  ${price}
</span>
```
- **Method:** React remounts with new key on billing change
- **Effect:** Soft cross-fade between prices
- **Duration:** 300ms
- **No complex morphing** - just clean replacement

**Savings Reveal:**
```tsx
// Fade in when switching to Annual
{billingPeriod === "annual" && (
  <div className="animate-fade-in">
    {/* Savings message */}
  </div>
)}
```
- **Animation:** Uses existing `.animate-fade-in` class
- **Duration:** 800ms with upward movement
- **Checkmark icon** for visual confirmation
- **Emerald color** for positive reinforcement

### Staggered Scroll Animations
```tsx
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

// Apply to elements
<div
  className={`transition-all duration-700 ${
    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
  }`}
  style={{
    transitionDelay: isVisible ? `${index * 0.1}s` : '0s',
  }}
>
```

### Hover States
```tsx
// Scale up
className="transition-all duration-300 hover:scale-105"

// Shadow intensification
className="shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300"

// Border glow
className="border-cyan-500/30 hover:border-cyan-500 transition-all duration-300"
```

---

## 🌟 Background Patterns

### Grid Pattern
```tsx
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
```

### Gradient Orbs
```tsx
{/* Single centered orb */}
<div
  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-3xl animate-pulse-slow"
  aria-hidden="true"
/>

{/* Multiple orbs for depth */}
<div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl animate-pulse-slow" />
<div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl animate-pulse-slower" />
```

---

## 🎯 Button Styles

### Primary Button (Gradient)
```tsx
<Button
  size="lg"
  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105"
>
  Primary Action →
</Button>
```

### Outline Button
```tsx
<Button
  size="lg"
  variant="outline"
  className="border-cyan-500/30 hover:border-cyan-500 hover:bg-cyan-500/5 transition-all duration-300"
>
  Secondary Action
</Button>
```

### Icon in Button
```tsx
<Button>
  Action Text
  <span className="ml-2" aria-hidden="true">→</span>
</Button>
```

---

## 🏷️ Badges & Pills

### Status Badge (Small Label)
```tsx
<div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30">
  <span className="text-xs font-bold font-mono text-white tracking-wider">
    MOST POPULAR
  </span>
</div>
```

### Discount Badge
```tsx
<span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-400 border border-emerald-400/30 font-mono">
  -20%
</span>
```

### Status Indicator Badge
```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
  Active
</span>
```

---

## ✅ Icons & Checkmarks

### Checkmark Icon (Features)
```tsx
<div className="shrink-0 w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center">
  <svg className="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
</div>
```

### X Icon (Problems)
```tsx
<div className="shrink-0 w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center">
  <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
  </svg>
</div>
```

---

## 📊 Component Patterns

### Feature List
```tsx
<div className="space-y-3">
  {features.map((feature, index) => (
    <div key={index} className="flex items-start gap-3">
      <div className="shrink-0 w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center mt-0.5">
        <svg className="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="text-sm text-muted-foreground leading-relaxed">
        {feature}
      </span>
    </div>
  ))}
</div>
```

### Price Display
```tsx
<div className="flex items-baseline gap-1">
  <span className="text-5xl font-bold text-gradient-sync">${price}</span>
  <span className="text-lg text-muted-foreground font-medium">/month</span>
</div>
```

### Section Header
```tsx
<div className="text-center mb-16">
  {/* Badge */}
  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm mb-6">
    <svg className="w-4 h-4 text-cyan-400">{/* icon */}</svg>
    <span className="text-sm font-mono text-cyan-400">Label</span>
  </div>

  {/* Title */}
  <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
    Section Title
  </h2>

  {/* Description */}
  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
    Section description goes here.
  </p>
</div>
```

---

## 🎨 Dark Mode Support

All colors use Tailwind's CSS variable system which automatically adapts to light/dark mode:
- `text-foreground` → Automatically inverts
- `bg-card` → Automatically adjusts
- `border-border` → Automatically adjusts

**Gradient colors remain consistent** across both modes:
- `bg-cyan-500`, `from-cyan-500`, etc. stay the same
- Semi-transparent overlays adjust nicely

---

## 📱 Responsive Design

### Breakpoints
```tsx
// Mobile-first approach
className="text-4xl md:text-5xl"        // Larger on tablet+
className="py-24 md:py-32"              // More padding on tablet+
className="grid md:grid-cols-2 lg:grid-cols-3"  // Responsive grid
className="px-6 lg:px-8"                // More padding on desktop
```

### Grid Patterns
```tsx
// 1 column mobile, 2 tablet, 3 desktop
grid md:grid-cols-2 lg:grid-cols-3 gap-6

// 1 column mobile, 2 desktop
grid lg:grid-cols-2 gap-8
```

---

## ♿ Accessibility

### Best Practices
1. **Decorative elements**: Use `aria-hidden="true"` on decorative SVGs
2. **Interactive elements**: Ensure sufficient color contrast
3. **Focus states**: Button component handles this automatically
4. **Semantic HTML**: Use proper heading hierarchy (h1, h2, h3)
5. **Alt text**: Provide for all meaningful images

### Color Contrast
- Primary text on background: WCAG AA compliant
- Cyan-400 on dark backgrounds: Sufficient contrast
- White text on cyan-500 gradient: High contrast

---

## 🚀 Implementation Checklist

When creating a new section/page:

- [ ] Use `py-24 md:py-32` for section padding
- [ ] Add grid pattern or gradient orb background
- [ ] Include section badge at the top
- [ ] Use `max-w-7xl mx-auto px-6 lg:px-8` container
- [ ] Implement Intersection Observer for scroll animations
- [ ] Add staggered delays to animated elements (0.1s increments)
- [ ] Use cyan/blue gradient for primary CTAs
- [ ] Include hover states on interactive elements
- [ ] Test in both light and dark mode
- [ ] Verify responsive behavior on mobile/tablet/desktop

---

## 📦 Component Library Reference

### Existing Components
- `Button` - `/src/client/components/ui/button`
- `Card` - `/src/client/components/ui/card`

### Custom Animations
- Defined in `/src/client/Main.css`
- `.text-gradient-sync` - Animated gradient text
- `.animate-fade-in` family - Scroll-triggered fades
- `.animate-pulse-slow` - Background orb animation

---

## 🎨 Example Sections

Reference these for implementation patterns:
1. **Hero** - `/src/landing-page/components/Hero.tsx`
2. **ProblemSection** - `/src/landing-page/components/ProblemSection.tsx`
3. **PricingSection** - `/src/landing-page/components/PricingSection.tsx`

---

## 🔑 Key Takeaways

1. **Consistency is critical** - Use these patterns across all pages
2. **Glassmorphism** - Always use `backdrop-blur-sm` with semi-transparent backgrounds
3. **Cyan-blue gradients** - Primary brand accent, use generously
4. **Smooth animations** - Stagger reveals, use Intersection Observer
5. **Monospace for tech** - Badges, labels, technical elements
6. **Grid + orbs** - Standard background pattern
7. **Rounded elements** - `rounded-2xl` for cards, `rounded-full` for badges
8. **Low-opacity borders** - Use `/20` or `/30` opacity
9. **Hover micro-interactions** - Scale, shadow, border glow
10. **Mobile-first responsive** - Test on all breakpoints

---

**Design System Version**: 1.0
**Last Updated**: 2026-01-26
**Maintained by**: BaseSync Team
