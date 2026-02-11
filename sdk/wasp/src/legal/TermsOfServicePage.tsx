import { useState, useEffect } from 'react';
import { Link } from 'wasp/client/router';

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    document.querySelectorAll('section[id]').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const tableOfContents = [
    { id: 'acceptance', title: 'Acceptance of Terms' },
    { id: 'description', title: 'Service Description' },
    { id: 'eligibility', title: 'Eligibility' },
    { id: 'account', title: 'Account Registration' },
    { id: 'subscription', title: 'Subscription and Billing' },
    { id: 'usage-limits', title: 'Usage Limits' },
    { id: 'oauth', title: 'Third-Party Authorization' },
    { id: 'acceptable-use', title: 'Acceptable Use Policy' },
    { id: 'data-responsibility', title: 'Data Responsibility' },
    { id: 'intellectual-property', title: 'Intellectual Property' },
    { id: 'warranties', title: 'Warranties and Disclaimers' },
    { id: 'limitation', title: 'Limitation of Liability' },
    { id: 'indemnification', title: 'Indemnification' },
    { id: 'termination', title: 'Termination' },
    { id: 'modifications', title: 'Modifications to Service' },
    { id: 'governing-law', title: 'Governing Law' },
    { id: 'contact', title: 'Contact Information' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/logo.png"
                alt="BaseSync Logo"
                className="w-8 h-8 object-contain group-hover:scale-105 transition-transform"
              />
              <span className="text-lg font-semibold text-slate-800">BaseSync</span>
            </Link>
            <Link
              to="/"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Table of Contents - Sticky Sidebar */}
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-28">
              <div className="bg-white rounded-2xl shadow-md border border-slate-200/60 p-6">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                  Table of Contents
                </h2>
                <nav className="space-y-1">
                  {tableOfContents.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${
                        activeSection === item.id
                          ? 'bg-purple-100 text-purple-700 font-medium'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {item.title}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
              {/* Hero Section */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-12 sm:px-12">
                <h1 className="text-4xl font-bold text-white mb-3">Terms of Service</h1>
                <p className="text-purple-100 text-lg">
                  Last Updated: February 8, 2026
                </p>
              </div>

              {/* Content */}
              <div className="px-8 py-10 sm:px-12 space-y-12">
                {/* Acceptance */}
                <section id="acceptance" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-purple-600">
                    1. Acceptance of Terms
                  </h2>
                  <div className="prose prose-slate max-w-none space-y-4">
                    <p className="text-slate-700 leading-relaxed">
                      These Terms of Service ("Terms") constitute a legally binding agreement between you ("you,"
                      "your," or "User") and BaseSync ("we," "us," "our," or "Company") governing your access to
                      and use of the BaseSync service, including our website, software, and all related services
                      (collectively, the "Service").
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      By creating an account, accessing, or using BaseSync, you acknowledge that you have read,
                      understood, and agree to be bound by these Terms and our Privacy Policy. If you do not
                      agree to these Terms, you must not access or use the Service.
                    </p>
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                      <p className="text-slate-700 leading-relaxed">
                        <strong>Important:</strong> These Terms include provisions that limit our liability and
                        require individual arbitration for any disputes. Please review Section 12 (Limitation of
                        Liability) carefully.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Service Description */}
                <section id="description" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-purple-600">
                    2. Service Description
                  </h2>
                  <div className="space-y-4">
                    <p className="text-slate-700 leading-relaxed">
                      BaseSync provides a data synchronization service that enables bidirectional data transfer
                      between Airtable bases and Google Sheets. Our Service includes:
                    </p>
                    <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                      <li>
                        <strong>Bidirectional Sync:</strong> Two-way synchronization between Airtable tables and
                        Google Sheets with configurable conflict resolution
                      </li>
                      <li>
                        <strong>One-Way Sync:</strong> Unidirectional data flow from Airtable to Sheets or vice
                        versa
                      </li>
                      <li>
                        <strong>Field Mapping:</strong> Tools to map fields between different data sources
                      </li>
                      <li>
                        <strong>Linked Record Resolution:</strong> Automatic conversion of Airtable linked record
                        IDs to human-readable names
                      </li>
                      <li>
                        <strong>Automated Sync:</strong> Scheduled synchronization at regular intervals based on
                        your subscription plan
                      </li>
                      <li>
                        <strong>Sync History:</strong> Logs and monitoring of sync operations
                      </li>
                    </ul>
                    <p className="text-slate-700 leading-relaxed mt-4">
                      BaseSync acts as an intermediary service and does not own, control, or endorse the content
                      you sync. We are not responsible for the accuracy, quality, or legality of the data you
                      synchronize through our Service.
                    </p>
                  </div>
                </section>

                {/* Eligibility */}
                <section id="eligibility" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-purple-600">
                    3. Eligibility
                  </h2>
                  <div className="space-y-4">
                    <p className="text-slate-700 leading-relaxed">
                      To use BaseSync, you must:
                    </p>
                    <ul className="space-y-3">
                      {[
                        'Be at least 18 years of age or the age of majority in your jurisdiction',
                        'Have the legal capacity to enter into a binding contract',
                        'Not be prohibited from using the Service under applicable laws',
                        'Have valid accounts with both Airtable and Google that you are authorized to use',
                        'Provide accurate, current, and complete registration information',
                        'Not have been previously banned or suspended from BaseSync',
                      ].map((item, idx) => (
                        <li key={idx} className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                            {idx + 1}
                          </div>
                          <span className="text-slate-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-slate-700 leading-relaxed">
                      If you are using BaseSync on behalf of an organization, you represent and warrant that you
                      have the authority to bind that organization to these Terms.
                    </p>
                  </div>
                </section>

                {/* Account Registration */}
                <section id="account" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-purple-600">
                    4. Account Registration and Security
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">4.1 Account Creation</h3>
                      <p className="text-slate-700 leading-relaxed">
                        To use BaseSync, you must create an account by providing accurate and complete
                        information. You agree to:
                      </p>
                      <ul className="list-disc list-inside text-slate-700 space-y-1 mt-2 ml-4">
                        <li>Provide truthful, accurate, and complete registration information</li>
                        <li>Maintain and promptly update your account information</li>
                        <li>Keep your password secure and confidential</li>
                        <li>Notify us immediately of any unauthorized use of your account</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">4.2 Account Security</h3>
                      <p className="text-slate-700 leading-relaxed">
                        You are solely responsible for all activities that occur under your account. We are not
                        liable for any loss or damage arising from your failure to maintain account security.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">4.3 One Account Per User</h3>
                      <p className="text-slate-700 leading-relaxed">
                        Each user may maintain only one active account. Creating multiple accounts to circumvent
                        usage limits or pricing tiers is strictly prohibited and grounds for immediate
                        termination.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Subscription and Billing */}
                <section id="subscription" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-purple-600">
                    5. Subscription and Billing
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">5.1 Free Trial</h3>
                      <p className="text-slate-700 leading-relaxed">
                        New users receive a 14-day free trial with full Pro tier features. No credit card is
                        required to start the trial. At the end of the trial period, your syncs will pause until
                        you subscribe to a paid plan.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">5.2 Subscription Plans</h3>
                      <p className="text-slate-700 leading-relaxed mb-3">
                        BaseSync offers the following subscription tiers:
                      </p>
                      <div className="space-y-3">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-800">
                            Starter - $9/month or $7.20/month (annual)
                          </h4>
                          <ul className="text-sm text-slate-700 mt-2 space-y-1">
                            <li>• 1 sync configuration</li>
                            <li>• 1,000 records per sync</li>
                            <li>• 15-minute sync interval</li>
                          </ul>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-800">
                            Pro - $19/month or $15.20/month (annual)
                          </h4>
                          <ul className="text-sm text-slate-700 mt-2 space-y-1">
                            <li>• 3 sync configurations</li>
                            <li>• 5,000 records per sync</li>
                            <li>• 5-minute sync interval</li>
                          </ul>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-800">
                            Business - $39/month or $31.20/month (annual)
                          </h4>
                          <ul className="text-sm text-slate-700 mt-2 space-y-1">
                            <li>• 10 sync configurations</li>
                            <li>• Unlimited records</li>
                            <li>• 5-minute sync interval</li>
                            <li>• Priority support</li>
                          </ul>
                        </div>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed mt-3">
                        Annual billing provides a 20% discount. Prices are in USD and subject to change with 30
                        days notice.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">5.3 Payment Terms</h3>
                      <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                        <li>
                          All fees are charged in advance on a monthly or annual basis depending on your selected
                          billing cycle
                        </li>
                        <li>
                          Payment processing is handled by Stripe. You must provide valid payment information
                        </li>
                        <li>
                          Subscriptions automatically renew unless cancelled before the renewal date
                        </li>
                        <li>All fees are non-refundable except as required by law</li>
                        <li>
                          Failed payments may result in service suspension after a 7-day grace period
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        5.4 Plan Changes and Cancellations
                      </h3>
                      <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                        <li>
                          <strong>Upgrades:</strong> Take effect immediately. You will be charged a prorated
                          amount for the remainder of your billing period
                        </li>
                        <li>
                          <strong>Downgrades:</strong> Take effect at the end of your current billing period
                        </li>
                        <li>
                          <strong>Cancellations:</strong> You may cancel anytime. Service continues until the end
                          of your paid period. No refunds for partial periods
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">5.5 Taxes</h3>
                      <p className="text-slate-700 leading-relaxed">
                        All fees are exclusive of taxes. You are responsible for paying all applicable taxes,
                        duties, and governmental charges. We will charge tax when required by law.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Usage Limits */}
                <section id="usage-limits" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-purple-600">
                    6. Usage Limits and Fair Use
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">6.1 Plan-Based Limits</h3>
                      <p className="text-slate-700 leading-relaxed">
                        Your subscription plan determines:
                      </p>
                      <ul className="list-disc list-inside text-slate-700 space-y-1 mt-2 ml-4">
                        <li>Maximum number of sync configurations</li>
                        <li>Maximum records per sync operation</li>
                        <li>Sync frequency (5-minute or 15-minute intervals)</li>
                      </ul>
                      <p className="text-slate-700 leading-relaxed mt-3">
                        When you reach 80% of your record limit, we will notify you via email. At 100%, syncs
                        will pause until you upgrade your plan or the next billing cycle (for monthly limits).
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">6.2 Fair Use Policy</h3>
                      <p className="text-slate-700 leading-relaxed">
                        You agree to use the Service in a reasonable manner. Excessive use that impacts system
                        performance or other users may result in throttling or suspension. This includes:
                      </p>
                      <ul className="list-disc list-inside text-slate-700 space-y-1 mt-2 ml-4">
                        <li>Intentionally triggering repeated manual syncs to circumvent limits</li>
                        <li>Using automated scripts to abuse the Service</li>
                        <li>Syncing data at volumes that significantly exceed plan limits</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">6.3 API Rate Limits</h3>
                      <p className="text-slate-700 leading-relaxed">
                        BaseSync is subject to rate limits imposed by Airtable and Google. We make reasonable
                        efforts to stay within these limits, but we are not responsible for sync delays or
                        failures caused by third-party rate limiting.
                      </p>
                    </div>
                  </div>
                </section>

                {/* OAuth */}
                <section id="oauth" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-purple-600">
                    7. Third-Party Authorization (OAuth)
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        7.1 Authorization Requirements
                      </h3>
                      <p className="text-slate-700 leading-relaxed">
                        To use BaseSync, you must authorize our application to access your Airtable and Google
                        Sheets accounts using OAuth 2.0. By granting this authorization, you:
                      </p>
                      <ul className="list-disc list-inside text-slate-700 space-y-1 mt-2 ml-4">
                        <li>Confirm you have the legal right to grant BaseSync access to the data</li>
                        <li>Authorize BaseSync to read, write, and modify data in the specified bases/sheets</li>
                        <li>
                          Acknowledge that BaseSync will access only the bases and sheets you explicitly
                          configure
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        7.2 Scope of Access
                      </h3>
                      <p className="text-slate-700 leading-relaxed mb-2">
                        BaseSync requests the following permissions:
                      </p>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">Airtable:</p>
                          <ul className="text-sm text-slate-700 space-y-1 mt-1">
                            <li>
                              • <code className="bg-white px-1.5 py-0.5 rounded">data.records:read</code> - Read
                              records
                            </li>
                            <li>
                              • <code className="bg-white px-1.5 py-0.5 rounded">data.records:write</code> -
                              Create/update records
                            </li>
                            <li>
                              • <code className="bg-white px-1.5 py-0.5 rounded">schema.bases:read</code> - Read
                              base structure
                            </li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">Google Sheets:</p>
                          <ul className="text-sm text-slate-700 space-y-1 mt-1">
                            <li>
                              •{' '}
                              <code className="bg-white px-1.5 py-0.5 rounded text-xs">
                                https://www.googleapis.com/auth/spreadsheets
                              </code>{' '}
                              - Read/write sheets (for specified spreadsheets only)
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">7.3 Revoking Access</h3>
                      <p className="text-slate-700 leading-relaxed">
                        You may revoke BaseSync's access at any time through your Airtable or Google account
                        settings. Revoking access will immediately stop all sync operations and may result in
                        data inconsistencies.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        7.4 Third-Party Terms
                      </h3>
                      <p className="text-slate-700 leading-relaxed">
                        Your use of Airtable and Google Sheets through BaseSync is subject to those platforms'
                        respective terms of service and privacy policies. We are not responsible for changes to
                        third-party services that affect BaseSync's functionality.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Acceptable Use */}
                <section id="acceptable-use" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-purple-600">
                    8. Acceptable Use Policy
                  </h2>
                  <div className="space-y-4">
                    <p className="text-slate-700 leading-relaxed">
                      You agree not to use BaseSync to:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        'Violate any laws or regulations',
                        'Infringe intellectual property rights',
                        'Transmit malware or harmful code',
                        'Sync illegal, harmful, or offensive content',
                        'Harass, abuse, or harm others',
                        'Impersonate any person or entity',
                        'Interfere with the Service or servers',
                        'Attempt to bypass security measures',
                        'Scrape or data mine without authorization',
                        'Use the Service for competitive purposes',
                        'Share your account credentials',
                        'Resell or redistribute the Service',
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200"
                        >
                          <span className="text-red-500 font-bold flex-shrink-0">✕</span>
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-slate-700 leading-relaxed mt-4">
                      Violation of this Acceptable Use Policy may result in immediate suspension or termination
                      of your account without refund.
                    </p>
                  </div>
                </section>

                {/* Data Responsibility */}
                <section id="data-responsibility" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-purple-600">
                    9. Your Data and Responsibilities
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">9.1 Data Ownership</h3>
                      <p className="text-slate-700 leading-relaxed">
                        You retain all ownership rights to the data you sync through BaseSync. We claim no
                        ownership over your content.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">9.2 Data Accuracy</h3>
                      <p className="text-slate-700 leading-relaxed">
                        You are solely responsible for:
                      </p>
                      <ul className="list-disc list-inside text-slate-700 space-y-1 mt-2 ml-4">
                        <li>The accuracy, quality, and legality of your data</li>
                        <li>Configuring field mappings and sync settings correctly</li>
                        <li>Backing up your data independently</li>
                        <li>Ensuring you have the right to sync and modify the data</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">9.3 Data Backup</h3>
                      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                        <p className="text-slate-700 leading-relaxed">
                          <strong>Critical Warning:</strong> BaseSync is a synchronization tool, not a backup
                          service. Changes made in one location sync to the other. We strongly recommend
                          maintaining independent backups of all critical data. We are not liable for data loss
                          resulting from sync operations, misconfigurations, or service failures.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        9.4 License to Process Your Data
                      </h3>
                      <p className="text-slate-700 leading-relaxed">
                        By using BaseSync, you grant us a limited, non-exclusive license to access, process, and
                        transmit your data solely for the purpose of providing the Service. This license
                        terminates when you delete your data or account.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Intellectual Property */}
                <section id="intellectual-property" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-purple-600">
                    10. Intellectual Property Rights
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">10.1 Our Rights</h3>
                      <p className="text-slate-700 leading-relaxed">
                        BaseSync and all related trademarks, logos, software, documentation, and materials are
                        owned by us or our licensors. These Terms do not grant you any rights to use our
                        intellectual property except as necessary to use the Service.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">10.2 Feedback</h3>
                      <p className="text-slate-700 leading-relaxed">
                        If you provide feedback, suggestions, or ideas about BaseSync, you grant us an
                        unrestricted, perpetual, royalty-free license to use that feedback for any purpose
                        without compensation or attribution.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Warranties */}
                <section id="warranties" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-purple-600">
                    11. Warranties and Disclaimers
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">11.1 Your Warranties</h3>
                      <p className="text-slate-700 leading-relaxed">You represent and warrant that:</p>
                      <ul className="list-disc list-inside text-slate-700 space-y-1 mt-2 ml-4">
                        <li>You have the legal right to use the data you sync</li>
                        <li>Your use complies with all applicable laws</li>
                        <li>You will not violate third-party rights</li>
                        <li>All information you provide is accurate</li>
                      </ul>
                    </div>

                    <div className="bg-slate-100 border-2 border-slate-300 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-slate-800 mb-3">
                        11.2 Service Disclaimer
                      </h3>
                      <p className="text-slate-700 leading-relaxed font-medium mb-3">
                        THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER
                        EXPRESS OR IMPLIED.
                      </p>
                      <p className="text-slate-700 leading-relaxed">
                        WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
                      </p>
                      <ul className="list-disc list-inside text-slate-700 space-y-1 mt-2 ml-4">
                        <li>MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE</li>
                        <li>UNINTERRUPTED, ERROR-FREE, OR SECURE OPERATION</li>
                        <li>ACCURACY OR RELIABILITY OF DATA SYNCING</li>
                        <li>COMPATIBILITY WITH ALL AIRTABLE OR GOOGLE SHEETS FEATURES</li>
                        <li>THAT SYNCS WILL ALWAYS COMPLETE SUCCESSFULLY</li>
                      </ul>
                      <p className="text-slate-700 leading-relaxed mt-4">
                        Some jurisdictions do not allow exclusion of implied warranties, so some of these
                        exclusions may not apply to you.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        11.3 Third-Party Services
                      </h3>
                      <p className="text-slate-700 leading-relaxed">
                        We are not responsible for the availability, performance, or security of Airtable,
                        Google Sheets, or any other third-party service. Changes to third-party APIs may impact
                        BaseSync functionality.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Limitation of Liability */}
                <section id="limitation" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-purple-600">
                    12. Limitation of Liability
                  </h2>
                  <div className="bg-slate-100 border-2 border-slate-400 rounded-lg p-6 space-y-4">
                    <p className="text-slate-700 leading-relaxed font-semibold">
                      TO THE MAXIMUM EXTENT PERMITTED BY LAW:
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      IN NO EVENT SHALL BASESYNC, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY
                      INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED
                      TO:
                    </p>
                    <ul className="list-disc list-inside text-slate-700 space-y-1 ml-4">
                      <li>Loss of data, revenue, or profits</li>
                      <li>Business interruption or loss of business opportunity</li>
                      <li>Costs of substitute services</li>
                      <li>Errors in syncing or data corruption</li>
                      <li>Unauthorized access to your data</li>
                    </ul>
                    <p className="text-slate-700 leading-relaxed font-semibold mt-4">
                      OUR TOTAL LIABILITY FOR ALL CLAIMS RELATED TO THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU
                      PAID US IN THE 12 MONTHS PRIOR TO THE CLAIM, OR $100, WHICHEVER IS GREATER.
                    </p>
                    <p className="text-slate-700 text-sm leading-relaxed mt-4">
                      Some jurisdictions do not allow limitation of liability for incidental or consequential
                      damages, so these limitations may not apply to you.
                    </p>
                  </div>
                </section>

                {/* Indemnification */}
                <section id="indemnification" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-purple-600">
                    13. Indemnification
                  </h2>
                  <div className="space-y-4">
                    <p className="text-slate-700 leading-relaxed">
                      You agree to indemnify, defend, and hold harmless BaseSync and its officers, directors,
                      employees, and agents from and against any claims, liabilities, damages, losses, costs, or
                      expenses (including reasonable attorneys' fees) arising from:
                    </p>
                    <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                      <li>Your use or misuse of the Service</li>
                      <li>Your violation of these Terms</li>
                      <li>Your violation of any law or third-party rights</li>
                      <li>The data you sync through the Service</li>
                      <li>Your account credentials being compromised due to your negligence</li>
                    </ul>
                  </div>
                </section>

                {/* Termination */}
                <section id="termination" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-purple-600">
                    14. Termination
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        14.1 Termination by You
                      </h3>
                      <p className="text-slate-700 leading-relaxed">
                        You may cancel your subscription and delete your account at any time through account
                        settings. Termination takes effect at the end of your current billing period. No refunds
                        will be provided for unused time.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        14.2 Termination by Us
                      </h3>
                      <p className="text-slate-700 leading-relaxed">
                        We may suspend or terminate your account immediately without notice if:
                      </p>
                      <ul className="list-disc list-inside text-slate-700 space-y-1 mt-2 ml-4">
                        <li>You violate these Terms or our Acceptable Use Policy</li>
                        <li>Your payment method fails and you don't update it within 7 days</li>
                        <li>We suspect fraudulent, abusive, or illegal activity</li>
                        <li>Required by law or court order</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        14.3 Effect of Termination
                      </h3>
                      <p className="text-slate-700 leading-relaxed">
                        Upon termination:
                      </p>
                      <ul className="list-disc list-inside text-slate-700 space-y-1 mt-2 ml-4">
                        <li>All sync operations stop immediately</li>
                        <li>You lose access to your BaseSync account and dashboard</li>
                        <li>
                          Your data in Airtable and Google Sheets remains unchanged (we don't delete your
                          external data)
                        </li>
                        <li>
                          Account data is retained for 30 days to allow reactivation, then permanently deleted
                        </li>
                        <li>Provisions regarding liability, indemnification, and disputes survive termination</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Modifications */}
                <section id="modifications" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-purple-600">
                    15. Modifications to Service and Terms
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">15.1 Service Changes</h3>
                      <p className="text-slate-700 leading-relaxed">
                        We reserve the right to modify, suspend, or discontinue any part of the Service at any
                        time with or without notice. We are not liable for any modifications, suspension, or
                        discontinuation of the Service.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">15.2 Terms Changes</h3>
                      <p className="text-slate-700 leading-relaxed">
                        We may update these Terms from time to time. When we make material changes:
                      </p>
                      <ul className="list-disc list-inside text-slate-700 space-y-1 mt-2 ml-4">
                        <li>We'll update the "Last Updated" date</li>
                        <li>We'll notify you via email at least 30 days before changes take effect</li>
                        <li>Continued use after the effective date constitutes acceptance</li>
                      </ul>
                      <p className="text-slate-700 leading-relaxed mt-3">
                        If you don't agree to the new terms, you must stop using the Service and cancel your
                        subscription.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Governing Law */}
                <section id="governing-law" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-purple-600">
                    16. Governing Law and Dispute Resolution
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">16.1 Governing Law</h3>
                      <p className="text-slate-700 leading-relaxed">
                        These Terms are governed by the laws of the State of Delaware, United States, without
                        regard to conflict of law principles.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">16.2 Dispute Resolution</h3>
                      <p className="text-slate-700 leading-relaxed">
                        Before filing a claim, you agree to contact us at{' '}
                        <a href="mailto:support@basesync.app" className="text-blue-600 hover:underline">
                          support@basesync.app
                        </a>{' '}
                        to attempt to resolve the dispute informally. We'll attempt to resolve within 60 days.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">16.3 Jurisdiction</h3>
                      <p className="text-slate-700 leading-relaxed">
                        Any legal action arising from these Terms must be filed in the federal or state courts
                        located in Delaware. You consent to the exclusive jurisdiction of those courts.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">16.4 Class Action Waiver</h3>
                      <p className="text-slate-700 leading-relaxed">
                        You agree that disputes will be resolved individually, not as part of a class,
                        consolidated, or representative action. You waive any right to participate in a class
                        action lawsuit or class-wide arbitration.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Miscellaneous */}
                <section className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-purple-600">
                    17. General Provisions
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">17.1 Entire Agreement</h3>
                      <p className="text-slate-700 leading-relaxed">
                        These Terms, together with our Privacy Policy, constitute the entire agreement between
                        you and BaseSync regarding the Service.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">17.2 Severability</h3>
                      <p className="text-slate-700 leading-relaxed">
                        If any provision is found invalid or unenforceable, the remaining provisions will remain
                        in full effect.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">17.3 Waiver</h3>
                      <p className="text-slate-700 leading-relaxed">
                        Our failure to enforce any provision does not constitute a waiver of that provision.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">17.4 Assignment</h3>
                      <p className="text-slate-700 leading-relaxed">
                        You may not assign these Terms without our written consent. We may assign these Terms to
                        any affiliate or in connection with a merger or sale.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">17.5 Force Majeure</h3>
                      <p className="text-slate-700 leading-relaxed">
                        We are not liable for delays or failures caused by events beyond our reasonable control,
                        including natural disasters, war, terrorism, riots, or failures of third-party services.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Contact */}
                <section id="contact" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-purple-600">
                    18. Contact Information
                  </h2>
                  <div className="space-y-4">
                    <p className="text-slate-700 leading-relaxed">
                      For questions about these Terms, please contact us:
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">⚖️</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Legal Inquiries</p>
                          <a href="mailto:support@basesync.app" className="text-blue-600 hover:underline">
                            support@basesync.app
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="text-xl">💼</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">General Support</p>
                          <a
                            href="mailto:support@basesync.app"
                            className="text-blue-600 hover:underline"
                          >
                            support@basesync.app
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="text-xl">🌐</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Website</p>
                          <a href="https://basesync.app" className="text-blue-600 hover:underline">
                            https://basesync.app
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Acceptance Footer */}
            <div className="mt-6 bg-slate-100 border border-slate-200 rounded-lg p-6">
              <p className="text-slate-600 text-sm text-center">
                By using BaseSync, you acknowledge that you have read, understood, and agree to be bound by these
                Terms of Service.
              </p>
              <p className="text-slate-600 text-sm text-center mt-2">
                Last Updated: February 8, 2026
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
