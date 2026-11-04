'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  Calendar,
  Layers,
  BookOpen,
  AlertTriangle,
} from 'lucide-react';

interface MultiDeckQueueItem {
  card: {
    id: string;
    deckId: string;
    front: string;
    back: string;
    hint?: string;
    explanation?: string;
    tags?: string[];
  };
  deckTitle: string;
  deckColor: string;
  state: any;
  isNew: boolean;
  retrievability: number;
}

interface MultiDeckQueueData {
  queue: MultiDeckQueueItem[];
  totalDueCount: number;
  totalNewCount: number;
  overdueCount: number;
  isCatchUpMode: boolean;
  requiredNewPerDay: number;
  overallReadiness: number;
  uniqueDecks: Array<{ id: string; title: string; color: string }>;
  totalCardsInQueue: number;
}

export default function DailyStudyPage() {
  const [data, setData] = useState<MultiDeckQueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isNoviceMode, setIsNoviceMode] = useState(false);

  // Interval previews for current card
  const [previews, setPreviews] = useState<Array<{ rating: number; label: string; formatted: string }>>([
    { rating: 1, label: 'Again', formatted: '<1m' },
    { rating: 2, label: 'Hard', formatted: '1d' },
    { rating: 3, label: 'Good', formatted: '3d' },
    { rating: 4, label: 'Easy', formatted: '7d' },
  ]);

  // Session stats
  const [sessionStartedAt] = useState<number>(Date.now());
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionXpEarned, setSessionXpEarned] = useState(0);
  const [recentXpToast, setRecentXpToast] = useState<number | null>(null);
  const [canUndo, setCanUndo] = useState(false);

  const fetchDailyQueue = useCallback(() => {
    setLoading(true);
    fetch('/api/study/daily-queue')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData);
        }
      })
      .catch((err) => console.error('Failed to load daily queue:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDailyQueue();
  }, [fetchDailyQueue]);

  const queue = data?.queue || [];
  const currentItem = queue[currentIndex];
  const isComplete = !loading && (queue.length === 0 || currentIndex >= queue.length);

  // Update predicted intervals whenever current card changes
  useEffect(() => {
    if (currentItem?.card?.id) {
      fetch(`/api/study/preview-intervals?cardId=${currentItem.card.id}`)
        .then((res) => res.json())
        .then((pData) => {
          if (pData.success && pData.previews) {
            setPreviews(pData.previews);
          }
        })
        .catch(() => {});
    }
  }, [currentItem?.card?.id]);

  // Confetti on session completion
  useEffect(() => {
    if (isComplete && answeredCount > 0) {
      confetti({
        particleCount: 100,
        spread: 75,
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

      try {
        await fetch('/api/study/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardId,
            rating,
            responseMs: 1200,
          }),
        });
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
      const resData = await res.json();
      if (resData.success) {
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
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
            <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
          </div>
        </div>
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
            Daily Queue Cleared! ⚡
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You completed your interleaved daily mix. Spaced repetition intervals have been recalculated!
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="text-2xl font-black text-chizmo-600 dark:text-chizmo-400">
              +{sessionXpEarned}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">XP Earned</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {accuracy}%
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">Accuracy</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="text-2xl font-black text-volt-500">{answeredCount}</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Cards Studied</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link href="/library">
            <Button size="lg" variant="primary" className="w-full sm:w-auto">
              Back to Library
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              setCurrentIndex(0);
              setAnsweredCount(0);
              setCorrectCount(0);
              fetchDailyQueue();
            }}
            className="w-full sm:w-auto"
          >
            Review Another Batch
          </Button>
        </div>
      </div>
    );
  }

  const progress = queue.length > 0 ? (currentIndex / queue.length) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-in fade-in duration-200">
      {/* Top Header / Context */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/library"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </Link>

        {/* Deck origin chip */}
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: currentItem.deckColor }}
          />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
            {currentItem.deckTitle}
          </span>
          {currentItem.isNew && (
            <Badge variant="blue" className="text-[10px] px-1.5 py-0">
              NEW
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNoviceMode((prev) => !prev)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title={isNoviceMode ? 'Switch to 4-grade rating' : 'Switch to simple 2-grade rating'}
          >
            <Sliders className="w-4 h-4" />
          </button>
          {canUndo && (
            <button
              onClick={handleUndo}
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500 hover:text-amber-600 transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" /> Undo
            </button>
          )}
        </div>
      </div>

      {/* Catch-up Notification Banner (if user has overdue backlog) */}
      {data?.isCatchUpMode && (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Catch-up Mode:</strong> Showing your daily slice. No pressure to clear all at once!
            </span>
          </div>
          <Badge variant="slate" className="text-[10px]">
            {data.overdueCount} in backlog
          </Badge>
        </div>
      )}

      {/* Progress Bar & Counters */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>
            Card {currentIndex + 1} of {queue.length}
          </span>
          <div className="flex items-center gap-3">
            {recentXpToast && (
              <span className="text-volt-500 font-bold animate-bounce text-xs">
                +{recentXpToast} XP ⚡
              </span>
            )}
            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
              <Zap className="w-3.5 h-3.5 text-volt-500 fill-volt-500" />
              {sessionXpEarned} XP
            </span>
          </div>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-chizmo-500 to-volt-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 3D Flashcard Flip Container */}
      <div
        onClick={handleFlip}
        className="w-full min-h-[320px] sm:min-h-[380px] perspective-1000 cursor-pointer select-none group"
      >
        <div
          className={`relative w-full h-full min-h-[320px] sm:min-h-[380px] rounded-3xl bg-white dark:bg-slate-900 border-2 transition-transform duration-500 transform-style-3d shadow-xl shadow-slate-200/50 dark:shadow-none ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{ borderColor: `${currentItem.deckColor}40` }}
        >
          {/* Front Face */}
          <div className="absolute inset-0 p-8 flex flex-col justify-between backface-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: currentItem.deckColor }}
                />
                <span className="uppercase tracking-wider font-bold text-slate-500">
                  {currentItem.deckTitle}
                </span>
              </div>
              {currentItem.card.hint && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHint((prev) => !prev);
                  }}
                  className="inline-flex items-center gap-1 text-chizmo-600 dark:text-chizmo-400 hover:underline"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  {showHint ? 'Hide Hint' : 'Hint'}
                </button>
              )}
            </div>

            <div className="my-auto text-center space-y-4">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-relaxed">
                {currentItem.card.front}
              </div>

              {showHint && currentItem.card.hint && (
                <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-200 dark:border-amber-900 inline-block animate-in fade-in max-w-md mx-auto">
                  💡 <strong>Hint:</strong> {currentItem.card.hint}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center text-xs text-slate-400 gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-chizmo-500" />
              <span>Tap card or press space to flip</span>
            </div>
          </div>

          {/* Back Face */}
          <div className="absolute inset-0 p-8 flex flex-col justify-between backface-hidden rotate-y-180">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span className="uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                Answer
              </span>
              <span className="text-slate-400 text-[11px]">Select rating to advance</span>
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

      {/* Dynamic FSRS Rating Buttons with Predicted Intervals */}
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
          /* 4-Grade Standard FSRS Mode with live preview intervals */
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <button
              onClick={() => handleRate(1)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-sm"
            >
              <span>Again</span>
              <span className="text-[10px] text-red-400 font-semibold mt-0.5">
                {previews[0]?.formatted || '<1m'} [1]
              </span>
            </button>

            <button
              onClick={() => handleRate(2)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-sm"
            >
              <span>Hard</span>
              <span className="text-[10px] text-amber-400 font-semibold mt-0.5">
                {previews[1]?.formatted || '1d'} [2]
              </span>
            </button>

            <button
              onClick={() => handleRate(3)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-sm"
            >
              <span>Good</span>
              <span className="text-[10px] text-indigo-400 font-semibold mt-0.5">
                {previews[2]?.formatted || '3d'} [3]
              </span>
            </button>

            <button
              onClick={() => handleRate(4)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-sm"
            >
              <span>Easy</span>
              <span className="text-[10px] text-emerald-500 font-semibold mt-0.5">
                {previews[3]?.formatted || '7d'} [4]
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}