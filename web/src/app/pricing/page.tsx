"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Crown,
  Flame,
  Zap,
  BookOpen,
  Briefcase,
  Key,
  HelpCircle,
  ShieldCheck,
  Wallet,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import type { FeaturedTier } from "@/lib/featured-pricing";

interface ProductData {
  id: string;
  label: string;
  priceXlm: number;
  durationDays: number | null;
  memoPrefix: string;
  tiers?: FeaturedTier[];
}

interface PricingApiResponse {
  currency: string;
  products: Record<string, ProductData>;
}

// Fallback products based on default config in lib/pricing.ts
const DEFAULT_PRODUCTS: Record<string, ProductData> = {
  spotlight: {
    id: "spotlight",
    label: "Featured spotlight",
    priceXlm: 50,
    durationDays: 30,
    memoPrefix: "spotlight",
    tiers: [
      { days: 7, priceXlm: 15 },
      { days: 30, priceXlm: 50 },
      { days: 90, priceXlm: 120 },
    ],
  },
  hero_sponsor: {
    id: "hero_sponsor",
    label: "Homepage hero sponsor (1 week)",
    priceXlm: 150,
    durationDays: 7,
    memoPrefix: "hero",
  },
  category_sponsor: {
    id: "category_sponsor",
    label: "Category sponsor (1 week)",
    priceXlm: 40,
    durationDays: 7,
    memoPrefix: "cat",
  },
  pro: {
    id: "pro",
    label: "Pro project (1 year)",
    priceXlm: 200,
    durationDays: 365,
    memoPrefix: "pro",
  },
  project_story: {
    id: "project_story",
    label: "Sponsored project story",
    priceXlm: 60,
    durationDays: null,
    memoPrefix: "story",
  },
  job_post: {
    id: "job_post",
    label: "Job post (30 days)",
    priceXlm: 30,
    durationDays: 30,
    memoPrefix: "job",
  },
  api_pro: {
    id: "api_pro",
    label: "API Pro key (30 days)",
    priceXlm: 25,
    durationDays: 30,
    memoPrefix: "api",
  },
  priority_review: {
    id: "priority_review",
    label: "Priority review",
    priceXlm: 20,
    durationDays: null,
    memoPrefix: "prio",
  },
};

interface ProductCardConfig {
  id: string;
  icon: typeof Sparkles;
  description: string;
  benefits: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
  category: "Growth & Visibility" | "Community & Editorial" | "Developer & Platform";
}

