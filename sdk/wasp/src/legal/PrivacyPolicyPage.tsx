import { useState, useEffect } from 'react';
import { Link } from 'wasp/client/router';

export default function PrivacyPolicyPage() {
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
    { id: 'overview', title: 'Overview' },
    { id: 'information-collection', title: 'Information We Collect' },
    { id: 'how-we-use', title: 'How We Use Your Information' },
    { id: 'data-storage', title: 'Data Storage and Security' },
    { id: 'oauth-permissions', title: 'OAuth and Third-Party Access' },
    { id: 'data-sharing', title: 'Data Sharing and Disclosure' },
    { id: 'data-retention', title: 'Data Retention' },
    { id: 'your-rights', title: 'Your Rights and Choices' },
    { id: 'cookies', title: 'Cookies and Tracking' },
    { id: 'childrens-privacy', title: "Children's Privacy" },
    { id: 'international', title: 'International Data Transfers' },
    { id: 'changes', title: 'Changes to This Policy' },
    { id: 'contact', title: 'Contact Us' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
                          ? 'bg-blue-100 text-blue-700 font-medium'
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
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 sm:px-12">
                <h1 className="text-4xl font-bold text-white mb-3">Privacy Policy</h1>
                <p className="text-blue-100 text-lg">
                  Last Updated: February 8, 2026
                </p>
              </div>

              {/* Content */}
              <div className="px-8 py-10 sm:px-12 space-y-12">
                {/* Overview */}
                <section id="overview" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-600">
                    Overview
                  </h2>
                  <div className="prose prose-slate max-w-none">
                    <p className="text-slate-700 leading-relaxed">
                      BaseSync ("we," "our," or "us") is committed to protecting your privacy. This Privacy
                      Policy explains how we collect, use, disclose, and safeguard your information when you
                      use our service that enables two-way synchronization between Airtable and Google Sheets.
                    </p>
                    <p className="text-slate-700 leading-relaxed mt-4">
                      By using BaseSync, you agree to the collection and use of information in accordance with
                      this policy. If you do not agree with our policies and practices, please do not use our
                      service.
                    </p>
                  </div>
                </section>

                {/* Information Collection */}
                <section id="information-collection" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-600">
                    Information We Collect
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        1. Account Information
                      </h3>
                      <p className="text-slate-700 leading-relaxed">
                        When you create an account, we collect:
                      </p>
                      <ul className="list-disc list-inside text-slate-700 space-y-1 mt-2 ml-4">
                        <li>Email address</li>
                        <li>Username</li>
                        <li>Password (encrypted and hashed)</li>
                        <li>Account creation date and settings</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        2. OAuth Authentication Data
                      </h3>
                      <p className="text-slate-700 leading-relaxed">
                        To enable synchronization, we store OAuth tokens for:
                      </p>
                      <ul className="list-disc list-inside text-slate-700 space-y-1 mt-2 ml-4">
                        <li>
                          <strong>Airtable:</strong> Access tokens, refresh tokens, token expiry dates
                        </li>
                        <li>
                          <strong>Google Sheets:</strong> Access tokens, refresh tokens, token expiry dates
                        </li>
                      </ul>
                      <p className="text-slate-700 leading-relaxed mt-2 bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                        <strong>Important:</strong> All OAuth tokens are encrypted using industry-standard
                        AES-256 encryption before being stored in our database. We never store your Airtable or
                        Google account passwords.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        3. Sync Configuration Data
                      </h3>
                      <p className="text-slate-700 leading-relaxed">
                        We store your sync settings, including:
                      </p>
                      <ul className="list-disc list-inside text-slate-700 space-y-1 mt-2 ml-4">
                        <li>Airtable base IDs and table IDs you've chosen to sync</li>
                        <li>Google Spreadsheet IDs and sheet IDs you've chosen to sync</li>
                        <li>Field mapping configurations</li>
                        <li>Sync direction preferences (one-way or bidirectional)</li>
                        <li>Conflict resolution settings</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        4. Usage and Sync Data
                      </h3>
                      <p className="text-slate-700 leading-relaxed">
                        We collect operational data about your syncs:
                      </p>
                      <ul className="list-disc list-inside text-slate-700 space-y-1 mt-2 ml-4">
                        <li>Number of records synced</li>
                        <li>Sync timestamps and frequency</li>
                        <li>Sync success/failure status</li>
                        <li>Error logs (for troubleshooting)</li>
                        <li>Monthly usage statistics for billing purposes</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        5. Payment Information
                      </h3>
                      <p className="text-slate-700 leading-relaxed">
                        Payment processing is handled by Stripe. We do not store your credit card information.
                        We receive only:
                      </p>
                      <ul className="list-disc list-inside text-slate-700 space-y-1 mt-2 ml-4">
                        <li>Stripe customer ID</li>
                        <li>Subscription status and plan tier</li>
                        <li>Billing history</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        6. Automatically Collected Information
                      </h3>
                      <p className="text-slate-700 leading-relaxed">
                        When you use BaseSync, we automatically collect:
                      </p>
                      <ul className="list-disc list-inside text-slate-700 space-y-1 mt-2 ml-4">
                        <li>IP address</li>
                        <li>Browser type and version</li>
                        <li>Device information</li>
                        <li>Pages visited and features used</li>
                        <li>Time spent on pages</li>
                        <li>Referring website</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* How We Use Your Information */}
                <section id="how-we-use" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-600">
                    How We Use Your Information
                  </h2>
                  <div className="space-y-4">
                    <p className="text-slate-700 leading-relaxed">
                      We use the information we collect for the following purposes:
                    </p>
                    <ul className="space-y-3">
                      {[
                        {
                          title: 'Provide Core Services',
                          desc: 'To synchronize data between your Airtable bases and Google Sheets according to your configuration',
                        },
                        {
                          title: 'Authenticate and Authorize',
                          desc: 'To verify your identity and manage your access to Airtable and Google Sheets via OAuth',
                        },
                        {
                          title: 'Process Payments',
                          desc: 'To handle subscription billing and manage your account tier and limits',
                        },
                        {
                          title: 'Maintain and Improve Services',
                          desc: 'To troubleshoot errors, optimize performance, and develop new features',
                        },
                        {
                          title: 'Send Notifications',
                          desc: 'To alert you about sync failures, approaching usage limits, trial expirations, and account updates',
                        },
                        {
                          title: 'Ensure Security',
                          desc: 'To detect and prevent fraud, abuse, and security incidents',
                        },
                        {
                          title: 'Comply with Legal Obligations',
                          desc: 'To meet regulatory requirements and respond to legal requests',
                        },
                        {
                          title: 'Analyze Usage',
                          desc: 'To understand how users interact with BaseSync and improve the user experience',
                        },
                      ].map((item, idx) => (
                        <li key={idx} className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                            {idx + 1}
                          </div>
                          <div>
                            <strong className="text-slate-800">{item.title}:</strong>{' '}
                            <span className="text-slate-700">{item.desc}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                {/* Data Storage and Security */}
                <section id="data-storage" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-600">
                    Data Storage and Security
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Security Measures</h3>
                      <p className="text-slate-700 leading-relaxed mb-3">
                        We implement industry-standard security measures to protect your data:
                      </p>
                      <ul className="list-disc list-inside text-slate-700 space-y-1 ml-4">
                        <li>
                          <strong>Encryption:</strong> All OAuth tokens are encrypted using AES-256 encryption
                          at rest
                        </li>
                        <li>
                          <strong>HTTPS:</strong> All data transmission uses TLS/SSL encryption
                        </li>
                        <li>
                          <strong>Database Security:</strong> Our PostgreSQL database is hosted on secure,
                          regularly updated infrastructure
                        </li>
                        <li>
                          <strong>Access Controls:</strong> Strict role-based access controls limit who can
                          access user data
                        </li>
                        <li>
                          <strong>Regular Audits:</strong> We conduct security reviews and vulnerability
                          assessments
                        </li>
                      </ul>
                    </div>

                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                      <p className="text-slate-700 leading-relaxed">
                        <strong>Important Note:</strong> While we implement robust security measures, no method
                        of transmission over the internet or electronic storage is 100% secure. We cannot
                        guarantee absolute security but will notify you promptly of any security breaches as
                        required by law.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        Data Location and Hosting
                      </h3>
                      <p className="text-slate-700 leading-relaxed">
                        BaseSync is hosted on Railway infrastructure. Your data may be stored and processed in
                        data centers located in the United States or other countries where Railway operates.
                      </p>
                    </div>
                  </div>
                </section>

                {/* OAuth Permissions */}
                <section id="oauth-permissions" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-600">
                    OAuth and Third-Party Access
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        Airtable Permissions
                      </h3>
                      <p className="text-slate-700 leading-relaxed mb-2">
                        BaseSync requests the following Airtable permissions:
                      </p>
                      <ul className="list-disc list-inside text-slate-700 space-y-1 ml-4">
                        <li>
                          <code className="bg-slate-100 px-2 py-0.5 rounded text-sm">
                            data.records:read
                          </code>{' '}
                          - Read records from your tables
                        </li>
                        <li>
                          <code className="bg-slate-100 px-2 py-0.5 rounded text-sm">
                            data.records:write
                          </code>{' '}
                          - Create, update, and delete records
                        </li>
                        <li>
                          <code className="bg-slate-100 px-2 py-0.5 rounded text-sm">
                            schema.bases:read
                          </code>{' '}
                          - Read base and table structure (fields, types)
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        Google Sheets Permissions
                      </h3>
                      <p className="text-slate-700 leading-relaxed mb-2">
                        BaseSync requests the following Google API scopes:
                      </p>
                      <ul className="list-disc list-inside text-slate-700 space-y-1 ml-4">
                        <li>
                          <code className="bg-slate-100 px-2 py-0.5 rounded text-sm">
                            https://www.googleapis.com/auth/spreadsheets
                          </code>{' '}
                          - Read and write spreadsheet data for specified spreadsheets only
                        </li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                      <p className="text-slate-700 leading-relaxed">
                        <strong>Your Control:</strong> You can revoke BaseSync's access to Airtable or Google
                        at any time through your Airtable account settings or Google Account permissions page.
                        Revoking access will stop all syncing immediately.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        How We Access Your Data
                      </h3>
                      <p className="text-slate-700 leading-relaxed">
                        BaseSync only accesses the specific Airtable bases/tables and Google Sheets you
                        explicitly configure for syncing. We do not scan, read, or access any other data in
                        your Airtable or Google accounts.
                      </p>
                      <p className="text-slate-700 leading-relaxed mt-3">
                        <strong>Data Processing:</strong> Your actual record data (the contents of your tables
                        and sheets) is processed in-memory during sync operations and is not permanently stored
                        on our servers. We only store sync metadata (timestamps, record counts, errors).
                      </p>
                    </div>
                  </div>
                </section>

                {/* Data Sharing */}
                <section id="data-sharing" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-600">
                    Data Sharing and Disclosure
                  </h2>
                  <div className="space-y-4">
                    <p className="text-slate-700 leading-relaxed">
                      We do not sell, rent, or trade your personal information. We may share your information
                      only in the following circumstances:
                    </p>
                    <ul className="space-y-3">
                      {[
                        {
                          title: 'Service Providers',
                          desc: 'With third-party vendors who provide infrastructure (Railway), payment processing (Stripe), email delivery (Resend), and analytics. These providers are contractually obligated to protect your data.',
                        },
                        {
                          title: 'Legal Requirements',
                          desc: 'When required by law, court order, or government request, or to protect our legal rights, prevent fraud, or ensure user safety.',
                        },
                        {
                          title: 'Business Transfers',
                          desc: 'In the event of a merger, acquisition, or sale of assets, your information may be transferred. You will be notified of any such change.',
                        },
                        {
                          title: 'With Your Consent',
                          desc: 'When you explicitly authorize us to share specific information.',
                        },
                      ].map((item, idx) => (
                        <li key={idx} className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                            {idx + 1}
                          </div>
                          <div>
                            <strong className="text-slate-800">{item.title}:</strong>{' '}
                            <span className="text-slate-700">{item.desc}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                {/* Data Retention */}
                <section id="data-retention" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-600">
                    Data Retention
                  </h2>
                  <div className="space-y-4">
                    <p className="text-slate-700 leading-relaxed">
                      We retain your data for as long as necessary to provide our services and comply with
                      legal obligations:
                    </p>
                    <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
                      <li>
                        <strong>Active Accounts:</strong> We retain all account data while your subscription is
                        active
                      </li>
                      <li>
                        <strong>Cancelled Accounts:</strong> Account data is retained for 30 days after
                        cancellation to allow reactivation
                      </li>
                      <li>
                        <strong>Deleted Accounts:</strong> All personal data is permanently deleted within 30
                        days of account deletion request
                      </li>
                      <li>
                        <strong>Sync Logs:</strong> Kept for 90 days for troubleshooting and analysis, then
                        automatically deleted
                      </li>
                      <li>
                        <strong>Billing Records:</strong> Retained for 7 years to comply with tax and
                        accounting regulations
                      </li>
                    </ul>
                  </div>
                </section>

                {/* Your Rights */}
                <section id="your-rights" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-600">
                    Your Rights and Choices
                  </h2>
                  <div className="space-y-6">
                    <p className="text-slate-700 leading-relaxed">
                      Depending on your location, you may have the following rights regarding your personal
                      data:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        {
                          title: 'Access',
                          desc: 'Request a copy of your personal data',
                          icon: '📄',
                        },
                        {
                          title: 'Correction',
                          desc: 'Update or correct inaccurate information',
                          icon: '✏️',
                        },
                        {
                          title: 'Deletion',
                          desc: 'Request deletion of your personal data',
                          icon: '🗑️',
                        },
                        {
                          title: 'Portability',
                          desc: 'Export your data in machine-readable format',
                          icon: '📦',
                        },
                        {
                          title: 'Objection',
                          desc: 'Object to certain data processing activities',
                          icon: '✋',
                        },
                        {
                          title: 'Restriction',
                          desc: 'Limit how we process your data',
                          icon: '⏸️',
                        },
                      ].map((right, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{right.icon}</span>
                            <div>
                              <h4 className="font-semibold text-slate-800">{right.title}</h4>
                              <p className="text-sm text-slate-600 mt-1">{right.desc}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                      <p className="text-slate-700 leading-relaxed">
                        <strong>How to Exercise Your Rights:</strong> You can access most of these features
                        directly through your account settings page, or contact us at{' '}
                        <a
                          href="mailto:support@basesync.app"
                          className="text-blue-600 hover:underline font-medium"
                        >
                          support@basesync.app
                        </a>
                        . We will respond within 30 days.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Cookies */}
                <section id="cookies" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-600">
                    Cookies and Tracking Technologies
                  </h2>
                  <div className="space-y-4">
                    <p className="text-slate-700 leading-relaxed">
                      We use cookies and similar tracking technologies to enhance your experience:
                    </p>

                    <div className="space-y-4">
                      <div className="border border-slate-200 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-800 mb-2">Essential Cookies</h4>
                        <p className="text-slate-700 text-sm">
                          Required for authentication and core functionality. These cannot be disabled.
                        </p>
                        <ul className="list-disc list-inside text-slate-700 text-sm mt-2 ml-2">
                          <li>Session authentication tokens</li>
                          <li>Security and fraud prevention</li>
                        </ul>
                      </div>

                      <div className="border border-slate-200 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-800 mb-2">Analytics Cookies</h4>
                        <p className="text-slate-700 text-sm">
                          Help us understand how users interact with BaseSync. We use privacy-respecting
                          analytics (Plausible) that don't track individuals.
                        </p>
                      </div>

                      <div className="border border-slate-200 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-800 mb-2">Preference Cookies</h4>
                        <p className="text-slate-700 text-sm">
                          Remember your settings and preferences (theme, notification preferences).
                        </p>
                      </div>
                    </div>

                    <p className="text-slate-700 text-sm leading-relaxed">
                      You can control cookies through your browser settings. Note that disabling essential
                      cookies may prevent you from using BaseSync.
                    </p>
                  </div>
                </section>

                {/* Children's Privacy */}
                <section id="childrens-privacy" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-600">
                    Children's Privacy
                  </h2>
                  <div className="space-y-4">
                    <p className="text-slate-700 leading-relaxed">
                      BaseSync is not intended for use by individuals under 18 years of age. We do not
                      knowingly collect personal information from children under 18.
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      If we become aware that we have collected personal data from a child under 18 without
                      parental consent, we will take steps to delete that information promptly. If you believe
                      we have collected information from a child, please contact us at{' '}
                      <a
                        href="mailto:support@basesync.app"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        support@basesync.app
                      </a>
                      .
                    </p>
                  </div>
                </section>

                {/* International Transfers */}
                <section id="international" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-600">
                    International Data Transfers
                  </h2>
                  <div className="space-y-4">
                    <p className="text-slate-700 leading-relaxed">
                      BaseSync operates globally and may transfer your information to countries other than your
                      own, including the United States. These countries may have different data protection laws
                      than your country of residence.
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      When we transfer your data internationally, we ensure appropriate safeguards are in place,
                      such as:
                    </p>
                    <ul className="list-disc list-inside text-slate-700 space-y-1 ml-4">
                      <li>Standard contractual clauses approved by regulatory authorities</li>
                      <li>Ensuring data recipients maintain adequate security standards</li>
                      <li>Compliance with frameworks like GDPR and CCPA where applicable</li>
                    </ul>
                  </div>
                </section>

                {/* Changes to Policy */}
                <section id="changes" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-600">
                    Changes to This Privacy Policy
                  </h2>
                  <div className="space-y-4">
                    <p className="text-slate-700 leading-relaxed">
                      We may update this Privacy Policy from time to time to reflect changes in our practices,
                      technology, legal requirements, or other factors.
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      When we make material changes, we will:
                    </p>
                    <ul className="list-disc list-inside text-slate-700 space-y-1 ml-4">
                      <li>Update the "Last Updated" date at the top of this policy</li>
                      <li>Notify you via email to your registered email address</li>
                      <li>Display a prominent notice on the BaseSync dashboard</li>
                    </ul>
                    <p className="text-slate-700 leading-relaxed">
                      Your continued use of BaseSync after changes are posted constitutes acceptance of the
                      updated policy.
                    </p>
                  </div>
                </section>

                {/* Contact */}
                <section id="contact" className="scroll-mt-28">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-600">
                    Contact Us
                  </h2>
                  <div className="space-y-4">
                    <p className="text-slate-700 leading-relaxed">
                      If you have questions, concerns, or requests regarding this Privacy Policy or our data
                      practices, please contact us:
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">📧</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Email</p>
                          <a
                            href="mailto:support@basesync.app"
                            className="text-blue-600 hover:underline"
                          >
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

                    <p className="text-slate-700 text-sm leading-relaxed">
                      We will respond to all legitimate requests within 30 days or as required by applicable
                      law.
                    </p>
                  </div>
                </section>
              </div>
            </div>

            {/* Legal Disclaimer Footer */}
            <div className="mt-6 bg-slate-100 border border-slate-200 rounded-lg p-6">
              <p className="text-slate-600 text-sm text-center">
                This Privacy Policy was last updated on February 8, 2026. By using BaseSync, you acknowledge
                that you have read and understood this policy.
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
