'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { ChizzyMascot } from '@/components/brand/ChizzyMascot';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  RotateCw,
  Undo2,
  ArrowLeft,
  Zap,
  Flame,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Eye,
  Sliders,
} from 'lucide-react';

interface StudyItem {
  card: {
    id: string;
    front: string;
    back: string;
    hint?: string;
    explanation?: string;
    tags?: string[];
  };
  state: any;
  isNew: boolean;
}

export default function StudySessionPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = use(params);

  const [deckTitle, setDeckTitle] = useState('Study Session');
  const [deckColor, setDeckColor] = useState('#6366F1');
  const [queue, setQueue] = useState<StudyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isNoviceMode, setIsNoviceMode] = useState(false); // 2-button vs 4-button mode
  const [showHint, setShowHint] = useState(false);

  // Session analytics
  const [sessionStartedAt] = useState<number>(Date.now());
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionXpEarned, setSessionXpEarned] = useState(0);
  const [lastReviewLog, setLastReviewLog] = useState<any>(null);
  const [recentXpToast, setRecentXpToast] = useState<number | null>(null);

  // Undo stack
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    fetch(`/api/study/${deckId}/queue`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.items) {
          setDeckTitle(data.deckTitle || 'Study Session');
          setDeckColor(data.deckColor || '#6366F1');
          setQueue(data.items);
        }
      })
      .finally(() => setLoading(false));
  }, [deckId]);

  const currentItem = queue[currentIndex];
  const isComplete = !loading && (queue.length === 0 || currentIndex >= queue.length);

  // Trigger celebration confetti on session completion
  useEffect(() => {
    if (isComplete && answeredCount > 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366F1', '#F59E0B', '#10B981', '#EC4899'],
      });
    }
  }, [isComplete, answeredCount]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleRate = useCallback(
    async (rating: 1 | 2 | 3 | 4) => {
      if (!currentItem) return;

      const cardId = currentItem.card.id;
      const isSuccess = rating >= 3;

      // Optimistic instant UI update (<100ms)
      setIsFlipped(false);
      setShowHint(false);
      setCurrentIndex((prev) => prev + 1);
      setAnsweredCount((prev) => prev + 1);
      if (isSuccess) setCorrectCount((prev) => prev + 1);
      setCanUndo(true);

      const earned = rating === 4 ? 6 : rating === 3 ? 5 : rating === 2 ? 2 : 1;
      setSessionXpEarned((prev) => prev + earned);
      setRecentXpToast(earned);
      setTimeout(() => setRecentXpToast(null), 1200);

      // Submit review in background
      try {
        const res = await fetch('/api/study/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardId,
            rating,
            responseMs: 1200,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setLastReviewLog(data.log);
        }
      } catch (err) {
        console.error('Failed to log review:', err);
      }
    },
    [currentItem]
  );

  const handleUndo = useCallback(async () => {
    if (!canUndo || currentIndex <= 0) return;

    try {
      const res = await fetch('/api/study/undo', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
        setIsFlipped(false);
        setCanUndo(false);
      }
    } catch (err) {
      console.error('Failed to undo:', err);
    }
  }, [canUndo, currentIndex]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture inside inputs
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        if (e.key === '1') handleRate(1);
        else if (e.key === '2') handleRate(2);
        else if (e.key === '3') handleRate(3);
        else if (e.key === '4') handleRate(4);
      }

      if (e.key === 'z' || e.key === 'Z') {
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleRate, handleUndo, isFlipped]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-6">
        <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  // Session Completed Screen
  if (isComplete) {
    const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 100;
    const durationMins = Math.max(1, Math.round((Date.now() - sessionStartedAt) / 60000));

    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-8 animate-in fade-in duration-200">
        <div className="relative inline-block animate-float">
          <ChizzyMascot size={120} mood="supercharged" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Session Complete! ⚡
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Memory stability updated by FSRS algorithm. Your streak is safe!
          </p>
        </div>

        {/* Telemetry Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 space-y-1">
            <div className="text-xs font-semibold text-slate-400">Cards Reviewed</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{answeredCount}</div>
          </Card>
          <Card className="p-4 space-y-1">
            <div className="text-xs font-semibold text-slate-400">Accuracy</div>
            <div className="text-2xl font-black text-emerald-600">{accuracy}%</div>
          </Card>
          <Card className="p-4 space-y-1">
            <div className="text-xs font-semibold text-slate-400">XP Gained</div>
            <div className="text-2xl font-black text-volt-500">+{sessionXpEarned}</div>
          </Card>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center justify-center gap-2">
          <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
          Study streak extended! Next reviews scheduled automatically.
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => {
              setCurrentIndex(0);
              setAnsweredCount(0);
              setCorrectCount(0);
            }}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <RotateCw className="w-4 h-4 mr-1.5" /> Study Again
          </Button>

          <Link href={`/decks/${deckId}`} className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto">
              View Deck Details
            </Button>
          </Link>

          <Link href="/library" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full sm:w-auto">
              Return to Library
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const progressPercent = queue.length > 0 ? ((currentIndex) / queue.length) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 select-none">
      {/* Top Session Bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/decks/${deckId}`}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </Link>

        {/* Progress Display */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          <span>Card {currentIndex + 1} of {queue.length}</span>
        </div>

        {/* Controls: Undo & Mode Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNoviceMode((prev) => !prev)}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 transition-colors"
            title="Toggle between 4-rate and 2-button modes"
          >
            {isNoviceMode ? '2-Button' : '4-Rate'} Mode
          </button>

          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Undo last rating (Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thin Non-Stressful Progress Bar */}
      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-chizmo-500 transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Floating XP Toast */}
      {recentXpToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-full bg-volt-500 text-slate-950 font-black text-xs shadow-lg animate-bounce flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 fill-slate-950" /> +{recentXpToast} XP
        </div>
      )}

      {/* 3D Flashcard Container */}
      <div
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        aria-label="Flashcard. Tap or press space to flip."
        className="cursor-pointer min-h-[340px] sm:min-h-[380px] w-full perspective-1000 group focus:outline-none"
      >
        <div
          className={`relative w-full h-full min-h-[340px] sm:min-h-[380px] rounded-3xl transition-transform duration-500 transform-style-3d shadow-md border-2 ${
            isFlipped
              ? 'rotate-y-180 border-chizmo-400 dark:border-chizmo-700 bg-white dark:bg-obsidian-900'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-obsidian-900'
          }`}
        >
          {/* Front Face */}
          <div className="absolute inset-0 p-8 flex flex-col justify-between backface-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span className="uppercase tracking-wider">Question</span>
              {currentItem.card.hint && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHint((prev) => !prev);
                  }}
                  className="text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 font-semibold flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>
              )}
            </div>

            <div className="my-auto text-center space-y-4">
              <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentItem.card.front}
              </div>

              {showHint && currentItem.card.hint && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-medium max-w-md mx-auto">
                  💡 Hint: {currentItem.card.hint}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center text-xs text-slate-400 gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-chizmo-500" />
              <span>Tap or press space to flip</span>
            </div>
          </div>

          {/* Back Face */}
          <div className="absolute inset-0 p-8 flex flex-col justify-between backface-hidden rotate-y-180">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span className="uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                Answer
              </span>
              <span className="text-slate-400 text-[11px]">Rate to advance</span>
            </div>

            <div className="my-auto text-center space-y-4">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-relaxed">
                {currentItem.card.back}
              </div>

              {currentItem.card.explanation && (
                <div className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {currentItem.card.explanation}
                </div>
              )}
            </div>

            <div className="text-center text-xs text-slate-400">
              Select your recall rating below
            </div>
          </div>
        </div>
      </div>

      {/* Rating Buttons */}
      <div className="space-y-2 pt-2">
        {!isFlipped ? (
          <Button
            onClick={handleFlip}
            variant="primary"
            size="lg"
            className="w-full text-base font-bold shadow-md shadow-chizmo-500/20"
          >
            <Eye className="w-5 h-5 mr-1" /> Show Answer (Space)
          </Button>
        ) : isNoviceMode ? (
          /* 2-Button Novice Mode */
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleRate(1)}
              variant="outline"
              size="lg"
              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950 font-bold"
            >
              Didn't Know (1)
            </Button>
            <Button
              onClick={() => handleRate(3)}
              variant="primary"
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-500 font-bold shadow-emerald-500/20"
            >
              Knew It! (3)
            </Button>
          </div>
        ) : (
          /* 4-Grade Standard FSRS Mode */
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <button
              onClick={() => handleRate(1)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-sm"
            >
              <span>Again</span>
              <span className="text-[10px] text-red-400 font-semibold mt-0.5">&lt;1m [1]</span>
            </button>

            <button
              onClick={() => handleRate(2)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-sm"
            >
              <span>Hard</span>
              <span className="text-[10px] text-amber-400 font-semibold mt-0.5">1d [2]</span>
            </button>

            <button
              onClick={() => handleRate(3)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-sm"
            >
              <span>Good</span>
              <span className="text-[10px] text-indigo-400 font-semibold mt-0.5">3d [3]</span>
            </button>

            <button
              onClick={() => handleRate(4)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-sm"
            >
              <span>Easy</span>
              <span className="text-[10px] text-emerald-500 font-semibold mt-0.5">7d [4]</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
