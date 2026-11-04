'use client';

import React, { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { ChizzyMascot } from '@/components/brand/ChizzyMascot';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  Clock,
  RotateCcw,
  Sparkles,
  Trophy,
} from 'lucide-react';

interface MatchTile {
  id: string; // unique tile id
  cardId: string; // card it belongs to
  text: string;
  isPrompt: boolean;
  isMatched: boolean;
}

export default function MatchModePage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = use(params);

  const [deckTitle, setDeckTitle] = useState('Match Mode');
  const [tiles, setTiles] = useState<MatchTile[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [mismatchedPair, setMismatchedPair] = useState<[string, string] | null>(null);
  const [loading, setLoading] = useState(true);

  // Live Timer
  const [elapsedMs, setElapsedMs] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const matchedCount = tiles.filter((t) => t.isMatched).length;
  const isComplete = tiles.length > 0 && matchedCount === tiles.length;

  useEffect(() => {
    if (!deckId) return;
    fetch(`/api/study/${deckId}/queue`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.items) {
          setDeckTitle(data.deckTitle || 'Match Mode');

          // Pick up to 6 cards for a 12-tile matching grid
          const sample = data.items.slice(0, 6).map((it: any) => it.card);
          const generatedTiles: MatchTile[] = [];

          sample.forEach((c: any, idx: number) => {
            generatedTiles.push({
              id: `p-${idx}`,
              cardId: c.id,
              text: c.front,
              isPrompt: true,
              isMatched: false,
            });
            generatedTiles.push({
              id: `a-${idx}`,
              cardId: c.id,
              text: c.back,
              isPrompt: false,
              isMatched: false,
            });
          });

          // Shuffle tiles randomly
          setTiles(generatedTiles.sort(() => Math.random() - 0.5));
          setTimerRunning(true);
        }
      })
      .finally(() => setLoading(false));
  }, [deckId]);

  // Stopwatch timer
  useEffect(() => {
    if (!timerRunning || isComplete) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const start = Date.now() - elapsedMs;
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - start);
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, isComplete]);

  // Celebration confetti on complete
  useEffect(() => {
    if (isComplete && tiles.length > 0) {
      setTimerRunning(false);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6366F1', '#10B981', '#F59E0B'],
      });
    }
  }, [isComplete, tiles.length]);

  const handleTileClick = (clickedTile: MatchTile) => {
    if (clickedTile.isMatched || mismatchedPair) return;

    if (!selectedTileId) {
      // First tile clicked
      setSelectedTileId(clickedTile.id);
      return;
    }

    if (selectedTileId === clickedTile.id) {
      // Deselect
      setSelectedTileId(null);
      return;
    }

    const firstTile = tiles.find((t) => t.id === selectedTileId);
    if (!firstTile) return;

    // Second tile clicked -> check match!
    if (firstTile.cardId === clickedTile.cardId && firstTile.id !== clickedTile.id) {
      // MATCH!
      setTiles((prev) =>
        prev.map((t) =>
          t.id === firstTile.id || t.id === clickedTile.id ? { ...t, isMatched: true } : t
        )
      );
      setSelectedTileId(null);
    } else {
      // MISMATCH
      setMismatchedPair([firstTile.id, clickedTile.id]);
      setTimeout(() => {
        setMismatchedPair(null);
        setSelectedTileId(null);
      }, 700);
    }
  };

  const formattedTime = (elapsedMs / 1000).toFixed(1);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-6">
        <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Completion View
  if (isComplete) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-8 animate-in fade-in duration-200">
        <div className="relative inline-block animate-float">
          <ChizzyMascot size={120} mood="supercharged" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Match Cleared in {formattedTime}s! 🧩
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Speed tile-matching cements associative recall!
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 shadow-sm max-w-sm mx-auto">
          <Trophy className="w-10 h-10 text-volt-500 mx-auto mb-2" />
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {formattedTime}s
          </div>
          <div className="text-xs text-slate-400 font-medium mt-1">Final Clear Time</div>
        </div>

        <div className="flex gap-3 justify-center pt-4">
          <Link href={`/decks/${deckId}`}>
            <Button size="lg" variant="primary">
              Back to Deck Studio
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              setTiles((prev) =>
                prev.map((t) => ({ ...t, isMatched: false })).sort(() => Math.random() - 0.5)
              );
              setElapsedMs(0);
              setSelectedTileId(null);
              setMismatchedPair(null);
              setTimerRunning(true);
            }}
          >
            <RotateCcw className="w-4 h-4 mr-1" /> Play Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/decks/${deckId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </Link>

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-volt-500" />
          <span className="text-base font-black text-slate-900 dark:text-white font-mono">
            {formattedTime}s
          </span>
        </div>

        <Badge variant="volt" className="text-xs font-bold">
          🧩 Tile Match
        </Badge>
      </div>

      {/* Grid of Match Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {tiles.map((tile) => {
          if (tile.isMatched) {
            return (
              <div
                key={tile.id}
                className="h-28 sm:h-32 rounded-2xl border-2 border-transparent bg-slate-50/50 dark:bg-slate-900/30 opacity-0 pointer-events-none transition-opacity duration-300"
              />
            );
          }

          const isSelected = selectedTileId === tile.id;
          const isMismatched = mismatchedPair && mismatchedPair.includes(tile.id);

          let tileClass = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:border-chizmo-500';

          if (isSelected) {
            tileClass = 'border-chizmo-600 bg-chizmo-50/60 dark:bg-chizmo-950/40 text-chizmo-700 dark:text-chizmo-300 shadow-lg scale-102';
          } else if (isMismatched) {
            tileClass = 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-600 animate-shake';
          }

          return (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile)}
              className={`h-28 sm:h-32 p-3.5 rounded-2xl border-2 font-bold text-xs sm:text-sm text-center flex items-center justify-center select-none active:scale-95 transition-all shadow-sm ${tileClass}`}
            >
              <span className="line-clamp-4 leading-snug">{tile.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}