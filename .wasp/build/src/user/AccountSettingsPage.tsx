import { useState } from 'react';
import { cn } from '../client/utils';
import { UserIcon, Lock, CreditCard, AlertTriangle } from 'lucide-react';
import ProfileSection from './settings/ProfileSection';
import SecuritySection from './settings/SecuritySection';
import SubscriptionSection from './settings/SubscriptionSection';
import DangerZoneSection from './settings/DangerZoneSection';

type Section = 'profile' | 'security' | 'subscription' | 'danger';

const SECTIONS = [
  {
    id: 'profile' as Section,
    label: 'Profile',
    icon: UserIcon,
    component: ProfileSection,
  },
  {
    id: 'security' as Section,
    label: 'Security',
    icon: Lock,
    component: SecuritySection,
  },
  {
    id: 'subscription' as Section,
    label: 'Subscription',
    icon: CreditCard,
    component: SubscriptionSection,
  },
  {
    id: 'danger' as Section,
    label: 'Danger Zone',
    icon: AlertTriangle,
    component: DangerZoneSection,
    danger: true,
  },
];

export default function AccountSettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('profile');

  const ActiveComponent = SECTIONS.find((s) => s.id === activeSection)?.component || ProfileSection;

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025]"
          style={{
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
          }}
        />
        {/* Gradient Orbs */}
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl animate-pulse-slow"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl animate-pulse-slower"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-12 md:py-16">
        {/* Header with Badge */}
        <div className="mb-12 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm mb-6">
            <UserIcon className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-mono text-cyan-400">
              Account Management
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Account <span className="text-gradient-sync">Settings</span>
          </h1>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl">
            Manage your account preferences, security, and subscription
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in-delayed">
          {/* Sidebar Navigation - Glassmorphic */}
          <nav className="md:col-span-1">
            <div className="space-y-2 md:sticky md:top-8">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
                      'border backdrop-blur-sm text-left',
                      isActive && 'border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 shadow-lg shadow-cyan-500/10',
                      !isActive && 'border-border bg-card/30 hover:border-cyan-500/20 hover:bg-card/50',
                      section.danger && !isActive && 'border-red-500/20 hover:border-red-500/30 hover:bg-red-500/5',
                      section.danger && isActive && 'border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-600/10 shadow-lg shadow-red-500/10'
                    )}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <div className={cn(
                      'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                      isActive && !section.danger && 'bg-cyan-500/20',
                      !isActive && !section.danger && 'bg-muted/50',
                      section.danger && isActive && 'bg-red-500/20',
                      section.danger && !isActive && 'bg-red-500/10'
                    )}>
                      <Icon className={cn(
                        'h-4 w-4',
                        isActive && !section.danger && 'text-cyan-400',
                        !isActive && !section.danger && 'text-muted-foreground',
                        section.danger && 'text-red-400'
                      )} />
                    </div>
                    <span className={cn(
                      'font-medium transition-colors',
                      isActive && !section.danger && 'text-foreground',
                      !isActive && !section.danger && 'text-muted-foreground',
                      section.danger && 'text-red-400'
                    )}>
                      {section.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main Content */}
          <div className="md:col-span-3">
            <ActiveComponent />
          </div>
        </div>
      </div>
    </div>
  );
}
