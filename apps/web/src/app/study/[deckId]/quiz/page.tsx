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
  ArrowRight,
  Zap,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { calculateQuizScore } from '@chizmo/core';

interface QuizQuestion {
  cardId: string;
  question: string;
  correctAnswer: string;
  choices: string[];
  explanation?: string;
}

export default function QuizModePage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = use(params);

  const [deckTitle, setDeckTitle] = useState('Quiz Mode');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(true);

  // Score & Streak
  const [totalScore, setTotalScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  // Question Timer (15 seconds per question)
  const [timeLeft, setTimeLeft] = useState(15);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    if (!deckId) return;
    fetch(`/api/study/${deckId}/queue`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.items) {
          setDeckTitle(data.deckTitle || 'Quiz Mode');

          const allCards = data.items.map((it: any) => it.card);
          const generatedQuestions: QuizQuestion[] = allCards.map((c: any) => {
            let choices: string[] = [];

            if (c.choices && Array.isArray(c.choices) && c.choices.length >= 2) {
              choices = [...c.choices];
            } else {
              // Generate plausible distractors from other deck cards
              const otherAnswers = allCards
                .filter((oc: any) => oc.id !== c.id)
                .map((oc: any) => oc.back)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3);

              choices = [c.back, ...otherAnswers].sort(() => Math.random() - 0.5);
            }

            return {
              cardId: c.id,
              question: c.front,
              correctAnswer: c.back,
              choices,
              explanation: c.explanation,
            };
          });

          setQuestions(generatedQuestions);
        }
      })
      .finally(() => {
        setLoading(false);
        setTimerActive(true);
      });
  }, [deckId]);

  // Question Timer Countdown
  useEffect(() => {
    if (!timerActive || isAnswered || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive, isAnswered, timeLeft]);

  const handleTimeExpired = useCallback(() => {
    if (isAnswered) return;
    setIsAnswered(true);
    setStreak(0);
  }, [isAnswered]);

  const currentQ = questions[currentIndex];
  const isComplete = !loading && (questions.length === 0 || currentIndex >= questions.length);

  // Trigger celebration confetti on completion
  useEffect(() => {
    if (isComplete && correctCount > 0) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6366F1', '#F59E0B', '#10B981'],
      });
    }
  }, [isComplete, correctCount]);

  const handleSelectChoice = (choice: string) => {
    if (isAnswered || !currentQ) return;

    setSelectedChoice(choice);
    setIsAnswered(true);
    setTimerActive(false);

    const isCorrect = choice.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

    const scoreResult = calculateQuizScore({
      basePoints: 1000,
      totalAllowedMs: 15000,
      serverStartTs: 0,
      serverReceiveTs: (15 - timeLeft) * 1000,
      clientAnswerTs: (15 - timeLeft) * 1000,
      isCorrect,
      currentStreak: streak,
    });

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      setTotalScore((prev) => prev + scoreResult.pointsAwarded);
    } else {
      setStreak(0);
    }

    // Submit FSRS review in background
    fetch('/api/study/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId: currentQ.cardId,
        rating: isCorrect ? 3 : 1, // Good or Again
        responseMs: (15 - timeLeft) * 1000,
      }),
    }).catch(() => {});
  };

  const handleNextQuestion = () => {
    setIsAnswered(false);
    setSelectedChoice(null);
    setTimeLeft(15);
    setTimerActive(true);
    setCurrentIndex((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-6">
        <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  // Quiz Completed View
  if (isComplete) {
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-8 animate-in fade-in duration-200">
        <div className="relative inline-block animate-float">
          <ChizzyMascot size={120} mood="supercharged" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Quiz Complete! 🎯
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            You mastered active recall with multi-choice distractors!
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="text-2xl font-black text-volt-500">
              {totalScore}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">Total Points</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {accuracy}%
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">Accuracy</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="text-2xl font-black text-chizmo-600 dark:text-chizmo-400">
              {correctCount} / {questions.length}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">Questions</div>
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
              setTotalScore(0);
              setStreak(0);
              setCorrectCount(0);
              setTimeLeft(15);
              setIsAnswered(false);
              setSelectedChoice(null);
              setTimerActive(true);
            }}
          >
            <RotateCcw className="w-4 h-4 mr-1" /> Retake Quiz
          </Button>
        </div>
      </div>
    );
  }

  const progress = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/decks/${deckId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Quiz
        </Link>

        {streak > 1 && (
          <Badge variant="volt" className="font-black animate-bounce text-xs">
            <Flame className="w-3.5 h-3.5 mr-1 text-slate-950 fill-slate-950" /> {streak}x Streak!
          </Badge>
        )}

        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Clock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
          <span className={timeLeft <= 5 ? 'text-red-500 font-black' : ''}>{timeLeft}s</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span className="text-volt-500 font-bold">{totalScore} pts</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-chizmo-500 to-volt-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <Card className="p-8 space-y-6 text-center shadow-lg">
        <Badge variant="slate" className="text-[11px] uppercase tracking-wider font-bold mx-auto">
          Multiple Choice
        </Badge>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-relaxed">
          {currentQ.question}
        </h2>
      </Card>

      {/* Choices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {currentQ.choices.map((choice, idx) => {
          const isCorrectAnswer = choice.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();
          const isSelected = selectedChoice === choice;

          let btnStyle = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-chizmo-500';

          if (isAnswered) {
            if (isCorrectAnswer) {
              btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold shadow-md';
            } else if (isSelected && !isCorrectAnswer) {
              btnStyle = 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold';
            } else {
              btnStyle = 'border-slate-200 dark:border-slate-800 opacity-50';
            }
          }

          return (
            <button
              key={idx}
              disabled={isAnswered}
              onClick={() => handleSelectChoice(choice)}
              className={`p-4 rounded-2xl border-2 text-left text-sm font-semibold transition-all active:scale-98 flex items-center justify-between gap-2 ${btnStyle}`}
            >
              <span>{choice}</span>
              {isAnswered && isCorrectAnswer && (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              )}
              {isAnswered && isSelected && !isCorrectAnswer && (
                <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation & Next Button */}
      {isAnswered && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in">
          {currentQ.explanation && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              💡 <strong>Context:</strong> {currentQ.explanation}
            </p>
          )}

          <Button
            onClick={handleNextQuestion}
            variant="volt"
            size="lg"
            className="w-full font-bold shadow-md shadow-volt-500/25"
          >
            Next Question <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}