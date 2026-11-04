'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { ChizzyMascot } from '@/components/brand/ChizzyMascot';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Users,
  Play,
  ArrowRight,
  Clock,
  Trophy,
  Award,
  Crown,
  RotateCcw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface RoomData {
  code: string;
  hostId: string;
  deckId: string;
  deckTitle: string;
  status: 'LOBBY' | 'QUESTION' | 'REVEAL' | 'LEADERBOARD' | 'PODIUM';
  currentQuestionIndex: number;
  totalQuestions: number;
  questionDurationSec: number;
  playerCount: number;
  currentQuestion?: {
    prompt: string;
    choices: string[];
    correctIndex?: number;
    explanation?: string;
  };
  leaderboard: Array<{
    rank: number;
    id: string;
    nickname: string;
    avatar: string;
    score: number;
    streak: number;
  }>;
}

const CHOICE_COLORS = [
  'bg-red-500 text-white',
  'bg-blue-500 text-white',
  'bg-amber-500 text-white',
  'bg-emerald-500 text-white',
];

const CHOICE_SHAPES = ['▲', '◆', '●', '■'];

export default function HostLiveRoomPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const resolvedParams = use(params);
  const roomCode = resolvedParams.roomCode.toUpperCase();

  const [room, setRoom] = useState<RoomData | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isLoading, setIsLoading] = useState(true);

  // Poll room state
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/live/rooms/${roomCode}`);
        const data = await res.json();
        if (data.success && data.room) {
          setRoom(data.room);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoom();
    const interval = setInterval(fetchRoom, 1000);
    return () => clearInterval(interval);
  }, [roomCode]);

  // Timer countdown during active question
  useEffect(() => {
    if (room?.status !== 'QUESTION') return;
    setTimeLeft(room.questionDurationSec);

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [room?.status, room?.currentQuestionIndex]);

  // Trigger celebration on Podium
  useEffect(() => {
    if (room?.status === 'PODIUM') {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#6366F1', '#F59E0B', '#10B981'],
      });
    }
  }, [room?.status]);

  const handleAction = async (status: string) => {
    await fetch(`/api/live/rooms/${roomCode}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ADVANCE_STATE',
        status,
      }),
    });
  };

  if (isLoading || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="flex flex-col items-center gap-4">
          <ChizzyMascot mood="thinking" size={80} animated />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">
            Connecting to Host Terminal...
          </p>
        </div>
      </div>
    );
  }

  // --- 1. LOBBY VIEW ---
  if (room.status === 'LOBBY') {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 text-center pb-20">
        <div className="space-y-2">
          <Badge variant="volt" className="text-xs font-black">
            Host Control Room
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
            {room.deckTitle}
          </h1>
          <p className="text-xs text-slate-500">
            Tell players to visit <strong>/live</strong> and enter game PIN:
          </p>
        </div>

        {/* Huge PIN Display */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white shadow-2xl space-y-2 max-w-xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">
            Game Room PIN
          </p>
          <div className="text-6xl sm:text-7xl font-black tracking-wider text-amber-300 drop-shadow-md">
            {room.code}
          </div>
          <p className="text-xs text-indigo-200">
            {room.totalQuestions} Questions • {room.questionDurationSec}s per question
          </p>
        </div>

        {/* Connected Players Grid */}
        <div className="space-y-3 max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-500" />
              Connected Players ({room.leaderboard.length})
            </span>
            <span>Waiting for host to start...</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 min-h-[140px] flex flex-wrap gap-2 items-center justify-center">
            {room.leaderboard.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium animate-pulse">
                No players joined yet. Share PIN: {room.code}
              </p>
            ) : (
              room.leaderboard.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-900 dark:text-indigo-200 animate-in zoom-in-95"
                >
                  <span>{p.avatar}</span>
                  <span>{p.nickname}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <Button
          onClick={() => handleAction('QUESTION')}
          variant="volt"
          size="lg"
          disabled={room.leaderboard.length === 0}
          className="font-black text-base shadow-xl shadow-volt-500/25 px-8 py-4"
        >
          <Play className="w-5 h-5 mr-1 fill-slate-950" /> Start Quiz Showdown ⚡
        </Button>
      </div>
    );
  }

  // --- 2. ACTIVE QUESTION VIEW ---
  if (room.status === 'QUESTION') {
    const q = room.currentQuestion;
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <Badge variant="indigo" className="text-xs font-bold">
            Question {room.currentQuestionIndex + 1} of {room.totalQuestions}
          </Badge>

          {/* Countdown Clock */}
          <div
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-2xl font-black text-sm ${
              timeLeft <= 5
                ? 'bg-red-100 dark:bg-red-950/60 text-red-600 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>{timeLeft}s</span>
          </div>

          <Button
            onClick={() => handleAction('REVEAL')}
            variant="outline"
            size="sm"
            className="font-bold text-xs"
          >
            Reveal Answers Early
          </Button>
        </div>

        {/* Question Prompt */}
        <Card className="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-relaxed">
            {q?.prompt}
          </h2>
        </Card>

        {/* 4 Answer Choice Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {q?.choices.map((choice, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl font-bold text-base flex items-center gap-3 shadow-md ${CHOICE_COLORS[idx % 4]}`}
            >
              <span className="text-2xl font-black opacity-80">
                {CHOICE_SHAPES[idx % 4]}
              </span>
              <span>{choice}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- 3. REVEAL VIEW ---
  if (room.status === 'REVEAL') {
    const q = room.currentQuestion;
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <Badge variant="emerald" className="text-xs font-bold">
            Answer Revealed
          </Badge>
          <Button
            onClick={() => handleAction('LEADERBOARD')}
            variant="volt"
            size="md"
            className="font-bold text-xs shadow-md shadow-volt-500/25"
          >
            Show Leaderboard <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <Card className="p-8 text-center bg-white dark:bg-slate-900 border space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {q?.prompt}
          </h2>
          {q?.explanation && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              💡 {q.explanation}
            </p>
          )}
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {q?.choices.map((choice, idx) => {
            const isCorrect = idx === q.correctIndex;
            return (
              <div
                key={idx}
                className={`p-5 rounded-2xl font-bold text-base flex items-center justify-between shadow-md transition-all ${
                  isCorrect
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-300 dark:ring-emerald-800 scale-[1.02]'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black">
                    {CHOICE_SHAPES[idx % 4]}
                  </span>
                  <span>{choice}</span>
                </div>
                {isCorrect && <CheckCircle2 className="w-6 h-6 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- 4. LEADERBOARD VIEW ---
  if (room.status === 'LEADERBOARD') {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Round Standings
            </h2>
          </div>

          <Button
            onClick={() => handleAction('QUESTION')}
            variant="volt"
            size="md"
            className="font-bold text-xs"
          >
            Next Question <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <Card className="p-4 sm:p-6 divide-y divide-slate-100 dark:divide-slate-800">
          {room.leaderboard.slice(0, 5).map((p) => (
            <div key={p.id} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                    p.rank === 1
                      ? 'bg-amber-400 text-slate-950'
                      : p.rank === 2
                      ? 'bg-slate-300 text-slate-900'
                      : p.rank === 3
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-400'
                  }`}
                >
                  {p.rank}
                </span>
                <span className="text-lg">{p.avatar}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {p.nickname}
                </span>
                {p.streak >= 2 && (
                  <Badge variant="amber" className="text-[10px]">
                    🔥 {p.streak}
                  </Badge>
                )}
              </div>

              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                {p.score} pts
              </span>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  // --- 5. PODIUM FINALE ---
  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 text-center space-y-6 pt-8 pb-20 animate-in zoom-in-95">
      <div className="space-y-1">
        <ChizzyMascot mood="celebrating" size={80} animated className="mx-auto" />
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          Quiz Champions Podium! 👑
        </h1>
        <p className="text-xs text-slate-500">{room.deckTitle}</p>
      </div>

      {/* Top 3 Podium Box */}
      <div className="grid grid-cols-3 gap-3 items-end pt-8 pb-4">
        {room.leaderboard[1] && (
          <Card className="p-4 border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 order-1">
            <span className="text-2xl">🥈</span>
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-1">
              {room.leaderboard[1].nickname}
            </p>
            <p className="text-xs text-indigo-600 font-extrabold">{room.leaderboard[1].score} pts</p>
            <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl mt-2 flex items-center justify-center font-black">
              2nd
            </div>
          </Card>
        )}

        {room.leaderboard[0] && (
          <Card className="p-4 border-2 border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/40 order-2 -mt-6 shadow-xl shadow-amber-500/10">
            <span className="text-3xl">👑</span>
            <p className="text-sm font-black text-slate-900 dark:text-white truncate mt-1">
              {room.leaderboard[0].nickname}
            </p>
            <p className="text-xs text-amber-600 font-black">{room.leaderboard[0].score} pts</p>
            <div className="h-24 bg-amber-300 dark:bg-amber-800/40 rounded-xl mt-2 flex items-center justify-center font-black text-xl text-amber-900 dark:text-amber-200">
              1st
            </div>
          </Card>
        )}

        {room.leaderboard[2] && (
          <Card className="p-4 border-2 border-amber-800/40 dark:border-amber-900 bg-orange-50 dark:bg-orange-950/20 order-3">
            <span className="text-2xl">🥉</span>
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-1">
              {room.leaderboard[2].nickname}
            </p>
            <p className="text-xs text-indigo-600 font-extrabold">{room.leaderboard[2].score} pts</p>
            <div className="h-12 bg-orange-200 dark:bg-orange-950/40 rounded-xl mt-2 flex items-center justify-center font-black">
              3rd
            </div>
          </Card>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 pt-4">
        <Link href={`/decks/${room.deckId}`}>
          <Button variant="volt" size="md">
            Return to Deck Studio
          </Button>
        </Link>
        <Link href="/live">
          <Button variant="outline" size="md">
            Host Another Game
          </Button>
        </Link>
      </div>
    </div>
  );
}
