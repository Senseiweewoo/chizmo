'use client';

import React, { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import { ChizzyMascot } from '@/components/brand/ChizzyMascot';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  Sparkles,
  Send,
  HelpCircle,
  Lightbulb,
  Plus,
  BookOpen,
  AlertTriangle,
  PhoneCall,
  Check,
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  citations?: string[];
  suggestedActions?: string[];
  isCrisis?: boolean;
  hotlines?: Array<{ name: string; contact: string; detail: string }>;
}

export default function SocraticTutorPage({ params }: { params: Promise<{ deckId: string }> }) {
  const resolvedParams = use(params);
  const deckId = resolvedParams.deckId;

  const [deckTitle, setDeckTitle] = useState('Study Deck');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-welcome',
      sender: 'tutor',
      text: "Hey there! I'm Chizzy, your AI learning coach ⚡. What concept from this deck would you like to explore or test yourself on?",
      suggestedActions: [
        'Test me on the hardest concept',
        'Explain the core mechanism',
        'Give me a mnemonic hint',
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [deckCardsCount, setDeckCardsCount] = useState(0);
  const [savedAsCardMsg, setSavedAsCardMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/decks/${deckId}/cards`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDeckTitle(data.deckTitle || 'Deck');
          setDeckCardsCount(data.cards?.length || 0);
        }
      })
      .catch(() => {});
  }, [deckId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isSending) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckId,
          message: query,
          history: messages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        const tutorMsg: Message = {
          id: `t-${Date.now()}`,
          sender: 'tutor',
          text: data.reply,
          citations: data.citations,
          suggestedActions: data.suggestedActions,
          isCrisis: data.isCrisis,
          hotlines: data.hotlines,
        };
        setMessages((prev) => [...prev, tutorMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'tutor',
            text: 'I ran into a connection glitch. Let’s try that question again! ⚡',
          },
        ]);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveAsCard = async (conceptText: string) => {
    const front = conceptText.length > 80 ? conceptText.slice(0, 80) + '...' : conceptText;
    const back = 'Key insight derived from Chizzy Socratic session.';

    const res = await fetch(`/api/decks/${deckId}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ front, back, hint: 'Generated from AI Tutor dialogue' }),
    });

    const data = await res.json();
    if (data.success) {
      setSavedAsCardMsg('Saved to deck as a new flashcard! 🃏');
      setTimeout(() => setSavedAsCardMsg(null), 3000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 flex flex-col h-[calc(100vh-6rem)]">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <Link
          href={`/decks/${deckId}`}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </Link>

        <div className="flex items-center gap-2">
          <ChizzyMascot mood="explaining" size={32} />
          <div className="text-left">
            <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Chizzy Socratic Tutor</span>
              <Badge variant="volt" className="text-[9px]">Grounded AI</Badge>
            </h1>
            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
              {deckTitle} ({deckCardsCount} cards)
            </p>
          </div>
        </div>

        <Link href={`/study/${deckId}/summary`}>
          <Button variant="outline" size="sm" className="text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5 mr-1" /> Summary
          </Button>
        </Link>
      </div>

      {savedAsCardMsg && (
        <div className="p-2.5 my-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 animate-in fade-in">
          <Check className="w-4 h-4" /> {savedAsCardMsg}
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-none">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.sender === 'user' ? 'items-end' : 'items-start'
            } animate-in fade-in`}
          >
            {/* Sender Label */}
            <div className="flex items-center gap-1.5 mb-1 px-1">
              {m.sender === 'tutor' && (
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Chizzy
                </span>
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`p-4 rounded-2xl max-w-[88%] sm:max-w-[80%] text-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-chizmo-600 text-white rounded-br-none shadow-md shadow-chizmo-600/20 font-medium'
                  : m.isCrisis
                  ? 'bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 text-red-950 dark:text-red-100 rounded-bl-none shadow-lg'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'
              }`}
            >
              {/* Crisis Banner Callout */}
              {m.isCrisis && (
                <div className="mb-3 p-3 rounded-xl bg-red-100/80 dark:bg-red-900/40 border border-red-300 dark:border-red-700 flex items-start gap-2.5">
                  <PhoneCall className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-red-900 dark:text-red-200">
                      Emergency Support Resources (Available 24/7):
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {m.hotlines?.map((h) => (
                        <li key={h.name}>
                          <strong>{h.name}:</strong> {h.contact} — {h.detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <p className="whitespace-pre-line">{m.text}</p>

              {/* Citations / Grounded Reference */}
              {m.citations && m.citations.length > 0 && !m.isCrisis && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-400">Grounded in:</span>
                  {m.citations.map((c, i) => (
                    <Badge key={i} variant="indigo" className="text-[9px] max-w-[200px] truncate">
                      {c}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Save as card action */}
              {m.sender === 'tutor' && !m.isCrisis && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end">
                  <button
                    onClick={() => handleSaveAsCard(m.text)}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Save insight as flashcard
                  </button>
                </div>
              )}
            </div>

            {/* Quick Follow-up Suggestions */}
            {m.suggestedActions && m.suggestedActions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5 pl-1">
                {m.suggestedActions.map((act) => (
                  <button
                    key={act}
                    onClick={() => handleSendMessage(act)}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-all text-left"
                  >
                    {act}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isSending && (
          <div className="flex items-center gap-2 p-3 text-xs text-slate-500 animate-pulse">
            <ChizzyMascot mood="thinking" size={24} animated />
            <span>Chizzy is formulating a Socratic insight...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-chizmo-600"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a question or request a Socratic hint..."
            disabled={isSending}
            className="flex-1 px-3 py-2 text-sm bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!inputText.trim() || isSending}
            className="rounded-xl px-3 font-bold"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-[10px] text-slate-400 text-center mt-1.5">
          Chizzy asks guiding questions to build deep active retention, not homework solutions.
        </p>
      </div>
    </div>
  );
}
