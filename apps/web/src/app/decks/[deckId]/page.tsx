'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  Plus,
  Play,
  Trash2,
  Edit2,
  HelpCircle,
  X,
  Sparkles,
  Calendar,
  AlertTriangle,
  Flame,
  CheckCircle2,
  TrendingUp,
  Target,
  FileText,
  PenTool,
  Zap,
  Puzzle,
  BookOpen,
} from 'lucide-react';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  explanation?: string;
  tags?: string[];
  position: number;
}

interface DeckDetail {
  id: string;
  title: string;
  description?: string;
  color: string;
  tags: string[];
  cardCount: number;
  dueToday: number;
  examDate?: string | null;
  cards: Flashcard[];
}

interface LeechCard {
  card: Flashcard;
  deckTitle: string;
  lapses: number;
  suggestion: string;
}

export default function DeckDetailPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = use(params);
  const router = useRouter();

  const [deck, setDeck] = useState<DeckDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddCardModal, setShowAddCardModal] = useState(false);

  // Exam mode state
  const [examDateInput, setExamDateInput] = useState('');
  const [examPace, setExamPace] = useState<any>(null);
  const [readiness, setReadiness] = useState<number>(0);
  const [savingExam, setSavingExam] = useState(false);

  // Leech cards state
  const [leeches, setLeeches] = useState<LeechCard[]>([]);

  // New card form state
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [hint, setHint] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!deckId) return;
    fetch(`/api/decks/${deckId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.deck) {
          setDeck(data.deck);
          if (data.deck.examDate) {
            setExamDateInput(new Date(data.deck.examDate).toISOString().slice(0, 10));
          }
        }
      })
      .finally(() => setLoading(false));

    // Fetch study queue to get current exam pace & readiness
    fetch(`/api/study/${deckId}/queue`)
      .then((res) => res.json())
      .then((qData) => {
        if (qData.success) {
          setExamPace(qData.examPace);
          setReadiness(qData.readiness || 0);
        }
      })
      .catch(() => {});

    // Fetch leeches for this deck
    fetch(`/api/study/leeches?deckId=${deckId}`)
      .then((res) => res.json())
      .then((lData) => {
        if (lData.success && lData.leeches) {
          setLeeches(lData.leeches);
        }
      })
      .catch(() => {});
  }, [deckId]);

  const handleSaveExamDate = async () => {
    setSavingExam(true);
    try {
      const res = await fetch('/api/study/exam-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckId,
          examDate: examDateInput ? new Date(examDateInput).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setExamPace(data.examPace);
        setReadiness(data.readiness || 0);
        if (deck) {
          setDeck({ ...deck, examDate: examDateInput || null });
        }
      }
    } finally {
      setSavingExam(false);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/decks/${deckId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ front, back, hint, explanation }),
      });

      const data = await res.json();
      if (data.success && data.card) {
        if (deck) {
          setDeck({
            ...deck,
            cardCount: deck.cardCount + 1,
            cards: [...deck.cards, data.card],
          });
        }
        setShowAddCardModal(false);
        setFront('');
        setBack('');
        setHint('');
        setExplanation('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;

    const res = await fetch(`/api/cards/${cardId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success && deck) {
      setDeck({
        ...deck,
        cardCount: Math.max(0, deck.cardCount - 1),
        cards: deck.cards.filter((c) => c.id !== cardId),
      });
      setLeeches((prev) => prev.filter((l) => l.card.id !== cardId));
    }
  };

  const handleDeleteDeck = async () => {
    if (!confirm('Are you sure you want to permanently delete this deck?')) return;

    const res = await fetch(`/api/decks/${deckId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      router.push('/library');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-4">
        <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4">
        <h2 className="text-xl font-bold">Deck not found</h2>
        <Link href="/library">
          <Button variant="primary">Back to Library</Button>
        </Link>
      </div>
    );
  }

  const daysToExam = examPace?.daysRemaining;
  const isFinalWeek = daysToExam !== undefined && daysToExam <= 7 && daysToExam > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Back button */}
      <Link
        href="/library"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Library
      </Link>

      {/* Deck Header Card */}
      <Card className="space-y-6 relative overflow-hidden border-2" style={{ borderColor: `${deck.color}40` }}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: deck.color }} />
              <div className="flex flex-wrap gap-1.5">
                {deck.tags.map((tag) => (
                  <Badge key={tag} variant="slate">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {deck.title}
            </h1>

            {deck.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                {deck.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start">
            <Link href={`/study/${deck.id}`}>
              <Button size="lg" variant="volt" className="shadow-lg shadow-volt-500/25">
                <Play className="w-5 h-5 fill-slate-950" /> Study Flashcards
              </Button>
            </Link>
            <Link href={`/study/${deck.id}/tutor`}>
              <Button size="lg" variant="primary" className="shadow-md shadow-indigo-600/20 font-bold">
                <Sparkles className="w-4 h-4 mr-1 text-volt-400" /> Socratic AI Tutor
              </Button>
            </Link>
            <Link href={`/study/${deck.id}/summary`}>
              <Button size="lg" variant="outline">
                <BookOpen className="w-4 h-4 mr-1" /> Summary
              </Button>
            </Link>
            <Button
              variant="outline"
              size="md"
              onClick={handleDeleteDeck}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              title="Delete deck"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>{deck.cards.length} cards total</span>
          <span className="font-semibold text-emerald-600">Active FSRS-4.5 Engine</span>
        </div>
      </Card>

      {/* 6 Core Study Modes Launcher Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Study Modes</span>
            <Badge variant="indigo" className="text-[10px]">6 Active Modes</Badge>
          </h2>
          <span className="text-xs text-slate-500 font-medium">Choose how you want to train today</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Flashcards */}
          <Link href={`/study/${deck.id}`} className="group">
            <Card className="p-3.5 h-full flex flex-col justify-between hover:border-volt-400 dark:hover:border-volt-500 hover:shadow-md transition-all bg-gradient-to-br from-white to-amber-50/20 dark:from-slate-900 dark:to-amber-950/10">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <Play className="w-4 h-4 fill-amber-500" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                    Flashcards
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                    FSRS-4.5 spaced repetition with 3D flip
                  </p>
                </div>
              </div>
              <Badge variant="volt" className="mt-2 text-[9px] w-fit">Primary</Badge>
            </Card>
          </Link>

          {/* Quiz Mode */}
          <Link href={`/study/${deck.id}/quiz`} className="group">
            <Card className="p-3.5 h-full flex flex-col justify-between hover:border-chizmo-400 dark:hover:border-chizmo-500 hover:shadow-md transition-all bg-gradient-to-br from-white to-indigo-50/20 dark:from-slate-900 dark:to-indigo-950/10">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                    Speed Quiz
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                    4-choice speed test with combo multipliers
                  </p>
                </div>
              </div>
              <Badge variant="indigo" className="mt-2 text-[9px] w-fit">Streak ⚡</Badge>
            </Card>
          </Link>

          {/* Write Mode */}
          <Link href={`/study/${deck.id}/write`} className="group">
            <Card className="p-3.5 h-full flex flex-col justify-between hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md transition-all bg-gradient-to-br from-white to-purple-50/20 dark:from-slate-900 dark:to-purple-950/10">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                    Write
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                    Typing recall with typo-tolerant grading
                  </p>
                </div>
              </div>
              <Badge variant="slate" className="mt-2 text-[9px] w-fit">Active Recall</Badge>
            </Card>
          </Link>

          {/* Match Mode */}
          <Link href={`/study/${deck.id}/match`} className="group">
            <Card className="p-3.5 h-full flex flex-col justify-between hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md transition-all bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/10">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                  <Puzzle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                    Match
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                    Fast pairing game against running stopwatch
                  </p>
                </div>
              </div>
              <Badge variant="default" className="mt-2 text-[9px] w-fit">Time Trial</Badge>
            </Card>
          </Link>

          {/* Mock Exam */}
          <Link href={`/study/${deck.id}/test`} className="group">
            <Card className="p-3.5 h-full flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all bg-gradient-to-br from-white to-blue-50/20 dark:from-slate-900 dark:to-blue-950/10">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    Mock Test
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                    Exam simulation with grades & score report
                  </p>
                </div>
              </div>
              <Badge variant="indigo" className="mt-2 text-[9px] w-fit">Exam Prep</Badge>
            </Card>
          </Link>

          {/* Weak Spots */}
          <Link href={`/study/${deck.id}/weak-spots`} className="group">
            <Card className="p-3.5 h-full flex flex-col justify-between hover:border-red-400 dark:hover:border-red-500 hover:shadow-md transition-all bg-gradient-to-br from-white to-red-50/20 dark:from-slate-900 dark:to-red-950/10">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center font-bold">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-red-600 transition-colors">
                    Weak Spots
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                    Targeted drill on lapses & high difficulty
                  </p>
                </div>
              </div>
              <Badge variant="danger" className="mt-2 text-[9px] w-fit">Targeted</Badge>
            </Card>
          </Link>
        </div>
      </div>

      {/* Exam Mode & Retention Projection Widget */}
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-900 dark:to-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-chizmo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-chizmo-600/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Exam Mode Target
                {isFinalWeek && (
                  <Badge variant="volt" className="text-[10px]">
                    Final Week Surge (96% Target) ⚡
                  </Badge>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                FSRS dynamically calibrates daily pacing to guarantee peak retention on your target date.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={examDateInput}
              onChange={(e) => setExamDateInput(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            />
            <Button
              size="sm"
              variant="primary"
              onClick={handleSaveExamDate}
              disabled={savingExam}
            >
              {savingExam ? 'Saving...' : 'Set Date'}
            </Button>
          </div>
        </div>

        {/* Readiness and Pace Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                {readiness}%
              </div>
              <div className="text-[11px] text-slate-500">Projected Retention</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-chizmo-100 dark:bg-chizmo-950/60 text-chizmo-600 dark:text-chizmo-400 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                {examPace?.requiredNewPerDay ?? '—'} / day
              </div>
              <div className="text-[11px] text-slate-500">Target New Cards Pace</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-volt-100 dark:bg-volt-950/60 text-volt-600 dark:text-volt-400 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                {daysToExam ? `${daysToExam} days` : 'Not Set'}
              </div>
              <div className="text-[11px] text-slate-500">Days to Exam</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Leech Cards Warning (lapses >= 8) */}
      {leeches.length > 0 && (
        <Card className="p-5 border-2 border-amber-300 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <span>Tricky Concept Alert ({leeches.length} Leech Cards Detected)</span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            FSRS detected cards you have lapsed on 8+ times. Learning science recommends rewriting or splitting these into smaller atomic facts to unblock memory retention:
          </p>

          <div className="space-y-2 pt-1">
            {leeches.map((leech) => (
              <div
                key={leech.card.id}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {leech.card.front}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    💡 <em>{leech.suggestion}</em>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <Badge variant="volt" className="text-[10px]">
                    {leech.lapses} lapses
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Cards List Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Cards in this Deck ({deck.cards.length})
        </h2>

        <Button onClick={() => setShowAddCardModal(true)} variant="primary" size="sm">
          <Plus className="w-4 h-4" /> Add Card
        </Button>
      </div>

      {/* Cards List */}
      <div className="space-y-3">
        {deck.cards.length === 0 ? (
          <Card className="text-center py-10 space-y-3">
            <p className="text-sm text-slate-500">No cards in this deck yet.</p>
            <Button onClick={() => setShowAddCardModal(true)} variant="primary" size="sm">
              <Plus className="w-4 h-4" /> Add your first card
            </Button>
          </Card>
        ) : (
          deck.cards.map((card, idx) => (
            <Card
              key={card.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400">#{idx + 1}</span>
                  {card.tags && card.tags.length > 0 && (
                    <div className="flex gap-1">
                      {card.tags.map((t) => (
                        <span key={t} className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  {card.front}
                </div>

                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 pl-3 border-l-2 border-emerald-500">
                  {card.back}
                </div>

                {card.hint && (
                  <div className="text-xs text-amber-600 dark:text-amber-400 pl-3">
                    💡 Hint: {card.hint}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 self-end sm:self-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteCard(card.id)}
                  className="text-slate-400 hover:text-red-500"
                  title="Delete card"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Card Modal */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Add Flashcard
              </h3>
              <button
                onClick={() => setShowAddCardModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCard} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Front (Prompt or Question) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="e.g. What is the primary function of ribosomes?"
                  className="w-full px-3.5 py-2.5 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-chizmo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Back (Target Fact or Answer) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="e.g. Protein synthesis (translation of mRNA into polypeptides)."
                  className="w-full px-3.5 py-2.5 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-chizmo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Hint (Optional)
                </label>
                <input
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="e.g. Cellular protein factory"
                  className="w-full px-3.5 py-2 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-chizmo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Explanation (Optional)
                </label>
                <input
                  type="text"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="e.g. Reads codons and links corresponding amino acids via peptide bonds."
                  className="w-full px-3.5 py-2 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-chizmo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddCardModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Add Card'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}