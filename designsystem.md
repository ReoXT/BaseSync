# BaseSync Design System
## DaisyUI Edition - Modern Solid Aesthetic

Last Updated: 2026-01-31

---

## Design Philosophy

BaseSync's design communicates **trust, precision, and continuous flow** using a **modern solid aesthetic**:

1. **Technical Credibility**: Monospaced fonts for technical elements, structured layouts, and data-focused visualizations
2. **Organic Motion**: Fluid animations showing data flowing and transforming naturally
3. **Solid Depth**: Clean, solid UI components with shadow and border treatments (NO glassmorphism/blur effects)
4. **B2B Professional**: Modern, trustworthy design with cyan-blue gradient accents
5. **Color Consistency**: Matches original DESIGN_SYSTEM.md color palette exactly

---

## Typography

### Primary Typefaces

**Display Font: Outfit**
- Usage: Headlines, hero text, section titles
- Weights: 600 (Semibold), 700 (Bold), 800 (Extrabold)
- Characteristics: Geometric, modern, approachable yet professional
- Why: Distinctive without being trendy; excellent readability at large sizes
- Fallback: Uses Tailwind's `font-display` class

**Body Font: Inter**
- Usage: Paragraphs, descriptions, UI text (default)
- Weights: 400 (Regular), 500 (Medium), 600 (Semibold)
- Characteristics: Clean, neutral, highly legible
- Why: Excellent for long-form reading; matches original DESIGN_SYSTEM.md intent
- Fallback: Uses Tailwind's `font-sans` class

**Monospace Font: JetBrains Mono**
- Usage: Code snippets, technical labels (IDs, record names), badges, sync status
- Weights: 400 (Regular), 500 (Medium), 700 (Bold)
- Characteristics: Developer-focused, excellent character distinction
- Why: Signals technical sophistication; used extensively in original design
- Fallback: Uses Tailwind's `font-mono` class

### Type Scale

```css
/* Display */
.text-display-lg:   font-size: 4.5rem (72px), line-height: 1.1, Outfit Bold
.text-display:      font-size: 3.5rem (56px), line-height: 1.1, Outfit Bold
.text-display-sm:   font-size: 2.75rem (44px), line-height: 1.2, Outfit Bold

/* Headings */
.text-h1:           font-size: 2.25rem (36px), line-height: 1.2, Outfit Semibold
.text-h2:           font-size: 1.875rem (30px), line-height: 1.3, Outfit Semibold
.text-h3:           font-size: 1.5rem (24px), line-height: 1.4, Outfit Semibold
.text-h4:           font-size: 1.25rem (20px), line-height: 1.4, Outfit Medium

/* Body */
.text-lead:         font-size: 1.25rem (20px), line-height: 1.6, Inter Regular
.text-body-lg:      font-size: 1.125rem (18px), line-height: 1.6, Inter Regular
.text-body:         font-size: 1rem (16px), line-height: 1.6, Inter Regular
.text-body-sm:      font-size: 0.875rem (14px), line-height: 1.5, Inter Regular

/* Technical */
.text-mono-lg:      font-size: 1rem (16px), line-height: 1.5, JetBrains Mono Regular
.text-mono:         font-size: 0.875rem (14px), line-height: 1.5, JetBrains Mono Regular
.text-mono-sm:      font-size: 0.75rem (12px), line-height: 1.4, JetBrains Mono Regular
```

---

## Color System

### DaisyUI Theme Customization

**IMPORTANT**: BaseSync uses colors from the original DESIGN_SYSTEM.md:
- Primary: `#06b6d4` (--cyan-500)
- Secondary: `#3b82f6` (--blue-500)
- Accent: `#22d3ee` (--cyan-400)
- Success: `#34d399` (--emerald-400)
- Warning: `#fbbf24` (--yellow-400)
- Error: `#f87171` (--red-400)

#### Light Theme

