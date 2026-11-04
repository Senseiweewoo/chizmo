'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChizzyMascot } from '@/components/brand/ChizzyMascot';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Radio,
  Users,
  Play,
  Sparkles,
  ArrowRight,
  QrCode,
  Zap,
  Flame,
  Clock,
  Layers,
} from 'lucide-react';

const AVATAR_OPTIONS = ['⚡', '🦉', '🚀', '🔥', '🧠', '🌟', '🎯', '🦊'];

export default function LiveArenaLobbyPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'join' | 'host'>('join');
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('⚡');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Host state
  const [decks, setDecks] = useState<any[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [durationSec, setDurationSec] = useState(15);
  const [isCreatingHost, setIsCreatingHost] = useState(false);

  useEffect(() => {
    fetch('/api/decks')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.decks && data.decks.length > 0) {
          setDecks(data.decks);
          setSelectedDeckId(data.decks[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim().toUpperCase();
    if (cleanPin.length !== 6 || !nickname.trim()) {
      setJoinError('Please enter a valid 6-character game PIN and your nickname.');
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      const playerId = `p-${Date.now()}`;
      const res = await fetch(`/api/live/rooms/${cleanPin}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          nickname,
          avatar,
        }),
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem(`chizmo_live_${cleanPin}`, JSON.stringify({ playerId, nickname, avatar }));
        router.push(`/live/play/${cleanPin}`);
      } else {
        setJoinError(data.error || 'Failed to join game room.');
      }
    } catch {
      setJoinError('Network error joining room.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateHostRoom = async () => {
    if (!selectedDeckId) return;
    setIsCreatingHost(true);

    try {
      const res = await fetch('/api/live/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckId: selectedDeckId,
          durationSec,
        }),
      });

      const data = await res.json();
      if (data.success && data.code) {
        router.push(`/live/host/${data.code}`);
      }
    } finally {
      setIsCreatingHost(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 pb-24 animate-in fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <ChizzyMascot mood="supercharged" size={72} animated className="mx-auto" />
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-extrabold text-xs">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          Chizmo Live Arena
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Real-Time Multiplayer Quizzing
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Compete head-to-head with classmates or friends. Server-authoritative speed scoring, live podiums, and instant retention.
        </p>
      </div>

      {/* Tabs: Join vs Host */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl max-w-sm mx-auto">
        <button
          onClick={() => setActiveTab('join')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'join'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          🎮 Join Game PIN
        </button>
        <button
          onClick={() => setActiveTab('host')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'host'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          👑 Host Game
        </button>
      </div>

      {/* TAB 1: JOIN GAME */}
      {activeTab === 'join' && (
        <Card className="p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          <form onSubmit={handleJoinGame} className="space-y-4">
            <div className="space-y-1.5 text-center">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Enter 6-Digit Game Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                placeholder="e.g. CHZ492"
                className="w-full text-center text-3xl font-black tracking-widest p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white uppercase focus:border-chizmo-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Your Nickname
              </label>
              <input
                type="text"
                maxLength={20}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Pick a fun study handle..."
                className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-chizmo-600"
              />
            </div>

            {/* Avatar Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Choose Mascot Icon
              </label>
              <div className="flex items-center justify-between gap-1">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setAvatar(av)}
                    className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${
                      avatar === av
                        ? 'bg-chizmo-600 text-white scale-110 shadow-md ring-2 ring-indigo-400'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {joinError && (
              <p className="text-xs font-semibold text-red-500 text-center animate-shake">
                ⚠️ {joinError}
              </p>
            )}

            <Button
              type="submit"
              variant="volt"
              size="lg"
              disabled={isJoining || pin.length !== 6 || !nickname.trim()}
              className="w-full font-black text-base shadow-lg shadow-volt-500/25 py-4"
            >
              {isJoining ? 'Connecting to Room...' : 'Enter Live Arena ⚡'}
            </Button>
          </form>
        </Card>
      )}

      {/* TAB 2: HOST GAME */}
      {activeTab === 'host' && (
        <Card className="p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Select Deck to Host
              </label>
              {decks.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-center space-y-2">
                  <p className="text-xs text-slate-500">You need at least one deck to host a live quiz.</p>
                  <Link href="/create">
                    <Button variant="volt" size="sm">Create Deck</Button>
                  </Link>
                </div>
              ) : (
                <select
                  value={selectedDeckId}
                  onChange={(e) => setSelectedDeckId(e.target.value)}
                  className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {decks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.cardCount} cards)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Question Timer Settings */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Timer Per Question
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 15, 30].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setDurationSec(sec)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      durationSec === sec
                        ? 'bg-chizmo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {sec} Seconds
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Host Controls:
              </p>
              <p>
                You control when questions advance. Players answer simultaneously on their phones with Kahoot-style color pads.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={isCreatingHost || decks.length === 0}
              onClick={handleCreateHostRoom}
              className="w-full font-black text-base shadow-lg shadow-indigo-600/25 py-4"
            >
              {isCreatingHost ? 'Launching Lobby...' : 'Launch Host Lobby 👑'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
