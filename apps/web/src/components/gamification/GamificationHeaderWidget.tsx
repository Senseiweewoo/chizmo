'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Flame, Zap, Trophy, ShieldCheck, Snowflake, ChevronRight } from 'lucide-react';

interface ProfileData {
  state: {
    xp: number;
    level: number;
    streakDays: number;
    freezesRemaining: number;
    cardsStudiedToday: number;
  };
  levelProgress: number;
  nextLevelXp: number;
  quests: Array<{
    id: string;
    title: string;
    description: string;
    target: number;
    current: number;
    xpReward: number;
    isCompleted: boolean;
    icon: string;
  }>;
  settings: {
    streaksEnabled: boolean;
    leaderboardEnabled: boolean;
  };
}

export function GamificationHeaderWidget() {
  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    fetch('/api/gamification/profile')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.profile) {
          setData(resData.profile);
        }
      })
      .catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {/* Level & XP Progress Pill */}
      <Link href="/leaderboard" className="group">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 hover:border-indigo-400 transition-all cursor-pointer">
          <div className="w-6 h-6 rounded-lg bg-chizmo-600 text-white flex items-center justify-center text-xs font-black shadow-sm">
            {data.state.level}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-slate-700 dark:text-slate-200">
              <span>Lvl {data.state.level}</span>
              <span className="text-chizmo-600 dark:text-chizmo-400">{data.state.xp} XP</span>
            </div>
            {/* Progress Bar */}
            <div className="w-16 h-1.5 rounded-full bg-indigo-200 dark:bg-indigo-900 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-volt-400 transition-all duration-500"
                style={{ width: `${data.levelProgress}%` }}
              />
            </div>
          </div>
        </div>
      </Link>

      {/* Streak & Freeze Indicator (if enabled) */}
      {data.settings.streaksEnabled && (
        <Link href="/leaderboard" className="group">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 hover:border-amber-400 transition-all cursor-pointer">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black text-amber-900 dark:text-amber-200">
              {data.state.streakDays}
            </span>

            {/* Banked Freezes */}
            {data.state.freezesRemaining > 0 && (
              <span
                className="text-[10px] text-sky-600 dark:text-sky-400 flex items-center gap-0.5 ml-1"
                title={`${data.state.freezesRemaining} Streak Freeze(s) Banked`}
              >
                <Snowflake className="w-3 h-3" />
                <span>{data.state.freezesRemaining}</span>
              </span>
            )}
          </div>
        </Link>
      )}

      {/* Leaderboard & Trophies Link */}
      {data.settings.leaderboardEnabled && (
        <Link href="/leaderboard">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">League</span>
          </button>
        </Link>
      )}
    </div>
  );
}
