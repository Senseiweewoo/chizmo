'use client';

import React, { useEffect, useState, use, useMemo } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { ChizzyMascot } from '@/components/brand/ChizzyMascot';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Flag,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Award,
  AlertTriangle,
  Bookmark,
} from 'lucide-react';

interface CardItem {
  id: string;
  front: string;
  back: string;
  hint?: string | null;
  explanation?: string | null;
}

type QuestionType = 'mcq' | 'boolean' | 'write';

interface TestQuestion {
  id: string;
  cardId: string;
  type: QuestionType;
  prompt: string;
  correctAnswer: string;
  choices?: string[]; // for mcq
  explanation?: string;
}

interface TestAnswer {
  userResponse: string;
  isCorrect?: boolean;
  isFlagged: boolean;
}

export default function MockTestPage({ params }: { params: Promise<{ deckId: string }> }) {
  const resolvedParams = use(params);
  const deckId = resolvedParams.deckId;

  const [deckTitle, setDeckTitle] = useState('Study Deck');
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, TestAnswer>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);

  // Fetch deck cards and generate test questions
  useEffect(() => {
    fetch(`/api/decks/${deckId}/cards`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.cards && data.cards.length > 0) {
          const cards: CardItem[] = data.cards;
          setDeckTitle(data.deckTitle || 'Deck Mock Exam');

          // Build a varied set of test questions: MCQ, True/False, and Written
          const testList: TestQuestion[] = cards.map((c, idx) => {
            // Assign question type based on index % 3
            const typeRoll = idx % 3;
            if (typeRoll === 0 && cards.length >= 4) {
              // Multiple choice
              const otherBacks = cards
                .filter((other) => other.id !== c.id)
                .map((other) => other.back);
              const shuffledOthers = [...otherBacks].sort(() => 0.5 - Math.random());
              const distractors = shuffledOthers.slice(0, 3);
              const choices = [...distractors, c.back].sort(() => 0.5 - Math.random());
              return {
                id: `q-${c.id}`,
                cardId: c.id,
                type: 'mcq' as QuestionType,
                prompt: c.front,
                correctAnswer: c.back,
                choices,
                explanation: c.explanation || c.hint || undefined,
              };
            } else if (typeRoll === 1 && cards.length >= 2) {
              // True / False statement
              const isTruth = Math.random() > 0.5;
              let presentedBack = c.back;
              if (!isTruth) {
                const randomOther = cards.find((o) => o.id !== c.id);
                if (randomOther) presentedBack = randomOther.back;
              }
              return {
                id: `q-${c.id}`,
                cardId: c.id,
                type: 'boolean' as QuestionType,
                prompt: `Is "${c.front}" correctly defined as: "${presentedBack}"?`,
                correctAnswer: isTruth ? 'True' : 'False',
                choices: ['True', 'False'],
                explanation: `Correct definition: ${c.back}`,
              };
            } else {
              // Written free recall
              return {
                id: `q-${c.id}`,
                cardId: c.id,
                type: 'write' as QuestionType,
                prompt: c.front,
                correctAnswer: c.back,
                explanation: c.explanation || c.hint || undefined,
              };
            }
          });

          setQuestions(testList);

          // Initialize answer states
          const initialAns: Record<string, TestAnswer> = {};
          testList.forEach((q) => {
            initialAns[q.id] = { userResponse: '', isFlagged: false };
          });
          setAnswers(initialAns);
        }
      })
      .finally(() => setIsLoading(false));
  }, [deckId]);

  // Timer
  useEffect(() => {
    if (isLoading || isSubmitted) return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isLoading, isSubmitted]);

  const currentQ = questions[currentIndex];
  const currentAnswer = currentQ ? answers[currentQ.id] || { userResponse: '', isFlagged: false } : null;

  const handleSelectAnswer = (response: string) => {
    if (isSubmitted || !currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        userResponse: response,
      },
    }));
  };

  const handleToggleFlag = () => {
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        isFlagged: !prev[currentQ.id]?.isFlagged,
      },
    }));
  };

  const answeredCount = useMemo(() => {
    return Object.values(answers).filter((a) => a.userResponse.trim() !== '').length;
  }, [answers]);

  const flaggedCount = useMemo(() => {
    return Object.values(answers).filter((a) => a.isFlagged).length;
  }, [answers]);

  const handleSubmitExam = () => {
    setIsConfirmSubmitOpen(false);

    // Grade answers
    const gradedAnswers: Record<string, TestAnswer> = { ...answers };
    questions.forEach((q) => {
      const uRes = (gradedAnswers[q.id]?.userResponse || '').trim().toLowerCase();
      const cRes = q.correctAnswer.trim().toLowerCase();

      let correct = false;
      if (q.type === 'boolean') {
        correct = uRes === cRes;
      } else if (q.type === 'mcq') {
        correct = uRes === cRes;
      } else {
        // Simple string tolerance for write
        correct = uRes === cRes || (uRes.length > 3 && cRes.includes(uRes));
      }

      gradedAnswers[q.id] = {
        ...gradedAnswers[q.id],
        isCorrect: correct,
      };
    });

    setAnswers(gradedAnswers);
    setIsSubmitted(true);

    const correctCount = Object.values(gradedAnswers).filter((a) => a.isCorrect).length;
    const ratio = questions.length > 0 ? correctCount / questions.length : 0;
    if (ratio >= 0.75) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366F1', '#F59E0B', '#10B981'],
      });
    }
  };

  // Format time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="flex flex-col items-center gap-4">
          <ChizzyMascot mood="thinking" size={80} animated />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">
            Assembling Exam Simulation...
          </p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4 pt-16">
        <ChizzyMascot mood="explaining" size={90} />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Need More Cards</h2>
        <p className="text-sm text-slate-500">
          Mock tests require at least 2 cards to formulate questions and distractors.
        </p>
        <Link href={`/decks/${deckId}`}>
          <Button variant="volt">Back to Deck Studio</Button>
        </Link>
      </div>
    );
  }

  // --- RESULT VIEW ---
  if (isSubmitted) {
    const correctCount = Object.values(answers).filter((a) => a.isCorrect).length;
    const scorePct = Math.round((correctCount / questions.length) * 100);

    let letterGrade = 'F';
    let gradeColor = 'text-red-500';
    if (scorePct >= 95) {
      letterGrade = 'A+';
      gradeColor = 'text-amber-500';
    } else if (scorePct >= 90) {
      letterGrade = 'A';
      gradeColor = 'text-emerald-500';
    } else if (scorePct >= 80) {
      letterGrade = 'B';
      gradeColor = 'text-blue-500';
    } else if (scorePct >= 70) {
      letterGrade = 'C';
      gradeColor = 'text-yellow-500';
    } else if (scorePct >= 60) {
      letterGrade = 'D';
      gradeColor = 'text-orange-500';
    }

    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in pb-16">
        {/* Header summary */}
        <Card className="p-6 sm:p-8 bg-gradient-to-br from-indigo-50 via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 text-center space-y-4 border-2 border-indigo-200 dark:border-indigo-800">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Exam Score Report
            </h1>
            <p className="text-xs text-slate-500 mt-1">{deckTitle}</p>
          </div>

          <div className="flex items-center justify-center gap-6 py-4">
            <div className="text-center">
              <span className={`text-5xl sm:text-6xl font-black ${gradeColor}`}>
                {letterGrade}
              </span>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1">Grade</p>
            </div>
            <div className="h-12 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="text-center">
              <span className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white">
                {scorePct}%
              </span>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1">Accuracy</p>
            </div>
            <div className="h-12 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="text-center">
              <span className="text-3xl sm:text-4xl font-black text-slate-700 dark:text-slate-300">
                {formatTime(elapsedSeconds)}
              </span>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1">Time Taken</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href={`/study/${deckId}/test`}>
              <Button variant="outline" size="md">
                <RotateCcw className="w-4 h-4 mr-1.5" /> Retake Exam
              </Button>
            </Link>
            <Link href={`/study/${deckId}/weak-spots`}>
              <Button variant="volt" size="md">
                <Sparkles className="w-4 h-4 mr-1.5" /> Practice Weak Spots
              </Button>
            </Link>
            <Link href={`/decks/${deckId}`}>
              <Button variant="secondary" size="md">
                Deck Studio
              </Button>
            </Link>
          </div>
        </Card>

        {/* Detailed Question Review */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Itemized Question Review</span>
            <span className="text-xs font-semibold text-slate-500">
              {correctCount} / {questions.length} Correct
            </span>
          </h2>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const ans = answers[q.id];
              const isCorrect = ans?.isCorrect;
              return (
                <Card
                  key={q.id}
                  className={`p-4 sm:p-5 border-l-4 transition-all ${
                    isCorrect
                      ? 'border-l-emerald-500 bg-white dark:bg-slate-900'
                      : 'border-l-red-500 bg-red-50/20 dark:bg-red-950/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">Q{idx + 1}</span>
                        <Badge variant={isCorrect ? 'default' : 'danger'} className="text-[10px]">
                          {q.type.toUpperCase()}
                        </Badge>
                        {ans?.isFlagged && (
                          <span className="text-amber-500 text-xs flex items-center gap-0.5">
                            <Flag className="w-3 h-3 fill-amber-500" /> Flagged
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {q.prompt}
                      </p>
                    </div>

                    <div>
                      {isCorrect ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500 shrink-0" />
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 font-medium">Your answer: </span>
                      <span
                        className={`font-semibold ${
                          isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                        }`}
                      >
                        {ans?.userResponse || '(No response)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Correct answer: </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {q.correctAnswer}
                      </span>
                    </div>
                  </div>

                  {q.explanation && (
                    <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                      💡 {q.explanation}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- EXAM TAKING VIEW ---
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 pb-20">
      {/* Top Test Navigation & Timer Bar */}
      <div className="flex items-center justify-between gap-4 p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <Link
          href={`/decks/${deckId}`}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </Link>

        {/* Live stopwatch */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span>{formatTime(elapsedSeconds)}</span>
        </div>

        {/* Action: Finish & Submit */}
        <Button
          onClick={() => setIsConfirmSubmitOpen(true)}
          variant="primary"
          size="sm"
          className="font-bold text-xs shadow-md shadow-indigo-600/20"
        >
          Submit Exam
        </Button>
      </div>

      {/* Progress & Question Numbers Ribbon */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span>
            {answeredCount}/{questions.length} Answered
            {flaggedCount > 0 && ` • ${flaggedCount} Flagged`}
          </span>
        </div>

        {/* Scrollable mini question pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {questions.map((q, idx) => {
            const a = answers[q.id];
            const isAnswered = a && a.userResponse.trim() !== '';
            const isFlagged = a && a.isFlagged;
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`relative min-w-[32px] h-8 rounded-lg text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-chizmo-600 text-white shadow-md shadow-chizmo-600/30 ring-2 ring-indigo-400'
                    : isAnswered
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white dark:border-slate-900" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Question Card */}
      {currentQ && (
        <Card className="p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="indigo" className="text-[10px] font-bold uppercase">
                  {currentQ.type === 'mcq'
                    ? 'Multiple Choice'
                    : currentQ.type === 'boolean'
                    ? 'True / False'
                    : 'Written Recall'}
                </Badge>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white pt-2">
                {currentQ.prompt}
              </h2>
            </div>

            <button
              onClick={handleToggleFlag}
              className={`p-2 rounded-xl transition-all ${
                currentAnswer?.isFlagged
                  ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Flag question for review"
            >
              <Flag
                className={`w-5 h-5 ${
                  currentAnswer?.isFlagged ? 'fill-amber-500 text-amber-500' : ''
                }`}
              />
            </button>
          </div>

          {/* Answer Controls Based on Question Type */}
          {currentQ.type === 'mcq' && currentQ.choices && (
            <div className="grid grid-cols-1 gap-2.5 pt-2">
              {currentQ.choices.map((choice, i) => {
                const isSelected = currentAnswer?.userResponse === choice;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelectAnswer(choice)}
                    className={`p-4 rounded-xl border text-left font-medium text-sm transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-chizmo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 ring-2 ring-chizmo-600/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span>{choice}</span>
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                        isSelected
                          ? 'border-chizmo-600 bg-chizmo-600 text-white'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {currentQ.type === 'boolean' && currentQ.choices && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              {currentQ.choices.map((choice) => {
                const isSelected = currentAnswer?.userResponse === choice;
                return (
                  <button
                    key={choice}
                    onClick={() => handleSelectAnswer(choice)}
                    className={`p-4 rounded-xl border font-bold text-center text-sm transition-all ${
                      isSelected
                        ? 'border-chizmo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 ring-2 ring-chizmo-600/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          )}

          {currentQ.type === 'write' && (
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-500">Your typed answer:</label>
              <textarea
                rows={3}
                value={currentAnswer?.userResponse || ''}
                onChange={(e) => handleSelectAnswer(e.target.value)}
                placeholder="Type the answer from memory..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-chizmo-600"
              />
            </div>
          )}

          {/* Bottom prev / next question bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="md"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((idx) => idx - 1)}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Previous
            </Button>

            {currentIndex < questions.length - 1 ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => setCurrentIndex((idx) => idx + 1)}
              >
                Next <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                variant="volt"
                size="md"
                onClick={() => setIsConfirmSubmitOpen(true)}
                className="font-bold shadow-md shadow-volt-500/25"
              >
                Finish Exam 🏁
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Confirmation Submit Modal */}
      {isConfirmSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <Card className="max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex items-center gap-3 text-amber-500">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Submit Mock Exam?
              </h3>
            </div>

            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
              <p>
                You have answered <strong>{answeredCount}</strong> out of{' '}
                <strong>{questions.length}</strong> questions.
              </p>
              {questions.length - answeredCount > 0 && (
                <p className="text-red-500 font-semibold text-xs">
                  ⚠️ {questions.length - answeredCount} questions are still unanswered and will be marked incorrect!
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsConfirmSubmitOpen(false)}
              >
                Keep Working
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmitExam}
                className="font-bold"
              >
                Confirm & Submit
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