```js
"basesync-light": {
  // Base colors - MATCHING ORIGINAL DESIGN_SYSTEM.md
  "primary": "#06b6d4",           // --cyan-500: Primary accent
  "primary-content": "#ffffff",
  "secondary": "#3b82f6",         // --blue-500: Secondary accent
  "secondary-content": "#ffffff",
  "accent": "#22d3ee",            // --cyan-400: Lighter cyan for highlights
  "accent-content": "#0f172a",
  "neutral": "#1e293b",           // Slate 800
  "neutral-content": "#f8fafc",
  "base-100": "#ffffff",          // Background
  "base-200": "#f8fafc",          // Subtle backgrounds
  "base-300": "#e2e8f0",          // Borders
  "base-content": "#0f172a",      // Primary text

  // Semantic colors - MATCHING ORIGINAL
  "info": "#60a5fa",              // --blue-400
  "info-content": "#ffffff",
  "success": "#34d399",           // --emerald-400: Success states
  "success-content": "#064e3b",
  "warning": "#fbbf24",           // --yellow-400: Warning states
  "warning-content": "#78350f",
  "error": "#f87171",             // --red-400: Error states
  "error-content": "#7f1d1d",
}
```

#### Dark Theme

```js
"basesync-dark": {
  // Base colors - MATCHING ORIGINAL (colors stay bright in dark)
  "primary": "#06b6d4",           // --cyan-500
  "primary-content": "#0c4a6e",
  "secondary": "#3b82f6",         // --blue-500
  "secondary-content": "#1e3a8a",
  "accent": "#22d3ee",            // --cyan-400
  "accent-content": "#0c4a6e",
  "neutral": "#cbd5e1",           // Slate 300
  "neutral-content": "#0f172a",
  "base-100": "#0f172a",          // Dark background
  "base-200": "#1e293b",          // Slate 800
  "base-300": "#334155",          // Slate 700
  "base-content": "#f1f5f9",      // Light text

  // Semantic colors - MATCHING ORIGINAL
  "info": "#60a5fa",              // --blue-400
  "info-content": "#0c4a6e",
  "success": "#34d399",           // --emerald-400
  "success-content": "#064e3b",
  "warning": "#fbbf24",           // --yellow-400
  "warning-content": "#78350f",
  "error": "#f87171",             // --red-400
  "error-content": "#7f1d1d",
}
```

### Extended Brand Colors

```css
/* Gradients */
--gradient-primary: linear-gradient(135deg, #0891b2 0%, #3b82f6 100%)
--gradient-primary-soft: linear-gradient(135deg, #06b6d4 0%, #60a5fa 50%, #06b6d4 100%)
--gradient-accent: linear-gradient(135deg, #10b981 0%, #06b6d4 100%)
--gradient-glow: radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%)

/* Data Flow Colors */
--flow-airtable: #fbbf24        /* Amber 400 - Airtable brand-adjacent */
--flow-sheets: #34d399          /* Emerald 400 - Google Sheets brand-adjacent */
--flow-sync: #06b6d4            /* Cyan 500 - BaseSync brand */

/* State Colors */
--state-syncing: #06b6d4
--state-success: #10b981
--state-error: #ef4444
--state-pending: #f59e0b
--state-idle: #64748b
```

---

## Spacing & Layout

### Spacing Scale (Tailwind + Custom)

```css
/* Extra spacing for hero sections */
--space-hero-y: 7rem            /* py-28 */
--space-section-y: 5rem         /* py-20 */
--space-section-gap: 3rem       /* gap-12 */
--space-container-x: 1.5rem     /* px-6 lg:px-8 */
```

### Container Widths

```css
.container-prose:   max-width: 65ch (comfortable reading)
.container-content: max-width: 1280px (main content)
.container-wide:    max-width: 1536px (2xl, hero sections)
```

### Grid Systems

**Hero Grid**: 12-column grid with asymmetric layouts for visual interest
**Content Grid**: Standard 12-column, responsive breakpoints at sm/md/lg/xl/2xl

---

## Components

### Buttons (DaisyUI)

```html
<!-- Primary CTA -->
<button class="btn btn-primary btn-lg gap-2 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300">
  <span>Start Free Trial</span>
  <span aria-hidden="true">→</span>
</button>

<!-- Secondary CTA -->
<button class="btn btn-outline btn-lg gap-2 border-primary/30 hover:border-primary hover:bg-primary/5">
  See How It Works
</button>

<!-- Ghost Button -->
<button class="btn btn-ghost">
  Learn More
</button>

<!-- Icon Button -->
<button class="btn btn-circle btn-sm btn-ghost">
  <svg class="w-5 h-5">...</svg>
</button>
```

### Cards (DaisyUI) - SOLID STYLE

