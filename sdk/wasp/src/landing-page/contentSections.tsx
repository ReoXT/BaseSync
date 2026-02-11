import daBoiAvatar from "../client/static/da-boi.webp";
import kivo from "../client/static/examples/kivo.webp";
import messync from "../client/static/examples/messync.webp";
import microinfluencerClub from "../client/static/examples/microinfluencers.webp";
import promptpanda from "../client/static/examples/promptpanda.webp";
import reviewradar from "../client/static/examples/reviewradar.webp";
import scribeist from "../client/static/examples/scribeist.webp";
import searchcraft from "../client/static/examples/searchcraft.webp";
import { BlogUrl, DocsUrl } from "../shared/common";
import type { GridFeature } from "./components/FeaturesGrid";

export const features: GridFeature[] = [
  {
    name: "Cool Feature 1",
    description: "Your feature",
    emoji: "🤝",
    href: DocsUrl,
    size: "small",
  },
  {
    name: "Cool Feature 2",
    description: "Feature description",
    emoji: "🔐",
    href: DocsUrl,
    size: "small",
  },
  {
    name: "Cool Feature 3",
    description: "Describe your cool feature here",
    emoji: "🥞",
    href: DocsUrl,
    size: "medium",
  },
  {
    name: "Cool Feature 4",
    description: "Describe your cool feature here",
    emoji: "💸",
    href: DocsUrl,
    size: "large",
  },
  {
    name: "Cool Feature 5",
    description: "Describe your cool feature here",
    emoji: "💼",
    href: DocsUrl,
    size: "large",
  },
  {
    name: "Cool Feature 6",
    description: "It is cool",
    emoji: "📈",
    href: DocsUrl,
    size: "small",
  },
  {
    name: "Cool Feature 7",
    description: "Cool feature",
    emoji: "📧",
    href: DocsUrl,
    size: "small",
  },
  {
    name: "Cool Feature 8",
    description: "Describe your cool feature here",
    emoji: "🤖",
    href: DocsUrl,
    size: "medium",
  },
  {
    name: "Cool Feature 9",
    description: "Describe your cool feature here",
    emoji: "🚀",
    href: DocsUrl,
    size: "medium",
  },
];

export const testimonials = [
  {
    name: "Da Boi",
    role: "Wasp Mascot",
    avatarSrc: daBoiAvatar,
    socialUrl: "https://twitter.com/wasplang",
    quote: "I don't even know how to code. I'm just a plushie.",
  },
  {
    name: "Mr. Foobar",
    role: "Founder @ Cool Startup",
    avatarSrc: daBoiAvatar,
    socialUrl: "",
    quote: "This product makes me cooler than I already am.",
  },
  {
    name: "Jamie",
    role: "Happy Customer",
    avatarSrc: daBoiAvatar,
    socialUrl: "#",
    quote: "My cats love it!",
  },
];

export const faqs = [
  {
    id: 1,
    question: "How is this different from Zapier?",
    answer: "Zapier can only do one way sync and doesn't handle linked records properly. BaseSync offers true bidirectional sync, displays linked records as actual names (not cryptic IDs like 'rec123abc'), syncs historical data in bulk, and handles attachments correctly. Plus, Zapier's two opposite Zaps create infinite loops, BaseSync has smart conflict resolution built in.",
  },
  {
    id: 2,
    question: "Is my data secure?",
    answer: "Absolutely. We use OAuth 2.0 for authentication, we never see your Airtable or Google passwords. Your credentials are encrypted at rest, and we only access the specific bases and spreadsheets you authorize. All data transfers use HTTPS encryption, and we're SOC 2 compliant.",
  },
  {
    id: 3,
    question: "What happens if both sides change the same record?",
    answer: "You choose the conflict resolution strategy when setting up your sync: Airtable wins, Sheets wins, or Newest wins (the most recent change takes precedence). BaseSync tracks modification timestamps to detect conflicts automatically and applies your chosen strategy seamlessly.",
  },
  {
    id: 4,
    question: "Can I sync multiple tables?",
    answer: "Yes! Create a separate sync configuration for each Airtable table and Google Sheet pair you want to sync. On the Pro plan you can have up to 3 active syncs, and on the Business plan you can have up to 10.",
  },
  {
    id: 5,
    question: "What about Airtable views vs tables?",
    answer: "Currently, BaseSync syncs entire Airtable tables (not filtered views). We sync all records that match your field mappings. Filtered views and custom query support is on our roadmap, if this is critical for you, reach out to us!",
  },
  {
    id: 6,
    question: "Why is BaseSync cheaper than Unito?",
    answer: "We're specialists. Unito connects 60+ different tools, so they need to maintain integrations for everything. We do one thing, Airtable ↔ Google Sheets and do it exceptionally well. This focus lets us offer better performance, more features (like linked record names), and lower prices.",
  },
  {
    id: 7,
    question: "What happens if I exceed my record limit?",
    answer: "We'll notify you when you hit 80% of your monthly record limit, giving you time to upgrade. At 100%, syncs will pause automatically, but your data stays completely safe. You can upgrade instantly to resume syncing, or wait until the next billing cycle when your limit resets.",
  },
  {
    id: 8,
    question: "Can I change plans anytime?",
    answer: "Yes! You can upgrade to a higher plan instantly and the change takes effect immediately. If you downgrade to a lower plan, the change will apply at the end of your current billing cycle so you can use what you've already paid for.",
  },
  {
    id: 9,
    question: "Is there a free trial?",
    answer: "Yes! All new users get a 14-day free trial with full Pro tier features (3 syncs, 5,000 records, 5-minute interval). You won't be charged until your trial ends. Cancel anytime during the trial at no cost.",
  },
];

export const footerNavigation = {
  app: [],
  company: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

export const examples = [
  {
    name: "Example #1",
    description: "Describe your example here.",
    imageSrc: kivo,
    href: "#",
  },
  {
    name: "Example #2",
    description: "Describe your example here.",
    imageSrc: messync,
    href: "#",
  },
  {
    name: "Example #3",
    description: "Describe your example here.",
    imageSrc: microinfluencerClub,
    href: "#",
  },
  {
    name: "Example #4",
    description: "Describe your example here.",
    imageSrc: promptpanda,
    href: "#",
  },
  {
    name: "Example #5",
    description: "Describe your example here.",
    imageSrc: reviewradar,
    href: "#",
  },
  {
    name: "Example #6",
    description: "Describe your example here.",
    imageSrc: scribeist,
    href: "#",
  },
  {
    name: "Example #7",
    description: "Describe your example here.",
    imageSrc: searchcraft,
    href: "#",
  },
];