const PRODUCT_CARDS: ProductCardConfig[] = [
  {
    id: "spotlight",
    icon: Sparkles,
    description:
      "Boost your project to the top of exploration pages and rotate through the homepage hero carousel.",
    benefits: [
      "Homepage carousel rotation",
      "Guaranteed top slot in exploration lists",
      "Distinctive 'Featured' visual highlight",
      "Flexible 7 days, 30 days, or 90 days duration tiers",
    ],
    ctaLabel: "Boost Project",
    ctaHref: "/my-projects",
    highlighted: true,
    category: "Growth & Visibility",
  },
  {
    id: "hero_sponsor",
    icon: Crown,
    description:
      "Claim the most prominent placement on Stellar Wave Hub with an exclusive 1-week homepage banner.",
    benefits: [
      "Exclusive prime homepage banner",
      "Maximum visibility to all ecosystem visitors",
      "Direct call-to-action link to your website or app",
      "Weekly reservation with verified on-chain booking",
    ],
    ctaLabel: "Book Hero Banner",
    ctaHref: "/my-projects",
    highlighted: true,
    category: "Growth & Visibility",
  },
  {
    id: "category_sponsor",
    icon: Flame,
    description:
      "Pin your brand or project at the top of a specific category for a full week.",
    benefits: [
      "Top-of-category dedicated sponsor badge",
      "Targeted audience reach within your niche",
      "7-day exclusive slot for your category",
      "Includes project summary and direct outbound link",
    ],
    ctaLabel: "Sponsor Category",
    ctaHref: "/explore",
    category: "Growth & Visibility",
  },
  {
    id: "pro",
    icon: Zap,
    description:
      "Elevate your project with an annual Pro subscription, verified badges, and embeddable widgets.",
    benefits: [
      "Official Pro Verified badge across the directory",
      "Detailed visitor and rating analytics",
      "Custom embeddable rating & review widgets",
      "Priority inclusion in ecosystem digests",
    ],
    ctaLabel: "Upgrade to Pro",
    ctaHref: "/my-projects",
    highlighted: true,
    category: "Developer & Platform",
  },
  {
    id: "project_story",
    icon: BookOpen,
    description:
      "An in-depth, dedicated editorial case study published on the official Stellar Wave Blog.",
    benefits: [
      "Long-form deep dive written by ecosystem writers",
      "Permanent publication on the official blog",
      "Social amplification across community channels",
      "High-authority backlinks to your repository and docs",
    ],
    ctaLabel: "Pitch Story",
    ctaHref: "/blogs",
    category: "Community & Editorial",
  },
  {
    id: "job_post",
    icon: Briefcase,
    description:
      "Attract skilled Rust, Soroban, and Stellar developers with a 30-day listing on the hub.",
    benefits: [
      "Targeted reach to active Stellar builders",
      "30-day active listing on the hub",
      "Direct link to your application portal or email",
      "Featured inclusion in weekly job alerts",
    ],
    ctaLabel: "Post a Job",
    ctaHref: "/submit",
    category: "Community & Editorial",
  },
  {
    id: "api_pro",
    icon: Key,
    description:
      "Supercharge your integrations with a high-throughput commercial API key.",
    benefits: [
      "10x higher rate limits across all public endpoints",
      "Unrestricted access to historical ratings and metrics",
      "Priority webhook notifications for ecosystem events",
      "Dedicated developer support channel",
    ],
    ctaLabel: "Get API Pro",
    ctaHref: "/profile",
    category: "Developer & Platform",
  },
  {
    id: "priority_review",
    icon: Clock,
    description:
      "Fast-track your submission or update to be reviewed by maintainers within 24 hours.",
    benefits: [
      "Guaranteed review turnaround under 24 hours",
      "Direct technical feedback from core maintainers",
      "Expedited queue bypass for time-sensitive launches",
      "Immediate re-review upon making requested fixes",
    ],
    ctaLabel: "Submit with Priority",
    ctaHref: "/submit",
    category: "Developer & Platform",
  },
];

const FAQS = [
  {
    question: "How do XLM payments work on Stellar Wave Hub?",
    answer:
      "All services on Stellar Wave Hub are paid directly on-chain using Stellar Lumens (XLM). When you select a service, our system generates a unique transaction memo (e.g. hero:2026-11-23 or cat:defi:42). Stellar text memos are limited to 28 bytes and are used by our backend to match your on-chain payment with your account and requested service. Payments settle within 3-5 seconds with negligible network fees (< 0.00001 XLM). You can pay using Freighter wallet, Lobstr, Albedo, or any standard Stellar keypair.",
  },
  {
    question: "What is your refunds policy?",
    answer:
      "Because Stellar blockchain transactions are decentralized and irreversible once included in a ledger, on-chain payments cannot be automatically rolled back. However, if a paid service fails to activate due to a technical error, or if your submission is rejected during priority review, our maintainers will inspect the transaction hash and either issue a manual XLM refund to your payment address or provide equivalent platform credit. If you have any issue, contact support or open a GitHub discussion with your transaction hash.",
  },
  {
    question: "How are the product prices configured?",
    answer:
      "All prices are configured through environment variables with sensible platform defaults and are served directly by our public GET /api/pricing endpoint. This ensures that the prices you see on this page match the exact amount verified by our payment listeners on the Stellar network.",
  },
  {
    question: "Can I upgrade or extend my duration?",
    answer:
      "Yes. For recurring services such as Spotlight or Sponsorships, you can renew or extend your duration at any time. When extending an active period, the new duration will be appended to your remaining active time without disruption.",
  },
];

