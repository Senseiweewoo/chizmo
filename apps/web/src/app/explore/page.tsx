'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { ChizzyMascot } from '@/components/brand/ChizzyMascot';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Compass,
  Search,
  BookOpen,
  Copy,
  Play,
  Sparkles,
  Layers,
  Flag,
  CheckCircle2,
  Share2,
  X,
  AlertTriangle,
} from 'lucide-react';

interface DeckItem {
  id: string;
  title: string;
  description?: string;
  color: string;
  icon: string;
  tags: string[];
  cardCount: number;
  retentionRate: number;
  cards?: any[];
}

const CATEGORY_TAGS = [
  'All',
  'Biology',
  'SAT',
  'AP Exam',
  'Vocabulary',
  'English',
  'High-Yield',
];

export default function ExploreCommunityPage() {
  const router = useRouter();

  const [decks, setDecks] = useState<DeckItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [previewDeck, setPreviewDeck] = useState<DeckItem | null>(null);
  const [reportModalDeck, setReportModalDeck] = useState<DeckItem | null>(null);
  const [reportReason, setReportReason] = useState('Factual error');
  const [reportDetails, setReportDetails] = useState('');
  const [forkingDeckId, setForkingDeckId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    fetchDecks();
  }, [selectedTag]);

  const fetchDecks = async () => {
    setIsLoading(true);
    try {
      const tagQuery = selectedTag !== 'All' ? `tag=${encodeURIComponent(selectedTag)}` : '';
      const searchQuery = search ? `q=${encodeURIComponent(search)}` : '';
      const params = [tagQuery, searchQuery].filter(Boolean).join('&');
      const res = await fetch(`/api/community/explore${params ? `?${params}` : ''}`);
      const data = await res.json();
      if (data.success && data.decks) {
        setDecks(data.decks);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDecks();
  };

  const handleForkDeck = async (deckId: string) => {
    setForkingDeckId(deckId);
    try {
      const res = await fetch('/api/community/fork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId }),
      });

      const data = await res.json();
      if (data.success && data.deck) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366F1', '#F59E0B', '#10B981'],
        });
        setNotification(`Cloned "${data.deck.title}" to your library! ⚡`);
        setTimeout(() => {
          router.push(`/decks/${data.deck.id}`);
        }, 1200);
      }
    } finally {
      setForkingDeckId(null);
    }
  };

  const handleSendReport = async () => {
    if (!reportModalDeck) return;
    await fetch('/api/community/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deckId: reportModalDeck.id,
        reason: reportReason,
        details: reportDetails,
      }),
    });
    setReportModalDeck(null);
    setNotification('Report submitted. Thank you for protecting community quality.');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 pb-24 animate-in fade-in">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="indigo" className="text-xs font-bold flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> Community Hub
            </Badge>
            <span className="text-xs text-slate-400">Open Public Decks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            Explore Study Decks
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Clone high-yield, peer-verified decks across AP, SAT, and university subjects. Study them immediately with FSRS-4.5 spaced repetition.
          </p>
        </div>

        <Link href="/create">
          <Button variant="volt" size="md" className="font-bold shadow-md shadow-volt-500/20">
            <Sparkles className="w-4 h-4 mr-1.5" /> Publish or Import Deck
          </Button>
        </Link>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Search Bar & Tag Pills */}
      <div className="space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by topic, exam name (e.g., AP Biology, SAT Vocabulary)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-chizmo-600 text-slate-900 dark:text-white"
            />
          </div>
          <Button type="submit" variant="primary" size="md" className="font-bold">
            Search
          </Button>
        </form>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedTag === tag
                  ? 'bg-chizmo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Decks Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <ChizzyMascot mood="thinking" size={60} animated />
          <p className="text-xs text-slate-500 font-semibold animate-pulse">
            Searching Community Decks...
          </p>
        </div>
      ) : decks.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <ChizzyMascot mood="explaining" size={70} />
          <h3 className="font-bold text-slate-900 dark:text-white">No Public Decks Found</h3>
          <p className="text-xs text-slate-500">
            Be the first to generate and share a deck on "{search || selectedTag}"!
          </p>
          <Link href="/create">
            <Button variant="volt" size="sm">Create Deck</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <Card
              key={deck.id}
              className="p-5 flex flex-col justify-between border hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:shadow-md bg-white dark:bg-slate-900"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: deck.color || '#6366F1' }}
                    />
                    <div className="flex flex-wrap gap-1">
                      {deck.tags.slice(0, 2).map((t) => (
                        <Badge key={t} variant="slate" className="text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setReportModalDeck(deck)}
                    className="text-slate-300 hover:text-slate-500 transition-colors"
                    title="Report deck"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {deck.title}
                  </h3>
                  {deck.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {deck.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" /> {deck.cardCount} cards
                  </span>
                  <span className="text-emerald-600">
                    {deck.retentionRate}% Avg Mastery
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewDeck(deck)}
                    className="flex-1 text-xs"
                  >
                    Preview
                  </Button>
                  <Button
                    variant="volt"
                    size="sm"
                    disabled={forkingDeckId === deck.id}
                    onClick={() => handleForkDeck(deck.id)}
                    className="flex-1 text-xs font-bold shadow-sm shadow-volt-500/20"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    {forkingDeckId === deck.id ? 'Cloning...' : 'Fork & Study'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Card Preview Modal */}
      {previewDeck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <Card className="max-w-xl w-full max-h-[85vh] flex flex-col p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="indigo" className="text-[10px]">Preview Mode</Badge>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {previewDeck.title}
                </h2>
                <p className="text-xs text-slate-500">
                  {previewDeck.cards?.length || previewDeck.cardCount} cards available
                </p>
              </div>
              <button
                onClick={() => setPreviewDeck(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable cards list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {(previewDeck.cards || []).map((c, i) => (
                <div
                  key={c.id || i}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1 text-xs"
                >
                  <p className="font-bold text-slate-900 dark:text-white">Q: {c.front}</p>
                  <p className="text-slate-600 dark:text-slate-300">A: {c.back}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setPreviewDeck(null)}>
                Close
              </Button>
              <Button
                variant="volt"
                size="sm"
                onClick={() => {
                  const id = previewDeck.id;
                  setPreviewDeck(null);
                  handleForkDeck(id);
                }}
                className="font-bold"
              >
                Fork This Deck ⚡
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Report Modal */}
      {reportModalDeck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <Card className="max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Report Deck for Moderation
              </h3>
            </div>

            <p className="text-xs text-slate-500">
              Reporting "{reportModalDeck.title}". Please specify the reason:
            </p>

            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
            >
              <option value="Factual error">Factual inaccuracy or misinformation</option>
              <option value="Inappropriate language">Inappropriate language or content</option>
              <option value="Copyright/Academic dishonesty">Copyright or exam security violation</option>
              <option value="Spam/Promotional">Spam or duplicate deck</option>
            </select>

            <textarea
              rows={3}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Optional additional context..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 placeholder:text-slate-400"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setReportModalDeck(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSendReport} className="font-bold">
                Submit Report
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
