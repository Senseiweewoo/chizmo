'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChizzyMascot } from '@/components/brand/ChizzyMascot';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  Zap,
  Flame,
  FileText,
  Youtube,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Brain,
  Layers,
  Radio,
  Clock,
} from 'lucide-react';

export default function HomePage() {
  const [topicInput, setTopicInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const sampleDecks = [
    {
      id: 'bio-demo',
      title: 'AP Biology: Cellular Respiration & Photosynthesis',
      cardCount: 24,
      dueToday: 7,
      retentionRate: 91,
      color: '#10B981',
      tags: ['Biology', 'AP Exam', 'High-Yield'],
    },
    {
      id: 'sat-demo',
      title: 'SAT High-Yield Vocabulary',
      cardCount: 45,
      dueToday: 12,
      retentionRate: 88,
      color: '#6366F1',
      tags: ['SAT', 'Verbal', 'Active Recall'],
    },
  ];

  const handleQuickGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim()) return;
    setIsGenerating(true);
    // Redirect to create flow with prefilled topic
    window.location.href = `/create?topic=${encodeURIComponent(topicInput)}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hero & Mascot Greeting */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-chizmo-900 via-chizmo-800 to-obsidian-950 text-white p-8 sm:p-12 shadow-xl border border-chizmo-700/50">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-volt-500/10 border border-volt-500/30 text-volt-400 text-xs font-bold tracking-wide uppercase">
            <Zap className="w-3.5 h-3.5 fill-volt-400" />
            Spaced Repetition + AI Generation
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Make studying feel like a game{' '}
            <span className="bg-gradient-to-r from-volt-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
              you actually want to play.
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
            Turn notes, PDFs, YouTube videos, or any topic into active-recall flashcards in under 60
            seconds. Never cram again with scientific FSRS-4.5 scheduling.
          </p>

          {/* Instant Generator Input Box */}
          <form onSubmit={handleQuickGenerate} className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="What are you studying? e.g. Mitosis, Calculus Derivatives..."
                className="w-full h-13 pl-4 pr-12 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-volt-400 text-sm sm:text-base backdrop-blur-sm"
              />
              <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-volt-400 pointer-events-none" />
            </div>
            <Button
              type="submit"
              variant="volt"
              size="lg"
              isLoading={isGenerating}
              className="sm:w-auto w-full"
            >
              Generate Deck ⚡
            </Button>
          </form>

          {/* Quick Import Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-300 font-medium">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-volt-400 text-obsidian-950 font-black hover:bg-volt-300 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" /> 60s Fast Start Quiz
            </Link>
            <span className="text-slate-400">Import anything:</span>
            <Link
              href="/create?type=pdf"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" /> PDF / Notes
            </Link>
            <Link
              href="/create?type=youtube"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Youtube className="w-3.5 h-3.5" /> YouTube
            </Link>
            <Link
              href="/live"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-volt-300"
            >
              <Radio className="w-3.5 h-3.5" /> Live Quiz Arena
            </Link>
          </div>
        </div>

        {/* Mascot Mascot Floating Ornament */}
        <div className="hidden lg:block absolute right-12 bottom-6 pointer-events-none animate-float">
          <ChizzyMascot size={180} mood="excited" />
        </div>
      </section>

      {/* Daily Progress & Retention Telemetry */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
            <Flame className="w-6 h-6 fill-amber-500" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Study Streak</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">3 Days 🔥</div>
            <div className="text-xs text-slate-400">1 freeze banked</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-chizmo-500/10 text-chizmo-600 dark:text-chizmo-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cards Due Today</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">19 Cards</div>
            <div className="text-xs text-emerald-600 font-medium">Estimated 6 mins</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Memory Stability</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">90.2% R</div>
            <div className="text-xs text-slate-400">FSRS Target: 90%</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600">
            <Zap className="w-6 h-6 fill-purple-500" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Level 2 Scholar</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">120 XP</div>
            <div className="text-xs text-slate-400">30 XP to Level 3</div>
          </div>
        </Card>
      </section>

      {/* Ready to Study Decks */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Today's Daily Queue</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Interleaved cards calculated by FSRS-4.5 based on forgetting curve stability.
            </p>
          </div>
          <Link href="/library" className="text-sm font-semibold text-chizmo-600 dark:text-chizmo-400 hover:underline flex items-center gap-1">
            View All Decks <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sampleDecks.map((deck) => (
            <Card key={deck.id} hoverLift className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: deck.color }}
                    />
                    <div className="flex gap-1.5">
                      {deck.tags.map((tag) => (
                        <Badge key={tag} variant="slate">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Badge variant="volt">
                    {deck.dueToday} due
                  </Badge>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {deck.title}
                </h3>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" /> {deck.cardCount} cards
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <Brain className="w-3.5 h-3.5" /> {deck.retentionRate}% stability
                  </span>
                </div>

                <Link href={`/study/${deck.id}`}>
                  <Button size="sm" variant="primary">
                    Study Now <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Feature Navigation Highlights */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
        <Link href="/create" className="group">
          <Card hoverLift className="space-y-3 h-full">
            <div className="p-3 w-fit rounded-2xl bg-chizmo-100 dark:bg-chizmo-950 text-chizmo-600 dark:text-chizmo-400 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">AI Card Studio</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Upload lectures, PDFs, or slides. Generate grounded atomic cards with automatic critic review.
            </p>
          </Card>
        </Link>

        <Link href="/live" className="group">
          <Card hoverLift className="space-y-3 h-full">
            <div className="p-3 w-fit rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <Radio className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">Chizmo Live Arena</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Host live multiplayer Kahoot-style quiz rooms with 6-digit codes. Missed cards save straight to decks.
            </p>
          </Card>
        </Link>

        <Link href="/tutor" className="group">
          <Card hoverLift className="space-y-3 h-full">
            <div className="p-3 w-fit rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white">Socratic AI Tutor</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Chizzy guides you through difficult concepts and exam problems without just handing over the homework answers.
            </p>
          </Card>
        </Link>
      </section>
    </div>
  );
}
