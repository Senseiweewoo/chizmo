'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ChizzyMascot } from '@/components/brand/ChizzyMascot';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  Play,
  MessageSquare,
  Copy,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SummaryData {
  title: string;
  format: string;
  executiveTldr: string;
  keyConcepts: Array<{
    concept: string;
    explanation: string;
    mnemonic?: string;
  }>;
  commonPitfalls: string[];
  highYieldQuestions: Array<{
    questionNumber: number;
    prompt: string;
    answerKey: string;
  }>;
  cardCount: number;
}

export default function DeckSummaryPage({ params }: { params: Promise<{ deckId: string }> }) {
  const resolvedParams = use(params);
  const deckId = resolvedParams.deckId;

  const [data, setData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    fetch('/api/ai/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deckId, format: 'TLDR' }),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData);
        }
      })
      .finally(() => setIsLoading(false));
  }, [deckId]);

  const toggleReveal = (qNum: number) => {
    setRevealedAnswers((prev) => ({
      ...prev,
      [qNum]: !prev[qNum],
    }));
  };

  const handleCopySummary = () => {
    if (!data) return;
    const text = `# ${data.title} - Executive Study Synthesis\n\n## Overview\n${data.executiveTldr}\n\n## Key Concepts\n${data.keyConcepts.map((k) => `- **${k.concept}**: ${k.explanation}`).join('\n')}\n\n## Exam Pitfalls\n${data.commonPitfalls.map((p) => `- ⚠️ ${p}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="flex flex-col items-center gap-4">
          <ChizzyMascot mood="thinking" size={80} animated />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">
            Synthesizing Executive Study Guide & Pitfalls...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4 pt-16">
        <ChizzyMascot mood="explaining" size={80} />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Summary Unavailable</h2>
        <p className="text-sm text-slate-500">
          This deck might not have enough cards yet. Add some flashcards first!
        </p>
        <Link href={`/decks/${deckId}`}>
          <Button variant="volt">Back to Deck Studio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-24">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/decks/${deckId}`}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Deck Studio
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopySummary}
            className="text-xs font-semibold"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Copied Markdown
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1" /> Copy Summary
              </>
            )}
          </Button>

          <Link href={`/study/${deckId}/tutor`}>
            <Button variant="primary" size="sm" className="text-xs font-bold shadow-md shadow-indigo-600/20">
              <MessageSquare className="w-3.5 h-3.5 mr-1" /> Socratic Tutor
            </Button>
          </Link>
        </div>
      </div>

      {/* Guide Header Banner */}
      <Card className="p-6 sm:p-8 bg-gradient-to-br from-indigo-50 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 border-2 border-indigo-100 dark:border-indigo-900/40 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-chizmo-600 text-white flex items-center justify-center font-black shadow-md shadow-chizmo-600/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="volt" className="text-[10px]">AI Executive Guide</Badge>
              <span className="text-xs text-slate-400 font-medium">{data.cardCount} Cards Analyzed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {data.title}
            </h1>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-2">
          {data.executiveTldr}
        </p>
      </Card>

      {/* Common Exam Pitfalls Callout */}
      <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-500" /> High-Yield Exam Pitfalls & Traps
        </div>
        <p className="text-xs text-amber-800/80 dark:text-amber-300">
          Examiners frequently construct distractors around these common confusions:
        </p>
        <ul className="space-y-1.5 text-xs text-amber-900 dark:text-amber-200 font-medium">
          {data.commonPitfalls.map((pitfall, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-amber-500 font-bold">⚠️</span>
              <span>{pitfall}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Key Concepts Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>Core Concept Glossary</span>
          <Badge variant="indigo" className="text-[10px]">{data.keyConcepts.length} Terms</Badge>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.keyConcepts.map((item, idx) => (
            <Card
              key={idx}
              className="p-4 space-y-2 border border-slate-200 dark:border-slate-800 hover:border-slate-300 transition-all bg-white dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {item.concept}
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold">#{idx + 1}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.explanation}
              </p>
              {item.mnemonic && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg font-medium">
                  💡 {item.mnemonic}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* High-Yield Self-Test Questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>High-Yield Active Recall Checks</span>
            <Badge variant="volt" className="text-[10px]">Self-Quiz</Badge>
          </h2>
          <span className="text-xs text-slate-400 font-medium">Test yourself before revealing</span>
        </div>

        <div className="space-y-3">
          {data.highYieldQuestions.map((q) => {
            const isRevealed = revealedAnswers[q.questionNumber];
            return (
              <Card
                key={q.questionNumber}
                className="p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase">
                      Recall Check #{q.questionNumber}
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {q.prompt}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleReveal(q.questionNumber)}
                    className="text-xs shrink-0"
                  >
                    {isRevealed ? (
                      <>
                        Hide <ChevronUp className="w-3.5 h-3.5 ml-1" />
                      </>
                    ) : (
                      <>
                        Reveal Answer <ChevronDown className="w-3.5 h-3.5 ml-1" />
                      </>
                    )}
                  </Button>
                </div>

                {isRevealed && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 font-medium animate-in fade-in">
                    <p className="font-bold flex items-center gap-1 text-emerald-700 dark:text-emerald-400 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Answer Key:
                    </p>
                    <p>{q.answerKey}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA to study */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-volt-500 text-white shadow-lg shadow-indigo-600/20">
        <div>
          <h3 className="font-bold text-sm">Ready to cement this in your memory?</h3>
          <p className="text-xs text-indigo-100">Study these cards with FSRS-4.5 spaced repetition.</p>
        </div>

        <Link href={`/study/${deckId}`}>
          <Button variant="secondary" size="md" className="font-bold shadow-sm">
            <Play className="w-4 h-4 mr-1 fill-slate-950" /> Start Session
          </Button>
        </Link>
      </div>
    </div>
  );
}
