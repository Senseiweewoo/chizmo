'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChizzyMascot } from '@/components/brand/ChizzyMascot';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Check,
  X,
  Zap,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Flame,
  Brain,
  Layers,
  HeartHandshake,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FeatureComparison {
  name: string;
  free: string | boolean;
  pro: string | boolean;
  tooltip?: string;
}

const COMPARISON_FEATURES: FeatureComparison[] = [
  { name: 'Spaced Repetition Engine', free: 'FSRS-4.5 Standard', pro: 'FSRS-4.5 + Exam Surge Mode' },
  { name: 'Study Decks', free: 'Up to 5 decks', pro: 'Unlimited decks' },
  { name: 'AI Ingestion (PDF, PPTX, YouTube)', free: '10 generations / mo (max 10 pages)', pro: 'Unlimited (up to 100 pages/file)' },
  { name: 'Socratic AI Tutor', free: '5 hints / day', pro: 'Unlimited 24/7 Socratic coaching' },
  { name: 'Study Modes', free: 'All 6 interactive modes', pro: 'All 6 interactive modes + AI Weak-Spot Drill' },
  { name: 'Multiplayer Live Quizzes', free: 'Host up to 20 players', pro: 'Host up to 100 players with custom PINs' },
  { name: 'Banked Streak Freezes', free: '2 freezes max', pro: '4 freezes max + 48hr repair window' },
  { name: 'Executive Deck Summaries', free: 'Basic highlights', pro: 'Deep summaries & common exam pitfalls' },
  { name: 'Student Privacy & Ad-Free', free: true, pro: true },
];

