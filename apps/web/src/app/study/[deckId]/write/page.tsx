'use client';

import React, { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { ChizzyMascot } from '@/components/brand/ChizzyMascot';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Eye,
} from 'lucide-react';

interface WriteCard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  explanation?: string;
}

export default function WriteModePage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = use(params);

  const [deckTitle, setDeckTitle] = useState('Write-It-Out');
  const [cards, setCards] = useState<WriteCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isGrading, setIsGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<any>(null);

  // Performance stats
  const [correctCount, setCorrectCount] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch(`/api/study/${deckId}/queue`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.items) {
          setDeckTitle(data.deckTitle || 'Write-It-Out');
          setCards(data.items.map((it: any) => it.card));
        }
      })
      .finally(() => setLoading(false));
  }, [deckId]);

  useEffect(() => {
    if (!isAnswered && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, isAnswered]);

  const currentCard = cards[currentIndex];
  const isComplete = !loading && (cards.length === 0 || currentIndex >= cards.length);

  useEffect(() => {
    if (isComplete && correctCount > 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366F1', '#10B981', '#F59E0B'],
      });
    }
  }, [isComplete, correctCount]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || isAnswered || !currentCard) return;

    setIsGrading(true);
    try {
      const res = await fetch('/api/study/grade-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAnswer: userAnswer.trim(),
          referenceAnswer: currentCard.back,
          question: currentCard.front,
        }),
      });

      const data = await res.json();
      setGradeResult(data);
      setIsAnswered(true);

      const accepted = data.isAccepted || data.verdict === 'CORRECT';
      if (accepted) {
        setCorrectCount((prev) => prev + 1);
      }

      // Submit FSRS review in background
      fetch('/api/study/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: currentCard.id,
          rating: accepted ? 3 : 1, // Good or Again
          responseMs: 2000,
        }),
      }).catch(() => {});
    } finally {
      setIsGrading(false);
    }
  };

  const handleNextCard = () => {
    setIsAnswered(false);
    setUserAnswer('');
    setGradeResult(null);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleOverrideCorrect = () => {
    if (!gradeResult || gradeResult.isAccepted) return;
    setGradeResult({
      ...gradeResult,
      isAccepted: true,
      verdict: 'CORRECT',
      feedback: 'Marked correct via user override.',
    });
    setCorrectCount((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-6">
        <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  // Completion View
  if (isComplete) {
    const accuracy = cards.length > 0 ? Math.round((correctCount / cards.length) * 100) : 0;

    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-8 animate-in fade-in duration-200">
        <div className="relative inline-block animate-float">
          <ChizzyMascot size={120} mood="supercharged" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Write-It-Out Complete! ✍️
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Active recall typing strengthens deep synaptic retrieval pathways!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {accuracy}%
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">Accuracy</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="text-2xl font-black text-chizmo-600 dark:text-chizmo-400">
              {correctCount} / {cards.length}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">Cards Mastered</div>
          </div>
        </div>

        <div className="flex gap-3 justify-center pt-4">
          <Link href={`/decks/${deckId}`}>
            <Button size="lg" variant="primary">
              Back to Deck Studio
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              setCurrentIndex(0);
              setCorrectCount(0);
              setUserAnswer('');
              setIsAnswered(false);
              setGradeResult(null);
            }}
          >
            <RotateCcw className="w-4 h-4 mr-1" /> Practice Again
          </Button>
        </div>
      </div>
    );
  }

  const progress = cards.length > 0 ? (currentIndex / cards.length) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/decks/${deckId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </Link>

        <Badge variant="blue" className="text-xs font-bold">
          ✍️ Active Recall Typing
        </Badge>

        <span className="text-xs font-semibold text-slate-500">
          Card {currentIndex + 1} of {cards.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-chizmo-500 to-volt-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Prompt Card */}
      <Card className="p-8 space-y-4 text-center shadow-lg">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-relaxed">
          {currentCard.front}
        </h2>

        {currentCard.hint && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            💡 Hint: {currentCard.hint}
          </p>
        )}
      </Card>

      {/* Typed Response Form */}
      <form onSubmit={handleSubmitAnswer} className="space-y-4">
        <div>
          <input
            ref={inputRef}
            type="text"
            required
            disabled={isAnswered || isGrading}
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full h-14 px-5 text-base sm:text-lg font-semibold rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-chizmo-500 text-slate-900 dark:text-white shadow-sm"
          />
        </div>

        {!isAnswered ? (
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isGrading}
            className="w-full text-base font-bold shadow-md shadow-chizmo-500/20"
          >
            Check Answer (Enter)
          </Button>
        ) : (
          /* Grade Feedback Display */
          <div className="space-y-4 animate-in fade-in">
            <Card
              className={`p-5 space-y-3 border-2 ${
                gradeResult?.isAccepted
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-red-500 bg-red-50/50 dark:bg-red-950/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  {gradeResult?.isAccepted ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-emerald-700 dark:text-emerald-300">
                        {gradeResult?.verdict === 'CLOSE' ? 'Accepted with Minor Typo' : 'Correct!'}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-700 dark:text-red-300">Not Quite</span>
                    </>
                  )}
                </div>

                {!gradeResult?.isAccepted && (
                  <button
                    type="button"
                    onClick={handleOverrideCorrect}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
                  >
                    I was right
                  </button>
                )}
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold">Your Answer: </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{userAnswer}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Expected Answer: </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentCard.back}</span>
                </div>
              </div>

              {gradeResult?.feedback && (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  {gradeResult.feedback}
                </p>
              )}
            </Card>

            <Button
              type="button"
              onClick={handleNextCard}
              variant="volt"
              size="lg"
              className="w-full font-bold shadow-md shadow-volt-500/25"
            >
              Next Card <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}