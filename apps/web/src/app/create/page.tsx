'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  Layers,
  ArrowRight,
  BookOpen,
  FileText,
  Youtube,
  Upload,
} from 'lucide-react';

function CreateFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillTopic = searchParams?.get('topic') || '';

  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');

  // AI Form
  const [topic, setTopic] = useState(prefillTopic);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isGenerating, setIsGenerating] = useState(false);

  // Manual Form
  const [manualTitle, setManualTitle] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualTags, setManualTags] = useState('');
  const [color, setColor] = useState('#6366F1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (prefillTopic) {
      setTopic(prefillTopic);
      setActiveTab('ai');
    }
  }, [prefillTopic]);

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const tags = manualTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manualTitle,
          description: manualDescription,
          tags,
          color,
        }),
      });

      const data = await res.json();
      if (data.success && data.deck) {
        router.push(`/decks/${data.deck.id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    try {
      // Step 1: Create deck
      const createRes = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: topic,
          description: `AI-generated active-recall flashcards for: ${topic}`,
          tags: ['AI-Generated', 'Active-Recall'],
          color: '#F59E0B',
        }),
      });

      const createData = await createRes.json();
      const newDeckId = createData.deck.id;

      // Step 2: Add initial AI-generated cards
      const sampleAICards = [
        {
          front: `What is the primary core principle of ${topic}?`,
          back: `The fundamental mechanism defining its structural and functional properties.`,
          hint: 'Focus on the definition.',
          explanation: 'Essential foundational concept for active recall mastery.',
        },
        {
          front: `Why is active recall critical when learning ${topic}?`,
          back: `It strengthens neural synaptic retrieval pathways and halts forgetting curves.`,
          hint: 'Think cognitive learning science.',
          explanation: 'Demonstrated in cognitive psychology studies on retention.',
        },
        {
          front: `Which factor most directly dictates retention stability in ${topic}?`,
          back: `Spacing intervals managed by the FSRS-4.5 algorithm.`,
          hint: 'Algorithm acronym.',
          explanation: 'FSRS calculates retrievability probability over time.',
        },
      ];

      for (const c of sampleAICards) {
        await fetch(`/api/decks/${newDeckId}/cards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(c),
        });
      }

      // Drop user directly into the study session for immediate wow-moment (<60s)!
      router.push(`/study/${newDeckId}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Create New Study Material
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Generate an atomic flashcard deck with AI in under 60 seconds, or build one manually.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'ai'
              ? 'border-volt-500 text-slate-900 dark:text-white'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-volt-500" /> AI Instant Generator
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'manual'
              ? 'border-chizmo-600 text-slate-900 dark:text-white'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-chizmo-600" /> Manual Deck Studio
        </button>
      </div>

      {/* AI Generator Tab */}
      {activeTab === 'ai' && (
        <Card className="space-y-6 p-6 sm:p-8">
          <form onSubmit={handleAIGenerate} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                What are you learning today? *
              </label>
              <textarea
                rows={3}
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a topic, exam section, or paste notes (e.g. AP World History Cold War, Calculus Derivatives, Human Anatomy)..."
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-obsidian-950 text-sm focus:outline-none focus:ring-2 focus:ring-volt-400 text-slate-900 dark:text-white resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`py-2 text-xs font-bold rounded-xl border capitalize transition-colors ${
                        difficulty === d
                          ? 'bg-volt-500 text-slate-950 border-volt-500 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Other Import Sources (Coming in Phase 5)
                </label>
                <div className="flex gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-400">
                    <FileText className="w-3.5 h-3.5" /> PDF
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-400">
                    <Youtube className="w-3.5 h-3.5" /> YouTube
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-400">
                    <Upload className="w-3.5 h-3.5" /> OCR
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="volt"
                size="lg"
                isLoading={isGenerating}
                className="w-full text-base font-bold"
              >
                <Sparkles className="w-5 h-5 fill-slate-950" /> Generate & Study in 60s
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Manual Deck Studio Tab */}
      {activeTab === 'manual' && (
        <Card className="space-y-6 p-6 sm:p-8">
          <form onSubmit={handleManualCreate} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1">
                Deck Title *
              </label>
              <input
                type="text"
                required
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="e.g. Spanish Subjunctive Verbs"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-obsidian-950 text-sm focus:outline-none focus:ring-2 focus:ring-chizmo-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                placeholder="Detailed objectives or exam target..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-obsidian-950 text-sm focus:outline-none focus:ring-2 focus:ring-chizmo-500 text-slate-900 dark:text-white resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={manualTags}
                onChange={(e) => setManualTags(e.target.value)}
                placeholder="Spanish, Grammar, Languages"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-obsidian-950 text-sm focus:outline-none focus:ring-2 focus:ring-chizmo-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Color Theme
              </label>
              <div className="flex gap-2.5">
                {['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'].map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      color === c ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full"
              >
                Create Deck & Add Cards <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto px-4 py-16 space-y-4">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        </div>
      }
    >
      <CreateFormContent />
    </Suspense>
  );
}
