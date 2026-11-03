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
  cards: Flashcard[];
}

export default function DeckDetailPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = use(params);
  const router = useRouter();

  const [deck, setDeck] = useState<DeckDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddCardModal, setShowAddCardModal] = useState(false);

  // New card form state
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [hint, setHint] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/decks/${deckId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.deck) {
          setDeck(data.deck);
        }
      })
      .finally(() => setLoading(false));
  }, [deckId]);

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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
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

          <div className="flex items-center gap-2 self-start">
            <Link href={`/study/${deck.id}`}>
              <Button size="lg" variant="volt" className="shadow-lg shadow-volt-500/25">
                <Play className="w-5 h-5 fill-slate-950" /> Study Flashcards
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
          <span className="font-semibold text-emerald-600">Active FSRS Engine</span>
        </div>
      </Card>

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
            <Card key={card.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                  {card.hint && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" /> Hint included
                    </span>
                  )}
                </div>

                <div className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white">
                  {card.front}
                </div>

                <div className="text-sm text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-chizmo-600 dark:text-chizmo-400 mr-1.5 uppercase">
                    Answer:
                  </span>
                  {card.back}
                </div>

                {card.explanation && (
                  <div className="text-xs text-slate-400 italic">
                    {card.explanation}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 self-end sm:self-start">
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                  title="Delete Card"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Card Modal */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-lg space-y-5 p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddCardModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Flashcard</h2>
              <p className="text-xs text-slate-500">Atomic, self-contained questions produce maximum retention.</p>
            </div>

            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Front (Question / Prompt) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="e.g. Where does the Krebs cycle take place in eukaryotic cells?"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-obsidian-950 text-sm focus:outline-none focus:ring-2 focus:ring-chizmo-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Back (Direct Answer) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="e.g. Mitochondrial matrix."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-obsidian-950 text-sm focus:outline-none focus:ring-2 focus:ring-chizmo-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hint (Optional)
                </label>
                <input
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="e.g. Inside the inner membrane"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-obsidian-950 text-sm focus:outline-none focus:ring-2 focus:ring-chizmo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Explanation / Context (Optional)
                </label>
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Additional context shown after answering..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-obsidian-950 text-sm focus:outline-none focus:ring-2 focus:ring-chizmo-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowAddCardModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Save Card
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