**IMPORTANT**: NO glassmorphism (backdrop-blur) - use solid backgrounds only

```html
<!-- Standard Card - SOLID -->
<div class="card bg-base-100 border border-base-300 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Card Title</h2>
    <p>Content here</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary">Action</button>
    </div>
  </div>
</div>

<!-- Highlighted Card (Primary) - SOLID -->
<div class="card bg-base-100 border border-primary/30 shadow-xl hover:border-primary/50 hover:shadow-2xl transition-all duration-500">
  <div class="card-body">
    <!-- Hover glow effect (optional) -->
    <div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

    <!-- Content -->
  </div>
</div>

<!-- Hover Effect Card - SOLID -->
<div class="card bg-base-100 border border-base-300 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-primary/40">
  <!-- Content -->
</div>
```

### Badges (DaisyUI)

```html
<!-- Status Badge -->
<div class="badge badge-primary badge-lg gap-2">
  <div class="w-2 h-2 rounded-full bg-primary-content animate-pulse"></div>
  <span class="font-mono">Syncing</span>
</div>

<!-- Outline Badge -->
<div class="badge badge-outline badge-accent">
  <span class="font-mono text-xs">Readable Names ✓</span>
</div>

<!-- Info Badge -->
<div class="badge badge-info badge-sm">
  <span class="font-mono">NEW</span>
</div>
```

### Alerts (DaisyUI)

```html
<!-- Success -->
<div class="alert alert-success shadow-lg">
  <svg class="w-6 h-6 shrink-0">...</svg>
  <span>Sync completed successfully!</span>
</div>

<!-- Error -->
<div class="alert alert-error shadow-lg">
  <svg class="w-6 h-6 shrink-0">...</svg>
  <div>
    <h3 class="font-bold">Sync failed</h3>
    <div class="text-sm">Error details here</div>
  </div>
</div>

<!-- Info with Action -->
<div class="alert alert-info shadow-lg">
  <span>New update available</span>
  <div>
    <button class="btn btn-sm btn-ghost">Dismiss</button>
    <button class="btn btn-sm btn-primary">Update</button>
  </div>
</div>
```

---

## Motion & Animation

### Principles

1. **Purposeful**: Every animation serves a function (guide attention, provide feedback, show state)
2. **Subtle**: Animations enhance, they don't distract
3. **Consistent**: Same durations and easings for similar actions
4. **Performant**: Prefer CSS transforms and opacity over layout changes

### Timing Functions

```css
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1)          /* Tailwind default */
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1)     /* Playful bounce */
--ease-flow: cubic-bezier(0.45, 0, 0.55, 1)          /* Natural flow */
--ease-swift: cubic-bezier(0.4, 0, 0.1, 1)           /* Fast entry */
```

### Durations

```css
--duration-instant: 150ms       /* Hover states, toggles */
--duration-quick: 300ms         /* Button clicks, small UI changes */
--duration-medium: 500ms        /* Card reveals, modals */
--duration-slow: 800ms          /* Page transitions, hero animations */
--duration-flow: 2000ms         /* Data flow particles */
```

### Key Animations

```css
/* Fade In Up - Entry animation for hero content */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale In - Cards and modals */
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Data Flow - Particles traveling between platforms */
@keyframes flow-forward {
  0% {
    transform: translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateX(400px);
    opacity: 0;
  }
}

/* Pulse Glow - Sync status indicator */
@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

/* Gradient Shift - Animated text gradients */
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

### Stagger Delays

```css
/* Hero elements */
.stagger-1 { animation-delay: 0ms; }
.stagger-2 { animation-delay: 100ms; }
.stagger-3 { animation-delay: 200ms; }
.stagger-4 { animation-delay: 300ms; }
.stagger-5 { animation-delay: 400ms; }
```

---

## Effects & Visual Details

### Backgrounds

```css
/* Grid Pattern - Subtle technical feel */
.bg-grid-pattern {
  background-image:
    linear-gradient(to right, currentColor 1px, transparent 1px),
    linear-gradient(to bottom, currentColor 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.03; /* light mode */
  opacity: 0.05; /* dark mode */
}

/* Noise Texture - Adds grain for depth */
.bg-noise {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E");
}

/* Gradient Mesh - Hero backgrounds */
.bg-gradient-mesh {
  background:
    radial-gradient(at 0% 0%, rgba(6, 182, 212, 0.1) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.1) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.1) 0px, transparent 50%),
    radial-gradient(at 0% 100%, rgba(6, 182, 212, 0.05) 0px, transparent 50%);
}
```

### Shadows

```css
/* Elevation System */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25)