export default function PricingPage() {
  const [products, setProducts] = useState<Record<string, ProductData>>(DEFAULT_PRODUCTS);
  const [currency, setCurrency] = useState<string>("XLM");
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSpotlightTier, setSelectedSpotlightTier] = useState<number>(30);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/pricing")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load pricing config");
        return res.json() as Promise<PricingApiResponse>;
      })
      .then((data) => {
        if (isMounted && data.products) {
          setProducts(data.products);
          if (data.currency) setCurrency(data.currency);
        }
      })
      .catch((err) => {
        console.warn("Using fallback pricing config:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Spotlight pricing can adapt to duration tier
  const spotlightProduct = products.spotlight || DEFAULT_PRODUCTS.spotlight;
  const spotlightTiers = spotlightProduct.tiers || [
    { days: 7, priceXlm: 15 },
    { days: 30, priceXlm: 50 },
    { days: 90, priceXlm: 120 },
  ];
  const activeSpotlightTier =
    spotlightTiers.find((t) => t.days === selectedSpotlightTier) || spotlightTiers[1];

  return (
    <div className="relative min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      {/* Background radial highlight */}
      <div className="max-w-7xl mx-auto">
        {/* Header section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-nova/10 border border-nova/30 text-nova-bright text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-4 h-4" />
            Transparent On-Chain Pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight text-starlight mb-6">
            Grow your project in the{" "}
            <span className="text-gradient-nova">Stellar Ecosystem</span>
          </h1>
          <p className="text-lg text-moonlight leading-relaxed">
            Transparent, fixed prices payable directly in {currency}. Every service is verified
            on-chain and linked to your Stellar Wave project.
          </p>
          {loading && (
            <p className="text-xs text-ash mt-3 animate-pulse">
              Syncing live prices from /api/pricing...
            </p>
          )}
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {PRODUCT_CARDS.map((cardConfig) => {
            const product = products[cardConfig.id] || DEFAULT_PRODUCTS[cardConfig.id];
            const Icon = cardConfig.icon;
            const isSpotlight = cardConfig.id === "spotlight";
            const price = isSpotlight ? activeSpotlightTier.priceXlm : product?.priceXlm ?? 0;
            const durationLabel = isSpotlight
              ? `${activeSpotlightTier.days} days`
              : product?.durationDays
              ? `${product.durationDays} days`
              : "one-off";

            return (
              <div
                key={cardConfig.id}
                className={`relative flex flex-col justify-between rounded-2xl glass p-6 transition-all duration-300 hover:scale-[1.02] ${
                  cardConfig.highlighted
                    ? "border-nova/50 shadow-lg shadow-nova/10 glow-nova"
                    : "border-dust/40 hover:border-dust"
                }`}
              >
                {cardConfig.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-nova to-plasma text-[11px] font-bold text-white tracking-wider uppercase">
                    Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-stardust/80 text-nova-bright border border-nova/20">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-void/60 text-ash border border-dust/30">
                      {cardConfig.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-starlight mb-2">
                    {product?.label || cardConfig.id}
                  </h3>
                  <p className="text-xs text-moonlight/80 mb-6 min-h-[36px]">
                    {cardConfig.description}
                  </p>

                  {/* Spotlight duration tier selector */}
                  {isSpotlight && (
                    <div className="mb-4 p-1.5 rounded-lg bg-void/80 border border-dust/40 flex items-center justify-between gap-1">
                      {spotlightTiers.map((tier) => (
                        <button
                          key={tier.days}
                          type="button"
                          onClick={() => setSelectedSpotlightTier(tier.days)}
                          className={`flex-1 py-1 px-1.5 text-[11px] font-medium rounded-md transition-all ${
                            activeSpotlightTier.days === tier.days
                              ? "bg-nova text-white font-semibold shadow-sm"
                              : "text-ash hover:text-starlight"
                          }`}
                        >
                          {tier.days}d
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Price display */}
                  <div className="mb-6 flex items-baseline gap-1.5">
                    <span className="text-3xl font-display font-black text-starlight tracking-tight">
                      {price}
                    </span>
                    <span className="text-sm font-bold text-nova-bright">{currency}</span>
                    <span className="text-xs text-ash">/ {durationLabel}</span>
                  </div>

                  {/* Benefits bullet list */}
                  <div className="space-y-2.5 mb-6 pt-4 border-t border-dust/30">
                    {cardConfig.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-moonlight">
                        <CheckCircle2 className="w-3.5 h-3.5 text-aurora-bright shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card CTA */}
                <Link
                  href={cardConfig.ctaHref}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    cardConfig.highlighted
                      ? "btn-nova"
                      : "bg-stardust/80 hover:bg-stardust text-starlight border border-dust/40 hover:border-nova/40"
                  }`}
                >
                  {cardConfig.ctaLabel}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* How It Works & Payment Steps */}
        <div className="rounded-2xl glass p-8 sm:p-10 mb-20 border border-dust/30">
          <div className="max-w-2xl mb-8">
            <h2 className="text-2xl font-bold text-starlight mb-2 flex items-center gap-2">
              <Wallet className="w-6 h-6 text-solar" />
              How XLM Payments Work
            </h2>
            <p className="text-sm text-moonlight">
              Stellar Wave Hub utilizes fast, trustless native Stellar transactions. No card
              processors or middleman fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-void/50 border border-dust/30">
              <div className="w-8 h-8 rounded-lg bg-nova/20 text-nova-bright flex items-center justify-center font-bold text-sm mb-3">
                1
              </div>
              <h4 className="font-semibold text-sm text-starlight mb-1">Pick Your Product</h4>
              <p className="text-xs text-ash leading-relaxed">
                Choose the sponsorship slot, spotlight tier, or developer feature you wish to
                purchase from the catalog above.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-void/50 border border-dust/30">
              <div className="w-8 h-8 rounded-lg bg-nova/20 text-nova-bright flex items-center justify-center font-bold text-sm mb-3">
                2
              </div>
              <h4 className="font-semibold text-sm text-starlight mb-1">Send with Text Memo</h4>
              <p className="text-xs text-ash leading-relaxed">
                Send the exact XLM amount to the platform address, including the required 28-byte
                text memo (e.g. <code className="text-plasma">hero:2026-11-23</code> or{" "}
                <code className="text-plasma">spotlight:101</code>).
              </p>
            </div>
            <div className="p-5 rounded-xl bg-void/50 border border-dust/30">
              <div className="w-8 h-8 rounded-lg bg-nova/20 text-nova-bright flex items-center justify-center font-bold text-sm mb-3">
                3
              </div>
              <h4 className="font-semibold text-sm text-starlight mb-1">Instant Activation</h4>
              <p className="text-xs text-ash leading-relaxed">
                Our listener verifies your transaction within seconds on the Stellar network and
                automatically activates your product.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-starlight mb-3 flex items-center justify-center gap-2">
              <HelpCircle className="w-7 h-7 text-plasma" />
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-moonlight">
              Clear information regarding on-chain payments, memo formats, and our refund policy.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => (
              <div
                key={index}
                className="p-6 rounded-xl glass border border-dust/30 hover:border-dust transition-colors"
              >
                <h3 className="text-base font-semibold text-starlight mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-aurora shrink-0" />
                  {faq.question}
                </h3>
                <p className="text-sm text-moonlight/90 leading-relaxed pl-6">{faq.answer}</p>
              </div>
            ))}
          </div>

          {/* Refund Notice Callout */}
          <div className="mt-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <strong className="text-amber-300 font-semibold">Important Refund Policy Notice:</strong>{" "}
              Due to blockchain finality, Stellar payments cannot be refunded automatically. If you
              experience an error with activation or have an issue with your order, please reach out to our
              maintainers with your transaction hash for a manual review and refund.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
