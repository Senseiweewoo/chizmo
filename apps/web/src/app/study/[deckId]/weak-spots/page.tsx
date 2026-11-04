'use client';

import React, { useEffect, useState, use, useCallback } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { ChizzyMascot } from '@/components/brand/ChizzyMascot';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  Flame,
  Zap,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  ChevronRight,
  TrendingDown,
  Volume2,
} from 'lucide-react';
import { Rating } from '@chizmo/core';

interface WeakSpotItem {
  card: {
    id: string;
    deckId: string;
    front: string;
    back: string;
    hint?: string | null;
    explanation?: string | null;
  };
  deckTitle: string;
  deckColor: string;
  state: {
    id: string;
    cardId: string;
    state: string;
    stability: number;
    difficulty: number;
    reps: number;
    lapses: number;
  };
  lapses: number;
  difficulty: number;
  isLeech: boolean;
  retrievability: number;
}

export default function WeakSpotsStudyPage({ params }: { params: Promise<{ deckId: string }> }) {
  const resolvedParams = use(params);
  const deckId = resolvedParams.deckId;

  const [queue, setQueue] = useState<WeakSpotItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  // Fetch weak spots
  useEffect(() => {
    fetch(`/api/study/weak-spots?deckId=${deckId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.weakSpots && data.weakSpots.length > 0) {
          setQueue(data.weakSpots);
        } else {
          // If no specific weak spots, load cards from deck to practice challenging items
          fetch(`/api/decks/${deckId}/cards`)
            .then((r) => r.json())
            .then((cData) => {
              if (cData.success && cData.cards) {
                const synthetic: WeakSpotItem[] = cData.cards.map((c: any) => ({
                  card: c,
                  deckTitle: cData.deckTitle || 'Deck',
                  deckColor: '#6366F1',
                  state: {
                    id: `st-${c.id}`,
                    cardId: c.id,
                    state: 'REVIEW',
                    stability: 1.0,
                    difficulty: 6.0,
                    reps: 1,
                    lapses: 0,
                  },
                  lapses: 0,
                  difficulty: 6.0,
                  isLeech: false,
                  retrievability: 60,
                }));
                setQueue(synthetic);
              }
            });
        }
      })
      .finally(() => setIsLoading(false));
  }, [deckId]);

  const currentItem = queue[currentIndex];

  const handleRate = async (rating: Rating) => {
    if (!currentItem) return;

    // Send review log to API
    fetch('/api/study/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId: currentItem.card.id,
        deckId: currentItem.card.deckId,
        rating,
        responseMs: 1200,
      }),
    }).catch(() => {});

    setReviewedCount((c) => c + 1);

    // If rated Again, requeue card at end of queue
    if (rating === Rating.Again) {
      setQueue((prev) => [...prev, currentItem]);
    }

    // Advance to next
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((idx) => idx + 1);
      setIsFlipped(false);
      setShowHint(false);
      setAiSuggestion(null);
    } else {
      setIsSessionComplete(true);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#EF4444', '#F59E0B', '#10B981', '#6366F1'],
      });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading || isSessionComplete || !currentItem) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (isFlipped) {
        if (e.key === '1') handleRate(Rating.Again);
        if (e.key === '2') handleRate(Rating.Hard);
        if (e.key === '3') handleRate(Rating.Good);
        if (e.key === '4') handleRate(Rating.Easy);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, isSessionComplete, currentItem, isFlipped]);

  const handleAiRewriteSuggestion = () => {
    if (!currentItem) return;
    setIsRewriting(true);
    // Simulate smart AI advice for leech cards
    setTimeout(() => {
      const suggestions = [
        `Mnemonic Trick: Associate "${currentItem.card.front.slice(0, 15)}" with a vivid visual anchor.`,
        `Decomposition: Try breaking "${currentItem.card.front}" into two smaller questions: what causes it, and what is its primary effect?`,
        `Context Bridge: Contrast "${currentItem.card.front}" directly against its opposite to anchor the distinction.`,
      ];
      setAiSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)]);
      setIsRewriting(false);
    }, 600);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="flex flex-col items-center gap-4">
          <ChizzyMascot mood="thinking" size={80} animated />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">
            Diagnosing Weak Spots & Lapses...
          </p>
        </div>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4 pt-16">
        <ChizzyMascot mood="celebrating" size={90} />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Zero Weak Spots! 🎯</h2>
        <p className="text-sm text-slate-500">
          Incredible mastery! You have no lapses or high-difficulty cards pending in this deck.
        </p>
        <Link href={`/decks/${deckId}`}>
          <Button variant="volt">Back to Deck Studio</Button>
        </Link>
      </div>
    );
  }

  // Session completed view
  if (isSessionComplete) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-6 pt-12 animate-in zoom-in-95">
        <ChizzyMascot mood="celebrating" size={100} animated />

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Weak Spots Calibrated! ⚡
          </h1>
          <p className="text-xs text-slate-500">
            You hammered through <strong>{reviewedCount}</strong> tough cards. FSRS has adjusted your intervals to prevent future forgetting.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-left space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
            <Sparkles className="w-4 h-4" /> Spaced Repetition Update
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Cards you rated <strong>Again</strong> will recur today during your intra-day learning steps, while cards graduated will be tested right before your forgetting curve drops.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link href={`/study/${deckId}`}>
            <Button variant="volt" size="lg" className="w-full font-bold shadow-lg shadow-volt-500/25">
              Study Normal Queue
            </Button>
          </Link>
          <Link href={`/decks/${deckId}`}>
            <Button variant="outline" size="md" className="w-full">
              Deck Studio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 pb-20">
      {/* Top Navigation & Diagnostic Banner */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/decks/${deckId}`}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </Link>

        <div className="flex items-center gap-2">
          <Badge variant="danger" className="text-xs font-bold flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" /> Weak Spots Drill
          </Badge>
          <span className="text-xs font-semibold text-slate-500">
            {currentIndex + 1} / {queue.length}
          </span>
        </div>
      </div>

      {/* Card Diagnostic Pills */}
      {currentItem && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40 rounded-2xl">
          <div className="flex items-center gap-2">
            {currentItem.isLeech ? (
              <Badge variant="danger" className="animate-pulse">
                🚨 Leech ({currentItem.lapses} Lapses)
              </Badge>
            ) : currentItem.lapses > 0 ? (
              <Badge variant="warning">
                ⚠️ {currentItem.lapses} Previous {currentItem.lapses === 1 ? 'Lapse' : 'Lapses'}
              </Badge>
            ) : (
              <Badge variant="indigo">High Difficulty Concept</Badge>
            )}

            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Diff: <strong>{currentItem.difficulty.toFixed(1)}/10</strong>
            </span>
          </div>

          <div className="text-xs font-bold text-slate-500">
            Retention Gauge: <span className="text-red-500">{currentItem.retrievability}%</span>
          </div>
        </div>
      )}

      {/* Main Flashcard Card */}
      {currentItem && (
        <div className="space-y-4">
          <div
            onClick={() => setIsFlipped((f) => !f)}
            className="cursor-pointer select-none perspective-1000 min-h-[300px] sm:min-h-[340px] flex flex-col"
          >
            <Card
              className={`flex-1 p-6 sm:p-8 flex flex-col justify-between rounded-3xl border-2 transition-all duration-300 relative ${
                isFlipped
                  ? 'border-indigo-400 dark:border-indigo-600 bg-white dark:bg-slate-900 shadow-xl shadow-indigo-500/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900 shadow-lg'
              }`}
            >
              {/* Question / Prompt */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {isFlipped ? 'Answer & Breakdown' : 'Prompt / Question'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Tap to flip ⎵</span>
                </div>

                <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed">
                  {currentItem.card.front}
                </div>

                {/* Optional Hint button */}
                {!isFlipped && currentItem.card.hint && (
                  <div className="pt-2">
                    {showHint ? (
                      <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                        💡 <strong>Hint:</strong> {currentItem.card.hint}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowHint(true);
                        }}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <Lightbulb className="w-3.5 h-3.5" /> Show Mnemonic Hint
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Flipped Content: Answer */}
              {isFlipped && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in">
                  <div className="text-base sm:text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                    {currentItem.card.back}
                  </div>

                  {currentItem.card.explanation && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                      💡 {currentItem.card.explanation}
                    </div>
                  )}

                  {/* AI Leech Rephrase / Mnemonic Assistant */}
                  {currentItem.isLeech && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      {aiSuggestion ? (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                          <p className="font-bold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Chizzy AI Leech Prescription:
                          </p>
                          <p>{aiSuggestion}</p>
                        </div>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAiRewriteSuggestion();
                          }}
                          disabled={isRewriting}
                          className="text-xs w-full font-semibold border-amber-300 dark:border-amber-800"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
                          {isRewriting ? 'Generating Insight...' : 'Ask Chizzy for Leech Mnemonic / Rewrite'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* FSRS Rating Controls */}
          {isFlipped ? (
            <div className="grid grid-cols-4 gap-2 pt-2 animate-in fade-in slide-in-from-bottom-2">
              <button
                onClick={() => handleRate(Rating.Again)}
                className="p-3 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900 text-center transition-all group"
              >
                <div className="text-xs font-black text-red-600 dark:text-red-400">Again</div>
                <div className="text-[10px] text-red-400 dark:text-red-500 mt-0.5">1m</div>
                <div className="text-[9px] text-slate-400 mt-0.5 group-hover:text-slate-600">[1]</div>
              </button>

              <button
                onClick={() => handleRate(Rating.Hard)}
                className="p-3 rounded-2xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/50 border border-orange-200 dark:border-orange-900 text-center transition-all group"
              >
                <div className="text-xs font-black text-orange-600 dark:text-orange-400">Hard</div>
                <div className="text-[10px] text-orange-400 dark:text-orange-500 mt-0.5">10m</div>
                <div className="text-[9px] text-slate-400 mt-0.5 group-hover:text-slate-600">[2]</div>
              </button>

              <button
                onClick={() => handleRate(Rating.Good)}
                className="p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-900 text-center transition-all group"
              >
                <div className="text-xs font-black text-blue-600 dark:text-blue-400">Good</div>
                <div className="text-[10px] text-blue-400 dark:text-blue-500 mt-0.5">1d</div>
                <div className="text-[9px] text-slate-400 mt-0.5 group-hover:text-slate-600">[3]</div>
              </button>

              <button
                onClick={() => handleRate(Rating.Easy)}
                className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-900 text-center transition-all group"
              >
                <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">Easy</div>
                <div className="text-[10px] text-emerald-400 dark:text-emerald-500 mt-0.5">3d</div>
                <div className="text-[9px] text-slate-400 mt-0.5 group-hover:text-slate-600">[4]</div>
              </button>
            </div>
          ) : (
            <Button
              onClick={() => setIsFlipped(true)}
              variant="volt"
              size="lg"
              className="w-full font-bold shadow-lg shadow-volt-500/25 py-3.5"
            >
              Reveal Answer ⎵
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