/* Colored Shadows - Brand emphasis */
--shadow-primary: 0 10px 30px -5px rgb(6 182 212 / 0.3)
--shadow-accent: 0 10px 30px -5px rgb(16 185 129 / 0.3)
--shadow-glow: 0 0 40px rgb(6 182 212 / 0.2)
```

### Solid Cards (NO Glassmorphism)

**CRITICAL**: Do NOT use `backdrop-blur` or transparent backgrounds for cards.

```css
/* Correct - Solid card style */
.solid-card {
  background: oklch(var(--b1));  /* DaisyUI base-100 */
  border: 1px solid oklch(var(--b3));  /* DaisyUI base-300 */
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

/* Correct - Highlighted solid card */
.solid-card-highlighted {
  background: oklch(var(--b1));
  border: 1px solid oklch(var(--p) / 0.3);  /* Primary with opacity */
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}

/* WRONG - Do NOT use this */
.glass-card-wrong {
  background: rgba(255, 255, 255, 0.8);  /* ❌ NO */
  backdrop-filter: blur(12px);           /* ❌ NO */
}
```

---

## Iconography

### Icon System

**Primary**: Lucide React (already in project)
- Consistent stroke width: 2px
- Sizes: 16px (sm), 20px (md), 24px (lg), 32px (xl)
- Style: Outline icons for consistency

**Usage Guidelines**:
- Use icons to support text, not replace it
- Maintain consistent sizing within sections
- Apply brand colors sparingly (primary actions only)
- Ensure sufficient contrast for accessibility

---

## Accessibility

### WCAG 2.1 Level AA Compliance

**Color Contrast**:
- Normal text: minimum 4.5:1
- Large text (24px+): minimum 3:1
- Interactive elements: minimum 3:1

**Focus States**:
```css
.focus-visible:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  border-radius: 4px;
}
```

**Motion**:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Responsive Design

### Breakpoints (Tailwind)

```css
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

### Mobile-First Approach

1. Design for mobile (375px) first
2. Enhance for tablet (768px)
3. Optimize for desktop (1280px+)

### Key Responsive Patterns

**Typography**: Fluid scaling
```css
font-size: clamp(2rem, 5vw, 4rem)
```

**Spacing**: Proportional reduction
```css
padding: clamp(2rem, 5vw, 5rem) clamp(1rem, 3vw, 2rem)
```

**Grid**: Column reduction
```css
grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr))
```

---

## Implementation Notes

### DaisyUI Component Usage

1. **Always use semantic color classes**: `btn-primary`, `alert-success`, etc.
2. **Leverage DaisyUI utilities**: `card`, `badge`, `alert`, `modal`
3. **Customize via Tailwind config**: Don't override DaisyUI's CSS directly
4. **Theme switching**: Use `data-theme="basesync-light"` or `data-theme="basesync-dark"`

### Font Loading Strategy

```html
<!-- In document head -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

### Performance Considerations

1. **Lazy load animations**: Only animate elements in viewport
2. **Optimize images**: Use WebP with fallbacks
3. **Minimize repaints**: Prefer `transform` and `opacity` changes
4. **Tree-shake unused DaisyUI components**: Configure in `tailwind.config.js`

---

## File Structure

```
src/
├── client/
│   ├── Main.css                    # Global styles, animations
│   ├── components/
│   │   ├── ui/                     # DaisyUI-based components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── ...
│   │   └── ...
│   └── ...
├── landing-page/
│   ├── components/
│   │   ├── Hero.tsx                # Main hero section
│   │   ├── Features.tsx
│   │   └── ...
│   └── LandingPage.tsx
└── ...
```

---

## Version History

- **v1.0 (2026-01-31)**: Initial DaisyUI-based design system
  - Migrated from ShadCN to DaisyUI
  - Established "Technical Precision with Organic Flow" aesthetic
  - Defined typography (Outfit + Inter + JetBrains Mono)
  - Created custom DaisyUI themes (basesync-light, basesync-dark)
  - Documented component patterns and animations
