'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { ChizzyMascot } from '@/components/brand/ChizzyMascot';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Trophy,
  Flame,
  Target,
  Award,
  Settings,
  ArrowLeft,
  Snowflake,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
  Moon,
  Zap,
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  xp: number;
  isCurrentUser: boolean;
}

interface AchievementItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  isUnlocked: boolean;
}

interface QuestItem {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  isCompleted: boolean;
  icon: string;
}

export default function LeaderboardAndQuestsPage() {
  const [activeTab, setActiveTab] = useState<'league' | 'quests' | 'trophies'>('league');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState(1);
  const [isoWeek, setIsoWeek] = useState('');
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [profileState, setProfileState] = useState<any>(null);
  const [levelProgress, setLevelProgress] = useState(0);
  const [settings, setSettings] = useState({
    streaksEnabled: true,
    leaderboardEnabled: true,
    quietHoursStart: 21,
    quietHoursEnd: 8,
    dailyReminderEnabled: true,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [repairMsg, setRepairMsg] = useState<string | null>(null);

  useEffect(() => {
    // Fetch profile, quests, and achievements
    fetch('/api/gamification/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) {
          setProfileState(data.profile.state);
          setLevelProgress(data.profile.levelProgress);
          setQuests(data.profile.quests);
          setAchievements(data.profile.achievements);
          if (data.profile.settings) {
            setSettings(data.profile.settings);
          }
        }
      })
      .catch(() => {});

    // Fetch leaderboard
    fetch('/api/gamification/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLeaderboard(data.topLeaderboard || []);
          setUserRank(data.userRank || 1);
          setIsoWeek(data.isoWeek || '');
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSaveSettings = async () => {
    setIsSettingsOpen(false);
    fetch('/api/gamification/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }).catch(() => {});
  };

  const handleRepairStreak = async () => {
    const res = await fetch('/api/gamification/repair-streak', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      setRepairMsg(data.message);
      if (profileState) {
        setProfileState({ ...profileState, streakDays: profileState.streakDays + 1 });
      }
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } else {
      setRepairMsg(data.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-24">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Home Dashboard
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSettingsOpen(true)}
          className="text-xs font-semibold flex items-center gap-1.5"
        >
          <Settings className="w-3.5 h-3.5" /> Mindful Guardrails
        </Button>
      </div>

      {/* Hero Level & Mascot Banner */}
      <Card className="p-6 sm:p-8 bg-gradient-to-br from-indigo-50 via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 border-2 border-indigo-100 dark:border-indigo-900/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <ChizzyMascot mood="supercharged" size={80} animated />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <Badge variant="volt" className="text-xs font-black">
                  Level {profileState?.level || 1} Scholar
                </Badge>
                {settings.streaksEnabled && (
                  <Badge variant="amber" className="text-xs font-black flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-orange-500" />
                    {profileState?.streakDays || 0} Day Streak
                  </Badge>
                )}
                {profileState?.freezesRemaining > 0 && (
                  <Badge variant="blue" className="text-xs font-bold flex items-center gap-1">
                    <Snowflake className="w-3.5 h-3.5" />
                    {profileState.freezesRemaining} Freeze Banked
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Chizmo Arena & Trophies
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Turn your active recall into verified mastery. Every question studied powers your learning journey.
              </p>
            </div>
          </div>

          {/* Level Progress Circle / Bar */}
          <div className="w-full sm:w-48 space-y-1.5 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
            <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
              <span>Level {profileState?.level || 1}</span>
              <span>Level {(profileState?.level || 1) + 1}</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-volt-400 transition-all duration-700"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              {profileState?.xp || 0} Total Lifetime XP
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('league')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'league'
              ? 'bg-chizmo-600 text-white shadow-md shadow-chizmo-600/30'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4" /> Weekly League
        </button>

        <button
          onClick={() => setActiveTab('quests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'quests'
              ? 'bg-chizmo-600 text-white shadow-md shadow-chizmo-600/30'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Target className="w-4 h-4" /> Daily Quests
          <span className="w-4 h-4 rounded-full bg-volt-400 text-slate-950 flex items-center justify-center text-[10px] font-black">
            3
          </span>
        </button>

        <button
          onClick={() => setActiveTab('trophies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'trophies'
              ? 'bg-chizmo-600 text-white shadow-md shadow-chizmo-600/30'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" /> Trophy Room
        </button>
      </div>

      {/* TAB 1: WEEKLY LEAGUE */}
      {activeTab === 'league' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top 3 Podium */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-8 pb-2">
            {/* Rank 2 (Silver) */}
            {leaderboard[1] && (
              <Card className="p-4 text-center space-y-2 border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 order-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-lg sm:text-xl font-black">
                  🥈
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                    {leaderboard[1].displayName}
                  </h3>
                  <span className="text-xs font-extrabold text-chizmo-600 dark:text-chizmo-400">
                    {leaderboard[1].xp} XP
                  </span>
                </div>
                <div className="h-16 sm:h-20 bg-slate-200 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 font-black text-lg">
                  #2
                </div>
              </Card>
            )}

            {/* Rank 1 (Gold - Taller Podium) */}
            {leaderboard[0] && (
              <Card className="p-4 text-center space-y-2 border-2 border-amber-300 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/30 order-2 -mt-4 shadow-lg shadow-amber-500/10">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-2xl font-black">
                  👑
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                    {leaderboard[0].displayName}
                  </h3>
                  <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                    {leaderboard[0].xp} XP
                  </span>
                </div>
                <div className="h-24 sm:h-28 bg-gradient-to-t from-amber-200 to-amber-100 dark:from-amber-900/40 dark:to-amber-800/20 rounded-xl flex items-center justify-center text-amber-700 dark:text-amber-300 font-black text-2xl">
                  #1
                </div>
              </Card>
            )}

            {/* Rank 3 (Bronze) */}
            {leaderboard[2] && (
              <Card className="p-4 text-center space-y-2 border-2 border-amber-800/40 dark:border-amber-900 bg-orange-50/30 dark:bg-orange-950/20 order-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-full bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-lg sm:text-xl font-black">
                  🥉
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                    {leaderboard[2].displayName}
                  </h3>
                  <span className="text-xs font-extrabold text-chizmo-600 dark:text-chizmo-400">
                    {leaderboard[2].xp} XP
                  </span>
                </div>
                <div className="h-12 sm:h-14 bg-orange-200/60 dark:bg-orange-950/40 rounded-xl flex items-center justify-center text-amber-800 dark:text-amber-300 font-black text-lg">
                  #3
                </div>
              </Card>
            )}
          </div>

          {/* Full Standings List */}
          <Card className="p-4 sm:p-6 divide-y divide-slate-100 dark:divide-slate-800">
            <div className="flex items-center justify-between pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Rank & Scholar</span>
              <span>Weekly XP</span>
            </div>

            {leaderboard.map((item) => (
              <div
                key={item.userId}
                className={`py-3 flex items-center justify-between transition-colors ${
                  item.isCurrentUser
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/50 -mx-4 px-4 rounded-xl'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      item.rank === 1
                        ? 'bg-amber-400 text-slate-950'
                        : item.rank === 2
                        ? 'bg-slate-300 text-slate-900'
                        : item.rank === 3
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-500'
                    }`}
                  >
                    {item.rank}
                  </span>

                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {item.displayName}
                      {item.isCurrentUser && (
                        <Badge variant="indigo" className="text-[9px]">You</Badge>
                      )}
                    </p>
                  </div>
                </div>

                <span className="text-xs sm:text-sm font-black text-chizmo-600 dark:text-chizmo-400">
                  {item.xp} XP
                </span>
              </div>
            ))}
          </Card>

          <p className="text-[11px] text-slate-400 text-center">
            🛡️ Ethical Safeguard: Only voluntary display names are shown. Real names of minors are strictly protected. Reset every Monday at 00:00 UTC.
          </p>
        </div>
      )}

      {/* TAB 2: DAILY QUESTS */}
      {activeTab === 'quests' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Today's Knowledge Quests
            </h2>
            <span className="text-xs text-slate-500">Resets daily at 4:00 AM</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {quests.map((q) => {
              const pct = Math.min(100, Math.round((q.current / q.target) * 100));
              return (
                <Card
                  key={q.id}
                  className={`p-4 sm:p-5 border transition-all ${
                    q.isCompleted
                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-2xl shrink-0">
                        {q.icon}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                            {q.title}
                          </h3>
                          {q.isCompleted && (
                            <Badge variant="emerald" className="text-[10px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {q.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-amber-500">
                        +{q.xpReward} XP
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                      <span>Progress</span>
                      <span>
                        {q.current} / {q.target}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          q.isCompleted
                            ? 'bg-emerald-500'
                            : 'bg-gradient-to-r from-chizmo-600 to-volt-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: TROPHY ROOM */}
      {activeTab === 'trophies' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Trophy Cabinet
            </h2>
            <span className="text-xs text-slate-500">
              {achievements.filter((a) => a.isUnlocked).length} / {achievements.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {achievements.map((ach) => (
              <Card
                key={ach.id}
                className={`p-4 flex items-start gap-3.5 border transition-all ${
                  ach.isUnlocked
                    ? 'border-amber-200 dark:border-amber-800/80 bg-gradient-to-br from-white to-amber-50/20 dark:from-slate-900 dark:to-amber-950/10 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50/40 dark:bg-slate-900/40'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                    ach.isUnlocked
                      ? 'bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {ach.isUnlocked ? ach.icon : <Lock className="w-5 h-5 text-slate-400" />}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                      {ach.name}
                    </h3>
                    <span className="text-[10px] font-extrabold text-amber-500">
                      +{ach.xpReward} XP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {ach.description}
                  </p>
                  {ach.isUnlocked && (
                    <Badge variant="volt" className="text-[9px] mt-1">Unlocked</Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Mindful Guardrails Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <Card className="max-w-md w-full p-6 space-y-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Mindful Study Guardrails
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chizmo is built for healthy learning. We never use guilt-based loss aversion or compulsive dark patterns. You have full control over your motivation system.
            </p>

            <div className="space-y-4">
              {/* Toggle Streaks */}
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Daily Streaks & Flame
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Track consecutive study days with automatic freeze safety.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.streaksEnabled}
                  onChange={(e) => setSettings({ ...settings, streaksEnabled: e.target.checked })}
                  className="w-4 h-4 text-chizmo-600 rounded"
                />
              </label>

              {/* Toggle Leaderboard */}
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Weekly League Leaderboard
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Participate with your display name in weekly study ranks.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.leaderboardEnabled}
                  onChange={(e) => setSettings({ ...settings, leaderboardEnabled: e.target.checked })}
                  className="w-4 h-4 text-chizmo-600 rounded"
                />
              </label>

              {/* 24-Hour Streak Repair */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  24-Hour Grace Period (Streak Repair)
                </p>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300">
                  Did life get in the way yesterday? Repair your streak without punishment.
                </p>
                <Button
                  size="sm"
                  variant="volt"
                  onClick={handleRepairStreak}
                  className="text-xs font-bold w-full"
                >
                  Repair Lost Streak ⚡
                </Button>
                {repairMsg && (
                  <p className="text-[11px] text-emerald-600 font-semibold">{repairMsg}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveSettings} className="font-bold">
                Save Preferences
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
