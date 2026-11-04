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
  Check,
  CheckCircle2,
  Trash2,
  Edit2,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Flame,
} from 'lucide-react';

interface ReviewCard {
  id: string;
  type: string;
  front: string;
  back: string;
  hint?: string;
  explanation?: string;
  sourceRef?: { quote?: string };
  difficulty: string;
  tags: string[];
  selected: boolean;
  isGrounded?: boolean;
}

function CreateFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillTopic = searchParams?.get('topic') || '';

  const [activeTab, setActiveTab] = useState<'topic' | 'text' | 'manual'>('topic');

  // Generation Inputs
  const [topic, setTopic] = useState(prefillTopic);
  const [pastedText, setPastedText] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [targetExam, setTargetExam] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');

  // Generated Cards Review State
  const [reviewCards, setReviewCards] = useState<ReviewCard[]>([]);
  const [topicSummary, setTopicSummary] = useState('');
  const [pipelineStats, setPipelineStats] = useState<any>(null);
  const [isSavingCards, setIsSavingCards] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // Manual Form
  const [manualTitle, setManualTitle] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualTags, setManualTags] = useState('');
  const [color, setColor] = useState('#6366F1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (prefillTopic) {
      setTopic(prefillTopic);
      setActiveTab('topic');
    }
  }, [prefillTopic]);

  const handleGenerateCards = async (sourceType: 'TOPIC' | 'TEXT') => {
    const content = sourceType === 'TOPIC' ? topic.trim() : pastedText.trim();
    if (!content) return;

    setIsGenerating(true);
    setGenerationStep('Chunking source and extracting concepts...');

    try {
      setTimeout(() => setGenerationStep('Generating atomic active recall cards...'), 600);
      setTimeout(() => setGenerationStep('Running LLM Critic pass & grounding verification...'), 1200);
      setTimeout(() => setGenerationStep('Deduplicating & checking distractor quality...'), 1800);

      const res = await fetch('/api/ai/generate-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          sourceType,
          difficulty,
          targetExam: targetExam || undefined,
          count: 10,
        }),
      });

      const data = await res.json();
      if (data.success && data.cards) {
        setTopicSummary(data.topicSummary || '');
        setPipelineStats(data.stats);

        const mapped: ReviewCard[] = data.cards.map((c: any, idx: number) => ({
          id: `gen-${idx}-${Date.now()}`,
          type: c.type || 'basic',
          front: c.front,
          back: c.back,
          hint: c.hint,
          explanation: c.explanation,
          sourceRef: c.sourceRef,
          difficulty: c.difficulty || 'medium',
          tags: c.tags || ['AI-Generated'],
          selected: true,
          isGrounded: c.isGrounded !== false,
        }));

        setReviewCards(mapped);
      }
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleToggleCardSelection = (id: string) => {
    setReviewCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleSaveDeckAndStudy = async (startStudying = true) => {
    const selected = reviewCards.filter((c) => c.selected);
    if (selected.length === 0) {
      alert('Please select at least 1 card to save');
      return;
    }

    setIsSavingCards(true);
    try {
      const deckTitle =
        activeTab === 'topic'
          ? topic || 'AI Study Deck'
          : topicSummary.slice(0, 40) || 'Pasted Notes Deck';

      // 1. Create the deck
      const createRes = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: deckTitle,
          description: topicSummary || 'AI-generated grounded flashcards with active recall.',
          tags: ['AI-Generated', 'FSRS-4.5', activeTab === 'topic' ? 'Topic' : 'Notes'],
          color: '#6366F1',
        }),
      });

      const createData = await createRes.json();
      const newDeckId = createData.deck.id;

      // 2. Add each approved card to deck
      for (const card of selected) {
        await fetch(`/api/decks/${newDeckId}/cards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            front: card.front,
            back: card.back,
            hint: card.hint,
            explanation: card.explanation,
            tags: card.tags,
            choices: (card as any).choices,
            correctIndex: (card as any).correctIndex,
          }),
        });
      }

      if (startStudying) {
        // Instant wow-moment: Drop straight into flashcards!
        router.push(`/study/${newDeckId}`);
      } else {
        router.push(`/decks/${newDeckId}`);
      }
    } finally {
      setIsSavingCards(false);
    }
  };

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

  // Review Screen: After cards are generated, user reviews, edits, and approves them
  if (reviewCards.length > 0) {
    const selectedCount = reviewCards.filter((c) => c.selected).length;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="volt" className="text-slate-950 font-black">
                ✨ Verified Quality Pipeline
              </Badge>
              {pipelineStats && (
                <span className="text-xs text-slate-500 font-semibold">
                  Quality Score: {pipelineStats.qualityScore}% ({pipelineStats.groundedCount} Grounded)
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Review Generated Cards
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              {topicSummary || 'Review, edit, and select which cards to include in your study deck.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setReviewCards([])}
              disabled={isSavingCards}
            >
              <RefreshCw className="w-4 h-4 mr-1" /> Regenerate
            </Button>
            <Button
              variant="volt"
              size="lg"
              onClick={() => handleSaveDeckAndStudy(true)}
              isLoading={isSavingCards}
              className="font-extrabold shadow-lg shadow-volt-500/25"
            >
              Save & Study ({selectedCount}) <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* AI Transparency Notice */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            ⚡ <strong>AI-Generated Content:</strong> Grounded in source quotes. Edit text inline before saving.
          </span>
          <span className="font-semibold text-chizmo-600 dark:text-chizmo-400">
            {selectedCount} of {reviewCards.length} selected
          </span>
        </div>

        {/* Cards Grid */}
        <div className="space-y-4">
          {reviewCards.map((card, idx) => (
            <Card
              key={card.id}
              className={`p-5 transition-all border-2 ${
                card.selected
                  ? 'border-chizmo-500/60 bg-white dark:bg-slate-900'
                  : 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50 dark:bg-slate-950'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={card.selected}
                    onChange={() => handleToggleCardSelection(card.id)}
                    className="w-5 h-5 mt-1 rounded-md text-chizmo-600 focus:ring-chizmo-500 cursor-pointer"
                  />

                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                      <Badge variant={card.difficulty === 'hard' ? 'amber' : 'blue'} className="text-[10px] capitalize">
                        {card.difficulty}
                      </Badge>
                      {card.isGrounded && (
                        <Badge variant="emerald" className="text-[10px]">
                          ✓ Grounded Quote
                        </Badge>
                      )}
                    </div>

                    {/* Front Prompt */}
                    {editingCardId === card.id ? (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={card.front}
                          onChange={(e) => {
                            const val = e.target.value;
                            setReviewCards((prev) =>
                              prev.map((c) => (c.id === card.id ? { ...c, front: val } : c))
                            );
                          }}
                          className="w-full p-2 text-sm rounded-xl border border-chizmo-500 bg-white dark:bg-slate-800"
                        />
                        <textarea
                          rows={2}
                          value={card.back}
                          onChange={(e) => {
                            const val = e.target.value;
                            setReviewCards((prev) =>
                              prev.map((c) => (c.id === card.id ? { ...c, back: val } : c))
                            );
                          }}
                          className="w-full p-2 text-sm rounded-xl border border-emerald-500 bg-white dark:bg-slate-800"
                        />
                        <Button size="sm" variant="primary" onClick={() => setEditingCardId(null)}>
                          Done Editing
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                          {card.front}
                        </div>

                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 pl-3 border-l-2 border-emerald-500">
                          {card.back}
                        </div>
                      </>
                    )}

                    {card.sourceRef?.quote && (
                      <div className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl italic">
                        Citation: "{card.sourceRef.quote}"
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditingCardId(editingCardId === card.id ? null : card.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    title="Edit card text"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setReviewCards((prev) => prev.filter((c) => c.id !== card.id))}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete card"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom Save Bar */}
        <div className="sticky bottom-4 p-4 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl flex items-center justify-between gap-4">
          <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
            Ready to learn {selectedCount} cards with FSRS-4.5 spaced repetition
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => handleSaveDeckAndStudy(false)}
              isLoading={isSavingCards}
            >
              Save to Library
            </Button>
            <Button
              variant="volt"
              size="md"
              onClick={() => handleSaveDeckAndStudy(true)}
              isLoading={isSavingCards}
              className="font-extrabold shadow-md shadow-volt-500/20"
            >
              Start Studying <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Generator & Input View
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Create Study Material
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Transform topics or study notes into grounded active-recall flashcards in under 60 seconds.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('topic')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'topic'
              ? 'border-volt-500 text-slate-900 dark:text-white'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-volt-500" /> AI Topic Prompt
        </button>

        <button
          onClick={() => setActiveTab('text')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'text'
              ? 'border-chizmo-600 text-slate-900 dark:text-white'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-chizmo-600" /> Paste Notes / Text
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'manual'
              ? 'border-indigo-500 text-slate-900 dark:text-white'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-500" /> Manual Deck Studio
        </button>
      </div>

      {/* Loading Animation Box */}
      {isGenerating && (
        <Card className="p-8 text-center space-y-4 border-2 border-volt-400 bg-volt-50/20 dark:bg-volt-950/20 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-volt-500 text-slate-950 mx-auto flex items-center justify-center font-black animate-spin">
            ⚡
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              AI Card Pipeline Running...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {generationStep || 'Generating atomic active recall cards...'}
            </p>
          </div>
        </Card>
      )}

      {/* AI Topic Prompt Tab */}
      {!isGenerating && activeTab === 'topic' && (
        <Card className="space-y-6 p-6 sm:p-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerateCards('TOPIC');
            }}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                What topic or exam subject are you learning? *
              </label>
              <textarea
                rows={3}
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. AP Biology Cellular Respiration, SAT High-Yield Vocabulary, Cold War Proxies, French Subjunctive..."
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-obsidian-950 text-sm focus:outline-none focus:ring-2 focus:ring-volt-400 text-slate-900 dark:text-white resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Difficulty
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
                  Target Exam (Optional)
                </label>
                <input
                  type="text"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  placeholder="e.g. GCSE, AP Exam, SAT"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="volt"
                size="lg"
                isLoading={isGenerating}
                className="w-full text-base font-bold shadow-lg shadow-volt-500/25"
              >
                <Sparkles className="w-5 h-5 fill-slate-950" /> Generate Atomic Cards (&lt;60s)
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Paste Notes / Text Tab */}
      {!isGenerating && activeTab === 'text' && (
        <Card className="space-y-6 p-6 sm:p-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerateCards('TEXT');
            }}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                Paste your notes, article, or lecture text *
              </label>
              <textarea
                rows={7}
                required
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste up to 50,000 words of notes, study guides, or chapter excerpts here..."
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-obsidian-950 text-sm focus:outline-none focus:ring-2 focus:ring-chizmo-500 text-slate-900 dark:text-white font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`py-2 text-xs font-bold rounded-xl border capitalize transition-colors ${
                        difficulty === d
                          ? 'bg-chizmo-600 text-white border-chizmo-600 shadow-sm'
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
                  File Upload Formats (Phase 5 Pipeline)
                </label>
                <div className="flex gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-400">
                    <FileText className="w-3.5 h-3.5" /> PDF / DOCX
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
                variant="primary"
                size="lg"
                isLoading={isGenerating}
                className="w-full text-base font-bold shadow-lg shadow-chizmo-500/25"
              >
                <Sparkles className="w-5 h-5 mr-1" /> Chunk, Ground & Generate Flashcards
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Manual Deck Studio Tab */}
      {!isGenerating && activeTab === 'manual' && (
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
                placeholder="Detailed objectives or target exam..."
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
                placeholder="Spanish, Grammar, High-Yield"
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