function PricingPageContent() {
  const searchParams = useSearchParams();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    // Check current tier
    fetch('/api/user/subscription')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.entitlements?.tier === 'PRO') {
          setIsPro(true);
        }
      })
      .catch(() => {});

    // Check if query param upgraded is true
    if (searchParams.get('upgraded') === 'true') {
      setIsPro(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [searchParams]);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: billingCycle }),
      });
      const data = await res.json();
      if (data.success) {
        setIsPro(true);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
      }
    } catch (err) {
      console.error('Upgrade error', err);
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    {
      q: 'Can I cancel anytime?',
      a: 'Yes, absolutely. You can cancel with a single click inside your account settings at any time without talking to a representative or navigating confusing retention surveys.',
    },
    {
      q: 'How does the 7-day money-back guarantee work?',
      a: "If you don't love Chizmo Pro during your first 7 days, email support or tap refund in settings and we will refund 100% of your payment, no questions asked.",
    },
    {
      q: 'How do student discounts work?',
      a: 'Verified high-school and college students receive 50% off all annual plans ($19.99/yr) by connecting their student email (.edu or equivalent school domain).',
    },
    {
      q: 'Do you sell my study data or show ads?',
      a: 'Never. We uphold strict student privacy under COPPA and GDPR-K. We do not use third-party behavioral advertising trackers, and your uploaded notes are never sold to data brokers.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-obsidian-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header & Mascot */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-2">
            <ChizzyMascot mood={isPro ? 'supercharged' : 'excited'} size={88} animated />
          </div>
          <Badge variant="volt" className="px-3.5 py-1 text-xs uppercase tracking-wider font-extrabold">
            {isPro ? '⚡ You are on Chizmo Pro' : '⚡ Level Up Your Studying'}
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Invest in retention that actually lasts.
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Everything you need to master exams with science-backed FSRS-4.5 scheduling, Socratic tutoring, and unlimited AI generation.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center pt-4">
            <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl flex items-center gap-1 border border-slate-300 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-obsidian-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-chizmo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Annual</span>
                <span className="bg-volt-400 text-obsidian-950 text-xs px-2 py-0.5 rounded-full font-black uppercase">
                  Save 33%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Free Tier Card */}
          <div className="bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col justify-between shadow-sm">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Chizmo Free</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Perfect for casual learners and short-term study sessions.
                </p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white">$0</span>
                <span className="text-slate-500 font-semibold">/ forever</span>
              </div>

              <ul className="space-y-3.5 text-sm">
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Up to 5 active study decks</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>10 AI card generations per month</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>FSRS-4.5 spaced repetition scheduler</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>All 6 interactive study game modes</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>2 banked streak freezes</span>
                </li>
                <li className="flex items-center gap-3 text-slate-400 dark:text-slate-500 line-through">
                  <X className="w-5 h-5 text-slate-400 shrink-0" />
                  <span>Unlimited Socratic AI Tutor</span>
                </li>
                <li className="flex items-center gap-3 text-slate-400 dark:text-slate-500 line-through">
                  <X className="w-5 h-5 text-slate-400 shrink-0" />
                  <span>Exam Mode 96% retention surge</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Button
                variant="outline"
                className="w-full py-6 font-bold text-slate-700 dark:text-slate-300 rounded-2xl"
                disabled={!isPro}
              >
                {isPro ? 'Downgrade to Free' : 'Current Active Plan'}
              </Button>
            </div>
          </div>

          {/* Pro Tier Card */}
          <div className="bg-gradient-to-b from-chizmo-950 via-obsidian-900 to-obsidian-950 text-white border-2 border-chizmo-500/60 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            {/* Top highlight ribbon */}
            <div className="absolute top-0 right-0 bg-gradient-to-l from-volt-500 to-chizmo-500 text-obsidian-950 font-black text-xs px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider flex items-center gap-1.5 shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              Most Popular
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black text-white">Chizmo Pro</h3>
                  <Badge variant="volt" className="text-xs font-black">
                    POWER USER
                  </Badge>
                </div>
                <p className="text-sm text-slate-300 mt-1">
                  For students serious about acing exams with zero artificial limits.
                </p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-white">
                  {billingCycle === 'yearly' ? '$3.33' : '$4.99'}
                </span>
                <span className="text-slate-400 font-semibold">/ month</span>
                {billingCycle === 'yearly' && (
                  <span className="text-xs bg-chizmo-800/80 text-chizmo-200 px-2 py-1 rounded-lg border border-chizmo-600/40">
                    Billed $39.99 annually
                  </span>
                )}
              </div>

              <ul className="space-y-3.5 text-sm">
                <li className="flex items-center gap-3 text-slate-200">
                  <Check className="w-5 h-5 text-volt-400 shrink-0" />
                  <span className="font-semibold text-white">Unlimited study decks & cards</span>
                </li>
                <li className="flex items-center gap-3 text-slate-200">
                  <Check className="w-5 h-5 text-volt-400 shrink-0" />
                  <span className="font-semibold text-white">Unlimited AI Ingestion (up to 100-page files)</span>
                </li>
                <li className="flex items-center gap-3 text-slate-200">
                  <Check className="w-5 h-5 text-volt-400 shrink-0" />
                  <span>Unlimited 24/7 Socratic AI Tutor</span>
                </li>
                <li className="flex items-center gap-3 text-slate-200">
                  <Check className="w-5 h-5 text-volt-400 shrink-0" />
                  <span>Exam Mode dynamic retention surge (up to 96%)</span>
                </li>
                <li className="flex items-center gap-3 text-slate-200">
                  <Check className="w-5 h-5 text-volt-400 shrink-0" />
                  <span>4 Banked Streak Freezes & 48hr repair window</span>
                </li>
                <li className="flex items-center gap-3 text-slate-200">
                  <Check className="w-5 h-5 text-volt-400 shrink-0" />
                  <span>Multiplayer live rooms up to 100 players</span>
                </li>
                <li className="flex items-center gap-3 text-slate-200">
                  <Check className="w-5 h-5 text-volt-400 shrink-0" />
                  <span>Deep executive deck summaries & pitfall checks</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Button
                variant="volt"
                size="lg"
                className="w-full py-6 font-black text-obsidian-950 rounded-2xl text-base shadow-lg hover:scale-[1.02] transition-transform"
                onClick={handleUpgrade}
                disabled={loading || isPro}
              >
                {isPro ? (
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" /> Active Pro Member ⚡
                  </span>
                ) : loading ? (
                  'Activating Sandbox Pro...'
                ) : (
                  <span className="flex items-center gap-2">
                    Upgrade to Chizmo Pro <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
              <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> 7-day money-back guarantee • 1-click cancellation
              </p>
            </div>
          </div>
        </div>

        {/* Student Discount Banner */}
        <div className="bg-gradient-to-r from-chizmo-600/10 via-volt-500/10 to-indigo-600/10 border border-chizmo-500/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-chizmo-600/20 text-chizmo-600 dark:text-chizmo-400 flex items-center justify-center shrink-0">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Are you a student? Get 50% Off</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Secondary, high school, and university students get Chizmo Pro for just $1.66/month ($19.99/year).
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="shrink-0 font-bold border-chizmo-500/40 text-chizmo-600 dark:text-chizmo-400 hover:bg-chizmo-500/10"
            onClick={handleUpgrade}
          >
            Verify Student Email
          </Button>
        </div>

        {/* Detailed Feature Comparison Table */}
        <div className="bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Detailed Feature Matrix</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Compare plans side by side. No surprises, no dark patterns.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-xs">
                  <th className="py-3 px-4">Feature</th>
                  <th className="py-3 px-4">Free Plan</th>
                  <th className="py-3 px-4 text-chizmo-600 dark:text-volt-400 font-bold">Chizmo Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {COMPARISON_FEATURES.map((feat) => (
                  <tr key={feat.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">{feat.name}</td>
                    <td className="py-3.5 px-4">
                      {typeof feat.free === 'boolean' ? (
                        feat.free ? <Check className="w-5 h-5 text-emerald-500" /> : <X className="w-5 h-5 text-slate-400" />
                      ) : (
                        <span>{feat.free}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-chizmo-600 dark:text-volt-400">
                      {typeof feat.pro === 'boolean' ? (
                        feat.pro ? <Check className="w-5 h-5 text-volt-500" /> : <X className="w-5 h-5 text-slate-400" />
                      ) : (
                        <span>{feat.pro}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQs Section */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Frequently Asked Questions</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Clear answers to help you make an informed decision.
            </p>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left font-bold text-slate-900 dark:text-white flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>
                  {isOpen && (
                    <div className="p-5 pt-0 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Ethical Commitment Footer Card */}
        <div className="bg-slate-100 dark:bg-obsidian-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-chizmo-600 dark:text-chizmo-400 font-extrabold text-sm">
            <HeartHandshake className="w-5 h-5" />
            <span>Our Ethical Promise</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            We built Chizmo to help you truly learn, not to trap you with dark patterns or predatory auto-billing. We protect quiet hours, don't spam late-night notifications, and offer zero-friction cancellation.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-obsidian-950">
          <div className="animate-pulse text-sm font-bold text-slate-500">Loading Chizmo Plans...</div>
        </div>
      }
    >
      <PricingPageContent />
    </Suspense>
  );
}
