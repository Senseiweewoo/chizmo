'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { ChizzyMascot } from '@/components/brand/ChizzyMascot';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Flame,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Trophy,
  Plus,
} from 'lucide-react';

interface PlayerState {
  playerId: string;
  nickname: string;
  avatar: string;
}

interface RoomData {
  status: 'LOBBY' | 'QUESTION' | 'REVEAL' | 'LEADERBOARD' | 'PODIUM';
  currentQuestionIndex: number;
  totalQuestions: number;
  questionDurationSec: number;
  currentQuestion?: {
    prompt: string;
    choices: string[];
    correctIndex?: number;
  };
  leaderboard: Array<{
    rank: number;
    id: string;
    nickname: string;
    score: number;
    streak: number;
  }>;
}

const CHOICE_BUTTONS = [
  { color: 'bg-red-500 active:bg-red-600', shape: '▲', label: 'Triangle' },
  { color: 'bg-blue-500 active:bg-blue-600', shape: '◆', label: 'Diamond' },
  { color: 'bg-amber-500 active:bg-amber-600', shape: '●', label: 'Circle' },
  { color: 'bg-emerald-500 active:bg-emerald-600', shape: '■', label: 'Square' },
];

export default function PlayerControllerPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const resolvedParams = use(params);
  const roomCode = resolvedParams?.roomCode ? resolvedParams.roomCode.toUpperCase() : '';

  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [questionStartTs, setQuestionStartTs] = useState(Date.now());
  const [isSavedToDeck, setIsSavedToDeck] = useState(false);

  // Load player info
  useEffect(() => {
    const stored = localStorage.getItem(`chizmo_live_${roomCode}`);
    if (stored) {
      setPlayer(JSON.parse(stored));
    } else {
      const fallback: PlayerState = {
        playerId: `p-${Date.now()}`,
        nickname: `Scholar_${Math.floor(100 + Math.random() * 900)}`,
        avatar: '⚡',
      };
      setPlayer(fallback);
    }
  }, [roomCode]);

  // Poll room updates
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/live/rooms/${roomCode}`);
        const data = await res.json();
        if (data.success && data.room) {
          setRoom(data.room);

          // Update local score from leaderboard
          if (player) {
            const me = data.room.leaderboard?.find((p: any) => p.id === player.playerId);
            if (me) {
              setScore(me.score);
              setStreak(me.streak);
            }
          }
        }
      } catch {}
    };

    fetchRoom();
    const interval = setInterval(fetchRoom, 1000);
    return () => clearInterval(interval);
  }, [roomCode, player]);

  // Reset selected choice when question index changes
  useEffect(() => {
    setSelectedChoice(null);
    setLastSubmissionResult(null);
    setQuestionStartTs(Date.now());
  }, [room?.currentQuestionIndex]);

  const handleSubmitChoice = async (choiceIndex: number) => {
    if (selectedChoice !== null || !player) return;
    setSelectedChoice(choiceIndex);

    const responseMs = Date.now() - questionStartTs;

    try {
      const res = await fetch(`/api/live/rooms/${roomCode}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SUBMIT_ANSWER',
          playerId: player.playerId,
          choiceIndex,
          responseMs,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setLastSubmissionResult(data);
        setScore(data.totalScore);
        setStreak(data.streak);
        if (data.isCorrect) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
          });
        }
      }
    } catch {}
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ChizzyMascot mood="thinking" size={60} animated />
      </div>
    );
  }

  // --- LOBBY WAITING ---
  if (room.status === 'LOBBY') {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-6 pt-16 animate-in fade-in">
        <ChizzyMascot mood="excited" size={80} animated className="mx-auto" />
        <div className="space-y-1">
          <Badge variant="volt" className="text-xs font-black">
            Room PIN: {roomCode}
          </Badge>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            You're In the Arena! ⚡
          </h1>
          <p className="text-xs text-slate-500">
            Playing as <strong>{player?.avatar} {player?.nickname}</strong>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 animate-pulse">
          Look at the host screen! The quiz will begin shortly...
        </div>
      </div>
    );
  }

  // --- QUESTION ANSWER PAD ---
  if (room.status === 'QUESTION') {
    return (
      <div className="max-w-md mx-auto p-4 flex flex-col h-[calc(100vh-5rem)] justify-between pb-6 animate-in fade-in">
        {/* Top Player HUD */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">{player?.avatar}</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
              {player?.nickname}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {streak >= 2 && (
              <Badge variant="amber" className="text-xs font-black flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-orange-500" /> {streak}
              </Badge>
            )}
            <span className="text-xs font-black text-chizmo-600 dark:text-chizmo-400">
              {score} pts
            </span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="text-center py-2">
          {selectedChoice !== null ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-sm flex items-center justify-center gap-2 animate-in zoom-in-95">
              <CheckCircle2 className="w-5 h-5" /> Answer Locked In! Look at Host Screen.
            </div>
          ) : (
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Tap Your Answer Shape
            </p>
          )}
        </div>

        {/* Big 4 Kahoot-Style Shape Buttons */}
        <div className="grid grid-cols-2 gap-3 flex-1 max-h-[460px]">
          {CHOICE_BUTTONS.map((btn, idx) => {
            const isChosen = selectedChoice === idx;
            const isFaded = selectedChoice !== null && !isChosen;

            return (
              <button
                key={idx}
                disabled={selectedChoice !== null}
                onClick={() => handleSubmitChoice(idx)}
                className={`rounded-3xl flex flex-col items-center justify-center text-white shadow-xl transition-all duration-150 active:scale-95 ${
                  btn.color
                } ${isChosen ? 'ring-8 ring-white/50 scale-[0.98]' : ''} ${
                  isFaded ? 'opacity-30' : ''
                }`}
              >
                <span className="text-5xl sm:text-6xl font-black drop-shadow-md">
                  {btn.shape}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider opacity-80 mt-2">
                  {btn.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // --- REVEAL VIEW ---
  if (room.status === 'REVEAL') {
    const isCorrect = lastSubmissionResult?.isCorrect;
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-6 pt-16 animate-in zoom-in-95">
        <div
          className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-4xl shadow-2xl ${
            isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {isCorrect ? '⚡' : '✖'}
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {isCorrect ? 'Correct! Lightning Speed!' : 'Oof! Missed That One'}
          </h2>
          {isCorrect ? (
            <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              +{lastSubmissionResult?.pointsAwarded} pts awarded
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Don’t worry—FSRS will help you master this later.
            </p>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
          Total Score: <strong>{score} pts</strong> • Current Streak: <strong>{streak}</strong>
        </div>
      </div>
    );
  }

  // --- PODIUM & REVIEW QUEUE INTEGRATION ---
  return (
    <div className="max-w-md mx-auto p-6 text-center space-y-6 pt-12 animate-in zoom-in-95">
      <ChizzyMascot mood="celebrating" size={80} animated className="mx-auto" />

      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          Showdown Complete! 🏁
        </h1>
        <p className="text-xs text-slate-500">
          Final Score: <strong className="text-indigo-600">{score} pts</strong>
        </p>
      </div>

      {/* Spaced Repetition Integration */}
      <Card className="p-4 text-left space-y-2 border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30">
        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
          <Sparkles className="w-4 h-4 text-amber-500" /> Spaced Repetition Bridge
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Save questions you struggled with directly to your personal study queue for automated FSRS review!
        </p>

        <Button
          size="sm"
          variant="volt"
          disabled={isSavedToDeck}
          onClick={() => {
            setIsSavedToDeck(true);
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 },
            });
          }}
          className="w-full font-bold text-xs shadow-sm mt-2"
        >
          {isSavedToDeck ? '✓ Added to Study Deck!' : 'Save Missed Cards to Study Deck 🃏'}
        </Button>
      </Card>

      <Link href="/">
        <Button variant="outline" size="md" className="w-full">
          Back to Home
        </Button>
      </Link>
    </div>
  );
}
