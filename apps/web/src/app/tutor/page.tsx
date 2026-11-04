'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ChizzyMascot } from '@/components/brand/ChizzyMascot';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  Send,
  HelpCircle,
  Lightbulb,
  Plus,
  BookOpen,
  ArrowRight,
  PhoneCall,
  Check,
  GraduationCap,
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

export default function GeneralTutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-welcome',
      sender: 'tutor',
      text: "Hey! I'm Chizzy, your personal AI learning coach ⚡. What topic or exam problem are you working on today? Tell me what you know so far, and we'll break it down together!",
      suggestedActions: [
        'Explain photosynthesis vs cellular respiration',
        'How does FSRS spaced repetition work?',
        'Quiz me on SAT verbal analogies',
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [userDecks, setUserDecks] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/decks')
      .then((res) => res.json())
      .then((data) => {
        if (data.decks && data.decks.length > 0) {
          setUserDecks(data.decks.map((d: any) => ({ id: d.id, title: d.title })));
        }
      })
      .catch(() => {});
  }, []);

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
          deckId: selectedDeckId || undefined,
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
            text: 'I hit a quick network hiccup. Try asking that once more! ⚡',
          },
        ]);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 flex flex-col h-[calc(100vh-6rem)]">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <ChizzyMascot mood="explaining" size={40} animated />
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Chizzy Socratic AI Tutor</span>
              <Badge variant="volt" className="text-[10px]">Active Recall</Badge>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Guided inquiry, mnemonics, and conceptual hints that stick.
            </p>
          </div>
        </div>

        {/* Deck Grounding Selector */}
        {userDecks.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Context:</span>
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-obsidian-900 px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-chizmo-500"
            >
              <option value="">General (All Topics)</option>
              {userDecks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

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
                <span className="text-[11px] font-bold text-chizmo-600 dark:text-chizmo-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Chizzy Coach
                </span>
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`p-4 rounded-2xl max-w-[90%] sm:max-w-[80%] text-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-chizmo-600 text-white rounded-br-none shadow-md shadow-chizmo-600/20 font-medium'
                  : m.isCrisis
                  ? 'bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 text-red-950 dark:text-red-100 rounded-bl-none shadow-lg'
                  : 'bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'
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
            </div>

            {/* Quick Suggestions */}
            {m.suggestedActions && m.suggestedActions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5 pl-1">
                {m.suggestedActions.map((act) => (
                  <button
                    key={act}
                    onClick={() => handleSendMessage(act)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-obsidian-900 hover:bg-chizmo-50 dark:hover:bg-chizmo-950/40 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-chizmo-600 transition-all text-left"
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
          className="flex items-center gap-2 bg-white dark:bg-obsidian-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-chizmo-600"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a question or describe a concept you find difficult..."
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
          Academic Integrity: Chizzy guides you through solutions with Socratic questioning rather than writing homework for you.
        </p>
      </div>
    </div>
  );
}
