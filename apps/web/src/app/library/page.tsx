'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  BookOpen,
  Plus,
  Search,
  Layers,
  Brain,
  ArrowRight,
  MoreVertical,
  X,
  Sparkles,
} from 'lucide-react';

interface Deck {
  id: string;
  title: string;
  description: string;
  cardCount: number;
  dueToday: number;
  retentionRate: number;
  color: string;
  tags: string[];
}

export default function LibraryPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New deck form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [color, setColor] = useState('#6366F1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/decks')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.decks) {
          setDecks(data.decks);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          tags,
          color,
        }),
      });

      const data = await res.json();
      if (data.success && data.deck) {
        setDecks([data.deck, ...decks]);
        setShowCreateModal(false);
        setTitle('');
        setDescription('');
        setTagsInput('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDecks = decks.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-8 h-8 text-chizmo-600 dark:text-chizmo-400" />
            Study Library
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage your flashcard decks, track retention, or create new study materials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateModal(true)} variant="primary" className="shadow-md">
            <Plus className="w-4 h-4" /> New Deck
          </Button>
          <Link href="/create">
            <Button variant="volt">
              <Sparkles className="w-4 h-4" /> AI Generator
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or topic tag..."
          className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-chizmo-500 text-slate-900 dark:text-white"
        />
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      </div>

      {/* Decks Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : filteredDecks.length === 0 ? (
        <Card className="text-center py-12 space-y-4">
          <div className="p-4 mx-auto w-fit rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">No decks found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search ? 'No decks match your filter. Try another keyword.' : 'You haven’t created any decks yet. Make your first deck in 30 seconds!'}
          </p>
          <Button onClick={() => setShowCreateModal(true)} variant="primary" size="sm">
            <Plus className="w-4 h-4" /> Create Deck
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map((deck) => (
            <Card key={deck.id} hoverLift className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: deck.color }}
                    />
                    <div className="flex flex-wrap gap-1">
                      {deck.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="slate">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {deck.dueToday > 0 && (
                    <Badge variant="volt">
                      {deck.dueToday} due
                    </Badge>
                  )}
                </div>

                <Link href={`/decks/${deck.id}`} className="group">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-chizmo-600 dark:group-hover:text-chizmo-400 transition-colors leading-snug">
                    {deck.title}
                  </h3>
                </Link>

                {deck.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {deck.description}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-medium">
                    <Layers className="w-3.5 h-3.5" /> {deck.cardCount} cards
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <Brain className="w-3.5 h-3.5" /> {deck.retentionRate}%
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Link href={`/decks/${deck.id}`}>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/study/${deck.id}`}>
                    <Button size="sm" variant="primary">
                      Study <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Deck Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-md space-y-5 p-6 shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create Study Deck</h2>
              <p className="text-xs text-slate-500">Organize your flashcards with custom tags and colors.</p>
            </div>

            <form onSubmit={handleCreateDeck} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deck Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Organic Chemistry Reactions"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-obsidian-950 text-sm focus:outline-none focus:ring-2 focus:ring-chizmo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of topics covered..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-obsidian-950 text-sm focus:outline-none focus:ring-2 focus:ring-chizmo-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Chemistry, Exam, Reactions"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-obsidian-950 text-sm focus:outline-none focus:ring-2 focus:ring-chizmo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Color Accent
                </label>
                <div className="flex gap-2">
                  {['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'].map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        color === c ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Create Deck
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
